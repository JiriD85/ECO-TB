# Dashboard Editing Guide

## JSON Structure

Dashboard-Dateien (2-4 MB) haben folgende Struktur:

```
dashboard.json
├── configuration.widgets.<widget-id>
│   ├── config.datasources          # Datenquellen
│   ├── config.dataKeys             # Telemetrie, Attribute, Entity Fields
│   ├── config.settings             # Widget-spezifische Einstellungen
│   └── config.actions              # Button Actions
├── configuration.entityAliases     # Dynamische Entity-Referenzen
└── configuration.states            # Dashboard States (Multi-View)
```

## Widget Actions

### `customPretty` - Inline Dialog

Dialog HTML/CSS/JS direkt in der Action definiert:

```json
{
  "type": "customPretty",
  "customHtml": "<form>...</form>",
  "customCss": ".my-class { ... }",
  "customFunction": "let $injector = widgetContext.$scope.$injector; ...",
  "customResources": []
}
```

### `custom` - Library Function Call (BEVORZUGT)

**WICHTIG:** `customFunction` MUSS ein Object mit `body` und `modules` sein!

```json
{
  "type": "custom",
  "customFunction": {
    "body": "const measurementId = entityId;\nprojectWizard.openMyDialog(widgetContext, measurementId);",
    "modules": {
      "projectWizard": "tb-resource;/api/resource/js_module/tenant/ECO Project Wizard.js"
    }
  }
}
```

**FALSCH (funktioniert NICHT):**
```json
{
  "type": "custom",
  "modules": { ... },
  "customFunction": "string..."
}
```

### Module Import Format

```
"moduleName": "tb-resource;/api/resource/js_module/tenant/FILENAME.js"
```

## Programmatic Editing mit Node.js

String-Replacement versagt oft bei grossen JSON-Dateien. Besser:

```javascript
const fs = require('fs');
const dashboard = JSON.parse(fs.readFileSync('dashboards/measurements.json', 'utf8'));

// Widgets iterieren
for (const [widgetId, widget] of Object.entries(dashboard.configuration.widgets)) {
    // widget.config.settings, widget.config.actions bearbeiten
}

// States iterieren
for (const [stateId, state] of Object.entries(dashboard.configuration.states)) {
    for (const [layoutId, layout] of Object.entries(state.layouts)) {
        // layout.widgets bearbeiten
    }
}

fs.writeFileSync('dashboards/measurements.json', JSON.stringify(dashboard, null, 2));
```

## Actions finden

Jede Action hat eine eindeutige `id`. Suchen mit:

```javascript
// Alle Actions eines Widgets
const actions = widget.config.actions;
for (const [actionName, actionArray] of Object.entries(actions)) {
    for (const action of actionArray) {
        if (action.id === 'gesuchte-id') {
            // Gefunden
        }
    }
}
```

## ThingsBoard Services

Injection via `$injector.get(widgetContext.servicesMap.get('serviceName'))`:

| Service | Funktion |
|---------|----------|
| `customDialog` | Dialoge oeffnen |
| `attributeService` | Attribute lesen/schreiben |
| `entityRelationService` | Relations verwalten |
| `entityGroupService` | Entity Groups verwalten |
| `deviceService` | Device CRUD |
| `assetService` | Asset CRUD |

## ThingsBoard CSS Utilities

Tailwind-aehnliche Klassen in Widgets:

```
flex, flex-1, flex-col, flex-wrap
items-center, items-start, items-end
justify-end, justify-between
gap-1, gap-2, gap-3
p-3, p-4, px-4
mb-2, mb-4, mt-2, mx-4
text-lg, font-semibold
```

## Markdown/HTML Card Widgets

Siehe [docs/markdown-widget-patterns.md](../markdown-widget-patterns.md):
- Widget-Konfiguration (`sizeY: 11`, `applyDefaultMarkdownStyle: true`)
- Header-Styling mit Gradient
- Datasource-Konfiguration
