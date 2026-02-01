# ECO Dialog UI Components Reference

> Diese Vorlage enthält alle UI-Komponenten für ThingsBoard Custom Dialogs.
> Claude verwendet diese Referenz bei JEDER Dialog-Bearbeitung.
>
> **Design-Philosophie:** Clean/Minimal - Subtile Schatten, 12px Border-Radius, elegante Transitions.

**Verwandte Docs:** [ECO_DESIGN_SYSTEM.md](ECO_DESIGN_SYSTEM.md) | [markdown-widget-patterns.md](markdown-widget-patterns.md)

## Design Tokens

```css
/* Font */
--eco-font: "Roboto", "Helvetica Neue", sans-serif;

/* Colors */
--eco-text-primary: #1a1a2e;
--eco-text-body: #4b5563;
--eco-text-secondary: #6b7280;
--eco-text-muted: #9ca3af;
--eco-bg: #f8fafc;
--eco-surface: #ffffff;
--eco-border: rgba(0, 0, 0, 0.06);

/* Border Radius */
--eco-radius-sm: 6px;
--eco-radius-md: 12px;

/* Transitions */
--eco-transition: 0.25s cubic-bezier(0.4, 0, 0.2, 1);
```

## Dialog Grundstruktur

```html
<div class="ui-demo-dialog">
  <mat-toolbar class="eco-dialog-header">
    <mat-icon class="header-icon">ICON_NAME</mat-icon>
    <h2 class="header-title">Dialog Title</h2>
    <span class="flex-1"></span>
    <button mat-icon-button (click)="cancel()" type="button" class="close-btn">
      <mat-icon>close</mat-icon>
    </button>
  </mat-toolbar>

  <div class="dialog-content">
    <!-- Content sections here -->
  </div>

  <div class="dialog-footer">
    <button mat-button (click)="cancel()">Cancel</button>
    <button mat-raised-button color="primary" (click)="save()">Save</button>
  </div>
</div>
```

## Basis CSS (IMMER inkludieren)

```css
/* ═══════════════════════════════════════════════════════════════
   ECO DESIGN SYSTEM - BASE STYLES
   Font: Roboto | Border-Radius: 12px | Transitions: 0.25s ease
   ═══════════════════════════════════════════════════════════════ */

/* Header - Blue background */
.eco-dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  height: 56px;
  background-color: var(--tb-primary-500);
  color: white;
  font-family: "Roboto", "Helvetica Neue", sans-serif;
}
.eco-dialog-header .header-icon {
  font-size: 24px;
  width: 24px;
  height: 24px;
}
.eco-dialog-header .header-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 500;
  letter-spacing: -0.01em;
}
.eco-dialog-header .close-btn {
  color: rgba(255,255,255,0.8) !important;
  margin-left: auto;
  transition: all 0.2s ease;
}
.eco-dialog-header .close-btn:hover {
  color: white !important;
  background: rgba(255,255,255,0.1) !important;
}

/* Content Area - Scrollable */
.dialog-content {
  padding: 1.5rem !important;
  background: #f8fafc !important;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 70vh;
  overflow-y: auto;
  font-family: "Roboto", "Helvetica Neue", sans-serif;
}

/* Modern Cards (for home tiles, feature cards) */
.eco-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.04),
    0 4px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.eco-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 12px 32px rgba(0, 0, 0, 0.12);
}

/* Section Cards (for form dialogs) */
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
  font-size: 0.8125rem;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.3px;
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

/* Footer */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: #fafafa;
}

/* Modern Buttons */
.eco-btn {
  padding: 0.625rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 6px;
  background: #ffffff;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: "Roboto", "Helvetica Neue", sans-serif;
}
.eco-btn:hover {
  border-color: rgba(0, 0, 0, 0.24);
  background: rgba(0, 0, 0, 0.02);
}
.eco-btn--primary {
  border-color: var(--tb-primary-500);
  background: var(--tb-primary-500);
  color: #ffffff;
}
.eco-btn--primary:hover {
  background: var(--tb-primary-600, #1976d2);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.25);
}

/* Typography */
.eco-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1a1a2e;
  letter-spacing: -0.01em;
}
.eco-text {
  font-size: 0.875rem;
  line-height: 1.6;
  color: #4b5563;
}
.eco-text-muted {
  font-size: 0.8125rem;
  color: #6b7280;
}

/* Utilities */
.flex-1 { flex: 1; }
.w-full { width: 100%; }
.form-row { display: flex; gap: 12px; }
.form-col { flex: 1; }
```

