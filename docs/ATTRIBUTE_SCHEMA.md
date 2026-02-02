# ECO Smart Diagnostics - Attribut- und Telemetrie-Schema

> Referenz für alle Entity-Attribute und Telemetrie-Keys.
> Stand: Februar 2026

---

## 1. Naming Convention

| Typ | Konvention | Beispiele |
|-----|------------|-----------|
| **Attribute** | camelCase | `designFlowTemp`, `systemType`, `pumpRatedPower` |
| **Telemetrie** | snake_case + Einheit | `T_flow_C`, `P_th_kW`, `dT_K` |
| **Derived Telemetrie** | snake_case | `is_on`, `load_class`, `dT_flag` |

---

## 2. Änderungen gegenüber Ist-Zustand

### Umbenennungen

| Alt | Neu | Grund |
|-----|-----|-------|
| `installationTypeOptions` | `systemType` | Klarere Semantik |
| `sensorLabel1` | `auxSensor1` | JSON-Struktur mit location |
| `sensorLabel2` | `auxSensor2` | JSON-Struktur mit location |
| `dimension` | `pipeDimension` | Klarere Semantik |

### Entfernte Attribute (Measurement)

| Attribut | Grund | Migration |
|----------|-------|-----------|
| `locationName` | Redundant | → Entity Label kopieren |
| `address` | Standort ist im Project | - |
| `latitude` | Standort ist im Project | - |
| `longitude` | Standort ist im Project | - |
| `deltaT` | Ersetzt durch `designDeltaT` | → `designDeltaT` kopieren |
| `deltaTAnalysisFloorVolume` | Ersetzt durch `flowOnThreshold` | → `flowOnThreshold` kopieren |
| `deltaTAnalysisPumpEnergy` | Nicht mehr benötigt | - |
| `loadCourseFilterMaxPower` | Nicht mehr benötigt | - |
| `loadCourseFilterTemperature` | Nicht mehr benötigt | - |
| `loadCourseFilterTemperatureValue` | Nicht mehr benötigt | - |
| `nominalFlow` | Ersetzt durch `designFlow` | → `designFlow` prüfen |
| `standardOutsideTemperature` | → Project Level | → Project `normOutdoorTemp` |

**WICHTIG - Migration locationName:**
```
Vor dem Entfernen von locationName:
1. Alle Measurements mit locationName abfragen
2. locationName → Entity Label (name) kopieren
3. Erst dann Attribut entfernen
```

### Neue Attribute

| Attribut | Kategorie |
|----------|-----------|
| `systemType` | Klassifikation |
| `measurementRole` | Hydraulik |
| `hydraulicScheme` | Hydraulik |
| `fluidType` | Hydraulik |
| `designFlowTemp` | Auslegung |
| `designReturnTemp` | Auslegung |
| `designDeltaT` | Auslegung |
| `designPower` | Auslegung |
| `designFlow` | Auslegung |
| `flowOnThreshold` | Betrieb |
| `hysteresisMinutes` | Betrieb |
| `pumpPresent` | Pumpe |
| `pumpControlType` | Pumpe |
| `pumpRatedPower` | Pumpe |
| `auxSensor1` | Sensoren |
| `auxSensor2` | Sensoren |
| `pipeDimension` | Rohr & Ventil |
| `valveDimension` | Rohr & Ventil |
| `valveKvs` | Rohr & Ventil |
| `normOutdoorTemp` | Project (Klima) |
| `normOutdoorTempCalculated` | Project (Klima) |

---

## 3. Customer Attribute

Keine Änderungen.

| Attribut | Typ | Beschreibung |
|----------|-----|--------------|
| `name` | string | Kundenname |

---

## 4. Project Attribute (Asset)

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

## 5. Measurement Attribute (Asset)

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
| `fanCoil` | Gebläsekonvektor | 6 K |
| `ahuCoil` | RLT-Register | 20 K (H) / 5 K (K) |
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
| `pipeDimension` | string | `DN20`, `DN25`, `DN32`, `DN40`, `DN50`, `DN65`, `DN80`, `DN100` | Rohrdimension (P-Flow Sensor) |
| `valveDimension` | string | `DN15`, `DN20`, `DN25`, `DN32`, `DN40`, `DN50`, `DN65`, `DN80`, `DN100` | Ventildimension (Regelventil) |
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
| `weeklySchedule` | object | - | - | Soll-Betriebstage `{monday: true, ...}` |

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

## 7. Diagnostickit Attribute (Asset)

**Asset Profile:** `Diagnostickit`

| Attribut | Typ | Werte | Beschreibung |
|----------|-----|-------|--------------|
| `kitType` | string | `basis`, `loraWan`, `extension` | Kit-Typ |
| `subscriptionStatus` | string | `no subscription`, `active` | Abo-Status |

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
| `data_quality` | string | `ok`, `warn`, `error` | Datenqualität |

---

## 9. Migration

### 9.1 Attribut-Migration (Measurement)

**Schritt 1: Daten kopieren**

