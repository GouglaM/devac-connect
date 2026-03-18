# Guide d'Intégration - Système RBAC
## Comment utiliser le contrôle d'accès dans vos composants

---

## 🎯 Quick Start

### 1. Import des Composants de Protection

```typescript
import { 
  Protected,
  ProtectedButton,
  AdminGate,
  PermissionGate,
  ReadOnlyWrapper,
  useAuth
} from '../components/ui/ProtectedComponents';
```

### 2. Import du Service d'Authentification

```typescript
import { authService } from '../services/authService';
```

### 3. Import du Validateur RBAC

```typescript
import { rbacValidator, PermissionError } from '../services/rbacValidator';
```

---

## 📝 Motifs d'Utilisation Courants

### Pattern 1: Réduire la Visibilité d'un Bouton

```typescript
// ❌ SANS RBAC (Bouton toujours visible)
function MyComponent() {
  return (
    <button onClick={handleDelete}>
      Supprimer
    </button>
  );
}

// ✅ AVEC RBAC (Bouton caché pour non-admins)
function MyComponent() {
  return (
    <ProtectedButton 
      requireAdmin
      onClick={handleDelete}
      showLocked={true}
    >
      Supprimer
    </ProtectedButton>
  );
}
```

### Pattern 2: Afficher du Contenu Admin

```typescript
// ❌ SANS RBAC (Contenu toujours visible)
function AdminPanel() {
  return (
    <section>
      <h2>Panel Administration</h2>
      <button>Gérer les utilisateurs</button>
    </section>
  );
}

// ✅ AVEC RBAC (Contenu masqué pour non-admins)
function AdminPanel() {
  return (
    <AdminGate>
      <section>
        <h2>Panel Administration</h2>
        <button>Gérer les utilisateurs</button>
      </section>
    </AdminGate>
  );
}
```

### Pattern 3: Valider une Opération

```typescript
// ❌ SANS RBAC (Pas de vérification)
async function handleCreateAnnouncement(data) {
  const result = await addAnnouncementToDB(data);
  return result;
}

// ✅ AVEC RBAC (Vérification avant opération)
async function handleCreateAnnouncement(data) {
  try {
    // Valider les permissions
    rbacValidator.validateCreateAnnouncement(data);
    
    // Créer l'annonce
    const result = await addAnnouncementToDB(data);
    setSuccess('Annonce créée');
    return result;
  } catch (error) {
    if (error instanceof PermissionError) {
      setError(`Accès refusé: ${error.message}`);
    } else {
      setError('Erreur lors de la création');
    }
  }
}
```

### Pattern 4: Affichage Adaptatif selon Role

```typescript
// ✅ Affiche différentes vues selon le rôle
function UserProfile() {
  const { isAdmin } = useAuth();

  return (
    <div>
      {/* Sections communes */}
      <ProfileBasic />

      {/* Section pour tous */}
      <PermissionGate permission="read_unit">
        <MyUnits />
      </PermissionGate>

      {/* Section admin uniquement */}
      <AdminGate>
        <AdminSettings />
      </AdminGate>
    </div>
  );
}
```

### Pattern 5: Lecture-Seule pour Non-Admins

```typescript
// ✅ Affiche du contenu en lecture-seule pour non-admins
function UnitEditor({ isAdmin }) {
  return (
    <ReadOnlyWrapper 
      isReadOnly={!isAdmin}
      message="Contactez un administrateur pour modifier."
    >
      <form onSubmit={handleSave}>
        <input value={name} onChange={handleChange} />
        <button type="submit">Enregistrer</button>
      </form>
    </ReadOnlyWrapper>
  );
}
```

---

## 🔍 Vérification des Permissions

### Vérifier une Permission Spécifique

```typescript
import { authService } from '../services/authService';

// Vérifier une permission unique
if (authService.hasPermission('delete_announcement')) {
  // L'utilisateur peut supprimer une annonce
}

// Vérifier si admin
if (authService.isAdmin()) {
  // L'utilisateur est admin
}

// Vérifier une action sur une ressource
if (authService.canPerformAction('announcements', 'DELETE')) {
  // L'utilisateur peut supprimer des annonces
}

// Obtenir le rôle actuel
const role = authService.getCurrentRole(); // 'ADMIN' | 'MODERATOR' | 'USER'

// Obtenir les permissions
const permissions = authService.getPermissionsList();
```

