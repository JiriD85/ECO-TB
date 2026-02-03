# Task: Component Prices Dialog

## Status: ✅ Completed

## Erkenntnisse & Learnings

### 1. customDialog API - CSS Einbettung (KRITISCH!)

**Problem:** CSS als separater Parameter funktioniert NICHT zuverlässig.

**FALSCH:**
```javascript
const cssTemplate = `...`;
customDialog.customDialog(htmlTemplate, Controller, { myCSS: cssTemplate }).subscribe();
```

**RICHTIG - CSS direkt im HTML Template einbetten:**
```javascript
const htmlTemplate = `<style>
/* CSS hier einbetten */
.my-dialog .eco-dialog-header { background: #1976d2 !important; }
</style>
<form class="my-dialog">
  ...
</form>`;

customDialog.customDialog(htmlTemplate, Controller).subscribe();
```

**Das ist das Pattern aus ECO Project Wizard!**

### 2. CSS Styling in ThingsBoard Custom Dialogs

**Problem:** Material Design Komponenten (z.B. `mat-toolbar`) haben eigene Styles die Standard-CSS überschreiben.

**Lösung:**
- Explizite Hex-Farben verwenden statt CSS Variables (`#1976d2` statt `var(--tb-primary-500)`)
- Mehrere Selektoren mit hoher Spezifität kombinieren
- `!important` verwenden um Material Styles zu überschreiben

```css
/* RICHTIG - Mehrere Selektoren für höhere Spezifität */
.component-prices-dialog .eco-dialog-header,
mat-toolbar.eco-dialog-header,
.eco-dialog-header {
  background: #1976d2 !important;
  color: white !important;
}
```

### 2. ECO Design System Pflicht-Elemente

| Element | Farbe/Style |
|---------|-------------|
| Header Background | `#1976d2` (blau) |
| Header Text | `white` |
| Content Background | `#f8fafc` |
| Footer Background | `#fafafa` |
| Border Color | `#e2e8f0` |

### 3. Browser Cache

**Problem:** Nach Push werden alte JS Libraries aus dem Cache geladen.

**Lösung:** `Cmd+Shift+R` (Hard Refresh) ausführen um Cache zu umgehen.

### 4. Dateien

| Datei | Zweck |
|-------|-------|
| `js library/ECO ROI.js` | Component Prices Dialog Library |
| `dashboards/administration.json` | Dashboard mit Actions |

### 5. Actions

**eco_administration State (Tenant Admin):**
- Action: `act-component-prices`
- Typ: Cell Button auf Customer Table
- Übergibt: `customerId = entityId`

**customer_administration State (Customer Admin):**
- Action: `act-component-prices-customer`
- Typ: elementClick auf Markdown Widget
- Sichtbar nur für: Administrator, ECO Diagnostics Administrators, Belimo Retrofit Administrators
- Verwendet: `ctx.dashboard.authUser.sub` für User-Matching

### 6. Datenstruktur

Customer Attribut `componentPrices` (SERVER_SCOPE):
```json
{
  "DN15": { "valve": 0, "pump": 0, "other": 0, "service": 0 },
  "DN20": { "valve": 0, "pump": 0, "other": 0, "service": 0 },
  ...
  "DN200": { "valve": 0, "pump": 0, "other": 0, "service": 0 }
}
```

## Offene Punkte

- [x] Total Row entfernt, nur Total Spalte bleibt ✅
- [x] Dialog Styling verifiziert - funktioniert korrekt ✅

## Änderungshistorie

| Datum | Änderung |
|-------|----------|
| 2026-02-03 | Initial: Dialog erstellt mit CSV Import/Export |
| 2026-02-03 | Fix: Blue Header CSS mit höherer Spezifität |
| 2026-02-03 | Fix: Total Row entfernt (nur Total Spalte behalten) |
| 2026-02-03 | **FIX: CSS in HTML Template eingebettet** (ECO Project Wizard Pattern) |
