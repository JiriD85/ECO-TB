/**
 * Add Responsive Breakpoints to Home State
 *
 * Creates sm (Tablet) and xs (Mobile) breakpoints for the home state
 * with widget COPIES (not references) for independent CSS per breakpoint.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// UUID v4 generator (built-in)
const uuidv4 = () => crypto.randomUUID();

const dashboardPath = path.join(__dirname, '..', 'dashboards', 'navigation.json');
const dashboard = JSON.parse(fs.readFileSync(dashboardPath, 'utf8'));

// Home state and layout
const homeState = dashboard.configuration.states.home;
const mainLayout = homeState.layouts.main;

// Original Home Tiles Widget ID
const TILES_WIDGET_ID = '9094f048-ccc5-b9d7-9dd0-6ef0a20851c9';

console.log('=== Adding Breakpoints to Home State ===\n');

// ═══════════════════════════════════════════════════════════════
// DESKTOP CSS - Clean/Minimal Design (5 horizontal cards)
// ═══════════════════════════════════════════════════════════════
const desktopCss = `/* ═══════════════════════════════════════════════════════════════
   ECO ENERGY - DESKTOP HOME TILES
   5 horizontale Karten | Clean/Minimal Design | Roboto Font
   ═══════════════════════════════════════════════════════════════ */

:host {
    display: block;
    height: 100%;
    font-family: "Roboto", "Helvetica Neue", sans-serif;
}

.tile-container {
    display: flex;
    gap: 1.25rem;
    width: 100%;
    height: 100%;
    justify-content: center;
    align-items: center;
    padding: 1.5rem;
    box-sizing: border-box;
}