---

## UI Components Demo 1 - Formular-Elemente

### 1. Text Inputs

```html
<div class="section-card">
  <div class="section-header">
    <mat-icon>text_fields</mat-icon>
    <span>Text Inputs</span>
  </div>
  <div class="section-body">
    <div class="form-row">
      <mat-form-field appearance="fill" class="form-col">
        <mat-label>Standard Input</mat-label>
        <input matInput placeholder="Enter text...">
        <mat-icon matSuffix>edit</mat-icon>
      </mat-form-field>
      <mat-form-field appearance="fill" class="form-col">
        <mat-label>With Hint</mat-label>
        <input matInput>
        <mat-hint>Max 100 characters</mat-hint>
      </mat-form-field>
    </div>
    <div class="form-row">
      <mat-form-field appearance="fill" class="form-col">
        <mat-label>Password</mat-label>
        <input matInput [type]="hidePassword ? 'password' : 'text'" value="secret123">
        <button mat-icon-button matSuffix (click)="hidePassword = !hidePassword" type="button">
          <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
        </button>
      </mat-form-field>
      <mat-form-field appearance="fill" class="form-col">
        <mat-label>Number</mat-label>
        <input matInput type="number" value="42">
        <span matSuffix>units</span>
      </mat-form-field>
    </div>
    <mat-form-field appearance="fill" class="w-full">
      <mat-label>Textarea</mat-label>
      <textarea matInput rows="3" placeholder="Enter description..."></textarea>
      <mat-hint align="end">0/500</mat-hint>
    </mat-form-field>
  </div>
</div>
```

### 2. Dropdowns & Autocomplete

```html
<div class="section-card">
  <div class="section-header">
    <mat-icon>arrow_drop_down_circle</mat-icon>
    <span>Dropdowns & Autocomplete</span>
  </div>
  <div class="section-body">
    <div class="form-row">
      <mat-form-field appearance="fill" class="form-col">
        <mat-label>Select</mat-label>
        <mat-select>
          <mat-option value="opt1">Option 1</mat-option>
          <mat-option value="opt2">Option 2</mat-option>
          <mat-option value="opt3">Option 3</mat-option>
        </mat-select>
        <mat-icon matSuffix>category</mat-icon>
      </mat-form-field>
      <mat-form-field appearance="fill" class="form-col">
        <mat-label>Multi-Select</mat-label>
        <mat-select multiple>
          <mat-option value="a">Alpha</mat-option>
          <mat-option value="b">Beta</mat-option>
          <mat-option value="c">Gamma</mat-option>
        </mat-select>
      </mat-form-field>
    </div>
    <mat-form-field appearance="fill" class="w-full">
      <mat-label>Autocomplete</mat-label>
      <input matInput [matAutocomplete]="auto">
      <mat-icon matSuffix>search</mat-icon>
      <mat-autocomplete #auto="matAutocomplete">
        <mat-option value="item1">Suggestion 1</mat-option>
        <mat-option value="item2">Suggestion 2</mat-option>
      </mat-autocomplete>
    </mat-form-field>
  </div>
</div>
```

### 3. Date & Time Pickers

```html
<div class="section-card">
  <div class="section-header">
    <mat-icon>event</mat-icon>
    <span>Date & Time Pickers</span>
  </div>
  <div class="section-body">
    <div class="form-row">
      <mat-form-field appearance="fill" class="form-col">
        <mat-label>Date Picker</mat-label>
        <input matInput [matDatepicker]="picker1">
        <mat-datepicker-toggle matSuffix [for]="picker1"></mat-datepicker-toggle>
        <mat-datepicker #picker1></mat-datepicker>
      </mat-form-field>
      <mat-form-field appearance="fill" class="form-col">
        <mat-label>Date Range Start</mat-label>
        <input matInput [matDatepicker]="picker2">
        <mat-datepicker-toggle matSuffix [for]="picker2"></mat-datepicker-toggle>
        <mat-datepicker #picker2></mat-datepicker>
      </mat-form-field>
    </div>
  </div>
</div>
```

