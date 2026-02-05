const fs = require('fs');
const db = JSON.parse(fs.readFileSync('dashboards/measurements.json', 'utf8'));
const widget = db.configuration.widgets['f2279347-4693-4b0a-17c2-15d2887559fa'];

console.log('Widget:', widget.config?.title);
console.log('Type:', widget.typeFullFqn);
console.log('\nSettings keys:', Object.keys(widget.config?.settings || {}));

const settings = widget.config?.settings || {};

// Check for tooltip/popup related settings
if (settings.showTooltip !== undefined) console.log('showTooltip:', settings.showTooltip);
if (settings.useTooltipFunction !== undefined) console.log('useTooltipFunction:', settings.useTooltipFunction);

if (settings.tooltipFunction) {
    console.log('\n=== tooltipFunction ===');
    const body = typeof settings.tooltipFunction === 'object' ? settings.tooltipFunction.body : settings.tooltipFunction;
    console.log(body);
}

// Check markerClick
if (settings.markerClick) {
    console.log('\n=== markerClick ===');
    console.log(JSON.stringify(settings.markerClick, null, 2));
}

// Check actions
if (widget.config?.actions) {
    console.log('\n=== Actions ===');
    for (const actionName in widget.config.actions) {
        console.log('\nAction:', actionName);
        const actions = widget.config.actions[actionName];
        actions.forEach((action, i) => {
            console.log('  [' + i + '] type:', action.type);
            console.log('      name:', action.name);
            if (action.customHtml) {
                console.log('      customHtml preview:', action.customHtml.substring(0, 300));
            }
        });
    }
}
