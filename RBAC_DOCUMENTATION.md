# Système de Contrôle d'Accès Basé sur les Rôles (RBAC)
## Documentation Complète - DEVAC Connect

---

## 📋 Vue d'ensemble

Ce système RBAC (Role-Based Access Control) implémente un contrôle d'accès granulaire basé sur les rôles pour l'application DEVAC Connect. Il fournit une protection à plusieurs niveaux : interface utilisateur, logique métier et validation côté client.

### Objectifs
- ✅ Restreindre l'affichage des fonctionnalités par rôle
- ✅ Protéger les routes et les actions sensibles
- ✅ Valider les permissions avant les opérations
- ✅ Fournir un feedback visuel clair aux utilisateurs
- ✅ Implémenter les meilleures pratiques de sécurité

---

## 🎯 Architecture

### Rôles Disponibles

| Rôle | Permissions | Cas d'usage |
|------|------------|-----------|
| **ADMIN** | Toutes les permissions | Administrateur système |
| **MODERATOR** | Gérer contenu, annonces, membres | Modérateurs de communauté |
| **USER** | Lecture seule | Utilisateurs standard |

### Hiérarchie des Permissions

```
USER (lecture-seule)
  ├── read_announcement
  ├── read_unit
  └── read_document

MODERATOR (gestion contenu)
  ├── read_announcement
  ├── create_announcement
  ├── read_unit
  └── manage_members

ADMIN (accès complet)
  ├── create_announcement
  ├── update_announcement
  ├── delete_announcement
  ├── create_unit
  ├── update_unit
  ├── delete_unit
  ├── manage_members
  ├── manage_campaigns
  ├── manage_users
  ├── view_analytics
  └── export_data
```

---

## 📁 Structure des Fichiers

### Services
```
src/services/
├── authService.ts           # Gestion de l'authentification et des rôles
└── rbacValidator.ts         # Validation des permissions
```

### Composants
```
src/components/
├── ui/ProtectedComponents.tsx    # Composants protégés (Protected, ProtectedButton, etc.)
└── Home.tsx                      # Page d'accueil optimisée
```

### Types
```
src/types.ts                 # Types RBAC (UserPermissions, AuthContext, etc.)
```

---

## 🔧 Configuration des Permissions

### Fichier: `src/services/authService.ts`

Les permissions sont définies par rôle à l'initialisation :

```typescript
const ADMIN_PERMISSIONS: Permission[] = [
  { 
    id: 'create_announcement', 
    name: 'Créer annonces',
    description: 'Créer nouvelles annonces',
    resource: 'announcements', 
    action: 'CREATE' 
  },
  // ... autres permissions
];
```

Pour **ajouter une nouvelle permission** :

1. Ajouter à l'interface `Permission` dans `types.ts`
2. Ajouter la permission aux listes appropriées dans `authService.ts`
3. Utiliser dans les composants avec `Protected` ou `ProtectedButton`

---

## 🛡️ Composants de Protection

### 1. **Protected** - Affichage Conditionnel
Cache un composant selon les permissions.

```typescript
// Exemple : Afficher un bouton uniquement aux admins
<Protected requireAdmin>
  <button>Supprimer l'annonce</button>
</Protected>

// Exemple : Afficher selon permission spécifique
<Protected permission="delete_announcement">
  <button onClick={handleDelete}>Supprimer</button>
</Protected>

// Avec fallback personnalisé
<Protected 
  requireAdmin 
  fallback={<p>Accès réservé aux administrateurs</p>}
>
  <AdminPanel />
</Protected>
```

### 2. **ProtectedButton** - Bouton avec Contrôle
Désactive automatiquement un bouton selon les permissions.

```typescript
// Bouton protégé
<ProtectedButton 
  requireAdmin 
  onClick={handleDelete}
  showLocked={true}
>
  Supprimer
</ProtectedButton>

// Avec permission spécifique
<ProtectedButton 
  permission="update_unit"
  onClick={handleUpdate}
>
  Modifier l'unité
</ProtectedButton>
```

### 3. **AdminGate** - Porte d'Accès Admin
Affiche du contenu uniquement aux administrateurs.

```typescript
<AdminGate>
  <div>Panel d'administration</div>
</AdminGate>

// Avec message personnalisé
<AdminGate 
  fallback={<p>Cette section est réservée aux administrateurs.</p>}
>
  <AdvancedSettings />
</AdminGate>
```

### 4. **PermissionGate** - Porte d'Accès par Permission
Affiche du contenu selon une permission spécifique.

