const fs = require('fs');
const db = JSON.parse(fs.readFileSync('dashboards/measurements.json', 'utf8'));

const widgetId = process.argv[2] || 'dc35f902-3824-8f1b-a870-fee55664d0bd';
const widget = db.configuration.widgets[widgetId];

if (!widget) {
    console.log('Widget not found:', widgetId);
    process.exit(1);
}

console.log('Widget title:', widget.config?.title);
console.log('Widget type:', widget.type);

const settings = widget.config?.settings || {};
const mtf = settings.markdownTextFunction;

console.log('\nmarkdownTextFunction type:', typeof mtf);

if (typeof mtf === 'object' && mtf !== null) {
    console.log('Keys:', Object.keys(mtf));
    if (mtf.body) {
        console.log('\n=== BODY ===\n');
        console.log(mtf.body);
    }
} else if (typeof mtf === 'string') {
    console.log('\n=== markdownTextFunction (string) ===\n');
    console.log(mtf);
}

// Also check datasources
console.log('\n=== DATASOURCES ===');
widget.config?.datasources?.forEach((ds, i) => {
    console.log('Datasource', i + ':');
    console.log('  Alias ID:', ds.entityAliasId);
    console.log('  Keys:', ds.dataKeys?.map(k => k.name + ' (' + k.type + ')').join(', '));
});
