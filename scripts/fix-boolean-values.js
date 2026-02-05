#!/usr/bin/env node
/**
 * Fix Boolean values in Calculated Fields
 *
 * Problem: Boolean values are stored as strings ("true"/"false") instead of real booleans.
 *
 * This script:
 * 1. Fetches each CF via GET /api/calculatedField/{id}
 * 2. Analyzes the TBEL code for boolean assignments
 * 3. Fixes string booleans to real booleans
 * 4. Updates via POST /api/calculatedField
 */

const { loadConfig } = require('../sync/config');
const { ThingsBoardApi } = require('../sync/api');

// CFs with Boolean outputs
const CF_IDS = {
  derived_basic:         { id: '6cac3240-0211-11f1-9b0a-33b9bcf3ddd0', keys: ['is_on'] },
  derived_schedule:      { id: 'aee1f6e0-0211-11f1-9979-9f3434877bb4', keys: ['schedule_violation'] },
  oscillation_detection: { id: '30eb6890-0133-11f1-9979-9f3434877bb4', keys: ['oscillation_flag'] },
  dT_collapse_flag:      { id: '684c01c0-0127-11f1-9979-9f3434877bb4', keys: ['dT_collapse_flag'] },
  flow_spike_flag:       { id: '685884e0-0127-11f1-9979-9f3434877bb4', keys: ['flow_spike_flag'] },
  power_stability:       { id: 'a065a960-0129-11f1-9979-9f3434877bb4', keys: ['power_unstable_flag'] },
  cycling_flag:          { id: 'aedba340-012a-11f1-9979-9f3434877bb4', keys: ['cycling_flag'] }
};

/**
 * Fix boolean values in TBEL expression
 *
 * TBEL Problem: When a boolean is assigned to a map value and returned,
 * ThingsBoard may serialize it as a string. The fix is to use explicit
 * boolean conversion: (expression) ? true : false
 *
 * This ensures the value is a primitive boolean, not a Boolean object.
 *
 * Patterns to fix:
 *   "key": variable          -> "key": variable ? true : false
 *   "key": (expression)      -> "key": (expression) ? true : false
 *   result["key"] = value;   -> result["key"] = value ? true : false;
 */
function fixBooleanValues(expression, booleanKeys) {
  let fixed = expression;
  let changes = [];

  for (const key of booleanKeys) {
    // Pattern 1: "key": value in return statement (object literal)
    const objectPattern = new RegExp(
      `("${key}"\\s*:\\s*)([^,}\\n]+?)(?=\\s*[,}])`,
      'g'
    );

    fixed = fixed.replace(objectPattern, (match, prefix, value) => {
      const trimmedValue = value.trim();

      if (shouldSkipValue(trimmedValue)) {
        return match;
      }

      // Apply ternary fix
      const newValue = `(${trimmedValue}) ? true : false`;
      changes.push({ key, from: trimmedValue, to: newValue, type: 'object-literal' });
      return `${prefix}${newValue}`;
    });

    // Pattern 2: result["key"] = value; (bracket assignment)
    const bracketPattern = new RegExp(
      `(result\\s*\\[\\s*["']${key}["']\\s*\\]\\s*=\\s*)([^;\\n]+)(\\s*;)`,
      'g'
    );

    fixed = fixed.replace(bracketPattern, (match, prefix, value, suffix) => {
      const trimmedValue = value.trim();

      if (shouldSkipValue(trimmedValue)) {
        return match;
      }

      // Apply ternary fix
      const newValue = `(${trimmedValue}) ? true : false`;
      changes.push({ key, from: trimmedValue, to: newValue, type: 'bracket-assignment' });
      return `${prefix}${newValue}${suffix}`;
    });

    // Pattern 3: result.key = value; (dot assignment)
    const dotPattern = new RegExp(
      `(result\\.${key}\\s*=\\s*)([^;\\n]+)(\\s*;)`,
      'g'
    );

    fixed = fixed.replace(dotPattern, (match, prefix, value, suffix) => {
      const trimmedValue = value.trim();

      if (shouldSkipValue(trimmedValue)) {
        return match;
      }

      // Apply ternary fix
      const newValue = `(${trimmedValue}) ? true : false`;
      changes.push({ key, from: trimmedValue, to: newValue, type: 'dot-assignment' });
      return `${prefix}${newValue}${suffix}`;
    });
  }

  return { fixed, changes };
}

/**
 * Check if a value should be skipped (already correct)
 */
