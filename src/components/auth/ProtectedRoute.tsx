import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from './RoleGuard';
import { usePermissions } from '@/hooks/usePermissions';

interface ProtectedRouteProps {
  /** Filhos a serem renderizados quando autorizado */
  children: React.ReactNode;
  /** Roles necessárias para acessar a rota */
  allowedRoles?: ('admin' | 'manager' | 'user')[];
  /** Permissões necessárias para acessar a rota */
  requiredPermissions?: string[];
  /** Se true, usuário precisa ter TODAS as permissões */
  requireAllPermissions?: boolean;
  /** Rota para redirecionar quando não autorizado */
  redirectTo?: string;
}

/**
 * Componente para proteger rotas inteiras baseado em autenticação, roles e permissões
 *
 * @example
 * ```tsx
 * <ProtectedRoute allowedRoles={['admin']}>
 *   <AdminDashboard />
 * </ProtectedRoute>
 *
 * <ProtectedRoute
 *   requiredPermissions={['gerenciar_equipe']}
 *   redirectTo="/acesso-negado"
 * >
 *   <TeamManagement />
 * </ProtectedRoute>
 * ```
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredPermissions,
  requireAllPermissions = false,
  redirectTo = '/login'
}) => {
  const { user, loading: authLoading } = useAuth();
  const { role, isLoading: roleLoading } = useRole();
  const { hasAnyPermission, hasAllPermissions, isLoading: permissionsLoading } = usePermissions();

  // Aguarda carregamento da autenticação
  if (authLoading || roleLoading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se não está logado, redireciona para login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se há restrição de roles e usuário não tem role adequada
  if (allowedRoles && (!role || !allowedRoles.includes(role as any))) {
    return <Navigate to={redirectTo} replace />;
  }

  // Se há restrição de permissões
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasPermissions = requireAllPermissions
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);

    if (!hasPermissions) {
      return <Navigate to={redirectTo} replace />;
    }
  }

  return <>{children}</>;
};

/**
 * Wrapper específico para rotas administrativas
 */
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['admin']} redirectTo="/acesso-negado">
    {children}
  </ProtectedRoute>
);

/**
 * Wrapper específico para rotas gerenciais
 */
export const ManagerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['admin', 'manager']} redirectTo="/acesso-negado">
    {children}
  </ProtectedRoute>
);

/**
 * Wrapper específico para rotas que exigem ser funcionário ativo
 */
export const EmployeeRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['admin', 'manager', 'user']} redirectTo="/acesso-negado">
    {children}
  </ProtectedRoute>
);