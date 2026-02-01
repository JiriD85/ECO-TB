# Task: Unified Dialog Design System

## Übersicht

Implementierung einer einheitlichen Designsprache für alle Custom Action Dialoge in den Dashboards `administration.json` und `measurements.json` sowie in der `ECO Project Wizard.js` Library.

## Design-Spezifikation

### Grundprinzipien

| Element | Spezifikation |
|---------|---------------|
| **Header Background** | `var(--tb-primary-500)` (ThingsBoard Primary Blue) |
| **Header Text** | `white` |
| **Border Radius** | `0` (keine abgerundeten Ecken) |
| **Form Icons** | `matSuffix` (rechts im Feld) |
| **Font** | System Font Stack |

### Header-Template (Standard)

```html
<mat-toolbar class="eco-dialog-header">
  <mat-icon class="header-icon">icon_name</mat-icon>
  <h2 class="header-title">Dialog Title</h2>
  <span class="flex-1"></span>
  <button mat-icon-button (click)="cancel()" type="button" class="close-btn">
    <mat-icon>close</mat-icon>
  </button>
</mat-toolbar>
```

### Standard CSS

```css
/* ECO Dialog Design System */

.eco-dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  height: 56px;
  background-color: var(--tb-primary-500);
  color: white;
}

.eco-dialog-header .header-icon {
  font-size: 24px;
  width: 24px;
  height: 24px;
}

.eco-dialog-header .header-title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.eco-dialog-header .close-btn {
  color: rgba(255, 255, 255, 0.8);
}

.eco-dialog-header .close-btn:hover {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

/* Form Fields */
.eco-dialog .mat-mdc-form-field {
  width: 100%;
}

/* Dialog Container */
.mat-mdc-dialog-container,
.mat-mdc-dialog-surface,
.mdc-dialog__surface {
  border-radius: 0 !important;
}
```

---

## Aktuelle Inkonsistenzen

### Header-Varianten (IST-Zustand)

| Pattern | Verwendung | Problem |
|---------|------------|---------|
| `<mat-toolbar fxLayout="row" color="primary">` | Add Company, Add Doktorkit | Veraltetes fxLayout |
| `<mat-toolbar class="flex items-center" color="primary">` | Add Project, Edit Project | Inkonsistente Icon-Styles |
| `<mat-toolbar class="flex items-center bg-primary text-white">` | Edit Company, Add Kit, Transfer Kit | Redundante Klassen |
| `<div class="dialog-header">` mit Gradient | btn-add-kit | Custom Gradient statt Primary |
| `<mat-toolbar style="background-color: var(--tb-primary-500)">` | Measurement Info | Inline Style |

### Title-Varianten

| Pattern | Problem |
|---------|---------|
| `<h2>Title</h2>` | Kein Styling |
| `<h2 style="margin: 0; font-size: 18px;">` | Inline Styles |
| `<h2 class="text-lg font-semibold">` | Utility Classes statt semantischer Klasse |

### Icon-Platzierung in Formularen

| Aktuell | Ziel |
|---------|------|
| `matPrefix` (links) | `matSuffix` (rechts) |
| Inkonsistent | Einheitlich rechts |

---

## Dialoge zu aktualisieren

### Administration Dashboard (administration.json)

#### State: `eco_administration`
| Widget | Action | Trigger | Status |
|--------|--------|---------|--------|
| Retrofit companies | `{i18n:custom.retrofit-companies.edit-company}` | actionCellButton | ⬜ |
| Retrofit companies | `{i18n:custom.retrofit-companies.add-company}` | headerButton | ⬜ |
| Retrofit companies | `Check Permissions` | actionCellButton | ⬜ |

#### State: `manage_users`
| Widget | Action | Trigger | Status |
|--------|--------|---------|--------|
| Manage Users Header | `btn-add-user` | elementClick | ⬜ |

#### State: `user_readonly`
| Widget | Action | Trigger | Status |
|--------|--------|---------|--------|
| Users | `{i18n:custom.user-management.edit-user}` | actionCellButton | ⬜ |

#### State: `user_engineers`
| Widget | Action | Trigger | Status |
|--------|--------|---------|--------|
| Engineers | `{i18n:custom.user-management.edit-user}` | actionCellButton | ⬜ |

#### State: `user_admininistrators`
| Widget | Action | Trigger | Status |
|--------|--------|---------|--------|
| Administrators | `{i18n:custom.user-management.edit-user}` | actionCellButton | ⬜ |

#### State: `manage_projects`
| Widget | Action | Trigger | Status |
|--------|--------|---------|--------|
| Manage Projects Header | `btn-add-project` | elementClick | ⬜ |
| Manage Projects Header | `btn-manage-project-users` | elementClick | ⬜ |

#### State: `projects_all`
| Widget | Action | Trigger | Status |
|--------|--------|---------|--------|
| {i18n:custom.diagnostics.projects.title} | `Edit Project` | actionCellButton | ⬜ |
| {i18n:custom.diagnostics.projects.title} | `Project` (Add) | headerButton | ⬜ |

#### State: `manage_diagnostickits`
| Widget | Action | Trigger | Status |
|--------|--------|---------|--------|
| New Markdown/HTML Card | `btn-add-kit` | elementClick | ⬜ |
| New Markdown/HTML Card | `btn-transfer-kit` | elementClick | ⬜ |

#### State: `manage_diagnostickits_admin`
| Widget | Action | Trigger | Status |
|--------|--------|---------|--------|
| Diagnostic Kits | `{i18n:custom.diagnostic-kits.edit-diagnostic-kit}` | actionCellButton | ⬜ |
| Diagnostic Kits | `{i18n:custom.diagnostic-kits.add-diagnostic-kit}` | headerButton | ⬜ |
| Diagnostic Kits | `{i18n:custom.diagnostic-kits.transfer-kit}` | headerButton | ⬜ |

