/**
 * Add outer margin to header (top, left, right - NOT bottom)
 * to match embedded state outerMargin styling
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

    let css = widget.config.settings.markdownCss || '';

    // Remove old .measurement-header styles
    css = css.replace(/\/\* Measurement Header - white card[^*]*\*\/[\s\S]*?\.measurement-header\s*\{[^}]*\}/g, '');
    css = css.replace(/\.measurement-header\s*\{[^}]*\}/g, '');

    // Add new style with margin top, left, right (not bottom)
    const newCss = `
/* Measurement Header - white card with outer margin (top, left, right) */
.measurement-header {
    background: #fff;
    border-radius: 8px;
    padding: 12px 16px;
    margin: 10px 10px 0 10px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
`;

    css += newCss;
    widget.config.settings.markdownCss = css;
    console.log('Updated margin in widget:', widgetId);
}

fs.writeFileSync(DASHBOARD_PATH, JSON.stringify(dashboard, null, 2));
console.log('Done');
