const fs = require('fs');
const dashboard = JSON.parse(fs.readFileSync('dashboards/administration.json', 'utf8'));

// Update btn-add-user action in manage_users widget
// Widget ID: aeae7803-eac3-1b63-938e-06dde5857ced

const manageUsersWidget = dashboard.configuration.widgets['aeae7803-eac3-1b63-938e-06dde5857ced'];

// New Add User action with role dropdown - styled like add-kit
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
      name: translationService.instant('custom.user-management.display-activation-link') || 'Display Activation Link'
    },
    {
      value: 'sendActivationMail',
      name: translationService.instant('custom.user-management.send-activation-email') || 'Send Activation Email'
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
            displayActivationLink(activationLink).subscribe(
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

  function displayActivationLink(activationLink) {
    const template = '<form style="min-width: 400px;">' +
      '<mat-toolbar class="flex items-center bg-primary text-white px-4" color="primary">' +
      '  <h2 translate>user.activation-link</h2>' +
      '  <span class="flex-1"></span>' +
      '  <button mat-icon-button (click)="close()" type="button">' +
      '    <mat-icon class="material-icons">close</mat-icon>' +
      '  </button>' +
      '</mat-toolbar>' +
      '<mat-progress-bar color="warn" mode="indeterminate" *ngIf="isLoading$ | async"></mat-progress-bar>' +
      '<div style="height: 4px;" *ngIf="!(isLoading$ | async)"></div>' +
      '<div mat-dialog-content tb-toast toastTarget="activationLinkDialogContent">' +
      '  <div class="flex flex-col gap-0 sm:gap-2">' +
      '    <span [innerHTML]="' + "'user.activation-link-text' | translate: {activationLink: activationLink}" + '"></span>' +
      '    <div class="flex justify-center items-center">' +
      '      <pre class="tb-highlight" class="flex"><code>{{ activationLink }}</code></pre>' +
      '      <button mat-icon-button color="primary" ngxClipboard cbContent="{{ activationLink }}"' +
      '              (cbOnSuccess)="onActivationLinkCopied()"' +
      '              matTooltip="{{ ' + "'user.copy-activation-link' | translate" + ' }}"' +
      '              matTooltipPosition="above">' +
      '        <mat-icon svgIcon="mdi:clipboard-arrow-left"></mat-icon>' +
      '      </button>' +
      '    </div>' +
      '  </div>' +
      '</div>' +
      '<div mat-dialog-actions class="flex justify-end gap-2">' +
      '  <button mat-button color="primary" type="button" cdkFocusInitial' +
      '          [disabled]="(isLoading$ | async)" (click)="close()">' +
      '    {{ ' + "'action.ok' | translate" + ' }}' +
      '  </button>' +
      '</div>' +
      '</form>';
    return customDialog.customDialog(template, ActivationLinkDialogController, {activationLink: activationLink});
  }

  function ActivationLinkDialogController(instance) {
    var vm = instance;
    vm.activationLink = instance.data.activationLink;
    vm.onActivationLinkCopied = function() {
      widgetContext.showSuccessToast('Activation link copied!', 1000, 'bottom', 'left', 'activationLinkDialogContent');
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
  console.log('Updated existing btn-add-user action');
} else {
  existingActions.push(addUserAction);
  console.log('Added new btn-add-user action');
}

manageUsersWidget.config.actions.elementClick = existingActions;

// Save the dashboard
fs.writeFileSync('dashboards/administration.json', JSON.stringify(dashboard, null, 2));
console.log('Dashboard saved.');
