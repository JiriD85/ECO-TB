/**
 * ECO ROI Library
 * Component pricing management for economic analysis
 *
 * Prices are stored as JSON attribute (componentPrices) on the Customer entity.
 *
 * Usage in ThingsBoard Action:
 *   ecoRoi.openComponentPricesDialog(widgetContext, customerId);
 */

export function openComponentPricesDialog(widgetContext, customerId = null) {
  const $injector = widgetContext.$scope.$injector;
  const customDialog = $injector.get(widgetContext.servicesMap.get('customDialog'));
  const attributeService = $injector.get(widgetContext.servicesMap.get('attributeService'));
  const rxjs = widgetContext.rxjs;

  // Customer ID: either passed in (Tenant Admin) or from current user (Customer Admin)
  if (!customerId) {
    customerId = {
      id: widgetContext.currentUser.customerId,
      entityType: 'CUSTOMER'
    };
  } else if (typeof customerId === 'object' && customerId.id && !customerId.entityType) {
    customerId = {
      id: customerId.id,
      entityType: 'CUSTOMER'
    };
  }

  // Load existing prices
  attributeService.getEntityAttributes(customerId, 'SERVER_SCOPE', ['componentPrices']).subscribe(
    function(attributes) {
      const existingPricing = attributes.find(function(a) { return a.key === 'componentPrices'; });
      let existingData = null;
      if (existingPricing && existingPricing.value) {
        try {
          existingData = typeof existingPricing.value === 'string'
            ? JSON.parse(existingPricing.value)
            : existingPricing.value;
        } catch (e) {
          console.error('Failed to parse existing component prices:', e);
        }
      }
      openDialog(existingData);
    },
    function(error) {
      console.error('Failed to load component prices:', error);
      openDialog(null);
    }
  );

  function openDialog(existingData) {
    // HTML Template with embedded CSS (ThingsBoard pattern)
    const htmlTemplate = `<style>
/* ECO Design System - Component Prices Dialog */
.component-prices-dialog .eco-dialog-header,
mat-toolbar.eco-dialog-header {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  padding: 0 16px !important;
  height: 52px !important;
  min-height: 52px !important;
  background-color: #1976d2 !important;
  background: #1976d2 !important;
  color: white !important;
}
.component-prices-dialog .eco-dialog-header .header-icon,
mat-toolbar.eco-dialog-header .header-icon {
  font-size: 22px !important;
  width: 22px !important;
  height: 22px !important;
  color: white !important;
}
.component-prices-dialog .eco-dialog-header .header-title,
mat-toolbar.eco-dialog-header .header-title {
  margin: 0 !important;
  font-size: 17px !important;
  font-weight: 500 !important;
  color: white !important;
  flex: 1 !important;
}
.component-prices-dialog .eco-dialog-header .close-btn,
mat-toolbar.eco-dialog-header .close-btn {
  color: rgba(255,255,255,0.8) !important;
}
.component-prices-dialog .eco-dialog-header .close-btn:hover,
mat-toolbar.eco-dialog-header .close-btn:hover {
  color: white !important;
  background: rgba(255,255,255,0.1) !important;
}
.component-prices-dialog .eco-dialog-header mat-icon,
mat-toolbar.eco-dialog-header mat-icon {
  color: white !important;
}
.component-prices-dialog .dialog-content {
  padding: 16px 20px !important;
  background: #f8fafc !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 12px !important;
  max-height: 70vh !important;
  overflow-y: auto !important;
}
.component-prices-dialog .dialog-footer {
  display: flex !important;
  justify-content: flex-end !important;
  gap: 12px !important;
  padding: 12px 20px !important;
  border-top: 1px solid #e2e8f0 !important;
  background: #fafafa !important;
}
.component-prices-dialog .toolbar-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}
.component-prices-dialog .file-form { flex: 1; min-width: 200px; }
.component-prices-dialog .export-btn { height: 36px !important; }
.component-prices-dialog .import-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 6px;
  border: 1px solid #fecaca;
}
.component-prices-dialog .import-success {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #f0fdf4;
  color: #16a34a;
  border-radius: 6px;
  border: 1px solid #bbf7d0;
}
.component-prices-dialog .table-container {
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}
.component-prices-dialog .pricing-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.component-prices-dialog .pricing-table th {
  background: #f1f5f9;
  padding: 12px 8px;
  text-align: center;
  font-weight: 600;
  font-size: 12px;
  color: #64748b;
  border-bottom: 2px solid #e2e8f0;
  text-transform: uppercase;
}
.component-prices-dialog .pricing-table th.dim-header { text-align: left; padding-left: 14px; width: 90px; }
.component-prices-dialog .pricing-table th.sum-header { background: #ecfdf5; color: #047857; }
.component-prices-dialog .pricing-table td {
  padding: 8px;
  border-bottom: 1px solid #f1f5f9;
  text-align: center;
}
.component-prices-dialog .pricing-table tbody tr:hover { background: #f8fafc; }
.component-prices-dialog .dim-cell {
  font-weight: 600;
  color: #1e293b;
  background: #f8fafc;
  text-align: left !important;
  padding-left: 14px !important;
}
.component-prices-dialog .sum-cell {
  font-weight: 600;
  background: #f0fdf4;
  color: #047857;
  text-align: right !important;
  padding-right: 14px !important;
  font-family: monospace;
}
.component-prices-dialog .pricing-table input[type="number"] {
  width: 80px;
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  text-align: right;
  font-size: 13px;
  font-family: monospace;
}
.component-prices-dialog .pricing-table input[type="number"]:focus {
  border-color: #1976d2;
  outline: none;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
}
</style>
<form [formGroup]="pricingFormGroup" class="component-prices-dialog" style="width: 700px;">
  <mat-toolbar class="eco-dialog-header">
    <mat-icon class="header-icon">euro</mat-icon>
    <h2 class="header-title">Component Prices</h2>
    <button mat-icon-button (click)="cancel()" type="button" class="close-btn">
      <mat-icon>close</mat-icon>
    </button>
  </mat-toolbar>

  <mat-progress-bar color="warn" mode="indeterminate" *ngIf="isLoading"></mat-progress-bar>

  <div class="dialog-content">
    <!-- Import/Export Toolbar -->
    <div class="toolbar-row">
      <form [formGroup]="fileFormGroup" class="file-form">
        <tb-file-input formControlName="importData"
                       label="CSV Import"
                       [allowedExtensions]="'csv,txt'"
                       [accept]="'.csv,application/csv,text/csv,.txt,text/plain'"
                       dropLabel="Drop CSV file here"
                       (ngModelChange)="onCsvFileSelected()">
        </tb-file-input>
      </form>

      <button mat-stroked-button type="button" (click)="exportCsv()" class="export-btn">
        <mat-icon>download</mat-icon> CSV Export
      </button>
    </div>

    <!-- Import Error Message -->
    <div *ngIf="importError" class="import-error">
      <mat-icon>error</mat-icon>
      <span>{{ importError }}</span>
    </div>

    <!-- Import Success Message -->
    <div *ngIf="importSuccess" class="import-success">
      <mat-icon>check_circle</mat-icon>
      <span>{{ importSuccess }}</span>
    </div>

    <!-- Pricing Table -->
    <div class="table-container">
      <table class="pricing-table">
        <thead>
          <tr>
            <th class="dim-header">Dimension</th>
            <th>Valve</th>
            <th>Pump</th>
            <th>Other</th>
            <th>Service</th>
            <th class="sum-header">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let dim of dimensions" [formGroupName]="dim">
            <td class="dim-cell">{{ dim }}</td>
            <td>
              <input type="number" formControlName="valve" min="0" step="0.01" placeholder="0.00">
            </td>
            <td>
              <input type="number" formControlName="pump" min="0" step="0.01" placeholder="0.00">
            </td>
            <td>
              <input type="number" formControlName="other" min="0" step="0.01" placeholder="0.00">
            </td>
            <td>
              <input type="number" formControlName="service" min="0" step="0.01" placeholder="0.00">
            </td>
            <td class="sum-cell">{{ getRowSum(dim) | number:'1.2-2' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="dialog-footer">
    <button mat-button type="button" (click)="cancel()">Cancel</button>
    <button mat-raised-button color="primary" type="button" (click)="save()" [disabled]="isLoading">
      Save
    </button>
  </div>
</form>
`;

    // Dialog Controller
    function ComponentPricesDialogController(instance) {
      var vm = instance;

      vm.dimensions = ['DN15', 'DN20', 'DN25', 'DN32', 'DN40', 'DN50',
                       'DN65', 'DN80', 'DN100', 'DN125', 'DN150', 'DN200'];
      vm.categories = ['valve', 'pump', 'other', 'service'];
      vm.importError = '';
      vm.importSuccess = '';
      vm.isLoading = false;

      // File form for CSV import (tb-file-input pattern)
      vm.fileFormGroup = vm.fb.group({
        importData: [null]
      });

      // Pricing form with all dimensions
      vm.pricingFormGroup = vm.fb.group({});
      vm.dimensions.forEach(function(dim) {
        vm.pricingFormGroup.addControl(dim, vm.fb.group({
          valve: [0],
          pump: [0],
          other: [0],
          service: [0]
        }));
      });

      // Load existing data
      if (existingData) {
        vm.pricingFormGroup.patchValue(existingData);
      }

      // Calculate row sum
      vm.getRowSum = function(dim) {
        var row = vm.pricingFormGroup.get(dim).value;
        return (parseFloat(row.valve) || 0) +
               (parseFloat(row.pump) || 0) +
               (parseFloat(row.other) || 0) +
               (parseFloat(row.service) || 0);
      };

      // CSV Import Handler
      vm.onCsvFileSelected = function() {
        var csvData = vm.fileFormGroup.get('importData').value;
        if (!csvData) return;

        vm.importError = '';
        vm.importSuccess = '';

        var parsed = parseComponentPricesCsv(csvData);
        if (parsed) {
          vm.pricingFormGroup.patchValue(parsed);
          vm.importSuccess = 'CSV imported successfully';
          // Clear file input after successful import
          vm.fileFormGroup.patchValue({ importData: null });
        }
      };

      // CSV Parser
      function parseComponentPricesCsv(csvData) {
        try {
          var lines = csvData.split(/[\r\n]+/).filter(function(line) {
            return line.trim() !== '';
          });

          if (lines.length < 2) {
            vm.importError = 'CSV must have header and at least one data row';
            return null;
          }

          // Auto-detect delimiter
          var firstLine = lines[0];
          var delim = (firstLine.match(/;/g) || []).length >= 4 ? ';' : ',';

          var headers = splitCSV(lines[0], delim).map(function(h) {
            return h.toLowerCase().trim();
          });

          // Validate headers
          var requiredHeaders = ['dimension', 'valve', 'pump', 'other', 'service'];
          var hasAllHeaders = requiredHeaders.every(function(h) {
            return headers.includes(h);
          });

          if (!hasAllHeaders) {
            vm.importError = 'Missing columns: dimension, valve, pump, other, service';
            return null;
          }

          var dimIdx = headers.indexOf('dimension');
          var valveIdx = headers.indexOf('valve');
          var pumpIdx = headers.indexOf('pump');
          var otherIdx = headers.indexOf('other');
          var serviceIdx = headers.indexOf('service');

          var result = {};
          var importedCount = 0;

          for (var i = 1; i < lines.length; i++) {
            var cols = splitCSV(lines[i], delim);
            var dim = cols[dimIdx] ? cols[dimIdx].trim().toUpperCase() : '';

            if (vm.dimensions.includes(dim)) {
              result[dim] = {
                valve: parseNumber(cols[valveIdx]),
                pump: parseNumber(cols[pumpIdx]),
                other: parseNumber(cols[otherIdx]),
                service: parseNumber(cols[serviceIdx])
              };
              importedCount++;
            }
          }

          if (importedCount === 0) {
            vm.importError = 'No valid dimensions found (DN15-DN200)';
            return null;
          }

          return result;
        } catch (e) {
          console.error('CSV parsing error:', e);
          vm.importError = 'Failed to parse CSV file';
          return null;
        }
      }

      function splitCSV(str, sep) {
        var parts = [];
        var current = '';
        var inQuotes = false;

        for (var i = 0; i < str.length; i++) {
          var char = str[i];
          if (char === '"') {
            if (inQuotes && str[i + 1] === '"') {
              current += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === sep && !inQuotes) {
            parts.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        parts.push(current.trim());
        return parts;
      }

      function parseNumber(str) {
        if (!str) return 0;
        var numStr = str.toString().trim().replace(',', '.');
        var num = parseFloat(numStr);
        return isNaN(num) ? 0 : num;
      }

      // CSV Export
      vm.exportCsv = function() {
        var data = vm.pricingFormGroup.value;
        var csv = 'dimension;valve;pump;other;service\n';

        vm.dimensions.forEach(function(dim) {
          var row = data[dim] || { valve: 0, pump: 0, other: 0, service: 0 };
          csv += dim + ';' + row.valve + ';' + row.pump + ';' + row.other + ';' + row.service + '\n';
        });

        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'component_prices.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };

      // Save
      vm.save = function() {
        vm.isLoading = true;
        var pricingData = vm.pricingFormGroup.value;

        attributeService.saveEntityAttributes(customerId, 'SERVER_SCOPE', [
          { key: 'componentPrices', value: JSON.stringify(pricingData) }
        ]).subscribe(
          function() {
            vm.isLoading = false;
            vm.dialogRef.close();
          },
          function(error) {
            vm.isLoading = false;
            console.error('Save failed:', error);
          }
        );
      };

      // Cancel
      vm.cancel = function() {
        vm.dialogRef.close();
      };
    }

    customDialog.customDialog(htmlTemplate, ComponentPricesDialogController).subscribe();
  }
}
