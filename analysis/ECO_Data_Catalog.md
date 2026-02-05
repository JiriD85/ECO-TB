# ECO Smart Diagnostics - Data Catalog

> Entwicklerfertiger Datenkatalog für ThingsBoard PE
> Stand: Februar 2026

---

## 1. Naming Convention

| Typ | Konvention | Beispiele |
|-----|------------|-----------|
| **Attribute** | camelCase | `designFlowTemp`, `systemType`, `pumpRatedPower` |
| **Telemetrie** | snake_case + Einheit | `T_flow_C`, `P_th_kW`, `dT_K` |
| **Derived Telemetrie** | snake_case | `is_on`, `load_class`, `dT_flag` |

---

## 2. Entity-Hierarchie

```
Tenant (ECO Energy Group)
│
└── Customer (z.B. PKE Gebäudetechnik GmbH)
    │
    ├── Project (Asset)
    │   ├── Relation "Owns" → Measurement(s)
    │   ├── Attribute: progress, state, address, normOutdoorTemp...
    │   └── Telemetrie: Wetterdaten (T_outside_C, RH_outside_pct)
    │
    ├── Measurement (Asset)
    │   ├── Relation "Measurement" → Device (nur während aktiver Messung)
    │   ├── Telemetrie: Messdaten (T_flow_C, P_th_kW, dT_K...)
    │   └── Attribute: installationType, systemType, designDeltaT...
    │
    ├── Diagnostickit (Asset)
    │   ├── Relation "Contains" → Device(s)
    │   └── Attribute: kitType, subscriptionStatus
    │
    └── Device (P-Flow D116, Temperature Sensor, RESI, Gateway)
        └── Telemetrie: Sensor-Rohdaten
```

---

## 3. Customer Attribute

| Attribut | Typ | Beschreibung |
|----------|-----|--------------|
| `name` | string | Kundenname |

---

## 4. Project Attribute

**Asset Profile:** `Project`

### Basis

| Attribut | Typ | Werte | Beschreibung |
|----------|-----|-------|--------------|
| `progress` | string | `in preparation`, `active`, `finished`, `aborted` | Projektphase |
| `state` | string | `normal`, `minor`, `major`, `critical` | Alarm-Status |
| `address` | string | - | Standortadresse |
| `latitude` | string | - | Breitengrad |
| `longitude` | string | - | Längengrad |
| `units` | string | `metric` | Einheitensystem |

### Klima / Norm-Außentemperatur

| Attribut | Typ | Einheit | Beschreibung |
|----------|-----|---------|--------------|
| `normOutdoorTemp` | number | °C | NAT aus Katalog (z.B. -12°C für Wien) |
| `normOutdoorTempCalculated` | number | °C | NAT berechnet aus Wetter-API |

### Viewer-Management

| Attribut | Typ | Beschreibung |
|----------|-----|--------------|
| `viewerUserGroupId` | string | ID der Viewer User Group |
| `viewerAssetGroupId` | string | ID der Viewer Asset Group |

---

## 5. Measurement Attribute

**Asset Profile:** `Measurement`

### Basis

| Attribut | Typ | Werte | Beschreibung |
|----------|-----|-------|--------------|
| `progress` | string | `in preparation`, `active`, `finished`, `aborted` | Messphase |
| `state` | string | `normal`, `minor`, `major`, `critical` | Alarm-Status |

### Zeitraum

| Attribut | Typ | Beschreibung |
|----------|-----|--------------|
| `startTimeMs` | number | Messungsbeginn (Unix timestamp ms) |
| `endTimeMs` | number | Messungsende (Unix timestamp ms) |

### Klassifikation

| Attribut | Typ | Werte | Beschreibung |
|----------|-----|-------|--------------|
| `installationType` | string | `heating`, `cooling` | Heizkreis oder Kältekreis |
| `measurementType` | string | `ultrasonic`, `interpolation`, `import` | Datenquelle |
| `systemType` | string | siehe unten | Art des Systems |

**systemType-Werte:**

| Wert | Deutsch | Typisches ΔT |
|------|---------|--------------|
| `radiator` | Heizkörper | 15 K |
| `floorHeating` | Fußbodenheizung | 7 K |
| `fanCoil` | Gebläsekonvektor | 6 K (Kühlen) / 10 K (Heizen) |
| `ahuCoil` | RLT-Register | 20 K (Heizen) / 5 K (Kühlen) |
| `districtHeating` | Fernwärme | 25 K |
| `chiller` | Kältemaschine | 5 K |

