# Requirements: Measurement Live Data Popup

**Defined:** 2025-01-26
**Core Value:** Benutzer können auf einen Blick den aktuellen Status einer Messung sehen

## v1 Requirements

### Measurement Info

- [x] **INFO-01**: Popup zeigt entityLabel der Messung ✓
- [x] **INFO-02**: Popup zeigt entityName der Messung ✓
- [x] **INFO-03**: Popup zeigt installationType Attribut (heating/cooling Badge) ✓

### Device Display

- [ ] **DEV-01**: Popup lädt alle Geräte mit Measurement-Relation (FROM, type: Measurement)
- [ ] **DEV-02**: Für jedes Gerät: Name/Label anzeigen
- [ ] **DEV-03**: Für jedes Gerät: lastActivityTime als DD.MM.YYYY hh:mm:ss
- [ ] **DEV-04**: Für jedes Gerät: active Status visualisieren
- [ ] **DEV-05**: Diagnostic Kit separat hervorheben mit Name/Label

### Timeseries Data

- [ ] **TS-01**: P-Flow Heating: CHC_S_Heating_Power (kW), CHS_M_Heating_Energy (kWh)
- [ ] **TS-02**: P-Flow Cooling: CHC_S_Cooling_Power (kW), CHC_M_Cooling_Energy (kWh)
- [ ] **TS-03**: P-Flow Common: VolumeFlow, Volume, TemperatureDiff, TempFlow, TempReturn, Velocity
- [ ] **TS-04**: Temperature Sensor: temperature (°C)

### Live Updates

- [ ] **LIVE-01**: Auto-Refresh alle 5 Sekunden
- [ ] **LIVE-02**: Refresh Button für manuelles Aktualisieren
- [ ] **LIVE-03**: Loading-Indicator während Daten geladen werden

### Actions

- [ ] **ACT-01**: Button: Navigation zu Device Details State
- [ ] **ACT-02**: Button: Navigation zu Measurement Dashboard State
- [ ] **ACT-03**: Button: Measurement Parameters Dialog öffnen

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
| DEV-01 | Phase 2 | Pending |
| DEV-02 | Phase 2 | Pending |
| DEV-03 | Phase 2 | Pending |
| DEV-04 | Phase 2 | Pending |
| DEV-05 | Phase 2 | Pending |
| TS-01 | Phase 3 | Pending |
| TS-02 | Phase 3 | Pending |
| TS-03 | Phase 3 | Pending |
| TS-04 | Phase 3 | Pending |
| LIVE-01 | Phase 4 | Pending |
| LIVE-02 | Phase 4 | Pending |
| LIVE-03 | Phase 4 | Pending |
| ACT-01 | Phase 5 | Pending |
| ACT-02 | Phase 5 | Pending |
| ACT-03 | Phase 5 | Pending |
| STYLE-01 | Phase 1 | Complete |
| STYLE-02 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 ✓

---
*Requirements defined: 2025-01-26*
*Last updated: 2025-01-26 after initial definition*
