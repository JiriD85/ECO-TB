/**
 * Update ALL Info Dialogs to Clean/Minimal Design
 *
 * Two CSS class prefixes:
 * - belimo-ra (info-assessment)
 * - eco-ar (info-assetreport, info-measurement, info-analysis, info-monitoring)
 */

const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, '..', 'dashboards', 'navigation.json');
const dashboard = JSON.parse(fs.readFileSync(dashboardPath, 'utf8'));

// Widget mappings
const WIDGETS = {
    'belimo-ra': ['79029476-4566-98e9-5da8-27caeb565c2c'],  // info-assessment
    'eco-ar': [
        'bdbf787e-094a-92e0-6df5-4b3969affe5f',  // info-assetreport
        '8840f0a9-1d9a-9649-79cd-0310c0cc567a',  // info-measurement
        '7d36dd75-f618-00e4-4ad7-e05a332e4404',  // info-analysis
        'a678f68b-a9cc-db8c-1579-2794a0af750e'   // info-monitoring
    ]
};

// Generate CSS for a given prefix
function generateStepperCss(prefix) {
    return `/* ═══════════════════════════════════════════════════════════════
   ECO ENERGY - CLEAN/MINIMAL STEPPER DESIGN
   Prefix: ${prefix}
   Font: Roboto | Border-Radius: 12px | Transitions: 0.25s ease
   ═══════════════════════════════════════════════════════════════ */

.${prefix} {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.75rem;
    background: #ffffff;
    overflow: auto;
    font-family: "Roboto", "Helvetica Neue", sans-serif;
    color: #1a1a2e;
}

/* ─── Header ─── */
.${prefix}__header {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.${prefix}__title {
    font-size: 1.25rem;
    font-weight: 600;
    line-height: 1.3;
    letter-spacing: -0.01em;
    color: #1a1a2e;
}

.${prefix}__subtitle {
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.5;
}

/* ─── Progress Stepper ─── */
.${prefix}__progress {
    display: flex;
    align-items: center;
    gap: 0;
    user-select: none;
    padding: 0.5rem 0;
}

.${prefix}__dot {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid rgba(0, 0, 0, 0.12);
    background: #ffffff;
    font-size: 0.75rem;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.4);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 1;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: "Roboto", "Helvetica Neue", sans-serif;
}

.${prefix}__dot:hover {
    border-color: rgba(0, 0, 0, 0.24);
    background: rgba(0, 0, 0, 0.02);
}

.${prefix}__dot.is-active {
    border-color: var(--tb-primary-500, #2196f3);
    background: var(--tb-primary-500, #2196f3);
    color: #ffffff;
    box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
    transform: scale(1.05);
}

.${prefix}__dot.is-completed {
    border-color: var(--tb-primary-500, #2196f3);
    background: rgba(33, 150, 243, 0.1);
    color: var(--tb-primary-500, #2196f3);
}

.${prefix}__line {
    height: 2px;
    flex: 1;
    background: rgba(0, 0, 0, 0.08);
    border-radius: 1px;
    margin: 0 -1px;
    transition: background 0.25s ease;
}

.${prefix}__line.is-completed {
    background: linear-gradient(90deg,
        var(--tb-primary-500, #2196f3) 0%,
        rgba(33, 150, 243, 0.3) 100%);
}

/* ─── Steps Content ─── */
.${prefix}__steps {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
}

.${prefix}__step {
    display: none;
    animation: stepFadeIn 0.3s ease-out;
}

@keyframes stepFadeIn {
    from {
        opacity: 0;
        transform: translateY(8px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.${prefix}__step.is-active {
    display: block;
}

.${prefix}__step h3 {
    margin: 0 0 0.75rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: #1a1a2e;
    letter-spacing: -0.01em;
    font-family: "Roboto", "Helvetica Neue", sans-serif;
}

.${prefix}__step p {
    margin: 0 0 1rem 0;
    font-size: 0.875rem;
    line-height: 1.65;
    color: #4b5563;
}

.${prefix}__step ul,
.${prefix}__step ol {
    margin: 0 0 1rem 0;
    padding-left: 1.25rem;
    font-size: 0.875rem;
    line-height: 1.65;
    color: #4b5563;
}

.${prefix}__step li {
    margin-bottom: 0.5rem;
}

.${prefix}__step li:last-child {
    margin-bottom: 0;
}

.${prefix}__step strong {
    color: #1a1a2e;
    font-weight: 600;
}

.${prefix}__hint {
    font-size: 0.8125rem;
    color: #6b7280;
    background: rgba(0, 0, 0, 0.02);
    border-left: 3px solid rgba(0, 0, 0, 0.08);
    padding: 0.75rem 1rem;
    border-radius: 0 6px 6px 0;
    margin-top: 1rem;
}

/* ─── CTA Section ─── */
.${prefix}__cta {
    margin-top: 1.5rem;
    padding: 1.25rem;
    background: linear-gradient(135deg,
        rgba(33, 150, 243, 0.04) 0%,
        rgba(33, 150, 243, 0.08) 100%);
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
}

.${prefix}__link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    background: var(--tb-primary-500, #2196f3);
    color: #ffffff;
    font-size: 0.875rem;
    font-weight: 500;
    text-decoration: none;
    border-radius: 6px;
    transition: all 0.2s ease;
    font-family: "Roboto", "Helvetica Neue", sans-serif;
}

.${prefix}__link:hover {
    background: var(--tb-primary-600, #1976d2);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
}

.${prefix}__ctaNote {
    font-size: 0.75rem;
    color: #6b7280;
}

/* ─── Navigation ─── */
.${prefix}__nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding-top: 1.25rem;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    margin-top: auto;
}

.${prefix}__btn {
    padding: 0.625rem 1.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 6px;
    background: #ffffff;
    color: #4b5563;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: "Roboto", "Helvetica Neue", sans-serif;
}

.${prefix}__btn:hover:not(:disabled) {
    border-color: rgba(0, 0, 0, 0.24);
    background: rgba(0, 0, 0, 0.02);
}

.${prefix}__btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.${prefix}__btn--primary {
    border-color: var(--tb-primary-500, #2196f3);
    background: var(--tb-primary-500, #2196f3);
    color: #ffffff;
}

.${prefix}__btn--primary:hover:not(:disabled) {
    background: var(--tb-primary-600, #1976d2);
    border-color: var(--tb-primary-600, #1976d2);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.25);
}

.${prefix}__navMeta {
    font-size: 0.8125rem;
    color: #9ca3af;
    font-weight: 500;
}

/* ─── Responsive ─── */
@media (max-width: 600px) {
    .${prefix} {
        padding: 1.25rem;
        gap: 1.25rem;
    }

    .${prefix}__title {
        font-size: 1.125rem;
    }

    .${prefix}__dot {
        width: 28px;
        height: 28px;
        font-size: 0.6875rem;
    }

    .${prefix}__btn {
        padding: 0.5rem 1rem;
        font-size: 0.8125rem;
    }
}
`;
}

// Update all widgets
let updatedCount = 0;

for (const [prefix, widgetIds] of Object.entries(WIDGETS)) {
    const css = generateStepperCss(prefix);

    for (const widgetId of widgetIds) {
        const widget = dashboard.configuration.widgets[widgetId];
        if (widget && widget.config && widget.config.settings) {
            widget.config.settings.cardCss = css;
            updatedCount++;
            console.log(`✓ Updated widget ${widgetId.slice(0,8)}... (${prefix})`);
        }
    }
}

if (updatedCount > 0) {
    fs.writeFileSync(dashboardPath, JSON.stringify(dashboard, null, 2));
    console.log(`\n✓ Dashboard saved (${updatedCount} widgets updated)`);
    console.log('\nNext: Run "node sync/sync.js push navigation" to deploy');
} else {
    console.log('\n✗ No widgets updated');
}