### Hydraulik

| Attribut | Typ | Werte | Beschreibung |
|----------|-----|-------|--------------|
| `measurementRole` | string | `generator`, `circuit`, `subDistribution` | Rolle im System |
| `hydraulicScheme` | string | `direct`, `mixingValve`, `injection`, `separator`, `buffer` | Hydraulisches Schema |
| `fluidType` | string | `water`, `glycol20`, `glycol30` | Medium |

### Auslegungswerte

| Attribut | Typ | Einheit | Beschreibung |
|----------|-----|---------|--------------|
| `designFlowTemp` | number | °C | Auslegungs-Vorlauftemperatur |
| `designReturnTemp` | number | °C | Auslegungs-Rücklauftemperatur |
| `designDeltaT` | number | K | Auslegungs-ΔT (Sollwert) |
| `designPower` | number | kW | Auslegungsleistung |
| `designFlow` | number | m³/h | Auslegungs-Volumenstrom |

### Rohr & Ventil

| Attribut | Typ | Werte / Einheit | Beschreibung |
|----------|-----|-----------------|--------------|
| `pipeDimension` | string | `DN20`-`DN100` | Rohrdimension (P-Flow Sensor) |
| `valveDimension` | string | `DN15`-`DN100` | Ventildimension (Regelventil) |
| `valveKvs` | number | m³/h | Kvs-Wert des Regelventils |

### Fläche

| Attribut | Typ | Format | Beschreibung |
|----------|-----|--------|--------------|
| `area` | object | `{"value": 100, "unit": "m^2"}` | Beheizte/Gekühlte Fläche |

### Betrieb / ON-OFF Erkennung

| Attribut | Typ | Einheit | Default | Beschreibung |
|----------|-----|---------|---------|--------------|
| `flowOnThreshold` | number | m³/h | 0.05 | Durchfluss-Schwelle für "Anlage läuft" |
| `hysteresisMinutes` | number | min | 3 | Hysterese für ON/OFF Erkennung |
| `weeklySchedule` | object | - | - | Soll-Betriebszeiten (siehe Format unten) |

**weeklySchedule Format (zwei Varianten):**

*Einfach (nur Tage):*
```json
{"monday": true, "tuesday": true, "wednesday": true, "thursday": true, "friday": true, "saturday": false, "sunday": false}
```

*Vollständig (mit Zeiten und Timezone):*
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
| `timezoneOffset` | number | Minuten von UTC (60 = CET, 120 = CEST). Default: 60 |
| `monday..sunday` | boolean/object | Tag aktiviert oder Objekt mit enabled/start/end |
| `enabled` | boolean | Tag aktiviert? |
| `start` | string | Startzeit "HH:MM" |
| `end` | string | Endzeit "HH:MM" |

### Leistungsberechnung

| Attribut | Typ | Werte | Default | Beschreibung |
|----------|-----|-------|---------|--------------|
| `calculatePower` | boolean | `true`, `false` | `false` | Aktiviert Leistungsberechnung aus cp×ṁ×ΔT |
| `fluidType` | string | siehe unten | `water` | Medium für Stoffwerte |

### Calculated Field Schwellenwerte

| Attribut | Typ | Einheit | Default | Beschreibung |
|----------|-----|---------|---------|--------------|
| `collapseThreshold` | number | ratio | 0.5 | dT_collapse_flag Schwelle (0.5 = 50%) |
| `spikeThreshold` | number | ratio | 2.0 | flow_spike_flag Schwelle (2.0 = 200%) |
| `cyclingThreshold` | number | count | 5 | cycling_flag Schwelle (Max Wechsel in 30 Min) |
| `stabilityThreshold` | number | ratio | 0.3 | power_unstable_flag Schwelle (Max CV) |

### Pumpe

| Attribut | Typ | Werte / Einheit | Beschreibung |
|----------|-----|-----------------|--------------|
| `pumpPresent` | boolean | `true`, `false` | Pumpe vorhanden? |
| `pumpControlType` | string | `constant`, `variable`, `unknown` | Regelungsart |
| `pumpRatedPower` | number | kW | Nennleistung |

### Hilfssensoren

| Attribut | Typ | Beschreibung |
|----------|-----|--------------|
| `auxSensor1` | object | Konfiguration Hilfssensor 1 |
| `auxSensor2` | object | Konfiguration Hilfssensor 2 |

