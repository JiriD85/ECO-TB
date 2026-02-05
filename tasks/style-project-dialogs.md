# Task: Edit Project & Project Dialogs Styling

## Status: ✅ Completed

## Änderungen (2026-02-03)

### Problem 1: CSS in customCss Feld funktioniert nicht
- **Lösung:** CSS direkt im HTML Template mit `<style>` Tag einbetten (ECO Project Wizard Pattern)

### Problem 2: Falsches Section Pattern verwendet
- **Alt:** `<fieldset>` mit `<legend>` und inline styles
- **Neu:** ECO Design System `.section-card` Pattern:
  ```html
  <div class="section-card">
    <div class="section-header">
      <mat-icon>icon</mat-icon>
      <span>SECTION TITLE</span>
    </div>
    <div class="section-body">
      <!-- Form fields -->
    </div>
  </div>
  ```

### CSS Eigenschaften für Section Cards
```css
.section-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-left: 3px solid #1976d2;  /* Blauer linker Border! */
}
.section-header {
  background: #f8fafc;
  font-weight: 600;
  font-size: 0.8125rem;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.section-header mat-icon {
  color: #1976d2;
}
```

## Beschreibung

Die Dialog-Actions "Edit Project" und "Project" im Measurements Dashboard (State: `all_projects`) müssen nach ECO Design System gestylt werden.

## Ort

- **Dashboard:** `measurements.json`
- **State:** `all_projects`
- **Action Type:** `customPretty` (inline dialog definition)

## Anforderungen

### ECO Design System Styling anwenden:

1. **Header** - Blauer Hintergrund
```css
.eco-dialog-header {
  background: #1976d2 !important;
  color: white !important;
  height: 52px !important;
}
```

2. **Content** - Heller Hintergrund
```css
.dialog-content {
  background: #f8fafc !important;
  padding: 16px 20px !important;
}
```

3. **Footer** - Grauer Hintergrund
```css
.dialog-footer {
  background: #fafafa !important;
  border-top: 1px solid #e2e8f0 !important;
}
```

4. **Section Cards** - Falls Formularfelder gruppiert sind

## Pattern (aus ECO Project Wizard)

CSS muss **im HTML Template eingebettet** werden:

```html
<style>
.my-dialog .eco-dialog-header,
mat-toolbar.eco-dialog-header {
  background: #1976d2 !important;
  color: white !important;
  ...
}
</style>
<form class="my-dialog">
  <mat-toolbar class="eco-dialog-header">
    <mat-icon class="header-icon">icon_name</mat-icon>
    <h2 class="header-title">Title</h2>
    <span class="flex-1"></span>
    <button mat-icon-button (click)="cancel()" class="close-btn">
      <mat-icon>close</mat-icon>
    </button>
  </mat-toolbar>
  <div class="dialog-content">...</div>
  <div class="dialog-footer">...</div>
</form>
```

## Workflow

1. `node sync/sync.js pull measurements` - Aktuelles Dashboard holen
2. Actions im State `all_projects` finden:
   - "Edit Project" Action
   - "Project" Action
3. `customHtml` und `customCss` nach ECO Design System anpassen
4. Testen im Browser
5. `node sync/sync.js push measurements`
6. Git commit

## Referenz

- `docs/dialog-ui-components.md` - UI Komponenten
- `js library/ECO Project Wizard.js` - Beispiel für embedded CSS
- `tasks/component-prices-dialog.md` - Learnings zu CSS Einbettung
