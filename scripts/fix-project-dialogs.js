#!/usr/bin/env node
/**
 * Comprehensive fix for ALL Add/Edit Project dialogs in measurements dashboard.
 *
 * Fixes:
 * 1. Edit Project (actionCellButton) - CSS fixes, add normOutdoorTemp to Address
 * 2. Add Project "Project" (headerButton) - add HDD/Energy sections + FormGroup + saving
 * 3. Add Project map (mapActionButtons) - CSS consistency
 *
 * CSS improvements:
 * - Add missing .w-full utility class
 * - Fix section-card overflow: hidden -> visible
 * - Ensure .section-body form fields expand properly
 * - Add mat-form-field width enforcement
 * - Fix max-height to use calc(90vh - 130px) to prevent cutoff
 */

const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, '..', 'dashboards', 'measurements.json');
const dashboard = JSON.parse(fs.readFileSync(dashboardPath, 'utf8'));

// ============================================================================
// Unified CSS for customPretty dialogs (embedded in <style> tag)
// ============================================================================
const DIALOG_CSS = `
/* ECO DESIGN SYSTEM - Project Dialog Styles */

/* Header */
.edit-project-form .eco-dialog-header,
.add-entity-form .eco-dialog-header,
mat-toolbar.eco-dialog-header {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  padding: 0 16px !important;
  height: 56px !important;
  min-height: 56px !important;
  background-color: var(--tb-primary-500) !important;
  background: var(--tb-primary-500) !important;
  color: white !important;
  font-family: "Roboto", "Helvetica Neue", sans-serif !important;
}
.edit-project-form .eco-dialog-header .header-icon,
.add-entity-form .eco-dialog-header .header-icon,
mat-toolbar.eco-dialog-header .header-icon {
  font-size: 24px !important;
  width: 24px !important;
  height: 24px !important;
  color: white !important;
}
.edit-project-form .eco-dialog-header .header-title,
.add-entity-form .eco-dialog-header .header-title,
mat-toolbar.eco-dialog-header .header-title {
  margin: 0 !important;
  font-size: 1.125rem !important;
  font-weight: 500 !important;
  letter-spacing: -0.01em !important;
  color: white !important;
  flex: 1 !important;
}
.edit-project-form .eco-dialog-header .close-btn,
.add-entity-form .eco-dialog-header .close-btn,
mat-toolbar.eco-dialog-header .close-btn {
  color: rgba(255,255,255,0.8) !important;
  margin-left: auto !important;
  transition: all 0.2s ease !important;
}
.edit-project-form .eco-dialog-header .close-btn:hover,
.add-entity-form .eco-dialog-header .close-btn:hover,
mat-toolbar.eco-dialog-header .close-btn:hover {
  color: white !important;
  background: rgba(255,255,255,0.1) !important;
}
.edit-project-form .eco-dialog-header mat-icon,
.add-entity-form .eco-dialog-header mat-icon,
mat-toolbar.eco-dialog-header mat-icon {
  color: white !important;
}

/* Content Area */
.edit-project-form .dialog-content,
.add-entity-form .dialog-content {
  padding: 1rem 1.25rem !important;
  background: #f8fafc !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 0.75rem !important;
  max-height: calc(90vh - 130px) !important;
  overflow-y: auto !important;
  font-family: "Roboto", "Helvetica Neue", sans-serif !important;
}

/* Section Cards */
.edit-project-form .section-card,
.add-entity-form .section-card {
  background: white !important;
  border: 1px solid #e2e8f0 !important;
  border-left: 3px solid #1976d2 !important;
  border-radius: 0 !important;
  overflow: visible !important;
}
.edit-project-form .section-header,
.add-entity-form .section-header {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  padding: 10px 14px !important;
  background: #f8fafc !important;
  border-bottom: 1px solid #e2e8f0 !important;
  font-weight: 600 !important;
  font-size: 0.75rem !important;
  color: #334155 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.3px !important;
}
.edit-project-form .section-header mat-icon,
.add-entity-form .section-header mat-icon {
  font-size: 16px !important;
  width: 16px !important;
  height: 16px !important;
  color: #1976d2 !important;
}
.edit-project-form .section-body,
.add-entity-form .section-body {
  padding: 12px 14px !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 4px !important;
}

/* Form field width enforcement */
.edit-project-form .section-body mat-form-field,
.add-entity-form .section-body mat-form-field {
  width: 100% !important;
}
.edit-project-form .section-body .mat-mdc-form-field-subscript-wrapper,
.add-entity-form .section-body .mat-mdc-form-field-subscript-wrapper {
  margin-bottom: -4px !important;
}

/* Footer */
.edit-project-form .dialog-footer,
.add-entity-form .dialog-footer {
  display: flex !important;
  justify-content: flex-end !important;
  align-items: center !important;
  gap: 12px !important;
  padding: 0.75rem 1.25rem !important;
  border-top: 1px solid rgba(0, 0, 0, 0.06) !important;
  background: #fafafa !important;
}

/* Form field input styles */
.add-entity-form .mdc-text-field--filled,
.edit-project-form .mdc-text-field--filled {
  background-color: #F4F9FE !important;
}
.add-entity-form .mdc-text-field--filled.mdc-text-field--disabled,
.edit-project-form .mdc-text-field--filled.mdc-text-field--disabled {
  background-color: rgba(244, 249, 254, 0.5) !important;
}
.add-entity-form .disabled-field input,
.edit-project-form .disabled-field input {
  color: rgba(0, 0, 0, 0.6) !important;
}

/* Image input compact */
.edit-project-form tb-image-input .tb-image-input-container,
.add-entity-form tb-image-input .tb-image-input-container {
  min-height: 50px !important;
  max-height: 50px !important;
}
.edit-project-form tb-image-input .dropzone,
.add-entity-form tb-image-input .dropzone {
  min-height: 42px !important;
  padding: 4px 8px !important;
  flex-direction: row !important;
  gap: 8px !important;
}
.edit-project-form tb-image-input .dropzone mat-icon,
.add-entity-form tb-image-input .dropzone mat-icon {
  font-size: 18px !important;
  width: 18px !important;
  height: 18px !important;
}
.edit-project-form tb-image-input .dropzone span,
.add-entity-form tb-image-input .dropzone span {
  font-size: 11px !important;
}

/* Utility classes */
.flex-1 { flex: 1 !important; }
.w-full { width: 100% !important; }
.form-row {
  display: flex !important;
  gap: 12px !important;
}
.form-col {
  flex: 1 !important;
  min-width: 0 !important;
}

/* Dialog container reset */
.mat-mdc-dialog-container,
.mat-mdc-dialog-surface,
.mdc-dialog__surface {
  border-radius: 0 !important;
}
`;

