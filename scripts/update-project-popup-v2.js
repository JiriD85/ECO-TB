/**
 * Update Project Popup in Map widget (selected_project_map)
 * Use Angular template bindings instead of innerHTML for alarm badge
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

// 1. Update HTML - Replace innerHTML badge with proper Angular template
const oldStatusSection = `<div class="flex flex-row items-center">
        <div class="popup-label">Status</div>
        <div [innerHTML]="project.alarmBadgeHtml"></div>
      </div>`;

// New badge using Angular bindings - with alarm card when alarms > 0, simple badge otherwise
const newStatusSection = `<div class="flex flex-row items-center">
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

marker.click.customHtml = marker.click.customHtml.replace(oldStatusSection, newStatusSection);
console.log('Updated HTML with Angular-based alarm badge');

// 2. Update function body - provide alarm style object instead of HTML
const fnBody = typeof marker.click.customFunction === 'object'
    ? marker.click.customFunction.body
    : marker.click.customFunction;

// Replace alarmBadgeHtml with alarmStyle object
const oldAlarmBadge = `// Alarm badge
        let state = attrMap.state || 'normal';
        let criticalCount = parseInt(attrMap.criticalAlarmsCount) || 0;
        let majorCount = parseInt(attrMap.majorAlarmsCount) || 0;
        let minorCount = parseInt(attrMap.minorAlarmsCount) || 0;
        let warningCount = parseInt(attrMap.warningAlarmsCount) || 0;
        let totalAlarms = criticalCount + majorCount + minorCount + warningCount;
        let alarmBadgeHtml = utils.createAlarmBadgeHtml(state, totalAlarms);`;

const newAlarmBadge = `// Alarm badge styling
        let state = attrMap.state || 'normal';
        let criticalCount = parseInt(attrMap.criticalAlarmsCount) || 0;
        let majorCount = parseInt(attrMap.majorAlarmsCount) || 0;
        let minorCount = parseInt(attrMap.minorAlarmsCount) || 0;
        let warningCount = parseInt(attrMap.warningAlarmsCount) || 0;
        let totalAlarms = criticalCount + majorCount + minorCount + warningCount;
        let alarmStyle = getAlarmStyle(state);`;

let newFnBody = fnBody.replace(oldAlarmBadge, newAlarmBadge);

// Replace alarmBadgeHtml in vm.project with alarmStyle and totalAlarms
const oldVmProject = `measurementsCount: measurementsCount,
            alarmBadgeHtml: alarmBadgeHtml
        };`;

const newVmProject = `measurementsCount: measurementsCount,
            alarmStyle: alarmStyle,
            totalAlarms: totalAlarms
        };`;

newFnBody = newFnBody.replace(oldVmProject, newVmProject);

// Add getAlarmStyle helper function after getTimestampStyle function
const oldTimestampEnd = `return { icon: icon, color: color, bgColor: bgColor, label: label };
        }
    }
}`;

const newTimestampEnd = `return { icon: icon, color: color, bgColor: bgColor, label: label };
        }

        function getAlarmStyle(state) {
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
        }
    }
}`;

newFnBody = newFnBody.replace(oldTimestampEnd, newTimestampEnd);

// Update the function body
if (typeof marker.click.customFunction === 'object') {
    marker.click.customFunction.body = newFnBody;
}

console.log('Updated customFunction with alarm style logic');

// Save dashboard
fs.writeFileSync(DASHBOARD_PATH, JSON.stringify(dashboard, null, 2));
console.log('Dashboard saved successfully!');
