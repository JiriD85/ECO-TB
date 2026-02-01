/**
 * Fix Responsive CSS Issues
 *
 * Fixes:
 * 1. Content cut off at bottom - add proper overflow handling
 * 2. Header buttons overlapping - add padding-top for header area
 */

const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, '..', 'dashboards', 'navigation.json');
const dashboard = JSON.parse(fs.readFileSync(dashboardPath, 'utf8'));

// Home state and layout
const homeState = dashboard.configuration.states.home;
const mainLayout = homeState.layouts.main;

console.log('=== Fixing Responsive CSS ===\n');

// Widget IDs - find the Markdown/HTML Card widgets (type: 'latest')
const DESKTOP_WIDGET_ID = '9094f048-ccc5-b9d7-9dd0-6ef0a20851c9';

// Find tablet and mobile widget IDs from breakpoints (type: 'latest' = Markdown/HTML Card)
const smWidgets = Object.keys(mainLayout.breakpoints?.sm?.widgets || {});
const xsWidgets = Object.keys(mainLayout.breakpoints?.xs?.widgets || {});

let tabletWidgetId = smWidgets.find(id => {
    const w = dashboard.configuration.widgets[id];
    return w?.type === 'latest' && id !== DESKTOP_WIDGET_ID;
});

let mobileWidgetId = xsWidgets.find(id => {
    const w = dashboard.configuration.widgets[id];
    return w?.type === 'latest' && id !== DESKTOP_WIDGET_ID;
});

console.log('Desktop Widget:', DESKTOP_WIDGET_ID.slice(0, 8));
console.log('Tablet Widget:', tabletWidgetId?.slice(0, 8) || 'NOT FOUND');
console.log('Mobile Widget:', mobileWidgetId?.slice(0, 8) || 'NOT FOUND');

// ═══════════════════════════════════════════════════════════════
// FIXED TABLET CSS
// ═══════════════════════════════════════════════════════════════
const tabletCss = `/* ═══════════════════════════════════════════════════════════════
   ECO ENERGY - TABLET HOME TILES (600-959px)
   3+2 Grid Layout | Kompakte Karten | Touch-optimiert
   ═══════════════════════════════════════════════════════════════ */

:host {
    display: block;
    height: 100%;
    font-family: "Roboto", "Helvetica Neue", sans-serif;
    overflow: hidden;
}

.tile-container {
    display: flex;
    flex-wrap: wrap;
    gap: 0.875rem;
    width: 100%;
    height: 100%;
    justify-content: center;
    align-content: flex-start;
    padding: 0.75rem;
    padding-top: 3.5rem; /* Space for header buttons */
    box-sizing: border-box;
    overflow-y: auto;
}

.eco-card {
    background: #ffffff;
    border-radius: 10px;
    box-shadow:
        0 1px 3px rgba(0, 0, 0, 0.04),
        0 4px 12px rgba(0, 0, 0, 0.06);
    border: 1px solid rgba(0, 0, 0, 0.06);
    display: flex;
    flex-direction: column;
    flex: 0 0 calc(33.333% - 0.7rem);
    min-height: 180px;
    max-height: 220px;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.eco-card:nth-child(4),
.eco-card:nth-child(5) {
    flex: 0 0 calc(50% - 0.5rem);
}

.eco-card:active {
    transform: scale(0.98);
}

.card-accent {
    height: 3px;
    background: linear-gradient(90deg,
        var(--tb-primary-500, #2196f3) 0%,
        var(--tb-primary-400, #64b5f6) 100%);
    flex-shrink: 0;
}

.card-content {
    flex: 1;
    padding: 0.875rem;
    display: flex;
    flex-direction: column;
    position: relative;
    min-height: 0;
}

.card-icon-wrapper {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: linear-gradient(135deg,
        rgba(33, 150, 243, 0.1) 0%,
        rgba(33, 150, 243, 0.05) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.5rem;
    flex-shrink: 0;
}

.card-icon-wrapper mat-icon {
    font-size: 18px;
    width: 18px;
    height: 18px;
    color: var(--tb-primary-500, #2196f3);
}

.card-number {
    position: absolute;
    top: 0.625rem;
    right: 0.625rem;
    font-size: 0.5rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: rgba(0, 0, 0, 0.2);
    background: rgba(0, 0, 0, 0.03);
    padding: 0.125rem 0.25rem;
    border-radius: 3px;
    font-family: "Roboto Mono", monospace;
}

.card-title {
    font-size: 0.8125rem;
    font-weight: 600;
    color: #1a1a2e;
    margin: 0 0 0.25rem 0;
    letter-spacing: -0.01em;
    line-height: 1.3;
}

.card-description {
    font-size: 0.6875rem;
    line-height: 1.4;
    color: #6b7280;
    margin: 0;
    flex: 1;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.card-footer {
    padding: 0.5rem 0.875rem;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
    flex-shrink: 0;
}

.card-link {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.6875rem;
    font-weight: 500;
    color: var(--tb-primary-500, #2196f3);
}

.card-link .arrow-icon {
    font-size: 12px;
    width: 12px;
    height: 12px;
}
`;

