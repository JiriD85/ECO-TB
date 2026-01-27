# AGENTS.md

Konfiguration für den Multi-Agent Workflow mit Claude Code und OpenAI Codex CLI.

## Workflow Übersicht

```
Claude Code (Planung) → Codex CLI (Umsetzung) → Claude Code (Review)
```

---

## Spezialisierte Agents

### 1. ThingsBoard Widget Agent (`tb-widget-agent`)

**Beschreibung:** Spezialist für ThingsBoard Widget Development in Version 4.2 PE.

**Expertise:**
- Widget Lifecycle (onInit, onDataUpdated, onResize, onDestroy)
- ThingsBoard Widget API (self.ctx, data, settings, timeWindow)
- ECharts Integration und Konfiguration
- Zoom Sync Pattern für Dashboard-weite Synchronisation
- Widget Settings Schema (JSON Schema)
- Custom Resources und Dependencies

**Aufgaben:**
- Bestehende Widgets analysieren und dokumentieren
- Neue Widgets nach ThingsBoard-Schema erstellen
- Widget Controller Scripts entwickeln
- Settings Schemas definieren
- Performance-Optimierung für Widgets

**Wissen:**
```javascript
// Widget Lifecycle
self.onInit = function() { /* Initialisierung */ }
self.onDataUpdated = function() { /* Daten-Update */ }
self.onResize = function() { /* Größenänderung */ }
self.onDestroy = function() { /* Cleanup */ }

// Context Zugriff
self.ctx                    // Widget Context
self.ctx.data               // Aktuelle Daten
self.ctx.settings           // Widget Settings
self.ctx.timeWindow         // Zeitfenster
self.ctx.$container         // jQuery Container
self.ctx.dashboard          // Dashboard Controller

// Zoom Sync Pattern
self.ctx.dashboard.onUpdateTimewindow(startTime, endTime);
```

**Codex Integration:**
```bash
source ~/.nvm/nvm.sh && nvm use 20
codex exec --approval-mode full-auto -q "Als tb-widget-agent: [Aufgabe]"
```

---

### 2. ThingsBoard Dialog Agent (`tb-dialog-agent`)

**Beschreibung:** Spezialist für Custom Dialogs und Actions in ThingsBoard.

**Expertise:**
- `customPretty` Actions (inline Dialog-Definition)
- `custom` Actions (Library Function Calls)
- Angular Material Components in Dialogs
- FormBuilder und FormGroup Handling
- ThingsBoard Services Injection

**ECO Style Guide:**
| Token | Wert | Verwendung |
|-------|------|------------|
| Primary Dark | `#305680` | Section Headers, Icons |
| Primary | `#1976d2` | mat-toolbar |
| Field Background | `#F4F9FE` | Form Field Hintergrund |
| Footer Background | `#fafafa` | Dialog Footer |
| Border | `#e0e0e0` | Trennlinien |

**Dialog Patterns:**

```html
<!-- Header Pattern -->
<mat-toolbar class="flex items-center" color="primary">
  <mat-icon style="margin-right: 12px;">icon</mat-icon>
  <h2 style="margin: 0; font-size: 18px;">Title</h2>
  <span class="flex-1"></span>
  <button mat-icon-button (click)="cancel()"><mat-icon>close</mat-icon></button>
</mat-toolbar>
<mat-progress-bar color="warn" mode="indeterminate" *ngIf="isLoading"></mat-progress-bar>
<div style="height: 4px;" *ngIf="!isLoading"></div>

<!-- Section Header Pattern -->
<div class="flex items-center gap-2 mb-1" style="color: #305680;">
  <mat-icon style="font-size: 18px; width: 18px; height: 18px;">icon</mat-icon>
  <span style="font-weight: 600; font-size: 14px;">1. Section Title</span>
</div>

<!-- Footer Pattern -->
<div class="flex justify-end items-center gap-2 p-4"
     style="border-top: 1px solid #e0e0e0; background: #fafafa;">
  <button mat-button (click)="cancel()">Cancel</button>
  <button mat-raised-button color="primary" type="submit">
    <mat-icon style="font-size: 18px; margin-right: 4px;">save</mat-icon>
    Save
  </button>
</div>
```

