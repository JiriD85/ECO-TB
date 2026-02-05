# Task: Import Button im Project Wizard

## Status: ✅ Completed

## Implementierung (2026-02-03)

### Änderungen in `js library/ECO Project Wizard.js`

1. **HTML Template** (nach LoRaWAN-Block, ~Zeile 412):
```html
<!-- Import: Data import option -->
<div *ngIf="m.measurementType === 'import' && (m.progress === 'in preparation' || m.progress === 'planned' || m.progress === 'active')" class="flex items-center justify-between mt-2">
  <span class="flex items-center gap-1" style="color: #9c27b0; font-size: 12px;">
    <mat-icon style="font-size: 14px; width: 14px; height: 14px;">upload_file</mat-icon>
    {{ 'custom.project-wizard.import-data-hint' | translate }}
  </span>
  <button mat-raised-button color="primary" type="button" (click)="openImportDialog(m)" style="font-size: 12px;">
    <mat-icon style="font-size: 16px; width: 16px; height: 16px;">upload_file</mat-icon>
    {{ 'custom.project-wizard.import' | translate }}
  </button>
</div>
```

2. **Controller Funktion** (nach `connectMeasurement`):
```javascript
vm.openImportDialog = function(measurement) {
  if (!dataImporter || !dataImporter.csvDataImportDialog) {
    vm.validationError = 'Import functionality not available from this context.';
    return;
  }
  dataImporter.csvDataImportDialog(dialogWidgetContext, measurement.id, measurement.name);
};
```

### Übersetzungen hinzugefügt

| Key | DE | EN |
|-----|----|----|
| `custom.project-wizard.import-data-hint` | CSV-Daten importieren | Import CSV data |
| `custom.project-wizard.import` | Import | Import |

### Wichtig

- `dataImporter` muss als Option übergeben werden (wird bereits gemacht)
- Button erscheint nur bei `measurementType === 'import'`
- Button erscheint bei Progress: `in preparation`, `planned`, `active`

## Beschreibung

Im ECO Project Wizard soll bei Measurements mit `measurementType === 'import'` ein "Import" Button angezeigt werden (an der Stelle wo sonst der "Connect" Button ist). Der Button soll den ECO Data Importer aufrufen.

## Ort

- **Library:** `js library/ECO Project Wizard.js`
- **Bereich:** Measurement-Ansicht (wo Connect Button angezeigt wird)

## Anforderungen

1. **Bedingung:** Button nur sichtbar wenn `measurementType === 'import'`
2. **Position:** An der Stelle des "Connect" Buttons
3. **Aktion:** `csvDataImportDialog()` aus ECO Data Importer aufrufen
4. **Styling:** Konsistent mit anderen Buttons im Wizard

## Implementierung

### 1. Import der Funktion

```javascript
// Am Anfang der Funktion oder als Modul-Import
import { csvDataImportDialog } from './ECO Data Importer.js';
// ODER dynamisch laden
```

### 2. Button im HTML Template

```html
<!-- Neben/statt Connect Button -->
<button *ngIf="measurementType === 'import'"
        mat-stroked-button
        color="primary"
        (click)="openImportDialog()">
  <mat-icon>upload_file</mat-icon>
  Import
</button>
```

### 3. Controller Funktion

```javascript
vm.openImportDialog = function() {
  // ECO Data Importer aufrufen
  csvDataImportDialog(widgetContext, measurementId);
};
```

## Zu prüfen

- [ ] Wo genau ist der Connect Button? (welche Funktion/Template?)
- [ ] Wie wird `measurementType` im Wizard verfügbar gemacht?
- [ ] Wie wird ECO Data Importer importiert? (bereits als Modul verfügbar?)
- [ ] Welche Parameter braucht `csvDataImportDialog()`?

## Workflow

1. `node sync/sync.js pull-js "ECO Project Wizard"` - Aktuelle Library holen
2. `node sync/sync.js pull-js "ECO Data Importer"` - Prüfen welche Funktion exportiert wird
3. Connect Button Logik finden und verstehen
4. Import Button implementieren
5. Testen im Browser
6. `node sync/sync.js push-js "ECO Project Wizard"`
7. Git commit

## Referenz

- `js library/ECO Data Importer.js` - `csvDataImportDialog()` Funktion
- `js library/ECO Project Wizard.js` - Connect Button Implementierung