// ═══════════════════════════════════════════════════════════════
// FIXED MOBILE CSS
// ═══════════════════════════════════════════════════════════════
const mobileCss = `/* ═══════════════════════════════════════════════════════════════
   ECO ENERGY - MOBILE HOME TILES (≤599px)
   Vertikale Liste | Kompakte Karten | Touch-first
   ═══════════════════════════════════════════════════════════════ */

:host {
    display: block;
    height: 100%;
    font-family: "Roboto", "Helvetica Neue", sans-serif;
    overflow: hidden;
}

.tile-container {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    width: 100%;
    height: 100%;
    padding: 0.625rem;
    padding-top: 3rem; /* Space for header buttons */
    box-sizing: border-box;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
}

.eco-card {
    background: #ffffff;
    border-radius: 10px;
    box-shadow:
        0 1px 2px rgba(0, 0, 0, 0.04),
        0 2px 8px rgba(0, 0, 0, 0.06);
    border: 1px solid rgba(0, 0, 0, 0.06);
    display: flex;
    flex-direction: row;
    align-items: stretch;
    min-height: 80px;
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.15s ease;
}

.eco-card:active {
    transform: scale(0.98);
    background: #fafafa;
}

.card-accent {
    width: 4px;
    height: auto;
    background: linear-gradient(180deg,
        var(--tb-primary-500, #2196f3) 0%,
        var(--tb-primary-400, #64b5f6) 100%);
    flex-shrink: 0;
}

.card-content {
    flex: 1;
    padding: 0.75rem;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.75rem;
    min-width: 0;
}

.card-icon-wrapper {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: linear-gradient(135deg,
        rgba(33, 150, 243, 0.1) 0%,
        rgba(33, 150, 243, 0.05) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.card-icon-wrapper mat-icon {
    font-size: 20px;
    width: 20px;
    height: 20px;
    color: var(--tb-primary-500, #2196f3);
}

.card-number {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    font-size: 0.5rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: white;
    background: var(--tb-primary-500, #2196f3);
    padding: 0.125rem 0.375rem;
    border-radius: 3px;
    font-family: "Roboto Mono", monospace;
}

.card-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1a1a2e;
    margin: 0;
    line-height: 1.3;
}

.card-description {
    display: none; /* Hide on mobile for compact view */
}

.card-footer {
    display: flex;
    align-items: center;
    padding: 0 0.75rem;
    flex-shrink: 0;
}

.card-link {
    display: inline-flex;
    align-items: center;
    font-size: 0;
    color: var(--tb-primary-500, #2196f3);
}

.card-link .arrow-icon {
    font-size: 20px;
    width: 20px;
    height: 20px;
}

/* Hide "Mehr erfahren" text, show only arrow */
.card-link::before {
    display: none;
}
`;

// Update widgets
if (tabletWidgetId && dashboard.configuration.widgets[tabletWidgetId]) {
    dashboard.configuration.widgets[tabletWidgetId].config.settings.markdownCss = tabletCss;
    console.log('\n✓ Updated Tablet CSS');
}

if (mobileWidgetId && dashboard.configuration.widgets[mobileWidgetId]) {
    dashboard.configuration.widgets[mobileWidgetId].config.settings.markdownCss = mobileCss;
    console.log('✓ Updated Mobile CSS');
}

// Save
fs.writeFileSync(dashboardPath, JSON.stringify(dashboard, null, 2));
console.log('\n✓ Dashboard saved');
console.log('\nFixes applied:');
console.log('  • Added padding-top for header buttons');
console.log('  • Added overflow-y: auto for scrolling');
console.log('  • Mobile: Horizontal card layout with visible arrow');
console.log('\nNext: Run "node sync/sync.js push navigation" to deploy');
