#!/usr/bin/env node
/**
 * Fix Edit Project and Project (Add Project) dialogs styling
 * - Convert fieldset/legend to section-card pattern
 * - Apply ECO Design System correctly
 */

const fs = require('fs');

const dashboardPath = './dashboards/measurements.json';

// Read dashboard
const dashboard = JSON.parse(fs.readFileSync(dashboardPath, 'utf8'));

// ECO Design System CSS for dialogs (embedded in HTML)
const ecoDialogCss = `/* ═══════════════════════════════════════════════════════════════
   ECO DESIGN SYSTEM - Dialog Styles
   Font: Roboto | Border-Radius: 12px | Section Cards with left border
   ═══════════════════════════════════════════════════════════════ */

/* Header - Blue background */
.edit-project-form .eco-dialog-header,
.add-entity-form .eco-dialog-header,
mat-toolbar.eco-dialog-header {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  padding: 0 16px !important;
  height: 56px !important;
  min-height: 56px !important;
  background-color: var(--tb-primary-500) !important;
  background: var(--tb-primary-500) !important;
  color: white !important;
  font-family: "Roboto", "Helvetica Neue", sans-serif !important;
}
.edit-project-form .eco-dialog-header .header-icon,
.add-entity-form .eco-dialog-header .header-icon,
mat-toolbar.eco-dialog-header .header-icon {
  font-size: 24px !important;
  width: 24px !important;
  height: 24px !important;
  color: white !important;
}
.edit-project-form .eco-dialog-header .header-title,
.add-entity-form .eco-dialog-header .header-title,
mat-toolbar.eco-dialog-header .header-title {
  margin: 0 !important;
  font-size: 1.125rem !important;
  font-weight: 500 !important;
  letter-spacing: -0.01em !important;
  color: white !important;
  flex: 1 !important;
}
.edit-project-form .eco-dialog-header .close-btn,
.add-entity-form .eco-dialog-header .close-btn,
mat-toolbar.eco-dialog-header .close-btn {
  color: rgba(255,255,255,0.8) !important;
  margin-left: auto !important;
  transition: all 0.2s ease !important;
}
.edit-project-form .eco-dialog-header .close-btn:hover,
.add-entity-form .eco-dialog-header .close-btn:hover,
mat-toolbar.eco-dialog-header .close-btn:hover {
  color: white !important;
  background: rgba(255,255,255,0.1) !important;
}
.edit-project-form .eco-dialog-header mat-icon,
.add-entity-form .eco-dialog-header mat-icon,
mat-toolbar.eco-dialog-header mat-icon {
  color: white !important;
}

/* Content Area */
.edit-project-form .dialog-content,
.add-entity-form .dialog-content {
  padding: 1.5rem !important;
  background: #f8fafc !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 1rem !important;
  max-height: 70vh !important;
  overflow-y: auto !important;
  font-family: "Roboto", "Helvetica Neue", sans-serif !important;
}

/* Section Cards - ECO Design System Pattern */
.edit-project-form .section-card,
.add-entity-form .section-card {
  background: white !important;
  border: 1px solid #e2e8f0 !important;
  border-left: 3px solid #1976d2 !important;
  border-radius: 0 !important;
  overflow: hidden !important;
}
.edit-project-form .section-header,
.add-entity-form .section-header {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  padding: 12px 16px !important;
  background: #f8fafc !important;
  border-bottom: 1px solid #e2e8f0 !important;
  font-weight: 600 !important;
  font-size: 0.8125rem !important;
  color: #334155 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.3px !important;
}
.edit-project-form .section-header mat-icon,
.add-entity-form .section-header mat-icon {
  font-size: 18px !important;
  width: 18px !important;
  height: 18px !important;
  color: #1976d2 !important;
}
.edit-project-form .section-body,
.add-entity-form .section-body {
  padding: 16px !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 8px !important;
}

/* Footer */
.edit-project-form .dialog-footer,
.add-entity-form .dialog-footer {
  display: flex !important;
  justify-content: flex-end !important;
  align-items: center !important;
  gap: 12px !important;
  padding: 1rem 1.5rem !important;
  border-top: 1px solid rgba(0, 0, 0, 0.06) !important;
  background: #fafafa !important;
}

/* Form field styles */
.add-entity-form .mdc-text-field--filled,
.edit-project-form .mdc-text-field--filled {
  background-color: #F4F9FE !important;
}
.add-entity-form .mdc-text-field--filled.mdc-text-field--disabled,
.edit-project-form .mdc-text-field--filled.mdc-text-field--disabled {
  background-color: rgba(244, 249, 254, 0.5) !important;
}
.add-entity-form .disabled-field input,
.edit-project-form .disabled-field input {
  color: rgba(0, 0, 0, 0.6) !important;
}

/* Form rows */
.edit-project-form .form-row,
.add-entity-form .form-row {
  display: flex !important;
  gap: 12px !important;
}
.edit-project-form .form-col,
.add-entity-form .form-col {
  flex: 1 !important;
}`;

