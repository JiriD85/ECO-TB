# ECO External API - JSON Schema Dokumentation

> Spezifikation der JSON-Formate fuer die externe Projekt-/Measurement-Erstellung via ThingsBoard API

## 1. createProject JSON Schema

Wird als `createProject` Attribut an einen **Customer** gesendet.

### Vollstaendiges Beispiel

```json
{
  "createProject": {
    "projectName": "Hauptgebaeude Wien",
    "address": "Hauptstrasse 1",
    "postalCode": "1010",
    "city": "Wien",
    "country": "AT",
    "latitude": 48.2082,
    "longitude": 16.3738,
    "normOutdoorTemp": -12,
    "units": "metric",
    "area": {
      "value": 2500,
      "unit": "m^2"
    },
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
          "saturday": {"enabled": false, "start": "00:00", "end": "00:00"},
          "sunday": {"enabled": false, "start": "00:00", "end": "00:00"}
        },
        "collapseThreshold": 0.5,
        "spikeThreshold": 2.0,
        "cyclingThreshold": 5,
        "stabilityThreshold": 0.3,
        "pumpPresent": true,
        "pumpControlType": "variable",
        "pumpRatedPower": 2.5,
        "auxSensor1": {
          "label": "Nach Mischer",
          "location": "mixerPortB"
        },
        "auxSensor2": null,
        "calculatePower": false
      }
    ]
  }
}
```

### Minimales Beispiel (nur Pflichtfelder)

```json
{
  "createProject": {
    "projectName": "Testprojekt",
    "address": "Teststrasse 1",
    "postalCode": "1010",
    "city": "Wien",
    "latitude": 48.2,
    "longitude": 16.3,
    "measurements": []
  }
}
```

### Project Attribute

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `projectName` | string | Ja | Anzeigename (wird entityLabel) |
| `address` | string | Ja | Standortadresse |
| `postalCode` | string | Ja | Postleitzahl |
| `city` | string | Ja | Stadt |
| `country` | string | Nein | Laendercode (z.B. "AT", "DE") |
| `latitude` | number | Ja | Breitengrad |
| `longitude` | number | Ja | Laengengrad |
| `normOutdoorTemp` | number | Nein | Norm-Aussentemperatur in °C |
| `units` | string | Nein | Einheitensystem ("metric") |
| `area` | object | Nein | Gebaeude-/Projektflaeche |
| `measurements` | array | Ja | Array von Measurement-Objekten |

### area Format

```json
{
  "value": 2500,
  "unit": "m^2"
}
```

---

## 2. updateProject JSON Schema

Wird als `updateProject` Attribut an ein **Project Asset** gesendet.

### Vollstaendiges Beispiel

```json
{
  "updateProject": {
    "projectName": "Neuer Projektname",
    "address": "Neue Adresse 1",
    "postalCode": "1020",
    "city": "Wien",
    "country": "AT",
    "latitude": 48.21,
    "longitude": 16.38,
    "normOutdoorTemp": -14,
    "units": "metric",
    "area": {
      "value": 3000,
      "unit": "m^2"
    },
    "progress": "active",
    "measurements": [
      {
        "measurementId": "abc123-def456-...",
        "measurementName": "Neuer Messungsname",
        "designPower": 120,
        "progress": "active"
      }
    ]
  }
}
```

### Minimales Beispiel (nur ein Feld aendern)

```json
{
  "updateProject": {
    "progress": "active"
  }
}
```

### Measurement Update mit ID

```json
{
  "updateProject": {
    "measurements": [
      {
        "measurementId": "abc123-def456-789",
        "designPower": 150,
        "designDeltaT": 12
      }
    ]
  }
}
```

**WICHTIG:** Bei Measurement-Updates muss die `measurementId` angegeben werden!

---

## 3. Measurement Attribute (vollstaendig)

