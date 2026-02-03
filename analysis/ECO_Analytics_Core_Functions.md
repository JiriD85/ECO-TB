# ECO Smart Diagnostics - Analytics Core Functions

> Analysefunktionen 4.1–4.17 für HVAC-Diagnose
> Stand: Februar 2026

---

## 1. Überblick

**Ziel:** 2-Wochen-Messungen zur Diagnose und Optimierung von Wärme- und Kälteverteilungsanlagen.

**Primärer Use Case:** Delta-T Analyse (Low-ΔT Erkennung)

**Architektur:**
- **Rule Chains:** Realtime, deterministisch (pro Datenpunkt)
- **Analytics Service:** Modellbasiert (Regressionen, ROI, Empfehlungen)

---

## 2. Telemetrie-Inputs

### Pflicht (pro Measurement, 60s Sampling)

| Key | Einheit | Beschreibung |
|-----|---------|--------------|
| `T_flow_C` | °C | Vorlauftemperatur |
| `T_return_C` | °C | Rücklauftemperatur |
| `dT_K` | K | Temperaturdifferenz |
| `Vdot_m3h` | m³/h | Volumenstrom |
| `P_th_kW` | kW | Thermische Leistung |

### Empfohlen

| Key | Einheit | Beschreibung |
|-----|---------|--------------|
| `E_th_kWh` | kWh | Energie-Zählerstand |
| `T_outside_C` | °C | Außentemperatur |
| `auxT1_C` | °C | Hilfstemperatur 1 |
| `auxT2_C` | °C | Hilfstemperatur 2 |

### Derived (Rule Chain)

| Key | Typ | Beschreibung |
|-----|-----|--------------|
| `is_on` | boolean | Anlage läuft (`Vdot_m3h > flowOnThreshold`) |
| `load_class` | string | Lastklasse (`low`, `mid`, `high`) |
| `dT_flag` | string | ΔT-Bewertung (`ok`, `warn`, `severe`) |
| `data_quality` | string | Datenqualität (`ok`, `warn`, `error`) |

---

## 3. Analysefunktionen

### 4.1 Leistungsmessung

**Ziel:** Leistung aus Energie und Statistik (min/max/mean) pro Zeitraum.

| Aspekt | Details |
|--------|---------|
| **Inputs** | `E_th_kWh` oder `P_th_kW` |
| **Outputs** | `P_mean_kW`, `P_min_kW`, `P_max_kW` |
| **Methode** | ΔE/Δt (falls Energie vorhanden) |
| **Umsetzung** | Rule Chain + Dashboard Stats |

---

### 4.2 Lastgangprofil + OAT-Verknüpfung

**Ziel:** Lastprofile mit Außentemperatur-Kontext.

| Aspekt | Details |
|--------|---------|
| **Inputs** | `P_th_kW`, `T_outside_C` |
| **Outputs** | Zeitreihen-Charts, OAT-Binning |
| **Methode** | Binning nach 1K, Wochentags-Cluster |
| **Umsetzung** | Dashboard Overlay, Trendz |

---

### 4.3 Lastganganalyse

**Ziel:** Peak-Shaving Potenzial, Instabilität, Short Cycling.

| Aspekt | Details |
|--------|---------|
| **Inputs** | `P_th_kW`, Zykluszeit (10-15 min) |
| **Outputs** | `peak_shaving_potential_kW`, `fluctuation_pct`, `load_switches_count` |
| **Defaults** | Step threshold: 5% von P_ref, Window: 15 min |
| **Umsetzung** | Rule Chain Events + KPI Widgets |

---

### 4.4 Dauerkennlinie

**Ziel:** Stunden über Leistung, Warmhalte-Indikator.

| Aspekt | Details |
|--------|---------|
| **Inputs** | `P_th_kW` (1h resample), `weeklySchedule` |
| **Outputs** | `duration_curve_bins_json`, `warm_hold_loss_indicator` |
| **Methode** | 1h Aggregation, 1 kW Rounding, Filter <5% Pmax |
| **Umsetzung** | Trendz / Analytics Service |

