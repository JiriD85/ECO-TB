# Phase 5: Diagnostic Roomkit (LoRaWAN) - Research

**Researched:** 2026-01-27
**Domain:** ThingsBoard widget extension - LoRaWAN device telemetry display
**Confidence:** HIGH

## Summary

This phase extends the existing Measurement Info Dialog (implemented in Phases 1-4) to support Room Sensor CO2 devices. The implementation is straightforward as the dialog already has the architecture for fetching and displaying device timeseries data.

The Room Sensor CO2 device sends four telemetry keys: `co2`, `temperature`, `humidity`, and `battery`. These need to be added to the existing TIMESERIES_UNITS and TIMESERIES_LABELS constants, and the `fetchAllTimeseries` function needs a new condition for the 'Room Sensor CO2' device type.

**Primary recommendation:** Extend the existing timeseries fetching pattern by adding a `else if (info.type === 'Room Sensor CO2')` condition with keys `['co2', 'temperature', 'humidity', 'battery']`, following the established Temperature Sensor pattern.

## Standard Stack

### Core (Already in Place)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ThingsBoard REST API | 4.2 PE | Telemetry fetching | `/api/plugins/telemetry/DEVICE/{id}/values/timeseries` |
| Angular Template | Built-in | Dynamic UI rendering | `*ngFor` for timeseries display |
| ES6 Promises | Native | Async operations | `Promise.all` for parallel fetching |

### No Additional Libraries Needed

The existing implementation already provides all required infrastructure:
- `fetchDeviceTimeseries(deviceId, keys)` - REST API wrapper
- `processTimeseriesResponse(response, keys)` - Response processing
- `formatTimeseriesValue(key, value)` - Value formatting with units
- HTML template with `*ngFor` timeseries rendering

## Architecture Patterns

### Recommended Approach: Extend Existing Pattern

The current implementation handles device types in `fetchAllTimeseries()`:

```javascript
// Current pattern (lines 2857-2863)
deviceInfos.forEach(function(info) {
  var keys = [];
  if (info.type === 'P-Flow D116') {
    keys = pflowKeys;
  } else if (info.type === 'Temperature Sensor') {
    keys = ['temperature'];
  }
  // Add Room Sensor CO2 here
});
```

**Extension pattern:**
```javascript
else if (info.type === 'Room Sensor CO2') {
  keys = ['co2', 'temperature', 'humidity', 'battery'];
}
```

### Pattern 1: Constants-Based Configuration

**What:** Define units and labels in constants at module level
**When to use:** All device type telemetry configurations
**Current implementation:**

```javascript
// Source: ECO Project Wizard.js lines 2221-2247
const TIMESERIES_UNITS = {
  'CHC_S_Power_Heating': 'kW',
  'temperature': '°C',
  // Add new keys here
};

const TIMESERIES_LABELS = {
  'CHC_S_Power_Heating': 'Power',
  'temperature': 'Temperature',
  // Add new keys here
};
```

### Pattern 2: Device Type Conditional Fetching

**What:** Switch/if-else to determine telemetry keys based on device.type
**When to use:** Different device types need different telemetry keys
**Current implementation location:** `fetchAllTimeseries()` function in controller

### Anti-Patterns to Avoid

- **Hardcoding keys in fetch call:** Use constants for maintainability
- **Separate fetch logic per device type:** Keep all fetching in single `fetchAllTimeseries()` loop
- **Breaking the existing P-Flow/Temperature pattern:** Follow the same conditional structure

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Telemetry API calls | Custom fetch logic | Existing `fetchDeviceTimeseries()` | Already handles errors and response parsing |
| Value formatting | Inline formatting | Existing `formatTimeseriesValue()` | Handles units and decimal places |
| Response processing | Manual iteration | Existing `processTimeseriesResponse()` | Creates structured array for template |

**Key insight:** The Phase 3 implementation created a robust, extensible pattern. Adding Room Sensor CO2 requires only configuration additions, not architectural changes.

## Common Pitfalls

### Pitfall 1: Wrong Device Type String

**What goes wrong:** Device type comparison fails silently
**Why it happens:** Device type strings must match exactly what ThingsBoard stores
**How to avoid:** Use exact string from `deviceSearchQuery.deviceTypes` array: `'Room Sensor CO2'`
**Warning signs:** Room Sensor CO2 devices appear in list but have no timeseries data

### Pitfall 2: Duplicate Constant Keys

**What goes wrong:** Temperature key collision between Temperature Sensor and Room Sensor CO2
**Why it happens:** Both devices send 'temperature' telemetry
**How to avoid:** The 'temperature' key already exists in constants - no conflict, just reuse
**Warning signs:** N/A - not a real issue due to key reuse

### Pitfall 3: Missing Units in Constants

**What goes wrong:** Values display without units (e.g., "450" instead of "450 ppm")
**Why it happens:** New keys not added to TIMESERIES_UNITS
**How to avoid:** Add ALL four keys to both TIMESERIES_UNITS and TIMESERIES_LABELS
**Warning signs:** Timeseries display shows raw numbers without units

## Code Examples