// New HTML template for Edit Project dialog
const editProjectHtml = `<style>
${ecoDialogCss}
</style>
<form #editProjectForm="ngForm" [formGroup]="editProjectFormGroup"
      (ngSubmit)="save()" class="edit-project-form" style="width: 600px; max-width: 90vw;">
  <mat-toolbar class="eco-dialog-header">
    <mat-icon class="header-icon">edit</mat-icon>
    <h2 class="header-title">Edit Project</h2>
    <span class="flex-1"></span>
    <button mat-icon-button (click)="cancel()" type="button" class="close-btn">
      <mat-icon>close</mat-icon>
    </button>
  </mat-toolbar>
  <mat-progress-bar color="warn" mode="indeterminate" *ngIf="isLoading$ | async"></mat-progress-bar>
  <div style="height: 4px;" *ngIf="!(isLoading$ | async)"></div>

  <div class="dialog-content">
    <!-- Customer Section -->
    <div class="section-card">
      <div class="section-header">
        <mat-icon>business</mat-icon>
        <span>Customer</span>
      </div>
      <div class="section-body">
        <mat-form-field appearance="fill" class="w-full disabled-field">
          <mat-label>Customer</mat-label>
          <input matInput formControlName="customerName" readonly>
        </mat-form-field>
      </div>
    </div>

    <!-- Project Info Section -->
    <div class="section-card">
      <div class="section-header">
        <mat-icon>folder</mat-icon>
        <span>Project Info</span>
      </div>
      <div class="section-body">
        <tb-image-input formControlName="projectPicture" label="Project Picture" noImageText="No picture selected"></tb-image-input>
        <mat-form-field appearance="fill" class="w-full disabled-field">
          <mat-label>Project ID</mat-label>
          <input matInput formControlName="name" readonly>
        </mat-form-field>
        <mat-form-field appearance="fill" class="w-full">
          <mat-label>Label</mat-label>
          <input matInput formControlName="entityLabel">
        </mat-form-field>
      </div>
    </div>

    <!-- Address Section -->
    <div class="section-card">
      <div class="section-header">
        <mat-icon>location_on</mat-icon>
        <span>Address</span>
      </div>
      <div class="section-body">
        <mat-form-field appearance="fill" class="w-full">
          <mat-label>Project address</mat-label>
          <input matInput formControlName="address" [matAutocomplete]="addrAuto" autocomplete="off">
          <button mat-icon-button matSuffix type="button" (click)="searchAddress()" [disabled]="(editProjectFormGroup.get('address').value || '').length < 5">
            <mat-icon>search</mat-icon>
          </button>
          <mat-autocomplete #addrAuto="matAutocomplete" [displayWith]="displayAddressOption" (optionSelected)="onAddressSelected($event.option.value)">
            <mat-option *ngFor="let opt of addressOptions" [value]="opt">{{ opt.label }}</mat-option>
          </mat-autocomplete>
          <mat-hint *ngIf="(editProjectFormGroup.get('address').value || '').length < 5">Enter at least 5 characters to search</mat-hint>
        </mat-form-field>
        <div class="form-row">
          <mat-form-field appearance="fill" class="form-col">
            <mat-label>Postal Code</mat-label>
            <input matInput formControlName="postalCode">
          </mat-form-field>
          <mat-form-field appearance="fill" class="form-col" style="flex: 2;">
            <mat-label>City</mat-label>
            <input matInput formControlName="city">
          </mat-form-field>
        </div>
        <div class="form-row">
          <mat-form-field appearance="fill" class="form-col">
            <mat-label>Latitude</mat-label>
            <input matInput formControlName="latitude">
          </mat-form-field>
          <mat-form-field appearance="fill" class="form-col">
            <mat-label>Longitude</mat-label>
            <input matInput formControlName="longitude">
          </mat-form-field>
        </div>
      </div>
    </div>

    <!-- Status Section -->
    <div class="section-card">
      <div class="section-header">
        <mat-icon>timeline</mat-icon>
        <span>Status</span>
      </div>
      <div class="section-body">
        <mat-form-field appearance="fill" class="w-full">
          <mat-label>Progress</mat-label>
          <mat-select formControlName="progress">
            <mat-option value="in preparation">In Preparation</mat-option>
            <mat-option value="active">Active</mat-option>
            <mat-option value="finished">Finished</mat-option>
            <mat-option value="aborted">Aborted</mat-option>
          </mat-select>
        </mat-form-field>
        <div class="form-row">
          <mat-form-field appearance="fill" class="form-col" style="flex: 1.5;">
            <mat-label>Start Date</mat-label>
            <mat-datetimepicker-toggle [for]="startDatePicker" matPrefix></mat-datetimepicker-toggle>
            <mat-datetimepicker #startDatePicker type="date" openOnFocus="true"></mat-datetimepicker>
            <input matInput formControlName="startDate" [matDatetimepicker]="startDatePicker">
          </mat-form-field>
          <mat-form-field appearance="fill" class="form-col">
            <mat-label>Start Time</mat-label>
            <mat-datetimepicker-toggle [for]="startTimePicker" matPrefix></mat-datetimepicker-toggle>
            <mat-datetimepicker #startTimePicker type="time" openOnFocus="true"></mat-datetimepicker>
            <input matInput formControlName="startTime" [matDatetimepicker]="startTimePicker">
          </mat-form-field>
        </div>
        <div class="form-row">
          <mat-form-field appearance="fill" class="form-col" style="flex: 1.5;">
            <mat-label>End Date</mat-label>
            <mat-datetimepicker-toggle [for]="endDatePicker" matPrefix></mat-datetimepicker-toggle>
            <mat-datetimepicker #endDatePicker type="date" openOnFocus="true"></mat-datetimepicker>
            <input matInput formControlName="endDate" [matDatetimepicker]="endDatePicker">
          </mat-form-field>
          <mat-form-field appearance="fill" class="form-col">
            <mat-label>End Time</mat-label>
            <mat-datetimepicker-toggle [for]="endTimePicker" matPrefix></mat-datetimepicker-toggle>
            <mat-datetimepicker #endTimePicker type="time" openOnFocus="true"></mat-datetimepicker>
            <input matInput formControlName="endTime" [matDatetimepicker]="endTimePicker">
          </mat-form-field>
        </div>
      </div>
    </div>
  </div>

  <div class="dialog-footer">
    <button mat-button (click)="cancel()" type="button">Cancel</button>
    <button mat-raised-button color="primary" type="submit"
            [disabled]="(isLoading$ | async) || editProjectFormGroup.invalid || !editProjectFormGroup.dirty">
      <mat-icon style="font-size: 18px; width: 18px; height: 18px; margin-right: 4px;">save</mat-icon>
      Save
    </button>
  </div>
</form>`;

