# Task: Migrate Derived Telemetry to Calculated Fields

**Status:** draft
**Priority:** HIGH
**Complexity:** LARGE

## Ziel

Alle derived Telemetrie von Rule Chain "Normalize Data" nach Calculated Fields migrieren, um:
1. Einheitliches Reprocessing via API zu ermoeglichen
2. Timestamps automatisch zu synchronisieren
3. Wartung zu vereinfachen (eine Stelle statt zwei)

## Kontext

### Aktuelle Architektur

```
Raw Telemetrie (Device)
        |
        v
Rule Chain "resi_device" - Node "Normalize Data"
        |
        +-- is_on, load_class, dT_flag, data_quality (instant)
        +-- P_th_calc_kW, P_deviation_pct, P_sensor_flag (instant)
        +-- schedule_violation (instant + DST logic)
        |
        v
Calculated Fields (Asset Profile "Measurement")
        |
        +-- dT_collapse_flag (15 Min Rolling)
        +-- flow_spike_flag (5 Min Rolling)
        +-- power_stability, power_unstable_flag (15 Min Rolling)
        +-- cycling_flag, cycle_count (30 Min Rolling)
        +-- runtime_pct (1 Std Rolling)
        +-- oscillation_count, oscillation_flag (15 Min Rolling)
```

### Ziel-Architektur

```
Raw Telemetrie (Device)
        |
        v
Rule Chain "resi_device" - Node "Normalize Data"
        |
        +-- Nur Key-Mapping (CHC_* -> canonical)
        +-- Keine Berechnungen mehr
        |
        v
Calculated Fields (Asset Profile "Measurement")
        |
        +-- derived_basic: is_on, load_class, dT_flag, data_quality
        +-- derived_power: P_th_calc_kW, P_deviation_pct, P_sensor_flag
        +-- derived_schedule: schedule_violation
        +-- (bestehend) dT_collapse_flag, flow_spike_flag, etc.
        |
        v
Reprocess API (bei Bedarf)
```

## Referenz-Dokumentation

- **TBEL Logik:** `analysis/DERIVED_TELEMETRY_LOGIC.md`
- **Data Catalog:** `analysis/ECO_Data_Catalog.md`
- **Bestehende CFs:** 6 CFs im Asset Profile "Measurement" (siehe unten)

## Bestehende Calculated Fields

| CF Name | Output Keys | Rolling Window | Status |
|---------|-------------|----------------|--------|
| oscillation_detection | oscillation_count, oscillation_flag | 15 Min | OK |
| dT_collapse_flag | dT_collapse_flag | 15 Min | OK |
| flow_spike_flag | flow_spike_flag | 5 Min | OK |
| power_stability | power_stability, power_unstable_flag | 15 Min | OK |
| runtime_pct | runtime_pct | 1 Std | OK |
| cycling_flag | cycling_flag, cycle_count | 30 Min | OK |

**Abhaengigkeit:** 4 CFs benoetigen `is_on` als Input!

## Neue Calculated Fields

### Phase 1: derived_basic (KRITISCH - Basis fuer andere CFs)

**Output Keys:** `is_on`, `load_class`, `dT_flag`, `data_quality`

**Input Arguments:**

| Argument | Typ | Key | Default |
|----------|-----|-----|---------|
| Vdot_m3h | LATEST_TS | Vdot_m3h | - |
| P_th_kW | LATEST_TS | P_th_kW | - |
| dT_K | LATEST_TS | dT_K | - |
| T_flow_C | LATEST_TS | T_flow_C | - |
| T_return_C | LATEST_TS | T_return_C | - |
| flowOnThreshold | ATTRIBUTE | flowOnThreshold | 0.05 |
| designPower | ATTRIBUTE | designPower | null |
| designDeltaT | ATTRIBUTE | designDeltaT | null |