#### State: `manage_diagnostickits_customer`
| Widget | Action | Trigger | Status |
|--------|--------|---------|--------|
| New Markdown/HTML Card | `add-Doktorkit` | elementClick | ⬜ |

**Gesamt Administration: 16 Dialoge**

---

### Measurements Dashboard (measurements.json)

#### State: `all_projects`
| Widget | Action | Trigger | Status |
|--------|--------|---------|--------|
| {i18n:custom.diagnostics.projects.title} | `Edit Project` | actionCellButton | ⬜ |
| {i18n:custom.diagnostics.projects.title} | `Project` (Add) | headerButton | ⬜ |

#### State: `measurement_dashboard`
| Widget | Action | Trigger | Status |
|--------|--------|---------|--------|
| Markdown/HTML Card | `measurement-switch-button` | elementClick | ⬜ |
| Markdown/HTML Card | `analysis-button` | elementClick | ⬜ |

**Gesamt Measurements: 4 Dialoge**

---

### ECO Project Wizard.js (6 Dialoge)

| Dialog | Template/Function | Status |
|--------|-------------------|--------|
| Project Wizard | `startProjectHtmlTemplate` | ⬜ |
| Finish Project | `finishHtmlTemplate` | ⬜ |
| Add Measurement | `addMeasurementHtmlTemplate` | ⬜ |
| Measurement Parameters | `measurementParametersHtmlTemplate` | ⬜ |
| Measurement Info | `measurementInfoHtmlTemplate` | ⬜ |
| Edit Project | `openEditProjectDialog()` inline | ⬜ |

### ECO Data Importer.js (3 Dialoge)

| Dialog | Line | Status |
|--------|------|--------|
| CSV Import Dialog | ~415 | ⬜ |
| Assign Device Dialog | ~2215 | ⬜ |
| Data Preview Dialog | ~2860 | ⬜ |

### ECO Kit Devices Popup.js (1 Dialog)

| Dialog | Pattern | Status |
|--------|---------|--------|
| Kit Devices Dialog | `div.dialog-header` | ⬜ |

### ECO Diagnostics Utils JS.js (1 Dialog)

| Dialog | Line | Status |
|--------|------|--------|
| Utils Dialog | ~863 | ⬜ |

---

## Implementierungs-Schritte

### Phase 1: CSS Foundation
- [ ] Gemeinsame CSS-Klassen definieren (`.eco-dialog-header`, etc.)
- [ ] CSS in alle Dialoge einbinden
- [ ] Border-radius: 0 für alle Dialog-Container

### Phase 2: Administration Dashboard
- [ ] Edit Company Dialog aktualisieren
- [ ] Add Company Dialog aktualisieren
- [ ] Edit/Add User Dialoge aktualisieren
- [ ] Add/Edit Project Dialoge aktualisieren
- [ ] Manage Project Users Dialog aktualisieren
- [ ] Diagnostic Kit Dialoge aktualisieren
- [ ] Form Icons auf matSuffix umstellen

### Phase 3: Measurements Dashboard
- [ ] Edit Project Dialog aktualisieren
- [ ] Measurement Switch Dialog aktualisieren
- [ ] Analysis Dialog aktualisieren

### Phase 4: ECO Project Wizard.js
- [ ] Project Wizard Dialog aktualisieren
- [ ] Add Measurement Dialog aktualisieren
- [ ] Measurement Parameters Dialog aktualisieren
- [ ] Measurement Info Dialog aktualisieren
- [ ] Edit Project Dialog aktualisieren

### Phase 5: Testing & Review
- [ ] Alle Dialoge visuell prüfen
- [ ] Konsistenz über alle States verifizieren
- [ ] Responsiveness testen

---

## Referenz: Icon-Mapping

| Dialog | Icon |
|--------|------|
| Add/Edit Company | `business` |
| Add/Edit User | `person` |
| Add/Edit Project | `folder_open` |
| Edit Project | `edit` |
| Project Users | `group` |
| Add/Edit Diagnostic Kit | `medical_services` |
| Transfer Kit | `swap_horiz` |
| Check Permissions | `verified_user` |
| Measurement Parameters | `tune` |
| Measurement Info | `info` |
| Project Wizard | `auto_fix_high` |
| Analysis | `insights` |
| Delete | `delete` |

---

## Dateien zu modifizieren

1. **dashboards/administration.json**
   - 16 customPretty Actions in 10 States

2. **dashboards/measurements.json**
   - 4 customPretty Actions in 2 States

3. **js library/ECO Project Wizard.js**
   - 6 Dialog HTML Templates

**Gesamt: 26 Dialoge**

---

*Erstellt: 2026-01-31*
*Aktualisiert: 2026-01-31*
*Status: ✅ Implementierung abgeschlossen*

---

## Zusammenfassung der Änderungen

### Dashboards (21 Dialoge)
- **administration.json**: 17 Dialoge aktualisiert
- **measurements.json**: 4 Dialoge aktualisiert

### JS Libraries (11 Dialoge)
- **ECO Project Wizard.js**: 6 Dialoge aktualisiert
- **ECO Data Importer.js**: 3 Dialoge aktualisiert
- **ECO Diagnostics Utils JS.js**: 1 Dialog aktualisiert
- **ECO Kit Devices Popup.js**: 1 Dialog aktualisiert

### Design-Änderungen
1. Alle Headers verwenden jetzt `eco-dialog-header` CSS-Klasse
2. Background: `var(--tb-primary-500)` (ThingsBoard Primary Blue)
3. Form Icons: `matSuffix` (rechts platziert)
4. Border-radius: 0 für alle Dialog-Container
5. Einheitliche Header-Struktur mit Icon, Titel und Close-Button