**auxSensor-Format:**

```json
{
  "label": "Nach Mischer",
  "location": "mixerPortB"
}
```

**location-Werte:**

| Wert | Beschreibung | Verwendung |
|------|--------------|------------|
| `mixerPortA` | Mischer Eingang A | Mischerverhältnis |
| `mixerPortB` | Mischer Ausgang B | Mischerverhältnis |
| `afterSeparator` | Nach hydraulischer Weiche | Entkopplung |
| `beforeSeparator` | Vor hydraulischer Weiche | Entkopplung |
| `secondaryFlow` | Sekundärkreis Vorlauf | Sekundär-ΔT |
| `secondaryReturn` | Sekundärkreis Rücklauf | Sekundär-ΔT |
| `bufferTop` | Pufferspeicher oben | Schichtung |
| `bufferBottom` | Pufferspeicher unten | Schichtung |
| `custom` | Benutzerdefiniert | - |

### Geräte-Zuweisung

| Attribut | Typ | Beschreibung |
|----------|-----|--------------|
| `assignedDevices` | JSON | Zugewiesene Geräte (Audit Trail) |

---

## 6. Device Attribute

| Attribut | Typ | Werte | Beschreibung |
|----------|-----|-------|--------------|
| `state` | string | `normal`, `critical` | Alarm-Status |
| `active` | boolean | - | ThingsBoard System-Attribut |
| `inactivityAlarmTime` | number | ms | Letzte Inaktivitäts-Warnung |

---

## 7. Diagnostickit Attribute

**Asset Profile:** `Diagnostickit`

| Attribut | Typ | Werte | Beschreibung |
|----------|-----|-------|--------------|
| `kitType` | string | `basis`, `loraWan`, `extension` | Kit-Typ |
| `subscriptionStatus` | string | `no subscription`, `active` | Abo-Status |

**Kit-Typen:**

| Prefix | Name | Inhalt |
|--------|------|--------|
| `DBKIT` | Base Kit | RESI Gateway + 4x P-Flow + 2x Temp Sensor |
| `DRKIT` | Room Kit | LoRaWAN Gateway + Room Sensor CO2 |
| `DEKIT` | Extension Kit | Zusätzliche P-Flows für Base Kit |

---

## 8. Telemetrie-Keys

### Sensor-Werte (Momentan)

| Key | Einheit | Beschreibung |
|-----|---------|--------------|
| `T_flow_C` | °C | Vorlauftemperatur |
| `T_return_C` | °C | Rücklauftemperatur |
| `dT_K` | K | Temperaturdifferenz (Delta-T) |
| `Vdot_m3h` | m³/h | Volumenstrom |
| `v_ms` | m/s | Strömungsgeschwindigkeit |
| `P_th_kW` | kW | Thermische Leistung |

### Zählerstand (Meter)

| Key | Einheit | Beschreibung |
|-----|---------|--------------|
| `E_th_kWh` | kWh | Energie-Zählerstand |
| `V_m3` | m³ | Volumen-Zählerstand |

### Hilfssensoren

| Key | Einheit | Beschreibung |
|-----|---------|--------------|
| `auxT1_C` | °C | Hilfstemperatur 1 |
| `auxT2_C` | °C | Hilfstemperatur 2 |

### Kontext (vom Project)

| Key | Einheit | Beschreibung |
|-----|---------|--------------|
| `T_outside_C` | °C | Außentemperatur |
| `RH_outside_pct` | % | Außenluftfeuchtigkeit |

### Derived (berechnet via Rule Chain)

| Key | Typ | Werte | Beschreibung |
|-----|-----|-------|--------------|
| `is_on` | boolean | `true`, `false` | Anlage läuft |
| `load_class` | string | `low`, `mid`, `high` | Lastklasse |
| `dT_flag` | string | `ok`, `warn`, `severe` | ΔT-Bewertung |
| `data_quality` | string | `ok`, `error` | Datenqualität |
| `schedule_violation` | boolean | `true`, `false` | Betrieb außerhalb Sollzeiten |
| `P_th_calc_kW` | number | kW | Berechnete Leistung (cp×ṁ×ΔT) |
| `P_deviation_pct` | number | % | Abweichung gemessen vs. berechnet |
| `P_sensor_flag` | string | `ok`, `warn`, `error` | Sensor-Plausibilität |

### Calculated Fields (berechnet via Asset Profile)