// New HTML template for Add Project dialog
const addProjectHtml = `<style>
${ecoDialogCss}
</style>
<form #addEntityForm="ngForm" [formGroup]="addProjectFormGroup"
      (ngSubmit)="save()" class="add-entity-form" style="width: 600px; max-width: 90vw;">
  <mat-toolbar class="eco-dialog-header">
    <mat-icon class="header-icon">folder_open</mat-icon>
    <h2 class="header-title">Add Project</h2>
    <span class="flex-1"></span>
    <button mat-icon-button (click)="cancel()" type="button" class="close-btn">
      <mat-icon>close</mat-icon>
    </button>
  </mat-toolbar>
  <mat-progress-bar color="warn" mode="indeterminate" *ngIf="isLoading$ | async"></mat-progress-bar>
  <div style="height: 4px;" *ngIf="!(isLoading$ | async)"></div>

  <div class="dialog-content">
    <!-- Customer Section -->
    <div *ngIf="isTenantAdmin" class="section-card">
      <div class="section-header">
        <mat-icon>business</mat-icon>
        <span>Customer</span>
      </div>
      <div class="section-body">
        <mat-form-field appearance="fill" class="w-full">
          <mat-label>Customer</mat-label>
          <mat-select formControlName="customer" (selectionChange)="onCustomerChange()" required>
            <mat-option *ngFor="let c of customers" [value]="c">{{ c.name }}</mat-option>
          </mat-select>
          <mat-error *ngIf="addProjectFormGroup.get('customer')?.hasError('required')">Customer is required.</mat-error>
        </mat-form-field>
      </div>
    </div>

    <!-- Project Info Section -->
    <div class="section-card">
      <div class="section-header">
        <mat-icon>folder</mat-icon>
        <span>Project Info</span>
      </div>
      <div class="section-body">
        <tb-image-input formControlName="projectPicture" label="Project Picture" noImageText="No picture selected"></tb-image-input>
        <mat-form-field appearance="fill" class="w-full disabled-field">
          <mat-label>Project ID</mat-label>
          <input matInput formControlName="name" required readonly>
          <mat-error *ngIf="addProjectFormGroup.get('name').hasError('required')">Project title is required.</mat-error>
        </mat-form-field>
        <mat-form-field appearance="fill" class="w-full">
          <mat-label>Label</mat-label>
          <input matInput formControlName="entityLabel">
        </mat-form-field>
      </div>
    </div>

    <!-- Address Section -->
    <div class="section-card">
      <div class="section-header">
        <mat-icon>location_on</mat-icon>
        <span>Address</span>
      </div>
      <div class="section-body">
        <mat-form-field appearance="fill" class="w-full">
          <mat-label>Project address</mat-label>
          <input matInput formControlName="address" [matAutocomplete]="addrAuto" autocomplete="off">
          <button mat-icon-button matSuffix type="button" (click)="searchAddress()" [disabled]="(addProjectFormGroup.get('address').value || '').length < 5">
            <mat-icon>search</mat-icon>
          </button>
          <mat-autocomplete #addrAuto="matAutocomplete" [displayWith]="displayAddressOption" (optionSelected)="onAddressSelected($event.option.value)">
            <mat-option *ngFor="let opt of addressOptions" [value]="opt">{{ opt.label }}</mat-option>
          </mat-autocomplete>
          <mat-hint *ngIf="(addProjectFormGroup.get('address').value || '').length < 5">Enter at least 5 characters to search</mat-hint>
        </mat-form-field>
        <div class="form-row">
          <mat-form-field appearance="fill" class="form-col">
            <mat-label>Postal Code</mat-label>
            <input matInput formControlName="postalCode">
          </mat-form-field>
          <mat-form-field appearance="fill" class="form-col" style="flex: 2;">
            <mat-label>City</mat-label>
            <input matInput formControlName="city">
          </mat-form-field>
        </div>
        <div class="form-row">
          <mat-form-field appearance="fill" class="form-col">
            <mat-label>Latitude</mat-label>
            <input matInput formControlName="latitude">
          </mat-form-field>
          <mat-form-field appearance="fill" class="form-col">
            <mat-label>Longitude</mat-label>
            <input matInput formControlName="longitude">
          </mat-form-field>
        </div>
      </div>
    </div>
  </div>

  <div class="dialog-footer">
    <button mat-button (click)="cancel()" type="button">Cancel</button>
    <button mat-raised-button color="primary" type="submit"
            [disabled]="(isLoading$ | async) || addProjectFormGroup.invalid || !addProjectFormGroup.dirty">
      <mat-icon style="font-size: 18px; width: 18px; height: 18px; margin-right: 4px;">save</mat-icon>
      Save
    </button>
  </div>
</form>`;

