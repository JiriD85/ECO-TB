/**
 * Update Measurement Dashboard Header Widget
 *
 * Changes:
 * 1. Fix i18n keys (remove .title suffix)
 * 2. Option C: State + Alarm in combined two-line card
 * 3. Make card clickable with id="measurement-alarms"
 * 4. Progress with getProgressColor() colors
 */

const fs = require('fs');

const DASHBOARD_PATH = 'dashboards/measurements.json';
const HEADER_WIDGET_ID = '6ccd99bd-8562-4e6b-e42b-e7f3c026a129';

// Load dashboard
const dashboard = JSON.parse(fs.readFileSync(DASHBOARD_PATH, 'utf8'));
const widget = dashboard.configuration.widgets[HEADER_WIDGET_ID];

if (!widget) {
  console.error('Header widget not found!');
  process.exit(1);
}

console.log('Found header widget:', widget.config?.title);

// Update markdownTextFunction body
const settings = widget.config.settings;
if (settings.markdownTextFunction && typeof settings.markdownTextFunction === 'object') {

  const newBody = `let $injector = ctx.$scope.$injector;
let assetService = $injector.get(ctx.servicesMap.get('assetService'));
let attributeService = $injector.get(ctx.servicesMap.get('attributeService'));
var entityId;
var deviceState;
if (data && data.length && data[0]['entityId']) {
    deviceState = true;
    entityId = data[0]['entityId'];
} else {
    deviceState = false;
    entityId = null;
}
let userRole;
if(data[1] && data[1].role){
    userRole = data[1].role;
}

var stateParams = ctx.stateController.getStateParams();
ctx.stateController.updateState(null, stateParams);
if(entityId) {

    var ButtonHtml = '';
    if (userRole !== 'Belimo Retrofit Users') {
        ButtonHtml =
            '<button id="parameter-button" type="button" mat-raised-button color="primary">' +
                '<mat-icon class="tb-mat-18">settings</mat-icon>' +
                '<span>{i18n:custom.diagnostics.action.measurement-parameters}</span>' +
            '</button>' +
            '<button id="projects-button" type="button" mat-raised-button color="primary">' +
                '<mat-icon class="tb-mat-18">assignment</mat-icon>' +
                '<span>{i18n:custom.diagnostics.projects-btn.title}</span>' +
            '</button>';
    }

    var name, label, state, active, progress, locationName, installationType, systemType, measurementRole, dimension, measurementType, startTime, endTime;
    var criticalCount, majorCount, minorCount, warningCount;
    if (data && data.length) {
        name = data[0]['entityName'] || 'N/A';
        label = data[0]['Label'] || 'N/A';
        locationName = data[0]['locationName'] || 'N/A';
        installationType = data[0]['installationType'] || 'N/A';
        systemType = data[0]['systemType'] || 'N/A';
        measurementRole = data[0]['measurementRole'] || 'N/A';
        dimension = data[0]['dimension'] || 'N/A';
        state = data[0]['state'] || 'normal';
        active = data[0]['active'] || 'N/A';
        progress = data[0]['progress'] || 'N/A';
        measurementType = data[0]['measurementType'] || 'N/A';
        startTime = data[0]['startTimeMs'] || 'N/A';
        endTime = data[0]['endTimeMs'] || 'N/A';
        criticalCount = parseInt(data[0]['criticalAlarmsCount']) || 0;
        majorCount = parseInt(data[0]['majorAlarmsCount']) || 0;
        minorCount = parseInt(data[0]['minorAlarmsCount']) || 0;
        warningCount = parseInt(data[0]['warningAlarmsCount']) || 0;
        if (active === 'false') {
            state = 'disconnected';
        }
    }

    // Installation Type Badge (heating=red, cooling=blue)
    var instStyle = ecoUtils.getInstallationTypeStyle(installationType);
    var installationBadge = ecoUtils.createBadgeHtml(instStyle.icon, instStyle.label, instStyle.color, instStyle.bgColor);

    // System Type Badge (text only) - fixed i18n key
    var systemTypeBadge = '';
    if (systemType && systemType !== 'N/A') {
        var sysTypeKey = clientUtils.toKebabCase(systemType);
        systemTypeBadge = '<span class="status-badge badge-type">' +
            '{i18n:custom.diagnostics.system-type.' + sysTypeKey + '}' +
            '</span>';
    }

    // Measurement Role Badge (text only) - fixed i18n key
    var measurementRoleBadge = '';
    if (measurementRole && measurementRole !== 'N/A') {
        var roleKey = clientUtils.toKebabCase(measurementRole);
        measurementRoleBadge = '<span class="status-badge badge-type">' +
            '{i18n:custom.diagnostics.measurement-role.' + roleKey + '}' +
            '</span>';
    }

    // === State + Alarm Badge (using library function) ===
    var totalAlarms = criticalCount + majorCount + minorCount + warningCount;
    var stateAlarmCard = ecoUtils.createAlarmBadgeHtml(state, totalAlarms, 'measurement-alarms');

    // Progress Badge with getProgressColor scheme (orange->green->blue->red)
    var progressBadge = '';
    if (progress && progress !== 'N/A') {
        var progStyle = ecoUtils.getProgressColor(progress);
        var progIcon;
        switch(progress) {
            case 'in preparation': progIcon = 'schedule'; break;
            case 'active': progIcon = 'play_circle'; break;
            case 'finished': progIcon = 'check_circle'; break;
            case 'aborted': progIcon = 'cancel'; break;
            default: progIcon = 'help'; break;
        }
        var progI18nKey = progress === 'in preparation' ? 'preparation' : progress;
        progressBadge = '<span class="status-badge" style="background:' + progStyle.bgColor + ';color:' + progStyle.color + ';">' +
            '<mat-icon class="badge-icon">' + progIcon + '</mat-icon>' +
            '<span>{i18n:custom.diagnostics.state-filter.' + progI18nKey + '.title}</span></span>';
    }

    var displayTitle = (locationName && locationName !== 'N/A') ? locationName : name;

    var header = '<div class="measurement-header flex items-center justify-between">' +
      '<div class="flex items-center gap-3">' +
        '<button id="go-back" type="button" mat-raised-button color="primary" class="back-button">' +
          '<mat-icon>arrow_back</mat-icon><span>{i18n:action.go-back}</span></button>' +
        '<button id="measurement-switch-button" type="button" mat-raised-button color="accent" class="switch-btn">' +
          '<mat-icon>swap_horiz</mat-icon>' +
        '</button>' +
        '<div class="measurement-title-block">' +
          '<span class="measurement-location-text">' + ((locationName && locationName !== 'N/A') ? locationName : label) + '</span>' +
          '<span class="measurement-name-text">' + name + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="flex flex-col items-center gap-1">' +
        '<div class="flex items-center gap-2">' + installationBadge + systemTypeBadge + measurementRoleBadge + '</div>' +
        '<div class="flex items-center gap-2">' + progressBadge + ecoUtils.getDateBadgeHtml(startTime, 'start') + ecoUtils.getDateBadgeHtml(endTime, 'end') + '</div>' +
      '</div>' +
      '<div class="flex items-center justify-center" style="margin:0 24px;">' + stateAlarmCard + '</div>' +
      '<div class="flex items-center gap-3">' + ButtonHtml +
        '<button id="analysis-button" type="button" mat-raised-button color="primary">' +
          '<mat-icon class="tb-mat-18">insights</mat-icon><span>{i18n:custom.diagnostics.analysis.title}</span></button>' +
      '</div>' +
    '</div>';

    // Inject styles
    (function injectStyles() {
        var styleId = 'measurement-header-style';
        if (document.getElementById(styleId)) return;

        var css = '.measurement-tabs-container { display: flex; flex-direction: column; height: 100%; min-height: 0; }' +
            '.measurement-tabs-container mat-tab-group { flex: 1 1 auto; min-height: 0; height: 100%; }' +
            '.measurement-tabs-container .mat-mdc-tab-body-wrapper { flex: 1 1 auto; min-height: 0; height: 100%; }' +
            '.measurement-tabs-container .mat-mdc-tab-body { height: 100%; min-height: 0; }' +
            '.measurement-tabs-container .mat-mdc-tab-body-content { height: 100%; min-height: 0; overflow: hidden; }' +
            '.measurement-tab-label { display: inline-flex; align-items: center; gap: 8px; }' +
            '.measurement-tab-label mat-icon { font-size: 20px; width: 20px; height: 20px; }' +
            '.measurement-tab-body { width: 100%; height: 100%; display: block; }' +
            '.state-alarm-card:hover { transform: scale(1.02); box-shadow: 0 2px 8px rgba(0,0,0,0.1); }';

        var styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.type = 'text/css';
        styleEl.appendChild(document.createTextNode(css));
        document.head.appendChild(styleEl);
    })();

    // Determine measurement type and installation type
    var mType = (measurementType || '').toLowerCase();
    var iType = (installationType || '').toLowerCase();

    // Show navigation bar only for ultrasonic/import
    var showNavBar = (mType === 'ultrasonic' || mType === 'import');
    var showMessage = false;
    var messageText = 'Interpolated data is only available in the analysis after the measurement is completed.';

    // Determine states based on installation type
    var rawDataState = '';
    var loadAnalysisState = '';
    if (iType === 'heating') {
        rawDataState = 'measurement_ultrasonic_heating';
        loadAnalysisState = 'measurement_ultrasonic_heating_load';
    } else if (iType === 'cooling') {
        rawDataState = 'measurement_ultrasonic_cooling';
        loadAnalysisState = 'measurement_ultrasonic_cooling_load';
    } else {
        rawDataState = 'measurement_ultrasonic_heating';
        loadAnalysisState = 'measurement_ultrasonic_heating_load';
    }

    // Content for non-tabbed views
    var contentHtml = '';

    if (mType === 'lorawan') {
        contentHtml = '<tb-dashboard-state class="w-full h-full" [ctx]="ctx" [syncParentStateParams]="true" stateId="measurement_lorawan_room"></tb-dashboard-state>';
        return '<div class="main-layout flex flex-col w-full h-full">' + header +
            '<div id="power_measurement_wrapper" class="flex-1">' + contentHtml + '</div></div>';
    } else if (mType === 'interpolation' || !showNavBar) {
        contentHtml = '<div class="flex items-center justify-center h-full"><div class="text-center p-8" style="background: #fff3e0; border-radius: 8px; margin: 20px;"><mat-icon style="font-size: 48px; width: 48px; height: 48px; color: #ff9800;">info</mat-icon><p style="color: #666; font-size: 16px; margin-top: 16px;">' + messageText + '</p></div></div>';
        return '<div class="main-layout flex flex-col w-full h-full">' + header +
            '<div id="power_measurement_wrapper" class="flex-1">' + contentHtml + '</div></div>';
    }

    // ========== MAT-TAB-GROUP Navigation for ultrasonic/import ==========

    var tabs = [
        { id: 'raw', label: '{i18n:custom.diagnostics.nav.raw-data}', icon: 'show_chart', stateId: rawDataState },
        { id: 'load', label: '{i18n:custom.diagnostics.nav.load-analysis}', icon: 'speed', stateId: loadAnalysisState }
    ];

    // Get active tab from stateParams
    var activeTabId = (stateParams.navTab && stateParams.navTab.active) || 'raw';
    var selectedIndex = 0;
    for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].id === activeTabId) {
            selectedIndex = i;
            break;
        }
    }

    // Set up tab change handler on ctx
    ctx.measurementNavIndex = selectedIndex;
    ctx.measurementNavChange = function(ev) {
        try {
            var idx = (ev && typeof ev.index === 'number') ? ev.index : 0;
            var tab = tabs[idx] || tabs[0];
            ctx.measurementNavIndex = idx;

            var currentParams = ctx.stateController.getStateParams() || {};
            currentParams.navTab = { active: tab.id };
            ctx.stateController.updateState(null, currentParams);

            if (ctx.$scope && typeof ctx.$scope.$applyAsync === 'function') {
                ctx.$scope.$applyAsync();
            }
        } catch (e) {
            console.error('measurementNavChange error', e);
        }
    };

    // Build tabs HTML
    var tabsHtml = '';
    for (var j = 0; j < tabs.length; j++) {
        var t = tabs[j];
        tabsHtml += '<mat-tab>' +
            '<ng-template mat-tab-label>' +
                '<span class="measurement-tab-label">' +
                    '<mat-icon>' + t.icon + '</mat-icon>' +
                    '<span>' + t.label + '</span>' +
                '</span>' +
            '</ng-template>' +
            '<ng-template matTabContent>' +
                '<tb-dashboard-state class="measurement-tab-body" [ctx]="ctx" [syncParentStateParams]="true" stateId="' + t.stateId + '"></tb-dashboard-state>' +
            '</ng-template>' +
        '</mat-tab>';
    }

    var tabGroupHtml = '<div class="measurement-tabs-container">' +
        '<mat-tab-group mat-stretch-tabs="false" mat-align-tabs="start"' +
            ' [selectedIndex]="ctx.measurementNavIndex"' +
            ' (selectedTabChange)="ctx.measurementNavChange($event)">' +
            tabsHtml +
        '</mat-tab-group>' +
    '</div>';

    return '<div class="main-layout flex flex-col w-full h-full">' + header +
        '<div id="power_measurement_wrapper" class="flex-1">' + tabGroupHtml + '</div></div>';
}`;

  settings.markdownTextFunction.body = newBody;
  console.log('Updated markdownTextFunction body with Option C');
}

// Save dashboard
fs.writeFileSync(DASHBOARD_PATH, JSON.stringify(dashboard, null, 2));
console.log('Dashboard saved successfully!');
