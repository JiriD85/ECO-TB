# Derived Telemetry Logic - RESI Device Rule Chain

**Source:** `rule chains/resi_device.json` - Node: "Normalize Data"
**Type:** TbTransformMsgNode (TBEL)
**Purpose:** Transform CHC_* keys to canonical names, calculate derived telemetry, check data quality

---

## Overview

The "Normalize Data" node processes incoming telemetry from RESI devices and:
1. Maps vendor-specific keys (CHC_*) to canonical names
2. Calculates derived values (is_on, load_class, dT_flag, etc.)
3. Performs outlier detection and sets data_quality flag
4. Detects schedule violations using weekly schedule configuration

---

## Input Sources

### Telemetry Keys (from msg)

| Original Key | Canonical Key | Unit | Description |
|-------------|---------------|------|-------------|
| CHC_S_TemperatureFlow | T_flow_C | C | Flow temperature |
| CHC_S_TemperatureReturn | T_return_C | C | Return temperature |
| CHC_S_TemperatureDiff | dT_K | K | Temperature difference |
| CHC_S_VolumeFlow | Vdot_m3h | m3/h | Volume flow (input: l/h, converted) |
| CHC_S_Velocity | v_ms | m/s | Flow velocity |
| CHC_S_Power_Cooling | P_th_kW | kW | Thermal power (cooling mode) |
| CHC_S_Power_Heating | P_th_kW | kW | Thermal power (heating mode) |
| CHC_M_Energy_Cooling | E_th_kWh | kWh | Energy meter (cooling mode) |
| CHC_M_Energy_Heating | E_th_kWh | kWh | Energy meter (heating mode) |
| CHC_M_Volume | V_m3 | m3 | Volume meter |
| temperature | auxT1_C / auxT2_C | C | Auxiliary temperature (TS1/TS2 devices) |

### Attributes (from metadata, fetched by "Get Measurement Attributes" node)

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| ss_installationType | string | "heating" | Installation type: "heating" or "cooling" |
| ss_flowOnThreshold | number | 0.05 | Flow threshold in m3/h for is_on detection |
| ss_designPower | number | null | Design power in kW (for load_class) |
| ss_designDeltaT | number | null | Design delta-T in K (for dT_flag) |
| ss_calculatePower | boolean | false | Enable calculated power (P_th_calc_kW) |
| ss_fluidType | string | "water" | Fluid type for cp/rho calculation |
| ss_weeklySchedule | JSON | null | Weekly operating schedule for violation detection |

---

## Derived Telemetry Keys

### is_on

**Input Keys:**
- Telemetry: `Vdot_m3h` (volume flow)
- Attribute: `ss_flowOnThreshold` (default: 0.05 m3/h)

**Logic:**
```tbel
// --- is_on: System running if flow > threshold ---
if (newValues["Vdot_m3h"] != null) {
    newValues["is_on"] = newValues["Vdot_m3h"] > flowOnThreshold;
}
```

**Output:**
- Type: boolean
- Possible Values: `true` (system running), `false` (system off)

---

### load_class

**Input Keys:**
- Telemetry: `P_th_kW` (thermal power)
- Attribute: `ss_designPower` (design power in kW)

**Logic:**
```tbel
// --- load_class: low/mid/high based on power vs design ---
var loadClass = null;
if (newValues["P_th_kW"] != null && designPower != null && designPower > 0) {
    var loadPct = (newValues["P_th_kW"] / designPower) * 100;
    if (loadPct < 30) {
        loadClass = "low";
    } else if (loadPct < 60) {
        loadClass = "mid";
    } else {
        loadClass = "high";
    }
    newValues["load_class"] = loadClass;
}
```

**Output:**
- Type: string
- Possible Values: `"low"` (<30%), `"mid"` (30-60%), `"high"` (>=60%)
- Condition: Only calculated if designPower attribute is set

**Thresholds:**
| Load Class | Percentage Range |
|------------|------------------|
| low | 0% - 29.99% |
| mid | 30% - 59.99% |
| high | 60% - 100%+ |

