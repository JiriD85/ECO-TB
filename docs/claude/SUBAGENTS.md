# Subagenten-Strategie

## Warum Subagenten?

- Dashboard-Dateien sind GROSS (bis 9.8 MB)
- JS Libraries sind komplex (bis 225 KB)
- Direktes Lesen verbraucht viel Context
- Subagenten arbeiten in eigenem Context und liefern nur Ergebnisse

## Agent-Auswahl

| Task | Agent | Grund |
|------|-------|-------|
| Codebase durchsuchen | `Explore` | Schnell, spart Context |
| Feature planen | `feature-dev:code-architect` | Architektur-Analyse |
| Code verstehen | `feature-dev:code-explorer` | Execution Paths |
| Code Review | `feature-dev:code-reviewer` | Bugs, Security |
| Allgemeine Recherche | `general-purpose` | Web, komplexe Fragen |

## Explore Agent

**Wann:** Suche nach Widgets, Actions, States, Funktionen

```
Task(
  subagent_type="Explore",
  prompt="Finde im measurements.json Dashboard alle Widgets die 'alarm' im Namen oder in den Actions haben. Liste Widget-ID, Name und relevante Action-IDs."
)
```

**Beispiele:**
- "Welche States gibt es im measurements Dashboard?"
- "Finde alle Actions die projectWizard aufrufen"
- "Welche Widgets nutzen die ECO Diagnostics Utils JS Library?"

## Code Architect Agent

**Wann:** Neues Feature planen, Architektur-Entscheidungen

```
Task(
  subagent_type="feature-dev:code-architect",
  prompt="Plane die Implementierung eines neuen Dialogs fuer Geraete-Konfiguration. Analysiere bestehende Dialoge in ECO Project Wizard.js und schlage Struktur vor."
)
```

**Beispiele:**
- "Wie sollte ein neuer Export-Dialog strukturiert sein?"
- "Welche Komponenten braucht ein Measurement-Wizard?"

## Code Explorer Agent

**Wann:** Verstehen wie etwas funktioniert, Flows tracen

```
Task(
  subagent_type="feature-dev:code-explorer",
  prompt="Trace den Flow von openAddMeasurementDialog in ECO Project Wizard.js. Welche Services werden aufgerufen? Welche API-Calls gemacht?"
)
```

**Beispiele:**
- "Wie funktioniert die Permission-Erstellung?"
- "Was passiert wenn ein Project geloescht wird?"

## Code Reviewer Agent

**Wann:** Nach Aenderungen, vor Push

```
Task(
  subagent_type="feature-dev:code-reviewer",
  prompt="Review die Aenderungen in ECO Project Wizard.js. Pruefe auf Bugs, Security Issues und Code Quality."
)
```

## General Purpose Agent

**Wann:** Komplexe Recherche, Web-Suche, mehrstufige Tasks

```
Task(
  subagent_type="general-purpose",
  prompt="Recherchiere ThingsBoard 4.2 Calculated Fields API. Finde Beispiele fuer Custom Aggregations."
)
```

## Parallele Ausfuehrung

Mehrere unabhaengige Suchen gleichzeitig:

```
# In einer Message mehrere Tasks starten:
Task(subagent_type="Explore", prompt="Finde alle alarm-related Widgets...")
Task(subagent_type="Explore", prompt="Finde alle permission-related Code...")
```

## Best Practices

1. **Spezifische Prompts** - Je genauer, desto besser die Ergebnisse
2. **Dateinamen angeben** - "in measurements.json" statt "im Dashboard"
3. **Erwartetes Format** - "Liste als Tabelle mit ID, Name, Beschreibung"
4. **Context mitgeben** - "Wir arbeiten an Alarm-Feature, suche..."

## Wann NICHT Subagenten

- Einzelne Datei lesen (Read Tool direkt)
- Bekannte Funktion aendern (Edit Tool direkt)
- Einfache Grep-Suche (Grep Tool direkt)
- Git-Operationen (Bash direkt)