| Key | Typ | Werte | Beschreibung |
|-----|-----|-------|--------------|
| `dT_collapse_flag` | boolean | `true`, `false` | Plötzlicher ΔT-Einbruch erkannt |
| `flow_spike_flag` | boolean | `true`, `false` | Plötzlicher Durchfluss-Spike erkannt |
| `cycling_flag` | boolean | `true`, `false` | Taktbetrieb erkannt (häufiges Ein/Aus) |
| `cycle_count` | number | 0-n | Anzahl Zustandswechsel in 30 Min |
| `power_stability` | number | 0-1+ | Variationskoeffizient der Leistung (CV) |
| `power_unstable_flag` | boolean | `true`, `false` | Hohe Leistungsvariabilität erkannt |
| `oscillation_count` | number | 0-n | Anzahl Richtungswechsel in 15 Min |
| `oscillation_flag` | boolean | `true`, `false` | Schwingen/Oszillation erkannt |
| `runtime_pct` | number | 0-100 | Laufzeitanteil in % (letzte Stunde) |

---

## 9. Default-Werte nach systemType

| systemType | designDeltaT | designFlowTemp | designReturnTemp |
|------------|--------------|----------------|------------------|
| `radiator` | 15 K | 70 °C | 55 °C |
| `floorHeating` | 7 K | 35 °C | 28 °C |
| `fanCoil` (heating) | 10 K | 50 °C | 40 °C |
| `fanCoil` (cooling) | 6 K | 6 °C | 12 °C |
| `ahuCoil` (heating) | 20 K | 80 °C | 60 °C |
| `ahuCoil` (cooling) | 5 K | 6 °C | 11 °C |
| `districtHeating` | 25 K | 90 °C | 65 °C |
| `chiller` | 5 K | 6 °C | 11 °C |

---

## 10. Relations

| Von | Zu | Relation Type | Beschreibung |
|-----|-----|---------------|--------------|
| Project | Measurement | `Owns` | Permanente Zuordnung |
| Measurement | Device | `Measurement` | Nur während aktiver Messung |
| Diagnostickit | Device | `Contains` | Permanente Kit-Zugehörigkeit |

---

## 11. Progress States

```
in preparation → active → finished
                      ↘ aborted
```

| State | Beschreibung |
|-------|--------------|
| `in preparation` | Messung wird vorbereitet |
| `active` | Messung läuft, Daten werden erfasst |
| `finished` | Messung abgeschlossen |
| `aborted` | Messung abgebrochen |

---

## 12. Alarm States

| State | Farbe | Beschreibung |
|-------|-------|--------------|
| `normal` | Grün | Alles in Ordnung |
| `minor` | Gelb | Geringfügige Warnung |
| `major` | Orange | Wichtige Warnung |
| `critical` | Rot | Kritischer Alarm |

---

## 13. Attribut-Zusammenfassung

| Entity | Anzahl | Kategorien |
|--------|--------|------------|
| **Customer** | 1 | Basis |
| **Project** | 10 | Basis, Klima, Viewer |
| **Measurement** | 28 | Basis, Zeit, Klassifikation, Hydraulik, Auslegung, Rohr/Ventil, Fläche, Betrieb, Leistungsberechnung, Schwellenwerte, Pumpe, Sensoren |
| **Device** | 3 | Basis |
| **Diagnostickit** | 2 | Basis |

---

## 14. Telemetrie-Zusammenfassung

| Kategorie | Anzahl | Keys |
|-----------|--------|------|
| **Sensor** | 6 | `T_flow_C`, `T_return_C`, `dT_K`, `Vdot_m3h`, `v_ms`, `P_th_kW` |
| **Zähler** | 2 | `E_th_kWh`, `V_m3` |
| **Hilfs** | 2 | `auxT1_C`, `auxT2_C` |
| **Kontext** | 2 | `T_outside_C`, `RH_outside_pct` |
| **Derived (Rule Chain)** | 8 | `is_on`, `load_class`, `dT_flag`, `data_quality`, `schedule_violation`, `P_th_calc_kW`, `P_deviation_pct`, `P_sensor_flag` |
| **Calculated Fields** | 9 | `dT_collapse_flag`, `flow_spike_flag`, `cycling_flag`, `cycle_count`, `power_stability`, `power_unstable_flag`, `oscillation_count`, `oscillation_flag`, `runtime_pct` |

---

## 15. Derived Telemetry - Berechnungslogik

