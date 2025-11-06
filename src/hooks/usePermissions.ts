import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook para verificar permissões do funcionário autenticado
 */
export function usePermissions() {
  const { user } = useAuth();

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ['permissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .rpc('obter_permissoes_funcionario', { _user_id: user.id });

      if (error) {
        console.error('Erro ao carregar permissões:', error);
        return [];
      }

      // Converte o resultado Json do Supabase para array de strings
      if (!data) return [];
      if (Array.isArray(data)) return data as string[];
      return [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  /**
   * Verifica se o usuário tem uma permissão específica
   */
  const hasPermission = (permission: string): boolean => {
    if (!Array.isArray(permissions) || permissions.length === 0) return false;
    return permissions.includes(permission);
  };

  /**
   * Verifica se o usuário tem pelo menos uma das permissões listadas
   */
  const hasAnyPermission = (requiredPermissions: string[]): boolean => {
    return requiredPermissions.some(permission => hasPermission(permission));
  };

  /**
   * Verifica se o usuário tem todas as permissões listadas
   */
  const hasAllPermissions = (requiredPermissions: string[]): boolean => {
    return requiredPermissions.every(permission => hasPermission(permission));
  };

  return {
    permissions,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}

/**
 * IDs de permissões disponíveis no sistema
 * @deprecated Use PERMISSION_MODULES from @/lib/permissions instead
 */
export const PERMISSIONS = {
  // Obras
  VISUALIZAR_OBRAS: 'visualizar_obras',
  CRIAR_OBRAS: 'criar_obras',
  EDITAR_OBRAS: 'editar_obras',
  DELETAR_OBRAS: 'deletar_obras',
  
  // Clientes
  VISUALIZAR_CLIENTES: 'visualizar_clientes',
  CRIAR_CLIENTES: 'criar_clientes',
  EDITAR_CLIENTES: 'editar_clientes',
  DELETAR_CLIENTES: 'deletar_clientes',
  
  // Financeiro/Despesas
  VISUALIZAR_FINANCEIRO: 'visualizar_financeiro',
  CRIAR_DESPESAS: 'criar_despesas',
  EDITAR_DESPESAS: 'editar_despesas',
  DELETAR_DESPESAS: 'deletar_despesas',
  EDITAR_FINANCEIRO: 'editar_financeiro',
  
  // Compras/Requisições
  VISUALIZAR_COMPRAS: 'visualizar_compras',
  CRIAR_COMPRAS: 'criar_compras',
  EDITAR_COMPRAS: 'editar_compras',
  DELETAR_COMPRAS: 'deletar_compras',
  APROVAR_COMPRAS: 'aprovar_compras',
  
  // Vídeos
  VISUALIZAR_VIDEOS: 'visualizar_videos',
  CRIAR_VIDEOS: 'criar_videos',
  EDITAR_VIDEOS: 'editar_videos',
  DELETAR_VIDEOS: 'deletar_videos',
  
  // Equipe
  GERENCIAR_EQUIPE: 'gerenciar_equipe',
  VISUALIZAR_EQUIPE: 'visualizar_equipe',
} as const;
