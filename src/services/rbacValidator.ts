/**
 * Wrapper RBAC pour les opérations Firebase
 * Ajoute des vérifications de permission côté client avant chaque opération
 */

import { authService } from './authService';
import { Announcement, EvangelismUnit, Committee } from '../types';

// ========== Types d'erreurs ==========

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

// ========== Service de validation RBAC ==========

class RBACValidator {
  /**
   * Valider avant de créer une annonce
   */
  validateCreateAnnouncement(announcement: Announcement): void {
    if (!authService.canPerformAction('announcements', 'CREATE')) {
      throw new PermissionError('Permission requise: créer une annonce');
    }
    
    if (!announcement.title || !announcement.content) {
      throw new Error('Les champs titre et contenu sont obligatoires');
    }
  }

  /**
   * Valider avant de modifier une annonce
   */
  validateUpdateAnnouncement(announcement: Announcement): void {
    if (!authService.canPerformAction('announcements', 'UPDATE')) {
      throw new PermissionError('Permission requise: modifier une annonce');
    }
    
    if (!announcement.id) {
      throw new Error('ID d\'annonce manquant');
    }
  }

  /**
   * Valider avant de supprimer une annonce
   */
  validateDeleteAnnouncement(announcementId: string): void {
    if (!authService.canPerformAction('announcements', 'DELETE')) {
      throw new PermissionError('Permission requise: supprimer une annonce');
    }
    
    if (!announcementId) {
      throw new Error('ID d\'annonce manquant');
    }
  }

  /**
   * Valider avant de créer une unité
   */
  validateCreateUnit(unit: EvangelismUnit): void {
    if (!authService.canPerformAction('units', 'CREATE')) {
      throw new PermissionError('Permission requise: créer une unité');
    }
    
    if (!unit.name || !unit.mission) {
      throw new Error('Les champs nom et mission sont obligatoires');
    }
  }

  /**
   * Valider avant de modifier une unité
   */
  validateUpdateUnit(unit: EvangelismUnit): void {
    if (!authService.canPerformAction('units', 'UPDATE')) {
      throw new PermissionError('Permission requise: modifier une unité');
    }
    
    if (!unit.id) {
      throw new Error('ID d\'unité manquant');
    }
  }

  /**
   * Valider avant de supprimer une unité
   */
  validateDeleteUnit(unitId: string): void {
    if (!authService.canPerformAction('units', 'DELETE')) {
      throw new PermissionError('Permission requise: supprimer une unité');
    }
    
    if (!unitId) {
      throw new Error('ID d\'unité manquant');
    }
  }

  /**
   * Valider avant d'ajouter un membre à un groupe
   */
  validateAddMember(groupId: string): void {
    if (!authService.canPerformAction('members', 'EXECUTE')) {
      throw new PermissionError('Permission requise: ajouter un membre');
    }
    
    if (!groupId) {
      throw new Error('ID du groupe manquant');
    }
  }

  /**
   * Valider avant de gérer les campagnes
   */
  validateManageCampaign(): void {
    if (!authService.canPerformAction('campaigns', 'EXECUTE')) {
      throw new PermissionError('Permission requise: gérer une campagne');
    }
  }

  /**
   * Valider l'accès à la section analyse
   */
  validateViewAnalytics(): void {
    if (!authService.canPerformAction('analytics', 'READ')) {
      throw new PermissionError('Permission requise: voir l\'analytique');
    }
  }

  /**
   * Valider l'export de données
   */
  validateExportData(): void {
    if (!authService.canPerformAction('data', 'EXECUTE')) {
      throw new PermissionError('Permission requise: exporter les données');
    }
  }

  /**
   * Valider l'accès administrateur général
   */
  validateAdminAccess(): void {
    if (!authService.isAdmin()) {
      throw new UnauthorizedError('Accès administrateur requis');
    }
  }
}

export const rbacValidator = new RBACValidator();

// ========== Wrappers pour les opérations Firebase ==========

/**
 * Wrapper pour les opérations sensibles
 * Enregistre les tentatives d'accès non autorisé
 */
export function withRBACValidation<T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  validatorFn: () => void
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      validatorFn();
      return await operation(...args);
    } catch (error) {
      if (error instanceof PermissionError || error instanceof UnauthorizedError) {
        console.error('[RBAC] Tentative d\'opération non autorisée:', error.message);
        // Le message d'erreur sera traité par le composant appelant
      }
      throw error;
    }
  };
}

/**
 * Vérifier l'accès avant d'afficher une section sensible
 */
export function checkAccess(permission: string, context?: string): boolean {
  const hasAccess = authService.hasPermission(permission);
  
  if (!hasAccess) {
    console.warn(
      `[RBAC] Accès refusé à ${context || permission}: Utilisateur n'a pas la permission requise`
    );
  }
  
  return hasAccess;
}

/**
 * Obtenir le message d'erreur approprié pour une permission refusée
 */
export function getPermissionErrorMessage(action: string): string {
  const messages: { [key: string]: string } = {
    create_announcement: 'Vous n\'avez pas les permissions pour créer une annonce',
    update_announcement: 'Vous n\'avez pas les permissions pour modifier une annonce',
    delete_announcement: 'Vous n\'avez pas les permissions pour supprimer une annonce',
    create_unit: 'Vous n\'avez pas les permissions pour créer une unité',
    update_unit: 'Vous n\'avez pas les permissions pour modifier une unité',
    delete_unit: 'Vous n\'avez pas les permissions pour supprimer une unité',
    manage_members: 'Vous n\'avez pas les permissions pour gérer les membres',
    manage_campaigns: 'Vous n\'avez pas les permissions pour gérer les campagnes',
    view_analytics: 'Vous n\'avez pas accès à l\'analytique',
    export_data: 'Vous n\'avez pas les permissions pour exporter les données',
    admin_access: 'Accès administrateur requis',
  };
  
  return messages[action] || 'Opération non autorisée';
}

export default rbacValidator;
