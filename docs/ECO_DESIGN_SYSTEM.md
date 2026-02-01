# ECO Design System

> Einheitliche Designsprache für alle ThingsBoard Custom Dialoge im ECO Projekt.

---

## Verwandte Dokumentation

| Dokument | Beschreibung |
|----------|--------------|
| **[dialog-ui-components.md](dialog-ui-components.md)** | Komplette UI-Komponenten-Referenz mit kopierbaren HTML/CSS Snippets |
| [markdown-widget-patterns.md](markdown-widget-patterns.md) | Patterns für Markdown/HTML Card Widgets |

---

## Grundprinzipien

| Eigenschaft | Wert |
|-------------|------|
| **Border Radius** | `0` (keine Rundungen) |
| **Form Appearance** | `fill` |
| **Icon Position** | `matSuffix` (rechts) |
| **Primary Color** | `var(--tb-primary-500)` |

---

## 1. Dialog Struktur

### Größen

```css
.eco-dialog-sm { width: 450px; max-width: 95vw; }  /* Confirmations, Delete */
.eco-dialog-md { width: 600px; max-width: 95vw; }  /* Standard Forms */
.eco-dialog-lg { width: 800px; max-width: 95vw; }  /* Complex, Stepper */
```

### Layout

```
┌─────────────────────────────────────────────────────┐
│  HEADER (56px, Primary Blue)                        │
│  [Icon] Title                              [X]      │
├─────────────────────────────────────────────────────┤
│  PROGRESS BAR (optional)                            │
├─────────────────────────────────────────────────────┤
│  CONTENT (bg: #f8fafc, padding: 24px, gap: 16px)   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ SECTION CARD (white, left border accent)    │   │
│  │ ┌─────────────────────────────────────────┐ │   │
│  │ │ Section Header (bg: #f8fafc)            │ │   │
│  │ ├─────────────────────────────────────────┤ │   │
│  │ │ Section Body (padding: 16px)            │ │   │
│  │ └─────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
├─────────────────────────────────────────────────────┤
│  FOOTER (bg: #fafafa, border-top)                  │
│                            [Cancel]  [Save Button]  │
└─────────────────────────────────────────────────────┘
```

---

## 2. Farbpalette

### Primary (ThingsBoard)
| Name | Variable | Verwendung |
|------|----------|------------|
| Primary | `var(--tb-primary-500)` | Header, Buttons, Akzente |

### Semantic Colors
| Name | Hex | Verwendung |
|------|-----|------------|
| Success | `#10b981` | Bestätigungen, Active Status |
| Warning | `#f59e0b` | Warnungen, Pending Status |
| Error | `#ef4444` | Fehler, Delete Actions |
| Info | `#3b82f6` | Informationen, Hinweise |

### Neutral Colors
| Name | Hex | Verwendung |
|------|-----|------------|
| Background | `#f8fafc` | Dialog Content, Form Fields |
| Surface | `#ffffff` | Cards, Section Bodies |
| Border | `#e2e8f0` | Borders, Dividers |
| Text Primary | `#334155` | Haupttext, Labels |
| Text Secondary | `#64748b` | Hints, Field Labels |
| Text Muted | `#94a3b8` | Placeholder, Disabled |

---

## 3. Komponenten

### 3.1 Dialog Header

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

```css
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
  color: rgba(255,255,255,0.8) !important;
  margin-left: auto;
}
.eco-dialog-header .close-btn:hover {
  color: white !important;
  background: rgba(255,255,255,0.1) !important;
}
```

### 3.2 Dialog Content

```html
<div class="dialog-content">
  <!-- Section Cards here -->
</div>
```

```css
.dialog-content {
  padding: 24px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 70vh;
  overflow-y: auto;
}
```

### 3.3 Section Cards

```html
<div class="section-card">
  <div class="section-header">
    <mat-icon>folder</mat-icon>
    <span>Section Title</span>
  </div>
  <div class="section-body">
    <!-- Form fields -->
  </div>
</div>
```

```css
.section-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-left: 3px solid var(--tb-primary-500);
}
.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 600;
  font-size: 14px;
  color: #334155;
}
.section-header mat-icon {
  font-size: 18px;
  width: 18px;
  height: 18px;
  color: var(--tb-primary-500);
}
.section-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
```

### 3.4 Dialog Footer

```html
<div class="dialog-footer">
  <button mat-button (click)="cancel()">Cancel</button>
  <button mat-raised-button color="primary" type="submit">
    <mat-icon>save</mat-icon>
    Save
  </button>
</div>
```

```css
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  background: #fafafa;
}
```

---

## 4. Form Elements

### 4.1 Text Input

```html
<mat-form-field appearance="fill" class="w-full">
  <mat-label>Label</mat-label>
  <input matInput placeholder="Enter text...">
  <mat-icon matSuffix>edit</mat-icon>
  <mat-hint>Optional hint text</mat-hint>
</mat-form-field>
```

### 4.2 Password Input