---

### dT_flag

**Input Keys:**
- Telemetry: `dT_K` (temperature difference)
- Attribute: `ss_designDeltaT` (design delta-T in K)
- Derived: `load_class` (only evaluate at mid/high load)

**Logic:**
```tbel
// --- dT_flag: ok/warn/severe based on actual vs design delta-T ---
// Only evaluate at mid/high load (skip low load)
if (newValues["dT_K"] != null && designDeltaT != null && designDeltaT > 0) {
    // Only calculate if load_class is mid or high (or if we don't have load_class)
    var shouldEvaluate = (loadClass == null) || (loadClass == "mid") || (loadClass == "high");

    if (shouldEvaluate) {
        var dTRatio = newValues["dT_K"] / designDeltaT;
        if (dTRatio >= 0.8) {
            newValues["dT_flag"] = "ok";
        } else if (dTRatio >= 0.6) {
            newValues["dT_flag"] = "warn";
        } else {
            newValues["dT_flag"] = "severe";
        }
    }
}
```

**Output:**
- Type: string
- Possible Values: `"ok"` (>=80%), `"warn"` (60-80%), `"severe"` (<60%)
- Condition: Only calculated if designDeltaT attribute is set AND load is mid/high

**Thresholds:**
| dT_flag | dT Ratio (actual/design) |
|---------|--------------------------|
| ok | >= 0.8 (80%) |
| warn | 0.6 - 0.8 (60-80%) |
| severe | < 0.6 (60%) |

---

### data_quality

**Input Keys:**
- All normalized telemetry values (for outlier detection)

**Logic:**
```tbel
var dataQuality = "ok";

// ============================================================
// Absolute limits for outlier detection
// ============================================================
var MAX_POWER_KW = 10000;
var MAX_ENERGY_KWH = 100000;
var MIN_TEMP_C = -50;
var MAX_TEMP_C = 200;
var MAX_FLOW_M3H = 1000;

// ============================================================
// Outlier Detection (only check if value exists)
// ============================================================

// Check Power
if (newValues["P_th_kW"] != null) {
    if (newValues["P_th_kW"] < 0 || newValues["P_th_kW"] > MAX_POWER_KW) {
        dataQuality = "error";
    }
}

// Check Calculated Power
if (newValues["P_th_calc_kW"] != null) {
    if (newValues["P_th_calc_kW"] < 0 || newValues["P_th_calc_kW"] > MAX_POWER_KW) {
        dataQuality = "error";
    }
}

// Check Energy (meter value should be positive)
if (newValues["E_th_kWh"] != null) {
    if (newValues["E_th_kWh"] < 0 || newValues["E_th_kWh"] > MAX_ENERGY_KWH) {
        dataQuality = "error";
    }
}

// Check Temperatures
if (newValues["T_flow_C"] != null) {
    if (newValues["T_flow_C"] < MIN_TEMP_C || newValues["T_flow_C"] > MAX_TEMP_C) {
        dataQuality = "error";
    }
}
if (newValues["T_return_C"] != null) {
    if (newValues["T_return_C"] < MIN_TEMP_C || newValues["T_return_C"] > MAX_TEMP_C) {
        dataQuality = "error";
    }
}
if (newValues["auxT1_C"] != null) {
    if (newValues["auxT1_C"] < MIN_TEMP_C || newValues["auxT1_C"] > MAX_TEMP_C) {
        dataQuality = "error";
    }
}
if (newValues["auxT2_C"] != null) {
    if (newValues["auxT2_C"] < MIN_TEMP_C || newValues["auxT2_C"] > MAX_TEMP_C) {
        dataQuality = "error";
    }
}

// Check Flow
if (newValues["Vdot_m3h"] != null) {
    if (newValues["Vdot_m3h"] < 0 || newValues["Vdot_m3h"] > MAX_FLOW_M3H) {
        dataQuality = "error";
    }
}

// ============================================================
// Set data_quality flag
// ============================================================
newValues["data_quality"] = dataQuality;
```

