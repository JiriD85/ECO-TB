# JS Libraries

## Uebersicht

| Library | Zweck |
|---------|-------|
| **ECO Diagnostics Utils JS.js** | Progress, Styling, Address Search |
| **ECO Data Importer.js** | CSV Import, Device Assignment |
| **ECO Project Wizard.js** | Project/Measurement Dialoge |

## ECO Diagnostics Utils JS

### Progress & Styling

```javascript
utils.getProgressColor(progress)      // Farbe fuer Progress-Status
utils.getProgressHtml(progress)       // HTML Badge fuer Progress
utils.getMeasurementTypeStyle(type)   // Style fuer Measurement-Typ
utils.getInstallationTypeStyle(type)  // Style fuer Installation-Typ
```

### Alarm Badges

```javascript
utils.getAlarmStateStyle(state)                    // Style-Object
utils.createAlarmBadgeHtml(state, count, elementId) // HTML Badge
```

### Address Search

```javascript
utils.searchAddress(query)  // Nominatim API Suche
```

## ECO Data Importer

```javascript
dataImporter.csvDataImportDialog(widgetContext, entityId)
dataImporter.assignDeviceToMeasurement(widgetContext, measurementId)
```

## ECO Project Wizard

### Project Dialoge

```javascript
projectWizard.openAddProjectDialog(widgetContext, customerId, callback)
projectWizard.openEditProjectDialog(widgetContext, projectId, name, label, callback)
```

### Measurement Dialoge

```javascript
projectWizard.openAddMeasurementDialog(widgetContext, projectId, callback)
projectWizard.openEditMeasurementDialog(widgetContext, measurementId, callback)
projectWizard.openMeasurementParametersDialog(widgetContext, measurementId)
```

## Module Import in Actions

```json
{
  "customFunction": {
    "body": "projectWizard.openAddProjectDialog(widgetContext, customerId);",
    "modules": {
      "projectWizard": "tb-resource;/api/resource/js_module/tenant/ECO Project Wizard.js"
    }
  }
}
```

## Encoding (KRITISCH!)

**ThingsBoard JS Module MUESSEN ASCII sein!**

- UTF-8 mit Umlauten funktioniert NICHT
- Umlaute ersetzen: ue, ae, oe, ss
- Pruefen: `file "js library/FILENAME.js"` sollte "ASCII text" zeigen
- Syntax-Check: `node --check "js library/FILENAME.js"`
