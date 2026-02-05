const fs = require('fs');
const db = JSON.parse(fs.readFileSync('dashboards/measurements.json', 'utf8'));
const widget = db.configuration.widgets['f2279347-4693-4b0a-17c2-15d2887559fa'];
const settings = widget.config?.settings || {};

if (settings.markers && settings.markers.length > 0) {
    const marker = settings.markers[0];

    if (marker.click) {
        console.log('=== click.customHtml ===\n');
        console.log(marker.click.customHtml);

        console.log('\n\n=== click.customFunction ===\n');
        const fn = marker.click.customFunction;
        if (typeof fn === 'object') {
            console.log('modules:', JSON.stringify(fn.modules, null, 2));
            console.log('\nbody:\n', fn.body);
        } else {
            console.log(fn);
        }
    }
}