---

### 4.5 Delta-T Analyse (Low-ΔT) ⭐

**Ziel:** Ist/Soll ΔT, Low-ΔT Flags, Pumpenenergie-Potenzial.

| Aspekt | Details |
|--------|---------|
| **Inputs** | `dT_K`, `Vdot_m3h`, `P_th_kW`, `designDeltaT` |
| **Outputs** | `dT_flag`, `pump_energy_saving_kWh_est` |
| **Attribute** | `designDeltaT`, `flowOnThreshold` |
| **Defaults** | `warn`: 0.8 × target, `severe`: 0.6 × target |
| **Methode** | Nur mid/high Load bewerten (Kubikgesetz) |

**Bewertungslogik:**

```
if (load_class == 'low') → skip
if (dT_K >= 0.8 × designDeltaT) → 'ok'
if (dT_K >= 0.6 × designDeltaT) → 'warn'
else → 'severe'
```

---

### 4.6 Leistungsbedarf bei NAT

**Ziel:** Energy Signature, Extrapolation auf Norm-Außentemperatur.

| Aspekt | Details |
|--------|---------|
| **Inputs** | `P_th_kW`, `T_outside_C`, Project: `normOutdoorTemp` |
| **Outputs** | `P_required_NAT_kW`, `Vdot_required_m3h`, `model_confidence` |
| **Methode** | Robuste lineare Regression P vs. OAT |
| **Defaults** | Min OAT span: 8K |

---

### 4.7 Energiebedarf kWh/m²a

**Ziel:** Jahreskennwert für Benchmarking.

| Aspekt | Details |
|--------|---------|
| **Inputs** | `E_th_kWh`, `area` |
| **Outputs** | `energy_need_kWh_per_m2a`, `confidence` |
| **Methode** | Hochrechnung aus Messperiode, optional Gradtagverfahren |
| **Umsetzung** | KPI Widget mit Hinweistext |

---

### 4.8 ROI / Business Case

**Ziel:** Return on Investment aus KPIs und Kostentabellen.

| Aspekt | Details |
|--------|---------|
| **Inputs** | KPIs aus 4.2-4.6, Customer Kostentabelle |
| **Outputs** | `investment_EUR`, `annual_saving_EUR_est`, `roi_years` |
| **Methode** | Sensitivitätsanalyse, Confidence-adjusted ROI |
| **Umsetzung** | Customer-Attributes für Kosten, ROI Widgets |

---

### 4.9 Erzeugungsanalyse

**Ziel:** VL-Exzess, Transmissionsverluste, Laufzeit.

| Aspekt | Details |
|--------|---------|
| **Inputs** | Generator: `P_th_kW`, `T_flow_C`, `auxT1_C`, `auxT2_C` |
| **Outputs** | `T_supply_excess_K`, `transmission_loss_kW_est`, `runtime_minutes` |
| **Attribute** | `measurementRole` = `generator`, `auxSensor1/2` |
| **Methode** | Heizkurven-Fit, Pufferindikatoren |

---

### 4.10 Hydraulikdiagnose

**Ziel:** Mischerleckage, Einspritz-Imbalance, Bypass-Verdacht.

| Aspekt | Details |
|--------|---------|
| **Inputs** | `T_flow_C`, `auxT1_C`, `auxT2_C`, `dT_K`, `Vdot_m3h` |
| **Outputs** | `mixing_leakage_index_0_100`, `injection_imbalance_index_0_100`, `bypass_flag` |
| **Attribute** | `hydraulicScheme`, `auxSensor1.location`, `auxSensor2.location` |
| **Methode** | Zustandsautomat je Hydrauliktyp |

**Hydraulik-Schemata:**

