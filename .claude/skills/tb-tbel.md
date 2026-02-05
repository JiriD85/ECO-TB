# TBEL (ThingsBoard Expression Language) Reference

## Uebersicht

TBEL ist eine Erweiterung von MVEL mit ThingsBoard-spezifischen Sicherheitseinschraenkungen und Hilfsfunktionen. Es wird in Rule Chains fuer Transformationen, Filter und Berechnungen verwendet.

**Wichtige Eigenschaften:**
- Java-aehnliche Syntax
- Strikte Speicherverwaltung
- Inline Map/List Creation erforderlich
- Null-Safe Navigation mit `?` Operator

## Key-Existenz pruefen

### Methode 1: Null-Check (EMPFOHLEN)

```javascript
// Direkte Null-Pruefung
if (msg.temperature != null) {
    // Key existiert und hat einen Wert
}

// Fuer verschachtelte Properties
if (msg.values != null && msg.values.temperature != null) {
    // Beide existieren
}
```

### Methode 2: Null-Safe Operator `?` (EMPFOHLEN)

```javascript
// Sicher auf verschachtelte Properties zugreifen
var temp = msg.?values.?temperature;  // Gibt null zurueck wenn nicht vorhanden

// In Bedingungen
if (msg.?values.?temperature > 10) {
    // Wird nur ausgefuehrt wenn der Pfad existiert UND > 10 ist
}
```

### Methode 3: keys() mit indexOf (fuer dynamische Keys)

```javascript
// Pruefen ob ein Key in der Map existiert
var keys = msg.keys();
if (keys.indexOf('values') >= 0) {
    // Key 'values' existiert
}
```

### Methode 4: get() mit Null-Check

```javascript
// Expliziter get() Aufruf
var values = msg.get('values');
if (values != null) {
    var temp = values.get('temperature');
}
```

## Verschachtelte Properties sicher lesen

### Pattern 1: Null-Safe Operator (BESTE Methode)

```javascript
// Sicher auf tiefe Verschachtelung zugreifen
var value = msg.?level1.?level2.?level3;

// Mit Fallback
var value = msg.?values.?temperature;
if (value == null) {
    value = 0;  // Default
}
```

### Pattern 2: Stufenweise Pruefung

```javascript
var result = null;
if (msg.values != null) {
    if (msg.values.temperature != null) {
        result = msg.values.temperature;
    }
}
```

### Pattern 3: Kombiniert mit Ternary

```javascript
// WICHTIG: In Map-Literalen IMMER Klammern um Ternary!
var msgNew = {
    temperature: (msg.?values.?temperature != null ? msg.values.temperature : 0)
};
```

## Boolean Handling

### Zuweisung

```javascript
var isActive = true;
var isDisabled = false;

// Aus Bedingung
var isHot = msg.temperature > 30;
```

### In Map-Literalen (KRITISCH!)

```javascript
// RICHTIG - mit Klammern:
var result = {
    isActive: (msg.status == 'active' ? true : false),
    isHot: (msg.temperature > 30 ? true : false)
};

// FALSCH - ohne Klammern (erzeugt Parsing-Fehler):
var result = {
    isActive: msg.status == 'active' ? true : false  // FEHLER!
};
```

### Boolean Vergleiche

```javascript
// Explizit
if (msg.active == true) { }
if (msg.active == false) { }

// Implizit (auch moeglich)
if (msg.active) { }
if (!msg.active) { }
```

## Map/Object Methoden

| Methode | Beschreibung | Beispiel |
|---------|--------------|----------|
| `keys()` | Alle Keys als List | `msg.keys()` |
| `values()` | Alle Values als List | `msg.values()` |
| `size()` | Anzahl Eintraege | `msg.size()` |
| `get(key)` | Wert fuer Key | `msg.get('temp')` |
| `put(key, value)` | Eintrag setzen | `msg.put('temp', 25)` |
| `putIfAbsent(key, value)` | Nur wenn nicht vorhanden | `msg.putIfAbsent('temp', 0)` |
| `replace(key, value)` | Existierenden Wert ersetzen | `msg.replace('temp', 30)` |
| `remove(key)` | Eintrag loeschen | `msg.remove('temp')` |
| `putAll(map)` | Mehrere Eintraege | `msg.putAll(other)` |
| `entrySet()` | Iteration | `foreach(e : msg.entrySet())` |
| `sortByKey()` | Nach Key sortieren | `msg.sortByKey()` |
| `sortByValue()` | Nach Value sortieren | `msg.sortByValue()` |
| `memorySize()` | Speicherverbrauch | `msg.memorySize()` |

