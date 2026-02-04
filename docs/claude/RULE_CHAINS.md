# Rule Chains Guide

## Grundstruktur

Rule Chains definieren Message-Verarbeitung:
- `connections` Array mit `fromIndex` und `toIndex`
- Node Types: filter, transformation, action, external

## API ueber Rule Chains aufrufen

**Problem:** Customer Users koennen bestimmte API-Endpoints nicht direkt aufrufen.
**Loesung:** API-Calls ueber Rule Chain mit System-JWT-Token.

### Korrekte Struktur (4 Nodes)

```
[Input] → [Save Original] → [Login API] → [Prepare Body + Token] → [API Call]
```

**WICHTIG:** Nach REST API Call wird `msg` mit Response ueberschrieben!

### Node 1: Save Original

Original-Daten in metadata speichern UND Login-Body setzen:

```javascript
// TBEL Script
metadata.originalData = JSON.stringify(msg.createPermission);
var loginBody = { username: "api-user@example.com", password: "..." };
return { msg: loginBody, metadata: metadata, msgType: msgType };
```

### Node 2: Login API Call

```
Type: REST API Call
URL: https://diagnostics.ecoenergygroup.com/api/auth/login
Method: POST
Headers: Content-Type: application/json
```

Nach diesem Node: `msg` = Login Response mit token!

### Node 3: Token + Body vorbereiten

```javascript
// Token aus msg (Login Response)
var jwtToken = msg.token;
metadata.jwtToken = jwtToken;

// Original-Daten aus metadata
var data = JSON.parse(metadata.originalData);

// Request Body bauen
var requestBody = { ... };

return { msg: requestBody, metadata: metadata, msgType: msgType };
```

### Node 4: API Call

```
Type: REST API Call
URL: https://diagnostics.ecoenergygroup.com/api/...
Method: POST
Headers:
  Content-Type: application/json
  X-Authorization: Bearer ${jwtToken}
```

## Metadaten-Variablen

| Variable | Beschreibung |
|----------|--------------|
| `${jwtToken}` | Aus `metadata.jwtToken` |
| `${ss_key}` | Server Scope Attribute (nur mit "Fetch Attributes" Node) |

**WICHTIG:** Variablen werden in URL/Headers ersetzt, aber NICHT im Body!

## Haeufige Fehler

1. Token im Body statt metadata speichern
2. `${systemJwtToken}` verwenden (existiert NICHT)
3. Body als String statt Object zurueckgeben

## Create Permission Rule Chain

**Zweck:** Permissions fuer Customer Users erstellen.

**Trigger:** Device Attribut `createPermission` wird gesetzt.

**Trigger Device ID:** `e5e10f60-fef5-11f0-a0ee-33b9bcf3ddd0`

**Code-Pattern:**
```javascript
const permissionTriggerDevice = {
  entityType: 'DEVICE',
  id: 'e5e10f60-fef5-11f0-a0ee-33b9bcf3ddd0'
};

attributeService.saveEntityAttributes(
  permissionTriggerDevice,
  'SERVER_SCOPE',
  [{ key: 'createPermission', value: JSON.stringify(permissionData) }]
);
```

## Debug Mode

### In JSON aktivieren:
```json
{
  "debugSettings": { "allEnabled": true }
}
```

### Events ansehen:
1. Rule Chain oeffnen → Node doppelklicken → Events Tab
2. Event Type: "Debug"
3. Zeitraum erwetern falls noetig

**WICHTIG:** Debug Mode in Production nur temporaer aktivieren!
