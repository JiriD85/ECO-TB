const fs = require('fs');
const dashboard = JSON.parse(fs.readFileSync('dashboards/administration.json', 'utf8'));

// === Fix 1: Update btn-manage-users action in customer_administration widget ===
// Widget ID: 2131ced7-032b-7d7f-1c04-917bd7a89699 (customer_administration tile cards)

const customerAdminWidget = dashboard.configuration.widgets['2131ced7-032b-7d7f-1c04-917bd7a89699'];

// Find and update the btn-manage-users action
const manageUsersAction = customerAdminWidget.config.actions.elementClick.find(a => a.name === 'btn-manage-users');
if (manageUsersAction) {
  // Change from openDashboardState to custom function that passes customer info
  manageUsersAction.type = 'custom';
  manageUsersAction.customFunction = `
// Get current user info
const currentUser = widgetContext.currentUser;
const customerId = currentUser.customerId;

// Build stateParams with customer info
const params = widgetContext.stateController.getStateParams();
params.entityId = { id: customerId, entityType: 'CUSTOMER' };
params.entityName = currentUser.customerTitle || '';
params.entityLabel = currentUser.customerTitle || '';

// Open manage_users state with customer context
widgetContext.stateController.openState('manage_users', params);
`;
  // Remove openDashboardState-specific properties
  delete manageUsersAction.targetDashboardStateId;
  delete manageUsersAction.setEntityId;
  delete manageUsersAction.stateEntityParamName;
  delete manageUsersAction.openRightLayout;

  console.log('Fixed btn-manage-users action (passes customer info)');
} else {
  console.log('Warning: btn-manage-users action not found');
}

// === Fix 2: Update manage_users widget ===
// Widget ID: aeae7803-eac3-1b63-938e-06dde5857ced

const manageUsersWidget = dashboard.configuration.widgets['aeae7803-eac3-1b63-938e-06dde5857ced'];

// Update datasources to include all user groups for counting
manageUsersWidget.config.datasources = [
  {
    "type": "entity",
    "entityAliasId": "203b0867-b867-ef98-1791-03046c133b7d", // Current User
    "dataKeys": [
      {
        "name": "role",
        "type": "attribute",
        "label": "role",
        "color": "#2196f3",
        "settings": {},
        "_hash": 0.8853142583803868
      },
      {
        "name": "ownerName",
        "type": "entityField",
        "label": "customer",
        "color": "#9c27b0",
        "settings": {},
        "_hash": 0.48497657295220475
      }
    ],
    "alarmFilterConfig": {
      "statusList": ["ACTIVE"]
    }
  },
  {
    "type": "entity",
    "entityAliasId": "fbfce281-668f-0ad0-d8f4-6870d3ef679f", // Belimo Retrofit Users (Read-only)
    "dataKeys": [
      {
        "name": "email",
        "type": "entityField",
        "label": "readonlyEmail",
        "color": "#4caf50",
        "settings": {},
        "_hash": 0.111
      }
    ],
    "alarmFilterConfig": {
      "statusList": ["ACTIVE"]
    }
  },
  {
    "type": "entity",
    "entityAliasId": "4128d7f0-9e28-5c7d-cf9a-b43cfe893568", // Belimo Retrofit Engineer
    "dataKeys": [
      {
        "name": "email",
        "type": "entityField",
        "label": "engineerEmail",
        "color": "#2196f3",
        "settings": {},
        "_hash": 0.222
      }
    ],
    "alarmFilterConfig": {
      "statusList": ["ACTIVE"]
    }
  },
  {
    "type": "entity",
    "entityAliasId": "1cab31a1-6ad5-e39d-7798-e0dfee1cd61c", // Belimo Retrofit Administrators
    "dataKeys": [
      {
        "name": "email",
        "type": "entityField",
        "label": "adminEmail",
        "color": "#f44336",
        "settings": {},
        "_hash": 0.333
      }
    ],
    "alarmFilterConfig": {
      "statusList": ["ACTIVE"]
    }
  }
];