**Output:**
- Type: string
- Possible Values: `"ok"`, `"error"`

**Outlier Limits:**
| Metric | Min | Max |
|--------|-----|-----|
| P_th_kW | 0 | 10,000 kW |
| P_th_calc_kW | 0 | 10,000 kW |
| E_th_kWh | 0 | 100,000 kWh |
| T_flow_C, T_return_C, auxT1_C, auxT2_C | -50 C | 200 C |
| Vdot_m3h | 0 | 1,000 m3/h |

---

### P_th_calc_kW

**Input Keys:**
- Telemetry: `Vdot_m3h` (volume flow), `dT_K` (temperature difference), `T_flow_C` (reference temp)
- Attribute: `ss_calculatePower` (enable flag), `ss_fluidType` (fluid type)

**Logic:**
```tbel
// ============================================================
// Calculated Power: P = rho * cp * Vdot * dT
// ============================================================
if (calculatePower && newValues["Vdot_m3h"] != null && newValues["dT_K"] != null) {

    // Get reference temperature for density calculation (use T_flow, default 40C)
    var refTemp = 40.0;
    if (newValues["T_flow_C"] != null) {
        refTemp = newValues["T_flow_C"];
    }

    // Calculate fluid properties based on fluidType
    // cp [kJ/(kg*K)], rho [kg/m3]
    var cp = 4.186;
    var rho = 1000.0;

    if (fluidType == "water") {
        // Water: cp nearly constant, rho temperature-dependent
        // rho(T) = 1000 - 0.4 * (T - 20) for T in C
        cp = 4.186;
        rho = 1000.0 - 0.4 * (refTemp - 20.0);
        // Clamp rho to reasonable range
        if (rho < 950) { rho = 950; }
        if (rho > 1000) { rho = 1000; }
    } else if (fluidType == "glycol20") {
        // 20% Ethylene Glycol - fixed values at ~20C
        cp = 3.87;
        rho = 1025.0;
    } else if (fluidType == "glycol30") {
        // 30% Ethylene Glycol - fixed values at ~20C
        cp = 3.65;
        rho = 1040.0;
    } else if (fluidType == "glycol40") {
        // 40% Ethylene Glycol - fixed values at ~20C
        cp = 3.45;
        rho = 1055.0;
    } else if (fluidType == "propyleneGlycol20") {
        // 20% Propylene Glycol - fixed values at ~20C
        cp = 3.95;
        rho = 1020.0;
    } else if (fluidType == "propyleneGlycol30") {
        // 30% Propylene Glycol - fixed values at ~20C
        cp = 3.75;
        rho = 1030.0;
    }

    // P [kW] = rho [kg/m3] * cp [kJ/(kg*K)] * Vdot [m3/h] * dT [K] / 3600 [s/h]
    // Simplified: P = (rho * cp / 3600) * Vdot * dT
    var factor = (rho * cp) / 3600.0;
    var P_calc = factor * newValues["Vdot_m3h"] * newValues["dT_K"];
    newValues["P_th_calc_kW"] = Math.round(P_calc * 1000) / 1000;
}
```

**Output:**
- Type: number (kW, 3 decimal places)
- Condition: Only calculated if `ss_calculatePower == "true"`

**Formula:**
```
P [kW] = (rho * cp / 3600) * Vdot [m3/h] * dT [K]
```

---

### P_deviation_pct

**Input Keys:**
- Telemetry: `P_th_kW` (measured power)
- Derived: `P_th_calc_kW` (calculated power)

**Logic:**
```tbel
// ============================================================
// Power Deviation Detection (compare measured vs calculated)
// ============================================================
if (newValues["P_th_kW"] != null && newValues["P_th_calc_kW"] > 0) {
    // Calculate deviation percentage
    var deviation = ((newValues["P_th_kW"] - newValues["P_th_calc_kW"]) / newValues["P_th_calc_kW"]) * 100;
    newValues["P_deviation_pct"] = Math.round(deviation * 10) / 10;
}
```

**Output:**
- Type: number (%, 1 decimal place)
- Positive value: measured > calculated
- Negative value: measured < calculated

