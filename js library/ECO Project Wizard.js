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

const startProjectHtmlTemplate = `<form [formGroup]="startProjectFormGroup" (ngSubmit)="save()" class="start-project-form" style="width: 500px;">
  <mat-toolbar class="flex items-center" color="primary">
    <mat-icon style="margin-right: 12px;">rocket_launch</mat-icon>
    <h2 style="margin: 0; font-size: 18px;">{{ 'custom.project-wizard.dialog-title' | translate }}</h2>
    <span class="flex-1"></span>
    <button mat-icon-button (click)="cancel()" type="button">
      <mat-icon>close</mat-icon>
    </button>
  </mat-toolbar>

  <mat-progress-bar color="warn" mode="indeterminate" *ngIf="isLoading"></mat-progress-bar>
  <div style="height: 4px;" *ngIf="!isLoading"></div>

  <div mat-dialog-content class="flex flex-col p-4" style="max-height: 60vh; overflow-y: auto;">
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
    </div>
  </div>

  <div class="flex justify-end items-center gap-2 p-4" style="border-top: 1px solid #e0e0e0; background: #fafafa;">
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
  <mat-toolbar class="flex items-center" color="warn">
    <mat-icon style="margin-right: 12px;">stop_circle</mat-icon>
    <h2 style="margin: 0; font-size: 18px;">{{ 'custom.project-wizard.finish-dialog-title' | translate }}: {{ projectName }}</h2>
    <span class="flex-1"></span>
    <button mat-icon-button (click)="cancelFinish()" type="button">
      <mat-icon>close</mat-icon>
    </button>
  </mat-toolbar>

  <mat-progress-bar color="warn" mode="indeterminate" *ngIf="isFinishLoading"></mat-progress-bar>
  <div style="height: 4px;" *ngIf="!isFinishLoading"></div>

  <div mat-dialog-content class="flex flex-col p-4 gap-3">
    <div class="flex items-center gap-2 p-3" style="background-color: #fff3e0; color: #e65100; border-radius: 4px;">
      <mat-icon>warning</mat-icon>
      <span>{{ 'custom.project-wizard.finish-warning' | translate }}</span>
    </div>

    <mat-form-field appearance="outline">
      <mat-label>{{ 'custom.project-wizard.progress' | translate }}</mat-label>
      <mat-select formControlName="progress">
        <mat-option value="finished">{{ 'custom.project-wizard.finished' | translate }}</mat-option>
        <mat-option value="aborted">{{ 'custom.project-wizard.aborted' | translate }}</mat-option>
      </mat-select>
    </mat-form-field>

    <div class="flex gap-2">
      <mat-form-field appearance="outline" class="flex-1">
        <mat-label>{{ 'custom.project-wizard.start-date' | translate }}</mat-label>
        <input matInput [matDatepicker]="startDatePicker" formControlName="startDate" readonly>
        <mat-datepicker-toggle matSuffix [for]="startDatePicker" disabled></mat-datepicker-toggle>
        <mat-datepicker #startDatePicker disabled></mat-datepicker>
      </mat-form-field>
      <mat-form-field appearance="outline" style="width: 120px;">
        <mat-label>{{ 'custom.project-wizard.start-time' | translate }}</mat-label>
        <input matInput type="time" formControlName="startTime" readonly>
      </mat-form-field>
    </div>

    <div class="flex gap-2">
      <mat-form-field appearance="outline" class="flex-1">
        <mat-label>{{ 'custom.project-wizard.end-date' | translate }}</mat-label>
        <input matInput [matDatepicker]="endDatePicker" formControlName="endDate">
        <mat-datepicker-toggle matSuffix [for]="endDatePicker"></mat-datepicker-toggle>
        <mat-datepicker #endDatePicker></mat-datepicker>
      </mat-form-field>
      <mat-form-field appearance="outline" style="width: 120px;">
        <mat-label>{{ 'custom.project-wizard.end-time' | translate }}</mat-label>
        <input matInput type="time" formControlName="endTime">
      </mat-form-field>
    </div>
  </div>

  <div class="flex justify-end items-center gap-2 p-4" style="border-top: 1px solid #e0e0e0; background: #fafafa;">
    <button mat-button type="button" (click)="cancelFinish()">{{ 'custom.project-wizard.cancel' | translate }}</button>
    <button mat-raised-button color="warn" type="submit" [disabled]="isFinishLoading">
      <mat-icon style="font-size: 18px; margin-right: 4px;">save</mat-icon> {{ 'custom.project-wizard.save' | translate }}
    </button>
  </div>
</form>`;

