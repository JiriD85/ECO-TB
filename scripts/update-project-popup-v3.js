/**
 * Update Project Popup - Fix alarm badge styling and make it a clickable card
 */

const fs = require('fs');

const DASHBOARD_PATH = 'dashboards/measurements.json';
const MAP_WIDGET_ID = 'f2279347-4693-4b0a-17c2-15d2887559fa';

// Load dashboard
const dashboard = JSON.parse(fs.readFileSync(DASHBOARD_PATH, 'utf8'));
const widget = dashboard.configuration.widgets[MAP_WIDGET_ID];

if (!widget) {
    console.error('Map widget not found!');
    process.exit(1);
}

console.log('Found Map widget:', widget.config?.title);

const settings = widget.config.settings;
const marker = settings.markers[0];

// 1. Update HTML - Make alarm badge a clickable card style (same as measurement header)
const oldStatusSection = `<div class="flex flex-row items-center">
        <div class="popup-label">Status</div>
        <!-- Alarm badge with bell icon when alarms > 0 -->
        <div *ngIf="project.totalAlarms > 0" class="state-alarm-card"
             [style.background]="project.alarmStyle.bgColor"
             style="display:inline-flex;align-items:center;gap:12px;padding:8px 14px;border-radius:8px;">
          <span [style.color]="project.alarmStyle.color" style="font-weight:600;font-size:13px;">
            {{ project.alarmStyle.label }}
          </span>
          <div style="position:relative;display:inline-flex;">
            <mat-icon style="font-size:22px;width:22px;height:22px;color:#666;">notifications</mat-icon>
            <span [style.background]="project.alarmStyle.color"
                  style="position:absolute;top:-6px;right:-8px;min-width:18px;height:18px;padding:0 5px;border-radius:9px;color:white;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;">
              {{ project.totalAlarms }}
            </span>
          </div>
        </div>
        <!-- Simple badge when no alarms -->
        <div *ngIf="project.totalAlarms === 0" class="popup-badge"
             [style.color]="project.alarmStyle.color"
             [style.background-color]="project.alarmStyle.bgColor">
          {{ project.alarmStyle.label }}
        </div>
      </div>`;

// New clickable card style for both cases
const newStatusSection = `<div class="flex flex-row items-center">
        <div class="popup-label">Status</div>
        <!-- Clickable alarm card (always shown as card style) -->
        <div class="state-alarm-card"
             [style.background]="project.alarmStyle.bgColor"
             style="display:inline-flex;align-items:center;gap:12px;padding:8px 14px;border-radius:8px;cursor:pointer;transition:all 0.2s ease;"
             (click)="openAlarms()">
          <span [style.color]="project.alarmStyle.color" style="font-weight:600;font-size:13px;">
            {{ project.alarmStyle.label }}
          </span>
          <div *ngIf="project.totalAlarms > 0" style="position:relative;display:inline-flex;">
            <mat-icon style="font-size:22px;width:22px;height:22px;color:#666;">notifications</mat-icon>
            <span [style.background]="project.alarmStyle.color"
                  style="position:absolute;top:-6px;right:-8px;min-width:18px;height:18px;padding:0 5px;border-radius:9px;color:white;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;">
              {{ project.totalAlarms }}
            </span>
          </div>
        </div>
      </div>`;

marker.click.customHtml = marker.click.customHtml.replace(oldStatusSection, newStatusSection);
console.log('Updated HTML with clickable alarm card');

// 2. Update function - Fix colors to match design system and add openAlarms function
const fnBody = typeof marker.click.customFunction === 'object'
    ? marker.click.customFunction.body
    : marker.click.customFunction;

// Fix getAlarmStyle colors to match design system
const oldGetAlarmStyle = `function getAlarmStyle(state) {
            let color, bgColor, label;
            switch (state) {
                case 'critical':
                    color = '#d32f2f';
                    bgColor = 'rgba(211, 47, 47, 0.12)';
                    label = 'Critical';
                    break;
                case 'major':
                    color = '#f57c00';
                    bgColor = 'rgba(245, 124, 0, 0.12)';
                    label = 'Major';
                    break;
                case 'minor':
                    color = '#fbc02d';
                    bgColor = 'rgba(251, 192, 45, 0.12)';
                    label = 'Minor';
                    break;
                case 'warning':
                    color = '#7b1fa2';
                    bgColor = 'rgba(123, 31, 162, 0.12)';
                    label = 'Warning';
                    break;
                case 'normal':
                default:
                    color = '#388e3c';
                    bgColor = 'rgba(56, 142, 60, 0.12)';
                    label = 'Normal';
                    break;
            }
            return { color: color, bgColor: bgColor, label: label };
        }`;

// Design system colors (matching getProgressColor)
const newGetAlarmStyle = `function getAlarmStyle(state) {
            let color, bgColor, label;
            switch (state) {
                case 'critical':
                    color = '#EB5757';
                    bgColor = 'rgba(235, 87, 87, 0.12)';
                    label = 'Critical';
                    break;
                case 'major':
                    color = '#F2994A';
                    bgColor = 'rgba(242, 153, 74, 0.12)';
                    label = 'Major';
                    break;
                case 'minor':
                    color = '#F2C94C';
                    bgColor = 'rgba(242, 201, 76, 0.12)';
                    label = 'Minor';
                    break;
                case 'warning':
                    color = '#9B51E0';
                    bgColor = 'rgba(155, 81, 224, 0.12)';
                    label = 'Warning';
                    break;
                case 'normal':
                default:
                    color = '#27AE60';
                    bgColor = 'rgba(39, 174, 96, 0.12)';
                    label = 'Normal';
                    break;
            }
            return { color: color, bgColor: bgColor, label: label };
        }`;

let newFnBody = fnBody.replace(oldGetAlarmStyle, newGetAlarmStyle);

// Add openAlarms function after openEditProject
const oldOpenEditProject = `vm.openEditProject = function() {
            vm.dialogRef.close(null);
            projectWizard.openEditProjectDialog(widgetContext, entityId, entityName, entityLabel, function() {
                widgetContext.updateAliases();
            });
        };`;

const newOpenEditProject = `vm.openEditProject = function() {
            vm.dialogRef.close(null);
            projectWizard.openEditProjectDialog(widgetContext, entityId, entityName, entityLabel, function() {
                widgetContext.updateAliases();
            });
        };

        vm.openAlarms = function() {
            vm.dialogRef.close(null);
            // Navigate to alarms view or open alarms popover
            var params = widgetContext.stateController.getStateParams();
            params['selectedProject'] = {
                entityId: entityId,
                entityName: entityName,
                entityLabel: entityLabel
            };
            widgetContext.stateController.updateState('projects_alarms', params);
        };`;

newFnBody = newFnBody.replace(oldOpenEditProject, newOpenEditProject);

// Update the function body
if (typeof marker.click.customFunction === 'object') {
    marker.click.customFunction.body = newFnBody;
}

console.log('Updated customFunction with design system colors and openAlarms');

// Save dashboard
fs.writeFileSync(DASHBOARD_PATH, JSON.stringify(dashboard, null, 2));
console.log('Dashboard saved successfully!');
