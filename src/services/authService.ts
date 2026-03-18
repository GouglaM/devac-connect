/**
 * Service d'Authentification et d'Autorisation (RBAC)
 * Gère les rôles, permissions et contrôle d'accès
 */

import { UserRole, Permission, UserPermissions, AuthContext } from '../types';

// ========== Configuration des permissions par rôle ==========

const ADMIN_PERMISSIONS: Permission[] = [
  { id: 'create_announcement', name: 'Créer annonces', description: 'Créer nouvelles annonces', resource: 'announcements', action: 'CREATE' },
  { id: 'update_announcement', name: 'Modifier annonces', description: 'Modifier annonces existantes', resource: 'announcements', action: 'UPDATE' },
  { id: 'delete_announcement', name: 'Supprimer annonces', description: 'Supprimer annonces', resource: 'announcements', action: 'DELETE' },
  { id: 'read_announcement', name: 'Voir annonces', description: 'Voir toutes les annonces', resource: 'announcements', action: 'READ' },
  
  { id: 'create_unit', name: 'Créer unités', description: 'Créer unités d\'évangélisation', resource: 'units', action: 'CREATE' },
  { id: 'update_unit', name: 'Modifier unités', description: 'Modifier unités existantes', resource: 'units', action: 'UPDATE' },
  { id: 'delete_unit', name: 'Supprimer unités', description: 'Supprimer unités', resource: 'units', action: 'DELETE' },
  { id: 'read_unit', name: 'Voir unités', description: 'Voir unités d\'évangélisation', resource: 'units', action: 'READ' },
  
  { id: 'manage_members', name: 'Gérer membres', description: 'Gérer membres des unités', resource: 'members', action: 'EXECUTE' },
  { id: 'manage_campaigns', name: 'Gérer campagnes', description: 'Gérer campagnes d\'évangélisation', resource: 'campaigns', action: 'EXECUTE' },
  { id: 'manage_users', name: 'Gérer utilisateurs', description: 'Gérer les comptes utilisateurs', resource: 'users', action: 'EXECUTE' },
  { id: 'view_analytics', name: 'Voir statistiques', description: 'Accéder à l\'analytique', resource: 'analytics', action: 'READ' },
  { id: 'export_data', name: 'Exporter données', description: 'Exporter données du système', resource: 'data', action: 'EXECUTE' },
];

const MODERATOR_PERMISSIONS: Permission[] = [
  { id: 'read_announcement', name: 'Voir annonces', description: 'Voir toutes les annonces', resource: 'announcements', action: 'READ' },
  { id: 'create_announcement', name: 'Créer annonces', description: 'Créer nouvelles annonces', resource: 'announcements', action: 'CREATE' },
  { id: 'read_unit', name: 'Voir unités', description: 'Voir unités d\'évangélisation', resource: 'units', action: 'READ' },
  { id: 'manage_members', name: 'Gérer membres', description: 'Gérer membres des unités', resource: 'members', action: 'EXECUTE' },
];

const USER_PERMISSIONS: Permission[] = [
  { id: 'read_announcement', name: 'Voir annonces', description: 'Voir toutes les annonces', resource: 'announcements', action: 'READ' },
  { id: 'read_unit', name: 'Voir unités', description: 'Voir unités d\'évangélisation', resource: 'units', action: 'READ' },
];

// ========== Classe AuthService ==========

class AuthService {
  private currentRole: UserRole = 'USER';
  private currentPermissions: UserPermissions;
  private authContext: AuthContext;
  private localStorage: Storage;

  constructor() {
    this.localStorage = typeof window !== 'undefined' ? window.localStorage : ({} as Storage);
    this.currentPermissions = this.getPermissionsForRole('USER');
    this.authContext = {
      isAuthenticated: false,
      isAdmin: false,
      role: 'USER',
      permissions: this.currentPermissions,
    };
    this.loadAuthState();
  }

  /**
   * Initialiser l'authentification avec un mot de passe
   */
  authenticateWithPassword(password: string, correctPassword: string): boolean {
    if (password === correctPassword) {
      this.setUserRole('ADMIN');
      this.saveAuthState();
      return true;
    }
    return false;
  }