const startProjectCss = `.measurement-card:hover {
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

    function updateValidation() {
      // Only show warning for ultrasonic measurements that are in preparation or planned
      var ultrasonicWithoutDevice = vm.measurements.filter(function(m) {
        return m.measurementType === 'ultrasonic' &&
               !m.hasDevice &&
               (m.progress === 'in preparation' || m.progress === 'planned');
      });
      if (ultrasonicWithoutDevice.length > 0) {
        vm.canStart = false;
        vm.validationError = 'Cannot start: ' + ultrasonicWithoutDevice.length +
          ' ultrasonic measurement(s) without P-Flow D116 device assigned.';
      } else {
        vm.canStart = true;
        vm.validationError = null;
      }
    }

    updateValidation();

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

      // Close the current dialog first
      vm.dialogRef.close(null);

      // Open the device assignment dialog
      dataImporter.assignDeviceToMeasurement(
        dialogWidgetContext,
        measurement.id,
        measurement.name,
        function() {
          // After device assignment, refresh the project wizard
          if (typeof onClose === 'function') {
            onClose();
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

      updateOperations.push(unassignDevices(measurements));

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

    function unassignDevices(measurementsList) {
      var measurementsWithDevices = measurementsList.filter(function(m) {
        return m.devices && m.devices.length > 0;
      });
      if (!measurementsWithDevices.length) {
        return of([]);
      }

      return assetService.getAsset(projectId.id).pipe(
        switchMap(function(projectAsset) {
          var customerId = projectAsset && projectAsset.customerId ? projectAsset.customerId : null;
          if (!customerId || !customerId.id) {
            return of([]);
          }

          return getUnassignedDevicesGroup(customerId).pipe(
            switchMap(function(group) {
              if (!group || !group.id || !group.id.id) {
                return of([]);
              }

              var operations = [];
              var deviceIds = [];

              measurementsWithDevices.forEach(function(m) {
                m.devices.forEach(function(device) {
                  var fromEntity = { id: m.id.id, entityType: 'ASSET' };
                  var toEntity = { id: device.id.id, entityType: 'DEVICE' };
                  operations.push(
                    entityRelationService.deleteRelation(fromEntity, 'Measurement', toEntity)
                  );
                  deviceIds.push(device.id.id);
                });
              });

              var uniqueDeviceIds = Array.from(new Set(deviceIds));
              if (uniqueDeviceIds.length) {
                operations.push(
                  entityGroupService.addEntitiesToEntityGroup(group.id.id, uniqueDeviceIds)
                );
              }

              return operations.length ? forkJoin(operations) : of([]);
            })
          );
        })
      );
    }

    function getUnassignedDevicesGroup(customerId) {
      return entityGroupService.getEntityGroupsByOwnerId(
        customerId.entityType,
        customerId.id,
        'DEVICE'
      ).pipe(
        switchMap(function(groups) {
          var group = groups.find(function(g) { return g.name === 'Unassigned Measurement Devices'; });
          if (group) {
            return of(group);
          }
          var newGroup = {
            type: 'DEVICE',
            name: 'Unassigned Measurement Devices',
            ownerId: customerId
          };
          return entityGroupService.saveEntityGroup(newGroup);
        })
      );
    }
  }
}

// ============================================================================
// ADD MEASUREMENT DIALOG
// ============================================================================

const addMeasurementHtmlTemplate = `<form [formGroup]="addMeasurementFormGroup" (ngSubmit)="save()" class="add-entity-form" style="width: 420px;">
  <mat-toolbar class="flex items-center" color="primary">
    <mat-icon style="margin-right: 12px;">assessment</mat-icon>
    <h2 style="margin: 0; font-size: 18px;">{{'custom.projects.measurements.add-measurement' | translate}}</h2>
    <span class="flex-1"></span>
    <button mat-icon-button (click)="cancel()" type="button">
      <mat-icon>close</mat-icon>
    </button>
  </mat-toolbar>

  <mat-progress-bar color="warn" mode="indeterminate" *ngIf="isLoading"></mat-progress-bar>
  <div style="height: 4px;" *ngIf="!isLoading"></div>

  <div mat-dialog-content class="flex flex-col p-4 gap-1">
    <!-- Measurement Name (auto-generated, readonly) -->
    <mat-form-field appearance="outline" class="w-full">
      <mat-label>{{'custom.projects.measurements.measurement-title' | translate}}</mat-label>
      <input matInput formControlName="name" readonly>
      <mat-icon matSuffix style="color: #666;">badge</mat-icon>
      <mat-hint>Auto-generated measurement name</mat-hint>
    </mat-form-field>

    <!-- Entity Label -->
    <mat-form-field appearance="outline" class="w-full">
      <mat-label>Label</mat-label>
      <input matInput formControlName="label" placeholder="e.g. Main Heating Circuit">
      <mat-icon matSuffix style="color: #666;">label</mat-icon>
      <mat-hint>Optional descriptive label</mat-hint>
    </mat-form-field>

    <!-- Measurement Type -->
    <div class="flex items-center gap-2 mt-2 mb-1" style="color: #305680;">
      <mat-icon style="font-size: 18px; width: 18px; height: 18px;">category</mat-icon>
      <span style="font-weight: 600; font-size: 13px;">Measurement Type</span>
    </div>
    <mat-form-field appearance="outline" class="w-full">
      <mat-label>{{'custom.measurement.administration.action.measurement-type.title' | translate}}</mat-label>
      <mat-select formControlName="measurementType" required>
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
    <mat-form-field appearance="outline" class="w-full" *ngIf="addMeasurementFormGroup.get('measurementType')?.value !== 'loraWan'">
      <mat-label>{{'custom.diagnostics.action.edit-measurement-parameters.installation-type.title' | translate}}</mat-label>
      <mat-select formControlName="installationType" required>
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

  <div class="flex justify-end items-center gap-2 p-4" style="border-top: 1px solid #e0e0e0; background: #fafafa;">
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

