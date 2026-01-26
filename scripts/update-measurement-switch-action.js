/**
 * Update Measurement Switch Button Action
 *
 * Creates a customPretty action that shows a popover/dialog
 * with a list of measurements from the same project.
 *
 * Shows: locationName (or entityLabel), entityName, progress, measurementType
 * Filter: only measurementType = import, ultrasonic, or lorawan (NOT interpolation)
 */

const fs = require('fs');
const crypto = require('crypto');

const DASHBOARD_PATH = 'dashboards/measurements.json';
const WIDGET_IDS = {
    heating: '6ccd99bd-8562-4e6b-e42b-e7f3c026a129',
    cooling: 'f0dfbf6c-c2b0-2975-eb81-df9748cae9a5'
};

// HTML Template for the measurement selection dialog
const customHtml = `
<div class="measurement-switch-dialog" style="width: 420px; max-height: 80vh; display: flex; flex-direction: column;">
    <mat-toolbar class="flex items-center justify-between bg-primary text-white px-4" color="primary">
        <div class="flex items-center gap-2">
            <mat-icon>swap_horiz</mat-icon>
            <h2 class="text-lg font-semibold m-0">{{ 'custom.diagnostics.action.measurement-switch.title' | translate }}</h2>
        </div>
        <button mat-icon-button (click)="cancel()" type="button">
            <mat-icon>close</mat-icon>
        </button>
    </mat-toolbar>

    <div class="p-3" style="overflow-y: auto; flex: 1;">
        <div *ngIf="loading" class="flex justify-center p-4">
            <mat-spinner diameter="40"></mat-spinner>
        </div>

        <div *ngIf="!loading && measurements.length === 0" class="text-center p-4" style="color: #666;">
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

// CSS for the dialog
const customCss = `
.measurement-switch-dialog {
    font-family: Roboto, sans-serif;
}

.measurement-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.measurement-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: #f8f9fa;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 2px solid transparent;
}

.measurement-item:hover {
    background: #e9ecef;
    transform: translateX(4px);
}

.measurement-item.current {
    background: rgba(33, 150, 243, 0.1);
    border-color: #2196F3;
    cursor: default;
}

.measurement-item.current:hover {
    transform: none;
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

.badge-type {
    background: #e3f2fd;
    color: #1565c0;
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
}
`;

// JavaScript function for the dialog controller
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

// Get the current state to determine if we're in heating or cooling
const currentStateName = stateController.getStateId();
const isHeating = currentStateName.includes('heating');

// Find the project (parent) of this measurement using entityRelationService.findByTo
findProjectAndMeasurements();

function findProjectAndMeasurements() {
    // Use findByTo to get all relations where this measurement is the target (TO)
    entityRelationService.findByTo(currentMeasurementId).subscribe(
        (relations) => {
            console.log('Found relations:', JSON.stringify(relations, null, 2));

            // Filter for relations from Assets - the Project is the parent
            // Relations FROM Project TO Measurement mean the Project is r.from
            const projectRelations = (relations || []).filter(
                (r) => r.from && r.from.entityType === 'ASSET'
            );

            console.log('Filtered project relations:', projectRelations.length);

            if (projectRelations.length > 0) {
                // Get the project asset - use first one that's an asset
                const projectEntityId = projectRelations[0].from;
                console.log('Using project:', projectEntityId);
                findMeasurementsInProject(projectEntityId);
            } else {
                console.log('No project relation found for measurement');
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
    // projectEntityId is { id: "...", entityType: "ASSET" }
    const projectIdStr = projectEntityId.id || projectEntityId;
    console.log('Finding measurements in project:', projectIdStr);

    // Use entityRelationService.findByFrom to get children
    entityRelationService.findByFrom(projectEntityId).subscribe(
        (relations) => {
            console.log('Project relations:', relations);

            // Filter for asset relations (measurements)
            const measurementRelations = (relations || []).filter(
                (r) => r.to && r.to.entityType === 'ASSET'
            );

            console.log('Measurement relations found:', measurementRelations.length);

            if (measurementRelations.length === 0) {
                openDialog([]);
                return;
            }

            // Get the measurement assets
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
                    console.log('Fetched measurements:', measurements.length);
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

                // Filter: only show import, ultrasonic, lorawan
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
                    // Sort by name/number
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
            return; // Don't navigate to current measurement
        }

        // Navigate to the selected measurement
        const targetState = isHeating ? 'measurement_details_heating_full' : 'measurement_details_cooling_full';

        stateController.openState(targetState, {
            selectedMeasurement: {
                entityId: measurement.id,
                entityName: measurement.entityName,
                entityLabel: measurement.entityLabel || measurement.entityName,
            }
        }, false);

        vm.dialogRef.close(null);
    };
}
`;

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

        // Initialize actions array if needed
        if (!widget.config.actions) {
            widget.config.actions = {};
        }
        if (!widget.config.actions.elementClick) {
            widget.config.actions.elementClick = [];
        }

        const actions = widget.config.actions.elementClick;

        // Find existing measurement-switch-button action
        const existingIndex = actions.findIndex(a => a.name === 'measurement-switch-button');

        // Create the new customPretty action
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
            console.log(`  Replacing existing action at index ${existingIndex}`);
            actions[existingIndex] = newAction;
        } else {
            console.log('  Adding new action');
            actions.push(newAction);
        }

        console.log(`  Action ID: ${newAction.id}`);
    }

    console.log('\nSaving dashboard...');
    fs.writeFileSync(DASHBOARD_PATH, JSON.stringify(dashboard, null, 2));
    console.log('Done!');
}

updateDashboard();
