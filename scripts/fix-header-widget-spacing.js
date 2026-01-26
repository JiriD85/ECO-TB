/**
 * Fix header widget spacing to match embedded dashboard widgets
 * - padding: 12px (internal spacing)
 * - margin: 0 (grid handles spacing, but need to handle margin-bottom carefully)
 * - borderRadius: 8px (matches value cards)
 */
const fs = require('fs');

const DASHBOARD_PATH = 'dashboards/measurements.json';
const WIDGET_IDS = [
    '6ccd99bd-8562-4e6b-e42b-e7f3c026a129', // Heating
    'f0dfbf6c-c2b0-2975-eb81-df9748cae9a5'  // Cooling
];

const dashboard = JSON.parse(fs.readFileSync(DASHBOARD_PATH, 'utf8'));

for (const widgetId of WIDGET_IDS) {
    const widget = dashboard.configuration.widgets[widgetId];
    if (!widget) continue;

    // Update widget config properties
    widget.config.padding = '12px';
    widget.config.borderRadius = '8px';

    // widgetStyle can have additional CSS properties
    widget.config.widgetStyle = widget.config.widgetStyle || {};
    widget.config.widgetStyle.borderRadius = '8px';

    // Don't set margin-bottom on the widget itself since grid handles spacing
    // The grid margin is 5px between widgets

    console.log('Updated widget config:', widgetId);
    console.log('  padding:', widget.config.padding);
    console.log('  borderRadius:', widget.config.borderRadius);
}

fs.writeFileSync(DASHBOARD_PATH, JSON.stringify(dashboard, null, 2));
console.log('Done');
