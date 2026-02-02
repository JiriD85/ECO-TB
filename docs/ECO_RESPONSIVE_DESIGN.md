# ECO Responsive Design - Implementierungsreferenz

## Grundprinzipien

### ThingsBoard Breakpoint-System

**KRITISCH**: ThingsBoard Breakpoints funktionieren NICHT wie CSS Media Queries!

| Aspekt | ThingsBoard | CSS Media Queries |
|--------|-------------|-------------------|
| Ort | Dashboard JSON Layout | Innerhalb eines CSS-Files |
| Vererbung | KEINE - jeder State braucht eigene | Kaskadieren automatisch |
| Widget-CSS | Pro Breakpoint eigenes Widget nötig | Ein CSS für alle |
| Trigger | Container-Breite (nicht Viewport) | Viewport-Breite |

### Breakpoint-Größen

| Breakpoint | Key | Breite | Verwendung |
|------------|-----|--------|------------|
| Desktop | `main` (default) | ≥960px | 5 horizontale Karten |
| Tablet | `sm` | 600-959px | 3+2 Grid |
| Mobile | `xs` | ≤599px | Vertikale Liste |

## Implementierungsschritte

### 1. Breakpoints zum State hinzufügen

```javascript
// In dashboard.configuration.states.{stateId}.layouts.main
layout.breakpoints = {
    sm: {
        gridSettings: {
            viewFormat: 'grid',      // NICHT 'list'!
            autoFillHeight: true,    // WICHTIG für nested states
            columns: 24,
            margin: 10,
            rowHeight: 70
        },
        widgets: { /* Widget-Positionen */ }
    },
    xs: {
        gridSettings: { /* gleiche Struktur */ },
        widgets: { /* Widget-Positionen */ }
    }
};
```

### 2. Widget-Kopien erstellen (für eigenes CSS pro Breakpoint)

```javascript
const crypto = require('crypto');

// Neue Widget-ID generieren
const newWidgetId = crypto.randomUUID();

// Widget klonen
dashboard.configuration.widgets[newWidgetId] =
    JSON.parse(JSON.stringify(originalWidget));

// Im Breakpoint das neue Widget referenzieren
layout.breakpoints.sm.widgets[newWidgetId] = {
    sizeX: 24,
    sizeY: 12,
    row: 0,
    col: 0
};

// Original aus Breakpoint entfernen
delete layout.breakpoints.sm.widgets[originalWidgetId];
```

### 3. Widget-Einstellungen korrigieren

**WICHTIG - Diese Einstellungen MÜSSEN gesetzt werden:**

```javascript
// Im Widget selbst (nicht im Layout!)
widget.sizeX = 24;  // Volle Breite
widget.sizeY = 12;  // Ausreichende Höhe

// In widget.config.settings
widget.config.settings.applyDefaultMarkdownStyle = false;  // Eigenes CSS!
```

### 4. Nested States (States in States)

Wenn ein State innerhalb eines anderen angezeigt wird (z.B. home in default via `<tb-dashboard-state>`):

```javascript
// BEIDE States brauchen korrekte Breakpoint-Settings!

// Parent State (default)
defaultState.layouts.main.breakpoints.xs.gridSettings = {
    autoFillHeight: true,   // Container füllt Viewport
    viewFormat: 'grid'      // NICHT 'list'
};

// Child State (home)
homeState.layouts.main.breakpoints.xs.gridSettings = {
    autoFillHeight: true,
    viewFormat: 'grid'
};
```

## ECO Industrial Precision Design System

### Farbpalette

```css
:root {
    --eco-primary: #1976D2;
    --eco-primary-light: #42A5F5;
    --eco-primary-dark: #0D47A1;
    --eco-surface: #FFFFFF;
    --eco-bg: #F5F7FA;
    --eco-text: #1A1F36;
    --eco-text-muted: #5E6278;
    --eco-border: rgba(0, 0, 0, 0.06);
}
```

### Typografie

| Element | Font | Größe | Gewicht |
|---------|------|-------|---------|
| Titel | DM Sans | 15px (mobile), 16px (desktop) | 600 |
| Beschreibung | DM Sans | 12px (mobile), 13px (desktop) | 400 |
| Nummer-Badge | JetBrains Mono | 10px | 500 |

### Schatten