### 4. Checkboxes & Radio Buttons

```html
<div class="section-card">
  <div class="section-header">
    <mat-icon>check_box</mat-icon>
    <span>Checkboxes & Radio</span>
  </div>
  <div class="section-body">
    <div class="form-row">
      <div class="form-col">
        <mat-checkbox checked>Checked option</mat-checkbox>
        <mat-checkbox>Unchecked option</mat-checkbox>
        <mat-checkbox disabled>Disabled option</mat-checkbox>
      </div>
      <div class="form-col">
        <mat-radio-group>
          <mat-radio-button value="1" checked>Option A</mat-radio-button>
          <mat-radio-button value="2">Option B</mat-radio-button>
          <mat-radio-button value="3">Option C</mat-radio-button>
        </mat-radio-group>
      </div>
    </div>
  </div>
</div>
```

### 5. Slide Toggle

```html
<div class="section-card">
  <div class="section-header">
    <mat-icon>toggle_on</mat-icon>
    <span>Slide Toggle</span>
  </div>
  <div class="section-body">
    <div class="toggle-list">
      <div class="toggle-item">
        <span>Enable notifications</span>
        <mat-slide-toggle checked></mat-slide-toggle>
      </div>
      <div class="toggle-item">
        <span>Auto-sync data</span>
        <mat-slide-toggle></mat-slide-toggle>
      </div>
      <div class="toggle-item">
        <span>Dark mode</span>
        <mat-slide-toggle disabled></mat-slide-toggle>
      </div>
    </div>
  </div>
</div>
```

**CSS für Toggles:**
```css
.toggle-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.toggle-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
}
```

### 6. Buttons

```html
<div class="section-card">
  <div class="section-header">
    <mat-icon>smart_button</mat-icon>
    <span>Buttons</span>
  </div>
  <div class="section-body">
    <div class="button-row">
      <button mat-button>Basic</button>
      <button mat-raised-button>Raised</button>
      <button mat-raised-button color="primary">Primary</button>
      <button mat-raised-button color="accent">Accent</button>
      <button mat-raised-button color="warn">Warn</button>
    </div>
    <div class="button-row">
      <button mat-stroked-button>Stroked</button>
      <button mat-flat-button color="primary">Flat</button>
      <button mat-icon-button color="primary"><mat-icon>favorite</mat-icon></button>
      <button mat-fab color="primary"><mat-icon>add</mat-icon></button>
      <button mat-mini-fab color="accent"><mat-icon>edit</mat-icon></button>
    </div>
  </div>
</div>
```

**CSS für Buttons:**
```css
.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}
```

### 7. Progress Indicators

```html
<div class="section-card">
  <div class="section-header">
    <mat-icon>hourglass_empty</mat-icon>
    <span>Progress Indicators</span>
  </div>
  <div class="section-body">
    <div class="progress-item">
      <span>Determinate</span>
      <mat-progress-bar mode="determinate" value="65"></mat-progress-bar>
    </div>
    <div class="progress-item">
      <span>Indeterminate</span>
      <mat-progress-bar mode="indeterminate"></mat-progress-bar>
    </div>
    <div class="spinner-row">
      <mat-spinner diameter="40"></mat-spinner>
      <mat-progress-spinner mode="determinate" value="75" diameter="40"></mat-progress-spinner>
    </div>
  </div>
</div>
```

**CSS für Progress:**
```css
.progress-item {
  margin-bottom: 16px;
}
.progress-item span {
  display: block;
  font-size: 12px;
  color: #64748b;
  margin-bottom: 6px;
}
.spinner-row {
  display: flex;
  gap: 24px;
  align-items: center;
}
```

### 8. Chips

```html
<div class="section-card">
  <div class="section-header">
    <mat-icon>label</mat-icon>
    <span>Chips</span>
  </div>
  <div class="section-body">
    <mat-chip-listbox>
      <mat-chip-option selected>Selected</mat-chip-option>
      <mat-chip-option>Option 2</mat-chip-option>
      <mat-chip-option>Option 3</mat-chip-option>
    </mat-chip-listbox>
    <mat-chip-set class="mt-2">
      <mat-chip><mat-icon matChipAvatar>person</mat-icon>John Doe</mat-chip>
      <mat-chip color="primary"><mat-icon matChipAvatar>check</mat-icon>Active</mat-chip>
      <mat-chip color="warn">Warning</mat-chip>
    </mat-chip-set>
  </div>
</div>
```

