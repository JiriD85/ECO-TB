#!/usr/bin/env node
/**
 * Fix Calculated Field return format for proper timestamp handling
 *
 * Changes return format from:
 *   return { "key1": value1, "key2": value2 };
 *
 * To:
 *   return { "ts": ctx.latestTs, "values": { "key1": value1, "key2": value2 } };
 *
 * Only modifies final returns with values, leaves empty returns unchanged.
 */

const { loadConfig } = require('../sync/config');
const { ThingsBoardApi } = require('../sync/api');

const CF_IDS = {
  oscillation_detection: '30eb6890-0133-11f1-9979-9f3434877bb4',
  dT_collapse_flag: '684c01c0-0127-11f1-9979-9f3434877bb4',
  flow_spike_flag: '685884e0-0127-11f1-9979-9f3434877bb4',
  power_stability: 'a065a960-0129-11f1-9979-9f3434877bb4',
  runtime_pct: 'a06e8300-0129-11f1-9979-9f3434877bb4',
  cycling_flag: 'aedba340-012a-11f1-9979-9f3434877bb4'
};

async function main() {
  const config = loadConfig();
  const api = new ThingsBoardApi(config);
  await api.login();

  const results = [];

  for (const [name, id] of Object.entries(CF_IDS)) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Processing: ${name} (${id})`);
    console.log('='.repeat(60));

    try {
      // Fetch CF
      const cf = await api.request('GET', `/api/calculatedField/${id}`);
      console.log(`Fetched: ${cf.name}`);

      const originalExpression = cf.configuration.expression;

      // Find the final return statement with values
      // Pattern: return { ... }; at the end of the expression (not return {};)
      const returnPattern = /return\s*(\{[^{}]+\})\s*;?\s*$/;
      const match = originalExpression.match(returnPattern);

      if (!match) {
        console.log('\n[SKIP] No matching return statement found');
        results.push({ name, id, status: 'SKIP', reason: 'No matching return pattern' });
        continue;
      }

      const returnedObject = match[1];

      // Skip if it's an empty return
      if (returnedObject.trim() === '{}') {
        console.log('\n[SKIP] Return is empty object');
        results.push({ name, id, status: 'SKIP', reason: 'Empty return object' });
        continue;
      }

      // Skip if already has ts and values wrapper
      if (returnedObject.includes('"ts"') && returnedObject.includes('"values"')) {
        console.log('\n[SKIP] Already has correct format with ts and values');
        results.push({ name, id, status: 'SKIP', reason: 'Already correct format' });
        continue;
      }

      console.log('\n--- BEFORE (return statement) ---');
      console.log(`return ${returnedObject};`);

      // Extract the content inside the braces
      const innerContent = returnedObject.slice(1, -1).trim();

      // Create new return with ts and values wrapper
      const newReturn = `return { "ts": ctx.latestTs, "values": { ${innerContent} } };`;

      // Replace in expression
      const fixedExpression = originalExpression.replace(
        returnPattern,
        newReturn
      );

      console.log('\n--- AFTER (return statement) ---');
      console.log(newReturn);

      // Update CF
      cf.configuration.expression = fixedExpression;

      console.log('\n>>> Updating CF...');
      await api.request('POST', '/api/calculatedField', cf);
      console.log('>>> SUCCESS!');

      results.push({
        name,
        id,
        status: 'SUCCESS',
        before: `return ${returnedObject};`,
        after: newReturn
      });

    } catch (err) {
      console.error(`\n[ERROR] ${err.message}`);
      results.push({ name, id, status: 'ERROR', reason: err.message });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));

  for (const r of results) {
    console.log(`\n${r.name} (${r.id})`);
    console.log(`  Status: ${r.status}`);
    if (r.reason) {
      console.log(`  Reason: ${r.reason}`);
    }
    if (r.before) {
      console.log(`  Before: ${r.before}`);
      console.log(`  After:  ${r.after}`);
    }
  }

  const successCount = results.filter(r => r.status === 'SUCCESS').length;
  const skipCount = results.filter(r => r.status === 'SKIP').length;
  const errorCount = results.filter(r => r.status === 'ERROR').length;

  console.log(`\nTotal: ${results.length} | Success: ${successCount} | Skip: ${skipCount} | Error: ${errorCount}`);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