## List/Array Methoden

| Methode | Beschreibung | Beispiel |
|---------|--------------|----------|
| `contains(value)` | Element vorhanden? | `list.contains('x')` |
| `indexOf(value)` | Position finden | `list.indexOf('x')` |
| `size()` | Laenge | `list.size()` |
| `get(index)` | Element holen | `list.get(0)` |
| `add(value)` | Hinzufuegen | `list.add('x')` |
| `push(value)` | Am Ende | `list.push('x')` |
| `pop()` | Letztes entfernen | `list.pop()` |
| `shift()` | Erstes entfernen | `list.shift()` |
| `remove(index)` | An Position entfernen | `list.remove(0)` |
| `sort()` | Sortieren | `list.sort()` |
| `reverse()` | Umkehren | `list.reverse()` |
| `join(sep)` | Zu String | `list.join(',')` |
| `slice(start, end)` | Teilbereich | `list.slice(0, 5)` |

## Ternary Operator (KRITISCH!)

### In Variablen (kein Problem)

```javascript
var value = msg.temp > 20 ? 'warm' : 'cold';
var num = msg.count > 0 ? msg.count : 0;
```

### In Map-Literalen (IMMER Klammern!)

```javascript
// RICHTIG:
var result = {
    status: (msg.temp > 30 ? 'hot' : 'normal'),
    value: (msg.value != null ? msg.value : 0)
};

// FALSCH (Parsing-Fehler!):
var result = {
    status: msg.temp > 30 ? 'hot' : 'normal'  // FEHLER: Ergibt {'hot' : 'normal'}
};
```

## Built-in Funktionen

### Type Checking

```javascript
isMap(obj)      // true wenn Map
isList(obj)     // true wenn List
isArray(obj)    // true wenn Array
isSet(obj)      // true wenn Set
isNaN(value)    // true wenn NaN
```

### Encoding/Decoding

```javascript
btoa(string)           // Base64 encode
atob(string)           // Base64 decode
encodeURI(string)      // URL encode
decodeURI(string)      // URL decode
```

### String/Bytes

```javascript
stringToBytes(str, charset)   // String zu Bytes
bytesToString(bytes, charset) // Bytes zu String
decodeToJson(bytes)           // Bytes zu JSON
```

### Zahlen

```javascript
toFixed(value, precision)  // Runden (z.B. toFixed(3.14159, 2) = 3.14)
toInt(value)               // Zu Integer runden
parseHexToInt(hex)         // Hex zu Integer
intToHex(int)              // Integer zu Hex
```

### String-Formatierung

```javascript
padStart(str, length, char)  // Links auffuellen
padEnd(str, length, char)    // Rechts auffuellen
```

### JSON

```javascript
JSON.stringify(obj)   // Object zu JSON String
JSON.parse(string)    // JSON String zu Object
```

### Utility

```javascript
raiseError(message)                    // Exception werfen
toFlatMap(json, excludeList, pathInKey) // JSON flatten
toSet(list)                            // List zu Set
newSet()                               // Leeres Set
```

## Vollstaendige Beispiele

### Telemetrie filtern

```javascript
// Nur bestimmte Keys weiterleiten
var whitelist = ['temperature', 'humidity', 'pressure'];
var result = {};

foreach (entry : msg.entrySet()) {
    var key = entry.key;  // WICHTIG: In Variable speichern!
    if (whitelist.indexOf(key) >= 0) {
        result[key] = entry.value;
    }
}

return {msg: result, metadata: metadata, msgType: msgType};
```

### Sicheres Mapping mit Defaults

```javascript
var result = {
    temperature: (msg.?values.?temperature != null ? msg.values.temperature : 0),
    humidity: (msg.?values.?humidity != null ? msg.values.humidity : 0),
    timestamp: metadata.ts
};

return {msg: result, metadata: metadata, msgType: msgType};
```

### Alarm-Bedingung pruefen

