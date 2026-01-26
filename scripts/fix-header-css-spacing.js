/**
 * Fix header CSS spacing to match embedded dashboard widgets
 *
 * Widget container has: border-radius: 8px
 * So .main-layout must also have border-radius to not overflow outside rounded corners
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

    // Remove old .main-layout styles
    css = css.replace(/\/\* Main Layout[^*]*\*\/[\s\S]*?\.main-layout\s*\{[^}]*\}/g, '');

    // Remove old .measurement-header styles (both versions)
    css = css.replace(/\/\* Measurement Header Card[^*]*\*\/[\s\S]*?\.measurement-header\s*\{[^}]*\}/g, '');
    css = css.replace(/\/\* Measurement Header Layout[^*]*\*\/[\s\S]*?\.measurement-header\s*\{[^}]*\}/g, '');
    css = css.replace(/\.measurement-header \.header-title\s*\{[^}]*\}\s*/g, '');

    // Add new unified styles
    const newCss = `
/* Main Layout - fills widget container, respects border-radius */
.main-layout {
    background-color: #eeeeee;
    width: calc(100% + 24px);
    height: calc(100% + 24px);
    margin: -12px;
    border-radius: 8px;
    box-sizing: border-box;
}

/* Measurement Header Card - matches embedded dashboard widget styling */
.measurement-header {
    background: #fff;
    border-radius: 8px;
    padding: 12px 16px;
    margin: 5px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.measurement-header .header-title {
    font-size: 1.4em;
    font-weight: 550;
    margin-right: 20px;
    min-width: 150px;
}
`;

    css += newCss;
    widget.config.settings.markdownCss = css;
    console.log('Updated CSS in widget:', widgetId);
}

fs.writeFileSync(DASHBOARD_PATH, JSON.stringify(dashboard, null, 2));
console.log('Done');