| Feld | Typ | Werte | Beschreibung |
|------|-----|-------|--------------|
| `measurementName` | string | - | Anzeigename (wird entityLabel) |
| `installationType` | string | `heating`, `cooling` | Heiz- oder Kuehlkreis |
| `systemType` | string | siehe unten | Art des Systems |
| `measurementType` | string | `ultrasonic`, `interpolation`, `import` | Datenquelle |
| `measurementRole` | string | `generator`, `circuit`, `subDistribution` | Rolle im System |
| `hydraulicScheme` | string | siehe unten | Hydraulisches Schema |
| `fluidType` | string | `water`, `glycol20`, `glycol30`, `glycol40` | Medium |
| `designFlowTemp` | number | °C | Auslegungs-Vorlauftemperatur |
| `designReturnTemp` | number | °C | Auslegungs-Ruecklauftemperatur |
| `designDeltaT` | number | K | Auslegungs-Temperaturdifferenz |
| `designPower` | number | kW | Auslegungsleistung |
| `designFlow` | number | m³/h | Auslegungs-Volumenstrom |
| `pipeDimension` | string | `DN20`-`DN100` | Rohrdimension (P-Flow) |
| `valveDimension` | string | `DN15`-`DN100` | Ventildimension |
| `valveKvs` | number | m³/h | Kvs-Wert des Regelventils |
| `flowOnThreshold` | number | m³/h | ON-Schwelle (Default: 0.05) |
| `hysteresisMinutes` | number | min | Hysterese ON/OFF (Default: 3) |
| `weeklySchedule` | object | - | Soll-Betriebszeiten |
| `collapseThreshold` | number | ratio | dT_collapse Schwelle (Default: 0.5) |
| `spikeThreshold` | number | ratio | flow_spike Schwelle (Default: 2.0) |
| `cyclingThreshold` | number | count | cycling Schwelle (Default: 5) |
| `stabilityThreshold` | number | ratio | power_unstable Schwelle (Default: 0.3) |
| `pumpPresent` | boolean | - | Pumpe vorhanden? |
| `pumpControlType` | string | `constant`, `variable`, `unknown` | Pumpen-Regelungsart |
| `pumpRatedPower` | number | kW | Pumpen-Nennleistung |
| `auxSensor1` | object | - | Hilfssensor 1 Konfiguration |
| `auxSensor2` | object | - | Hilfssensor 2 Konfiguration |
| `calculatePower` | boolean | - | Leistung aus ΔT berechnen? |

### systemType Werte

| Wert | Deutsch | Typisches ΔT |
|------|---------|--------------|
| `radiator` | Heizkoerper | 15 K |
| `floorHeating` | Fussbodenheizung | 7 K |
| `fanCoil` | Geblaesekonvektor | 6-10 K |
| `ahuCoil` | RLT-Register | 5-20 K |
| `districtHeating` | Fernwaerme | 25 K |
| `chiller` | Kaeltemaschine | 5 K |

### hydraulicScheme Werte

| Wert | Beschreibung |
|------|--------------|
| `direct` | Direktanschluss |
| `mixingValve` | Mischerregelung |
| `injection` | Einspritzschaltung |
| `separator` | Hydraulische Weiche |
| `buffer` | Pufferspeicher |

### auxSensor Format

```json
{
  "label": "Nach Mischer",
  "location": "mixerPortB"
}
```

**location Werte:**
- `mixerPortA` - Mischer Eingang A
- `mixerPortB` - Mischer Ausgang B
- `afterSeparator` - Nach hydraulischer Weiche
- `beforeSeparator` - Vor hydraulischer Weiche
- `secondaryFlow` - Sekundaerkreis Vorlauf
- `secondaryReturn` - Sekundaerkreis Ruecklauf
- `bufferTop` - Pufferspeicher oben
- `bufferBottom` - Pufferspeicher unten
- `custom` - Benutzerdefiniert

### weeklySchedule Format

**Einfach (nur Tage aktivieren):**
```json
{
  "monday": true,
  "tuesday": true,
  "wednesday": true,
  "thursday": true,
  "friday": true,
  "saturday": false,
  "sunday": false
}
```

