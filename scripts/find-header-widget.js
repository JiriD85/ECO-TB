const fs = require('fs');
const db = JSON.parse(fs.readFileSync('dashboards/measurements.json', 'utf8'));

const stateName = process.argv[2] || 'selected_project_map';
const state = db.configuration.states[stateName];

if (!state) {
    console.log('State not found:', stateName);
    process.exit(1);
}

const layout = state.layouts.main;
console.log('=== Widgets in', stateName, '(row 0 = header) ===\n');

for (const widgetId in layout.widgets) {
    const widgetRef = layout.widgets[widgetId];
    if (widgetRef.row === 0) {
        const widget = db.configuration.widgets[widgetRef.id || widgetId];
        console.log('Widget ID:', widgetRef.id || widgetId);
        console.log('Type:', widget.type);
        console.log('Title:', widget.config?.title);
        console.log('sizeY:', widgetRef.sizeY);

        // Check if it has markdownTextFunction
        if (widget.config?.settings?.markdownTextFunction) {
            console.log('Has markdownTextFunction: YES');
            const body = typeof widget.config.settings.markdownTextFunction === 'object'
                ? widget.config.settings.markdownTextFunction.body
                : widget.config.settings.markdownTextFunction;
            console.log('Body preview:', body?.substring(0, 200));
        }
        console.log('');
    }
}
