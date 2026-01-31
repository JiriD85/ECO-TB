# Task: Manage Project Access

## Übersicht

Implementierung einer "Manage Project Access" Funktion im `manage_projects` State, die es ermöglicht:
- Project Viewer Gruppen zu erstellen/verwalten
- User zu Projekten hinzuzufügen/zu entfernen
- Berechtigungen sauber zu entfernen wenn User entfernt werden

## Aktueller Stand

### Bestehende Logik (Add Project User)
Location: `dashboards/administration.json` → Widget `aeae7803-eac3-1b63-938e-06dde5857ced` → Action `act-add-user`

Beim Erstellen eines Project Viewers werden erstellt:
1. **User Group**: `Viewers: [ProjectName]` (entityName)
2. **Asset Group**: `Project Assets: [ProjectName]`
3. **Permissions**:
   - GENERIC Role "Belimo Retrofit Viewers" → User Group
   - GROUP Role "Belimo Retrofit Read Only" → Dashboard Group "Belimo Retrofit"
   - GROUP Role "Belimo Retrofit Read Only" → Asset Group "Project Assets: [ProjectName]"

### Naming Convention
- User Group: `Viewers: {project.name}` (z.B. "Viewers: AIOT_4")
- Asset Group: `Project Assets: {project.name}` (z.B. "Project Assets: AIOT_4")

## Anforderungen

### 1. UI/UX

#### Button Platzierung
- Neuer Row Action Button "Manage Project Access" (Icon: `group`) in `manage_projects` State
- Pro Projekt-Zeile sichtbar

#### Dialog mit Stepper
```
┌─────────────────────────────────────────────────────┐
│  Manage Project Access: [ProjectName]          [X]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ○ Step 1: Groups    ● Step 2: Users               │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  [Step 1: Groups]                                   │
│  ┌─────────────────────────────────────────────┐   │
│  │ User Group                                   │   │
│  │ ┌─────────────────────────────────────────┐ │   │
│  │ │ Viewers: AIOT_4              [Create]   │ │   │
│  │ │ Status: ✓ Exists (3 users)             │ │   │
│  │ └─────────────────────────────────────────┘ │   │
│  │                                             │   │
│  │ Asset Group                                 │   │
│  │ ┌─────────────────────────────────────────┐ │   │
│  │ │ Project Assets: AIOT_4       [Create]   │ │   │
│  │ │ Status: ✓ Exists                        │ │   │
│  │ └─────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [Step 2: Users]                                    │
│  ┌─────────────────────────────────────────────┐   │
│  │ Current Project Viewers:                     │   │
│  │ ┌─────────────────────────────────────────┐ │   │
│  │ │ ☑ user1@example.com    Max Mustermann  │ │   │
│  │ │ ☑ user2@example.com    Anna Schmidt    │ │   │
│  │ │ ☑ user3@example.com    John Doe        │ │   │
│  │ └─────────────────────────────────────────┘ │   │
│  │                                             │   │
│  │ [+ Add User]  [- Remove Selected]           │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
├─────────────────────────────────────────────────────┤
│                        [Back] [Next/Done]           │
└─────────────────────────────────────────────────────┘
```

### 2. Funktionale Anforderungen

#### Step 1: Groups Management
- Prüfen ob User Group existiert → Anzeigen Status
- Prüfen ob Asset Group existiert → Anzeigen Status
- Button "Create" wenn Gruppe nicht existiert
- Gruppen können hier nur erstellt, nicht gelöscht werden (Löschung erfolgt automatisch)

#### Step 2: Users Management
- Liste aller User in der "Viewers: [ProjectName]" Gruppe anzeigen
- Multi-Select für User
- **Add User**: Öffnet Dialog zur User-Erstellung (wie bestehende Add User Logik)
- **Remove Selected**: Entfernt ausgewählte User aus der Gruppe

### 3. Lösch-Logik (Remove User)

#### Reihenfolge beim Entfernen eines Users:
```
1. User aus User Group entfernen
   └─> entityGroupService.removeEntityFromEntityGroup(userGroupId, userId)

2. Prüfen: Ist User Group jetzt leer?
   └─> entityGroupService.getEntityGroupEntities(userGroupId)

3. Wenn leer:
   a. Group Permissions der User Group löschen
      └─> roleService.deleteGroupPermission(permissionId)

   b. User Group löschen
      └─> entityGroupService.deleteEntityGroup(userGroupId)

   c. Asset Group löschen (da keine User mehr)
      └─> entityGroupService.deleteEntityGroup(assetGroupId)
```

#### Bestätigungs-Dialog:
```
┌─────────────────────────────────────────────────────┐
│  ⚠️ Remove Project Access                      [X]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Are you sure you want to remove 2 user(s) from     │
│  project "AIOT_4"?                                  │
│                                                     │
│  Users to remove:                                   │
│  • user1@example.com (Max Mustermann)               │
│  • user2@example.com (Anna Schmidt)                 │
│                                                     │
│  ⚠️ Warning: This is the last user in the group.   │
│  The following will also be deleted:                │
│  • User Group: Viewers: AIOT_4                      │
│  • Asset Group: Project Assets: AIOT_4             │
│                                                     │
├─────────────────────────────────────────────────────┤
│                    [Cancel]  [Remove Access]        │
└─────────────────────────────────────────────────────┘
```

### 4. API Endpoints

#### Entity Groups
```javascript
// Get group by name
entityGroupService.getEntityGroupsByOwnerId(customerId, 'USER')
  .filter(g => g.name === 'Viewers: ' + projectName)

// Get users in group
entityGroupService.getEntityGroupEntities(userGroupId, 'USER', pageLink)

// Remove user from group
entityGroupService.removeEntityFromEntityGroup(userGroupId, userId)

// Delete group
entityGroupService.deleteEntityGroup(groupId)
```

