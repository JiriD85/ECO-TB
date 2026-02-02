# ECO Smart Diagnostics - System Model

> Referenz-Dokumentation für das ThingsBoard-basierte HVAC-Diagnosesystem.
> Stand: Februar 2026

**Verwandte Dokumente:**
- [ATTRIBUTE_SCHEMA.md](ATTRIBUTE_SCHEMA.md) - Konsolidiertes Attribut-Schema mit Optimierungen

---

## 1. Entity-Hierarchie

```
Tenant (ECO Energy Group)
│
└── Customer (z.B. PKE Gebäudetechnik GmbH)
    │
    ├── Project (Asset)
    │   ├── Relation "Owns" → Measurement(s)
    │   └── Attribute: progress, state, address, coordinates...
    │
    ├── Measurement (Asset)
    │   ├── Relation "Measurement" → Device (nur während aktiver Messung!)
    │   ├── Timeseries: Messdaten (CHC_*, Wetterdaten)
    │   └── Attribute: dataSource, circuitType, systemType, progress...
    │       (siehe ATTRIBUTE_SCHEMA.md für vollständige Liste)
    │
    ├── Diagnostickit (Asset)
    │   ├── Relation "Contains" → Device(s)
    │   └── Attribute: kitType, subscriptionStatus
    │
    └── Device (verschiedene Typen)
        ├── P-Flow D116, Temperature Sensor, Room Sensor CO2
        ├── RESI, Gateway (LoRaWAN)
        └── Timeseries: Sensor-Rohdaten
```

---

## 2. Entity Types

### 2.1 Customer

Repräsentiert einen Kunden/Gebäudebetreiber.

| Feld | Beschreibung |
|------|--------------|
| `name` | Kundenname (z.B. "PKE Gebäudetechnik GmbH") |
| `id` | ThingsBoard Entity ID |

**Beispiel-Kunden:** AIoT Systems Development, PKE Gebäudetechnik GmbH, Belimo Deutschland/Schweiz/Österreich

---

### 2.2 Project (Asset)

Repräsentiert eine Messkampagne an einem Standort.

**Asset Profile:** `Project`

**Attribute:**

| Attribut | Typ | Beschreibung |
|----------|-----|--------------|
| `progress` | string | Phase: `in preparation`, `active`, `finished`, `aborted` |
| `state` | string | Alarm-Status: `normal`, `minor`, `major`, `critical` |
| `address` | string | Standortadresse |
| `latitude` | string | Breitengrad |
| `longitude` | string | Längengrad |
| `units` | string | Einheitensystem: `metric` |
| `viewerUserGroupId` | string | ID der Viewer User Group (für Project Viewer) |
| `viewerAssetGroupId` | string | ID der Viewer Asset Group |

**Relations:**
- `Owns` → Measurement (1:n)

---

### 2.3 Measurement (Asset)

Repräsentiert einen einzelnen Messpunkt innerhalb eines Projekts.

**Asset Profile:** `Measurement`

> **Vollständige Attribut-Liste:** Siehe [ATTRIBUTE_SCHEMA.md](ATTRIBUTE_SCHEMA.md)

**Wichtigste Attribute:**

| Attribut | Typ | Beschreibung |
|----------|-----|--------------|
| `measurementType` | string | `ultrasonic`, `interpolation`, `import` |
| `installationType` | string | `heating`, `cooling` |
| `systemType` | string | `radiator`, `floorHeating`, `fanCoil`, `ahuCoil`, `districtHeating`, `chiller` |
| `measurementRole` | string | `generator`, `circuit`, `subDistribution` |
| `hydraulicScheme` | string | `direct`, `mixingValve`, `injection`, `separator`, `buffer` |
| `progress` | string | `in preparation`, `active`, `finished`, `aborted` |
| `state` | string | `normal`, `minor`, `major`, `critical` |
| `designDeltaT` | number | Auslegungs-ΔT (K) |
| `designFlowTemp` | number | Auslegungs-Vorlauftemperatur (°C) |
| `flowOnThreshold` | number | Durchfluss-Schwelle für ON/OFF (m³/h) |