### 9. Stepper

```html
<div class="section-card">
  <div class="section-header">
    <mat-icon>format_list_numbered</mat-icon>
    <span>Stepper</span>
  </div>
  <div class="section-body">
    <mat-stepper orientation="horizontal" linear="false" #stepper>
      <mat-step label="Step 1" completed="true">
        <p>First step content</p>
      </mat-step>
      <mat-step label="Step 2">
        <p>Second step content</p>
      </mat-step>
      <mat-step label="Step 3">
        <p>Third step content</p>
      </mat-step>
    </mat-stepper>
  </div>
</div>
```

---

## UI Components Demo 2 - Display-Elemente

### 1. Cards

```html
<div class="section-card">
  <div class="section-header">
    <mat-icon>dashboard</mat-icon>
    <span>Cards</span>
  </div>
  <div class="section-body">
    <div class="demo-cards-grid">
      <div class="demo-card">
        <div class="demo-card-header">
          <mat-icon class="demo-card-icon">thermostat</mat-icon>
          <div>
            <div class="demo-card-title">Temperature</div>
            <div class="demo-card-subtitle">Living Room</div>
          </div>
        </div>
        <div class="demo-card-value">23.5°C</div>
        <div class="demo-card-actions">
          <button mat-button color="primary">Details</button>
        </div>
      </div>
      <div class="demo-card">
        <div class="demo-card-header">
          <mat-icon class="demo-card-icon">water_drop</mat-icon>
          <div>
            <div class="demo-card-title">Humidity</div>
            <div class="demo-card-subtitle">Bathroom</div>
          </div>
        </div>
        <div class="demo-card-value">65%</div>
        <div class="demo-card-actions">
          <button mat-button color="primary">Details</button>
        </div>
      </div>
    </div>
  </div>
</div>
```

**CSS für Cards:**
```css
.demo-cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.demo-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
}
.demo-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.demo-card-icon {
  font-size: 28px !important;
  width: 28px !important;
  height: 28px !important;
  color: var(--tb-primary-500);
}
.demo-card-title {
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
}
.demo-card-subtitle {
  font-size: 12px;
  color: #64748b;
}
.demo-card-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--tb-primary-500);
  margin-bottom: 8px;
}
.demo-card-actions {
  display: flex;
  gap: 8px;
}
```

### 2. Expansion Panel

```html
<div class="section-card">
  <div class="section-header">
    <mat-icon>expand_more</mat-icon>
    <span>Expansion Panel</span>
  </div>
  <div class="section-body">
    <mat-accordion>
      <mat-expansion-panel>
        <mat-expansion-panel-header>
          <mat-panel-title>Device Information</mat-panel-title>
        </mat-expansion-panel-header>
        <div class="expansion-content">
          <p><strong>Serial:</strong> D116-2024-001</p>
          <p><strong>Firmware:</strong> v2.1.4</p>
          <p><strong>Last Update:</strong> 2024-01-15</p>
        </div>
      </mat-expansion-panel>
    </mat-accordion>
  </div>
</div>
```

**CSS für Expansion:**
```css
.expansion-content {
  padding: 8px 0;
}
.expansion-content p {
  margin: 4px 0;
  font-size: 13px;
  color: #475569;
}
```

### 3. Selection List

```html
<div class="section-card">
  <div class="section-header">
    <mat-icon>list</mat-icon>
    <span>Selection List</span>
  </div>
  <div class="section-body">
    <mat-selection-list class="demo-selection-list">
      <mat-list-option selected>Enable Notifications</mat-list-option>
      <mat-list-option>Auto-sync Data</mat-list-option>
      <mat-list-option>Dark Mode</mat-list-option>
    </mat-selection-list>
  </div>
</div>
```

**CSS für List:**
```css
.demo-selection-list {
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  max-height: 120px;
  overflow: hidden;
}
.demo-selection-list .mat-mdc-list-item {
  height: 40px !important;
}
```

### 4. Data Table

