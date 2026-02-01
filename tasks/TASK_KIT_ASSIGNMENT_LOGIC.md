# Task: Diagnostic Kit Assignment and History Tracking Logic

## Beschreibung

Implementiere die Logik fuer Diagnostic Kit Zuweisung zu Measurements und automatische Historie-Verfolgung. Bei Kit-Zuweisung werden Relationen und Attribute erstellt und das Kit in die "Assigned Diagnostic Kits" Gruppe verschoben. Bei Measurement-Ende (progress = "finished") werden Kits automatisch zurueckgesetzt, Relationen geloescht und die Measurement-Historie im Kit aktualisiert.

## Kontext

- **Project:** ECO Smart Diagnostics (ThingsBoard 4.2 PE)
- **Betroffene Libraries:** ECO Project Wizard.js, ECO Data Importer.js
- **Entity Type:** Diagnostickit (ASSET)
- **Kit Types:**
  - Base Kit: entityName beginnt mit "DB"
  - Room Kit: entityName beginnt mit "DR"

### Aktuelle Implementierung

Die bestehende Device-Zuweisung in `ECO Data Importer.js` (Funktion `assignDeviceToMeasurement`) behandelt bereits:
- P-Flow D116, Room Sensor CO2, Temperature Sensor, RESI Geraete
- Relation FROM Measurement TO Device (Type: "Measurement")
- Entity Group Verwaltung (Unassigned/Assigned Measurement Devices)

Diese Logik muss erweitert werden um Diagnostickits zu unterstuetzen.

## Betroffene Dateien

### Zu modifizieren:
- `js library/ECO Data Importer.js` - assignDeviceToMeasurement erweitern
- `js library/ECO Project Wizard.js` - finishProject und deleteMeasurement erweitern

### Entity Groups (muessen existieren oder erstellt werden):
- "Diagnostickits" - Alle Kits (ASSET Gruppe)
- "Assigned Diagnostic Kits" - Aktuell zugewiesene Kits (ASSET Gruppe)
- "Unassigned Diagnostic Kits" - Verfuegbare Kits (ASSET Gruppe)

## Technischer Ansatz

### ThingsBoard Services (via $injector)

```javascript
const entityRelationService = $injector.get(widgetContext.servicesMap.get('entityRelationService'));
const entityGroupService = $injector.get(widgetContext.servicesMap.get('entityGroupService'));
const attributeService = $injector.get(widgetContext.servicesMap.get('attributeService'));
const assetService = $injector.get(widgetContext.servicesMap.get('assetService'));
```

### Datenstrukturen

#### `assignedDevices` Attribut auf Measurement (SERVER_SCOPE)

```json
{
  "diagnostickit": {
    "entityId": "kit-uuid",
    "entityName": "DB-001",
    "entityLabel": "Base Kit 1",
    "type": "Base Kit"
  },
  "pflow": {
    "entityId": "pflow-uuid",
    "entityName": "D116-001",
    "entityLabel": "P-Flow Main"
  },
  "sensors": [
    {
      "entityId": "sensor-uuid",
      "entityName": "TS-001",
      "entityLabel": "Temp Sensor 1",
      "type": "Temperature Sensor"
    }
  ]
}
```

#### `measurementHistory` Attribut auf Diagnostickit (SERVER_SCOPE)

```json
[
  {
    "measurementId": "measurement-uuid",
    "entityName": "M-2024-001",
    "entityLabel": "Main Heating Circuit",
    "projectName": "Building A Audit",
    "startTimeMs": 1706000000000,
    "endTimeMs": 1706500000000,
    "pflow": {
      "entityId": "pflow-uuid",
      "entityName": "D116-001"
    },
    "sensors": [
      {
        "entityId": "sensor-uuid",
        "entityName": "TS-001",
        "type": "Temperature Sensor"
      }
    ]
  }
]
```

## Akzeptanzkriterien

### Kit Assignment (via ECO Project Wizard oder ECO Data Importer)

- [ ] Relation wird erstellt: FROM Measurement TO Diagnostickit, Type: "Measurement"
- [ ] `assignedDevices` Attribut auf Measurement wird gesetzt/aktualisiert mit Kit, P-Flow und Sensors Info
- [ ] Kit wird aus "Unassigned Diagnostic Kits" Gruppe entfernt
- [ ] Kit wird zu "Assigned Diagnostic Kits" Gruppe hinzugefuegt
- [ ] Base Kit (DB*) und Room Kit (DR*) werden korrekt erkannt

### Measurement End (progress = "finished" oder "aborted")

- [ ] Kit wird aus "Assigned Diagnostic Kits" Gruppe entfernt
- [ ] Kit wird zu "Unassigned Diagnostic Kits" Gruppe hinzugefuegt
- [ ] Relation Measurement-Diagnostickit wird geloescht
- [ ] `measurementHistory` Array auf Diagnostickit wird aktualisiert (neuer Eintrag hinzugefuegt)
- [ ] History-Eintrag enthaelt: measurementId, entityName, entityLabel, startTimeMs, endTimeMs, pflow, sensors
- [ ] Bestehende History-Eintraege bleiben erhalten (append, nicht replace)

### Helper Functions

- [ ] `getOrCreateDiagnosticKitGroups(customerId)` - Holt oder erstellt Assigned/Unassigned Gruppen
- [ ] `assignDiagnostickitToMeasurement(measurementId, kitId, pflow, sensors)` - Kit zuweisen
- [ ] `unassignDiagnostickitFromMeasurement(measurementId, endTimeMs)` - Kit freigeben und History speichern
- [ ] `getKitType(entityName)` - Gibt "Base Kit" oder "Room Kit" basierend auf Prefix zurueck

