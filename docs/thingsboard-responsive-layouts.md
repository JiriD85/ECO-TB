# ThingsBoard Responsive Layouts

Dokumentation für responsive Dashboard-Layouts in ThingsBoard 4.x PE.

## Grundkonzept

**Jeder Dashboard State hat seine eigene Layout-Konfiguration mit Breakpoints.**

Das bedeutet: Wenn du einen State `default` mit Breakpoints hast und dieser State einen Tab-Container enthält, der zum State `home` navigiert, dann braucht `home` **seine eigenen Breakpoints** - sie werden NICHT vom Parent State geerbt.

## Breakpoint-Größen

| Breakpoint | Bezeichnung | Bildschirmbreite |
|------------|-------------|------------------|
| Default | Desktop | Fallback |
| xl | Desktop (xl) | 1920px – 5000px |
| lg | Desktop (lg) | 1280px – 1919px |
| md | Laptop (md) | 960px – 1279px |
| sm | Tablet (sm) | 600px – 959px |
| xs | Mobile (xs) | max 599px |

## JSON-Struktur

```json
{
  "configuration": {
    "states": {
      "stateId": {
        "layouts": {
          "main": {
            "gridSettings": {
              "layoutType": "default",
              "columns": 24,
              "margin": 10,
              "viewFormat": "grid",
              "autoFillHeight": true,
              "rowHeight": 70
            },
            "widgets": {
              "widget-uuid": {
                "sizeX": 24,
                "sizeY": 12,
                "row": 0,
                "col": 0
              }
            },
            "breakpoints": {
              "sm": {
                "gridSettings": { ... },
                "widgets": {
                  "widget-uuid": { "sizeX": 24, "sizeY": 12, "row": 0, "col": 0 }
                }
              },
              "xs": {
                "gridSettings": { ... },
                "widgets": { ... }
              }
            }
          }
        }
      }
    }
  }
}
```

## Widget References vs. Copies

### Widget References (Standard)
- **Position/Größe:** Unabhängig pro Breakpoint
- **Konfiguration (CSS, HTML, JS):** Synchronisiert über alle Breakpoints
- Im JSON: Gleiche Widget-ID in `main.widgets` und `breakpoints.sm.widgets`
- Erstellen: Rechtsklick → "Copy reference" (Ctrl+R)

### Widget Copies
- **Komplett unabhängig:** Eigene ID, eigene Konfiguration
- Änderungen am Original beeinflussen die Kopie NICHT
- Erstellen: Rechtsklick → "Replace reference with widget copy"
- Im JSON: Neue Widget-ID, neuer Eintrag in `configuration.widgets`

## Workflow: Responsive Design erstellen

### 1. Breakpoints im UI hinzufügen

1. Dashboard öffnen → Edit Mode
2. "Layouts" Dropdown → "Manage layouts" klicken
3. In der Breakpoints-Tabelle: "+" klicken
4. Breakpoint auswählen (sm für Tablet, xs für Mobile)
5. Optional: "Copy widgets from" auswählen
6. "Save" klicken

### 2. Breakpoint zum Bearbeiten auswählen

1. "Layouts" Dropdown → Breakpoint auswählen (z.B. "Tablet (sm)")
2. Dashboard zeigt jetzt die Tablet-Ansicht
3. Widgets können verschoben/skaliert werden

### 3. Widget-Kopie für Breakpoint-spezifisches CSS

**Wichtig:** Wenn du unterschiedliches CSS pro Breakpoint brauchst:

1. Zum gewünschten Breakpoint wechseln (z.B. Tablet)
2. Rechtsklick auf Widget → "Replace reference with widget copy"
3. Widget bearbeiten → CSS anpassen
4. Speichern

Das Original-Widget (Desktop) bleibt unverändert.

## Wichtige Regeln

### States erben KEINE Breakpoints

```
❌ FALSCH: default (mit sm/xs) → home (erbt automatisch sm/xs)
✅ RICHTIG: default (mit sm/xs) → home (braucht eigene sm/xs)
```

Jeder State, der responsive sein soll, muss seine eigenen Breakpoints konfiguriert haben.

### gridSettings pro Breakpoint

