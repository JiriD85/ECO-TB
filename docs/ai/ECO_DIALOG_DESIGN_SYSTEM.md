# ECO Dialog Design System

## Design-Vorschlag für einheitliche Dialoge

---

## 1. Dialog-Größen

| Kategorie | Breite | Verwendung |
|-----------|--------|------------|
| **Small** | `450px` | Einfache Aktionen: Bestätigungen, Delete, Transfer |
| **Medium** | `600px` | Standard-Formulare: Add/Edit Entity |
| **Large** | `800px` | Komplexe Dialoge: Stepper, Wizards, Multi-Tab |

```css
.eco-dialog-sm { width: 450px; max-width: 95vw; }
.eco-dialog-md { width: 600px; max-width: 95vw; }
.eco-dialog-lg { width: 800px; max-width: 95vw; }
```

---

## 2. Farbpalette

### Primary Colors (ThingsBoard)
| Name | CSS Variable | Hex | Verwendung |
|------|--------------|-----|------------|
| Primary | `var(--tb-primary-500)` | #305680 | Header, Primary Buttons |
| Primary Light | `var(--tb-primary-100)` | #e3f2fd | Hover, Selection |
| Primary Dark | `var(--tb-primary-700)` | #1a365d | Active States |

### Semantic Colors
| Name | Hex | Verwendung |
|------|-----|------------|
| Success | `#10b981` | Bestätigungen, Erfolg |
| Warning | `#f59e0b` | Warnungen, Achtung |
| Error | `#ef4444` | Fehler, Delete |
| Info | `#3b82f6` | Information, Hinweise |

### Neutral Colors
| Name | Hex | Verwendung |
|------|-----|------------|
| Background | `#f8fafc` | Dialog Body Background |
| Surface | `#ffffff` | Cards, Form Fields |
| Border | `#e2e8f0` | Borders, Dividers |
| Text Primary | `#1e293b` | Haupttext |
| Text Secondary | `#64748b` | Labels, Hints |
| Text Muted | `#94a3b8` | Placeholder, Disabled |

---

## 3. Layout-Struktur

### Standard Dialog Layout
```
┌─────────────────────────────────────────────────────┐
│  HEADER (56px)                                      │
│  [Icon] Title                           [X]         │
├─────────────────────────────────────────────────────┤
│  PROGRESS BAR (4px) - optional                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  CONTENT AREA                                       │
│  - Padding: 24px                                    │
│  - Gap: 16px zwischen Elementen                    │
│  - Background: #f8fafc                             │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  SECTION CARD                                │   │
│  │  - Background: white                         │   │
│  │  - Border: 1px solid #e2e8f0                │   │
│  │  - Border-left: 3px solid [accent-color]    │   │
│  │  - Padding: 16px                            │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
├─────────────────────────────────────────────────────┤
│  FOOTER                                             │
│  - Padding: 16px 24px                              │
│  - Border-top: 1px solid #e2e8f0                   │
│  - Background: #fafafa                             │
│                          [Cancel]  [Primary Action] │
└─────────────────────────────────────────────────────┘
```

---

## 4. Komponenten

### 4.1 Header
```html
<mat-toolbar class="eco-dialog-header">
  <mat-icon class="header-icon">icon_name</mat-icon>
  <h2 class="header-title">Dialog Title</h2>
  <span class="flex-1"></span>
  <button mat-icon-button (click)="cancel()" class="close-btn">
    <mat-icon>close</mat-icon>
  </button>
</mat-toolbar>
```

### 4.2 Content Area
```html
<div class="eco-dialog-content">
  <!-- Sections here -->
</div>
```

```css
.eco-dialog-content {
  padding: 24px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 70vh;
  overflow-y: auto;
}
```

### 4.3 Section Cards
```html
<div class="eco-section-card eco-section-primary">
  <div class="eco-section-header">
    <mat-icon>folder</mat-icon>
    <span>Section Title</span>
  </div>
  <div class="eco-section-body">
    <!-- Form fields -->
  </div>
</div>
```

```css
.eco-section-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0;
  overflow: hidden;
}
.eco-section-header {
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
.eco-section-body {
  padding: 16px;
}

/* Accent variants */
.eco-section-primary { border-left: 3px solid var(--tb-primary-500); }
.eco-section-info    { border-left: 3px solid #3b82f6; }
.eco-section-success { border-left: 3px solid #10b981; }
.eco-section-warning { border-left: 3px solid #f59e0b; }
```

### 4.4 Form Fields
```html
<mat-form-field appearance="fill" class="eco-form-field">
  <mat-label>Label</mat-label>
  <input matInput formControlName="field">
  <mat-icon matSuffix>icon</mat-icon>
</mat-form-field>
```