.eco-card {
    background: #ffffff;
    border-radius: 12px;
    box-shadow:
        0 1px 3px rgba(0, 0, 0, 0.04),
        0 4px 12px rgba(0, 0, 0, 0.06);
    border: 1px solid rgba(0, 0, 0, 0.06);
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 220px;
    min-height: 260px;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    transition:
        transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
        box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.eco-card:hover {
    transform: translateY(-4px);
    box-shadow:
        0 4px 12px rgba(0, 0, 0, 0.08),
        0 12px 32px rgba(0, 0, 0, 0.12);
}

.card-accent {
    height: 4px;
    background: linear-gradient(90deg,
        var(--tb-primary-500, #2196f3) 0%,
        var(--tb-primary-400, #64b5f6) 100%);
    flex-shrink: 0;
}

.eco-card:hover .card-accent {
    height: 5px;
}

.card-content {
    flex: 1;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    position: relative;
}

.card-icon-wrapper {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    background: linear-gradient(135deg,
        rgba(33, 150, 243, 0.1) 0%,
        rgba(33, 150, 243, 0.05) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.875rem;
    transition: all 0.25s ease;
}

.card-icon-wrapper mat-icon {
    font-size: 22px;
    width: 22px;
    height: 22px;
    color: var(--tb-primary-500, #2196f3);
    transition: transform 0.25s ease;
}

.eco-card:hover .card-icon-wrapper {
    background: linear-gradient(135deg,
        rgba(33, 150, 243, 0.15) 0%,
        rgba(33, 150, 243, 0.08) 100%);
}

.eco-card:hover .card-icon-wrapper mat-icon {
    transform: scale(1.1);
}

.card-number {
    position: absolute;
    top: 1rem;
    right: 1rem;
    font-size: 0.625rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: rgba(0, 0, 0, 0.2);
    background: rgba(0, 0, 0, 0.03);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-family: "Roboto Mono", "SF Mono", monospace;
}

.card-title {
    font-size: 1rem;
    font-weight: 600;
    color: #1a1a2e;
    margin: 0 0 0.5rem 0;
    letter-spacing: -0.01em;
    line-height: 1.3;
}

.card-description {
    font-size: 0.8125rem;
    line-height: 1.5;
    color: #6b7280;
    margin: 0;
    flex: 1;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.card-footer {
    padding: 0.875rem 1.25rem;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
    background: rgba(0, 0, 0, 0.01);
}

.card-link {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--tb-primary-500, #2196f3);
    transition: gap 0.2s ease;
}

.card-link .arrow-icon {
    font-size: 16px;
    width: 16px;
    height: 16px;
    transition: transform 0.2s ease;
}

.eco-card:hover .card-link {
    gap: 0.5rem;
}

.eco-card:hover .card-link .arrow-icon {
    transform: translateX(2px);
}
`;

// Check current state
console.log('Current home state:');
console.log('  Widgets:', Object.keys(mainLayout.widgets || {}).length);
console.log('  Breakpoints:', mainLayout.breakpoints ? Object.keys(mainLayout.breakpoints) : 'NONE');

// ═══════════════════════════════════════════════════════════════
// TABLET CSS - Optimized for 600-959px
// ═══════════════════════════════════════════════════════════════
const tabletCss = `/* ═══════════════════════════════════════════════════════════════
   ECO ENERGY - TABLET HOME TILES (600-959px)
   3+2 Grid Layout | Kompakte Karten | Touch-optimiert
   ═══════════════════════════════════════════════════════════════ */

:host {
    display: block;
    height: 100%;
    font-family: "Roboto", "Helvetica Neue", sans-serif;
}

.tile-container {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    width: 100%;
    height: 100%;
    justify-content: center;
    align-content: flex-start;
    padding: 1rem;
    box-sizing: border-box;
}

.eco-card {
    background: #ffffff;
    border-radius: 12px;
    box-shadow:
        0 1px 3px rgba(0, 0, 0, 0.04),
        0 4px 12px rgba(0, 0, 0, 0.06);
    border: 1px solid rgba(0, 0, 0, 0.06);
    display: flex;
    flex-direction: column;
    flex: 0 0 calc(33.333% - 0.75rem);
    min-height: 200px;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.eco-card:nth-child(4),
.eco-card:nth-child(5) {
    flex: 0 0 calc(50% - 0.5rem);
}

.eco-card:active {
    transform: scale(0.98);
}

.card-accent {
    height: 4px;
    background: linear-gradient(90deg,
        var(--tb-primary-500, #2196f3) 0%,
        var(--tb-primary-400, #64b5f6) 100%);
    flex-shrink: 0;
}

.card-content {
    flex: 1;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    position: relative;
}

.card-icon-wrapper {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: linear-gradient(135deg,
        rgba(33, 150, 243, 0.1) 0%,
        rgba(33, 150, 243, 0.05) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.75rem;
}

.card-icon-wrapper mat-icon {
    font-size: 20px;
    width: 20px;
    height: 20px;
    color: var(--tb-primary-500, #2196f3);
}

.card-number {
    position: absolute;
    top: 0.875rem;
    right: 0.875rem;
    font-size: 0.5625rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: rgba(0, 0, 0, 0.2);
    background: rgba(0, 0, 0, 0.03);
    padding: 0.1875rem 0.375rem;
    border-radius: 4px;
    font-family: "Roboto Mono", monospace;
}

.card-title {
    font-size: 0.9375rem;
    font-weight: 600;
    color: #1a1a2e;
    margin: 0 0 0.375rem 0;
    letter-spacing: -0.01em;
    line-height: 1.3;
}

.card-description {
    font-size: 0.75rem;
    line-height: 1.5;
    color: #6b7280;
    margin: 0;
    flex: 1;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.card-footer {
    padding: 0.75rem 1rem;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.card-link {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--tb-primary-500, #2196f3);
}

.card-link .arrow-icon {
    font-size: 14px;
    width: 14px;
    height: 14px;
}
`;

// ═══════════════════════════════════════════════════════════════
// MOBILE CSS - Optimized for ≤599px
// ═══════════════════════════════════════════════════════════════
const mobileCss = `/* ═══════════════════════════════════════════════════════════════
   ECO ENERGY - MOBILE HOME TILES (≤599px)
   Vertikale Liste | Kompakte Karten | Touch-first
   ═══════════════════════════════════════════════════════════════ */

:host {
    display: block;
    height: 100%;
    font-family: "Roboto", "Helvetica Neue", sans-serif;
}

.tile-container {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem;
    box-sizing: border-box;
}

.eco-card {
    background: #ffffff;
    border-radius: 10px;
    box-shadow:
        0 1px 2px rgba(0, 0, 0, 0.04),
        0 2px 8px rgba(0, 0, 0, 0.06);
    border: 1px solid rgba(0, 0, 0, 0.06);
    display: flex;
    flex-direction: column;
    min-height: 140px;
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
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 0.5rem;
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
    letter-spacing: 0.1em;
    color: white;
    background: var(--tb-primary-500, #2196f3);
    padding: 0.125rem 0.375rem;
    border-radius: 3px;
    font-family: "Roboto Mono", monospace;
}

.card-title {
    flex: 1;
    font-size: 0.9375rem;
    font-weight: 600;
    color: #1a1a2e;
    margin: 0;
    align-self: center;
    min-width: 0;
}

.card-description {
    width: 100%;
    font-size: 0.6875rem;
    line-height: 1.45;
    color: #6b7280;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.card-footer {
    padding: 0.625rem 0.875rem;
    border-top: 1px solid rgba(0, 0, 0, 0.04);
    background: rgba(0, 0, 0, 0.01);
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
// UPDATE DESKTOP WIDGET + CREATE COPIES
// ═══════════════════════════════════════════════════════════════

// Get original widget
const originalWidget = dashboard.configuration.widgets[TILES_WIDGET_ID];
if (!originalWidget) {
    console.error('Original tiles widget not found!');
    process.exit(1);
}

// Update Desktop widget with clean CSS (no media queries)
originalWidget.config.settings.markdownCss = desktopCss;
console.log('✓ Updated Desktop widget CSS');

// Create Tablet copy
const tabletWidgetId = uuidv4();
dashboard.configuration.widgets[tabletWidgetId] = JSON.parse(JSON.stringify(originalWidget));
dashboard.configuration.widgets[tabletWidgetId].config.settings.markdownCss = tabletCss;
console.log('\n✓ Created Tablet widget copy:', tabletWidgetId.slice(0, 8));

// Create Mobile copy
const mobileWidgetId = uuidv4();
dashboard.configuration.widgets[mobileWidgetId] = JSON.parse(JSON.stringify(originalWidget));
dashboard.configuration.widgets[mobileWidgetId].config.settings.markdownCss = mobileCss;
console.log('✓ Created Mobile widget copy:', mobileWidgetId.slice(0, 8));

// ═══════════════════════════════════════════════════════════════
// CREATE BREAKPOINTS
// ═══════════════════════════════════════════════════════════════

// Initialize breakpoints
mainLayout.breakpoints = {};

// Get widget positions from main layout
const mainWidgetPositions = { ...mainLayout.widgets };

// Tablet (sm) breakpoint
mainLayout.breakpoints.sm = {
    gridSettings: {
        ...mainLayout.gridSettings,
        viewFormat: 'list',
        autoFillHeight: false
    },
    widgets: {}
};

// Copy all widgets, replacing tiles widget with tablet copy
for (const [widgetId, position] of Object.entries(mainWidgetPositions)) {
    if (widgetId === TILES_WIDGET_ID) {
        mainLayout.breakpoints.sm.widgets[tabletWidgetId] = { ...position };
    } else {
        mainLayout.breakpoints.sm.widgets[widgetId] = { ...position };
    }
}

console.log('✓ Created sm (Tablet) breakpoint with', Object.keys(mainLayout.breakpoints.sm.widgets).length, 'widgets');

// Mobile (xs) breakpoint
mainLayout.breakpoints.xs = {
    gridSettings: {
        ...mainLayout.gridSettings,
        viewFormat: 'list',
        autoFillHeight: false
    },
    widgets: {}
};

// Copy all widgets, replacing tiles widget with mobile copy
for (const [widgetId, position] of Object.entries(mainWidgetPositions)) {
    if (widgetId === TILES_WIDGET_ID) {
        mainLayout.breakpoints.xs.widgets[mobileWidgetId] = { ...position };
    } else {
        mainLayout.breakpoints.xs.widgets[widgetId] = { ...position };
    }
}

console.log('✓ Created xs (Mobile) breakpoint with', Object.keys(mainLayout.breakpoints.xs.widgets).length, 'widgets');

// ═══════════════════════════════════════════════════════════════
// SAVE
// ═══════════════════════════════════════════════════════════════

fs.writeFileSync(dashboardPath, JSON.stringify(dashboard, null, 2));
console.log('\n✓ Dashboard saved');
console.log('\nWidget IDs:');
console.log('  Desktop:', TILES_WIDGET_ID.slice(0, 8));
console.log('  Tablet: ', tabletWidgetId.slice(0, 8));
console.log('  Mobile: ', mobileWidgetId.slice(0, 8));
console.log('\nNext: Run "node sync/sync.js push navigation" to deploy');
