# RESI Device Rule Chain Scripts

> Dokumentation der Telemetrie-Transformation und Derived Telemetry

## Übersicht

| Script | Beschreibung |
|--------|--------------|
| `normalize_data.tbel` | Haupttransformation: Key-Mapping, Derived Telemetry, Outlier Detection, Power Calculation |
| `rename_temperature_keys.js` | Legacy: Temperatursensor-Umbenennung (wird durch normalize_data ersetzt) |

---

## Normalize Data Script

### Telemetrie Key-Mapping

| Input (CHC_*) | Output | Einheit | Umrechnung |
|---------------|--------|---------|------------|
| `CHC_S_TemperatureFlow` | `T_flow_C` | °C | - |
| `CHC_S_TemperatureReturn` | `T_return_C` | °C | - |
| `CHC_S_TemperatureDiff` | `dT_K` | K | abs() für Cooling |
| `CHC_S_VolumeFlow` | `Vdot_m3h` | m³/h | ÷ 1000 (Input ist l/h) |
| `CHC_S_Velocity` | `v_ms` | m/s | - |
| `CHC_S_Power_Heating` | `P_th_kW` | kW | wenn installationType = heating |
| `CHC_S_Power_Cooling` | `P_th_kW` | kW | wenn installationType = cooling |
| `CHC_M_Energy_Heating` | `E_th_kWh` | kWh | wenn installationType = heating |
| `CHC_M_Energy_Cooling` | `E_th_kWh` | kWh | wenn installationType = cooling |
| `CHC_M_Volume` | `V_m3` | m³ | - |
| `temperature` (TS1) | `auxT1_C` | °C | wenn deviceName endet mit `_TS1` |
| `temperature` (TS2) | `auxT2_C` | °C | wenn deviceName endet mit `_TS2` |

---

## Derived Telemetry

### is_on (boolean)

**Zweck:** Erkennung ob Anlage in Betrieb ist.

| Parameter | Wert | Quelle |
|-----------|------|--------|
| **Input** | `Vdot_m3h` | Telemetrie |
| **Schwelle** | `flowOnThreshold` | Measurement Attribut (Default: 0.05 m³/h) |

**Logik:**
```
is_on = (Vdot_m3h > flowOnThreshold)
```

**Beispiel:**
- `Vdot_m3h = 0.12 m³/h`, `flowOnThreshold = 0.05` → `is_on = true`
- `Vdot_m3h = 0.02 m³/h`, `flowOnThreshold = 0.05` → `is_on = false`

---

### load_class (string: low | mid | high)

**Zweck:** Klassifizierung der aktuellen Last für Analyse-Filterung.

| Parameter | Wert | Quelle |
|-----------|------|--------|
| **Input** | `P_th_kW` | Telemetrie |
| **Referenz** | `designPower` | Measurement Attribut (kW) |

**Schwellen:**
| Load % | load_class |
|--------|------------|
| < 30% | `low` |
| 30% - 60% | `mid` |
| > 60% | `high` |

**Logik:**
```
load_pct = (P_th_kW / designPower) * 100

if (load_pct < 30)  → "low"
if (load_pct < 60)  → "mid"
else                → "high"
```

**Beispiel:**
- `P_th_kW = 15 kW`, `designPower = 100 kW` → 15% → `load_class = "low"`
- `P_th_kW = 45 kW`, `designPower = 100 kW` → 45% → `load_class = "mid"`
- `P_th_kW = 80 kW`, `designPower = 100 kW` → 80% → `load_class = "high"`

**Robustheit:** Wird nicht berechnet wenn `designPower` fehlt oder 0 ist.

---

### dT_flag (string: ok | warn | severe)

**Zweck:** Bewertung der Temperaturdifferenz (Low-ΔT Erkennung).

| Parameter | Wert | Quelle |
|-----------|------|--------|
| **Input** | `dT_K` | Telemetrie |
| **Sollwert** | `designDeltaT` | Measurement Attribut (K) |

**Schwellen:**
| dT Ratio | dT_flag | Beschreibung |
|----------|---------|--------------|
| ≥ 80% | `ok` | ΔT im Sollbereich |
| 60% - 80% | `warn` | ΔT leicht unter Soll |
| < 60% | `severe` | Low-ΔT Problem |

