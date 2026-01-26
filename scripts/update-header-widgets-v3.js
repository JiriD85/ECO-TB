#!/usr/bin/env node
/**
 * Script to update Measurements Dashboard Header Widgets - V3
 * Solution: Use a button that opens a ThingsBoard dialog for measurement switching
 * The dialog is rendered by ThingsBoard's Angular compiler, so it works correctly.
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..');

// Widget IDs
const HEATING_WIDGET_ID = '6ccd99bd-8562-4e6b-e42b-e7f3c026a129';
const COOLING_WIDGET_ID = 'f0dfbf6c-c2b0-2975-eb81-df9748cae9a5';

// ========== PHASE 1: i18n Keys ==========
function updateTranslations() {
    console.log('\n=== Phase 1: Updating translations ===');

    // German translations
    const deFile = path.join(BASE_DIR, 'translation/de_DE_custom_translation.json');
    const de = JSON.parse(fs.readFileSync(deFile, 'utf8'));

    if (!de.custom.diagnostics.analysis) {
        de.custom.diagnostics.analysis = {};
    }
    de.custom.diagnostics.analysis.title = 'Analyse';
    de.custom.diagnostics.analysis.placeholder = 'Analysefunktion kommt bald...';
    de.custom.diagnostics['start-date'] = 'Start';
    de.custom.diagnostics['end-date'] = 'Ende';
    de.custom.diagnostics['switch-measurement'] = 'Messung wechseln';
    de.custom.diagnostics['select-measurement'] = 'Messung auswählen';
    de.custom.diagnostics['no-other-measurements'] = 'Keine weiteren Messungen verfügbar';

    // Add alarm severity translations
    if (!de.custom.diagnostics['alarm-severity']) {
        de.custom.diagnostics['alarm-severity'] = {};
    }
    de.custom.diagnostics['alarm-severity'].critical = 'Kritisch';
    de.custom.diagnostics['alarm-severity'].major = 'Schwerwiegend';
    de.custom.diagnostics['alarm-severity'].minor = 'Geringfügig';
    de.custom.diagnostics['alarm-severity'].normal = 'Normal';

    fs.writeFileSync(deFile, JSON.stringify(de, null, 2));
    console.log('Updated de_DE translations');

    // English translations
    const enFile = path.join(BASE_DIR, 'translation/en_US_custom_translation.json');
    const en = JSON.parse(fs.readFileSync(enFile, 'utf8'));

    if (!en.custom.diagnostics.analysis) {
        en.custom.diagnostics.analysis = {};
    }
    en.custom.diagnostics.analysis.title = 'Analysis';
    en.custom.diagnostics.analysis.placeholder = 'Analysis feature coming soon...';
    en.custom.diagnostics['start-date'] = 'Start';
    en.custom.diagnostics['end-date'] = 'End';
    en.custom.diagnostics['switch-measurement'] = 'Switch Measurement';
    en.custom.diagnostics['select-measurement'] = 'Select Measurement';
    en.custom.diagnostics['no-other-measurements'] = 'No other measurements available';

    // Add alarm severity translations
    if (!en.custom.diagnostics['alarm-severity']) {
        en.custom.diagnostics['alarm-severity'] = {};
    }
    en.custom.diagnostics['alarm-severity'].critical = 'Critical';
    en.custom.diagnostics['alarm-severity'].major = 'Major';
    en.custom.diagnostics['alarm-severity'].minor = 'Minor';
    en.custom.diagnostics['alarm-severity'].normal = 'Normal';

    fs.writeFileSync(enFile, JSON.stringify(en, null, 2));
    console.log('Updated en_US translations');
}

// ========== PHASE 2: New CSS ==========
const NEW_CSS_ADDITIONS = `
/* Back Button */
.back-button {
    min-width: unset !important;
    padding: 8px 16px !important;
}

.back-button mat-icon {
    font-size: 18px !important;
    margin-right: 6px;
}

/* Measurement Switch Button */
#measurement-switch-button {
    height: 36px;
    padding: 0 16px !important;
    background: #fff !important;
    border: 1px solid #e0e0e0 !important;
    border-radius: 4px !important;
    color: #28232D !important;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    transition: all 0.2s;
}

