/**
 * ECO Project Wizard
 * ThingsBoard JavaScript Module
 * Version: 2026-01-22-v2
 *
 * Usage:
 *   projectWizard.openProjectWizardDialog(widgetContext, entityId, entityName, entityLabel, callback);
 */

// ============================================================================
// STYLING FUNCTIONS (inline, da keine imports möglich)
// ============================================================================

function getProgressColor(progress) {
  let color, bgColor, label;
  switch (progress) {
    case "in preparation":
      color = "#F2994A";
      bgColor = "rgba(242, 153, 74, 0.12)";
      label = "In Preparation";
      break;
    case "planned":
      color = "#F2994A";
      bgColor = "rgba(242, 153, 74, 0.12)";
      label = "Planned";
      break;
    case "active":
      color = "#27AE60";
      bgColor = "rgba(39, 174, 96, 0.12)";
      label = "Active";
      break;
    case "finished":
      color = "#2F80ED";
      bgColor = "rgba(47, 128, 237, 0.12)";
      label = "Finished";
      break;
    case "aborted":
      color = "#EB5757";
      bgColor = "rgba(235, 87, 87, 0.12)";
      label = "Aborted";
      break;
    default:
      color = "#828282";
      bgColor = "rgba(130, 130, 130, 0.12)";
      label = "N/A";
      break;
  }
  return { color, bgColor, label };
}

function getMeasurementTypeStyle(measurementType) {
  let icon, color, bgColor, label;
  switch (measurementType) {
    case "ultrasonic":
      icon = "sensors";
      color = "#2F80ED";
      bgColor = "rgba(47, 128, 237, 0.12)";
      label = "Ultrasonic";
      break;
    case "import":
      icon = "upload_file";
      color = "#9B51E0";
      bgColor = "rgba(155, 81, 224, 0.12)";
      label = "Import";
      break;
    case "interpolation":
      icon = "auto_graph";
      color = "#27AE60";
      bgColor = "rgba(39, 174, 96, 0.12)";
      label = "Interpolation";
      break;
    case "lorawan":
    case "loraWan": // backwards compatibility
      icon = "cell_tower";
      color = "#F2994A";
      bgColor = "rgba(242, 153, 74, 0.12)";
      label = "LoRaWAN";
      break;
    default:
      icon = "help_outline";
      color = "#828282";
      bgColor = "rgba(130, 130, 130, 0.12)";
      label = "Unknown";
      break;
  }
  return { icon, color, bgColor, label };
}

function getInstallationTypeStyle(installationType) {
  let icon, color, bgColor, label;
  switch (installationType) {
    case "cooling":
      icon = "ac_unit";
      color = "#2F80ED";
      bgColor = "rgba(47, 128, 237, 0.12)";
      label = "Cooling";
      break;
    case "heating":
      icon = "local_fire_department";
      color = "#EB5757";
      bgColor = "rgba(235, 87, 87, 0.12)";
      label = "Heating";
      break;
    default:
      icon = "thermostat";
      color = "#828282";
      bgColor = "rgba(130, 130, 130, 0.12)";
      label = "Unknown";
      break;
  }
  return { icon, color, bgColor, label };
}

function getDeviceStatusStyle(hasDevice, deviceName) {
  let icon, color, bgColor, label;
  if (hasDevice) {
    icon = "check_circle";
    color = "#27AE60";
    bgColor = "rgba(39, 174, 96, 0.12)";
    label = deviceName || "Assigned";
  } else {
    icon = "error_outline";
    color = "#EB5757";
    bgColor = "rgba(235, 87, 87, 0.12)";
    label = "No Device";
  }
  return { icon, color, bgColor, label };
}

function getTimestampStyle(timestampMs, type) {
  if (timestampMs === null || timestampMs === undefined || timestampMs === '' || timestampMs === 0) {
    return null;
  }
  var numValue = Number(timestampMs);
  if (!Number.isFinite(numValue) || numValue <= 0) {
    return null;
  }
  var date = new Date(numValue);
  function pad(n) { return n.toString().padStart(2, "0"); }
  var formattedTime =
    date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()) +
    " " + pad(date.getHours()) + ":" + pad(date.getMinutes()) + ":" + pad(date.getSeconds());

  var icon, color, bgColor, label;
  if (type === "start") {
    icon = "play_circle";
    color = "#27AE60";
    bgColor = "rgba(39, 174, 96, 0.12)";
    label = "Start";
  } else {
    icon = "stop_circle";
    color = "#2F80ED";
    bgColor = "rgba(47, 128, 237, 0.12)";
    label = "End";
  }
  return { icon, color, bgColor, label, formattedTime: formattedTime };
}

function getActivityColor(active) {
  let color, bgColor, label, icon;
  if (active === true) {
    color = "#27AE60";
    bgColor = "rgba(39, 174, 96, 0.12)";
    label = "Yes";
    icon = "check_circle";
  } else if (active === false) {
    color = "#EB5757";
    bgColor = "rgba(235, 87, 87, 0.12)";
    label = "No";
    icon = "cancel";
  } else {
    color = "#828282";
    bgColor = "rgba(130, 130, 130, 0.12)";
    label = "N/A";
    icon = "help_outline";
  }
  return { color, bgColor, label, icon };
}

// ============================================================================
// HTML TEMPLATES
// ============================================================================

const startProjectHtmlTemplate = `<style>
/* ECO Design System - Embedded Styles for Project Wizard */
.start-project-form .eco-dialog-header,
mat-toolbar.eco-dialog-header {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  padding: 0 16px !important;
  height: 52px !important;
  min-height: 52px !important;
  background-color: #305680 !important;
  background: #305680 !important;
  color: white !important;
}
.start-project-form .eco-dialog-header .header-icon,
mat-toolbar.eco-dialog-header .header-icon {
  font-size: 22px !important;
  width: 22px !important;
  height: 22px !important;
  color: white !important;
}
.start-project-form .eco-dialog-header .header-title,
mat-toolbar.eco-dialog-header .header-title {
  margin: 0 !important;
  font-size: 17px !important;
  font-weight: 500 !important;
  color: white !important;
}
.start-project-form .eco-dialog-header .close-btn,
mat-toolbar.eco-dialog-header .close-btn {
  color: rgba(255,255,255,0.8) !important;
  margin-left: auto !important;
}
.start-project-form .eco-dialog-header .close-btn:hover,
mat-toolbar.eco-dialog-header .close-btn:hover {
  color: white !important;
  background: rgba(255,255,255,0.1) !important;
}
.start-project-form .eco-dialog-header mat-icon,
mat-toolbar.eco-dialog-header mat-icon {
  color: white !important;
}
.start-project-form .dialog-content,
.dialog-content {
  padding: 16px 20px !important;
  background: #f8fafc !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 12px !important;
  max-height: 70vh !important;
  overflow-y: auto !important;
}
.start-project-form .dialog-footer,
.dialog-footer {
  display: flex !important;
  justify-content: flex-end !important;
  align-items: center !important;
  gap: 12px !important;
  padding: 12px 20px !important;
  border-top: 1px solid #e2e8f0 !important;
  background: #fafafa !important;
}
</style>
<form [formGroup]="startProjectFormGroup" (ngSubmit)="save()" class="start-project-form" style="width: 500px;">
  <mat-toolbar class="eco-dialog-header">
    <mat-icon class="header-icon">rocket_launch</mat-icon>
    <h2 class="header-title">{{ 'custom.project-wizard.dialog-title' | translate }}</h2>
    <span class="flex-1"></span>
    <button mat-icon-button (click)="cancel()" type="button" class="close-btn">
      <mat-icon>close</mat-icon>
    </button>
  </mat-toolbar>

  <mat-progress-bar color="warn" mode="indeterminate" *ngIf="isLoading"></mat-progress-bar>
  <div style="height: 4px;" *ngIf="!isLoading"></div>

  <div class="dialog-content">
    <!-- Project Info Container -->
    <div class="project-info-card" style="border: 2px solid #305680; border-radius: 8px; padding: 16px; margin-bottom: 16px; background: linear-gradient(135deg, #f8fafc 0%, #e8f4fd 100%);">
      <div class="flex items-center gap-2">
        <mat-icon style="color: #305680;">folder</mat-icon>
        <span style="font-weight: 700; font-size: 18px; color: #305680;">{{ projectName }}</span>
        <span class="flex-1"></span>
        <div class="flex items-center gap-1" [style.color]="getProgressColor(projectProgress || 'in preparation').color" [style.background-color]="getProgressColor(projectProgress || 'in preparation').bgColor" style="padding: 4px 10px; border-radius: 8px; font-size: 13px; font-weight: 500;">
          {{ getProgressColor(projectProgress || 'in preparation').label }}
        </div>
      </div>
      <div *ngIf="projectLabel" style="font-size: 14px; color: #546e7a; margin-top: 4px; margin-left: 32px;">{{ projectLabel }}</div>
      <div *ngIf="projectAddress" class="flex items-center gap-1" style="font-size: 13px; color: #666; margin-top: 8px; margin-left: 32px;">
        <mat-icon style="font-size: 16px; width: 16px; height: 16px; color: #888;">location_on</mat-icon>
        <span>{{ projectAddress }}</span>
      </div>
      <div *ngIf="projectStartTimeMs || projectEndTimeMs" class="flex items-center gap-2" style="margin-top: 12px; margin-left: 32px;">
        <div *ngIf="projectStartTimeMs" class="flex items-center gap-1" style="padding: 4px 10px; border-radius: 8px; color: #27AE60; background-color: rgba(39, 174, 96, 0.12); font-size: 12px; white-space: nowrap;">
          <mat-icon style="font-size: 14px; width: 14px; height: 14px;">play_circle</mat-icon>
          <span>Start: {{ formatTimestamp(projectStartTimeMs) }}</span>
        </div>
        <div *ngIf="projectEndTimeMs" class="flex items-center gap-1" style="padding: 4px 10px; border-radius: 8px; color: #2F80ED; background-color: rgba(47, 128, 237, 0.12); font-size: 12px; white-space: nowrap;">
          <mat-icon style="font-size: 14px; width: 14px; height: 14px;">stop_circle</mat-icon>
          <span>End: {{ formatTimestamp(projectEndTimeMs) }}</span>
        </div>
      </div>
    </div>

    <!-- Measurements Section Header -->
    <div class="flex items-center gap-2 mb-3" style="color: #666;">
      <mat-icon style="font-size: 18px; width: 18px; height: 18px;">assessment</mat-icon>
      <span style="font-weight: 600; font-size: 14px;">Measurements ({{ measurements.length }})</span>
    </div>

    <div *ngIf="validationError" class="flex items-center gap-3" style="background-color: #ffebee; color: #c62828; border-radius: 8px; border: 1px solid rgba(198, 40, 40, 0.3); padding: 12px 16px; margin-bottom: 16px;" role="alert">
      <mat-icon style="flex-shrink: 0; font-size: 20px; width: 20px; height: 20px;">warning</mat-icon>
      <span style="font-size: 13px; line-height: 1.4;">{{ validationError }}</span>
    </div>

    <div *ngIf="measurements.length === 0 && !isLoading" class="flex items-center gap-3" style="background-color: #fff3e0; color: #e65100; border-radius: 8px; border: 1px solid rgba(230, 81, 0, 0.3); padding: 12px 16px; margin-bottom: 16px;" role="alert">
      <mat-icon style="flex-shrink: 0; font-size: 20px; width: 20px; height: 20px;">warning</mat-icon>
      <span style="font-size: 13px; line-height: 1.4;">{{ 'custom.project-wizard.no-measurements' | translate }}</span>
    </div>

    <div *ngFor="let m of measurements" class="measurement-card" style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px; margin-bottom: 12px; background: #fafafa;">
      <div class="flex items-start gap-2 mb-2">
        <div class="flex flex-col gap-1">
          <span style="font-weight: 600; font-size: 15px; color: #333; display: block;">{{ m.name }}</span>
          <span *ngIf="m.label" style="font-size: 13px; color: #666; display: block; margin-top: 2px;">{{ m.label }}</span>
          <div *ngIf="m.kitGroups && m.kitGroups.length" class="flex flex-col gap-2" style="margin-top: 8px;">
            <ng-container *ngFor="let kit of m.kitGroups">
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <button type="button" style="background: #f0f0f0; border: 1px solid #ddd; border-radius: 4px; padding: 4px 8px; display: inline-flex; align-items: center; gap: 4px; cursor: pointer; color: #333; font-size: 12px; font-weight: 500;" (click)="toggleKit(m.id.id, kit.key)">
                  <mat-icon style="font-size: 18px; width: 18px; height: 18px;">{{ isKitExpanded(m.id.id, kit.key) ? 'expand_more' : 'chevron_right' }}</mat-icon>
                  <span>{{ kit.name }}</span>
                </button>
                <div *ngIf="isKitExpanded(m.id.id, kit.key)" class="kit-devices">
                  <ng-container *ngFor="let device of kit.devices">
                    <div class="flex flex-col" style="padding: 4px 8px; border-radius: 4px; background: #f5f5f5; margin-bottom: 4px;">
                      <div class="flex items-center gap-1">
                        <mat-icon style="font-size: 14px; width: 14px; height: 14px;">
                          {{ getDeviceStatusStyle(true, device.name).icon }}
                        </mat-icon>
                        <div class="flex flex-col">
                          <span style="font-weight: 500; font-size: 12px;">{{ device.name }}</span>
                          <span style="color: #666; font-size: 10px;">{{ device.type }}</span>
                        </div>
                      </div>
                      <div class="flex items-center gap-2" style="margin-left: 18px; margin-top: 4px;">
                        <div class="flex items-center gap-1"
                             [style.background]="getActivityColor(device.active).bgColor"
                             [style.color]="getActivityColor(device.active).color"
                             style="padding: 2px 6px; border-radius: 4px; font-size: 11px;">
                          <mat-icon style="font-size: 12px; width: 12px; height: 12px;">{{ getActivityColor(device.active).icon }}</mat-icon>
                          <span>Active: {{ getActivityColor(device.active).label }}</span>
                        </div>
                        <div *ngIf="device.lastActivityTime"
                             class="flex items-center gap-1"
                             [style.background]="getActivityColor(device.active).bgColor"
                             [style.color]="getActivityColor(device.active).color"
                             style="padding: 2px 6px; border-radius: 4px; font-size: 11px;">
                          <mat-icon style="font-size: 12px; width: 12px; height: 12px;">schedule</mat-icon>
                          <span>Last: {{ formatTimestamp(device.lastActivityTime) }}</span>
                        </div>
                      </div>
                    </div>
                  </ng-container>
                </div>
              </div>
            </ng-container>
          </div>
        </div>
        <span class="flex-1"></span>
        <div class="flex items-center gap-1">
          <button type="button" mat-icon-button class="measurement-action-btn" (click)="openLiveData(m)" title="Live Data">
            <mat-icon>sensors</mat-icon>
          </button>
          <button type="button" mat-icon-button class="measurement-action-btn" (click)="openDashboard(m)" title="Dashboard">
            <mat-icon>dashboard</mat-icon>
          </button>
          <button type="button" mat-icon-button class="measurement-action-btn" (click)="openParams(m)" title="Parameters">
            <mat-icon>settings</mat-icon>
          </button>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2" style="font-size: 12px;">
        <div *ngIf="m.measurementType" class="flex items-center gap-1" [style.color]="getMeasurementTypeStyle(m.measurementType).color" [style.background-color]="getMeasurementTypeStyle(m.measurementType).bgColor" style="padding: 4px 8px; border-radius: 8px;">
          <mat-icon style="font-size: 14px; width: 14px; height: 14px;">{{ getMeasurementTypeStyle(m.measurementType).icon }}</mat-icon>
          {{ getMeasurementTypeStyle(m.measurementType).label }}
        </div>
        <div *ngIf="m.installationType" class="flex items-center gap-1" [style.color]="getInstallationTypeStyle(m.installationType).color" [style.background-color]="getInstallationTypeStyle(m.installationType).bgColor" style="padding: 4px 8px; border-radius: 8px;">
          <mat-icon style="font-size: 14px; width: 14px; height: 14px;">{{ getInstallationTypeStyle(m.installationType).icon }}</mat-icon>
          {{ getInstallationTypeStyle(m.installationType).label }}
        </div>
        <div class="flex items-center gap-1" [style.color]="getProgressColor(m.progress || 'in preparation').color" [style.background-color]="getProgressColor(m.progress || 'in preparation').bgColor" style="padding: 4px 8px; border-radius: 8px;">
          {{ getProgressColor(m.progress || 'in preparation').label }}
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 mt-2" style="font-size: 11px;">
        <div *ngIf="m.startTimeMs" class="flex items-center gap-1" style="padding: 4px 8px; border-radius: 8px; color: #27AE60; background-color: rgba(39, 174, 96, 0.12);">
          <mat-icon style="font-size: 14px; width: 14px; height: 14px;">play_circle</mat-icon>
          Start: {{ formatTimestamp(m.startTimeMs) }}
        </div>
        <div *ngIf="m.endTimeMs" class="flex items-center gap-1" style="padding: 4px 8px; border-radius: 8px; color: #2F80ED; background-color: rgba(47, 128, 237, 0.12);">
          <mat-icon style="font-size: 14px; width: 14px; height: 14px;">stop_circle</mat-icon>
          End: {{ formatTimestamp(m.endTimeMs) }}
        </div>
      </div>

      <!-- Ultrasonic: P-Flow required -->
      <div *ngIf="m.measurementType === 'ultrasonic' && m.devices.length === 0 && (m.progress === 'in preparation' || m.progress === 'planned')" class="flex items-center justify-between mt-2">
        <span class="flex items-center gap-1" style="color: #c62828; font-size: 12px;">
          <mat-icon style="font-size: 14px; width: 14px; height: 14px;">error</mat-icon>
          {{ 'custom.project-wizard.pflow-required' | translate }}
        </span>
        <button mat-raised-button color="primary" type="button" (click)="connectMeasurement(m)" style="font-size: 12px;">
          <mat-icon style="font-size: 16px; width: 16px; height: 16px;">link</mat-icon>
          {{ 'custom.project-wizard.connect' | translate }}
        </button>
      </div>
      <!-- LoRaWAN: Room Sensor CO2 required -->
      <div *ngIf="(m.measurementType === 'lorawan' || m.measurementType === 'loraWan') && m.devices.length === 0 && (m.progress === 'in preparation' || m.progress === 'planned')" class="flex items-center justify-between mt-2">
        <span class="flex items-center gap-1" style="color: #7b1fa2; font-size: 12px;">
          <mat-icon style="font-size: 14px; width: 14px; height: 14px;">co2</mat-icon>
          {{ 'custom.project-wizard.room-sensor-required' | translate }}
        </span>
        <button mat-raised-button color="primary" type="button" (click)="connectMeasurement(m)" style="font-size: 12px;">
          <mat-icon style="font-size: 16px; width: 16px; height: 16px;">link</mat-icon>
          {{ 'custom.project-wizard.connect' | translate }}
        </button>
      </div>
      <!-- Import: Data import option -->
      <div *ngIf="m.measurementType === 'import' && (m.progress === 'in preparation' || m.progress === 'planned' || m.progress === 'active')" class="flex items-center justify-between mt-2">
        <!-- Show hint only when no data imported yet -->
        <span *ngIf="!m.hasImportedData" class="flex items-center gap-1" style="color: #9c27b0; font-size: 12px;">
          <mat-icon style="font-size: 14px; width: 14px; height: 14px;">upload_file</mat-icon>
          {{ 'custom.project-wizard.import-data-hint' | translate }}
        </span>
        <!-- Show data imported indicator when data exists -->
        <span *ngIf="m.hasImportedData" class="flex items-center gap-1" style="color: #4caf50; font-size: 12px;">
          <mat-icon style="font-size: 14px; width: 14px; height: 14px;">check_circle</mat-icon>
          {{ 'custom.project-wizard.data-imported' | translate }}
        </span>
        <button mat-raised-button color="primary" type="button" (click)="openImportDialog(m)" style="font-size: 12px;">
          <mat-icon style="font-size: 16px; width: 16px; height: 16px;">upload_file</mat-icon>
          {{ 'custom.project-wizard.import' | translate }}
        </button>
      </div>
    </div>
  </div>

  <div class="dialog-footer">
    <button mat-button type="button" (click)="cancel()">{{ 'custom.project-wizard.cancel' | translate }}</button>
    <button *ngIf="projectProgress === 'in preparation'" mat-raised-button color="primary" type="submit" [disabled]="!canStart || isLoading">
      <mat-icon style="font-size: 18px; margin-right: 4px;">play_arrow</mat-icon> {{ 'custom.project-wizard.start-project' | translate }}
    </button>
    <button *ngIf="projectProgress === 'active'" mat-raised-button color="warn" type="button" (click)="finishProject()" [disabled]="isLoading">
      <mat-icon style="font-size: 18px; margin-right: 4px;">stop</mat-icon> {{ 'custom.project-wizard.finish-project' | translate }}
    </button>
  </div>
</form>`;

const finishHtmlTemplate = `<form [formGroup]="finishProjectFormGroup" (ngSubmit)="saveFinish()" style="width: 450px;">
  <mat-toolbar class="eco-dialog-header">
    <mat-icon class="header-icon">stop_circle</mat-icon>
    <h2 class="header-title">{{ 'custom.project-wizard.finish-dialog-title' | translate }}: {{ projectName }}</h2>
    <span class="flex-1"></span>
    <button mat-icon-button (click)="cancelFinish()" type="button" class="close-btn">
      <mat-icon>close</mat-icon>
    </button>
  </mat-toolbar>

  <mat-progress-bar color="warn" mode="indeterminate" *ngIf="isFinishLoading"></mat-progress-bar>
  <div style="height: 4px;" *ngIf="!isFinishLoading"></div>

  <div class="dialog-content">
    <div class="flex items-center gap-2 p-3" style="background-color: #fff3e0; color: #e65100; border-radius: 4px;">
      <mat-icon>warning</mat-icon>
      <span>{{ 'custom.project-wizard.finish-warning' | translate }}</span>
    </div>

    <mat-form-field appearance="fill">
      <mat-label>{{ 'custom.project-wizard.progress' | translate }}</mat-label>
      <mat-select formControlName="progress">
        <mat-option value="finished">{{ 'custom.project-wizard.finished' | translate }}</mat-option>
        <mat-option value="aborted">{{ 'custom.project-wizard.aborted' | translate }}</mat-option>
      </mat-select>
    </mat-form-field>

    <div class="flex gap-2">
      <mat-form-field appearance="fill" class="flex-1">
        <mat-label>{{ 'custom.project-wizard.start-date' | translate }}</mat-label>
        <input matInput [matDatepicker]="startDatePicker" formControlName="startDate" readonly>
        <mat-datepicker-toggle matSuffix [for]="startDatePicker" disabled></mat-datepicker-toggle>
        <mat-datepicker #startDatePicker disabled></mat-datepicker>
      </mat-form-field>
      <mat-form-field appearance="fill" style="width: 120px;">
        <mat-label>{{ 'custom.project-wizard.start-time' | translate }}</mat-label>
        <input matInput type="time" formControlName="startTime" readonly>
      </mat-form-field>
    </div>

    <div class="flex gap-2">
      <mat-form-field appearance="fill" class="flex-1">
        <mat-label>{{ 'custom.project-wizard.end-date' | translate }}</mat-label>
        <input matInput [matDatepicker]="endDatePicker" formControlName="endDate">
        <mat-datepicker-toggle matSuffix [for]="endDatePicker"></mat-datepicker-toggle>
        <mat-datepicker #endDatePicker></mat-datepicker>
      </mat-form-field>
      <mat-form-field appearance="fill" style="width: 120px;">
        <mat-label>{{ 'custom.project-wizard.end-time' | translate }}</mat-label>
        <input matInput type="time" formControlName="endTime">
      </mat-form-field>
    </div>
  </div>

  <div class="dialog-footer">
    <button mat-button type="button" (click)="cancelFinish()">{{ 'custom.project-wizard.cancel' | translate }}</button>
    <button mat-raised-button color="warn" type="submit" [disabled]="isFinishLoading">
      <mat-icon style="font-size: 18px; margin-right: 4px;">save</mat-icon> {{ 'custom.project-wizard.save' | translate }}
    </button>
  </div>
</form>`;

const startProjectCss = `
/* ECO Design System - Dialog Styles */

/* Header - Blue background (high specificity) */
.start-project-form .eco-dialog-header,
mat-toolbar.eco-dialog-header {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  padding: 0 16px !important;
  height: 52px !important;
  min-height: 52px !important;
  background-color: #305680 !important;
  background: #305680 !important;
  color: white !important;
}
.start-project-form .eco-dialog-header .header-icon,
mat-toolbar.eco-dialog-header .header-icon {
  font-size: 22px !important;
  width: 22px !important;
  height: 22px !important;
  color: white !important;
}
.start-project-form .eco-dialog-header .header-title,
mat-toolbar.eco-dialog-header .header-title {
  margin: 0 !important;
  font-size: 17px !important;
  font-weight: 500 !important;
  color: white !important;
}
.start-project-form .eco-dialog-header .close-btn,
mat-toolbar.eco-dialog-header .close-btn {
  color: rgba(255,255,255,0.8) !important;
  margin-left: auto !important;
}
.start-project-form .eco-dialog-header .close-btn:hover,
mat-toolbar.eco-dialog-header .close-btn:hover {
  color: white !important;
  background: rgba(255,255,255,0.1) !important;
}
.start-project-form .eco-dialog-header mat-icon,
mat-toolbar.eco-dialog-header mat-icon {
  color: white !important;
}

/* Content Area - Scrollable */
.start-project-form .dialog-content,
.dialog-content {
  padding: 16px 20px !important;
  background: #f8fafc !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 12px !important;
  max-height: 70vh !important;
  overflow-y: auto !important;
}

/* Footer */
.start-project-form .dialog-footer,
.dialog-footer {
  display: flex !important;
  justify-content: flex-end !important;
  align-items: center !important;
  gap: 12px !important;
  padding: 12px 20px !important;
  border-top: 1px solid #e2e8f0 !important;
  background: #fafafa !important;
}

/* Section Cards */
.start-project-form .section-card,
.section-card {
  background: white !important;
  border: 1px solid #e2e8f0 !important;
  border-left: 3px solid #305680 !important;
  border-radius: 0 !important;
}

.start-project-form .section-header,
.section-header {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  padding: 10px 14px !important;
  background: #f1f5f9 !important;
  border-bottom: 1px solid #e2e8f0 !important;
  font-weight: 600 !important;
  font-size: 13px !important;
  color: #334155 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.3px !important;
}

.start-project-form .section-header mat-icon,
.section-header mat-icon {
  font-size: 18px !important;
  width: 18px !important;
  height: 18px !important;
  color: #305680 !important;
}

.start-project-form .section-body,
.section-body {
  padding: 12px 14px !important;
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-col {
  flex: 1;
}
.measurement-card:hover {
  background: #f0f0f0 !important;
}
.measurement-name {
  font-weight: 600 !important;
  font-size: 15px !important;
  color: #333 !important;
  display: block !important;
}
.measurement-label {
  font-size: 13px !important;
  color: #666 !important;
  display: block !important;
  margin-top: 2px !important;
}
.kit-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
}
.kit-toggle {
  background: #f0f0f0 !important;
  border: 1px solid #ddd !important;
  border-radius: 4px !important;
  padding: 4px 8px !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 4px !important;
  cursor: pointer !important;
  color: #333 !important;
  font-size: 12px !important;
  font-weight: 500 !important;
}
.kit-toggle:hover {
  background: #e0e0e0 !important;
}
.kit-toggle-icon {
  font-size: 18px !important;
  width: 18px !important;
  height: 18px !important;
}
.kit-devices {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
  margin-left: 8px;
}
.measurement-action-btn {
  width: 32px !important;
  height: 32px !important;
  padding: 0 !important;
  min-width: 32px !important;
  line-height: 32px !important;
  border-radius: 4px !important;
  background: #e3f2fd !important;
  color: #1976d2 !important;
  border: none !important;
  cursor: pointer !important;
}
.measurement-action-btn:hover {
  background: #bbdefb !important;
}
.measurement-action-btn mat-icon {
  font-size: 18px !important;
  width: 18px !important;
  height: 18px !important;
}`;

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