Jeder Breakpoint kann eigene Grid-Einstellungen haben:

| Einstellung | Beschreibung | Typische Werte |
|-------------|--------------|----------------|
| `viewFormat` | Layout-Typ | "grid" oder "list" |
| `columns` | Spaltenanzahl | 24 (Standard) |
| `margin` | Abstand zwischen Widgets | 10px |
| `autoFillHeight` | Automatische Höhenanpassung | true/false |
| `rowHeight` | Zeilen-Höhe | 70px |

### Widget-Position pro Breakpoint

Jeder Breakpoint speichert eigene Widget-Positionen:

```json
"widgets": {
  "widget-uuid": {
    "sizeX": 24,    // Breite in Spalten
    "sizeY": 12,    // Höhe in Zeilen
    "row": 0,       // Startzeile
    "col": 0        // Startspalte
  }
}
```

## Programmatische Bearbeitung

### Breakpoint zu State hinzufügen (Node.js)

```javascript
const fs = require('fs');
const dashboard = JSON.parse(fs.readFileSync('dashboards/navigation.json', 'utf8'));

const stateId = 'home';
const layout = dashboard.configuration.states[stateId].layouts.main;

// Breakpoints hinzufügen falls nicht vorhanden
if (!layout.breakpoints) {
  layout.breakpoints = {};
}

// Tablet (sm) Breakpoint erstellen
layout.breakpoints.sm = {
  gridSettings: {
    ...layout.gridSettings,
    viewFormat: 'list',
    autoFillHeight: false
  },
  widgets: { ...layout.widgets }  // Widgets als Referenzen kopieren
};

// Mobile (xs) Breakpoint erstellen
layout.breakpoints.xs = {
  gridSettings: {
    ...layout.gridSettings,
    viewFormat: 'list',
    autoFillHeight: false
  },
  widgets: { ...layout.widgets }
};

fs.writeFileSync('dashboards/navigation.json', JSON.stringify(dashboard, null, 2));
```

### Widget-Kopie erstellen (für breakpoint-spezifisches CSS)

```javascript
const { v4: uuidv4 } = require('uuid');

// Original Widget ID
const originalWidgetId = '9094f048-ccc5-b9d7-9dd0-6ef0a20851c9';
const originalWidget = dashboard.configuration.widgets[originalWidgetId];

// Neue ID für die Kopie
const copyWidgetId = uuidv4();

// Widget kopieren mit neuer ID
dashboard.configuration.widgets[copyWidgetId] = JSON.parse(JSON.stringify(originalWidget));

// CSS für Tablet anpassen
dashboard.configuration.widgets[copyWidgetId].config.settings.markdownCss = tabletCss;

// Im Tablet-Breakpoint die neue Widget-ID verwenden
layout.breakpoints.sm.widgets[copyWidgetId] = layout.breakpoints.sm.widgets[originalWidgetId];
delete layout.breakpoints.sm.widgets[originalWidgetId];
```

## Troubleshooting

### Problem: Breakpoint-Änderungen werden nicht angezeigt
- **Ursache:** Browser-Cache oder Dashboard nicht neu geladen
- **Lösung:** Ctrl+F5 oder Dashboard neu öffnen

### Problem: Widget-Positionen nach Layout-Änderung kaputt
- **Ursache:** Widget-Änderungen wurden vor dem Speichern überschrieben
- **Lösung:** Erst Widgets anpassen, dann Layout-Settings ändern, dann speichern
- **Referenz:** [GitHub Issue #10403](https://github.com/thingsboard/thingsboard/issues/10403)

### Problem: CSS gilt für alle Breakpoints
- **Ursache:** Widget ist eine Referenz, kein Copy
- **Lösung:** "Replace reference with widget copy" verwenden

## Quellen

- [ThingsBoard Layouts Documentation](https://thingsboard.io/docs/pe/user-guide/ui/layouts/)
- [ThingsBoard Dashboards Documentation](https://thingsboard.io/docs/user-guide/dashboards/)
- [GitHub Issue #10403 - Layout Changes Break Widget Coordinates](https://github.com/thingsboard/thingsboard/issues/10403)