### Example 1: Add Room Sensor CO2 Constants

```javascript
// Source: ECO Project Wizard.js - extend existing TIMESERIES_UNITS
const TIMESERIES_UNITS = {
  // ... existing P-Flow keys ...
  'temperature': '°C',      // Already exists for Temperature Sensor
  'co2': 'ppm',             // NEW
  'humidity': '%',          // NEW
  'battery': '%'            // NEW
};

const TIMESERIES_LABELS = {
  // ... existing P-Flow keys ...
  'temperature': 'Temperature', // Already exists
  'co2': 'CO2',                  // NEW
  'humidity': 'Humidity',        // NEW
  'battery': 'Battery'           // NEW
};
```

### Example 2: Extend fetchAllTimeseries Device Type Handling

```javascript
// Source: ECO Project Wizard.js - extend in fetchAllTimeseries()
deviceInfos.forEach(function(info) {
  var keys = [];
  if (info.type === 'P-Flow D116') {
    keys = pflowKeys;
  } else if (info.type === 'Temperature Sensor') {
    keys = ['temperature'];
  } else if (info.type === 'Room Sensor CO2') {
    keys = ['co2', 'temperature', 'humidity', 'battery'];
  }
  // Rest of fetch logic unchanged
});
```

## Room Sensor CO2 Telemetry Specification

### Verified Telemetry Keys (HIGH confidence)

| Key | Unit | Label | Description |
|-----|------|-------|-------------|
| `co2` | ppm | CO2 | Carbon dioxide concentration in parts per million |
| `temperature` | °C | Temperature | Room temperature |
| `humidity` | % | Humidity | Relative humidity percentage |
| `battery` | % | Battery | Battery level percentage |

**Source:** Verified from dashboard configurations in:
- `dashboards/energiemanagement_administration.json` (lines 1838, 1691-1721)
- `dashboards/smart_property_administration_main.json`
- `dashboards/retrofit_partner_administration.json`

### Device Type String (HIGH confidence)

The exact device type string is: `'Room Sensor CO2'`

**Source:**
- `ECO Project Wizard.js` line 2666: `deviceTypes: ['P-Flow D116', 'Room Sensor CO2', 'Temperature Sensor', 'RESI']`
- Device is already included in the search query, so it's already loaded in the dialog

### measurementType Association

LoRaWAN measurements use `measurementType: 'lorawan'` or `'loraWan'` (legacy).

**Source:**
- `ECO Project Wizard.js` lines 72-77 (getMeasurementTypeStyle handling)
- `ECO Diagnostics Utils JS.js` lines 118-123

**Note:** The device type ('Room Sensor CO2') determines which telemetry keys to fetch, NOT the measurementType. A measurement with measurementType 'lorawan' should have Room Sensor CO2 devices related to it.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No timeseries for Room Sensor | Will display 4 telemetry values | Phase 5 | Complete device coverage |

**Deprecated/outdated:**
- None - this is a new feature addition

## Open Questions

### Question 1: Should Room Sensor have a different display style?

- What we know: Current timeseries display uses blue left border (`border-left: 3px solid #305680`)
- What's unclear: Should LoRaWAN devices use orange styling to match the measurementType badge?
- Recommendation: Keep consistent blue styling for now - all timeseries data uses same visual treatment

### Question 2: Battery level threshold alerts?

- What we know: Battery is a percentage value
- What's unclear: Should low battery (<20%) show a warning color?
- Recommendation: Not in scope for Phase 5 - could be a future enhancement

### Question 3: RESI device telemetry?

- What we know: RESI is in the deviceTypes array but has no timeseries handling
- What's unclear: What telemetry does RESI send?
- Recommendation: Out of scope - focus on Room Sensor CO2 only

## Implementation Checklist

1. Add `co2`, `humidity`, `battery` keys to `TIMESERIES_UNITS` constant
2. Add `co2`, `humidity`, `battery` keys to `TIMESERIES_LABELS` constant
3. Add `else if (info.type === 'Room Sensor CO2')` condition in `fetchAllTimeseries()`
4. Test with a measurement that has Room Sensor CO2 devices
5. Verify all 4 values display with correct units and labels

**Estimated complexity:** Low - approximately 10 lines of code changes

## Sources

### Primary (HIGH confidence)

- `js library/ECO Project Wizard.js` - Current implementation, device types, timeseries logic
- `dashboards/energiemanagement_administration.json` - Telemetry key usage verification
- `dashboards/retrofit_partner_administration.json` - Room Sensor CO2 device type string

### Secondary (MEDIUM confidence)

- `translation/en_US_custom_translation.json` - Label patterns (Temperature, Humidity in i18n)
- `ECO Diagnostics Utils JS.js` - measurementType styling (lorawan case)

### Tertiary (LOW confidence)

- None - all findings verified from codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Existing implementation fully documented
- Architecture: HIGH - Pattern already established in Phase 3
- Pitfalls: HIGH - Based on actual codebase review
- Telemetry keys: HIGH - Verified from multiple dashboard configurations

**Research date:** 2026-01-27
**Valid until:** Indefinite - based on stable codebase patterns