```typescript
<PermissionGate permission="view_analytics">
  <AnalyticsDashboard />
</PermissionGate>
```

### 5. **ReadOnlyWrapper** - Feedback Lecture-Seule
Affiche une section en lecture-seule avec feedback visuel.

```typescript
<ReadOnlyWrapper 
  isReadOnly={!isAdmin}
  message="Section en lecture-seule pour les utilisateurs standards."
>
  <EditableContent />
</ReadOnlyWrapper>

// Style personnalisé
<ReadOnlyWrapper 
  isReadOnly={true}
  className="p-4 bg-blue-50 rounded-lg"
>
  <SensitiveData />
</ReadOnlyWrapper>
```

---

## 🔐 Validation côté Client

### Service: `rbacValidator.ts`

Valide les permissions avant les opérations sensibles :

```typescript
// Valider avant une opération
try {
  rbacValidator.validateCreateAnnouncement(announcementData);
  // Procéder à la création
} catch (error) {
  if (error instanceof PermissionError) {
    setError('Vous n\'avez pas les permissions pour créer une annonce');
  }
}

// Check permisson simple
if (checkAccess('delete_announcement', 'Suppression d\'annonce')) {
  // Procéder
}
```

### Erreurs Personnalisées

```typescript
// UnauthorizedError : Utilisateur n'a pas les permissions
throw new UnauthorizedError('Accès administrateur requis');

// PermissionError : Permission spécifique manquante
throw new PermissionError('Permission requise: créer une annonce');
```

---

## 🎨 Feedback Visuel

### États d'Accès

#### 1. **Boutons Verrouillés**
```typescript
// Visualisation d'un bouton sans permissions
<ProtectedButton requireAdmin showLocked={true}>
  {/* Affiche un cadenas rouge en haut à droite */}
  Supprimer
</ProtectedButton>
```

#### 2. **Sections Lecture-Seule**
```typescript
// Affichage du wrapper lecture-seule
<ReadOnlyWrapper isReadOnly={true}>
  {/* 
    - Contenu grisé (opacity-70)
    - Badge "Lecture-seule" en haut à droite
    - Message informatif en bas
  */}
</ReadOnlyWrapper>
```

#### 3. **Badges et Indicateurs**
- 🔒 Cadenas rouge : Accès refusé
- ⚠️ Icône alerte : Section sensible
- ✓ Coche verte : Accès autorisé
- 🛡️ Badge admin : Connecté comme admin

#### 4. **Messages Informatifs**
```typescript
// Messages contextuels
"Vous avez accès en lecture seule. 
Contactez un administrateur pour modifier."

"Permission requise: créer une annonce"

"Accès administrateur requis"
```

---

## 📱 Page d'Accueil Optimisée

### Fichier: `src/components/Home.tsx`

La page d'accueil utilise le RBAC pour :

#### 1. **Actions Rapides Filtrées**
```typescript
// Chaque action a une permission
const quickActions: QuickAction[] = [
  {
    id: 'admin_panel',
    label: 'Administration',
    adminOnly: true,  // ← Visible que pour les admins
    action: () => navigateTo('ADMIN'),
    // ...
  }
];

// Les composants Protected masquent les actions non autorisées
<Protected permission={action.permission}>
  <ActionButton />
</Protected>
```

#### 2. **Statistiques Contextuelles**
- Affiche les stats pertinentes selon le rôle
- Affiche un badge "Connecté comme Admin" pour les admins
- Affiche "Accès standard" pour les utilisateurs normaux

#### 3. **Widgets Adaptatifs**
```typescript
// Widget admin (visible que pour admin)
<AdminGate>
  <AdminToolsWidget />
</AdminGate>

// Widget lecture-seule (pour non-admin)
<ReadOnlyWrapper isReadOnly={!isAdmin}>
  <StandardUserInfo />
</ReadOnlyWrapper>
```

#### 4. **Navigation Protégée**
Certaines pages ne sont accessibles qu'avec les bonne permissions :
- Annonces → permission `read_announcement`
- Unités → permission `read_unit`
- Panel Admin → permission admin

---

## 🚀 Utilisation Pratique

### Exemple 1: Créer un Composant Protégé

```typescript
import { Protected, ProtectedButton } from '../components/ui/ProtectedComponents';

function MyComponent() {
  return (
    <Protected requireAdmin>
      <section>
        <h2>Zonead Administration</h2>
        
        <ProtectedButton 
          permission="delete_unit"
          onClick={handleDelete}
        >
          Supprimer l'unité
        </ProtectedButton>
      </section>
    </Protected>
  );
}
```