export function openProjectWizardDialog(widgetContext, projectId, projectName, projectLabel, callback, options) {
  // options.dataImporter - optional reference to ECO Data Importer module for device assignment
  const $injector = widgetContext.$scope.$injector;
  const customDialog = $injector.get(widgetContext.servicesMap.get('customDialog'));
  const deviceService = $injector.get(widgetContext.servicesMap.get('deviceService'));
  const attributeService = $injector.get(widgetContext.servicesMap.get('attributeService'));
  const assetService = $injector.get(widgetContext.servicesMap.get('assetService'));
  const entityRelationService = $injector.get(widgetContext.servicesMap.get('entityRelationService'));
  const entityGroupService = $injector.get(widgetContext.servicesMap.get('entityGroupService'));

  const rxjs = widgetContext.rxjs;
  const forkJoin = rxjs.forkJoin;
  const of = rxjs.of;
  const switchMap = rxjs.switchMap;
  const catchError = rxjs.catchError;

  if (!projectId || !projectId.id) {
    console.error('Invalid projectId:', projectId);
    return;
  }

  const projectIdValue = projectId.id;
  const projectNameValue = projectName;
  const projectLabelValue = projectLabel;

  let callbackCalled = false;
  function handleClose() {
    if (callbackCalled) return;
    callbackCalled = true;
    if (typeof callback === 'function') {
      callback();
    }
  }

  fetchMeasurements(projectIdValue);

  function isDiagnostickit(asset) {
    return asset && asset.type === 'Diagnostickit';
  }

  function findKitByFrom(deviceId) {
    return new Promise(function(resolve) {
      entityRelationService.findByFrom(deviceId).subscribe(
        function(relations) {
          var assetRelations = (relations || []).filter(function(r) { return r.to && r.to.entityType === 'ASSET'; });
          if (!assetRelations.length) {
            resolve(null);
            return;
          }
          function tryNext(index) {
            if (index >= assetRelations.length) {
              resolve(null);
              return;
            }
            var relation = assetRelations[index];
            assetService.getAsset(relation.to.id).subscribe(
              function(kit) {
                if (isDiagnostickit(kit)) {
                  resolve(kit);
                } else {
                  tryNext(index + 1);
                }
              },
              function() { tryNext(index + 1); }
            );
          }
          tryNext(0);
        },
        function() { resolve(null); }
      );
    });
  }

  function findKitByTo(deviceId) {
    return new Promise(function(resolve) {
      entityRelationService.findByTo(deviceId).subscribe(
        function(relations) {
          var assetRelations = (relations || []).filter(function(r) { return r.from && r.from.entityType === 'ASSET'; });
          if (!assetRelations.length) {
            resolve(null);
            return;
          }
          function tryNext(index) {
            if (index >= assetRelations.length) {
              resolve(null);
              return;
            }
            var relation = assetRelations[index];
            assetService.getAsset(relation.from.id).subscribe(
              function(kit) {
                if (isDiagnostickit(kit)) {
                  resolve(kit);
                } else {
                  tryNext(index + 1);
                }
              },
              function() { tryNext(index + 1); }
            );
          }
          tryNext(0);
        },
        function() { resolve(null); }
      );
    });
  }

  function loadDeviceAttributes(device) {
    return new Promise(function(resolve) {
      attributeService.getEntityAttributes(device.id, 'SERVER_SCOPE', ['active', 'lastActivityTime']).subscribe(
        function(attributes) {
          var activeAttr = attributes.find(function(a) { return a.key === 'active'; });
          var lastActivityAttr = attributes.find(function(a) { return a.key === 'lastActivityTime'; });
          device.active = activeAttr ? activeAttr.value : null;
          device.lastActivityTime = lastActivityAttr ? lastActivityAttr.value : null;
          resolve(device);
        },
        function() {
          device.active = null;
          device.lastActivityTime = null;
          resolve(device);
        }
      );
    });
  }

  function resolveDeviceKit(device) {
    return findKitByFrom(device.id).then(function(kit) {
      if (kit) {
        return { device: device, kit: kit };
      }
      return findKitByTo(device.id).then(function(fallbackKit) {
        return { device: device, kit: fallbackKit };
      });
    });
  }

  function fetchMeasurements(projIdVal) {
    var assetSearchQuery = {
      parameters: {
        rootId: projIdVal,
        rootType: 'ASSET',
        direction: 'FROM',
        relationTypeGroup: 'COMMON',
        maxLevel: 1,
        fetchLastLevelOnly: false
      },
      relationType: 'Owns',
      assetTypes: ['Measurement']
    };

    assetService.findByQuery(assetSearchQuery).subscribe(
      function(measurements) {
        if (measurements.length === 0) {
          openStartProjectDialog([], projIdVal);
          return;
        }
        fetchMeasurementDetails(measurements, projIdVal);
      },
      function(error) {
        console.error('Error fetching measurements:', error);
        openStartProjectDialog([], projIdVal);
      }
    );
  }

  function fetchMeasurementDetails(measurements, projIdVal) {
    var measurementData = [];
    var completed = 0;

    measurements.forEach(function(measurement, index) {
      var measurementId = measurement.id;

      attributeService.getEntityAttributes(
        measurementId,
        'SERVER_SCOPE',
        ['progress', 'measurementType', 'installationType', 'startTimeMs', 'endTimeMs']
      ).subscribe(
        function(attributes) {
          var attrMap = {};
          attributes.forEach(function(attr) { attrMap[attr.key] = attr.value; });

          var deviceSearchQuery = {
            parameters: {
              rootId: measurementId.id,
              rootType: 'ASSET',
              direction: 'FROM',
              relationTypeGroup: 'COMMON',
              maxLevel: 1,
              fetchLastLevelOnly: false
            },
            relationType: 'Measurement',
            deviceTypes: ['P-Flow D116', 'Room Sensor CO2', 'Temperature Sensor', 'RESI']
          };

          deviceService.findByQuery(deviceSearchQuery).subscribe(
            function(devices) {
              var startTimeMs = attrMap['startTimeMs'];
              var endTimeMs = attrMap['endTimeMs'];

              var devicePromises = devices.map(function(device) {
                return loadDeviceAttributes(device).then(function(updatedDevice) {
                  return resolveDeviceKit(updatedDevice);
                });
              });

              Promise.all(devicePromises).then(function(deviceResults) {
                var kitGroupsMap = {};
                var devicesWithKits = deviceResults.map(function(result) {
                  var device = result.device;
                  var kit = result.kit;
                  var kitId = kit && kit.id ? kit.id : null;
                  var kitKey = kitId && kitId.id ? kitId.id : 'no_kit';
                  var kitName = kit ? kit.name : 'No Diagnostickit';

                  if (!kitGroupsMap[kitKey]) {
                    kitGroupsMap[kitKey] = {
                      key: kitKey,
                      id: kitId,
                      name: kitName,
                      devices: []
                    };
                  }

                  kitGroupsMap[kitKey].devices.push({
                    id: device.id,
                    name: device.name,
                    type: device.type,
                    active: device.active !== undefined ? device.active : null,
                    lastActivityTime: device.lastActivityTime !== undefined ? device.lastActivityTime : null
                  });

                  return {
                    id: device.id,
                    name: device.name,
                    type: device.type,
                    active: device.active !== undefined ? device.active : null,
                    lastActivityTime: device.lastActivityTime !== undefined ? device.lastActivityTime : null,
                    kit: kit ? { id: kit.id, name: kit.name } : null
                  };
                });

                var kitGroups = Object.values(kitGroupsMap).sort(function(a, b) { return a.name.localeCompare(b.name); });

                measurementData.push({
                  id: measurementId,
                  name: measurement.name || 'Measurement ' + (index + 1),
                  label: measurement.label || null,
                  progress: attrMap['progress'] || 'in preparation',
                  measurementType: attrMap['measurementType'] || null,
                  installationType: attrMap['installationType'] || null,
                  startTimeMs: startTimeMs,
                  endTimeMs: endTimeMs,
                  devices: devicesWithKits,
                  kitGroups: kitGroups,
                  hasDevice: devices.length > 0
                });

                completed++;
                if (completed === measurements.length) {
                  openStartProjectDialog(measurementData, projIdVal);
                }
              }).catch(function() {
                measurementData.push({
                  id: measurementId,
                  name: measurement.name || 'Measurement ' + (index + 1),
                  label: measurement.label || null,
                  progress: attrMap['progress'] || 'in preparation',
                  measurementType: attrMap['measurementType'] || null,
                  installationType: attrMap['installationType'] || null,
                  startTimeMs: startTimeMs,
                  endTimeMs: endTimeMs,
                  devices: [],
                  kitGroups: [],
                  hasDevice: false
                });
                completed++;
                if (completed === measurements.length) {
                  openStartProjectDialog(measurementData, projIdVal);
                }
              });
            },
            function(error) {
              console.error('Error fetching devices:', error);
              measurementData.push({
                id: measurementId,
                name: measurement.name || 'Measurement ' + (index + 1),
                label: measurement.label || null,
                progress: attrMap['progress'] || 'in preparation',
                measurementType: attrMap['measurementType'] || null,
                installationType: attrMap['installationType'] || null,
                startTimeMs: attrMap['startTimeMs'],
                endTimeMs: attrMap['endTimeMs'],
                devices: [],
                kitGroups: [],
                hasDevice: false
              });
              completed++;
              if (completed === measurements.length) {
                openStartProjectDialog(measurementData, projIdVal);
              }
            }
          );
        },
        function(error) {
          console.error('Error fetching attributes:', error);
          completed++;
          if (completed === measurements.length) {
            openStartProjectDialog(measurementData, projIdVal);
          }
        }
      );
    });
  }

  function openStartProjectDialog(measurements, projIdVal) {
    measurements.sort(function(a, b) { return a.name.localeCompare(b.name); });
    customDialog.customDialog(
      startProjectHtmlTemplate,
      StartProjectDialogController,
      {
        measurements: measurements,
        projectId: { id: projIdVal, entityType: 'ASSET' },
        projectName: projectNameValue,
        projectLabel: projectLabelValue,
        onClose: handleClose,
        dataImporter: options && options.dataImporter ? options.dataImporter : null,
        widgetContext: widgetContext
      },
      startProjectCss
    ).subscribe();
  }

  function StartProjectDialogController(instance) {
    var vm = instance;
    var data = vm.data || {};
    var measurements = data.measurements || [];
    var projectId = data.projectId;
    var projectName = data.projectName;
    var projectLabel = data.projectLabel;
    var onClose = data.onClose;
    var dataImporter = data.dataImporter;
    var dialogWidgetContext = data.widgetContext;

    vm.measurements = measurements;
    vm.projectName = projectName;
    vm.projectLabel = projectLabel;
    vm.isLoading = false;
    vm.validationError = null;
    vm.expandedKits = {};
    vm.projectProgress = 'in preparation';
    vm.projectStartTimeMs = null;
    vm.projectEndTimeMs = null;
    vm.projectAddress = null;

    attributeService.getEntityAttributes(projectId, 'SERVER_SCOPE', ['progress', 'startTimeMs', 'endTimeMs', 'address']).subscribe(
      function(attributes) {
        var progressAttr = attributes.find(function(attr) { return attr.key === 'progress'; });
        var startTimeAttr = attributes.find(function(attr) { return attr.key === 'startTimeMs'; });
        var endTimeAttr = attributes.find(function(attr) { return attr.key === 'endTimeMs'; });
        var addressAttr = attributes.find(function(attr) { return attr.key === 'address'; });
        vm.projectProgress = progressAttr ? progressAttr.value : 'in preparation';
        vm.projectStartTimeMs = startTimeAttr ? startTimeAttr.value : null;
        vm.projectEndTimeMs = endTimeAttr ? endTimeAttr.value : null;
        vm.projectAddress = addressAttr ? addressAttr.value : null;
      },
      function(error) {
        console.error('Error fetching project progress:', error);
      }
    );

    // Assign styling functions to vm
    vm.getMeasurementTypeStyle = getMeasurementTypeStyle;
    vm.getMeasurementTypeStyle = getMeasurementTypeStyle;
    vm.getInstallationTypeStyle = getInstallationTypeStyle;
    vm.getProgressColor = getProgressColor;
    vm.getDeviceStatusStyle = getDeviceStatusStyle;
    vm.getTimestampStyle = getTimestampStyle;
    vm.getActivityColor = getActivityColor;

    // Check if import-type measurements have imported data (E_th_kWh and V_m3)
    function checkImportedData() {
      var http = dialogWidgetContext.$scope.$injector.get(dialogWidgetContext.servicesMap.get('http'));
      var REQUIRED_KEYS = ['E_th_kWh', 'V_m3'];

      vm.measurements.forEach(function(m) {
        m.hasImportedData = false; // Initialize

        if (m.measurementType === 'import') {
          // Check telemetry keys for this measurement
          var measurementEntityId = m.id.id || m.id;
          var url = '/api/plugins/telemetry/ASSET/' + measurementEntityId + '/keys/timeseries';

          http.get(url).subscribe(
            function(keys) {
              // Check if ALL required keys are present
              var hasAllKeys = REQUIRED_KEYS.every(function(reqKey) {
                return keys.includes(reqKey);
              });
              m.hasImportedData = hasAllKeys;
            },
            function(error) {
              console.error('Error checking telemetry keys for measurement:', measurementEntityId, error);
              m.hasImportedData = false;
            }
          );
        }
      });
    }

    // Run telemetry check for import measurements
    checkImportedData();

    vm.formatTimestamp = function(ms) {
      if (ms === null || ms === undefined) {
        return '';
      }
      var value = Number(ms);
      if (!Number.isFinite(value) || value <= 0) {
        return '';
      }
      var date = new Date(value);
      function pad(n) { return n.toString().padStart(2, '0'); }
      return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) +
        ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
    };

    vm.toggleKit = function(measurementId, kitKey) {
      var key = measurementId + '_' + kitKey;
      vm.expandedKits[key] = !vm.expandedKits[key];
    };

    vm.isKitExpanded = function(measurementId, kitKey) {
      return vm.expandedKits[measurementId + '_' + kitKey] === true;
    };

    // Open Live Data dialog for measurement
    vm.openLiveData = function(measurement) {
      vm.dialogRef.close(null);
      openMeasurementInfoDialog(widgetContext, measurement.id, null);
    };

    // Navigate to measurement dashboard
    vm.openDashboard = function(measurement) {
      vm.dialogRef.close(null);
      var params = {
        selectedMeasurement: {
          entityId: measurement.id,
          entityName: measurement.name,
          entityLabel: measurement.label || measurement.name,
        },
        targetEntityParamName: 'selectedMeasurement'
      };
      widgetContext.stateController.openState('measurement_dashboard', params, true);
    };

    // Open Parameters dialog for measurement
    vm.openParams = function(measurement) {
      vm.dialogRef.close(null);
      openMeasurementParametersDialog(widgetContext, measurement.id, null);
    };

    function updateValidation() {
      var errors = [];

      // Check if project has any measurements
      if (!vm.measurements || vm.measurements.length === 0) {
        vm.canStart = false;
        vm.validationError = 'Cannot start: Project has no measurements.';
        return;
      }

      // Check ultrasonic measurements without P-Flow D116
      var ultrasonicWithoutDevice = vm.measurements.filter(function(m) {
        return m.measurementType === 'ultrasonic' &&
               !m.hasDevice &&
               (m.progress === 'in preparation' || m.progress === 'planned');
      });

      // Check LoRaWAN measurements without Room Sensor CO2
      var lorawanWithoutDevice = vm.measurements.filter(function(m) {
        var mType = (m.measurementType || '').toLowerCase();
        return mType === 'lorawan' &&
               !m.hasDevice &&
               (m.progress === 'in preparation' || m.progress === 'planned');
      });

      if (ultrasonicWithoutDevice.length > 0) {
        errors.push(ultrasonicWithoutDevice.length + ' ultrasonic measurement(s) without P-Flow D116');
      }
      if (lorawanWithoutDevice.length > 0) {
        errors.push(lorawanWithoutDevice.length + ' LoRaWAN measurement(s) without Room Sensor CO2');
      }

      if (errors.length > 0) {
        vm.canStart = false;
        vm.validationError = 'Cannot start: ' + errors.join(', ') + '.';
      } else {
        vm.canStart = true;
        vm.validationError = null;
      }
    }

    updateValidation();

    // Helper function to reload measurements for the current project
    function loadMeasurementsForProject(projIdVal) {
      var projId = typeof projIdVal === 'string' ? projIdVal : (projIdVal.id || projIdVal);

      var assetSearchQuery = {
        parameters: {
          rootId: projId,
          rootType: 'ASSET',
          direction: 'FROM',
          relationTypeGroup: 'COMMON',
          maxLevel: 1,
          fetchLastLevelOnly: false
        },
        relationType: 'Owns',
        assetTypes: ['Measurement']
      };

      assetService.findByQuery(assetSearchQuery).subscribe(
        function(measurements) {
          if (measurements.length === 0) {
            vm.measurements = [];
            updateValidation();
            return;
          }
          reloadMeasurementDetails(measurements);
        },
        function(error) {
          console.error('Error reloading measurements:', error);
        }
      );
    }

    function reloadMeasurementDetails(measurements) {
      var measurementData = [];
      var completed = 0;

      measurements.forEach(function(measurement, index) {
        var measurementId = measurement.id;

        attributeService.getEntityAttributes(
          measurementId,
          'SERVER_SCOPE',
          ['progress', 'measurementType', 'installationType', 'startTimeMs', 'endTimeMs']
        ).subscribe(
          function(attributes) {
            var attrMap = {};
            attributes.forEach(function(attr) { attrMap[attr.key] = attr.value; });

            var deviceSearchQuery = {
              parameters: {
                rootId: measurementId.id,
                rootType: 'ASSET',
                direction: 'FROM',
                relationTypeGroup: 'COMMON',
                maxLevel: 1,
                fetchLastLevelOnly: false
              },
              relationType: 'Measurement',
              deviceTypes: ['P-Flow D116', 'Room Sensor CO2', 'Temperature Sensor', 'RESI']
            };

            deviceService.findByQuery(deviceSearchQuery).subscribe(
              function(devices) {
                var startTimeMs = attrMap['startTimeMs'];
                var endTimeMs = attrMap['endTimeMs'];

                var devicePromises = devices.map(function(device) {
                  return loadDeviceAttributes(device).then(function(updatedDevice) {
                    return resolveDeviceKit(updatedDevice);
                  });
                });

                Promise.all(devicePromises).then(function(deviceResults) {
                  var kitGroupsMap = {};
                  var devicesWithKits = deviceResults.map(function(result) {
                    var device = result.device;
                    var kit = result.kit;
                    var kitId = kit && kit.id ? kit.id : null;
                    var kitKey = kitId && kitId.id ? kitId.id : 'no_kit';
                    var kitName = kit ? kit.name : 'No Diagnostickit';

                    if (!kitGroupsMap[kitKey]) {
                      kitGroupsMap[kitKey] = {
                        key: kitKey,
                        id: kitId,
                        name: kitName,
                        devices: []
                      };
                    }

                    kitGroupsMap[kitKey].devices.push({
                      id: device.id,
                      name: device.name,
                      type: device.type,
                      active: device.active !== undefined ? device.active : null,
                      lastActivityTime: device.lastActivityTime !== undefined ? device.lastActivityTime : null
                    });

                    return {
                      id: device.id,
                      name: device.name,
                      type: device.type,
                      active: device.active !== undefined ? device.active : null,
                      lastActivityTime: device.lastActivityTime !== undefined ? device.lastActivityTime : null,
                      kit: kit ? { id: kit.id, name: kit.name } : null
                    };
                  });

                  var kitGroups = Object.values(kitGroupsMap).sort(function(a, b) { return a.name.localeCompare(b.name); });

                  measurementData.push({
                    id: measurementId,
                    name: measurement.name || 'Measurement ' + (index + 1),
                    label: measurement.label || null,
                    progress: attrMap['progress'] || 'in preparation',
                    measurementType: attrMap['measurementType'] || null,
                    installationType: attrMap['installationType'] || null,
                    startTimeMs: startTimeMs,
                    endTimeMs: endTimeMs,
                    devices: devicesWithKits,
                    kitGroups: kitGroups,
                    hasDevice: devices.length > 0
                  });

                  completed++;
                  if (completed === measurements.length) {
                    measurementData.sort(function(a, b) { return a.name.localeCompare(b.name); });
                    vm.measurements = measurementData;
                    updateValidation();
                  }
                }).catch(function() {
                  measurementData.push({
                    id: measurementId,
                    name: measurement.name || 'Measurement ' + (index + 1),
                    label: measurement.label || null,
                    progress: attrMap['progress'] || 'in preparation',
                    measurementType: attrMap['measurementType'] || null,
                    installationType: attrMap['installationType'] || null,
                    startTimeMs: startTimeMs,
                    endTimeMs: endTimeMs,
                    devices: [],
                    kitGroups: [],
                    hasDevice: false
                  });
                  completed++;
                  if (completed === measurements.length) {
                    measurementData.sort(function(a, b) { return a.name.localeCompare(b.name); });
                    vm.measurements = measurementData;
                    updateValidation();
                  }
                });
              },
              function(error) {
                console.error('Error fetching devices:', error);
                measurementData.push({
                  id: measurementId,
                  name: measurement.name || 'Measurement ' + (index + 1),
                  label: measurement.label || null,
                  progress: attrMap['progress'] || 'in preparation',
                  measurementType: attrMap['measurementType'] || null,
                  installationType: attrMap['installationType'] || null,
                  startTimeMs: attrMap['startTimeMs'],
                  endTimeMs: attrMap['endTimeMs'],
                  devices: [],
                  kitGroups: [],
                  hasDevice: false
                });
                completed++;
                if (completed === measurements.length) {
                  measurementData.sort(function(a, b) { return a.name.localeCompare(b.name); });
                  vm.measurements = measurementData;
                  updateValidation();
                }
              }
            );
          },
          function(error) {
            console.error('Error fetching attributes:', error);
            completed++;
            if (completed === measurements.length) {
              measurementData.sort(function(a, b) { return a.name.localeCompare(b.name); });
              vm.measurements = measurementData;
              updateValidation();
            }
          }
        );
      });
    }

    vm.startProjectFormGroup = vm.fb.group({});

    vm.connectMeasurement = function(measurement) {
      console.log('Connect measurement:', measurement.name, 'id:', measurement.id);

      if (!dataImporter || !dataImporter.assignDeviceToMeasurement) {
        console.error('dataImporter module not available');
        vm.validationError = 'Connect functionality not available from this context.';
        return;
      }

      if (!dialogWidgetContext) {
        console.error('widgetContext not available');
        vm.validationError = 'Connect functionality not available from this context.';
        return;
      }

      // Open the device assignment dialog (keep Project Wizard open)
      dataImporter.assignDeviceToMeasurement(
        dialogWidgetContext,
        measurement.id,
        measurement.name,
        function() {
          // After device assignment, refresh the measurements in the project wizard
          if (projectId) {
            loadMeasurementsForProject(projectId);
          }
        }
      );
    };

    // Open CSV Data Import Dialog for 'import' type measurements
    vm.openImportDialog = function(measurement) {
      console.log('Open import dialog for measurement:', measurement.name, 'id:', measurement.id);

      if (!dataImporter || !dataImporter.csvDataImportDialog) {
        console.error('dataImporter.csvDataImportDialog not available');
        vm.validationError = 'Import functionality not available from this context.';
        return;
      }

      if (!dialogWidgetContext) {
        console.error('widgetContext not available');
        vm.validationError = 'Import functionality not available from this context.';
        return;
      }

      // Open the CSV data import dialog with selectedMeasurement to skip selection step
      dataImporter.csvDataImportDialog(
        dialogWidgetContext,
        measurement.id,
        measurement.name,
        {
          selectedMeasurement: {
            entityId: measurement.id,
            entityName: measurement.name,
            entityLabel: measurement.label || measurement.name,
            installationType: measurement.installationType || null
          }
        }
      );
    };

    vm.cancel = function() {
      vm.dialogRef.close(null);
      if (typeof onClose === 'function') {
        onClose();
      }
    };

    vm.finishProject = function() {
      vm.dialogRef.close(null);
      setTimeout(function() {
        customDialog.customDialog(
          finishHtmlTemplate,
          FinishProjectDialogController,
          {
            measurements: vm.measurements,
            projectId: projectId,
            projectName: vm.projectName,
            projectLabel: vm.projectLabel,
            projectStartTimeMs: vm.projectStartTimeMs,
            onClose: onClose
          }
        ).subscribe();
      }, 0);
    };

    vm.save = function() {
      if (!vm.canStart) return;

      vm.isLoading = true;
      var now = Date.now();

      var projectAttributes = [
        { key: 'progress', value: 'active' },
        { key: 'startTimeMs', value: now }
      ];

      var updateOperations = [];

      updateOperations.push(
        attributeService.saveEntityAttributes(projectId, 'SERVER_SCOPE', projectAttributes)
      );

      vm.measurements.forEach(function(m) {
        if (m.progress === 'in preparation') {
          var measurementAttributes = [
            { key: 'progress', value: 'active' },
            { key: 'startTimeMs', value: now }
          ];

          // Save assignedDevices on measurement (devices + kits)
          var assignedEntities = [];

          // Add devices
          if (m.devices && m.devices.length > 0) {
            m.devices.forEach(function(device) {
              assignedEntities.push({
                id: device.id.id,
                name: device.name,
                type: device.type,
                entityType: 'DEVICE'
              });
            });
          }

          // Add kits (from kitGroups, excluding 'no_kit')
          if (m.kitGroups && m.kitGroups.length > 0) {
            m.kitGroups.forEach(function(kit) {
              if (kit.key !== 'no_kit' && kit.id) {
                assignedEntities.push({
                  id: kit.id.id,
                  name: kit.name,
                  type: 'Diagnostickit',
                  entityType: 'ASSET'
                });
              }
            });
          }

          if (assignedEntities.length > 0) {
            measurementAttributes.push({
              key: 'assignedDevices',
              value: JSON.stringify(assignedEntities)
            });
          }

          updateOperations.push(
            attributeService.saveEntityAttributes(m.id, 'SERVER_SCOPE', measurementAttributes)
          );
        }
      });

      forkJoin(updateOperations).subscribe(
        function() {
          vm.isLoading = false;
          widgetContext.updateAliases();
          vm.dialogRef.close(null);
          if (typeof onClose === 'function') {
            onClose();
          }
        },
        function(error) {
          console.error('Error updating attributes:', error);
          vm.isLoading = false;
          vm.validationError = 'Error starting project. Please try again.';
        }
      );
    };
  }

  function FinishProjectDialogController(instance) {
    var vm = instance;
    var data = vm.data || {};
    var projectId = data.projectId;
    var projectName = data.projectName;
    var projectLabel = data.projectLabel || projectName;
    var measurements = data.measurements || [];
    var projectStartTimeMs = data.projectStartTimeMs;
    var onClose = data.onClose;

    vm.projectName = projectName;
    vm.isFinishLoading = false;

    var now = Date.now();
    var startMs = projectStartTimeMs ? Number(projectStartTimeMs) : null;

    function formatTime(ms) {
      if (!ms) return '';
      var date = new Date(ms);
      var hours = String(date.getHours()).padStart(2, '0');
      var minutes = String(date.getMinutes()).padStart(2, '0');
      return hours + ':' + minutes;
    }

    vm.finishProjectFormGroup = vm.fb.group({
      progress: ['finished'],
      startDate: [startMs ? new Date(startMs) : null],
      startTime: [startMs ? formatTime(startMs) : ''],
      endDate: [new Date(now)],
      endTime: [formatTime(now)]
    });

    vm.cancelFinish = function() {
      vm.dialogRef.close(null);
      if (typeof onClose === 'function') {
        onClose();
      }
    };

    vm.saveFinish = function() {
      vm.isFinishLoading = true;

      var formValues = vm.finishProjectFormGroup.value;
      var progress = formValues.progress || 'finished';

      function combineDateAndTime(dateValue, timeValue) {
        if (!dateValue || !timeValue) return null;
        var date = new Date(dateValue);
        var parts = String(timeValue).split(':');
        if (parts.length < 2) return null;
        var hours = Number(parts[0]);
        var minutes = Number(parts[1]);
        if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
        date.setHours(hours, minutes, 0, 0);
        return date.getTime();
      }

      var endTimeMs = combineDateAndTime(formValues.endDate, formValues.endTime) || Date.now();

      var updateOperations = [];

      // Update Project: progress, endTimeMs (keep assignedKit for historical reference)
      updateOperations.push(
        attributeService.saveEntityAttributes(projectId, 'SERVER_SCOPE', [
          { key: 'progress', value: progress },
          { key: 'endTimeMs', value: endTimeMs }
        ])
      );

      measurements.forEach(function(m) {
        updateOperations.push(
          attributeService.saveEntityAttributes(m.id, 'SERVER_SCOPE', [
            { key: 'progress', value: progress },
            { key: 'endTimeMs', value: endTimeMs }
          ])
        );
      });

      // Unassign devices and kits, update measurement history
      var startMs = projectStartTimeMs ? Number(projectStartTimeMs) : null;
      updateOperations.push(unassignDevicesAndKits(measurements, projectName, projectLabel, startMs, endTimeMs));

      forkJoin(updateOperations).subscribe(
        function() {
          vm.isFinishLoading = false;
          widgetContext.updateAliases();
          vm.dialogRef.close(null);
          if (typeof onClose === 'function') {
            onClose();
          }
        },
        function(error) {
          console.error('Error finishing project:', error);
          vm.isFinishLoading = false;
        }
      );
    };

    function unassignDevicesAndKits(measurementsList, projName, projLabel, startMs, endMs) {
      if (!measurementsList || !measurementsList.length) {
        return of([]);
      }

      return assetService.getAsset(projectId.id).pipe(
        switchMap(function(projectAsset) {
          var customerId = projectAsset && projectAsset.customerId ? projectAsset.customerId : null;
          if (!customerId || !customerId.id) {
            return of([]);
          }

          // Get both entity groups in parallel
          return forkJoin({
            deviceGroup: getOrCreateEntityGroup(customerId, 'DEVICE', 'Unassigned Measurement Devices'),
            kitGroup: getOrCreateEntityGroup(customerId, 'ASSET', 'Unassigned Diagnostic Kits')
          }).pipe(
            switchMap(function(groups) {
              var deviceGroup = groups.deviceGroup;
              var kitGroup = groups.kitGroup;

              // First: Collect all kit IDs from all measurements to avoid duplicates
              var kitRelationQueries = measurementsList.map(function(m) {
                var measurementId = { id: m.id.id, entityType: 'ASSET' };
                return entityRelationService.findByFrom(measurementId, 'Measurement').pipe(
                  switchMap(function(relations) {
                    var kitRelation = relations.find(function(r) {
                      return r.to && r.to.entityType === 'ASSET';
                    });
                    return of(kitRelation ? { kitId: kitRelation.to, measurementId: measurementId } : null);
                  }),
                  catchError(function() { return of(null); })
                );
              });

              return forkJoin(kitRelationQueries).pipe(
                switchMap(function(kitResults) {
                  // Deduplicate kits by ID
                  var uniqueKits = {};
                  var measurementKitRelations = [];

                  kitResults.forEach(function(result) {
                    if (result && result.kitId) {
                      var kitIdStr = result.kitId.id;
                      if (!uniqueKits[kitIdStr]) {
                        uniqueKits[kitIdStr] = result.kitId;
                      }
                      // Track all Measurement → Kit relations for deletion
                      measurementKitRelations.push({
                        measurementId: result.measurementId,
                        kitId: result.kitId
                      });
                    }
                  });

                  var operations = [];

                  // Process devices for each measurement
                  measurementsList.forEach(function(m) {
                    var measurementId = { id: m.id.id, entityType: 'ASSET' };

                    if (m.devices && m.devices.length > 0) {
                      var deviceIds = [];

                      // Save assignedDevices on the Measurement (devices + kits)
                      var assignedEntities = [];

                      // Add devices
                      m.devices.forEach(function(device) {
                        assignedEntities.push({
                          id: device.id.id,
                          name: device.name,
                          type: device.type,
                          entityType: 'DEVICE'
                        });
                      });

                      // Add kits (from kitGroups if available)
                      if (m.kitGroups && m.kitGroups.length > 0) {
                        m.kitGroups.forEach(function(kit) {
                          if (kit.key !== 'no_kit' && kit.id) {
                            assignedEntities.push({
                              id: kit.id.id,
                              name: kit.name,
                              type: 'Diagnostickit',
                              entityType: 'ASSET'
                            });
                          }
                        });
                      }

                      operations.push(
                        attributeService.saveEntityAttributes(measurementId, 'SERVER_SCOPE', [
                          { key: 'assignedDevices', value: JSON.stringify(assignedEntities) }
                        ])
                      );

                      m.devices.forEach(function(device) {
                        var deviceId = { id: device.id.id, entityType: 'DEVICE' };
                        deviceIds.push(device.id.id);

                        // Update device measurementHistory and clear assignedTo
                        operations.push(
                          updateMeasurementHistory(deviceId, 'DEVICE', {
                            measurementName: m.name,
                            measurementLabel: m.label || m.name,
                            startTimeMs: startMs,
                            endTimeMs: endMs
                          }, true)
                        );

                        // Delete Measurement → Device relation
                        operations.push(
                          entityRelationService.deleteRelation(measurementId, 'Measurement', deviceId)
                        );
                      });

                      // Add devices to Unassigned group
                      var uniqueDeviceIds = Array.from(new Set(deviceIds));
                      if (deviceGroup && deviceGroup.id && uniqueDeviceIds.length) {
                        operations.push(
                          entityGroupService.addEntitiesToEntityGroup(deviceGroup.id.id, uniqueDeviceIds)
                        );
                      }
                    }
                  });

                  // Delete all Measurement → Kit relations
                  measurementKitRelations.forEach(function(rel) {
                    operations.push(
                      entityRelationService.deleteRelation(rel.measurementId, 'Measurement', rel.kitId)
                    );
                  });

                  // Process each unique kit ONCE
                  var uniqueKitIds = Object.keys(uniqueKits);
                  uniqueKitIds.forEach(function(kitIdStr) {
                    var kitId = uniqueKits[kitIdStr];

                    // Update kit's measurementHistory and clear assignedTo (only once per kit!)
                    operations.push(
                      updateMeasurementHistory(kitId, 'ASSET', {
                        projectName: projName,
                        projectLabel: projLabel,
                        startTimeMs: startMs,
                        endTimeMs: endMs
                      }, true)
                    );

                    // Add kit to Unassigned Diagnostic Kits group
                    if (kitGroup && kitGroup.id) {
                      operations.push(
                        entityGroupService.addEntitiesToEntityGroup(kitGroup.id.id, [kitId.id])
                      );
                    }
                  });

                  return operations.length ? forkJoin(operations) : of([]);
                })
              );
            })
          );
        })
      );
    }

    function updateMeasurementHistory(entityId, entityType, historyEntry, clearAssignedTo) {
      return attributeService.getEntityAttributes(entityId, 'SERVER_SCOPE', ['measurementHistory']).pipe(
        switchMap(function(attrs) {
          var historyAttr = attrs.find(function(a) { return a.key === 'measurementHistory'; });
          var history = [];

          if (historyAttr && historyAttr.value) {
            try {
              history = typeof historyAttr.value === 'string' ? JSON.parse(historyAttr.value) : historyAttr.value;
              if (!Array.isArray(history)) history = [];
            } catch (e) {
              history = [];
            }
          }

          // Append new entry
          history.push(historyEntry);

          var attrsToSave = [
            { key: 'measurementHistory', value: JSON.stringify(history) }
          ];

          // Optionally clear assignedTo (for kits and devices)
          if (clearAssignedTo) {
            attrsToSave.push({ key: 'assignedTo', value: 'None' });
          }

          return attributeService.saveEntityAttributes(entityId, 'SERVER_SCOPE', attrsToSave);
        }),
        catchError(function(err) {
          console.error('Error updating measurementHistory:', err);
          return of(null);
        })
      );
    }

    function getOrCreateEntityGroup(customerId, entityType, groupName) {
      return entityGroupService.getEntityGroupsByOwnerId(
        customerId.entityType,
        customerId.id,
        entityType
      ).pipe(
        switchMap(function(groups) {
          var group = groups.find(function(g) { return g.name === groupName; });
          if (group) {
            return of(group);
          }
          var newGroup = {
            type: entityType,
            name: groupName,
            ownerId: customerId
          };
          return entityGroupService.saveEntityGroup(newGroup);
        }),
        catchError(function(err) {
          console.error('Error getting/creating entity group:', groupName, err);
          return of(null);
        })
      );
    }
  }
}

