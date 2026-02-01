/**
 * Update Home Tiles with Responsive Design
 *
 * Breakpoints:
 * - Desktop: ≥960px (5 cards horizontal)
 * - Tablet (sm): 600-959px (3+2 grid layout)
 * - Mobile (xs): ≤599px (horizontal scroll cards)
 */

const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, '..', 'dashboards', 'navigation.json');
const dashboard = JSON.parse(fs.readFileSync(dashboardPath, 'utf8'));

const TILES_WIDGET_ID = '9094f048-ccc5-b9d7-9dd0-6ef0a20851c9';

// Enhanced Responsive CSS
const responsiveCss = `/* ═══════════════════════════════════════════════════════════════
   ECO ENERGY - RESPONSIVE HOME TILES
   Desktop: 5 horizontal | Tablet: 3+2 grid | Mobile: Scroll cards
   Font: Roboto | Breakpoints: 960px / 600px
   ═══════════════════════════════════════════════════════════════ */

:host {
    display: block;
    height: 100%;
    font-family: "Roboto", "Helvetica Neue", sans-serif;
}

/* ─────────────────────────────────────────────────────────────────
   CONTAINER - Adaptive Layout
   ───────────────────────────────────────────────────────────────── */
.tile-container {
    display: flex;
    flex-wrap: wrap;
    gap: 1.25rem;
    width: 100%;
    height: 100%;
    justify-content: center;
    align-items: center;
    align-content: center;
    padding: 1.5rem;
    box-sizing: border-box;
}

/* ─────────────────────────────────────────────────────────────────
   CARD BASE - Clean/Minimal Design
   ───────────────────────────────────────────────────────────────── */
.eco-card {
    background: #ffffff;
    border-radius: 12px;
    box-shadow:
        0 1px 3px rgba(0, 0, 0, 0.04),
        0 4px 12px rgba(0, 0, 0, 0.06);
    border: 1px solid rgba(0, 0, 0, 0.06);

    display: flex;
    flex-direction: column;

    flex: 0 0 auto;
    width: calc(20% - 1rem);
    max-width: 220px;
    min-width: 180px;
    min-height: 260px;

    position: relative;
    overflow: hidden;
    cursor: pointer;

    transition:
        transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
        box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.eco-card:hover {
    transform: translateY(-6px);
    box-shadow:
        0 8px 24px rgba(0, 0, 0, 0.1),
        0 16px 48px rgba(0, 0, 0, 0.08);
}

.eco-card:active {
    transform: translateY(-2px);
    transition-duration: 0.1s;
}

/* ─── Accent Line ─── */
.card-accent {
    height: 4px;
    background: linear-gradient(90deg,
        var(--tb-primary-500, #2196f3) 0%,
        var(--tb-primary-400, #64b5f6) 100%);
    flex-shrink: 0;
    transition: height 0.2s ease;
}

.eco-card:hover .card-accent {
    height: 6px;
}

/* ─── Content Area ─── */
.card-content {
    flex: 1;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    position: relative;
}

/* ─── Icon ─── */
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
    transform: scale(1.05);
}

.eco-card:hover .card-icon-wrapper mat-icon {
    transform: scale(1.1);
}

/* ─── Number Badge ─── */
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

/* ─── Typography ─── */
.card-title {
    font-size: 1rem;
    font-weight: 600;
    color: #1a1a2e;
    margin: 0 0 0.5rem 0;
    letter-spacing: -0.01em;
    line-height: 1.3;
    font-family: "Roboto", "Helvetica Neue", sans-serif;
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

/* ─── Footer ─── */
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
    font-family: "Roboto", "Helvetica Neue", sans-serif;
}

.card-link .arrow-icon {
    font-size: 16px;
    width: 16px;
    height: 16px;
    transition: transform 0.2s ease;
}

.eco-card:hover .card-link {
    gap: 0.625rem;
}

.eco-card:hover .card-link .arrow-icon {
    transform: translateX(3px);
}

/* ═════════════════════════════════════════════════════════════════
   TABLET BREAKPOINT (600-959px)
   3 cards top row, 2 cards bottom row centered
   ═════════════════════════════════════════════════════════════════ */
@media (max-width: 959px) and (min-width: 600px) {
    .tile-container {
        padding: 1.25rem;
        gap: 1rem;
        align-content: center;
    }

    .eco-card {
        flex: 0 0 calc(33.333% - 0.75rem);
        max-width: none;
        min-width: 0;
        min-height: 220px;
    }

    /* Last 2 cards: centered with specific width */
    .eco-card:nth-child(4),
    .eco-card:nth-child(5) {
        flex: 0 0 calc(33.333% - 0.75rem);
    }

    .card-content {
        padding: 1rem;
    }

    .card-icon-wrapper {
        width: 40px;
        height: 40px;
        margin-bottom: 0.75rem;
    }

    .card-icon-wrapper mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
    }

    .card-title {
        font-size: 0.9375rem;
    }

    .card-description {
        font-size: 0.75rem;
        -webkit-line-clamp: 2;
    }

    .card-footer {
        padding: 0.75rem 1rem;
    }

    .card-link {
        font-size: 0.75rem;
    }

    .card-number {
        font-size: 0.5625rem;
        padding: 0.1875rem 0.375rem;
    }

    /* Subtle hover on tablet */
    .eco-card:hover {
        transform: translateY(-3px);
    }
}

/* ═════════════════════════════════════════════════════════════════
   MOBILE BREAKPOINT (≤599px)
   Horizontal scroll with snap
   ═════════════════════════════════════════════════════════════════ */
@media (max-width: 599px) {
    .tile-container {
        display: flex;
        flex-wrap: nowrap;
        gap: 0.75rem;
        padding: 1rem;
        overflow-x: auto;
        overflow-y: hidden;
        scroll-snap-type: x mandatory;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        justify-content: flex-start;
        align-items: stretch;
    }

    .tile-container::-webkit-scrollbar {
        display: none;
    }

    .eco-card {
        flex: 0 0 85%;
        max-width: 320px;
        min-width: 260px;
        min-height: 200px;
        scroll-snap-align: center;
        scroll-snap-stop: always;
    }

    /* First card visible indicator */
    .eco-card:first-child {
        margin-left: auto;
    }

    .eco-card:last-child {
        margin-right: auto;
    }

    .card-accent {
        height: 3px;
    }

    .eco-card:hover .card-accent,
    .eco-card:active .card-accent {
        height: 4px;
    }

    .card-content {
        padding: 1rem;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .card-icon-wrapper {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        margin-bottom: 0;
        flex-shrink: 0;
    }

    .card-icon-wrapper mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
    }

    /* Title next to icon on mobile */
    .card-title {
        flex: 1;
        font-size: 0.9375rem;
        margin: 0;
        align-self: center;
        min-width: 0;
    }

    .card-number {
        position: static;
        order: -1;
        align-self: center;
        font-size: 0.5rem;
        padding: 0.125rem 0.375rem;
        background: var(--tb-primary-500, #2196f3);
        color: white;
        border-radius: 3px;
        margin-left: auto;
    }

    .card-description {
        width: 100%;
        font-size: 0.75rem;
        -webkit-line-clamp: 2;
        line-height: 1.45;
        color: #6b7280;
    }

    .card-footer {
        padding: 0.625rem 1rem;
        background: transparent;
    }

    .card-link {
        font-size: 0.75rem;
    }

    .card-link .arrow-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
    }

    /* Touch feedback instead of hover */
    .eco-card:hover {
        transform: none;
        box-shadow:
            0 1px 3px rgba(0, 0, 0, 0.04),
            0 4px 12px rgba(0, 0, 0, 0.06);
    }

    .eco-card:active {
        transform: scale(0.98);
        box-shadow:
            0 1px 2px rgba(0, 0, 0, 0.08),
            0 2px 8px rgba(0, 0, 0, 0.1);
    }
}

/* ═════════════════════════════════════════════════════════════════
   EXTRA SMALL (≤400px) - Compact cards
   ═════════════════════════════════════════════════════════════════ */
@media (max-width: 400px) {
    .tile-container {
        padding: 0.75rem;
        gap: 0.5rem;
    }

    .eco-card {
        flex: 0 0 90%;
        min-width: 240px;
        min-height: 180px;
    }

    .card-content {
        padding: 0.875rem;
    }

    .card-icon-wrapper {
        width: 32px;
        height: 32px;
    }

    .card-icon-wrapper mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
    }

    .card-title {
        font-size: 0.875rem;
    }

    .card-description {
        font-size: 0.6875rem;
    }

    .card-footer {
        padding: 0.5rem 0.875rem;
    }
}

/* ═════════════════════════════════════════════════════════════════
   SCROLL INDICATOR (Mobile)
   ═════════════════════════════════════════════════════════════════ */
@media (max-width: 599px) {
    .tile-container::after {
        content: '';
        position: absolute;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 40px;
        height: 100%;
        background: linear-gradient(90deg,
            transparent 0%,
            rgba(238, 238, 238, 0.8) 100%);
        pointer-events: none;
        opacity: 1;
        transition: opacity 0.3s ease;
    }
}

/* ═════════════════════════════════════════════════════════════════
   PRINT STYLES
   ═════════════════════════════════════════════════════════════════ */
@media print {
    .tile-container {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
    }

    .eco-card {
        break-inside: avoid;
        box-shadow: none;
        border: 1px solid #ccc;
    }

    .card-accent {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }
}
`;

// Update widget CSS
if (dashboard.configuration.widgets && dashboard.configuration.widgets[TILES_WIDGET_ID]) {
    const widget = dashboard.configuration.widgets[TILES_WIDGET_ID];
    widget.config.settings.markdownCss = responsiveCss;

    console.log('✓ Updated home tiles with responsive CSS');

    fs.writeFileSync(dashboardPath, JSON.stringify(dashboard, null, 2));
    console.log('✓ Dashboard saved');
    console.log('\nBreakpoints configured:');
    console.log('  • Desktop: ≥960px (5 cards horizontal)');
    console.log('  • Tablet:  600-959px (3+2 grid)');
    console.log('  • Mobile:  ≤599px (horizontal scroll)');
    console.log('  • XS:      ≤400px (compact cards)');
    console.log('\nNext: Run "node sync/sync.js push navigation" to deploy');
} else {
    console.log('✗ Widget not found');
}
