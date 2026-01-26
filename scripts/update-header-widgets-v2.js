#!/usr/bin/env node
/**
 * Script to update Measurements Dashboard Header Widgets - V2
 * Fixes:
 * 1. Alarm severity translations - use custom keys
 * 2. Chip dropdown - use native select with CSS styling
 * 3. Raised buttons for reports and analysis
 *
 * Note: This widget code runs in ThingsBoard's trusted environment.
 * The DOM manipulation follows existing ThingsBoard widget patterns.
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

/* Custom Measurement Dropdown */
.measurement-dropdown-wrapper {
    position: relative;
    display: inline-block;
}

.measurement-dropdown-trigger {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 36px;
    padding: 0 12px;
    background: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: #28232D;
    transition: all 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    min-width: 140px;
    max-width: 280px;
}

.measurement-dropdown-trigger:hover {
    background: #f5f5f5;
    border-color: #bdbdbd;
    box-shadow: 0 2px 4px rgba(0,0,0,0.12);
}

.measurement-dropdown-trigger.open {
    border-color: var(--tb-primary-500);
    box-shadow: 0 0 0 2px rgba(var(--tb-primary-500-rgb), 0.2);
}

.measurement-dropdown-trigger .trigger-text {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.measurement-dropdown-trigger .trigger-icon {
    font-size: 20px !important;
    color: #757575;
    transition: transform 0.2s;
}

.measurement-dropdown-trigger.open .trigger-icon {
    transform: rotate(180deg);
}

.measurement-dropdown-menu {
    display: none;
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    z-index: 1000;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    min-width: 280px;
    max-width: 400px;
    max-height: 320px;
    overflow-y: auto;
    border: 1px solid #e0e0e0;
}

.measurement-dropdown-menu.visible {
    display: block;
    animation: dropdownFadeIn 0.15s ease-out;
}

@keyframes dropdownFadeIn {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
}

.measurement-dropdown-menu .menu-header {
    padding: 12px 16px;
    font-size: 12px;
    font-weight: 600;
    color: #757575;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #f0f0f0;
    background: #fafafa;
}

.measurement-dropdown-option {
    display: flex;
    flex-direction: column;
    padding: 12px 16px;
    cursor: pointer;
    border-bottom: 1px solid #f5f5f5;
    transition: background 0.15s;
}

.measurement-dropdown-option:last-child {
    border-bottom: none;
}

.measurement-dropdown-option:hover {
    background: #f5f5f5;
}

.measurement-dropdown-option:active {
    background: #eeeeee;
}

.measurement-dropdown-option .option-primary {
    font-size: 14px;
    font-weight: 500;
    color: #28232D;
    margin-bottom: 2px;
}

.measurement-dropdown-option .option-secondary {
    font-size: 12px;
    color: #757575;
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

    // The dropdown HTML is built from trusted internal data (measurement names from DB)
    // and inserted into the widget's own container - this follows existing TB patterns
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

    var projectAssetQuery = {
        "parameters": {
            "rootId": entityId,
            "rootType": "ASSET",
            "direction": "TO",
            "relationTypeGroup": "COMMON",
            "maxLevel": 1073741824,
            "fetchLastLevelOnly": false
        },
        "relationType": "Owns",
        "assetTypes": ["Project"]
    };

    assetService.findByQuery(projectAssetQuery).subscribe(
        function(projects) {
            if (projects && projects.length > 0) {
                var projectId = projects[0].id.id || projects[0].id;
                var measurementAssetsQuery = {
                    "parameters": {
                        "rootId": projectId,
                        "rootType": "ASSET",
                        "direction": "FROM",
                        "relationTypeGroup": "COMMON",
                        "maxLevel": 1073741824,
                        "fetchLastLevelOnly": false
                    },
                    "relationType": "Owns",
                    "assetTypes": ["Measurement"]
                };

                assetService.findByQuery(measurementAssetsQuery).subscribe(
                    function(measurements) {
                        var dropdownHtml = buildMeasurementDropdown(measurements);
                        var container = document.getElementById("measurement-dropdown-container");
                        if (container) {
                            while (container.firstChild) {
                                container.removeChild(container.firstChild);
                            }
                            var wrapper = document.createElement('div');
                            wrapper.innerHTML = dropdownHtml;
                            while (wrapper.firstChild) {
                                container.appendChild(wrapper.firstChild);
                            }
                            setupDropdownEventListeners();
                        }
                    },
                    function(error) {
                        console.error("Error fetching measurements:", error);
                    }
                );
            }
        },
        function(error) {
            console.error("Error fetching project:", error);
        }
    );

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

    // Dropdown-related variable and functions must be defined BEFORE the return statement
    var measurementData = [];

    function buildMeasurementDropdown(measurements) {
        measurementData = measurements;
        var currentMeasurementId = null;
        var stateParams = ctx.stateController.getStateParams();
        if (stateParams && stateParams.selectedMeasurement) {
            currentMeasurementId = stateParams.selectedMeasurement.entityId.id || stateParams.selectedMeasurement.entityId;
        }
        var sortedMeasurements = measurements
            .filter(function(m) { var mId = m.id.id || m.id; return mId !== currentMeasurementId; })
            .sort(function(a, b) {
                var aMatch = (a.entityName || a.name || '').match(/(\\d+)$/);
                var bMatch = (b.entityName || b.name || '').match(/(\\d+)$/);
                return (aMatch ? parseInt(aMatch[1]) : 0) - (bMatch ? parseInt(bMatch[1]) : 0);
            });

        // Current measurement title
        var currentTitle = (locationName && locationName !== 'N/A') ? locationName : (label && label !== 'N/A' ? label : name);

        // Build custom dropdown HTML
        var dropdownHtml = '<div class="measurement-dropdown-wrapper">' +
            '<div class="measurement-dropdown-trigger" id="measurement-dropdown-trigger">' +
                '<span class="trigger-text">' + currentTitle + '</span>' +
                '<mat-icon class="trigger-icon">expand_more</mat-icon>' +
            '</div>' +
            '<div class="measurement-dropdown-menu" id="measurement-dropdown-menu">' +
                '<div class="menu-header">{i18n:custom.diagnostics.action.measurement-administration.title}</div>';

        sortedMeasurements.forEach(function(m) {
            var mId = m.id.id || m.id;
            var optionId = "measurement-option-" + mId;
            var entityName = m.entityName || m.name || mId;
            dropdownHtml += '<div class="measurement-dropdown-option" data-measurement-id="' + mId + '" id="' + optionId + '">' +
                '<span class="option-primary">...</span>' +
                '<span class="option-secondary">' + entityName + '</span>' +
            '</div>';

            // Fetch locationName async
            attributeService.getEntityAttributes(m.id, 'SERVER_SCOPE', ['locationName'])
                .subscribe(function(attrs) {
                    var locAttr = attrs.find(function(a) { return a.key === 'locationName'; });
                    var displayLabel = (locAttr && locAttr.value) ? locAttr.value : entityName;
                    var optionEl = document.getElementById(optionId);
                    if (optionEl) {
                        var primaryEl = optionEl.querySelector('.option-primary');
                        if (primaryEl) primaryEl.textContent = displayLabel;
                    }
                });
        });

        dropdownHtml += '</div></div>';
        return dropdownHtml;
    }

    function setupDropdownEventListeners() {
        var trigger = document.getElementById('measurement-dropdown-trigger');
        var menu = document.getElementById('measurement-dropdown-menu');
        if (!trigger || !menu) return;

        trigger.addEventListener('click', function(e) {
            e.stopPropagation();
            trigger.classList.toggle('open');
            menu.classList.toggle('visible');
        });

        document.addEventListener('click', function(e) {
            if (!trigger.contains(e.target) && !menu.contains(e.target)) {
                trigger.classList.remove('open');
                menu.classList.remove('visible');
            }
        });

        menu.querySelectorAll('.measurement-dropdown-option').forEach(function(opt) {
            opt.addEventListener('click', function() {
                trigger.classList.remove('open');
                menu.classList.remove('visible');
                onMeasurementChange(this.getAttribute('data-measurement-id'));
            });
        });
    }

    function onMeasurementChange(selectedMeasurementId) {
        if (!selectedMeasurementId) return;
        var selectedMeasurement = measurementData.find(function(m) {
            var mId = m.id.id || m.id;
            return mId === selectedMeasurementId;
        });
        if (!selectedMeasurement) {
            console.error("Measurement object not found for id:", selectedMeasurementId);
            return;
        }
        attributeService.getEntityAttributes(selectedMeasurement.id, 'SERVER_SCOPE', ['installationType', 'measurementType'])
          .subscribe(
              function(attributes) {
                  var installationTypeAttr = attributes.find(function(attr) { return attr.key === 'installationType'; });
                  var measurementTypeAttr = attributes.find(function(attr) { return attr.key === 'measurementType'; });
                  var instType = installationTypeAttr ? installationTypeAttr.value : null;
                  var measType = measurementTypeAttr ? measurementTypeAttr.value : null;
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
                  var updatedMeasurement = {
                      entityId: { id: selectedMeasurement.id.id || selectedMeasurement.id, entityType: "ASSET" },
                      entityName: selectedMeasurement.entityName || selectedMeasurement.name,
                      entityLabel: selectedMeasurement.entityLabel || selectedMeasurement.label || (selectedMeasurement.entityName || selectedMeasurement.name)
                  };
                  var params = ctx.stateController.getStateParams() || {};
                  params['selectedMeasurement'] = updatedMeasurement;
                  params['targetEntityParamName'] = "selectedMeasurement";
                  params['_ts'] = new Date().getTime();
                  ctx.stateController.updateState(stateId, params);
              },
              function(error) { console.error("Error fetching attributes for measurement:", error); }
          );
    }

    var header = '<div class="measurement-header flex items-center justify-between">' +
      '<div class="flex items-center gap-3">' +
        '<button id="go-back" type="button" mat-raised-button color="primary" class="back-button">' +
          '<mat-icon>arrow_back</mat-icon><span>{i18n:action.go-back}</span></button>' +
        '<div id="measurement-dropdown-container"></div>' +
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

// ========== PHASE 4: Analysis Button Action ==========
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
    console.log('\n=== Phase 2-4: Updating dashboard ===');

    const dashboardFile = path.join(BASE_DIR, 'dashboards/measurements.json');
    const dashboard = JSON.parse(fs.readFileSync(dashboardFile, 'utf8'));

    // Widgets are defined at configuration.widgets level
    function findAndUpdateWidget(widgetId, installationType, stateId) {
        const widgets = dashboard.configuration.widgets;
        if (widgets && widgets[widgetId]) {
            const widget = widgets[widgetId];

            // Update CSS - replace with new styles (remove old chip styles if present)
            let existingCss = widget.config.settings.markdownCss || '';
            // Remove old chip-related CSS if it exists
            existingCss = existingCss.replace(/\/\* Back Button \*\/[\s\S]*?\/\* Date Badge \*\/[\s\S]*?\}/g, '');
            existingCss = existingCss.replace(/\.measurement-chip-wrapper[\s\S]*?\.measurement-chip-option[\s\S]*?\}/g, '');
            if (!existingCss.includes('#measurement-dropdown {')) {
                widget.config.settings.markdownCss = existingCss + NEW_CSS_ADDITIONS;
                console.log(`Updated CSS for ${installationType} widget`);
            }

            // Update JavaScript
            widget.config.settings.markdownTextFunction.body = createNewJavaScriptBody(installationType, stateId);
            console.log(`Updated JavaScript for ${installationType} widget`);

            // Add/Update Analysis button action
            const actions = widget.config.actions.elementClick || [];
            const analysisActionIndex = actions.findIndex(a => a.name === 'analysis-button');
            if (analysisActionIndex === -1) {
                actions.push(createAnalysisButtonAction());
            }
            widget.config.actions.elementClick = actions;
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
    console.log('=== Measurements Dashboard Header Redesign V2 ===');
    console.log('Fixes: alarm severity i18n, native dropdown, raised buttons');

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
