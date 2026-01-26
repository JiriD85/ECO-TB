/**
 * Fix switch button to be mat-raised-button with proper styling
 */
const fs = require('fs');

const DASHBOARD_PATH = 'dashboards/measurements.json';
const WIDGET_IDS = [
    '6ccd99bd-8562-4e6b-e42b-e7f3c026a129',
    'f0dfbf6c-c2b0-2975-eb81-df9748cae9a5'
];

const dashboard = JSON.parse(fs.readFileSync(DASHBOARD_PATH, 'utf8'));

for (const widgetId of WIDGET_IDS) {
    const widget = dashboard.configuration.widgets[widgetId];
    if (!widget) continue;

    const fn = widget.config.settings.markdownTextFunction;
    if (!fn || !fn.body) continue;

    // Update button from mat-icon-button to mat-raised-button
    if (fn.body.includes('mat-icon-button class="switch-btn"')) {
        fn.body = fn.body.replace(
            /mat-icon-button class="switch-btn" title="Messung wechseln"/g,
            'mat-raised-button class="switch-btn"'
        );
        console.log(`Updated button type in ${widgetId}`);
    } else if (fn.body.includes('mat-raised-button class="switch-btn"')) {
        console.log(`Button already mat-raised-button in ${widgetId}`);
    }

    // Update CSS - remove old styles first
    let css = widget.config.settings.markdownCss || '';

    // Remove existing switch-btn styles
    css = css.replace(/\/\* Measurement Switch Button \*\/[\s\S]*?\.switch-btn mat-icon \{[^}]*\}\s*/g, '');

    // Add new styles
    const newBtnCss = `
/* Measurement Switch Button */
.switch-btn {
    min-width: 44px !important;
    width: 44px !important;
    height: 40px !important;
    padding: 0 !important;
    border-radius: 8px !important;
}
.switch-btn mat-icon {
    margin: 0 !important;
}
`;

    css += newBtnCss;
    widget.config.settings.markdownCss = css;
    console.log(`Updated CSS in ${widgetId}`);
}

fs.writeFileSync(DASHBOARD_PATH, JSON.stringify(dashboard, null, 2));
console.log('Done');