#### Permissions
```javascript
// Get group permissions
http.get('/api/userGroup/' + userGroupId + '/groupPermissions')

// Delete permission
roleService.deleteGroupPermission(permissionId)
// ODER: http.delete('/api/role/group/' + permissionId)
```

### 5. Implementierungs-Schritte

#### Phase 1: Vorbereitung
- [ ] manage_projects State analysieren
- [ ] Bestehende Widget-Struktur verstehen
- [ ] Action Button Platzierung identifizieren

#### Phase 2: Dialog Grundgerüst
- [ ] Neuen Action Button "Manage Project Access" hinzufügen
- [ ] Stepper-Dialog HTML/CSS erstellen
- [ ] Controller-Logik für Stepper

#### Phase 3: Step 1 - Groups
- [ ] User Group Status laden und anzeigen
- [ ] Asset Group Status laden und anzeigen
- [ ] Create-Buttons implementieren

#### Phase 4: Step 2 - Users
- [ ] User-Liste aus User Group laden
- [ ] Multi-Select implementieren
- [ ] Add User Button (bestehende Logik wiederverwenden)

#### Phase 5: Remove Logic
- [ ] Remove Selected Funktion
- [ ] Bestätigungs-Dialog
- [ ] Prüfung "letzte User" mit Warnung
- [ ] Lösch-Kaskade implementieren

#### Phase 6: Testing & Polish
- [ ] Edge Cases testen
- [ ] Error Handling
- [ ] Loading States
- [ ] UI Polish

### 6. Dateien zu modifizieren

- `dashboards/administration.json`
  - Widget in `manage_projects` State
  - Neue Action `act-manage-project-access`

### 7. Abhängigkeiten

- Bestehende Add User Logik kann teilweise wiederverwendet werden
- entityGroupService muss injiziert werden
- roleService muss injiziert werden

### 8. Edge Cases

1. **Gruppe existiert nicht**: Create-Button anzeigen
2. **Keine User in Gruppe**: "No users" Meldung, Remove-Button disabled
3. **Letzter User wird entfernt**: Warnung anzeigen, Gruppen löschen
4. **API Fehler**: Error Toast anzeigen, Zustand nicht ändern
5. **User hat Zugriff auf mehrere Projekte**: Nur aktuelles Projekt betroffen

### 9. Sicherheit

- Nur ECO Administratoren können diese Funktion nutzen
- Bestätigungs-Dialog vor jeder Löschung
- Keine Möglichkeit versehentlich alle Gruppen zu löschen

---

## Gewählte Lösung: Status-Header + Tabs

### UI Design
```
┌──────────────────────────────────────────────────────┐
│  👥 Project Users: AIOT_4                       [X] │
├──────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────┐ │
│  │ 📊 Status                                      │ │
│  │  ✓ User Group: Viewers: AIOT_4  (3 users)     │ │
│  │  ✓ Asset Group: Project Assets: AIOT_4        │ │
│  │  ✓ Permissions: Configured                     │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  [👥 Users (3)]        [➕ Create New]              │
│  ─────────────────────────────────────────────────── │
│  ... tab content ...                                │
└──────────────────────────────────────────────────────┘
```

### Remove User Confirmation Dialog
```
┌──────────────────────────────────────────────────────┐
│  ⚠️ Remove User from Project                        │
├──────────────────────────────────────────────────────┤
│  Remove "user@example.com" from project AIOT_4?     │
│                                                      │
│  [Warning if last user - shows what will be deleted]│
│                                                      │
│                    [Cancel]  [Remove]                │
└──────────────────────────────────────────────────────┘
```

### Implementation Steps
1. ✅ Analyze existing code
2. ✅ Add status header to HTML
3. ✅ Add status loading logic to customFunction
4. ✅ Add removeUserWithConfirmation function
5. ✅ Add cleanup logic (delete permissions, groups)
6. ✅ Test basic scenarios
7. ✅ Fix error handling for non-existent permissions (übersprungen - ThingsBoard löscht automatisch)
8. ✅ Filter "Add Existing User" dropdown to show only Project Viewer users

---

## Erledigte Punkte

### ✅ Add Existing User - Filter by Role
**Implementiert:** Das "Add Existing User" Dropdown zeigt nur User mit `role = "Project Viewer"` Attribut.

**Lösung:**
```javascript
// Für jeden User das role-Attribut laden
attributeService.getEntityAttributes({ entityType: 'USER', id: user.id.id }, 'SERVER_SCOPE', ['role'])

// Nur User mit "Project Viewer" Rolle anzeigen
.filter(r => r.role === 'Project Viewer')
```

---

### ✅ Error Handling verbessert
**Lösung:** Permission-Löschung wird übersprungen, da ThingsBoard diese automatisch löscht wenn die User Group gelöscht wird. Gruppe wird jetzt nach Namen gesucht statt nach (möglicherweise veralteter) ID.

---

## Notizen

### Relevante Code-Referenzen

**Add Project User Logik** (aus act-add-user):
```javascript
// User Group erstellen/finden
const userGroupName = 'Viewers: ' + project.name;
entityGroupService.getEntityGroupsByOwnerId(customerId, 'USER')

// Asset Group erstellen/finden
const assetGroupName = 'Project Assets: ' + project.name;
entityGroupService.getEntityGroupsByOwnerId(customerId, 'ASSET')

// Permissions zuweisen
roleService.saveGroupPermission({...})
```

**Permission Check Logik** (aus act-check-permissions):
```javascript
http.get('/api/userGroup/' + groupId + '/groupPermissions')
```

---

*Erstellt: 2026-01-31*
*Letzte Aktualisierung: 2026-01-31*
*Status: ✅ Abgeschlossen*