Die derived Telemetrie wird in der **RESI Device Rule Chain** im Node "Normalize Data" berechnet.

### is_on (boolean)

**Zweck:** Erkennung ob Anlage in Betrieb ist.

| Parameter | Beschreibung |
|-----------|--------------|
| **Input** | `Vdot_m3h` (Volumenstrom) |
| **Attribut** | `flowOnThreshold` (Default: 0.05 m³/h) |

**Logik:**
```
is_on = (Vdot_m3h > flowOnThreshold)
```

| Vdot_m3h | flowOnThreshold | is_on |
|----------|-----------------|-------|
| 0.12 m³/h | 0.05 m³/h | `true` |
| 0.02 m³/h | 0.05 m³/h | `false` |

---

### load_class (string)

**Zweck:** Klassifizierung der aktuellen Last.

| Parameter | Beschreibung |
|-----------|--------------|
| **Input** | `P_th_kW` (Leistung) |
| **Attribut** | `designPower` (Auslegungsleistung in kW) |

**Schwellen:**

| Last-Anteil | load_class |
|-------------|------------|
| < 30% | `low` |
| 30% – 60% | `mid` |
| ≥ 60% | `high` |

**Logik:**
```
load_pct = (P_th_kW / designPower) × 100

if load_pct < 30  → "low"
if load_pct < 60  → "mid"
else              → "high"
```

**Beispiel** (designPower = 100 kW):

| P_th_kW | load_pct | load_class |
|---------|----------|------------|
| 15 kW | 15% | `low` |
| 45 kW | 45% | `mid` |
| 80 kW | 80% | `high` |

**Robustheit:** Wird nicht berechnet wenn `designPower` fehlt.

---

### dT_flag (string)

**Zweck:** Bewertung der Temperaturdifferenz (Low-ΔT Erkennung).

| Parameter | Beschreibung |
|-----------|--------------|
| **Input** | `dT_K` (Temperaturdifferenz) |
| **Attribut** | `designDeltaT` (Auslegungs-ΔT in K) |

**Schwellen:**

| ΔT-Verhältnis | dT_flag | Beschreibung |
|---------------|---------|--------------|
| ≥ 80% | `ok` | ΔT im Sollbereich |
| 60% – 80% | `warn` | ΔT leicht unter Soll |
| < 60% | `severe` | Low-ΔT Problem |

**Logik:**
```
// WICHTIG: Nur bei mid/high Load bewerten!
if (load_class == "low") → kein dT_flag

dT_ratio = dT_K / designDeltaT

if dT_ratio >= 0.8  → "ok"
if dT_ratio >= 0.6  → "warn"
else                → "severe"
```

**Beispiel** (designDeltaT = 15 K):

| dT_K | dT_ratio | dT_flag |
|------|----------|---------|
| 14 K | 93% | `ok` |
| 10 K | 67% | `warn` |
| 6 K | 40% | `severe` |

**Robustheit:**
- Wird nicht berechnet wenn `designDeltaT` fehlt
- Wird nicht berechnet bei `load_class = "low"` (Teillast-ΔT ist normal niedrig)

---

### data_quality (string)

**Zweck:** Markierung von Ausreißern und Sensorfehlern.

**Outlier-Grenzen:**

| Telemetrie | Min | Max | Typischer Fehler |
|------------|-----|-----|------------------|
| `P_th_kW` | 0 | 10.000 kW | Register-Überlauf |
| `E_th_kWh` | 0 | 100.000 kWh | Register-Überlauf |
| `T_flow_C` | -50°C | 200°C | Sensorfehler |
| `T_return_C` | -50°C | 200°C | Sensorfehler |
| `auxT1_C` | -50°C | 200°C | Sensorfehler |
| `auxT2_C` | -50°C | 200°C | Sensorfehler |
| `Vdot_m3h` | 0 | 1.000 m³/h | Sensorfehler |

**Werte:**

| data_quality | Beschreibung |
|--------------|--------------|
| `ok` | Alle Werte innerhalb der Grenzen |
| `error` | Mindestens ein Wert außerhalb der Grenzen |

**Wichtig:** Daten werden immer gespeichert, auch bei `error`. Filterung im Dashboard: `WHERE data_quality = 'ok'`

---

### schedule_violation (boolean)

**Zweck:** Erkennung ob Anlage außerhalb der definierten Betriebszeiten läuft.