**Logik:**
```
// Nur bei mid/high Load bewerten (Low Load = skip)
if (load_class == "low") → kein dT_flag setzen

dT_ratio = dT_K / designDeltaT

if (dT_ratio >= 0.8)  → "ok"
if (dT_ratio >= 0.6)  → "warn"
else                  → "severe"
```

**Beispiel** (designDeltaT = 15 K):
- `dT_K = 14 K` → 93% → `dT_flag = "ok"`
- `dT_K = 10 K` → 67% → `dT_flag = "warn"`
- `dT_K = 6 K` → 40% → `dT_flag = "severe"`

**Robustheit:**
- Wird nicht berechnet wenn `designDeltaT` fehlt oder 0 ist
- Wird nicht berechnet bei `load_class = "low"` (Teillast-ΔT ist normal niedrig)
- Wird berechnet wenn `load_class` unbekannt ist (Attribut fehlt)

---

### schedule_violation (boolean)

**Zweck:** Erkennung ob Anlage außerhalb der definierten Betriebszeiten läuft.

| Parameter | Wert | Quelle |
|-----------|------|--------|
| **Input** | `is_on` | Telemetrie (berechnet) |
| **Schedule** | `weeklySchedule` | Measurement Attribut (JSON) |

**weeklySchedule Format:**

```json
{
  "timezoneOffset": 60,
  "monday": {"enabled": true, "start": "04:00", "end": "22:00"},
  "tuesday": {"enabled": true, "start": "04:00", "end": "22:00"},
  "wednesday": {"enabled": true, "start": "04:00", "end": "22:00"},
  "thursday": {"enabled": true, "start": "04:00", "end": "22:00"},
  "friday": {"enabled": true, "start": "04:00", "end": "22:00"},
  "saturday": {"enabled": true, "start": "06:00", "end": "18:00"},
  "sunday": {"enabled": false, "start": "00:00", "end": "00:00"}
}
```

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `timezoneOffset` | number | Minuten von UTC (60 = CET, 120 = CEST) |
| `monday..sunday` | object | Tagesplan |
| `enabled` | boolean | Tag aktiviert? |
| `start` | string | Startzeit "HH:MM" |
| `end` | string | Endzeit "HH:MM" |

**Logik:**
```
1. Parse weeklySchedule JSON
2. Prüfe ob Timestamp in europäischer Sommerzeit (DST) liegt
3. Berechne effektiven Offset: timezoneOffset + (isDST ? 60 : 0)
4. Konvertiere Timestamp zu Lokalzeit (+ effectiveOffset)
5. Bestimme Wochentag aus Lokalzeit
6. Prüfe ob aktueller Zeitpunkt innerhalb start..end liegt
7. schedule_violation = is_on AND NOT isWithinSchedule
```

**DST-Erkennung (automatisch):**
- Sommerzeit beginnt: Letzter Sonntag im März um 02:00 UTC
- Sommerzeit endet: Letzter Sonntag im Oktober um 03:00 UTC
- Gilt für CET/CEST (Mitteleuropa)

**Beispiele:**

| Zeit (lokal) | Wochentag | Schedule | is_on | schedule_violation |
|--------------|-----------|----------|-------|--------------------|
| 10:00 | Montag | 04:00-22:00, enabled | true | false |
| 23:30 | Montag | 04:00-22:00, enabled | true | **true** |
| 14:00 | Sonntag | disabled | true | **true** |
| 03:00 | Dienstag | 04:00-22:00, enabled | false | false |

**Robustheit:**
- Wird nicht berechnet wenn `weeklySchedule` fehlt
- Wird nicht berechnet wenn `is_on` fehlt (kein Durchflusswert)
- Default `timezoneOffset`: 60 (CET) wenn nicht angegeben

---

## Calculated Power (P_th_calc_kW)

**Zweck:** Berechnung der thermischen Leistung aus Volumenstrom und Temperaturdifferenz.

**Aktivierung:** `calculatePower = true` (Measurement Attribut)

### Formel

```
P [kW] = (ρ × cp / 3600) × V̇ × ΔT
```