// New markdownTextFunction with user header and nav tabs
const markdownTextFunction = `
// State params
var stateParams = ctx.stateController.getStateParams();
ctx.stateController.updateState(null, stateParams);

// Datasources:
// "Current User" -> role, customer
// "Belimo Retrofit Users" -> readonlyEmail (count by rows)
// "Belimo Retrofit Engineer" -> engineerEmail (count by rows)
// "Belimo Retrofit Administrators" -> adminEmail (count by rows)

var userRole = '';
var customerName = '';
var usersReadonly = 0, usersEngineers = 0, usersAdmins = 0;

data.forEach(function(item) {
  var alias = item.aliasName || '';

  if (alias === 'Current User') {
    userRole = item.role || '';
    customerName = item.customer || '';
  } else if (alias === 'Belimo Retrofit Users') {
    usersReadonly++;
  } else if (alias === 'Belimo Retrofit Engineer') {
    usersEngineers++;
  } else if (alias === 'Belimo Retrofit Administrators') {
    usersAdmins++;
  }
});

var usersTotal = usersReadonly + usersEngineers + usersAdmins;

var isTenantAdmin = ctx.currentUser.authority === 'TENANT_ADMIN';
var isEcoAdmin = userRole === 'ECO Administrator';
var canManage = isTenantAdmin || isEcoAdmin;
stateParams['userRole'] = userRole;
ctx.stateController.updateState(null, stateParams);

// === USER MANAGEMENT VIEW with Tab Navigation ===

// Tab configuration
var tabs = [
    { id: 'readonly', label: 'Read-Only Users', icon: 'person', stateId: 'user_readonly', count: usersReadonly },
    { id: 'engineers', label: 'Engineers', icon: 'engineering', stateId: 'user_engineers', count: usersEngineers },
    { id: 'admins', label: 'Administrators', icon: 'admin_panel_settings', stateId: 'user_admininistrators', count: usersAdmins }
];

// Get active tab from stateParams
var activeTabId = (stateParams.userNavTab && stateParams.userNavTab.active) || 'readonly';
var selectedIndex = 0;
for (var i = 0; i < tabs.length; i++) {
    if (tabs[i].id === activeTabId) {
        selectedIndex = i;
        break;
    }
}

// Set up tab change handler on ctx
ctx.userNavIndex = selectedIndex;
ctx.userNavChange = function(ev) {
    try {
        var idx = (ev && typeof ev.index === 'number') ? ev.index : 0;
        var tab = tabs[idx] || tabs[0];
        ctx.userNavIndex = idx;

        var currentParams = ctx.stateController.getStateParams() || {};
        currentParams.userNavTab = { active: tab.id };
        ctx.stateController.updateState(null, currentParams);

        if (ctx.$scope && typeof ctx.$scope.$applyAsync === 'function') {
            ctx.$scope.$applyAsync();
        }
    } catch (e) {
        console.error('userNavChange error', e);
    }
};

// Inject styles for tabs
(function injectTabStyles() {
    var styleId = 'user-nav-tabs-style';
    if (document.getElementById(styleId)) return;

    var css = \`
        .user-tabs-container {
            display: flex;
            flex-direction: column;
            height: 100%;
            min-height: 0;
        }
        .user-tabs-container mat-tab-group {
            flex: 1 1 auto;
            min-height: 0;
            height: 100%;
        }
        .user-tabs-container .mat-mdc-tab-body-wrapper {
            flex: 1 1 auto;
            min-height: 0;
            height: 100%;
        }
        .user-tabs-container .mat-mdc-tab-body {
            height: 100%;
            min-height: 0;
        }
        .user-tabs-container .mat-mdc-tab-body-content {
            height: 100%;
            min-height: 0;
            overflow: hidden;
        }
        .user-tab-label {
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        .user-tab-label mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
        }
        .user-tab-label .tab-count {
            background: rgba(0,0,0,0.1);
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
        }
        .user-tab-body {
            width: 100%;
            height: 100%;
            display: block;
        }
    \`;

    var styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.type = 'text/css';
    styleEl.appendChild(document.createTextNode(css));
    document.head.appendChild(styleEl);
})();

// Header HTML
var headerHtml = '<div class="manage-header users">' +
    '<div class="header-left">' +
        '<a id="btn-go-back" class="back-button" role="button" title="Go Back">' +
            '<mat-icon>arrow_back</mat-icon>' +
        '</a>' +
        '<div class="header-title">' +
            '<h1><mat-icon>group</mat-icon>User Management</h1>' +
            '<div class="header-stats">' +
                '<span class="stat-item"><span class="stat-dot total"></span><span class="stat-value">' + usersTotal + '</span> Total</span>' +
                '<span class="stat-item"><span class="stat-dot user"></span><span class="stat-value">' + usersReadonly + '</span> Read-Only</span>' +
                '<span class="stat-item"><span class="stat-dot engineer"></span><span class="stat-value">' + usersEngineers + '</span> Engineers</span>' +
                '<span class="stat-item"><span class="stat-dot admin"></span><span class="stat-value">' + usersAdmins + '</span> Admins</span>' +
            '</div>' +
        '</div>' +
    '</div>' +
    '<div class="header-right">' +
        (canManage ? '<a id="btn-add-user" class="header-action-btn" role="button" title="Add User"><mat-icon>person_add</mat-icon>Add User</a>' : '') +
    '</div>' +
'</div>';

// Build tabs HTML
var tabsHtml = '';
for (var j = 0; j < tabs.length; j++) {
    var t = tabs[j];
    tabsHtml += '<mat-tab>' +
        '<ng-template mat-tab-label>' +
            '<span class="user-tab-label">' +
                '<mat-icon>' + t.icon + '</mat-icon>' +
                '<span>' + t.label + '</span>' +
                '<span class="tab-count">' + t.count + '</span>' +
            '</span>' +
        '</ng-template>' +
        '<ng-template matTabContent>' +
            '<tb-dashboard-state class="user-tab-body" [ctx]="ctx" [syncParentStateParams]="true" stateId="' + t.stateId + '"></tb-dashboard-state>' +
        '</ng-template>' +
    '</mat-tab>';
}

var tabGroupHtml = '<div class="user-tabs-container">' +
    '<mat-tab-group mat-stretch-tabs="false" mat-align-tabs="start"' +
        ' [selectedIndex]="ctx.userNavIndex"' +
        ' (selectedTabChange)="ctx.userNavChange($event)">' +
        tabsHtml +
    '</mat-tab-group>' +
'</div>';

return '<div class="main-layout" style="width: 100%; height: 100%;" fxLayout="column">' +
       headerHtml +
       '<div class="content-area" style="flex: 1; min-height: 0;">' + tabGroupHtml + '</div>' +
       '</div>';
`;

manageUsersWidget.config.settings.markdownTextFunction = markdownTextFunction;

// Add actions for go-back and add-user buttons
manageUsersWidget.config.actions = {
  "elementClick": [
    {
      "name": "btn-go-back",
      "icon": "arrow_back",
      "type": "custom",
      "customFunction": "var params = widgetContext.stateController.getStateParams();\nvar number = (widgetContext.stateController.getStateIndex())-1;\nwidgetContext.stateController.updateState(null, params);\nwidgetContext.stateController.navigatePrevState(number);",
      "id": "act-go-back-users"
    },
    {
      "name": "btn-add-user",
      "icon": "person_add",
      "type": "custom",
      "customFunction": "console.log('Add user clicked - TODO: implement add user dialog');",
      "id": "act-add-user"
    }
  ]
};

// Update widget title
manageUsersWidget.config.title = "Manage Users Header";

console.log('Updated manage_users widget markdownTextFunction (user style with nav tabs)');

// Save the dashboard
fs.writeFileSync('dashboards/administration.json', JSON.stringify(dashboard, null, 2));
console.log('\nDashboard saved.');
