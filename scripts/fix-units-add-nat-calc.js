#!/usr/bin/env node
/**
 * 1. Fix unit suffixes (CO2 Factor, Primary Energy Factor)
 * 2. Add normOutdoorTempCalculated field next to normOutdoorTemp
 */

const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, '..', 'dashboards', 'measurements.json');
const dashboard = JSON.parse(fs.readFileSync(dashboardPath, 'utf8'));

// Old CO2 suffix -> new (use non-breaking space to prevent wrapping)
const OLD_CO2_SUFFIX = '<span matSuffix>kg CO2/kWh</span>';
const NEW_CO2_SUFFIX = '<span matSuffix>kg&nbsp;CO&#8322;/kWh</span>';

// Old PEF (no suffix) -> add dimensionless indicator
const OLD_PEF_FIELD = '<mat-form-field appearance="fill" class="form-col">\n            <mat-label>Primary Energy Factor</mat-label>\n            <input matInput formControlName="primaryEnergyFactor" type="number" step="0.01">\n          </mat-form-field>';
const NEW_PEF_FIELD = '<mat-form-field appearance="fill" class="form-col">\n            <mat-label>Primary Energy Factor</mat-label>\n            <input matInput formControlName="primaryEnergyFactor" type="number" step="0.01">\n            <span matSuffix>fPE</span>\n          </mat-form-field>';

// Old NAT field (full-width single field)
const OLD_NAT_FIELD = '<mat-form-field appearance="fill" class="w-full">\n          <mat-label>Norm Outdoor Temperature (NAT)</mat-label>\n          <input matInput formControlName="normOutdoorTemp" type="number" step="0.1">\n          <span matSuffix>&deg;C</span>\n        </mat-form-field>';

// New NAT fields (two side-by-side)
const NEW_NAT_FIELDS = '<div class="form-row">\n          <mat-form-field appearance="fill" class="form-col">\n            <mat-label>NAT</mat-label>\n            <input matInput formControlName="normOutdoorTemp" type="number" step="0.1">\n            <span matSuffix>&deg;C</span>\n          </mat-form-field>\n          <mat-form-field appearance="fill" class="form-col disabled-field">\n            <mat-label>NAT (calculated)</mat-label>\n            <input matInput formControlName="normOutdoorTempCalculated" type="number" step="0.1" readonly>\n            <span matSuffix>&deg;C</span>\n          </mat-form-field>\n        </div>';

