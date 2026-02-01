/**
 * Update Home Tiles to Clean/Minimal Design
 *
 * Transforms the solid blue tiles into elegant white cards with:
 * - Subtle shadows and borders
 * - Material icons instead of large numbers
 * - Blue accent line at top
 * - Smooth hover animations
 * - Better typography hierarchy
 */

const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, '..', 'dashboards', 'navigation.json');
const dashboard = JSON.parse(fs.readFileSync(dashboardPath, 'utf8'));

// Widget ID for the home tiles
const TILES_WIDGET_ID = '9094f048-ccc5-b9d7-9dd0-6ef0a20851c9';

// New HTML Template - Clean/Minimal Design
const newMarkdownTextFunction = `return \`
<div class="tile-container">

  <!-- RetroFIT+ -->
  <div class="eco-card" id="assessment">
    <div class="card-accent"></div>
    <div class="card-content">
      <div class="card-icon-wrapper">
        <mat-icon>assignment_turned_in</mat-icon>
      </div>
      <span class="card-number">01</span>
      <h3 class="card-title">RetroFIT+</h3>
      <p class="card-description">BELIMO RetroFIT+ assessment tool</p>
    </div>
    <div class="card-footer">
      <span class="card-link">Mehr erfahren <mat-icon class="arrow-icon">arrow_forward</mat-icon></span>
    </div>
  </div>

  <!-- Anlagenbericht -->
  <div class="eco-card" id="asset-report">
    <div class="card-accent"></div>
    <div class="card-content">
      <div class="card-icon-wrapper">
        <mat-icon>description</mat-icon>
      </div>
      <span class="card-number">02</span>
      <h3 class="card-title">Anlagenbericht</h3>
      <p class="card-description">Schematische Erhebung der Technikanlage und Definition der Messpunkte.</p>
    </div>
    <div class="card-footer">
      <span class="card-link">Mehr erfahren <mat-icon class="arrow-icon">arrow_forward</mat-icon></span>
    </div>
  </div>

  <!-- Messung -->
  <div class="eco-card" id="measurement">
    <div class="card-accent"></div>
    <div class="card-content">
      <div class="card-icon-wrapper">
        <mat-icon>straighten</mat-icon>
      </div>
      <span class="card-number">03</span>
      <h3 class="card-title">Messung</h3>
      <p class="card-description">Live-Überwachung von Anlagen, Zählern und Sensorik.</p>
    </div>
    <div class="card-footer">
      <span class="card-link">Mehr erfahren <mat-icon class="arrow-icon">arrow_forward</mat-icon></span>
    </div>
  </div>

  <!-- Analyse -->
  <div class="eco-card" id="analysis">
    <div class="card-accent"></div>
    <div class="card-content">
      <div class="card-icon-wrapper">
        <mat-icon>insights</mat-icon>
      </div>
      <span class="card-number">04</span>
      <h3 class="card-title">Analyse</h3>
      <p class="card-description">Aufbereitung der Energiedaten für den Energiebericht.</p>
    </div>
    <div class="card-footer">
      <span class="card-link">Mehr erfahren <mat-icon class="arrow-icon">arrow_forward</mat-icon></span>
    </div>
  </div>

  <!-- Cockpit -->
  <div class="eco-card" id="monitoring">
    <div class="card-accent"></div>
    <div class="card-content">
      <div class="card-icon-wrapper">
        <mat-icon>dashboard</mat-icon>
      </div>
      <span class="card-number">05</span>
      <h3 class="card-title">Cockpit</h3>
      <p class="card-description">Energiemonitoring und Energiemanagement.</p>
    </div>
    <div class="card-footer">
      <span class="card-link">Mehr erfahren <mat-icon class="arrow-icon">arrow_forward</mat-icon></span>
    </div>
  </div>

</div>
\`;`;