**Measurement Types:**

| Typ | Beschreibung | Physisches Gerät |
|-----|--------------|------------------|
| `ultrasonic` | Ultraschall-Durchflussmessung | Ja (P-Flow D116) |
| `interpolation` | Berechnet aus anderen Messungen | Nein |
| `import` | Externe Daten importiert | Nein |

**Relations:**
- `Measurement` → Device (nur während `active` Phase, wird bei `finished` entfernt)

**Timeseries:** Siehe Abschnitt 4.

---

### 2.4 Diagnostickit (Asset)

Repräsentiert ein physisches Diagnose-Kit mit Sensoren.

**Asset Profile:** `Diagnostickit`

**Kit-Typen:**

| Prefix | Name | kitType | Inhalt |
|--------|------|---------|--------|
| `DBKIT` | Base Kit | `basis` | RESI Gateway + 4x P-Flow + 2x Temp Sensor |
| `DRKIT` | Room Kit | `loraWan` | LoRaWAN Gateway + Room Sensor CO2 |
| `DEKIT` | Extension Kit | `extension` | Zusätzliche P-Flows für Base Kit |

**Attribute:**

| Attribut | Typ | Beschreibung |
|----------|-----|--------------|
| `kitType` | string | `basis`, `loraWan`, `extension` |
| `subscriptionStatus` | string | `no subscription`, `active`, etc. |

**Relations:**
- `Contains` → Device (permanente Zuordnung der Kit-Komponenten)

**Beispiel DBKIT (Base Kit):**
```
DBKIT25EU-0045
├── ECO_xxx_gw      (RESI Gateway)
├── ECO_xxx_PF1     (P-Flow D116)
├── ECO_xxx_PF2     (P-Flow D116)
├── ECO_xxx_PF3     (P-Flow D116)
├── ECO_xxx_PF4     (P-Flow D116)
├── ECO_xxx_TS1     (Temperature Sensor)
└── ECO_xxx_TS2     (Temperature Sensor)
```

**Beispiel DRKIT (Room Kit):**
```
DRKIT25EU-0038
├── ECO_xxx_gw      (LoRaWAN Gateway)
└── ECO_xxx_CO2_1   (Room Sensor CO2)
```

---

### 2.5 Device

Physische Sensoren und Gateways.

**Device Profiles:**

| Typ | Beschreibung | Kommunikation |
|-----|--------------|---------------|
| `P-Flow D116` | Ultraschall-Durchflussmesser | Modbus via RESI |
| `Temperature Sensor` | Temperatur-Fühler | Modbus via RESI |
| `Room Sensor CO2` | Raumklima-Sensor (CO2, Temp, Humidity) | LoRaWAN |
| `RESI` | Modbus-zu-Ethernet Gateway | Ethernet |
| `Gateway` | LoRaWAN Gateway | Ethernet |

**Namensschema:**
```
ECO_<SerialNumber>_<Suffix>

Beispiele:
- ECO_0E8002800957465536323520_gw   (RESI Gateway)
- ECO_0E8002800957465536323520_PF1  (P-Flow 1)
- ECO_0E8002800957465536323520_TS1  (Temperature Sensor 1)
- ECO_24E124FFFEFC0718_CO2_1        (Room Sensor CO2)
```

**Attribute:**

| Attribut | Typ | Beschreibung |
|----------|-----|--------------|
| `state` | string | Alarm-Status: `normal`, `critical` |
| `active` | boolean | ThingsBoard System-Attribut |
| `inactivityAlarmTime` | number | Letzte Inaktivitäts-Warnung |

---

## 3. Relations

| Von | Zu | Relation Type | Beschreibung |
|-----|-----|---------------|--------------|
| Project | Measurement | `Owns` | Permanente Zuordnung |
| Measurement | Device | `Measurement` | Nur während aktiver Messung |
| Diagnostickit | Device | `Contains` | Permanente Kit-Zugehörigkeit |