// ============================================================================
// ADD MEASUREMENT DIALOG
// ============================================================================

const addMeasurementHtmlTemplate = `<style>
/* ECO Design System - Embedded Styles for Add Measurement */
.add-entity-form .eco-dialog-header,
mat-toolbar.eco-dialog-header {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  padding: 0 16px !important;
  height: 52px !important;
  min-height: 52px !important;
  background-color: #305680 !important;
  background: #305680 !important;
  color: white !important;
}
.add-entity-form .eco-dialog-header .header-icon,
mat-toolbar.eco-dialog-header .header-icon {
  font-size: 22px !important;
  width: 22px !important;
  height: 22px !important;
  color: white !important;
}
.add-entity-form .eco-dialog-header .header-title,
mat-toolbar.eco-dialog-header .header-title {
  margin: 0 !important;
  font-size: 17px !important;
  font-weight: 500 !important;
  color: white !important;
}
.add-entity-form .eco-dialog-header .close-btn,
mat-toolbar.eco-dialog-header .close-btn {
  color: rgba(255,255,255,0.8) !important;
  margin-left: auto !important;
}
.add-entity-form .eco-dialog-header mat-icon,
mat-toolbar.eco-dialog-header mat-icon {
  color: white !important;
}
.add-entity-form .dialog-content { padding: 16px 20px !important; background: #f8fafc !important; }
.add-entity-form .dialog-footer { display: flex !important; justify-content: flex-end !important; gap: 12px !important; padding: 12px 20px !important; border-top: 1px solid #e2e8f0 !important; }
.add-entity-form .section-card { background: white !important; border: 1px solid #e2e8f0 !important; border-left: 3px solid #305680 !important; }
.add-entity-form .section-header { display: flex !important; align-items: center !important; gap: 8px !important; padding: 10px 14px !important; background: #f1f5f9 !important; border-bottom: 1px solid #e2e8f0 !important; font-weight: 600 !important; font-size: 13px !important; color: #334155 !important; text-transform: uppercase !important; }
.add-entity-form .section-header mat-icon { font-size: 18px !important; width: 18px !important; height: 18px !important; color: #305680 !important; }
.add-entity-form .section-body { padding: 12px 14px !important; }
</style>
<form [formGroup]="addMeasurementFormGroup" (ngSubmit)="save()" class="add-entity-form" style="width: 500px; max-width: 90vw;">
  <mat-toolbar class="eco-dialog-header">
    <mat-icon class="header-icon">assessment</mat-icon>
    <h2 class="header-title">{{'custom.projects.measurements.add-measurement' | translate}}</h2>
    <span class="flex-1"></span>
    <button mat-icon-button (click)="cancel()" type="button" class="close-btn">
      <mat-icon>close</mat-icon>
    </button>
  </mat-toolbar>

  <mat-progress-bar color="warn" mode="indeterminate" *ngIf="isLoading"></mat-progress-bar>
  <div style="height: 4px;" *ngIf="!isLoading"></div>

  <div class="dialog-content">

    <!-- Measurement Info Section -->
    <div class="section-card">
      <div class="section-header">
        <mat-icon>info</mat-icon>
        <span>Measurement Info</span>
      </div>
      <div class="section-body">
      <mat-form-field appearance="fill" class="w-full disabled-field">
        <mat-label>{{'custom.projects.measurements.measurement-title' | translate}}</mat-label>
        <input matInput formControlName="name" readonly>
        <mat-hint>Auto-generated measurement name</mat-hint>
      </mat-form-field>
      <mat-form-field appearance="fill" class="w-full">
        <mat-label>Label</mat-label>
        <input matInput formControlName="label" placeholder="e.g. Main Heating Circuit">
        <mat-hint>Optional descriptive label</mat-hint>
      </mat-form-field>
    </div>
    </div>

    <!-- Configuration Section -->
    <div class="section-card">
      <div class="section-header">
        <mat-icon>settings</mat-icon>
        <span>Configuration</span>
      </div>
      <div class="section-body">

      <!-- Measurement Type -->
      <mat-form-field appearance="fill" class="w-full">
        <mat-label>{{'custom.measurement.administration.action.measurement-type.title' | translate}}</mat-label>
        <mat-select formControlName="measurementType" required>
          <mat-select-trigger>
            <div class="flex items-center gap-2">
              <mat-icon *ngIf="addMeasurementFormGroup.get('measurementType')?.value === 'ultrasonic'" style="font-size: 18px; width: 18px; height: 18px; color: #2196f3;">sensors</mat-icon>
              <mat-icon *ngIf="addMeasurementFormGroup.get('measurementType')?.value === 'import'" style="font-size: 18px; width: 18px; height: 18px; color: #9c27b0;">upload_file</mat-icon>
              <mat-icon *ngIf="addMeasurementFormGroup.get('measurementType')?.value === 'interpolation'" style="font-size: 18px; width: 18px; height: 18px; color: #4caf50;">auto_graph</mat-icon>
              <mat-icon *ngIf="addMeasurementFormGroup.get('measurementType')?.value === 'loraWan'" style="font-size: 18px; width: 18px; height: 18px; color: #ff9800;">cell_tower</mat-icon>
              <span *ngIf="addMeasurementFormGroup.get('measurementType')?.value === 'ultrasonic'">Ultrasonic</span>
              <span *ngIf="addMeasurementFormGroup.get('measurementType')?.value === 'import'">Import</span>
              <span *ngIf="addMeasurementFormGroup.get('measurementType')?.value === 'interpolation'">Interpolation</span>
              <span *ngIf="addMeasurementFormGroup.get('measurementType')?.value === 'loraWan'">LoRaWAN</span>
            </div>
          </mat-select-trigger>
          <mat-option value="ultrasonic">
            <div class="flex items-center gap-2">
              <mat-icon style="font-size: 18px; width: 18px; height: 18px; color: #2196f3;">sensors</mat-icon>
              <span>Ultrasonic</span>
            </div>
          </mat-option>
          <mat-option value="import">
            <div class="flex items-center gap-2">
              <mat-icon style="font-size: 18px; width: 18px; height: 18px; color: #9c27b0;">upload_file</mat-icon>
              <span>Import</span>
            </div>
          </mat-option>
          <mat-option value="interpolation">
            <div class="flex items-center gap-2">
              <mat-icon style="font-size: 18px; width: 18px; height: 18px; color: #4caf50;">auto_graph</mat-icon>
              <span>Interpolation</span>
            </div>
          </mat-option>
          <mat-option value="loraWan">
            <div class="flex items-center gap-2">
              <mat-icon style="font-size: 18px; width: 18px; height: 18px; color: #ff9800;">cell_tower</mat-icon>
              <span>LoRaWAN</span>
            </div>
          </mat-option>
        </mat-select>
        <mat-error *ngIf="addMeasurementFormGroup.get('measurementType')?.hasError('required')">
          {{'custom.measurement.administration.action.measurement-type.error.is-required' | translate}}
        </mat-error>
      </mat-form-field>

      <!-- Installation Type (not for LoRaWAN) -->
      <mat-form-field appearance="fill" class="w-full" *ngIf="addMeasurementFormGroup.get('measurementType')?.value !== 'loraWan'">
        <mat-label>{{'custom.diagnostics.action.edit-measurement-parameters.installation-type.title' | translate}}</mat-label>
        <mat-select formControlName="installationType" required>
          <mat-select-trigger>
            <div class="flex items-center gap-2">
              <mat-icon *ngIf="addMeasurementFormGroup.get('installationType')?.value === 'heating'" style="font-size: 18px; width: 18px; height: 18px; color: #f44336;">local_fire_department</mat-icon>
              <mat-icon *ngIf="addMeasurementFormGroup.get('installationType')?.value === 'cooling'" style="font-size: 18px; width: 18px; height: 18px; color: #2196f3;">ac_unit</mat-icon>
              <span *ngIf="addMeasurementFormGroup.get('installationType')?.value === 'heating'">{{'custom.diagnostics.measurement-type.heating.title' | translate}}</span>
              <span *ngIf="addMeasurementFormGroup.get('installationType')?.value === 'cooling'">{{'custom.diagnostics.measurement-type.cooling.title' | translate}}</span>
            </div>
          </mat-select-trigger>
          <mat-option value="heating">
            <div class="flex items-center gap-2">
              <mat-icon style="font-size: 18px; width: 18px; height: 18px; color: #f44336;">local_fire_department</mat-icon>
              <span>{{'custom.diagnostics.measurement-type.heating.title' | translate}}</span>
            </div>
          </mat-option>
          <mat-option value="cooling">
            <div class="flex items-center gap-2">
              <mat-icon style="font-size: 18px; width: 18px; height: 18px; color: #2196f3;">ac_unit</mat-icon>
              <span>{{'custom.diagnostics.measurement-type.cooling.title' | translate}}</span>
            </div>
          </mat-option>
        </mat-select>
        <mat-error *ngIf="addMeasurementFormGroup.get('installationType')?.hasError('required')">
          {{'custom.diagnostics.action.edit-measurement-parameters.installation-type.error' | translate}}
        </mat-error>
      </mat-form-field>

      <!-- Connect Measurement Option (only for ultrasonic) -->
      <div *ngIf="addMeasurementFormGroup.get('measurementType')?.value === 'ultrasonic'"
           class="flex items-center gap-3"
           style="background: linear-gradient(135deg, #e8f4fd 0%, #f0f7ff 100%); border: 1px solid #305680; border-radius: 8px; padding: 12px; margin-top: 8px;">
        <mat-checkbox formControlName="connectKit" color="primary"></mat-checkbox>
        <div class="flex flex-col">
          <span style="font-weight: 500; color: #305680;">Connect Diagnostic Kit</span>
          <span style="font-size: 12px; color: #666;">Assign a P-Flow device after creation</span>
        </div>
      </div>
    </div>
    </div>

  </div>

  <div class="dialog-footer">
    <button mat-button type="button" [disabled]="isLoading" (click)="cancel()">
      {{'action.cancel' | translate}}
    </button>
    <button mat-raised-button color="primary" type="submit" [disabled]="isLoading || addMeasurementFormGroup.invalid">
      <mat-icon style="font-size: 18px; width: 18px; height: 18px; margin-right: 4px;">add</mat-icon>
      {{'custom.projects.measurements.add-measurement' | translate}}
    </button>
  </div>
</form>`;

const addMeasurementCss = `.add-entity-form .mdc-text-field--filled.mdc-text-field--disabled {
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
.add-entity-form .disabled-field input {
  color: rgba(0, 0, 0, 0.6) !important;
}
.add-entity-form .disabled-field {
  background-color: rgba(244, 249, 254, 0.5) !important;
}`;

/**
 * Opens the Add Measurement dialog
 *
 * @param {Object} widgetContext - ThingsBoard widget context
 * @param {Object} projectId - Project entity ID { id: string, entityType: 'ASSET' }
 * @param {string} projectName - Project name
 * @param {Object} customerId - Customer entity ID { id: string, entityType: 'CUSTOMER' }
 * @param {Function} callback - Optional callback after measurement is created (receives measurement object)
 */
