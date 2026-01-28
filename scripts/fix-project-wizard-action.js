const fs = require('fs');
const dashboard = JSON.parse(fs.readFileSync('dashboards/measurements.json', 'utf8'));

// Find the project-wizard-action by ID
for (const widgetId in dashboard.configuration.widgets) {
    const widget = dashboard.configuration.widgets[widgetId];
    if (widget.config && widget.config.actions && widget.config.actions.elementClick) {
        const elementClicks = widget.config.actions.elementClick;

        for (const action of elementClicks) {
            // Find actions that call openProjectWizardDialog but don't have dataImporter
            if (action.customFunction && action.customFunction.body &&
                action.customFunction.body.includes('openProjectWizardDialog') &&
                action.customFunction.modules &&
                !action.customFunction.modules.dataImporter) {

                console.log('Found action without dataImporter:', action.name || action.id);

                // Add dataImporter module
                action.customFunction.modules.dataImporter =
                    "tb-resource;/api/resource/js_module/tenant/ECO Data Importer.js";

                // Update the body to pass dataImporter option
                // Old: null as last parameter or missing options
                // New: { dataImporter: dataImporter }
                let body = action.customFunction.body;

                // Pattern 1: null as last parameter
                body = body.replace(
                    /openProjectWizardDialog\(\s*widgetContext,\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*null\s*\)/g,
                    'openProjectWizardDialog(widgetContext, $1, $2, $3, function() { widgetContext.updateAliases(); }, { dataImporter: dataImporter })'
                );

                action.customFunction.body = body;
                console.log('  Added dataImporter module and options');
            }
        }
    }
}

fs.writeFileSync('dashboards/measurements.json', JSON.stringify(dashboard, null, 2));
console.log('✓ Dashboard saved');