## Constraints

- **Nicht aendern:** Bestehende Device-Zuweisung (P-Flow, Sensors) muss funktionsfaehig bleiben
- **RxJS:** Alle async Operationen muessen mit RxJS Observables arbeiten (forkJoin, switchMap, pipe)
- **Error Handling:** Fehler bei einzelnen Operationen duerfen nicht den gesamten Prozess abbrechen
- **Idempotenz:** Mehrfaches Aufrufen der gleichen Zuweisung darf keine Duplikate erstellen
- **Entity Groups:** Gruppen sind pro Customer (ownerId = customerId)

## Implementierungsplan

### Phase 1: Helper Functions

1. Erstelle `getKitType(entityName)` Funktion
2. Erstelle `getOrCreateDiagnosticKitGroups(customerId)` analog zu existierendem Pattern

### Phase 2: Kit Assignment

1. Erweitere `assignDeviceToMeasurement` in ECO Data Importer um Diagnostickit-Handling
2. Implementiere `assignedDevices` Attribut-Speicherung auf Measurement
3. Implementiere Gruppen-Verwaltung (remove from Unassigned, add to Assigned)

### Phase 3: Measurement End

1. Erweitere `unassignDevices` in ECO Project Wizard fuer Diagnostickits
2. Implementiere `measurementHistory` Update auf Diagnostickit
3. Teste finish/abort Workflow vollstaendig

### Phase 4: Testing

1. Teste Kit Zuweisung ueber UI Dialog
2. Teste Measurement Finish - Kit wird freigegeben
3. Teste History wird korrekt geschrieben
4. Teste Measurement Delete - Kit wird freigegeben

## Beispiele

### Kit Zuweisung

```javascript
function assignDiagnostickitToMeasurement(measurementId, kit, pflow, sensors) {
  const operations = [];

  // 1. Create relation FROM Measurement TO Diagnostickit
  const relation = {
    from: measurementId,
    to: kit.id,
    type: 'Measurement',
    typeGroup: 'COMMON'
  };
  operations.push(entityRelationService.saveRelation(relation));

  // 2. Save assignedDevices attribute
  const assignedDevices = {
    diagnostickit: {
      entityId: kit.id.id,
      entityName: kit.name,
      entityLabel: kit.label,
      type: getKitType(kit.name)
    },
    pflow: pflow ? { entityId: pflow.id.id, entityName: pflow.name, entityLabel: pflow.label } : null,
    sensors: sensors.map(s => ({ entityId: s.id.id, entityName: s.name, type: s.type }))
  };
  operations.push(attributeService.saveEntityAttributes(measurementId, 'SERVER_SCOPE', [
    { key: 'assignedDevices', value: assignedDevices }
  ]));

  // 3. Move kit to Assigned group
  operations.push(entityGroupService.removeEntityFromEntityGroup(unassignedGroupId, kit.id.id));
  operations.push(entityGroupService.addEntityToEntityGroup(assignedGroupId, kit.id.id));

  return forkJoin(operations);
}
```

### Kit Freigabe bei Measurement Ende

```javascript
function unassignDiagnostickitFromMeasurement(measurementId, kitId, measurementData, endTimeMs) {
  // 1. Lade bestehende History
  return attributeService.getEntityAttributes(kitId, 'SERVER_SCOPE', ['measurementHistory']).pipe(
    switchMap(function(attrs) {
      const historyAttr = attrs.find(a => a.key === 'measurementHistory');
      const history = historyAttr ? historyAttr.value : [];

      // 2. Fuege neuen Eintrag hinzu
      history.push({
        measurementId: measurementId.id,
        entityName: measurementData.name,
        entityLabel: measurementData.label,
        startTimeMs: measurementData.startTimeMs,
        endTimeMs: endTimeMs,
        pflow: measurementData.pflow,
        sensors: measurementData.sensors
      });

      const operations = [];

      // 3. Speichere aktualisierte History
      operations.push(attributeService.saveEntityAttributes(kitId, 'SERVER_SCOPE', [
        { key: 'measurementHistory', value: history }
      ]));

      // 4. Loesche Relation
      operations.push(entityRelationService.deleteRelation(measurementId, 'Measurement', kitId));

      // 5. Verschiebe Kit zu Unassigned
      operations.push(entityGroupService.removeEntityFromEntityGroup(assignedGroupId, kitId.id));
      operations.push(entityGroupService.addEntityToEntityGroup(unassignedGroupId, kitId.id));

      return forkJoin(operations);
    })
  );
}
```

### Kit Type Detection

```javascript
function getKitType(entityName) {
  if (entityName && entityName.startsWith('DB')) {
    return 'Base Kit';
  } else if (entityName && entityName.startsWith('DR')) {
    return 'Room Kit';
  }
  return 'Unknown';
}
```

## Testing Checklist

- [ ] Neues Measurement erstellen, Kit zuweisen -> Relation und Attribute pruefen
- [ ] Zweites Measurement mit gleichem Kit -> Fehler oder Warnung erwartet
- [ ] Measurement auf "finished" setzen -> Kit wird freigegeben
- [ ] Kit measurementHistory enthaelt korrekten Eintrag
- [ ] Kit kann erneut zugewiesen werden
- [ ] Measurement loeschen -> Kit wird freigegeben
- [ ] Multi-Kit Szenario: Base Kit + Room Kit

---
*Erstellt von: Claude Code*
*Datum: 2026-01-29*
*Status: ready*
