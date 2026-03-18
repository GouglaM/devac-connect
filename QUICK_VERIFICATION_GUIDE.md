# Guide de Vérification Rapide - RBAC
## Tester Localement et en Ligne en 5 Minutes

---

## 🚀 DÉMARRAGE RAPIDE LOCAL

### Étape 1: Compiler et Lancer
```bash
cd c:\Users\HP\OneDrive\Documents\Projets\devac-connect

# Vérifier pas d'erreurs TypeScript
npx tsc --noEmit

# Lancer dev server
npm run dev
# Accéder: http://localhost:5173/
```

### Étape 2: Tests dans la Console (F12)

**Test 1 - Vérifier authService chargé:**
```javascript
authService
// → Object with methods
```

**Test 2 - Vérifier non-authentifié:**
```javascript
authService.isAdmin() // → false
authService.getCurrentRole() // → 'USER'
```

**Test 3 - Authentifier:**
```javascript
authService.authenticateWithPassword('DEVAC2025', 'DEVAC2025')
// → true (succès)
authService.isAdmin() // → true
authService.getCurrentRole() // → 'ADMIN'
```

**Test 4 - Vérifier permissions:**
```javascript
authService.hasPermission('create_announcement')
// → true (admin a toutes permissions)

authService.hasPermission('delete_announcement')
// → true
```

**Test 5 - Vérifier localStorage:**
```javascript
localStorage.getItem('devac_auth_role')
// → 'ADMIN'
```

**Test 6 - Déconnexion:**
```javascript
authService.logout()
authService.isAdmin() // → false
localStorage.getItem('devac_auth_role')
// → null
```

---

## 🌐 TESTS EN LIGNE

### Lien Production
```
https://gouglaM.github.io/devac-connect/
```

### Test 1: Page d'Accueil (Non-Authentifié)
1. Ouvrir https://gouglaM.github.io/devac-connect/
2. **Vérifier:**
   - ☑ Actions rapides visibles (6 boutons)
   - ☑ En-tête avec "Bienvenue à DEVAC Connect"
   - ☑ Statistiques affichées (Unités, Comités, Annonces)
   - ☑ Widget "Accès standard" visible (lecture-seule)
   - ☑ Pas de boutons admin visibles

---

### Test 2: Authentification
1. Chercher lien "Administration" (menu ou bouton)
2. Entrer mot de passe: `DEVAC2025`
3. Cliquer "Connecter"

**Attendre:**
   - ☑ Redirection vers AdminPanel
   - ☑ Onglets chargés: Annonces, Studio, Maintenance
   - ☑ Pas d'erreur

---

### Test 3: Admin Panel
1. Une fois authentifié, vérifier:

**Onglet Annonces:**
   - ☑ Bouton "+ Nouvelle annonce" visible
   - ☑ Champs titre/contenu accessibles
   - ☑ Micros pour input vocal disponibles

**Onglet Studio:**
   - ☑ Outils de création disponibles
   - ☑ Options d'édition visibles

**Onglet Maintenance:**
   - ☑ Boutons gestion BD visibles
   - ☑ Import CSV disponible

---

### Test 4: Persistance Admin
1. Une fois connecté
2. **Rafraîchir la page** (F5)

**Attendre:**
   - ☑ Admin panel reste visible
   - ☑ Pas de re-login requis
   - ☑ État admin persiste

---

### Test 5: Déconnexion
1. Depuis admin panel
2. Cliquer bouton "Déconnexion" (LogOut)

**Attendre:**
   - ☑ Retour à AdminLogin
   - ☑ Message "Accès réservé"
   - ☑ Admin state effacé

---

### Test 6: Accès Direct Admin (Non-Auth)
1. Aller à: `https://gouglaM.github.io/devac-connect/#/administrateur`

**Attendre:**
   - ☑ AdminLogin affiché (pas panel admin)
   - ☑ Demande mot de passe

---

## 📋 CHECKLIST RAPIDE (5 min)

### Fichiers Créés ✓
- [ ] `src/services/authService.ts` existe
- [ ] `src/services/rbacValidator.ts` existe
- [ ] `src/components/ui/ProtectedComponents.tsx` existe
- [ ] `src/components/Home.tsx` existe

### Compilation ✓
- [ ] `npx tsc --noEmit` → no errors
- [ ] `npm run build` → success

### Local Tests ✓
- [ ] authService.isAdmin() → false
- [ ] Authentifier → true
- [ ] hasPermission('create_announcement') → true
- [ ] logout() → false