Wobei:
- ρ = Dichte [kg/m³]
- cp = spezifische Wärmekapazität [kJ/(kg·K)]
- V̇ = Volumenstrom [m³/h]
- ΔT = Temperaturdifferenz [K] (Absolutwert!)

### Stoffwerte nach fluidType

| fluidType | cp [kJ/(kg·K)] | ρ [kg/m³] | Faktor |
|-----------|----------------|-----------|--------|
| `water` | 4.186 | 1000 - 0.4×(T-20)* | ~1.163 |
| `glycol20` | 3.87 | 1025 | 1.102 |
| `glycol30` | 3.65 | 1040 | 1.055 |
| `glycol40` | 3.45 | 1055 | 1.011 |
| `propyleneGlycol20` | 3.95 | 1020 | 1.119 |
| `propyleneGlycol30` | 3.75 | 1030 | 1.073 |

*Wasser: Dichte temperaturabhängig (T_flow als Referenz), cp konstant

### Beispiel

```
fluidType = "water"
T_flow_C = 60°C
Vdot_m3h = 2.5 m³/h
dT_K = 12 K

ρ = 1000 - 0.4 × (60 - 20) = 984 kg/m³
cp = 4.186 kJ/(kg·K)
factor = (984 × 4.186) / 3600 = 1.144

P_th_calc_kW = 1.144 × 2.5 × 12 = 34.3 kW
```

---

## Power Deviation Detection

**Zweck:** Vergleich zwischen gemessener Leistung (RESI) und berechneter Leistung.

**Voraussetzungen:**
- `calculatePower = true`
- Beide `P_th_kW` (gemessen) und `P_th_calc_kW` (berechnet) vorhanden

### P_deviation_pct (number)

Prozentuale Abweichung der gemessenen von der berechneten Leistung.

```
P_deviation_pct = ((P_th_kW - P_th_calc_kW) / P_th_calc_kW) × 100
```

**Interpretation:**
- Positive Werte: Sensor misst mehr als Berechnung
- Negative Werte: Sensor misst weniger als Berechnung

### P_sensor_flag (string: ok | warn | error)

Kategorische Bewertung der Abweichung.

| Abweichung | P_sensor_flag | Bedeutung |
|------------|---------------|-----------|
| < 10% | `ok` | Sensor und Berechnung stimmen überein |
| 10% - 25% | `warn` | Leichte Abweichung, prüfen |
| > 25% | `error` | Sensorfehler wahrscheinlich |

**Mögliche Ursachen für Abweichungen:**
- Falsche Stoffwerte (fluidType)
- Sensorfehler (Durchfluss oder Temperatur)
- Luft im System
- Ungenauer Energiezähler

---

## Outlier Detection (data_quality)

**Zweck:** Erkennung von Sensorfehlern und Register-Überläufen.

### Absolute Grenzen

| Telemetrie | Min | Max | Fehlertyp |
|------------|-----|-----|-----------|
| `P_th_kW` | 0 | 10.000 kW | Register-Überlauf |
| `P_th_calc_kW` | 0 | 10.000 kW | Berechnungsfehler |
| `E_th_kWh` | 0 | 100.000 kWh | Register-Überlauf |
| `T_flow_C` | -50°C | 200°C | Sensorfehler |
| `T_return_C` | -50°C | 200°C | Sensorfehler |
| `auxT1_C` | -50°C | 200°C | Sensorfehler |
| `auxT2_C` | -50°C | 200°C | Sensorfehler |
| `Vdot_m3h` | 0 | 1.000 m³/h | Sensorfehler |

### data_quality Werte

| Wert | Beschreibung |
|------|--------------|
| `ok` | Alle Werte innerhalb der Grenzen |
| `error` | Mindestens ein Wert außerhalb der Grenzen |

**Wichtig:** Bei `data_quality = "error"` werden die Daten trotzdem gespeichert!
Die Filterung erfolgt später im Dashboard mit `WHERE data_quality = 'ok'`.

---

## Benötigte Measurement Attribute

Diese Attribute müssen vom **"Get Measurement Attributes"** Node geholt werden:

