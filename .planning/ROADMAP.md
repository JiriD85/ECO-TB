# Roadmap: Measurement Live Data Popup

**Created:** 2025-01-26
**Depth:** Quick (4 phases)
**Core Value:** Benutzer können auf einen Blick den aktuellen Status einer Messung sehen

## Phase Overview

| Phase | Name | Requirements | Goal |
|-------|------|--------------|------|
| 1 | Dialog Foundation | INFO-01, INFO-02, INFO-03, STYLE-01, STYLE-02 | Basis-Dialog mit Measurement-Info |
| 2 | Device Display | DEV-01, DEV-02, DEV-03, DEV-04, DEV-05 | Geräte laden und anzeigen |
| 3 | Timeseries & Live | TS-01, TS-02, TS-03, TS-04, LIVE-01, LIVE-02, LIVE-03 | Live-Daten mit Auto-Refresh |
| 4 | Actions | ACT-01, ACT-02, ACT-03 | Navigation und Aktionen |

---

## Phase 1: Dialog Foundation

**Goal:** Funktionierender Dialog mit Measurement-Basisinfo und ECO-Styling

**Requirements:**
- INFO-01: entityLabel anzeigen
- INFO-02: entityName anzeigen
- INFO-03: installationType Badge
- STYLE-01: ECO Project Wizard Styling
- STYLE-02: Responsive Layout

**Plans:** 1 plan

Plans:
- [x] 01-01-PLAN.md — Create dialog function and add to dashboard ✓

**Success Criteria:**
1. Dialog öffnet sich aus Measurements_card Tabelle
2. entityLabel und entityName werden korrekt angezeigt
3. installationType wird als farbiges Badge dargestellt (heating=rot, cooling=blau)
4. Dialog-Styling entspricht ECO Project Wizard Dialogen
5. Close-Button schließt Dialog

**Dependencies:** None

---

## Phase 2: Device Display

**Goal:** Alle zugehörigen Geräte laden und mit Status anzeigen

**Requirements:**
- DEV-01: Geräte mit Measurement-Relation laden
- DEV-02: Gerätename anzeigen
- DEV-03: lastActivityTime formatiert anzeigen
- DEV-04: active Status visualisieren
- DEV-05: Diagnostic Kit hervorheben

**Plans:** 1 plan

Plans:
- [x] 02-01-PLAN.md — Add device loading and display to info dialog ✓

**Success Criteria:**
1. Alle Geräte mit FROM/Measurement Relation werden geladen
2. Geräteliste zeigt Name/Label für jedes Gerät
3. lastActivityTime wird als DD.MM.YYYY hh:mm:ss angezeigt
4. active Status wird visuell unterschieden (grün/grau)
5. Diagnostic Kit erscheint in separater Sektion

**Dependencies:** Phase 1

---

## Phase 3: Timeseries & Live Updates

**Goal:** Live-Telemetriedaten mit automatischem Refresh

**Requirements:**
- TS-01: P-Flow Heating Timeseries
- TS-02: P-Flow Cooling Timeseries
- TS-03: P-Flow Common Timeseries
- TS-04: Temperature Sensor Timeseries
- LIVE-01: Auto-Refresh 5s
- LIVE-02: Refresh Button
- LIVE-03: Loading Indicator

**Plans:** 1 plan

Plans:
- [x] 03-01-PLAN.md - Add timeseries fetching and auto-refresh ✓

**Success Criteria:**
1. P-Flow zeigt korrekte Timeseries basierend auf installationType
2. Temperature Sensoren zeigen temperature Wert
3. Werte aktualisieren sich automatisch alle 5 Sekunden
4. Refresh-Button löst sofortiges Update aus
5. Loading-Spinner während Datenladung sichtbar
6. Subscription wird bei Dialog-Schließung bereinigt

**Dependencies:** Phase 2

---

## Phase 4: Actions

**Goal:** Navigation und Parameter-Zugriff aus dem Dialog

**Requirements:**
- ACT-01: Device Details Navigation
- ACT-02: Measurement Dashboard Navigation
- ACT-03: Parameters Dialog öffnen

**Success Criteria:**
1. "Device Details" Button navigiert zum entsprechenden State
2. "Dashboard" Button öffnet Measurement Dashboard State
3. "Parameters" Button öffnet bestehenden Parameters Dialog
4. Dialog schließt sich nach Navigation

**Dependencies:** Phase 3

---

## Milestone: v1 Complete

**Definition of Done:**
- [ ] Alle 18 Requirements implemented
- [ ] Dialog funktioniert für TENANT_ADMIN und CUSTOMER_USER
- [ ] Auto-Refresh funktioniert zuverlässig
- [ ] Styling konsistent mit ECO Dialogen
- [ ] Code committed und zu ThingsBoard gesynct

---
*Roadmap created: 2025-01-26*
