## Plan: Interface Administrateur Dédiée

TL;DR - Créer une section admin accessible via /administrateur avec authentification, regroupant toutes les fonctionnalités admin existantes (gestion logo, membres, annonces, etc.) et nouvelles.

**Steps**
1. Installer React Router pour gérer les routes, y compris /administrateur. *Dépend de la vérification de l'absence de routeur existant.*
2. Créer un composant AdminLogin pour la page de connexion avec vérification du mot de passe.
3. Réorganiser AdminPanel.tsx en une page admin principale, accessible seulement après login.
4. Déplacer tous les composants admin sous src/admin/ dans une structure dédiée, en gardant les fonctionnalités existantes.
5. Ajouter une route protégée pour /administrateur qui redirige vers AdminLogin si non authentifié.
6. Améliorer la persistance de l'authentification admin (localStorage ou session).
7. Intégrer les fonctionnalités existantes : modifier logo, ajouter membres via import CSV, gérer annonces, etc.
8. Mettre à jour App.tsx pour inclure le routeur et les nouvelles routes.

**Relevant files**
- src/App.tsx — Modifier pour ajouter routing et état admin global.
- src/admin/AdminPanel.tsx — Réorganiser en page admin.
- src/admin/components/ — Tous les sous-composants admin.
- src/services/firebaseService.ts — Fonctions admin existantes.
- package.json — Ajouter react-router-dom si nécessaire.

**Verification**
1. Tester l'accès à /administrateur : doit afficher la page de login si non connecté, puis l'interface admin après login.
2. Vérifier que toutes les fonctionnalités admin (logo, membres, annonces) sont accessibles dans la section admin.
3. Tester la persistance : recharger la page ne doit pas déconnecter l'admin.
4. Vérifier que les utilisateurs non-admin ne peuvent pas accéder à /administrateur.

**Decisions**
- Utiliser React Router pour les routes, car le projet n'en a pas actuellement.
- Garder l'authentification simple (mot de passe unique) comme actuellement, mais ajouter persistance.
- Regrouper toutes les fonctionnalités admin dans une seule page /administrateur, avec onglets pour les différentes sections.
- Inclure la gestion du logo et l'ajout de membres comme demandé, en réutilisant le code existant.

**Further Considerations**
1. Sécurité : Considérer une authentification plus robuste (Firebase Auth) pour la production.
2. UI : Améliorer l'interface de login pour une meilleure UX.
