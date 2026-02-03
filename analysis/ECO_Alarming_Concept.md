# ECO Smart Diagnostics - Alarming Konzept

> Dokumentation der Alarm-Architektur und Propagation
> Stand: Februar 2026

---

## 1. Übersicht

Das Alarming-System besteht aus drei Komponenten:

| Komponente | Funktion |
|------------|----------|
| **Measurement Rule Chain** | Erstellt Alarme aus Calculated Field Flags |
| **EM Alarm Handler** | Zentrale Alarm-Verarbeitung und Propagation |
| **Inactivity Alarm Handler** | Device Inaktivitäts-Alarme |

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Alarm-Architektur                                │
└─────────────────────────────────────────────────────────────────────────┘

  Measurement Telemetry              Device Telemetry
  (Calculated Fields)                (Sensor Data)
         │                                  │
         ▼                                  ▼
┌─────────────────┐              ┌─────────────────────┐
│  Measurement    │              │   EM Alarm Handler  │
│  Rule Chain     │              │                     │
│                 │              │  ┌───────────────┐  │
│  Check Flags    │              │  │ Check Active  │  │
│       │         │              │  │ Measurement   │  │
│       ▼         │              │  └───────┬───────┘  │
│  Create/Clear   │              │          │          │
│  Alarm          │              │          ▼          │
└────────┬────────┘              │  ┌───────────────┐  │
         │                       │  │ Device Profile│  │
         │                       │  │ Alarm Rules   │  │
         │                       │  └───────┬───────┘  │
         │                       │          │          │
         └───────────┬───────────┼──────────┘          │
                     │           │                     │
                     ▼           │                     │
              ┌─────────────┐    │                     │
              │ Alarms Count│◄───┘                     │
              └──────┬──────┘                          │
                     │                                 │
                     ▼                                 │
              ┌─────────────┐                          │
              │ State Update│                          │
              │ + Propagate │                          │
              └─────────────┘                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Alarm-Typen

### 2.1 Measurement Alarme (Calculated Fields)

Alarme werden aus Calculated Field Flags erstellt:

| Flag | Alarm Type | Severity | Beschreibung |
|------|------------|----------|--------------|
| `dT_collapse_flag` | `dT_Collapse` | MINOR | Low-ΔT Syndrom erkannt |
| `cycling_flag` | `Cycling` | MINOR | Taktbetrieb erkannt |
| `flow_spike_flag` | `Flow_Spike` | MINOR | Durchfluss-Spike erkannt |
| `power_unstable_flag` | `Power_Unstable` | MINOR | Instabile Leistung (hohe Variabilität) |
| `oscillation_flag` | `Oscillation` | MINOR | Schwingen/Oszillation erkannt |

**Alarm Details Beispiele:**

```json
// Cycling Alarm
{
  "message": "Taktbetrieb erkannt",
  "flag": "cycling_flag",
  "timestamp": "2026-02-03T18:15:00.000Z",
  "cycle_count": 8
}

// Oscillation Alarm
{
  "message": "Oszillation/Schwingen erkannt",
  "flag": "oscillation_flag",
  "timestamp": "2026-02-03T18:15:00.000Z",
  "oscillation_count": 12,
  "current_power_kW": 28.5
}
```

### Power Stability vs. Oscillation Detection

| Metrik | Formel | Erkennt | Typische Ursache |
|--------|--------|---------|------------------|
| `power_stability` | CV = std / mean | Allgemeine Variabilität | Unruhiger Betrieb, Lastschwankungen |
| `oscillation_detection` | Richtungswechsel zählen | Periodisches Schwingen | Ventil-Hunting, Regler-Oszillation |

**Wichtig:** Beide Metriken prüfen nur bei:
- Stabilem Betrieb (`runtime_pct ≥ 80%`)
- Relevanter Last (`avgPower ≥ 1 kW`)

### 2.2 Device Alarme (Device Profile Rules)

Definiert im Device Profile (z.B. P-Flow D116, RESI):

| Alarm Type | Trigger | Severity |
|------------|---------|----------|
| `Inactivity` | Keine Daten seit X Stunden | MAJOR |
| `High Temperature` | T > Schwelle | WARNING |
| `Sensor Error` | Ungültige Werte | CRITICAL |

**Wichtig:** Device Alarme werden nur verarbeitet wenn:
- Device hat Relation zu einem Measurement
- Measurement hat `progress = 'active'`

---

## 3. Rule Chain: Measurement

**Zweck:** Erstellt Alarme aus Calculated Field Telemetrie

**Asset Profile:** Measurement

### Flow

