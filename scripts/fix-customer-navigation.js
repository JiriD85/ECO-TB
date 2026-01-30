const fs = require('fs');
const dashboard = JSON.parse(fs.readFileSync('dashboards/administration.json', 'utf8'));

// === Fix 1: Update btn-manage-projects action in customer_administration widget ===
// Widget ID: 2131ced7-032b-7d7f-1c04-917bd7a89699 (customer_administration tile cards)

const customerAdminWidget = dashboard.configuration.widgets['2131ced7-032b-7d7f-1c04-917bd7a89699'];

// Find and update the btn-manage-projects action
const manageProjectsAction = customerAdminWidget.config.actions.elementClick.find(a => a.name === 'btn-manage-projects');
if (manageProjectsAction) {
  // Change from openDashboardState to custom function that passes customer info
  manageProjectsAction.type = 'custom';
  manageProjectsAction.customFunction = `
// Get current user info
const currentUser = widgetContext.currentUser;
const customerId = currentUser.customerId;

// Build stateParams with customer info
const params = widgetContext.stateController.getStateParams();
params.entityId = { id: customerId, entityType: 'CUSTOMER' };
params.entityName = currentUser.customerTitle || '';
params.entityLabel = currentUser.customerTitle || '';

// Open manage_projects state with customer context
widgetContext.stateController.openState('manage_projects', params);
`;
  // Remove openDashboardState-specific properties
  delete manageProjectsAction.targetDashboardStateId;
  delete manageProjectsAction.setEntityId;
  delete manageProjectsAction.stateEntityParamName;
  delete manageProjectsAction.openRightLayout;

  console.log('Fixed btn-manage-projects action (passes customer info)');
} else {
  console.log('Warning: btn-manage-projects action not found');
}

// === Fix 2: Update markdownTextFunction in manage_projects widget ===
// Widget ID: f5be3f90-8574-86fb-1e71-7381ecb6956d

const manageProjectsWidget = dashboard.configuration.widgets['f5be3f90-8574-86fb-1e71-7381ecb6956d'];

