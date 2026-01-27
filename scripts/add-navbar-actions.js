const fs = require('fs');
const dashboard = JSON.parse(fs.readFileSync('dashboards/measurements.json', 'utf8'));
const widget = dashboard.configuration.widgets['6ccd99bd-8562-4e6b-e42b-e7f3c026a129'];

// Get current actions
const actions = widget.config.actions || {};
const elementClick = actions.elementClick || [];

// Check if nav tab actions already exist
const hasRawTab = elementClick.some(a => a.name === 'nav-tab-raw');
const hasLoadTab = elementClick.some(a => a.name === 'nav-tab-load');

// Add raw data tab action
if (!hasRawTab) {
    elementClick.push({
        name: 'nav-tab-raw',
        icon: 'show_chart',
        type: 'custom',
        customFunction: `var params = widgetContext.stateController.getStateParams();
params.navTab = { active: 'raw' };
widgetContext.stateController.updateState(null, params);`
    });
    console.log('✓ Added nav-tab-raw action');
}

// Add load analysis tab action
if (!hasLoadTab) {
    elementClick.push({
        name: 'nav-tab-load',
        icon: 'speed',
        type: 'custom',
        customFunction: `var params = widgetContext.stateController.getStateParams();
params.navTab = { active: 'load' };
widgetContext.stateController.updateState(null, params);`
    });
    console.log('✓ Added nav-tab-load action');
}

actions.elementClick = elementClick;
widget.config.actions = actions;

fs.writeFileSync('dashboards/measurements.json', JSON.stringify(dashboard, null, 2));
console.log('✓ Dashboard saved');