### En Ligne Tests ✓
- [ ] Home page charge
- [ ] Stats affichées
- [ ] Auth fonctionne
- [ ] Admin panel chargé
- [ ] Logout fonctionne
- [ ] Refresh persiste auth

---

## 🔧 COMMANDES UTILES

### Vérifier TypeScript
```bash
npx tsc --noEmit
```
Attendu: Pas de sortie (exit code 0)

### Vérifier Imports
```bash
grep -r "authService" src/
grep -r "Protected" src/components/
```

### Vérifier Build
```bash
npm run build
```
Attendu: "✓ built in X ms"

### Vérifier Déploiement
```bash
npm run deploy
```
Attendu: Déploiement vers GitHub Pages

---

## 🐛 POINTS DE VÉRIFICATION CRITIQUES

### 1. authService Singleton
**Fichier:** `src/services/authService.ts`
```typescript
// Vérifier export singleton
export const authService = new AuthService();
```

### 2. Imports ProtectedComponents
**Fichier:** `src/components/ui/ProtectedComponents.tsx`
```typescript
// Imports corrects
import { authService } from '../../services/authService';
import React, { ReactNode } from 'react';
import { Lock, AlertCircle } from 'lucide-react';
```

### 3. Intégration Home.tsx
**Fichier:** `src/App.tsx`
```typescript
// case 'HOME' doit utiliser composant Home
case 'HOME':
  return (
    <Home
      announcements={announcements}
      // ... props
    />
  );
```

### 4. AdminPanel avec RBAC
**Fichier:** `src/admin/AdminPanel.tsx`
```typescript
// handleSubmit doit valider
rbacValidator.validateCreateAnnouncement(data);
```

---

## 📊 Résumé des Changements

| Fichier | Type | Lignes | Action |
|---------|------|--------|--------|
| authService.ts | CREATE | 240 | Service RBAC |
| rbacValidator.ts | CREATE | 168 | Validation |
| ProtectedComponents.tsx | CREATE | 345 | Composants |
| Home.tsx | CREATE | 398 | Page optimisée |
| types.ts | MODIFY | +35 | Types RBAC |
| AdminPanel.tsx | MODIFY | +30 | Validation |
| App.tsx | MODIFY | +40 | Intégration |

**Total:** 7 fichiers modifiés/créés, ~1246 lignes

---

## 🎯 Résultats Attendus

### Avant Auth (Utilisateur Normal)
```
✓ Page accueil visible
✓ Actions rapides visibles
✓ Stats visibles
✓ Widget "Accès standard" (lecture-seule)
✗ Aucun bouton modification visible
✗ Panel admin inaccessible
```

### Après Auth (Admin)
```
✓ Admin panel accessible
✓ Tous les boutons actifs
✓ Accès à Annonces, Studio, Maintenance
✓ Widget "Outils Admin" visible
✓ État persiste après refresh
```

### Après Logout
```
✓ Retour à login
✓ Admin state vidé
✗ Aucun accès admin
✗ localStorage vide
```

---

## 🔐 Vérification Sécurité

1. **Mauvais mot de passe** → Erreur affichée
2. **Accès direct URL admin** → Redirect login
3. **localStorage suspecte** → Recharge depuis authService
4. **Refresh page** → Auth persiste (localStorage)
5. **Logout** → localStorage vidé

---

## 📞 En Cas de Problème

### Problème: Erreur TypeScript
```bash
npx tsc --noEmit 2>&1 | head -20
```

### Problème: Imports non trouvés
```bash
ls -R src/services/
ls -R src/components/ui/
```

### Problème: authService non disponible
```javascript
// Console
authService
// Si undefined → F5 refresh ou npm run dev restart
```

### Problème: Admin ne persiste pas
```javascript
// Console
localStorage.devac_auth_role
// Doit exister après login
```

---

## ✅ Validation Finale

Tous les tests passent? Checklist complète:
- [ ] Fichiers créés (4)
- [ ] Fichiers modifiés (3)
- [ ] TypeScript compile (0 errors)
- [ ] Local: authService fonctionne
- [ ] Ligne: Home page visible
- [ ] Ligne: Auth fonctionne
- [ ] Ligne: Admin persiste
- [ ] Ligne: Logout fonctionne

**→ IMPLÉMENTATION RÉUSSIE! ✅**

---

**Site:** https://gouglaM.github.io/devac-connect/  
**Date:** 18 mars 2026
