/**
 * CSV data import dialog
 * Opens a dialog with a stepper to import telemetry data via CSV:
 *   Step 1: Upload CSV and import telemetry directly into the measurement
 *
 * Uses HTTP POST to /api/plugins/telemetry/{entityType}/{entityId}/timeseries/ANY
 *
 * Usage in Thingsboard Action Cell Button (with utils resource):
 *   let { csvDataImportDialog } = widgetContext.custom.utils;
 *   csvDataImportDialog(widgetContext, entityId, entityName);
 */

export function csvDataImportDialog(widgetContext, entityId, entityName, options) {
  // options.selectedMeasurement - pre-selected measurement to skip directly to upload step
  // options.selectedMeasurement.entityId, entityName, entityLabel
  const opts = options || {};

  // 0) Services (needed early for fetching data)
  const $injector = widgetContext.$scope.$injector;
  const customDialog = $injector.get(widgetContext.servicesMap.get('customDialog'));
  const deviceService = $injector.get(widgetContext.servicesMap.get('deviceService'));
  const entityRelationService = $injector.get(widgetContext.servicesMap.get('entityRelationService'));
  const attributeService = $injector.get(widgetContext.servicesMap.get('attributeService'));
  const assetService = $injector.get(widgetContext.servicesMap.get('assetService'));
  const customerService = $injector.get(widgetContext.servicesMap.get('customerService'));
  const http = $injector.get(widgetContext.servicesMap.get('http'));
  const rxjs = widgetContext.rxjs;

  // Check state params for hierarchy
  const stateParams = widgetContext.stateController.getStateParams();
  const isTenantAdmin = widgetContext.currentUser.authority === 'TENANT_ADMIN';
  const pageLink = widgetContext.pageLink(1000, 0, null, null, null);

  // Check if measurement is passed directly via options (from Project Wizard)
  const directMeasurement = opts.selectedMeasurement ? {
    entityId: opts.selectedMeasurement.entityId || opts.selectedMeasurement.id,
    entityName: opts.selectedMeasurement.entityName || opts.selectedMeasurement.name || '',
    entityLabel: opts.selectedMeasurement.entityLabel || opts.selectedMeasurement.label || '',
    installationType: opts.selectedMeasurement.installationType || null
  } : null;

  const selectedMeasurementFromParams = directMeasurement || stateParams.selectedMeasurement || (entityId ? {
    entityId: entityId,
    entityName: entityName || ''
  } : null);

  // Skip measurement selection step when measurement is directly provided
  const skipMeasurementSelection = !!directMeasurement;

  // Configuration object
  const config = {
    isTenantAdmin: isTenantAdmin,
    selectedCustomer: stateParams.selectedCustomer || null,
    selectedProject: stateParams.selectedProject || null,
    selectedMeasurement: selectedMeasurementFromParams,
    directMeasurement: directMeasurement,  // For pre-selected measurement with entityName/entityLabel
    customers: [],
    projects: [],
    measurements: [],
    importToMeasurement: true,
    lockMeasurementSelection: !!selectedMeasurementFromParams,
    needsCustomerSelection: false,
    needsProjectSelection: false,
    needsMeasurementSelection: !skipMeasurementSelection,
    skipToUpload: skipMeasurementSelection
  };

  // If not Tenant Admin, get customer from current user
  if (!isTenantAdmin) {
    var custId = widgetContext.currentUser.customerId;
    config.selectedCustomer = {
      id: custId && custId.id ? custId.id : custId,
      entityType: 'CUSTOMER'
    };
  }

  // Fetch customers
  let customers$ = rxjs.of([]);
  if (config.needsCustomerSelection) {
    // Tenant Admin: load all customers
    customers$ = customerService.getCustomers(pageLink).pipe(
      rxjs.map(result => result.data || [])
    );
  } else if (config.selectedCustomer) {
    // Non-Tenant Admin: load current customer for display
    customers$ = customerService.getCustomer(config.selectedCustomer.id).pipe(
      rxjs.map(customer => [customer])
    );
  }

  // Initial load: fetch device profiles and customers
  customers$.subscribe(
    function(customers) {
      config.customers = customers;

      openDialog(config);
    },
    function(error) {
      console.error('Failed to load initial data:', error);
      config.customers = [];
      openDialog(config);
    }
  );

  function openDialog(config) {
  // 1) CSS - ECO Design System
  const myCSS = `
/* ═══════════════════════════════════════════════════════════════
   ECO DESIGN SYSTEM - CSV Importer Dialog
   ═══════════════════════════════════════════════════════════════ */

/* Dialog Header */
.add-device-to-asset-form .eco-dialog-header,
mat-toolbar.eco-dialog-header {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  padding: 0 16px !important;
  height: 56px !important;
  min-height: 56px !important;
  background-color: #1976d2 !important;
  background: #1976d2 !important;
  color: white !important;
  font-family: "Roboto", "Helvetica Neue", sans-serif !important;
}
.add-device-to-asset-form .eco-dialog-header .header-icon,
mat-toolbar.eco-dialog-header .header-icon {
  font-size: 24px !important;
  width: 24px !important;
  height: 24px !important;
  color: white !important;
}
.add-device-to-asset-form .eco-dialog-header .header-title,
mat-toolbar.eco-dialog-header .header-title {
  margin: 0 !important;
  font-size: 1.125rem !important;
  font-weight: 500 !important;
  letter-spacing: -0.01em !important;
  color: white !important;
  flex: 1 !important;
}
.add-device-to-asset-form .eco-dialog-header .close-btn,
mat-toolbar.eco-dialog-header .close-btn {
  color: rgba(255,255,255,0.8) !important;
  margin-left: auto !important;
}
.add-device-to-asset-form .eco-dialog-header .close-btn:hover,
mat-toolbar.eco-dialog-header .close-btn:hover {
  color: white !important;
  background: rgba(255,255,255,0.1) !important;
}

/* Section Cards */
.add-device-to-asset-form .section-card {
  background: white !important;
  border: 1px solid #e2e8f0 !important;
  border-left: 3px solid #1976d2 !important;
  border-radius: 0 !important;
  overflow: hidden !important;
  margin-bottom: 16px !important;
}
.add-device-to-asset-form .section-header {
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
.add-device-to-asset-form .section-header mat-icon {
  font-size: 18px !important;
  width: 18px !important;
  height: 18px !important;
  color: #1976d2 !important;
}
.add-device-to-asset-form .section-body {
  padding: 16px !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 8px !important;
}

/* Form field styles */
.add-device-to-asset-form .mdc-text-field--filled.mdc-text-field--disabled {
  background-color: rgba(244, 249, 254, 0.5) !important;
}
.add-device-to-asset-form .mat-mdc-form-field-focus-overlay {
  background-color: #F4F9FE !important;
}
.add-device-to-asset-form .mdc-text-field--filled:not(.mdc-text-field--disabled) {
  background-color: #F4F9FE !important;
}
mat-icon {
  vertical-align: middle;
  margin-right: 4px;
}
.success-message {
  color: #155724;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.warning-message {
  color: #856404;
  background-color: #fff3cd;
  border: 1px solid #ffeeba;
  border-radius: 4px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.error-message {
  color: #721c24;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.csv-settings-bar {
  display: flex;
  gap: 16px;
  padding: 12px 16px;
  background: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 16px;
  align-items: center;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
.csv-settings-bar .mat-mdc-form-field {
  margin: 0;
}
.csv-settings-bar span {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
.preview-container {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  background: white;
}
.preview-scroll {
  max-height: 600px;
  overflow: auto;
}
.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 16px;
  table-layout: auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
.preview-table th {
  padding: 0;
  text-align: left;
  border-bottom: 2px solid #e0e0e0;
  border-right: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 2;
  min-width: 140px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
.preview-table th:last-child {
  border-right: none;
}
.preview-table th.invalid-col {
  background: #ffebee !important;
}
.preview-table th.rejected-col {
  background: #fff3e0 !important;
  opacity: 0.7;
}
.preview-table th.calc-col {
  background: #e3f2fd !important;
}
.preview-table th.valid-col {
  background: #fafafa !important;
}
.col-header {
  padding: 8px 10px;
  font-weight: 600;
  font-size: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.col-unit-row {
  padding: 4px 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  box-sizing: border-box;
  height: 48px;
}
.col-unit-row select {
  flex: 1;
  padding: 3px 5px;
  border: 1px solid #ccc;
  border-radius: 3px;
  font-size: 16px;
  background: white;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  min-width: 60px;
}
.col-unit-row .unit-display {
  padding: 3px 5px;
  border: 1px solid #ccc;
  border-radius: 3px;
  font-size: 16px;
  background: white;
  min-width: 40px;
  text-align: center;
  font-weight: 500;
}
.col-conversion-indicator {
  font-size: 16px;
  color: #1976d2;
  font-weight: 500;
  white-space: nowrap;
}
.tb-unit-selector {
  flex: 0 0 auto;
  font-size: 16px;
  width: 80px;
}
.tb-unit-selector .mat-mdc-form-field-subscript-wrapper {
  display: none;
}
.tb-unit-selector .mat-mdc-text-field-wrapper {
  padding: 0;
}
.tb-unit-selector .mat-mdc-form-field-infix {
  min-height: 32px;
  padding: 6px 8px;
  display: flex;
  align-items: center;
}
.tb-unit-selector .mat-mdc-select {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 500;
}
.tb-unit-selector .mat-mdc-select-value {
  text-align: center;
}
.tb-unit-selector .mat-mdc-select-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
}
.tb-unit-selector .mdc-notched-outline__leading,
.tb-unit-selector .mdc-notched-outline__notch,
.tb-unit-selector .mdc-notched-outline__trailing {
  border-color: #ccc !important;
}
.tb-unit-name {
  flex: 1;
  font-size: 16px;
}
.tb-unit-symbol {
  font-size: 16px;
  font-weight: 500;
  color: #666;
  margin-left: auto;
  padding-left: 8px;
}
.mat-mdc-option .mdc-list-item__primary-text {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
}
.preview-table td {
  padding: 6px 10px;
  border-bottom: 1px solid #f0f0f0;
  border-right: 1px solid #f5f5f5;
  white-space: nowrap;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
.preview-table td:last-child {
  border-right: none;
}
.preview-table td.invalid-value {
  background-color: #ffebee !important;
  color: #c62828;
  font-weight: 500;
}
.preview-table tr:hover td {
  background: #f5f5f5;
}
.preview-table tr:hover td.invalid-value {
  background-color: #ffcdd2 !important;
}
.timestamp-display {
  display: flex;
  align-items: center;
  gap: 8px;
}
.timestamp-original {
  font-family: monospace;
}
.timestamp-interpreted {
  font-size: 11px;
  color: #1976d2;
  font-family: monospace;
  white-space: nowrap;
}
.calc-formula-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  box-sizing: border-box;
  height: 48px;
}
.calc-formula {
  flex: 1;
  font-size: 16px;
  color: #1976d2;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.calc-formula-row mat-checkbox {
  flex-shrink: 0;
  transform: scale(0.9);
}
.required-fields {
  margin-top: 12px;
  padding: 12px;
  background: #fff8e1;
  border: 1px solid #ffcc02;
  border-radius: 4px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
.required-fields-title {
  font-weight: 600;
  margin-bottom: 6px;
  color: #f57c00;
  font-size: 16px;
}
.required-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 0;
  font-size: 16px;
}
.required-item mat-icon {
  font-size: 18px;
  width: 18px;
  height: 18px;
}
.required-item.missing { color: #c62828; }
.progress-section {
  margin-top: 16px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 4px;
}
.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 16px;
}
.progress-bar-bg {
  height: 20px;
  background: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #1976d2, #42a5f5);
  transition: width 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 11px;
  font-weight: 500;
}
`;

  const cssParser = new cssjs();
  cssParser.testMode = false;
  cssParser.cssPreviewNamespace = 'add-device-to-asset-dialog';
  cssParser.createStyleElement('add-device-to-asset-dialog', myCSS, 'nonamespace');

  // 2) HTML Template
  const htmlTemplate = `
<form [formGroup]="formGroup" class="add-device-to-asset-form" style="width: 1200px;">
  <mat-toolbar class="eco-dialog-header">
    <mat-icon class="header-icon">upload_file</mat-icon>
    <h2 class="header-title">{{ 'custom.csv-importer.title' | translate }}</h2>
    <span class="flex-1"></span>
    <button mat-icon-button (click)="cancel()" type="button" class="close-btn">
      <mat-icon>close</mat-icon>
    </button>
  </mat-toolbar>

  <mat-progress-bar color="warn" mode="indeterminate" *ngIf="isLoading$ | async"></mat-progress-bar>
  <div style="height: 4px;" *ngIf="!(isLoading$ | async)"></div>

  <div mat-dialog-content class="flex flex-col p-4">
    <!-- Single Vertical Stepper -->
    <mat-vertical-stepper #stepper [linear]="true">
      <ng-template matStepperIcon="edit" let-index="index">
        <span>{{index + 1}}</span>
      </ng-template>
      <ng-template matStepperIcon="done" let-index="index">
        <span>{{index + 1}}</span>
      </ng-template>

      <!-- Step 0c: Select Measurement (if not in stateParams) -->
      <mat-step *ngIf="needsMeasurementSelection" [completed]="measurementSelected">
        <ng-template matStepLabel>{{ 'custom.csv-importer.step-select-measurement' | translate }}</ng-template>

        <div style="margin-top: 16px;">
          <div class="flex flex-col gap-4">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>{{ 'custom.csv-importer.measurement' | translate }}</mat-label>
              <mat-select formControlName="measurement" required (selectionChange)="onMeasurementChange()"
                          [disabled]="lockMeasurementSelection">
                <mat-option *ngFor="let measurement of measurements" [value]="measurement">
                  {{ measurement.name }}
                </mat-option>
              </mat-select>
              <mat-error *ngIf="formGroup.get('measurement').hasError('required')">
                {{ 'custom.csv-importer.measurement-required' | translate }}
              </mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>{{ 'custom.csv-importer.measurement-label' | translate }}</mat-label>
              <input matInput formControlName="measurementLabel" (blur)="saveMeasurementLabel()">
            </mat-form-field>
          </div>

          <div class="flex flex-row gap-2 justify-end items-center" style="margin-top: 24px;">
            <button mat-button type="button" (click)="cancel()">
              {{ 'action.cancel' | translate }}
            </button>
            <button mat-raised-button color="primary" type="button"
                    [disabled]="!measurementSelected || (isLoading$ | async)"
                    (click)="stepper.next()">
              {{ 'action.continue' | translate }}
            </button>
          </div>
        </div>
      </mat-step>

      <!-- Step 2: Upload and Configure CSV -->
      <mat-step [completed]="rawCsvData && !parseError">
        <ng-template matStepLabel>{{ 'custom.csv-importer.step-upload-csv' | translate }}</ng-template>

        <div style="margin-top: 16px;">
          <!-- Measurement Info (when skipping selection step) -->
          <div *ngIf="skipToUpload && directMeasurement" class="section-card" style="margin-bottom: 16px;">
            <div class="section-header">
              <mat-icon>analytics</mat-icon>
              <span>{{ 'custom.csv-importer.measurement-info' | translate }}</span>
              <!-- Installation Type Badge -->
              <span *ngIf="directMeasurement.installationType === 'heating'"
                    style="margin-left: auto; display: flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 12px; background: rgba(235, 87, 87, 0.12); color: #EB5757; font-size: 11px; text-transform: none; letter-spacing: normal;">
                <mat-icon style="font-size: 14px; width: 14px; height: 14px; color: #EB5757 !important;">local_fire_department</mat-icon>
                {{ 'custom.csv-importer.heating' | translate }}
              </span>
              <span *ngIf="directMeasurement.installationType === 'cooling'"
                    style="margin-left: auto; display: flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 12px; background: rgba(47, 128, 237, 0.12); color: #2F80ED; font-size: 11px; text-transform: none; letter-spacing: normal;">
                <mat-icon style="font-size: 14px; width: 14px; height: 14px; color: #2F80ED !important;">ac_unit</mat-icon>
                {{ 'custom.csv-importer.cooling' | translate }}
              </span>
            </div>
            <div class="section-body">
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <mat-form-field appearance="outline" style="width: 100%;">
                  <mat-label>{{ 'custom.csv-importer.measurement-name' | translate }}</mat-label>
                  <input matInput [value]="directMeasurement.entityName" disabled>
                </mat-form-field>
                <mat-form-field appearance="outline" style="width: 100%;">
                  <mat-label>{{ 'custom.csv-importer.measurement-label' | translate }}</mat-label>
                  <input matInput formControlName="measurementLabel" placeholder="{{ 'custom.csv-importer.measurement-label-placeholder' | translate }}">
                </mat-form-field>
              </div>
            </div>
          </div>

          <!-- CSV Instructions (Collapsible) -->
          <mat-expansion-panel style="margin-bottom: 16px;">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon style="margin-right: 8px;">info</mat-icon>
                {{ 'custom.csv-importer.instructions-title' | translate }}
              </mat-panel-title>
            </mat-expansion-panel-header>

            <div style="padding: 16px;">
              <div style="margin-bottom: 16px;">
                <button mat-raised-button color="primary" (click)="downloadExampleCSV()">
                  <mat-icon>download</mat-icon>
                  {{ 'custom.csv-importer.download-example' | translate }}
                </button>
              </div>

              <h4 style="margin-bottom: 8px; font-weight: 600;">{{ 'custom.csv-importer.supported-datapoints' | translate }}</h4>

              <!-- Datapoints table with descriptions -->
              <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f5f5f5; text-align: left;">
                    <th style="padding: 6px 8px; border-bottom: 1px solid #e0e0e0;">Key</th>
                    <th style="padding: 6px 8px; border-bottom: 1px solid #e0e0e0;">{{ 'custom.csv-importer.col-unit' | translate }}</th>
                    <th style="padding: 6px 8px; border-bottom: 1px solid #e0e0e0;">{{ 'custom.csv-importer.col-description' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- Temperature -->
                  <tr>
                    <td style="padding: 4px 8px; font-family: monospace; color: #1976d2;">T_flow_C</td>
                    <td style="padding: 4px 8px;">&deg;C</td>
                    <td style="padding: 4px 8px;">{{ 'custom.csv-importer.desc-t-flow' | translate }}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 8px; font-family: monospace; color: #1976d2;">T_return_C</td>
                    <td style="padding: 4px 8px;">&deg;C</td>
                    <td style="padding: 4px 8px;">{{ 'custom.csv-importer.desc-t-return' | translate }}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 8px; font-family: monospace; color: #1976d2;">dT_K</td>
                    <td style="padding: 4px 8px;">K</td>
                    <td style="padding: 4px 8px;">{{ 'custom.csv-importer.desc-dt' | translate }}</td>
                  </tr>
                  <!-- Flow -->
                  <tr style="background: #fafafa;">
                    <td style="padding: 4px 8px; font-family: monospace; color: #1976d2;">Vdot_m3h</td>
                    <td style="padding: 4px 8px;" [innerHTML]="'m&sup3;/h'"></td>
                    <td style="padding: 4px 8px;">{{ 'custom.csv-importer.desc-vdot' | translate }}</td>
                  </tr>
                  <tr style="background: #fafafa;">
                    <td style="padding: 4px 8px; font-family: monospace; color: #1976d2;">v_ms</td>
                    <td style="padding: 4px 8px;">m/s</td>
                    <td style="padding: 4px 8px;">{{ 'custom.csv-importer.desc-v' | translate }}</td>
                  </tr>
                  <!-- Power & Energy -->
                  <tr>
                    <td style="padding: 4px 8px; font-family: monospace; color: #1976d2;">P_th_kW</td>
                    <td style="padding: 4px 8px;">kW</td>
                    <td style="padding: 4px 8px;">{{ 'custom.csv-importer.desc-p-th' | translate }}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 8px; font-family: monospace; color: #1976d2;">E_th_kWh</td>
                    <td style="padding: 4px 8px;">kWh</td>
                    <td style="padding: 4px 8px;">{{ 'custom.csv-importer.desc-e-th' | translate }}</td>
                  </tr>
                  <!-- Volume -->
                  <tr style="background: #fafafa;">
                    <td style="padding: 4px 8px; font-family: monospace; color: #1976d2;">V_m3</td>
                    <td style="padding: 4px 8px;" [innerHTML]="'m&sup3;'"></td>
                    <td style="padding: 4px 8px;">{{ 'custom.csv-importer.desc-v-m3' | translate }}</td>
                  </tr>
                  <!-- Auxiliary -->
                  <tr>
                    <td style="padding: 4px 8px; font-family: monospace; color: #1976d2;">auxT1_C</td>
                    <td style="padding: 4px 8px;">&deg;C</td>
                    <td style="padding: 4px 8px;">{{ 'custom.csv-importer.desc-auxt1' | translate }}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 8px; font-family: monospace; color: #1976d2;">auxT2_C</td>
                    <td style="padding: 4px 8px;">&deg;C</td>
                    <td style="padding: 4px 8px;">{{ 'custom.csv-importer.desc-auxt2' | translate }}</td>
                  </tr>
                </tbody>
              </table>

              <!-- Legacy keys note -->
              <div style="margin-top: 12px; padding: 8px; background: #fff3e0; border-radius: 4px; font-size: 12px;">
                <mat-icon style="font-size: 14px; width: 14px; height: 14px; vertical-align: middle; color: #ef6c00;">info</mat-icon>
                <span style="color: #e65100;">{{ 'custom.csv-importer.legacy-keys-note' | translate }}</span>
              </div>
            </div>
          </mat-expansion-panel>

          <!-- File Upload -->
          <fieldset [disabled]="isLoading$ | async">
            <tb-file-input formControlName="importData"
                           [label]="'custom.csv-importer.csv-file' | translate"
                           [allowedExtensions]="'csv,txt'"
                           [accept]="'.csv,application/csv,text/csv,.txt,text/plain'"
                           [dropLabel]="'custom.csv-importer.drop-csv' | translate"
                           (ngModelChange)="onFileSelected()">
            </tb-file-input>
          </fieldset>

          <!-- Configuration (shown after file upload) -->
          <div *ngIf="rawCsvData" style="margin-top: 16px;">
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <mat-form-field appearance="outline">
                <mat-label>{{ 'custom.csv-importer.delimiter' | translate }}</mat-label>
                <mat-select formControlName="delim" (selectionChange)="reParseCSV()">
                  <mat-option *ngFor="let d of delimiters" [value]="d.key">{{ d.value }}</mat-option>
                </mat-select>
              </mat-form-field>

              <div style="display: flex; gap: 12px;">
                <mat-form-field appearance="outline" style="flex: 0 0 200px;">
                  <mat-label>{{ 'custom.csv-importer.timestamp-format' | translate }}</mat-label>
                  <mat-select [value]="formGroup.get('timestampFormat').value" (selectionChange)="onTimestampFormatSelect($event.value)">
                    <mat-option *ngFor="let fmt of timestampFormats" [value]="fmt">{{ fmt }}</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" style="flex: 1;">
                  <mat-label>{{ 'custom.csv-importer.custom-format' | translate }}</mat-label>
                  <input matInput formControlName="timestampFormat" (input)="reParseCSV()" placeholder="e.g., DD/MM/YYYY HH:mm">
                </mat-form-field>
              </div>
            </div>

            <!-- Status Message -->
            <div *ngIf="!parseError && previewData" style="margin-top: 12px; padding: 10px; background: #e8f5e9; border-radius: 4px; color: #2e7d32;">
              <mat-icon style="vertical-align: middle; margin-right: 8px; font-size: 18px; width: 18px; height: 18px;">check_circle</mat-icon>
              <span>{{ 'custom.csv-importer.loaded-rows' | translate:{rows: previewData.totalRows, columns: previewData.validColumns} }}</span>
            </div>

            <div *ngIf="parseError" style="margin-top: 12px; padding: 10px; background: #ffebee; border-radius: 4px; color: #c62828;">
              <mat-icon style="vertical-align: middle; margin-right: 8px; font-size: 18px; width: 18px; height: 18px;">error</mat-icon>
              <span>{{ 'custom.csv-importer.parse-error' | translate }}</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div style="display: flex; justify-content: space-between; margin-top: 24px;">
            <button mat-button type="button" (click)="stepper.previous()">{{ 'action.back' | translate }}</button>
            <button mat-raised-button color="primary" type="button"
                    [disabled]="!previewData || parseError || (isLoading$ | async)"
                    (click)="stepper.next()">
              {{ 'action.continue' | translate }}
            </button>
          </div>
        </div>
      </mat-step>

      <!-- Step 3: Preview and Import -->
      <mat-step>
        <ng-template matStepLabel>{{ 'custom.csv-importer.step-preview-import' | translate }}</ng-template>

              <div style="margin-top: 16px;">
                <!-- Preview Table -->
                <div class="preview-container" *ngIf="previewData">
                  <div class="preview-scroll">
                    <table class="preview-table">
                      <thead>
                        <tr>
                          <!-- Original Columns -->
                          <th *ngFor="let col of columns" [ngClass]="{'invalid-col': col.status === 'invalid', 'valid-col': col.status === 'valid', 'rejected-col': col.status === 'rejected'}">
                            <div class="col-header">
                              <span [style.text-decoration]="col.isRejected ? 'line-through' : 'none'" [style.color]="col.isRejected ? '#999' : 'inherit'">
                                {{ col.normalizedName || col.name }}
                              </span>
                              <span *ngIf="col.isLegacyKey && !col.isRejected" style="font-size: 10px; color: #666; font-weight: normal; display: block;">← {{ col.name }}</span>
                              <span *ngIf="col.isRejected" style="font-size: 10px; color: #f44336; font-weight: normal; display: block;">
                                <mat-icon style="font-size: 12px; width: 12px; height: 12px; vertical-align: middle;">block</mat-icon>
                                {{ 'custom.csv-importer.' + col.rejectedReason | translate }}
                              </span>
                            </div>
                            <!-- Unit selector with conversion indicator (no timestamp selector) -->
                            <div class="col-unit-row" *ngIf="col.units && col.index > 0">
                              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="tb-unit-selector">
                                <mat-select [(ngModel)]="col.selectedUnit" [ngModelOptions]="{standalone: true}" (selectionChange)="updatePreview()">
                                  <mat-select-trigger>
                                    <span [innerHTML]="col.selectedUnitShortLabel"></span>
                                  </mat-select-trigger>
                                  <mat-option *ngFor="let u of col.units" [value]="u.key">
                                    <span class="tb-unit-name flex-1">{{ u.label | translate }}</span>
                                    <span class="tb-unit-symbol" [innerHTML]="u.shortLabel"></span>
                                  </mat-option>
                                </mat-select>
                              </mat-form-field>
                              <span class="col-conversion-indicator" *ngIf="col.conversionLabel" [innerHTML]="col.conversionLabel"></span>
                            </div>
                          </th>
                          <!-- Calculated Columns -->
                          <th *ngFor="let calc of calcColumns" class="calc-col">
                            <div class="col-header">
                              {{ calc.name }}
                            </div>
                            <div class="calc-formula-row">
                              <span class="calc-formula" [innerHTML]="calc.formula"></span>
                              <mat-checkbox [(ngModel)]="calc.enabled" [ngModelOptions]="{standalone: true}" (change)="updatePreview()" color="primary"></mat-checkbox>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let row of previewRows">
                          <td *ngFor="let col of columns; let colIdx = index" [ngClass]="{'invalid-value': row[col.name + '_invalid']}">
                            <div *ngIf="colIdx === 0 && row[col.name + '_interpreted']" class="timestamp-display">
                              <span class="timestamp-original">{{ row[col.name] }}</span>
                              <span class="timestamp-interpreted">{{ row[col.name + '_interpreted'] }}</span>
                            </div>
                            <span *ngIf="colIdx !== 0 || !row[col.name + '_interpreted']">{{ row[col.name] }}</span>
                          </td>
                          <td *ngFor="let calc of calcColumns">
                            {{ calc.enabled ? row[calc.name] : '-' }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Invalid Timestamps Warning -->
                <div class="error-message" *ngIf="previewData && hasInvalidTimestamps" style="margin-top: 12px;">
                  <mat-icon>error</mat-icon>
                  <span>{{ 'custom.csv-importer.invalid-timestamp' | translate }}</span>
                </div>

                <!-- Non-Numeric Values Warning -->
                <div class="error-message" *ngIf="previewData && hasNonNumericValues" style="margin-top: 12px;">
                  <mat-icon>error</mat-icon>
                  <span>{{ 'custom.csv-importer.non-numeric-values' | translate }}</span>
                </div>

                <!-- Optional Fields Info -->
                <div class="info-message" *ngIf="previewData && (!hasVolume || !hasEnergy)" style="margin-top: 12px; padding: 10px; background: #fff8e1; border-radius: 4px; color: #f57c00;">
                  <mat-icon style="vertical-align: middle; margin-right: 8px; font-size: 18px; width: 18px; height: 18px;">info</mat-icon>
                  <span>{{ 'custom.csv-importer.optional-fields-info' | translate }}</span>
                  <div style="margin-top: 8px; font-size: 12px;">
                    <span *ngIf="!hasVolume" style="display: block;">• V_m3 ({{ 'custom.csv-importer.meter-volume' | translate }})</span>
                    <span *ngIf="!hasEnergy" style="display: block;">• E_th_kWh ({{ 'custom.csv-importer.energy-meter' | translate }})</span>
                  </div>
                </div>

                <!-- Progress Section -->
                <div class="progress-section" *ngIf="uploadProgress">
                  <div class="progress-info">
                    <span>{{ 'custom.csv-importer.importing-batch' | translate:{current: uploadProgress.current, total: uploadProgress.total} }}</span>
                    <span>{{ 'custom.csv-importer.rows' | translate:{rows: uploadProgress.rows} }}</span>
                  </div>
                  <div class="progress-bar-bg">
                    <div class="progress-bar-fill" [style.width.%]="uploadProgress.percent">
                      {{ uploadProgress.percent }}%
                    </div>
                  </div>
                </div>

                <!-- Messages -->
                <div class="warning-message" *ngIf="importWarning" style="margin-top: 12px;">
                  <mat-icon>warning</mat-icon>
                  <span>{{ importWarning }}</span>
                </div>

                <div class="success-message" *ngIf="importSuccess" style="margin-top: 12px;">
                  <mat-icon>check_circle</mat-icon>
                  <span>{{ importSuccess }}</span>
                </div>

                <!-- Action Buttons -->
                <div style="display: flex; justify-content: space-between; margin-top: 24px;">
                  <div style="display: flex; gap: 8px;">
                    <button mat-button type="button" (click)="stepper.previous()">{{ 'action.back' | translate }}</button>
                    <button mat-button type="button"
                            *ngIf="previewData"
                            (click)="downloadNormalizedCSV()">
                      <mat-icon>download</mat-icon>
                      {{ 'custom.csv-importer.download-normalized' | translate }}
                    </button>
                  </div>
                  <div style="display: flex; gap: 8px;">
                    <button mat-button type="button" (click)="cancel()">
                      {{ importSuccess ? ('action.done' | translate) : ('action.cancel' | translate) }}
                    </button>
                    <button mat-raised-button color="primary" type="button"
                            *ngIf="!importSuccess && previewData"
                            [disabled]="(isLoading$ | async) || !canImport || uploadProgress || hasInvalidTimestamps || hasNonNumericValues"
                            (click)="importTelemetry()">
                      {{ uploadProgress ? ('custom.csv-importer.importing' | translate) : ('custom.csv-importer.import-rows' | translate:{rows: previewData.totalRows}) }}
                    </button>
                  </div>
                </div>
              </div>
      </mat-step>

    </mat-vertical-stepper>
  </div>
</form>
`;

  // 3) Open Dialog
  customDialog.customDialog(htmlTemplate, AddDeviceToAssetController).subscribe();

  // 4) Controller
  function AddDeviceToAssetController(instance) {
    const vm = instance;

    // Loading state
    const loadingSubject = new rxjs.BehaviorSubject(false);
    vm.isLoading$ = loadingSubject.asObservable();

    // State
    vm.deviceCreated = false;
    vm.deviceExisted = false;
    vm.createdDeviceId = null;
    vm.createdDeviceName = '';
    vm.importWarning = '';
    vm.importError = '';
    vm.importSuccess = '';

    // Preview state
    vm.previewData = null;
    vm.fileName = '';
    vm.columns =[];
    vm.calcColumns = [];
    vm.previewRows = [];
    vm.uploadProgress = null;
    vm.rawCsvData = null;
    vm.rawParsedData = null;
    vm.parseError = '';
    vm.hasNonNumericValues = false;
    vm.hasInvalidTimestamps = false;

    // Required fields check
    vm.hasVolume = false;
    vm.hasEnergy = false;
    vm.canImport = false;

    // Allowed datapoints - New ECO Data Catalog keys with backward compatibility
    // Primary keys follow snake_case + unit convention (e.g., T_flow_C, P_th_kW)
    // Aliases map old CHC_... keys to new keys for backward compatibility
    const ALLOWED_DATAPOINTS = {
      // Temperature - Sensor values
      'T_flow_C': { unit: '&deg;C', type: 'sensor', category: 'temperature' },
      'T_return_C': { unit: '&deg;C', type: 'sensor', category: 'temperature' },
      'dT_K': { unit: 'K', type: 'sensor', category: 'temperature' },
      // Flow - Sensor values
      'Vdot_m3h': { unit: 'm&sup3;/h', type: 'sensor', category: 'flow' },
      'v_ms': { unit: 'm/s', type: 'sensor', category: null },
      // Power - Sensor value (single key for heating/cooling)
      'P_th_kW': { unit: 'kW', type: 'sensor', category: 'power' },
      // Energy - Meter value (single key for heating/cooling)
      'E_th_kWh': { unit: 'kWh', type: 'meter', category: 'energy' },
      // Volume - Meter value
      'V_m3': { unit: 'm&sup3;', type: 'meter', category: 'volume' },
      // Auxiliary sensors
      'auxT1_C': { unit: '&deg;C', type: 'sensor', category: 'aux' },
      'auxT2_C': { unit: '&deg;C', type: 'sensor', category: 'aux' }
    };

    // Alias mapping: Old CHC_... keys → New keys (for backward compatibility)
    // Common aliases (valid for both heating and cooling)
    const KEY_ALIASES_COMMON = {
      // Temperature
      'CHC_S_TemperatureFlow': 'T_flow_C',
      'CHC_S_TemperatureReturn': 'T_return_C',
      'CHC_S_TemperatureDiff': 'dT_K',
      // Flow
      'CHC_S_VolumeFlow': 'Vdot_m3h',
      'CHC_S_Velocity': 'v_ms',
      // Volume meter
      'CHC_M_Volume': 'V_m3',
      'CHC_M_Volume_Net': 'V_m3'
    };

    // Heating-specific aliases
    const KEY_ALIASES_HEATING = {
      'CHC_S_Power_Heating': 'P_th_kW',
      'CHC_M_Energy_Heating': 'E_th_kWh'
    };

    // Cooling-specific aliases
    const KEY_ALIASES_COOLING = {
      'CHC_S_Power_Cooling': 'P_th_kW',
      'CHC_M_Energy_Cooling': 'E_th_kWh'
    };

    // Keys that should be REJECTED based on installationType
    const REJECTED_KEYS_FOR_HEATING = ['CHC_S_Power_Cooling', 'CHC_M_Energy_Cooling'];
    const REJECTED_KEYS_FOR_COOLING = ['CHC_S_Power_Heating', 'CHC_M_Energy_Heating'];

    // Get the installationType from directMeasurement (passed from Project Wizard)
    function getInstallationType() {
      return config.directMeasurement?.installationType || null;
    }

    // Get valid aliases based on installationType
    function getValidAliases() {
      const installationType = getInstallationType();
      let aliases = { ...KEY_ALIASES_COMMON };

      if (installationType === 'heating') {
        // Add heating aliases, reject cooling keys
        Object.assign(aliases, KEY_ALIASES_HEATING);
      } else if (installationType === 'cooling') {
        // Add cooling aliases, reject heating keys
        Object.assign(aliases, KEY_ALIASES_COOLING);
      } else {
        // No installationType specified - accept all (fallback)
        Object.assign(aliases, KEY_ALIASES_HEATING, KEY_ALIASES_COOLING);
      }

      return aliases;
    }

    // Check if a key should be rejected based on installationType
    function isRejectedKey(key) {
      const installationType = getInstallationType();
      if (installationType === 'heating') {
        return REJECTED_KEYS_FOR_HEATING.includes(key);
      } else if (installationType === 'cooling') {
        return REJECTED_KEYS_FOR_COOLING.includes(key);
      }
      return false;
    }

    // Normalize key: Convert old key to new key if alias exists
    function normalizeKey(key) {
      const aliases = getValidAliases();
      return aliases[key] || key;
    }

    // Check if key is valid (either new key or has alias, and not rejected)
    function isValidKey(key) {
      // First check if key is rejected based on installationType
      if (isRejectedKey(key)) {
        return false;
      }
      const normalized = normalizeKey(key);
      return ALLOWED_DATAPOINTS.hasOwnProperty(normalized);
    }

    // Get config for a key (handles aliases)
    function getKeyConfig(key) {
      if (isRejectedKey(key)) {
        return null;
      }
      const normalized = normalizeKey(key);
      return ALLOWED_DATAPOINTS[normalized] || null;
    }

    // Unit conversion definitions with conversion labels
    const UNIT_CONVERSIONS = {
      'energy': [
        { key: 'none', label: 'unit.kilowatt-hour', shortLabel: 'kWh', factor: 1, convLabel: '' },
        { key: 'j_to_kwh', label: 'unit.joule', shortLabel: 'J', factor: 1 / 3600000, convLabel: '&rarr; kWh' },
        { key: 'kj_to_kwh', label: 'unit.kilojoule', shortLabel: 'kJ', factor: 1 / 3600, convLabel: '&rarr; kWh' },
        { key: 'mj_to_kwh', label: 'unit.megajoule', shortLabel: 'MJ', factor: 1 / 3.6, convLabel: '&rarr; kWh' },
        { key: 'wh_to_kwh', label: 'unit.watt-hour', shortLabel: 'Wh', factor: 1 / 1000, convLabel: '&rarr; kWh' },
        { key: 'mwh_to_kwh', label: 'unit.megawatt-hour', shortLabel: 'MWh', factor: 1000, convLabel: '&rarr; kWh' }
      ],
      'volume': [
        { key: 'none', label: 'unit.cubic-meter', shortLabel: 'm&sup3;', factor: 1, convLabel: '' },
        { key: 'l_to_m3', label: 'unit.liter', shortLabel: 'L', factor: 1 / 1000, convLabel: '&rarr; m&sup3;' },
        { key: 'gal_to_m3', label: 'unit.gallon', shortLabel: 'gal', factor: 0.00378541, convLabel: '&rarr; m&sup3;' }
      ],
      'temperature': [
        { key: 'none', label: 'unit.celsius', shortLabel: '&deg;C', factor: 1, convLabel: '' },
        { key: 'f_to_c', label: 'unit.fahrenheit', shortLabel: '&deg;F', factor: 'f_to_c', convLabel: '&rarr; &deg;C' },
        { key: 'k_to_c', label: 'unit.kelvin', shortLabel: 'K', factor: 'k_to_c', convLabel: '&rarr; &deg;C' }
      ],
      'power': [
        { key: 'none', label: 'unit.kilowatt', shortLabel: 'kW', factor: 1, convLabel: '' },
        { key: 'w_to_kw', label: 'unit.watt', shortLabel: 'W', factor: 1 / 1000, convLabel: '&rarr; kW' },
        { key: 'mw_to_kw', label: 'unit.megawatt', shortLabel: 'MW', factor: 1000, convLabel: '&rarr; kW' }
      ],
      'flow': [
        { key: 'none', label: 'unit.cubic-meters-per-hour', shortLabel: 'm&sup3;/h', factor: 1, convLabel: '' },
        { key: 'lph_to_m3h', label: 'unit.liters-per-hour', shortLabel: 'L/h', factor: 1 / 1000, convLabel: '&rarr; m&sup3;/h' },
        { key: 'lpm_to_m3h', label: 'unit.liter-per-minute', shortLabel: 'L/min', factor: 0.06, convLabel: '&rarr; m&sup3;/h' }
      ]
    };

    // Hierarchy selection data
    vm.needsCustomerSelection = config.needsCustomerSelection;
    vm.needsProjectSelection = config.needsProjectSelection;
    vm.needsMeasurementSelection = config.needsMeasurementSelection;
    vm.skipToUpload = config.skipToUpload;
    vm.directMeasurement = config.directMeasurement;
    vm.customers = config.customers;
    vm.projects = config.projects;
    vm.measurements = config.measurements;
    vm.customerSelected = !!config.selectedCustomer;
    vm.projectSelected = !!config.selectedProject;
    vm.measurementSelected = !!config.selectedMeasurement;
    vm.selectedMeasurementEntity = null;
    vm.lockMeasurementSelection = config.lockMeasurementSelection;

    // Delimiters and timestamp formats
    vm.delimiters = [
      { key: ',', value: ',' },
      { key: ';', value: ';' },
      { key: '|', value: '|' },
      { key: '\t', value: 'Tab' }
    ];
    vm.timestampFormats = [
      'DD.MM.YYYY HH:mm',
      'YYYY-MM-DD HH:mm',
      'YYYY-MM-DD HH:mm:ss',
      'YYYY.MM.DD HH:mm',
      'MM/DD/YYYY HH:mm',
      'DD-MM-YYYY HH:mm',
      'YYYY/MM/DD HH:mm',
      'DD.MM.YYYY HH:mm:ss',
      'YYYY-MM-DDTHH:mm:ss'
    ];

    // Form group
    vm.formGroup = vm.fb.group({
      measurement: [
        { value: config.selectedMeasurementEntity || null, disabled: config.lockMeasurementSelection },
        vm.validators.required
      ],
      measurementLabel: [config.directMeasurement?.entityLabel || ''],
      importData: [null],
      delim: [';'],
      timestampFormat: ['YYYY-MM-DD HH:mm:ss']
    });

    // If measurement was passed directly (skipToUpload), set the target
    if (config.directMeasurement && config.selectedMeasurement) {
      vm.createdDeviceId = { entityType: 'ASSET', id: config.selectedMeasurement.entityId };
      vm.createdDeviceName = config.selectedMeasurement.entityName || '';
      vm.deviceCreated = true;
      vm.measurementSelected = true;
    }

    function setMeasurementTarget(measurementId, measurementName) {
      if (!measurementId || !measurementId.id) return;
      vm.createdDeviceId = { entityType: 'ASSET', id: measurementId.id };
      vm.createdDeviceName = measurementName || '';
      vm.deviceCreated = true;
    }

    // Cancel dialog
    vm.cancel = function() {
      vm.dialogRef.close(null);
    };

    // Customer change handler
    vm.onCustomerChange = function() {
      const customer = vm.formGroup.value.customer;
      if (!customer) {
        vm.customerSelected = false;
        vm.projects = [];
        vm.measurements = [];
        return;
      }

      vm.customerSelected = true;
      config.selectedCustomer = { id: customer.id.id, entityType: 'CUSTOMER' };
      loadingSubject.next(true);

      // Fetch projects for selected customer
      const assetSearchQuery = {
        parameters: {
          rootId: customer.id.id,
          rootType: 'CUSTOMER',
          direction: 'FROM',
          relationTypeGroup: 'COMMON',
          maxLevel: 10,
          fetchLastLevelOnly: false
        },
        relationType: 'Owns',
        assetTypes: ['Project']
      };

      assetService.findByQuery(assetSearchQuery).subscribe(
        function(projects) {
          vm.projects = projects;
          config.projects = projects;
          loadingSubject.next(false);
        },
        function(error) {
          console.error('Failed to load projects:', error);
          loadingSubject.next(false);
        }
      );
    };

    // Project change handler
    vm.onProjectChange = function() {
      const project = vm.formGroup.value.project;
      if (!project) {
        vm.projectSelected = false;
        vm.measurements = [];
        return;
      }

      vm.projectSelected = true;
      config.selectedProject = { entityId: project.id, entityName: project.name };
      loadingSubject.next(true);

      // Fetch measurements for selected project
      var assetSearchQuery = {
        parameters: {
          rootId: project.id.id,
          rootType: 'ASSET',
          direction: 'FROM',
          relationTypeGroup: 'COMMON',
          maxLevel: 10,
          fetchLastLevelOnly: false
        },
        relationType: 'Owns',
        assetTypes: ['Measurement']
      };

      assetService.findByQuery(assetSearchQuery).subscribe(
        function(measurements) {
          if (measurements && measurements.length > 0) {
            vm.measurements = measurements;
            config.measurements = measurements;
            selectMeasurementFromList(measurements);
            loadingSubject.next(false);
          } else {
            // Fallback for customer users: use relation service
            loadMeasurementsViaRelations(project.id.id);
          }
        },
        function() {
          // Fallback for customer users: use relation service
          loadMeasurementsViaRelations(project.id.id);
        }
      );
    };

    // Measurement change handler
    vm.onMeasurementChange = function() {
      const measurement = vm.formGroup.get('measurement').value;
      if (!measurement) {
        vm.measurementSelected = false;
        return;
      }

      vm.measurementSelected = true;
      config.selectedMeasurement = {
        entityId: measurement.id,
        entityName: measurement.name,
        entityLabel: measurement.label || ''
      };
      vm.selectedMeasurementEntity = measurement;
      vm.formGroup.patchValue({ measurementLabel: measurement.label || '' });
      setMeasurementTarget(measurement.id, measurement.name);
      loadingSubject.next(false);
    };

    function selectMeasurementFromList(measurements) {
      if (!config.selectedMeasurement || !config.selectedMeasurement.entityId) return;
      const selectedId = config.selectedMeasurement.entityId.id;
      const matched = (measurements || []).find(m => m.id && m.id.id === selectedId);
      if (matched) {
        vm.formGroup.patchValue({ measurement: matched, measurementLabel: matched.label || '' });
        vm.measurementSelected = true;
        vm.selectedMeasurementEntity = matched;
        config.selectedMeasurement = {
          entityId: matched.id,
          entityName: matched.name,
          entityLabel: matched.label || ''
        };
        setMeasurementTarget(matched.id, matched.name);
      }
    }

    vm.saveMeasurementLabel = function() {
      const rawValues = vm.formGroup.getRawValue();
      const measurement = rawValues.measurement;

      // Get measurement ID from form or from directMeasurement (when skipping selection)
      let measurementId = null;
      if (measurement && measurement.id) {
        measurementId = measurement.id.id;
      } else if (config.directMeasurement && config.selectedMeasurement) {
        measurementId = config.selectedMeasurement.entityId;
      }

      if (!measurementId) return;

      const newLabel = rawValues.measurementLabel || '';
      if (vm.selectedMeasurementEntity && vm.selectedMeasurementEntity.label === newLabel) return;

      assetService.getAsset(measurementId).subscribe(
        function(fullMeasurement) {
          if (!fullMeasurement) return;
          fullMeasurement.label = newLabel;
          assetService.saveAsset(fullMeasurement).subscribe(
            function(savedMeasurement) {
              vm.selectedMeasurementEntity = savedMeasurement;
              config.selectedMeasurement.entityLabel = savedMeasurement.label;
              vm.formGroup.patchValue({ measurementLabel: savedMeasurement.label || '' });
            },
            function(error) {
              console.error('Failed to save measurement label:', error);
            }
          );
        },
        function(error) {
          console.error('Failed to load measurement for label update:', error);
        }
      );
    };

    // Initialize: Auto-load projects for non-Tenant-Admin (customer already selected)
    if (!config.needsCustomerSelection && config.selectedCustomer && config.needsProjectSelection) {
      loadingSubject.next(true);
      const assetSearchQuery = {
        parameters: {
          rootId: config.selectedCustomer.id,
          rootType: 'CUSTOMER',
          direction: 'FROM',
          relationTypeGroup: 'COMMON',
          maxLevel: 10,
          fetchLastLevelOnly: false
        },
        relationType: 'Owns',
        assetTypes: ['Project']
      };

      assetService.findByQuery(assetSearchQuery).subscribe(
        function(projects) {
          vm.projects = projects;
          config.projects = projects;
          loadingSubject.next(false);
        },
        function(error) {
          console.error('Failed to load projects:', error);
          loadingSubject.next(false);
        }
      );
    }

    // Helper: Load measurements via entityRelationService (works for customer users)
    function loadMeasurementsViaRelations(projectRootId) {
      var fromEntity = { id: projectRootId, entityType: 'ASSET' };
      entityRelationService.findByFrom(fromEntity, 'Owns').subscribe(
        function(relations) {
          var assetRelations = relations.filter(function(r) { return r.to.entityType === 'ASSET'; });
          if (assetRelations.length === 0) {
            vm.measurements = [];
            config.measurements = [];
            loadingSubject.next(false);
            return;
          }
          var completed = 0;
          var results = [];
          assetRelations.forEach(function(r) {
            assetService.getAsset(r.to.id).subscribe(
              function(asset) {
                if (asset && asset.type === 'Measurement') results.push(asset);
                completed++;
                if (completed === assetRelations.length) {
                  vm.measurements = results;
                  config.measurements = results;
                  selectMeasurementFromList(results);
                  loadingSubject.next(false);
                }
              },
              function() {
                completed++;
                if (completed === assetRelations.length) {
                  vm.measurements = results;
                  config.measurements = results;
                  selectMeasurementFromList(results);
                  loadingSubject.next(false);
                }
              }
            );
          });
        },
        function(error) {
          console.error('Failed to load measurement relations:', error);
          vm.measurements = [];
          config.measurements = [];
          loadingSubject.next(false);
        }
      );
    }

    // Initialize: Auto-load measurements if project is already selected
    if (config.selectedProject && config.needsMeasurementSelection) {
      var projectEntityId = config.selectedProject.entityId;
      var rootId = projectEntityId ? (projectEntityId.id || projectEntityId) : null;
      if (rootId) {
        loadingSubject.next(true);
        var assetSearchQuery = {
          parameters: {
            rootId: rootId,
            rootType: 'ASSET',
            direction: 'FROM',
            relationTypeGroup: 'COMMON',
            maxLevel: 10,
            fetchLastLevelOnly: false
          },
          relationType: 'Owns',
          assetTypes: ['Measurement']
        };

        assetService.findByQuery(assetSearchQuery).subscribe(
          function(measurements) {
            if (measurements && measurements.length > 0) {
              vm.measurements = measurements;
              config.measurements = measurements;
              selectMeasurementFromList(measurements);
              loadingSubject.next(false);
            } else {
              loadMeasurementsViaRelations(rootId);
            }
          },
          function() {
            loadMeasurementsViaRelations(rootId);
          }
        );
      }
    }
    if (config.selectedMeasurement && config.selectedMeasurement.entityId) {
      var measEntityId = config.selectedMeasurement.entityId;
      var measId = measEntityId.id || measEntityId;
      if (measId && vm.measurements.length === 0) {
        loadingSubject.next(true);
        assetService.getAsset(measId).subscribe(
          function(measurement) {
            if (measurement && vm.measurements.length === 0) {
              vm.measurements = [measurement];
              config.measurements = vm.measurements;
              selectMeasurementFromList(vm.measurements);
            }
            loadingSubject.next(false);
          },
          function(error) {
            console.error('Failed to load measurement:', error);
            loadingSubject.next(false);
          }
        );
      }
    }

    // Clear file and reset
    vm.clearFile = function() {
      vm.formGroup.patchValue({ importData: null });
      vm.previewData = null;
      vm.fileName = '';
      vm.parseError = '';
      vm.columns = [];
      vm.calcColumns = [];
      vm.previewRows = [];
      vm.rawCsvData = null;
      vm.rawParsedData = null;
      vm.importError = '';
      vm.importWarning = '';
      vm.importSuccess = '';
      vm.hasVolume = false;
      vm.hasEnergy = false;
      vm.canImport = false;
      vm.hasNonNumericValues = false;
      vm.hasInvalidTimestamps = false;
    };

    // Download example CSV (using new ECO Data Catalog keys)
    // Helper: trigger file download (works in sandboxed iframes)
    function triggerDownload(blob, filename) {
      var url = URL.createObjectURL(blob);
      try {
        // Use top-level window to bypass iframe sandbox download restriction
        var doc = window.top.document;
        var link = doc.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        doc.body.appendChild(link);
        link.click();
        doc.body.removeChild(link);
      } catch(e) {
        // Fallback: try current document
        var link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
    }

    vm.downloadExampleCSV = function() {
      var exampleCSV = 'Timestamp;T_flow_C;T_return_C;dT_K;Vdot_m3h;v_ms;P_th_kW;E_th_kWh;V_m3;auxT1_C;auxT2_C\n' +
        '2025-01-07 17:56:28;48.3;43.1;5.2;2.8;0.95;18.5;4523.7;1234.5;45.2;42.8\n' +
        '2025-01-07 18:56:28;48.7;43.3;5.4;2.9;0.98;19.2;4651.8;1281.3;45.5;43.0\n' +
        '2025-01-07 19:56:28;49.1;43.6;5.5;3.0;1.01;19.8;4783.0;1329.4;45.9;43.3';

      var blob = new Blob([exampleCSV], { type: 'text/csv;charset=utf-8;' });
      triggerDownload(blob, 'example_telemetry.csv');
    };

    // Download normalized CSV
    vm.downloadNormalizedCSV = function() {
      if (!vm.previewData || !vm.rawParsedData) {
        return;
      }

      const timestampFormat = vm.formGroup.get('timestampFormat').value;

      // Build header row with timestamp + all columns + calculated columns
      const headers = ['Timestamp'];
      vm.columns.forEach(function(col, colIndex) {
        if (colIndex > 0) { // Skip original timestamp column
          headers.push(col.name);
        }
      });
      vm.calcColumns.forEach(function(calc) {
        if (calc.enabled) {
          headers.push(calc.name);
        }
      });

      // Build data rows
      const rows = [];
      const allRows = vm.rawParsedData.rows;
      let prevValues = {};
      let prevTimestamp = null;

      allRows.forEach(function(row) {
        const normalizedRow = [];

        // Add timestamp (convert to unix milliseconds)
        const ts = convertTimestampToUnix(row[0], timestampFormat);
        if (ts !== null && !isNaN(ts)) {
          normalizedRow.push(ts);
        } else {
          normalizedRow.push(''); // Invalid timestamp
        }

        // Add normalized data columns with unit conversions
        vm.columns.forEach(function(col, colIndex) {
          if (colIndex === 0) return; // Skip timestamp column

          let val = row[colIndex];
          if (val === null || val === undefined || val === '') {
            normalizedRow.push('');
          } else {
            // Apply unit conversion
            if (col.selectedUnit && col.selectedUnit !== 'none' && typeof val === 'number') {
              const unit = col.units && col.units.find(function(u) {
                return u.key === col.selectedUnit;
              });
              if (unit) {
                val = applyConversion(val, unit.factor);
              }
            }
            normalizedRow.push(val);
          }
        });

        // Add calculated columns
        const deltaHours = prevTimestamp ? (ts - prevTimestamp) / 3600000 : null;

        // Build values object for calculation logic
        const values = {};
        vm.columns.forEach(function(col, colIndex) {
          if (colIndex > 0) {
            let val = row[colIndex];
            if (val !== null && val !== undefined && val !== '') {
              // Apply unit conversion if needed
              if (col.selectedUnit && col.selectedUnit !== 'none' && typeof val === 'number') {
                const unit = col.units && col.units.find(function(u) {
                  return u.key === col.selectedUnit;
                });
                if (unit) {
                  val = applyConversion(val, unit.factor);
                }
              }
              values[col.name] = val;
            }
          }
        });

        vm.calcColumns.forEach(function(calc) {
          if (!calc.enabled) {
            normalizedRow.push('');
            return;
          }

          let calcValue = null;
          const sourceVal = values[calc.source];
          const prevSourceVal = prevValues[calc.source];

          if (calc.type === 'meter_to_consumption') {
            if (sourceVal !== undefined && prevSourceVal !== undefined) {
              calcValue = sourceVal - prevSourceVal;
            }
          } else if (calc.type === 'consumption_to_meter') {
            const prevMeter = prevValues[calc.name] || 0;
            if (sourceVal !== undefined) {
              calcValue = prevMeter + sourceVal;
            }
          } else if (calc.type === 'consumption_to_power' && deltaHours && deltaHours > 0) {
            if (sourceVal !== undefined) {
              calcValue = sourceVal / deltaHours;
            }
          } else if (calc.type === 'consumption_to_flow' && deltaHours && deltaHours > 0) {
            if (sourceVal !== undefined) {
              calcValue = sourceVal / deltaHours;
            }
          }

          normalizedRow.push(calcValue !== null && calcValue !== undefined ? calcValue : '');

          // Store calculated value for next iteration
          if (calcValue !== null && calcValue !== undefined) {
            prevValues[calc.name] = calcValue;
          }
        });

        rows.push(normalizedRow);

        // Update previous values for next iteration
        prevTimestamp = ts;
        Object.keys(values).forEach(function(key) {
          prevValues[key] = values[key];
        });
      });

      // Build CSV string
      let csvContent = headers.join(';') + '\n';
      rows.forEach(function(row) {
        csvContent += row.join(';') + '\n';
      });

      // Trigger download
      var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      triggerDownload(blob, 'normalized_telemetry.csv');
    };

    // Re-parse CSV when delimiter changes
    vm.reParseCSV = function() {
      if (vm.rawCsvData) {
        processCSV(vm.rawCsvData);
      }
    };

    // Handle timestamp format selection from dropdown
    vm.onTimestampFormatSelect = function(format) {
      vm.formGroup.patchValue({ timestampFormat: format });
      vm.reParseCSV();
    };

    // File selection handler
    vm.onFileSelected = function() {
      const importData = vm.formGroup.get('importData').value;
      if (!importData) {
        vm.clearFile();
        return;
      }

      vm.rawCsvData = importData;
      vm.importError = '';

      // Try to extract filename from file input if available
      // tb-file-input might provide just the content, so use a generic name
      vm.fileName = 'imported.csv';

      // Auto-detect delimiter
      const detectedDelim = autoDetectDelimiter(importData);
      if (detectedDelim) {
        vm.formGroup.patchValue({ delim: detectedDelim });
      }

      processCSV(importData);

      // Auto-detect timestamp format from first data row
      if (vm.rawParsedData && vm.rawParsedData.rows.length > 0) {
        const firstTs = vm.rawParsedData.rows[0][0];
        const detectedFormat = autoDetectTimestampFormat(firstTs);
        if (detectedFormat) {
          vm.formGroup.patchValue({ timestampFormat: detectedFormat });
        }
      }
    };

    // Auto-detect delimiter
    function autoDetectDelimiter(csvData) {
      const firstLine = csvData.split(/[\r\n]/)[0] || '';
      const counts = {
        ';': (firstLine.match(/;/g) || []).length,
        ',': (firstLine.match(/,/g) || []).length,
        '|': (firstLine.match(/\|/g) || []).length,
        '\t': (firstLine.match(/\t/g) || []).length
      };
      let maxCount = 0;
      let detected = ';';
      for (const d in counts) {
        if (counts[d] > maxCount) {
          maxCount = counts[d];
          detected = d;
        }
      }
      return detected;
    }

    // Auto-detect timestamp format
    function autoDetectTimestampFormat(timestamp) {
      if (!timestamp || typeof timestamp !== 'string') return null;
      const ts = timestamp.toString().trim();

      // Try each format
      for (const format of vm.timestampFormats) {
        const parsed = moment(ts, format, true);
        if (parsed.isValid()) {
          return format;
        }
      }
      return null;
    }

    // Process CSV and build columns
    function processCSV(csvData) {
      const delim = vm.formGroup.get('delim').value;
      const parsed = parseCSV(csvData, delim);

      if (parsed === -1 || !parsed.headers || parsed.headers.length < 2) {
        vm.previewData = null;
        vm.parseError = '{i18n:custom.csv-importer.parse-error}';
        return;
      }

      vm.parseError = '';
      vm.rawParsedData = parsed;
      buildColumns(parsed.headers);
      buildCalcColumns(parsed.headers);
      updatePreview();
      checkRequiredFields();
    }

    // Build column objects with unit selectors
    function buildColumns(headers) {
      const installationType = getInstallationType();

      vm.columns = headers.map((name, index) => {
        const isTimestamp = index === 0;
        const rejected = !isTimestamp && isRejectedKey(name);
        const normalizedName = isTimestamp ? name : normalizeKey(name);
        const config = isTimestamp ? null : getKeyConfig(name);
        const isLegacyKey = name !== normalizedName && !rejected;

        // Determine status: rejected keys get special status
        let status = 'invalid';
        if (isTimestamp) {
          status = 'valid';
        } else if (rejected) {
          status = 'rejected';
        } else if (config) {
          status = 'valid';
        }

        const col = {
          name: name,                    // Original column name from CSV
          normalizedName: normalizedName, // New key name (for export)
          isLegacyKey: isLegacyKey,      // True if using old CHC_... key
          isRejected: rejected,          // True if key is rejected due to installationType mismatch
          rejectedReason: rejected ? (installationType === 'heating' ? 'cooling-key-for-heating' : 'heating-key-for-cooling') : null,
          index: index,
          status: status,
          units: null,
          selectedUnit: 'none',
          selectedUnitShortLabel: '',
          conversionLabel: ''
        };

        // Add unit selector for recognized columns
        if (config && config.category && UNIT_CONVERSIONS[config.category]) {
          col.units = UNIT_CONVERSIONS[config.category];
          col.selectedUnit = 'none'; // Default to no conversion
          col.selectedUnitShortLabel = UNIT_CONVERSIONS[config.category][0].shortLabel;
        }

        return col;
      });
    }

    // Build calculated columns (simplified - no more consumption/meter pairs)
    function buildCalcColumns(headers) {
      vm.calcColumns = [];
      // Note: With the new ECO Data Catalog, we only import meter/sensor values
      // No automatic calculations needed - data should come pre-processed
      // This function is kept for future extensibility (e.g., dT calculation from T_flow - T_return)
    }

    // Update preview with conversions
    vm.updatePreview = function() {
      updatePreview();
      checkRequiredFields();
    };

    function updatePreview() {
      if (!vm.rawParsedData) return;

      const allRows = vm.rawParsedData.rows;
      const previewRows = allRows.slice(0, 10);
      let hasNonNumericValues = false;
      let hasInvalidTimestamps = false;

      // Check ALL rows for validation issues
      const timestampFormat = vm.formGroup.get('timestampFormat').value;
      const MIN_VALID_TIMESTAMP = 946684800000; // Jan 1, 2000
      allRows.forEach(row => {
        // Check timestamp validity - must be after year 2000
        const ts = convertTimestampToUnix(row[0], timestampFormat);
        if (ts === null || isNaN(ts) || ts < MIN_VALID_TIMESTAMP) {
          hasInvalidTimestamps = true;
        }

        // Check datapoint columns for non-numeric values
        vm.columns.forEach((col, colIndex) => {
          if (colIndex === 0) return; // Skip timestamp (already checked above)
          const val = row[colIndex];
          if (val !== null && val !== undefined && val !== '') {
            const isNumeric = typeof val === 'number';
            const isInvalidDatapoint = col.status === 'valid' && !isNumeric;
            if (isInvalidDatapoint) {
              hasNonNumericValues = true;
            }
          }
        });
      });

      // Update conversion labels and short labels
      vm.columns.forEach(col => {
        if (col.units) {
          const unit = col.units.find(u => u.key === col.selectedUnit);
          if (unit) {
            col.selectedUnitShortLabel = unit.shortLabel;
            col.conversionLabel = unit.convLabel;
          }
        }
      });

      // Build preview rows as objects (only first 10 for display)
      vm.previewRows = [];
      let prevValues = {};
      let prevTimestamp = null;

      previewRows.forEach((row, rowIndex) => {
        const rowObj = {};
        const timestampFormat = vm.formGroup.get('timestampFormat').value;
        const ts = convertTimestampToUnix(row[0], timestampFormat);

        // Process original columns
        vm.columns.forEach((col, colIndex) => {
          let val = row[colIndex];

          if (colIndex === 0) {
            // Timestamp column - validate and show interpreted format
            // Valid timestamp must be after year 2000 (946684800000 ms = Jan 1, 2000)
            const MIN_VALID_TIMESTAMP = 946684800000;
            const isValidTimestamp = ts !== null && !isNaN(ts) && ts >= MIN_VALID_TIMESTAMP;

            rowObj[col.name] = val;
            rowObj[col.name + '_invalid'] = !isValidTimestamp;

            // Only show interpreted format for valid timestamps
            if (isValidTimestamp) {
              const date = new Date(ts);
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const year = String(date.getFullYear()).slice(-2);
              const hours = String(date.getHours()).padStart(2, '0');
              const minutes = String(date.getMinutes()).padStart(2, '0');
              rowObj[col.name + '_interpreted'] = `(${day}/${month}/${year} ${hours}:${minutes})`;
            }

            if (!isValidTimestamp) {
              hasInvalidTimestamps = true;
            }
          } else if (val !== null && val !== undefined && val !== '') {
            // Check if value is numeric for datapoint columns
            const isNumeric = typeof val === 'number';
            const isInvalidDatapoint = col.status === 'valid' && !isNumeric;

            if (isInvalidDatapoint) {
              hasNonNumericValues = true;
            }

            // Apply conversion if selected and value is numeric
            if (col.selectedUnit && col.selectedUnit !== 'none' && typeof val === 'number') {
              const unit = col.units.find(u => u.key === col.selectedUnit);
              if (unit) {
                val = applyConversion(val, unit.factor);
              }
            }
            rowObj[col.name] = typeof val === 'number' ? val.toFixed(2) : val;
            rowObj[col.name + '_invalid'] = isInvalidDatapoint;
          } else {
            rowObj[col.name] = '';
            rowObj[col.name + '_invalid'] = false;
          }
        });

        // Calculate derived values
        const deltaHours = prevTimestamp && ts ? (ts - prevTimestamp) / 3600000 : null;

        vm.calcColumns.forEach(calc => {
          if (!calc.enabled) {
            rowObj[calc.name] = '-';
            return;
          }

          const sourceCol = vm.columns.find(c => c.name === calc.source);
          const sourceIdx = sourceCol ? sourceCol.index : -1;
          let sourceVal = sourceIdx >= 0 ? row[sourceIdx] : null;

          // Apply conversion to source if needed
          if (sourceCol && sourceCol.selectedUnit !== 'none' && typeof sourceVal === 'number') {
            const unit = sourceCol.units.find(u => u.key === sourceCol.selectedUnit);
            if (unit) sourceVal = applyConversion(sourceVal, unit.factor);
          }

          const prevSourceVal = prevValues[calc.source];

          if (calc.type === 'meter_to_consumption') {
            if (sourceVal !== null && prevSourceVal !== undefined && rowIndex > 0) {
              rowObj[calc.name] = (sourceVal - prevSourceVal).toFixed(2);
            } else {
              rowObj[calc.name] = '-';
            }
          } else if (calc.type === 'consumption_to_meter') {
            const prevMeter = prevValues[calc.name] || 0;
            if (sourceVal !== null) {
              const newMeter = prevMeter + sourceVal;
              rowObj[calc.name] = newMeter.toFixed(2);
              prevValues[calc.name] = newMeter;
            } else {
              rowObj[calc.name] = '-';
            }
          } else if ((calc.type === 'consumption_to_power' || calc.type === 'consumption_to_flow') && deltaHours && deltaHours > 0) {
            if (sourceVal !== null) {
              rowObj[calc.name] = (sourceVal / deltaHours).toFixed(2);
            } else {
              rowObj[calc.name] = '-';
            }
          } else {
            rowObj[calc.name] = '-';
          }

          // Store for next iteration
          if (sourceVal !== null) {
            prevValues[calc.source] = sourceVal;
          }
        });

        prevTimestamp = ts;
        vm.previewRows.push(rowObj);
      });

      // Update preview data summary
      const validCols = vm.columns.filter(c => c.status === 'valid' && c.index > 0).length;
      vm.previewData = {
        totalRows: vm.rawParsedData.rows.length,
        validColumns: validCols
      };
      vm.hasNonNumericValues = hasNonNumericValues;
      vm.hasInvalidTimestamps = hasInvalidTimestamps;
    }

    // Check required fields (using normalized keys)
    function checkRequiredFields() {
      // Get normalized key names from valid columns
      const normalizedCols = vm.columns
        .filter(c => c.status === 'valid' && c.index > 0)
        .map(c => c.normalizedName);

      // Check Volume (V_m3 - normalized from CHC_M_Volume or V_m3)
      vm.hasVolume = normalizedCols.includes('V_m3');

      // Check Energy (E_th_kWh - normalized from CHC_M_Energy_Heating, CHC_M_Energy_Cooling, or E_th_kWh)
      vm.hasEnergy = normalizedCols.includes('E_th_kWh');

      // Import is allowed if we have at least one valid datapoint
      // (relaxed from requiring both volume and energy)
      vm.canImport = normalizedCols.length > 0;
    }

    function applyConversion(value, factor) {
      if (typeof factor === 'number') {
        return value * factor;
      }
      if (factor === 'f_to_c') return (value - 32) * 5 / 9;
      if (factor === 'k_to_c') return value - 273.15;
      return value;
    }

    if (config.selectedMeasurement && config.selectedMeasurement.entityId) {
      setMeasurementTarget(config.selectedMeasurement.entityId, config.selectedMeasurement.entityName);
      if (config.selectedMeasurement.entityLabel) {
        vm.formGroup.patchValue({ measurementLabel: config.selectedMeasurement.entityLabel });
      }
    }

    // Step 1: Create device (disabled for direct measurement import)
    vm.createDevice = function() {
      if (config.importToMeasurement) {
        return;
      }
      const deviceName = vm.formGroup.get('deviceName').value;
      const deviceLabelVal = vm.formGroup.get('deviceLabel').value;
      const selectedProfile = vm.formGroup.get('deviceProfile').value;

      if (!deviceName || !selectedProfile) return;

      loadingSubject.next(true);

      const device = {
        name: deviceName,
        label: deviceLabelVal || null,
        type: selectedProfile.name,
        deviceProfileId: selectedProfile.id
      };

      deviceService.saveDevice(device).subscribe(
        function(savedDevice) {
          vm.createdDeviceId = { entityType: 'DEVICE', id: savedDevice.id.id };
          vm.createdDeviceName = savedDevice.name;
          vm.deviceCreated = true;

          const relation = {
            from: config.selectedMeasurement.entityId,
            to: vm.createdDeviceId,
            type: 'Measurement VR',
            typeGroup: 'COMMON'
          };

          entityRelationService.saveRelation(relation).subscribe(
            function() {
              loadingSubject.next(false);
            },
            function() {
              loadingSubject.next(false);
            }
          );
        },
        function(error) {
          console.log('Device creation error:', error);

          // Check if error is "Device with such name already exists"
          // Try multiple possible error structures
          let errorMessage = '';
          if (error && error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error && error.data && error.data.message) {
            errorMessage = error.data.message;
          } else if (error && error.message) {
            errorMessage = error.message;
          } else if (typeof error === 'string') {
            errorMessage = error;
          }

          const deviceExistsError = errorMessage.indexOf('Device with such name already exists') !== -1;
          const status400 = error && error.status === 400;

          console.log('Error message:', errorMessage);
          console.log('Device exists error:', deviceExistsError);
          console.log('Status 400:', status400);

          if (deviceExistsError && status400) {
            // Device already exists, find it and proceed
            console.log('Device already exists, finding it...');
            findExistingDeviceAndProceed(deviceName);
          } else {
            loadingSubject.next(false);
            console.error('Failed to create device:', error);
            widgetContext.showErrorToast('Failed to create device: ' + errorMessage, 'top', 'left', 'addDeviceError');
          }
        }
      );
    };

    // Find existing device by name and proceed to next step
    function findExistingDeviceAndProceed(deviceName) {
      console.log('Searching for device:', deviceName);

      // Search for the device by name using HTTP endpoint directly
      const url = '/api/user/devices?pageSize=100&page=0&textSearch=' + encodeURIComponent(deviceName);

      widgetContext.http.get(url).subscribe(
        function(response) {
          console.log('Device search response:', response);

          if (response && response.data && response.data.length > 0) {
            // Find exact match
            const exactMatch = response.data.find(function(d) { return d.name === deviceName; });

            if (exactMatch) {
              vm.createdDeviceId = { entityType: 'DEVICE', id: exactMatch.id.id };
              vm.createdDeviceName = exactMatch.name;
              vm.deviceCreated = true;
              vm.deviceExisted = true;

              // Create relation if it doesn't exist
              const relation = {
                from: config.selectedMeasurement.entityId,
                to: vm.createdDeviceId,
                type: 'Measurement VR',
                typeGroup: 'COMMON'
              };

              entityRelationService.saveRelation(relation).subscribe(
                function() {
                  loadingSubject.next(false);
                  console.log('Relation created, device ready');
                },
                function(relError) {
                  // Relation might already exist, that's ok
                  loadingSubject.next(false);
                  console.log('Relation already exists or failed, but continuing');
                }
              );
            } else {
              loadingSubject.next(false);
              widgetContext.showErrorToast('Device exists but could not be found', 'top', 'left', 'deviceNotFound');
            }
          } else {
            loadingSubject.next(false);
            widgetContext.showErrorToast('Device exists but could not be found', 'top', 'left', 'deviceNotFound');
          }
        },
        function(error) {
          loadingSubject.next(false);
          console.error('Failed to find existing device:', error);
          widgetContext.showErrorToast('Failed to find existing device', 'top', 'left', 'findDeviceError');
        }
      );
    }

    // Step 2: Import telemetry
    vm.importTelemetry = function() {
      if (!vm.rawParsedData || !vm.canImport) return;

      // Save measurement label if changed
      vm.saveMeasurementLabel();

      vm.importWarning = '';
      vm.importError = '';
      vm.importSuccess = '';

      const timestampFormat = vm.formGroup.get('timestampFormat').value;
      const telemetryArray = buildTelemetryArray(vm.rawParsedData, timestampFormat);

      if (telemetryArray.length === 0) {
        vm.importError = 'No valid data rows found.';
        return;
      }

      // Upload in batches of 30
      const BATCH_SIZE = 30;
      const batches = [];
      for (let i = 0; i < telemetryArray.length; i += BATCH_SIZE) {
        batches.push(telemetryArray.slice(i, i + BATCH_SIZE));
      }

      vm.uploadProgress = { current: 0, total: batches.length, percent: 0, rows: telemetryArray.length };
      loadingSubject.next(true);

      if (!vm.createdDeviceId || !vm.createdDeviceId.id) {
        vm.importError = 'Measurement is not selected.';
        return;
      }

      const url = '/api/plugins/telemetry/' + vm.createdDeviceId.entityType + '/' + vm.createdDeviceId.id + '/timeseries/ANY';

      uploadBatch(0);

      function uploadBatch(index) {
        if (index >= batches.length) {
          loadingSubject.next(false);
          vm.uploadProgress = null;
          vm.importSuccess = 'Successfully imported ' + telemetryArray.length + ' rows.';
          widgetContext.updateAliases();
          return;
        }

        vm.uploadProgress = {
          current: index + 1,
          total: batches.length,
          percent: Math.round(((index + 1) / batches.length) * 100),
          rows: telemetryArray.length
        };

        http.post(url, batches[index]).subscribe(
          function() { uploadBatch(index + 1); },
          function(error) {
            loadingSubject.next(false);
            vm.uploadProgress = null;
            console.error('Batch failed:', error);
            vm.importError = 'Failed at batch ' + (index + 1) + '. Some data may not have been imported.';
          }
        );
      }
    };

    // Build telemetry array with conversions (using normalized key names)
    function buildTelemetryArray(parsedData, timestampFormat) {
      const telemetryArray = [];
      const rows = parsedData.rows;
      let prevValues = {};
      let prevTimestamp = null;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const ts = convertTimestampToUnix(row[0], timestampFormat);

        // Note: Validation is done before import is allowed, so no need to skip rows here
        const values = {};

        // Process original columns with conversions
        // Use normalizedName for export (maps old CHC_... keys to new keys)
        vm.columns.forEach((col, colIndex) => {
          if (colIndex === 0) return; // Skip timestamp
          if (col.status !== 'valid') return; // Skip invalid columns
          let val = row[colIndex];

          if (val !== null && val !== undefined && val !== '') {
            if (col.selectedUnit && col.selectedUnit !== 'none' && typeof val === 'number') {
              const unit = col.units.find(u => u.key === col.selectedUnit);
              if (unit) val = applyConversion(val, unit.factor);
            }
            // Use normalizedName for export (e.g., CHC_S_TemperatureFlow -> T_flow_C)
            values[col.normalizedName] = val;
          }
        });

        // Store for derived calculations
        Object.keys(values).forEach(k => { prevValues[k] = values[k]; });
        prevTimestamp = ts;

        if (Object.keys(values).length > 0) {
          telemetryArray.push({ ts: ts, values: values });
        }
      }

      return telemetryArray;
    }

    // CSV parsing helpers
    function parseCSV(csvData, delim) {
      try {
        const lines = csvData.split(/[\r\n]+/).filter(line => line.trim() !== '');
        if (lines.length < 1) return -1;

        const headers = splitCSV(lines[0], delim);
        if (headers.length < 2) return -1;

        const rows = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const items = splitCSV(line, delim);
          if (items.length !== headers.length) continue;
          rows.push(items.map(convertStringToJSType));
        }

        return { headers: headers, rows: rows };
      } catch (e) {
        console.error('CSV parsing error:', e);
        return -1;
      }
    }

    function splitCSV(str, sep) {
      const parts = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (char === '"') {
          if (inQuotes && str[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === sep && !inQuotes) {
          parts.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      parts.push(current.trim());
      return parts;
    }

    function convertStringToJSType(str) {
      if (str === '' || str === null || str === undefined) return null;
      const s = str.toString().trim();
      if (/^(true|false)$/i.test(s)) return s.toLowerCase() === 'true';
      const numStr = s.replace(',', '.');
      if (!isNaN(parseFloat(numStr)) && isFinite(numStr)) return parseFloat(numStr);
      return s;
    }

    function convertTimestampToUnix(timestamp, format) {
      try {
        const parsed = moment(timestamp, format, true);
        if (parsed.isValid()) return parsed.valueOf();

        const asNumber = parseInt(timestamp, 10);
        if (!isNaN(asNumber) && asNumber > 0) {
          return asNumber > 946684800000 ? asNumber : asNumber * 1000;
        }
        return null;
      } catch (e) {
        return null;
      }
    }
  }
  } // end openDialog
}

/**
 * Data connector selection dialog
 * Shows a dialog with options to connect data to a measurement via diagnostic kit or CSV import
 *
 * Usage in Thingsboard Action Cell Button:
 *   let { dataConnectorDialog } = widgetContext.custom.utils;
 *   dataConnectorDialog(widgetContext, entityId, entityName);
 */
export function dataConnectorDialog(widgetContext, entityId, entityName) {
  const $injector = widgetContext.$scope.$injector;
  const customDialog = $injector.get(widgetContext.servicesMap.get('customDialog'));
  const assetService = $injector.get(widgetContext.servicesMap.get('assetService'));
  const customerService = $injector.get(widgetContext.servicesMap.get('customerService'));
  const attributeService = $injector.get(widgetContext.servicesMap.get('attributeService'));
  const stateController = widgetContext.stateController;

  // Get state params
  const stateParams = stateController.getStateParams();

  // Check if user is Tenant Administrator (check ThingsBoard authority, not custom userRole)
  const isTenantAdmin = widgetContext.currentUser && widgetContext.currentUser.authority === 'TENANT_ADMIN';


  // Check if entityId is provided and is an ASSET - need to determine its type
  if (entityId && entityId.entityType === 'ASSET' && entityId.id) {
    assetService.getAsset(entityId.id).subscribe(
      function(asset) {
        if (asset && asset.type === 'Measurement') {
          // entityId is a Measurement - skip directly to Connect Data
          const measurementFromParam = {
            entityId: entityId,
            entityName: asset.name || entityName || ''
          };
          proceedWithDialog(measurementFromParam, 'connectData');
        } else if (asset && asset.type === 'Project') {
          // entityId is a Project - check if it matches stateParams.selectedProject
          // If yes, start at Select Measurement step
          const selectedProjectId = stateParams.selectedProject && stateParams.selectedProject.entityId
            ? stateParams.selectedProject.entityId.id
            : null;
          if (selectedProjectId && selectedProjectId === entityId.id) {
            proceedWithDialog(null, 'selectMeasurement');
          } else {
            proceedWithDialog(null, 'normal');
          }
        } else {
          // Unknown asset type - proceed with normal flow
          proceedWithDialog(null, 'normal');
        }
      },
      function() {
        proceedWithDialog(null, 'normal');
      }
    );
    return;
  }

  // No entityId provided - check if we have selectedProject in stateParams
  if (stateParams.selectedProject && stateParams.selectedProject.entityId && !stateParams.selectedMeasurement) {
    proceedWithDialog(null, 'selectMeasurement');
    return;
  }

  // Normal flow
  const stateParamMeasurement = (stateParams.selectedMeasurement && stateParams.selectedMeasurement.entityId)
    ? stateParams.selectedMeasurement
    : null;
  proceedWithDialog(stateParamMeasurement, 'normal');

  // mode: 'connectData' = skip to Connect Data
  // mode: 'selectMeasurement' = show only Measurement selection (project is known)
  // mode: 'normal' = show all steps based on what's available
  function proceedWithDialog(selectedMeasurementOverride, mode) {
    const selectedMeasurement = selectedMeasurementOverride || null;

    const selectedCustomerEntity = stateParams.selectedCustomer
      ? { id: stateParams.selectedCustomer.entityId, name: stateParams.selectedCustomer.entityName }
      : null;
    const selectedProjectEntity = stateParams.selectedProject
      ? {
          id: stateParams.selectedProject.entityId,
          name: stateParams.selectedProject.entityName,
          label: stateParams.selectedProject.entityLabel
        }
      : null;

    // Check what we have in stateParams
    const hasCustomer = !!(stateParams.selectedCustomer && stateParams.selectedCustomer.entityId);
    const hasProject = !!(stateParams.selectedProject && stateParams.selectedProject.entityId);
    const hasMeasurement = !!selectedMeasurement;

    // Configuration
    const config = {
      isTenantAdmin: isTenantAdmin,
      selectedCustomer: stateParams.selectedCustomer || null,
      selectedProject: stateParams.selectedProject || null,
      selectedMeasurement: selectedMeasurement,
      selectedCustomerEntity: selectedCustomerEntity,
      selectedProjectEntity: selectedProjectEntity,
      customers: [],
      projects: [],
      measurements: [],
      needsCustomerSelection: !hasCustomer && isTenantAdmin,
      needsProjectSelection: !hasProject,
      needsMeasurementSelection: !hasMeasurement,
      skipToConnectData: false,
      showCustomerStep: false,
      showProjectStep: false,
      startAtMeasurement: false
    };

    // Determine which steps to show based on mode
    if (mode === 'connectData' && hasMeasurement) {
      // Measurement passed via entityId - skip directly to Connect Data
      config.skipToConnectData = true;
      config.showCustomerStep = false;
      config.showProjectStep = false;
      config.needsMeasurementSelection = false;
    } else if (mode === 'selectMeasurement' || (hasProject && !hasMeasurement)) {
      // Project is known but no measurement - show only Measurement selection
      config.showCustomerStep = false;
      config.showProjectStep = false;
      config.needsMeasurementSelection = true;
    } else {
      // Normal flow - show all steps that are needed
      config.showCustomerStep = isTenantAdmin && !hasCustomer;
      config.showProjectStep = !hasProject;
      config.needsMeasurementSelection = !hasMeasurement;
    }

    if (config.selectedCustomerEntity && !config.needsCustomerSelection) {
      config.customers = [config.selectedCustomerEntity];
    }
    if (config.selectedProjectEntity && !config.needsProjectSelection) {
      config.projects = [config.selectedProjectEntity];
    }


  // Simple CSS for the selection dialog
  const selectionCSS = `
.selection-buttons {
  display: flex;
  gap: 24px;
  margin-top: 24px;
}
.selection-button {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  min-height: 200px;
  font-size: 16px;
}
.selection-button .mat-icon {
  margin-bottom: 16px;
  font-size: 64px;
  width: 64px;
  height: 64px;
}
.w-full {
  width: 100%;
}
`;

  const cssParser = new cssjs();
  cssParser.testMode = false;
  cssParser.cssPreviewNamespace = 'device-management-selection';
  cssParser.createStyleElement('device-management-selection-styles', selectionCSS, 'nonamespace');

  // HTML for selection dialog with stepper
  const selectionTemplate = `
<form [formGroup]="formGroup" style="width: 900px; max-width: 90vw; min-height: 520px; max-height: 85vh;">
  <mat-toolbar class="eco-dialog-header">
    <mat-icon class="header-icon">link</mat-icon>
    <h2 class="header-title">{{ 'custom.data-connector.title' | translate }}</h2>
    <span class="flex-1"></span>
    <button mat-icon-button (click)="cancel()" type="button" class="close-btn">
      <mat-icon>close</mat-icon>
    </button>
  </mat-toolbar>

  <mat-progress-bar color="warn" mode="indeterminate" *ngIf="loading"></mat-progress-bar>
  <div style="height: 4px;" *ngIf="!loading"></div>

  <div mat-dialog-content class="flex flex-col p-4" style="max-height: calc(85vh - 112px); overflow: auto;">
    <!-- Vertical Stepper -->
    <mat-vertical-stepper #stepper [linear]="true" [selectedIndex]="startStepIndex">
      <ng-template matStepperIcon="edit" let-index="index">
        <span>{{index + 1}}</span>
      </ng-template>
      <ng-template matStepperIcon="done" let-index="index">
        <span>{{index + 1}}</span>
      </ng-template>

      <!-- Step 1: Select Customer (only for Tenant Admin if not pre-selected) -->
      <mat-step *ngIf="showCustomerStep" [completed]="customerSelected" [editable]="true">
        <ng-template matStepLabel>Select Customer</ng-template>

        <div style="margin-top: 16px;">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Customer</mat-label>
            <mat-select formControlName="customer" required (selectionChange)="onCustomerChange()"
                        [disabled]="!needsCustomerSelection">
              <mat-option *ngFor="let customer of customers" [value]="customer">
                {{ customer.name }}
              </mat-option>
            </mat-select>
            <mat-error *ngIf="formGroup.get('customer').hasError('required')">
              Customer is required
            </mat-error>
          </mat-form-field>

          <div style="display: flex; justify-content: flex-end; margin-top: 16px;">
            <button mat-button type="button" (click)="cancel()">Cancel</button>
            <button mat-raised-button color="primary" type="button"
                    [disabled]="!customerSelected"
                    (click)="stepper.next()">
              Next
            </button>
          </div>
        </div>
      </mat-step>

      <!-- Step 2: Select Project (if not pre-selected) -->
      <mat-step *ngIf="showProjectStep" [completed]="projectSelected" [editable]="true">
        <ng-template matStepLabel>Select Project</ng-template>

        <div style="margin-top: 16px;">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Project</mat-label>
            <mat-select formControlName="project" required (selectionChange)="onProjectChange()"
                        [disabled]="!needsProjectSelection">
              <mat-option *ngFor="let project of projects" [value]="project">
                {{ project.name }}{{ project.label ? ' | ' + project.label : '' }}
              </mat-option>
            </mat-select>
            <mat-error *ngIf="formGroup.get('project').hasError('required')">
              Project is required
            </mat-error>
          </mat-form-field>

          <div style="display: flex; justify-content: space-between; margin-top: 16px;">
            <button mat-button type="button" (click)="stepper.previous()">Back</button>
            <div>
              <button mat-button type="button" (click)="cancel()">Cancel</button>
              <button mat-raised-button color="primary" type="button"
                      [disabled]="!projectSelected"
                      (click)="stepper.next()">
                Next
              </button>
            </div>
          </div>
        </div>
      </mat-step>

      <!-- Step 3: Select Measurement (if not pre-selected) -->
      <mat-step *ngIf="needsMeasurementSelection" [completed]="measurementSelected">
        <ng-template matStepLabel>{{ 'custom.csv-importer.step-select-measurement' | translate }}</ng-template>

        <div style="margin-top: 16px;">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>{{ 'custom.csv-importer.measurement' | translate }}</mat-label>
            <mat-select formControlName="measurement" required (selectionChange)="onMeasurementChange()">
              <mat-option *ngFor="let measurement of measurements" [value]="measurement">
                {{ measurement.name }}{{ measurement.label ? ' | ' + measurement.label : '' }}
              </mat-option>
            </mat-select>
            <mat-error *ngIf="formGroup.get('measurement').hasError('required')">
              {{ 'custom.csv-importer.measurement-required' | translate }}
            </mat-error>
          </mat-form-field>

          <div style="display: flex; justify-content: space-between; margin-top: 16px;">
            <button mat-button type="button" (click)="stepper.previous()">Back</button>
            <div>
              <button mat-button type="button" (click)="cancel()">Cancel</button>
              <button mat-raised-button color="primary" type="button"
                      [disabled]="!measurementSelected"
                      (click)="stepper.next()">
                Next
              </button>
            </div>
          </div>
        </div>
      </mat-step>

      <!-- Step 4: Connect Data -->
      <mat-step [completed]="false">
        <ng-template matStepLabel>Connect Data</ng-template>

        <div style="margin-top: 16px;">
          <p style="margin-bottom: 24px; font-size: 16px; color: rgba(0,0,0,0.6);">
            Select how you want to connect data to measurement "{{ selectedMeasurementName }}":
          </p>

          <div class="selection-buttons">
            <button mat-raised-button color="primary" class="selection-button" (click)="openAssignDevice()" type="button">
              <mat-icon svgIcon="mdi:briefcase-plus"></mat-icon>
              <div style="margin-top: 8px;">Connect Diagnostic Kit</div>
            </button>

            <button mat-raised-button color="primary" class="selection-button" (click)="openImportData()" type="button">
              <mat-icon svgIcon="mdi:table-arrow-up"></mat-icon>
              <div style="margin-top: 8px;">Import CSV Data</div>
            </button>

            <button mat-raised-button color="primary" class="selection-button" (click)="openInterpolateData()" type="button">
              <mat-icon svgIcon="mdi:chart-line"></mat-icon>
              <div style="margin-top: 8px;">Interpolate Data</div>
            </button>
          </div>

          <div style="display: flex; justify-content: space-between; margin-top: 24px;">
            <button mat-button type="button" (click)="stepper.previous()" *ngIf="!skipToConnectData">Back</button>
            <span *ngIf="skipToConnectData"></span>
            <button mat-button type="button" (click)="cancel()">Cancel</button>
          </div>
        </div>
      </mat-step>

    </mat-vertical-stepper>
  </div>
</form>
`;

  function openSelectionDialog() {
    customDialog.customDialog(selectionTemplate, SelectionDialogController).subscribe();
  }

  // Load customer from project if needed (for data context only, steps already configured)
  if (!config.selectedCustomer && config.selectedProject && config.selectedProject.entityId && config.selectedProject.entityId.id) {
    config.needsCustomerSelection = false;
    const projectId = config.selectedProject.entityId.id;
    assetService.getAsset(projectId).subscribe(
      function(asset) {
        if (asset && asset.customerId && asset.customerId.id) {
          customerService.getCustomer(asset.customerId.id).subscribe(
            function(customer) {
              config.selectedCustomer = { entityId: asset.customerId, entityName: customer.name };
              config.selectedCustomerEntity = { id: asset.customerId, name: customer.name };
              config.selectedProjectEntity = asset;
              config.customers = [config.selectedCustomerEntity];
              config.projects = [asset];
              openSelectionDialog();
            },
            function() {
              openSelectionDialog();
            }
          );
        } else {
          config.selectedProjectEntity = asset;
          config.projects = [asset];
          openSelectionDialog();
        }
      },
      function() {
        openSelectionDialog();
      }
    );
  } else {
    openSelectionDialog();
  }

  function SelectionDialogController(instance) {
    const vm = instance;

    vm.loading = false;
    vm.needsCustomerSelection = config.needsCustomerSelection;
    vm.needsProjectSelection = config.needsProjectSelection;
    vm.needsMeasurementSelection = config.needsMeasurementSelection;
    vm.showCustomerStep = config.showCustomerStep;
    vm.showProjectStep = config.showProjectStep;
    vm.skipToConnectData = config.skipToConnectData;
    vm.customers = config.customers;
    vm.projects = config.projects;
    vm.measurements = config.measurements;
    vm.customerSelected = !!config.selectedCustomer;
    vm.projectSelected = !!config.selectedProject;
    vm.measurementSelected = !!config.selectedMeasurement;
    vm.selectedMeasurementName = config.selectedMeasurement ? config.selectedMeasurement.entityName : '';
    vm.startStepIndex = 0;
    // When skipToConnectData, start at index 0 (Connect Data is the only step)
    if (config.startAtMeasurement && !config.skipToConnectData) {
      vm.startStepIndex = 0;
      if (vm.showCustomerStep) {
        vm.startStepIndex += 1;
      }
      if (vm.showProjectStep) {
        vm.startStepIndex += 1;
      }
    }

    // Build form group
    const formGroupConfig = {};
    if (config.showCustomerStep) {
      formGroupConfig.customer = [
        { value: config.selectedCustomerEntity || null, disabled: !config.needsCustomerSelection },
        config.needsCustomerSelection ? vm.validators.required : []
      ];
    }
    if (config.showProjectStep) {
      formGroupConfig.project = [
        { value: config.selectedProjectEntity || null, disabled: !config.needsProjectSelection },
        config.needsProjectSelection ? vm.validators.required : []
      ];
    }
    if (config.needsMeasurementSelection) {
      formGroupConfig.measurement = [config.selectedMeasurement, vm.validators.required];
    }

    vm.formGroup = vm.fb.group(formGroupConfig);

    // Load initial data
    vm.loading = true;

    if (config.needsCustomerSelection) {
      // Load all customers for Tenant Admin
      const pageLink = widgetContext.pageLink(1000, 0, null, null, null);
      customerService.getCustomers(pageLink).subscribe(
        function(customersPage) {
          vm.customers = customersPage.data || [];
          vm.loading = false;
          widgetContext.detectChanges();
        },
        function(error) {
          console.error('Error loading customers:', error);
          vm.loading = false;
          widgetContext.detectChanges();
        }
      );
    } else if (config.selectedCustomer && (config.needsProjectSelection || config.showProjectStep)) {
      // Auto-load projects for pre-selected customer
      loadProjectsForCustomer(config.selectedCustomer.entityId);
    } else if (config.selectedProject && config.needsMeasurementSelection) {
      // Auto-load measurements for pre-selected project
      loadMeasurementsForProject(config.selectedProject.entityId);
    } else {
      vm.loading = false;
    }

    // Customer change handler
    vm.onCustomerChange = function() {
      const customer = vm.formGroup.value.customer;
      if (!customer) return;

      config.selectedCustomer = { entityId: customer.id, entityName: customer.name };
      vm.customerSelected = true;
      vm.projectSelected = false;
      vm.measurementSelected = false;
      vm.projects = [];
      vm.measurements = [];

      if (config.needsProjectSelection) {
        vm.formGroup.patchValue({ project: null, measurement: null });
        loadProjectsForCustomer(customer.id);
      }

      widgetContext.detectChanges();
    };

    // Project change handler
    vm.onProjectChange = function() {
      const project = vm.formGroup.value.project;
      if (!project) return;

      config.selectedProject = { entityId: project.id, entityName: project.name };
      vm.projectSelected = true;
      vm.measurementSelected = false;
      vm.measurements = [];

      if (config.needsMeasurementSelection) {
        vm.formGroup.patchValue({ measurement: null });
        loadMeasurementsForProject(project.id);
      }

      widgetContext.detectChanges();
    };

    // Measurement change handler
    vm.onMeasurementChange = function() {
      const measurement = vm.formGroup.value.measurement;
      if (!measurement) return;

      config.selectedMeasurement = { entityId: measurement.id, entityName: measurement.name };
      vm.measurementSelected = true;
      vm.selectedMeasurementName = measurement.name;

      widgetContext.detectChanges();
    };

    // Helper: Load projects for customer (only with progress = 'in preparation' or 'planned')
    function loadProjectsForCustomer(customerId) {
      vm.loading = true;

      const assetSearchQuery = {
        parameters: {
          rootId: customerId.id,
          rootType: 'CUSTOMER',
          direction: 'FROM',
          relationTypeGroup: 'COMMON',
          maxLevel: 10,
          fetchLastLevelOnly: false
        },
        relationType: 'Owns',
        assetTypes: ['Project']
      };

      assetService.findByQuery(assetSearchQuery, false, {ignoreLoading: true}).subscribe(
        function(assets) {
          const allProjects = assets || [];
          if (allProjects.length === 0) {
            vm.projects = [];
            vm.loading = false;
            widgetContext.detectChanges();
            return;
          }
          // Load progress attribute for each project using Promise.all
          const progressPromises = allProjects.map(function(p) {
            return new Promise(function(resolve) {
              attributeService.getEntityAttributes(p.id, 'SERVER_SCOPE', ['progress']).subscribe(
                function(attrs) { resolve({ id: p.id.id, attrs: attrs }); },
                function() { resolve({ id: p.id.id, attrs: [] }); }
              );
            });
          });
          Promise.all(progressPromises).then(function(results) {
            const progressByProject = {};
            results.forEach(function(result) {
              const progressAttr = (result.attrs || []).find(function(a) { return a.key === 'progress'; });
              if (progressAttr) {
                progressByProject[result.id] = progressAttr.value;
              }
            });
            vm.projects = allProjects.filter(function(p) {
              const progress = progressByProject[p.id.id];
              return progress === 'in preparation' || progress === 'planned';
            });
            if (config.selectedProject && config.selectedProject.entityId && config.selectedProject.entityId.id) {
              const selectedProjectId = config.selectedProject.entityId.id;
              const matchedProject = (vm.projects || []).find(function(p) { return p.id && p.id.id === selectedProjectId; });
              if (matchedProject && vm.formGroup.get('project')) {
                vm.formGroup.patchValue({ project: matchedProject });
                vm.projectSelected = true;
                config.selectedProject = { entityId: matchedProject.id, entityName: matchedProject.name };
                config.selectedProjectEntity = matchedProject;
                if (config.needsMeasurementSelection) {
                  loadMeasurementsForProject(matchedProject.id);
                }
              }
            }
            vm.loading = false;
            widgetContext.detectChanges();
          });
        },
        function() {
          vm.loading = false;
          widgetContext.detectChanges();
        }
      );
    }

    // Helper: Load measurements for project (only with progress = 'in preparation' or 'planned')
    function loadMeasurementsForProject(projectId) {
      vm.loading = true;

      const assetSearchQuery = {
        parameters: {
          rootId: projectId.id,
          rootType: 'ASSET',
          direction: 'FROM',
          relationTypeGroup: 'COMMON',
          maxLevel: 10,
          fetchLastLevelOnly: false
        },
        relationType: 'Owns',
        assetTypes: ['Measurement']
      };

      assetService.findByQuery(assetSearchQuery, false, {ignoreLoading: true}).subscribe(
        function(assets) {
          const allMeasurements = assets || [];
          if (allMeasurements.length === 0) {
            vm.measurements = [];
            vm.loading = false;
            widgetContext.detectChanges();
            return;
          }
          // Load progress attribute for each measurement using Promise.all
          const progressPromises = allMeasurements.map(function(m) {
            return new Promise(function(resolve) {
              attributeService.getEntityAttributes(m.id, 'SERVER_SCOPE', ['progress']).subscribe(
                function(attrs) { resolve({ id: m.id.id, attrs: attrs }); },
                function() { resolve({ id: m.id.id, attrs: [] }); }
              );
            });
          });
          Promise.all(progressPromises).then(function(results) {
            const progressByMeasurement = {};
            results.forEach(function(result) {
              const progressAttr = (result.attrs || []).find(function(a) { return a.key === 'progress'; });
              if (progressAttr) {
                progressByMeasurement[result.id] = progressAttr.value;
              }
            });
            vm.measurements = allMeasurements.filter(function(m) {
              const progress = progressByMeasurement[m.id.id];
              return progress === 'in preparation' || progress === 'planned';
            });
            vm.loading = false;
            widgetContext.detectChanges();
          });
        },
        function() {
          vm.loading = false;
          widgetContext.detectChanges();
        }
      );
    }

    vm.cancel = function() {
      vm.dialogRef.close(null);
    };

    function normalizeMeasurementId(measurementId) {
      if (!measurementId) return null;
      if (typeof measurementId === 'string') {
        return { id: measurementId, entityType: 'ASSET' };
      }
      if (measurementId.id && !measurementId.entityType) {
        return { id: measurementId.id, entityType: 'ASSET' };
      }
      return measurementId;
    }

    vm.openAssignDevice = function() {
      if (!config.selectedMeasurement || !config.selectedMeasurement.entityId) {
        return;
      }
      setMeasurementType('ultrasonic', function() {
        vm.dialogRef.close(null);
        // Use setTimeout to ensure the current dialog is fully closed before opening the new one
        setTimeout(function() {
          const measurementId = normalizeMeasurementId(config.selectedMeasurement.entityId);
          assignDeviceToMeasurement(widgetContext, measurementId, config.selectedMeasurement.entityName);
        }, 100);
      });
    };

    vm.openImportData = function() {
      if (!config.selectedMeasurement || !config.selectedMeasurement.entityId) {
        return;
      }
      setMeasurementType('import', function() {
        vm.dialogRef.close(null);
        // Use setTimeout to ensure the current dialog is fully closed before opening the new one
        setTimeout(function() {
          csvDataImportDialog(widgetContext, config.selectedMeasurement.entityId, config.selectedMeasurement.entityName);
        }, 100);
      });
    };

    vm.openInterpolateData = function() {
      if (!config.selectedMeasurement || !config.selectedMeasurement.entityId) {
        return;
      }
      setMeasurementType('interpolation', function() {
        vm.dialogRef.close(null);
      });
    };

    function setMeasurementType(type, onSuccess) {
      const measurementId = normalizeMeasurementId(
        config.selectedMeasurement && config.selectedMeasurement.entityId
      );
      if (!measurementId || !measurementId.id) {
        return;
      }
      attributeService.saveEntityAttributes(measurementId, 'SERVER_SCOPE', [
        { key: 'measurementType', value: type }
      ]).subscribe(
        function() {
          if (onSuccess) {
            onSuccess();
          }
        },
        function(error) {
        }
      );
    }
  } // end SelectionDialogController
  } // end proceedWithDialog
} // end dataConnectorDialog

/**
 * Assign device to measurement dialog
 * Opens a dialog to assign an existing device to a measurement asset
 *
 * Usage in Thingsboard Widget Action:
 *   let { assignDeviceToMeasurement } = widgetContext.custom.utils;
 *   assignDeviceToMeasurement(widgetContext);
 */
export function assignDeviceToMeasurement(widgetContext, entityId, entityName, onClose) {
  const $injector = widgetContext.$scope.$injector;
  const customDialog = $injector.get(widgetContext.servicesMap.get('customDialog'));
  const entityService = $injector.get(widgetContext.servicesMap.get('entityService'));
  const deviceService = $injector.get(widgetContext.servicesMap.get('deviceService'));
  const entityGroupService = $injector.get(widgetContext.servicesMap.get('entityGroupService'));
  const attributeService = $injector.get(widgetContext.servicesMap.get('attributeService'));
  const entityRelationService = $injector.get(widgetContext.servicesMap.get('entityRelationService'));
  const assetService = $injector.get(widgetContext.servicesMap.get('assetService'));
  const rxjs = widgetContext.rxjs;

  let assignedDevicesVr;
  // Try to get measurementId from parameters first, fallback to state params for backward compatibility
  function normalizeMeasurementId(measurementId) {
    if (!measurementId) return null;
    if (typeof measurementId === 'string') {
      return { id: measurementId, entityType: 'ASSET' };
    }
    if (measurementId.id && !measurementId.entityType) {
      return { id: measurementId.id, entityType: 'ASSET' };
    }
    return measurementId;
  }

  const measurementId = normalizeMeasurementId(
    entityId || widgetContext.stateController.getStateParams()?.selectedMeasurement?.entityId
  );

  if (!measurementId || !measurementId.id) {
    console.error("Invalid measurementId:", measurementId);
    return;
  }

  checkAssignedDevices(measurementId.id);

  // CSS
  const myCSS = `
.add-entity-form .mdc-text-field--filled.mdc-text-field--disabled {
  background-color: rgba(244, 249, 254, 0.5) !important;
}
.add-entity-form .mat-mdc-form-field-disabled .mat-mdc-form-field-focus-overlay {
  background-color: rgba(244, 249, 254, 0.5) !important;
}
.add-entity-form .mdc-text-field--filled:not(.mdc-text-field--disabled) {
  background-color: #F4F9FE !important;
}
.add-entity-form .mat-mdc-form-field-focus-overlay {
  background-color: #F4F9FE !important;
}
mat-icon {
  vertical-align: middle;
  margin-right: 4px;
}
.fieldset {
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #334155;
  border-radius: 6px;
  padding: 1px 10px;
}
.fieldset-legend {
  margin-bottom: 0.375rem;
  color: #334155;
  background: #ffffff;
  font-weight: 300;
  border-radius: 6px;
  padding: 2px;
}
.fieldset-container {
  padding-bottom: 10px;
}
.disabled-checkbox {
  pointer-events: none;
  opacity: 0.5;
}
.disabled-fields {
  pointer-events: none;
  opacity: 0.5;
}
.pflow-field .mat-mdc-form-field-infix {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pflow-field input.mat-mdc-input-element {
  flex: 1;
  min-width: 0;
}
.pflow-field .mat-mdc-form-field-flex {
  align-items: center;
}
.pflow-field .mat-mdc-text-field-wrapper {
  align-items: center;
}
.pflow-field .mat-mdc-form-field-suffix {
  align-self: center;
}
.pflow-field tb-icon {
  display: inline-flex;
  align-items: center;
  line-height: 1;
}
.pflow-unassign-btn {
  margin-right: -6px;
}
`;

  const cssParser = new cssjs();
  cssParser.testMode = false;
  cssParser.cssPreviewNamespace = 'assign-device-to-measurement';
  cssParser.createStyleElement('assign-device-to-measurement-styles', myCSS, 'nonamespace');

  // HTML Template
  const htmlTemplate = `
<form #addEntityForm="ngForm" [formGroup]="addDeviceFormGroup"
      (ngSubmit)="save()" class="add-entity-form mx-auto" style="width: 600px;">
  <mat-toolbar class="eco-dialog-header">
    <mat-icon class="header-icon">sensors</mat-icon>
    <h2 class="header-title">{{'custom.projects.measurements.assigned.devices.add-devices.add-device' | translate}}</h2>
    <span class="flex-1"></span>
    <button mat-icon-button (click)="cancel()" type="button" class="close-btn">
      <mat-icon>close</mat-icon>
    </button>
  </mat-toolbar>
  <mat-progress-bar color="warn" mode="indeterminate" *ngIf="isLoading$ | async"></mat-progress-bar>
  <div style="height: 4px;" *ngIf="!(isLoading$ | async)"></div>

  <div mat-dialog-content class="flex flex-col p-4" style="max-height: 65vh; overflow-y: auto;">
    <!-- Warning Messages -->
    <div *ngIf="warningMessage" class="flex items-center gap-2" style="background: #fff3e0; color: #e65100; border-radius: 8px; padding: 12px; margin-bottom: 16px; border: 1px solid rgba(230, 81, 0, 0.3);">
      <mat-icon style="flex-shrink: 0;">warning</mat-icon>
      <span style="font-size: 13px;">{{ warningMessage }}</span>
    </div>

    <div *ngIf="pFlowLimit || CO2Limit" class="flex items-center gap-2" style="background: #e3f2fd; color: #1565c0; border-radius: 8px; padding: 12px; margin-bottom: 16px; border: 1px solid rgba(21, 101, 192, 0.3);">
      <mat-icon style="flex-shrink: 0;">info</mat-icon>
      <div class="flex flex-col gap-1" style="font-size: 13px;">
        <span *ngIf="pFlowLimit">{{'custom.projects.measurements.assigned.devices.add-devices.limit-p-flows' | translate}}</span>
        <span *ngIf="CO2Limit">{{'custom.projects.measurements.assigned.devices.add-devices.limit-co2-sensors' | translate}}</span>
      </div>
    </div>

    <div formGroupName="stepper" class="flex flex-col gap-4">
      <div formGroupName="assignmentStep" class="flex flex-col gap-3">

        <!-- Section: Diagnostic Kit -->
        <div class="flex items-center gap-2 mb-1" style="color: #305680;">
          <mat-icon style="font-size: 18px; width: 18px; height: 18px;">inventory_2</mat-icon>
          <span style="font-weight: 600; font-size: 14px;">1. Select Diagnostic Kit</span>
        </div>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Diagnostic Kit</mat-label>
          <input matInput formControlName="diagnostickit"
                 [matAutocomplete]="kitAuto"
                 (input)="filterKits($event.target.value)"
                 (focus)="filterKits('')"
                 placeholder="Search kit (e.g. 0042)">
          <mat-icon matSuffix style="color: #666;">search</mat-icon>
          <mat-autocomplete #kitAuto="matAutocomplete"
                            [displayWith]="displayKit"
                            (optionSelected)="onKitSelected($event.option.value)">
            <mat-option *ngFor="let kit of filteredKits" [value]="kit">
              <div class="flex items-center gap-2">
                <mat-icon style="font-size: 18px; width: 18px; height: 18px; color: #305680;">inventory_2</mat-icon>
                <span>{{ kit.name }}</span>
              </div>
            </mat-option>
          </mat-autocomplete>
          <mat-hint *ngIf="!selectedKit">Search and select a diagnostic kit to see available devices</mat-hint>
        </mat-form-field>

        <!-- Kit Info Badge -->
        <div *ngIf="selectedKit && isUltrasonic" class="flex items-center gap-3" style="background: linear-gradient(135deg, #e8f4fd 0%, #f0f7ff 100%); border: 1px solid #305680; border-radius: 8px; padding: 12px; margin-bottom: 8px;">
          <mat-icon style="color: #305680; font-size: 24px; width: 24px; height: 24px;">inventory_2</mat-icon>
          <div class="flex flex-col">
            <span style="font-weight: 600; color: #305680;">{{ selectedKit.name }}</span>
            <span style="font-size: 12px; color: #666;">{{ kitPFlows.length }} P-Flow(s), {{ kitSensors.length }} Sensor(s) available</span>
          </div>
        </div>
        <div *ngIf="selectedKit && isLoRaWAN" class="flex items-center gap-3" style="background: linear-gradient(135deg, #f3e5f5 0%, #fce4ec 100%); border: 1px solid #7b1fa2; border-radius: 8px; padding: 12px; margin-bottom: 8px;">
          <mat-icon style="color: #7b1fa2; font-size: 24px; width: 24px; height: 24px;">inventory_2</mat-icon>
          <div class="flex flex-col">
            <span style="font-weight: 600; color: #7b1fa2;">{{ selectedKit.name }}</span>
            <span style="font-size: 12px; color: #666;">{{ kitRoomSensors.length }} Room Sensor(s) available</span>
          </div>
        </div>

        <!-- Section: P-Flow Selection (Ultrasonic only) -->
        <ng-container *ngIf="isUltrasonic">
          <div class="flex items-center gap-2 mb-1 mt-2" style="color: #305680;">
            <mat-icon style="font-size: 18px; width: 18px; height: 18px;">sensors</mat-icon>
            <span style="font-weight: 600; font-size: 14px;">2. Select P-Flow Device</span>
            <span style="font-size: 12px; color: #d32f2f;">*</span>
          </div>

          <mat-form-field appearance="outline" class="w-full pflow-field">
            <mat-label>P-Flow D116</mat-label>
            <input *ngIf="assignedPFlow" matInput [value]="assignedPFlow.name"
                   style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" disabled>
            <ng-container *ngIf="!assignedPFlow">
              <input matInput formControlName="pflowDevice"
                     [matAutocomplete]="pflowAuto"
                     (input)="filterPFlows($event.target.value)"
                     (focus)="filterPFlows('')"
                     [placeholder]="selectedKit ? 'Select P-Flow' : 'Select a Diagnostic Kit first'">
              <mat-icon matSuffix style="color: #666;">arrow_drop_down</mat-icon>
              <mat-autocomplete #pflowAuto="matAutocomplete"
                                [displayWith]="displayPFlow"
                                (optionSelected)="onPFlowSelected($event.option.value)">
                <mat-option *ngFor="let device of filteredPFlows" [value]="device">
                  <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; width:100%;">
                    <div class="flex items-center gap-2" style="min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                      <mat-icon style="font-size: 18px; width: 18px; height: 18px; color: #2196f3;">sensors</mat-icon>
                      <span>{{ device.name }}</span>
                    </div>
                    <div [ngStyle]="getActiveStyle(device)" style="font-size: 11px;">
                      {{ getActiveLabel(device) }}
                    </div>
                  </div>
                </mat-option>
              </mat-autocomplete>
            </ng-container>
            <button *ngIf="assignedPFlow" mat-icon-button matSuffix type="button" (click)="unassignPFlow()" matTooltip="Unassign P-Flow">
              <mat-icon style="color: #d32f2f;">link_off</mat-icon>
            </button>
            <mat-error *ngIf="addDeviceFormGroup.get('stepper.assignmentStep.pflowDevice').hasError('required')">
              {{'custom.projects.measurements.assigned.devices.add-devices.device-required' | translate}}
            </mat-error>
            <mat-hint *ngIf="!selectedKit && !assignedPFlow">Select a Diagnostic Kit first</mat-hint>
            <mat-hint *ngIf="selectedKit && kitPFlows.length === 0 && !assignedPFlow">No P-Flows available in this kit</mat-hint>
          </mat-form-field>

          <!-- Assigned P-Flow Info -->
          <div *ngIf="assignedPFlow" class="flex items-center gap-2" style="background: #e8f5e9; border-radius: 8px; padding: 8px 12px; margin-bottom: 8px;">
            <mat-icon style="color: #2e7d32; font-size: 18px; width: 18px; height: 18px;">check_circle</mat-icon>
            <span style="font-size: 13px; color: #2e7d32;">P-Flow assigned: {{ assignedPFlow.name }}</span>
            <div [ngStyle]="getActiveStyle(assignedPFlow)" style="font-size: 11px; margin-left: auto;">
              {{ getActiveLabel(assignedPFlow) }}
            </div>
          </div>
        </ng-container>

        <!-- Section: Room Sensor CO2 Selection (LoRaWAN only) -->
        <ng-container *ngIf="isLoRaWAN">
          <div class="flex items-center justify-between mb-1 mt-2">
            <div class="flex items-center gap-2" style="color: #7b1fa2;">
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">co2</mat-icon>
              <span style="font-weight: 600; font-size: 14px;">2. Room Sensor CO2</span>
              <span style="font-size: 12px; color: #d32f2f;">*</span>
            </div>
            <button mat-stroked-button color="primary" type="button"
                    (click)="addRoomSensor()"
                    [disabled]="!selectedKit || kitRoomSensors.length === 0 || (assignedRoomSensors.length + selectedRoomSensors.length) >= 4"
                    style="font-size: 12px;">
              <mat-icon style="font-size: 18px; width: 18px; height: 18px;">add</mat-icon>
              Add Sensor
            </button>
          </div>

          <!-- Assigned Room Sensors -->
          <div *ngFor="let sensor of assignedRoomSensors" class="flex items-center gap-2" style="background: #e8f5e9; border-radius: 8px; padding: 8px 12px; margin-bottom: 8px;">
            <mat-icon style="color: #2e7d32; font-size: 18px; width: 18px; height: 18px;">check_circle</mat-icon>
            <span style="font-size: 13px; color: #2e7d32; flex: 1;">{{ sensor.name }}</span>
            <button mat-icon-button type="button" (click)="unassignRoomSensor(sensor)" matTooltip="Unassign Sensor" style="margin: -8px;">
              <mat-icon style="color: #d32f2f; font-size: 18px; width: 18px; height: 18px;">link_off</mat-icon>
            </button>
          </div>

          <!-- New Room Sensor Selection -->
          <div *ngFor="let sensor of selectedRoomSensors; let i = index" class="flex items-start gap-2" style="background: #fafafa; border-radius: 8px; padding: 12px; margin-bottom: 8px;">
            <mat-form-field appearance="outline" class="flex-1 pflow-field" style="margin-bottom: -1.25em;">
              <mat-label>Room Sensor CO2 {{ assignedRoomSensors.length + i + 1 }}</mat-label>
              <input matInput
                     [ngModelOptions]="{standalone: true}"
                     [(ngModel)]="sensor.device"
                     [matAutocomplete]="roomSensorAuto"
                     (input)="filterRoomSensors($event.target.value)"
                     (focus)="filterRoomSensors('')"
                     placeholder="Select sensor"
                     [displayWith]="displayRoomSensor">
              <mat-icon matSuffix style="color: #666;">arrow_drop_down</mat-icon>
              <mat-autocomplete #roomSensorAuto="matAutocomplete"
                                [displayWith]="displayRoomSensor"
                                (optionSelected)="onRoomSensorChange()">
                <mat-option *ngFor="let device of filteredRoomSensors" [value]="device">
                  <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; width:100%;">
                    <div class="flex items-center gap-2">
                      <mat-icon style="font-size: 18px; width: 18px; height: 18px; color: #7b1fa2;">co2</mat-icon>
                      <span>{{ device.name }}</span>
                    </div>
                    <div [ngStyle]="getActiveStyle(device)" style="font-size: 11px;">
                      {{ getActiveLabel(device) }}
                    </div>
                  </div>
                </mat-option>
              </mat-autocomplete>
            </mat-form-field>
            <mat-form-field appearance="outline" class="flex-1" style="margin-bottom: -1.25em;">
              <mat-label>Label</mat-label>
              <input matInput [ngModelOptions]="{standalone: true}" [(ngModel)]="sensor.sensorLabel" placeholder="e.g. Room 1">
            </mat-form-field>
            <button mat-icon-button type="button" (click)="removeRoomSensor(sensor)" matTooltip="Remove sensor" style="margin-top: 4px;">
              <mat-icon style="color: #d32f2f;">delete</mat-icon>
            </button>
          </div>

          <div *ngIf="!selectedKit" class="flex items-center gap-2" style="background: #f5f5f5; border-radius: 8px; padding: 12px; color: #666;">
            <mat-icon>info</mat-icon>
            <span style="font-size: 13px;">Select a Diagnostic Kit to add Room Sensors</span>
          </div>

          <div *ngIf="selectedKit && kitRoomSensors.length === 0 && assignedRoomSensors.length === 0" class="flex items-center gap-2" style="background: #f5f5f5; border-radius: 8px; padding: 12px; color: #666;">
            <mat-icon>info</mat-icon>
            <span style="font-size: 13px;">No Room Sensor CO2 devices available in this kit</span>
          </div>
        </ng-container>

        <!-- Measurement Label -->
        <mat-form-field appearance="outline" class="w-full" style="margin-top: 8px;">
          <mat-label>{{'custom.projects.measurements.assigned.devices.add-devices.measurement-label' | translate}}</mat-label>
          <input matInput formControlName="measurementLabel" placeholder="Optional label for this measurement">
          <mat-icon matSuffix style="color: #666;">label</mat-icon>
        </mat-form-field>
      </div>

      <!-- Section: Temperature Sensors (Ultrasonic only) -->
      <div *ngIf="isUltrasonic" class="flex flex-col gap-3" style="border-top: 1px solid #e0e0e0; padding-top: 16px; margin-top: 8px;">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2" style="color: #305680;">
            <mat-icon style="font-size: 18px; width: 18px; height: 18px;">thermostat</mat-icon>
            <span style="font-weight: 600; font-size: 14px;">3. Temperature Sensors</span>
            <span style="font-size: 12px; color: #666; font-weight: 400;">(optional)</span>
          </div>
          <button mat-stroked-button color="primary" type="button"
                  (click)="addSensor()"
                  [disabled]="!selectedKit || kitSensors.length === 0"
                  style="font-size: 12px;">
            <mat-icon style="font-size: 18px; width: 18px; height: 18px;">add</mat-icon>
            Add Sensor
          </button>
        </div>

        <div *ngIf="!selectedKit" class="flex items-center gap-2" style="background: #f5f5f5; border-radius: 8px; padding: 12px; color: #666;">
          <mat-icon>info</mat-icon>
          <span style="font-size: 13px;">Select a Diagnostic Kit to add temperature sensors</span>
        </div>

        <div *ngIf="selectedKit && kitSensors.length === 0 && selectedSensors.length === 0" class="flex items-center gap-2" style="background: #f5f5f5; border-radius: 8px; padding: 12px; color: #666;">
          <mat-icon>info</mat-icon>
          <span style="font-size: 13px;">No temperature sensors available in this kit</span>
        </div>

        <div *ngIf="selectedSensors.length > 0" class="flex flex-col gap-3">
          <div class="flex items-start gap-2" *ngFor="let sensor of selectedSensors; let i = index" style="background: #fafafa; border-radius: 8px; padding: 12px;">
            <mat-form-field appearance="outline" class="flex-1 pflow-field" style="margin-bottom: -1.25em;">
              <mat-label>Temperature Sensor {{ i + 1 }}</mat-label>
              <input *ngIf="sensor.isAssigned" matInput [value]="sensor.device.name" disabled>
              <ng-container *ngIf="!sensor.isAssigned">
                <input matInput
                       [ngModelOptions]="{standalone: true}"
                       [(ngModel)]="sensor.device"
                       [matAutocomplete]="sensorAuto"
                       (input)="filterKitSensors($event.target.value, sensor)"
                       (focus)="filterKitSensors('', sensor)"
                       placeholder="Select sensor"
                       [displayWith]="displaySensor">
                <mat-icon matSuffix style="color: #666;">arrow_drop_down</mat-icon>
                <mat-autocomplete #sensorAuto="matAutocomplete"
                                  [displayWith]="displaySensor"
                                  (optionSelected)="onSensorChange()">
                  <mat-option *ngFor="let device of filteredKitSensors" [value]="device">
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; width:100%;">
                      <div class="flex items-center gap-2">
                        <mat-icon style="font-size: 18px; width: 18px; height: 18px; color: #ff9800;">thermostat</mat-icon>
                        <span>{{ device.name }}</span>
                      </div>
                      <div [ngStyle]="getActiveStyle(device)" style="font-size: 11px;">
                        {{ getActiveLabel(device) }}
                      </div>
                    </div>
                  </mat-option>
                </mat-autocomplete>
              </ng-container>
            </mat-form-field>
            <mat-form-field appearance="outline" class="flex-1" style="margin-bottom: -1.25em;">
              <mat-label>Label</mat-label>
              <input matInput [ngModelOptions]="{standalone: true}" [(ngModel)]="sensor.sensorLabel" placeholder="e.g. Supply, Return">
            </mat-form-field>
            <button mat-icon-button type="button" (click)="unassignSensor(sensor)" matTooltip="Remove sensor" style="margin-top: 4px;">
              <mat-icon style="color: #d32f2f;">delete</mat-icon>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Footer Actions -->
  <div class="flex justify-end items-center gap-2 p-4" style="border-top: 1px solid #e0e0e0; background: #fafafa;">
    <button mat-button type="button" [disabled]="(isLoading$ | async)" (click)="cancel()">
      {{'action.cancel' | translate}}
    </button>
    <button mat-raised-button color="primary" type="submit"
            [disabled]="(isLoading$ | async) || addDeviceFormGroup.invalid">
      <mat-icon style="font-size: 18px; width: 18px; height: 18px; margin-right: 4px;">save</mat-icon>
      {{'action.save' | translate}}
    </button>
  </div>
</form>
`;

  function deleteVirtualDevice(deviceVR) {
    return deviceService.deleteDevice(deviceVR.id.id);
  }

  function getRelatedVRPflows(measurementId) {
    const query = {
      "parameters": {
        "rootId": measurementId,
        "rootType": "ASSET",
        "direction": "FROM",
        "relationTypeGroup": "COMMON",
        "maxLevel": 1073741824,
        "fetchLastLevelOnly": false
      },
      "relationType": "Measurement VR",
      "deviceTypes": ["P-Flow D116 VR", "Room Sensor CO2 VR", "Gateway VR", "Temperature Sensor VR"]
    };
    return deviceService.findByQuery(query);
  }

  function getRelatedKit(deviceId) {
    const query = {
      "parameters": {
        "rootId": deviceId,
        "rootType": "DEVICE",
        "direction": "TO",
        "relationTypeGroup": "COMMON",
        "maxLevel": 1073741824,
        "fetchLastLevelOnly": false
      },
      "relationType": "Contains",
      "assetTypes": ["Diagnostickit"]
    };
    return assetService.findByQuery(query);
  }

  function getKitInfo(kitId) {
    return attributeService.getEntityAttributes(kitId, 'SERVER_SCOPE', ['subscriptionStatus', 'validTo']);
  }

  function checkAssignedDevices(measurementId) {
    const deviceSearchQuery = {
      parameters: {
        rootId: measurementId,
        rootType: "ASSET",
        direction: "FROM",
        relationTypeGroup: "COMMON",
        maxLevel: 100,
        fetchLastLevelOnly: false,
      },
      relationType: "Measurement",
      deviceTypes: ["P-Flow D116", "Room Sensor CO2", "Temperature Sensor", "RESI", "IoT Gateway"]
    };

    // Load measurementType attribute first
    // measurementId is a string ID, need to create entity object for attribute service
    const measurementEntityId = { id: measurementId, entityType: 'ASSET' };
    attributeService.getEntityAttributes(measurementEntityId, 'SERVER_SCOPE', ['measurementType']).subscribe(
      function(attrs) {
        const measurementTypeAttr = attrs.find(a => a.key === 'measurementType');
        const measurementType = measurementTypeAttr ? measurementTypeAttr.value : 'ultrasonic';

        deviceService.findByQuery(deviceSearchQuery).subscribe(
          function(devices) {
            getRelatedVRPflows(measurementId).subscribe(
              function(result) {
                assignedDevicesVr = result;
                let maxLimitPFlows = false;
                let maxLimitRoomSensorCO2 = false;
                const pFlows = devices.filter(device => device.type === "P-Flow D116");
                const roomSensorCO2 = devices.filter(device => device.type === "Room Sensor CO2");

                if (pFlows.length > 0) {
                  maxLimitPFlows = true;
                }
                // For lorawan: limit to 4 Room Sensor CO2
                const isLoRaWAN = measurementType && measurementType.toLowerCase() === 'lorawan';
                if (isLoRaWAN && roomSensorCO2.length >= 4) {
                  maxLimitRoomSensorCO2 = true;
                } else if (!isLoRaWAN && roomSensorCO2.length > 99) {
                  maxLimitRoomSensorCO2 = true;
                }

                openAddDeviceDialog(maxLimitPFlows, maxLimitRoomSensorCO2, assignedDevicesVr, measurementType);
              },
              function(error) {
                console.error("Error fetching VR devices:", error);
                openAddDeviceDialog(false, false, [], measurementType);
              }
            );
          },
          function(error) {
            console.error("Error fetching devices:", error);
            openAddDeviceDialog(false, false, [], measurementType);
          }
        );
      },
      function(error) {
        console.error("Error fetching measurementType:", error);
        // Default to ultrasonic if attribute fetch fails
        openAddDeviceDialog(false, false, [], 'ultrasonic');
      }
    );
  }

  function openAddDeviceDialog(maxLimitPFlows, maxLimitRoomSensorCO2, assignedDevicesVr, measurementType) {
    customDialog.customDialog(htmlTemplate, AddDeviceDialogController, {
      measurementId,
      measurementName: entityName,
      maxLimitPFlows,
      maxLimitRoomSensorCO2,
      assignedDevicesVr,
      measurementType: measurementType || 'ultrasonic',
      onClose: onClose
    }).subscribe((result) => {
      if (typeof onClose === 'function') {
        onClose(result);
      }
    });
  }

  function AddDeviceDialogController(instance) {
    const vm = instance;
    const {
      measurementId,
      measurementName,
      maxLimitPFlows,
      maxLimitRoomSensorCO2,
      assignedDevicesVr,
      measurementType
    } = vm.data || {};

    const loadingSubject = new rxjs.BehaviorSubject(false);
    vm.isLoading$ = loadingSubject.asObservable();

    vm.pFlowLimit = !!maxLimitPFlows;
    vm.CO2Limit = !!maxLimitRoomSensorCO2;
    vm.asignedDevicesVr = assignedDevicesVr;
    vm.warningMessage = null;

    // Determine measurement type - normalize lorawan/loraWan
    vm.measurementType = measurementType || 'ultrasonic';
    vm.isLoRaWAN = vm.measurementType.toLowerCase() === 'lorawan';
    vm.isUltrasonic = !vm.isLoRaWAN;

    // For LoRaWAN: Room Sensor CO2 devices (up to 4)
    vm.kitRoomSensors = [];
    vm.filteredRoomSensors = [];
    vm.selectedRoomSensors = []; // Array of selected Room Sensor CO2 devices
    vm.assignedRoomSensors = []; // Already assigned Room Sensor CO2
    vm.availableDevices = [];
    vm.availablePFlows = [];
    vm.availableSensors = [];
    vm.selectedSensors = [];
    vm.assignedPFlow = null;
    vm.showSensorsStep = false;
    vm.existingSensorLabelKeys = [];
    vm.sensorLabelAttributes = {};
    vm.measurementEntity = null;
    vm.getActiveLabel = function(device) {
      return device && device.active ? 'Active' : 'Inactive';
    };
    vm.getActiveStyle = function(device) {
      if (device && device.active) {
        return {
          borderRadius: '16px',
          height: '32px',
          lineHeight: '32px',
          padding: '0 12px',
          width: 'fit-content',
          backgroundColor: 'rgba(25, 128, 56, 0.08)',
          color: 'rgb(25, 128, 56)'
        };
      }
      return {
        borderRadius: '16px',
        height: '32px',
        lineHeight: '32px',
        padding: '0 12px',
        width: 'fit-content',
        backgroundColor: 'rgba(209, 39, 48, 0.08)',
        color: 'rgb(209, 39, 48)'
      };
    };

    vm.addDeviceFormGroup = vm.fb.group({
      stepper: vm.fb.group({
        assignmentStep: vm.fb.group({
          diagnostickit: [null],
          pflowDevice: [null, [vm.validators.required]],
          measurementLabel: ['']
        })
      })
    });

    // Kit, P-Flow and Sensor autocomplete state
    vm.allKits = [];
    vm.filteredKits = [];
    vm.selectedKit = null;
    vm.filteredPFlows = [];
    vm.kitPFlows = []; // P-Flows that belong to selected kit and are unassigned
    vm.kitSensors = []; // Temperature Sensors that belong to selected kit and are unassigned
    vm.filteredKitSensors = [];

    // Display functions for autocomplete
    vm.displayKit = function(kit) {
      return kit ? kit.name : '';
    };

    vm.displayPFlow = function(device) {
      return device ? device.name : '';
    };

    // Filter kits based on search text
    vm.filterKits = function(searchText) {
      if (!searchText || searchText.length === 0) {
        vm.filteredKits = vm.allKits.slice(0, 20);
      } else {
        const lowerSearch = searchText.toLowerCase();
        vm.filteredKits = vm.allKits.filter(function(kit) {
          return kit.name.toLowerCase().includes(lowerSearch);
        }).slice(0, 20);
      }
    };

    // When a kit is selected, load devices for that kit based on measurement type
    vm.onKitSelected = function(kit) {
      vm.selectedKit = kit;
      vm.addDeviceFormGroup.patchValue({ stepper: { assignmentStep: { pflowDevice: null } } }, { emitEvent: false });
      vm.kitPFlows = [];
      vm.filteredPFlows = [];
      vm.kitSensors = [];
      vm.filteredKitSensors = [];
      vm.selectedSensors = [];
      vm.kitRoomSensors = [];
      vm.filteredRoomSensors = [];
      vm.selectedRoomSensors = [];

      if (!kit || !kit.id) {
        return;
      }

      loadingSubject.next(true);

      // Build queries based on measurement type
      const queries = {};

      if (vm.isUltrasonic) {
        // For ultrasonic: load P-Flows and Temperature Sensors
        queries.pflowDevices = deviceService.findByQuery({
          parameters: {
            rootId: kit.id.id,
            rootType: 'ASSET',
            direction: 'FROM',
            relationTypeGroup: 'COMMON',
            maxLevel: 1
          },
          relationType: 'Contains',
          deviceTypes: ['P-Flow D116']
        });
        queries.sensorDevices = deviceService.findByQuery({
          parameters: {
            rootId: kit.id.id,
            rootType: 'ASSET',
            direction: 'FROM',
            relationTypeGroup: 'COMMON',
            maxLevel: 1
          },
          relationType: 'Contains',
          deviceTypes: ['Temperature Sensor']
        });
      } else if (vm.isLoRaWAN) {
        // For LoRaWAN: load Room Sensor CO2
        queries.roomSensorDevices = deviceService.findByQuery({
          parameters: {
            rootId: kit.id.id,
            rootType: 'ASSET',
            direction: 'FROM',
            relationTypeGroup: 'COMMON',
            maxLevel: 1
          },
          relationType: 'Contains',
          deviceTypes: ['Room Sensor CO2']
        });
      }

      // Load devices in parallel
      rxjs.forkJoin(queries).subscribe(
        function(result) {
          // Helper: Check if device is in "Unassigned Measurement Devices" group
          function isDeviceUnassigned(deviceId) {
            if (!vm.availableDevices || vm.availableDevices.length === 0) {
              return true; // If no filter available, show all
            }
            const deviceIdStr = deviceId.id || deviceId;
            return vm.availableDevices.some(function(d) {
              return (d.deviceId.id || d.deviceId) === deviceIdStr;
            });
          }

          // Process P-Flows (ultrasonic only) - filter to only unassigned devices
          if (result.pflowDevices && result.pflowDevices.length > 0) {
            vm.kitPFlows = result.pflowDevices
              .filter(function(device) {
                return isDeviceUnassigned(device.id);
              })
              .map(function(device) {
                return {
                  name: device.name,
                  type: device.type,
                  label: device.label || device.name,
                  deviceId: device.id
                };
              });
            vm.filteredPFlows = vm.kitPFlows.slice();
          } else {
            vm.kitPFlows = [];
            vm.filteredPFlows = [];
          }

          // Process Temperature Sensors (ultrasonic only) - filter to only unassigned devices
          if (result.sensorDevices && result.sensorDevices.length > 0) {
            vm.kitSensors = result.sensorDevices
              .filter(function(device) {
                return isDeviceUnassigned(device.id);
              })
              .map(function(device) {
                return {
                  name: device.name,
                  type: device.type,
                  label: device.label || device.name,
                  deviceId: device.id
                };
              });
            vm.filteredKitSensors = vm.kitSensors.slice();
          } else {
            vm.kitSensors = [];
            vm.filteredKitSensors = [];
          }

          // Process Room Sensor CO2 (LoRaWAN only) - filter to only unassigned devices
          if (result.roomSensorDevices && result.roomSensorDevices.length > 0) {
            vm.kitRoomSensors = result.roomSensorDevices
              .filter(function(device) {
                return isDeviceUnassigned(device.id);
              })
              .map(function(device) {
                return {
                  name: device.name,
                  type: device.type,
                  label: device.label || device.name,
                  deviceId: device.id
                };
              });
            vm.filteredRoomSensors = vm.kitRoomSensors.slice();
          } else {
            vm.kitRoomSensors = [];
            vm.filteredRoomSensors = [];
          }

          // Check kit subscription status
          getKitInfo(kit.id).subscribe(function(kitAttributes) {
            const subAttr = kitAttributes.find(attr => attr.key === 'subscriptionStatus');
            const validToAttr = kitAttributes.find(attr => attr.key === 'validTo');
            const status = subAttr ? subAttr.value.toLowerCase() : null;
            if ((status === 'canceled' || status === 'cancelled') && validToAttr) {
              const validToDate = new Date(validToAttr.value);
              const now = new Date();
              if (validToDate > now) {
                const diffDays = Math.ceil((validToDate - now) / (1000 * 3600 * 24));
                if (diffDays < 31) {
                  vm.warningMessage = `The diagnostic kit license will expire in ${diffDays} days. Please refrain from assigning devices from this kit if the measurement duration exceeds this period.`;
                }
              }
            }
            loadingSubject.next(false);
          });
        },
        function(error) {
          console.error('Error loading devices for kit:', error);
          vm.kitPFlows = [];
          vm.filteredPFlows = [];
          vm.kitSensors = [];
          vm.filteredKitSensors = [];
          loadingSubject.next(false);
        }
      );
    };

    // Filter P-Flows based on search text
    vm.filterPFlows = function(searchText) {
      if (!vm.selectedKit) {
        vm.filteredPFlows = [];
        return;
      }
      if (!searchText || searchText.length === 0) {
        vm.filteredPFlows = vm.kitPFlows.slice();
      } else {
        const lowerSearch = searchText.toLowerCase();
        vm.filteredPFlows = vm.kitPFlows.filter(function(device) {
          return device.name.toLowerCase().includes(lowerSearch);
        });
      }
    };

    // Filter Kit Sensors based on search text (excludes already selected sensors)
    vm.filterKitSensors = function(searchText, currentSensor) {
      if (!vm.selectedKit) {
        vm.filteredKitSensors = [];
        return;
      }
      // Get IDs of already selected sensors (excluding current one)
      const selectedSensorIds = vm.selectedSensors
        .filter(s => s.device && s.device.deviceId && s !== currentSensor)
        .map(s => s.device.deviceId.id);

      // Filter out already selected sensors
      let available = vm.kitSensors.filter(function(device) {
        return !selectedSensorIds.includes(device.deviceId.id);
      });

      if (searchText && searchText.length > 0) {
        const lowerSearch = searchText.toLowerCase();
        available = available.filter(function(device) {
          return device.name.toLowerCase().includes(lowerSearch);
        });
      }
      vm.filteredKitSensors = available;
    };

    // Display function for sensor autocomplete
    vm.displaySensor = function(device) {
      return device ? device.name : '';
    };

    // When a P-Flow is selected
    vm.onPFlowSelected = function(device) {
      if (device && device.deviceId) {
        vm.addDeviceFormGroup.patchValue({
          stepper: { assignmentStep: { pflowDevice: device } }
        }, { emitEvent: true });
      }
    };

    // ============ LoRaWAN Room Sensor CO2 functions ============

    // Filter Room Sensors based on search text
    vm.filterRoomSensors = function(searchText) {
      if (!vm.selectedKit) {
        vm.filteredRoomSensors = [];
        return;
      }
      // Exclude already selected and assigned sensors
      const selectedIds = vm.selectedRoomSensors
        .filter(s => s.device && s.device.deviceId)
        .map(s => s.device.deviceId.id);
      const assignedIds = vm.assignedRoomSensors.map(s => s.deviceId.id);
      const excludeIds = [...selectedIds, ...assignedIds];

      let available = vm.kitRoomSensors.filter(function(device) {
        return !excludeIds.includes(device.deviceId.id);
      });

      if (searchText && searchText.length > 0) {
        const lowerSearch = searchText.toLowerCase();
        available = available.filter(function(device) {
          return device.name.toLowerCase().includes(lowerSearch);
        });
      }
      vm.filteredRoomSensors = available;
    };

    // Add a Room Sensor CO2 slot
    vm.addRoomSensor = function() {
      if (!vm.selectedKit || vm.kitRoomSensors.length === 0) return;
      // Max 4 total (assigned + selected)
      const totalCount = vm.assignedRoomSensors.length + vm.selectedRoomSensors.length;
      if (totalCount >= 4) {
        widgetContext.showErrorToast('Maximum 4 Room Sensor CO2 devices allowed per measurement.', 'top', 'left', 'maxRoomSensors');
        return;
      }
      vm.selectedRoomSensors.push({
        device: null,
        sensorLabel: '',
        isAssigned: false
      });
      vm.filterRoomSensors('');
    };

    // When a Room Sensor is selected from dropdown
    vm.onRoomSensorChange = function() {
      vm.filterRoomSensors('');
    };

    // Display function for Room Sensor autocomplete
    vm.displayRoomSensor = function(device) {
      return device ? device.name : '';
    };

    // Remove a selected (not yet assigned) Room Sensor
    vm.removeRoomSensor = function(sensor) {
      const idx = vm.selectedRoomSensors.indexOf(sensor);
      if (idx > -1) {
        vm.selectedRoomSensors.splice(idx, 1);
        vm.filterRoomSensors('');
      }
    };

    // Unassign an already assigned Room Sensor
    vm.unassignRoomSensor = function(sensor) {
      // Mark for removal - will be processed on save
      sensor.markedForRemoval = true;
      vm.filterRoomSensors('');
    };

    // ============ End LoRaWAN functions ============

    // Load all diagnostickits filtered by measurement type
    // LoRaWAN: only kits starting with "DR"
    // Ultrasonic: only kits starting with "DB"
    vm.loadDiagnostickits = function() {
      const kitQuery = {
        entityFilter: {
          type: 'assetType',
          assetType: 'Diagnostickit'
        },
        pageLink: { pageSize: 1000, page: 0 },
        entityFields: [
          { key: 'name', type: 'ENTITY_FIELD' }
        ]
      };

      entityService.findEntityDataByQuery(kitQuery).subscribe(
        function(data) {
          // Determine kit prefix based on measurement type
          const kitPrefix = vm.isLoRaWAN ? 'DR' : 'DB';

          vm.allKits = data.data
            .map(function(entityData) {
              return {
                id: entityData.entityId,
                name: entityData.latest['ENTITY_FIELD'].name.value
              };
            })
            .filter(function(kit) {
              // Filter kits by prefix: DR for LoRaWAN, DB for Ultrasonic
              return kit.name && kit.name.toUpperCase().startsWith(kitPrefix);
            });
          vm.allKits.sort(function(a, b) {
            return a.name.localeCompare(b.name);
          });
          vm.filteredKits = vm.allKits.slice(0, 20);
        },
        function(error) {
          console.error('Error loading diagnostickits:', error);
          vm.allKits = [];
          vm.filteredKits = [];
        }
      );
    };

    // Load diagnostickits on init
    vm.loadDiagnostickits();

    // P-Flow selection handling - kit is already selected via onKitSelected
    vm.addDeviceFormGroup.get('stepper.assignmentStep.pflowDevice').valueChanges.subscribe(function(value) {
      // Kit warning is already handled in onKitSelected
      // This subscription can be used for any additional P-Flow selection logic if needed
    });

    vm.cancel = function() {
      vm.dialogRef.close(null);
    };

    vm.onPFlowChange = function() {};

    vm.openSensorsStep = function(stepper) {
      vm.showSensorsStep = true;
      if (stepper) {
        stepper.next();
      }
    };

    vm.addSensor = function() {
      if (!vm.selectedKit || vm.kitSensors.length === 0) return;
      vm.selectedSensors.push({
        device: null,
        sensorLabel: '',
        isAssigned: false
      });
      vm.filterKitSensors('', null);
    };

    vm.onSensorChange = function() {
      refreshAvailableLists();
    };

    vm.unassignPFlow = function() {
      if (!vm.assignedPFlow) return;
      confirmUnassign(vm.assignedPFlow, function() {
        unassignDevice(vm.assignedPFlow, function() {
          vm.assignedPFlow = null;
          vm.pFlowLimit = false;
          const pflowControl = vm.addDeviceFormGroup.get('stepper.assignmentStep.pflowDevice');
          if (pflowControl) {
            pflowControl.setValue(null, { emitEvent: false });
            pflowControl.markAsPristine();
            pflowControl.markAsUntouched();
          }
          syncPFlowControl();
          vm.loadCustomerGroups();
        });
      });
    };

    vm.unassignSensor = function(sensor) {
      if (!sensor) return;
      if (!sensor.device || !sensor.device.deviceId) {
        vm.selectedSensors = vm.selectedSensors.filter(s => s !== sensor);
        refreshAvailableLists();
        return;
      }

      if (sensor.isAssigned) {
        confirmUnassign(sensor.device, function() {
          unassignDevice(sensor.device, function() {
            vm.selectedSensors = vm.selectedSensors.filter(
              s => s.device.deviceId.id !== sensor.device.deviceId.id
            );
            vm.loadCustomerGroups();
          });
        });
        return;
      }

      vm.selectedSensors = vm.selectedSensors.filter(s => s !== sensor);
      refreshAvailableLists();
    };

    vm.save = function() {
      const measurementIdValue = measurementId || widgetContext.stateController.getStateParams()?.selectedMeasurement?.entityId;
      if (!measurementIdValue) {
        console.error('Missing measurementId for device assignment.');
        return;
      }

      const formValues = vm.addDeviceFormGroup.getRawValue().stepper.assignmentStep;
      const measurementLabel = formValues.measurementLabel || '';
      const assignments = [];

      if (vm.isUltrasonic) {
        // Ultrasonic: require P-Flow D116
        const selectedPFlow = vm.assignedPFlow || formValues.pflowDevice;
        const newSensors = vm.selectedSensors.filter(sensor => !sensor.isAssigned && sensor.device);

        if (!selectedPFlow) {
          widgetContext.showErrorToast('Please select a P-Flow D116 device.', 'top', 'left', 'missingPflow');
          return;
        }

        if (selectedPFlow.type !== 'P-Flow D116') {
          widgetContext.showErrorToast('Only P-Flow D116 devices can be assigned as main device.', 'top', 'left', 'invalidPflow');
          return;
        }

        if (!vm.assignedPFlow) {
          assignments.push(
            entityGroupService.removeEntityFromEntityGroup(vm.unassignedDevicesGroup.id.id, selectedPFlow.deviceId.id)
          );
          assignments.push(saveDeviceToMeasurementRelation(measurementIdValue, selectedPFlow.deviceId));
          assignments.push(saveAttributes(selectedPFlow.deviceId));
        }

        newSensors.forEach(function(sensor) {
          assignments.push(
            entityGroupService.removeEntityFromEntityGroup(vm.unassignedDevicesGroup.id.id, sensor.device.deviceId.id)
          );
          assignments.push(saveDeviceToMeasurementRelation(measurementIdValue, sensor.device.deviceId));
          assignments.push(saveAttributes(sensor.device.deviceId));
        });

        assignments.push(saveSensorLabels(measurementIdValue));

      } else if (vm.isLoRaWAN) {
        // LoRaWAN: require at least one Room Sensor CO2
        const newRoomSensors = vm.selectedRoomSensors.filter(sensor => sensor.device && sensor.device.deviceId);
        const totalRoomSensors = vm.assignedRoomSensors.length + newRoomSensors.length;

        if (totalRoomSensors === 0) {
          widgetContext.showErrorToast('Please select at least one Room Sensor CO2 device.', 'top', 'left', 'missingRoomSensor');
          return;
        }

        // Assign new Room Sensors
        newRoomSensors.forEach(function(sensor) {
          if (sensor.device.type !== 'Room Sensor CO2') {
            widgetContext.showErrorToast('Only Room Sensor CO2 devices can be assigned to LoRaWAN measurements.', 'top', 'left', 'invalidRoomSensor');
            return;
          }
          assignments.push(
            entityGroupService.removeEntityFromEntityGroup(vm.unassignedDevicesGroup.id.id, sensor.device.deviceId.id)
          );
          assignments.push(saveDeviceToMeasurementRelation(measurementIdValue, sensor.device.deviceId));
          assignments.push(saveAttributes(sensor.device.deviceId));
        });

        // Handle sensors marked for removal
        vm.assignedRoomSensors.filter(s => s.markedForRemoval).forEach(function(sensor) {
          assignments.push(unassignDeviceAsync(sensor));
        });
      }

      assignments.push(saveMeasurementLabel(measurementIdValue, measurementLabel));

      // Save assignedKit attribute on PROJECT and assignedTo attribute on Diagnostickit
      // Also create relation from Measurement to Diagnostickit
      if (vm.selectedKit) {
        const kitEntityId = vm.selectedKit.id || vm.selectedKit.entityId;
        const kitId = kitEntityId
          ? (typeof kitEntityId === 'string' ? { id: kitEntityId, entityType: 'ASSET' } : kitEntityId)
          : null;

        if (kitId) {
          // Create relation from Measurement to Diagnostickit (type: Measurement)
          const relation = {
            from: measurementIdValue,
            to: kitId,
            type: 'Measurement',
            typeGroup: 'COMMON'
          };
          assignments.push(entityRelationService.saveRelation(relation));
        }

        // Get parent Project from stateParams or via relation query, then save kit assignments
        const stateParams = widgetContext.stateController.getStateParams() || {};
        if (stateParams.selectedProject && stateParams.selectedProject.entityId) {
          // Project available in state params
          const projectId = stateParams.selectedProject.entityId;
          const projectName = stateParams.selectedProject.entityName || '';
          assignments.push(saveKitAssignmentsAsync(projectId, projectName, kitId));
        } else {
          // Query parent Project via relation (FROM Project TO Measurement, type: Measurement)
          assignments.push(
            entityRelationService.findByTo(measurementIdValue, 'Measurement').pipe(
              rxjs.switchMap(function(relations) {
                const projectRelation = relations.find(function(r) {
                  return r.from && r.from.entityType === 'ASSET';
                });
                if (projectRelation) {
                  return assetService.getAsset(projectRelation.from.id).pipe(
                    rxjs.switchMap(function(project) {
                      return saveKitAssignmentsAsync(projectRelation.from, project.name || '', kitId);
                    })
                  );
                }
                return rxjs.of(null);
              })
            )
          );
        }

        function saveKitAssignmentsAsync(projectId, projectName, kitId) {
          const projectEntityId = typeof projectId === 'string'
            ? { id: projectId, entityType: 'ASSET' }
            : projectId;

          const saveOps = [];

          // Save assignedKit on Project (kit name)
          saveOps.push(
            attributeService.saveEntityAttributes(projectEntityId, 'SERVER_SCOPE', [
              { key: 'assignedKit', value: vm.selectedKit.name }
            ])
          );

          // Save assignedTo on Diagnostickit (project name)
          if (kitId) {
            saveOps.push(
              attributeService.saveEntityAttributes(kitId, 'SERVER_SCOPE', [
                { key: 'assignedTo', value: projectName }
              ])
            );

            // Remove kit from "Unassigned Diagnostic Kits" entity group
            if (vm.customerId && vm.customerId.id) {
              saveOps.push(
                entityGroupService.getEntityGroupsByOwnerId(vm.customerId.entityType, vm.customerId.id, 'ASSET').pipe(
                  rxjs.switchMap(function(assetGroups) {
                    const unassignedKitsGroup = assetGroups.find(function(g) {
                      return g.name === 'Unassigned Diagnostic Kits';
                    });
                    if (unassignedKitsGroup && unassignedKitsGroup.id) {
                      return entityGroupService.removeEntityFromEntityGroup(unassignedKitsGroup.id.id, kitId.id);
                    }
                    return rxjs.of(null);
                  }),
                  rxjs.catchError(function(err) {
                    console.warn('Could not remove kit from Unassigned Diagnostic Kits group:', err);
                    return rxjs.of(null);
                  })
                )
              );
            }
          }

          return rxjs.forkJoin(saveOps);
        }
      }

      if (assignments.length === 0) {
        vm.dialogRef.close(null);
        return;
      }

      rxjs.forkJoin(assignments).subscribe(function() {
        widgetContext.updateAliases();
        vm.dialogRef.close(null);
      });
    };

    // Async version of unassign for use in forkJoin
    function unassignDeviceAsync(device) {
      return new rxjs.Observable(function(observer) {
        unassignDevice(device, function() {
          observer.next(true);
          observer.complete();
        });
      });
    }

    init();

    function init() {
      vm.unassignedDevicesGroup = null;
      vm.assignedDevicesGroup = null;
      vm.availableDevices = [];
      vm.assignedDevices = [];

      const stateParams = widgetContext.stateController.getStateParams() || {};

      loadAssignedDevicesByRelation();
      loadMeasurementLabel();
      loadSensorLabelAttributes();

      if (widgetContext.currentUser.authority === 'TENANT_ADMIN') {
        const selectedCustomerId = stateParams.selectedCustomer && stateParams.selectedCustomer.entityId;
        if (selectedCustomerId && selectedCustomerId.id) {
          vm.customerId = selectedCustomerId;
          vm.loadCustomerGroups();
        } else if (measurementId && measurementId.id) {
          assetService.getAsset(measurementId.id).subscribe(
            function(measurement) {
              if (measurement && measurement.customerId && measurement.customerId.id) {
                vm.customerId = measurement.customerId;
                vm.loadCustomerGroups();
              } else {
                console.error('Failed to resolve customerId for measurement:', measurementId);
              }
            },
            function(error) {
              console.error('Failed to load measurement for customer lookup:', error);
            }
          );
        } else {
          console.error('Missing selectedCustomer and measurementId for Tenant Admin.');
        }
      } else {
        // FIX: Extract customerId correctly - it can be a string or object
        const rawCustomerId = widgetContext.currentUser.customerId;
        let customerIdString;
        if (typeof rawCustomerId === 'string') {
          customerIdString = rawCustomerId;
        } else if (rawCustomerId && rawCustomerId.id) {
          customerIdString = rawCustomerId.id;
        }

        if (customerIdString) {
          vm.customerId = {
            id: customerIdString,
            entityType: 'CUSTOMER'
          };
          // Call after function is defined below
          setTimeout(() => vm.loadCustomerGroups(), 0);
        } else {
          console.error('Cannot determine customerId from currentUser:', rawCustomerId);
        }
      }

      vm.loadCustomerGroups = function() {
        if (!vm.customerId || !vm.customerId.id || !vm.customerId.entityType) {
          console.error('Invalid customerId for device groups:', vm.customerId);
          return;
        }

        loadingSubject.next(true);
        entityGroupService.getEntityGroupsByOwnerId(vm.customerId.entityType, vm.customerId.id, 'DEVICE').subscribe(function(entityGroups) {
        vm.customerDevicesGroups = entityGroups;
        vm.unassignedDevicesGroup = entityGroups.find(group => group.name === 'Unassigned Measurement Devices');
        vm.assignedDevicesGroup = entityGroups.find(group => group.name === 'Measurement Devices');
        const unassignedDiagnostickitGroup = entityGroups.find(group => group.name === 'Unassigned Diagnostickit Devices');

        if (vm.unassignedDevicesGroup) {
          const query = {
            entityFilter: {
              type: 'entityGroup',
              groupType: 'DEVICE',
              entityGroup: vm.unassignedDevicesGroup.id.id
            },
            pageLink: { pageSize: 1000, page: 0 },
            entityFields: [
              { key: 'name', type: 'ENTITY_FIELD' },
              { key: 'type', type: 'ENTITY_FIELD' },
              { key: 'label', type: 'ENTITY_FIELD' }
            ]
          };
          entityService.findEntityDataByQuery(query).subscribe(function(data) {
            vm.availableDevices = data.data.map(function(entityData) {
              const activeValue = entityData.latest &&
                entityData.latest["ATTRIBUTE"] &&
                entityData.latest["ATTRIBUTE"].active ?
                entityData.latest["ATTRIBUTE"].active.value : null;
              return {
                name: entityData.latest["ENTITY_FIELD"].name.value,
                type: entityData.latest["ENTITY_FIELD"].type.value,
                label: entityData.latest["ENTITY_FIELD"].label.value,
                active: normalizeActive(activeValue),
                deviceId: entityData.entityId
              };
            });
            finalizeDevices();
          });
        }

            function finalizeDevices() {
              if (vm.pFlowLimit === true) {
                vm.availableDevices = vm.availableDevices.filter(device => device.type !== "P-Flow D116");
              }
              if (maxLimitRoomSensorCO2 === true) {
                vm.availableDevices = vm.availableDevices.filter(device => device.type !== "Room Sensor CO2");
              }
              vm.availableDevices = vm.availableDevices.filter(device =>
                ['P-Flow D116', 'Temperature Sensor'].includes(device.type)
              );
          vm.availableDevices.sort(function(a, b) {
            const hexPattern = /^ECO_([0-9A-Fa-f]{8})/;
            const matchA = a.name.match(hexPattern);
            const matchB = b.name.match(hexPattern);
            if (matchA && matchB) {
              const numA = parseInt(matchA[1], 16);
              const numB = parseInt(matchB[1], 16);
              return numA - numB;
            } else {
              return a.name.localeCompare(b.name);
            }
          });

          const filteredDevicesObservables = vm.availableDevices.map(function(device) {
            return getRelatedKit(device.deviceId.id).pipe(
              rxjs.switchMap(function(kitData) {
                if (kitData && kitData.length > 0) {
                  const kitId = kitData[0].id;
                  return getKitInfo(kitId).pipe(
                    rxjs.map(function(kitAttributes) {
                      const subAttr = kitAttributes.find(attr => attr.key === 'subscriptionStatus');
                      const validToAttr = kitAttributes.find(attr => attr.key === 'validTo');
                      const status = subAttr ? subAttr.value.toLowerCase() : null;
                      if ((status === 'canceled' || status === 'cancelled')) {
                        if (validToAttr) {
                          const validToDate = new Date(validToAttr.value);
                          const now = new Date();
                          if (validToDate > now) { return device; }
                        }
                        return null;
                      } else if (status === 'no subscription' || status === 'inactive') {
                        return device;
                      } else {
                        return device;
                      }
                    })
                  );
                } else {
                  return rxjs.of(device);
                }
              })
            );
          });

              rxjs.forkJoin(filteredDevicesObservables).subscribe(function(results) {
                vm.availableDevices = results.filter(device => device !== null);
                filterDevicesByMeasurementType(measurementId);
                refreshAvailableLists();
                loadingSubject.next(false);
              });
            }

        if (vm.assignedDevicesGroup) {
          const query2 = {
            entityFilter: {
              type: 'entityGroup',
              groupType: 'DEVICE',
              entityGroup: vm.assignedDevicesGroup.id.id
            },
            pageLink: { pageSize: 100, page: 0 },
            entityFields: [
              { key: 'name', type: 'ENTITY_FIELD' },
              { key: 'type', type: 'ENTITY_FIELD' },
              { key: 'label', type: 'ENTITY_FIELD' }
            ]
          };
          entityService.findEntityDataByQuery(query2).subscribe(function(data) {
            vm.assignedDevices = data.data.map(function(entityData) {
              return {
                deviceId: entityData.entityId,
                name: entityData.latest["ENTITY_FIELD"].name.value,
                type: entityData.latest["ENTITY_FIELD"].type.value,
                label: entityData.latest["ENTITY_FIELD"].label.value
              };
            });
          });
        }
        });
      };
    }

    function filterDevicesByMeasurementType(measurementId) {
      attributeService.getEntityAttributes(measurementId, 'SERVER_SCOPE').subscribe(
        function(attributes) {
          const measurementTypeAttr = attributes.find(attr => attr.key === 'measurementType');
          if (!measurementTypeAttr) {
            console.warn("Measurement type attribute not found; no filtering applied.");
            return;
          }
          const measurementType = measurementTypeAttr.value;
          vm.availableDevices = vm.availableDevices.filter(device =>
            ['P-Flow D116', 'Temperature Sensor'].includes(device.type)
          );
          refreshAvailableLists();
        },
        function(error) {
          console.error("Error fetching measurement attributes:", error);
        }
      );
    }

    function refreshAvailableLists() {
      const assignedPFlowId = vm.assignedPFlow ? vm.assignedPFlow.deviceId.id : null;
      const selectedSensorIds = vm.selectedSensors
        .map(s => (s.device && s.device.deviceId ? s.device.deviceId.id : null))
        .filter(Boolean);

      vm.availablePFlows = vm.availableDevices.filter(device =>
        device.type === 'P-Flow D116' && device.deviceId.id !== assignedPFlowId
      );
      vm.availableSensors = vm.availableDevices.filter(device =>
        device.type === 'Temperature Sensor' && !selectedSensorIds.includes(device.deviceId.id)
      );
    }

    vm.getSensorOptions = function(sensor) {
      const options = vm.availableSensors.slice();
      if (sensor && sensor.device && sensor.device.deviceId) {
        const exists = options.find(o => o.deviceId.id === sensor.device.deviceId.id);
        if (!exists) {
          options.unshift(sensor.device);
        }
      }
      return options;
    };

    function syncPFlowControl() {
      const pflowControl = vm.addDeviceFormGroup.get('stepper.assignmentStep.pflowDevice');
      if (!pflowControl) return;
      if (vm.assignedPFlow) {
        pflowControl.setValue(vm.assignedPFlow, { emitEvent: false });
        pflowControl.clearValidators();
        pflowControl.disable({ emitEvent: false });
      } else {
        pflowControl.setValidators([vm.validators.required]);
        pflowControl.enable({ emitEvent: false });
      }
      pflowControl.updateValueAndValidity({ emitEvent: false });
    }

    function loadAssignedDevicesByRelation() {
      if (!measurementId || !measurementId.id) return;

      // Include Room Sensor CO2 in the query for LoRaWAN support
      const deviceTypes = vm.isLoRaWAN
        ? ['Room Sensor CO2']
        : ['P-Flow D116', 'Temperature Sensor', 'Room Sensor CO2'];

      const assignedQuery = {
        parameters: {
          rootId: measurementId.id,
          rootType: 'ASSET',
          direction: 'FROM',
          relationTypeGroup: 'COMMON',
          maxLevel: 10,
          fetchLastLevelOnly: false
        },
        relationType: 'Measurement',
        deviceTypes: deviceTypes
      };

      deviceService.findByQuery(assignedQuery).subscribe(
        function(devices) {
          if (vm.isUltrasonic) {
            // Ultrasonic: handle P-Flow and Temperature Sensors
            const pflow = (devices || []).find(d => d.type === 'P-Flow D116');
            vm.assignedPFlow = pflow ? {
              deviceId: pflow.id,
              name: pflow.name,
              type: pflow.type,
              label: pflow.label
            } : null;
            vm.pFlowLimit = !!vm.assignedPFlow;
            syncPFlowControl();
            vm.selectedSensors = (devices || [])
              .filter(d => d.type === 'Temperature Sensor')
              .map(d => ({
                device: {
                  deviceId: d.id,
                  name: d.name,
                  type: d.type,
                  label: d.label
                },
                sensorLabel: '',
                isAssigned: true
              }));
            if (vm.selectedSensors.length > 0) {
              vm.showSensorsStep = true;
            }
          } else if (vm.isLoRaWAN) {
            // LoRaWAN: handle Room Sensor CO2
            vm.assignedRoomSensors = (devices || [])
              .filter(d => d.type === 'Room Sensor CO2')
              .map(d => ({
                deviceId: d.id,
                name: d.name,
                type: d.type,
                label: d.label,
                markedForRemoval: false
              }));
            // Update CO2 limit check
            vm.CO2Limit = vm.assignedRoomSensors.length >= 4;
          }
          applySensorLabels();
          loadActiveForAssignedDevices();
          refreshAvailableLists();
        },
        function(error) {
          console.error('Failed to load assigned devices for measurement:', error);
        }
      );
    }

    function loadMeasurementLabel() {
      if (!measurementId || !measurementId.id) return;
      assetService.getAsset(measurementId.id).subscribe(
        function(measurement) {
          if (!measurement) return;
          vm.measurementEntity = measurement;
          vm.addDeviceFormGroup.patchValue({
            stepper: { assignmentStep: { measurementLabel: measurement.label || '' } }
          }, { emitEvent: false });
        },
        function(error) {
          console.error('Failed to load measurement for label:', error);
        }
      );
    }

    function loadSensorLabelAttributes() {
      if (!measurementId || !measurementId.id) return;
      attributeService.getEntityAttributes(measurementId, 'SERVER_SCOPE').subscribe(
        function(attributes) {
          const labelMap = {};
          (attributes || []).forEach(function(attr) {
            if (/^sensorLabel\d+$/.test(attr.key)) {
              labelMap[attr.key] = attr.value;
            }
          });
          vm.sensorLabelAttributes = labelMap;
          vm.existingSensorLabelKeys = Object.keys(labelMap);
          applySensorLabels();
        },
        function(error) {
          console.error('Failed to load sensor label attributes:', error);
        }
      );
    }

    function unassignDevice(device, onSuccess) {
      if (!measurementId || !measurementId.id) return;
      if (!device || !device.deviceId) return;
      const deviceIdValue = device.deviceId || (device.device && device.device.deviceId);
      if (!deviceIdValue) return;
      const fromEntity = { id: measurementId.id, entityType: 'ASSET' };
      const toEntity = deviceIdValue;

      entityRelationService.deleteRelation(fromEntity, 'Measurement', toEntity).subscribe(
        function() {
          addDeviceToUnassignedGroup(deviceIdValue, onSuccess);
        },
        function(error) {
          console.error('Failed to delete Measurement relation:', error);
        }
      );
    }

    function addDeviceToUnassignedGroup(deviceId, onSuccess) {
      if (!vm.unassignedDevicesGroup || !vm.unassignedDevicesGroup.id || !vm.unassignedDevicesGroup.id.id) {
        console.error('Missing Unassigned Measurement Devices group.');
        return;
      }
      if (entityGroupService.addEntitiesToEntityGroup) {
        entityGroupService.addEntitiesToEntityGroup(vm.unassignedDevicesGroup.id.id, [deviceId.id]).subscribe(
          function() {
            if (onSuccess) onSuccess();
          },
          function(error) {
            console.error('Failed to add device to Unassigned Measurement Devices group:', error);
          }
        );
      } else if (entityGroupService.addEntityToEntityGroup) {
        entityGroupService.addEntityToEntityGroup(vm.unassignedDevicesGroup.id.id, deviceId.id).subscribe(
          function() {
            if (onSuccess) onSuccess();
          },
          function(error) {
            console.error('Failed to add device to Unassigned Measurement Devices group:', error);
          }
        );
      } else {
        console.error('Entity group service missing addEntity method.');
      }
    }

    function confirmUnassign(device, onConfirm) {
      const deviceName = device && device.name ? device.name : (device && device.device && device.device.name ? device.device.name : 'this device');
      const title = 'Are you sure you want to remove the device ' + deviceName + '?';
      const content = 'After the confirmation, the device will be unassigned from the current Measurement!';
      widgetContext.dialogs.confirm(title, content, 'Cancel', 'Remove from Measurement').subscribe(
        function(result) {
          if (result && onConfirm) {
            onConfirm();
          }
        }
      );
    }

    function normalizeActive(value) {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'number') return value !== 0;
      if (typeof value === 'string') {
        const v = value.toLowerCase();
        return v === 'true' || v === '1' || v === 'active';
      }
      return false;
    }

    function applySensorLabels() {
      if (!vm.selectedSensors.length) return;
      vm.selectedSensors.forEach(function(sensor, index) {
        const key = `sensorLabel${index + 1}`;
        if (Object.prototype.hasOwnProperty.call(vm.sensorLabelAttributes, key)) {
          sensor.sensorLabel = vm.sensorLabelAttributes[key] || '';
        }
      });
    }

    function loadActiveForAssignedDevices() {
      const targetDevices = [];
      if (vm.assignedPFlow && vm.assignedPFlow.deviceId) {
        targetDevices.push(vm.assignedPFlow);
      }
      vm.selectedSensors.forEach(function(sensor) {
        if (sensor.device && sensor.device.deviceId) {
          targetDevices.push(sensor.device);
        }
      });
      if (!targetDevices.length) return;

      const requests = targetDevices.map(function(device) {
        return attributeService.getEntityAttributes(device.deviceId, 'SERVER_SCOPE', ['active']).pipe(
          rxjs.map(function(attrs) {
            const attr = attrs && attrs.find(a => a.key === 'active');
            device.active = normalizeActive(attr ? attr.value : null);
            return device;
          })
        );
      });

      rxjs.forkJoin(requests).subscribe(
        function() {
          refreshAvailableLists();
        },
        function(error) {
          console.error('Failed to load active attributes:', error);
        }
      );
    }

    function saveMeasurementLabel(measurementIdValue, newLabel) {
      if (!measurementIdValue || !measurementIdValue.id) {
        return widgetContext.rxjs.of(null);
      }
      return assetService.getAsset(measurementIdValue.id).pipe(
        widgetContext.rxjs.switchMap(function(measurement) {
          if (!measurement) return widgetContext.rxjs.of(null);
          if ((measurement.label || '') === newLabel) return widgetContext.rxjs.of(null);
          measurement.label = newLabel;
          return assetService.saveAsset(measurement);
        })
      );
    }

    function saveSensorLabels(measurementIdValue) {
      if (!measurementIdValue || !measurementIdValue.id) {
        return widgetContext.rxjs.of(null);
      }
      const attrs = [];
      const count = vm.selectedSensors.length;
      const existingKeys = vm.existingSensorLabelKeys || [];
      const maxIndex = Math.max(count, existingKeys.length);

      for (let i = 0; i < maxIndex; i++) {
        const labelValue = (i < count && vm.selectedSensors[i].sensorLabel) ? vm.selectedSensors[i].sensorLabel : '';
        attrs.push({ key: `sensorLabel${i + 1}`, value: labelValue });
      }

      if (!attrs.length) return widgetContext.rxjs.of(null);
      return attributeService.saveEntityAttributes(measurementIdValue, 'SERVER_SCOPE', attrs);
    }

    function saveAttributes(deviceId) {
      // Use measurementName from parameters if available, fallback to state params for backward compatibility
      const measurementNameForAttr = measurementName || widgetContext.stateController.getStateParams()?.selectedMeasurement?.entityName;
      const attributesArray = [
        { key: "xPos", value: "0" },
        { key: "yPos", value: "0" },
        { key: "project", value: widgetContext.stateController.getStateParams()?.selectedProject?.entityName },
        { key: "assignedTo", value: measurementNameForAttr }
      ];
      return attributeService.saveEntityAttributes(deviceId, 'SERVER_SCOPE', attributesArray);
    }

    function saveDeviceToMeasurementRelation(measurementId, deviceId) {
      const relation = { from: measurementId, to: deviceId, typeGroup: 'COMMON', type: 'Measurement' };
      return entityRelationService.saveRelation(relation);
    }
  }
}
