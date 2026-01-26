# Phase 3: Timeseries & Live Updates - Research

**Researched:** 2026-01-27
**Domain:** ThingsBoard 4.2 PE Telemetry API, Live Data Fetching, Dialog Lifecycle Management
**Confidence:** HIGH

## Summary

This research investigates how to extend the existing `openMeasurementInfoDialog()` (implemented in Phases 1-2) to fetch and display live timeseries data for P-Flow devices and Temperature Sensors, with 5-second auto-refresh and manual refresh capability.

The standard approach uses ThingsBoard's REST API via `widgetContext.http.get()` to fetch latest timeseries values from the `/api/plugins/telemetry/{entityType}/{entityId}/values/timeseries?keys=...` endpoint. The ECO-TB codebase already demonstrates this pattern in `ECO Data Importer.js` (line 1781). Auto-refresh is implemented using JavaScript's native `setInterval()`, with cleanup via `clearInterval()` when the dialog closes.

The dialog must track which P-Flow devices exist (by device type) and which installationType (heating/cooling) the measurement has, then fetch the appropriate timeseries keys. Temperature Sensors always fetch the `temperature` key. All timeseries values display with units and proper formatting.

**Primary recommendation:** Extend the `MeasurementInfoDialogController` with: (1) a `fetchTimeseries()` function that calls the telemetry REST API for each device, (2) a 5-second `setInterval` for auto-refresh stored in `vm.refreshInterval`, (3) cleanup in `vm.cancel()` via `clearInterval(vm.refreshInterval)`, and (4) a manual refresh button bound to `vm.refresh()`.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Component | Version/Type | Purpose | Why Standard |
|-----------|--------------|---------|--------------|
| ThingsBoard REST Telemetry API | TB 4.2 PE | Fetch latest timeseries values | Native TB API, documented |
| widgetContext.http | TB HttpClient | Make authenticated API calls | Already used in ECO codebase |
| setInterval/clearInterval | JavaScript native | Auto-refresh timer | Standard browser API |
| Promise.all | JavaScript native | Parallel telemetry fetches | Already used in codebase |

### Supporting
| Component | Purpose | When to Use |
|-----------|---------|-------------|
| rxjs.forkJoin | Parallel Observable handling | Alternative to Promise.all for RxJS-heavy code |
| mat-progress-bar | Loading indicator | Show during data fetch |
| mat-icon-button | Refresh button | Manual refresh trigger |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| REST API polling | WebSocket subscription | WebSocket is more efficient but complex to set up in custom dialogs |
| setInterval | RxJS interval | RxJS is cleaner but adds complexity for simple polling |
| Promise.all | Sequential fetching | Parallel is faster for multiple devices |

**No Installation Required:** All components are part of ThingsBoard or standard JavaScript.

## Architecture Patterns

### Recommended Data Flow
```
openMeasurementInfoDialog()
├── Load measurement info (existing Phase 1-2)
├── Load devices (existing Phase 2)
├── For each P-Flow device:
│   └── Determine timeseries keys based on installationType
├── For each Temperature Sensor:
│   └── Use 'temperature' key
├── Initial fetchTimeseries() call
├── Start setInterval(fetchTimeseries, 5000)
└── On dialog close:
    └── clearInterval(vm.refreshInterval)
```

### Pattern 1: Fetch Latest Timeseries via REST API
**What:** Get the most recent value for specified timeseries keys
**When to use:** Fetching current device telemetry in custom dialogs
**Example:**
```javascript
// Source: ThingsBoard REST API Documentation + ECO Data Importer.js line 1781
function fetchDeviceTimeseries(deviceId, keys) {
  return new Promise(function(resolve, reject) {
    const keysParam = keys.join(',');
    const url = '/api/plugins/telemetry/DEVICE/' + deviceId.id + '/values/timeseries?keys=' + keysParam;

    widgetContext.http.get(url).subscribe(
      function(response) {
        // Response format: { "key1": [{ "ts": 123456, "value": "42.5" }], "key2": [...] }
        resolve(response);
      },
      function(error) {
        console.error('Error fetching timeseries:', error);
        resolve({}); // Return empty on error to not break Promise.all
      }
    );
  });
}
```

