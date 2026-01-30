const fs = require('fs');
const dashboard = JSON.parse(fs.readFileSync('dashboards/administration.json', 'utf8'));

// Fix manage_diagnostickits widget markdownTextFunction
// Widget ID: c6b19443-5057-176b-d3f8-2eebb67fc35e

const widget = dashboard.configuration.widgets['c6b19443-5057-176b-d3f8-2eebb67fc35e'];

const markdownTextFunction = `
// Datasources:
// "Current User" -> user role
// "Customer Diagnostic Kits" -> kits (changed from "All Diagnostic Kits")

var userRole = '';
var kitsTotal = 0, kitsAssigned = 0, kitsAvailable = 0;

data.forEach(function(item) {
  var alias = item.aliasName || '';

  if (alias === 'Current User') {
    // Current User
    userRole = item.role || '';
  } else if (alias === 'Customer Diagnostic Kits') {
    // Changed from "All Diagnostic Kits" to match actual datasource alias
    kitsTotal++;
    if (item.assignedTo && item.assignedTo !== 'None' && item.assignedTo !== '') {
      kitsAssigned++;
    } else {
      kitsAvailable++;
    }
  }
});

var stateParams = ctx.stateController.getStateParams();
var isTenantAdmin = ctx.currentUser.authority === 'TENANT_ADMIN';
var isEcoAdmin = userRole === 'ECO Administrator';
var isAdmin = isTenantAdmin || isEcoAdmin;
stateParams['userRole'] = userRole;
ctx.stateController.updateState(null, stateParams);

// Header HTML with Go Back, Transfer Kit (ECO Admin only), and Add Kit (ECO/Tenant Admin) buttons
var headerHtml = '<div class="manage-header kits">' +
    '<div class="header-left">' +
        '<a id="btn-go-back" class="back-button" role="button" title="Go Back">' +
            '<mat-icon>arrow_back</mat-icon>' +
        '</a>' +
        '<div class="header-title">' +
            '<h1><mat-icon>medical_services</mat-icon>Diagnostic Kits</h1>' +
            '<div class="header-stats">' +
                '<span class="stat-item"><span class="stat-dot total"></span><span class="stat-value">' + kitsTotal + '</span> Total</span>' +
                '<span class="stat-item"><span class="stat-dot assigned"></span><span class="stat-value">' + kitsAssigned + '</span> Assigned</span>' +
                '<span class="stat-item"><span class="stat-dot available"></span><span class="stat-value">' + kitsAvailable + '</span> Available</span>' +
            '</div>' +
        '</div>' +
    '</div>' +
    '<div class="header-right">' +
        (isEcoAdmin ? '<a id="btn-transfer-kit" class="header-action-btn transfer" role="button" title="Transfer Kit"><mat-icon>swap_horiz</mat-icon>Transfer Kit</a>' : '') +
        (isAdmin ? '<a id="btn-add-kit" class="header-action-btn" role="button" title="Add Kit"><mat-icon>add</mat-icon>Add Kit</a>' : '') +
    '</div>' +
'</div>';

// Content - fxFlex directly on tb-dashboard-state
var contentHtml = isAdmin
    ? '<tb-dashboard-state fxFlex [ctx]="ctx" [syncParentStateParams]="true" stateId="manage_diagnostickits_admin"></tb-dashboard-state>'
    : '<tb-dashboard-state fxFlex [ctx]="ctx" [syncParentStateParams]="true" stateId="manage_diagnostickits_admin"></tb-dashboard-state>';

return '<div class="main-layout" style="width: 100%; height: 100%;" fxLayout="column">' +
       headerHtml +
       contentHtml +
       '</div>';
`;

widget.config.settings.markdownTextFunction = markdownTextFunction;
console.log('Fixed markdownTextFunction (uses "Customer Diagnostic Kits" alias)');

fs.writeFileSync('dashboards/administration.json', JSON.stringify(dashboard, null, 2));
console.log('Dashboard saved.');