### Vérifier avec le Hook

```typescript
import { useAuth } from '../components/ui/ProtectedComponents';

function MyComponent() {
  const { isAdmin, hasPermission, canPerformAction } = useAuth();

  return (
    <div>
      {isAdmin && <p>Vous êtes admin</p>}
      
      {hasPermission('create_announcement') && (
        <button>Créer annonce</button>
      )}

      {canPerformAction('units', 'UPDATE') && (
        <button>Modifier unité</button>
      )}
    </div>
  );
}
```

---

## 🛡️ Gestion des Erreurs

### Gestion Basique

```typescript
try {
  rbacValidator.validateCreateUnit(unitData);
  // Procéder
} catch (error) {
  console.error('Erreur RBAC:', error.message);
  setError(error.message);
}
```

### Gestion Avancée

```typescript
import { 
  PermissionError, 
  UnauthorizedError,
  getPermissionErrorMessage 
} from '../services/rbacValidator';

try {
  rbacValidator.validateDeleteUnit(unitId);
} catch (error) {
  if (error instanceof UnauthorizedError) {
    // L'utilisateur n'est pas authentifié
    showDialog('Vous devez vous connecter');
  } else if (error instanceof PermissionError) {
    // Permission spécifique refusée
    showDialog(getPermissionErrorMessage('delete_unit'));
  } else {
    // Erreur de validation générale
    showDialog(error.message);
  }
}
```

---

## 📊 Exemple Complet: Gestion des Annonces

```typescript
import React, { useState } from 'react';
import {
  Protected,
  ProtectedButton,
  AdminGate,
  ReadOnlyWrapper,
  useAuth
} from '../components/ui/ProtectedComponents';
import { rbacValidator, PermissionError } from '../services/rbacValidator';
import { Announcement } from '../types';

interface AnnouncementManagerProps {
  announcements: Announcement[];
  onAdd: (ann: Announcement) => void;
  onDelete: (id: string) => void;
  isAdmin: boolean;
}

export function AnnouncementManager({
  announcements,
  onAdd,
  onDelete,
  isAdmin
}: AnnouncementManagerProps) {
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const { hasPermission } = useAuth();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Valider permissions
      rbacValidator.validateCreateAnnouncement({
        id: 'temp',
        title,
        content,
        date: new Date().toISOString()
      });

      // Créer l'annonce
      onAdd({
        id: crypto.randomUUID(),
        title,
        content,
        date: new Date().toISOString()
      });

      setTitle('');
      setContent('');
    } catch (err: any) {
      if (err instanceof PermissionError) {
        setError('Vous n\'avez pas les permissions pour créer une annonce');
      } else {
        setError(err.message);
      }
    }
  };

  const handleDelete = (id: string) => {
    try {
      rbacValidator.validateDeleteAnnouncement(id);
      if (window.confirm('Êtes-vous sûr?')) {
        onDelete(id);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulaire de création (protégé) */}
      <Protected permission="create_announcement">
        <form onSubmit={handleCreate} className="space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre"
            required
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Contenu"
            required
          />
          
          {error && <div className="text-red-600">{error}</div>}
          
          <ProtectedButton
            permission="create_announcement"
            type="submit"
          >
            Créer l'annonce
          </ProtectedButton>
        </form>
      </Protected>

      {/* Liste des annonces */}
      <div className="space-y-4">
        {announcements.map((ann) => (
          <div key={ann.id} className="border p-4 rounded">
            <ReadOnlyWrapper isReadOnly={!isAdmin}>
              <h3>{ann.title}</h3>
              <p>{ann.content}</p>
              
              <AdminGate fallback={<p className="text-gray-500">Lecture seule</p>}>
                <ProtectedButton
                  permission="delete_announcement"
                  onClick={() => handleDelete(ann.id)}
                  className="mt-2 bg-red-600 text-white px-4 py-2 rounded"
                >
                  Supprimer
                </ProtectedButton>
              </AdminGate>
            </ReadOnlyWrapper>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🚀 Intégration dans des Composants Existants

### Avant (Exemple: AnnouncementBoard)

```typescript
interface AnnouncementBoardProps {
  announcements: Announcement[];
  isAdmin: boolean;
  onAdd: (ann: Announcement) => void;
  onDelete: (id: string) => void;
}

