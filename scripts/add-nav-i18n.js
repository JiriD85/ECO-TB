const fs = require('fs');

// Load translation files
const dePath = 'translation/de_DE_custom_translation.json';
const enPath = 'translation/en_US_custom_translation.json';

const de = JSON.parse(fs.readFileSync(dePath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Add nav section if it doesn't exist
if (!de.custom.diagnostics.nav) {
    de.custom.diagnostics.nav = {};
}
if (!en.custom.diagnostics.nav) {
    en.custom.diagnostics.nav = {};
}

// Add German translations
de.custom.diagnostics.nav['raw-data'] = 'Rohdaten';
de.custom.diagnostics.nav['load-analysis'] = 'Lastanalyse';

// Add English translations
en.custom.diagnostics.nav['raw-data'] = 'Raw Data';
en.custom.diagnostics.nav['load-analysis'] = 'Load Analysis';

// Save files
fs.writeFileSync(dePath, JSON.stringify(de, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));

console.log('✓ Added i18n keys:');
console.log('  DE: custom.diagnostics.nav.raw-data = "Rohdaten"');
console.log('  DE: custom.diagnostics.nav.load-analysis = "Lastanalyse"');
console.log('  EN: custom.diagnostics.nav.raw-data = "Raw Data"');
console.log('  EN: custom.diagnostics.nav.load-analysis = "Load Analysis"');