| Schema | Beschreibung | Diagnose-Fokus |
|--------|--------------|----------------|
| `direct` | Direktanschluss | Grunddiagnose |
| `mixingValve` | 3-Wege-Mischer | Port-B Leckage |
| `injection` | Einspritzschaltung | Imbalance |
| `separator` | Hydraulische Weiche | Entkopplung |
| `buffer` | Pufferspeicher | Schichtung |

---

### 4.11 WRG-Zahl (Lüftung)

**Ziel:** Temperaturwirkungsgrad Wärmerückgewinnung.

| Aspekt | Details |
|--------|---------|
| **Inputs** | 4 Temperaturfühler (Außen, Zuluft, Abluft, Fortluft) |
| **Outputs** | `wrg_efficiency_pct`, `loss_indicators` |
| **Voraussetzung** | 4 Sensoren konfiguriert |
| **Methode** | Segmentierung (Frostschutz/Bypass) |

---

### 4.12 Ventildimension / Energy Valve

**Ziel:** Ventilvorschlag aus Volumenstrom.

| Aspekt | Details |
|--------|---------|
| **Inputs** | `designFlow`, `pipeDimension` |
| **Outputs** | `kvs_required`, `valve_size_recommendation` |
| **Attribute** | `designFlow`, `pipeDimension`, `valveDimension`, `valveKvs` |
| **Defaults** | Δp: 20 kPa, v_max: 1.5 m/s |

---

### 4.13 System Health Score

**Ziel:** Ein Score (0-100) je Measurement, aggregierbar.

| Aspekt | Details |
|--------|---------|
| **Inputs** | KPIs aus 4.3, 4.5, 4.9, Data Quality |
| **Outputs** | `health_score_0_100`, `health_class`, `drivers_top3` |
| **Methode** | Gewichtetes Modell, versioniert |
| **Klassen** | `excellent` (80-100), `good` (60-79), `fair` (40-59), `poor` (0-39) |

---

### 4.14 Automatische Maßnahmenliste

**Ziel:** Top-3 priorisierte Handlungsempfehlungen.

| Aspekt | Details |
|--------|---------|
| **Inputs** | Alle Flags/KPIs (Low-ΔT, Warmhalte, Taktung, etc.) |
| **Outputs** | `recommendations_json` (Top-3), `saving_estimates`, `confidence` |
| **Methode** | Regelwerk + Heuristiken |

**Beispiel-Output:**

```json
{
  "recommendations": [
    {"id": "LOW_DT", "priority": 1, "impact": "high", "confidence": 0.78},
    {"id": "SCHEDULE", "priority": 2, "impact": "medium", "confidence": 0.64},
    {"id": "VALVE_SIZE", "priority": 3, "impact": "low", "confidence": 0.82}
  ]
}
```

---

### 4.15 Betriebszeiten-Optimierung

**Ziel:** Unnötige Betriebsstunden identifizieren.

| Aspekt | Details |
|--------|---------|
| **Inputs** | `is_on`, `P_th_kW`, `weeklySchedule` |
| **Outputs** | `extra_operating_hours`, `base_load_in_setback`, `schedule_mismatch` |
| **Attribute** | `weeklySchedule`, `flowOnThreshold` |
| **Methode** | Cluster nach Wochentag, Ist vs. Soll |

---

### 4.16 Anomalie- & Ereigniserkennung

**Ziel:** Detect: ΔT Collapse, Flow Spikes, Sensorfehler.

| Aspekt | Details |
|--------|---------|
| **Inputs** | Alle Telemetrie + `data_quality` |
| **Outputs** | `event_timeline`, `anomaly_score`, `event_counts` |
| **Methode** | Threshold-basiert + Change-Point Detection |

**Event-Typen:**

| Event | Beschreibung |
|-------|--------------|
| `DT_COLLAPSE` | Plötzlicher ΔT-Einbruch |
| `FLOW_SPIKE` | Ungewöhnlicher Durchfluss-Sprung |
| `SENSOR_ERROR` | Sensorfehler erkannt |
| `PATTERN_CHANGE` | Plötzlicher Musterwechsel |

