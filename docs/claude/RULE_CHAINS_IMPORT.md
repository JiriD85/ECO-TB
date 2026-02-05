# Rule Chains Import Guide

## Status

Die Rule Chains sind lokal vorbereitet, müssen aber **manuell in ThingsBoard importiert** werden, da das Sync Tool `push-rulechain` nicht unterstützt.

### Zu importierende Dateien

```
rule chains/Create Project.json
rule chains/Update Project.json
```

## Importprozess

### Schritt 1: Create Project Rule Chain importieren

1. Öffne ThingsBoard UI → **Rule Chains**
2. Klick auf **"+"** (New Rule Chain)
3. **OR:** Klick auf **"Import"** falls bereits vorhanden
4. Wähle: `rule chains/Create Project.json`
5. Klick **Import** → Rule Chain wird erstellt
6. **Notiere die Rule Chain ID** aus der URL oder Details

### Schritt 2: Update Project Rule Chain importieren

1. Gleicher Prozess für: `rule chains/Update Project.json`
2. **Notiere auch diese Rule Chain ID**

## Root Rule Chain Konfiguration

Nach dem Import musst du die Root Rule Chain anpassen, damit `createProject` und `updateProject` Attribute erkannt werden.

### Schritt 1: Root Rule Chain öffnen

1. ThingsBoard UI → **Rule Chains**
2. Suche und öffne: **"Root Rule Chain"**
3. Klick auf **"Edit"**

### Schritt 2: Switch Node für External API hinzufügen

1. Drag & Drop: **"JS Switch Node"** auf die Canvas
2. Double-click zum Konfigurieren
3. **Name:** `Check External API`
4. **Script Language:** TBEL
5. **Script:**
```javascript
if (msg.createProject != null) {
    return ['createProject'];
} else if (msg.updateProject != null) {
    return ['updateProject'];
} else {
    return ['other'];
}
```
6. Klick **Save**

### Schritt 3: Rule Chain Input Nodes hinzufügen

#### 3a: Create Project Rule Chain Node

1. Drag & Drop: **"Rule Chain"** Node (Flow → Rule Chain)
2. Double-click zum Konfigurieren
3. **Name:** `Create Project`
4. **Select Rule Chain:** `Create Project` (from dropdown)
5. Klick **Save**

#### 3b: Update Project Rule Chain Node

1. Wiederhole 3a für Update Project:
2. **Name:** `Update Project`
3. **Select Rule Chain:** `Update Project`

### Schritt 4: Verbindungen herstellen

1. **Message Type Switch → Check External API**
   - Klick auf den Output der "Message Type Switch" Node
   - Ziehe zu "Check External API" Input
   - **Type:** "Attributes Updated" ODER "Post attributes"

2. **Check External API → Create Project**
   - Output: "createProject" → Input "Create Project" Node

3. **Check External API → Update Project**
   - Output: "updateProject" → Input "Update Project" Node

### Schritt 5: Speichern und testen

1. Klick **"Save"**
2. Prüfe Debug Logs (Rule Chain → Node → Events → Debug)
3. Test mit Attribut POST:

```bash
# Test: createProject
CUSTOMER_ID="your-customer-id"
curl -X POST "https://diagnostics.ecoenergygroup.com/api/plugins/telemetry/CUSTOMER/${CUSTOMER_ID}/attributes/SERVER_SCOPE" \
  -H "Content-Type: application/json" \
  -H "X-Authorization: Bearer ${JWT_TOKEN}" \
  -d '{
    "createProject": {
      "projectName": "Test Project",
      "address": "Test Street 1",
      "postalCode": "1010",
      "city": "Vienna",
      "latitude": 48.2,
      "longitude": 16.3,
      "measurements": []
    }
  }'
```

## Troubleshooting

### Problem: Rule Chain Node findet die Rule Chain nicht

**Lösung:**
1. Stelle sicher, dass beide Rule Chains (`Create Project` und `Update Project`) existieren
2. Refresh die Rule Chain List (F5)
3. Versuche, die Rule Chain neu zu wählen

### Problem: Messages werden nicht verarbeitet

**Checklist:**
1. Debug Mode in den Rule Chains aktivieren (sollte bereits aktiviert sein)
2. Prüfe die Node Events: Rule Chain → Node doppelclick → Events Tab
3. Prüfe die Root Rule Chain Connections
4. Stelle sicher, dass der Attribute Namen exakt `createProject` oder `updateProject` ist (case-sensitive)

### Problem: "Attributes Updated" vs "Post attributes"

Die Message Type Switch Node unterscheidet zwischen:
- **"Attributes Updated"** - Wenn Attribute sich ändern
- **"Post attributes"** - Wenn Attribute gesetzt werden

In der Regel funktionieren beide. Falls nur einer funktioniert:
1. Beide Verbindungen zur Check External API Node hinzufügen
2. Beide ausgehen Verbindungen konfigurieren

## Rollback

Falls es Probleme gibt:

1. Delete die beiden neuen Rule Chain Input Nodes aus der Root Rule Chain
2. Lösche die `Check External API` Node
3. Speichern
4. Die Rule Chains `Create Project` und `Update Project` können auf dem Server bleiben - sie schaden nicht, wenn nicht aufgerufen

## Debugging Tipps

### Log-Ausgabe anzeigen

1. Rule Chain öffnen → Node doppelclick
2. Tab: **"Events"**
3. Filter: "Debug" events
4. Wenn nicht sichtbar: Root Rule Chain → Node → Debug Mode enable

### Lokale Test-Messages

Im ThingsBoard UI kannst du auch direkt Messages über das API testen:

```bash
# Alle Entity Groups eines Customers abfragen
curl -X GET "https://diagnostics.ecoenergygroup.com/api/entityGroup/all/CUSTOMER/{CUSTOMER_ID}/ASSET" \
  -H "X-Authorization: Bearer ${JWT_TOKEN}"

# Projekte im Projects-Verzeichnis abfragen
curl -X GET "https://diagnostics.ecoenergygroup.com/api/entityGroup/{PROJECTS_GROUP_ID}/assets?pageSize=100" \
  -H "X-Authorization: Bearer ${JWT_TOKEN}"
```

## Nächste Schritte

- [ ] Beide Rule Chains importieren
- [ ] Root Rule Chain anpassen
- [ ] Test mit curl oder API Client durchfuehren
- [ ] Debug Logs pruefen
- [ ] In Produktion gehen (Debug Mode ausschalten)
