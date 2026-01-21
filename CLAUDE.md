# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**Project:** ECO Smart Diagnostics
**Client:** ECO Energy Group
**Platform:** ThingsBoard 4.2 PE (Professional Edition)
**Purpose:** HVAC/Building Automation Monitoring and Control System

## Directory Structure

```
ECO TB/
├── dashboards/           # ThingsBoard dashboard configurations
├── js library/           # JavaScript utility libraries
├── rule chains/          # ThingsBoard rule chains for data processing
└── widgets/              # Custom widget implementations
```

## Dashboards (`/dashboards/`)

| File | Description |
|------|-------------|
| `smart_diagnostics_measurements.json` | Main telemetry and measurement display (3.4 MB) |
| `smart_diagnostics_administration.json` | System configuration and management (2.2 MB) |
| `smart_diagnostics_navigation.json` | Navigation between dashboard views |
| `smart_diagnostics_analysis.json` | Data analysis dashboard |
| `smart_diagnostics_alarming.json` | Alarm and alert management |

### Dashboard Configuration Structure
- `configuration.widgets` - Widget definitions with layout and settings
- `configuration.entityAliases` - Dynamic entity references
- `configuration.states` - Dashboard state controller for view transitions

## JavaScript Libraries (`/js library/`)

| File | Description |
|------|-------------|
| `ECO Data Importer.js` | CSV data import dialog with stepper wizard |
| `ECO_Diagnostics_Utils_JS_FINAL.js` | Utility functions for diagnostics calculations |

## Rule Chains (`/rule chains/`)

| File | Description |
|------|-------------|
| `root_rule_chain.json` | Main entry point for message processing |
| `resi_device.json` | Device-specific rules for RESI/heating systems |
| `resi.json` | Supporting RESI processing rules |
| `get_openweather_data_rest_api.json` | OpenWeather API integration |

## Custom Widgets (`/widgets/`)

| File | Description |
|------|-------------|
| `SD Administration Entities Table Gateways.json` | Gateway entities table |
| `SD Administration Map Projects.json` | Interactive project map (Administration) |
| `SD Map Projects.json` | Project map widget |

## Development Guidelines

### Working with Dashboards
- Dashboard JSON files are large - use specific paths when editing
- Widgets are embedded in `configuration.widgets.<widget-id>`
- Entity aliases defined in `configuration.entityAliases` - reference by ID
- Always validate JSON after modifications

### Widget Configuration
- `config.datasources` - Data source definitions with entity aliases
- `config.dataKeys` - Telemetry, attributes, or entity fields
- `config.settings` - Widget-specific display settings
- Value transformation functions: `getValueFunctionBody`, `postFuncBody`

### Rule Chain Development
- Rule chains define message processing flow
- Connect nodes via `connections` array using `fromIndex` and `toIndex`
- Node types include: filter, transformation, action, external

### JavaScript Libraries
- Libraries are used within ThingsBoard widgets and rule chains
- Follow existing patterns for utility functions
- Document functions with JSDoc comments

## Common Device Types

- P-Flow D116 (flow sensors)
- Room Sensors (temperature, CO2, humidity)
- Temperature Sensors
- HVAC control devices (Belimo)
- RESI heating system controllers

## ThingsBoard 4.2 PE Specifics

- Uses Professional Edition features
- Entity aliases support complex filtering
- Dashboard states enable multi-view navigation
- Custom widgets support Angular components
