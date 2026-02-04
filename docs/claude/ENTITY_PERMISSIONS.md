# Entity Model & Permissions

## Entity Hierarchie

```
Customer → Project → Measurement → Device
```

| Entity Type | Beschreibung |
|-------------|--------------|
| `CUSTOMER` | Gebaeude/Kunde |
| `ASSET` (type: Project) | Messkampagne |
| `ASSET` (type: Measurement) | Messpunkt (ultrasonic, import, interpolation) |
| `DEVICE` | Sensoren (P-Flow D116, Temperature Sensor, etc.) |

## Relations

Typ `Measurement` von Parent zu Child:
- FROM Project TO Measurement
- FROM Measurement TO Device

## Progress States

```
in preparation → active → finished
                       ↘ aborted
```

## Permission Model

### Role Types

| Typ | Beschreibung |
|-----|--------------|
| **GENERIC** | Gilt fuer ALLE Entities eines Typs |
| **GROUP** | Gilt nur fuer Entities in einer Entity Group |

### Customer User Groups

| User Group | GENERIC Role | Dashboard GROUP Role |
|------------|--------------|---------------------|
| Belimo Retrofit Read Only | Belimo Retrofit Viewers | Belimo Retrofit |
| Belimo Retrofit Users | Belimo Retrofit Users | Belimo Retrofit |
| Belimo Retrofit Administrators | Belimo Retrofit Administrators | Belimo Retrofit + Administrators |
| Belimo Retrofit Engineer | Belimo Retrofit Engineer | Belimo Retrofit |

### Project Viewers

Erstellt via "Project Users" Dialog:

1. **User Group:** `Viewers: [ProjectName]`
2. **Asset Group:** `Project Assets: [ProjectName]`

**Permission (NUR EINE!):**
- GROUP Role: "Belimo Retrofit Read Only"
- Target: Asset Group "Project Assets: [ProjectName]"

**WICHTIG:**
- KEINE GENERIC Permission erstellen
- KEINE Dashboard Group Permission
- NUR die Asset Group Permission

### GENERIC Role: Belimo Retrofit Viewers

**DARF KEINE ASSET-Permissions haben!**

```
USER: READ, READ_ATTRIBUTES
CUSTOMER: READ
```

Asset-Zugriff kommt nur ueber GROUP Role.

## API Endpoints

| Endpoint | Beschreibung |
|----------|--------------|
| `GET /api/userGroup/{id}/groupPermissions` | Permissions einer User Group |
| `POST /api/groupPermission` | Permission erstellen |

**Swagger:** https://diagnostics.ecoenergygroup.com/swagger-ui/

## Code Pattern: Permission pruefen

```javascript
widgetContext.http.get('/api/userGroup/' + userGroup.id.id + '/groupPermissions').pipe(
  widgetContext.rxjs.switchMap(existingPermissions => {
    const hasPermission = existingPermissions.some(p =>
      p.roleId?.id === roleId.id &&
      (entityGroupId ? p.entityGroupId?.id === entityGroupId.id : !p.entityGroupId)
    );

    if (hasPermission) {
      console.log('Permission exists');
      return widgetContext.rxjs.of(null);
    }

    return roleService.saveGroupPermission({...});
  })
);
```
