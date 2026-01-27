# Measurement Live Data Popup

## What This Is

Ein Live-Daten-Popup für das ECO Smart Diagnostics Measurements Dashboard, das Echtzeit-Telemetrie von Messungen und zugehörigen Geräten anzeigt. Ermöglicht schnellen Überblick über Messwerte ohne das Dashboard verlassen zu müssen.

## Core Value

Benutzer können auf einen Blick den aktuellen Status einer Messung sehen — Live-Werte, Gerätestatus, und Verbindungszustand — direkt aus der Measurement-Übersicht.

## Current State

**Shipped:** v1.0 (2026-01-27)

Funktionierendes Measurement Info Popup mit:
- Entity info display (name, label, installationType badge)
- Device loading mit Diagnostic Kit grouping
- Live timeseries für P-Flow, Temperature Sensor, Room Sensor CO2
- 5s auto-refresh mit dynamischer Anpassung
- Navigation buttons (Details, Dashboard, Parameters)

**Main artifact:** `js library/ECO Project Wizard.js` (3,719 lines)

## Requirements

### Validated

- ✓ Popup zeigt entityLabel und entityName — v1.0
- ✓ Popup zeigt installationType Badge (heating/cooling) — v1.0
- ✓ P-Flow Timeseries (Power, Energy, VolumeFlow, Volume, TempDiff, etc.) — v1.0
- ✓ Temperature Sensor timeseries — v1.0
- ✓ Room Sensor CO2 timeseries (co2, temperature, humidity, battery) — v1.0
- ✓ Alle Geräte mit Measurement-Relation laden und anzeigen — v1.0
- ✓ Diagnostic Kit hervorheben — v1.0
- ✓ lastActivityTime als DD.MM.YYYY hh:mm:ss — v1.0
- ✓ active Status visualisieren (grün/rot/grau) — v1.0
- ✓ Auto-Refresh alle 5 Sekunden — v1.0
- ✓ Refresh Button — v1.0
- ✓ Loading Indicator — v1.0
- ✓ Navigation zu Device Details — v1.0
- ✓ Navigation zu Dashboard — v1.0
- ✓ Parameters Dialog öffnen — v1.0
- ✓ ECO Project Wizard Styling — v1.0

### Active

(None — v1.0 complete)

### Out of Scope

- Historische Datenvisualisierung (Charts) — eigenes Dashboard existiert bereits
- Gerätekonfiguration im Popup — zu komplex für Overlay
- Alarme anzeigen — separater Alarm-State vorhanden
- RESI device timeseries — no telemetry keys defined yet

## Context

**Plattform:** ThingsBoard 4.2 PE
**Dashboard:** Measurements (`dashboards/measurements.json`)
**State:** Measurements_card
**Widget:** Entity Table mit Measurement-Liste

**Geräte-Typen mit Measurement-Relation:**
- P-Flow D116 (Ultraschall-Durchflussmesser)
- Temperature Sensor
- Room Sensor CO2 (LoRaWAN)
- Diagnostic Kit
- RESI (no timeseries yet)

**Timeseries Keys:**
| Key | Einheit | Gerätetyp |
|-----|---------|-----------|
| CHC_S_Power_Heating | kW | P-Flow (heating) |
| CHC_M_Energy_Heating | kWh | P-Flow (heating) |
| CHC_S_Power_Cooling | kW | P-Flow (cooling) |
| CHC_M_Energy_Cooling | kWh | P-Flow (cooling) |
| CHC_S_VolumeFlow | l/hr | P-Flow |
| CHC_M_Volume | m³ | P-Flow |
| CHC_S_TemperatureDiff | °C | P-Flow |
| CHC_S_TemperatureFlow | °C | P-Flow |
| CHC_S_TemperatureReturn | °C | P-Flow |
| CHC_S_Velocity | m/s | P-Flow |
| temperature | °C | Temperature Sensor, Room Sensor CO2 |
| co2 | ppm | Room Sensor CO2 |
| humidity | % | Room Sensor CO2 |
| battery | % | Room Sensor CO2 |

## Constraints

- **Platform:** ThingsBoard 4.2 PE — muss TB Dialog API verwenden
- **Styling:** Muss zu bestehenden ECO Dialogen passen
- **Performance:** 5s Refresh darf UI nicht blockieren
- **Compatibility:** Funktioniert für TENANT_ADMIN und CUSTOMER_USER

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| ECO Project Wizard Library erweitern | Konsistentes Styling, wiederverwendbar | ✓ Good |
| 5s Auto-Refresh mit dynamischer Anpassung | Balance zwischen Aktualität und Performance | ✓ Good |
| Alle Geräte mit Measurement-Relation zeigen | Flexibel für neue Gerätetypen | ✓ Good |
| findByTo für Kit-Relationen | Kit -> Device Richtung | ✓ Good (bug fixed) |
| cleanupAndNavigate Pattern | Prevent orphaned timers | ✓ Good |
| Shared temperature key | Room Sensor CO2 shares with Temperature Sensor | ✓ Good |

---
*Last updated: 2026-01-27 after v1.0 milestone*
