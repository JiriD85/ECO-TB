const fs = require('fs');
const dashboard = JSON.parse(fs.readFileSync('dashboards/measurements.json', 'utf8'));

// Find the measurement-switch-button action
for (const stateId in dashboard.configuration.states) {
    const state = dashboard.configuration.states[stateId];
    for (const layoutId in state.layouts) {
        const layout = state.layouts[layoutId];
        for (const widgetId in layout.widgets) {
            const widgetRef = layout.widgets[widgetId];
            const widget = dashboard.configuration.widgets[widgetRef.id || widgetId];

            if (widget && widget.config && widget.config.actions && widget.config.actions.elementClick) {
                const elementClicks = widget.config.actions.elementClick;
                const switchAction = elementClicks.find(a => a.name === 'measurement-switch-button');

                if (switchAction && switchAction.customFunction) {
                    // Fix the filter in findMeasurementsInProject
                    // Old: (r) => r.to && r.to.entityType === 'ASSET'
                    // New: (r) => r.to && r.to.entityType === 'ASSET' && r.type === 'Owns'
                    const oldFilter = "(r) => r.to && r.to.entityType === 'ASSET'";
                    const newFilter = "(r) => r.to && r.to.entityType === 'ASSET' && r.type === 'Owns'";

                    if (switchAction.customFunction.includes(oldFilter)) {
                        switchAction.customFunction = switchAction.customFunction.replace(oldFilter, newFilter);
                        console.log('✓ Fixed filter in findMeasurementsInProject');
                        console.log('  Now filtering by: r.type === "Owns"');
                    } else if (switchAction.customFunction.includes(newFilter)) {
                        console.log('Filter already fixed');
                    } else {
                        console.log('Could not find expected filter pattern');
                    }
                }
            }
        }
    }
}

fs.writeFileSync('dashboards/measurements.json', JSON.stringify(dashboard, null, 2));
console.log('✓ Dashboard saved');
