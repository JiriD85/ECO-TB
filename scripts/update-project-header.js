/**
 * Update Project Card Header Widget with Alarm Badge
 *
 * Adds utils.createAlarmBadgeHtml() to project_card_header state
 */

const fs = require('fs');

const DASHBOARD_PATH = 'dashboards/projects_alarms.json';
const HEADER_WIDGET_ID = 'b84de4e1-8a84-b5cc-6b10-19292fefbb45';

// Load dashboard
const dashboard = JSON.parse(fs.readFileSync(DASHBOARD_PATH, 'utf8'));
const widget = dashboard.configuration.widgets[HEADER_WIDGET_ID];

if (!widget) {
  console.error('Header widget not found!');
  process.exit(1);
}

console.log('Found header widget:', widget.config?.title);

// Update markdownTextFunction body
const settings = widget.config.settings;
if (settings.markdownTextFunction && typeof settings.markdownTextFunction === 'object') {

  const newBody = `var name, label, address, progress, state;
var criticalCount, majorCount, minorCount, warningCount;

if (data && data.length) {
    name = data[0]['entityName'] || 'N/A';
    label = data[0]['Label'] || 'N/A';
    address = data[0]['address'] || 'N/A';
    progress = data[0]['progress'] || 'N/A';
    state = data[0]['state'] || 'normal';
    criticalCount = parseInt(data[0]['criticalAlarmsCount']) || 0;
    majorCount = parseInt(data[0]['majorAlarmsCount']) || 0;
    minorCount = parseInt(data[0]['minorAlarmsCount']) || 0;
    warningCount = parseInt(data[0]['warningAlarmsCount']) || 0;
} else {
    name = 'N/A';
    label = 'N/A';
    address = 'N/A';
    progress = 'N/A';
    state = 'normal';
    criticalCount = 0;
    majorCount = 0;
    minorCount = 0;
    warningCount = 0;
}

// Calculate total alarms and create alarm badge
var totalAlarms = criticalCount + majorCount + minorCount + warningCount;
var alarmBadge = utils.createAlarmBadgeHtml(state, totalAlarms, 'project-alarms');

// Project header with Go Back, Alarm Badge, and Project Wizard buttons
var header = '<div class="project-header" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #fafafa; border: 1px solid #e0e0e0; border-radius: 8px;">' +
  '<div style="display: flex; flex-direction: column; gap: 4px;">' +
    '<div style="display: flex; align-items: center; gap: 12px;">' +
      '<span style="font-weight: 600; font-size: 16px; color: #333;">' + name + '</span>' +
      '<span style="font-size: 13px; color: #666;">' + label + '</span>' +
    '</div>' +
    '<div style="display: flex; align-items: center; gap: 12px; margin-top: 4px;">' +
      '<div style="display: flex; align-items: center; gap: 8px;">' +
        '<mat-icon style="font-size: 16px; width: 16px; height: 16px; color: #666;">location_on</mat-icon>' +
        '<span style="font-size: 12px; color: #666;">' + address + '</span>' +
      '</div>' +
      '<div style="margin-left: 16px;">' + utils.getProgressHtml(progress) + '</div>' +
    '</div>' +
  '</div>' +
  '<div style="display: flex; align-items: center; justify-content: center; margin: 0 24px;">' + alarmBadge + '</div>' +
  '<div style="display: flex; align-items: center; gap: 8px;">' +
    '<button id="go-back" type="button" mat-raised-button class="header-btn-secondary">' +
      '<mat-icon>arrow_back</mat-icon>' +
      '<span>{i18n:custom.diagnostics.action.go-back.title}</span>' +
    '</button>' +
    '<button id="open-project-wizard" type="button" mat-raised-button class="header-btn-primary">' +
      '<mat-icon>rocket_launch</mat-icon>' +
      '<span>Project Wizard</span>' +
    '</button>' +
  '</div>' +
'</div>';

return header;`;

  settings.markdownTextFunction.body = newBody;
  console.log('Updated markdownTextFunction body with alarm badge');
}

// Save dashboard
fs.writeFileSync(DASHBOARD_PATH, JSON.stringify(dashboard, null, 2));
console.log('Dashboard saved successfully!');
