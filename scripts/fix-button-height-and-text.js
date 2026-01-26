const fs = require('fs');
const d = JSON.parse(fs.readFileSync('dashboards/measurements.json', 'utf8'));

const WIDGET_IDS = ['6ccd99bd-8562-4e6b-e42b-e7f3c026a129', 'f0dfbf6c-c2b0-2975-eb81-df9748cae9a5'];

for (const widgetId of WIDGET_IDS) {
    const w = d.configuration.widgets[widgetId];
    if (!w) continue;

    // Update CSS - remove old styles and add new ones
    let css = w.config.settings.markdownCss || '';

    // Remove existing switch-btn and measurement-title styles
    css = css.replace(/\/\* Measurement Switch Button \*\/[\s\S]*?\.switch-btn mat-icon \{[^}]*\}\s*/g, '');
    css = css.replace(/\/\* Measurement Title Block \*\/[\s\S]*?\.measurement-name-text \{[^}]*\}\s*/g, '');

    // Add new unified styles
    const newCss = `
/* Measurement Switch Button - matches Go Back button height */
.switch-btn {
    min-width: 44px !important;
    width: 44px !important;
    height: 36px !important;
    padding: 0 !important;
    border-radius: 4px !important;
    line-height: 36px !important;
}
.switch-btn mat-icon {
    margin: 0 !important;
    line-height: 36px !important;
}

/* Measurement Title Block - consistent text colors */
.measurement-title-block {
    display: flex;
    flex-direction: column;
    gap: 0;
    min-width: 0;
}
.measurement-location-text {
    font-size: 15px;
    font-weight: 500;
    color: #1a1a1a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 220px;
    line-height: 1.2;
}
.measurement-name-text {
    font-size: 12px;
    color: #666666;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 220px;
    line-height: 1.2;
}
`;

    css += newCss;
    w.config.settings.markdownCss = css;
    console.log('Updated CSS in', widgetId);
}

fs.writeFileSync('dashboards/measurements.json', JSON.stringify(d, null, 2));
console.log('Done');