| Attribut | Typ | Default | Verwendung |
|----------|-----|---------|------------|
| `installationType` | string | `"heating"` | Power/Energy Key-Auswahl, dT Vorzeichen |
| `flowOnThreshold` | number | `0.05` m³/h | is_on Berechnung |
| `designPower` | number | - | load_class Berechnung |
| `designDeltaT` | number | - | dT_flag Berechnung |
| `calculatePower` | boolean | `false` | Aktiviert Leistungsberechnung |
| `fluidType` | string | `"water"` | Stoffwerte für Leistungsberechnung |
| `weeklySchedule` | JSON | - | schedule_violation Berechnung |

**Hinweis:** Metadata-Werte kommen als Strings und werden mit `parseDouble()` konvertiert.

### fluidType Optionen

| Wert | Beschreibung |
|------|--------------|
| `water` | Wasser (temperaturabhängige Dichte) |
| `glycol20` | 20% Ethylenglykol |
| `glycol30` | 30% Ethylenglykol |
| `glycol40` | 40% Ethylenglykol |
| `propyleneGlycol20` | 20% Propylenglykol |
| `propyleneGlycol30` | 30% Propylenglykol |

---

## Rule Chain Verkettung

```
Device Profile
    │
    ▼
Post Telemetry
    │
    ▼
Check if msg empty
    │ [msg]
    ▼
Process Meters (berechnet CHC_S_TemperatureDiff)
    │
    ▼
Change Device
    │
    ├──► Set Activity
    │
    ├──► Rename Power Keys → Skip negative → Save Timeseries (Device)
    │
    └──► Check relation (Measurement) ──► [True] ──► Switch to Measurement
                                                          │
                                                          ▼
                                                    Get Measurement Attributes
                                                          │
                                                    ┌─────┴─────┐
                                                    ▼           ▼
                                              Save TS      Normalize Data
                                           (CHC_* Keys)         │
                                                                ▼
                                                          Save Timeseries
                                                       (Normalized Keys)
```

**Hinweis:** Aktuell werden beide Key-Sets gespeichert (Übergangsphase für Backward Compatibility).

---

## Änderungshistorie

| Datum | Änderung |
|-------|----------|
| 2026-02-03 | Calculated Fields: dT_collapse_flag, flow_spike_flag (Asset Profile) |
| 2026-02-03 | Schedule Violation Detection (schedule_violation) mit weeklySchedule JSON |
| 2026-02-03 | Calculated Power (P_th_calc_kW) mit fluidType und temperaturabhängiger Dichte |
| 2026-02-03 | Power Deviation Detection (P_deviation_pct, P_sensor_flag) |
| 2026-02-03 | Absolutwert für dT_K (Cooling Support) |
| 2026-02-02 | Normalize Data Script erstellt mit Key-Mapping, Derived Telemetry, Outlier Detection |

---

## Calculated Fields (Asset Profile: Measurement)

Calculated Fields werden auf Asset Profile Ebene definiert und automatisch für alle Measurements berechnet.

**API Endpoint:** `GET /api/ASSET_PROFILE/{profileId}/calculatedFields`

### Verfügbare Methoden für TS_ROLLING Arguments

| Methode | Beschreibung | Beispiel |
|---------|--------------|----------|
| `last()` | Letzter Wert | `dT_K.last()` |
| `first()` | Erster Wert | `dT_K.first()` |
| `mean()` / `avg()` | Durchschnitt | `dT_K.mean()` |
| `min()` | Minimum | `dT_K.min()` |
| `max()` | Maximum | `dT_K.max()` |
| `sum()` | Summe | `dT_K.sum()` |
| `count()` | Anzahl Werte | `dT_K.count()` |
| `std()` | Standardabweichung | `dT_K.std()` |
| `median()` | Median | `dT_K.median()` |

**Hinweis:** Alle Methoden ignorieren NaN-Werte standardmäßig. Mit `method(false)` werden NaN-Werte einbezogen.

---

### dT_collapse_flag (boolean)

**Zweck:** Erkennung von plötzlichem ΔT-Einbruch (Low-ΔT Syndrom).

| Parameter | Wert | Quelle |
|-----------|------|--------|
| **Input** | `dT_K` | Telemetrie (Rolling Window 15 Min) |
| **Schwelle** | `collapseThreshold` | Measurement Attribut (Default: 0.5) |

