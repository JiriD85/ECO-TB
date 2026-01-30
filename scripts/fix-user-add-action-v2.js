const fs = require('fs');
const dashboard = JSON.parse(fs.readFileSync('dashboards/administration.json', 'utf8'));

// === Fix 1: Update markdownTextFunction to check admin roles for Add User button ===
// Widget ID: aeae7803-eac3-1b63-938e-06dde5857ced

const manageUsersWidget = dashboard.configuration.widgets['aeae7803-eac3-1b63-938e-06dde5857ced'];

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

// Check if current user can manage users (add new users)
var isTenantAdmin = ctx.currentUser.authority === 'TENANT_ADMIN';
var adminRoles = [
  'ECO Administrator',
  'ECO Diagnostics Administrator',
  'Belimo Retrofit Administrator',
  'Administrator'
];
var isAdminRole = adminRoles.some(function(role) {
  return userRole === role || userRole.toLowerCase() === role.toLowerCase();
});
var canManageUsers = isTenantAdmin || isAdminRole;

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

// Header HTML - only show Add User button for admin roles
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
        (canManageUsers ? '<a id="btn-add-user" class="header-action-btn" role="button" title="Add User"><mat-icon>person_add</mat-icon>Add User</a>' : '') +
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
console.log('Updated markdownTextFunction with admin role check');


// === Fix 2: Update Add User action with nicer activation link dialog ===

