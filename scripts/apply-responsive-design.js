/**
 * Apply Industrial Precision Responsive Design to Home Tiles
 *
 * Applies the CSS from styles/ folder to the corresponding widgets:
 * - Desktop: 9094f048-ccc5-b9d7-9dd0-6ef0a20851c9
 * - Tablet:  6fea78ac-b89f-4eba-8b79-97bfbe11c7c6
 * - Mobile:  8fcef910-6a17-4022-9186-0675867a098b
 */

const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, '..', 'dashboards', 'navigation.json');
const dashboard = JSON.parse(fs.readFileSync(dashboardPath, 'utf8'));

// Widget IDs for each breakpoint
const WIDGETS = {
    desktop: '9094f048-ccc5-b9d7-9dd0-6ef0a20851c9',
    tablet: '6fea78ac-b89f-4eba-8b79-97bfbe11c7c6',
    mobile: '8fcef910-6a17-4022-9186-0675867a098b'
};

// Read CSS files
const desktopCss = fs.readFileSync(path.join(__dirname, '..', 'styles', 'home-tiles-desktop.css'), 'utf8');
const tabletCss = fs.readFileSync(path.join(__dirname, '..', 'styles', 'home-tiles-tablet.css'), 'utf8');
const mobileCss = fs.readFileSync(path.join(__dirname, '..', 'styles', 'home-tiles-mobile.css'), 'utf8');

console.log('=== Applying Industrial Precision Responsive Design ===\n');

// Apply CSS to widgets
let updated = 0;

function applyCSS(widgetId, css, label) {
    const widget = dashboard.configuration.widgets[widgetId];
    if (widget && widget.config && widget.config.settings) {
        widget.config.settings.markdownCss = css;
        console.log(`✓ ${label}: ${widgetId.slice(0, 8)}...`);
        return true;
    }
    console.log(`✗ ${label}: Widget not found`);
    return false;
}

if (applyCSS(WIDGETS.desktop, desktopCss, 'Desktop')) updated++;
if (applyCSS(WIDGETS.tablet, tabletCss, 'Tablet')) updated++;
if (applyCSS(WIDGETS.mobile, mobileCss, 'Mobile')) updated++;

// Save
if (updated > 0) {
    fs.writeFileSync(dashboardPath, JSON.stringify(dashboard, null, 2));
    console.log(`\n✓ Dashboard saved (${updated} widgets updated)`);
    console.log('\nDesign Features:');
    console.log('  • Font: DM Sans (display) + JetBrains Mono (numbers)');
    console.log('  • Colors: #1976D2 primary, #F5F7FA background');
    console.log('  • Desktop: 5 horizontal cards with hover lift');
    console.log('  • Tablet: 3+2 grid, touch-optimized');
    console.log('  • Mobile: Vertical cards with horizontal layout');
    console.log('\nNext: Run "node sync/sync.js push navigation" to deploy');
} else {
    console.log('\n✗ No widgets updated');
}