  /**
   * Se déconnecter
   */
  logout(): void {
    this.currentRole = 'USER';
    this.currentPermissions = this.getPermissionsForRole('USER');
    this.updateAuthContext();
    this.localStorage.removeItem('devac_auth_role');
    this.localStorage.removeItem('devac_auth_login_time');
  }

  /**
   * Obtenir les permissions pour un rôle spécifique
   */
  private getPermissionsForRole(role: UserRole): UserPermissions {
    const permissionMap = {
      ADMIN: ADMIN_PERMISSIONS,
      MODERATOR: MODERATOR_PERMISSIONS,
      USER: USER_PERMISSIONS,
    };

    return {
      role,
      permissions: permissionMap[role],
      canManageUsers: role === 'ADMIN',
      canManageContent: role === 'ADMIN' || role === 'MODERATOR',
      canManageUnits: role === 'ADMIN',
      canManageCampaigns: role === 'ADMIN',
      canViewAnalytics: role === 'ADMIN',
      canExportData: role === 'ADMIN',
    };
  }

  /**
   * Changer le rôle de l'utilisateur
   */
  private setUserRole(role: UserRole): void {
    this.currentRole = role;
    this.currentPermissions = this.getPermissionsForRole(role);
    this.updateAuthContext();
  }

  /**
   * Mettre à jour le contexte d'authentification
   */
  private updateAuthContext(): void {
    this.authContext = {
      isAuthenticated: this.currentRole !== 'USER',
      isAdmin: this.currentRole === 'ADMIN',
      role: this.currentRole,
      permissions: this.currentPermissions,
      lastLoginTime: this.authContext.lastLoginTime,
    };
  }

  /**
   * Sauvegarder l'état d'authentification
   */
  private saveAuthState(): void {
    this.localStorage.setItem('devac_auth_role', this.currentRole);
    this.localStorage.setItem('devac_auth_login_time', new Date().toISOString());
  }

  /**
   * Charger l'état d'authentification depuis le stockage
   */
  private loadAuthState(): void {
    const savedRole = this.localStorage.getItem('devac_auth_role') as UserRole | null;
    if (savedRole && ['ADMIN', 'MODERATOR', 'USER'].includes(savedRole)) {
      this.setUserRole(savedRole);
    }
    const loginTime = this.localStorage.getItem('devac_auth_login_time');
    if (loginTime) {
      this.authContext.lastLoginTime = loginTime;
    }
  }

  /**
   * Vérifier si l'utilisateur a une permission spécifique
   */
  hasPermission(permissionId: string): boolean {
    return this.currentPermissions.permissions.some(p => p.id === permissionId);
  }

  /**
   * Vérifier si l'utilisateur peut effectuer une action sur une ressource
   */
  canPerformAction(resource: string, action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXECUTE'): boolean {
    return this.currentPermissions.permissions.some(
      p => p.resource === resource && p.action === action
    );
  }

  /**
   * Vérifier si l'utilisateur peut gérer le contenu
   */
  canManageContent(): boolean {
    return this.currentPermissions.canManageContent;
  }

  /**
   * Vérifier si l'utilisateur est admin
   */
  isAdmin(): boolean {
    return this.authContext.isAdmin;
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isAuthenticated(): boolean {
    return this.authContext.isAuthenticated;
  }

  /**
   * Obtenir le rôle actuel
   */
  getCurrentRole(): UserRole {
    return this.currentRole;
  }

  /**
   * Obtenir les permissions actuelles
   */
  getCurrentPermissions(): UserPermissions {
    return this.currentPermissions;
  }

  /**
   * Obtenir le contexte d'authentification
   */
  getAuthContext(): AuthContext {
    return this.authContext;
  }

  /**
   * Obtenir la liste des permissions
   */
  getPermissionsList(): Permission[] {
    return this.currentPermissions.permissions;
  }

  /**
   * Vérifier l'accès à une page/section (throw si non autorisé)
   */
  requirePermission(permissionId: string, errorMessage?: string): void {
    if (!this.hasPermission(permissionId)) {
      throw new Error(errorMessage || `Permission requise: ${permissionId}`);
    }
  }

  /**
   * Vérifier l'accès admin (throw si non autorisé)
   */
  requireAdmin(errorMessage?: string): void {
    if (!this.isAdmin()) {
      throw new Error(errorMessage || 'Accès administrateur requis');
    }
  }
}

// Instantier le service singleton
export const authService = new AuthService();

export default authService;