// Action IDs from the dashboard
const editProjectActionId = 'e8f12b3a-4c5d-9e7f-a1b2-3c4d5e6f7890';
const addProjectActionId = '2c6e09e8-98b9-f1ca-0a64-7cce095767a2';

let editProjectModified = false;
let addProjectModified = false;

// Find and update actions
function findAndUpdateActions(obj, path = '') {
  if (!obj || typeof obj !== 'object') return;

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      findAndUpdateActions(item, `${path}[${index}]`);
    });
    return;
  }

  // Check if this is an action object
  if (obj.id === editProjectActionId && obj.type === 'customPretty') {
    console.log(`Found Edit Project action at: ${path}`);
    obj.customHtml = editProjectHtml;
    obj.customCss = '';
    editProjectModified = true;
    console.log('  Edit Project: Updated with section-card pattern');
  }

  if (obj.id === addProjectActionId && obj.type === 'customPretty') {
    console.log(`Found Add Project action at: ${path}`);
    obj.customHtml = addProjectHtml;
    obj.customCss = '';
    addProjectModified = true;
    console.log('  Add Project: Updated with section-card pattern');
  }

  // Recurse into object properties
  for (const key of Object.keys(obj)) {
    findAndUpdateActions(obj[key], `${path}.${key}`);
  }
}

// Process dashboard
console.log('Processing dashboard...');
findAndUpdateActions(dashboard);

// Summary
console.log('\n--- Summary ---');
console.log(`Edit Project: ${editProjectModified ? 'UPDATED' : 'NOT FOUND'}`);
console.log(`Add Project: ${addProjectModified ? 'UPDATED' : 'NOT FOUND'}`);

if (editProjectModified || addProjectModified) {
  // Write updated dashboard
  fs.writeFileSync(dashboardPath, JSON.stringify(dashboard, null, 2));
  console.log('\nDashboard saved.');
} else {
  console.log('\nNo changes made.');
}
