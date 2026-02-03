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
| 2026-02-03 | Calculated Power (P_th_calc_kW) mit fluidType und temperaturabhängiger Dichte |
| 2026-02-03 | Power Deviation Detection (P_deviation_pct, P_sensor_flag) |
| 2026-02-03 | Absolutwert für dT_K (Cooling Support) |
| 2026-02-02 | Normalize Data Script erstellt mit Key-Mapping, Derived Telemetry, Outlier Detection |

---

## TODO

- [ ] Weitere Fluid-Typen in Default-Parameter ergänzen (glycol40, propyleneGlycol20/30)
