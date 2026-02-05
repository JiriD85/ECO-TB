/**
 * Update Project Popup in Map widget (selected_project_map)
 * Add alarm badge after Progress section
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

if (!marker || !marker.click) {
    console.error('Marker click config not found!');
    process.exit(1);
}

// 1. Update HTML - Add alarm badge section after Progress row
const oldProgressSection = `<div class="flex flex-row items-center">
        <div class="popup-label">Progress</div>
        <div class="popup-badge" [style.color]="project.progressStyle.color" [style.background-color]="project.progressStyle.bgColor">
          {{ project.progressStyle.label }}
        </div>
      </div>`;

const newProgressSection = `<div class="flex flex-row items-center">
        <div class="popup-label">Progress</div>
        <div class="popup-badge" [style.color]="project.progressStyle.color" [style.background-color]="project.progressStyle.bgColor">
          {{ project.progressStyle.label }}
        </div>
      </div>
      <div class="flex flex-row items-center">
        <div class="popup-label">Status</div>
        <div [innerHTML]="project.alarmBadgeHtml"></div>
      </div>`;

marker.click.customHtml = marker.click.customHtml.replace(oldProgressSection, newProgressSection);
console.log('Updated HTML with alarm badge section');

// 2. Add utils module
const customFunction = marker.click.customFunction;
if (typeof customFunction === 'object') {
    customFunction.modules.utils = "tb-resource;/api/resource/js_module/tenant/ECO Diagnostics Utils JS.js";
    console.log('Added utils module');
} else {
    // Convert string to object
    marker.click.customFunction = {
        body: customFunction,
        modules: {
            projectWizard: "tb-resource;/api/resource/js_module/tenant/ECO Project Wizard.js",
            dataImporter: "tb-resource;/api/resource/js_module/tenant/ECO Data Importer.js",
            utils: "tb-resource;/api/resource/js_module/tenant/ECO Diagnostics Utils JS.js"
        }
    };
    console.log('Converted customFunction to object and added utils module');
}

// 3. Update function body to load alarm attributes and create badge
const fnBody = typeof marker.click.customFunction === 'object'
    ? marker.click.customFunction.body
    : marker.click.customFunction;

// Add alarm attributes to the getEntityAttributes call
const oldAttrCall = `attributeService.getEntityAttributes(entityId, 'SERVER_SCOPE',
        ['locationName', 'address', 'progress', 'startTimeMs', 'endTimeMs', 'projectPicture']
    )`;

const newAttrCall = `attributeService.getEntityAttributes(entityId, 'SERVER_SCOPE',
        ['locationName', 'address', 'progress', 'startTimeMs', 'endTimeMs', 'projectPicture', 'state', 'criticalAlarmsCount', 'majorAlarmsCount', 'minorAlarmsCount', 'warningAlarmsCount']
    )`;

let newFnBody = fnBody.replace(oldAttrCall, newAttrCall);

// Add alarm badge calculation after progressStyle in ProjectPopupController
const oldProgressStyle = `// Progress styling
        let progressStyle = getProgressColor(attrMap.progress);`;

const newProgressStyle = `// Progress styling
        let progressStyle = getProgressColor(attrMap.progress);

        // Alarm badge
        let state = attrMap.state || 'normal';
        let criticalCount = parseInt(attrMap.criticalAlarmsCount) || 0;
        let majorCount = parseInt(attrMap.majorAlarmsCount) || 0;
        let minorCount = parseInt(attrMap.minorAlarmsCount) || 0;
        let warningCount = parseInt(attrMap.warningAlarmsCount) || 0;
        let totalAlarms = criticalCount + majorCount + minorCount + warningCount;
        let alarmBadgeHtml = utils.createAlarmBadgeHtml(state, totalAlarms);`;

newFnBody = newFnBody.replace(oldProgressStyle, newProgressStyle);

// Add alarmBadgeHtml to vm.project
const oldVmProject = `vm.project = {
            name: entityName,
            locationName: attrMap.locationName || entityLabel || entityName,
            address: attrMap.address || 'N/A',
            progress: attrMap.progress,
            progressStyle: progressStyle,
            picture: attrMap.projectPicture || null,
            startTime: startTime,
            endTime: endTime,
            measurementsCount: measurementsCount
        };`;

const newVmProject = `vm.project = {
            name: entityName,
            locationName: attrMap.locationName || entityLabel || entityName,
            address: attrMap.address || 'N/A',
            progress: attrMap.progress,
            progressStyle: progressStyle,
            picture: attrMap.projectPicture || null,
            startTime: startTime,
            endTime: endTime,
            measurementsCount: measurementsCount,
            alarmBadgeHtml: alarmBadgeHtml
        };`;

newFnBody = newFnBody.replace(oldVmProject, newVmProject);

// Update the function body
if (typeof marker.click.customFunction === 'object') {
    marker.click.customFunction.body = newFnBody;
} else {
    marker.click.customFunction = newFnBody;
}

console.log('Updated customFunction with alarm badge logic');

// Save dashboard
fs.writeFileSync(DASHBOARD_PATH, JSON.stringify(dashboard, null, 2));
console.log('Dashboard saved successfully!');
