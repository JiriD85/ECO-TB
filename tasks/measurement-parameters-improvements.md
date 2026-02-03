# Task: Measurement Parameters Dialog Verbesserungen

## Status: draft

## Beschreibung

Verbesserungen am Measurement Parameters Dialog (ECO Project Wizard).

## Anforderungen

### 1. weeklySchedule um timezoneOffset erweitern

Das `weeklySchedule` Attribut soll einen `timezoneOffset` Key in Minuten enthalten:

```json
{
  "timezoneOffset": 60,
  "monday": {"enabled": true, "start": "04:00", "end": "22:00"},
  ...
}
```

- Default: 60 (CET)
- UI: Dropdown oder Input für Zeitzone
- Optionen: 60 (CET), 120 (CEST), oder manuelle Eingabe

### 2. Optionale Felder nur bei Eingabe speichern

Folgende Felder sollen NUR gespeichert werden wenn eine Eingabe erfolgt (nicht leere Strings speichern):

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `area` | number | Fläche in m² |
| `auxSensor1` | string | Hilfstemperatursensor 1 |
| `auxSensor2` | string | Hilfstemperatursensor 2 |

**Aktuelle Problematik:** Leere Strings werden als Attribut gespeichert, was zu Problemen bei der Auswertung führen kann.

**Lösung:** Vor dem Speichern prüfen:
```javascript
if (area != null && area !== '') {
    attributes.push({key: 'area', value: area});
}
```

## Ort

- **Library:** `js library/ECO Project Wizard.js`
- **Funktion:** `openMeasurementParametersDialog()` oder ähnlich

## Kontext

Diese Verbesserungen sind Teil der Rule Chain Integration für:
- `schedule_violation` Detection (braucht timezoneOffset)
- Analytics Functions 4.7, 4.9, 4.10 (brauchen area, auxSensor1/2)

## Referenz

- `rule chains/scripts/README.md` - weeklySchedule Format Dokumentation
- `docs/ECO_Analytics_Core_Functions.md` - Attribut-Anforderungen