```javascript
// Filter: true = weiterleiten, false = verwerfen
var temp = msg.?temperature;
var threshold = metadata.?ss_alarmThreshold;

if (temp == null || threshold == null) {
    return false;  // Nicht genug Daten
}

return temp > threshold;
```

### Berechnete Werte

```javascript
var values = msg.?values;
if (values == null) {
    return {msg: msg, metadata: metadata, msgType: msgType};
}

// Berechnung nur wenn alle Werte vorhanden
var result = {};
if (values.?powerIn != null && values.?powerOut != null) {
    result.efficiency = (values.powerOut / values.powerIn * 100);
    result.efficiency = toFixed(result.efficiency, 2);
}

return {msg: result, metadata: metadata, msgType: msgType};
```

### Metadata anreichern

```javascript
// Server Attributes in Metadata kopieren
var attrs = metadata.?ss_deviceType;
if (attrs != null) {
    metadata.deviceType = attrs;
}

// Computed Metadata
metadata.processedAt = new Date().getTime();

return {msg: msg, metadata: metadata, msgType: msgType};
```

## Anti-Patterns (NICHT verwenden!)

### FALSCH: Ternary ohne Klammern in Maps

```javascript
// FALSCH!
var result = {
    value: msg.x > 0 ? 'positive' : 'negative'
};
// Ergibt: {'positive' : 'negative'} - komplett falsches Ergebnis!
```

### FALSCH: Direkter Property-Zugriff in entrySet Loop

```javascript
// FALSCH - kann InaccessibleObjectException werfen!
foreach (p : msg.entrySet()) {
    result[p.key] = p.value;  // FEHLER!
}

// RICHTIG:
foreach (p : msg.entrySet()) {
    var key = p.key;  // Erst in Variable
    result[key] = p.value;
}
```

### FALSCH: Zugriff ohne Null-Check

```javascript
// FALSCH - wirft Exception wenn values nicht existiert!
var temp = msg.values.temperature;

// RICHTIG:
var temp = msg.?values.?temperature;
// oder
var temp = null;
if (msg.values != null) {
    temp = msg.values.temperature;
}
```

### FALSCH: containsKey() oder keys() verwenden

```javascript
// FALSCH - containsKey() existiert NICHT in TBEL!
if (msg.containsKey('values')) { }

// FALSCH - keys() funktioniert nicht auf msg!
if (msg.keys().indexOf('values') >= 0) { }

// RICHTIG - get() verwenden:
var v = msg.get('values');
if (v != null) { }
```

## Switch Node Pattern (WICHTIG!)

### Korrekte Syntax fuer Flag-Pruefung in Switch Nodes

```javascript
// KORREKT - kompakt und sicher:
var v = msg.get('values');
var f = (v != null) ? v.get('dT_collapse_flag') : null;
if (f == null) return ['skip'];
return f == true ? ['create'] : ['clear'];
```

**Erklaerung:**
- `msg.get('values')` gibt null zurueck wenn Key nicht existiert (kein Fehler!)
- `v.get('flag')` gibt null zurueck wenn Key nicht existiert
- Ternaerer Operator funktioniert AUSSERHALB von Map-Literalen
- Kompakt: nur 4 Zeilen

### FALSCH: try/catch verwenden

```javascript
// FALSCH - try/catch existiert NICHT in TBEL!
try {
    var x = msg.values.temp;
} catch (e) { }

// RICHTIG: Null-Safe Operator verwenden
var x = msg.?values.?temp;
```

## Debugging-Tipps

### Werte loggen

```javascript
// In Transformation Node - Werte sichtbar machen
var debug = {
    msgKeys: msg.keys(),
    hasValues: (msg.values != null),
    valuesType: (msg.values != null ? 'exists' : 'null'),
    metadataKeys: metadata.keys()
};

// Als Teil der Rueckgabe
return {msg: debug, metadata: metadata, msgType: 'DEBUG'};
```

### Type pruefen

```javascript
var typeInfo = {
    isMap: isMap(msg),
    isList: isList(msg.?items),
    valueType: (typeof msg.value)
};
```

## Quellen

- [ThingsBoard TBEL Dokumentation](https://thingsboard.io/docs/user-guide/tbel/)
- [TBEL GitHub Repository](https://github.com/thingsboard/tbel)
