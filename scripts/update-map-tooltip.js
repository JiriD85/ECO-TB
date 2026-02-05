/**
 * Update Map Tooltip with Alarm Badge (Option A - after title)
 */

const fs = require('fs');

const DASHBOARD_PATH = 'dashboards/projects_alarms.json';
const MAP_WIDGET_ID = '0ff674a9-4e70-3742-720a-e681566c9b4f';

// Load dashboard
const dashboard = JSON.parse(fs.readFileSync(DASHBOARD_PATH, 'utf8'));
const widget = dashboard.configuration.widgets[MAP_WIDGET_ID];

if (!widget) {
  console.error('Map widget not found!');
  process.exit(1);
}

console.log('Found map widget:', widget.config?.title);

const settings = widget.config.settings;

// New tooltip function with alarm badge
const newTooltipBody = `const temperature = data.outsideTemp;
const humidity = data.outsideHumidity;
const pressure = data.pressure;
const longitude = data.longitude;
const latitude = data.latitude;
var locationName = data.locationName || 'N/A';
const installationType = data.installationType;
const address = data.address;
const name = data.name;
const label = data.label;

const userRole = dsData[dsData.length - 1].role;

// Alarms
const state = data.state || 'normal';
const progress = data.progress;
const criticalAlarms = parseInt(data.criticalAlarmsCount) || 0;
const majorAlarms = parseInt(data.majorAlarmsCount) || 0;
const minorAlarms = parseInt(data.minorAlarmsCount) || 0;
const warningAlarms = parseInt(data.warningAlarmsCount) || 0;
const totalAlarms = criticalAlarms + majorAlarms + minorAlarms + warningAlarms;

// Create alarm badge using utils library
const alarmBadge = utils.createAlarmBadgeHtml(state, totalAlarms);

var ButtonHtml = '';
if (userRole !== "Belimo Retrofit Users") {
    ButtonHtml = '<div style="text-align: center">' +
        '<link-act name="all_measurements">Edit Measurements</link-act>' +
        '</div>';
}

if (locationName === 'N/A') {
    locationName = label;
}

return '<div style="display:flex;flex-direction:column;margin-bottom:8px;font-family:\\'Roboto\\';font-weight:500;font-size:16px;line-height:24px;letter-spacing:0.25px;color:#29313C">' +
    '<div>' + locationName + ' | ' + name + '</div>' +
    '<div style="display:flex;justify-content:center;margin:8px 0;">' + alarmBadge + '</div>' +
    '<div style="width: 100%;border-bottom:1px solid rgba(0, 0, 0, 0.12);margin:4px 0 12px 0;"></div>' +
    '<div style="display:flex;flex-direction:row;align-items:baseline;margin-bottom:9px;">' +
    '<div style="font-size:13px;line-height:16px;font-weight:500;color:rgba(0, 0, 0, 0.38);width:100px">Address</div>' +
    '<div style="font-size:14px;line-height:20px;font-weight:500;letter-spacing:0.25px">' +
    address + '</div>' +
    '</div>' +
    '<div style="display:flex;flex-direction:row;align-items:baseline;margin-bottom:9px;">' +
    '<div style="font-size:13px;line-height:16px;font-weight:500;color:rgba(0, 0, 0, 0.38);width:100px">Temperature</div>' +
    '<div style="font-size:14px;line-height:20px;font-weight:500;letter-spacing:0.25px">' +
    temperature + ' \\u00B0C</div>' +
    '</div>' +
    '<div style="display:flex;flex-direction:row;align-items:baseline;margin-bottom:9px;">' +
    '<div style="font-size:13px;line-height:16px;font-weight:500;color:rgba(0, 0, 0, 0.38);width:100px">Humidity</div>' +
    '<div style="font-size:14px;line-height:20px;font-weight:500;letter-spacing:0.25px">' +
    humidity + ' % r.H.</div>' +
    '</div>' +
    projectWizardButtonHtml +
    ButtonHtml +
    '</div>';`;

// Convert to object with modules
settings.tooltipFunction = {
  body: newTooltipBody,
  modules: {
    utils: "tb-resource;/api/resource/js_module/tenant/ECO Diagnostics Utils JS.js"
  }
};

console.log('Updated tooltipFunction with alarm badge (Option A)');

// Save dashboard
fs.writeFileSync(DASHBOARD_PATH, JSON.stringify(dashboard, null, 2));
console.log('Dashboard saved successfully!');