const measurementParametersHtmlTemplate = `<form [formGroup]="parametersFormGroup" (ngSubmit)="save()" class="measurement-parameters-form" style="width: 600px;">
  <mat-toolbar class="flex items-center" color="primary">
    <mat-icon style="margin-right: 12px;">tune</mat-icon>
    <h2 style="margin: 0; font-size: 18px;">Edit Measurement Parameters</h2>
    <span class="flex-1"></span>
    <button mat-icon-button (click)="cancel()" type="button">
      <mat-icon>close</mat-icon>
    </button>
  </mat-toolbar>

  <mat-progress-bar color="warn" mode="indeterminate" *ngIf="isLoading"></mat-progress-bar>
  <div style="height: 4px;" *ngIf="!isLoading"></div>

  <div mat-dialog-content class="flex flex-col p-4" style="max-height: 70vh; overflow-y: auto;">

    <!-- Measurement Info Section -->
    <fieldset class="fieldset" style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
      <legend class="flex items-center gap-2" style="font-weight: 600; color: #305680; padding: 0 8px;">
        <mat-icon style="font-size: 18px; width: 18px; height: 18px;">sensors</mat-icon>
        Measurement
      </legend>
      <mat-form-field appearance="fill" class="w-full">
        <mat-label>Name (System)</mat-label>
        <input matInput [value]="entityName" readonly disabled>
      </mat-form-field>
      <mat-form-field appearance="fill" class="w-full">
        <mat-label>Label</mat-label>
        <input matInput formControlName="entityLabel" placeholder="Display name for this measurement">
      </mat-form-field>
    </fieldset>

    <!-- Status Section (Progress, Start/End Time) -->
    <fieldset class="fieldset" style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
      <legend class="flex items-center gap-2" style="font-weight: 600; color: #305680; padding: 0 8px;">
        <mat-icon style="font-size: 18px; width: 18px; height: 18px;">timeline</mat-icon>
        Status
      </legend>

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
          <mat-datetimepicker-toggle [for]="startDatePicker" matPrefix></mat-datetimepicker-toggle>
          <mat-datetimepicker #startDatePicker type="date" openOnFocus="true"></mat-datetimepicker>
          <input matInput formControlName="startDate" [matDatetimepicker]="startDatePicker">
        </mat-form-field>
        <mat-form-field appearance="fill" style="flex: 1;">
          <mat-label>Start Time</mat-label>
          <mat-datetimepicker-toggle [for]="startTimePicker" matPrefix></mat-datetimepicker-toggle>
          <mat-datetimepicker #startTimePicker type="time" openOnFocus="true"></mat-datetimepicker>
          <input matInput formControlName="startTime" [matDatetimepicker]="startTimePicker">
        </mat-form-field>
      </div>

      <!-- End Date and Time -->
      <div class="flex gap-2">
        <mat-form-field appearance="fill" style="flex: 1.5;">
          <mat-label>End Date</mat-label>
          <mat-datetimepicker-toggle [for]="endDatePicker" matPrefix></mat-datetimepicker-toggle>
          <mat-datetimepicker #endDatePicker type="date" openOnFocus="true"></mat-datetimepicker>
          <input matInput formControlName="endDate" [matDatetimepicker]="endDatePicker">
        </mat-form-field>
        <mat-form-field appearance="fill" style="flex: 1;">
          <mat-label>End Time</mat-label>
          <mat-datetimepicker-toggle [for]="endTimePicker" matPrefix></mat-datetimepicker-toggle>
          <mat-datetimepicker #endTimePicker type="time" openOnFocus="true"></mat-datetimepicker>
          <input matInput formControlName="endTime" [matDatetimepicker]="endTimePicker">
        </mat-form-field>
      </div>
    </fieldset>

    <!-- Dimension Section -->
    <fieldset class="fieldset" style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
      <legend class="flex items-center gap-2" style="font-weight: 600; color: #305680; padding: 0 8px;">
        <mat-icon style="font-size: 18px; width: 18px; height: 18px;">straighten</mat-icon>
        Dimension
      </legend>
      <div class="flex gap-2">
        <mat-form-field appearance="fill" style="flex: 1;">
          <mat-label>Dimension</mat-label>
          <mat-select formControlName="dimension" required>
            <mat-option *ngFor="let dim of dimensionOptions" [value]="dim">{{ dim }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="fill" style="flex: 1.5;">
          <mat-label>Nominal Flow (m³/hr)</mat-label>
          <input matInput formControlName="nominalFlow" type="number" readonly>
        </mat-form-field>
      </div>
      <div class="flex gap-2">
        <mat-form-field appearance="fill" style="flex: 1;">
          <mat-label>Floor Volume (m³/hr)</mat-label>
          <input matInput formControlName="deltaTAnalysisFloorVolume" type="number">
        </mat-form-field>
        <mat-form-field appearance="fill" style="flex: 1;">
          <mat-label>Pump Power (W)</mat-label>
          <input matInput formControlName="deltaTAnalysisPumpEnergy" type="number">
        </mat-form-field>
      </div>
    </fieldset>

    <!-- Installation Section -->
    <fieldset class="fieldset" style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
      <legend class="flex items-center gap-2" style="font-weight: 600; color: #305680; padding: 0 8px;">
        <mat-icon style="font-size: 18px; width: 18px; height: 18px;">build</mat-icon>
        Installation
      </legend>
      <div class="flex gap-2">
        <mat-form-field appearance="fill" style="flex: 1;">
          <mat-label>Installation Type</mat-label>
          <mat-select formControlName="installationType" required>
            <mat-option value="heating">Heating</mat-option>
            <mat-option value="cooling">Cooling</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="fill" style="flex: 1.5;">
          <mat-label>Installation Type Options</mat-label>
          <mat-select formControlName="installationTypeOptions" required>
            <ng-container *ngIf="parametersFormGroup.get('installationType')?.value === 'heating'">
              <mat-option value="radiatorHeating">Radiator Heating</mat-option>
              <mat-option value="floorHeating">Floor Heating</mat-option>
              <mat-option value="districtHeating">District Heating</mat-option>
              <mat-option value="heatingOther">Heating Other</mat-option>
            </ng-container>
            <ng-container *ngIf="parametersFormGroup.get('installationType')?.value === 'cooling'">
              <mat-option value="coolingCircuit">Cooling Circuit</mat-option>
              <mat-option value="coolingCeiling">Cooling Ceiling</mat-option>
              <mat-option value="chiller">Chiller</mat-option>
              <mat-option value="coolingOther">Cooling Other</mat-option>
            </ng-container>
          </mat-select>
        </mat-form-field>
      </div>
    </fieldset>

    <!-- Analysis Section -->
    <fieldset class="fieldset" style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
      <legend class="flex items-center gap-2" style="font-weight: 600; color: #305680; padding: 0 8px;">
        <mat-icon style="font-size: 18px; width: 18px; height: 18px;">analytics</mat-icon>
        Analysis
      </legend>
      <div class="flex gap-2">
        <mat-form-field appearance="fill" style="flex: 2;">
          <mat-label>Standard Outdoor Temp.</mat-label>
          <input matInput formControlName="standardOutdoorTemperature" type="number">
        </mat-form-field>
        <mat-form-field appearance="fill" style="flex: 1;">
          <mat-label>Delta T</mat-label>
          <input matInput formControlName="deltaT" type="number">
        </mat-form-field>
      </div>
      <div class="flex gap-2">
        <mat-form-field appearance="fill" style="flex: 1.5;">
          <mat-label>Outside Temp. Threshold</mat-label>
          <mat-select formControlName="loadCourseFilterTemperature" required>
            <mat-option value="above">Above</mat-option>
            <mat-option value="below">Below</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="fill" style="flex: 1.5;">
          <mat-label>Threshold Value</mat-label>
          <input matInput formControlName="loadCourseFilterTemperatureValue" type="number">
        </mat-form-field>
      </div>
      <div class="flex gap-2">
        <mat-form-field appearance="fill" class="flex-1">
          <mat-label>Max Power Threshold (%)</mat-label>
          <input matInput formControlName="loadCourseFilterMaxPower" type="number">
        </mat-form-field>
      </div>
      <div class="flex gap-2">
        <mat-form-field appearance="fill" style="flex: 1.5;">
          <mat-label>Area</mat-label>
          <input matInput formControlName="area" type="number">
        </mat-form-field>
        <mat-form-field appearance="fill" style="flex: 1;">
          <mat-label>Unit</mat-label>
          <input matInput formControlName="unit" type="text">
        </mat-form-field>
      </div>
    </fieldset>

    <!-- Weekly Operating Schedule -->
    <fieldset class="fieldset" style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
      <legend class="flex items-center gap-2" style="font-weight: 600; color: #305680; padding: 0 8px;">
        <mat-icon style="font-size: 18px; width: 18px; height: 18px;">schedule</mat-icon>
        Weekly Operating Schedule
      </legend>
      <div formGroupName="weeklyOperatingSchedule" class="flex justify-between items-center gap-1">
        <mat-checkbox formControlName="monday">Mon</mat-checkbox>
        <mat-checkbox formControlName="tuesday">Tue</mat-checkbox>
        <mat-checkbox formControlName="wednesday">Wed</mat-checkbox>
        <mat-checkbox formControlName="thursday">Thu</mat-checkbox>
        <mat-checkbox formControlName="friday">Fri</mat-checkbox>
        <mat-checkbox formControlName="saturday">Sat</mat-checkbox>
        <mat-checkbox formControlName="sunday">Sun</mat-checkbox>
      </div>
    </fieldset>

    <!-- Alarm Thresholds -->
    <fieldset class="fieldset" style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
      <legend class="flex items-center gap-2" style="font-weight: 600; color: #305680; padding: 0 8px;">
        <mat-icon style="font-size: 18px; width: 18px; height: 18px;">notification_important</mat-icon>
        Alarm Thresholds
      </legend>
      <div class="flex gap-2">
        <mat-form-field appearance="fill" class="flex-1">
          <mat-label>Max Volume Flow Critical</mat-label>
          <input matInput formControlName="maxVolumeFlowCriticalThreshold" type="number">
        </mat-form-field>
        <mat-form-field appearance="fill" class="flex-1">
          <mat-label>Max Volume Flow Major</mat-label>
          <input matInput formControlName="maxVolumeFlowMajorThreshold" type="number">
        </mat-form-field>
      </div>
      <div class="flex gap-2">
        <mat-form-field appearance="fill" class="flex-1">
          <mat-label>Max Energy Critical</mat-label>
          <input matInput formControlName="maxEnergyCriticalThreshold" type="number">
        </mat-form-field>
        <mat-form-field appearance="fill" class="flex-1">
          <mat-label>Max Energy Major</mat-label>
          <input matInput formControlName="maxEnergyMajorThreshold" type="number">
        </mat-form-field>
      </div>
      <div class="flex gap-2">
        <mat-form-field appearance="fill" class="flex-1">
          <mat-label>Min Temp Diff Critical</mat-label>
          <input matInput formControlName="minTemperatureDifferenceCriticalThreshold" type="number">
        </mat-form-field>
        <mat-form-field appearance="fill" class="flex-1">
          <mat-label>Min Temp Diff Major</mat-label>
          <input matInput formControlName="minTemperatureDifferenceMajorThreshold" type="number">
        </mat-form-field>
      </div>
    </fieldset>

  </div>

  <div class="flex justify-end items-center gap-2 p-4" style="border-top: 1px solid #e0e0e0; background: #fafafa;">
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

    vm.dimensionOptions = ['DN15', 'DN20', 'DN25', 'DN32', 'DN40', 'DN50', 'DN65', 'DN80', 'DN100', 'DN125', 'DN150'];
    vm.weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    // Create form group
    vm.parametersFormGroup = vm.fb.group({
      // Measurement info
      entityLabel: [''],
      // Status fields
      progress: ['in preparation'],
      startDate: [null],
      startTime: [null],
      endDate: [null],
      endTime: [null],
      // Dimension fields
      dimension: [null, [vm.validators.required]],
      nominalFlow: [null],
      deltaTAnalysisFloorVolume: [null],
      deltaTAnalysisPumpEnergy: [null],
      // Installation fields
      installationType: [null, [vm.validators.required]],
      installationTypeOptions: ['', [vm.validators.required]],
      // Analysis fields
      standardOutdoorTemperature: [null],
      deltaT: [null],
      loadCourseFilterTemperature: [null, [vm.validators.required]],
      loadCourseFilterTemperatureValue: [null],
      loadCourseFilterMaxPower: [null],
      area: [null],
      unit: [null],
      // Weekly schedule
      weeklyOperatingSchedule: vm.fb.group({
        monday: [false],
        tuesday: [false],
        wednesday: [false],
        thursday: [false],
        friday: [false],
        saturday: [false],
        sunday: [false]
      }),
      // Alarm thresholds
      maxVolumeFlowCriticalThreshold: [null],
      maxVolumeFlowMajorThreshold: [null],
      maxEnergyCriticalThreshold: [null],
      maxEnergyMajorThreshold: [null],
      minTemperatureDifferenceCriticalThreshold: [null],
      minTemperatureDifferenceMajorThreshold: [null]
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

      // Status fields
      if (attributeMap.progress) {
        vm.parametersFormGroup.get('progress').setValue(attributeMap.progress);
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

      // Dimension fields
      if (attributeMap.dimension) {
        vm.parametersFormGroup.get('dimension').setValue(attributeMap.dimension);
      }
      if (attributeMap.nominalFlow) {
        vm.parametersFormGroup.get('nominalFlow').setValue(attributeMap.nominalFlow);
      }
      if (attributeMap.deltaTAnalysisFloorVolume) {
        vm.parametersFormGroup.get('deltaTAnalysisFloorVolume').setValue(attributeMap.deltaTAnalysisFloorVolume);
      }
      if (attributeMap.pumpPower || attributeMap.deltaTAnalysisPumpEnergy) {
        vm.parametersFormGroup.get('deltaTAnalysisPumpEnergy').setValue(attributeMap.pumpPower || attributeMap.deltaTAnalysisPumpEnergy);
      }

      // Installation fields
      if (attributeMap.installationType) {
        vm.parametersFormGroup.get('installationType').setValue(attributeMap.installationType);
      }
      if (attributeMap.installationTypeOptions) {
        vm.parametersFormGroup.get('installationTypeOptions').setValue(attributeMap.installationTypeOptions);
      }

      // Analysis fields
      if (attributeMap.standardOutsideTemperature || attributeMap.standardOutdoorTemperature) {
        vm.parametersFormGroup.get('standardOutdoorTemperature').setValue(attributeMap.standardOutsideTemperature || attributeMap.standardOutdoorTemperature);
      }
      if (attributeMap.deltaT) {
        vm.parametersFormGroup.get('deltaT').setValue(attributeMap.deltaT);
      }
      if (attributeMap.loadCourseFilterTemperature) {
        vm.parametersFormGroup.get('loadCourseFilterTemperature').setValue(attributeMap.loadCourseFilterTemperature);
      }
      if (attributeMap.loadCourseFilterTemperatureValue) {
        vm.parametersFormGroup.get('loadCourseFilterTemperatureValue').setValue(attributeMap.loadCourseFilterTemperatureValue);
      }
      if (attributeMap.loadCourseFilterMaxPower) {
        vm.parametersFormGroup.get('loadCourseFilterMaxPower').setValue(attributeMap.loadCourseFilterMaxPower);
      }
      if (attributeMap.area && typeof attributeMap.area === 'object') {
        vm.parametersFormGroup.get('area').setValue(attributeMap.area.value);
        vm.parametersFormGroup.get('unit').setValue(attributeMap.area.unit);
      }

      // Weekly schedule
      if (attributeMap.weeklySchedule) {
        Object.keys(attributeMap.weeklySchedule).forEach(function(day) {
          const control = vm.parametersFormGroup.get('weeklyOperatingSchedule.' + day);
          if (control) {
            control.setValue(attributeMap.weeklySchedule[day]);
          }
        });
      }

      // Alarm thresholds
      if (attributeMap.maxVolumeFlowCriticalThreshold) {
        vm.parametersFormGroup.get('maxVolumeFlowCriticalThreshold').setValue(attributeMap.maxVolumeFlowCriticalThreshold);
      }
      if (attributeMap.maxVolumeFlowMajorThreshold) {
        vm.parametersFormGroup.get('maxVolumeFlowMajorThreshold').setValue(attributeMap.maxVolumeFlowMajorThreshold);
      }
      if (attributeMap.maxEnergyCriticalThreshold) {
        vm.parametersFormGroup.get('maxEnergyCriticalThreshold').setValue(attributeMap.maxEnergyCriticalThreshold);
      }
      if (attributeMap.maxEnergyMajorThreshold) {
        vm.parametersFormGroup.get('maxEnergyMajorThreshold').setValue(attributeMap.maxEnergyMajorThreshold);
      }
      if (attributeMap.minTemperatureDifferenceCriticalThreshold) {
        vm.parametersFormGroup.get('minTemperatureDifferenceCriticalThreshold').setValue(attributeMap.minTemperatureDifferenceCriticalThreshold);
      }
      if (attributeMap.minTemperatureDifferenceMajorThreshold) {
        vm.parametersFormGroup.get('minTemperatureDifferenceMajorThreshold').setValue(attributeMap.minTemperatureDifferenceMajorThreshold);
      }
    }

    function setupFormSubscriptions() {
      // Auto-set nominalFlow when dimension changes
      vm.parametersFormGroup.get('dimension').valueChanges.subscribe(function(dimension) {
        const nominalFlow = getNominalFlowByDimension(dimension);
        vm.parametersFormGroup.get('nominalFlow').setValue(nominalFlow);
      });

      // Auto-calculate deltaTAnalysisFloorVolume when nominalFlow changes
      vm.parametersFormGroup.get('nominalFlow').valueChanges.subscribe(function(nominalFlow) {
        if (nominalFlow) {
          const floorVolume = (nominalFlow * 0.02).toFixed(3);
          vm.parametersFormGroup.get('deltaTAnalysisFloorVolume').setValue(parseFloat(floorVolume));
        }
      });

      // Auto-set deltaT when installationTypeOptions changes
      vm.parametersFormGroup.get('installationTypeOptions').valueChanges.subscribe(function(option) {
        const deltaTValues = {
          coolingCircuit: 6,
          coolingCeiling: 3,
          chiller: 6,
          coolingOther: null,
          radiatorHeating: 15,
          floorHeating: 5,
          districtHeating: 25,
          heatingOther: null
        };
        const deltaT = deltaTValues[option] || null;
        vm.parametersFormGroup.get('deltaT').setValue(deltaT);
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
    }

    function getNominalFlowByDimension(dimension) {
      const dimensionToNominalFlow = {
        DN15: 1.5, DN20: 2.5, DN25: 3.5, DN32: 6, DN40: 10,
        DN50: 15, DN65: 28.8, DN80: 39.6, DN100: 72, DN125: 111.6, DN150: 162
      };
      return dimensionToNominalFlow[dimension] || null;
    }

    function parseDateTime(dateObj, timeObj) {
      if (!dateObj || !timeObj) return null;
      const date = new Date(dateObj);
      const time = new Date(timeObj);
      date.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds());
      return date;
    }

    vm.cancel = function() {
      vm.dialogRef.close(null);
    };

    vm.save = function() {
      if (vm.parametersFormGroup.invalid) {
        return;
      }

      vm.isLoading = true;
      const formData = vm.parametersFormGroup.value;

      const startDateTime = parseDateTime(formData.startDate, formData.startTime);
      const endDateTime = parseDateTime(formData.endDate, formData.endTime);

      const attributesArray = [
        { key: 'progress', value: formData.progress },
        { key: 'startTimeMs', value: startDateTime ? startDateTime.getTime() : null },
        { key: 'endTimeMs', value: endDateTime ? endDateTime.getTime() : null },
        { key: 'dimension', value: formData.dimension },
        { key: 'nominalFlow', value: formData.nominalFlow },
        { key: 'deltaTAnalysisFloorVolume', value: formData.deltaTAnalysisFloorVolume },
        { key: 'deltaTAnalysisPumpEnergy', value: formData.deltaTAnalysisPumpEnergy },
        { key: 'installationType', value: formData.installationType },
        { key: 'installationTypeOptions', value: formData.installationTypeOptions },
        { key: 'standardOutsideTemperature', value: formData.standardOutdoorTemperature },
        { key: 'deltaT', value: formData.deltaT },
        { key: 'loadCourseFilterTemperature', value: formData.loadCourseFilterTemperature },
        { key: 'loadCourseFilterTemperatureValue', value: formData.loadCourseFilterTemperatureValue },
        { key: 'loadCourseFilterMaxPower', value: formData.loadCourseFilterMaxPower },
        { key: 'area', value: { value: formData.area, unit: formData.unit } },
        { key: 'weeklySchedule', value: formData.weeklyOperatingSchedule },
        { key: 'xPos', value: 0.5 },
        { key: 'yPos', value: 0.5 },
        { key: 'maxVolumeFlowCriticalThreshold', value: formData.maxVolumeFlowCriticalThreshold },
        { key: 'maxVolumeFlowMajorThreshold', value: formData.maxVolumeFlowMajorThreshold },
        { key: 'maxEnergyCriticalThreshold', value: formData.maxEnergyCriticalThreshold },
        { key: 'maxEnergyMajorThreshold', value: formData.maxEnergyMajorThreshold },
        { key: 'minTemperatureDifferenceCriticalThreshold', value: formData.minTemperatureDifferenceCriticalThreshold },
        { key: 'minTemperatureDifferenceMajorThreshold', value: formData.minTemperatureDifferenceMajorThreshold }
      ];

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
  }
}

// ============================================================================
// MEASUREMENT INFO DIALOG
// ============================================================================

const measurementInfoHtmlTemplate = `<div class="measurement-info-dialog" style="width: 450px;">
  <mat-toolbar class="flex items-center" style="background-color: #305680; color: white;">
    <mat-icon style="margin-right: 12px;">info</mat-icon>
    <h2 style="margin: 0; font-size: 18px;">Measurement Info</h2>
    <span class="flex-1"></span>
    <button mat-icon-button (click)="cancel()" type="button">
      <mat-icon>close</mat-icon>
    </button>
  </mat-toolbar>

  <mat-progress-bar color="warn" mode="indeterminate" *ngIf="isLoading"></mat-progress-bar>
  <div style="height: 4px;" *ngIf="!isLoading"></div>

  <div mat-dialog-content class="flex flex-col p-4">
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
    <div class="badges-section" style="display: flex; flex-wrap: wrap; gap: 8px;">
      <div *ngIf="installationType" class="badge flex items-center gap-1"
           [style.color]="getInstallationTypeStyle(installationType).color"
           [style.background-color]="getInstallationTypeStyle(installationType).bgColor"
           style="padding: 6px 12px; border-radius: 16px; font-size: 14px; font-weight: 500;">
        <mat-icon style="font-size: 16px; width: 16px; height: 16px;">{{ getInstallationTypeStyle(installationType).icon }}</mat-icon>
        {{ getInstallationTypeStyle(installationType).label }}
      </div>
    </div>
  </div>

  <div class="flex justify-end items-center gap-2 p-4" style="border-top: 1px solid #e0e0e0; background: #fafafa;">
    <button mat-raised-button color="primary" type="button" (click)="cancel()">
      Close
    </button>
  </div>
</div>`;

const measurementInfoCss = `.measurement-info-dialog .badge {
  display: inline-flex;
  align-items: center;
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
      entityRelationService.findByFrom(deviceId).subscribe(
        function(relations) {
          var assetRelations = (relations || []).filter(function(r) {
            return r.to && r.to.entityType === 'ASSET';
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
            assetService.getAsset(assetRelations[index].to.id).subscribe(
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

    // Extract installationType from attributes
    const findAttr = function(key) {
      const attr = config.attributes.find(function(a) { return a.key === key; });
      return attr ? attr.value : null;
    };

    vm.installationType = findAttr('installationType');

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

    // Expose helper functions to template
    vm.getInstallationTypeStyle = getInstallationTypeStyle;
    vm.getActivityColor = getActivityColor;

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
