#!/usr/bin/env node
/**
 * Script to create the "derived_power" Calculated Field
 *
 * Output Keys: P_th_calc_kW, P_deviation_pct, P_sensor_flag
 *
 * Usage: node scripts/create-derived-power-cf.js
 */

require('dotenv').config();
const { ThingsBoardApi } = require('../sync/api.js');

const ASSET_PROFILE_ID = 'fe06fd60-5a4c-11ef-9653-5b043856d68a'; // Measurement

const api = new ThingsBoardApi({
  baseUrl: process.env.TB_BASE_URL,
  username: process.env.TB_USERNAME,
  password: process.env.TB_PASSWORD,
});

async function createDerivedPowerCF() {
  // TBEL Code for derived_power
  const tbelCode = `if (calculatePower != true || Vdot_m3h == null || dT_K == null) {
  return {};
}

var result = {};

// Fluid properties (simplified - water only for now)
var cp = 4.18;   // kJ/(kg*K)
var rho = 998;   // kg/m3

// Fluid type specific values
if (fluidType == "glycol20") {
  cp = 3.95; rho = 1032;
} else if (fluidType == "glycol30") {
  cp = 3.74; rho = 1045;
} else if (fluidType == "glycol40") {
  cp = 3.55; rho = 1058;
}

// P = rho * cp * Vdot * dT / 3600
var P_calc = rho * cp * Vdot_m3h * dT_K / 3600;
result["P_th_calc_kW"] = Math.round(P_calc * 1000) / 1000;

// Deviation
if (P_th_kW != null && P_calc > 0.1) {
  var deviation = ((P_th_kW - P_calc) / P_calc) * 100;
  result["P_deviation_pct"] = Math.round(deviation * 10) / 10;

  // Sensor flag
  var absDeviation = deviation < 0 ? -deviation : deviation;
  if (absDeviation < 10) {
    result["P_sensor_flag"] = "ok";
  } else if (absDeviation < 25) {
    result["P_sensor_flag"] = "warn";
  } else {
    result["P_sensor_flag"] = "error";
  }
}

return result;`;

  // Build CF payload
  const cfPayload = {
    name: 'derived_power',
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
        dT_K: {
          refEntityKey: {
            key: 'dT_K',
            type: 'TS_LATEST'
          }
        },
        P_th_kW: {
          refEntityKey: {
            key: 'P_th_kW',
            type: 'TS_LATEST'
          }
        },
        // ATTRIBUTE arguments (SERVER_SCOPE)
        calculatePower: {
          refEntityKey: {
            key: 'calculatePower',
            type: 'ATTRIBUTE',
            scope: 'SERVER_SCOPE'
          },
          defaultValue: 'false'
        },
        fluidType: {
          refEntityKey: {
            key: 'fluidType',
            type: 'ATTRIBUTE',
            scope: 'SERVER_SCOPE'
          },
          defaultValue: 'water'
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

  console.log('\n=== Creating derived_power CF ===\n');
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

    // Create the new CF
    const newCF = await createDerivedPowerCF();

    console.log('\n========================================');
    console.log('SUCCESS! Created CF with ID:', newCF.id?.id || newCF.id);
    console.log('========================================\n');

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
