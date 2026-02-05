# External Project API - Rule Chain Integration

## Overview

Diese Rule Chains ermöglichen externen Diensten, Projekte und Measurements über die ThingsBoard API zu erstellen und zu aktualisieren.

## JSON Schema

### createProject (an Customer senden)

```json
{
  "createProject": {
    "projectName": "Hauptgebäude Wien",
    "address": "Hauptstrasse 1",
    "postalCode": "1010",
    "city": "Wien",
    "country": "AT",
    "latitude": 48.2082,
    "longitude": 16.3738,
    "normOutdoorTemp": -12,
    "units": "metric",
    "area": {"value": 2500, "unit": "m^2"},
    "measurements": [
      {
        "measurementName": "Heizkreis Nord",
        "installationType": "heating",
        "systemType": "radiator",
        "measurementType": "ultrasonic",
        "measurementRole": "circuit",
        "hydraulicScheme": "mixingValve",
        "fluidType": "water",
        "designFlowTemp": 70,
        "designReturnTemp": 55,
        "designDeltaT": 15,
        "designPower": 100,
        "designFlow": 5.5,
        "pipeDimension": "DN50",
        "valveDimension": "DN40",
        "valveKvs": 25,
        "flowOnThreshold": 0.05,
        "hysteresisMinutes": 3,
        "weeklySchedule": {
          "timezoneOffset": 60,
          "monday": {"enabled": true, "start": "06:00", "end": "22:00"},
          "tuesday": {"enabled": true, "start": "06:00", "end": "22:00"},
          "wednesday": {"enabled": true, "start": "06:00", "end": "22:00"},
          "thursday": {"enabled": true, "start": "06:00", "end": "22:00"},
          "friday": {"enabled": true, "start": "06:00", "end": "22:00"},
          "saturday": {"enabled": false},
          "sunday": {"enabled": false}
        },
        "collapseThreshold": 0.5,
        "spikeThreshold": 2.0,
        "cyclingThreshold": 5,
        "stabilityThreshold": 0.3,
        "pumpPresent": true,
        "pumpControlType": "variable",
        "pumpRatedPower": 2.5,
        "auxSensor1": {"label": "Nach Mischer", "location": "mixerPortB"},
        "auxSensor2": null,
        "calculatePower": false
      }
    ]
  }
}
```

### updateProject (an Project Asset senden)

```json
{
  "updateProject": {
    "projectName": "Neuer Name",
    "address": "Neue Adresse 1",
    "normOutdoorTemp": -14,
    "progress": "active",
    "measurements": [
      {
        "measurementId": "abc123-...",
        "measurementName": "Neuer Name",
        "designPower": 120,
        "progress": "active"
      }
    ]
  }
}
```

## API Aufrufe

### Projekt erstellen

```bash
# Customer ID ermitteln
CUSTOMER_ID="your-customer-id"

# Attribut setzen (triggert Rule Chain)
curl -X POST "https://diagnostics.ecoenergygroup.com/api/plugins/telemetry/CUSTOMER/${CUSTOMER_ID}/attributes/SERVER_SCOPE" \
  -H "Content-Type: application/json" \
  -H "X-Authorization: Bearer ${JWT_TOKEN}" \
  -d '{
    "createProject": {
      "projectName": "Test Projekt",
      "address": "Teststrasse 1",
      "postalCode": "1010",
      "city": "Wien",
      "latitude": 48.2082,
      "longitude": 16.3738,
      "measurements": []
    }
  }'
```

### Projekt aktualisieren

```bash
# Project Asset ID ermitteln
PROJECT_ID="your-project-asset-id"

# Attribut setzen (triggert Rule Chain)
curl -X POST "https://diagnostics.ecoenergygroup.com/api/plugins/telemetry/ASSET/${PROJECT_ID}/attributes/SERVER_SCOPE" \
  -H "Content-Type: application/json" \
  -H "X-Authorization: Bearer ${JWT_TOKEN}" \
  -d '{
    "updateProject": {
      "progress": "active",
      "normOutdoorTemp": -14
    }
  }'
```

## Root Rule Chain Konfiguration

### Schritt 1: Rule Chain IDs ermitteln

Nach dem Import der Rule Chains in ThingsBoard, notiere die IDs:
- Create Project Rule Chain ID: `_______________`
- Update Project Rule Chain ID: `_______________`

### Schritt 2: Root Rule Chain anpassen

1. Öffne die **Root Rule Chain** im ThingsBoard UI
2. Füge einen neuen **JS Switch Node** hinzu:
   - Name: "Check External API"
   - Script:
   ```javascript
   if (msg.createProject != null) {
       return ['createProject'];
   } else if (msg.updateProject != null) {
       return ['updateProject'];
   } else {
       return ['other'];
   }
   ```

3. Füge zwei **Rule Chain Input Nodes** hinzu:
   - Name: "Create Project"
   - Rule Chain ID: [Create Project Rule Chain ID]

   - Name: "Update Project"
   - Rule Chain ID: [Update Project Rule Chain ID]