// ============================================================================
// HDD + Energy HTML sections
// ============================================================================
const HDD_ENERGY_HTML = `
    <!-- HDD Settings Section -->
    <div class="section-card">
      <div class="section-header">
        <mat-icon>thermostat</mat-icon>
        <span>HDD Settings</span>
      </div>
      <div class="section-body">
        <div class="form-row">
          <mat-form-field appearance="fill" class="form-col">
            <mat-label>Heating Limit</mat-label>
            <input matInput formControlName="hddHeatingLimit" type="number" step="0.5">
            <span matSuffix>&deg;C</span>
          </mat-form-field>
          <mat-form-field appearance="fill" class="form-col">
            <mat-label>Indoor Temperature</mat-label>
            <input matInput formControlName="hddIndoorTemp" type="number" step="0.5">
            <span matSuffix>&deg;C</span>
          </mat-form-field>
        </div>
        <mat-form-field appearance="fill" class="w-full">
          <mat-label>Reference HDD (Kd/a)</mat-label>
          <input matInput formControlName="hddReference" type="number" step="1">
          <span matSuffix>Kd/a</span>
        </mat-form-field>
      </div>
    </div>

    <!-- Energy Costs Section -->
    <div class="section-card">
      <div class="section-header">
        <mat-icon>payments</mat-icon>
        <span>Energy Costs</span>
      </div>
      <div class="section-body">
        <div class="form-row">
          <mat-form-field appearance="fill" class="form-col">
            <mat-label>Energy Price</mat-label>
            <input matInput formControlName="energyPrice" type="number" step="0.01">
            <span matSuffix>EUR/kWh</span>
          </mat-form-field>
          <mat-form-field appearance="fill" class="form-col">
            <mat-label>Demand Charge</mat-label>
            <input matInput formControlName="demandCharge" type="number" step="0.01">
            <span matSuffix>EUR/kW/a</span>
          </mat-form-field>
        </div>
      </div>
    </div>`;

