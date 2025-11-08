import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';

interface PermissionGuardProps {
  /** Lista de permissões necessárias - usuário precisa ter pelo menos uma */
  permissions: string[];
  /** Se true, usuário precisa ter TODAS as permissões listadas */
  requireAll?: boolean;
  /** Componente a ser renderizado quando não há permissão */
  fallback?: React.ReactNode;
  /** Filhos a serem renderizados quando há permissão */
  children: React.ReactNode;
  /** Se true, mostra loading enquanto verifica permissões */
  showLoading?: boolean;
}

/**
 * Componente para proteger partes da interface baseado em permissões
 *
 * @example
 * ```tsx
 * <PermissionGuard permissions={['criar_obras', 'editar_obras']}>
 *   <Button>Criar Obra</Button>
 * </PermissionGuard>
 *
 * <PermissionGuard
 *   permissions={['gerenciar_equipe']}
 *   fallback={<div>Acesso negado</div>}
 * >
 *   <AdminPanel />
 * </PermissionGuard>
 * ```
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permissions,
  requireAll = false,
  fallback = null,
  children,
  showLoading = false
}) => {
  const { user } = useAuth();
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = usePermissions();

  // Se não está logado, não mostra nada
  if (!user) {
    return <>{fallback}</>;
  }

  // Mostra loading se solicitado
  if (isLoading && showLoading) {
    return <div className="animate-pulse">Verificando permissões...</div>;
  }

  // Verifica permissões
  const hasRequiredPermissions = requireAll
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);

  if (!hasRequiredPermissions) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * HOC para proteger componentes inteiros
 */
export function withPermissions<T extends object>(
  Component: React.ComponentType<T>,
  requiredPermissions: string[],
  requireAll = false,
  fallback?: React.ReactNode
) {
  return function ProtectedComponent(props: T) {
    return (
      <PermissionGuard
        permissions={requiredPermissions}
        requireAll={requireAll}
        fallback={fallback}
      >
        <Component {...props} />
      </PermissionGuard>
    );
  };
}

/**
 * Hook para verificação simples de permissão em componentes
 */
export function usePermissionCheck(permission: string): boolean {
  const { hasPermission } = usePermissions();
  return hasPermission(permission);
}