```css
.eco-form-field {
  width: 100%;
}
.eco-form-field .mdc-text-field--filled:not(.mdc-text-field--disabled) {
  background-color: #f8fafc;
}
.eco-form-field .mat-mdc-form-field-focus-overlay {
  background-color: rgba(48, 86, 128, 0.05);
}
```

### 4.5 Footer
```html
<div class="eco-dialog-footer">
  <button mat-button (click)="cancel()">Cancel</button>
  <button mat-raised-button color="primary" type="submit">
    <mat-icon>save</mat-icon>
    Save
  </button>
</div>
```

```css
.eco-dialog-footer {
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

## 5. Spezielle Layouts

### 5.1 Tab Layout
```html
<mat-tab-group class="eco-tabs">
  <mat-tab>
    <ng-template mat-tab-label>
      <mat-icon>icon</mat-icon>
      <span>Tab Title</span>
      <span class="eco-tab-badge">3</span>
    </ng-template>
    <div class="eco-tab-content">
      <!-- Content -->
    </div>
  </mat-tab>
</mat-tab-group>
```

### 5.2 Stepper Layout
```html
<mat-horizontal-stepper class="eco-stepper">
  <mat-step>
    <ng-template matStepLabel>Step 1</ng-template>
    <div class="eco-step-content">
      <!-- Content -->
    </div>
  </mat-step>
</mat-horizontal-stepper>
```

---

## 6. Info/Warning Banners

```html
<div class="eco-banner eco-banner-info">
  <mat-icon>info</mat-icon>
  <span>Information message here.</span>
</div>

<div class="eco-banner eco-banner-warning">
  <mat-icon>warning</mat-icon>
  <span>Warning message here.</span>
</div>
```

```css
.eco-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 0;
  font-size: 14px;
}
.eco-banner-info {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
}
.eco-banner-warning {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #b45309;
}
.eco-banner-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
}
.eco-banner-success {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #047857;
}
```

---

## 7. Buttons

### Primary Actions
```html
<button mat-raised-button color="primary">
  <mat-icon>save</mat-icon>
  Save
</button>
```

### Secondary Actions
```html
<button mat-button>Cancel</button>
```

### Danger Actions
```html
<button mat-raised-button color="warn">
  <mat-icon>delete</mat-icon>
  Delete
</button>
```

---

## 8. Komplettes Beispiel

```html
<form class="eco-dialog eco-dialog-md">
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
  <div class="eco-dialog-content">
    <!-- Customer Section -->
    <div class="eco-section-card eco-section-primary">
      <div class="eco-section-header">
        <mat-icon>business</mat-icon>
        <span>Customer</span>
      </div>
      <div class="eco-section-body">
        <mat-form-field appearance="fill" class="eco-form-field">
          <mat-label>Customer</mat-label>
          <mat-select formControlName="customer">
            <mat-option *ngFor="let c of customers" [value]="c">
              {{ c.name }}
            </mat-option>
          </mat-select>
        </mat-form-field>
      </div>
    </div>

    <!-- Project Info Section -->
    <div class="eco-section-card eco-section-info">
      <div class="eco-section-header">
        <mat-icon>folder</mat-icon>
        <span>Project Info</span>
      </div>
      <div class="eco-section-body">
        <mat-form-field appearance="fill" class="eco-form-field">
          <mat-label>Project Name</mat-label>
          <input matInput formControlName="name">
        </mat-form-field>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="eco-dialog-footer">
    <button mat-button type="button" (click)="cancel()">Cancel</button>
    <button mat-raised-button color="primary" type="submit" [disabled]="isLoading">
      <mat-icon>save</mat-icon>
      Save
    </button>
  </div>
</form>
```

---

## 9. Migration Checklist

Für jeden Dialog:

- [ ] Dialog-Größe festlegen (sm/md/lg)
- [ ] Header mit `eco-dialog-header`
- [ ] Content mit `eco-dialog-content`
- [ ] Sections mit `eco-section-card`
- [ ] Form Fields mit `appearance="fill"` und `eco-form-field`
- [ ] Icons mit `matSuffix`
- [ ] Footer mit `eco-dialog-footer`
- [ ] Banners für Info/Warnings
- [ ] Konsistente Farben
- [ ] Konsistentes Spacing

---

## 10. Offene Fragen

1. **Section-Stil**: Sollen wir `fieldset` (aktuell in Add Project) oder `eco-section-card` (neuer Vorschlag) verwenden?

2. **Akzentfarben für Sections**: Sollen die linken Akzentränder je nach Inhalt variieren (primary, info, success, warning) oder alle gleich sein?

3. **Stepper-Dialoge**: Sollen komplexe Dialoge wie "Add Kit" den Stepper behalten oder in eine Tab-Struktur umgewandelt werden?

4. **Border-Radius**: Aktuell 0 - soll es so bleiben oder sollen wir leichte Rundungen (4px) einführen?
