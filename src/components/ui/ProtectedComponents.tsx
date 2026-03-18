/**
 * Composants de Protection et d'Autorisation
 * Fournit des composants réutilisables pour contrôler l'accès basé sur les rôles
 */

import React, { ReactNode } from 'react';
import { authService } from '../../services/authService';
import { Lock, AlertCircle } from 'lucide-react';

// ========== Interface de props communes ==========

interface ProtectedProps {
  permission?: string;
  requireAdmin?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
  className?: string;
}

interface ProtectedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  permission?: string;
  requireAdmin?: boolean;
  children: ReactNode;
  showLocked?: boolean;
}

interface ReadOnlyWrapperProps {
  isReadOnly?: boolean;
  message?: string;
  children: ReactNode;
  className?: string;
}

// ========== Composant: Protected (conditionnellement rendu) ==========

/**
 * Composant qui rend son contenu uniquement si l'utilisateur a les permissions requises
 * Retourne `fallback` (ou rien) si l'utilisateur n'est pas autorisé
 */
export const Protected: React.FC<ProtectedProps> = ({
  permission,
  requireAdmin,
  fallback,
  children,
  className
}) => {
  // Vérifier les permissions
  let hasAccess = true;

  if (requireAdmin && !authService.isAdmin()) {
    hasAccess = false;
  }

  if (permission && !authService.hasPermission(permission)) {
    hasAccess = false;
  }

  if (!hasAccess) {
    return fallback ? <div className={className}>{fallback}</div> : null;
  }

  return <div className={className}>{children}</div>;
};

// ========== Composant: ProtectedButton (bouton avec contrôle de permissions) ==========

/**
 * Bouton qui se désactive automatiquement si l'utilisateur n'a pas les permissions requises
 */
export const ProtectedButton: React.FC<ProtectedButtonProps> = ({
  permission,
  requireAdmin,
  showLocked = true,
  children,
  disabled,
  title,
  ...props
}) => {
  let hasAccess = true;
  let lockReason = '';

  if (requireAdmin && !authService.isAdmin()) {
    hasAccess = false;
    lockReason = 'Accès administrateur requis';
  }

  if (permission && !authService.hasPermission(permission)) {
    hasAccess = false;
    lockReason = `Permission requise: ${permission}`;
  }

  const isDisabled = disabled || !hasAccess;

  return (
    <>
      <button
        disabled={isDisabled}
        title={!hasAccess ? lockReason : title}
        className={`
          relative
          ${isDisabled
            ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400'
            : 'hover:shadow-lg transition-all'
          }
        `}
        {...props}
      >
        {children}
        {showLocked && !hasAccess && (
          <Lock size={14} className="absolute -top-1 -right-1 text-red-500" />
        )}
      </button>
    </>
  );
};

// ========== Composant: ReadOnlyWrapper (affichage lecture-seule avec feedback) ==========

/**
 * Wrapper qui affiche une section en lecture-seule avec feedback visuel
 */
export const ReadOnlyWrapper: React.FC<ReadOnlyWrapperProps> = ({
  isReadOnly = false,
  message = 'Section en lecture-seule. Contactez un administrateur pour modifier.',
  children,
  className = ''
}) => {
  if (!isReadOnly) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Overlay semi-transparent */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-50/30 to-transparent pointer-events-none rounded-lg border-2 border-dashed border-amber-300 z-10"></div>

      {/* Contenu grisé */}
      <div className="opacity-70">
        {children}
      </div>

      {/* Badge de lecture-seule */}
      <div className="absolute top-3 right-3 flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium border border-amber-300 z-20">
        <AlertCircle size={16} />
        <span>Lecture-seule</span>
      </div>

      {/* Message informatif */}
      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm flex items-start gap-2">
        <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
        <span>{message}</span>
      </div>
    </div>
  );
};

// ========== Composant: AdminGate (porte d'accès admin) ==========

/**
 * Composant qui affiche le contenu admin uniquement aux administrateurs
 * Affiche un message si l'utilisateur n'est pas admin
 */
export const AdminGate: React.FC<Omit<ProtectedProps, 'permission'>> = ({
  requireAdmin = true,
  fallback = (
    <div className="p-6 bg-red-50 border-2 border-red-300 rounded-2xl text-center">
      <Lock className="w-8 h-8 text-red-500 mx-auto mb-3" />
      <h3 className="text-red-900 font-bold mb-1">Accès refusé</h3>
      <p className="text-red-700 text-sm">Vous devez être administrateur pour accéder à cette section.</p>
    </div>
  ),
  children,
  className
}) => {
  return (
    <Protected
      requireAdmin={requireAdmin}
      fallback={fallback}
      className={className}
    >
      {children}
    </Protected>
  );
};

// ========== Composant: PermissionGate (porte d'accès par permission) ==========

/**
 * Composant qui affiche le contenu uniquement si l'utilisateur a la permission requise
 */
export const PermissionGate: React.FC<ProtectedProps> = ({
  permission = 'read_unit',
  fallback = (
    <div className="p-6 bg-blue-50 border-2 border-blue-300 rounded-2xl text-center">
      <Lock className="w-8 h-8 text-blue-500 mx-auto mb-3" />
      <h3 className="text-blue-900 font-bold mb-1">Permission requise</h3>
      <p className="text-blue-700 text-sm">Vous n'avez pas accès à cette ressource.</p>
    </div>
  ),
  children,
  className
}) => {
  return (
    <Protected
      permission={permission}
      fallback={fallback}
      className={className}
    >
      {children}
    </Protected>
  );
};

// ========== Composant: ProtectedRoute (protection de route) ==========

interface ProtectedRouteProps {
  isAllowed: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Composant qui protège une route d'accès
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  isAllowed,
  fallback = (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Accès refusé</h1>
        <p className="text-slate-400">Vous n'avez pas les permissions requises.</p>
      </div>
    </div>
  ),
  children
}) => {
  return isAllowed ? <>{children}</> : <>{fallback}</>;
};

// ========== Hooks utilitaires ==========

/**
 * Hook pour vérifier les permissions dans les composants
 */
export const useAuth = () => {
  const [permissions, setPermissions] = React.useState(authService.getCurrentPermissions());
  const [isAdmin, setIsAdmin] = React.useState(authService.isAdmin());

  React.useEffect(() => {
    // Mettre à jour l'état si authentification change
    setPermissions(authService.getCurrentPermissions());
    setIsAdmin(authService.isAdmin());
  }, []);

  return {
    permissions,
    isAdmin,
    hasPermission: (permissionId: string) => authService.hasPermission(permissionId),
    canPerformAction: (resource: string, action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXECUTE') =>
      authService.canPerformAction(resource, action),
  };
};

export default Protected;
