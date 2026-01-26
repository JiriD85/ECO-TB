const fs = require('fs');
const d = JSON.parse(fs.readFileSync('dashboards/measurements.json', 'utf8'));

const WIDGET_IDS = ['6ccd99bd-8562-4e6b-e42b-e7f3c026a129', 'f0dfbf6c-c2b0-2975-eb81-df9748cae9a5'];

for (const widgetId of WIDGET_IDS) {
    const w = d.configuration.widgets[widgetId];
    if (!w) continue;

    const fn = w.config.settings.markdownTextFunction;
    if (!fn || !fn.body) continue;

    // Add color="accent" to the button
    fn.body = fn.body.replace(
        'mat-raised-button class="switch-btn"',
        'mat-raised-button color="accent" class="switch-btn"'
    );

    console.log('Updated widget:', widgetId);
}

fs.writeFileSync('dashboards/measurements.json', JSON.stringify(d, null, 2));
console.log('Done');