```
Input ──► Device Profile Node ──► Message Type Switch
                                        │
                                        ├── Post telemetry ──► Save Timeseries
                                        │                            │
                                        │   ┌────────────────────────┼────────────────────────┐
                                        │   │                        │                        │
                                        │   ▼                        ▼                        ▼
                                        │ Check dT            Check Cycling           Check Flow
                                        │ Collapse                  │                   Spike
                                        │   │                       │                        │
                                        │   ├─[create]──►Create     ├─[create]──►Create     ...
                                        │   │            Alarm      │            Alarm
                                        │   │              │        │              │
                                        │   ├─[clear]───►Clear      ├─[clear]───►Clear
                                        │   │            Alarm      │            Alarm
                                        │   │              │        │              │
                                        │   └──────────────┼────────┴──────────────┘
                                        │                  │
                                        │                  ▼
                                        │           EM Alarm Handler
                                        │
                                        └── Post attributes ──► Save Client Attributes
```

### Check Flag Nodes (TbJsSwitchNode)

```javascript
// TBEL Script
if (msg.dT_collapse_flag == null) {
  return ['skip'];
} else if (msg.dT_collapse_flag == true) {
  return ['create'];
} else {
  return ['clear'];
}
```

### Create Alarm Node (TbCreateAlarmNode)

```json
{
  "alarmType": "dT_Collapse",
  "severity": "MINOR",
  "propagate": true,
  "propagateToOwner": true,
  "propagateToTenant": false,
  "overwriteAlarmDetails": true,
  "scriptLang": "TBEL",
  "alarmDetailsBuildTbel": "var details = {}; ..."
}
```

**Alarm Details Script:**
```javascript
var details = {};
if (metadata.prevAlarmDetails != null) {
  details = JSON.parse(metadata.prevAlarmDetails);
  metadata.remove('prevAlarmDetails');
}

details.message = 'Taktbetrieb erkannt';
details.flag = 'cycling_flag';
details.timestamp = new Date().toISOString();

if (msg.cycle_count != null) {
  details.cycle_count = msg.cycle_count;
}

return JSON.stringify(details);
```

---

## 4. Rule Chain: EM Alarm Handler

**Zweck:** Zentrale Alarm-Verarbeitung, State Updates, Propagation

### Flow

```
Input ──► Input Switch
               │
               ├── Alarm Created/Cleared/Updated ──────────────────────────┐
               │                                                           │
               ├── Post telemetry ──► Check Measurement ──► [active] ──►   │
               │                      Relation                             │
               │                          │                                │
               │                       [True]                              │
               │                          │                                │
               │                          ▼                                │
               │                   Switch to Measurement                   │
               │                          │                                │
               │                          ▼                                │
               │                   Get Measurement Progress                │
               │                          │                                │
               │                          ▼                                │
               │                   Filter: ss_progress == 'active'         │
               │                          │                                │
               │                       [True]                              │
               │                          │                                │
               │                          ▼                                │
               │                   Switch back to Device                   │
               │                          │                                │
               │                          ▼                                │
               │                   Device Profile Node                     │
               │                          │                                │
               │                          ▼                                │
               │   ┌───────────────────────────────────────────────────────┘
               │   │
               │   ▼
               │ Alarms Count (propagated)
               │   │
               │   ├──────────────────────┬────────────────────┐
               │   │                      │                    │
               │   ▼                      ▼                    ▼
               │ Save Timeseries    isAssetOrCustomer      isDevice
               │                          │                    │
               │                       [True]               [True]
               │                          │                    │
               │                          ▼                    ▼
               │                   Update state          Update state
               │                   attributes            attributes
               │                          │                    │
               │                          └─────────┬──────────┘
               │                                    │
               │                                    ▼
               │                          Save Server Attributes
               │
               └── Entity Created/Updated ──► Message Type Switch ──► ...
```

### Alarms Count Node (TbAlarmsCountNodeV2)

```json
{
  "alarmsCountMappings": [
    { "target": "criticalAlarmsCount", "severityList": ["CRITICAL"] },
    { "target": "majorAlarmsCount", "severityList": ["MAJOR"] },
    { "target": "minorAlarmsCount", "severityList": ["MINOR"] },
    { "target": "warningAlarmsCount", "severityList": ["WARNING"] }
  ],
  "countAlarmsForPropagationEntities": true,
  "outMsgType": "POST_TELEMETRY_REQUEST"
}
```

**Wichtig:** `countAlarmsForPropagationEntities: true` zählt Alarme die nach oben propagieren!

### Update State Attributes (TbTransformMsgNode)

```javascript
var criticalAlarmsCount = msg.criticalAlarmsCount;
var majorAlarmsCount = msg.majorAlarmsCount;
var minorAlarmsCount = msg.minorAlarmsCount;
var warningAlarmsCount = msg.warningAlarmsCount;

var state = 'normal';

if (criticalAlarmsCount != null && criticalAlarmsCount > 0) {
    state = 'critical';
} else if (majorAlarmsCount != null && majorAlarmsCount > 0) {
    state = 'major';
} else if (minorAlarmsCount != null && minorAlarmsCount > 0) {
    state = 'minor';
} else if (warningAlarmsCount != null && warningAlarmsCount > 0) {
    state = 'warning';
}

var result = {};
result.state = state;
result.criticalAlarmsCount = (criticalAlarmsCount != null) ? criticalAlarmsCount : 0;
result.majorAlarmsCount = (majorAlarmsCount != null) ? majorAlarmsCount : 0;
result.minorAlarmsCount = (minorAlarmsCount != null) ? minorAlarmsCount : 0;
result.warningAlarmsCount = (warningAlarmsCount != null) ? warningAlarmsCount : 0;

var newMetadata = {};
newMetadata.scope = 'SERVER_SCOPE';

return {
    msg: result,
    metadata: newMetadata,
    msgType: 'POST_ATTRIBUTES_REQUEST'
};
```