**Action Struktur (WICHTIG!):**
```json
// RICHTIG: customFunction als Object
{
  "type": "custom",
  "customFunction": {
    "body": "projectWizard.openDialog(widgetContext, entityId);",
    "modules": {
      "projectWizard": "tb-resource;/api/resource/js_module/tenant/ECO Project Wizard.js"
    }
  }
}

// FALSCH: modules außerhalb (funktioniert NICHT!)
{
  "type": "custom",
  "modules": { ... },
  "customFunction": "string..."
}
```

**ThingsBoard Services:**
```javascript
const $injector = widgetContext.$scope.$injector;
const customDialog = $injector.get(widgetContext.servicesMap.get('customDialog'));
const attributeService = $injector.get(widgetContext.servicesMap.get('attributeService'));
const entityRelationService = $injector.get(widgetContext.servicesMap.get('entityRelationService'));
```

**Codex Integration:**
```bash
source ~/.nvm/nvm.sh && nvm use 20
codex exec --approval-mode full-auto -q "Als tb-dialog-agent: [Aufgabe]"
```

---

### 3. Code Review Agent (`code-review-agent`)

**Beschreibung:** Spezialist für Code Review von JS, HTML, CSS in ThingsBoard-Kontext.

**Expertise:**
- JavaScript Best Practices und ES6+
- HTML Accessibility und Semantik
- CSS Konsistenz und Performance
- ThingsBoard-spezifische Patterns
- Security (XSS, Injection Prevention)

**Review Checkliste:**

**JavaScript:**
- [ ] Variablen korrekt deklariert (const/let, kein var)
- [ ] Async/Await korrekt verwendet
- [ ] Error Handling vorhanden
- [ ] Keine Memory Leaks (Subscriptions unsubscribed)
- [ ] Performance bei großen Datenmengen

**HTML (in Widgets/Dialogs):**
- [ ] Semantische Struktur
- [ ] Accessibility Attribute (aria-*)
- [ ] Material Design Guidelines
- [ ] Responsive Layout

**CSS:**
- [ ] Konsistente Einheiten (px, rem)
- [ ] Keine !important außer nötig
- [ ] Flexbox/Grid korrekt verwendet
- [ ] Farbwerte aus Style Guide

**ThingsBoard-spezifisch:**
- [ ] Widget Lifecycle korrekt
- [ ] Services korrekt injiziert
- [ ] Action-Struktur valide
- [ ] Dashboard State Navigation korrekt

**Codex Integration:**
```bash
source ~/.nvm/nvm.sh && nvm use 20
codex exec --approval-mode full-auto -q "Als code-review-agent: Review [Datei/Änderungen]"
```

---

## Standard Workflow

### 1. Planung (Claude Code)

Claude Code ist verantwortlich für:
- Architektur und Design-Entscheidungen
- Risikoanalyse und Edge-Cases identifizieren
- Akzeptanzkriterien definieren
- Task-Spezifikationen in `tasks/` erstellen

### Task erstellen
Claude erstellt für jede Aufgabe eine Datei in `tasks/TASK_NAME.md` mit folgendem Format.

### 2. Umsetzung (Codex CLI)

Codex CLI führt die Implementierung durch basierend auf den Task-Spezifikationen.

**Automatisierte Ausführung (durch Claude Code):**
```bash
source ~/.nvm/nvm.sh && nvm use 20
codex exec --approval-mode full-auto -q "Aufgabe"
```

**Mit speziellem Agent:**
```bash
codex exec --approval-mode full-auto -q "Als [agent-name]: Aufgabe gemäß tasks/TASK_NAME.md"
```

**Manuelle Ausführung:**
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

### 3. Review (Claude Code)

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

## Agent
[Optional: tb-widget-agent | tb-dialog-agent | code-review-agent]

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
