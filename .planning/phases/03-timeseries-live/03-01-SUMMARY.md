---
phase: 03-timeseries-live
plan: 01
status: complete
completed: 2026-01-27
---

# Plan 03-01 Summary: Add timeseries fetching and auto-refresh

## Objective

Add live timeseries data fetching and display to the Measurement Info dialog with 5-second auto-refresh.

## Deliverables

| Deliverable | Status | Location |
|-------------|--------|----------|
| Timeseries fetching logic | ✓ Complete | js library/ECO Project Wizard.js |
| Auto-refresh (5s interval) | ✓ Complete | js library/ECO Project Wizard.js |
| Refresh button UI | ✓ Complete | js library/ECO Project Wizard.js |
| Loading indicator | ✓ Complete | js library/ECO Project Wizard.js |

## Tasks Completed

| Task | Name | Status | Files |
|------|------|--------|-------|
| 1 | Add timeseries fetching logic | ✓ Complete | js library/ECO Project Wizard.js |
| 2 | Update HTML template for timeseries display | ✓ Complete | js library/ECO Project Wizard.js |
| 3 | Human verification | ✓ Approved | User verified |

## What Was Built

### Timeseries Fetching (Task 1)
- TIMESERIES_UNITS and TIMESERIES_LABELS constants for value formatting
- `getPFlowTimeseriesKeys()` - returns heating or cooling keys based on installationType
- `fetchDeviceTimeseries()` - REST API call to /api/plugins/telemetry endpoint
- `processTimeseriesResponse()` - extracts latest values with labels
- `fetchAllTimeseries()` - orchestrates fetching for all devices
- `setInterval` for 5-second auto-refresh
- `clearInterval` cleanup on dialog close (no memory leak)

### HTML Template (Task 2)
- Refresh button in toolbar with spinning icon
- Progress bar shows during refresh
- Timeseries data displayed under each device
- Last refresh timestamp at bottom
- Spinning animation CSS

## Requirements Satisfied

| Requirement | How Satisfied |
|-------------|---------------|
| TS-01 | P-Flow Heating: CHC_S_Heating_Power, CHS_M_Heating_Energy |
| TS-02 | P-Flow Cooling: CHC_S_Cooling_Power, CHC_M_Cooling_Energy |
| TS-03 | P-Flow Common: VolumeFlow, Volume, TempDiff, TempFlow, TempReturn, Velocity |
| TS-04 | Temperature Sensor: temperature value with °C |
| LIVE-01 | Auto-refresh every 5 seconds via setInterval |
| LIVE-02 | Manual refresh button in toolbar |
| LIVE-03 | Loading indicator (progress bar + spinning icon) |

## Verification

- User approved timeseries display and auto-refresh functionality
- Values update automatically every 5 seconds
- No memory leak on dialog close

---
*Completed: 2026-01-27*