#measurement-switch-button:hover {
    background: #f5f5f5 !important;
    border-color: #bdbdbd !important;
    box-shadow: 0 2px 4px rgba(0,0,0,0.12);
}

#measurement-switch-button mat-icon {
    font-size: 20px !important;
    color: #757575;
    margin-left: 4px;
}

/* Analysis Button */
#analysis-button {
    width: auto;
    height: 40px;
    padding-right: 15px;
    font-size: 13px;
    background-color: var(--tb-accent-500);
    color: white;
    display: flex;
    align-items: center;
    gap: 2px;
    margin-right: 10px;
}

#analysis-button:hover {
    background-color: var(--tb-accent-400);
}

#analysis-button mat-icon {
    font-size: 15px;
    color: white;
}

#analysis-button span {
    color: white;
}

/* Date Badge */
.date-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 6px;
    background: #f5f5f5;
    color: #666;
    font-size: 12px;
    font-weight: 500;
}
`;

// ========== PHASE 3: New JavaScript ==========
function createNewJavaScriptBody(installationType, stateId) {
    const isHeating = installationType === 'heating';
    const badgeClass = isHeating ? 'badge-heating' : 'badge-cooling';
    const badgeIcon = isHeating ? 'local_fire_department' : 'ac_unit';
    const measurementTypeI18n = isHeating ? 'heating' : 'cooling';
    const wrapperId = isHeating ? 'power_measurement_heating_wrapper' : 'power_measurement_cooling_wrapper';

    const jsBody = `let $injector = ctx.$scope.$injector;
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

    var name, label, state, active, progress, locationName, installationType, installation, dimension, installationTypeOptions, measurementType, startTime, endTime;
    if (data && data.length) {
        name = data[0]['entityName'] || 'N/A';
        label = data[0]['Label'] || 'N/A';
        locationName = data[0]['locationName'] || 'N/A';
        installationType = data[0]['installationType'] || 'N/A';
        installationTypeOptions = data[0]['installationTypeOptions'] || 'N/A';
        dimension = data[0]['dimension'] || 'N/A';
        state = data[0]['state'] || 'N/A';
        active = data[0]['active'] || 'N/A';
        progress = data[0]['progress'] || 'N/A';
        measurementType = data[0]['measurementType'] || 'N/A';
        startTime = data[0]['startTimeMs'] || 'N/A';
        endTime = data[0]['endTimeMs'] || 'N/A';
        if (active === 'false') {
            state = 'disconnected';
        }
    }

    // finished & aborted
    if (startTime !== 'N/A' && endTime !== 'N/A') {
        deltaTime = endTime - startTime;
        timeThreshold = 3024000000; // 35 days
        if (deltaTime <= timeThreshold) {
            var newDashboardtimewindow = {
                aggregation: { limit: 100000, type: "NONE" },
                hideAggInterval: true,
                hideAggregation: true,
                hideInterval: false,
                history: {
                    historyType: 1,
                    fixedTimewindow: { startTimeMs: startTime, endTimeMs: endTime }
                },
                selectedTab: 1
            };
        } else {
            var newDashboardtimewindow = {
                aggregation: { limit: 100000, type: "NONE" },
                hideAggInterval: true,
                hideAggregation: true,
                hideInterval: false,
                history: {
                    historyType: 1,
                    fixedTimewindow: { startTimeMs: endTime - timeThreshold, endTimeMs: endTime }
                },
                selectedTab: 1
            };
        }
    }
    // active
    else if (startTime !== 'N/A' && endTime === 'N/A') {
        timeThreshold = 3024000000;
        deltaTime = (Date.now())-startTime;
        if(deltaTime>timeThreshold){
            startTime = startTime+(deltaTime-timeThreshold);
        }
        var newDashboardtimewindow = {
            aggregation: { limit: 100000, type: "NONE" },
            hideAggInterval: true,
            hideAggregation: true,
            hideInterval: false,
            history: {
                historyType: 1,
                fixedTimewindow: { startTimeMs: startTime, endTimeMs: Date.now() }
            },
            selectedTab: 1
        };
    }
    // default
    else {
        var newDashboardtimewindow = {
            aggregation: { limit: 100000, type: "NONE" },
            hideAggInterval: true,
            hideAggregation: true,
            hideInterval: false,
            history: {
                historyType: 1,
                fixedTimewindow: { startTimeMs: Date.now() - 1209600000, endTimeMs: Date.now() }
            },
            selectedTab: 1
        };
    }

    ctx.dashboard.dashboardTimewindowChangedSubject.next(newDashboardtimewindow);
    ctx.stateController.updateState(null, stateParams);

    function getStateBadge(stateValue, type) {
        var badgeClass = '';
        var icon = '';
        var label = '';
        switch (stateValue) {
            case 'in preparation':
                badgeClass = 'badge-preparation'; icon = 'schedule';
                label = '{i18n:custom.diagnostics.state-filter.preparation.title}'; break;
            case 'active':
                badgeClass = 'badge-active'; icon = 'play_circle';
                label = '{i18n:custom.diagnostics.state-filter.active.title}'; break;
            case 'finished':
                badgeClass = 'badge-finished'; icon = 'check_circle';
                label = '{i18n:custom.diagnostics.state-filter.finished.title}'; break;
            case 'aborted':
                badgeClass = 'badge-aborted'; icon = 'cancel';
                label = '{i18n:custom.diagnostics.state-filter.aborted.title}'; break;
            case 'critical':
                badgeClass = 'badge-critical'; icon = 'error';
                label = '{i18n:custom.diagnostics.alarm-severity.critical}'; break;
            case 'major':
                badgeClass = 'badge-major'; icon = 'warning';
                label = '{i18n:custom.diagnostics.alarm-severity.major}'; break;
            case 'minor':
                badgeClass = 'badge-minor'; icon = 'info';
                label = '{i18n:custom.diagnostics.alarm-severity.minor}'; break;
            case 'normal':
                badgeClass = 'badge-normal'; icon = 'check_circle';
                label = '{i18n:custom.diagnostics.alarm-severity.normal}'; break;
            case 'disconnected':
                badgeClass = 'badge-disconnected'; icon = 'link_off';
                label = '{i18n:device.inactive}'; break;
            default:
                badgeClass = 'badge-default'; icon = 'help';
                label = stateValue || 'N/A';
        }
        return '<span class="status-badge ' + badgeClass + '">' +
               '<mat-icon class="badge-icon">' + icon + '</mat-icon>' +
               '<span>' + label + '</span></span>';
    }

    function formatTimestampDisplay(timestampMs) {
        if (timestampMs === null || timestampMs === undefined || timestampMs === 'N/A') return null;
        var value = Number(timestampMs);
        if (!Number.isFinite(value) || value <= 0) return null;
        var date = new Date(value);
        function pad(n) { return n.toString().padStart(2, '0'); }
        return pad(date.getDate()) + '.' + pad(date.getMonth() + 1) + '.' + date.getFullYear() +
               ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
    }

    function getDateBadge(timestampMs, type) {
        var formatted = formatTimestampDisplay(timestampMs);
        if (!formatted) return '';
        var icon = type === 'start' ? 'play_circle' : 'stop_circle';
        var color = type === 'start' ? '#27AE60' : '#2F80ED';
        var bgColor = type === 'start' ? 'rgba(39, 174, 96, 0.12)' : 'rgba(47, 128, 237, 0.12)';
        return '<span class="status-badge" style="background:' + bgColor + '; color:' + color + ';">' +
               '<mat-icon class="badge-icon">' + icon + '</mat-icon>' +
               '<span>' + formatted + '</span></span>';
    }

    var installationBadge = '<span class="status-badge ${badgeClass}">' +
        '<mat-icon class="badge-icon">${badgeIcon}</mat-icon>' +
        '<span>{i18n:custom.diagnostics.measurement-type.${measurementTypeI18n}.title}</span></span>';

    var typeBadge = '<span class="status-badge badge-type">' +
        \`{i18n:custom.diagnostics.action.edit-measurement-parameters.installation-type-options.\${clientUtils.toKebabCase(installationTypeOptions)}.title}\` +
        '</span>';

    var displayTitle = (locationName && locationName !== 'N/A') ? locationName : name;

    var header = '<div class="measurement-header flex items-center justify-between">' +
      '<div class="flex items-center gap-3">' +
        '<button id="go-back" type="button" mat-raised-button color="primary" class="back-button">' +
          '<mat-icon>arrow_back</mat-icon><span>{i18n:action.go-back}</span></button>' +
        '<button id="measurement-switch-button" type="button" mat-button>' +
          '<span>' + displayTitle + '</span>' +
          '<mat-icon>expand_more</mat-icon>' +
        '</button>' +
      '</div>' +
      '<div class="flex flex-col items-center gap-1 flex-1">' +
        '<div class="flex items-center gap-2">' + installationBadge + typeBadge + getStateBadge(state, 'state') + '</div>' +
        '<div class="flex items-center gap-2">' + getStateBadge(progress, 'progress') + getDateBadge(startTime, 'start') + getDateBadge(endTime, 'end') + '</div>' +
      '</div>' +
      '<div class="flex items-center gap-2">' + ButtonHtml +
        '<button id="reports-button" type="button" mat-raised-button color="primary">' +
          '<mat-icon class="tb-mat-18">assessment</mat-icon><span>{i18n:custom.diagnostics.reports-btn.title}</span></button>' +
        '<button id="analysis-button" type="button" mat-raised-button color="primary">' +
          '<mat-icon class="tb-mat-18">insights</mat-icon><span>{i18n:custom.diagnostics.analysis.title}</span></button>' +
      '</div>' +
    '</div>';

    return '<div class="main-layout flex flex-col w-full h-full">' + header +
        '<div id="${wrapperId}" class="flex-1">' +
          '<tb-dashboard-state class="w-full h-full" [ctx]="ctx" [syncParentStateParams]="true" stateId="${stateId}"></tb-dashboard-state>' +
        '</div></div>';
}
`;

    return jsBody;
}

