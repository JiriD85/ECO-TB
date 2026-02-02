# RESI Device Rule Chain Scripts

> Dokumentation der Telemetrie-Transformation und Derived Telemetry

## Übersicht

| Script | Beschreibung |
|--------|--------------|
| `normalize_data.tbel` | Haupttransformation: Key-Mapping, Derived Telemetry, Outlier Detection |
| `rename_temperature_keys.js` | Legacy: Temperatursensor-Umbenennung (wird durch normalize_data ersetzt) |

---

## Normalize Data Script

### Telemetrie Key-Mapping

| Input (CHC_*) | Output | Einheit | Umrechnung |
|---------------|--------|---------|------------|
| `CHC_S_TemperatureFlow` | `T_flow_C` | °C | - |
| `CHC_S_TemperatureReturn` | `T_return_C` | °C | - |
| `CHC_S_TemperatureDiff` | `dT_K` | K | oder berechnet: T_flow - T_return |
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

## Outlier Detection (data_quality)

**Zweck:** Erkennung von Sensorfehlern und Register-Überläufen.

### Absolute Grenzen

| Telemetrie | Min | Max | Fehlertyp |
|------------|-----|-----|-----------|
| `P_th_kW` | 0 | 10.000 kW | Register-Überlauf |
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
| `installationType` | string | `"heating"` | Power/Energy Key-Auswahl |
| `flowOnThreshold` | number | `0.05` m³/h | is_on Berechnung |
| `designPower` | number | - | load_class Berechnung |
| `designDeltaT` | number | - | dT_flag Berechnung |

**Hinweis:** Metadata-Werte kommen als Strings und werden mit `parseDouble()` konvertiert.

---

## Rule Chain Verkettung

### Aktueller Stand (mit Legacy-Pfad)

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
    ├──► Check relation (VR) ──► [True] ──► Switch to VR Device → Save TS (VR)
    │                        └─► [False] ─► Rename Temp Keys → Switch to Measurement → Save TS
    │
    └──► Check relation (Measurement) ──► [True] ──► Switch to Measurement
                                                          │
                                                          ▼
                                                    Get Measurement Attributes
                                                          │
                                                          ▼
                                                    Normalize Data  ← HIER!
                                                          │
                                                          ▼
                                                    Save Timeseries (Measurement)
```

### Verbesserungsvorschläge

1. **Normalize Data Output verbinden** - Aktuell geht der Output nirgendwo hin!
2. **VR Device Pfad entfernen** - Nach Migration nicht mehr benötigt
3. **Rename Temperature Keys entfernen** - Wird jetzt in Normalize Data gemacht
4. **Process Meters vereinfachen** - dT Berechnung ist jetzt in Normalize Data

---

## Änderungshistorie

| Datum | Änderung |
|-------|----------|
| 2026-02-02 | Normalize Data Script erstellt mit Key-Mapping, Derived Telemetry, Outlier Detection |