const addUserAction = {
  "name": "btn-add-user",
  "icon": "person_add",
  "type": "customPretty",
  "customHtml": `<form
  #addUserForm="ngForm"
  [formGroup]="addUserFormGroup"
  (ngSubmit)="save()"
  class="add-user-dialog"
>
  <!-- Header -->
  <div class="dialog-header">
    <mat-icon>person_add</mat-icon>
    <h2>Add User</h2>
    <span class="flex-1"></span>
    <button mat-icon-button (click)="cancel()" type="button" class="close-btn">
      <mat-icon>close</mat-icon>
    </button>
  </div>

  <mat-progress-bar color="accent" mode="indeterminate" *ngIf="isLoading$ | async"></mat-progress-bar>
  <div style="height: 4px;" *ngIf="!(isLoading$ | async)"></div>

  <div class="dialog-body">
    <!-- User Role Selection Card -->
    <div class="section-card role-card">
      <div class="card-header-mini">
        <mat-icon>badge</mat-icon>
        <span>User Role</span>
      </div>
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Select Role</mat-label>
        <mat-select formControlName="userRole" required>
          <mat-option *ngFor="let role of userRoles" [value]="role.value">
            <mat-icon style="vertical-align: middle; margin-right: 8px;">{{ role.icon }}</mat-icon>
            {{ role.name }}
          </mat-option>
        </mat-select>
        <mat-icon matPrefix>security</mat-icon>
        <mat-error *ngIf="addUserFormGroup.get('userRole').hasError('required')">
          Please select a user role
        </mat-error>
      </mat-form-field>
    </div>

    <!-- User Details Card -->
    <div class="section-card user-card">
      <div class="card-header-mini">
        <mat-icon>account_circle</mat-icon>
        <span>User Details</span>
      </div>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Email</mat-label>
        <input matInput formControlName="email" type="email" required>
        <mat-icon matPrefix>email</mat-icon>
        <mat-error *ngIf="addUserFormGroup.get('email').hasError('required')">
          Email is required
        </mat-error>
        <mat-error *ngIf="addUserFormGroup.get('email').hasError('pattern')">
          Invalid email format
        </mat-error>
      </mat-form-field>

      <div class="flex gap-3">
        <mat-form-field appearance="outline" class="flex-1">
          <mat-label>First Name</mat-label>
          <input matInput formControlName="firstName">
          <mat-icon matPrefix>person</mat-icon>
        </mat-form-field>
        <mat-form-field appearance="outline" class="flex-1">
          <mat-label>Last Name</mat-label>
          <input matInput formControlName="lastName">
          <mat-icon matPrefix>person_outline</mat-icon>
        </mat-form-field>
      </div>
    </div>

    <!-- Activation Method Card -->
    <div class="section-card activation-card">
      <div class="card-header-mini">
        <mat-icon>vpn_key</mat-icon>
        <span>Activation</span>
      </div>
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Activation Method</mat-label>
        <mat-select formControlName="activationMethod">
          <mat-option *ngFor="let method of activationMethods" [value]="method.value">
            {{ method.name }}
          </mat-option>
        </mat-select>
        <mat-icon matPrefix>send</mat-icon>
      </mat-form-field>
    </div>
  </div>

  <!-- Footer -->
  <div class="dialog-footer">
    <button mat-button type="button" (click)="cancel()">Cancel</button>
    <button mat-raised-button color="primary" type="submit"
            [disabled]="(isLoading$ | async) || addUserFormGroup.invalid || !addUserFormGroup.dirty">
      <mat-icon>person_add</mat-icon>
      Add User
    </button>
  </div>
</form>`,
  "customCss": `.add-user-dialog {
  width: 500px;
  max-width: 95vw;
  display: flex;
  flex-direction: column;
  font-family: Roboto, sans-serif;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%);
  color: white;
}

.dialog-header mat-icon {
  font-size: 24px;
  width: 24px;
  height: 24px;
}

.dialog-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.dialog-header .close-btn {
  color: white;
}

.dialog-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 60vh;
  overflow-y: auto;
}

.section-card {
  background: #fafafa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
}

.section-card.role-card {
  background: linear-gradient(135deg, rgba(156, 39, 176, 0.05) 0%, rgba(123, 31, 162, 0.08) 100%);
  border-color: rgba(156, 39, 176, 0.2);
}

.card-header-mini {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 500;
  color: #555;
}

.card-header-mini mat-icon {
  font-size: 18px;
  width: 18px;
  height: 18px;
  color: #9c27b0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
  background: #fafafa;
}

.dialog-footer button[mat-raised-button] mat-icon {
  margin-right: 8px;
}

/* Form field styling */
.add-user-dialog .mat-mdc-form-field {
  width: 100%;
}

.add-user-dialog .mdc-text-field--outlined {
  background-color: #fff !important;
}

.flex {
  display: flex;
}

.flex-1 {
  flex: 1;
}

.gap-3 {
  gap: 12px;
}

.w-full {
  width: 100%;
}`,
  "customFunction": `let $injector = widgetContext.$scope.$injector;
let customDialog = $injector.get(widgetContext.servicesMap.get('customDialog'));
let userService = $injector.get(widgetContext.servicesMap.get('userService'));
let entityGroupService = $injector.get(widgetContext.servicesMap.get('entityGroupService'));
let dashboardService = $injector.get(widgetContext.servicesMap.get('dashboardService'));
let attributeService = $injector.get(widgetContext.servicesMap.get('attributeService'));
let translationService = $injector.get(widgetContext.servicesMap.get('translate'));

openAddUserDialog();

function openAddUserDialog() {
  customDialog.customDialog(htmlTemplate, AddUserDialogController).subscribe();
}

function AddUserDialogController(instance) {
  let vm = instance;

  // User role options with icons
  vm.userRoles = [
    {
      value: 'readonly',
      name: 'Read-Only User',
      icon: 'person',
      groupName: 'Belimo Retrofit User',
      roleAttribute: 'Belimo Retrofit Users'
    },
    {
      value: 'engineer',
      name: 'Engineer',
      icon: 'engineering',
      groupName: 'Belimo Retrofit Engineer',
      roleAttribute: 'Belimo Retrofit Engineer'
    },
    {
      value: 'administrator',
      name: 'Administrator',
      icon: 'admin_panel_settings',
      groupName: 'Belimo Retrofit Administrators',
      roleAttribute: 'Belimo Retrofit Administrator'
    }
  ];

  vm.activationMethods = [
    {
      value: 'displayActivationLink',
      name: 'Display Activation Link'
    },
    {
      value: 'sendActivationMail',
      name: 'Send Activation Email'
    }
  ];

  vm.addUserFormGroup = vm.fb.group({
    userRole: ['readonly', vm.validators.required],
    email: ['', [vm.validators.required, vm.validators.pattern(/^(([^<>()\\[\\]\\\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\_\\-0-9]+\\.)+[a-zA-Z]{2,}))$/)]],
    firstName: [null],
    lastName: [null],
    activationMethod: ['displayActivationLink']
  });

  vm.cancel = function () {
    vm.dialogRef.close(null);
  };

  vm.save = function () {
    var customerId;
    if (widgetContext.currentUser.authority === 'TENANT_ADMIN') {
      customerId = widgetContext.stateController.getStateParams().entityId;
    } else {
      customerId = { id: widgetContext.currentUser.customerId, entityType: 'CUSTOMER' };
    }

    vm.addUserFormGroup.markAsPristine();

    const formValues = vm.addUserFormGroup.value;
    const selectedRole = vm.userRoles.find(r => r.value === formValues.userRole);

    let user = {
      email: formValues.email,
      firstName: formValues.firstName,
      lastName: formValues.lastName,
      authority: 'CUSTOMER_USER',
      customerId: customerId
    };

    const sendActivationMail = (formValues.activationMethod === 'sendActivationMail');

    widgetContext.rxjs.forkJoin([
      getTargetUserGroup(customerId, selectedRole.groupName),
      getDashboardByName('Smart Diagnostics')
    ]).pipe(
      widgetContext.rxjs.switchMap((data) => {
        var userGroup = data[0];
        var defaultDashboard = data[1];
        if (defaultDashboard) {
          user.additionalInfo = {
            defaultDashboardId: defaultDashboard.id.id,
            defaultDashboardFullscreen: true
          };
        }
        return saveUserObservable(userGroup, user, sendActivationMail);
      }),
      widgetContext.rxjs.switchMap((savedUser) => {
        const roleAttribute = {
          key: 'role',
          value: selectedRole.roleAttribute
        };
        return attributeService.saveEntityAttributes(savedUser.id, 'SERVER_SCOPE', [roleAttribute]).pipe(
          widgetContext.rxjs.map(() => savedUser)
        );
      })
    ).subscribe((user) => {
      widgetContext.updateAliases();
      if (formValues.activationMethod === 'displayActivationLink') {
        userService.getActivationLink(user.id.id).subscribe(
          (activationLink) => {
            displayActivationLink(activationLink, formValues.email).subscribe(
              () => {
                vm.dialogRef.close(null);
              }
            );
          }
        );
      } else {
        vm.dialogRef.close(null);
      }
    });
  };

  function saveUserObservable(userGroup, user, sendActivationMail) {
    return userService.saveUser(user, sendActivationMail, userGroup.id.id);
  }

  function getTargetUserGroup(customerId, groupName) {
    return entityGroupService.getEntityGroupsByOwnerId(customerId.entityType, customerId.id, 'USER').pipe(
      widgetContext.rxjs.switchMap((groups) => {
        return getOrCreateUserGroup(groups, groupName, customerId);
      })
    );
  }

  function getOrCreateUserGroup(groups, groupName, customerId) {
    var usersGroup = groups.find(group => group.name === groupName);
    if (usersGroup) {
      return widgetContext.rxjs.of(usersGroup);
    } else {
      usersGroup = {
        type: 'USER',
        name: groupName,
        ownerId: customerId
      };
      return entityGroupService.saveEntityGroup(usersGroup);
    }
  }

  function getDashboardByName(dashboardName) {
    var dashboardsPageLink = widgetContext.pageLink(100, 0, dashboardName);
    return dashboardService.getUserDashboards(null, null, dashboardsPageLink, {ignoreLoading: true}).pipe(
      widgetContext.rxjs.map((data) => {
        if (data.data.length) {
          return data.data.find((dashboard) => dashboard.name === dashboardName);
        } else {
          return null;
        }
      })
    );
  }

  function displayActivationLink(activationLink, userEmail) {
    const template = \`
<div class="activation-dialog">
  <div class="activation-header">
    <mat-icon>check_circle</mat-icon>
    <h2>User Created Successfully</h2>
    <span class="flex-1"></span>
    <button mat-icon-button (click)="close()" type="button" class="close-btn">
      <mat-icon>close</mat-icon>
    </button>
  </div>

  <div class="activation-body">
    <div class="success-icon">
      <mat-icon>person_add</mat-icon>
    </div>

    <p class="activation-info">
      The user <strong>\${userEmail}</strong> has been created.<br>
      Share the activation link below to allow them to set their password.
    </p>

    <div class="link-container">
      <div class="link-label">
        <mat-icon>link</mat-icon>
        <span>Activation Link</span>
      </div>
      <div class="link-box">
        <code class="link-text">{{ activationLink }}</code>
        <button mat-icon-button
                color="primary"
                ngxClipboard
                cbContent="{{ activationLink }}"
                (cbOnSuccess)="onCopied()"
                matTooltip="Copy to clipboard"
                matTooltipPosition="above"
                class="copy-btn">
          <mat-icon>content_copy</mat-icon>
        </button>
      </div>
      <div class="copy-hint" *ngIf="copied">
        <mat-icon>check</mat-icon>
        <span>Copied to clipboard!</span>
      </div>
    </div>

    <div class="expiry-note">
      <mat-icon>schedule</mat-icon>
      <span>This link will expire in 72 hours</span>
    </div>
  </div>

  <div class="activation-footer">
    <button mat-raised-button color="primary" (click)="close()">
      <mat-icon>done</mat-icon>
      Done
    </button>
  </div>
</div>
\`;

    const css = \`
.activation-dialog {
  width: 480px;
  max-width: 95vw;
  font-family: Roboto, sans-serif;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}

.activation-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
  color: white;
}

.activation-header mat-icon {
  font-size: 24px;
  width: 24px;
  height: 24px;
}

.activation-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.activation-header .close-btn {
  color: white;
}

.activation-body {
  padding: 24px;
  text-align: center;
}

.success-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(56, 142, 60, 0.15) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.success-icon mat-icon {
  font-size: 32px;
  width: 32px;
  height: 32px;
  color: #4caf50;
}

.activation-info {
  color: #555;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 20px;
}

.activation-info strong {
  color: #333;
}

.link-container {
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  text-align: left;
}

.link-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.link-label mat-icon {
  font-size: 16px;
  width: 16px;
  height: 16px;
}

.link-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 8px 12px;
}

.link-text {
  flex: 1;
  font-size: 12px;
  color: #1976d2;
  word-break: break-all;
  font-family: 'Roboto Mono', monospace;
}

.copy-btn {
  flex-shrink: 0;
}

.copy-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 8px;
  color: #4caf50;
  font-size: 13px;
  font-weight: 500;
}

.copy-hint mat-icon {
  font-size: 16px;
  width: 16px;
  height: 16px;
}

.expiry-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
  color: #888;
  font-size: 12px;
}

.expiry-note mat-icon {
  font-size: 16px;
  width: 16px;
  height: 16px;
}

.activation-footer {
  display: flex;
  justify-content: center;
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
  background: #fafafa;
}

.activation-footer button mat-icon {
  margin-right: 8px;
}

.flex-1 {
  flex: 1;
}
\`;

    // Inject CSS
    const styleId = 'activation-dialog-style';
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = css;
      document.head.appendChild(styleEl);
    }

    return customDialog.customDialog(template, ActivationLinkDialogController, {activationLink: activationLink, userEmail: userEmail});
  }

  function ActivationLinkDialogController(instance) {
    var vm = instance;
    vm.activationLink = instance.data.activationLink;
    vm.userEmail = instance.data.userEmail;
    vm.copied = false;

    vm.onCopied = function() {
      vm.copied = true;
      setTimeout(function() {
        vm.copied = false;
      }, 3000);
    };

    vm.close = function() {
      vm.dialogRef.close(null);
    };
  }
}`,
  "customResources": [],
  "openInSeparateDialog": false,
  "openInPopover": false,
  "id": "act-add-user"
};

// Update the actions array
const existingActions = manageUsersWidget.config.actions.elementClick || [];
const addUserIndex = existingActions.findIndex(a => a.name === 'btn-add-user');

if (addUserIndex >= 0) {
  existingActions[addUserIndex] = addUserAction;
  console.log('Updated btn-add-user action with new activation link dialog');
} else {
  existingActions.push(addUserAction);
  console.log('Added btn-add-user action');
}

manageUsersWidget.config.actions.elementClick = existingActions;

// Save the dashboard
fs.writeFileSync('dashboards/administration.json', JSON.stringify(dashboard, null, 2));
console.log('Dashboard saved.');