// ========== PHASE 4: Measurement Switch Button Action ==========
function createMeasurementSwitchAction() {
    // This action opens a dialog with measurement options
    const customFunction = `
let $injector = widgetContext.$scope.$injector;
let assetService = $injector.get(widgetContext.servicesMap.get('assetService'));
let attributeService = $injector.get(widgetContext.servicesMap.get('attributeService'));
let customDialog = $injector.get(widgetContext.servicesMap.get('customDialog'));
let translate = $injector.get(widgetContext.servicesMap.get('translate'));

var currentMeasurementId = entityId.id;

// Find project first
var projectAssetQuery = {
    "parameters": {
        "rootId": entityId.id,
        "rootType": "ASSET",
        "direction": "TO",
        "relationTypeGroup": "COMMON",
        "maxLevel": 1
    },
    "relationType": "Owns",
    "assetTypes": ["Project"]
};

assetService.findByQuery(projectAssetQuery).subscribe(function(projects) {
    if (!projects || projects.length === 0) {
        console.error("No project found");
        return;
    }
    var projectId = projects[0].id.id || projects[0].id;

    // Find all measurements in project
    var measurementAssetsQuery = {
        "parameters": {
            "rootId": projectId,
            "rootType": "ASSET",
            "direction": "FROM",
            "relationTypeGroup": "COMMON",
            "maxLevel": 1
        },
        "relationType": "Owns",
        "assetTypes": ["Measurement"]
    };

    assetService.findByQuery(measurementAssetsQuery).subscribe(function(measurements) {
        // Filter out current measurement and sort
        var otherMeasurements = measurements
            .filter(function(m) {
                var mId = m.id.id || m.id;
                return mId !== currentMeasurementId;
            })
            .sort(function(a, b) {
                var aMatch = (a.name || '').match(/(\\d+)$/);
                var bMatch = (b.name || '').match(/(\\d+)$/);
                return (aMatch ? parseInt(aMatch[1]) : 0) - (bMatch ? parseInt(bMatch[1]) : 0);
            });

        if (otherMeasurements.length === 0) {
            // Show "no other measurements" message
            customDialog.customDialog(
                '<div style="padding: 24px; text-align: center;">' +
                    '<mat-icon style="font-size: 48px; color: #9e9e9e;">info</mat-icon>' +
                    '<p style="margin-top: 16px; color: #666;">{i18n:custom.diagnostics.no-other-measurements}</p>' +
                '</div>',
                { controller: function($scope, dialogRef) { $scope.dialogRef = dialogRef; } }
            );
            return;
        }

        // Fetch locationName for each measurement
        var measurementPromises = otherMeasurements.map(function(m) {
            return new Promise(function(resolve) {
                attributeService.getEntityAttributes(m.id, 'SERVER_SCOPE', ['locationName', 'installationType', 'measurementType'])
                    .subscribe(function(attrs) {
                        var locAttr = attrs.find(function(a) { return a.key === 'locationName'; });
                        var instAttr = attrs.find(function(a) { return a.key === 'installationType'; });
                        var measAttr = attrs.find(function(a) { return a.key === 'measurementType'; });
                        resolve({
                            id: m.id.id || m.id,
                            entityId: m.id,
                            name: m.name,
                            label: m.label || m.name,
                            locationName: locAttr ? locAttr.value : null,
                            installationType: instAttr ? instAttr.value : null,
                            measurementType: measAttr ? measAttr.value : null
                        });
                    }, function() {
                        resolve({
                            id: m.id.id || m.id,
                            entityId: m.id,
                            name: m.name,
                            label: m.label || m.name,
                            locationName: null,
                            installationType: null,
                            measurementType: null
                        });
                    });
            });
        });

        Promise.all(measurementPromises).then(function(enrichedMeasurements) {
            // Build dialog HTML
            var optionsHtml = enrichedMeasurements.map(function(m) {
                var primaryText = m.locationName || m.label || m.name;
                var secondaryText = m.name;
                return '<div class="measurement-option" data-id="' + m.id + '" ' +
                       'data-inst="' + (m.installationType || '') + '" ' +
                       'data-meas="' + (m.measurementType || '') + '" ' +
                       'data-name="' + (m.name || '') + '" ' +
                       'data-label="' + (m.label || m.name || '') + '">' +
                       '<span class="primary">' + primaryText + '</span>' +
                       '<span class="secondary">' + secondaryText + '</span>' +
                       '</div>';
            }).join('');

            var dialogHtml =
                '<mat-toolbar color="primary" class="flex items-center">' +
                    '<mat-icon style="margin-right: 12px;">swap_horiz</mat-icon>' +
                    '<h2 style="margin: 0; font-size: 18px; flex: 1;">{i18n:custom.diagnostics.select-measurement}</h2>' +
                    '<button mat-icon-button (click)="dialogRef.close()"><mat-icon>close</mat-icon></button>' +
                '</mat-toolbar>' +
                '<div class="measurement-list">' + optionsHtml + '</div>';

            var dialogCss =
                '.measurement-list { max-height: 400px; overflow-y: auto; }' +
                '.measurement-option { display: flex; flex-direction: column; padding: 16px 20px; cursor: pointer; border-bottom: 1px solid #f0f0f0; transition: background 0.15s; }' +
                '.measurement-option:hover { background: #f5f5f5; }' +
                '.measurement-option:active { background: #eeeeee; }' +
                '.measurement-option .primary { font-size: 15px; font-weight: 500; color: #28232D; margin-bottom: 4px; }' +
                '.measurement-option .secondary { font-size: 13px; color: #757575; }';

            customDialog.customDialog(dialogHtml, {
                controller: function($scope, dialogRef) {
                    $scope.dialogRef = dialogRef;

                    setTimeout(function() {
                        var options = document.querySelectorAll('.measurement-option');
                        options.forEach(function(opt) {
                            opt.addEventListener('click', function() {
                                var selectedId = this.getAttribute('data-id');
                                var instType = this.getAttribute('data-inst');
                                var measType = this.getAttribute('data-meas');
                                var mName = this.getAttribute('data-name');
                                var mLabel = this.getAttribute('data-label');

                                dialogRef.close();

                                // Determine target state
                                var stateId;
                                if (measType === 'loraWan') {
                                    stateId = 'measurement_details';
                                } else if (measType === 'ultrasonic' && instType === 'heating') {
                                    stateId = 'measurement_details_heating_full';
                                } else if (measType === 'ultrasonic' && instType === 'cooling') {
                                    stateId = 'measurement_details_cooling_full';
                                } else {
                                    stateId = 'measurement_details_heating_full';
                                }

                                // Navigate to selected measurement
                                var updatedMeasurement = {
                                    entityId: { id: selectedId, entityType: "ASSET" },
                                    entityName: mName,
                                    entityLabel: mLabel
                                };
                                var params = widgetContext.stateController.getStateParams() || {};
                                params['selectedMeasurement'] = updatedMeasurement;
                                params['targetEntityParamName'] = "selectedMeasurement";
                                params['_ts'] = new Date().getTime();
                                widgetContext.stateController.updateState(stateId, params);
                            });
                        });
                    }, 100);
                },
                styles: dialogCss
            });
        });
    });
});
`;

    return {
        name: "measurement-switch-button",
        icon: "swap_horiz",
        type: "custom",
        customFunction: customFunction,
        openInSeparateDialog: false,
        openInPopover: false,
        id: require('crypto').randomUUID()
    };
}

