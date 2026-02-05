/**
 * Fix derived_schedule Calculated Field with isMap() check
 */
const { ThingsBoardApi } = require('../sync/api.js');
const { loadConfig } = require('../sync/config.js');

const CF_ID = 'aee1f6e0-0211-11f1-9979-9f3434877bb4';

async function main() {
  const config = loadConfig();
  const api = new ThingsBoardApi(config);
  await api.login();

  // Step 1: Get the current CF
  console.log('Fetching Calculated Field...');
  const cf = await api.request('GET', `/api/calculatedField/${CF_ID}`);
  console.log('Name:', cf.name);
  console.log('Current expression:\n', cf.configuration.expression);

  // Step 2: Replace the beginning of the expression
  const oldExpression = cf.configuration.expression;

  // Find where the old guard code ends (after "if (schedule == null)")
  // The old code pattern we need to replace ends with the return {} after schedule null check
  const scheduleNullCheckPattern = /if\s*\(\s*schedule\s*==\s*null\s*\)\s*\{\s*return\s*\{\s*\}\s*;\s*\}/;
  const match = oldExpression.match(scheduleNullCheckPattern);

  if (!match) {
    console.error('Could not find the schedule null check pattern in the expression');
    console.log('Looking for pattern: if (schedule == null) { return {}; }');
    process.exit(1);
  }

  // Find the end position of the matched pattern
  const endOfOldGuard = oldExpression.indexOf(match[0]) + match[0].length;

  // Get the rest of the expression after the old guard
  const restOfExpression = oldExpression.substring(endOfOldGuard);

  // New guard code
  const newGuard = `// Guard: Need is_on and schedule
if (is_on == null || weeklySchedule == null || weeklySchedule == "") {
  return {};
}

// weeklySchedule kann String oder Objekt sein - isMap() prueft auf Objekt
var schedule = isMap(weeklySchedule) ? weeklySchedule : JSON.parse(weeklySchedule);
if (schedule == null) {
  return {};
}`;

  const newExpression = newGuard + restOfExpression;

  console.log('\n--- NEW EXPRESSION ---\n');
  console.log(newExpression);
  console.log('\n--- END NEW EXPRESSION ---\n');

  // Step 3: Update the CF
  cf.configuration.expression = newExpression;

  console.log('Updating Calculated Field...');
  const result = await api.request('POST', '/api/calculatedField', cf);
  console.log('Updated successfully!');
  console.log('Result ID:', result.id.id);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
