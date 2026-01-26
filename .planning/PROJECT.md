# Measurement Live Data Popup

## What This Is

Ein Live-Daten-Popup für das ECO Smart Diagnostics Measurements Dashboard, das Echtzeit-Telemetrie von Messungen und zugehörigen Geräten anzeigt. Ermöglicht schnellen Überblick über Messwerte ohne das Dashboard verlassen zu müssen.

## Core Value

Benutzer können auf einen Blick den aktuellen Status einer Messung sehen — Live-Werte, Gerätestatus, und Verbindungszustand — direkt aus der Measurement-Übersicht.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Popup zeigt entityLabel und entityName der Messung
- [ ] Popup zeigt installationType Attribut (heating/cooling)
- [ ] Popup zeigt P-Flow Timeseries basierend auf installationType:
  - Heating: CHC_S_Heating_Power (kW), CHS_M_Heating_Energy (kWh)
  - Cooling: CHC_S_Cooling_Power (kW), CHC_M_Cooling_Energy (kWh)
  - Common: CHC_S_VolumeFlow, CHC_M_Volume, CHC_S_TemperatureDiff, CHC_S_TemperatureFlow, CHC_S_TemperatureReturn, CHC_S_Velocity
- [ ] Popup zeigt temperature Timeseries für jeden Temperature Sensor
- [ ] Popup zeigt alle Geräte mit Measurement-Relation (FROM, type: Measurement)
- [ ] Für jedes Gerät: lastActivityTime als DD.MM.YYYY hh:mm:ss, active Status
- [ ] Popup zeigt assigned Diagnostic Kit (Name/Label)
- [ ] Auto-Refresh alle 5 Sekunden
- [ ] Refresh Button für manuelles Aktualisieren
- [ ] Button: Navigation zu Device Details
- [ ] Button: Navigation zu Measurement Dashboard
- [ ] Button: Measurement Parameters öffnen
- [ ] Styling konsistent mit ECO Project Wizard Dialogen

### Out of Scope

- Historische Datenvisualisierung (Charts) — eigenes Dashboard existiert bereits
- Gerätekonfiguration im Popup — zu komplex für Overlay
- Alarme anzeigen — separater Alarm-State vorhanden

## Context

**Plattform:** ThingsBoard 4.2 PE
**Dashboard:** Measurements (`dashboards/measurements.json`)
**State:** Measurements_card
**Widget:** Entity Table mit Measurement-Liste

**Bestehende Patterns:**
- ECO Project Wizard.js — Dialog-Styling, Form-Handling
- Custom Actions mit `customPretty` oder `custom` type
- ThingsBoard Services: attributeService, entityRelationService, telemetryService

**Geräte-Typen mit Measurement-Relation:**
- P-Flow D116 (Ultraschall-Durchflussmesser)
- Temperature Sensor
- Diagnostic Kit
- Weitere können hinzukommen

**Timeseries Keys:**
| Key | Einheit | Typ |
|-----|---------|-----|
| CHC_S_Heating_Power | kW | Heating only |
| CHS_M_Heating_Energy | kWh | Heating only |
| CHC_S_Cooling_Power | kW | Cooling only |
| CHC_M_Cooling_Energy | kWh | Cooling only |
| CHC_S_VolumeFlow | l/hr | Both |
| CHC_M_Volume | m³ | Both |
| CHC_S_TemperatureDiff | °C | Both |
| CHC_S_TemperatureFlow | °C | Both |
| CHC_S_TemperatureReturn | °C | Both |
| CHC_S_Velocity | m/s | Both |
| temperature | °C | Temp Sensor |

## Constraints

- **Platform:** ThingsBoard 4.2 PE — muss TB Dialog API verwenden
- **Styling:** Muss zu bestehenden ECO Dialogen passen
- **Performance:** 5s Refresh darf UI nicht blockieren
- **Compatibility:** Funktioniert für TENANT_ADMIN und CUSTOMER_USER

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| ECO Project Wizard Library erweitern | Konsistentes Styling, wiederverwendbar | — Pending |
| 5s Auto-Refresh | Balance zwischen Aktualität und Performance | — Pending |
| Alle Geräte mit Measurement-Relation zeigen | Flexibel für neue Gerätetypen | — Pending |

---
*Last updated: 2025-01-26 after initialization*