4. Verbinde die Nodes:
   - Message Type Switch → (Attributes Updated) → Check External API
   - Message Type Switch → (Post attributes) → Check External API
   - Check External API → (createProject) → Create Project
   - Check External API → (updateProject) → Update Project

### Alternative: Originator Type Filter

Falls nur Customer Messages für createProject und Asset Messages für updateProject erlaubt sein sollen:

```
Message Type Switch → Attributes Updated → Originator Type Switch
                                              ↓
                            Customer → Check createProject → Create Project Rule Chain
                            Asset    → Check updateProject → Update Project Rule Chain
```

## Voraussetzungen

### Entity Groups müssen existieren

Für jeden Customer müssen folgende Asset Entity Groups existieren:
- **Projects** - für Project Assets
- **Measurements** - für Measurement Assets

Diese werden normalerweise beim ersten manuellen Projekt automatisch erstellt.

### Customer Attribute

Der Customer sollte das Attribut `shortName` haben (z.B. "PKE"), das für die Generierung des Project-Namens verwendet wird (z.B. "PKE_P-0023").

## Generierte Entity Names

- **Project**: `{customerShortName}_P-{nextNumber}` (z.B. "PKE_P-0023")
- **Measurement**: `{projectEntityName}_M-{index}` (z.B. "PKE_P-0023_M-01")

## Attribute Referenz

### Project Attribute (automatisch gesetzt)

| Attribut | Typ | Default | Beschreibung |
|----------|-----|---------|--------------|
| progress | string | "in preparation" | Projektphase |
| state | string | "normal" | Alarm-Status |
| address | string | - | Standortadresse |
| postalCode | string | - | Postleitzahl |
| city | string | - | Stadt |
| country | string | - | Land |
| latitude | number | - | Breitengrad |
| longitude | number | - | Längengrad |
| normOutdoorTemp | number | - | Norm-Außentemperatur |
| units | string | "metric" | Einheitensystem |
| area | object | - | `{"value": 2500, "unit": "m^2"}` |

### Measurement Attribute (automatisch gesetzt)

| Attribut | Typ | Default | Beschreibung |
|----------|-----|---------|--------------|
| progress | string | "in preparation" | Messphase |
| state | string | "normal" | Alarm-Status |
| installationType | string | - | heating/cooling |
| systemType | string | - | radiator, floorHeating, etc. |
| measurementType | string | - | ultrasonic, interpolation, import |
| measurementRole | string | - | generator, circuit, subDistribution |
| hydraulicScheme | string | - | direct, mixingValve, etc. |
| fluidType | string | - | water, glycol20, glycol30 |
| designFlowTemp | number | - | Auslegungs-VL-Temp |
| designReturnTemp | number | - | Auslegungs-RL-Temp |
| designDeltaT | number | - | Auslegungs-DeltaT |
| designPower | number | - | Auslegungsleistung kW |
| designFlow | number | - | Auslegungs-Flow m³/h |
| pipeDimension | string | - | DN20-DN100 (P-Flow) |
| valveDimension | string | - | DN15-DN100 (Ventil) |
| valveKvs | number | - | Kvs-Wert m³/h |
| flowOnThreshold | number | 0.05 | ON-Schwelle m³/h |
| hysteresisMinutes | number | 3 | Hysterese ON/OFF min |
| weeklySchedule | object | - | Soll-Betriebszeiten (JSON) |
| collapseThreshold | number | 0.5 | dT_collapse_flag Schwelle |
| spikeThreshold | number | 2.0 | flow_spike_flag Schwelle |
| cyclingThreshold | number | 5 | cycling_flag Schwelle |
| stabilityThreshold | number | 0.3 | power_unstable_flag Schwelle |
| pumpPresent | boolean | false | Pumpe vorhanden? |
| pumpControlType | string | - | constant, variable, unknown |
| pumpRatedPower | number | - | Pumpen-Nennleistung kW |
| auxSensor1 | object | - | `{"label": "...", "location": "..."}` |
| auxSensor2 | object | - | `{"label": "...", "location": "..."}` |
| calculatePower | boolean | false | Leistung berechnen |

## Relationen

Die Rule Chains erstellen automatisch folgende Relationen:

- **Customer → Project**: Type "Owns"
- **Project → Measurement**: Type "Owns"

## Debug Mode

Beide Rule Chains haben `debugMode: true`. Nach erfolgreicher Implementierung auf `false` setzen:

```json
"debugMode": false
```

## Fehlerbehandlung

Bei Fehlern werden Log-Einträge erstellt. Prüfe:
1. Rule Chain → Node → Events Tab → Debug
2. Häufige Fehler:
   - Entity Group "Projects" oder "Measurements" existiert nicht
   - Customer hat kein `shortName` Attribut
   - JSON Format ist ungültig
