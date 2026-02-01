# Markdown Widget Patterns

Dokumentation für konsistente Markdown/HTML Card Widgets in ThingsBoard Dashboards.

## Widget-Konfiguration

### Kritische Einstellungen für einheitliche Darstellung

Beim Erstellen oder Anpassen von Markdown Widgets müssen folgende Einstellungen konsistent sein:

| Einstellung | Wert | Beschreibung |
|-------------|------|--------------|
| `sizeY` | 11 | Layout-Höhe im State (nicht 12!) |
| `applyDefaultMarkdownStyle` | true | ThingsBoard Default-Styling anwenden |
| `useMarkdownTextFunction` | true | Dynamische Inhalte via JS |
| `showTitle` | false | Widget-Titel ausblenden |
| `borderRadius` | 8 | Eckenradius |

### Beispiel: Konsistente Widget-Konfiguration

```javascript
// Layout im State
layout.widgets[widgetId] = {
  sizeX: 24,
  sizeY: 11,  // WICHTIG: 11, nicht 12!
  row: 0,
  col: 0
};

// Widget Settings
widget.config.settings = {
  useMarkdownTextFunction: true,
  markdownTextFunction: '...',
  markdownCss: '...',
  applyDefaultMarkdownStyle: true  // WICHTIG: true!
};

widget.config.showTitle = false;
widget.config.borderRadius = 8;
```

## Header-Styling Pattern

### Gradient Header Struktur

```html
<div class="manage-header {type}">
  <div class="header-left">
    <a id="btn-go-back" class="back-button" role="button">
      <mat-icon>arrow_back</mat-icon>
    </a>
    <div class="header-title">
      <h1><mat-icon>{icon}</mat-icon>{Title}</h1>
      <div class="header-stats">
        <span class="stat-item">...</span>
      </div>
    </div>
  </div>
  <div class="header-right">
    <a id="btn-action" class="header-action-btn" role="button">
      <mat-icon>add</mat-icon>Action
    </a>
  </div>
</div>
```

### Header-Typen und Farben

| Type | Gradient | Verwendung |
|------|----------|------------|
| `.kits` | `#3a6a9e → #2c5278` | Diagnostic Kits |
| `.projects` | `#26a69a → #00897b` | Projects |
| `.users` | `#9c27b0 → #7b1fa2` | Users |

### Stat-Dot Farben

| Klasse | Farbe | Hex |
|--------|-------|-----|
| `.total` | Weiß | `#ffffff` |
| `.assigned` | Rot | `#EB5757` |
| `.available` | Grün | `#27AE60` |
| `.planned` | Orange | `#F2994A` |
| `.in-preparation` | Orange | `#F2994A` |
| `.active` | Grün | `#27AE60` |
| `.finished` | Blau | `#2F80ED` |
| `.aborted` | Rot | `#EB5757` |

## Datasource-Konfiguration

### Eindeutige Labels verwenden!

Bei mehreren Datasources mit gleichen Attributen (z.B. "progress") müssen eindeutige Labels verwendet werden:

```
FALSCH:
- Datasource 1: progress
- Datasource 2: progress  <- Konflikt!
- Datasource 3: progress  <- Konflikt!

RICHTIG:
- Datasource 1: projectProgress
- Datasource 2: selectedProgress
- Datasource 3: measurementProgress
```

### Datasources über aliasName unterscheiden

```javascript
data.forEach(function(item) {
  var alias = item.aliasName || '';

  if (alias === 'Current User') {
    userRole = item.role || '';
  } else if (alias === 'All Projects') {
    // item.projectProgress
  } else if (alias === 'Selected Project') {
    // item.selectedProgress
  }
});
```

## Referenz-Widgets

### manage_diagnostickits (Referenz)
- Widget ID: `c6b19443-5057-176b-d3f8-2eebb67fc35e`
- State: `manage_diagnostickits`
- Vorlage für Header-Styling

### manage_projects
- Widget ID: `f5be3f90-8574-86fb-1e71-7381ecb6956d`
- State: `manage_projects`
- Basiert auf manage_diagnostickits Pattern

## Häufige Fehler

### 1. Header zu hoch
**Ursache:** `sizeY: 12` statt `11` oder `applyDefaultMarkdownStyle: false`
**Lösung:** Beide Werte an Referenz-Widget anpassen

### 2. Doppelte Datenwerte
**Ursache:** Gleiche Labels für verschiedene Datasources
**Lösung:** Eindeutige Labels verwenden (z.B. `projectProgress`, `selectedProgress`)

### 3. Widget passt nicht in Dashboard
**Fehler:** "Can't be placed in the bounds of the dashboard"
**Ursache:** Layout-Dimensionen zu groß oder Widget-Ersetzung statt Update
**Lösung:** Bestehende Widget-Settings updaten, nicht Widget ersetzen

## Update-Script Pattern

```javascript
const fs = require('fs');
const dashboard = JSON.parse(fs.readFileSync('dashboards/administration.json', 'utf8'));

// Widget finden
const state = dashboard.configuration.states['state_name'];
const layout = state.layouts.main;
const widgetId = Object.keys(layout.widgets)[0];
const widget = dashboard.configuration.widgets[widgetId];

// NUR Settings updaten, nicht Layout ersetzen!
widget.config.settings.markdownTextFunction = '...';
widget.config.settings.markdownCss = '...';
widget.config.settings.applyDefaultMarkdownStyle = true;

// Layout sizeY anpassen wenn nötig
layout.widgets[widgetId].sizeY = 11;

fs.writeFileSync('dashboards/administration.json', JSON.stringify(dashboard, null, 2));
```
