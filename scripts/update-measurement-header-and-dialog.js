/**
 * Update Measurement Header Layout and Dialog Styling
 *
 * Changes:
 * 1. Header: Icon-only button + formatted text (locationName + entityName)
 * 2. Dialog: Margin from edges, items without gap (touch edges)
 */

const fs = require('fs');
const crypto = require('crypto');

const DASHBOARD_PATH = 'dashboards/measurements.json';
const WIDGET_IDS = {
    heating: '6ccd99bd-8562-4e6b-e42b-e7f3c026a129',
    cooling: 'f0dfbf6c-c2b0-2975-eb81-df9748cae9a5'
};

// ========================================
// DIALOG HTML - with margin and edge-to-edge items
// ========================================
const customHtml = `
<div class="measurement-switch-dialog">
    <mat-toolbar class="dialog-header" color="primary">
        <div class="flex items-center gap-2">
            <mat-icon>swap_horiz</mat-icon>
            <h2 class="dialog-title">{{ 'custom.diagnostics.action.measurement-switch.title' | translate }}</h2>
        </div>
        <span class="flex-1"></span>
        <button mat-icon-button (click)="cancel()" type="button">
            <mat-icon>close</mat-icon>
        </button>
    </mat-toolbar>

    <div class="dialog-content">
        <div *ngIf="loading" class="loading-container">
            <mat-spinner diameter="40"></mat-spinner>
        </div>

        <div *ngIf="!loading && measurements.length === 0" class="empty-message">
            {{ 'custom.diagnostics.action.measurement-switch.no-measurements' | translate }}
        </div>

        <div *ngIf="!loading" class="measurement-list">
            <div *ngFor="let m of measurements"
                 class="measurement-item"
                 [class.current]="m.isCurrent"
                 (click)="selectMeasurement(m)">

                <div class="measurement-info">
                    <div class="measurement-location">{{ m.locationName || m.entityLabel || 'N/A' }}</div>
                    <div class="measurement-name">{{ m.entityName }}</div>
                </div>

                <div class="measurement-badges">
                    <span class="badge badge-type" [ngClass]="'badge-' + m.measurementType">
                        {{ m.measurementTypeLabel }}
                    </span>
                    <span class="badge badge-progress" [ngClass]="'badge-' + m.progress">
                        {{ m.progressLabel }}
                    </span>
                </div>

                <mat-icon *ngIf="m.isCurrent" class="current-indicator">check_circle</mat-icon>
            </div>
        </div>
    </div>
</div>
`;

// ========================================
// DIALOG CSS - edge-to-edge items, dialog margin
// ========================================
const customCss = `
.measurement-switch-dialog {
    width: 450px;
    max-height: 70vh;
    display: flex;
    flex-direction: column;
    font-family: Roboto, sans-serif;
    border-radius: 8px;
    overflow: hidden;
}

.dialog-header {
    display: flex;
    align-items: center;
    padding: 0 8px 0 16px;
    min-height: 52px;
}

.dialog-title {
    margin: 0;
    font-size: 17px;
    font-weight: 500;
}

.dialog-content {
    flex: 1;
    overflow-y: auto;
    padding: 0; /* No padding - items touch edges */
}

.loading-container {
    display: flex;
    justify-content: center;
    padding: 32px;
}

.empty-message {
    text-align: center;
    padding: 32px 16px;
    color: #666;
}

.measurement-list {
    display: flex;
    flex-direction: column;
}

.measurement-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
    cursor: pointer;
    transition: background-color 0.15s ease;
    border-bottom: 1px solid #f0f0f0;
}

.measurement-item:last-child {
    border-bottom: none;
}

.measurement-item:hover {
    background: #f5f5f5;
}

.measurement-item.current {
    background: rgba(33, 150, 243, 0.08);
    cursor: default;
}

.measurement-item.current:hover {
    background: rgba(33, 150, 243, 0.08);
}

.measurement-info {
    flex: 1;
    min-width: 0;
}

.measurement-location {
    font-size: 15px;
    font-weight: 500;
    color: #212529;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.measurement-name {
    font-size: 12px;
    color: #6c757d;
    margin-top: 2px;
}

.measurement-badges {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
}

.badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
}

.badge-ultrasonic {
    background: #e8f5e9;
    color: #2e7d32;
}

.badge-import {
    background: #fff3e0;
    color: #ef6c00;
}

.badge-lorawan {
    background: #f3e5f5;
    color: #7b1fa2;
}

.badge-progress {
    background: #f5f5f5;
    color: #616161;
}

.badge-in-preparation, .badge-in_preparation {
    background: #fff8e1;
    color: #f9a825;
}

.badge-active {
    background: #e8f5e9;
    color: #2e7d32;
}

.badge-finished {
    background: #e3f2fd;
    color: #1565c0;
}

.badge-aborted {
    background: #ffebee;
    color: #c62828;
}

.current-indicator {
    color: #2196F3;
    font-size: 20px !important;
    width: 20px !important;
    height: 20px !important;
}
`;

