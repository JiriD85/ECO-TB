/**
 * Fix Widget Settings for Home Tiles
 *
 * Issue: applyDefaultMarkdownStyle: true overrides custom CSS
 * Solution: Set applyDefaultMarkdownStyle: false for tile widgets
 */

const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, '..', 'dashboards', 'navigation.json');
const dashboard = JSON.parse(fs.readFileSync(dashboardPath, 'utf8'));

// Widget IDs for all breakpoints
const WIDGET_IDS = [
    '9094f048-ccc5-b9d7-9dd0-6ef0a20851c9', // Desktop
    '6fea78ac-b89f-4eba-8b79-97bfbe11c7c6', // Tablet
    '8fcef910-6a17-4022-9186-0675867a098b'  // Mobile
];

console.log('=== Fixing Widget Settings ===\n');

let updated = 0;

WIDGET_IDS.forEach((widgetId, index) => {
    const labels = ['Desktop', 'Tablet', 'Mobile'];
    const widget = dashboard.configuration.widgets[widgetId];

    if (widget && widget.config && widget.config.settings) {
        const before = widget.config.settings.applyDefaultMarkdownStyle;
        widget.config.settings.applyDefaultMarkdownStyle = false;

        console.log(`${labels[index]}: applyDefaultMarkdownStyle ${before} → false`);
        updated++;
    }
});

if (updated > 0) {
    fs.writeFileSync(dashboardPath, JSON.stringify(dashboard, null, 2));
    console.log(`\n✓ Dashboard saved (${updated} widgets updated)`);
    console.log('\nNext: Run "node sync/sync.js push navigation" to deploy');
}