```html
<div class="section-card">
  <div class="section-header">
    <mat-icon>table_chart</mat-icon>
    <span>Data Table</span>
  </div>
  <div class="section-body">
    <table class="demo-table">
      <thead>
        <tr>
          <th>Device</th>
          <th>Status</th>
          <th>Last Seen</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>P-Flow D116</td>
          <td><span class="status-chip status-online">Online</span></td>
          <td>Just now</td>
        </tr>
        <tr>
          <td>Gateway GW-01</td>
          <td><span class="status-chip status-offline">Offline</span></td>
          <td>2 hours ago</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

**CSS für Table:**
```css
.demo-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.demo-table th,
.demo-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}
.demo-table th {
  font-weight: 600;
  color: #64748b;
  font-size: 12px;
  text-transform: uppercase;
  background: #f8fafc;
}
.demo-table tbody tr:hover {
  background: #f8fafc;
}

/* Status Chips */
.status-chip {
  display: inline-flex;
  padding: 2px 10px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 12px;
}
.status-online {
  background: #dcfce7;
  color: #166534;
}
.status-offline {
  background: #fee2e2;
  color: #991b1b;
}
.status-warning {
  background: #fef3c7;
  color: #92400e;
}
```

### 5. Toolbar

```html
<div class="section-card">
  <div class="section-header">
    <mat-icon>web_asset</mat-icon>
    <span>Toolbar</span>
  </div>
  <div class="section-body">
    <mat-toolbar color="primary" class="demo-toolbar">
      <button mat-icon-button><mat-icon>menu</mat-icon></button>
      <span class="toolbar-title">App Title</span>
      <span class="flex-1"></span>
      <button mat-icon-button><mat-icon>search</mat-icon></button>
      <button mat-icon-button><mat-icon>more_vert</mat-icon></button>
    </mat-toolbar>
  </div>
</div>
```

**CSS für Toolbar:**
```css
.demo-toolbar {
  border-radius: 4px;
  height: 48px !important;
}
.toolbar-title {
  margin-left: 8px;
  font-size: 16px;
}
```

### 6. Search Input

```html
<div class="section-card">
  <div class="section-header">
    <mat-icon>search</mat-icon>
    <span>Search Input</span>
  </div>
  <div class="section-body">
    <div class="search-container">
      <mat-icon class="search-icon">search</mat-icon>
      <input type="text" class="search-input" placeholder="Search devices, projects...">
      <button mat-icon-button class="search-clear"><mat-icon>close</mat-icon></button>
    </div>
  </div>
</div>
```

**CSS für Search:**
```css
.search-container {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f1f5f9;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
}
.search-icon {
  color: #64748b;
  font-size: 20px !important;
}
.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
}
.search-clear {
  color: #94a3b8;
}
```

### 7. Bottom Navigation

```html
<div class="section-card">
  <div class="section-header">
    <mat-icon>navigation</mat-icon>
    <span>Bottom Navigation</span>
  </div>
  <div class="section-body">
    <nav class="demo-bottom-nav">
      <a class="nav-item active">
        <mat-icon>home</mat-icon>
        <span>Home</span>
      </a>
      <a class="nav-item">
        <mat-icon>folder</mat-icon>
        <span>Projects</span>
      </a>
      <a class="nav-item">
        <mat-icon>devices</mat-icon>
        <span>Devices</span>
      </a>
      <a class="nav-item">
        <mat-icon>settings</mat-icon>
        <span>Settings</span>
      </a>
    </nav>
  </div>
