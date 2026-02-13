#!/usr/bin/env node
/**
 * Add co2Factor and primaryEnergyFactor fields to Energy Costs section
 * in all three Add/Edit Project dialogs.
 */

const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, '..', 'dashboards', 'measurements.json');
const dashboard = JSON.parse(fs.readFileSync(dashboardPath, 'utf8'));

// New HTML row to insert after demandCharge row in Energy Costs section
const NEW_ROW_HTML = `
        <div class="form-row">
          <mat-form-field appearance="fill" class="form-col">
            <mat-label>CO2 Factor</mat-label>
            <input matInput formControlName="co2Factor" type="number" step="0.001">
            <span matSuffix>kg CO2/kWh</span>
          </mat-form-field>
          <mat-form-field appearance="fill" class="form-col">
            <mat-label>Primary Energy Factor</mat-label>
            <input matInput formControlName="primaryEnergyFactor" type="number" step="0.01">
          </mat-form-field>
        </div>`;

// Pattern: closing of demandCharge form-row (same in all 3 dialogs)
const AFTER_DEMAND_CHARGE_ROW = 'EUR/kW/a</span>\n          </mat-form-field>\n        </div>';

// ============================================================================
// 1. Edit Project
// ============================================================================
function fixEditProject(dashboard) {
  const w = dashboard.configuration.widgets['2ffda43e-cad2-521c-6871-338d15b3b4cc'];
  const action = w.config.actions.actionCellButton[0];
  let html = action.customHtml;
  let fn = action.customFunction;

  console.log('=== Edit Project ===');

  // HTML: Insert new row after demandCharge row
  if (!html.includes('co2Factor')) {
    if (html.includes(AFTER_DEMAND_CHARGE_ROW)) {
      html = html.replace(AFTER_DEMAND_CHARGE_ROW, AFTER_DEMAND_CHARGE_ROW + NEW_ROW_HTML);
      console.log('  HTML: Added co2Factor + primaryEnergyFactor fields');
    } else {
      console.error('  HTML: Pattern not found!');
    }
  } else {
    console.log('  HTML: Fields already present');
  }

  // JS: getEntityAttributes - add keys
  const oldKeys = "'energyPrice', 'demandCharge']";
  if (!fn.includes("'co2Factor'")) {
    if (fn.includes(oldKeys)) {
      fn = fn.replace(oldKeys, "'energyPrice', 'demandCharge', 'co2Factor', 'primaryEnergyFactor']");
      console.log('  JS: Added to getEntityAttributes');
    }
  }

  // JS: FormGroup - add controls
  if (!fn.includes('co2Factor')) {
    const oldFG = "demandCharge: [attrMap.demandCharge || null]";
    if (fn.includes(oldFG)) {
      fn = fn.replace(oldFG, oldFG + ",\n            co2Factor: [attrMap.co2Factor || null],\n            primaryEnergyFactor: [attrMap.primaryEnergyFactor || null]");
      console.log('  JS: Added FormGroup controls');
    }
  }

  // JS: Saving - add individual if blocks (Edit uses this pattern)
  if (!fn.includes("key: 'co2Factor'")) {
    const oldSave = "key: 'demandCharge', value: formValues.demandCharge });\n                }";
    if (fn.includes(oldSave)) {
      fn = fn.replace(oldSave, oldSave + "\n                if (formValues.co2Factor !== null && formValues.co2Factor !== '') {\n                    attributesArray.push({ key: 'co2Factor', value: formValues.co2Factor });\n                }\n                if (formValues.primaryEnergyFactor !== null && formValues.primaryEnergyFactor !== '') {\n                    attributesArray.push({ key: 'primaryEnergyFactor', value: formValues.primaryEnergyFactor });\n                }");
      console.log('  JS: Added attribute saving');
    }
  }

  action.customHtml = html;
  action.customFunction = fn;
  return true;
}