**Formula:**
```
P_deviation_pct = ((P_th_kW - P_th_calc_kW) / P_th_calc_kW) * 100
```

---

### P_sensor_flag

**Input Keys:**
- Derived: `P_deviation_pct` (power deviation percentage)

**Logic:**
```tbel
// Set P_sensor_flag based on absolute deviation
var absDeviation = Math.abs(deviation);
if (absDeviation < 10) {
    newValues["P_sensor_flag"] = "ok";
} else if (absDeviation < 25) {
    newValues["P_sensor_flag"] = "warn";
} else {
    newValues["P_sensor_flag"] = "error";
}
```

**Output:**
- Type: string
- Possible Values: `"ok"`, `"warn"`, `"error"`

**Thresholds:**
| P_sensor_flag | Absolute Deviation |
|---------------|-------------------|
| ok | < 10% |
| warn | 10% - 25% |
| error | >= 25% |

---

### schedule_violation

**Input Keys:**
- Derived: `is_on` (system running state)
- Attribute: `ss_weeklySchedule` (JSON schedule configuration)
- Telemetry: `ts` (timestamp)

**Logic:**
```tbel
// --- schedule_violation: running outside defined operating hours ---
// ROBUST: Only process if weeklySchedule exists and looks like valid JSON
var scheduleJson = metadata["ss_weeklySchedule"];
if (scheduleJson != null && scheduleJson != "" && scheduleJson != "null" && scheduleJson.startsWith("{")) {

    var schedule = JSON.parse(scheduleJson);

    if (schedule != null) {
        // Timezone offset in minutes (default: 60 = CET)
        // ROBUST: Handle missing or invalid timezoneOffset
        var tzOffset = 60;
        var tzVal = schedule["timezoneOffset"];
        if (tzVal != null && tzVal != "") {
            tzOffset = toInt(tzVal);
        }

        // Get timestamp
        var ts = msg["ts"];
        if (ts == null && metadata["ts"] != null) {
            ts = parseLong(metadata["ts"]);
        }

        if (ts != null && newValues["is_on"] != null) {

            // ... DST Detection Logic (see below) ...

            // Apply DST correction
            var effectiveOffset = tzOffset;
            if (isDST) { effectiveOffset = tzOffset + 60; }

            // Convert to local time
            var localTs = ts + effectiveOffset * 60000;

            // Day of week (0=Sun, 1=Mon, ... 6=Sat)
            var dayIndex = (toInt(localTs / msPerDay) + 4) % 7;

            // Get day name
            var dayName = "sunday";
            if (dayIndex == 1) { dayName = "monday"; }
            else if (dayIndex == 2) { dayName = "tuesday"; }
            // ... etc.

            // Current local time as minutes since midnight
            var msInDay = localTs % msPerDay;
            var currentMinutes = toInt(msInDay / 60000);

            // Check schedule for today
            // Supports TWO formats:
            // 1. Simple: {"monday": true, "tuesday": false, ...}
            // 2. Full:   {"monday": {"enabled": true, "start": "06:00", "end": "22:00"}, ...}
            var isWithinSchedule = false;
            var todayValue = schedule[dayName];

            if (todayValue != null) {
                var todayStr = "" + todayValue;

                if (todayStr == "true") {
                    // Simple format: boolean true - always within schedule
                    isWithinSchedule = true;
                } else if (todayStr == "false") {
                    // Simple format: boolean false - never within schedule
                    isWithinSchedule = false;
                } else {
                    // Full format: todayValue is an object with enabled/start/end
                    var enabled = todayValue["enabled"];
                    var enabledStr = "" + enabled;
                    var isEnabled = (enabledStr == "true");

                    if (isEnabled) {
                        var startStr = todayValue["start"];
                        var endStr = todayValue["end"];

                        if (startStr != null && endStr != null) {
                            // Parse "HH:MM" to minutes
                            var startH = toInt(parseLong(startStr.substring(0, 2)));
                            var startM = toInt(parseLong(startStr.substring(3, 5)));
                            var startMinutes = startH * 60 + startM;

                            var endH = toInt(parseLong(endStr.substring(0, 2)));
                            var endM = toInt(parseLong(endStr.substring(3, 5)));
                            var endMinutes = endH * 60 + endM;

                            if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
                                isWithinSchedule = true;
                            }
                        } else {
                            // No start/end defined but enabled - assume within schedule
                            isWithinSchedule = true;
                        }
                    }
                }
            }

            // Violation = system running outside scheduled operating hours
            if (newValues["is_on"] == true && !isWithinSchedule) {
                newValues["schedule_violation"] = true;
            } else {
                newValues["schedule_violation"] = false;
            }
        }
    }
}
```