**Vollstaendig (mit Zeitfenstern):**
```json
{
  "timezoneOffset": 60,
  "monday": {"enabled": true, "start": "06:00", "end": "22:00"},
  "tuesday": {"enabled": true, "start": "06:00", "end": "22:00"},
  "wednesday": {"enabled": true, "start": "06:00", "end": "22:00"},
  "thursday": {"enabled": true, "start": "06:00", "end": "22:00"},
  "friday": {"enabled": true, "start": "06:00", "end": "22:00"},
  "saturday": {"enabled": false, "start": "00:00", "end": "00:00"},
  "sunday": {"enabled": false, "start": "00:00", "end": "00:00"}
}
```

| Feld | Beschreibung |
|------|--------------|
| `timezoneOffset` | Minuten von UTC (60 = CET, 120 = CEST) |
| `enabled` | Tag aktiviert? |
| `start` | Startzeit "HH:MM" |
| `end` | Endzeit "HH:MM" |

---

## 4. API Aufruf Beispiele

### Projekt erstellen

```bash
# 1. Login
TOKEN=$(curl -s -X POST "https://diagnostics.ecoenergygroup.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "user@example.com", "password": "..."}' \
  | jq -r '.token')

# 2. Customer ID ermitteln (falls nicht bekannt)
CUSTOMER_ID="abc123-..."

# 3. createProject Attribut setzen
curl -X POST "https://diagnostics.ecoenergygroup.com/api/plugins/telemetry/CUSTOMER/${CUSTOMER_ID}/attributes/SERVER_SCOPE" \
  -H "Content-Type: application/json" \
  -H "X-Authorization: Bearer $TOKEN" \
  -d '{
    "createProject": {
      "projectName": "Neues Projekt",
      "address": "Teststrasse 1",
      "postalCode": "1010",
      "city": "Wien",
      "latitude": 48.2,
      "longitude": 16.3,
      "measurements": []
    }
  }'
```

### Projekt aktualisieren

```bash
# Project Asset ID ermitteln
PROJECT_ID="def456-..."

# updateProject Attribut setzen
curl -X POST "https://diagnostics.ecoenergygroup.com/api/plugins/telemetry/ASSET/${PROJECT_ID}/attributes/SERVER_SCOPE" \
  -H "Content-Type: application/json" \
  -H "X-Authorization: Bearer $TOKEN" \
  -d '{
    "updateProject": {
      "progress": "active",
      "normOutdoorTemp": -14
    }
  }'
```

---

## 5. Automatisch gesetzte Attribute

Diese Attribute werden von der Rule Chain automatisch gesetzt:

### Project

| Attribut | Wert | Beschreibung |
|----------|------|--------------|
| `progress` | `"in preparation"` | Initial-Status |
| `state` | `"normal"` | Alarm-Status |

### Measurement

| Attribut | Wert | Beschreibung |
|----------|------|--------------|
| `progress` | `"in preparation"` | Initial-Status |
| `state` | `"normal"` | Alarm-Status |

---

## 6. Generierte Entity Names

Die Rule Chains generieren automatisch eindeutige Namen:

### Project entityName

Format: `{customerShortName}_P-{nextNumber}`

Beispiele:
- `PKE_P-0001`
- `PKE_P-0023`
- `WIE_P-0001`

Der `customerShortName` wird aus dem Customer Server-Scope Attribut `shortName` gelesen. Falls nicht vorhanden, wird `PRJ` verwendet.

### Measurement entityName

Format: `{projectEntityName}_M-{index}`

Beispiele:
- `PKE_P-0023_M-01`
- `PKE_P-0023_M-02`
- `PKE_P-0023_M-03`

---

## 7. Voraussetzungen

### Entity Groups

Fuer jeden Customer muessen diese Asset Entity Groups existieren:
- **Projects** - fuer Project Assets
- **Measurements** - fuer Measurement Assets

Diese werden normalerweise beim ersten manuellen Projekt automatisch erstellt.

### Customer Attribute

| Attribut | Typ | Beschreibung |
|----------|-----|--------------|
| `shortName` | string | Kurzname fuer entityName-Generierung (z.B. "PKE") |

---

## 8. Relationen

Die Rule Chains erstellen automatisch:

| Von | Zu | Relation Type | Type Group |
|-----|-----|---------------|------------|
| Customer | Project | `Owns` | COMMON |
| Project | Measurement | `Owns` | COMMON |