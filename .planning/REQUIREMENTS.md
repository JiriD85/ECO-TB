# Requirements: Measurement Live Data Popup

**Defined:** 2025-01-26
**Core Value:** Benutzer können auf einen Blick den aktuellen Status einer Messung sehen

## v1 Requirements

### Measurement Info

- [x] **INFO-01**: Popup zeigt entityLabel der Messung ✓
- [x] **INFO-02**: Popup zeigt entityName der Messung ✓
- [x] **INFO-03**: Popup zeigt installationType Attribut (heating/cooling Badge) ✓

### Device Display

- [x] **DEV-01**: Popup lädt alle Geräte mit Measurement-Relation (FROM, type: Measurement) ✓
- [x] **DEV-02**: Für jedes Gerät: Name/Label anzeigen ✓
- [x] **DEV-03**: Für jedes Gerät: lastActivityTime als DD.MM.YYYY hh:mm:ss ✓
- [x] **DEV-04**: Für jedes Gerät: active Status visualisieren ✓
- [x] **DEV-05**: Diagnostic Kit separat hervorheben mit Name/Label ✓

### Timeseries Data

- [x] **TS-01**: P-Flow Heating: CHC_S_Heating_Power (kW), CHS_M_Heating_Energy (kWh) ✓
- [x] **TS-02**: P-Flow Cooling: CHC_S_Cooling_Power (kW), CHC_M_Cooling_Energy (kWh) ✓
- [x] **TS-03**: P-Flow Common: VolumeFlow, Volume, TemperatureDiff, TempFlow, TempReturn, Velocity ✓
- [x] **TS-04**: Temperature Sensor: temperature (°C) ✓

### Live Updates

- [x] **LIVE-01**: Auto-Refresh alle 5 Sekunden ✓
- [x] **LIVE-02**: Refresh Button für manuelles Aktualisieren ✓
- [x] **LIVE-03**: Loading-Indicator während Daten geladen werden ✓

### Actions

- [x] **ACT-01**: Button: Navigation zu Device Details State ✓
- [x] **ACT-02**: Button: Navigation zu Measurement Dashboard State ✓
- [x] **ACT-03**: Button: Measurement Parameters Dialog öffnen ✓

### Styling

- [x] **STYLE-01**: Dialog-Styling konsistent mit ECO Project Wizard ✓
- [x] **STYLE-02**: Responsive Layout für verschiedene Bildschirmgrößen ✓

## v2 Requirements

### Extended Features

- **EXT-01**: Historische Charts im Popup
- **EXT-02**: Alarm-Status pro Gerät anzeigen
- **EXT-03**: Export der Live-Daten als CSV

## Out of Scope

| Feature | Reason |
|---------|--------|
| Historische Charts | Eigenes Dashboard existiert bereits |
| Gerätekonfiguration | Zu komplex für Overlay |
| Alarm-Management | Separater Alarm-State vorhanden |
| Geräte hinzufügen/entfernen | Assignment Dialog existiert bereits |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFO-01 | Phase 1 | Complete |
| INFO-02 | Phase 1 | Complete |
| INFO-03 | Phase 1 | Complete |
| DEV-01 | Phase 2 | Complete |
| DEV-02 | Phase 2 | Complete |
| DEV-03 | Phase 2 | Complete |
| DEV-04 | Phase 2 | Complete |
| DEV-05 | Phase 2 | Complete |
| TS-01 | Phase 3 | Complete |
| TS-02 | Phase 3 | Complete |
| TS-03 | Phase 3 | Complete |
| TS-04 | Phase 3 | Complete |
| LIVE-01 | Phase 3 | Complete |
| LIVE-02 | Phase 3 | Complete |
| LIVE-03 | Phase 3 | Complete |
| ACT-01 | Phase 4 | Complete |
| ACT-02 | Phase 4 | Complete |
| ACT-03 | Phase 4 | Complete |
| STYLE-01 | Phase 1 | Complete |
| STYLE-02 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 ✓

---
*Requirements defined: 2025-01-26*
*Last updated: 2026-01-27 after Phase 4 completion — v1 complete*
