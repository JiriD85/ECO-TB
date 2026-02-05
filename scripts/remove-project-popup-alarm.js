/**
 * Remove alarm badge from Project Popup
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

// 1. Remove Status row from HTML
const statusSection = `<div class="flex flex-row items-center">
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
      </div>
      <div class="flex flex-row items-center"`;

const replacementHtml = `<div class="flex flex-row items-center"`;

marker.click.customHtml = marker.click.customHtml.replace(statusSection, replacementHtml);
console.log('Removed Status row from HTML');

// 2. Remove alarm attributes from getEntityAttributes call
const fnBody = typeof marker.click.customFunction === 'object'
    ? marker.click.customFunction.body
    : marker.click.customFunction;

const oldAttrCall = `attributeService.getEntityAttributes(entityId, 'SERVER_SCOPE',
        ['locationName', 'address', 'progress', 'startTimeMs', 'endTimeMs', 'projectPicture', 'state', 'criticalAlarmsCount', 'majorAlarmsCount', 'minorAlarmsCount', 'warningAlarmsCount']
    )`;

const newAttrCall = `attributeService.getEntityAttributes(entityId, 'SERVER_SCOPE',
        ['locationName', 'address', 'progress', 'startTimeMs', 'endTimeMs', 'projectPicture']
    )`;

let newFnBody = fnBody.replace(oldAttrCall, newAttrCall);

// 3. Remove alarm badge styling code
const alarmBadgeCode = `// Alarm badge styling
        let state = attrMap.state || 'normal';
        let criticalCount = parseInt(attrMap.criticalAlarmsCount) || 0;
        let majorCount = parseInt(attrMap.majorAlarmsCount) || 0;
        let minorCount = parseInt(attrMap.minorAlarmsCount) || 0;
        let warningCount = parseInt(attrMap.warningAlarmsCount) || 0;
        let totalAlarms = criticalCount + majorCount + minorCount + warningCount;
        let alarmStyle = getAlarmStyle(state);

        `;

newFnBody = newFnBody.replace(alarmBadgeCode, '');

// 4. Remove alarmStyle and totalAlarms from vm.project
const oldVmProject = `measurementsCount: measurementsCount,
            alarmStyle: alarmStyle,
            totalAlarms: totalAlarms
        };`;

const newVmProject = `measurementsCount: measurementsCount
        };`;

newFnBody = newFnBody.replace(oldVmProject, newVmProject);

// 5. Remove openAlarms function
const openAlarmsFunc = `

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

newFnBody = newFnBody.replace(openAlarmsFunc, '');

// 6. Remove getAlarmStyle function
const getAlarmStyleFunc = `

        function getAlarmStyle(state) {
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

newFnBody = newFnBody.replace(getAlarmStyleFunc, '');

// Update the function body
if (typeof marker.click.customFunction === 'object') {
    marker.click.customFunction.body = newFnBody;
}

// 7. Remove utils module (if not used elsewhere)
if (marker.click.customFunction.modules && marker.click.customFunction.modules.utils) {
    delete marker.click.customFunction.modules.utils;
    console.log('Removed utils module');
}

console.log('Removed alarm badge code from customFunction');

// Save dashboard
fs.writeFileSync(DASHBOARD_PATH, JSON.stringify(dashboard, null, 2));
console.log('Dashboard saved successfully!');