**TBEL Logic:**
```javascript
// Guards
if (Vdot_m3h == null) {
  return {};
}

var result = {};

// --- is_on ---
var isOn = Vdot_m3h > flowOnThreshold;
result["is_on"] = isOn;

// --- load_class ---
if (P_th_kW != null && designPower != null && designPower > 0) {
  var loadPct = (P_th_kW / designPower) * 100;
  if (loadPct < 30) {
    result["load_class"] = "low";
  } else if (loadPct < 60) {
    result["load_class"] = "mid";
  } else {
    result["load_class"] = "high";
  }
}

// --- dT_flag ---
if (dT_K != null && designDeltaT != null && designDeltaT > 0 && result["load_class"] != null) {
  var dTRatio = dT_K / designDeltaT;
  if (result["load_class"] == "low") {
    // Bei Teillast: erhoehte Toleranz
    if (dTRatio >= 0.3) {
      result["dT_flag"] = "ok";
    } else if (dTRatio >= 0.15) {
      result["dT_flag"] = "warn";
    } else {
      result["dT_flag"] = "severe";
    }
  } else {
    // Bei mid/high Last
    if (dTRatio >= 0.5) {
      result["dT_flag"] = "ok";
    } else if (dTRatio >= 0.3) {
      result["dT_flag"] = "warn";
    } else {
      result["dT_flag"] = "severe";
    }
  }
}

// --- data_quality (Outlier Detection) ---
var isOutlier = false;
if (T_flow_C != null && (T_flow_C < -50 || T_flow_C > 150)) isOutlier = true;
if (T_return_C != null && (T_return_C < -50 || T_return_C > 150)) isOutlier = true;
if (dT_K != null && (dT_K < -50 || dT_K > 100)) isOutlier = true;
if (Vdot_m3h != null && (Vdot_m3h < 0 || Vdot_m3h > 1000)) isOutlier = true;
if (P_th_kW != null && (P_th_kW < -10000 || P_th_kW > 10000)) isOutlier = true;

result["data_quality"] = isOutlier ? "error" : "ok";

return result;
```

**Konfiguration:**
- Output Type: TIME_SERIES
- Use Latest Timestamp: true

---

### Phase 2: derived_power

**Output Keys:** `P_th_calc_kW`, `P_deviation_pct`, `P_sensor_flag`

**Input Arguments:**

| Argument | Typ | Key | Default |
|----------|-----|-----|---------|
| Vdot_m3h | LATEST_TS | Vdot_m3h | - |
| dT_K | LATEST_TS | dT_K | - |
| P_th_kW | LATEST_TS | P_th_kW | - |
| calculatePower | ATTRIBUTE | calculatePower | false |
| fluidType | ATTRIBUTE | fluidType | "water" |

**TBEL Logic:**
```javascript
if (calculatePower != true || Vdot_m3h == null || dT_K == null) {
  return {};
}

var result = {};

// Fluid properties (simplified - water only for now)
var cp = 4.18;   // kJ/(kg*K)
var rho = 998;   // kg/m3

// Fluid type specific values
if (fluidType == "glycol20") {
  cp = 3.95; rho = 1032;
} else if (fluidType == "glycol30") {
  cp = 3.74; rho = 1045;
} else if (fluidType == "glycol40") {
  cp = 3.55; rho = 1058;
}

// P = rho * cp * Vdot * dT / 3600
var P_calc = rho * cp * Vdot_m3h * dT_K / 3600;
result["P_th_calc_kW"] = Math.round(P_calc * 1000) / 1000;

// Deviation
if (P_th_kW != null && P_calc > 0.1) {
  var deviation = ((P_th_kW - P_calc) / P_calc) * 100;
  result["P_deviation_pct"] = Math.round(deviation * 10) / 10;

  // Sensor flag
  var absDeviation = deviation < 0 ? -deviation : deviation;
  if (absDeviation < 10) {
    result["P_sensor_flag"] = "ok";
  } else if (absDeviation < 25) {
    result["P_sensor_flag"] = "warn";
  } else {
    result["P_sensor_flag"] = "error";
  }
}

return result;
```