**Wichtig:** Die Relation `Measurement → Device` wird erstellt wenn ein Gerät zugewiesen wird und entfernt wenn die Messung beendet ist. Das Gerät kann dann für eine andere Messung verwendet werden.

---

## 4. Telemetrie

> **Vollständige Referenz:** Siehe [ATTRIBUTE_SCHEMA.md](ATTRIBUTE_SCHEMA.md)

### 4.1 Naming Convention

| Typ | Konvention | Beispiele |
|-----|------------|-----------|
| **Attribute** | camelCase | `designFlowTemp`, `systemType` |
| **Telemetrie** | snake_case + Einheit | `T_flow_C`, `P_th_kW` |

### 4.2 Telemetrie-Keys (Neu)

| Key | Einheit | Beschreibung |
|-----|---------|--------------|
| `T_flow_C` | °C | Vorlauftemperatur |
| `T_return_C` | °C | Rücklauftemperatur |
| `dT_K` | K | Temperaturdifferenz |
| `Vdot_m3h` | m³/h | Volumenstrom |
| `P_th_kW` | kW | Thermische Leistung |
| `E_th_kWh` | kWh | Energie-Zählerstand |
| `T_outside_C` | °C | Außentemperatur |

### 4.3 Derived Telemetrie (Rule Chain)

| Key | Typ | Beschreibung |
|-----|-----|--------------|
| `is_on` | boolean | Anlage läuft |
| `load_class` | string | Lastklasse (`low`, `mid`, `high`) |
| `dT_flag` | string | ΔT-Bewertung (`ok`, `warn`, `severe`) |

---

## 5. Progress States

```
                    ┌─────────────┐
                    │in preparation│
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   active    │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼                         ▼
       ┌─────────────┐          ┌─────────────┐
       │  finished   │          │   aborted   │
       └─────────────┘          └─────────────┘
```

| State | Beschreibung |
|-------|--------------|
| `in preparation` | Messung wird vorbereitet, Geräte können zugewiesen werden |
| `active` | Messung läuft, Daten werden erfasst |
| `finished` | Messung abgeschlossen, Geräte abgebaut |
| `aborted` | Messung abgebrochen |

---

## 6. Alarm States

| State | Farbe | Beschreibung |
|-------|-------|--------------|
| `normal` | Grün | Alles in Ordnung |
| `minor` | Gelb | Geringfügige Warnung |
| `major` | Orange | Wichtige Warnung |
| `critical` | Rot | Kritischer Alarm |

---

## 7. Rollen & Berechtigungen

### 7.1 Rollen-Typen

| Typ | Beschreibung |
|-----|--------------|
| `GENERIC` | Berechtigung für ALLE Entities eines Typs |
| `GROUP` | Berechtigung nur für Entities in einer bestimmten Entity Group |

### 7.2 Definierte Rollen

| Rolle | Typ | Beschreibung |
|-------|-----|--------------|
| Belimo Retrofit Viewers | GENERIC | Basis-Leserechte für Customer Users |
| Belimo Retrofit Users | GENERIC | Standard-Benutzerrechte |
| Belimo Retrofit Administrators | GENERIC | Admin-Rechte auf Customer-Ebene |
| Belimo Retrofit Engineer | GENERIC | Techniker-Rechte |
| Belimo Retrofit Read Only | GROUP | Leserechte für spezifische Asset Groups |

### 7.3 Project Viewer

Für jeden Project Viewer wird erstellt:
1. **User Group:** `Viewers: [ProjectName]` (Customer-owned)
2. **Asset Group:** `Project Assets: [ProjectName]` (enthält Project + Measurements)
3. **Permission:** GROUP Role "Belimo Retrofit Read Only" auf die Asset Group

---

## 8. Geplante Änderungen

> **Neues Schema definiert:** Siehe [ATTRIBUTE_SCHEMA.md](ATTRIBUTE_SCHEMA.md)

### 8.1 VR Devices entfernen