const markdownTextFunction = `
// Check if project is selected
var stateParams = ctx.stateController.getStateParams();
var selectedProject = stateParams.selectedProject;
var projectState = selectedProject ? true : false;

ctx.stateController.updateState(null, stateParams);

// Get project info directly from stateParams (not from datasource!)
var selectedProjectName = '';
var selectedProjectLabel = '';
if (selectedProject) {
  selectedProjectName = selectedProject.entityName || '';
  selectedProjectLabel = selectedProject.entityLabel || '';
}

// Datasources:
// "Current User" -> role, customer
// "Project" -> projectProgress (all projects from state entity)
// "Selected Project" -> selectedProgress
// "Project Measurements" -> measurementProgress

var userRole = '';
var customerName = '';
var projectsTotal = 0, projectsPlanned = 0, projectsActive = 0, projectsFinished = 0, projectsAborted = 0;
var selectedProgress = '';
var measurementsTotal = 0;

data.forEach(function(item) {
  var alias = item.aliasName || '';

  if (alias === 'Current User') {
    userRole = item.role || '';
    customerName = item.customer || '';
  } else if (alias === 'Project') {
    // Changed from "All Projects" to "Project" to match actual datasource alias
    projectsTotal++;
    var progress = (item.projectProgress || '').toLowerCase();
    if (progress === 'in preparation' || progress === 'planned') {
      projectsPlanned++;
    } else if (progress === 'active') {
      projectsActive++;
    } else if (progress === 'finished') {
      projectsFinished++;
    } else if (progress === 'aborted') {
      projectsAborted++;
    }
  } else if (alias === 'Selected Project') {
    selectedProgress = item.selectedProgress || 'in preparation';
  } else if (alias === 'Project Measurements') {
    measurementsTotal++;
  }
});

var isTenantAdmin = ctx.currentUser.authority === 'TENANT_ADMIN';
var isEcoAdmin = userRole === 'ECO Administrator';
var isRestrictedUser = userRole === 'Belimo Retrofit Users' || userRole === 'ECO Diagnostics Users' || userRole === 'Users' || userRole === 'User';
var canManage = isTenantAdmin || isEcoAdmin || !isRestrictedUser;
stateParams['userRole'] = userRole;
ctx.stateController.updateState(null, stateParams);

var headerHtml = '';
var contentHtml = '';

if (projectState) {
  // === PROJECT DETAIL VIEW ===
  var progressClass = (selectedProgress || 'in-preparation').toLowerCase().replace(' ', '-');
  var progressLabel = selectedProgress || 'In Preparation';
  if (progressLabel.toLowerCase() === 'in preparation') progressLabel = 'In Preparation';

  // Title: entityName - entityLabel (or just entityName if no label)
  var titleText = selectedProjectLabel ? (selectedProjectName + ' - ' + selectedProjectLabel) : selectedProjectName;

  headerHtml = '<div class="manage-header projects">' +
      '<div class="header-left">' +
          '<a id="btn-go-back" class="back-button" role="button" title="Go Back">' +
              '<mat-icon>arrow_back</mat-icon>' +
          '</a>' +
          '<div class="header-title">' +
              '<h1><mat-icon>folder_open</mat-icon>' + titleText + '</h1>' +
              '<div class="header-stats">' +
                  '<span class="stat-item"><span class="stat-dot ' + progressClass + '"></span>' + progressLabel + '</span>' +
                  '<span class="stat-item"><span class="stat-value">' + measurementsTotal + '</span> Measurements</span>' +
              '</div>' +
          '</div>' +
      '</div>' +
      '<div class="header-right">' +
          (canManage ? '<a id="btn-add-measurement" class="header-action-btn" role="button" title="Add Measurement"><mat-icon>add</mat-icon>Add Measurement</a>' : '') +
          (canManage ? '<a id="btn-project-wizard" class="header-action-btn wizard" role="button" title="Project Wizard"><mat-icon>rocket_launch</mat-icon>Project Wizard</a>' : '') +
      '</div>' +
  '</div>';

  contentHtml = '<tb-dashboard-state fxFlex [ctx]="ctx" [syncParentStateParams]="true" stateId="project_measurements"></tb-dashboard-state>';

} else {
  // === PROJECT LIST VIEW ===
  headerHtml = '<div class="manage-header projects">' +
      '<div class="header-left">' +
          '<a id="btn-go-back" class="back-button" role="button" title="Go Back">' +
              '<mat-icon>arrow_back</mat-icon>' +
          '</a>' +
          '<div class="header-title">' +
              '<h1><mat-icon>folder_open</mat-icon>Projects</h1>' +
              '<div class="header-stats">' +
                  '<span class="stat-item"><span class="stat-dot total"></span><span class="stat-value">' + projectsTotal + '</span> Total</span>' +
                  '<span class="stat-item"><span class="stat-dot planned"></span><span class="stat-value">' + projectsPlanned + '</span> Planned</span>' +
                  '<span class="stat-item"><span class="stat-dot active"></span><span class="stat-value">' + projectsActive + '</span> Active</span>' +
                  '<span class="stat-item"><span class="stat-dot finished"></span><span class="stat-value">' + projectsFinished + '</span> Finished</span>' +
                  '<span class="stat-item"><span class="stat-dot aborted"></span><span class="stat-value">' + projectsAborted + '</span> Aborted</span>' +
              '</div>' +
          '</div>' +
      '</div>' +
      '<div class="header-right">' +
          (canManage ? '<a id="btn-add-project" class="header-action-btn" role="button" title="Add Project"><mat-icon>add</mat-icon>Add Project</a>' : '') +
      '</div>' +
  '</div>';

  contentHtml = '<tb-dashboard-state fxFlex [ctx]="ctx" [syncParentStateParams]="true" stateId="projects_all"></tb-dashboard-state>';
}

return '<div class="main-layout" style="width: 100%; height: 100%;" fxLayout="column">' +
       headerHtml +
       contentHtml +
       '</div>';
`;

manageProjectsWidget.config.settings.markdownTextFunction = markdownTextFunction;
console.log('Fixed markdownTextFunction (uses "Project" alias instead of "All Projects")');

// === Fix 3: Review btn-manage-kits action (already uses custom function) ===
// The existing action already sets params and opens state, but let's verify it passes customer correctly
const manageKitsAction = customerAdminWidget.config.actions.elementClick.find(a => a.name === 'btn-manage-kits');
if (manageKitsAction) {
  console.log('btn-manage-kits action already uses custom function');
  // The existing function fetches kit counts and opens manage_diagnostickits
  // It should already work for customer users since it uses the current user's customer
}

// Save the dashboard
fs.writeFileSync('dashboards/administration.json', JSON.stringify(dashboard, null, 2));
console.log('\nDashboard saved.');