export function openAddMeasurementDialog(widgetContext, projectId, projectName, customerId, callback) {
  const $injector = widgetContext.$scope.$injector;
  const customDialog = $injector.get(widgetContext.servicesMap.get('customDialog'));
  const assetService = $injector.get(widgetContext.servicesMap.get('assetService'));
  const entityGroupService = $injector.get(widgetContext.servicesMap.get('entityGroupService'));
  const attributeService = $injector.get(widgetContext.servicesMap.get('attributeService'));
  const entityRelationService = $injector.get(widgetContext.servicesMap.get('entityRelationService'));

  const { of, forkJoin, switchMap } = widgetContext.rxjs;

  // Query existing measurements to get next ID
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

  assetService.findByQuery(assetSearchQuery).subscribe(
    function(measurements) {
      const nextMeasurementId = getNextMeasurementId(measurements);

      // Get project attributes (for latitude/longitude)
      attributeService.getEntityAttributes(projectId, 'SERVER_SCOPE', ['longitude', 'latitude', 'address']).subscribe(
        function(projectAttr) {
          const longitude = projectAttr.find(a => a.key === 'longitude')?.value;
          const latitude = projectAttr.find(a => a.key === 'latitude')?.value;
          const address = projectAttr.find(a => a.key === 'address')?.value;

          // Get customer shortName
          attributeService.getEntityAttributes(customerId, 'SERVER_SCOPE', ['shortName']).subscribe(
            function(customerAttr) {
              const shortNameAttr = customerAttr.find(a => a.key === 'shortName');
              const customerShortName = shortNameAttr ? shortNameAttr.value : '';

              openDialog({
                nextMeasurementId,
                projectName,
                projectId,
                customerId,
                longitude,
                latitude,
                address,
                customerShortName
              });
            },
            function(error) {
              console.error('Error fetching customer attributes:', error);
              openDialog({
                nextMeasurementId,
                projectName,
                projectId,
                customerId,
                longitude,
                latitude,
                address,
                customerShortName: ''
              });
            }
          );
        },
        function(error) {
          console.error('Error fetching project attributes:', error);
        }
      );
    },
    function(error) {
      console.error('Error querying measurements:', error);
    }
  );

  function getNextMeasurementId(measurements) {
    let maxNumber = 0;
    measurements.forEach(function(item) {
      const name = item.name;
      const parts = name.split('_');
      if (parts.length >= 2) {
        const number = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(number) && number > maxNumber) {
          maxNumber = number;
        }
      }
    });
    return maxNumber + 1;
  }

  function openDialog(config) {
    customDialog.customDialog(addMeasurementHtmlTemplate, AddMeasurementDialogController, config)
      .subscribe();
  }

  function AddMeasurementDialogController(instance) {
    const vm = instance;
    const config = vm.data;

    vm.isLoading = false;

    vm.addMeasurementFormGroup = vm.fb.group({
      name: [config.projectName + '_' + config.nextMeasurementId],
      label: [''],
      installationType: ['heating', [vm.validators.required]],
      measurementType: ['ultrasonic', [vm.validators.required]],
      connectKit: [false]
    });

    vm.cancel = function() {
      vm.dialogRef.close(null);
    };

    vm.save = function() {
      vm.isLoading = true;
      vm.addMeasurementFormGroup.markAsPristine();

      saveMeasurementObservable().subscribe(
        function(measurement) {
          const observables = [
            saveCustomerToMeasurementRelation(measurement.id),
            saveProjectToMeasurementRelation(measurement.id),
            saveAttributes(measurement.id)
          ];

          forkJoin(observables).subscribe(
            function() {
              vm.isLoading = false;
              widgetContext.updateAliases();

              const formValues = vm.addMeasurementFormGroup.value;
              const shouldConnectKit = formValues.connectKit && formValues.measurementType === 'ultrasonic';

              vm.dialogRef.close(null);

              // Call callback with measurement info
              if (callback) {
                callback({
                  id: measurement.id,
                  name: measurement.name,
                  label: formValues.label,
                  measurementType: formValues.measurementType,
                  connectKit: shouldConnectKit
                });
              }
            },
            function(error) {
              console.error('Error saving measurement relations/attributes:', error);
              vm.isLoading = false;
            }
          );
        },
        function(error) {
          console.error('Error saving measurement:', error);
          vm.isLoading = false;
        }
      );
    };

    function saveMeasurementObservable() {
      return getMeasurementsGroup().pipe(
        switchMap(function(measurementsGroup) {
          const formValues = vm.addMeasurementFormGroup.value;
          const measurement = {
            name: formValues.name,
            label: formValues.label || '',
            type: 'Measurement',
            customerId: config.customerId
          };
          return assetService.saveAsset(measurement, measurementsGroup.id.id);
        })
      );
    }

    function getMeasurementsGroup() {
      return entityGroupService.getEntityGroupsByOwnerId(
        config.customerId.entityType,
        config.customerId.id,
        'ASSET'
      ).pipe(
        switchMap(function(entityGroups) {
          const measurementsGroup = entityGroups.find(function(g) {
            return g.name === 'Measurements';
          });
          if (measurementsGroup) {
            return of(measurementsGroup);
          }
          const newGroup = {
            type: 'ASSET',
            name: 'Measurements',
            ownerId: config.customerId
          };
          return entityGroupService.saveEntityGroup(newGroup);
        })
      );
    }

    function saveCustomerToMeasurementRelation(measurementId) {
      const relation = {
        from: config.customerId,
        to: measurementId,
        typeGroup: 'COMMON',
        type: 'Owns'
      };
      return entityRelationService.saveRelation(relation);
    }

    function saveProjectToMeasurementRelation(measurementId) {
      const relation = {
        from: config.projectId,
        to: measurementId,
        typeGroup: 'COMMON',
        type: 'Owns'
      };
      return entityRelationService.saveRelation(relation);
    }

    function saveAttributes(entityId) {
      const formValues = vm.addMeasurementFormGroup.value;
      const attributesArray = [
        { key: 'latitude', value: config.latitude || null },
        { key: 'longitude', value: config.longitude || null },
        { key: 'address', value: config.address || '' },
        { key: 'installationType', value: formValues.installationType },
        { key: 'locationName', value: formValues.label },
        { key: 'measurementType', value: formValues.measurementType },
        { key: 'state', value: 'normal' },
        { key: 'progress', value: 'in preparation' },
        { key: 'active', value: 'true' },
        { key: 'units', value: 'metric' },
        { key: 'floorplan', value: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPCEtLSBDcmVhdGVkIHdpdGggSW5rc2NhcGUgKGh0dHA6Ly93d3cuaW5rc2NhcGUub3JnLykgLS0+Cjxzdmcgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDc5LjM3NSA3OS4zNzUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiA8cmVjdCB4PSIyLjcwMTkiIHk9IjIuNzAxOSIgd2lkdGg9IjczLjk3MSIgaGVpZ2h0PSI3My45NzEiIGZpbGw9IiNmZmYiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2Utd2lkdGg9Ii4xMTIxIiBzdHlsZT0icGFpbnQtb3JkZXI6bWFya2VycyBmaWxsIHN0cm9rZSIvPgogPGcgdHJhbnNmb3JtPSJtYXRyaXgoLjI2NDU4IDAgMCAuMjY0NTggMi42MzUgLTIuODgzNCkiIHN0cm9rZS13aWR0aD0iMXB4IiBzdHlsZT0ic2hhcGUtaW5zaWRlOnVybCgjcmVjdDQ4MzYpO3doaXRlLXNwYWNlOnByZSIgYXJpYS1sYWJlbD0iICAgTm8gcGxhbiBjb25maWd1cmVkIj4KICA8cGF0aCBkPSJtMTAxLjY3IDExOC4yOXYyOC40MzhoLTMuNzg5MWwtMTQuMzE2LTIxLjkzNHYyMS45MzRoLTMuNzY5NXYtMjguNDM4aDMuNzY5NWwxNC4zNzUgMjEuOTkydi0yMS45OTJ6Ii8+CiAgPHBhdGggZD0ibTEwNi44MyAxMzUuOTVxMC00LjU4OTggMi41NzgxLTcuNjU2MiAyLjU3ODEtMy4wODU5IDcuMDExNy0zLjA4NTl0Ny4wMTE3IDMuMDI3M3EyLjU3ODEgMy4wMDc4IDIuNjM2NyA3LjUxOTV2MC42NDQ1M3EwIDQuNTg5OC0yLjU5NzcgNy42NTYyLTIuNTc4MSAzLjA2NjQtNy4wMTE3IDMuMDY2NC00LjQ1MzEgMC03LjA1MDgtMy4wNjY0LTIuNTc4MS0zLjA2NjQtMi41NzgxLTcuNjU2MnptMy42MTMzIDAuNDQ5MjJxMCAzLjE0NDUgMS40ODQ0IDUuNDQ5MiAxLjUwMzkgMi4zMDQ3IDQuNTMxMiAyLjMwNDcgMi45NDkyIDAgNC40NTMxLTIuMjY1NiAxLjUwMzktMi4yODUyIDEuNTIzNC01LjQyOTd2LTAuNTA3ODFxMC0zLjEwNTUtMS41MDM5LTUuNDI5Ny0xLjUwMzktMi4zNDM4LTQuNTExNy0yLjM0MzgtMi45ODgzIDAtNC40OTIyIDIuMzQzOC0xLjQ4NDQgMi4zMjQyLTEuNDg0NCA1LjQyOTd6Ii8+CiAgPHBhdGggZD0ibTE1MC4xNyAxNDcuMTJxLTMuODA4NiAwLTYuMDM1Mi0yLjQ0MTR2MTAuMTc2aC0zLjYzMjh2LTI5LjI1OGgzLjMyMDNsMC4xNzU3OCAyLjMyNDJxMi4yMjY2LTIuNzE0OCA2LjExMzMtMi43MTQ4IDQuMDAzOSAwIDYuMTMyOCAyLjk2ODggMi4xMjg5IDIuOTY4OCAyLjEyODkgNy44MTI1djAuNDEwMTZxMCA0LjYyODktMi4xNDg0IDcuNjc1OC0yLjEyODkgMy4wNDY5LTYuMDU0NyAzLjA0Njl6bS0xLjExMzMtMTguODY3cS0zLjI4MTIgMC00LjkyMTkgMi45MTAydjEwLjExN3ExLjY2MDIgMi44NzExIDQuOTYwOSAyLjg3MTEgMi45Mjk3IDAgNC4yNzczLTIuMzA0NyAxLjM2NzItMi4zMDQ3IDEuMzY3Mi01LjQ0OTJ2LTAuNDEwMTZxMC0zLjE0NDUtMS4zNjcyLTUuNDI5Ny0xLjM0NzYtMi4zMDQ3LTQuMzE2NC0yLjMwNDd6Ii8+CiAgPHBhdGggZD0ibTE2Ni45MSAxMTYuNzN2MzBoLTMuNjMyOHYtMzB6Ii8+CiAgPHBhdGggZD0ibTE4NS43NSAxNDYuNzNxLTAuMzUxNTctMC43NjE3Mi0wLjUwNzgyLTIuMjI2Ni0xLjAxNTYgMS4wNzQyLTIuNTM5MSAxLjg1NTUtMS41MjM0IDAuNzYxNzItMy40NzY2IDAuNzYxNzItMy4yNDIyIDAtNS4xOTUzLTEuODE2NC0xLjk1MzEtMS44MTY0LTEuOTUzMS00LjQ1MzEgMC0zLjM5ODQgMi41NzgxLTUuMTU2MiAyLjU3ODEtMS43NzczIDYuOTMzNi0xLjc3NzNoMy41NzQydi0xLjY3OTdxMC0xLjg3NS0xLjEzMjgtMi45ODgzLTEuMTEzMy0xLjEzMjgtMy4zMjAzLTEuMTMyOC0yLjA1MDggMC0zLjMyMDMgMS4wMTU2LTEuMjUgMC45OTYxLTEuMjUgMi4zMjQyaC0zLjYxMzNxMC0yLjI2NTYgMi4yODUyLTQuMjU3OCAyLjI4NTItMS45OTIyIDYuMTEzMy0xLjk5MjIgMy40Mzc1IDAgNS42NDQ1IDEuNzU3OCAyLjIwNyAxLjc1NzggMi4yMDcgNS4zMTI1djkuNDkyMnEwIDIuOTI5NyAwLjc0MjE5IDQuNjQ4NHYwLjMxMjV6bS01Ljk5NjEtMi43NzM0cTEuOTUzMSAwIDMuMzc4OS0wLjk3NjU2IDEuNDQ1My0wLjk3NjU2IDIuMDMxMi0yLjE2OHYtNC4zNTU1aC0zLjM1OTRxLTYuMDkzOCAwLjExNzE5LTYuMDkzOCAzLjkwNjIgMCAxLjUwMzkgMS4wMTU2IDIuNTU4NiAxLjAxNTYgMS4wMzUyIDMuMDI3MyAxLjAzNTJ6Ii8+CiAgPHBhdGggZD0ibTIwMy4yMyAxMjguMjVxLTEuNzM4MyAwLTMuMDY2NCAwLjkzNzUtMS4zMjgxIDAuOTM3NS0yLjA4OTggMi40NDE0djE1LjA5OGgtMy42MTMzdi0yMS4xMzNoMy40MThsMC4xMTcxOSAyLjYzNjdxMi40MDIzLTMuMDI3MyA2LjMwODYtMy4wMjczIDMuMTA1NSAwIDQuOTIxOSAxLjczODMgMS44MzU5IDEuNzM4MyAxLjg1NTUgNS44Mzk4djEzLjk0NWgtMy42MzI4di0xMy44ODdxMC0yLjQ4MDUtMS4wOTM4LTMuNTM1Mi0xLjA3NDItMS4wNTQ3LTMuMTI1LTEuMDU0N3oiLz4KICA8cGF0aCBkPSJtNTcuOTQxIDE5NC4xNXExLjkzMzYgMCAzLjM3ODktMS4xNTIzIDEuNDY0OC0xLjE1MjMgMS42MDE2LTIuOTQ5MmgzLjQzNzVxLTAuMTM2NzIgMi44MzItMi41OTc3IDQuOTYwOS0yLjQ2MDkgMi4xMDk0LTUuODIwMyAyLjEwOTQtNC43NjU2IDAtNy4wODk4LTMuMTQ0NS0yLjMwNDctMy4xNDQ1LTIuMzA0Ny03LjQwMjN2LTAuODIwMzFxMC00LjI1NzggMi4zMDQ3LTcuNDAyNCAyLjMyNDItMy4xNDQ1IDcuMDg5OC0zLjE0NDUgMy43MTA5IDAgNS45OTYxIDIuMjA3IDIuMjg1MiAyLjE4NzUgMi40MjE5IDUuNDQ5MmgtMy40Mzc1cS0wLjEzNjcyLTEuOTUzMS0xLjQ4NDQtMy4zMjAzLTEuMzI4MS0xLjM2NzItMy40OTYxLTEuMzY3Mi0yLjIyNjYgMC0zLjQ5NjEgMS4xMzI4LTEuMjUgMS4xMzI4LTEuNzc3MyAyLjg3MTEtMC41MDc4MSAxLjczODMtMC41MDc4MSAzLjU3NDJ2MC44MjAzMXEwIDEuODU1NSAwLjUwNzgxIDMuNTkzOCAwLjUwNzgxIDEuNzM4MyAxLjc1NzggMi44NzExIDEuMjY5NSAxLjExMzMgMy41MTU2IDEuMTEzM3oiLz4KICA8cGF0aCBkPSJtNjkuNDY1IDE4NS45NXEwLTQuNTg5OCAyLjU3ODEtNy42NTYyIDIuNTc4MS0zLjA4NTkgNy4wMTE3LTMuMDg1OSA0LjQzMzYgMCA3LjAxMTcgMy4wMjczIDIuNTc4MSAzLjAwNzggMi42MzY3IDcuNTE5NXYwLjY0NDUzcTAgNC41ODk4LTIuNTk3NyA3LjY1NjItMi41NzgxIDMuMDY2NC03LjAxMTcgMy4wNjY0LTQuNDUzMSAwLTcuMDUwOC0zLjA2NjQtMi41NzgxLTMuMDY2NC0yLjU3ODEtNy42NTYyem0zLjYxMzMgMC40NDkyMnEwIDMuMTQ0NSAxLjQ4NDQgNS40NDkyIDEuNTAzOSAyLjMwNDcgNC41MzEyIDIuMzA0NyAyLjk0OTIgMCA0LjQ1MzEtMi4yNjU2IDEuNTAzOS0yLjI4NTIgMS41MjM0LTUuNDI5N3YtMC41MDc4MXEwLTMuMTA1NS0xLjUwMzktNS40Mjk3LTEuNTAzOS0yLjM0MzgtNC41MTE3LTIuMzQzOC0yLjk4ODMgMC00LjQ5MjIgMi4zNDM4LTEuNDg0NCAyLjMyNDItMS40ODQ0IDUuNDI5N3oiLz4KICA8cGF0aCBkPSJtMTAyIDE3OC4yNXEtMS43MzgzIDAtMy4wNjY0IDAuOTM3NS0xLjMyODEgMC45Mzc1LTIuMDg5OCAyLjQ0MTR2MTUuMDk4aC0zLjYxMzN2LTIxLjEzM2gzLjQxOGwwLjExNzE5IDIuNjM2N3EyLjQwMjMtMy4wMjczIDYuMzA4Ni0zLjAyNzMgMy4xMDU1IDAgNC45MjE5IDEuNzM4MyAxLjgzNTkgMS43MzgzIDEuODU1NSA1LjgzOTh2MTMuOTQ1aC0zLjYzMjh2LTEzLjg4N3EwLTIuNDgwNS0xLjA5MzgtMy41MzUyLTEuMDc0Mi0xLjA1NDctMy4xMjUtMS4wNTQ3eiIvPgogIDxwYXRoIGQ9Im0xMjQuNDYgMTc4LjM3aC00LjMxNjR2MTguMzU5aC0zLjYxMzN2LTE4LjM1OWgtMy4zMzk4di0yLjc3MzRoMy4zMzk4di0xLjgzNTlxMC0zLjU5MzggMi4wNzAzLTUuNTA3OCAyLjA3MDMtMS45MzM2IDUuNjY0MS0xLjkzMzYgMi4xODc1IDAgNS41MjczIDEuMTkxNGwtMC42MDU0NiAzLjA0NjlxLTIuNTM5MS0wLjk5NjA5LTQuNjY4LTAuOTk2MDktMi4zMjQyIDAtMy4zNTk0IDEuMDU0Ny0xLjAxNTYgMS4wMzUyLTEuMDE1NiAzLjE0NDV2MS44MzU5aDQuMzE2NHptNy4xMDk0LTIuNzczNHYyMS4xMzNoLTMuNjEzM3YtMjEuMTMzeiIvPgogIDxwYXRoIGQ9Im0xNDUuNTIgMjA1LjA3cS0xLjY0MDYgMC00LjAyMzQtMC44MDA3OC0yLjM4MjgtMC44MDA3OC0zLjgwODYtMi44NzExbDEuODk0NS0yLjE0ODRxMi4zNDM4IDIuODUxNiA1LjY2NDEgMi44NTE2IDIuNTU4NiAwIDQuMDgyLTEuNDQ1MyAxLjUyMzQtMS40MjU4IDEuNTIzNC00LjE5OTJ2LTEuODU1NXEtMi4xNDg0IDIuNTE5NS01LjkxOCAyLjUxOTUtMy44MDg2IDAtNi4wNTQ3LTMuMDQ2OS0yLjI0NjEtMy4wNDY5LTIuMjQ2MS03LjY3NTh2LTAuNDEwMTZxMC00Ljg0MzggMi4yMjY2LTcuODEyNSAyLjI0NjEtMi45Njg4IDYuMTEzMy0yLjk2ODggMy44ODY3IDAgNi4wMzUyIDIuNzM0NGwwLjE3NTc4LTIuMzQzOGgzLjI4MTJ2MjAuNjg0cTAgNC4xOTkyLTIuNSA2LjQ4NDQtMi41IDIuMzA0Ny02LjQ0NTMgMi4zMDQ3em0tNS4yNzM0LTE4LjY3MnEwIDMuMTQ0NSAxLjMwODYgNS40MTAyIDEuMzI4MSAyLjI0NjEgNC4yNTc4IDIuMjQ2MSAzLjQzNzUgMCA1LjAzOTEtMy4xMjV2LTkuNjI4OXEtMC42ODM1OS0xLjMwODYtMS44OTQ1LTIuMTY4LTEuMjEwOS0wLjg3ODktMy4xMDU1LTAuODc4OS0yLjk0OTIgMC00LjI3NzMgMi4zMDQ3LTEuMzI4MSAyLjI4NTItMS4zMjgxIDUuNDI5N3oiLz4KICA8cGF0aCBkPSJtMTczLjA2IDE5Ni43My0wLjA3ODEtMi4wODk4cS0yLjA3MDMgMi40ODA1LTYuMTcxOSAyLjQ4MDUtMy4xMDU1IDAtNS4wMTk1LTEuODM1OS0xLjkxNDEtMS44MzU5LTEuOTE0MS02LjA1NDd2LTEzLjYzM2gzLjYxMzN2MTMuNjcycTAgMi44NTE2IDEuMTkxNCAzLjgyODEgMS4yMTA5IDAuOTU3MDMgMi42OTUzIDAuOTU3MDMgNC4wODIgMCA1LjUwNzgtMy4wNjY0di0xNS4zOTFoMy42MzI4djIxLjEzM3oiLz4KICA8cGF0aCBkPSJtMTkwLjQ0IDE3OC42OHEtMy41MzUyIDAtNC44MjQyIDMuMDQ2OXYxNWgtMy42MTMzdi0yMS4xMzNoMy41MTU2bDAuMDc4MSAyLjQyMTlxMS43MzgzLTIuODEyNSA1LjAxOTUtMi44MTI1IDEuMDE1NiAwIDEuNjAxNiAwLjI3MzQ0bC0wLjAxOTUgMy4zNTk0cS0wLjgwMDc4LTAuMTU2MjUtMS43NTc4LTAuMTU2MjV6Ii8+CiAgPHBhdGggZD0ibTIxMS45MSAxOTMuMDRxLTEuMDM1MiAxLjU2MjUtMi45Mjk3IDIuODMyLTEuODk0NSAxLjI1LTUuMDE5NSAxLjI1LTQuNDE0MSAwLTcuMDcwMy0yLjg3MTEtMi42MzY3LTIuODcxMS0yLjYzNjctNy4zNDM4di0wLjgyMDMxcTAtMy40NTcgMS4zMDg2LTUuODc4OSAxLjMyODEtMi40NDE0IDMuNDM3NS0zLjcxMDkgMi4xMDk0LTEuMjg5MSA0LjQ5MjItMS4yODkxIDQuNTMxMiAwIDYuNjAxNiAyLjk2ODggMi4wODk4IDIuOTQ5MiAyLjA4OTggNy4zODI4djEuNjIxMWgtMTQuMjk3cTAuMDc4MSAyLjkxMDIgMS43MTg4IDQuOTYwOSAxLjY2MDIgMi4wMzEyIDQuNTUwOCAyLjAzMTIgMS45MTQxIDAgMy4yNDIyLTAuNzgxMjUgMS4zMjgxLTAuNzgxMjUgMi4zMjQyLTIuMDg5OHptLTguNDE4LTE0Ljg2M3EtMi4xNDg0IDAtMy42MzI4IDEuNTYyNS0xLjQ4NDQgMS41NjI1LTEuODU1NSA0LjQ5MjJoMTAuNTY2di0wLjI3MzQ0cS0wLjEzNjcyLTIuMTA5NC0xLjIzMDUtMy45NDUzLTEuMDc0Mi0xLjgzNTktMy44NDc3LTEuODM1OXoiLz4KICA8cGF0aCBkPSJtMjMwLjAzIDE5Ni43My0wLjE3NTc4LTIuMjY1NnEtMi4xNjggMi42NTYyLTYuMDM1MiAyLjY1NjItMy43MTA5IDAtNS45OTYxLTMuMDA3OC0yLjI4NTItMy4wMDc4LTIuMzI0Mi03LjU1ODZ2LTAuNTY2NDFxMC00Ljg0MzggMi4yODUyLTcuODEyNSAyLjMwNDctMi45Njg4IDYuMDc0Mi0yLjk2ODggMy43MzA1IDAgNS44NTk0IDIuNXYtMTAuOTc3aDMuNjMyOHYzMHptLTEwLjg5OC0xMC4zMzJxMCAzLjE0NDUgMS4zMjgxIDUuNDEwMiAxLjMyODEgMi4yNDYxIDQuMjU3OCAyLjI0NjEgMy4zNTk0IDAgNS0zLjA2NjR2LTkuNzI2NnEtMS42MjExLTMuMDA3OC00Ljk2MDktMy4wMDc4LTIuOTQ5MiAwLTQuMjk2OSAyLjMwNDctMS4zMjgxIDIuMjg1Mi0xLjMyODEgNS40Mjk3eiIvPgogPC9nPgo8L3N2Zz4K' }
      ];
      return attributeService.saveEntityAttributes(entityId, 'SERVER_SCOPE', attributesArray);
    }
  }
}

// ============================================================================
// MEASUREMENT PARAMETERS DIALOG
// ============================================================================

