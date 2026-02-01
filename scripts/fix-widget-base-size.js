/**
 * Fix Widget Base Size Configuration
 *
 * Issue: The widget's base config has sizeX: 5, sizeY: 3.5 which might
 * override the layout's sizeX: 24. Update base config to match full width.
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

console.log('=== Fixing Widget Base Size ===\n');

WIDGET_IDS.forEach((widgetId, index) => {
    const labels = ['Desktop', 'Tablet', 'Mobile'];
    const widget = dashboard.configuration.widgets[widgetId];

    if (widget) {
        const oldSizeX = widget.sizeX;
        const oldSizeY = widget.sizeY;

        // Set to full width
        widget.sizeX = 24;
        widget.sizeY = 12;

        console.log(`${labels[index]}: sizeX ${oldSizeX} → 24, sizeY ${oldSizeY} → 12`);
    }
});

fs.writeFileSync(dashboardPath, JSON.stringify(dashboard, null, 2));
console.log('\n✓ Dashboard saved');
console.log('\nNext: Run "node sync/sync.js push navigation" to deploy');
