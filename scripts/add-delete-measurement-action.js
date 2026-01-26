/**
 * Add Delete Measurement action to Measurements widget
 */
const fs = require('fs');

const DASHBOARD_PATH = 'dashboards/measurements.json';
const WIDGET_ID = '6e0676c2-49cd-846e-9c94-80c6b2c0218c'; // Measurements table in Measurements_card state

const dashboard = JSON.parse(fs.readFileSync(DASHBOARD_PATH, 'utf8'));
const widget = dashboard.configuration.widgets[WIDGET_ID];

if (!widget) {
    console.error('Widget not found:', WIDGET_ID);
    process.exit(1);
}

// Check if action already exists
const existingActions = widget.config.actions.actionCellButton || [];
const deleteActionExists = existingActions.some(a =>
    a.name === 'Delete Measurement' ||
    a.name === '{i18n:custom.diagnostics.action.delete-measurement}'
);

if (deleteActionExists) {
    console.log('Delete Measurement action already exists');
    process.exit(0);
}

// Add the Delete Measurement action
const deleteAction = {
    id: 'delete-measurement-' + Date.now(),
    name: 'Delete Measurement',
    icon: 'delete',
    type: 'custom',
    customFunction: {
        body: `const measurementId = entityId;
const measurementName = entityName || entityLabel || 'this measurement';

if (!measurementId || !measurementId.id) {
    console.error("No measurement selected");
    return;
}

projectWizard.deleteMeasurement(widgetContext, measurementId, measurementName);`,
        modules: {
            projectWizard: 'tb-resource;/api/resource/js_module/tenant/ECO Project Wizard.js'
        }
    }
};

widget.config.actions.actionCellButton.push(deleteAction);

fs.writeFileSync(DASHBOARD_PATH, JSON.stringify(dashboard, null, 2));
console.log('Added Delete Measurement action to widget:', WIDGET_ID);
console.log('Action ID:', deleteAction.id);