function shouldSkipValue(value) {
  // Skip if already a ternary with true/false at the end
  if (/\?\s*true\s*:\s*false\s*$/.test(value)) {
    return true;
  }

  // Skip if it's a literal true/false
  if (value === 'true' || value === 'false') {
    return true;
  }

  // Skip if it's a string literal
  if (/^["']/.test(value)) {
    return true;
  }

  // Skip if it's a number
  if (/^\d+(\.\d+)?$/.test(value)) {
    return true;
  }

  // Skip if it's null
  if (value === 'null') {
    return true;
  }

  return false;
}

/**
 * Detect boolean values that need fixing
 * (values that are not already using ternary conversion)
 */
function detectBooleanIssues(expression, booleanKeys) {
  const issues = [];

  for (const key of booleanKeys) {
    // Pattern 1: "key": value in object literals
    const objectPattern = new RegExp(`"${key}"\\s*:\\s*([^,}\\n]+?)(?=\\s*[,}])`, 'g');
    let match;

    while ((match = objectPattern.exec(expression)) !== null) {
      const value = match[1].trim();
      if (!shouldSkipValue(value)) {
        issues.push({ pattern: `"${key}": ${value}`, type: 'object-literal' });
      }
    }

    // Pattern 2: result["key"] = value;
    const bracketPattern = new RegExp(`result\\s*\\[\\s*["']${key}["']\\s*\\]\\s*=\\s*([^;\\n]+)\\s*;`, 'g');
    while ((match = bracketPattern.exec(expression)) !== null) {
      const value = match[1].trim();
      if (!shouldSkipValue(value)) {
        issues.push({ pattern: `result["${key}"] = ${value};`, type: 'bracket-assignment' });
      }
    }

    // Pattern 3: result.key = value;
    const dotPattern = new RegExp(`result\\.${key}\\s*=\\s*([^;\\n]+)\\s*;`, 'g');
    while ((match = dotPattern.exec(expression)) !== null) {
      const value = match[1].trim();
      if (!shouldSkipValue(value)) {
        issues.push({ pattern: `result.${key} = ${value};`, type: 'dot-assignment' });
      }
    }
  }

  return issues;
}

async function main() {
  const config = loadConfig();
  const api = new ThingsBoardApi(config);
  await api.login();

  const results = [];
  const dryRun = process.argv.includes('--dry-run');

  if (dryRun) {
    console.log('\n*** DRY RUN MODE - No changes will be made ***\n');
  }

  for (const [name, cfInfo] of Object.entries(CF_IDS)) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Processing: ${name} (${cfInfo.id})`);
    console.log(`Boolean keys: ${cfInfo.keys.join(', ')}`);
    console.log('='.repeat(60));

    try {
      // Fetch CF
      const cf = await api.request('GET', `/api/calculatedField/${cfInfo.id}`);
      console.log(`Fetched: ${cf.name}`);

      const originalExpression = cf.configuration.expression;

      // Detect issues
      const issues = detectBooleanIssues(originalExpression, cfInfo.keys);

      if (issues.length === 0) {
        console.log('\n[OK] No string boolean issues found');

        // Show current boolean assignments for verification
        for (const key of cfInfo.keys) {
          const pattern = new RegExp(`["']?${key}["']?\\s*[=:]\\s*[^,;\\n]+`, 'g');
          const matches = originalExpression.match(pattern);
          if (matches) {
            console.log(`  Current assignments for "${key}":`);
            matches.forEach(m => console.log(`    ${m.trim()}`));
          }
        }

        results.push({ name, id: cfInfo.id, status: 'OK', reason: 'No issues found' });
        continue;
      }

      console.log(`\n[FOUND] ${issues.length} string boolean issue(s):`);
      issues.forEach(i => console.log(`  - ${i.pattern} (${i.type})`));

      // Fix the expression
      const { fixed, changes } = fixBooleanValues(originalExpression, cfInfo.keys);

      console.log('\n--- Changes to make ---');
      changes.forEach(c => {
        console.log(`  "${c.key}": ${c.from} -> ${c.to}`);
      });

      if (dryRun) {
        console.log('\n[DRY RUN] Would update CF');
        results.push({
          name,
          id: cfInfo.id,
          status: 'DRY_RUN',
          changes: changes.length
        });
        continue;
      }

      // Update CF
      cf.configuration.expression = fixed;

      console.log('\n>>> Updating CF...');
      await api.request('POST', '/api/calculatedField', cf);
      console.log('>>> SUCCESS!');

      results.push({
        name,
        id: cfInfo.id,
        status: 'FIXED',
        changes: changes.length
      });

    } catch (err) {
      console.error(`\n[ERROR] ${err.message}`);
      results.push({ name, id: cfInfo.id, status: 'ERROR', reason: err.message });
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
    if (r.changes !== undefined) {
      console.log(`  Changes: ${r.changes}`);
    }
  }

  const okCount = results.filter(r => r.status === 'OK').length;
  const fixedCount = results.filter(r => r.status === 'FIXED').length;
  const dryRunCount = results.filter(r => r.status === 'DRY_RUN').length;
  const errorCount = results.filter(r => r.status === 'ERROR').length;

  console.log(`\nTotal: ${results.length} | OK: ${okCount} | Fixed: ${fixedCount} | DryRun: ${dryRunCount} | Error: ${errorCount}`);

  if (dryRun && (fixedCount > 0 || dryRunCount > 0)) {
    console.log('\n>>> Run without --dry-run to apply changes');
  }
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