const measurementParametersHtmlTemplate = `<style>
/* ECO Design System - Embedded Styles for Measurement Parameters */
.measurement-parameters-form .eco-dialog-header,
mat-toolbar.eco-dialog-header {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  padding: 0 16px !important;
  height: 52px !important;
  min-height: 52px !important;
  background-color: #305680 !important;
  background: #305680 !important;
  color: white !important;
}
.measurement-parameters-form .eco-dialog-header .header-icon,
mat-toolbar.eco-dialog-header .header-icon {
  font-size: 22px !important;
  width: 22px !important;
  height: 22px !important;
  color: white !important;
}
.measurement-parameters-form .eco-dialog-header .header-title,
mat-toolbar.eco-dialog-header .header-title {
  margin: 0 !important;
  font-size: 17px !important;
  font-weight: 500 !important;
  color: white !important;
}
.measurement-parameters-form .eco-dialog-header .close-btn,
mat-toolbar.eco-dialog-header .close-btn {
  color: rgba(255,255,255,0.8) !important;
  margin-left: auto !important;
}
.measurement-parameters-form .eco-dialog-header mat-icon,
mat-toolbar.eco-dialog-header mat-icon {
  color: white !important;
}
.measurement-parameters-form .dialog-content {
  padding: 16px 20px !important;
  background: #f8fafc !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 12px !important;
  max-height: 70vh !important;
  overflow-y: auto !important;
}
.measurement-parameters-form .dialog-footer {
  display: flex !important;
  justify-content: flex-end !important;
  gap: 12px !important;
  padding: 12px 20px !important;
  border-top: 1px solid #e2e8f0 !important;
  background: #fafafa !important;
}
.measurement-parameters-form .section-card {
  background: white !important;
  border: 1px solid #e2e8f0 !important;
  border-left: 3px solid #305680 !important;
}
.measurement-parameters-form .section-header {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  padding: 10px 14px !important;
  background: #f1f5f9 !important;
  border-bottom: 1px solid #e2e8f0 !important;
  font-weight: 600 !important;
  font-size: 13px !important;
  color: #334155 !important;
  text-transform: uppercase !important;
}
.measurement-parameters-form .section-header mat-icon {
  font-size: 18px !important;
  width: 18px !important;
  height: 18px !important;
  color: #305680 !important;
}
.measurement-parameters-form .section-body {
  padding: 12px 14px !important;
}
.measurement-parameters-form .pump-subsection {
  margin-top: 8px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px dashed #cbd5e1;
}
.measurement-parameters-form .aux-sensor-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin-bottom: 8px;
}
.measurement-parameters-form .aux-sensor-row:last-child {
  margin-bottom: 0;
}
/* Schedule Expansion Panel Styles */
.measurement-parameters-form .schedule-panel {
  margin-bottom: 16px !important;
  border-radius: 8px !important;
}
.measurement-parameters-form .schedule-content {
  padding: 8px 0 16px 0;
}
.measurement-parameters-form .section-header-clickable {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;
}
.measurement-parameters-form .section-header-clickable:hover {
  background: #e8f0f8 !important;
}
.measurement-parameters-form .schedule-summary {
  font-size: 12px;
  color: #64748b;
  font-weight: 400;
  text-transform: none;
  margin-left: 12px;
}
.measurement-parameters-form .expand-icon {
  color: #64748b !important;
  transition: transform 0.2s ease;
}
.measurement-parameters-form .schedule-header-clickable {
  cursor: pointer;
}
.measurement-parameters-form .schedule-header-clickable:hover {
  background: #e8f4fd;
}
.measurement-parameters-form .schedule-summary {
  margin-left: auto;
  font-size: 12px;
  color: #64748b;
  font-weight: 400;
  padding-right: 8px;
}
.measurement-parameters-form .expand-chevron {
  color: #94a3b8 !important;
  font-size: 20px !important;
  width: 20px !important;
  height: 20px !important;
  transition: transform 0.2s;
}
.measurement-parameters-form .expand-chevron.expanded {
  transform: rotate(180deg);
}
/* Weekly Schedule - Day Pills Design */
.measurement-parameters-form .day-pills-row {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}
.measurement-parameters-form .day-pill {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid #e2e8f0;
  background: #fff;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}
.measurement-parameters-form .day-pill:hover {
  border-color: #2196f3;
  color: #2196f3;
}
.measurement-parameters-form .day-pill.active {
  background: #2196f3;
  border-color: #2196f3;
  color: #fff;
}
.measurement-parameters-form .day-pill.active:hover {
  background: #1976d2;
  border-color: #1976d2;
}
.measurement-parameters-form .time-range-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.measurement-parameters-form .time-input {
  width: 100px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  font-family: inherit;
  color: rgba(0,0,0,0.85);
  background: #fff;
  transition: border-color 0.2s;
}
.measurement-parameters-form .time-input:hover {
  border-color: #40a9ff;
}
.measurement-parameters-form .time-input:focus {
  outline: none;
  border-color: #2196f3;
  box-shadow: 0 0 0 2px rgba(33,150,243,0.1);
}
.measurement-parameters-form .time-separator {
  color: rgba(0,0,0,0.45);
  font-size: 13px;
  font-weight: 500;
}
.measurement-parameters-form .schedule-presets {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}
.measurement-parameters-form .presets-label {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.measurement-parameters-form .schedule-presets button {
  font-size: 11px;
  padding: 2px 10px;
  min-height: 26px;
  line-height: 1.2;
}
.measurement-parameters-form .timezone-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}
.measurement-parameters-form .timezone-label {
  font-size: 12px;
  color: #64748b;
  min-width: 65px;
}
.measurement-parameters-form .timezone-select {
  width: 140px;
}
.measurement-parameters-form .timezone-hint {
  font-size: 11px;
  color: #94a3b8;
  font-style: italic;
}
</style>
<form [formGroup]="parametersFormGroup" (ngSubmit)="save()" class="measurement-parameters-form" style="width: 700px;">
  <mat-toolbar class="eco-dialog-header">
    <mat-icon class="header-icon">tune</mat-icon>
    <h2 class="header-title">Edit Measurement Parameters</h2>
    <span class="flex-1"></span>
    <button mat-icon-button (click)="cancel()" type="button" class="close-btn">
      <mat-icon>close</mat-icon>
    </button>
  </mat-toolbar>

  <mat-progress-bar color="warn" mode="indeterminate" *ngIf="isLoading"></mat-progress-bar>
  <div style="height: 4px;" *ngIf="!isLoading"></div>

  <div class="dialog-content">

    <!-- Measurement Info Section -->
    <div class="section-card">
      <div class="section-header">
        <mat-icon>sensors</mat-icon>
        <span>Measurement</span>
      </div>
      <div class="section-body">
      <mat-form-field appearance="fill" class="w-full">
        <mat-label>Name (System)</mat-label>
        <input matInput [value]="entityName" readonly disabled>
      </mat-form-field>
      <mat-form-field appearance="fill" class="w-full">
        <mat-label>Label</mat-label>
        <input matInput formControlName="entityLabel" placeholder="Display name for this measurement">
      </mat-form-field>
      <div class="flex gap-2">
        <mat-form-field appearance="fill" style="flex: 1;">
          <mat-label>Measurement Type</mat-label>
          <mat-select formControlName="measurementType" [disabled]="!canEditMeasurementType">
            <mat-select-trigger>
              <div class="flex items-center gap-2">
                <mat-icon *ngIf="parametersFormGroup.get('measurementType')?.value === 'ultrasonic'" style="font-size: 18px; width: 18px; height: 18px; color: #c62828;">sensors</mat-icon>
                <mat-icon *ngIf="parametersFormGroup.get('measurementType')?.value === 'lorawan'" style="font-size: 18px; width: 18px; height: 18px; color: #7b1fa2;">wifi</mat-icon>
                <mat-icon *ngIf="parametersFormGroup.get('measurementType')?.value === 'import'" style="font-size: 18px; width: 18px; height: 18px; color: #1565c0;">upload_file</mat-icon>
                <mat-icon *ngIf="parametersFormGroup.get('measurementType')?.value === 'interpolation'" style="font-size: 18px; width: 18px; height: 18px; color: #00695c;">timeline</mat-icon>
                <span *ngIf="parametersFormGroup.get('measurementType')?.value === 'ultrasonic'">Ultrasonic</span>
                <span *ngIf="parametersFormGroup.get('measurementType')?.value === 'lorawan'">LoRaWAN</span>
                <span *ngIf="parametersFormGroup.get('measurementType')?.value === 'import'">Import</span>
                <span *ngIf="parametersFormGroup.get('measurementType')?.value === 'interpolation'">Interpolation</span>
              </div>
            </mat-select-trigger>
            <mat-option value="ultrasonic">
              <div class="flex items-center gap-2">
                <mat-icon style="font-size: 18px; width: 18px; height: 18px; color: #c62828;">sensors</mat-icon>
                <span>Ultrasonic</span>
              </div>
            </mat-option>
            <mat-option value="lorawan">
              <div class="flex items-center gap-2">
                <mat-icon style="font-size: 18px; width: 18px; height: 18px; color: #7b1fa2;">wifi</mat-icon>
                <span>LoRaWAN</span>
              </div>
            </mat-option>
            <mat-option value="import">
              <div class="flex items-center gap-2">
                <mat-icon style="font-size: 18px; width: 18px; height: 18px; color: #1565c0;">upload_file</mat-icon>
                <span>Import</span>
              </div>
            </mat-option>
            <mat-option value="interpolation">
              <div class="flex items-center gap-2">
                <mat-icon style="font-size: 18px; width: 18px; height: 18px; color: #00695c;">timeline</mat-icon>
                <span>Interpolation</span>
              </div>
            </mat-option>
          </mat-select>
          <mat-hint *ngIf="!canEditMeasurementType">
            Type can only be changed in preparation/planned status
          </mat-hint>
        </mat-form-field>
        <mat-form-field appearance="fill" style="flex: 1;">
          <mat-label>Measurement Role</mat-label>
          <mat-select formControlName="measurementRole">
            <mat-option value="generator">Generator</mat-option>
            <mat-option value="circuit">Circuit</mat-option>
            <mat-option value="subDistribution">Sub-Distribution</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
    </div>
    </div>

    <!-- Status Section (Progress, Start/End Time) -->
    <div class="section-card">
      <div class="section-header">
        <mat-icon>timeline</mat-icon>
        <span>Status</span>
      </div>
      <div class="section-body">

      <!-- Progress -->
      <mat-form-field appearance="fill" class="w-full">
        <mat-label>Progress</mat-label>
        <mat-select formControlName="progress">
          <mat-option value="in preparation">In Preparation</mat-option>
          <mat-option value="active">Active</mat-option>
          <mat-option value="finished">Finished</mat-option>
          <mat-option value="aborted">Aborted</mat-option>
        </mat-select>
      </mat-form-field>

      <!-- Start Date and Time -->
      <div class="flex gap-2">
        <mat-form-field appearance="fill" style="flex: 1.5;">
          <mat-label>Start Date</mat-label>
          <mat-datetimepicker-toggle [for]="startDatePicker" matSuffix></mat-datetimepicker-toggle>
          <mat-datetimepicker #startDatePicker type="date" openOnFocus="true"></mat-datetimepicker>
          <input matInput formControlName="startDate" [matDatetimepicker]="startDatePicker">
        </mat-form-field>
        <mat-form-field appearance="fill" style="flex: 1;">
          <mat-label>Start Time</mat-label>
          <mat-datetimepicker-toggle [for]="startTimePicker" matSuffix></mat-datetimepicker-toggle>
          <mat-datetimepicker #startTimePicker type="time" openOnFocus="true"></mat-datetimepicker>
          <input matInput formControlName="startTime" [matDatetimepicker]="startTimePicker">
        </mat-form-field>
      </div>

      <!-- End Date and Time -->
      <div class="flex gap-2">
        <mat-form-field appearance="fill" style="flex: 1.5;">
          <mat-label>End Date</mat-label>
          <mat-datetimepicker-toggle [for]="endDatePicker" matSuffix></mat-datetimepicker-toggle>
          <mat-datetimepicker #endDatePicker type="date" openOnFocus="true"></mat-datetimepicker>
          <input matInput formControlName="endDate" [matDatetimepicker]="endDatePicker">
        </mat-form-field>
        <mat-form-field appearance="fill" style="flex: 1;">
          <mat-label>End Time</mat-label>
          <mat-datetimepicker-toggle [for]="endTimePicker" matSuffix></mat-datetimepicker-toggle>
          <mat-datetimepicker #endTimePicker type="time" openOnFocus="true"></mat-datetimepicker>
          <input matInput formControlName="endTime" [matDatetimepicker]="endTimePicker">
        </mat-form-field>
      </div>
    </div>
    </div>

    <!-- Classification Section (renamed from Installation) -->
    <div class="section-card">
      <div class="section-header">
        <mat-icon>category</mat-icon>
        <span>Classification</span>
      </div>
      <div class="section-body">
      <div class="flex gap-2">
        <mat-form-field appearance="fill" style="flex: 1;">
          <mat-label>Installation Type</mat-label>
          <mat-select formControlName="installationType">
            <mat-option value="heating">Heating</mat-option>
            <mat-option value="cooling">Cooling</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="fill" style="flex: 1.5;">
          <mat-label>System Type</mat-label>
          <mat-select formControlName="systemType">
            <ng-container *ngIf="parametersFormGroup.get('installationType')?.value === 'heating'">
              <mat-option value="radiator">Radiator</mat-option>
              <mat-option value="floorHeating">Floor Heating</mat-option>
              <mat-option value="fanCoil">Fan Coil</mat-option>
              <mat-option value="ahuCoil">AHU Coil</mat-option>
              <mat-option value="districtHeating">District Heating</mat-option>
            </ng-container>
            <ng-container *ngIf="parametersFormGroup.get('installationType')?.value === 'cooling'">
              <mat-option value="fanCoil">Fan Coil</mat-option>
              <mat-option value="ahuCoil">AHU Coil</mat-option>
              <mat-option value="chiller">Chiller</mat-option>
            </ng-container>
          </mat-select>
        </mat-form-field>
      </div>
    </div>
    </div>

    <!-- Hydraulics Section (NEW) -->
    <div class="section-card">
      <div class="section-header">
        <mat-icon>water_drop</mat-icon>
        <span>Hydraulics</span>
      </div>
      <div class="section-body">
      <div class="flex gap-2">
        <mat-form-field appearance="fill" style="flex: 1;">
          <mat-label>Hydraulic Scheme</mat-label>
          <mat-select formControlName="hydraulicScheme">
            <mat-option value="direct">Direct</mat-option>
            <mat-option value="mixingValve">Mixing Valve</mat-option>
            <mat-option value="injection">Injection</mat-option>
            <mat-option value="separator">Separator</mat-option>
            <mat-option value="buffer">Buffer</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="fill" style="flex: 1;">
          <mat-label>Fluid Type</mat-label>
          <mat-select formControlName="fluidType">
            <mat-option value="water">Water</mat-option>
            <mat-option value="glycol20">Glycol 20%</mat-option>
            <mat-option value="glycol30">Glycol 30%</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
    </div>
    </div>

    <!-- Design Section (NEW) -->
    <div class="section-card">
      <div class="section-header">
        <mat-icon>design_services</mat-icon>
        <span>Design</span>
      </div>
      <div class="section-body">
      <div class="flex gap-2">
        <mat-form-field appearance="fill" style="flex: 1;">
          <mat-label>Design Flow Temp. (°C)</mat-label>
          <input matInput formControlName="designFlowTemp" type="number">
        </mat-form-field>
        <mat-form-field appearance="fill" style="flex: 1;">
          <mat-label>Design Return Temp. (°C)</mat-label>
          <input matInput formControlName="designReturnTemp" type="number">
        </mat-form-field>
        <mat-form-field appearance="fill" style="flex: 1;">
          <mat-label>Design ΔT (K)</mat-label>
          <input matInput formControlName="designDeltaT" type="number">
        </mat-form-field>
      </div>
      <div class="flex gap-2">
        <mat-form-field appearance="fill" style="flex: 1;">
          <mat-label>Design Power (kW)</mat-label>
          <input matInput formControlName="designPower" type="number">
        </mat-form-field>
        <mat-form-field appearance="fill" style="flex: 1;">
          <mat-label>Design Flow (m³/h)</mat-label>
          <input matInput formControlName="designFlow" type="number">
        </mat-form-field>
      </div>
    </div>
    </div>

    <!-- Pipe & Valve Section (renamed from Dimension) -->
    <div class="section-card">
      <div class="section-header">
        <mat-icon>plumbing</mat-icon>
        <span>Pipe & Valve</span>
      </div>
      <div class="section-body">
      <div class="flex gap-2">
        <mat-form-field appearance="fill" style="flex: 1;">
          <mat-label>Pipe Dimension</mat-label>
          <mat-select formControlName="pipeDimension">
            <mat-option *ngFor="let dim of pipeDimensionOptions" [value]="dim">{{ dim }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="fill" style="flex: 1;">
          <mat-label>Valve Dimension</mat-label>
          <mat-select formControlName="valveDimension">
            <mat-option *ngFor="let dim of valveDimensionOptions" [value]="dim">{{ dim }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="fill" style="flex: 1;">
          <mat-label>Valve Kvs (m³/h)</mat-label>
          <input matInput formControlName="valveKvs" type="number">
        </mat-form-field>
      </div>
    </div>
    </div>

    <!-- Operation / ON-OFF Section (NEW) -->
    <div class="section-card">
      <div class="section-header">
        <mat-icon>power_settings_new</mat-icon>
        <span>Operation / ON-OFF</span>
      </div>
      <div class="section-body">
      <div class="flex gap-2">
        <mat-form-field appearance="fill" style="flex: 1;">
          <mat-label>Flow ON Threshold (m³/h)</mat-label>
          <input matInput formControlName="flowOnThreshold" type="number" step="0.001">
        </mat-form-field>
        <mat-form-field appearance="fill" style="flex: 1;">
          <mat-label>Hysteresis (min)</mat-label>
          <input matInput formControlName="hysteresisMinutes" type="number">
        </mat-form-field>
      </div>
    </div>
    </div>

    <!-- Pump Section (NEW) -->
    <div class="section-card">
      <div class="section-header">
        <mat-icon>settings_input_component</mat-icon>
        <span>Pump</span>
      </div>
      <div class="section-body">
      <mat-checkbox formControlName="pumpPresent" style="margin-bottom: 8px;">Pump Present</mat-checkbox>
      <div class="pump-subsection" *ngIf="parametersFormGroup.get('pumpPresent')?.value">
        <div class="flex gap-2">
          <mat-form-field appearance="fill" style="flex: 1;">
            <mat-label>Pump Control Type</mat-label>
            <mat-select formControlName="pumpControlType">
              <mat-option value="constant">Constant</mat-option>
              <mat-option value="variable">Variable</mat-option>
              <mat-option value="unknown">Unknown</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="fill" style="flex: 1;">
            <mat-label>Pump Rated Power (kW)</mat-label>
            <input matInput formControlName="pumpRatedPower" type="number" step="0.01">
          </mat-form-field>
        </div>
      </div>
    </div>
    </div>

    <!-- Auxiliary Sensors Section (NEW) -->
    <div class="section-card">
      <div class="section-header">
        <mat-icon>thermostat</mat-icon>
        <span>Auxiliary Sensors</span>
      </div>
      <div class="section-body" formGroupName="auxSensors">
      <div class="aux-sensor-row" formGroupName="auxSensor1">
        <mat-form-field appearance="fill" style="flex: 1;">
          <mat-label>Sensor 1 Label</mat-label>
          <input matInput formControlName="label" placeholder="e.g. Mixer Output">
        </mat-form-field>
        <mat-form-field appearance="fill" style="flex: 1;">
          <mat-label>Location</mat-label>
          <mat-select formControlName="location">
            <mat-option value="">None</mat-option>
            <mat-option value="mixerPortA">Mixer Port A</mat-option>
            <mat-option value="mixerPortB">Mixer Port B</mat-option>
            <mat-option value="afterSeparator">After Separator</mat-option>
            <mat-option value="beforeSeparator">Before Separator</mat-option>
            <mat-option value="secondaryFlow">Secondary Flow</mat-option>
            <mat-option value="secondaryReturn">Secondary Return</mat-option>
            <mat-option value="bufferTop">Buffer Top</mat-option>
            <mat-option value="bufferBottom">Buffer Bottom</mat-option>
            <mat-option value="custom">Custom</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
      <div class="aux-sensor-row" formGroupName="auxSensor2">
        <mat-form-field appearance="fill" style="flex: 1;">
          <mat-label>Sensor 2 Label</mat-label>
          <input matInput formControlName="label" placeholder="e.g. Buffer Top">
        </mat-form-field>
        <mat-form-field appearance="fill" style="flex: 1;">
          <mat-label>Location</mat-label>
          <mat-select formControlName="location">
            <mat-option value="">None</mat-option>
            <mat-option value="mixerPortA">Mixer Port A</mat-option>
            <mat-option value="mixerPortB">Mixer Port B</mat-option>
            <mat-option value="afterSeparator">After Separator</mat-option>
            <mat-option value="beforeSeparator">Before Separator</mat-option>
            <mat-option value="secondaryFlow">Secondary Flow</mat-option>
            <mat-option value="secondaryReturn">Secondary Return</mat-option>
            <mat-option value="bufferTop">Buffer Top</mat-option>
            <mat-option value="bufferBottom">Buffer Bottom</mat-option>
            <mat-option value="custom">Custom</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
    </div>
    </div>

    <!-- Area Section (extracted from Analysis) -->
    <div class="section-card">
      <div class="section-header">
        <mat-icon>square_foot</mat-icon>
        <span>Area</span>
      </div>
      <div class="section-body" formGroupName="area">
      <div class="flex gap-2">
        <mat-form-field appearance="fill" style="flex: 1.5;">
          <mat-label>Area Value</mat-label>
          <input matInput formControlName="value" type="number">
        </mat-form-field>
        <mat-form-field appearance="fill" style="flex: 1;">
          <mat-label>Unit</mat-label>
          <mat-select formControlName="unit">
            <mat-option value="m²">m²</mat-option>
            <mat-option value="ft²">ft²</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
    </div>
    </div>

    <!-- Weekly Operating Schedule - COLLAPSIBLE with Day Pills -->
    <div class="section-card" formGroupName="weeklySchedule">
      <div class="section-header schedule-header-clickable" (click)="scheduleExpanded = !scheduleExpanded">
        <mat-icon>schedule</mat-icon>
        <span>Weekly Operating Schedule</span>
        <span class="schedule-summary">{{ getScheduleSummary() }}</span>
        <mat-icon class="expand-chevron" [class.expanded]="scheduleExpanded">expand_more</mat-icon>
      </div>
      <div class="section-body" *ngIf="scheduleExpanded">
        <!-- Day Pills Row -->
        <div class="day-pills-row">
          <div class="day-pill" [class.active]="parametersFormGroup.get('weeklySchedule.monday.enabled').value"
               (click)="toggleDay('monday')" formGroupName="monday">Mo</div>
          <div class="day-pill" [class.active]="parametersFormGroup.get('weeklySchedule.tuesday.enabled').value"
               (click)="toggleDay('tuesday')" formGroupName="tuesday">Tu</div>
          <div class="day-pill" [class.active]="parametersFormGroup.get('weeklySchedule.wednesday.enabled').value"
               (click)="toggleDay('wednesday')" formGroupName="wednesday">We</div>
          <div class="day-pill" [class.active]="parametersFormGroup.get('weeklySchedule.thursday.enabled').value"
               (click)="toggleDay('thursday')" formGroupName="thursday">Th</div>
          <div class="day-pill" [class.active]="parametersFormGroup.get('weeklySchedule.friday.enabled').value"
               (click)="toggleDay('friday')" formGroupName="friday">Fr</div>
          <div class="day-pill" [class.active]="parametersFormGroup.get('weeklySchedule.saturday.enabled').value"
               (click)="toggleDay('saturday')" formGroupName="saturday">Sa</div>
          <div class="day-pill" [class.active]="parametersFormGroup.get('weeklySchedule.sunday.enabled').value"
               (click)="toggleDay('sunday')" formGroupName="sunday">Su</div>
        </div>
        <!-- Time Range Row -->
        <div class="time-range-row">
          <input type="time" class="time-input" [formControl]="scheduleStartTime" step="1800">
          <span class="time-separator">–</span>
          <input type="time" class="time-input" [formControl]="scheduleEndTime" step="1800">
        </div>
        <!-- Quick Presets -->
        <div class="schedule-presets">
          <span class="presets-label">Presets:</span>
          <button mat-stroked-button type="button" (click)="applyPreset('weekdays')">Weekdays 06-18</button>
          <button mat-stroked-button type="button" (click)="applyPreset('office')">Office 08-17</button>
          <button mat-stroked-button type="button" (click)="applyPreset('247')">24/7</button>
          <button mat-stroked-button type="button" (click)="applyPreset('clear')">Clear</button>
        </div>
        <!-- Timezone Selection -->
        <div class="timezone-row">
          <span class="timezone-label">Timezone:</span>
          <mat-select formControlName="timezoneOffset" class="timezone-select">
            <mat-option *ngFor="let tz of timezoneOptions" [value]="tz.value">{{ tz.label }}</mat-option>
          </mat-select>
          <span class="timezone-hint">(DST auto-detected)</span>
        </div>
      </div>
    </div>

  </div>

  <div class="dialog-footer">
    <button mat-button type="button" [disabled]="isLoading" (click)="cancel()">
      Cancel
    </button>
    <button mat-raised-button color="primary" type="submit" [disabled]="isLoading || parametersFormGroup.invalid">
      <mat-icon style="font-size: 18px; width: 18px; height: 18px; margin-right: 4px;">save</mat-icon>
      Save
    </button>
  </div>
</form>`;

const measurementParametersCss = `.measurement-parameters-form .mdc-text-field--filled:not(.mdc-text-field--disabled) {
  background-color: #F4F9FE !important;
}
.measurement-parameters-form .mat-mdc-form-field-focus-overlay {
  background-color: #F4F9FE !important;
}
.measurement-parameters-form .fieldset {
  margin-bottom: 16px;
}`;

/**
 * Opens the Measurement Parameters dialog
 *
 * @param {Object} widgetContext - ThingsBoard widget context
 * @param {Object} measurementId - Measurement entity ID { id: string, entityType: 'ASSET' }
 * @param {Function} callback - Optional callback after parameters are saved
 */