const NAT_FIELD_HTML = `
        <mat-form-field appearance="fill" class="w-full">
          <mat-label>Norm Outdoor Temperature (NAT)</mat-label>
          <input matInput formControlName="normOutdoorTemp" type="number" step="0.1">
          <span matSuffix>&deg;C</span>
        </mat-form-field>`;

// ============================================================================
// Helper: Insert text after the closing </div> of the form-row containing longitude
// ============================================================================
function insertAfterLongitudeRow(html, textToInsert) {
  const lonIdx = html.indexOf('formControlName="longitude"');
  if (lonIdx === -1) return { html, ok: false };

  // Find the </mat-form-field> after longitude
  const afterLon = html.substring(lonIdx);
  const matFieldEnd = afterLon.indexOf('</mat-form-field>');
  if (matFieldEnd === -1) return { html, ok: false };

  // Find the </div> closing the form-row after the mat-form-field
  const afterField = afterLon.substring(matFieldEnd);
  const formRowEnd = afterField.indexOf('</div>');
  if (formRowEnd === -1) return { html, ok: false };

  const insertPoint = lonIdx + matFieldEnd + formRowEnd + '</div>'.length;
  return {
    html: html.substring(0, insertPoint) + textToInsert + html.substring(insertPoint),
    ok: true
  };
}

// ============================================================================
// 1. Fix EDIT PROJECT dialog
// ============================================================================
function fixEditProject(dashboard) {
  const w = dashboard.configuration.widgets['2ffda43e-cad2-521c-6871-338d15b3b4cc'];
  if (!w) { console.error('Widget not found!'); return false; }

  const action = w.config.actions.actionCellButton[0];
  if (!action || action.name !== 'Edit Project') {
    console.error('Edit Project action not found!');
    return false;
  }

  console.log('=== Fixing Edit Project ===');
  let html = action.customHtml;
  let fn = action.customFunction;

  // 1. Replace CSS
  if (html.includes('<style>')) {
    html = html.replace(/<style>[\s\S]*?<\/style>/, '<style>' + DIALOG_CSS + '</style>');
  } else {
    html = '<style>' + DIALOG_CSS + '</style>\n' + html;
  }
  console.log('  CSS: Updated');

  // 2. Add NAT field if missing
  if (!html.includes('normOutdoorTemp')) {
    const result = insertAfterLongitudeRow(html, NAT_FIELD_HTML);
    if (result.ok) {
      html = result.html;
      console.log('  HTML: Added NAT field');
    } else {
      console.error('  HTML: Could not insert NAT field');
    }
  } else {
    console.log('  HTML: NAT field present');
  }

  // 3. Add HDD/Energy sections if missing
  if (!html.includes('HDD Settings')) {
    const statusIdx = html.indexOf('<!-- Status Section -->');
    if (statusIdx > -1) {
      html = html.substring(0, statusIdx) + HDD_ENERGY_HTML + '\n\n    ' + html.substring(statusIdx);
      console.log('  HTML: Added HDD/Energy sections');
    }
  } else {
    console.log('  HTML: HDD/Energy present');
  }

  // 4. Fix JS - getEntityAttributes keys
  const oldKeys = "['latitude', 'longitude', 'address', 'postalCode', 'city', 'projectPicture', 'progress', 'startTimeMs', 'endTimeMs']";
  if (fn.includes(oldKeys)) {
    fn = fn.replace(oldKeys,
      "['latitude', 'longitude', 'address', 'postalCode', 'city', 'projectPicture', 'progress', 'startTimeMs', 'endTimeMs', 'normOutdoorTemp', 'hddHeatingLimit', 'hddIndoorTemp', 'hddReference', 'energyPrice', 'demandCharge']");
    console.log('  JS: Added attribute keys');
  } else if (fn.includes('hddHeatingLimit')) {
    console.log('  JS: Attribute keys present');
  }

  // 5. Fix JS - FormGroup (idempotent: check hddHeatingLimit first)
  if (!fn.includes('hddHeatingLimit')) {
    const oldFG = "latitude: [attrMap.latitude || ''],\n            longitude: [attrMap.longitude || '']";
    if (fn.includes(oldFG)) {
      fn = fn.replace(oldFG,
        "latitude: [attrMap.latitude || ''],\n            longitude: [attrMap.longitude || ''],\n            normOutdoorTemp: [attrMap.normOutdoorTemp || null],\n            hddHeatingLimit: [attrMap.hddHeatingLimit !== undefined ? attrMap.hddHeatingLimit : 12],\n            hddIndoorTemp: [attrMap.hddIndoorTemp !== undefined ? attrMap.hddIndoorTemp : 20],\n            hddReference: [attrMap.hddReference || null],\n            energyPrice: [attrMap.energyPrice || null],\n            demandCharge: [attrMap.demandCharge || null]");
      console.log('  JS: Added FormGroup controls');
    }
  } else {
    console.log('  JS: FormGroup present');
  }

  // 6. Fix JS - attribute saving
  if (!fn.includes("key: 'hddHeatingLimit'")) {
    const oldSave = "if (formValues.projectPicture) {\n                    attributesArray.push({ key: 'projectPicture', value: formValues.projectPicture });\n                }\n\n                attributeService.saveEntityAttributes";
    const newSave = `if (formValues.projectPicture) {
                    attributesArray.push({ key: 'projectPicture', value: formValues.projectPicture });
                }

                // NAT + HDD + Energy attributes
                var extraKeys = ['normOutdoorTemp', 'hddHeatingLimit', 'hddIndoorTemp', 'hddReference', 'energyPrice', 'demandCharge'];
                extraKeys.forEach(function(k) {
                    if (formValues[k] !== null && formValues[k] !== '' && formValues[k] !== undefined) {
                        attributesArray.push({ key: k, value: formValues[k] });
                    }
                });

                attributeService.saveEntityAttributes`;
    if (fn.includes(oldSave)) {
      fn = fn.replace(oldSave, newSave);
      console.log('  JS: Added attribute saving');
    }
  } else {
    console.log('  JS: Attribute saving present');
  }

  action.customHtml = html;
  action.customFunction = fn;
  return true;
}

