# Phase 4: Actions - Research

**Researched:** 2026-01-27
**Domain:** ThingsBoard 4.2 PE Dashboard State Navigation, Custom Dialog Actions
**Confidence:** HIGH

## Summary

This research investigates how to add navigation and action buttons to the existing `openMeasurementInfoDialog()` dialog implemented in Phases 1-3. The phase requires three actions: (1) navigate to Device Details state, (2) navigate to Measurement Dashboard state, and (3) open the existing Parameters Dialog.

The standard approach uses ThingsBoard's `stateController` API to navigate between dashboard states. The key methods are `widgetContext.stateController.openState(stateId, params, openRightLayout)` for navigation to a new state and `widgetContext.stateController.updateState(stateId, params)` for updating the current state. Both methods accept entity parameters that pass context to the target state.

The codebase already demonstrates this pattern in multiple widgets (SD Map Projects, SD Administration widgets). For dialog-triggered navigation, the dialog must first be closed, then navigation executed. The existing `openMeasurementParametersDialog()` function provides a template for opening nested dialogs.

**Primary recommendation:** Add a button row to the dialog footer with three mat-raised-button elements: "Details" (navigates to measurement_details_heating_full or measurement_details_cooling_full based on installationType), "Dashboard" (navigates to Measurements_card state with selectedMeasurement parameter), and "Parameters" (calls existing openMeasurementParametersDialog function). Close dialog before navigation to prevent orphaned state.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Component | Version/Type | Purpose | Why Standard |
|-----------|--------------|---------|--------------|
| stateController.openState | TB 4.2 API | Navigate to new dashboard state | Native TB API, documented |
| stateController.updateState | TB 4.2 API | Update current state with new params | Native TB API, documented |
| widgetContext | TB Widget API | Access to dashboard context and state | Standard widget context |
| mat-raised-button | Angular Material | Action buttons in dialogs | Used throughout ECO dialogs |

### Supporting
| Component | Purpose | When to Use |
|-----------|---------|-------------|
| mat-icon | Button icons | Visual affordance for actions |
| openMeasurementParametersDialog | Existing dialog | ACT-03 Parameters action |
| dialogRef.close() | Close dialog | Before navigation to prevent orphaned dialogs |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| stateController.openState | window.location | openState maintains dashboard context, cleaner |
| Buttons in footer | Actions in toolbar | Footer is standard location for dialog actions |
| Close-then-navigate | Navigate-only | Dialog must close to prevent memory leaks from orphaned intervals |

**No Installation Required:** All components are part of ThingsBoard or existing ECO codebase.

## Architecture Patterns

### Recommended Button Layout
```
Footer area (existing):
[             Close  ]

New footer area:
[ Details ] [ Dashboard ] [ Parameters ]  [     Close ]
```

### Pattern 1: Navigate to Dashboard State from Dialog
**What:** Close dialog and navigate to a specific dashboard state with entity context
**When to use:** ACT-01 (Device Details) and ACT-02 (Measurement Dashboard)
**Example:**
```javascript
// Source: Context7 ThingsBoard docs + existing codebase widgets/SD Administration Map Projects.json
vm.navigateToState = function(stateId) {
  // 1. Clear interval first to prevent orphaned timers
  if (vm.refreshInterval) {
    clearInterval(vm.refreshInterval);
    vm.refreshInterval = null;
  }

  // 2. Build params with measurement entity context
  var params = {
    selectedMeasurement: {
      entityId: vm.measurementId,
      entityName: vm.entityName,
      entityLabel: vm.entityLabel
    },
    targetEntityParamName: 'selectedMeasurement'
  };

  // 3. Close dialog
  vm.dialogRef.close(null);

  // 4. Navigate to state (use widgetContext from closure)
  widgetContext.stateController.openState(stateId, params, false);
};
```

### Pattern 2: Determine Target State by installationType
**What:** Select correct measurement details state based on heating/cooling type
**When to use:** ACT-01 when navigating to details view
**Example:**
```javascript
// Source: measurements.json dashboard configuration
vm.goToDetails = function() {
  var stateId = vm.installationType === 'cooling'
    ? 'measurement_details_cooling_full'
    : 'measurement_details_heating_full';
  vm.navigateToState(stateId);
};
```

### Pattern 3: Open Existing Parameters Dialog
**What:** Call the existing openMeasurementParametersDialog function
**When to use:** ACT-03 when user wants to edit parameters
**Example:**
```javascript
// Source: ECO Project Wizard.js existing function
vm.openParameters = function() {
  // Clear interval first
  if (vm.refreshInterval) {
    clearInterval(vm.refreshInterval);
    vm.refreshInterval = null;
  }

  // Close current dialog
  vm.dialogRef.close(null);

  // Open parameters dialog (function already exists in same JS module)
  openMeasurementParametersDialog(widgetContext, vm.measurementId, function() {
    // Optional: callback after parameters dialog closes
  });
};
```

