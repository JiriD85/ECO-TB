const fs = require('fs');
const dashboard = JSON.parse(fs.readFileSync('dashboards/navigation.json', 'utf8'));
const TILES_WIDGET_ID = '9094f048-ccc5-b9d7-9dd0-6ef0a20851c9';

// Check root widgets
if (dashboard.configuration.widgets && dashboard.configuration.widgets[TILES_WIDGET_ID]) {
    const w = dashboard.configuration.widgets[TILES_WIDGET_ID];
    console.log('Found in root widgets');
    console.log('Has config:', w.config ? 'yes' : 'no');
    console.log('Has settings:', (w.config && w.config.settings) ? 'yes' : 'no');
}

// Check states
if (dashboard.configuration.states) {
    for (const stateId in dashboard.configuration.states) {
        const state = dashboard.configuration.states[stateId];
        if (state.layouts) {
            for (const layoutId in state.layouts) {
                const layout = state.layouts[layoutId];
                if (layout.widgets) {
                    for (const wid in layout.widgets) {
                        const w = layout.widgets[wid];
                        if (w.id === TILES_WIDGET_ID || wid === TILES_WIDGET_ID) {
                            console.log('\nFound in state:', stateId, 'layout:', layoutId, 'key:', wid);
                            console.log('Has id field:', w.id ? 'yes' : 'no');
                            console.log('Has config:', w.config ? 'yes' : 'no');
                            if (w.config) {
                                console.log('Has settings:', w.config.settings ? 'yes' : 'no');
                            }
                            console.log('Keys:', Object.keys(w).join(', '));
                        }
                    }
                }
            }
        }
    }
}