| Parameter | Beschreibung |
|-----------|--------------|
| **Input** | `is_on` (Derived Telemetry) |
| **Attribut** | `weeklySchedule` (JSON mit Zeitfenstern) |

**Logik:**
```
1. Parse weeklySchedule (Simple oder Full Format)
2. Automatische DST-Erkennung (CET/CEST - europäische Sommerzeit)
3. Konvertiere Timestamp zu Lokalzeit
4. Bestimme Wochentag und prüfe Zeitfenster
5. schedule_violation = is_on AND NOT isWithinSchedule
```

**DST-Erkennung:**
- Sommerzeit beginnt: Letzter Sonntag im März um 02:00 UTC
- Sommerzeit endet: Letzter Sonntag im Oktober um 03:00 UTC

| Situation | schedule_violation |
|-----------|-------------------|
| Anlage läuft, innerhalb Zeitfenster | `false` |
| Anlage läuft, außerhalb Zeitfenster | `true` |
| Anlage steht | `false` |

**Robustheit:**
- Wird nicht berechnet wenn `weeklySchedule` fehlt
- Default `timezoneOffset`: 60 (CET) wenn nicht angegeben
- Unterstützt beide weeklySchedule Formate (Simple und Full)

---

### P_th_calc_kW (number)

**Zweck:** Berechnung der thermischen Leistung aus Volumenstrom und Temperaturdifferenz.

| Parameter | Beschreibung |
|-----------|--------------|
| **Input** | `Vdot_m3h`, `dT_K`, `T_flow_C` |
| **Attribut** | `calculatePower` (muss `true` sein), `fluidType` |

**Formel:**
```
P [kW] = (ρ × cp / 3600) × V̇ × |ΔT|

ρ = Dichte [kg/m³]
cp = spezifische Wärmekapazität [kJ/(kg·K)]
V̇ = Volumenstrom [m³/h]
ΔT = Temperaturdifferenz [K] (Absolutwert)
```

**Stoffwerte nach fluidType:**

| fluidType | cp [kJ/(kg·K)] | ρ [kg/m³] | Faktor |
|-----------|----------------|-----------|--------|
| `water` | 4.186 | 1000 - 0.4×(T-20)* | ~1.163 |
| `glycol20` | 3.87 | 1025 | 1.102 |
| `glycol30` | 3.65 | 1040 | 1.055 |
| `glycol40` | 3.45 | 1055 | 1.011 |
| `propyleneGlycol20` | 3.95 | 1020 | 1.119 |
| `propyleneGlycol30` | 3.75 | 1030 | 1.073 |

*Wasser: Dichte temperaturabhängig (T_flow als Referenz)

---

### P_deviation_pct (number)

**Zweck:** Prozentuale Abweichung zwischen gemessener und berechneter Leistung.

| Parameter | Beschreibung |
|-----------|--------------|
| **Input** | `P_th_kW` (gemessen), `P_th_calc_kW` (berechnet) |

**Formel:**
```
P_deviation_pct = ((P_th_kW - P_th_calc_kW) / P_th_calc_kW) × 100
```

| Abweichung | Interpretation |
|------------|----------------|
| Positiv | Sensor misst mehr als Berechnung |
| Negativ | Sensor misst weniger als Berechnung |
| ~0% | Gute Übereinstimmung |

---

### P_sensor_flag (string)

**Zweck:** Kategorische Bewertung der Sensor-Abweichung.

| Parameter | Beschreibung |
|-----------|--------------|
| **Input** | `P_deviation_pct` |

**Schwellen:**

| Abweichung (abs) | P_sensor_flag | Bedeutung |
|------------------|---------------|-----------|
| < 10% | `ok` | Sensor und Berechnung stimmen überein |
| 10% – 25% | `warn` | Leichte Abweichung, prüfen |
| > 25% | `error` | Sensorfehler wahrscheinlich |

**Mögliche Ursachen für Abweichungen:**
- Falscher `fluidType` konfiguriert
- Sensorfehler (Durchfluss oder Temperatur)
- Luft im System
- Ungenauer Energiezähler

---

## 16. Calculated Fields (Asset Profile: Measurement)

Calculated Fields werden auf Asset Profile Ebene definiert und automatisch für alle Measurements ausgewertet. Sie haben Zugriff auf historische Telemetrie-Werte (Rolling Windows).

### Verfügbare Methoden