---

## 5. Alarm Propagation

Alarme propagieren über die Entity-Hierarchie nach oben:

```
Device (Alarm erstellt)
    │
    │ propagate: true
    ▼
Measurement (Alarm Count +1, State Update)
    │
    │ propagateToOwner: true
    ▼
Project (Alarm Count +1, State Update)
    │
    │ propagateToOwner: true
    ▼
Customer (Alarm Count +1, State Update)
```

### State Attribute

Jede Entity bekommt ein `state` Attribut basierend auf aktiven Alarmen:

| Alarm Counts | state |
|--------------|-------|
| criticalAlarmsCount > 0 | `critical` |
| majorAlarmsCount > 0 | `major` |
| minorAlarmsCount > 0 | `minor` |
| warningAlarmsCount > 0 | `warning` |
| Alle = 0 | `normal` |

### Server Attributes (nach Alarm Event)

```json
{
  "state": "minor",
  "criticalAlarmsCount": 0,
  "majorAlarmsCount": 0,
  "minorAlarmsCount": 1,
  "warningAlarmsCount": 0
}
```

---

## 6. Device Alarm Bedingung

Device Alarme werden nur verarbeitet wenn das Device einer **aktiven Messung** zugewiesen ist:

### Check Flow

```
Post telemetry
    │
    ▼
Check Measurement Relation (FROM, Type: Measurement)
    │
    ├── [False] ──► (skip - kein Alarm Processing)
    │
    └── [True]
          │
          ▼
    Switch to Measurement
          │
          ▼
    Get Measurement Progress (fetchToData: true)
          │
          ▼
    Filter: metadata.ss_progress == 'active'
          │
          ├── [False] ──► (skip - Messung nicht aktiv)
          │
          └── [True]
                │
                ▼
          Switch back to Device
                │
                ▼
          Device Profile Node (Alarm Rules)
```

### TbGetAttributesNode Pattern

**Wichtig:** Bei `fetchToData: true` werden Attribute in `metadata` gespeichert mit Scope-Prefix:

| Scope | Prefix | Zugriff |
|-------|--------|---------|
| SERVER_SCOPE | `ss_` | `metadata.ss_progress` |
| CLIENT_SCOPE | `cs_` | `metadata.cs_progress` |
| SHARED_SCOPE | `shared_` | `metadata.shared_progress` |

```javascript
// FALSCH
return msg.progress == 'active';

// RICHTIG
return metadata.ss_progress == 'active';
```

---

## 7. Severity Levels

| Severity | Farbe | Verwendung |
|----------|-------|------------|
| `CRITICAL` | Rot | System-kritische Fehler, Sensor-Ausfall |
| `MAJOR` | Orange | Wichtige Probleme, Inaktivität |
| `MINOR` | Gelb | Hinweise, Calculated Field Flags |
| `WARNING` | Blau | Informativ |
| `INDETERMINATE` | Grau | Unbestimmt |

---

## 8. TODO / Erweiterungen

- [ ] **Dynamische Severity** - Severity basierend auf Schweregrad:
  ```javascript
  // Beispiel: Cycling Alarm
  if (msg.cycle_count > 10) return 'MAJOR';
  else if (msg.cycle_count > 5) return 'WARNING';
  else return 'MINOR';
  ```

- [ ] **Notification Rule** - Email/Push bei bestimmten Alarm-Typen

- [ ] **Alarm Dashboard Widget** - Übersicht aller aktiven Alarme

---

## 9. Rule Chain IDs

| Rule Chain | ID |
|------------|-----|
| Measurement | `0e7937d0-012c-11f1-9979-9f3434877bb4` |
| EM Alarm Handler | `88aee890-6f6c-11ef-8170-db057079800d` |
| Inactivity Alarm Handler | `8f873a50-6f6c-11ef-8a75-b31459678eb5` |

---

## 10. Änderungshistorie

| Datum | Änderung |
|-------|----------|
| 2026-02-03 | Measurement Rule Chain mit Calculated Field Alarmen |
| 2026-02-03 | EM Alarm Handler: Input Switch für Asset/Device Alarme |
| 2026-02-03 | EM Alarm Handler: Active Measurement Check für Devices |
| 2026-02-03 | Server Attributes statt Client Attributes |
| 2026-02-03 | Alarm Counts als Server Attributes |
