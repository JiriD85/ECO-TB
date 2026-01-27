const fs = require('fs');
const dashboard = JSON.parse(fs.readFileSync('dashboards/measurements.json', 'utf8'));
const widget = dashboard.configuration.widgets['6ccd99bd-8562-4e6b-e42b-e7f3c026a129'];

// Get current CSS
let css = widget.config.settings.markdownCss || '';

// Add navigation bar CSS
const navBarCss = `

/* Navigation Bar */
.measurement-nav-bar {
    display: flex;
    gap: 0;
    background: #fff;
    margin: 0 10px;
    border-radius: 8px;
    padding: 4px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.nav-tab {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border: none;
    background: transparent;
    color: #666;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s ease;
}

.nav-tab:hover {
    background: rgba(0, 0, 0, 0.04);
    color: #333;
}

.nav-tab.active {
    background: var(--tb-primary-500, #305680);
    color: white;
}

.nav-tab mat-icon {
    font-size: 18px;
    width: 18px;
    height: 18px;
}

.nav-tab.active mat-icon {
    color: white;
}
`;

// Check if nav bar CSS already exists
if (!css.includes('.measurement-nav-bar')) {
    css += navBarCss;
    widget.config.settings.markdownCss = css;
    console.log('✓ Added navigation bar CSS');
} else {
    console.log('Navigation bar CSS already exists');
}

fs.writeFileSync('dashboards/measurements.json', JSON.stringify(dashboard, null, 2));
