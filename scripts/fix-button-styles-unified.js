/**
 * Fix button styles for unified appearance:
 * 1. Switch button: white text/icon color, centered icon
 * 2. Parameter, Projects, Reports buttons: 36px height to match
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

    // Remove old switch-btn styles
    css = css.replace(/\/\* Measurement Switch Button[^*]*\*\/[\s\S]*?\.switch-btn mat-icon \{[^}]*\}\s*/g, '');

    // Add new unified button styles
    const newCss = `
/* Measurement Switch Button - white text, centered icon */
.switch-btn {
    min-width: 44px !important;
    width: 44px !important;
    height: 36px !important;
    padding: 0 !important;
    border-radius: 4px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    color: white !important;
}
.switch-btn mat-icon {
    margin: 0 !important;
    color: white !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
}

/* Header Action Buttons - unified 36px height */
#parameter-button,
#projects-button,
#reports-button {
    height: 36px !important;
    min-height: 36px !important;
    line-height: 36px !important;
}
`;

    css += newCss;
    widget.config.settings.markdownCss = css;
    console.log('Updated CSS in widget:', widgetId);
}

fs.writeFileSync(DASHBOARD_PATH, JSON.stringify(dashboard, null, 2));
console.log('Done');