```html
<mat-form-field appearance="fill" class="w-full">
  <mat-label>Password</mat-label>
  <input matInput [type]="hidePassword ? 'password' : 'text'">
  <button mat-icon-button matSuffix (click)="hidePassword = !hidePassword" type="button">
    <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
  </button>
</mat-form-field>
```

### 4.3 Number Input

```html
<mat-form-field appearance="fill" class="w-full">
  <mat-label>Amount</mat-label>
  <input matInput type="number" value="42">
  <span matSuffix>units</span>
</mat-form-field>
```

### 4.4 Textarea

```html
<mat-form-field appearance="fill" class="w-full">
  <mat-label>Description</mat-label>
  <textarea matInput rows="3" placeholder="Enter description..."></textarea>
  <mat-hint align="end">0/500</mat-hint>
</mat-form-field>
```

### 4.5 Select Dropdown

```html
<mat-form-field appearance="fill" class="w-full">
  <mat-label>Category</mat-label>
  <mat-select formControlName="category">
    <mat-option value="opt1">Option 1</mat-option>
    <mat-option value="opt2">Option 2</mat-option>
  </mat-select>
  <mat-icon matSuffix>category</mat-icon>
</mat-form-field>
```

### 4.6 Multi-Select

```html
<mat-form-field appearance="fill" class="w-full">
  <mat-label>Tags</mat-label>
  <mat-select multiple formControlName="tags">
    <mat-option value="a">Alpha</mat-option>
    <mat-option value="b">Beta</mat-option>
  </mat-select>
</mat-form-field>
```

### 4.7 Autocomplete

```html
<mat-form-field appearance="fill" class="w-full">
  <mat-label>City</mat-label>
  <input matInput [matAutocomplete]="auto" placeholder="Start typing...">
  <mat-autocomplete #auto="matAutocomplete">
    <mat-option *ngFor="let city of cities" [value]="city">{{ city }}</mat-option>
  </mat-autocomplete>
  <mat-icon matSuffix>search</mat-icon>
</mat-form-field>
```

### 4.8 Date Picker

```html
<mat-form-field appearance="fill" class="w-full">
  <mat-label>Date</mat-label>
  <input matInput [matDatepicker]="picker">
  <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
  <mat-datepicker #picker></mat-datepicker>
</mat-form-field>
```

### 4.9 Checkboxes

```html
<div class="field-label">Options</div>
<mat-checkbox formControlName="optionA">Option A</mat-checkbox>
<mat-checkbox formControlName="optionB">Option B</mat-checkbox>
```

### 4.10 Radio Buttons

```html
<div class="field-label">Selection</div>
<mat-radio-group formControlName="choice" class="radio-group">
  <mat-radio-button value="1">Choice 1</mat-radio-button>
  <mat-radio-button value="2">Choice 2</mat-radio-button>
</mat-radio-group>
```

```css
.radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
```

### 4.11 Slide Toggle

```html
<mat-slide-toggle formControlName="enabled">Enable Feature</mat-slide-toggle>
```

---

## 5. Chips & Tags

### Status Chips

```html
<span class="eco-chip eco-chip-success">
  <mat-icon>check_circle</mat-icon>
  Active
</span>
<span class="eco-chip eco-chip-warning">
  <mat-icon>schedule</mat-icon>
  Pending
</span>
<span class="eco-chip eco-chip-error">
  <mat-icon>error</mat-icon>
  Error
</span>
<span class="eco-chip eco-chip-info">
  <mat-icon>info</mat-icon>
  Info
</span>
```

```css
.eco-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 16px;
}
.eco-chip mat-icon {
  font-size: 16px;
  width: 16px;
  height: 16px;
}
.eco-chip-success { background: #ecfdf5; color: #047857; }
.eco-chip-warning { background: #fffbeb; color: #b45309; }
.eco-chip-error { background: #fef2f2; color: #b91c1c; }
.eco-chip-info { background: #eff6ff; color: #1d4ed8; }
```

### Removable Chips (Material)

```html
<mat-chip-listbox>
  <mat-chip-option>
    Tag 1
    <mat-icon matChipRemove>cancel</mat-icon>
  </mat-chip-option>
</mat-chip-listbox>
```

---

## 6. Buttons

### Primary Action

```html
<button mat-raised-button color="primary">
  <mat-icon>save</mat-icon>
  Save
</button>
```

### Secondary Action

```html
<button mat-button>Cancel</button>
```

### Danger Action

```html
<button mat-raised-button color="warn">
  <mat-icon>delete</mat-icon>
  Delete
</button>
```

### Outlined Button

```html
<button mat-stroked-button>
  <mat-icon>add</mat-icon>
  Add Item
</button>
```

### Icon Buttons

```html
<button mat-icon-button color="primary"><mat-icon>edit</mat-icon></button>
<button mat-mini-fab color="primary"><mat-icon>add</mat-icon></button>
```

---

## 7. Info Banners

```html
<div class="eco-banner eco-banner-info">
  <mat-icon>info</mat-icon>
  <span>Informational message.</span>
</div>

<div class="eco-banner eco-banner-success">
  <mat-icon>check_circle</mat-icon>
  <span>Success message.</span>
</div>

<div class="eco-banner eco-banner-warning">
  <mat-icon>warning</mat-icon>
  <span>Warning message.</span>
</div>

<div class="eco-banner eco-banner-error">
  <mat-icon>error</mat-icon>
  <span>Error message.</span>
</div>
```