---

### Phase 2b: derived_schedule

**Output Keys:** `schedule_violation`

**Input Arguments:**

| Argument | Typ | Key | Default |
|----------|-----|-----|---------|
| is_on | LATEST_TS | is_on | - |
| weeklySchedule | ATTRIBUTE | weeklySchedule | null |

**TBEL Logic:**
```javascript
// Guard: Need is_on and schedule
if (is_on == null || weeklySchedule == null || weeklySchedule == "") {
  return {};
}

var schedule = JSON.parse(weeklySchedule);
if (schedule == null) {
  return {};
}

// Timezone offset in minutes (default: 60 = CET)
var tzOffset = 60;
if (schedule["timezoneOffset"] != null) {
  tzOffset = toInt(schedule["timezoneOffset"]);
}

// Get timestamp from context
var ts = ctx.latestTs;

// === European DST Detection (CET/CEST) ===
var msPerDay = 86400000;
var daysSince1970 = toInt(ts / msPerDay);
var year = 1970;
var days = daysSince1970;

// Approximate year calculation
while (days >= 365) {
  var daysInYear = 365;
  if (year % 4 == 0 && (year % 100 != 0 || year % 400 == 0)) {
    daysInYear = 366;
  }
  if (days >= daysInYear) {
    days = days - daysInYear;
    year = year + 1;
  } else {
    break;
  }
}

// Get month (simplified)
var daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
if (year % 4 == 0 && (year % 100 != 0 || year % 400 == 0)) {
  daysInMonths[1] = 29;
}
var month = 0;
while (month < 12 && days >= daysInMonths[month]) {
  days = days - daysInMonths[month];
  month = month + 1;
}
month = month + 1;  // 1-based
var dayOfMonth = days + 1;

// DST: April-September = always DST, March/October = check last Sunday
var isDST = false;
if (month >= 4 && month <= 9) {
  isDST = true;
} else if (month == 3 && dayOfMonth >= 25) {
  // Last week of March - simplified: assume DST after 25th
  isDST = true;
} else if (month == 10 && dayOfMonth < 25) {
  // Before last week of October
  isDST = true;
}

// Apply DST correction
var effectiveOffset = tzOffset;
if (isDST) { effectiveOffset = tzOffset + 60; }

// Convert to local time
var localTs = ts + effectiveOffset * 60000;

// Day of week (0=Sun, 1=Mon, ... 6=Sat)
var dayIndex = (toInt(localTs / msPerDay) + 4) % 7;

var dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
var dayName = dayNames[dayIndex];

// Current local time as minutes since midnight
var msInDay = localTs % msPerDay;
var currentMinutes = toInt(msInDay / 60000);

// Check schedule for today
var isWithinSchedule = false;
var todayValue = schedule[dayName];

if (todayValue != null) {
  var todayStr = "" + todayValue;

  if (todayStr == "true") {
    isWithinSchedule = true;
  } else if (todayStr == "false") {
    isWithinSchedule = false;
  } else {
    // Full format with start/end times
    var enabled = todayValue["enabled"];
    if (("" + enabled) == "true") {
      var startStr = todayValue["start"];
      var endStr = todayValue["end"];

      if (startStr != null && endStr != null) {
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
        isWithinSchedule = true;  // enabled but no times = always
      }
    }
  }
}

// Violation = running outside schedule
return {
  "schedule_violation": (is_on == true && !isWithinSchedule)
};
```

**Konfiguration:**
- Output Type: TIME_SERIES
- Use Latest Timestamp: true

**Abhaengigkeit:** Benoetigt `is_on` aus derived_basic CF!

**Hinweis:** Logik bleibt parallel in Rule Chain als Backup.

---

## Implementierungsschritte

### Phase 1: derived_basic CF

