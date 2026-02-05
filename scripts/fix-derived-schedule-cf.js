/**
 * Fix Calculated Field "derived_schedule"
 *
 * Problem: weeklySchedule koennte als Objekt oder als String kommen
 * Loesung: JSON.stringify + JSON.parse verwenden (TBEL unterstuetzt beides)
 *
 * CF ID: aee1f6e0-0211-11f1-9979-9f3434877bb4
 */

const { ThingsBoardApi } = require('../sync/api');
const { loadConfig } = require('../sync/config');

const CF_ID = 'aee1f6e0-0211-11f1-9979-9f3434877bb4';

// New guard code that handles both string and object inputs
const NEW_GUARD_CODE = `// Guard: Need is_on and schedule
if (is_on == null || weeklySchedule == null || weeklySchedule == "") {
  return {};
}

// weeklySchedule koennte String oder Objekt sein - normalisieren
var schedule = weeklySchedule;
if (typeof weeklySchedule == "string") {
  schedule = JSON.parse(weeklySchedule);
}
if (schedule == null) {
  return {};
}`;

async function main() {
  const config = loadConfig();
  const api = new ThingsBoardApi(config);

  console.log('Logging in to ThingsBoard...');
  await api.login();

  // 1. Lade das bestehende Calculated Field
  console.log(`\nLoading Calculated Field ${CF_ID}...`);
  const cf = await api.request('GET', `/api/calculatedField/${CF_ID}`);

  console.log('\nCurrent CF:');
  console.log('  Name:', cf.name);
  console.log('  Type:', cf.type);
  console.log('  Entity Type:', cf.entityType);

  console.log('\nCurrent expression (first 500 chars):');
  const expression = cf.configuration?.expression || '';
  console.log(expression.substring(0, 500) + '...');

  // 2. Ersetze den Guard-Code (erste ~9 Zeilen bis "if (schedule == null)")
  // Pattern: vom Anfang bis einschliesslich "if (schedule == null) {\n  return {};\n}"
  const guardPattern = /^\/\/ Guard:.*?if \(schedule == null\) \{\s*return \{\};\s*\}/s;

  if (!guardPattern.test(expression)) {
    console.log('\n!!! Guard-Pattern nicht gefunden - manueller Check noetig');
    console.log('Zeilen 1-15:');
    console.log(expression.split('\n').slice(0, 15).join('\n'));
    return;
  }

  const fixedExpression = expression.replace(guardPattern, NEW_GUARD_CODE);

  console.log('\n--- AENDERUNG ---');
  console.log('NEUER Guard-Code:');
  console.log(NEW_GUARD_CODE);

  console.log('\n--- Erste 600 Zeichen der neuen Expression: ---');
  console.log(fixedExpression.substring(0, 600));

  // 3. Update das CF
  cf.configuration.expression = fixedExpression;

  console.log('\nSaving updated Calculated Field...');
  const result = await api.request('POST', '/api/calculatedField', cf);

  console.log('\n=== ERFOLG ===');
  console.log('Calculated Field wurde aktualisiert!');
  console.log('  ID:', result.id?.id || CF_ID);
  console.log('  Name:', result.name);
}

main().catch(err => {
  console.error('Fehler:', err.message);
  process.exit(1);
});