// ============================================================================
// 2. Fix ADD PROJECT (headerButton "Project")
// ============================================================================
function fixAddProjectHeader(dashboard) {
  const w = dashboard.configuration.widgets['2ffda43e-cad2-521c-6871-338d15b3b4cc'];
  if (!w) return false;

  const action = w.config.actions.headerButton.find(b => b.name === 'Project' && b.type === 'customPretty');
  if (!action) { console.error('headerButton "Project" not found!'); return false; }

  console.log('\n=== Fixing Add Project (headerButton) ===');
  let html = action.customHtml;
  let fn = action.customFunction;

  // 1. Replace CSS
  if (html.includes('<style>')) {
    html = html.replace(/<style>[\s\S]*?<\/style>/, '<style>' + DIALOG_CSS + '</style>');
  } else {
    html = '<style>' + DIALOG_CSS + '</style>\n' + html;
  }
  console.log('  CSS: Updated');

  // 2. Add NAT field if missing
  if (!html.includes('normOutdoorTemp')) {
    const result = insertAfterLongitudeRow(html, NAT_FIELD_HTML);
    if (result.ok) {
      html = result.html;
      console.log('  HTML: Added NAT field');
    }
  }

  // 3. Add HDD/Energy sections if missing
  if (!html.includes('HDD Settings')) {
    // Find the actual HTML <div class="dialog-footer"> (not the CSS reference)
    const footerDiv = '</div>\n\n  <div class="dialog-footer">';
    const footerIdx = html.indexOf(footerDiv);
    if (footerIdx > -1) {
      // Insert before closing dialog-content div: section-cards go inside dialog-content
      // Structure: ...section-card...</div>(dialog-content close)\n\n  <div class="dialog-footer">
      // We want to insert BEFORE the </div> that closes dialog-content
      html = html.substring(0, footerIdx) + '\n' + HDD_ENERGY_HTML + '\n  ' + html.substring(footerIdx);
      console.log('  HTML: Added HDD/Energy sections');
    } else {
      console.error('  HTML: Could not find footer boundary!');
      // Debug
      const divFoot = html.indexOf('<div class="dialog-footer"');
      console.log('  HTML DEBUG: div.dialog-footer at:', divFoot);
      if (divFoot > -1) {
        console.log('  HTML DEBUG context:', JSON.stringify(html.substring(divFoot - 30, divFoot)));
      }
    }
  }

  // 4. Fix JS - FormGroup (6-space indent in this dialog)
  if (!fn.includes('hddHeatingLimit')) {
    const oldFG = "latitude: [''],\n      longitude: ['']";
    if (fn.includes(oldFG)) {
      fn = fn.replace(oldFG,
        "latitude: [''],\n      longitude: [''],\n      normOutdoorTemp: [null],\n      hddHeatingLimit: [12],\n      hddIndoorTemp: [20],\n      hddReference: [null],\n      energyPrice: [null],\n      demandCharge: [null]");
      console.log('  JS: Added FormGroup controls');
    } else {
      console.error('  JS: FormGroup pattern not matched');
      const latIdx = fn.indexOf("latitude:");
      if (latIdx > -1) {
        console.log('  JS DEBUG FormGroup:', JSON.stringify(fn.substring(latIdx, latIdx + 100)));
      }
    }
  }

  // 5. Fix JS - attribute saving (uses vm.addProjectFormGroup.value and return pattern)
  if (!fn.includes("'hddHeatingLimit'")) {
    const oldSave = "value: vm.addProjectFormGroup.value.projectPicture\n        });\n    }\n    return attributeService.saveEntityAttributes";
    if (fn.includes(oldSave)) {
      fn = fn.replace(oldSave,
        `value: vm.addProjectFormGroup.value.projectPicture
        });
    }

    // NAT + HDD + Energy attributes
    var formVals = vm.addProjectFormGroup.value;
    ['normOutdoorTemp', 'hddHeatingLimit', 'hddIndoorTemp', 'hddReference', 'energyPrice', 'demandCharge'].forEach(function(k) {
      if (formVals[k] !== null && formVals[k] !== '' && formVals[k] !== undefined) {
        attributesArray.push({key: k, value: formVals[k]});
      }
    });

    return attributeService.saveEntityAttributes`);
      console.log('  JS: Added attribute saving');
    } else {
      console.error('  JS: Save pattern not matched');
      const ppIdx = fn.indexOf("key: 'projectPicture'");
      if (ppIdx > -1) {
        console.log('  JS DEBUG Save:', JSON.stringify(fn.substring(ppIdx, ppIdx + 200)));
      }
    }
  }

  action.customHtml = html;
  action.customFunction = fn;
  return true;
}