```css
--eco-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
--eco-shadow-md: 0 2px 8px rgba(0, 0, 0, 0.08);
--eco-shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.12);
```

### Card-Komponente

#### Mobile Layout (Horizontal Card)

```
┌─────────────────────────────────────────────────┐
│▌  ┌────┐  Titel                         [01]  →│
│▌  │ 🔧 │  Beschreibung...                      │
│▌  └────┘                                       │
└─────────────────────────────────────────────────┘
 ↑     ↑           ↑                      ↑    ↑
 │     │           │                      │    └─ Pfeil-Button
 │     │           │                      └────── Nummer-Badge
 │     │           └─────────────────────────────  Text (Grid col 2)
 │     └─────────────────────────────────────────  Icon (Grid col 1)
 └───────────────────────────────────────────────  Akzent-Linie (4px)
```

#### Desktop Layout (Vertical Card)

```
┌─────────────────┐
│████████████████│  ← Akzent-Linie (4px, horizontal)
│                │
│  ┌────┐   [01] │  ← Icon + Nummer-Badge
│  │ 🔧 │        │
│  └────┘        │
│                │
│  Titel         │
│  Beschreibung  │
│  ...           │
│                │
├────────────────┤
│  Mehr →        │  ← Footer mit Link
└────────────────┘
```

### CSS Grid für Mobile Cards

```css
.card-content {
    display: grid !important;
    grid-template-columns: 44px 1fr !important;
    grid-template-rows: auto auto !important;
    gap: 4px 14px !important;
}

.card-icon-wrapper {
    grid-row: 1 / 3;   /* Spans both rows */
    grid-column: 1;
}

.card-title {
    grid-row: 1;
    grid-column: 2;
}

.card-description {
    grid-row: 2;
    grid-column: 2;
}
```

## Häufige Fehler & Lösungen

### Problem: Widget ist nur wenige Pixel breit

**Ursache**: Widget `sizeX` in der Basis-Konfiguration ist zu klein (z.B. 5).

**Lösung**:
```javascript
widget.sizeX = 24;
widget.sizeY = 12;
```

### Problem: CSS wird nicht angewendet

**Ursache**: `applyDefaultMarkdownStyle: true` überschreibt eigenes CSS.

**Lösung**:
```javascript
widget.config.settings.applyDefaultMarkdownStyle = false;
```

### Problem: Inhalt wird abgeschnitten

**Ursache**: Parent State hat `autoFillHeight: false` und `viewFormat: 'list'`.

**Lösung**:
```javascript
breakpoint.gridSettings.autoFillHeight = true;
breakpoint.gridSettings.viewFormat = 'grid';
```

### Problem: Breakpoint-Änderungen werden nicht angezeigt

**Lösungen**:
1. Browser Cache leeren (Ctrl+F5)
2. Dashboard neu laden
3. Prüfen ob BEIDE States (parent + child) Breakpoints haben

## Script-Workflow

```bash
# 1. Breakpoints zum State hinzufügen
node scripts/add-home-breakpoints.js

# 2. CSS auf Widgets anwenden
node scripts/apply-responsive-design.js

# 3. Widget-Settings korrigieren
node scripts/fix-widget-settings.js
node scripts/fix-widget-base-size.js

# 4. Nested State Settings korrigieren
node scripts/fix-default-state-responsive.js

# 5. Zum Server pushen
node sync/sync.js push navigation
```

## CSS-Dateien

| Datei | Breakpoint | Layout |
|-------|------------|--------|
| `styles/home-tiles-desktop.css` | ≥960px | 5 horizontale Karten |
| `styles/home-tiles-tablet.css` | 600-959px | 3+2 Grid |
| `styles/home-tiles-mobile.css` | ≤599px | Vertikale Liste |

## Wichtige Widget-IDs (Navigation Dashboard)

| Widget | ID | Verwendung |
|--------|----|-----------|
| Desktop Tiles | `9094f048-ccc5-b9d7-9dd0-6ef0a20851c9` | Default Layout |
| Tablet Tiles | `6fea78ac-b89f-4eba-8b79-97bfbe11c7c6` | sm Breakpoint |
| Mobile Tiles | `8fcef910-6a17-4022-9186-0675867a098b` | xs Breakpoint |
| Tab Navigation | `1dd6b46f-3282-d932-e25d-d495ef9c2432` | default State |
