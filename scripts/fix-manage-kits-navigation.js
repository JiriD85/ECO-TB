const fs = require('fs');
const dashboard = JSON.parse(fs.readFileSync('dashboards/administration.json', 'utf8'));

// Fix btn-manage-kits action to also pass entityId
const customerAdminWidget = dashboard.configuration.widgets['2131ced7-032b-7d7f-1c04-917bd7a89699'];

const manageKitsAction = customerAdminWidget.config.actions.elementClick.find(a => a.name === 'btn-manage-kits');
if (manageKitsAction) {
  manageKitsAction.customFunction = `
const $injector = widgetContext.$scope.$injector;
const entityGroupService = $injector.get(widgetContext.servicesMap.get('entityGroupService'));
const rxjs = widgetContext.rxjs;
const forkJoin = rxjs.forkJoin;
const of = rxjs.of;
const map = rxjs.map;
const switchMap = rxjs.switchMap;
const catchError = rxjs.catchError;

// Create pageLink correctly
const pageLink = widgetContext.pageLink(1, 0, null, null, null);

// Get current user info
const currentUser = widgetContext.currentUser;
const isTenantAdmin = currentUser.authority === 'TENANT_ADMIN';

// Get owner ID based on user type
let ownerId;
if (isTenantAdmin) {
    ownerId = { id: currentUser.tenantId, entityType: 'TENANT' };
} else {
    ownerId = { id: currentUser.customerId, entityType: 'CUSTOMER' };
}

// Helper: get entity count from group by name
function getGroupCount(groups, groupName) {
    const group = groups.find(g => g.name === groupName);
    if (!group) {
        return of(0);
    }
    // Use correct pageLink
    return entityGroupService.getEntityGroupEntities(group.id.id, pageLink).pipe(
        map(response => response.totalElements || 0),
        catchError((err) => {
            console.error('Error getting group count for ' + groupName, err);
            return of(0);
        })
    );
}

// Fetch all ASSET groups for this owner
entityGroupService.getEntityGroupsByOwnerId(ownerId.entityType, ownerId.id, 'ASSET').pipe(
    switchMap((groups) => {
        return forkJoin({
            total: getGroupCount(groups, 'Diagnostickits'),
            assigned: getGroupCount(groups, 'Assigned Diagnostic Kits'),
            unassigned: getGroupCount(groups, 'Unassigned Diagnostic Kits')
        });
    }),
    catchError((err) => {
        console.error('Error fetching kit counts:', err);
        return of({ total: 0, assigned: 0, unassigned: 0 });
    })
).subscribe(counts => {
    const params = widgetContext.stateController.getStateParams();

    // Add customer info for Customer Users
    if (!isTenantAdmin) {
        params.entityId = { id: currentUser.customerId, entityType: 'CUSTOMER' };
        params.entityName = currentUser.customerTitle || '';
        params.entityLabel = currentUser.customerTitle || '';
    }

    params.kitsTotal = counts.total;
    params.kitsAssigned = counts.assigned;
    params.kitsAvailable = counts.unassigned;
    widgetContext.stateController.openState('manage_diagnostickits', params);
});
`;
  console.log('Fixed btn-manage-kits action (passes customer info for Customer Users)');
} else {
  console.log('Warning: btn-manage-kits action not found');
}

fs.writeFileSync('dashboards/administration.json', JSON.stringify(dashboard, null, 2));
console.log('Dashboard saved.');