**Output:**
- Type: boolean
- Possible Values: `true` (violation - running outside schedule), `false` (within schedule or off)
- Condition: Only calculated if `ss_weeklySchedule` attribute is set

**Schedule Format (Simple):**
```json
{
  "timezoneOffset": 60,
  "monday": true,
  "tuesday": true,
  "wednesday": true,
  "thursday": true,
  "friday": true,
  "saturday": false,
  "sunday": false
}
```

**Schedule Format (Full with time windows):**
```json
{
  "timezoneOffset": 60,
  "monday": {"enabled": true, "start": "06:00", "end": "22:00"},
  "tuesday": {"enabled": true, "start": "06:00", "end": "22:00"},
  "wednesday": {"enabled": true, "start": "06:00", "end": "22:00"},
  "thursday": {"enabled": true, "start": "06:00", "end": "22:00"},
  "friday": {"enabled": true, "start": "06:00", "end": "18:00"},
  "saturday": {"enabled": false},
  "sunday": {"enabled": false}
}
```

---

## Fluid Properties Calculation

### Supported Fluid Types

| fluidType | cp [kJ/(kg*K)] | rho [kg/m3] | Description |
|-----------|----------------|-------------|-------------|
| water | 4.186 | 950-1000 (temp-dependent) | Pure water |
| glycol20 | 3.87 | 1025 | 20% Ethylene Glycol |
| glycol30 | 3.65 | 1040 | 30% Ethylene Glycol |
| glycol40 | 3.45 | 1055 | 40% Ethylene Glycol |
| propyleneGlycol20 | 3.95 | 1020 | 20% Propylene Glycol |
| propyleneGlycol30 | 3.75 | 1030 | 30% Propylene Glycol |

### Water Density Formula

```tbel
// Water: rho temperature-dependent
// rho(T) = 1000 - 0.4 * (T - 20) for T in C
rho = 1000.0 - 0.4 * (refTemp - 20.0);
// Clamp rho to reasonable range
if (rho < 950) { rho = 950; }
if (rho > 1000) { rho = 1000; }
```

---

## DST/Timezone Logic

### European DST Detection (CET/CEST)

The script implements a simplified European DST detection algorithm using integer arithmetic:

```tbel
// ============================================================
// European DST Detection (CET/CEST) - Simplified
// Using integer arithmetic to avoid Double/Integer cast issues
// ============================================================
var isDST = false;
var msPerDay = 86400000;
var msPerHour = 3600000;
var days = toInt(ts / msPerDay);

// Extract date components using civil calendar algorithm
var z = days + 719468;
var era = toInt(z / 146097);
if (z < 0) { era = toInt((z - 146096) / 146097); }
var doe = z - era * 146097;
var yoe = toInt((doe - toInt(doe / 1460) + toInt(doe / 36524) - toInt(doe / 146096)) / 365);
var year = yoe + era * 400;
var doy = doe - (365 * yoe + toInt(yoe / 4) - toInt(yoe / 100));
var mp = toInt((5 * doy + 2) / 153);
var day = doy - toInt((153 * mp + 2) / 5) + 1;
var month = mp + 3;
if (mp >= 10) { month = mp - 9; }
if (month <= 2) { year = year + 1; }

// Determine DST status
if (month > 3 && month < 10) {
    isDST = true;  // April - September: always DST
} else if (month == 3 || month == 10) {
    // March/October: check if before/after last Sunday
    // ... calculate last Sunday of month ...
    // DST starts: last Sunday of March at 02:00 UTC
    // DST ends: last Sunday of October at 03:00 UTC
}
```