// New CSS - Clean/Minimal Design
const newMarkdownCss = `/* ═══════════════════════════════════════════════════════════════
   ECO ENERGY - CLEAN/MINIMAL HOME TILES
   ═══════════════════════════════════════════════════════════════ */

:host {
    display: block;
    height: 100%;
}

/* ─── Container ─── */
.tile-container {
    display: flex;
    gap: 1.25rem;
    width: 100%;
    height: 100%;
    justify-content: center;
    align-items: center;
    padding: 1rem;
    box-sizing: border-box;
}

/* ─── Card Base ─── */
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
    max-width: 240px;
    min-height: 280px;

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

/* ─── Accent Line ─── */
.card-accent {
    height: 4px;
    background: linear-gradient(90deg,
        var(--tb-primary-500) 0%,
        var(--tb-primary-400, #5c9ce6) 100%);
    flex-shrink: 0;
}

.eco-card:hover .card-accent {
    height: 5px;
}

/* ─── Content Area ─── */
.card-content {
    flex: 1;
    padding: 1.5rem 1.5rem 1rem;
    display: flex;
    flex-direction: column;
    position: relative;
}

/* ─── Icon ─── */
.card-icon-wrapper {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: linear-gradient(135deg,
        rgba(66, 133, 244, 0.08) 0%,
        rgba(66, 133, 244, 0.04) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
    transition: background 0.25s ease;
}

.card-icon-wrapper mat-icon {
    font-size: 24px;
    width: 24px;
    height: 24px;
    color: var(--tb-primary-500);
    transition: transform 0.25s ease;
}

.eco-card:hover .card-icon-wrapper {
    background: linear-gradient(135deg,
        rgba(66, 133, 244, 0.12) 0%,
        rgba(66, 133, 244, 0.06) 100%);
}

.eco-card:hover .card-icon-wrapper mat-icon {
    transform: scale(1.1);
}

/* ─── Number Badge ─── */
.card-number {
    position: absolute;
    top: 1.25rem;
    right: 1.25rem;
    font-size: 0.625rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    color: rgba(0, 0, 0, 0.25);
    background: rgba(0, 0, 0, 0.03);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
}

/* ─── Typography ─── */
.card-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1a1a2e;
    margin: 0 0 0.5rem 0;
    letter-spacing: -0.01em;
    line-height: 1.3;
}

.card-description {
    font-size: 0.8125rem;
    line-height: 1.55;
    color: #6b7280;
    margin: 0;
    flex: 1;
}

/* ─── Footer ─── */
.card-footer {
    padding: 1rem 1.5rem 1.25rem;
    border-top: 1px solid rgba(0, 0, 0, 0.04);
}

.card-link {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--tb-primary-500);
    transition: gap 0.2s ease;
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
    transform: translateX(2px);
}

/* ─── Responsive ─── */
@media (max-width: 1400px) {
    .eco-card {
        max-width: 220px;
        min-height: 260px;
    }

    .card-content {
        padding: 1.25rem 1.25rem 0.75rem;
    }

    .card-icon-wrapper {
        width: 44px;
        height: 44px;
    }

    .card-title {
        font-size: 1rem;
    }

    .card-description {
        font-size: 0.75rem;
    }
}

@media (max-width: 1200px) {
    .tile-container {
        flex-wrap: wrap;
        gap: 1rem;
    }

    .eco-card {
        flex: 1 1 calc(33.333% - 1rem);
        max-width: none;
        min-height: 240px;
    }
}

@media (max-width: 900px) {
    .eco-card {
        flex: 1 1 calc(50% - 1rem);
    }
}

@media (max-width: 600px) {
    .eco-card {
        flex: 1 1 100%;
    }
}
`;

// Update widget in root configuration.widgets (not in states - those are just references)
if (dashboard.configuration.widgets && dashboard.configuration.widgets[TILES_WIDGET_ID]) {
    const widget = dashboard.configuration.widgets[TILES_WIDGET_ID];
    widget.config.settings.markdownTextFunction = newMarkdownTextFunction;
    widget.config.settings.markdownCss = newMarkdownCss;
    console.log('✓ Updated home tiles widget');

    fs.writeFileSync(dashboardPath, JSON.stringify(dashboard, null, 2));
    console.log('✓ Dashboard saved successfully');
    console.log('\nNext: Run "node sync/sync.js push navigation" to deploy');
} else {
    console.log('✗ Widget not found in root widgets');
}
