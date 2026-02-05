const fs = require('fs');

const dashboardPath = process.argv[2] || 'dashboards/projects_alarms.json';
const widgetId = process.argv[3] || '0ff674a9-4e70-3742-720a-e681566c9b4f';

const db = JSON.parse(fs.readFileSync(dashboardPath, 'utf8'));
const widget = db.configuration.widgets[widgetId];

if (!widget) {
    console.log('Widget not found:', widgetId);
    process.exit(1);
}

console.log('Widget title:', widget.config?.title);
console.log('Widget type:', widget.type);
console.log('Settings keys:', Object.keys(widget.config?.settings || {}));

const settings = widget.config?.settings || {};

if (settings.markers && settings.markers.length > 0) {
    console.log('\n=== MARKERS ===');
    console.log('Marker count:', settings.markers.length);

    settings.markers.forEach((marker, i) => {
        console.log('\nMarker', i);
        console.log('  Has markerLabel:', !!marker.markerLabel);
        if (marker.markerLabel?.body) {
            console.log('  markerLabel body:\n', marker.markerLabel.body);
        }
    });
}

// Check for popup configuration
if (settings.useClusterMarkers !== undefined) {
    console.log('\nuseClusterMarkers:', settings.useClusterMarkers);
}
if (settings.markerClick) {
    console.log('\nmarkerClick config:', JSON.stringify(settings.markerClick, null, 2));
}