### Anti-Patterns to Avoid
- **Not clearing interval before navigation:** Causes orphaned timers, memory leaks
- **Navigating without closing dialog:** Dialog stays open in background
- **Hardcoding state IDs without installationType check:** Wrong state for cooling vs heating
- **Not passing entity parameters:** Target state loses measurement context

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dashboard navigation | Manual URL manipulation | stateController.openState | Maintains TB context |
| Parameters editing | New dialog | openMeasurementParametersDialog | Already exists, tested |
| Button styling | Custom CSS | mat-raised-button | Consistent with ECO dialogs |
| State ID lookup | Manual mapping | installationType check | Two states: heating_full, cooling_full |

**Key insight:** All required functionality exists in the codebase. ACT-03 uses an existing dialog function. ACT-01/02 use standard TB navigation patterns found in other widgets.

## Common Pitfalls

### Pitfall 1: Orphaned Refresh Interval on Navigation
**What goes wrong:** setInterval continues running after dialog closes for navigation, causing API errors
**Why it happens:** Navigation replaces page content but interval was started in dialog scope
**How to avoid:** Always clear interval before dialogRef.close()
```javascript
vm.navigateToState = function(stateId) {
  // CRITICAL: Clear interval FIRST
  if (vm.refreshInterval) {
    clearInterval(vm.refreshInterval);
    vm.refreshInterval = null;
  }
  vm.dialogRef.close(null);
  widgetContext.stateController.openState(stateId, params, false);
};
```
**Warning signs:** Console errors after navigation, multiple API calls in network tab

### Pitfall 2: Wrong State for installationType
**What goes wrong:** Heating measurement opens cooling state or vice versa
**Why it happens:** Using single state ID instead of checking installationType
**How to avoid:** Check installationType before navigation
```javascript
var stateId = (vm.installationType === 'cooling')
  ? 'measurement_details_cooling_full'
  : 'measurement_details_heating_full';
```
**Warning signs:** Wrong data displayed, charts don't match expected type

### Pitfall 3: Navigation Without Entity Context
**What goes wrong:** Target state shows no data or wrong measurement
**Why it happens:** Entity parameters not passed to openState
**How to avoid:** Always include selectedMeasurement in params object
```javascript
var params = {
  selectedMeasurement: {
    entityId: vm.measurementId,
    entityName: vm.entityName,
    entityLabel: vm.entityLabel
  }
};
widgetContext.stateController.openState(stateId, params, false);
```
**Warning signs:** Blank dashboards, "No data" messages

### Pitfall 4: Parameters Dialog Scope Issues
**What goes wrong:** openMeasurementParametersDialog cannot be called from controller
**Why it happens:** Function is module-level export, not available in controller scope
**How to avoid:** Call from closure scope, not vm method directly
```javascript
// In openMeasurementInfoDialog function (outer scope has access)
function openDialog(deviceData) {
  // ...
  function MeasurementInfoDialogController(instance) {
    // vm.openParams can call outer-scope openMeasurementParametersDialog
    vm.openParams = function() {
      clearInterval(vm.refreshInterval);
      vm.dialogRef.close(null);
      openMeasurementParametersDialog(widgetContext, vm.measurementId, callback);
    };
  }
}
```
**Warning signs:** "openMeasurementParametersDialog is not defined" error

## Code Examples

Verified patterns from official sources and existing codebase:

### Complete Navigation Function
```javascript
// Source: Adapted from widgets/SD Administration Map Projects.json + Context7 ThingsBoard docs
function createNavigationActions(vm, widgetContext, measurementId, entityName, entityLabel, installationType) {
  // Navigate to measurement details
  vm.goToDetails = function() {
    cleanupAndClose();
    var stateId = (installationType === 'cooling')
      ? 'measurement_details_cooling_full'
      : 'measurement_details_heating_full';
    var params = buildMeasurementParams();
    widgetContext.stateController.openState(stateId, params, false);
  };

  // Navigate to measurements card (dashboard view)
  vm.goToDashboard = function() {
    cleanupAndClose();
    var params = buildMeasurementParams();
    widgetContext.stateController.openState('Measurements_card', params, false);
  };

  // Open parameters dialog
  vm.openParams = function() {
    cleanupAndClose();
    openMeasurementParametersDialog(widgetContext, measurementId, null);
  };

  function cleanupAndClose() {
    if (vm.refreshInterval) {
      clearInterval(vm.refreshInterval);
      vm.refreshInterval = null;
    }
    vm.dialogRef.close(null);
  }

  function buildMeasurementParams() {
    return {
      selectedMeasurement: {
        entityId: measurementId,
        entityName: entityName,
        entityLabel: entityLabel
      },
      targetEntityParamName: 'selectedMeasurement'
    };
  }
}
```