export function openMeasurementParametersDialog(widgetContext, measurementId, callback) {
  const $injector = widgetContext.$scope.$injector;
  const customDialog = $injector.get(widgetContext.servicesMap.get('customDialog'));
  const attributeService = $injector.get(widgetContext.servicesMap.get('attributeService'));
  const assetService = $injector.get(widgetContext.servicesMap.get('assetService'));

  // Fetch asset info first, then attributes
  let fetchedAttributes = [];
  let fetchedAsset = null;

  assetService.getAsset(measurementId.id).subscribe(
    function(asset) {
      fetchedAsset = asset;
      fetchAttributes();
    },
    function(error) {
      console.error('Error fetching asset:', error);
      fetchAttributes();
    }
  );

  function fetchAttributes() {
    attributeService.getEntityAttributes(measurementId, 'SERVER_SCOPE').subscribe(
      function(attributes) {
        fetchedAttributes = attributes;
        openDialog();
      },
      function(error) {
        console.error('Error fetching attributes:', error);
        openDialog();
      }
    );
  }

  function openDialog() {
    customDialog.customDialog(measurementParametersHtmlTemplate, MeasurementParametersDialogController, {
      measurementId,
      attributes: fetchedAttributes,
      entityName: fetchedAsset ? fetchedAsset.name : '',
      entityLabel: fetchedAsset ? fetchedAsset.label : ''
    }, measurementParametersCss).subscribe();
  }

  function MeasurementParametersDialogController(instance) {
    const vm = instance;
    const config = vm.data;

    vm.isLoading = false;
    vm.measurementId = config.measurementId;
    vm.entityName = config.entityName || '';
    vm.originalEntityLabel = config.entityLabel || '';
    vm.canEditMeasurementType = true; // Will be set based on progress
    vm.scheduleExpanded = false; // Collapsed by default

    // Shared schedule time controls (for Day-Pills UI)
    vm.scheduleStartTime = vm.fb.control('06:00');
    vm.scheduleEndTime = vm.fb.control('22:00');

    // Options for dropdowns
    vm.pipeDimensionOptions = ['DN15', 'DN20', 'DN25', 'DN32', 'DN40', 'DN50', 'DN65', 'DN80', 'DN100', 'DN125', 'DN150'];
    vm.valveDimensionOptions = ['DN15', 'DN20', 'DN25', 'DN32', 'DN40', 'DN50', 'DN65', 'DN80', 'DN100'];

    // Weekly schedule options
    vm.weekDays = [
      { key: 'monday', label: 'Mon' },
      { key: 'tuesday', label: 'Tue' },
      { key: 'wednesday', label: 'Wed' },
      { key: 'thursday', label: 'Thu' },
      { key: 'friday', label: 'Fri' },
      { key: 'saturday', label: 'Sat' },
      { key: 'sunday', label: 'Sun' }
    ];

    // Generate time options (00:00, 00:30, 01:00, ..., 23:30)
    vm.timeOptions = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        vm.timeOptions.push(String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'));
      }
    }

    // Timezone options (offset in minutes from UTC)
    vm.timezoneOptions = [
      { value: 0, label: 'UTC (GMT)' },
      { value: 60, label: 'CET (UTC+1)' },
      { value: 120, label: 'CEST (UTC+2)' },
      { value: -300, label: 'EST (UTC-5)' },
      { value: -360, label: 'CST (UTC-6)' }
    ];

    // Create form group with new structure
    vm.parametersFormGroup = vm.fb.group({
      // Measurement info
      entityLabel: [''],
      measurementType: ['ultrasonic'],
      measurementRole: [null],
      // Status fields
      progress: ['in preparation'],
      startDate: [null],
      startTime: [null],
      endDate: [null],
      endTime: [null],
      // Classification fields (renamed from Installation)
      installationType: [null],
      systemType: [null],
      // Hydraulics fields (NEW)
      hydraulicScheme: [null],
      fluidType: ['water'],
      // Design fields (NEW)
      designFlowTemp: [null],
      designReturnTemp: [null],
      designDeltaT: [null],
      designPower: [null],
      designFlow: [null],
      // Pipe & Valve fields (renamed/extended from Dimension)
      pipeDimension: [null],
      valveDimension: [null],
      valveKvs: [null],
      // Operation / ON-OFF fields (NEW)
      flowOnThreshold: [null],
      hysteresisMinutes: [null],
      // Pump fields (NEW)
      pumpPresent: [false],
      pumpControlType: [null],
      pumpRatedPower: [null],
      // Auxiliary sensors (NEW)
      auxSensors: vm.fb.group({
        auxSensor1: vm.fb.group({
          label: [''],
          location: ['']
        }),
        auxSensor2: vm.fb.group({
          label: [''],
          location: ['']
        })
      }),
      // Area (restructured)
      area: vm.fb.group({
        value: [null],
        unit: ['m²']
      }),
      // Weekly schedule (with time ranges and timezone)
      weeklySchedule: vm.fb.group({
        timezoneOffset: [60],  // Minutes from UTC (60 = CET, 120 = CEST)
        monday: vm.fb.group({ enabled: [false], start: ['06:00'], end: ['22:00'] }),
        tuesday: vm.fb.group({ enabled: [false], start: ['06:00'], end: ['22:00'] }),
        wednesday: vm.fb.group({ enabled: [false], start: ['06:00'], end: ['22:00'] }),
        thursday: vm.fb.group({ enabled: [false], start: ['06:00'], end: ['22:00'] }),
        friday: vm.fb.group({ enabled: [false], start: ['06:00'], end: ['22:00'] }),
        saturday: vm.fb.group({ enabled: [false], start: ['06:00'], end: ['22:00'] }),
        sunday: vm.fb.group({ enabled: [false], start: ['06:00'], end: ['22:00'] })
      })
    });

    // Initialize form with existing values
    initializeFormValues(config.attributes);
    setupFormSubscriptions();

    function initializeFormValues(attributes) {
      const attributeMap = {};
      attributes.forEach(function(attr) {
        attributeMap[attr.key] = attr.value;
      });

      // Measurement info
      vm.parametersFormGroup.get('entityLabel').setValue(vm.originalEntityLabel);
      if (attributeMap.measurementType) {
        vm.parametersFormGroup.get('measurementType').setValue(attributeMap.measurementType);
      }
      if (attributeMap.measurementRole) {
        vm.parametersFormGroup.get('measurementRole').setValue(attributeMap.measurementRole);
      }

      // Status fields
      if (attributeMap.progress) {
        vm.parametersFormGroup.get('progress').setValue(attributeMap.progress);
        // MeasurementType can only be edited in preparation/planned status
        vm.canEditMeasurementType = (attributeMap.progress === 'in preparation' || attributeMap.progress === 'planned');
        // Programmatically disable the measurementType control (template [disabled] doesn't work reliably)
        if (!vm.canEditMeasurementType) {
          vm.parametersFormGroup.get('measurementType').disable();
        }
      }
      if (attributeMap.startTimeMs) {
        const startDateTime = new Date(Number(attributeMap.startTimeMs));
        vm.parametersFormGroup.get('startDate').setValue(startDateTime);
        vm.parametersFormGroup.get('startTime').setValue(startDateTime);
      }
      if (attributeMap.endTimeMs) {
        const endDateTime = new Date(Number(attributeMap.endTimeMs));
        vm.parametersFormGroup.get('endDate').setValue(endDateTime);
        vm.parametersFormGroup.get('endTime').setValue(endDateTime);
      }

      // Classification fields
      if (attributeMap.installationType) {
        vm.parametersFormGroup.get('installationType').setValue(attributeMap.installationType);
      }
      // Support both new systemType and legacy installationTypeOptions
      if (attributeMap.systemType) {
        vm.parametersFormGroup.get('systemType').setValue(attributeMap.systemType);
      } else if (attributeMap.installationTypeOptions) {
        // Map legacy values to new systemType values
        const legacyToNew = {
          radiatorHeating: 'radiator',
          floorHeating: 'floorHeating',
          districtHeating: 'districtHeating',
          heatingOther: null,
          coolingCircuit: 'fanCoil',
          coolingCeiling: 'fanCoil',
          chiller: 'chiller',
          coolingOther: null
        };
        vm.parametersFormGroup.get('systemType').setValue(legacyToNew[attributeMap.installationTypeOptions] || null);
      }

      // Hydraulics fields
      if (attributeMap.hydraulicScheme) {
        vm.parametersFormGroup.get('hydraulicScheme').setValue(attributeMap.hydraulicScheme);
      }
      if (attributeMap.fluidType) {
        vm.parametersFormGroup.get('fluidType').setValue(attributeMap.fluidType);
      }

      // Design fields (support both new and legacy attribute names)
      if (attributeMap.designFlowTemp) {
        vm.parametersFormGroup.get('designFlowTemp').setValue(attributeMap.designFlowTemp);
      }
      if (attributeMap.designReturnTemp) {
        vm.parametersFormGroup.get('designReturnTemp').setValue(attributeMap.designReturnTemp);
      }
      // Support both designDeltaT (new) and deltaT (legacy)
      if (attributeMap.designDeltaT !== undefined) {
        vm.parametersFormGroup.get('designDeltaT').setValue(attributeMap.designDeltaT);
      } else if (attributeMap.deltaT !== undefined) {
        vm.parametersFormGroup.get('designDeltaT').setValue(attributeMap.deltaT);
      }
      if (attributeMap.designPower) {
        vm.parametersFormGroup.get('designPower').setValue(attributeMap.designPower);
      }
      // Support both designFlow (new) and nominalFlow (legacy)
      if (attributeMap.designFlow !== undefined) {
        vm.parametersFormGroup.get('designFlow').setValue(attributeMap.designFlow);
      } else if (attributeMap.nominalFlow !== undefined) {
        vm.parametersFormGroup.get('designFlow').setValue(attributeMap.nominalFlow);
      }

      // Pipe & Valve fields (support both new and legacy names)
      if (attributeMap.pipeDimension) {
        vm.parametersFormGroup.get('pipeDimension').setValue(attributeMap.pipeDimension);
      } else if (attributeMap.dimension) {
        vm.parametersFormGroup.get('pipeDimension').setValue(attributeMap.dimension);
      }
      if (attributeMap.valveDimension) {
        vm.parametersFormGroup.get('valveDimension').setValue(attributeMap.valveDimension);
      }
      if (attributeMap.valveKvs) {
        vm.parametersFormGroup.get('valveKvs').setValue(attributeMap.valveKvs);
      }

      // Operation / ON-OFF fields (support both new and legacy names)
      if (attributeMap.flowOnThreshold !== undefined) {
        vm.parametersFormGroup.get('flowOnThreshold').setValue(attributeMap.flowOnThreshold);
      } else if (attributeMap.deltaTAnalysisFloorVolume !== undefined) {
        vm.parametersFormGroup.get('flowOnThreshold').setValue(attributeMap.deltaTAnalysisFloorVolume);
      }
      if (attributeMap.hysteresisMinutes !== undefined) {
        vm.parametersFormGroup.get('hysteresisMinutes').setValue(attributeMap.hysteresisMinutes);
      }

      // Pump fields
      if (attributeMap.pumpPresent !== undefined) {
        vm.parametersFormGroup.get('pumpPresent').setValue(attributeMap.pumpPresent);
      }
      if (attributeMap.pumpControlType) {
        vm.parametersFormGroup.get('pumpControlType').setValue(attributeMap.pumpControlType);
      }
      if (attributeMap.pumpRatedPower !== undefined) {
        vm.parametersFormGroup.get('pumpRatedPower').setValue(attributeMap.pumpRatedPower);
      }

      // Auxiliary sensors
      if (attributeMap.auxSensor1 && typeof attributeMap.auxSensor1 === 'object') {
        vm.parametersFormGroup.get('auxSensors.auxSensor1').patchValue(attributeMap.auxSensor1);
      }
      if (attributeMap.auxSensor2 && typeof attributeMap.auxSensor2 === 'object') {
        vm.parametersFormGroup.get('auxSensors.auxSensor2').patchValue(attributeMap.auxSensor2);
      }

      // Area (support new nested structure)
      if (attributeMap.area && typeof attributeMap.area === 'object') {
        vm.parametersFormGroup.get('area').patchValue(attributeMap.area);
      }

      // Weekly schedule (support both legacy boolean and new object format)
      if (attributeMap.weeklySchedule) {
        // Timezone offset
        if (attributeMap.weeklySchedule.timezoneOffset !== undefined) {
          vm.parametersFormGroup.get('weeklySchedule.timezoneOffset').setValue(attributeMap.weeklySchedule.timezoneOffset);
        }
        // Days
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        days.forEach(function(day) {
          const dayData = attributeMap.weeklySchedule[day];
          const control = vm.parametersFormGroup.get('weeklySchedule.' + day);
          if (control && dayData !== undefined) {
            if (typeof dayData === 'boolean') {
              // Legacy format: just a boolean - convert to new format
              control.get('enabled').setValue(dayData);
            } else if (typeof dayData === 'object' && dayData !== null) {
              // New format: { enabled, start, end }
              control.patchValue(dayData);
            }
          }
        });
      }

    }

    function setupFormSubscriptions() {
      // Auto-set design values when systemType changes
      vm.parametersFormGroup.get('systemType').valueChanges.subscribe(function(systemType) {
        if (!systemType) return;

        const installationType = vm.parametersFormGroup.get('installationType').value;
        const defaults = getDefaultsForSystemType(systemType, installationType);

        if (defaults) {
          // Only set if values are currently empty (don't overwrite user values)
          const designFlowTemp = vm.parametersFormGroup.get('designFlowTemp');
          const designReturnTemp = vm.parametersFormGroup.get('designReturnTemp');
          const designDeltaT = vm.parametersFormGroup.get('designDeltaT');

          if (!designFlowTemp.value && defaults.designFlowTemp) {
            designFlowTemp.setValue(defaults.designFlowTemp);
          }
          if (!designReturnTemp.value && defaults.designReturnTemp) {
            designReturnTemp.setValue(defaults.designReturnTemp);
          }
          if (!designDeltaT.value && defaults.designDeltaT) {
            designDeltaT.setValue(defaults.designDeltaT);
          }
        }
      });

      // Clear systemType when installationType changes (options are different per type)
      vm.parametersFormGroup.get('installationType').valueChanges.subscribe(function(installationType) {
        // Reset systemType when installation type changes (options are different)
        vm.parametersFormGroup.get('systemType').setValue(null);
      });

      // Auto-calculate flowOnThreshold when designFlow changes (2% of design flow)
      vm.parametersFormGroup.get('designFlow').valueChanges.subscribe(function(designFlow) {
        if (designFlow) {
          const flowOnThreshold = vm.parametersFormGroup.get('flowOnThreshold');
          if (!flowOnThreshold.value) {
            const threshold = (designFlow * 0.02).toFixed(3);
            flowOnThreshold.setValue(parseFloat(threshold));
          }
        }
      });

      // Auto-set start/end time when progress changes
      vm.parametersFormGroup.get('progress').valueChanges.subscribe(function(progress) {
        const startDateControl = vm.parametersFormGroup.get('startDate');
        const startTimeControl = vm.parametersFormGroup.get('startTime');
        const endDateControl = vm.parametersFormGroup.get('endDate');
        const endTimeControl = vm.parametersFormGroup.get('endTime');

        if (progress === 'active' && !startDateControl.value && !startTimeControl.value) {
          const now = new Date();
          startDateControl.setValue(now);
          startTimeControl.setValue(now);
        } else if ((progress === 'finished' || progress === 'aborted') &&
                   startDateControl.value && startTimeControl.value &&
                   !endDateControl.value && !endTimeControl.value) {
          const now = new Date();
          endDateControl.setValue(now);
          endTimeControl.setValue(now);
        }
      });

      // Sync schedule times to weeklySchedule when time inputs change (for live summary update)
      vm.scheduleStartTime.valueChanges.subscribe(function() {
        vm.syncScheduleTimes();
      });
      vm.scheduleEndTime.valueChanges.subscribe(function() {
        vm.syncScheduleTimes();
      });
    }

    // Get default design values based on systemType and installationType
    function getDefaultsForSystemType(systemType, installationType) {
      const defaults = {
        // Heating systems
        radiator: { designDeltaT: 15, designFlowTemp: 70, designReturnTemp: 55 },
        floorHeating: { designDeltaT: 7, designFlowTemp: 35, designReturnTemp: 28 },
        districtHeating: { designDeltaT: 25, designFlowTemp: 90, designReturnTemp: 65 },
        // Dual-use systems (heating/cooling)
        fanCoil: installationType === 'cooling'
          ? { designDeltaT: 6, designFlowTemp: 6, designReturnTemp: 12 }
          : { designDeltaT: 10, designFlowTemp: 50, designReturnTemp: 40 },
        ahuCoil: installationType === 'cooling'
          ? { designDeltaT: 5, designFlowTemp: 6, designReturnTemp: 11 }
          : { designDeltaT: 20, designFlowTemp: 80, designReturnTemp: 60 },
        // Cooling only
        chiller: { designDeltaT: 5, designFlowTemp: 6, designReturnTemp: 11 }
      };

      return defaults[systemType] || null;
    }

    function parseDateTime(dateObj, timeObj) {
      if (!dateObj || !timeObj) return null;
      const date = new Date(dateObj);
      const time = new Date(timeObj);
      date.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds());
      return date;
    }

    // Schedule helper functions
    vm.getScheduleSummary = function() {
      const schedule = vm.parametersFormGroup.get('weeklySchedule').value;
      const enabledDays = vm.weekDays.filter(d => schedule[d.key]?.enabled);

      if (enabledDays.length === 0) {
        return 'No days configured';
      }

      if (enabledDays.length === 7) {
        const allSameTime = enabledDays.every(d =>
          schedule[d.key].start === schedule[enabledDays[0].key].start &&
          schedule[d.key].end === schedule[enabledDays[0].key].end
        );
        if (allSameTime) {
          return 'Daily ' + schedule[enabledDays[0].key].start + '-' + schedule[enabledDays[0].key].end;
        }
      }

      // Check if weekdays (Mon-Fri) have same schedule
      const weekdayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
      const weekdaysEnabled = weekdayKeys.filter(k => schedule[k]?.enabled);
      if (weekdaysEnabled.length === 5) {
        const allSame = weekdaysEnabled.every(k =>
          schedule[k].start === schedule[weekdaysEnabled[0]].start &&
          schedule[k].end === schedule[weekdaysEnabled[0]].end
        );
        if (allSame) {
          const weekendEnabled = ['saturday', 'sunday'].filter(k => schedule[k]?.enabled);
          if (weekendEnabled.length === 0) {
            return 'Mon-Fri ' + schedule[weekdaysEnabled[0]].start + '-' + schedule[weekdaysEnabled[0]].end;
          }
        }
      }

      // Fallback: show count
      return enabledDays.length + ' day(s) configured';
    };

    vm.copyToNextDay = function(dayKey) {
      const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const currentIndex = dayOrder.indexOf(dayKey);
      const nextIndex = (currentIndex + 1) % 7;
      const nextDay = dayOrder[nextIndex];

      const sourceValues = vm.parametersFormGroup.get('weeklySchedule.' + dayKey).value;
      vm.parametersFormGroup.get('weeklySchedule.' + nextDay).patchValue(sourceValues);
    };

    vm.copyToWeekdays = function(dayKey) {
      const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
      const sourceValues = vm.parametersFormGroup.get('weeklySchedule.' + dayKey).value;

      weekdays.forEach(function(day) {
        vm.parametersFormGroup.get('weeklySchedule.' + day).patchValue(sourceValues);
      });
    };

    vm.copyToAllDays = function(dayKey) {
      const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const sourceValues = vm.parametersFormGroup.get('weeklySchedule.' + dayKey).value;

      allDays.forEach(function(day) {
        vm.parametersFormGroup.get('weeklySchedule.' + day).patchValue(sourceValues);
      });
    };

    // Toggle day enabled state (for Day-Pills UI)
    vm.toggleDay = function(dayKey) {
      const dayControl = vm.parametersFormGroup.get('weeklySchedule.' + dayKey + '.enabled');
      const currentValue = dayControl.value;
      dayControl.setValue(!currentValue);
    };

    // Sync shared time to all enabled days before saving
    vm.syncScheduleTimes = function() {
      const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const startTime = vm.scheduleStartTime.value;
      const endTime = vm.scheduleEndTime.value;

      allDays.forEach(function(day) {
        const dayGroup = vm.parametersFormGroup.get('weeklySchedule.' + day);
        if (dayGroup.get('enabled').value) {
          dayGroup.patchValue({ start: startTime, end: endTime });
        }
      });
    };

    // Initialize shared time controls from first enabled day
    vm.initScheduleTimes = function() {
      const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const schedule = vm.parametersFormGroup.get('weeklySchedule').value;

      for (const day of allDays) {
        if (schedule[day] && schedule[day].enabled) {
          vm.scheduleStartTime.setValue(schedule[day].start || '06:00');
          vm.scheduleEndTime.setValue(schedule[day].end || '22:00');
          return;
        }
      }
      // No enabled days - use defaults
      vm.scheduleStartTime.setValue('06:00');
      vm.scheduleEndTime.setValue('22:00');
    };

    vm.applyPreset = function(preset) {
      const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
      const weekend = ['saturday', 'sunday'];

      switch (preset) {
        case 'weekdays':
          weekdays.forEach(function(day) {
            vm.parametersFormGroup.get('weeklySchedule.' + day).patchValue({ enabled: true, start: '06:00', end: '18:00' });
          });
          weekend.forEach(function(day) {
            vm.parametersFormGroup.get('weeklySchedule.' + day).patchValue({ enabled: false, start: '06:00', end: '18:00' });
          });
          vm.scheduleStartTime.setValue('06:00');
          vm.scheduleEndTime.setValue('18:00');
          break;
        case 'office':
          weekdays.forEach(function(day) {
            vm.parametersFormGroup.get('weeklySchedule.' + day).patchValue({ enabled: true, start: '08:00', end: '17:00' });
          });
          weekend.forEach(function(day) {
            vm.parametersFormGroup.get('weeklySchedule.' + day).patchValue({ enabled: false, start: '08:00', end: '17:00' });
          });
          vm.scheduleStartTime.setValue('08:00');
          vm.scheduleEndTime.setValue('17:00');
          break;
        case '247':
          allDays.forEach(function(day) {
            vm.parametersFormGroup.get('weeklySchedule.' + day).patchValue({ enabled: true, start: '00:00', end: '23:30' });
          });
          vm.scheduleStartTime.setValue('00:00');
          vm.scheduleEndTime.setValue('23:30');
          break;
        case 'clear':
          allDays.forEach(function(day) {
            vm.parametersFormGroup.get('weeklySchedule.' + day).patchValue({ enabled: false, start: '06:00', end: '22:00' });
          });
          vm.scheduleStartTime.setValue('06:00');
          vm.scheduleEndTime.setValue('22:00');
          break;
      }
    };

    // Generate schedule summary for collapsed header
    vm.getScheduleSummary = function() {
      const schedule = vm.parametersFormGroup.get('weeklySchedule').value;
      const dayNames = { monday: 'Mo', tuesday: 'Tu', wednesday: 'We', thursday: 'Th', friday: 'Fr', saturday: 'Sa', sunday: 'Su' };
      const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const enabledDays = allDays.filter(function(d) { return schedule[d] && schedule[d].enabled; });

      if (enabledDays.length === 0) {
        return 'Not configured';
      }

      // Check for common patterns
      const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
      const isWeekdays = weekdays.every(function(d) { return enabledDays.includes(d); }) &&
                         !enabledDays.includes('saturday') && !enabledDays.includes('sunday');
      const isDaily = enabledDays.length === 7;

      // Get time range (assume all same for simplicity)
      const firstDay = enabledDays[0];
      const start = schedule[firstDay].start || '06:00';
      const end = schedule[firstDay].end || '22:00';
      const timeRange = start + '-' + end;

      if (isDaily) {
        return 'Daily ' + timeRange;
      } else if (isWeekdays) {
        return 'Mo-Fr ' + timeRange;
      } else {
        const dayList = enabledDays.map(function(d) { return dayNames[d]; }).join(', ');
        return dayList + ' ' + timeRange;
      }
    };

    vm.cancel = function() {
      vm.dialogRef.close(null);
    };

    vm.save = function() {
      if (vm.parametersFormGroup.invalid) {
        return;
      }

      vm.isLoading = true;

      // Sync shared time values to all enabled days before saving
      vm.syncScheduleTimes();

      const formData = vm.parametersFormGroup.getRawValue();

      const startDateTime = parseDateTime(formData.startDate, formData.startTime);
      const endDateTime = parseDateTime(formData.endDate, formData.endTime);

      const attributesArray = [
        // Measurement info
        { key: 'measurementType', value: formData.measurementType },
        { key: 'measurementRole', value: formData.measurementRole },
        // Status
        { key: 'progress', value: formData.progress },
        { key: 'startTimeMs', value: startDateTime ? startDateTime.getTime() : null },
        { key: 'endTimeMs', value: endDateTime ? endDateTime.getTime() : null },
        // Classification
        { key: 'installationType', value: formData.installationType },
        { key: 'systemType', value: formData.systemType },
        // Hydraulics
        { key: 'hydraulicScheme', value: formData.hydraulicScheme },
        { key: 'fluidType', value: formData.fluidType },
        // Design
        { key: 'designFlowTemp', value: formData.designFlowTemp },
        { key: 'designReturnTemp', value: formData.designReturnTemp },
        { key: 'designDeltaT', value: formData.designDeltaT },
        { key: 'designPower', value: formData.designPower },
        { key: 'designFlow', value: formData.designFlow },
        // Pipe & Valve
        { key: 'pipeDimension', value: formData.pipeDimension },
        { key: 'valveDimension', value: formData.valveDimension },
        { key: 'valveKvs', value: formData.valveKvs },
        // Operation / ON-OFF
        { key: 'flowOnThreshold', value: formData.flowOnThreshold },
        { key: 'hysteresisMinutes', value: formData.hysteresisMinutes },
        // Pump
        { key: 'pumpPresent', value: formData.pumpPresent },
        { key: 'pumpControlType', value: formData.pumpPresent ? formData.pumpControlType : null },
        { key: 'pumpRatedPower', value: formData.pumpPresent ? formData.pumpRatedPower : null },
        // Weekly schedule (always save - includes timezoneOffset)
        { key: 'weeklySchedule', value: formData.weeklySchedule },
        // Fixed position values
        { key: 'xPos', value: 0.5 },
        { key: 'yPos', value: 0.5 }
      ];

      // Auxiliary sensors - only save if label or location is set
      const auxSensor1 = formData.auxSensors.auxSensor1;
      if (auxSensor1 && (auxSensor1.label || auxSensor1.location)) {
        attributesArray.push({ key: 'auxSensor1', value: auxSensor1 });
      }
      const auxSensor2 = formData.auxSensors.auxSensor2;
      if (auxSensor2 && (auxSensor2.label || auxSensor2.location)) {
        attributesArray.push({ key: 'auxSensor2', value: auxSensor2 });
      }

      // Area - only save if value is set
      if (formData.area && formData.area.value) {
        attributesArray.push({ key: 'area', value: formData.area });
      }

      // Save attributes
      const saveAttributes$ = attributeService.saveEntityAttributes(vm.measurementId, 'SERVER_SCOPE', attributesArray);

      // Check if entityLabel changed
      const newLabel = formData.entityLabel || '';
      const labelChanged = newLabel !== vm.originalEntityLabel;

      if (labelChanged) {
        // First get current asset, update label, then save attributes
        assetService.getAsset(vm.measurementId.id).subscribe(
          function(asset) {
            asset.label = newLabel;
            assetService.saveAsset(asset).subscribe(
              function() {
                // Now save attributes
                saveAttributes$.subscribe(
                  function() {
                    vm.isLoading = false;
                    widgetContext.updateAliases();
                    vm.dialogRef.close(null);
                    if (callback) {
                      callback();
                    }
                  },
                  function(error) {
                    console.error('Error saving measurement parameters:', error);
                    vm.isLoading = false;
                  }
                );
              },
              function(error) {
                console.error('Error saving asset label:', error);
                vm.isLoading = false;
              }
            );
          },
          function(error) {
            console.error('Error fetching asset:', error);
            vm.isLoading = false;
          }
        );
      } else {
        // Just save attributes
        saveAttributes$.subscribe(
          function() {
            vm.isLoading = false;
            widgetContext.updateAliases();
            vm.dialogRef.close(null);
            if (callback) {
              callback();
            }
          },
          function(error) {
            console.error('Error saving measurement parameters:', error);
            vm.isLoading = false;
          }
        );
      }
    };

    // Initialize shared schedule time controls (must be after function definitions)
    vm.initScheduleTimes();
  }
}

// ============================================================================
// MEASUREMENT INFO DIALOG
// ============================================================================

// Timeseries key mappings
const TIMESERIES_UNITS = {
  'CHC_S_Power_Heating': 'kW',
  'CHC_M_Energy_Heating': 'kWh',
  'CHC_S_Power_Cooling': 'kW',
  'CHC_M_Energy_Cooling': 'kWh',
  'CHC_S_VolumeFlow': 'l/hr',
  'CHC_M_Volume': 'm³',
  'CHC_S_TemperatureDiff': '°C',
  'CHC_S_TemperatureFlow': '°C',
  'CHC_S_TemperatureReturn': '°C',
  'CHC_S_Velocity': 'm/s',
  'temperature': '°C',
  'co2': 'ppm',
  'humidity': '%',
  'battery': '%'
};

const TIMESERIES_LABELS = {
  'CHC_S_Power_Heating': 'Power',
  'CHC_M_Energy_Heating': 'Energy',
  'CHC_S_Power_Cooling': 'Power',
  'CHC_M_Energy_Cooling': 'Energy',
  'CHC_S_VolumeFlow': 'Volume Flow',
  'CHC_M_Volume': 'Volume',
  'CHC_S_TemperatureDiff': 'Temp Diff',
  'CHC_S_TemperatureFlow': 'Flow Temp',
  'CHC_S_TemperatureReturn': 'Return Temp',
  'CHC_S_Velocity': 'Velocity',
  'temperature': 'Temperature',
  'co2': 'CO2',
  'humidity': 'Humidity',
  'battery': 'Battery'
};

const measurementInfoHtmlTemplate = `<style>
/* ECO Design System - Embedded Styles for Live Data Dialog */
.measurement-info-dialog .eco-dialog-header,
mat-toolbar.eco-dialog-header {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  padding: 0 16px !important;
  height: 52px !important;
  min-height: 52px !important;
  background-color: #305680 !important;
  background: #305680 !important;
  color: white !important;
}
.measurement-info-dialog .eco-dialog-header .header-icon,
mat-toolbar.eco-dialog-header .header-icon {
  font-size: 22px !important;
  width: 22px !important;
  height: 22px !important;
  color: white !important;
}
.measurement-info-dialog .eco-dialog-header .header-title,
mat-toolbar.eco-dialog-header .header-title {
  margin: 0 !important;
  font-size: 17px !important;
  font-weight: 500 !important;
  color: white !important;
}
.measurement-info-dialog .eco-dialog-header .close-btn,
mat-toolbar.eco-dialog-header .close-btn {
  color: rgba(255,255,255,0.8) !important;
  margin-left: auto !important;
}
.measurement-info-dialog .eco-dialog-header mat-icon,
mat-toolbar.eco-dialog-header mat-icon {
  color: white !important;
}
.measurement-info-dialog .dialog-content {
  padding: 16px 20px !important;
  background: #f8fafc !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 12px !important;
  max-height: 70vh !important;
  overflow-y: auto !important;
}
.measurement-info-dialog .dialog-footer {
  display: flex !important;
  justify-content: flex-end !important;
  gap: 12px !important;
  padding: 12px 20px !important;
  border-top: 1px solid #e2e8f0 !important;
  background: #fafafa !important;
}
</style>
<div class="measurement-info-dialog" style="width: 500px;">
  <mat-toolbar class="eco-dialog-header">
    <mat-icon class="header-icon">sensors</mat-icon>
    <h2 class="header-title">Live Data</h2>
    <span class="flex-1"></span>
    <button mat-icon-button (click)="cancel()" type="button" class="close-btn">
      <mat-icon>close</mat-icon>
    </button>
  </mat-toolbar>

  <mat-progress-bar color="warn" mode="indeterminate" *ngIf="isLoading || isRefreshing"></mat-progress-bar>
  <div style="height: 4px;" *ngIf="!isLoading && !isRefreshing"></div>

  <div class="dialog-content">
    <!-- Entity Info Card -->
    <div class="entity-info-card" style="border: 2px solid #305680; border-radius: 8px; padding: 16px; margin-bottom: 16px; background: linear-gradient(135deg, #f8fafc 0%, #e8f4fd 100%);">
      <div class="flex items-center gap-2 mb-2">
        <mat-icon style="color: #305680;">assessment</mat-icon>
        <span style="font-size: 18px; font-weight: 600; color: #305680;">{{ entityName }}</span>
      </div>
      <div *ngIf="entityLabel" style="color: #666; font-size: 14px; margin-left: 32px;">
        {{ entityLabel }}
      </div>
    </div>

    <!-- Badges Section -->
    <div class="badges-section" style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
      <div *ngIf="installationType" class="badge flex items-center gap-1"
           [style.color]="getInstallationTypeStyle(installationType).color"
           [style.background-color]="getInstallationTypeStyle(installationType).bgColor"
           style="padding: 6px 12px; border-radius: 16px; font-size: 14px; font-weight: 500;">
        <mat-icon style="font-size: 16px; width: 16px; height: 16px;">{{ getInstallationTypeStyle(installationType).icon }}</mat-icon>
        {{ getInstallationTypeStyle(installationType).label }}
      </div>
      <div *ngIf="progress" class="badge flex items-center gap-1"
           [style.color]="getProgressColor(progress).color"
           [style.background-color]="getProgressColor(progress).bgColor"
           style="padding: 6px 12px; border-radius: 16px; font-size: 14px; font-weight: 500;">
        <mat-icon style="font-size: 16px; width: 16px; height: 16px;">trending_up</mat-icon>
        {{ getProgressColor(progress).label }}
      </div>
      <div *ngIf="startTimeMs" class="badge flex items-center gap-1"
           style="padding: 6px 12px; border-radius: 16px; font-size: 14px; font-weight: 500; color: #27AE60; background-color: rgba(39, 174, 96, 0.12);">
        <mat-icon style="font-size: 16px; width: 16px; height: 16px;">play_circle</mat-icon>
        {{ formatIsoTimestamp(startTimeMs) }}
      </div>
    </div>

    <!-- Devices Section -->
    <div *ngIf="kitGroups.length > 0 || noKitDevices.length > 0" class="devices-section" style="margin-top: 16px;">
      <div style="font-size: 14px; font-weight: 600; color: #305680; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
        <mat-icon style="font-size: 18px; width: 18px; height: 18px;">devices</mat-icon>
        Connected Devices
      </div>

      <!-- Diagnostic Kit Groups (highlighted) -->
      <ng-container *ngFor="let kit of kitGroups">
        <div class="kit-group" style="margin-bottom: 12px; border: 1px solid #305680; border-radius: 8px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #305680 0%, #4a7ab0 100%); color: white; padding: 8px 12px; font-weight: 500; display: flex; align-items: center; gap: 6px;">
            <mat-icon style="font-size: 16px; width: 16px; height: 16px;">router</mat-icon>
            {{ kit.label || kit.name }}
          </div>
          <div style="padding: 8px;">
            <ng-container *ngFor="let device of kit.devices">
              <div class="device-item flex flex-col" style="padding: 6px 8px; border-radius: 4px; background: #f5f5f5; margin-bottom: 4px;">
                <div class="flex items-center gap-2">
                  <mat-icon style="font-size: 14px; width: 14px; height: 14px; color: #666;">memory</mat-icon>
                  <div class="flex flex-col">
                    <span style="font-weight: 500; font-size: 13px;">{{ device.name }}</span>
                    <span style="color: #888; font-size: 11px;">{{ device.type }}</span>
                  </div>
                </div>
                <div class="flex items-center gap-2 flex-wrap" style="margin-left: 22px; margin-top: 6px;">
                  <div class="flex items-center gap-1"
                       [style.background]="getActivityColor(device.active).bgColor"
                       [style.color]="getActivityColor(device.active).color"
                       style="padding: 2px 8px; border-radius: 12px; font-size: 11px;">
                    <mat-icon style="font-size: 12px; width: 12px; height: 12px;">{{ getActivityColor(device.active).icon }}</mat-icon>
                    {{ getActivityColor(device.active).label }}
                  </div>
                  <div class="flex items-center gap-1" style="color: #666; font-size: 11px;">
                    <mat-icon style="font-size: 12px; width: 12px; height: 12px;">schedule</mat-icon>
                    {{ formatTimestampDE(device.latestDataTimestamp || device.lastActivityTime) }}
                  </div>
                  <div *ngIf="device.sendInterval" class="flex items-center gap-1" style="color: #305680; font-size: 11px; background: rgba(48,86,128,0.1); padding: 2px 6px; border-radius: 4px;">
                    <mat-icon style="font-size: 12px; width: 12px; height: 12px;">timer</mat-icon>
                    {{ device.sendInterval }}s
                  </div>
                </div>
                <!-- Timeseries Data -->
                <div *ngIf="device.timeseries && device.timeseries.length > 0"
                     style="margin-left: 22px; margin-top: 8px; padding: 8px; background: #f0f8ff; border-radius: 4px; border-left: 3px solid #305680;">
                  <div *ngFor="let ts of device.timeseries" class="flex items-center gap-2" style="font-size: 11px; margin-bottom: 4px;">
                    <span style="color: #666; min-width: 90px;">{{ ts.label }}:</span>
                    <span style="font-weight: 600; color: #305680;">{{ ts.formattedValue }}</span>
                  </div>
                </div>
              </div>
            </ng-container>
          </div>
        </div>
      </ng-container>

      <!-- Devices without Kit -->
      <ng-container *ngIf="noKitDevices.length > 0">
        <div class="no-kit-devices" style="margin-bottom: 12px; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background: #f5f5f5; color: #666; padding: 8px 12px; font-weight: 500; display: flex; align-items: center; gap: 6px;">
            <mat-icon style="font-size: 16px; width: 16px; height: 16px;">device_unknown</mat-icon>
            Other Devices
          </div>
          <div style="padding: 8px;">
            <ng-container *ngFor="let device of noKitDevices">
              <div class="device-item flex flex-col" style="padding: 6px 8px; border-radius: 4px; background: #fafafa; margin-bottom: 4px;">
                <div class="flex items-center gap-2">
                  <mat-icon style="font-size: 14px; width: 14px; height: 14px; color: #666;">memory</mat-icon>
                  <div class="flex flex-col">
                    <span style="font-weight: 500; font-size: 13px;">{{ device.name }}</span>
                    <span style="color: #888; font-size: 11px;">{{ device.type }}</span>
                  </div>
                </div>
                <div class="flex items-center gap-2 flex-wrap" style="margin-left: 22px; margin-top: 6px;">
                  <div class="flex items-center gap-1"
                       [style.background]="getActivityColor(device.active).bgColor"
                       [style.color]="getActivityColor(device.active).color"
                       style="padding: 2px 8px; border-radius: 12px; font-size: 11px;">
                    <mat-icon style="font-size: 12px; width: 12px; height: 12px;">{{ getActivityColor(device.active).icon }}</mat-icon>
                    {{ getActivityColor(device.active).label }}
                  </div>
                  <div class="flex items-center gap-1" style="color: #666; font-size: 11px;">
                    <mat-icon style="font-size: 12px; width: 12px; height: 12px;">schedule</mat-icon>
                    {{ formatTimestampDE(device.latestDataTimestamp || device.lastActivityTime) }}
                  </div>
                  <div *ngIf="device.sendInterval" class="flex items-center gap-1" style="color: #305680; font-size: 11px; background: rgba(48,86,128,0.1); padding: 2px 6px; border-radius: 4px;">
                    <mat-icon style="font-size: 12px; width: 12px; height: 12px;">timer</mat-icon>
                    {{ device.sendInterval }}s
                  </div>
                </div>
                <!-- Timeseries Data -->
                <div *ngIf="device.timeseries && device.timeseries.length > 0"
                     style="margin-left: 22px; margin-top: 8px; padding: 8px; background: #f0f8ff; border-radius: 4px; border-left: 3px solid #305680;">
                  <div *ngFor="let ts of device.timeseries" class="flex items-center gap-2" style="font-size: 11px; margin-bottom: 4px;">
                    <span style="color: #666; min-width: 90px;">{{ ts.label }}:</span>
                    <span style="font-weight: 600; color: #305680;">{{ ts.formattedValue }}</span>
                  </div>
                </div>
              </div>
            </ng-container>
          </div>
        </div>
      </ng-container>

      <!-- No devices message -->
      <div *ngIf="kitGroups.length === 0 && noKitDevices.length === 0" style="color: #888; font-style: italic; text-align: center; padding: 12px;">
        No devices connected to this measurement
      </div>
    </div>

    <!-- Auto-Refresh Status Bar -->
    <div class="flex items-center justify-between" style="margin-top: 12px; padding: 8px 12px; background: #f5f5f5; border-radius: 6px;">
      <div class="flex items-center gap-2" style="font-size: 11px; color: #666;">
        <span *ngIf="lastRefresh">Updated: {{ formatTimestampDE(lastRefresh.getTime()) }} (#{{ refreshCount }})</span>
        <span *ngIf="!lastRefresh">-</span>
      </div>
      <button mat-button (click)="toggleAutoRefresh()" type="button"
              [style.color]="autoRefreshEnabled ? '#305680' : '#999'"
              style="min-width: unset; padding: 4px 8px; font-size: 11px;">
        <mat-icon [class.auto-refresh-active]="autoRefreshEnabled && isRefreshing"
                  [style.color]="autoRefreshEnabled ? '#305680' : '#999'"
                  style="font-size: 16px; width: 16px; height: 16px; margin-right: 4px;">sync</mat-icon>
        <span>Auto-Refresh {{ autoRefreshEnabled ? 'On' : 'Off' }}</span>
      </button>
    </div>
  </div>

  <div class="dialog-footer">
    <button mat-raised-button type="button" (click)="goToDetails()"
            style="background-color: #305680; color: white;">
      <mat-icon style="margin-right: 4px; font-size: 18px; width: 18px; height: 18px;">dashboard</mat-icon>
      Dashboard
    </button>
    <button mat-raised-button type="button" (click)="openParams()"
            style="background-color: #F2994A; color: white;">
      <mat-icon style="margin-right: 4px; font-size: 18px; width: 18px; height: 18px;">settings</mat-icon>
      Parameters
    </button>
    <span class="flex-1"></span>
    <button mat-raised-button color="primary" type="button" (click)="cancel()">
      Close
    </button>
  </div>
</div>`;