</div>
```

**CSS für Navigation:**
```css
.demo-bottom-nav {
  display: flex;
  justify-content: space-around;
  background: #f8fafc;
  border-radius: 8px;
  padding: 8px 0;
  border: 1px solid #e2e8f0;
}
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 16px;
  color: #64748b;
  font-size: 11px;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;
}
.nav-item:hover {
  background: #e2e8f0;
}
.nav-item.active {
  color: var(--tb-primary-500);
}
.nav-item mat-icon {
  font-size: 22px !important;
  width: 22px !important;
  height: 22px !important;
}
```

### 8. Tree Structure

```html
<div class="section-card">
  <div class="section-header">
    <mat-icon>account_tree</mat-icon>
    <span>Tree Structure</span>
  </div>
  <div class="section-body">
    <div class="demo-tree">
      <div class="tree-node">
        <div class="tree-node-content">
          <mat-icon class="tree-toggle">expand_more</mat-icon>
          <mat-icon class="tree-icon">business</mat-icon>
          <span>Customer A</span>
        </div>
        <div class="tree-children">
          <div class="tree-node">
            <div class="tree-node-content">
              <mat-icon class="tree-toggle">expand_more</mat-icon>
              <mat-icon class="tree-icon">folder</mat-icon>
              <span>Project 1</span>
            </div>
            <div class="tree-children">
              <div class="tree-node tree-leaf">
                <div class="tree-node-content">
                  <mat-icon class="tree-icon">sensors</mat-icon>
                  <span>Measurement A</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

**CSS für Tree:**
```css
.demo-tree {
  font-size: 13px;
}
.tree-node {
  margin-left: 0;
}
.tree-children {
  margin-left: 24px;
  border-left: 1px dashed #cbd5e1;
  padding-left: 8px;
}
.tree-node-content {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
}
.tree-node-content:hover {
  background: #f1f5f9;
}
.tree-toggle {
  font-size: 18px !important;
  width: 18px !important;
  height: 18px !important;
  color: #94a3b8;
}
.tree-leaf .tree-toggle {
  visibility: hidden;
}
.tree-icon {
  font-size: 18px !important;
  width: 18px !important;
  height: 18px !important;
  color: var(--tb-primary-500);
}
```

---

## Zusätzliche Komponenten

### Badges

```html
<button mat-raised-button matBadge="4" matBadgeColor="primary">Messages</button>
<button mat-raised-button matBadge="15" matBadgeColor="accent">Notifications</button>
<button mat-raised-button matBadge="!" matBadgeColor="warn">Alerts</button>
```

### Button Toggle

```html
<mat-button-toggle-group>
  <mat-button-toggle value="left"><mat-icon>format_align_left</mat-icon></mat-button-toggle>
  <mat-button-toggle value="center"><mat-icon>format_align_center</mat-icon></mat-button-toggle>
  <mat-button-toggle value="right"><mat-icon>format_align_right</mat-icon></mat-button-toggle>
</mat-button-toggle-group>
```

### Slider

```html
<mat-slider min="0" max="100" step="1" class="w-full">
  <input matSliderThumb value="50">
</mat-slider>
```

### Tabs

```html
<mat-tab-group>
  <mat-tab label="Overview">
    <div class="tab-content">Overview content</div>
  </mat-tab>
  <mat-tab label="Data">
    <div class="tab-content">Data content</div>
  </mat-tab>
  <mat-tab label="Settings">
    <div class="tab-content">Settings content</div>
  </mat-tab>
</mat-tab-group>
```

### Tooltips

```html
<button mat-raised-button matTooltip="Tooltip text" matTooltipPosition="above">Hover me</button>
```

### Menu

```html
<button mat-raised-button [matMenuTriggerFor]="menu">
  <mat-icon>more_vert</mat-icon> Menu
</button>
<mat-menu #menu="matMenu">
  <button mat-menu-item><mat-icon>edit</mat-icon> Edit</button>
  <button mat-menu-item><mat-icon>content_copy</mat-icon> Copy</button>
  <button mat-menu-item><mat-icon>delete</mat-icon> Delete</button>
</mat-menu>
```

---

## Best Practices

1. **Immer Basis-CSS inkludieren** - Header und Content Styles sind essentiell
2. **Section Cards nutzen** - Konsistente Gruppierung von Elementen
3. **max-height: 70vh** - Für scrollbare Dialoge
4. **var(--tb-primary-500)** - ThingsBoard Primary Color nutzen
5. **mat-icon mit expliziter Größe** - Immer font-size, width, height setzen
6. **Responsive gap/padding** - 8px, 12px, 16px, 20px verwenden

## ThingsBoard Action Struktur

Bei `customPretty` Actions müssen ALLE Felder vom Original kopiert werden:
- `id`
- `name`
- `icon`
- `type`
- `customHtml`
- `customCss`
- `customFunction`
- `customResources`
- `openInSeparateDialog`
- `dialogWidth`
- `dialogHeight`
- etc.
