const fs = require('fs');
const dashboard = JSON.parse(fs.readFileSync('dashboards/measurements.json', 'utf8'));

// Find the widget with the header buttons
for (const stateId in dashboard.configuration.states) {
    const state = dashboard.configuration.states[stateId];
    for (const layoutId in state.layouts) {
        const layout = state.layouts[layoutId];
        for (const widgetId in layout.widgets) {
            const widgetRef = layout.widgets[widgetId];
            const widget = dashboard.configuration.widgets[widgetRef.id || widgetId];

            if (widget && widget.config && widget.config.actions && widget.config.actions.elementClick) {
                const elementClicks = widget.config.actions.elementClick;

                // Find and update parameter-button
                const parameterAction = elementClicks.find(a => a.name === 'parameter-button');
                if (parameterAction && parameterAction.type === 'customPretty') {
                    // Change from customPretty to custom with projectWizard call
                    parameterAction.type = 'custom';
                    parameterAction.customFunction = {
                        body: `const measurementId = widgetContext.stateController.getStateParams()?.selectedMeasurement?.entityId;

if (!measurementId || !measurementId.id) {
    console.error('No measurement selected');
    return;
}

projectWizard.openMeasurementParametersDialog(widgetContext, measurementId);`,
                        modules: {
                            projectWizard: "tb-resource;/api/resource/js_module/tenant/ECO Project Wizard.js"
                        }
                    };
                    // Remove customPretty properties
                    delete parameterAction.customHtml;
                    delete parameterAction.customCss;
                    delete parameterAction.customResources;

                    console.log('✓ Updated parameter-button to use projectWizard.openMeasurementParametersDialog()');
                }

                // Find and update projects-button
                const projectsAction = elementClicks.find(a => a.name === 'projects-button');
                if (projectsAction && projectsAction.type === 'openDashboardState') {
                    // Change to custom action that navigates to default state
                    projectsAction.type = 'custom';
                    projectsAction.customFunction = `var params = widgetContext.stateController.getStateParams();

// Keep only userRole, clear all other params
params = {
    "userRole": params.userRole
};

widgetContext.stateController.updateState('default', params);`;
                    // Remove openDashboardState properties
                    delete projectsAction.targetDashboardStateId;
                    delete projectsAction.setEntityId;
                    delete projectsAction.stateEntityParamName;
                    delete projectsAction.openRightLayout;

                    console.log('✓ Updated projects-button to navigate to default state');
                }
            }
        }
    }
}

fs.writeFileSync('dashboards/measurements.json', JSON.stringify(dashboard, null, 2));
console.log('✓ Dashboard saved');