// ========================================
// DIALOG JavaScript
// ========================================
const customFunction = `
let $injector = widgetContext.$scope.$injector;
const {
    customDialog,
    attributeService,
    assetService,
    entityRelationService,
} = [
    'customDialog',
    'attributeService',
    'assetService',
    'entityRelationService',
].reduce((services, name) => {
    services[name] = $injector.get(widgetContext.servicesMap.get(name));
    return services;
}, {});

const currentMeasurementId = entityId;
const stateController = widgetContext.stateController;

const currentStateName = stateController.getStateId();
const isHeating = currentStateName.includes('heating');

findProjectAndMeasurements();

function findProjectAndMeasurements() {
    entityRelationService.findByTo(currentMeasurementId).subscribe(
        (relations) => {
            const projectRelations = (relations || []).filter(
                (r) => r.from && r.from.entityType === 'ASSET'
            );

            if (projectRelations.length > 0) {
                const projectEntityId = projectRelations[0].from;
                findMeasurementsInProject(projectEntityId);
            } else {
                openDialog([]);
            }
        },
        (error) => {
            console.error('Error finding project relations:', error);
            openDialog([]);
        }
    );
}

function findMeasurementsInProject(projectEntityId) {
    entityRelationService.findByFrom(projectEntityId).subscribe(
        (relations) => {
            const measurementRelations = (relations || []).filter(
                (r) => r.to && r.to.entityType === 'ASSET'
            );

            if (measurementRelations.length === 0) {
                openDialog([]);
                return;
            }

            const measurementEntityIds = measurementRelations.map(r => r.to);
            fetchMeasurementDetails(measurementEntityIds);
        },
        (error) => {
            console.error('Error finding measurements:', error);
            openDialog([]);
        }
    );
}

function fetchMeasurementDetails(measurementEntityIds) {
    const measurements = [];
    let completed = 0;

    measurementEntityIds.forEach((entityId) => {
        assetService.getAsset(entityId.id).subscribe(
            (asset) => {
                measurements.push(asset);
                completed++;
                if (completed === measurementEntityIds.length) {
                    fetchMeasurementAttributes(measurements);
                }
            },
            (error) => {
                console.error('Error fetching asset:', entityId.id, error);
                completed++;
                if (completed === measurementEntityIds.length) {
                    fetchMeasurementAttributes(measurements);
                }
            }
        );
    });
}

function fetchMeasurementAttributes(measurements) {
    if (!measurements || measurements.length === 0) {
        openDialog([]);
        return;
    }

    const attributeKeys = ['locationName', 'measurementType', 'progress'];
    let completed = 0;
    const measurementData = [];

    measurements.forEach((m) => {
        attributeService.getEntityAttributes(m.id, 'SERVER_SCOPE', attributeKeys).subscribe(
            (attrs) => {
                const attrMap = {};
                attrs.forEach((a) => { attrMap[a.key] = a.value; });

                const mType = attrMap.measurementType || '';
                if (mType === 'import' || mType === 'ultrasonic' || mType === 'lorawan') {
                    measurementData.push({
                        id: m.id,
                        entityName: m.name,
                        entityLabel: m.label,
                        locationName: attrMap.locationName,
                        measurementType: mType,
                        progress: attrMap.progress || 'in preparation',
                        isCurrent: m.id.id === currentMeasurementId.id,
                    });
                }

                completed++;
                if (completed === measurements.length) {
                    measurementData.sort((a, b) => {
                        const aMatch = (a.entityName || '').match(/(\\d+)$/);
                        const bMatch = (b.entityName || '').match(/(\\d+)$/);
                        return (aMatch ? parseInt(aMatch[1]) : 0) - (bMatch ? parseInt(bMatch[1]) : 0);
                    });
                    openDialog(measurementData);
                }
            },
            (error) => {
                console.error('Error fetching attributes for', m.id, error);
                completed++;
                if (completed === measurements.length) {
                    openDialog(measurementData);
                }
            }
        );
    });
}

function openDialog(measurements) {
    customDialog.customDialog(htmlTemplate, MeasurementSwitchController, {
        measurements,
        currentMeasurementId,
        isHeating,
        stateController,
    }).subscribe();
}

function MeasurementSwitchController(instance) {
    const vm = instance;
    const { measurements, currentMeasurementId, isHeating, stateController } = vm.data;

    vm.loading = false;
    vm.measurements = measurements.map((m) => ({
        ...m,
        measurementTypeLabel: getMeasurementTypeLabel(m.measurementType),
        progressLabel: getProgressLabel(m.progress),
    }));

    function getMeasurementTypeLabel(type) {
        const labels = {
            'ultrasonic': 'Ultrasonic',
            'import': 'Import',
            'lorawan': 'LoRaWAN',
        };
        return labels[type] || type;
    }

    function getProgressLabel(progress) {
        const labels = {
            'in preparation': 'In Vorbereitung',
            'in_preparation': 'In Vorbereitung',
            'active': 'Aktiv',
            'finished': 'Abgeschlossen',
            'aborted': 'Abgebrochen',
        };
        return labels[progress] || progress;
    }

    vm.cancel = function() {
        vm.dialogRef.close(null);
    };

    vm.selectMeasurement = function(measurement) {
        if (measurement.isCurrent) {
            return;
        }

        // Update current state params instead of pushing new state
        const newParams = {
            selectedMeasurement: {
                entityId: measurement.id,
                entityName: measurement.entityName,
                entityLabel: measurement.entityLabel || measurement.entityName,
            }
        };

        // Use updateState to replace params without adding to state stack
        stateController.updateState(null, newParams);

        vm.dialogRef.close(null);
    };
}
`;