**Aktuell:** Virtuelle Device-Kopien (`*_VR`) mit Project/Measurement-Prefix
**Neu:** Keine VR Devices, Telemetrie direkt am Measurement

### 8.2 Telemetrie-Key Migration

**Alt (CHC-Prefix):** `CHC_S_TemperatureFlow`, `CHC_S_Power_Heating`, etc.
**Neu (snake_case + Einheit):** `T_flow_C`, `P_th_kW`, `dT_K`, etc.

### 8.3 Attribut-Änderungen

| Aktuell | Neu | Status |
|---------|-----|--------|
| `installationType` | `installationType` | ✅ Behalten |
| `measurementType` | `measurementType` | ✅ Behalten |
| `installationTypeOptions` | `systemType` | Umbenennen |
| `sensorLabel1/2` | `auxSensor1/2` | Umbenennen (JSON) |
| `deltaT` | `designDeltaT` | Umbenennen |
| `deltaTAnalysis*` | - | Entfernen |
| `loadCourseFilter*` | - | Entfernen |

### 8.4 Neue Attribute

| Attribut | Kategorie |
|----------|-----------|
| `measurementRole` | Hydraulik |
| `hydraulicScheme` | Hydraulik |
| `fluidType` | Hydraulik |
| `designFlowTemp`, `designReturnTemp` | Auslegung |
| `designPower`, `designFlow` | Auslegung |
| `flowOnThreshold`, `hysteresisMinutes` | Betrieb |
| `pumpPresent`, `pumpControlType`, `pumpRatedPower` | Pumpe |

---

## 9. Altlasten (zur Entfernung)

| Attribut | Entity | Grund |
|----------|--------|-------|
| `sessionId` | Project | Stripe-Integration (nicht mehr verwendet) |
| `locationLog` | Project, Measurement, Kit | Nicht mehr benötigt |
| `floorplan` | Measurement | Nicht mehr verwendet |
| `xPos`, `yPos` | Measurement | Floorplan-Position (nicht mehr verwendet) |
| `_ECD_*` Timeseries | Measurement | Trendz-Berechnungen (nicht mehr verwendet) |
| VR Devices | - | Werden durch direkte Measurement-Telemetrie ersetzt |

---

## 10. API Endpoints (Referenz)

| Endpoint | Beschreibung |
|----------|--------------|
| `GET /api/customers` | Alle Kunden |
| `GET /api/customer/{id}/assets` | Assets eines Kunden |
| `GET /api/customer/{id}/devices` | Devices eines Kunden |
| `GET /api/relations?fromId={id}&fromType=ASSET` | Relations von einem Asset |
| `GET /api/plugins/telemetry/{entityType}/{id}/values/attributes` | Attribute einer Entity |
| `GET /api/plugins/telemetry/{entityType}/{id}/keys/timeseries` | Timeseries Keys |
| `POST /api/plugins/telemetry/{entityType}/{id}/attributes/SERVER_SCOPE` | Attribute setzen |

---

## 11. Namenskonventionen

### Entities

| Entity | Schema | Beispiel |
|--------|--------|----------|
| Project | `<Kunde>_<Nr>` | `PKE_2`, `AIOT_4` |
| Measurement | `<Projekt>_<Nr>` | `PKE_2_2`, `AIOT_4_1` |
| Diagnostickit | `<Typ><Jahr>EU-<Nr>` | `DBKIT25EU-0045` |

### Devices

| Typ | Schema | Beispiel |
|-----|--------|----------|
| Gateway/RESI | `ECO_<Serial>_gw` | `ECO_0E8002800957465536323520_gw` |
| P-Flow | `ECO_<Serial>_PF<n>` | `ECO_0E8002800957465536323520_PF1` |
| Temp Sensor | `ECO_<Serial>_TS<n>` | `ECO_0E8002800957465536323520_TS1` |
| Room Sensor | `ECO_<Serial>_CO2_<n>` | `ECO_24E124FFFEFC0718_CO2_1` |