| Alt | Neu | Aktion |
|-----|-----|--------|
| `locationName` | Entity Label | `measurement.name = locationName` |
| `installationTypeOptions` | `systemType` | Wert kopieren |
| `deltaT` | `designDeltaT` | Wert kopieren |
| `deltaTAnalysisFloorVolume` | `flowOnThreshold` | Wert kopieren |
| `sensorLabel1` | `auxSensor1` | `{label: sensorLabel1, location: "custom"}` |
| `sensorLabel2` | `auxSensor2` | `{label: sensorLabel2, location: "custom"}` |
| `dimension` | `pipeDimension` | Wert kopieren |
| `nominalFlow` | `designFlow` | Wert kopieren (falls designFlow leer) |
| `standardOutsideTemperature` | Project `normOutdoorTemp` | Wert zum Project kopieren |

**Schritt 2: Alte Attribute entfernen**

```
locationName, address, latitude, longitude,
installationTypeOptions, deltaT, deltaTAnalysisFloorVolume,
deltaTAnalysisPumpEnergy, loadCourseFilterMaxPower,
loadCourseFilterTemperature, loadCourseFilterTemperatureValue,
sensorLabel1, sensorLabel2, standardOutsideTemperature,
dimension, nominalFlow
```

### 9.2 Telemetrie-Migration

| Alt (CHC-Prefix) | Neu |
|------------------|-----|
| `CHC_S_TemperatureFlow` | `T_flow_C` |
| `CHC_S_TemperatureReturn` | `T_return_C` |
| `CHC_S_TemperatureDiff` | `dT_K` |
| `CHC_S_VolumeFlow` | `Vdot_m3h` |
| `CHC_S_Velocity` | `v_ms` |
| `CHC_S_Power_Heating` | `P_th_kW` |
| `CHC_S_Power_Cooling` | `P_th_kW` |
| `CHC_M_Energy_Heating` | `E_th_kWh` |
| `CHC_M_Energy_Cooling` | `E_th_kWh` |
| `CHC_M_Volume` | `V_m3` |
| `outsideTemp` | `T_outside_C` |
| `outsideHumidity` | `RH_outside_pct` |

### 9.3 Migrations-Script (Pseudo-Code)

```javascript
// Für jedes Measurement
for (const measurement of measurements) {
  const attrs = await getAttributes(measurement.id);

  // 1. locationName → Entity Label
  if (attrs.locationName) {
    await renameEntity(measurement.id, attrs.locationName);
  }

  // 2. Attribute umbenennen
  const newAttrs = {};
  if (attrs.installationTypeOptions) newAttrs.systemType = attrs.installationTypeOptions;
  if (attrs.deltaT) newAttrs.designDeltaT = attrs.deltaT;
  if (attrs.deltaTAnalysisFloorVolume) newAttrs.flowOnThreshold = attrs.deltaTAnalysisFloorVolume;
  if (attrs.dimension) newAttrs.pipeDimension = attrs.dimension;
  if (attrs.nominalFlow && !attrs.designFlow) newAttrs.designFlow = attrs.nominalFlow;

  // standardOutsideTemperature → Project Level (separate Migration)

  // 3. sensorLabel → auxSensor (JSON)
  if (attrs.sensorLabel1) {
    newAttrs.auxSensor1 = { label: attrs.sensorLabel1, location: 'custom' };
  }
  if (attrs.sensorLabel2) {
    newAttrs.auxSensor2 = { label: attrs.sensorLabel2, location: 'custom' };
  }

  // 4. Neue Attribute speichern
  await saveAttributes(measurement.id, newAttrs);

  // 5. Alte Attribute entfernen
  await deleteAttributes(measurement.id, [
    'locationName', 'address', 'latitude', 'longitude',
    'installationTypeOptions', 'deltaT', 'deltaTAnalysisFloorVolume',
    'deltaTAnalysisPumpEnergy', 'loadCourseFilterMaxPower',
    'loadCourseFilterTemperature', 'loadCourseFilterTemperatureValue',
    'sensorLabel1', 'sensorLabel2', 'standardOutsideTemperature',
    'dimension', 'nominalFlow'
  ]);
}
```

---

## 10. Default-Werte nach systemType

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

## 11. Analytics-Funktionen Referenz

| Funktion | Beschreibung | Benötigte Attribute |
|----------|--------------|---------------------|
| 4.1 | Leistungsmessung | - |
| 4.2 | Lastgangprofil | `T_outside_C` |
| 4.3 | Lastganganalyse | - |
| 4.4 | Dauerkennlinie | `weeklySchedule` |
| 4.5 | **Low-ΔT Analyse** | `designDeltaT`, `flowOnThreshold` |
| 4.6 | Leistungsbedarf NAT | Project: `normOutdoorTemp`, Measurement: `designDeltaT` |
| 4.7 | Energiebedarf kWh/m² | `area` |
| 4.8 | ROI / Business Case | `designPower` |
| 4.9 | Erzeugungsanalyse | `measurementRole`, `auxSensor1/2` |
| 4.10 | Hydraulikdiagnose | `hydraulicScheme`, `auxSensor1/2` |
| 4.11 | WRG-Zahl | (4 Sensoren erforderlich) |
| 4.12 | Ventildimension | `designFlow`, `pipeDimension`, `valveDimension`, `valveKvs` |
| 4.13 | Health Score | alle Basis-Attribute |
| 4.14 | Maßnahmenliste | alle KPIs |
| 4.15 | Betriebszeiten | `weeklySchedule`, `flowOnThreshold` |
| 4.16 | Anomalie-Erkennung | alle Telemetrie |
| 4.17 | Portfolio-Aggregation | alle KPIs |