// ========== PHASE 5: Analysis Button Action ==========
function createAnalysisButtonAction() {
    return {
        name: "analysis-button",
        icon: "insights",
        type: "customPretty",
        customHtml: '<div style="width: 400px;"><mat-toolbar class="flex items-center" color="primary"><mat-icon style="margin-right: 12px;">insights</mat-icon><h2 style="margin: 0; font-size: 18px;">{i18n:custom.diagnostics.analysis.title}</h2><span class="flex-1"></span><button mat-icon-button (click)="dialogRef.close()"><mat-icon>close</mat-icon></button></mat-toolbar><div class="p-4"><p style="color: #666;">{i18n:custom.diagnostics.analysis.placeholder}</p></div></div>',
        customCss: "",
        customFunction: "",
        customResources: [],
        openInSeparateDialog: false,
        openInPopover: false,
        id: require('crypto').randomUUID()
    };
}

// ========== Main Update Function ==========
function updateDashboard() {
    console.log('\n=== Phase 2-5: Updating dashboard ===');

    const dashboardFile = path.join(BASE_DIR, 'dashboards/measurements.json');
    const dashboard = JSON.parse(fs.readFileSync(dashboardFile, 'utf8'));

    // Widgets are defined at configuration.widgets level
    function findAndUpdateWidget(widgetId, installationType, stateId) {
        const widgets = dashboard.configuration.widgets;
        if (widgets && widgets[widgetId]) {
            const widget = widgets[widgetId];

            // Update CSS - remove old styles and add new ones
            let existingCss = widget.config.settings.markdownCss || '';
            // Remove old dropdown-related CSS
            existingCss = existingCss.replace(/\/\* Back Button \*\/[\s\S]*?\/\* Date Badge \*\/[\s\S]*?\}/g, '');
            existingCss = existingCss.replace(/\.measurement-dropdown[\s\S]*?\}/g, '');
            existingCss = existingCss.replace(/\.measurement-chip[\s\S]*?\}/g, '');
            if (!existingCss.includes('#measurement-switch-button')) {
                widget.config.settings.markdownCss = existingCss + NEW_CSS_ADDITIONS;
                console.log(`Updated CSS for ${installationType} widget`);
            }

            // Update JavaScript
            widget.config.settings.markdownTextFunction.body = createNewJavaScriptBody(installationType, stateId);
            console.log(`Updated JavaScript for ${installationType} widget`);

            // Update actions
            const actions = widget.config.actions.elementClick || [];

            // Remove old measurement-related actions and add new one
            const filteredActions = actions.filter(a =>
                a.name !== 'measurement-switch-button' &&
                a.name !== 'analysis-button'
            );

            filteredActions.push(createMeasurementSwitchAction());
            filteredActions.push(createAnalysisButtonAction());

            widget.config.actions.elementClick = filteredActions;
            console.log(`Updated actions for ${installationType} widget`);

            return true;
        }
        return false;
    }

    // Update both widgets
    const heatingUpdated = findAndUpdateWidget(HEATING_WIDGET_ID, 'heating', 'measurement_data_heating');
    const coolingUpdated = findAndUpdateWidget(COOLING_WIDGET_ID, 'cooling', 'measurement_data_cooling');

    if (!heatingUpdated) console.error('Heating widget not found!');
    if (!coolingUpdated) console.error('Cooling widget not found!');

    // Save dashboard
    fs.writeFileSync(dashboardFile, JSON.stringify(dashboard, null, 2));
    console.log('\nDashboard saved');
}

// ========== Run ==========
function main() {
    console.log('=== Measurements Dashboard Header Redesign V3 ===');
    console.log('Solution: Button opens ThingsBoard dialog for measurement switching');

    try {
        updateTranslations();
        updateDashboard();
        console.log('\n=== All updates completed successfully ===');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