// ========================================
// Update Dashboard
// ========================================
function updateDashboard() {
    console.log('Reading dashboard...');
    const dashboard = JSON.parse(fs.readFileSync(DASHBOARD_PATH, 'utf8'));

    for (const [type, widgetId] of Object.entries(WIDGET_IDS)) {
        console.log(`\nUpdating ${type} widget (${widgetId})...`);

        const widget = dashboard.configuration.widgets[widgetId];
        if (!widget) {
            console.error(`Widget ${widgetId} not found!`);
            continue;
        }

        // ========================================
        // 1. Update the action (dialog styling)
        // ========================================
        if (!widget.config.actions) {
            widget.config.actions = {};
        }
        if (!widget.config.actions.elementClick) {
            widget.config.actions.elementClick = [];
        }

        const actions = widget.config.actions.elementClick;
        const existingIndex = actions.findIndex(a => a.name === 'measurement-switch-button');

        const newAction = {
            name: 'measurement-switch-button',
            icon: 'swap_horiz',
            useShowWidgetActionFunction: false,
            showWidgetActionFunction: '',
            type: 'customPretty',
            customHtml: customHtml.trim(),
            customCss: customCss.trim(),
            customFunction: customFunction.trim(),
            customResources: [],
            openInSeparateDialog: false,
            openInPopover: false,
            id: existingIndex !== -1 ? actions[existingIndex].id : crypto.randomUUID()
        };

        if (existingIndex !== -1) {
            console.log(`  Replacing action at index ${existingIndex}`);
            actions[existingIndex] = newAction;
        } else {
            console.log('  Adding new action');
            actions.push(newAction);
        }

        // ========================================
        // 2. Update the header layout in markdownTextFunction
        // ========================================
        const fn = widget.config.settings.markdownTextFunction;
        if (fn && fn.body) {
            console.log('  Updating header layout in markdownTextFunction...');

            const newButtonHtml = `'<button id="measurement-switch-button" type="button" mat-raised-button class="switch-btn">' +
          '<mat-icon>swap_horiz</mat-icon>' +
        '</button>' +
        '<div class="measurement-title-block">' +
          '<span class="measurement-location-text">' + ((locationName && locationName !== 'N/A') ? locationName : label) + '</span>' +
          '<span class="measurement-name-text">' + name + '</span>' +
        '</div>'`;

            // Check if already updated (contains the new structure)
            if (fn.body.includes('measurement-title-block')) {
                console.log('  ✓ Header already updated (skipping)');
            } else {
                // Find the old button pattern (original: mat-button with text + expand_more)
                const oldPatternStart = "'<button id=\"measurement-switch-button\" type=\"button\" mat-button>'";
                const startIdx = fn.body.indexOf(oldPatternStart);

                if (startIdx !== -1) {
                    // Find the end of the button (</button>')
                    const endMarker = "</button>'";
                    const endIdx = fn.body.indexOf(endMarker, startIdx);
                    if (endIdx !== -1) {
                        const oldPart = fn.body.substring(startIdx, endIdx + endMarker.length);
                        fn.body = fn.body.replace(oldPart, newButtonHtml);
                        console.log('  ✓ Header button replaced');
                    } else {
                        console.log('  ⚠ Could not find button end marker');
                    }
                } else {
                    console.log('  ⚠ Could not find old button pattern');
                }
            }

            // Add CSS for the new layout to markdownCss
            const newCss = `
/* Measurement Switch Button */
.switch-btn {
    min-width: 44px !important;
    width: 44px !important;
    height: 40px !important;
    padding: 0 !important;
    border-radius: 8px !important;
}
.switch-btn mat-icon {
    margin: 0 !important;
}

/* Measurement Title Block */
.measurement-title-block {
    display: flex;
    flex-direction: column;
    gap: 0;
    min-width: 0;
}
.measurement-location-text {
    font-size: 16px;
    font-weight: 600;
    color: #212121;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
}
.measurement-name-text {
    font-size: 12px;
    color: #757575;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
}
`;
            // Append to markdownCss if it exists
            if (widget.config.settings.markdownCss) {
                // Check if our CSS is already there
                if (!widget.config.settings.markdownCss.includes('.switch-btn')) {
                    widget.config.settings.markdownCss += newCss;
                    console.log('  ✓ CSS added to markdownCss');
                } else {
                    console.log('  CSS already exists');
                }
            } else {
                widget.config.settings.markdownCss = newCss;
                console.log('  ✓ markdownCss created with new CSS');
            }
        }
    }

    console.log('\nSaving dashboard...');
    fs.writeFileSync(DASHBOARD_PATH, JSON.stringify(dashboard, null, 2));
    console.log('Done!');
}

updateDashboard();