**Argument-Konfiguration:**
```json
{
  "dT_K": {
    "refEntityKey": { "key": "dT_K", "type": "TS_ROLLING" },
    "limit": 100,
    "timeWindow": 900000
  },
  "collapseThreshold": {
    "refEntityKey": { "key": "collapseThreshold", "type": "ATTRIBUTE", "scope": "SERVER_SCOPE" },
    "defaultValue": "0.5"
  }
}
```

**Script:**
```javascript
var currentDT = dT_K.last();
var avgDT = dT_K.mean();
var countDT = dT_K.count();

if (countDT < 3 || avgDT == 0) {
  return {};
}

var collapsed = (currentDT < avgDT * collapseThreshold);

return { "dT_collapse_flag": collapsed };
```

**Logik:**
- Vergleicht aktuellen dT_K mit Durchschnitt der letzten 15 Minuten
- Flag = `true` wenn aktueller Wert < 50% (oder `collapseThreshold`) vom Durchschnitt
- Mindestens 3 Datenpunkte erforderlich

**Beispiel** (collapseThreshold = 0.5):
| Aktuell | Avg (15 Min) | Verhältnis | dT_collapse_flag |
|---------|--------------|------------|------------------|
| 12 K | 14 K | 86% | `false` |
| 6 K | 14 K | 43% | `true` |
| 10 K | 12 K | 83% | `false` |

---

### flow_spike_flag (boolean)

**Zweck:** Erkennung von plötzlichen Durchfluss-Spikes.

| Parameter | Wert | Quelle |
|-----------|------|--------|
| **Input** | `Vdot_m3h` | Telemetrie (Rolling Window 5 Min) |
| **Schwelle** | `spikeThreshold` | Measurement Attribut (Default: 2.0) |

**Argument-Konfiguration:**
```json
{
  "Vdot_m3h": {
    "refEntityKey": { "key": "Vdot_m3h", "type": "TS_ROLLING" },
    "limit": 50,
    "timeWindow": 300000
  },
  "spikeThreshold": {
    "refEntityKey": { "key": "spikeThreshold", "type": "ATTRIBUTE", "scope": "SERVER_SCOPE" },
    "defaultValue": "2.0"
  }
}
```

**Script:**
```javascript
var currentFlow = Vdot_m3h.last();
var avgFlow = Vdot_m3h.mean();
var countFlow = Vdot_m3h.count();

if (countFlow < 3 || avgFlow == 0) {
  return {};
}

var spiked = (currentFlow > avgFlow * spikeThreshold);

return { "flow_spike_flag": spiked };
```

**Logik:**
- Vergleicht aktuellen Vdot_m3h mit Durchschnitt der letzten 5 Minuten
- Flag = `true` wenn aktueller Wert > 200% (oder `spikeThreshold`) vom Durchschnitt
- Mindestens 3 Datenpunkte erforderlich

**Beispiel** (spikeThreshold = 2.0):
| Aktuell | Avg (5 Min) | Verhältnis | flow_spike_flag |
|---------|-------------|------------|-----------------|
| 1.5 m³/h | 1.2 m³/h | 125% | `false` |
| 3.0 m³/h | 1.2 m³/h | 250% | `true` |
| 2.2 m³/h | 1.8 m³/h | 122% | `false` |

---

### Konfigurierbare Schwellenwerte

Die Calculated Fields verwenden Measurement-Attribute für Schwellenwerte mit Fallback auf Default-Werte:

| Attribut | Default | Beschreibung |
|----------|---------|--------------|
| `collapseThreshold` | 0.5 | dT Collapse: Verhältnis aktuell/avg (0.5 = 50%) |
| `spikeThreshold` | 2.0 | Flow Spike: Verhältnis aktuell/avg (2.0 = 200%) |

**Robustheit:** Wenn das Attribut nicht gesetzt ist, wird automatisch der Default-Wert aus der Argument-Konfiguration verwendet.

---

## TODO

- [ ] Weitere Fluid-Typen in Default-Parameter ergänzen (glycol40, propyleneGlycol20/30)
- [ ] Weitere Calculated Fields: load_pct, dT_efficiency, power_stability
- [ ] Alarm Rule Chain für Calculated Field Flags