function fixDialog(name, action, isEdit) {
  console.log('\n=== ' + name + ' ===');
  let html = action.customHtml;
  let fn = action.customFunction;

  // 1. Fix CO2 suffix
  if (html.includes(OLD_CO2_SUFFIX)) {
    html = html.replace(OLD_CO2_SUFFIX, NEW_CO2_SUFFIX);
    console.log('  HTML: Fixed CO2 suffix');
  }

  // 2. Fix PEF field (add suffix)
  if (html.includes(OLD_PEF_FIELD)) {
    html = html.replace(OLD_PEF_FIELD, NEW_PEF_FIELD);
    console.log('  HTML: Added PEF suffix');
  }

  // 3. Replace NAT field with side-by-side layout
  if (html.includes(OLD_NAT_FIELD)) {
    html = html.replace(OLD_NAT_FIELD, NEW_NAT_FIELDS);
    console.log('  HTML: Replaced NAT with side-by-side layout');
  } else {
    console.log('  HTML: NAT pattern not found (may differ)');
  }

  // 4. JS: Add normOutdoorTempCalculated to FormGroup
  if (fn.indexOf('normOutdoorTempCalculated') === -1) {
    if (isEdit) {
      // Edit dialog uses attrMap pattern
      var oldFG = 'normOutdoorTemp: [attrMap.normOutdoorTemp || null]';
      if (fn.includes(oldFG)) {
        fn = fn.replace(oldFG, oldFG + ',\n            normOutdoorTempCalculated: [attrMap.normOutdoorTempCalculated || null]');
        console.log('  JS: Added normOutdoorTempCalculated to FormGroup');
      }
    } else {
      // Add dialogs use simple [null] pattern
      var oldFG2 = 'normOutdoorTemp: [null]';
      if (fn.includes(oldFG2)) {
        fn = fn.replace(oldFG2, oldFG2 + ',\n      normOutdoorTempCalculated: [null]');
        console.log('  JS: Added normOutdoorTempCalculated to FormGroup');
      }
    }
  }

  // 5. JS: Add to getEntityAttributes (Edit only)
  if (isEdit && fn.indexOf("'normOutdoorTempCalculated'") === -1) {
    var oldKeys = "'normOutdoorTemp'";
    if (fn.includes(oldKeys)) {
      fn = fn.replace("'normOutdoorTemp'", "'normOutdoorTemp', 'normOutdoorTempCalculated'");
      console.log('  JS: Added to getEntityAttributes');
    }
  }

  // 6. JS: Add to saving
  if (fn.indexOf("'normOutdoorTempCalculated'") !== -1 && fn.indexOf("key: 'normOutdoorTempCalculated'") === -1) {
    // For Edit dialog - individual if pattern
    if (isEdit) {
      var oldSave = "key: 'normOutdoorTemp', value: formValues.normOutdoorTemp });\n                }";
      if (fn.includes(oldSave)) {
        fn = fn.replace(oldSave, oldSave + "\n                if (formValues.normOutdoorTempCalculated !== null && formValues.normOutdoorTempCalculated !== '') {\n                    attributesArray.push({ key: 'normOutdoorTempCalculated', value: formValues.normOutdoorTempCalculated });\n                }");
        console.log('  JS: Added normOutdoorTempCalculated saving');
      }
    }
  }

  // For headerButton - uses forEach array, add to it
  if (fn.indexOf("'normOutdoorTempCalculated'") === -1) {
    var oldArr = "'normOutdoorTemp',";
    if (fn.includes(oldArr) && fn.includes('.forEach(function(k)')) {
      fn = fn.replace(oldArr, "'normOutdoorTemp', 'normOutdoorTempCalculated',");
      console.log('  JS: Added normOutdoorTempCalculated to save array');
    }
  }

  // For map - individual if pattern
  if (fn.indexOf("key: 'normOutdoorTempCalculated'") === -1 && fn.indexOf('normOutdoorTempCalculated') !== -1) {
    var mapSave = "key: 'normOutdoorTemp', value: formValues.normOutdoorTemp});\n    }";
    if (fn.includes(mapSave)) {
      fn = fn.replace(mapSave, mapSave + "\n    if (formValues.normOutdoorTempCalculated !== null && formValues.normOutdoorTempCalculated !== '') {\n      attributesArray.push({key: 'normOutdoorTempCalculated', value: formValues.normOutdoorTempCalculated});\n    }");
      console.log('  JS: Added normOutdoorTempCalculated saving (map)');
    }
  }

  action.customHtml = html;
  action.customFunction = fn;
  return true;
}

// ============================================================================
// RUN
// ============================================================================
console.log('Fixing units + adding normOutdoorTempCalculated...');

const w = dashboard.configuration.widgets['2ffda43e-cad2-521c-6871-338d15b3b4cc'];

// 1. Edit Project
fixDialog('Edit Project', w.config.actions.actionCellButton[0], true);

// 2. headerButton Add Project
var hb = w.config.actions.headerButton.find(function(b) { return b.name === 'Project'; });
fixDialog('Add Project (headerButton)', hb, false);

// 3. Map Add Project
var mw = dashboard.configuration.widgets['fb583db5-3fc6-275a-34f4-120bfe140af2'];
var mapAction = mw.config.settings.mapActionButtons[1].action;
fixDialog('Add Project (map)', mapAction, false);

// Also fix CO2/PEF in map's customCss if needed (map uses separate CSS)
// No CSS changes needed for suffixes

fs.writeFileSync(dashboardPath, JSON.stringify(dashboard, null, 2), 'utf8');
console.log('\nDashboard updated!');