---

### 4.17 Project Aggregation & Portfolio

**Ziel:** Summen, Rankings, Szenarien über alle Measurements.

| Aspekt | Details |
|--------|---------|
| **Inputs** | Alle Measurement KPI Snapshots |
| **Outputs** | `project_total_saving`, `top_issues`, `ranking_tables` |
| **Methode** | Batch Aggregation, Was-wäre-wenn Szenarien |

**Szenarien:**

| Szenario | Beschreibung |
|----------|--------------|
| VL -3K | Vorlauf um 3K senken |
| VL -5K | Vorlauf um 5K senken |
| ΔT Target Meet | Alle Kreise auf Soll-ΔT |
| Schedule Align | Betriebszeiten optimieren |

---

## 4. Rule Chain Pipeline

```
1. Ingest Device Telemetry
2. Fetch Assignment (Measurement ID)
3. Transform: Raw Keys → Canonical Keys
4. Quality Checks: Out-of-range, Missing, Plausi
5. Change Originator: Write to Measurement
6. Save Timeseries (normalized)
7. Compute Derived: is_on, load_class, dT_flag
8. Save Timeseries (derived)
```

---

## 5. Analytics Job-Steuerung

| Trigger | Jobs |
|---------|------|
| **On-demand** | Bei Messstart/-ende, Parameter-Update |
| **Daily** | KPIs, Anomalien, Score aktualisieren |
| **End-of-Measurement** | Final KPIs, ROI, Report |

---

## 6. Attribut-Anforderungen pro Funktion

| Funktion | Benötigte Attribute |
|----------|---------------------|
| 4.1 | - |
| 4.2 | `T_outside_C` (Project) |
| 4.3 | - |
| 4.4 | `weeklySchedule` |
| 4.5 | `designDeltaT`, `flowOnThreshold` |
| 4.6 | Project: `normOutdoorTemp`, Measurement: `designDeltaT` |
| 4.7 | `area` |
| 4.8 | `designPower` |
| 4.9 | `measurementRole`, `auxSensor1/2` |
| 4.10 | `hydraulicScheme`, `auxSensor1/2` |
| 4.11 | (4 Sensoren) |
| 4.12 | `designFlow`, `pipeDimension`, `valveDimension`, `valveKvs` |
| 4.13 | alle Basis-Attribute |
| 4.14 | alle KPIs |
| 4.15 | `weeklySchedule`, `flowOnThreshold` |
| 4.16 | alle Telemetrie |
| 4.17 | alle KPIs |

---

## 7. KPI Snapshot Attribute (Measurement)

Nach Analyse werden folgende KPIs als Attribute gespeichert:

| Attribut | Typ | Beschreibung |
|----------|-----|--------------|
| `kpi.health_score` | number | 0-100 Score |
| `kpi.low_dt_share_pct` | number | % Zeit mit Low-ΔT |
| `kpi.pump_energy_saving_kWh_est` | number | Geschätztes Einsparpotenzial |
| `kpi.recommendations_json` | JSON | Top-3 Maßnahmen |
| `kpi.last_analysis_ts` | number | Timestamp letzte Analyse |

---

## 8. Glossar

| Begriff | Bedeutung |
|---------|-----------|
| **NAT** | Norm-Außentemperatur (z.B. -12°C für Wien) |
| **OAT** | Outdoor Air Temperature (Außentemperatur) |
| **ΔT** | Temperaturdifferenz (Vorlauf - Rücklauf) |
| **Kvs** | Ventilkennwert: Durchfluss bei Δp = 1 bar |
| **Load Class** | Lastklasse: low (<30%), mid (30-60%), high (>60%) |
| **P_ref** | Referenzleistung (P95 oder designPower) |