### HTML Template for Action Buttons
```html
<!-- Source: ECO Project Wizard dialog patterns + Material button styling -->
<div class="flex justify-end items-center gap-2 p-4" style="border-top: 1px solid #e0e0e0; background: #fafafa;">
  <button mat-raised-button type="button" (click)="goToDetails()"
          style="background-color: #305680; color: white;">
    <mat-icon style="margin-right: 4px; font-size: 18px; width: 18px; height: 18px;">analytics</mat-icon>
    Details
  </button>
  <button mat-raised-button type="button" (click)="goToDashboard()"
          style="background-color: #27AE60; color: white;">
    <mat-icon style="margin-right: 4px; font-size: 18px; width: 18px; height: 18px;">dashboard</mat-icon>
    Dashboard
  </button>
  <button mat-raised-button type="button" (click)="openParams()"
          style="background-color: #F2994A; color: white;">
    <mat-icon style="margin-right: 4px; font-size: 18px; width: 18px; height: 18px;">settings</mat-icon>
    Parameters
  </button>
  <span class="flex-1"></span>
  <button mat-raised-button color="primary" type="button" (click)="cancel()">
    Close
  </button>
</div>
```

### State Controller API Reference
```javascript
// Source: Context7 ThingsBoard documentation
// Navigate to new state (pushes to navigation stack)
widgetContext.stateController.openState(stateId, params, openRightLayout);
// Arguments:
// - stateId: string - Target dashboard state ID
// - params: object - Entity parameters for target state
// - openRightLayout: boolean - Force right layout in mobile view (optional)

// Update current state (replaces params without navigation)
widgetContext.stateController.updateState(stateId, params, openRightLayout);
// Arguments: same as openState

// Get current state parameters
var currentParams = widgetContext.stateController.getStateParams();
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| window.location.href | stateController.openState | TB 3.x+ | Proper context preservation |
| Multiple dialogs open | Close-then-open pattern | Best practice | Cleaner UX, no dialog stacking |
| Manual param building | Structured entity params | TB standard | Consistent with TB entity handling |

**Deprecated/outdated:**
- Direct URL navigation from widgets (use stateController instead)
- Keeping dialogs open during navigation (always close first)

## Available Dashboard States

For Phase 4 navigation targets:

| State ID | Purpose | Use Case |
|----------|---------|----------|
| `measurement_details_heating_full` | Full measurement details (heating) | ACT-01 when installationType='heating' |
| `measurement_details_cooling_full` | Full measurement details (cooling) | ACT-01 when installationType='cooling' |
| `Measurements_card` | Measurements table view | ACT-02 Measurement Dashboard |

**Note:** The "Device Details" navigation (ACT-01) maps to the measurement details state, not a separate device state. The measurement details state shows device-level data for the measurement.

## Open Questions

Things that couldn't be fully resolved:

1. **State Parameter Naming Convention**
   - What we know: `selectedMeasurement` is used in existing navigation patterns
   - What's unclear: Is `targetEntityParamName` always required?
   - Recommendation: Include both for compatibility with existing patterns

2. **Callback After Parameters Dialog**
   - What we know: openMeasurementParametersDialog accepts a callback
   - What's unclear: Should info dialog reopen after parameters dialog closes?
   - Recommendation: No reopen needed - user can click Info action again if needed

3. **Button Color Scheme**
   - What we know: ECO uses blue (#305680) as primary color
   - What's unclear: Should all buttons be same color or differentiated?
   - Recommendation: Differentiate by function (blue=details, green=dashboard, orange=parameters) for visual clarity

## Sources

### Primary (HIGH confidence)
- Context7 /thingsboard/thingsboard.github.io - stateController.openState and updateState documentation
- `/Users/jiridockal/development/ECO-TB/widgets/SD Administration Map Projects.json` line 181 - openState usage pattern
- `/Users/jiridockal/development/ECO-TB/js library/ECO Project Wizard.js` lines 1807-2000 - openMeasurementParametersDialog implementation
- `/Users/jiridockal/development/ECO-TB/dashboards/measurements.json` - Available state IDs

### Secondary (MEDIUM confidence)
- `/Users/jiridockal/development/ECO-TB/scripts/update-header-widgets-v2.js` - ctx.stateController usage patterns
- `/Users/jiridockal/development/ECO-TB/.planning/codebase/INTEGRATIONS.md` - ThingsBoard widget services

### Tertiary (LOW confidence)
- None - all patterns verified against codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - stateController API verified in Context7 and codebase
- Architecture: HIGH - Patterns extracted from existing ECO-TB widgets
- Pitfalls: HIGH - Based on existing dialog implementation (Phase 1-3 learnings)
- Code examples: HIGH - Adapted from working codebase patterns

**Research date:** 2026-01-27
**Valid until:** 60 days (stable platform, patterns from existing codebase)
