#!/usr/bin/env node
/**
 * Fix Calculated Field return format for proper timestamp handling
 *
 * Correct format:
 * return {
 *   "ts": ctx.latestTs,
 *   "values": result
 * };
 *
 * Wrong format:
 * result.ts = ctx.latestTs;
 * return result;
 */

const { loadConfig } = require('../sync/config');
const { ThingsBoardApi } = require('../sync/api');

const CF_IDS = {
  derived_basic: '6cac3240-0211-11f1-9b0a-33b9bcf3ddd0',
  derived_power: '8d2f1a50-0211-11f1-9979-9f3434877bb4',
  derived_schedule: 'aee1f6e0-0211-11f1-9979-9f3434877bb4'
};

async function main() {
  const config = loadConfig();
  const api = new ThingsBoardApi(config);
  await api.login();

  for (const [name, id] of Object.entries(CF_IDS)) {
    console.log(`\n========== Processing ${name} (${id}) ==========`);

    // Fetch CF
    const cf = await api.request('GET', `/api/calculatedField/${id}`);
    console.log(`Fetched: ${cf.name}`);

    const originalExpression = cf.configuration.expression;
    console.log('\n--- Original expression (last 500 chars) ---');
    console.log(originalExpression.slice(-500));

    // Fix the return format
    let fixedExpression = originalExpression;

    // Pattern 1: "result.ts = ctx.latestTs;\nreturn result;"
    // Replace with proper format
    const resultTsPattern = /result\.ts\s*=\s*ctx\.latestTs\s*;?\s*\n\s*return\s+result\s*;/g;
    if (resultTsPattern.test(fixedExpression)) {
      fixedExpression = fixedExpression.replace(resultTsPattern, 'return {\n  "ts": ctx.latestTs,\n  "values": result\n};');
      console.log('\nFixed Pattern 1: result.ts assignment followed by return result');
    }

    // Pattern 2: For schedule - return { ts: ctx.latestTs, "schedule_violation": ... }
    // (without quotes on ts key and without values wrapper)
    const schedulePattern = /return\s*\{\s*ts:\s*ctx\.latestTs,\s*"schedule_violation":\s*\(([^)]+)\)\s*\};?/;
    const scheduleMatch = fixedExpression.match(schedulePattern);
    if (scheduleMatch && !fixedExpression.includes('"values":')) {
      const condition = scheduleMatch[1];
      fixedExpression = fixedExpression.replace(
        schedulePattern,
        `return {\n  "ts": ctx.latestTs,\n  "values": {\n    "schedule_violation": (${condition})\n  }\n};`
      );
      console.log('\nFixed Pattern 2: schedule return with inline object');
    }

    console.log('\n--- Fixed expression (last 500 chars) ---');
    console.log(fixedExpression.slice(-500));

    if (fixedExpression === originalExpression) {
      console.log('\n>>> No changes needed for this CF');
      continue;
    }

    // Update CF
    cf.configuration.expression = fixedExpression;

    console.log('\n>>> Updating CF...');
    await api.request('POST', '/api/calculatedField', cf);
    console.log('>>> Updated successfully!');
  }

  console.log('\n========== All CFs processed ==========');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