### Pattern 2: Determine P-Flow Timeseries Keys by Installation Type
**What:** Map installationType to appropriate telemetry keys
**When to use:** Before fetching P-Flow timeseries
**Example:**
```javascript
// Source: PROJECT.md requirements
function getPFlowTimeseriesKeys(installationType) {
  var commonKeys = [
    'CHC_S_VolumeFlow',
    'CHC_M_Volume',
    'CHC_S_TemperatureDiff',
    'CHC_S_TemperatureFlow',
    'CHC_S_TemperatureReturn',
    'CHC_S_Velocity'
  ];

  if (installationType === 'heating') {
    return ['CHC_S_Heating_Power', 'CHS_M_Heating_Energy'].concat(commonKeys);
  } else if (installationType === 'cooling') {
    return ['CHC_S_Cooling_Power', 'CHC_M_Cooling_Energy'].concat(commonKeys);
  }
  return commonKeys; // Fallback if no installationType
}
```

### Pattern 3: Auto-Refresh with setInterval
**What:** Periodically fetch new timeseries data
**When to use:** Live data displays that need regular updates
**Example:**
```javascript
// Source: Standard JavaScript pattern
function MeasurementInfoDialogController(instance) {
  var vm = instance;
  vm.refreshInterval = null;
  vm.isRefreshing = false;

  // Initial fetch
  fetchAllTimeseries();

  // Start auto-refresh (5 seconds = 5000ms)
  vm.refreshInterval = setInterval(function() {
    fetchAllTimeseries();
  }, 5000);

  // Manual refresh button handler
  vm.refresh = function() {
    fetchAllTimeseries();
  };

  // CRITICAL: Cleanup on dialog close
  vm.cancel = function() {
    if (vm.refreshInterval) {
      clearInterval(vm.refreshInterval);
      vm.refreshInterval = null;
    }
    vm.dialogRef.close(null);
  };

  function fetchAllTimeseries() {
    if (vm.isRefreshing) return; // Prevent overlapping fetches
    vm.isRefreshing = true;
    // ... fetch logic ...
    // vm.isRefreshing = false; after completion
  }
}
```

### Pattern 4: Timeseries Value Display with Units
**What:** Format timeseries values with proper units
**When to use:** Displaying telemetry data in UI
**Example:**
```javascript
// Source: PROJECT.md requirements
var TIMESERIES_UNITS = {
  'CHC_S_Heating_Power': 'kW',
  'CHS_M_Heating_Energy': 'kWh',
  'CHC_S_Cooling_Power': 'kW',
  'CHC_M_Cooling_Energy': 'kWh',
  'CHC_S_VolumeFlow': 'l/hr',
  'CHC_M_Volume': 'm\u00B3',  // m³
  'CHC_S_TemperatureDiff': '\u00B0C',
  'CHC_S_TemperatureFlow': '\u00B0C',
  'CHC_S_TemperatureReturn': '\u00B0C',
  'CHC_S_Velocity': 'm/s',
  'temperature': '\u00B0C'
};

function formatTimeseriesValue(key, value) {
  if (value === null || value === undefined) return '-';
  var numValue = Number(value);
  if (!Number.isFinite(numValue)) return '-';
  var unit = TIMESERIES_UNITS[key] || '';
  return numValue.toFixed(2) + ' ' + unit;
}
```

### Anti-Patterns to Avoid
- **Forgetting clearInterval on close:** Memory leak and continued API calls after dialog closed
- **Not guarding against overlapping fetches:** If fetch takes longer than 5s, multiple parallel fetches
- **Fetching timeseries for wrong device types:** Only P-Flow and Temperature Sensor have relevant timeseries
- **Hardcoding keys without installationType check:** Would fetch heating keys for cooling measurements

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| API authentication | Manual JWT handling | widgetContext.http | Already authenticated |
| Parallel API calls | Sequential Promise chains | Promise.all | Faster, cleaner |
| Timer management | Custom timer logic | setInterval/clearInterval | Standard, reliable |
| Loading state | Manual DOM manipulation | mat-progress-bar with *ngIf | Material Design, consistent |

**Key insight:** The REST API approach is simpler than WebSocket subscriptions for dialogs that open and close frequently. WebSocket subscriptions require complex setup and teardown that's overkill for a temporary dialog.

