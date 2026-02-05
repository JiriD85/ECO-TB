const fs = require('fs');
const db = JSON.parse(fs.readFileSync('dashboards/measurements.json', 'utf8'));

const widgetId = process.argv[2] || 'f2279347-4693-4b0a-17c2-15d2887559fa';
const widget = db.configuration.widgets[widgetId];

if (!widget) {
    console.log('Widget not found:', widgetId);
    process.exit(1);
}

console.log('Widget title:', widget.config?.title);
console.log('Widget type:', widget.type);
console.log('');
console.log('Settings keys:', Object.keys(widget.config?.settings || {}));

const settings = widget.config?.settings || {};

if (settings.markers && settings.markers.length > 0) {
    console.log('\n=== MARKERS ===');
    console.log('Marker count:', settings.markers.length);

    settings.markers.forEach((marker, i) => {
        console.log('\nMarker', i);
        console.log('  Has markerLabel:', !!marker.markerLabel);
        if (marker.markerLabel?.body) {
            console.log('  markerLabel preview:', marker.markerLabel.body.substring(0, 300));
        }
    });
}

if (settings.markdownTextFunction) {
    console.log('\n=== markdownTextFunction ===');
    const body = typeof settings.markdownTextFunction === 'object'
        ? settings.markdownTextFunction.body
        : settings.markdownTextFunction;
    console.log('Body preview:', body?.substring(0, 500));
}
