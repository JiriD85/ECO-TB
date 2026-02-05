#!/usr/bin/env node
/**
 * Script to create the "derived_basic" Calculated Field
 *
 * Usage: node scripts/create-derived-basic-cf.js
 */

require('dotenv').config();
const { ThingsBoardApi } = require('../sync/api.js');

const ASSET_PROFILE_ID = 'fe06fd60-5a4c-11ef-9653-5b043856d68a'; // Measurement
const EXISTING_CF_ID = '30eb6890-0133-11f1-9979-9f3434877bb4'; // oscillation_detection (for reference)

const api = new ThingsBoardApi({
  baseUrl: process.env.TB_BASE_URL,
  username: process.env.TB_USERNAME,
  password: process.env.TB_PASSWORD,
});

async function getExistingCF() {
  console.log('=== Fetching existing CF to understand structure ===\n');
  const cf = await api.request('GET', `/api/calculatedField/${EXISTING_CF_ID}`);
  console.log('Existing CF structure:');
  console.log(JSON.stringify(cf, null, 2));
  return cf;
}

async function createDerivedBasicCF() {
  // TBEL Code for derived_basic
  const tbelCode = `// Guards
if (Vdot_m3h == null) {
  return {};
}

var result = {};

// --- is_on ---
var isOn = Vdot_m3h > flowOnThreshold;
result["is_on"] = isOn;

// --- load_class ---
if (P_th_kW != null && designPower != null && designPower > 0) {
  var loadPct = (P_th_kW / designPower) * 100;
  if (loadPct < 30) {
    result["load_class"] = "low";
  } else if (loadPct < 60) {
    result["load_class"] = "mid";
  } else {
    result["load_class"] = "high";
  }
}

// --- dT_flag ---
if (dT_K != null && designDeltaT != null && designDeltaT > 0 && result["load_class"] != null) {
  var dTRatio = dT_K / designDeltaT;
  if (result["load_class"] == "low") {
    if (dTRatio >= 0.3) {
      result["dT_flag"] = "ok";
    } else if (dTRatio >= 0.15) {
      result["dT_flag"] = "warn";
    } else {
      result["dT_flag"] = "severe";
    }
  } else {
    if (dTRatio >= 0.5) {
      result["dT_flag"] = "ok";
    } else if (dTRatio >= 0.3) {
      result["dT_flag"] = "warn";
    } else {
      result["dT_flag"] = "severe";
    }
  }
}

// --- data_quality ---
var isOutlier = false;
if (T_flow_C != null && (T_flow_C < -50 || T_flow_C > 150)) isOutlier = true;
if (T_return_C != null && (T_return_C < -50 || T_return_C > 150)) isOutlier = true;
if (dT_K != null && (dT_K < -50 || dT_K > 100)) isOutlier = true;
if (Vdot_m3h != null && (Vdot_m3h < 0 || Vdot_m3h > 1000)) isOutlier = true;
if (P_th_kW != null && (P_th_kW < -10000 || P_th_kW > 10000)) isOutlier = true;

result["data_quality"] = isOutlier ? "error" : "ok";

return result;`;

  // Build CF payload - correct structure based on existing CF analysis
  // - type: SCRIPT (for multi-output with TBEL code)
  // - arguments: object with argument names as keys
  // - output: object with type: TIME_SERIES
  // - useLatestTs: true to use latest timestamp for output
  const cfPayload = {
    name: 'derived_basic',
    type: 'SCRIPT',
    configurationVersion: 0,
    debugSettings: null,
    configuration: {
      type: 'SCRIPT',
      arguments: {
        // TS_LATEST arguments (telemetry)
        Vdot_m3h: {
          refEntityKey: {
            key: 'Vdot_m3h',
            type: 'TS_LATEST'
          }
        },
        P_th_kW: {
          refEntityKey: {
            key: 'P_th_kW',
            type: 'TS_LATEST'
          }
        },
        dT_K: {
          refEntityKey: {
            key: 'dT_K',
            type: 'TS_LATEST'
          }
        },
        T_flow_C: {
          refEntityKey: {
            key: 'T_flow_C',
            type: 'TS_LATEST'
          }
        },
        T_return_C: {
          refEntityKey: {
            key: 'T_return_C',
            type: 'TS_LATEST'
          }
        },
        // ATTRIBUTE arguments
        flowOnThreshold: {
          refEntityKey: {
            key: 'flowOnThreshold',
            type: 'ATTRIBUTE',
            scope: 'SERVER_SCOPE'
          },
          defaultValue: '0.05'
        },
        designPower: {
          refEntityKey: {
            key: 'designPower',
            type: 'ATTRIBUTE',
            scope: 'SERVER_SCOPE'
          },
          defaultValue: null
        },
        designDeltaT: {
          refEntityKey: {
            key: 'designDeltaT',
            type: 'ATTRIBUTE',
            scope: 'SERVER_SCOPE'
          },
          defaultValue: null
        }
      },
      expression: tbelCode,
      output: {
        type: 'TIME_SERIES'
      },
      useLatestTs: true
    },
    entityId: {
      entityType: 'ASSET_PROFILE',
      id: ASSET_PROFILE_ID
    }
  };

  console.log('\n=== Creating derived_basic CF ===\n');
  console.log('Payload:');
  console.log(JSON.stringify(cfPayload, null, 2));

  const result = await api.request('POST', '/api/calculatedField', cfPayload);
  console.log('\n=== Result ===\n');
  console.log(JSON.stringify(result, null, 2));
  return result;
}

async function main() {
  try {
    await api.login();

    // Check if we should only show existing CF structure
    if (process.argv.includes('--show-existing')) {
      await getExistingCF();
      return;
    }

    // Create the new CF
    const newCF = await createDerivedBasicCF();

    console.log('\n========================================');
    console.log('SUCCESS! Created CF with ID:', newCF.id?.id || newCF.id);
    console.log('========================================\n');

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
