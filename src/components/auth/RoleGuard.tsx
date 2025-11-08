import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RoleGuardProps {
  /** Roles permitidas */
  allowedRoles: ('admin' | 'manager' | 'user')[];
  /** Componente de fallback quando não autorizado */
  fallback?: React.ReactNode;
  /** Filhos a serem renderizados quando autorizado */
  children: React.ReactNode;
  /** Se true, mostra loading enquanto verifica role */
  showLoading?: boolean;
}

/**
 * Componente para proteger partes da interface baseado em roles de usuário
 *
 * @example
 * ```tsx
 * <RoleGuard allowedRoles={['admin', 'manager']}>
 *   <AdminButton />
 * </RoleGuard>
 *
 * <RoleGuard
 *   allowedRoles={['admin']}
 *   fallback={<div>Apenas administradores</div>}
 * >
 *   <SuperAdminPanel />
 * </RoleGuard>
 * ```
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  fallback = null,
  children,
  showLoading = false
}) => {
  const { user } = useAuth();

  const { data: userRole, isLoading } = useQuery({
    queryKey: ['userRole', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Erro ao carregar role do usuário:', error);
        return null;
      }

      return data?.role || null;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  // Se não está logado, não mostra nada
  if (!user) {
    return <>{fallback}</>;
  }

  // Mostra loading se solicitado
  if (isLoading && showLoading) {
    return <div className="animate-pulse">Verificando acesso...</div>;
  }

  // Verifica se tem role permitida
  if (!userRole || !allowedRoles.includes(userRole as any)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * HOC para proteger componentes inteiros por role
 */
export function withRoles<T extends object>(
  Component: React.ComponentType<T>,
  allowedRoles: ('admin' | 'manager' | 'user')[],
  fallback?: React.ReactNode
) {
  return function ProtectedComponent(props: T) {
    return (
      <RoleGuard allowedRoles={allowedRoles} fallback={fallback}>
        <Component {...props} />
      </RoleGuard>
    );
  };
}

/**
 * Hook para verificação simples de role
 */
export function useRole(): { role: string | null; isLoading: boolean; isAdmin: boolean; isManager: boolean } {
  const { user } = useAuth();

  const { data: userRole, isLoading } = useQuery({
    queryKey: ['userRole', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      return error ? null : data?.role || null;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  return {
    role: userRole,
    isLoading,
    isAdmin: userRole === 'admin',
    isManager: userRole === 'manager' || userRole === 'admin'
  };
}