```css
.eco-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  font-size: 14px;
}
.eco-banner mat-icon {
  font-size: 20px;
  width: 20px;
  height: 20px;
}
.eco-banner-info {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
}
.eco-banner-info mat-icon { color: #3b82f6; }

.eco-banner-success {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #047857;
}
.eco-banner-success mat-icon { color: #10b981; }

.eco-banner-warning {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #b45309;
}
.eco-banner-warning mat-icon { color: #f59e0b; }

.eco-banner-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
}
.eco-banner-error mat-icon { color: #ef4444; }
```

---

## 8. Progress Indicators

### Progress Bar (Determinate)

```html
<mat-progress-bar mode="determinate" value="65"></mat-progress-bar>
<div class="progress-label">65% Complete</div>
```

### Progress Bar (Indeterminate/Loading)

```html
<mat-progress-bar mode="indeterminate"></mat-progress-bar>
```

### Spinner

```html
<mat-spinner diameter="40"></mat-spinner>
```

---

## 9. Layout Helpers

### Form Row (Columns)

```html
<div class="form-row">
  <mat-form-field appearance="fill" class="form-col">...</mat-form-field>
  <mat-form-field appearance="fill" class="form-col">...</mat-form-field>
</div>
```

```css
.form-row {
  display: flex;
  gap: 16px;
}
.form-col {
  flex: 1;
}
.w-full {
  width: 100%;
}
```

### Field Label

```html
<div class="field-label">Section Label</div>
```

```css
.field-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}
```

---

## 10. Form Field Styling

```css
/* Fill appearance background */
.mdc-text-field--filled:not(.mdc-text-field--disabled) {
  background-color: #f8fafc !important;
}
.mat-mdc-form-field-focus-overlay {
  background-color: rgba(48, 86, 128, 0.05) !important;
}

/* Disabled fields */
.mdc-text-field--filled.mdc-text-field--disabled {
  background-color: rgba(244, 249, 254, 0.5) !important;
}
```

---

## 11. Dialog Container (No Border Radius)

```css
.mat-mdc-dialog-container { border-radius: 0 !important; }
.mat-mdc-dialog-surface { border-radius: 0 !important; }
.mdc-dialog__surface { border-radius: 0 !important; }
```

---

## 12. Vollständiges Beispiel

```html
<div class="eco-dialog" style="width: 600px;">
  <!-- Header -->
  <mat-toolbar class="eco-dialog-header">
    <mat-icon class="header-icon">folder_open</mat-icon>
    <h2 class="header-title">Add Project</h2>
    <span class="flex-1"></span>
    <button mat-icon-button (click)="cancel()" class="close-btn">
      <mat-icon>close</mat-icon>
    </button>
  </mat-toolbar>

  <!-- Progress -->
  <mat-progress-bar mode="indeterminate" *ngIf="isLoading"></mat-progress-bar>

  <!-- Content -->
  <div class="dialog-content">
    <!-- Section 1 -->
    <div class="section-card">
      <div class="section-header">
        <mat-icon>business</mat-icon>
        <span>Customer</span>
      </div>
      <div class="section-body">
        <mat-form-field appearance="fill" class="w-full">
          <mat-label>Customer</mat-label>
          <mat-select formControlName="customer">
            <mat-option *ngFor="let c of customers" [value]="c">{{ c.name }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
    </div>

    <!-- Section 2 -->
    <div class="section-card">
      <div class="section-header">
        <mat-icon>info</mat-icon>
        <span>Project Info</span>
      </div>
      <div class="section-body">
        <mat-form-field appearance="fill" class="w-full">
          <mat-label>Project Name</mat-label>
          <input matInput formControlName="name">
          <mat-icon matSuffix>edit</mat-icon>
        </mat-form-field>
      </div>
    </div>

    <!-- Info Banner -->
    <div class="eco-banner eco-banner-info">
      <mat-icon>info</mat-icon>
      <span>Additional information here.</span>
    </div>
  </div>

  <!-- Footer -->
  <div class="dialog-footer">
    <button mat-button (click)="cancel()">Cancel</button>
    <button mat-raised-button color="primary" type="submit" [disabled]="isLoading">
      <mat-icon>save</mat-icon>
      Save
    </button>
  </div>
</div>
```

---

## Icon Referenz

| Kontext | Icon |
|---------|------|
| Company/Customer | `business` |
| User | `person` |
| Project | `folder_open` |
| Edit | `edit` |
| Location/Address | `location_on` |
| Save | `save` |
| Delete | `delete` |
| Add | `add` |
| Close | `close` |
| Info | `info` |
| Warning | `warning` |
| Error | `error` |
| Success | `check_circle` |
| Settings | `settings` |
| Device | `devices` |
| Measurement | `assessment` |
| Calendar/Date | `event` |
| Email | `email` |
| Phone | `phone` |

---

*Erstellt: 2026-01-31*
*Version: 1.0*