| Methode | Beschreibung |
|---------|--------------|
| `last()` | Letzter Wert im Zeitfenster |
| `first()` | Erster Wert im Zeitfenster |
| `mean()` / `avg()` | Durchschnitt |
| `min()` / `max()` | Minimum / Maximum |
| `sum()` | Summe |
| `count()` | Anzahl Werte |
| `std()` | Standardabweichung |
| `median()` | Median |

**Syntax:** `argumentName.method()` z.B. `dT_K.mean()`

### TBEL Iteration (für Custom Logik)

Für komplexe Logik wie Zustandswechsel-Zählung kann mit `foreach` über Werte iteriert werden:

```javascript
// foreach iteriert über alle Werte im Rolling Window
// Jedes Element v hat: v.ts (Timestamp), v.value (Wert)
var prevValue = null;
foreach(v: is_on) {
  if (prevValue != null && prevValue != v.value) {
    // Zustandswechsel erkannt
  }
  prevValue = v.value;
}
```

**TBEL-Besonderheiten:**
- Verwende `foreach(v: argName)` fuer Iteration
- Verwende `argName.count()` fuer Anzahl (nicht `.values.length`)
- Verwende `!=` statt `!==` (strict equality nicht unterstuetzt)
- Verwende `toInt()` fuer Integer-Konvertierung

**TBEL Boolean-Handling (KRITISCH):**

TBEL erfordert besondere Vorsicht beim Zuweisen von Booleans zu Map-Keys. Die falsche Verwendung von Ternary-Operatoren kann zu `Null key for a Map not allowed in JSON` Fehlern fuehren.

```javascript
// FALSCH - Verursacht "null key" Fehler in bestimmten Faellen:
result["is_on"] = (isOn) ? true : false;
result["flag"] = isCondition ? true : false;

// RICHTIG - Verwende if/else fuer Boolean-Zuweisungen:
if (Vdot_m3h > threshold) {
  result["is_on"] = true;
} else {
  result["is_on"] = false;
}

// RICHTIG - Falls Ternary noetig, GESAMTEN Ausdruck in Klammern:
result["is_on"] = (isOn ? true : false);  // Klammern um gesamten Ternary!

// RICHTIG - Fuer nicht-Boolean Ternary (z.B. Objekt-Auswahl):
var schedule = (isMap(weeklySchedule) ? weeklySchedule : JSON.parse(weeklySchedule));
```

**Attribut-Guards:**
Immer pruefen ob Attribute vorhanden sind, bevor sie verwendet werden:

```javascript
// Attribut mit Default-Wert absichern
var threshold = flowOnThreshold;
if (threshold == null) {
  threshold = 0.1;  // Default
}
```

---

### dT_collapse_flag (boolean)

**Zweck:** Erkennung von plötzlichem ΔT-Einbruch (Low-ΔT Syndrom).

| Parameter | Beschreibung |
|-----------|--------------|
| **Input** | `dT_K` (Rolling Window: 15 Min, max 100 Werte) |
| **Attribut** | `collapseThreshold` (Default: 0.5) |

**Logik:**
```javascript
var currentDT = dT_K.last();
var avgDT = dT_K.mean();

// Flag = true wenn aktueller dT < threshold × Durchschnitt
var collapsed = (currentDT < avgDT * collapseThreshold);
```

| Aktuell | Avg (15 Min) | Verhältnis | dT_collapse_flag |
|---------|--------------|------------|------------------|
| 12 K | 14 K | 86% | `false` |
| 6 K | 14 K | 43% | `true` |

**Robustheit:** Mindestens 3 Datenpunkte erforderlich, sonst kein Output.

---

### flow_spike_flag (boolean)

**Zweck:** Erkennung von plötzlichen Durchfluss-Spikes.

| Parameter | Beschreibung |
|-----------|--------------|
| **Input** | `Vdot_m3h` (Rolling Window: 5 Min, max 50 Werte) |
| **Attribut** | `spikeThreshold` (Default: 2.0) |

**Logik:**
```javascript
var currentFlow = Vdot_m3h.last();
var avgFlow = Vdot_m3h.mean();

// Flag = true wenn aktueller Flow > threshold × Durchschnitt
var spiked = (currentFlow > avgFlow * spikeThreshold);
```

| Aktuell | Avg (5 Min) | Verhältnis | flow_spike_flag |
|---------|-------------|------------|-----------------|
| 1.5 m³/h | 1.2 m³/h | 125% | `false` |
| 3.0 m³/h | 1.2 m³/h | 250% | `true` |

