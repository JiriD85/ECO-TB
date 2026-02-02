# Derived Telemetry Schwellwerte

> Konfiguration der berechneten Telemetrie-Werte im Normalize Data Script

---

## is_on (boolean)

**Zweck:** Erkennt ob die Anlage in Betrieb ist.

| Parameter | Beschreibung |
|-----------|--------------|
| **Input** | `Vdot_m3h` (Volumenstrom in m³/h) |
| **Attribut** | `flowOnThreshold` |
| **Default** | `0.05` m³/h |

### Logik

```
is_on = (Vdot_m3h > flowOnThreshold)
```

### Beispiele

| Vdot_m3h | flowOnThreshold | is_on |
|----------|-----------------|-------|
| 0.12 m³/h | 0.05 m³/h | `true` |
| 0.02 m³/h | 0.05 m³/h | `false` |
| 0.00 m³/h | 0.05 m³/h | `false` |

---

## load_class (string)

**Zweck:** Klassifiziert die aktuelle Last relativ zur Auslegungsleistung.

| Parameter | Beschreibung |
|-----------|--------------|
| **Input** | `P_th_kW` (Leistung in kW) |
| **Attribut** | `designPower` (Auslegungsleistung in kW) |
| **Default** | - (kein Default, wird übersprungen wenn fehlt) |

### Schwellen

| Last-Anteil | load_class | Beschreibung |
|-------------|------------|--------------|
| < 30% | `low` | Teillast |
| 30% – 60% | `mid` | Mittlere Last |
| ≥ 60% | `high` | Hohe Last / Volllast |

### Logik

```
load_pct = (P_th_kW / designPower) × 100

if load_pct < 30  → "low"
if load_pct < 60  → "mid"
else              → "high"
```

### Beispiele (designPower = 100 kW)

| P_th_kW | load_pct | load_class |
|---------|----------|------------|
| 15 kW | 15% | `low` |
| 29 kW | 29% | `low` |
| 30 kW | 30% | `mid` |
| 45 kW | 45% | `mid` |
| 59 kW | 59% | `mid` |
| 60 kW | 60% | `high` |
| 80 kW | 80% | `high` |

---

## dT_flag (string)

**Zweck:** Bewertet die Temperaturdifferenz (ΔT) zur Erkennung von Low-ΔT Problemen.

| Parameter | Beschreibung |
|-----------|--------------|
| **Input** | `dT_K` (Temperaturdifferenz in K) |
| **Attribut** | `designDeltaT` (Auslegungs-ΔT in K) |
| **Default** | - (kein Default, wird übersprungen wenn fehlt) |

### Schwellen

| ΔT-Verhältnis | dT_flag | Beschreibung |
|---------------|---------|--------------|
| ≥ 80% | `ok` | ΔT im Sollbereich |
| 60% – 80% | `warn` | ΔT leicht unter Soll |
| < 60% | `severe` | Low-ΔT Problem |

### Logik

```
// WICHTIG: Nur bei mid/high Load bewerten!
if (load_class == "low") → KEIN dT_flag setzen

dT_ratio = dT_K / designDeltaT

if dT_ratio >= 0.8  → "ok"
if dT_ratio >= 0.6  → "warn"
else                → "severe"
```

### Beispiele (designDeltaT = 15 K)

| dT_K | dT_ratio | dT_flag |
|------|----------|---------|
| 15 K | 100% | `ok` |
| 14 K | 93% | `ok` |
| 12 K | 80% | `ok` |
| 11 K | 73% | `warn` |
| 10 K | 67% | `warn` |
| 9 K | 60% | `warn` |
| 8 K | 53% | `severe` |
| 6 K | 40% | `severe` |

### Warum nur bei mid/high Load?

Bei niedriger Last (< 30%) ist ein reduziertes ΔT **normal** und kein Indikator für ein Problem. Die Bewertung erfolgt daher nur bei mittlerer und hoher Last.

---

## data_quality (string)

**Zweck:** Markiert Datenpunkte mit Ausreißern oder Sensorfehlern.

### Outlier-Grenzen

| Telemetrie | Min | Max | Typischer Fehler |
|------------|-----|-----|------------------|
| `P_th_kW` | 0 | 10.000 kW | Register-Überlauf |
| `E_th_kWh` | 0 | 100.000 kWh | Register-Überlauf |
| `T_flow_C` | -50°C | 200°C | Sensorfehler |
| `T_return_C` | -50°C | 200°C | Sensorfehler |
| `auxT1_C` | -50°C | 200°C | Sensorfehler |
| `auxT2_C` | -50°C | 200°C | Sensorfehler |
| `Vdot_m3h` | 0 | 1.000 m³/h | Sensorfehler |

### Werte

| data_quality | Beschreibung |
|--------------|--------------|
| `ok` | Alle Werte innerhalb der Grenzen |
| `error` | Mindestens ein Wert außerhalb der Grenzen |

### Wichtig

- Daten werden **immer gespeichert**, auch bei `error`
- Filterung erfolgt im Dashboard: `WHERE data_quality = 'ok'`
- Fehlerhafte Daten bleiben für Debugging und Analyse erhalten

---

## Benötigte Attribute

Diese Attribute müssen am **Measurement** konfiguriert sein:

| Attribut | Typ | Default | Für |
|----------|-----|---------|-----|
| `installationType` | string | `heating` | Power/Energy Auswahl |
| `flowOnThreshold` | number | `0.05` | is_on |
| `designPower` | number | - | load_class |
| `designDeltaT` | number | - | dT_flag |

### Typische Werte nach systemType

| systemType | designDeltaT | designPower (Beispiel) |
|------------|--------------|------------------------|
| `radiator` | 15 K | 50–200 kW |
| `floorHeating` | 7 K | 20–100 kW |
| `fanCoil` (heating) | 10 K | 10–50 kW |
| `fanCoil` (cooling) | 6 K | 10–50 kW |
| `ahuCoil` (heating) | 20 K | 50–500 kW |
| `ahuCoil` (cooling) | 5 K | 50–500 kW |
| `districtHeating` | 25 K | 100–1000 kW |
| `chiller` | 5 K | 50–500 kW |
