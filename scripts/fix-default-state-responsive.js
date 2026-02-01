/**
 * Fix Default State Responsive Layout
 *
 * Problem:
 * - Default state's sm/xs breakpoints have autoFillHeight: false
 * - This causes fixed height for tab container, cutting off content
 * - CSS has overflow: hidden which prevents scrolling
 *
 * Solution:
 * - Set autoFillHeight: true for sm/xs breakpoints in default state
 * - Update CSS to use overflow: auto instead of overflow: hidden
 */

const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, '..', 'dashboards', 'navigation.json');
const dashboard = JSON.parse(fs.readFileSync(dashboardPath, 'utf8'));

// Tab container widget ID in default state
const TAB_WIDGET_ID = '1dd6b46f-3282-d932-e25d-d495ef9c2432';

console.log('=== Fixing Default State Responsive Layout ===\n');

// 1. Fix default state breakpoints
const defaultState = dashboard.configuration.states.default;
const mainLayout = defaultState.layouts.main;

// Fix sm breakpoint
if (mainLayout.breakpoints?.sm?.gridSettings) {
    mainLayout.breakpoints.sm.gridSettings.autoFillHeight = true;
    mainLayout.breakpoints.sm.gridSettings.viewFormat = 'grid';
    console.log('✓ Default state sm: autoFillHeight=true, viewFormat=grid');
}

// Fix xs breakpoint
if (mainLayout.breakpoints?.xs?.gridSettings) {
    mainLayout.breakpoints.xs.gridSettings.autoFillHeight = true;
    mainLayout.breakpoints.xs.gridSettings.viewFormat = 'grid';
    console.log('✓ Default state xs: autoFillHeight=true, viewFormat=grid');
}

// 2. Fix CSS in the tab container widget
const tabWidget = dashboard.configuration.widgets[TAB_WIDGET_ID];
if (tabWidget && tabWidget.config.settings.markdownTextFunction) {
    let func = tabWidget.config.settings.markdownTextFunction;

    // Replace overflow:hidden with overflow:auto in CSS
    const oldCss = 'overflow:hidden;';
    const newCss = 'overflow:auto;';

    if (func.includes(oldCss)) {
        func = func.replace(new RegExp(oldCss, 'g'), newCss);
        tabWidget.config.settings.markdownTextFunction = func;
        console.log('✓ Tab widget CSS: overflow:hidden → overflow:auto');
    } else {
        console.log('⚠ CSS overflow:hidden not found (may already be fixed)');
    }
}

// 3. Also fix home state breakpoints to use grid with autoFillHeight
const homeState = dashboard.configuration.states.home;
if (homeState) {
    const homeLayout = homeState.layouts.main;

    if (homeLayout.breakpoints?.sm?.gridSettings) {
        homeLayout.breakpoints.sm.gridSettings.autoFillHeight = true;
        homeLayout.breakpoints.sm.gridSettings.viewFormat = 'grid';
        console.log('✓ Home state sm: autoFillHeight=true, viewFormat=grid');
    }

    if (homeLayout.breakpoints?.xs?.gridSettings) {
        homeLayout.breakpoints.xs.gridSettings.autoFillHeight = true;
        homeLayout.breakpoints.xs.gridSettings.viewFormat = 'grid';
        console.log('✓ Home state xs: autoFillHeight=true, viewFormat=grid');
    }
}

// Save
fs.writeFileSync(dashboardPath, JSON.stringify(dashboard, null, 2));

console.log('\n✓ Dashboard saved');
console.log('\nFixes applied:');
console.log('  • Default state sm/xs: autoFillHeight=true (tab fills viewport)');
console.log('  • Default state sm/xs: viewFormat=grid (proper layout)');
console.log('  • Tab CSS: overflow:auto (allows scrolling)');
console.log('  • Home state sm/xs: Same fixes applied');
console.log('\nNext: Run "node sync/sync.js push navigation" to deploy');