### Exemple 2: Valider une Opération

```typescript
import { rbacValidator, PermissionError } from '../services/rbacValidator';

async function handleCreateAnnouncement(data) {
  try {
    // Valider les permissions
    rbacValidator.validateCreateAnnouncement(data);
    
    // Procéder à la création
    await addAnnouncementToDB(data);
    setSuccess('Annonce créée avec succès');
  } catch (error) {
    if (error instanceof PermissionError) {
      setError(error.message);
    } else {
      setError('Une erreur est survenue');
    }
  }
}
```

### Exemple 3: Affichage Conditionnel Avancé

```typescript
import { 
  AdminGate, 
  ReadOnlyWrapper, 
  PermissionGate 
} from '../components/ui/ProtectedComponents';

function UnitsPage() {
  return (
    <div>
      {/* Visible que pour les admins */}
      <AdminGate>
        <CreateUnitButton />
      </AdminGate>

      {/* Adaptatif selon les permissions */}
      <PermissionGate permission="read_unit">
        <UnitsList />
      </PermissionGate>

      {/* Affiche un feedback si pas d'accès */}
      <ReadOnlyWrapper isReadOnly={!isAdmin}>
        <UnitDetails />
      </ReadOnlyWrapper>
    </div>
  );
}
```

---

## 📊 Audit et Logging

Le système enregistre les tentatives d'accès non autorisé :

```typescript
// Dans rbacValidator.ts
console.warn('[RBAC] Accès refusé à [permission]: 
  Utilisateur n\'a pas la permission requise');

console.error('[RBAC] Tentative d\'opération non autorisée: 
  [error.message]');
```

Pour activer l'audit complet, modifier le niveau de log :
```typescript
// En production
if (process.env.NODE_ENV === 'production') {
  sendToAuditLog(accessDeniedEvent);
}
```

---

## 🔄 Authentification

### Flux d'Authentification

1. **Connexion Admin**
   - Utilisateur entre le mot de passe
   - `authService.authenticateWithPassword()` vérifie
   - Si correct → role passe à 'ADMIN'
   - localStorage persiste l'état

2. **Rechargement Page**
   - `authService.loadAuthState()` restaure les permissions
   - Si admin → accès maintenu

3. **Déconnexion**
   - `authService.logout()` réinitialize
   - Role retourne à 'USER'
   - localStorage vidé

---

## 🛠️ Maintenance et Extension

### Ajouter un Nouveau Rôle

1. Éditer `types.ts`:
```typescript
export type UserRole = 'ADMIN' | 'MODERATOR' | 'USER' | 'SUPERVISOR'; // ← Nouveau rôle
```

2. Éditer `authService.ts`:
```typescript
const SUPERVISOR_PERMISSIONS: Permission[] = [
  // Permissions superviseurs
];

private getPermissionsForRole(role: UserRole): UserPermissions {
  const permissionMap = {
    // ...
    SUPERVISOR: SUPERVISOR_PERMISSIONS,
  };
}
```

### Ajouter une Nouvelle Permission

1. Ajouter à `types.ts`
2. Ajouter aux rôles appropriés dans `authService.ts`
3. Utiliser dans les composants avec `<Protected permission="...">`

---

## ✅ Bonnes Pratiques

1. **Principe du Moindre Privilège** → Accorder seulement les permissions nécessaires
2. **Validation Multicouche** → Vérifier côté client ET serveur
3. **Messages Clairs** → Expliquer pourquoi l'accès est refusé
4. **Feedback Visuel** → Ne pas laisser les utilisateurs confus
5. **Logging** → Enregistrer les tentatives suspectes
6. **Tests** → Tester tous les chemins d'accès

---

## 🔗 Fichiers Clés

- [authService.ts](../services/authService.ts) - Gestion des rôles
- [rbacValidator.ts](../services/rbacValidator.ts) - Validation des permissions
- [ProtectedComponents.tsx](../components/ui/ProtectedComponents.tsx) - Composants protégés
- [Home.tsx](../components/Home.tsx) - Page d'accueil
- [types.ts](../types.ts) - Définitions de types

---

## 📞 Support

Pour toute question ou ajout de fonctionnalité RBAC, consulter la documentation ou contacter l'équipe de développement.

**Version**: 1.0.0  
**Date**: Mars 2026  
**Auteur**: DEVAC Team