### Timezone Offset Application

```tbel
// Apply DST correction
var effectiveOffset = tzOffset;  // Base offset (default: 60 minutes = CET)
if (isDST) { effectiveOffset = tzOffset + 60; }  // Add 60 minutes for CEST

// Convert to local time
var localTs = ts + effectiveOffset * 60000;
```

---

## Constants Summary

### Outlier Detection Limits

| Constant | Value | Unit |
|----------|-------|------|
| MAX_POWER_KW | 10,000 | kW |
| MAX_ENERGY_KWH | 100,000 | kWh |
| MIN_TEMP_C | -50 | C |
| MAX_TEMP_C | 200 | C |
| MAX_FLOW_M3H | 1,000 | m3/h |

### Time Constants

| Constant | Value | Description |
|----------|-------|-------------|
| msPerDay | 86,400,000 | Milliseconds per day |
| msPerHour | 3,600,000 | Milliseconds per hour |

### Default Values

| Parameter | Default | Description |
|-----------|---------|-------------|
| flowOnThreshold | 0.05 m3/h | Threshold for is_on detection |
| installationType | "heating" | Mode for power/energy selection |
| fluidType | "water" | Fluid type for cp/rho |
| timezoneOffset | 60 | Minutes (CET) |
| refTemp | 40 C | Reference temperature for water density |

---

## Key Transformation Summary

### Input to Output Mapping

| Output Key | Type | Calculation | Dependencies |
|------------|------|-------------|--------------|
| T_flow_C | number | Direct | CHC_S_TemperatureFlow |
| T_return_C | number | Direct | CHC_S_TemperatureReturn |
| dT_K | number | abs(T_flow - T_return) | T_flow_C, T_return_C |
| Vdot_m3h | number | CHC_S_VolumeFlow / 1000 | CHC_S_VolumeFlow |
| v_ms | number | Direct | CHC_S_Velocity |
| P_th_kW | number | Direct (mode-selected) | CHC_S_Power_* |
| E_th_kWh | number | Direct (mode-selected) | CHC_M_Energy_* |
| V_m3 | number | Direct | CHC_M_Volume |
| auxT1_C | number | Direct (TS1 device) | temperature |
| auxT2_C | number | Direct (TS2 device) | temperature |
| is_on | boolean | Vdot > threshold | Vdot_m3h, flowOnThreshold |
| load_class | string | Power % of design | P_th_kW, designPower |
| dT_flag | string | dT % of design | dT_K, designDeltaT, load_class |
| data_quality | string | Outlier check | All values |
| P_th_calc_kW | number | rho*cp*Vdot*dT/3600 | Vdot_m3h, dT_K, fluidType |
| P_deviation_pct | number | (P_measured - P_calc) / P_calc * 100 | P_th_kW, P_th_calc_kW |
| P_sensor_flag | string | Deviation threshold | P_deviation_pct |
| schedule_violation | boolean | is_on && !inSchedule | is_on, weeklySchedule, ts |

---

## Migration Notes for Calculated Fields

When migrating to ThingsBoard Calculated Fields, consider:

1. **Simple Derived Values** (is_on, load_class, dT_flag):
   - Can be implemented as direct Calculated Field formulas
   - No external dependencies needed

2. **Power Calculation** (P_th_calc_kW):
   - Requires fluid properties lookup
   - Consider using a lookup table or constants in the formula

3. **Schedule Violation**:
   - Complex logic with DST handling
   - May need custom function or simplified approach
   - Consider using ThingsBoard's built-in scheduling features

4. **Data Quality**:
   - Range checking can be done with CASE statements
   - Consider separate validation fields vs. single flag

5. **Attribute Access**:
   - Calculated Fields can reference attributes directly
   - No need for separate "Get Attributes" node