## Common Pitfalls

### Pitfall 1: Memory Leak from Orphaned Intervals
**What goes wrong:** setInterval continues running after dialog closes, making API calls to nowhere
**Why it happens:** Forgot to call clearInterval in the cancel/close handler
**How to avoid:** Always clear interval in vm.cancel() BEFORE closing dialog
```javascript
vm.cancel = function() {
  if (vm.refreshInterval) {
    clearInterval(vm.refreshInterval);
    vm.refreshInterval = null;
  }
  vm.dialogRef.close(null);
};
```
**Warning signs:** Console errors after dialog close, increasing memory usage

### Pitfall 2: Overlapping Fetch Requests
**What goes wrong:** Multiple API calls in flight simultaneously, causing race conditions
**Why it happens:** 5-second interval fires while previous fetch is still in progress
**How to avoid:** Use a guard flag like `vm.isRefreshing`
```javascript
function fetchAllTimeseries() {
  if (vm.isRefreshing) return;
  vm.isRefreshing = true;
  // ... fetch ...
  // Set vm.isRefreshing = false in completion callback
}
```
**Warning signs:** Data flickering, inconsistent values, high network activity

### Pitfall 3: Fetching Timeseries for Non-Telemetry Devices
**What goes wrong:** API errors or empty responses for devices without expected keys
**Why it happens:** Diagnostic Kits, RESI, Room Sensors don't have the same telemetry keys
**How to avoid:** Filter devices by type before fetching timeseries
```javascript
var pflowDevices = allDevices.filter(function(d) { return d.type === 'P-Flow D116'; });
var tempSensors = allDevices.filter(function(d) { return d.type === 'Temperature Sensor'; });
```
**Warning signs:** Console errors, empty timeseries sections

### Pitfall 4: Wrong Timeseries Keys for Installation Type
**What goes wrong:** Showing heating keys for cooling measurement or vice versa
**Why it happens:** Not checking installationType before determining keys
**How to avoid:** Always pass installationType to key selection function
**Warning signs:** Power/Energy values are null or missing

### Pitfall 5: Timeseries Response Format Mismatch
**What goes wrong:** Cannot read values from API response
**Why it happens:** ThingsBoard REST API returns array of {ts, value} objects, not direct values
**How to avoid:** Extract latest value correctly
```javascript
// Response: { "temperature": [{ "ts": 123456, "value": "25.5" }] }
function getLatestValue(response, key) {
  if (response && response[key] && response[key].length > 0) {
    return response[key][0].value; // First element is latest
  }
  return null;
}
```
**Warning signs:** Values show as "[object Object]" or undefined

## Code Examples

Verified patterns from official sources and existing codebase:

### Complete Timeseries Fetching Flow
```javascript
// Source: Adapted from ECO Data Importer.js + ThingsBoard REST API docs
function fetchAllTimeseries() {
  if (vm.isRefreshing) return;
  vm.isRefreshing = true;

  var fetchPromises = [];

  // Fetch P-Flow timeseries
  var pflowDevices = vm.allDevices.filter(function(d) {
    return d.type === 'P-Flow D116';
  });
  var pflowKeys = getPFlowTimeseriesKeys(vm.installationType);

  pflowDevices.forEach(function(device) {
    fetchPromises.push(
      fetchDeviceTimeseries(device.id, pflowKeys).then(function(data) {
        return { deviceId: device.id.id, type: 'P-Flow D116', data: data };
      })
    );
  });

  // Fetch Temperature Sensor timeseries
  var tempSensors = vm.allDevices.filter(function(d) {
    return d.type === 'Temperature Sensor';
  });

  tempSensors.forEach(function(device) {
    fetchPromises.push(
      fetchDeviceTimeseries(device.id, ['temperature']).then(function(data) {
        return { deviceId: device.id.id, type: 'Temperature Sensor', data: data };
      })
    );
  });

  Promise.all(fetchPromises).then(function(results) {
    // Update device objects with timeseries data
    results.forEach(function(result) {
      var device = findDeviceById(result.deviceId);
      if (device) {
        device.timeseries = processTimeseriesResponse(result.data);
      }
    });
    vm.isRefreshing = false;
    vm.lastRefresh = new Date();
  }).catch(function(error) {
    console.error('Error fetching timeseries:', error);
    vm.isRefreshing = false;
  });
}
```