// ============================================================================
// 3. Fix ADD PROJECT (map - mapActionButtons)
// ============================================================================
function fixAddProjectMap(dashboard) {
  const w = dashboard.configuration.widgets['fb583db5-3fc6-275a-34f4-120bfe140af2'];
  if (!w) { console.error('Map widget not found!'); return false; }

  const mapBtn = w.config.settings.mapActionButtons[1];
  if (!mapBtn || mapBtn.label !== 'Add Project') {
    console.error('Add Project map button not found!');
    return false;
  }

  console.log('\n=== Fixing Add Project (map) ===');
  const action = mapBtn.action;
  let html = action.customHtml;
  let fn = action.customFunction;

  // 1. Update customCss (map actions use separate CSS field)
  action.customCss = `/* ECO Design System - Project Dialog */
.eco-dialog-header {
  display: flex; align-items: center; gap: 12px;
  padding: 0 16px; height: 56px; min-height: 56px;
  background-color: var(--tb-primary-500); color: white;
  font-family: "Roboto", "Helvetica Neue", sans-serif;
}
.eco-dialog-header .header-icon { font-size: 24px; width: 24px; height: 24px; }
.eco-dialog-header .header-title { margin: 0; font-size: 1.125rem; font-weight: 500; letter-spacing: -0.01em; }
.eco-dialog-header .close-btn { color: rgba(255,255,255,0.8) !important; margin-left: auto; }
.eco-dialog-header .close-btn:hover { color: white !important; background: rgba(255,255,255,0.1) !important; }
.dialog-content {
  padding: 1rem 1.25rem !important; background: #f8fafc !important;
  display: flex; flex-direction: column; gap: 0.75rem;
  max-height: calc(90vh - 130px); overflow-y: auto;
  font-family: "Roboto", "Helvetica Neue", sans-serif;
}
.section-card { background: white; border: 1px solid #e2e8f0; border-left: 3px solid var(--tb-primary-500); overflow: visible; }
.section-header { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-weight: 600; font-size: 0.75rem; color: #334155; text-transform: uppercase; letter-spacing: 0.3px; }
.section-header mat-icon { font-size: 16px; width: 16px; height: 16px; color: var(--tb-primary-500); }
.section-body { padding: 12px 14px; display: flex; flex-direction: column; gap: 4px; }
.section-body mat-form-field { width: 100%; }
.section-body .mat-mdc-form-field-subscript-wrapper { margin-bottom: -4px; }
.dialog-footer { display: flex; justify-content: flex-end; align-items: center; gap: 12px; padding: 0.75rem 1.25rem; border-top: 1px solid rgba(0,0,0,0.06); background: #fafafa; }
.flex-1 { flex: 1; }
.w-full { width: 100%; }
.form-row { display: flex; gap: 12px; }
.form-col { flex: 1; min-width: 0; }
.mdc-text-field--filled:not(.mdc-text-field--disabled) { background-color: #F4F9FE !important; }
.mat-mdc-form-field-focus-overlay { background-color: #F4F9FE !important; }
.mdc-text-field--filled.mdc-text-field--disabled { background-color: rgba(244,249,254,0.5) !important; }
.disabled-field input { color: rgba(0,0,0,0.6) !important; }
tb-image-input .tb-image-input-container { min-height: 50px !important; max-height: 50px !important; }
tb-image-input .dropzone { min-height: 42px !important; padding: 4px 8px !important; flex-direction: row !important; gap: 8px !important; }
tb-image-input .dropzone mat-icon { font-size: 18px !important; width: 18px !important; height: 18px !important; }
tb-image-input .dropzone span { font-size: 11px !important; }
.mat-mdc-dialog-container, .mat-mdc-dialog-surface, .mdc-dialog__surface { border-radius: 0 !important; }`;
  console.log('  CSS: Updated');

  // 2. Add NAT field if missing
  if (!html.includes('normOutdoorTemp')) {
    const result = insertAfterLongitudeRow(html, NAT_FIELD_HTML);
    if (result.ok) {
      html = result.html;
      console.log('  HTML: Added NAT field');
    }
  } else {
    console.log('  HTML: NAT present');
  }

  // 3. HDD/Energy sections check
  if (html.includes('HDD Settings')) {
    console.log('  HTML: HDD/Energy present');
  }

  // 4. Add normOutdoorTemp to FormGroup if missing
  if (!fn.includes('normOutdoorTemp')) {
    const lonFG = fn.indexOf('longitude: [addressData');
    if (lonFG > -1) {
      const lonEnd = fn.indexOf('],', lonFG);
      if (lonEnd > -1) {
        const insertAt = lonEnd + '],'.length;
        fn = fn.substring(0, insertAt) + '\n    normOutdoorTemp: [null],' + fn.substring(insertAt);
        console.log('  JS: Added normOutdoorTemp to FormGroup');
      }
    }
  }

  action.customHtml = html;
  action.customFunction = fn;
  return true;
}

// ============================================================================
// RUN
// ============================================================================
console.log('Fixing all Project dialogs...\n');

const ok1 = fixEditProject(dashboard);
const ok2 = fixAddProjectHeader(dashboard);
const ok3 = fixAddProjectMap(dashboard);

console.log('\n---');
console.log('Edit Project:', ok1 ? 'OK' : 'FAILED');
console.log('Add Project (header):', ok2 ? 'OK' : 'FAILED');
console.log('Add Project (map):', ok3 ? 'OK' : 'FAILED');

if (ok1 && ok2 && ok3) {
  fs.writeFileSync(dashboardPath, JSON.stringify(dashboard, null, 2), 'utf8');
  console.log('\nDashboard updated successfully!');
} else {
  fs.writeFileSync(dashboardPath, JSON.stringify(dashboard, null, 2), 'utf8');
  console.log('\nDashboard written with partial fixes.');
}