const measurementInfoCss = `.measurement-info-dialog .badge {
  display: inline-flex;
  align-items: center;
}
.measurement-info-dialog .device-item:last-child {
  margin-bottom: 0;
}
.measurement-info-dialog .kit-group:last-child {
  margin-bottom: 0;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.measurement-info-dialog .auto-refresh-active {
  animation: spin 1s linear infinite;
}
.measurement-info-dialog .timeseries-section div:last-child {
  margin-bottom: 0;
}`;

/**
 * Opens the Measurement Info dialog
 *
 * @param {Object} widgetContext - ThingsBoard widget context
 * @param {Object} measurementId - Measurement entity ID { id: string, entityType: 'ASSET' }
 * @param {Function} callback - Optional callback after dialog closes
 */
export function openMeasurementInfoDialog(widgetContext, measurementId, callback) {
  const $injector = widgetContext.$scope.$injector;
  const customDialog = $injector.get(widgetContext.servicesMap.get('customDialog'));
  const attributeService = $injector.get(widgetContext.servicesMap.get('attributeService'));
  const assetService = $injector.get(widgetContext.servicesMap.get('assetService'));
  const deviceService = $injector.get(widgetContext.servicesMap.get('deviceService'));
  const entityRelationService = $injector.get(widgetContext.servicesMap.get('entityRelationService'));

  // Fetch asset info first, then attributes
  let fetchedAttributes = [];
  let fetchedAsset = null;

  assetService.getAsset(measurementId.id).subscribe(
    function(asset) {
      fetchedAsset = asset;
      fetchAttributes();
    },
    function(error) {
      console.error('Error fetching asset:', error);
      fetchAttributes();
    }
  );

  function loadDeviceAttributes(device) {
    return new Promise(function(resolve) {
      attributeService.getEntityAttributes(
        device.id,
        'SERVER_SCOPE',
        ['active', 'lastActivityTime']
      ).subscribe(
        function(attributes) {
          var activeAttr = attributes.find(function(a) { return a.key === 'active'; });
          var lastActivityAttr = attributes.find(function(a) { return a.key === 'lastActivityTime'; });
          device.active = activeAttr ? activeAttr.value : null;
          device.lastActivityTime = lastActivityAttr ? lastActivityAttr.value : null;
          resolve(device);
        },
        function() {
          device.active = null;
          device.lastActivityTime = null;
          resolve(device);
        }
      );
    });
  }

  function findDeviceKit(deviceId) {
    return new Promise(function(resolve) {
      entityRelationService.findByTo(deviceId).subscribe(
        function(relations) {
          var assetRelations = (relations || []).filter(function(r) {
            return r.from && r.from.entityType === 'ASSET';
          });
          if (!assetRelations.length) {
            resolve(null);
            return;
          }
          function tryNext(index) {
            if (index >= assetRelations.length) {
              resolve(null);
              return;
            }
            assetService.getAsset(assetRelations[index].from.id).subscribe(
              function(kit) {
                if (kit && kit.type === 'Diagnostickit') {
                  resolve(kit);
                } else {
                  tryNext(index + 1);
                }
              },
              function() { tryNext(index + 1); }
            );
          }
          tryNext(0);
        },
        function() { resolve(null); }
      );
    });
  }

  function getPFlowTimeseriesKeys(installationType) {
    var commonKeys = [
      'CHC_S_VolumeFlow',
      'CHC_M_Volume',
      'CHC_S_TemperatureDiff',
      'CHC_S_TemperatureFlow',
      'CHC_S_TemperatureReturn',
      'CHC_S_Velocity'
    ];
    if (installationType === 'heating') {
      return ['CHC_S_Power_Heating', 'CHC_M_Energy_Heating'].concat(commonKeys);
    } else if (installationType === 'cooling') {
      return ['CHC_S_Power_Cooling', 'CHC_M_Energy_Cooling'].concat(commonKeys);
    }
    return commonKeys;
  }

  function fetchDeviceTimeseries(deviceId, keys) {
    return new Promise(function(resolve) {
      var keysParam = keys.join(',');
      // Fetch last 5 minutes of data to calculate send interval (need at least 2 values)
      var endTs = Date.now();
      var startTs = endTs - (5 * 60 * 1000); // 5 minutes ago
      var url = '/api/plugins/telemetry/DEVICE/' + deviceId.id + '/values/timeseries?keys=' + keysParam + '&startTs=' + startTs + '&endTs=' + endTs + '&limit=2';
      widgetContext.http.get(url).subscribe(
        function(response) {
          resolve(response || {});
        },
        function(error) {
          console.error('[MeasurementInfo] Timeseries error for', deviceId.id, ':', error);
          resolve({});
        }
      );
    });
  }

  function calculateSendInterval(response) {
    // Find any key with at least 2 values to calculate interval
    for (var key in response) {
      var values = response[key];
      if (values && values.length >= 2) {
        var ts1 = values[0].ts;  // most recent
        var ts2 = values[1].ts;  // second most recent
        var intervalMs = ts1 - ts2;
        var intervalSec = Math.round(intervalMs / 1000);
        return intervalSec;
      }
    }
    return null;
  }

  function getLatestTimestamp(response) {
    // Find the most recent timestamp from any timeseries key
    var latestTs = null;
    for (var key in response) {
      var values = response[key];
      if (values && values.length > 0 && values[0].ts) {
        if (latestTs === null || values[0].ts > latestTs) {
          latestTs = values[0].ts;
        }
      }
    }
    return latestTs;
  }

  function formatTimeseriesValue(key, value) {
    if (value === null || value === undefined) return '-';
    var numValue = Number(value);
    if (!Number.isFinite(numValue)) return '-';
    var unit = TIMESERIES_UNITS[key] || '';
    var decimals = (key === 'CHC_M_Volume' || key.includes('Energy')) ? 3 : 2;
    return numValue.toFixed(decimals) + ' ' + unit;
  }

  function processTimeseriesResponse(response, keys) {
    var result = [];
    keys.forEach(function(key) {
      if (response && response[key] && response[key].length > 0) {
        result.push({
          key: key,
          label: TIMESERIES_LABELS[key] || key,
          value: response[key][0].value,
          formattedValue: formatTimeseriesValue(key, response[key][0].value)
        });
      }
    });
    return result;
  }

  function fetchAttributes() {
    attributeService.getEntityAttributes(measurementId, 'SERVER_SCOPE').subscribe(
      function(attributes) {
        fetchedAttributes = attributes;
        fetchDevices(function(deviceData) {
          openDialog(deviceData);
        });
      },
      function(error) {
        console.error('Error fetching attributes:', error);
        fetchDevices(function(deviceData) {
          openDialog(deviceData);
        });
      }
    );
  }

  function fetchDevices(callback) {
    var deviceSearchQuery = {
      parameters: {
        rootId: measurementId.id,
        rootType: 'ASSET',
        direction: 'FROM',
        relationTypeGroup: 'COMMON',
        maxLevel: 1,
        fetchLastLevelOnly: false
      },
      relationType: 'Measurement',
      deviceTypes: ['P-Flow D116', 'Room Sensor CO2', 'Temperature Sensor', 'RESI']
    };

    deviceService.findByQuery(deviceSearchQuery).subscribe(
      function(devices) {
        if (!devices || !devices.length) {
          callback({ kitGroups: [], noKitDevices: [] });
          return;
        }

        var devicePromises = devices.map(function(device) {
          return loadDeviceAttributes(device).then(function(updatedDevice) {
            return findDeviceKit(updatedDevice.id).then(function(kit) {
              return { device: updatedDevice, kit: kit };
            });
          });
        });

        Promise.all(devicePromises).then(function(results) {
          var kitMap = {};
          var noKitDevices = [];

          results.forEach(function(result) {
            var d = result.device;
            var kit = result.kit;
            var deviceData = {
              id: d.id,
              name: d.name,
              type: d.type,
              active: d.active,
              lastActivityTime: d.lastActivityTime
            };

            if (kit) {
              var kitKey = kit.id.id;
              if (!kitMap[kitKey]) {
                kitMap[kitKey] = {
                  id: kit.id,
                  name: kit.name,
                  label: kit.label,
                  devices: []
                };
              }
              kitMap[kitKey].devices.push(deviceData);
            } else {
              noKitDevices.push(deviceData);
            }
          });

          var kitGroups = Object.values(kitMap).sort(function(a, b) {
            return (a.name || '').localeCompare(b.name || '');
          });

          callback({ kitGroups: kitGroups, noKitDevices: noKitDevices });
        });
      },
      function(error) {
        console.error('Error fetching devices:', error);
        callback({ kitGroups: [], noKitDevices: [] });
      }
    );
  }

  function openDialog(deviceData) {
    customDialog.customDialog(measurementInfoHtmlTemplate, MeasurementInfoDialogController, {
      measurementId,
      attributes: fetchedAttributes,
      entityName: fetchedAsset ? fetchedAsset.name : '',
      entityLabel: fetchedAsset ? fetchedAsset.label : '',
      kitGroups: deviceData ? deviceData.kitGroups : [],
      noKitDevices: deviceData ? deviceData.noKitDevices : []
    }, measurementInfoCss).subscribe();
  }

  function MeasurementInfoDialogController(instance) {
    const vm = instance;
    const config = vm.data;

    vm.isLoading = false;
    vm.measurementId = config.measurementId;
    vm.entityName = config.entityName || '';
    vm.entityLabel = config.entityLabel || '';
    vm.installationType = null;
    vm.kitGroups = config.kitGroups || [];
    vm.noKitDevices = config.noKitDevices || [];
    vm.isRefreshing = false;
    vm.refreshInterval = null;
    vm.lastRefresh = null;
    vm.autoRefreshEnabled = true;
    vm.refreshCount = 0;
    vm.currentIntervalMs = 5000; // Default 5s, adjusted based on detected sendInterval

    // Extract installationType from attributes
    const findAttr = function(key) {
      const attr = config.attributes.find(function(a) { return a.key === key; });
      return attr ? attr.value : null;
    };

    vm.installationType = findAttr('installationType');
    vm.progress = findAttr('progress') || 'in preparation';
    vm.startTimeMs = findAttr('startTimeMs');

    // Helper function for progress color
    function getProgressColor(progress) {
      let color, bgColor, label;
      switch (progress) {
        case 'in preparation':
          color = '#F2994A';
          bgColor = 'rgba(242, 153, 74, 0.12)';
          label = 'In Preparation';
          break;
        case 'active':
          color = '#27AE60';
          bgColor = 'rgba(39, 174, 96, 0.12)';
          label = 'Active';
          break;
        case 'finished':
          color = '#2F80ED';
          bgColor = 'rgba(47, 128, 237, 0.12)';
          label = 'Finished';
          break;
        case 'aborted':
          color = '#EB5757';
          bgColor = 'rgba(235, 87, 87, 0.12)';
          label = 'Aborted';
          break;
        default:
          color = '#828282';
          bgColor = 'rgba(130, 130, 130, 0.12)';
          label = progress || 'Unknown';
      }
      return { color, bgColor, label };
    }

    // Format timestamp to ISO string (YYYY-MM-DD HH:mm)
    function formatIsoTimestamp(timestampMs) {
      if (!timestampMs) return null;
      var date = new Date(Number(timestampMs));
      if (isNaN(date.getTime())) return null;
      var pad = function(n) { return n.toString().padStart(2, '0'); };
      return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) +
             ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
    }

    vm.getProgressColor = getProgressColor;
    vm.formatIsoTimestamp = formatIsoTimestamp;

    // Helper function for activity color
    function getActivityColor(active) {
      let color, bgColor, label, icon;
      if (active === true) {
        color = "#27AE60";      // Green
        bgColor = "rgba(39, 174, 96, 0.12)";
        label = "Active";
        icon = "check_circle";
      } else if (active === false) {
        color = "#EB5757";      // Red
        bgColor = "rgba(235, 87, 87, 0.12)";
        label = "Inactive";
        icon = "cancel";
      } else {
        color = "#828282";      // Gray for null/undefined
        bgColor = "rgba(130, 130, 130, 0.12)";
        label = "N/A";
        icon = "help_outline";
      }
      return { color, bgColor, label, icon };
    }

    // Timeseries fetching function
    function fetchAllTimeseries() {
      if (vm.isRefreshing) return;
      vm.isRefreshing = true;

      // Collect all device IDs and their types
      var deviceInfos = [];
      vm.kitGroups.forEach(function(kit) {
        kit.devices.forEach(function(d) {
          deviceInfos.push({ id: d.id, type: d.type });
        });
      });
      vm.noKitDevices.forEach(function(d) {
        deviceInfos.push({ id: d.id, type: d.type });
      });

      var pflowKeys = getPFlowTimeseriesKeys(vm.installationType);
      var fetchPromises = [];

      // Store results in a Map keyed by device ID
      var resultsMap = {};

      deviceInfos.forEach(function(info) {
        var keys = [];
        if (info.type === 'P-Flow D116') {
          keys = pflowKeys;
        } else if (info.type === 'Temperature Sensor') {
          keys = ['temperature'];
        } else if (info.type === 'Room Sensor CO2') {
          keys = ['co2', 'temperature', 'humidity', 'battery'];
        }

        if (keys.length > 0) {
          var deviceIdStr = info.id.id || info.id;
          fetchPromises.push(
            fetchDeviceTimeseries(info.id, keys).then(function(data) {
              resultsMap[deviceIdStr] = {
                timeseries: processTimeseriesResponse(data, keys),
                sendInterval: calculateSendInterval(data),
                latestDataTimestamp: getLatestTimestamp(data)
              };
            })
          );
        }
      });

      if (fetchPromises.length === 0) {
        vm.isRefreshing = false;
        return;
      }

      Promise.all(fetchPromises).then(function() {
        vm.refreshCount++;

        // Helper to apply timeseries data to device
        function applyTimeseries(device) {
          var deviceIdStr = device.id.id || device.id;
          var result = resultsMap[deviceIdStr];
          if (result) {
            return Object.assign({}, device, {
              timeseries: result.timeseries,
              sendInterval: result.sendInterval,
              latestDataTimestamp: result.latestDataTimestamp
            });
          }
          return Object.assign({}, device);
        }

        // Create new object references AND apply timeseries data
        vm.kitGroups = vm.kitGroups.map(function(kit) {
          return Object.assign({}, kit, {
            devices: kit.devices.map(applyTimeseries)
          });
        });
        vm.noKitDevices = vm.noKitDevices.map(applyTimeseries);

        vm.isRefreshing = false;
        vm.lastRefresh = new Date();

        // Adjust refresh interval based on calculated sendInterval
        var detectedInterval = null;
        for (var deviceId in resultsMap) {
          if (resultsMap[deviceId].sendInterval) {
            detectedInterval = resultsMap[deviceId].sendInterval;
            break;
          }
        }

        // Update refresh interval if we detected a send interval different from current
        var newIntervalMs = (detectedInterval || 5) * 1000;
        if (vm.autoRefreshEnabled && vm.currentIntervalMs !== newIntervalMs) {
          vm.currentIntervalMs = newIntervalMs;
          if (vm.refreshInterval) {
            clearInterval(vm.refreshInterval);
          }
          vm.refreshInterval = setInterval(function() {
            fetchAllTimeseries();
          }, newIntervalMs);
        }

        // Trigger Angular change detection
        if (widgetContext.detectChanges) {
          widgetContext.detectChanges();
        }
      }).catch(function(error) {
        console.error('[MeasurementInfo] Error fetching timeseries:', error);
        vm.isRefreshing = false;
        if (widgetContext.detectChanges) {
          widgetContext.detectChanges();
        }
      });
    }

    vm.toggleAutoRefresh = function() {
      vm.autoRefreshEnabled = !vm.autoRefreshEnabled;

      if (vm.autoRefreshEnabled) {
        // Start auto-refresh with current interval
        fetchAllTimeseries();
        vm.refreshInterval = setInterval(function() {
          fetchAllTimeseries();
        }, vm.currentIntervalMs);
      } else {
        // Stop auto-refresh
        if (vm.refreshInterval) {
          clearInterval(vm.refreshInterval);
          vm.refreshInterval = null;
        }
      }

      // Trigger change detection for toggle state
      if (widgetContext.detectChanges) {
        widgetContext.detectChanges();
      }
    };

    // Initial fetch and start auto-refresh (interval will be adjusted based on detected sendInterval)
    fetchAllTimeseries();
    vm.refreshInterval = setInterval(function() {
      fetchAllTimeseries();
    }, vm.currentIntervalMs);

    // Expose helper functions to template
    vm.getInstallationTypeStyle = getInstallationTypeStyle;
    vm.getActivityColor = getActivityColor;

    // Navigation functions
    function cleanupAndNavigate(stateId) {
      // Clear refresh interval to prevent orphaned timers
      if (vm.refreshInterval) {
        clearInterval(vm.refreshInterval);
        vm.refreshInterval = null;
      }
      // Close dialog
      vm.dialogRef.close(null);
      // Navigate to target state with measurement context
      var params = {
        selectedMeasurement: {
          entityId: vm.measurementId,
          entityName: vm.entityName,
          entityLabel: vm.entityLabel
        },
        targetEntityParamName: 'selectedMeasurement'
      };
      widgetContext.stateController.openState(stateId, params, false);
    }

    vm.goToDetails = function() {
      // Navigate to measurement_dashboard - the markdown widget there handles the conditional display
      cleanupAndNavigate('measurement_dashboard');
    };

    vm.openParams = function() {
      // Clear refresh interval to prevent orphaned timers
      if (vm.refreshInterval) {
        clearInterval(vm.refreshInterval);
        vm.refreshInterval = null;
      }
      // Close dialog
      vm.dialogRef.close(null);
      // Open parameters dialog
      openMeasurementParametersDialog(widgetContext, vm.measurementId, null);
    };

    vm.formatTimestampDE = function(ms) {
      if (ms === null || ms === undefined) return '-';
      var value = Number(ms);
      if (!Number.isFinite(value) || value <= 0) return '-';
      var date = new Date(value);
      function pad(n) { return n.toString().padStart(2, '0'); }
      return pad(date.getDate()) + '.' + pad(date.getMonth() + 1) + '.' + date.getFullYear() +
        ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
    };

    vm.cancel = function() {
      if (vm.refreshInterval) {
        clearInterval(vm.refreshInterval);
        vm.refreshInterval = null;
      }
      vm.dialogRef.close(null);
      if (callback) {
        callback();
      }
    };
  }
}

// ============================================================================
// DELETE MEASUREMENT
// ============================================================================

/**
 * Opens a confirmation dialog and deletes the measurement
 * - Finds devices with FROM relation (type: Measurement)
 * - Moves devices to "Unassigned Measurement Devices" group
 * - Deletes the measurement asset
 *
 * @param {Object} widgetContext - ThingsBoard widget context
 * @param {Object} measurementId - Measurement entity ID { id: string, entityType: 'ASSET' }
 * @param {string} measurementName - Display name for confirmation dialog
 * @param {Function} callback - Optional callback after successful deletion
 */
export function deleteMeasurement(widgetContext, measurementId, measurementName, callback) {
  const $injector = widgetContext.$scope.$injector;
  const dialogs = $injector.get(widgetContext.servicesMap.get('dialogs'));
  const assetService = $injector.get(widgetContext.servicesMap.get('assetService'));
  const entityRelationService = $injector.get(widgetContext.servicesMap.get('entityRelationService'));
  const entityGroupService = $injector.get(widgetContext.servicesMap.get('entityGroupService'));
  const attributeService = $injector.get(widgetContext.servicesMap.get('attributeService'));

  let customerId = null;

  // Open confirmation dialog
  const title = 'Delete Measurement';
  const content = 'Are you sure you want to delete the measurement "' + measurementName + '"? All related devices will be unassigned.';

  dialogs.confirm(title, content, 'Cancel', 'Delete').subscribe(function(confirmed) {
    if (confirmed) {
      // First find the customer ID, then perform delete
      findCustomerId();
    }
  });

  function findCustomerId() {
    if (widgetContext.currentUser.authority !== 'TENANT_ADMIN') {
      // For customer users, use their customer ID
      customerId = { id: widgetContext.currentUser.customerId, entityType: 'CUSTOMER' };
      performDelete();
      return;
    }

    // For TENANT_ADMIN: Find customer via Measurement -> Project -> Customer relation chain
    // First find the Project (TO relation from Measurement)
    entityRelationService.findByTo(measurementId, 'Measurement').subscribe(
      function(relations) {
        if (relations && relations.length > 0) {
          // Found Project, now find Customer
          const projectId = relations[0].from;
          entityRelationService.findByTo(projectId, 'Measurement').subscribe(
            function(customerRelations) {
              if (customerRelations && customerRelations.length > 0) {
                customerId = customerRelations[0].from;
                performDelete();
              } else {
                console.error('Could not find customer for measurement');
                // Try to delete without unassigning devices
                deleteAsset();
              }
            },
            function(error) {
              console.error('Error finding customer:', error);
              deleteAsset();
            }
          );
        } else {
          console.error('Could not find project for measurement');
          deleteAsset();
        }
      },
      function(error) {
        console.error('Error finding project:', error);
        deleteAsset();
      }
    );
  }

  function performDelete() {
    // Find devices with FROM relation, type "Measurement"
    const relatedDevicesQuery = {
      parameters: {
        rootId: measurementId.id,
        rootType: 'ASSET',
        direction: 'FROM',
        relationTypeGroup: 'COMMON',
        maxLevel: 1
      },
      filters: [{ relationType: 'Measurement', entityTypes: ['DEVICE'] }]
    };

    entityRelationService.findByQuery(relatedDevicesQuery).subscribe(
      function(relations) {
        if (relations && relations.length > 0 && customerId) {
          // Get or create unassigned devices group, then unassign devices
          getOrCreateUnassignedDevicesGroup(customerId).subscribe(
            function(unassignedGroup) {
              unassignDevicesAndDelete(relations, unassignedGroup.id.id);
            },
            function(error) {
              console.error('Error getting unassigned devices group:', error);
              // Try to delete anyway
              deleteAsset();
            }
          );
        } else {
          // No devices to unassign or no customer found, just delete
          deleteAsset();
        }
      },
      function(error) {
        console.error('Error finding related devices:', error);
        // Try to delete anyway
        deleteAsset();
      }
    );
  }

  function getOrCreateUnassignedDevicesGroup(customerId) {
    return entityGroupService.getEntityGroupsByOwnerId(customerId.entityType, customerId.id, 'DEVICE').pipe(
      widgetContext.rxjs.switchMap(function(deviceGroups) {
        const unassignedGroup = deviceGroups.find(function(group) {
          return group.name === 'Unassigned Measurement Devices';
        });

        if (unassignedGroup) {
          return widgetContext.rxjs.of(unassignedGroup);
        } else {
          // Create the group
          const newGroup = {
            type: 'DEVICE',
            name: 'Unassigned Measurement Devices',
            ownerId: customerId
          };
          return entityGroupService.saveEntityGroup(newGroup);
        }
      })
    );
  }

  function unassignDevicesAndDelete(relations, unassignedGroupId) {
    let processed = 0;
    const total = relations.length;

    relations.forEach(function(relation) {
      const deviceId = relation.to;

      // Add to unassigned group
      entityGroupService.addEntityToEntityGroup(unassignedGroupId, deviceId.id).subscribe(
        function() {
          // Delete the relation
          entityRelationService.deleteRelation(measurementId, 'Measurement', deviceId).subscribe(
            function() {
              // Remove position attributes
              attributeService.deleteEntityAttributes(deviceId, 'SERVER_SCOPE', [{ key: 'xPos' }, { key: 'yPos' }]).subscribe(
                function() {
                  processed++;
                  if (processed >= total) {
                    deleteAsset();
                  }
                },
                function() {
                  processed++;
                  if (processed >= total) {
                    deleteAsset();
                  }
                }
              );
            },
            function() {
              processed++;
              if (processed >= total) {
                deleteAsset();
              }
            }
          );
        },
        function(error) {
          console.error('Error adding device to group:', error);
          processed++;
          if (processed >= total) {
            deleteAsset();
          }
        }
      );
    });
  }

  function deleteAsset() {
    assetService.deleteAsset(measurementId.id).subscribe(
      function() {
        widgetContext.updateAliases();
        if (callback) {
          callback();
        }
      },
      function(error) {
        console.error('Error deleting measurement:', error);
      }
    );
  }
}

