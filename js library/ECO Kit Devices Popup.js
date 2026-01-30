/**
 * ECO Kit Devices Popup
 * Shows devices belonging to a Diagnostic Kit with unassign functionality
 */

export function openKitDevicesDialog(widgetContext, kitId, kitName) {
  const $injector = widgetContext.$scope.$injector;
  const customDialog = $injector.get(widgetContext.servicesMap.get('customDialog'));
  const entityRelationService = $injector.get(widgetContext.servicesMap.get('entityRelationService'));
  const attributeService = $injector.get(widgetContext.servicesMap.get('attributeService'));
  const deviceService = $injector.get(widgetContext.servicesMap.get('deviceService'));
  const assetService = $injector.get(widgetContext.servicesMap.get('assetService'));
  const entityGroupService = $injector.get(widgetContext.servicesMap.get('entityGroupService'));
  const dialogs = widgetContext.dialogs;
  const rxjs = widgetContext.rxjs;
  const { forkJoin, of, BehaviorSubject } = rxjs;
  const { switchMap, map, catchError } = rxjs;

  // 1) CSS - Matching Add Kit dialog professional design
  const myCSS = `
/* ============================================
   KIT DEVICES DIALOG - PROFESSIONAL DESIGN
   Matches Add Kit dialog styling
   ============================================ */

.kit-devices-dialog {
  width: 800px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  border-radius: 0;
  overflow: hidden;
}

/* Header - matching Add Kit */
.kit-devices-dialog .dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
  color: white;
}
.kit-devices-dialog .dialog-header mat-icon {
  font-size: 24px;
  width: 24px;
  height: 24px;
}
.kit-devices-dialog .dialog-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
.kit-devices-dialog .close-header-btn {
  color: rgba(255,255,255,0.8) !important;
}
.kit-devices-dialog .close-header-btn:hover {
  color: white !important;
  background: rgba(255,255,255,0.1) !important;
}

/* Dialog Body */
.kit-devices-dialog .dialog-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  position: relative;
}

/* Section Cards - matching Add Kit */
.kit-devices-dialog .section-card {
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  margin-bottom: 12px;
  overflow: hidden;
}

.kit-devices-dialog .card-header-mini {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 600;
  font-size: 14px;
  color: #334155;
}
.kit-devices-dialog .card-header-mini mat-icon {
  font-size: 18px;
  width: 18px;
  height: 18px;
  color: #64748b;
}

/* Kit Info Card */
.kit-devices-dialog .kit-info-card {
  border-left: 3px solid #3b82f6;
}

.kit-devices-dialog .kit-info-content {
  padding: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.kit-devices-dialog .kit-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kit-devices-dialog .kit-name {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.kit-devices-dialog .kit-assigned {
  font-size: 13px;
  color: #64748b;
}

.kit-devices-dialog .kit-assigned.assigned {
  color: #059669;
}

/* Badge Styles */
.kit-devices-dialog .badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-left: auto;
}
.kit-devices-dialog .badge-blue {
  background: #dbeafe;
  color: #1d4ed8;
}

.kit-devices-dialog .device-count {
  margin-left: auto;
  background: #e2e8f0;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
}

/* Unassign All Button */
.kit-devices-dialog .unassign-all-btn {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.kit-devices-dialog .unassign-all-btn:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.kit-devices-dialog .unassign-all-btn:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.kit-devices-dialog .unassign-all-btn mat-icon {
  font-size: 18px;
  width: 18px;
  height: 18px;
}

/* Devices Card */
.kit-devices-dialog .devices-card {
  border-left: 3px solid #8b5cf6;
}

.kit-devices-dialog .devices-list {
  padding: 0;
}

/* Device Item - matching Add Kit style */
.kit-devices-dialog .device-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.2s ease;
}
.kit-devices-dialog .device-item:last-child {
  border-bottom: none;
}
.kit-devices-dialog .device-item:hover {
  background: #f8fafc;
}

/* Device Icon - white icons, centered (matching Add Kit) */
.kit-devices-dialog .device-icon {
  width: 32px;
  height: 32px;
  min-width: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.kit-devices-dialog .device-icon mat-icon {
  font-size: 18px;
  width: 18px;
  height: 18px;
  color: white !important;
}
.kit-devices-dialog .device-icon.pflow {
  background: #3b82f6;
}
.kit-devices-dialog .device-icon.temp {
  background: #f59e0b;
}
.kit-devices-dialog .device-icon.co2 {
  background: #10b981;
}
.kit-devices-dialog .device-icon.default {
  background: #64748b;
}

.kit-devices-dialog .device-info {
  flex: 1;
  min-width: 0;
}

.kit-devices-dialog .device-name {
  font-weight: 500;
  color: #1e293b;
  font-size: 14px;
}

.kit-devices-dialog .device-type {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}

/* Assigned Badge */
.kit-devices-dialog .assigned-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  min-width: 80px;
  text-align: center;
}

.kit-devices-dialog .assigned-badge.assigned {
  background: rgba(5, 150, 105, 0.1);
  color: #059669;
}

.kit-devices-dialog .assigned-badge.unassigned {
  background: rgba(148, 163, 184, 0.1);
  color: #94a3b8;
}

/* Status Badge */
.kit-devices-dialog .status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  min-width: 70px;
}

.kit-devices-dialog .status-badge.active {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.kit-devices-dialog .status-badge.inactive {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.kit-devices-dialog .status-badge mat-icon {
  font-size: 14px;
  width: 14px;
  height: 14px;
}

/* Timestamp */
.kit-devices-dialog .timestamp {
  font-size: 12px;
  color: #64748b;
  font-family: 'SF Mono', Monaco, monospace;
  min-width: 140px;
}

/* Unassign Button */
.kit-devices-dialog .unassign-btn {
  background: transparent;
  border: 1px solid #fca5a5;
  color: #ef4444;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.kit-devices-dialog .unassign-btn:hover {
  background: #fef2f2;
  border-color: #ef4444;
}

.kit-devices-dialog .unassign-btn:disabled {
  background: #f1f5f9;
  border-color: #e2e8f0;
  color: #94a3b8;
  cursor: not-allowed;
}

.kit-devices-dialog .unassign-btn mat-icon {
  font-size: 16px;
  width: 16px;
  height: 16px;
}

/* Empty State */
.kit-devices-dialog .empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #94a3b8;
}

.kit-devices-dialog .empty-state mat-icon {
  font-size: 48px;
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.kit-devices-dialog .empty-state p {
  margin: 0;
  font-size: 14px;
}

/* Step Actions - footer style matching Add Kit */
.kit-devices-dialog .step-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.kit-devices-dialog .close-btn {
  font-weight: 600 !important;
  padding: 0 24px !important;
  height: 44px !important;
  border-radius: 8px !important;
  background: #1e3a5f !important;
  color: white !important;
}
.kit-devices-dialog .close-btn:hover {
  background: #2d5a87 !important;
}
`;

  // Inject CSS
  const cssParser = new cssjs();
  cssParser.testMode = false;
  cssParser.cssPreviewNamespace = 'kit-devices-dialog';
  cssParser.createStyleElement('kit-devices-dialog-styles', myCSS, 'nonamespace');

  // 2) HTML Template - Matching Add Kit dialog structure
  const myHTML = `
<div class="kit-devices-dialog">
  <!-- Header -->
  <div class="dialog-header">
    <mat-icon>devices</mat-icon>
    <h2>Kit Devices</h2>
    <span class="flex-1"></span>
    <button mat-icon-button (click)="cancel()" type="button" class="close-header-btn">
      <mat-icon>close</mat-icon>
    </button>
  </div>

  <mat-progress-bar color="accent" mode="indeterminate" *ngIf="isLoading$ | async"></mat-progress-bar>

  <div class="dialog-body">
    <!-- Kit Info Card -->
    <div class="section-card kit-info-card">
      <div class="card-header-mini">
        <mat-icon>medical_services</mat-icon>
        <span>Diagnostic Kit</span>
        <span class="badge badge-blue">{{devices.length}} Devices</span>
      </div>
      <div class="kit-info-content">
        <div class="kit-info">
          <div class="kit-name">{{kitName}}</div>
          <div class="kit-assigned" [class.assigned]="kitAssignedTo">
            {{kitAssignedTo ? 'Assigned to: ' + kitAssignedTo : 'Not assigned'}}
          </div>
        </div>
        <button class="unassign-all-btn"
                (click)="unassignAll()"
                [disabled]="!kitAssignedTo || (isLoading$ | async)">
          <mat-icon>link_off</mat-icon>
          Unassign Kit & All Devices
        </button>
      </div>
    </div>

    <!-- Devices Card -->
    <div class="section-card devices-card">
      <div class="card-header-mini">
        <mat-icon>sensors</mat-icon>
        <span>Devices</span>
        <span class="device-count">{{devices.length}}</span>
      </div>

      <div class="devices-list" *ngIf="devices.length > 0">
        <div *ngFor="let device of devices" class="device-item">
          <div class="device-icon" [ngClass]="getDeviceIconClass(device.type)">
            <mat-icon>{{getDeviceIcon(device.type)}}</mat-icon>
          </div>
          <div class="device-info">
            <div class="device-name">{{device.name}}</div>
            <div class="device-type">{{device.type}}</div>
          </div>
          <span class="assigned-badge" [class.assigned]="device.assignedTo" [class.unassigned]="!device.assignedTo">
            {{device.assignedTo || 'Unassigned'}}
          </span>
          <span class="status-badge" [class.active]="device.isActive" [class.inactive]="!device.isActive">
            <mat-icon>{{device.isActive ? 'check_circle' : 'cancel'}}</mat-icon>
            {{device.isActive ? 'Active' : 'Inactive'}}
          </span>
          <span class="timestamp">{{device.lastActivityFormatted}}</span>
          <button class="unassign-btn"
                  (click)="unassignDevice(device)"
                  [disabled]="!device.assignedTo || (isLoading$ | async)">
            <mat-icon>link_off</mat-icon>
            Unassign
          </button>
        </div>
      </div>

      <div class="empty-state" *ngIf="devices.length === 0 && !(isLoading$ | async)">
        <mat-icon>devices_other</mat-icon>
        <p>No devices found in this kit</p>
      </div>
    </div>

    <!-- Footer Actions -->
    <div class="step-actions">
      <button mat-flat-button color="primary" class="close-btn" (click)="cancel()">
        Close
      </button>
    </div>
  </div>
</div>
`;

  // 3) Controller
  function KitDevicesController(instance) {
    const vm = instance;

    // Loading state
    const loadingSubject = new BehaviorSubject(true);
    vm.isLoading$ = loadingSubject.asObservable();

    // State
    vm.kitId = kitId;
    vm.kitName = kitName;
    vm.kitAssignedTo = '';
    vm.devices = [];

    // Load kit data and devices
    vm.loadData = function() {
      loadingSubject.next(true);

      const kitEntityId = { id: kitId.id, entityType: 'ASSET' };

      // Get kit attributes
      const kitAttrs$ = attributeService.getEntityAttributes(kitEntityId, 'SERVER_SCOPE', ['assignedTo']);

      // Get related devices (Contains relation)
      const devices$ = entityRelationService.findByFrom(kitEntityId, 'Contains').pipe(
        switchMap(function(relations) {
          const deviceRelations = relations.filter(function(r) {
            return r.to && r.to.entityType === 'DEVICE';
          });

          if (deviceRelations.length === 0) {
            return of([]);
          }

          // Get device details and attributes
          const deviceQueries = deviceRelations.map(function(rel) {
            const deviceId = rel.to;
            return forkJoin({
              device: deviceService.getDevice(deviceId.id),
              attrs: attributeService.getEntityAttributes(deviceId, 'SERVER_SCOPE', ['assignedTo', 'active', 'lastActivityTime'])
            }).pipe(
              map(function(result) {
                const device = result.device;
                const attrs = result.attrs;

                const assignedToAttr = attrs.find(function(a) { return a.key === 'assignedTo'; });
                const activeAttr = attrs.find(function(a) { return a.key === 'active'; });
                const lastActivityAttr = attrs.find(function(a) { return a.key === 'lastActivityTime'; });

                const lastActivityMs = lastActivityAttr ? lastActivityAttr.value : null;
                const now = Date.now();
                const diffMinutes = lastActivityMs ? (now - lastActivityMs) / 1000 / 60 : Infinity;

                return {
                  id: device.id,
                  name: device.name,
                  type: device.type,
                  assignedTo: assignedToAttr && assignedToAttr.value && assignedToAttr.value !== 'None' ? assignedToAttr.value : null,
                  isActive: diffMinutes < 5,
                  lastActivityTime: lastActivityMs,
                  lastActivityFormatted: formatTimestamp(lastActivityMs)
                };
              }),
              catchError(function() { return of(null); })
            );
          });

          return forkJoin(deviceQueries);
        }),
        map(function(devices) {
          return devices.filter(function(d) { return d !== null; });
        }),
        catchError(function() { return of([]); })
      );

      forkJoin({ kitAttrs: kitAttrs$, devices: devices$ }).subscribe(
        function(result) {
          const assignedAttr = result.kitAttrs.find(function(a) { return a.key === 'assignedTo'; });
          vm.kitAssignedTo = assignedAttr && assignedAttr.value && assignedAttr.value !== 'None' ? assignedAttr.value : null;

          // Sort devices: 1. by type (gw, pflow, temp), 2. by name ascending
          vm.devices = sortDevices(result.devices);
          loadingSubject.next(false);
        },
        function(error) {
          console.error('Error loading kit data:', error);
          loadingSubject.next(false);
        }
      );
    };

    function formatTimestamp(ms) {
      if (!ms) return '—';
      const date = new Date(ms);
      const pad = function(n) { return n.toString().padStart(2, '0'); };
      return pad(date.getDate()) + '.' + pad(date.getMonth() + 1) + '.' + date.getFullYear() + ' ' +
             pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
    }

    // Sort devices: 1. by type (alphabetically), 2. by name ascending
    function sortDevices(devices) {
      return devices.sort(function(a, b) {
        // First sort by type alphabetically
        const typeCompare = (a.type || '').localeCompare(b.type || '');
        if (typeCompare !== 0) {
          return typeCompare;
        }
        // Then sort by name ascending
        return (a.name || '').localeCompare(b.name || '');
      });
    }

    // Check if device is a P-Flow (measurement device that triggers finish)
    function isPFlowDevice(deviceType) {
      if (!deviceType) return false;
      const type = deviceType.toLowerCase();
      return type.includes('p-flow') || type === 'p-flow d116';
    }

    // Find measurement that a device is assigned to based on assignedTo name
    // Returns { measurementId, relationExists, relationType }
    function findMeasurementForDevice(deviceId, assignedToName) {
      if (!assignedToName) {
        return of({ measurementId: null, relationExists: false, relationType: null });
      }

      // Get all "Measurement" relations TO the device
      return entityRelationService.findByTo(deviceId, 'Measurement').pipe(
        switchMap(function(relations) {
          // Filter to only ASSET relations (measurements)
          const measurementRelations = relations.filter(function(r) {
            return r.from && r.from.entityType === 'ASSET';
          });

          if (measurementRelations.length === 0) {
            return of({ measurementId: null, relationExists: false, relationType: null });
          }

          // Get names of all measurements to find the one matching assignedTo
          const nameQueries = measurementRelations.map(function(rel) {
            return assetService.getAsset(rel.from.id).pipe(
              map(function(asset) {
                return {
                  measurementId: rel.from,
                  name: asset.name
                };
              }),
              catchError(function() { return of(null); })
            );
          });

          return forkJoin(nameQueries).pipe(
            map(function(measurementsWithNames) {
              // Find the measurement matching assignedTo name
              const validMeasurements = measurementsWithNames.filter(function(m) { return m !== null; });
              const matchingMeasurement = validMeasurements.find(function(m) {
                return m.name === assignedToName;
              });

              if (matchingMeasurement) {
                return {
                  measurementId: matchingMeasurement.measurementId,
                  relationExists: true,
                  relationType: 'Measurement'
                };
              }

              // No match found
              return { measurementId: null, relationExists: false, relationType: null };
            })
          );
        }),
        catchError(function() { return of({ measurementId: null, relationExists: false, relationType: null }); })
      );
    }

    // Get measurement details (name, label, startTimeMs)
    function getMeasurementDetails(measurementId) {
      return forkJoin({
        asset: assetService.getAsset(measurementId.id),
        attrs: attributeService.getEntityAttributes(measurementId, 'SERVER_SCOPE', ['startTimeMs', 'label'])
      }).pipe(
        map(function(result) {
          const startAttr = result.attrs.find(function(a) { return a.key === 'startTimeMs'; });
          const labelAttr = result.attrs.find(function(a) { return a.key === 'label'; });
          return {
            id: measurementId,
            name: result.asset.name,
            label: labelAttr ? labelAttr.value : result.asset.name,
            startTimeMs: startAttr ? Number(startAttr.value) : null
          };
        }),
        catchError(function() { return of(null); })
      );
    }

    // Get project details (name, label, startTimeMs)
    function getProjectDetails(projectId) {
      return forkJoin({
        asset: assetService.getAsset(projectId.id),
        attrs: attributeService.getEntityAttributes(projectId, 'SERVER_SCOPE', ['startTimeMs', 'label'])
      }).pipe(
        map(function(result) {
          const startAttr = result.attrs.find(function(a) { return a.key === 'startTimeMs'; });
          const labelAttr = result.attrs.find(function(a) { return a.key === 'label'; });
          return {
            id: projectId,
            name: result.asset.name,
            label: labelAttr ? labelAttr.value : result.asset.name,
            startTimeMs: startAttr ? Number(startAttr.value) : null
          };
        }),
        catchError(function() { return of(null); })
      );
    }

    // Update measurementHistory on device or kit and optionally clear assignedTo
    function updateMeasurementHistory(entityId, entityType, historyEntry, clearAssignedTo) {
      return attributeService.getEntityAttributes(entityId, 'SERVER_SCOPE', ['measurementHistory']).pipe(
        switchMap(function(attrs) {
          const historyAttr = attrs.find(function(a) { return a.key === 'measurementHistory'; });
          let history = [];

          if (historyAttr && historyAttr.value) {
            try {
              history = typeof historyAttr.value === 'string' ? JSON.parse(historyAttr.value) : historyAttr.value;
              if (!Array.isArray(history)) history = [];
            } catch (e) {
              history = [];
            }
          }

          // Append new entry
          history.push(historyEntry);

          const attrsToSave = [
            { key: 'measurementHistory', value: JSON.stringify(history) }
          ];

          // Optionally clear assignedTo
          if (clearAssignedTo) {
            attrsToSave.push({ key: 'assignedTo', value: 'None' });
          }

          return attributeService.saveEntityAttributes(entityId, 'SERVER_SCOPE', attrsToSave);
        }),
        catchError(function(err) {
          console.error('Error updating measurementHistory:', err);
          return of(null);
        })
      );
    }

    // Get all devices assigned to a measurement (via Measurement relation FROM measurement TO device)
    function getAllDevicesForMeasurement(measurementId) {
      return entityRelationService.findByFrom(measurementId, 'Measurement').pipe(
        switchMap(function(relations) {
          // Filter to only DEVICE relations
          const deviceRelations = relations.filter(function(r) {
            return r.to && r.to.entityType === 'DEVICE';
          });

          if (deviceRelations.length === 0) {
            return of([]);
          }

          // Get device details for each
          const deviceQueries = deviceRelations.map(function(rel) {
            return deviceService.getDevice(rel.to.id).pipe(
              map(function(device) {
                return {
                  id: device.id,
                  name: device.name,
                  type: device.type
                };
              }),
              catchError(function() { return of(null); })
            );
          });

          return forkJoin(deviceQueries).pipe(
            map(function(devices) {
              return devices.filter(function(d) { return d !== null; });
            })
          );
        }),
        catchError(function() { return of([]); })
      );
    }

    // Save assignedDevices on measurement for historical reference
    function saveAssignedDevicesHistory(measurementId, devices, kitInfo) {
      const assignedEntities = [];

      // Add devices
      devices.forEach(function(device) {
        assignedEntities.push({
          id: device.id.id,
          name: device.name,
          type: device.type,
          entityType: 'DEVICE'
        });
      });

      // Add kit if provided
      if (kitInfo) {
        assignedEntities.push({
          id: kitInfo.id,
          name: kitInfo.name,
          type: 'Diagnostickit',
          entityType: 'ASSET'
        });
      }

      return attributeService.saveEntityAttributes(measurementId, 'SERVER_SCOPE', [
        { key: 'assignedDevices', value: JSON.stringify(assignedEntities) }
      ]);
    }

    // Unassign single device
    vm.unassignDevice = function(device) {
      const isPFlow = isPFlowDevice(device.type);

      // Different confirmation message based on device type
      const message = isPFlow
        ? 'The device will be removed from the measurement and the measurement will be finished. Do you want to continue?'
        : 'The device will be removed from the measurement. Do you want to continue?';

      // Show confirmation dialog
      dialogs.confirm(
        'Unassign Device',
        message,
        'Cancel',
        'Accept'
      ).subscribe(function(result) {
        if (!result) return;

        loadingSubject.next(true);

        const deviceId = device.id;
        const endTimeMs = Date.now();

        // Get customer from kit to add device to unassigned group
        assetService.getAsset(kitId.id).pipe(
        switchMap(function(kit) {
          const customerId = kit.customerId;

          return forkJoin({
            group: getOrCreateEntityGroup(customerId, 'DEVICE', 'Unassigned Measurement Devices'),
            measurementInfo: findMeasurementForDevice(deviceId, device.assignedTo)
          }).pipe(
            switchMap(function(results) {
              const group = results.group;
              const measurementId = results.measurementInfo.measurementId;
              const relationExists = results.measurementInfo.relationExists;

              if (!measurementId) {
                // No measurement found, just unassign device
                return forkJoin([
                  updateMeasurementHistory(deviceId, 'DEVICE', {
                    measurementName: device.assignedTo || 'Unknown',
                    measurementLabel: device.assignedTo || 'Unknown',
                    startTimeMs: null,
                    endTimeMs: endTimeMs
                  }, true),
                  group && group.id ? entityGroupService.addEntitiesToEntityGroup(group.id.id, [deviceId.id]) : of(null)
                ]);
              }

              // Get measurement details for history
              return getMeasurementDetails(measurementId).pipe(
                switchMap(function(measurementDetails) {
                  const operations = [];

                  // 1. Update device measurementHistory and clear assignedTo
                  operations.push(
                    updateMeasurementHistory(deviceId, 'DEVICE', {
                      measurementName: measurementDetails ? measurementDetails.name : 'Unknown',
                      measurementLabel: measurementDetails ? measurementDetails.label : 'Unknown',
                      startTimeMs: measurementDetails ? measurementDetails.startTimeMs : null,
                      endTimeMs: endTimeMs
                    }, true)
                  );

                  // 2. Add device to Unassigned group
                  if (group && group.id) {
                    operations.push(
                      entityGroupService.addEntitiesToEntityGroup(group.id.id, [deviceId.id])
                    );
                  }

                  // 3. Delete Measurement -> Device relation (only if it exists)
                  if (relationExists && measurementId) {
                    // Relation is always FROM Measurement TO Device with type "Measurement"
                    const fromEntity = { id: measurementId.id, entityType: 'ASSET' };
                    const toEntity = { id: deviceId.id, entityType: 'DEVICE' };
                    console.log('Deleting relation: Measurement from:', fromEntity.id, 'to:', toEntity.id);
                    operations.push(
                      entityRelationService.deleteRelation(fromEntity, 'Measurement', toEntity).pipe(
                        catchError(function(err) {
                          console.warn('Relation already deleted or does not exist:', err);
                          return of(null);
                        })
                      )
                    );
                  }

                  // 4. If P-Flow, finish the measurement and save assignedDevices history
                  if (isPFlow) {
                    // Finish measurement
                    operations.push(
                      attributeService.saveEntityAttributes(measurementId, 'SERVER_SCOPE', [
                        { key: 'progress', value: 'finished' },
                        { key: 'endTimeMs', value: endTimeMs }
                      ])
                    );

                    // Get all devices assigned to this measurement for historical reference
                    operations.push(
                      getAllDevicesForMeasurement(measurementId).pipe(
                        switchMap(function(allMeasurementDevices) {
                          return saveAssignedDevicesHistory(measurementId, allMeasurementDevices, { id: kitId.id, name: kitName });
                        })
                      )
                    );
                  }

                  return forkJoin(operations);
                })
              );
            })
          );
        })
      ).subscribe(
          function() {
            console.log('Device unassigned:', device.name, isPFlow ? '(measurement finished)' : '');
            widgetContext.updateAliases();
            vm.loadData(); // Refresh
          },
          function(error) {
            console.error('Error unassigning device:', error);
            loadingSubject.next(false);
          }
        );
      });
    };

    // Find project and measurements for kit
    // Also returns info about which relations exist (to avoid 404 when deleting)
    function findProjectAndMeasurementsForKit(kitEntityId) {
      return entityRelationService.findByTo(kitEntityId, 'Measurement').pipe(
        switchMap(function(kitRelations) {
          // Track which measurements have a relation to the kit
          const measurementsWithKitRelation = kitRelations
            .filter(function(r) { return r.from && r.from.entityType === 'ASSET'; })
            .map(function(r) { return r.from; });

          if (measurementsWithKitRelation.length === 0) {
            return of({ project: null, measurements: [], kitRelationExists: false });
          }

          // Get measurement details for all measurements
          const measurementQueries = measurementsWithKitRelation.map(function(mId) {
            return getMeasurementDetails(mId).pipe(
              map(function(details) {
                if (details) {
                  details.kitRelationExists = true;
                }
                return details;
              })
            );
          });

          // From the first measurement, find the project
          const firstMeasurementId = measurementsWithKitRelation[0];
          const projectQuery = entityRelationService.findByTo(firstMeasurementId, 'Measurement').pipe(
            switchMap(function(projectRelations) {
              const projectRel = projectRelations.find(function(r) {
                return r.from && r.from.entityType === 'ASSET';
              });
              if (projectRel) {
                return getProjectDetails(projectRel.from);
              }
              return of(null);
            }),
            catchError(function() { return of(null); })
          );

          return forkJoin({
            project: projectQuery,
            measurements: forkJoin(measurementQueries)
          }).pipe(
            map(function(result) {
              result.kitRelationExists = true;
              return result;
            })
          );
        }),
        catchError(function() { return of({ project: null, measurements: [], kitRelationExists: false }); })
      );
    }

    // Unassign kit and all devices
    vm.unassignAll = function() {
      // Show confirmation dialog
      dialogs.confirm(
        'Unassign Kit & All Devices',
        'All devices will be removed from their measurements. The project and all measurements will be finished. Do you want to continue?',
        'Cancel',
        'Accept'
      ).subscribe(function(result) {
        if (!result) return;

        loadingSubject.next(true);

        const kitEntityId = { id: kitId.id, entityType: 'ASSET' };
        const endTimeMs = Date.now();

        // Get customer from kit
        assetService.getAsset(kitId.id).pipe(
        switchMap(function(kit) {
          const customerId = kit.customerId;

          return forkJoin({
            deviceGroup: getOrCreateEntityGroup(customerId, 'DEVICE', 'Unassigned Measurement Devices'),
            kitGroup: getOrCreateEntityGroup(customerId, 'ASSET', 'Unassigned Diagnostic Kits'),
            projectAndMeasurements: findProjectAndMeasurementsForKit(kitEntityId)
          }).pipe(
            switchMap(function(results) {
              const groups = { deviceGroup: results.deviceGroup, kitGroup: results.kitGroup };
              const project = results.projectAndMeasurements.project;
              const measurements = results.projectAndMeasurements.measurements.filter(function(m) { return m !== null; });
              const operations = [];

              // 1. Update kit measurementHistory and clear assignedTo
              operations.push(
                updateMeasurementHistory(kitEntityId, 'ASSET', {
                  projectName: project ? project.name : 'Unknown',
                  projectLabel: project ? project.label : 'Unknown',
                  startTimeMs: project ? project.startTimeMs : null,
                  endTimeMs: endTimeMs
                }, true)
              );

              // 2. Add kit to Unassigned group
              if (groups.kitGroup && groups.kitGroup.id) {
                operations.push(
                  entityGroupService.addEntitiesToEntityGroup(groups.kitGroup.id.id, [kitId.id])
                );
              }

              // 3. Finish project (if found)
              if (project) {
                operations.push(
                  attributeService.saveEntityAttributes(project.id, 'SERVER_SCOPE', [
                    { key: 'progress', value: 'finished' },
                    { key: 'endTimeMs', value: endTimeMs }
                  ])
                );
              }

              // 4. Finish all measurements and save assignedDevices history
              measurements.forEach(function(measurement) {
                // Finish measurement
                operations.push(
                  attributeService.saveEntityAttributes(measurement.id, 'SERVER_SCOPE', [
                    { key: 'progress', value: 'finished' },
                    { key: 'endTimeMs', value: endTimeMs }
                  ])
                );

                // Save assignedDevices for historical reference (get all devices of this measurement)
                operations.push(
                  getAllDevicesForMeasurement(measurement.id).pipe(
                    switchMap(function(allMeasurementDevices) {
                      return saveAssignedDevicesHistory(measurement.id, allMeasurementDevices, { id: kitId.id, name: kitName });
                    })
                  )
                );

                // Delete Measurement → Kit relation (only if it exists)
                if (measurement.kitRelationExists) {
                  operations.push(
                    entityRelationService.deleteRelation(measurement.id, 'Measurement', kitEntityId).pipe(
                      catchError(function(err) {
                        console.warn('Kit relation already deleted or does not exist:', err);
                        return of(null);
                      })
                    )
                  );
                }
              });

              // 5. Unassign each device - update measurementHistory
              // First, get device relations to know which ones exist
              const deviceUnassignOps = vm.devices.map(function(device) {
                return findMeasurementForDevice(device.id, device.assignedTo).pipe(
                  switchMap(function(deviceMeasurementInfo) {
                    const deviceOps = [];
                    const deviceMeasurement = deviceMeasurementInfo.measurementId;
                    const deviceRelationExists = deviceMeasurementInfo.relationExists;

                    // Find measurement details (from our already-loaded measurements or use device's assignedTo)
                    const measurementDetails = measurements.find(function(m) {
                      return device.assignedTo && m && m.name === device.assignedTo;
                    }) || measurements[0];

                    // Update device measurementHistory and clear assignedTo
                    deviceOps.push(
                      updateMeasurementHistory(device.id, 'DEVICE', {
                        measurementName: measurementDetails ? measurementDetails.name : (device.assignedTo || 'Unknown'),
                        measurementLabel: measurementDetails ? measurementDetails.label : (device.assignedTo || 'Unknown'),
                        startTimeMs: measurementDetails ? measurementDetails.startTimeMs : null,
                        endTimeMs: endTimeMs
                      }, true)
                    );

                    // Add to Unassigned group
                    if (groups.deviceGroup && groups.deviceGroup.id) {
                      deviceOps.push(
                        entityGroupService.addEntitiesToEntityGroup(groups.deviceGroup.id.id, [device.id.id])
                      );
                    }

                    // Delete Measurement -> Device relation (only if it exists)
                    if (deviceRelationExists && deviceMeasurement) {
                      // Relation is always FROM Measurement TO Device with type "Measurement"
                      const fromEntity = { id: deviceMeasurement.id, entityType: 'ASSET' };
                      const toEntity = { id: device.id.id, entityType: 'DEVICE' };
                      console.log('Deleting device relation: Measurement from:', fromEntity.id, 'to:', toEntity.id);
                      deviceOps.push(
                        entityRelationService.deleteRelation(fromEntity, 'Measurement', toEntity).pipe(
                          catchError(function(err) {
                            console.warn('Device relation already deleted or does not exist:', err);
                            return of(null);
                          })
                        )
                      );
                    }

                    return deviceOps.length ? forkJoin(deviceOps) : of(null);
                  })
                );
              });

              // Add all device operations
              if (deviceUnassignOps.length > 0) {
                operations.push(forkJoin(deviceUnassignOps));
              }

              return operations.length ? forkJoin(operations) : of([]);
            })
          );
        })
      ).subscribe(
          function() {
            console.log('Kit and all devices unassigned, project and measurements finished, history updated');
            widgetContext.updateAliases();
            vm.loadData(); // Refresh
          },
          function(error) {
            console.error('Error unassigning kit:', error);
            loadingSubject.next(false);
          }
        );
      });
    };

    function getOrCreateEntityGroup(customerId, entityType, groupName) {
      return entityGroupService.getEntityGroupsByOwnerId(
        customerId.entityType,
        customerId.id,
        entityType
      ).pipe(
        switchMap(function(groups) {
          const group = groups.find(function(g) { return g.name === groupName; });
          if (group) {
            return of(group);
          }
          const newGroup = {
            type: entityType,
            name: groupName,
            ownerId: customerId
          };
          return entityGroupService.saveEntityGroup(newGroup);
        }),
        catchError(function(err) {
          console.error('Error getting/creating entity group:', groupName, err);
          return of(null);
        })
      );
    }

    // Get device icon class based on type
    vm.getDeviceIconClass = function(deviceType) {
      if (!deviceType) return 'default';
      const type = deviceType.toLowerCase();
      if (type.includes('p-flow') || type.includes('pflow')) return 'pflow';
      if (type.includes('temperature') || type.includes('temp')) return 'temp';
      if (type.includes('co2') || type.includes('room sensor')) return 'co2';
      return 'default';
    };

    // Get device icon based on type
    vm.getDeviceIcon = function(deviceType) {
      if (!deviceType) return 'sensors';
      const type = deviceType.toLowerCase();
      if (type.includes('p-flow') || type.includes('pflow')) return 'speed';
      if (type.includes('temperature') || type.includes('temp')) return 'thermostat';
      if (type.includes('co2') || type.includes('room sensor')) return 'co2';
      if (type.includes('gateway') || type.includes('resi')) return 'router';
      return 'sensors';
    };

    // Cancel / Close dialog
    vm.cancel = function() {
      vm.dialogRef.close(null);
    };

    // Initial load
    vm.loadData();
  }

  // 4) Open Dialog
  customDialog.customDialog(myHTML, KitDevicesController, { myCSS }).subscribe();
}
