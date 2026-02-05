const fs = require('fs');

const dashboardFile = process.argv[2] || 'dashboards/projects_alarms.json';
const stateName = process.argv[3] || 'project_card_header';

const db = JSON.parse(fs.readFileSync(dashboardFile, 'utf8'));
const state = db.configuration.states[stateName];

if (!state) {
    console.log('State not found:', stateName);
    process.exit(1);
}

const layout = state.layouts.main;
console.log('=== Widgets in', stateName, '===\n');

for (const widgetId in layout.widgets) {
    const widgetRef = layout.widgets[widgetId];
    const widget = db.configuration.widgets[widgetRef.id || widgetId];

    console.log('Widget ID:', widgetRef.id || widgetId);
    console.log('Title:', widget.config?.title);
    console.log('Row:', widgetRef.row, '| sizeY:', widgetRef.sizeY);

    const settings = widget.config?.settings || {};
    const mtf = settings.markdownTextFunction;

    if (mtf) {
        console.log('\n--- markdownTextFunction ---');
        const body = typeof mtf === 'object' ? mtf.body : mtf;
        console.log(body);
    }

    console.log('\n--- Datasources ---');
    widget.config?.datasources?.forEach((ds, i) => {
        console.log('  DS', i + ':', ds.dataKeys?.map(k => k.name).join(', '));
    });

    console.log('\n' + '='.repeat(60) + '\n');
}