**Robustheit:** Mindestens 3 Datenpunkte erforderlich, sonst kein Output.

---

### cycling_flag (boolean) + cycle_count (number)

**Zweck:** Erkennung von Taktbetrieb (häufiges Ein/Aus).

| Parameter | Beschreibung |
|-----------|--------------|
| **Input** | `is_on` (Rolling Window: 30 Min, max 200 Werte) |
| **Attribut** | `cyclingThreshold` (Default: 5) |

**Logik:**
```javascript
// Zähle Zustandswechsel mit TBEL foreach
var transitions = 0;
var prevValue = null;
foreach(v: is_on) {
  if (prevValue != null && prevValue != v.value) {
    transitions = transitions + 1;
  }
  prevValue = v.value;
}
cycling_flag = (transitions > cyclingThreshold);
cycle_count = transitions;
```

| Wechsel in 30 Min | cycling_flag | Bedeutung |
|-------------------|--------------|-----------|
| 2 | `false` | Normal |
| 6 | `true` | Taktbetrieb |

**Ursachen:** Überdimensionierte Anlage, falscher Reglerparameter, hydraulisches Problem.

---

### power_stability (number) + power_unstable_flag (boolean)

**Zweck:** Erkennung von Leistungsschwankungen.

| Parameter | Beschreibung |
|-----------|--------------|
| **Input** | `P_th_kW` (Rolling Window: 15 Min, max 50 Werte) |
| **Attribut** | `stabilityThreshold` (Default: 0.3) |

**Logik:**
```javascript
// Variationskoeffizient (CV) = Standardabweichung / Mittelwert
power_stability = P_th_kW.std() / P_th_kW.mean();
power_unstable_flag = (power_stability > stabilityThreshold);
```

| CV-Wert | Bedeutung |
|---------|-----------|
| < 0.1 | Sehr stabil |
| 0.1 - 0.3 | Normal |
| > 0.3 | Instabil |

**Ursachen:** Schwingender Regler, Ventil-Hunting, Lastspitzen.

---

### runtime_pct (number)

**Zweck:** Laufzeitanteil in Prozent.

| Parameter | Beschreibung |
|-----------|--------------|
| **Input** | `is_on` (Rolling Window: 1 Stunde, max 200 Werte) |

**Logik:**
```javascript
// Zähle true-Werte mit TBEL foreach
var onCount = 0;
foreach(v: is_on) {
  if (v.value == true) {
    onCount = onCount + 1;
  }
}
runtime_pct = (onCount / is_on.count()) * 100;
```

| runtime_pct | Bedeutung |
|-------------|-----------|
| 100% | Dauerbetrieb |
| 50-80% | Normaler Teillastbetrieb |
| < 30% | Geringer Bedarf |

**Verwendung:** Auslastungsanalyse, Energieverbrauchsprognose.

---

## 17. Analytics-Funktionen Referenz

Mapping der Analytics-Funktionen zu benoetigten Attributen:

| Funktion | Beschreibung | Benoetigte Attribute |
|----------|--------------|---------------------|
| 4.1 | Leistungsmessung | - |
| 4.2 | Lastgangprofil | `T_outside_C` |
| 4.3 | Lastganganalyse | - |
| 4.4 | Dauerkennlinie | `weeklySchedule` |
| 4.5 | Low-DeltaT Analyse | `designDeltaT`, `flowOnThreshold` |
| 4.6 | Leistungsbedarf NAT | Project: `normOutdoorTemp`, Measurement: `designDeltaT` |
| 4.7 | Energiebedarf kWh/m2 | `area` |
| 4.8 | ROI / Business Case | `designPower` |
| 4.9 | Erzeugungsanalyse | `measurementRole`, `auxSensor1/2` |
| 4.10 | Hydraulikdiagnose | `hydraulicScheme`, `auxSensor1/2` |
| 4.11 | WRG-Zahl | (4 Sensoren erforderlich) |
| 4.12 | Ventildimension | `designFlow`, `pipeDimension`, `valveDimension`, `valveKvs` |
| 4.13 | Health Score | alle Basis-Attribute |
| 4.14 | Massnahmenliste | alle KPIs |
| 4.15 | Betriebszeiten | `weeklySchedule`, `flowOnThreshold` |
| 4.16 | Anomalie-Erkennung | alle Telemetrie |
| 4.17 | Portfolio-Aggregation | alle KPIs |