- [ ] 1.1 CF "derived_basic" im Asset Profile "Measurement" erstellen
- [ ] 1.2 TBEL Code aus diesem Dokument uebernehmen
- [ ] 1.3 Input Arguments konfigurieren (LATEST_TS + ATTRIBUTE)
- [ ] 1.4 "Use Latest Timestamp" aktivieren
- [ ] 1.5 Testen mit einer Messung
- [ ] 1.6 Verifizieren: is_on, load_class, dT_flag, data_quality werden berechnet
- [ ] 1.7 Verifizieren: Abhaengige CFs (runtime_pct, cycling_flag, etc.) funktionieren noch

### Phase 2: derived_power CF

- [ ] 2.1 CF "derived_power" erstellen
- [ ] 2.2 TBEL Code uebernehmen
- [ ] 2.3 Testen mit Messung die calculatePower=true hat
- [ ] 2.4 Verifizieren: P_th_calc_kW, P_deviation_pct, P_sensor_flag

### Phase 2b: derived_schedule CF

- [ ] 2b.1 CF "derived_schedule" erstellen (NACH Phase 1 - benoetigt is_on)
- [ ] 2b.2 TBEL Code mit DST-Logik uebernehmen
- [ ] 2b.3 Testen mit Messung die weeklySchedule Attribut hat
- [ ] 2b.4 Verifizieren: schedule_violation
- [ ] 2b.5 Rule Chain Logik als Backup belassen (nicht entfernen)

### Phase 3: Rule Chain aufraeumen

- [ ] 3.1 "Normalize Data" Node: Derived-Berechnungen entfernen
- [ ] 3.2 Nur Key-Mapping (CHC_* -> canonical) behalten
- [ ] 3.3 Testen: Keine Duplikate, keine fehlenden Werte

### Phase 4: Reprocess Button

- [ ] 4.1 Button im measurement_dashboard Header hinzufuegen
- [ ] 4.2 Dialog mit Optionen (welche CFs reprocessen)
- [ ] 4.3 API Calls an /api/calculatedField/{id}/reprocess
- [ ] 4.4 Progress/Status Anzeige
- [ ] 4.5 Testen mit bestehenden Messungen

### Phase 5: Migration bestehender Daten

- [ ] 5.1 Liste aller aktiven Messungen
- [ ] 5.2 Reprocess fuer jede Messung ausfuehren
- [ ] 5.3 Verifizieren: Derived Telemetrie vollstaendig

---

## Risiken & Mitigationen

| Risiko | Mitigation |
|--------|------------|
| Doppelte Berechnung (RC + CF) | Phase 3 erst nach erfolgreicher Phase 1+2 |
| Abhaengige CFs brechen | is_on zuerst testen, dann andere |
| Performance bei Reprocess | Batches, nicht alle auf einmal |
| Timestamps nicht synchron | "Use Latest Timestamp" Flag |

## Rollback Plan

1. CF deaktivieren (nicht loeschen)
2. Rule Chain "Normalize Data" hat noch die alte Logik
3. Derived Telemetrie wird wieder von RC berechnet

## Akzeptanzkriterien

- [ ] Alle derived Telemetrie Keys werden von CFs berechnet
- [ ] Timestamps sind synchron (gleicher ts fuer alle Keys eines Datenpunkts)
- [ ] Reprocess Button funktioniert und zeigt Fortschritt
- [ ] Bestehende Messungen haben vollstaendige derived Telemetrie
- [ ] Rule Chain "Normalize Data" enthaelt keine Berechnungslogik mehr
- [ ] Alarming funktioniert weiterhin (basiert auf CF Flags)

## Referenzen

- [ThingsBoard Calculated Fields Docs](https://thingsboard.io/docs/pe/user-guide/calculated-fields/)
- [Reprocess API](https://thingsboard.io/docs/pe/user-guide/calculated-fields/#reprocessing)
- `analysis/DERIVED_TELEMETRY_LOGIC.md` - Extrahierte TBEL Logik
- `analysis/ECO_Data_Catalog.md` - Data Catalog
