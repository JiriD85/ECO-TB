/**
 * Fix button border-radius to match the embedded dashboard cards (8px)
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

    // Update switch button border-radius from 4px to 8px
    css = css.replace(
        /\.switch-btn \{([^}]*?)border-radius:\s*4px\s*!important;/g,
        '.switch-btn {$1border-radius: 8px !important;'
    );

    // Add border-radius for all header buttons (Go Back, Parameter, Projects, Reports, Analysis)
    const additionalCss = `
/* Unified Button Border Radius - matches embedded dashboard cards */
#go-back,
#parameter-button,
#projects-button,
#reports-button,
#analysis-button {
    border-radius: 8px !important;
}
`;

    // Only add if not already present
    if (!css.includes('Unified Button Border Radius')) {
        css += additionalCss;
    }

    widget.config.settings.markdownCss = css;
    console.log('Updated border-radius in widget:', widgetId);
}

fs.writeFileSync(DASHBOARD_PATH, JSON.stringify(dashboard, null, 2));
console.log('Done');