function AnnouncementBoard({ announcements, isAdmin, onAdd, onDelete }) {
  // Bouton de création toujours visible (pas de contrôle RBAC)
  if (isAdmin) {
    return (
      <>
        <button onClick={() => setShowForm(true)}>
          + Nouvelle annonce
        </button>
        // ... formulaire
      </>
    );
  }
  
  return <div>Annonces (lecture seule)</div>;
}
```

### Après (Avec RBAC)

```typescript
import { ProtectedButton, ReadOnlyWrapper, AdminGate } from '../components/ui/ProtectedComponents';
import { authService } from '../services/authService';

interface AnnouncementBoardProps {
  announcements: Announcement[];
  onAdd: (ann: Announcement) => void;
  onDelete: (id: string) => void;
}

function AnnouncementBoard({ announcements, onAdd, onDelete }) {
  // Bouton protégé par RBAC
  return (
    <>
      {/* Crée le bouton seulement si l'utilisateur a la permission */}
      <ProtectedButton 
        permission="create_announcement"
        onClick={() => setShowForm(true)}
      >
        + Nouvelle annonce
      </ProtectedButton>

      {/* Affiche les annonces */}
      {announcements.map(ann => (
        <div key={ann.id}>
          <ReadOnlyWrapper 
            isReadOnly={!authService.isAdmin()}
            message="Section en lecture-seule"
          >
            <h3>{ann.title}</h3>
            <p>{ann.content}</p>
            
            {/* Bouton suppression protégé */}
            <ProtectedButton 
              permission="delete_announcement"
              onClick={() => onDelete(ann.id)}
            >
              Supprimer
            </ProtectedButton>
          </ReadOnlyWrapper>
        </div>
      ))}
    </>
  );
}
```

---

## 📋 Checklist d'Implémentation

Lors de la création d'une nouvelle fonctionnalité :

- [ ] Identifier les actions sensibles (créer, modifier, supprimer)
- [ ] Définir qui devrait avoir accès (admin, moderator, user)
- [ ] Ajouter les permissions nécessaires dans `authService.ts`
- [ ] Envelopper les boutons avec `ProtectedButton`
- [ ] Envelopper le contenu avec `Protected` ou `AdminGate`
- [ ] Utiliser `ReadOnlyWrapper` pour les contenus sensibles
- [ ] Valider avec `rbacValidator` avant les opérations
- [ ] Gérer les erreurs `PermissionError`
- [ ] Ajouter des messages clairs aux utilisateurs
- [ ] Tester avec différents rôles

---

## 🧪 Tests

### Test d'une Permission

```typescript
import { authService } from '../services/authService';

// Dans les tests
describe('RBAC', () => {
  test('Admin peut créer annonce', () => {
    authService['setUserRole']('ADMIN'); // Simuler l'authentification
    expect(authService.hasPermission('create_announcement')).toBe(true);
  });

  test('User ne peut pas créer annonce', () => {
    authService['setUserRole']('USER');
    expect(authService.hasPermission('create_announcement')).toBe(false);
  });

  test('Validation lance erreur', () => {
    authService['setUserRole']('USER');
    expect(() => {
      rbacValidator.validateCreateAnnouncement({/* data */});
    }).toThrow(PermissionError);
  });
});
```

---

## 🐛 Dépannage Courant

### Q: Le bouton est toujours visible même avec `ProtectedButton`
**R:** Vérifiez que:
1. L'ID de permission est correct
2. La permission est dans `authService.ts`
3. L'utilisateur a le bon rôle

### Q: Le message d'erreur ne s'affiche pas
**R:** Vérifiez que:
1. Vous capturez l'exception `PermissionError`
2. Vous affichez `error.message` ou utilisez `getPermissionErrorMessage()`

### Q: L'utilisateur garde ses permissions après déconnexion
**R:** Appelez `authService.logout()` dans votre fonction de déconnexion

---

## 📚 Ressources Additionnelles

- [RBAC_DOCUMENTATION.md](./RBAC_DOCUMENTATION.md) - Documentation complète
- [types.ts](./src/types.ts) - Définitions de types
- [authService.ts](./src/services/authService.ts) - Service d'authentification
- [ProtectedComponents.tsx](./src/components/ui/ProtectedComponents.tsx) - Composants

---

**Version**: 1.0.0  
**Dernière mise à jour**: Mars 2026