### HTML Template for Timeseries Display
```html
<!-- Source: ECO Project Wizard patterns + new timeseries section -->
<!-- Timeseries Data Section (inside device item) -->
<div *ngIf="device.timeseries && device.timeseries.length > 0"
     class="timeseries-section"
     style="margin-left: 22px; margin-top: 8px; padding: 6px; background: #f0f8ff; border-radius: 4px;">
  <ng-container *ngFor="let ts of device.timeseries">
    <div class="flex items-center gap-2" style="font-size: 11px; margin-bottom: 2px;">
      <span style="color: #666; min-width: 100px;">{{ ts.label }}:</span>
      <span style="font-weight: 500; color: #305680;">{{ ts.formattedValue }}</span>
    </div>
  </ng-container>
</div>
```

### Refresh Button in Toolbar
```html
<!-- Source: ECO Project Wizard dialog patterns -->
<mat-toolbar class="flex items-center" style="background-color: #305680; color: white;">
  <mat-icon style="margin-right: 12px;">info</mat-icon>
  <h2 style="margin: 0; font-size: 18px;">Measurement Info</h2>
  <span class="flex-1"></span>
  <button mat-icon-button (click)="refresh()" [disabled]="isRefreshing"
          type="button" title="Refresh data">
    <mat-icon [class.spinning]="isRefreshing">refresh</mat-icon>
  </button>
  <button mat-icon-button (click)="cancel()" type="button">
    <mat-icon>close</mat-icon>
  </button>
</mat-toolbar>
```

### CSS for Spinning Refresh Icon
```css
/* Source: Standard CSS animation pattern */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.spinning {
  animation: spin 1s linear infinite;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| WebSocket for all live data | REST API polling for dialogs | TB 3.x+ | Simpler for temporary UIs |
| Manual AJAX calls | widgetContext.http | TB 3.x+ | Automatic auth handling |
| Inline timers | Stored interval references | Best practice | Proper cleanup possible |

**Deprecated/outdated:**
- None identified - all patterns are current in ThingsBoard 4.2 PE

## Open Questions

Things that couldn't be fully resolved:

1. **Timeseries Key Availability**
   - What we know: P-Flow devices should have heating/cooling keys based on setup
   - What's unclear: Do all P-Flow devices have all common keys, or only configured ones?
   - Recommendation: Fetch all relevant keys, display only those with values (null-check)

2. **Temperature Sensor Key Name**
   - What we know: PROJECT.md says "temperature" key
   - What's unclear: Is the exact key name confirmed in production devices?
   - Recommendation: Use "temperature" as specified, handle missing gracefully

3. **Last Refresh Timestamp Display**
   - What we know: User should know when data was last updated
   - What's unclear: Format preference (relative "5s ago" vs absolute time)
   - Recommendation: Show absolute time for clarity, update on each refresh

## Sources

### Primary (HIGH confidence)
- ThingsBoard REST Telemetry API: `/api/plugins/telemetry/{entityType}/{entityId}/values/timeseries` - Official ThingsBoard documentation
- `/Users/jiridockal/development/ECO-TB/js library/ECO Data Importer.js` line 1781 - `widgetContext.http.get()` usage pattern
- `/Users/jiridockal/development/ECO-TB/js library/ECO Project Wizard.js` lines 2185-2577 - Existing dialog implementation
- Context7 ThingsBoard documentation - Widget API lifecycle (onDestroy for cleanup)

### Secondary (MEDIUM confidence)
- `/Users/jiridockal/development/ECO-TB/.planning/PROJECT.md` - Timeseries key definitions
- ThingsBoard widget development guide - setInterval/clearInterval cleanup patterns

### Tertiary (LOW confidence)
- Web search results for ThingsBoard widget timer cleanup - General patterns confirmed against codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - widgetContext.http and REST API verified in codebase
- Architecture: HIGH - Patterns extracted from existing ECO-TB code
- Pitfalls: HIGH - Based on JavaScript best practices and observed patterns
- Code examples: HIGH - Adapted from working codebase with verified patterns

**Research date:** 2026-01-27
**Valid until:** 60 days (stable platform, patterns from existing codebase)