// ============================================================================
// 2. Add Project (headerButton)
// ============================================================================
function fixHeaderButton(dashboard) {
  const w = dashboard.configuration.widgets['2ffda43e-cad2-521c-6871-338d15b3b4cc'];
  const action = w.config.actions.headerButton.find(b => b.name === 'Project');

  console.log('\n=== Add Project (headerButton) ===');
  let html = action.customHtml;
  let fn = action.customFunction;

  // HTML
  if (!html.includes('co2Factor')) {
    if (html.includes(AFTER_DEMAND_CHARGE_ROW)) {
      html = html.replace(AFTER_DEMAND_CHARGE_ROW, AFTER_DEMAND_CHARGE_ROW + NEW_ROW_HTML);
      console.log('  HTML: Added fields');
    } else {
      console.error('  HTML: Pattern not found!');
    }
  }

  // FormGroup
  if (!fn.includes('co2Factor')) {
    const oldFG = "demandCharge: [null]";
    if (fn.includes(oldFG)) {
      fn = fn.replace(oldFG, oldFG + ",\n      co2Factor: [null],\n      primaryEnergyFactor: [null]");
      console.log('  JS: Added FormGroup controls');
    }
  }

  // Saving - headerButton uses forEach pattern
  if (!fn.includes("'co2Factor'")) {
    const oldArr = "'energyPrice', 'demandCharge']";
    if (fn.includes(oldArr)) {
      fn = fn.replace(oldArr, "'energyPrice', 'demandCharge', 'co2Factor', 'primaryEnergyFactor']");
      console.log('  JS: Added to save array');
    }
  }

  action.customHtml = html;
  action.customFunction = fn;
  return true;
}

// ============================================================================
// 3. Add Project (map)
// ============================================================================
function fixMapButton(dashboard) {
  const mw = dashboard.configuration.widgets['fb583db5-3fc6-275a-34f4-120bfe140af2'];
  const mapBtn = mw.config.settings.mapActionButtons[1];
  const action = mapBtn.action;

  console.log('\n=== Add Project (map) ===');
  let html = action.customHtml;
  let fn = action.customFunction;

  // HTML
  if (!html.includes('co2Factor')) {
    if (html.includes(AFTER_DEMAND_CHARGE_ROW)) {
      html = html.replace(AFTER_DEMAND_CHARGE_ROW, AFTER_DEMAND_CHARGE_ROW + NEW_ROW_HTML);
      console.log('  HTML: Added fields');
    } else {
      console.error('  HTML: Pattern not found!');
    }
  }

  // FormGroup
  if (!fn.includes('co2Factor')) {
    const oldFG = "demandCharge: [null]";
    if (fn.includes(oldFG)) {
      fn = fn.replace(oldFG, oldFG + ",\n    co2Factor: [null],\n    primaryEnergyFactor: [null]");
      console.log('  JS: Added FormGroup controls');
    }
  }

  // Saving - map uses individual if blocks
  if (!fn.includes("'co2Factor'")) {
    const oldSave = "key: 'demandCharge', value: formValues.demandCharge});\n    }";
    if (fn.includes(oldSave)) {
      fn = fn.replace(oldSave, oldSave + "\n    if (formValues.co2Factor !== null && formValues.co2Factor !== '') {\n      attributesArray.push({key: 'co2Factor', value: formValues.co2Factor});\n    }\n    if (formValues.primaryEnergyFactor !== null && formValues.primaryEnergyFactor !== '') {\n      attributesArray.push({key: 'primaryEnergyFactor', value: formValues.primaryEnergyFactor});\n    }");
      console.log('  JS: Added attribute saving');
    }
  }

  action.customHtml = html;
  action.customFunction = fn;
  return true;
}

// ============================================================================
// RUN
// ============================================================================
console.log('Adding co2Factor + primaryEnergyFactor to all Project dialogs...\n');

const ok1 = fixEditProject(dashboard);
const ok2 = fixHeaderButton(dashboard);
const ok3 = fixMapButton(dashboard);

console.log('\n---');
console.log('Edit Project:', ok1 ? 'OK' : 'FAILED');
console.log('Add Project (header):', ok2 ? 'OK' : 'FAILED');
console.log('Add Project (map):', ok3 ? 'OK' : 'FAILED');

if (ok1 && ok2 && ok3) {
  fs.writeFileSync(dashboardPath, JSON.stringify(dashboard, null, 2), 'utf8');
  console.log('\nDashboard updated successfully!');
}
