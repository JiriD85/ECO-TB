/**
 * Fix header styling to match embedded dashboard state (measurement_data_heating)
 *
 * Embedded state has:
 * - Grid: margin: 10, outerMargin: true, backgroundColor: #EEEEEE
 * - Widgets: padding: 4px, backgroundColor: #fff (white cards on gray)
 *
 * Solution:
 * 1. Set header widget background to transparent (so grid gray shows)
 * 2. Set widget padding to match embedded (smaller)
 * 3. Style .measurement-header as the white card
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

    // 1. Update widget config to match embedded state
    widget.config.padding = '0';
    widget.config.backgroundColor = 'transparent';
    widget.config.borderRadius = '0';
    delete widget.config.widgetStyle;

    // 2. Update CSS
    let css = widget.config.settings.markdownCss || '';

    // Remove old .main-layout and .measurement-header styles
    css = css.replace(/\/\* Main Layout[^*]*\*\/[\s\S]*?\.main-layout\s*\{[^}]*\}/g, '');
    css = css.replace(/\/\* Measurement Header Card[^*]*\*\/[\s\S]*?\.measurement-header\s*\{[^}]*\}/g, '');
    css = css.replace(/\/\* Measurement Header Layout[^*]*\*\/[\s\S]*?\.measurement-header\s*\{[^}]*\}/g, '');
    css = css.replace(/\.measurement-header \.header-title\s*\{[^}]*\}\s*/g, '');
    css = css.replace(/\.measurement-header\s*\{[^}]*\}\s*/g, '');

    // Add new clean styles matching embedded state
    const newCss = `
/* Main Layout - transparent to show grid background */
.main-layout {
    width: 100%;
    height: 100%;
}

/* Measurement Header - white card matching embedded dashboard widgets */
.measurement-header {
    background: #fff;
    border-radius: 8px;
    padding: 12px 16px;
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

    console.log('Updated widget:', widgetId);
    console.log('  backgroundColor:', widget.config.backgroundColor);
    console.log('  padding:', widget.config.padding);
}

fs.writeFileSync(DASHBOARD_PATH, JSON.stringify(dashboard, null, 2));
console.log('Done');