/**
 * Opens the Edit Project dialog
 * @param {Object} widgetContext - ThingsBoard widget context
 * @param {Object} projectId - Project entity ID {id: string, entityType: 'ASSET'}
 * @param {string} projectName - Project name
 * @param {string} projectLabel - Project label
 * @param {Function} callback - Optional callback after save
 */
export function openEditProjectDialog(widgetContext, projectId, projectName, projectLabel, callback) {
  const $injector = widgetContext.$scope.$injector;
  const customDialog = $injector.get(widgetContext.servicesMap.get('customDialog'));
  const assetService = $injector.get(widgetContext.servicesMap.get('assetService'));
  const attributeService = $injector.get(widgetContext.servicesMap.get('attributeService'));
  const customerService = $injector.get(widgetContext.servicesMap.get('customerService'));

  // Load project data
  assetService.getAsset(projectId.id).subscribe(function(project) {
    // Load project attributes
    attributeService.getEntityAttributes(projectId, 'SERVER_SCOPE',
      ['latitude', 'longitude', 'address', 'postalCode', 'city', 'projectPicture', 'progress', 'startTimeMs', 'endTimeMs']
    ).subscribe(function(attributes) {
      const attrMap = {};
      attributes.forEach(function(a) { attrMap[a.key] = a.value; });

      // Load customer name
      if (project.customerId && project.customerId.id) {
        customerService.getCustomer(project.customerId.id).subscribe(function(customer) {
          openDialog(project, attrMap, customer ? customer.name : 'Unknown');
        });
      } else {
        openDialog(project, attrMap, 'Unknown');
      }
    });
  });

  function openDialog(project, attrMap, customerName) {
    const htmlTemplate = `<style>
/* ECO Design System - Edit Project Dialog */
mat-toolbar.eco-dialog-header,
.eco-dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px !important;
  height: 52px !important;
  min-height: 52px !important;
  background-color: var(--tb-primary-500) !important;
  background: var(--tb-primary-500) !important;
  color: white !important;
}
.eco-dialog-header .header-icon {
  font-size: 22px;
  width: 22px;
  height: 22px;
  color: white !important;
}
.eco-dialog-header .header-title {
  margin: 0;
  font-size: 17px;
  font-weight: 500;
  color: white !important;
}
.eco-dialog-header .close-btn {
  color: rgba(255,255,255,0.8) !important;
  margin-left: auto;
}
.eco-dialog-header .close-btn:hover {
  color: white !important;
  background: rgba(255,255,255,0.1) !important;
}
.dialog-content {
  padding: 16px 20px !important;
  background: #f8fafc !important;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 70vh;
  overflow-y: auto;
}
.section-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-left: 3px solid var(--tb-primary-500);
}
.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 600;
  font-size: 13px;
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
  padding: 12px 14px;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-top: 1px solid #e2e8f0;
  background: #fafafa;
}
.flex-1 { flex: 1; }
.w-full { width: 100%; }
.edit-project-form .mdc-text-field--filled.mdc-text-field--disabled {
  background-color: rgba(244, 249, 254, 0.5) !important;
}
.edit-project-form .mdc-text-field--filled:not(.mdc-text-field--disabled) {
  background-color: #F4F9FE !important;
}
.edit-project-form .disabled-field input {
  color: rgba(0, 0, 0, 0.6) !important;
}
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
  <mat-progress-bar color="warn" mode="indeterminate" *ngIf="isLoading$ | async">
  </mat-progress-bar>
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
      <div class="flex gap-2">
        <mat-form-field appearance="fill" style="flex: 1;">
          <mat-label>Postal Code</mat-label>
          <input matInput formControlName="postalCode">
        </mat-form-field>
        <mat-form-field appearance="fill" style="flex: 2;">
          <mat-label>City</mat-label>
          <input matInput formControlName="city">
        </mat-form-field>
      </div>
      <div class="flex gap-2">
        <mat-form-field appearance="fill" style="flex: 1;">
          <mat-label>Latitude</mat-label>
          <input matInput formControlName="latitude">
        </mat-form-field>
        <mat-form-field appearance="fill" style="flex: 1;">
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
      <div class="flex gap-2">
        <mat-form-field appearance="fill" style="flex: 1.5;">
          <mat-label>Start Date</mat-label>
          <mat-datetimepicker-toggle [for]="startDatePicker" matSuffix></mat-datetimepicker-toggle>
          <mat-datetimepicker #startDatePicker type="date" openOnFocus="true"></mat-datetimepicker>
          <input matInput formControlName="startDate" [matDatetimepicker]="startDatePicker">
        </mat-form-field>
        <mat-form-field appearance="fill" style="flex: 1;">
          <mat-label>Start Time</mat-label>
          <mat-datetimepicker-toggle [for]="startTimePicker" matSuffix></mat-datetimepicker-toggle>
          <mat-datetimepicker #startTimePicker type="time" openOnFocus="true"></mat-datetimepicker>
          <input matInput formControlName="startTime" [matDatetimepicker]="startTimePicker">
        </mat-form-field>
      </div>
      <div class="flex gap-2">
        <mat-form-field appearance="fill" style="flex: 1.5;">
          <mat-label>End Date</mat-label>
          <mat-datetimepicker-toggle [for]="endDatePicker" matSuffix></mat-datetimepicker-toggle>
          <mat-datetimepicker #endDatePicker type="date" openOnFocus="true"></mat-datetimepicker>
          <input matInput formControlName="endDate" [matDatetimepicker]="endDatePicker">
        </mat-form-field>
        <mat-form-field appearance="fill" style="flex: 1;">
          <mat-label>End Time</mat-label>
          <mat-datetimepicker-toggle [for]="endTimePicker" matSuffix></mat-datetimepicker-toggle>
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

    const cssTemplate = `
/* ECO Design System - Core Styles */
mat-toolbar.eco-dialog-header,
.eco-dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px !important;
  height: 52px !important;
  min-height: 52px !important;
  background-color: var(--tb-primary-500) !important;
  background: var(--tb-primary-500) !important;
  color: white !important;
}
.eco-dialog-header .header-icon {
  font-size: 22px;
  width: 22px;
  height: 22px;
  color: white !important;
}
.eco-dialog-header .header-title {
  margin: 0;
  font-size: 17px;
  font-weight: 500;
  color: white !important;
}
.eco-dialog-header .close-btn {
  color: rgba(255,255,255,0.8) !important;
  margin-left: auto;
}
.eco-dialog-header .close-btn:hover {
  color: white !important;
  background: rgba(255,255,255,0.1) !important;
}

.dialog-content {
  padding: 16px 20px !important;
  background: #f8fafc !important;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 70vh;
  overflow-y: auto;
}

.section-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-left: 3px solid var(--tb-primary-500);
}
.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 600;
  font-size: 13px;
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
  padding: 12px 14px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-top: 1px solid #e2e8f0;
  background: #fafafa;
}

.flex-1 { flex: 1; }
.w-full { width: 100%; }

/* Form field styling */
.edit-project-form .mdc-text-field--filled.mdc-text-field--disabled {
  background-color: rgba(244, 249, 254, 0.5) !important;
}
.edit-project-form .mat-mdc-form-field-disabled .mat-mdc-form-field-focus-overlay {
  background-color: rgba(244, 249, 254, 0.5) !important;
}
.edit-project-form .mdc-text-field--filled:not(.mdc-text-field--disabled) {
  background-color: #F4F9FE !important;
}
.edit-project-form .mat-mdc-form-field-focus-overlay {
  background-color: #F4F9FE !important;
}
.edit-project-form .disabled-field input {
  color: rgba(0, 0, 0, 0.6) !important;
}
.edit-project-form .disabled-field {
  background-color: rgba(244, 249, 254, 0.5) !important;
}`;

    customDialog.customDialog(htmlTemplate, EditProjectDialogController).subscribe();

    function EditProjectDialogController(instance) {
      const vm = instance;

      vm.project = project;
      vm.attrMap = attrMap;

      // Initialize date values from timestamps
      let startDate = null;
      let startTime = null;
      let endDate = null;
      let endTime = null;

      if (attrMap.startTimeMs) {
        const startDateTime = new Date(Number(attrMap.startTimeMs));
        startDate = startDateTime;
        startTime = startDateTime;
      }
      if (attrMap.endTimeMs) {
        const endDateTime = new Date(Number(attrMap.endTimeMs));
        endDate = endDateTime;
        endTime = endDateTime;
      }

      vm.editProjectFormGroup = vm.fb.group({
        customerName: [{ value: customerName, disabled: true }],
        name: [{ value: project.name, disabled: true }],
        entityLabel: [project.label || ''],
        projectPicture: [attrMap.projectPicture || null],
        // Status fields
        progress: [attrMap.progress || 'in preparation'],
        startDate: [startDate],
        startTime: [startTime],
        endDate: [endDate],
        endTime: [endTime],
        // Address fields
        address: [attrMap.address || ''],
        postalCode: [attrMap.postalCode || ''],
        city: [attrMap.city || ''],
        latitude: [attrMap.latitude || ''],
        longitude: [attrMap.longitude || '']
      });

      // Auto-set start/end time when progress changes
      vm.editProjectFormGroup.get('progress').valueChanges.subscribe(function(progress) {
        const startDateControl = vm.editProjectFormGroup.get('startDate');
        const startTimeControl = vm.editProjectFormGroup.get('startTime');
        const endDateControl = vm.editProjectFormGroup.get('endDate');
        const endTimeControl = vm.editProjectFormGroup.get('endTime');

        if (progress === 'active' && !startDateControl.value && !startTimeControl.value) {
          const now = new Date();
          startDateControl.setValue(now);
          startTimeControl.setValue(now);
          startDateControl.markAsDirty();
          startTimeControl.markAsDirty();
        } else if ((progress === 'finished' || progress === 'aborted') &&
                   startDateControl.value && startTimeControl.value &&
                   !endDateControl.value && !endTimeControl.value) {
          const now = new Date();
          endDateControl.setValue(now);
          endTimeControl.setValue(now);
          endDateControl.markAsDirty();
          endTimeControl.markAsDirty();
        }
      });

      // --- Address search state ---
      vm.addressOptions = [];
      vm._lastSelectedAddressLabel = null;

      vm.displayAddressOption = function(opt) {
        if (!opt) return '';
        return (typeof opt === 'string') ? opt : (opt.label || '');
      };

      vm.searchAddress = function() {
        const qRaw = vm.editProjectFormGroup.get('address').value || '';
        const q = (typeof qRaw === 'string') ? qRaw.trim() : vm.displayAddressOption(qRaw).trim();
        if (q.length < 5) {
          vm.addressOptions = [];
          return;
        }
        searchAddressViaPhoton(q);
      };

      vm.onAddressSelected = function(opt) {
        if (!opt) return;
        vm._lastSelectedAddressLabel = opt.label;

        const patchData = {
          address: opt.label,
          latitude: opt.lat,
          longitude: opt.lon
        };

        const currentPostalCode = (vm.editProjectFormGroup.get('postalCode').value || '').trim();
        const currentCity = (vm.editProjectFormGroup.get('city').value || '').trim();

        if (!currentPostalCode && opt.postcode) {
          patchData.postalCode = opt.postcode;
        }
        if (!currentCity && opt.city) {
          patchData.city = opt.city;
        }

        vm.editProjectFormGroup.patchValue(patchData);
        vm.editProjectFormGroup.get('address').markAsDirty();
        vm.editProjectFormGroup.get('latitude').markAsDirty();
        vm.editProjectFormGroup.get('longitude').markAsDirty();

        if (!currentPostalCode && opt.postcode) {
          vm.editProjectFormGroup.get('postalCode').markAsDirty();
        }
        if (!currentCity && opt.city) {
          vm.editProjectFormGroup.get('city').markAsDirty();
        }

        vm.addressOptions = [];
      };

      // --- Debounced auto-search ---
      let addrTimer = null;
      let lastQuery = '';

      vm.editProjectFormGroup.get('address').valueChanges.subscribe(function(val) {
        if (typeof val === 'string' && vm._lastSelectedAddressLabel && val === vm._lastSelectedAddressLabel) {
          return;
        }

        const s = (typeof val === 'string')
          ? val.trim()
          : (vm.displayAddressOption(val) || '').trim();

        if (s.length < 5) {
          vm.addressOptions = [];
          lastQuery = s;
          if (addrTimer) {
            clearTimeout(addrTimer);
            addrTimer = null;
          }
          return;
        }

        if (s === lastQuery) return;
        lastQuery = s;

        if (addrTimer) clearTimeout(addrTimer);
        addrTimer = setTimeout(function() {
          searchAddressViaPhoton(s);
        }, 350);
      });

      function searchAddressViaPhoton(query) {
        const postalCode = (vm.editProjectFormGroup.get('postalCode').value || '').trim();
        const city = (vm.editProjectFormGroup.get('city').value || '').trim();

        let refinedQuery = query;
        if (postalCode) refinedQuery += ' ' + postalCode;
        if (city) refinedQuery += ' ' + city;

        const url = 'https://photon.komoot.io/api?q=' + encodeURIComponent(refinedQuery) + '&limit=5';

        fetch(url)
          .then(function(res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
          })
          .then(function(data) {
            const features = (data && data.features) ? data.features : [];
            vm.addressOptions = features.map(function(f) {
              const p = f.properties || {};
              const coords = (f.geometry && f.geometry.coordinates) ? f.geometry.coordinates : [null, null];
              const lon = coords[0];
              const lat = coords[1];

              const street = p.street || p.name || '';
              const house = p.housenumber ? (' ' + p.housenumber) : '';
              const place = (street + house).trim() || (p.label || p.name || '').trim();

              const cc = (p.countrycode || '').toUpperCase();
              const postcode = p.postcode || '';
              const cityFromResult = p.city || p.town || p.village || p.state || '';

              let tail = '';
              if (cc || postcode || cityFromResult) {
                tail = (cc ? cc : '');
                if (cc && postcode) tail += '-' + postcode;
                else if (!cc && postcode) tail += postcode;
                if ((cc || postcode) && cityFromResult) tail += ' ' + cityFromResult;
                else if (!cc && !postcode && cityFromResult) tail += cityFromResult;
              }

              const label = tail ? (place + ', ' + tail) : place;

              return {
                label: label,
                lat: (typeof lat === 'number') ? lat : parseFloat(lat),
                lon: (typeof lon === 'number') ? lon : parseFloat(lon),
                postcode: postcode,
                city: cityFromResult,
                raw: f
              };
            });
          })
          .catch(function(err) {
            console.error('Address search failed', err);
            vm.addressOptions = [];
          });
      }

      vm.cancel = function() {
        vm.dialogRef.close(null);
      };

      function parseDateTime(dateObj, timeObj) {
        if (!dateObj || !timeObj) return null;
        const date = new Date(dateObj);
        const time = new Date(timeObj);
        date.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds());
        return date;
      }

      vm.save = function() {
        vm.editProjectFormGroup.markAsPristine();

        // Update asset label
        const formValues = vm.editProjectFormGroup.getRawValue();
        const updatedProject = Object.assign({}, vm.project, {
          label: formValues.entityLabel
        });

        // Parse date/time values
        const startDateTime = parseDateTime(formValues.startDate, formValues.startTime);
        const endDateTime = parseDateTime(formValues.endDate, formValues.endTime);

        assetService.saveAsset(updatedProject).subscribe(function() {
          // Save attributes
          const attributesArray = [
            { key: 'latitude', value: formValues.latitude || vm.attrMap.latitude || 48.1406022 },
            { key: 'longitude', value: formValues.longitude || vm.attrMap.longitude || 16.2932688 },
            { key: 'address', value: formValues.address || '' },
            { key: 'postalCode', value: formValues.postalCode || '' },
            { key: 'city', value: formValues.city || '' },
            { key: 'progress', value: formValues.progress },
            { key: 'startTimeMs', value: startDateTime ? startDateTime.getTime() : null },
            { key: 'endTimeMs', value: endDateTime ? endDateTime.getTime() : null }
          ];

          if (formValues.projectPicture) {
            attributesArray.push({ key: 'projectPicture', value: formValues.projectPicture });
          }

          attributeService.saveEntityAttributes(projectId, 'SERVER_SCOPE', attributesArray).subscribe(function() {
            widgetContext.updateAliases();
            vm.dialogRef.close(null);
            if (callback) {
              callback();
            }
          });
        });
      };
    }
  }
}

// ============================================================================
// REPROCESS CALCULATED FIELDS DIALOG
// ============================================================================

/**
 * Opens the Reprocess Calculated Fields dialog
 * Allows reprocessing of calculated fields for a measurement
 *
 * @param {Object} widgetContext - ThingsBoard widget context
 * @param {Object} measurementId - Measurement entity ID { id: string, entityType: 'ASSET' }
 * @param {Function} callback - Optional callback after reprocessing
 */
export function openReprocessDialog(widgetContext, measurementId, callback) {
  const $injector = widgetContext.$scope.$injector;
  const customDialog = $injector.get(widgetContext.servicesMap.get('customDialog'));
  const http = $injector.get(widgetContext.servicesMap.get('http'));
  const attributeService = $injector.get(widgetContext.servicesMap.get('attributeService'));

  // Calculated Field IDs grouped by category
  const cfGroups = {
    basic: {
      label: 'Basic (is_on, load_class, dT_flag, data_quality)',
      id: '6cac3240-0211-11f1-9b0a-33b9bcf3ddd0'
    },
    power: {
      label: 'Power (P_th_calc_kW, P_deviation_pct, P_sensor_flag)',
      id: '8d2f1a50-0211-11f1-9979-9f3434877bb4'
    },
    schedule: {
      label: 'Schedule (schedule_violation)',
      id: 'aee1f6e0-0211-11f1-9979-9f3434877bb4'
    },
    oscillation: {
      label: 'Oscillation Detection',
      id: '30eb6890-0133-11f1-9979-9f3434877bb4'
    },
    dt_collapse: {
      label: 'dT Collapse Flag',
      id: '684c01c0-0127-11f1-9979-9f3434877bb4'
    },
    flow_spike: {
      label: 'Flow Spike Flag',
      id: '685884e0-0127-11f1-9979-9f3434877bb4'
    },
    power_stability: {
      label: 'Power Stability',
      id: 'a065a960-0129-11f1-9979-9f3434877bb4'
    },
    runtime_pct: {
      label: 'Runtime Percentage',
      id: 'a06e8300-0129-11f1-9979-9f3434877bb4'
    },
    cycling: {
      label: 'Cycling Flag',
      id: 'aedba340-012a-11f1-9979-9f3434877bb4'
    }
  };

  // Fetch measurement timestamps to get time range
  attributeService.getEntityAttributes(measurementId, 'SERVER_SCOPE', ['startTimeMs', 'endTimeMs']).subscribe(
    function(attributes) {
      const attrMap = {};
      attributes.forEach(function(a) { attrMap[a.key] = a.value; });
      openDialog(attrMap);
    },
    function(error) {
      console.error('Error fetching measurement attributes:', error);
      openDialog({});
    }
  );

  function openDialog(attrMap) {
    const htmlTemplate = `<style>
/* ECO Design System - Reprocess Dialog */
mat-toolbar.eco-dialog-header,
.eco-dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px !important;
  height: 52px !important;
  min-height: 52px !important;
  background-color: var(--tb-primary-500) !important;
  background: var(--tb-primary-500) !important;
  color: white !important;
}
.eco-dialog-header .header-icon {
  font-size: 22px;
  width: 22px;
  height: 22px;
  color: white !important;
}
.eco-dialog-header .header-title {
  margin: 0;
  font-size: 17px;
  font-weight: 500;
  color: white !important;
}
.eco-dialog-header .close-btn {
  color: rgba(255,255,255,0.8) !important;
  margin-left: auto;
}
.eco-dialog-header .close-btn:hover {
  color: white !important;
  background: rgba(255,255,255,0.1) !important;
}
.dialog-content {
  padding: 16px 20px !important;
  background: #f8fafc !important;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 60vh;
  overflow-y: auto;
}
.section-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-left: 3px solid var(--tb-primary-500);
  border-radius: 4px;
}
.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 600;
  font-size: 13px;
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
  padding: 12px 14px;
}
.cf-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cf-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
}
.cf-item mat-checkbox {
  font-size: 14px;
}
.select-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}
.select-actions button {
  font-size: 12px;
  padding: 4px 8px;
  min-width: auto;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-top: 1px solid #e2e8f0;
  background: #fafafa;
}
.result-message {
  padding: 12px 16px;
  border-radius: 4px;
  margin-top: 8px;
}
.result-success {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #86efac;
}
.result-error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}
.result-message mat-icon {
  vertical-align: middle;
  margin-right: 8px;
}
.flex-1 { flex: 1; }
.w-full { width: 100%; }
</style>
<form #reprocessForm="ngForm" [formGroup]="reprocessFormGroup"
      (ngSubmit)="reprocess()" class="reprocess-form" style="width: 500px; max-width: 90vw;">
  <mat-toolbar class="eco-dialog-header">
    <mat-icon class="header-icon">refresh</mat-icon>
    <h2 class="header-title">Reprocess Calculated Fields</h2>
    <span class="flex-1"></span>
    <button mat-icon-button (click)="cancel()" type="button" class="close-btn">
      <mat-icon>close</mat-icon>
    </button>
  </mat-toolbar>
  <mat-progress-bar color="warn" mode="indeterminate" *ngIf="isLoading">
  </mat-progress-bar>
  <div style="height: 4px;" *ngIf="!isLoading"></div>
  <div class="dialog-content">

    <!-- Derived Fields Section -->
    <div class="section-card">
      <div class="section-header">
        <mat-icon>calculate</mat-icon>
        <span>Derived Fields</span>
      </div>
      <div class="section-body">
        <div class="select-actions">
          <button mat-stroked-button type="button" (click)="selectAll()">Select All</button>
          <button mat-stroked-button type="button" (click)="selectNone()">Deselect All</button>
        </div>
        <div class="cf-group">
          <div class="cf-item" *ngFor="let cf of cfList">
            <mat-checkbox [formControlName]="cf.key">{{ cf.label }}</mat-checkbox>
          </div>
        </div>
      </div>
    </div>

    <!-- Result Message -->
    <div *ngIf="resultMessage" class="result-message" [ngClass]="resultSuccess ? 'result-success' : 'result-error'">
      <mat-icon>{{ resultSuccess ? 'check_circle' : 'error' }}</mat-icon>
      {{ resultMessage }}
    </div>

  </div>
  <div class="dialog-footer">
    <button mat-button type="button" (click)="cancel()">Cancel</button>
    <button mat-raised-button color="primary" type="submit"
            [disabled]="isLoading || !hasSelection()">
      <mat-icon>refresh</mat-icon>
      Reprocess Selected
    </button>
  </div>
</form>`;

    customDialog.customDialog(htmlTemplate, ReprocessDialogController, {
      measurementId,
      cfGroups,
      attrMap
    }).subscribe();
  }

  function ReprocessDialogController(instance) {
    const vm = instance;
    const config = vm.data;

    vm.isLoading = false;
    vm.resultMessage = '';
    vm.resultSuccess = false;
    vm.measurementId = config.measurementId;
    vm.startTs = config.attrMap.startTimeMs || (Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: 30 days ago
    vm.endTs = config.attrMap.endTimeMs || Date.now();

    // Build CF list for checkboxes
    vm.cfList = Object.keys(config.cfGroups).map(function(key) {
      return {
        key: key,
        label: config.cfGroups[key].label,
        id: config.cfGroups[key].id
      };
    });

    // Create form group with checkbox for each CF
    const formGroupConfig = {};
    vm.cfList.forEach(function(cf) {
      formGroupConfig[cf.key] = [false];
    });
    vm.reprocessFormGroup = vm.fb.group(formGroupConfig);

    vm.selectAll = function() {
      vm.cfList.forEach(function(cf) {
        vm.reprocessFormGroup.get(cf.key).setValue(true);
      });
    };

    vm.selectNone = function() {
      vm.cfList.forEach(function(cf) {
        vm.reprocessFormGroup.get(cf.key).setValue(false);
      });
    };

    vm.hasSelection = function() {
      return vm.cfList.some(function(cf) {
        return vm.reprocessFormGroup.get(cf.key).value === true;
      });
    };

    vm.cancel = function() {
      vm.dialogRef.close(null);
    };

    vm.reprocess = function() {
      if (!vm.hasSelection()) {
        vm.resultMessage = 'Please select at least one calculated field.';
        vm.resultSuccess = false;
        return;
      }

      vm.isLoading = true;
      vm.resultMessage = '';

      // Get selected CF IDs
      const selectedCfs = vm.cfList.filter(function(cf) {
        return vm.reprocessFormGroup.get(cf.key).value === true;
      });

      // Process each selected CF sequentially
      let completed = 0;
      let errors = [];
      let successes = [];

      function processNext(index) {
        if (index >= selectedCfs.length) {
          // All done
          vm.isLoading = false;
          if (errors.length === 0) {
            vm.resultSuccess = true;
            vm.resultMessage = 'Successfully started reprocessing for ' + successes.length + ' calculated field(s).';
          } else if (successes.length > 0) {
            vm.resultSuccess = false;
            vm.resultMessage = 'Reprocessing started for ' + successes.length + ' field(s), but ' + errors.length + ' failed: ' + errors.join(', ');
          } else {
            vm.resultSuccess = false;
            vm.resultMessage = 'Reprocessing failed: ' + errors.join(', ');
          }
          if (callback && successes.length > 0) {
            callback();
          }
          return;
        }

        const cf = selectedCfs[index];
        const url = '/api/calculatedField/' + cf.id + '/reprocess?startTs=' + vm.startTs + '&endTs=' + vm.endTs;

        http.get(url).subscribe(
          function(response) {
            successes.push(cf.label);
            processNext(index + 1);
          },
          function(error) {
            console.error('Reprocess error for ' + cf.key + ':', error);
            errors.push(cf.label);
            processNext(index + 1);
          }
        );
      }

      processNext(0);
    };
  }
}
