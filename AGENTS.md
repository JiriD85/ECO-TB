# AGENTS.md

Konfiguration für den Multi-Agent Workflow mit Claude Code und OpenAI Codex CLI.

## Workflow Übersicht

```
Claude Code (Planung) → Codex CLI (Umsetzung) → Claude Code (Review)
```

## 1. Planung (Claude Code)

Claude Code ist verantwortlich für:
- Architektur und Design-Entscheidungen
- Risikoanalyse und Edge-Cases identifizieren
- Akzeptanzkriterien definieren
- Task-Spezifikationen in `tasks/` erstellen

### Task erstellen
Claude erstellt für jede Aufgabe eine Datei in `tasks/TASK_NAME.md` mit folgendem Format.

## 2. Umsetzung (Codex CLI)

Codex CLI führt die Implementierung durch basierend auf den Task-Spezifikationen.

### Automatisierte Ausführung (durch Claude Code)
Claude Code ruft Codex automatisch auf:
```bash
source ~/.nvm/nvm.sh && codex exec --approval-mode full-auto -q "Aufgabe"
```

### Manuelle Ausführung
```bash
# Im Projektverzeichnis
codex "Implementiere die Aufgabe gemäß tasks/TASK_NAME.md"

# Oder im Full-Auto Modus
codex --approval-mode full-auto "Implementiere tasks/TASK_NAME.md"
```

### Codex Richtlinien
- Lies immer zuerst die Task-Datei vollständig
- Halte dich strikt an die Akzeptanzkriterien
- Erstelle atomare Commits mit aussagekräftigen Messages
- Bei Unklarheiten: Stoppen und nachfragen

## 3. Review (Claude Code)

Nach der Codex-Implementierung:
- Code-Review der Änderungen mit `git diff`
- Edge-Cases und Fehlerbehandlung prüfen
- Performance und Best Practices validieren
- Verbesserungsvorschläge dokumentieren

---

## Task-Spezifikation Format

Jede Task-Datei in `tasks/` muss folgendes Format haben:

```markdown
# Task: [Name]

## Beschreibung
[Was soll erreicht werden?]

## Kontext
[Relevante Hintergrundinformationen]

## Betroffene Dateien
- `pfad/zur/datei.json`
- `pfad/zur/anderen/datei.js`

## Akzeptanzkriterien
- [ ] Kriterium 1
- [ ] Kriterium 2
- [ ] Kriterium 3

## Constraints
- [Technische Einschränkungen]
- [Nicht ändern: ...]

## Beispiele
[Optional: Code-Beispiele oder erwartetes Verhalten]
```

---

## Projekt-Kontext für Codex

### Technologie-Stack
- **Platform:** ThingsBoard 4.2 PE
- **Sprachen:** JSON (Konfiguration), JavaScript (Widgets/Libraries)
- **Zweck:** Smart Diagnostics für HVAC/Gebäudeautomation

### Verzeichnisstruktur
- `dashboards/` - ThingsBoard Dashboard-Konfigurationen (JSON)
- `js library/` - JavaScript Utility-Bibliotheken
- `rule chains/` - ThingsBoard Rule Chains für Datenverarbeitung
- `widgets/` - Custom Widget-Implementierungen
- `tasks/` - Task-Spezifikationen für Codex

### Wichtige Hinweise
- Dashboard-JSONs sind sehr groß (bis 3.4 MB) - gezielt bearbeiten
- Widget-Konfigurationen folgen ThingsBoard-Schema
- JavaScript in Widgets verwendet ThingsBoard Widget API
- Rule Chains definieren Nachrichtenfluss mit Nodes und Connections
