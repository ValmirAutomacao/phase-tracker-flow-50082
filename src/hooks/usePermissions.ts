import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ALL_PERMISSIONS } from '@/lib/permissions';

/**
 * Hook para verificar permissões do funcionário autenticado
 */
export function usePermissions() {
  const { user } = useAuth();

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ['permissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      console.log('Calling obtener_permissoes_funcionario with user_id:', user.id, typeof user.id);
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

  const effectivePermissions = (Array.isArray(permissions) && permissions.length > 0) ? permissions : (user ? ALL_PERMISSIONS.map(p => p.id) : []);

  /**
   * Verifica se o usuário tem uma permissão específica
   */
  const hasPermission = (permission: string): boolean => {
    if (!Array.isArray(effectivePermissions) || effectivePermissions.length === 0) return false;
    return effectivePermissions.includes(permission);
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
    permissions: effectivePermissions,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}

/**
 * IDs de permissões disponíveis no sistema
 * Recomendado: Use as strings literais definidas em @/lib/permissions para maior clareza
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
  
  // Financeiro
  VISUALIZAR_DASHBOARD_FINANCEIRO: 'visualizar_dashboard_financeiro',
  VISUALIZAR_DESPESAS_REQUISICAO: 'visualizar_despesas_requisicao',
  VISUALIZAR_DESPESAS_VARIAVEIS: 'visualizar_despesas_variaveis',
  VISUALIZAR_CARTOES_CREDITO: 'visualizar_cartoes_credito',
  VISUALIZAR_FORMAS_PAGAMENTO: 'visualizar_formas_pagamento',
  VISUALIZAR_CATEGORIAS_FINANCEIRO: 'visualizar_categorias_financeiro',
  
  // Compras
  VISUALIZAR_REQUISICOES: 'visualizar_requisicoes',
  CRIAR_REQUISICOES: 'criar_requisicoes',
  EDITAR_REQUISICOES: 'editar_requisicoes',
  DELETAR_REQUISICOES: 'deletar_requisicoes',
  APROVAR_REQUISICOES: 'aprovar_requisicoes',
  
  // Vídeos
  VISUALIZAR_VIDEOS: 'visualizar_videos',
  CRIAR_VIDEOS: 'criar_videos',
  EDITAR_VIDEOS: 'editar_videos',
  DELETAR_VIDEOS: 'deletar_videos',
  
  // Equipe (Granular)
  VISUALIZAR_FUNCIONARIOS: 'visualizar_funcionarios',
  VISUALIZAR_FUNCOES: 'visualizar_funcoes',
  VISUALIZAR_SETORES: 'visualizar_setores',
  GERENCIAR_PERMISSOES: 'gerenciar_permissoes',

  // Controle de Ponto (Granular)
  REGISTRAR_PONTO: 'registrar_ponto',
  VISUALIZAR_PONTO_PROPRIO: 'visualizar_ponto_proprio',
  GERENCIAR_PONTO: 'gerenciar_ponto', // Visão geral
  
  // Ajustes de Ponto
  VISUALIZAR_AJUSTES_PONTO: 'visualizar_ajustes_ponto',
  CRIAR_AJUSTES_PONTO: 'criar_ajustes_ponto',
  APROVAR_AJUSTES_PONTO: 'aprovar_ajustes_ponto',

  // Afastamentos
  VISUALIZAR_AFASTAMENTOS: 'visualizar_afastamentos',
  CRIAR_AFASTAMENTOS: 'criar_afastamentos',
  APROVAR_AFASTAMENTOS: 'aprovar_afastamentos',

  // Jornadas
  VISUALIZAR_JORNADAS: 'visualizar_jornadas',
  CRIAR_JORNADAS: 'criar_jornadas',
  EDITAR_JORNADAS: 'editar_jornadas',

  // Tipos
  VISUALIZAR_TIPOS_JUSTIFICATIVAS: 'visualizar_tipos_justificativas',
  VISUALIZAR_TIPOS_AFASTAMENTO: 'visualizar_tipos_afastamento',
  
  // Curriculos
  VISUALIZAR_CURRICULOS: 'visualizar_curriculos',
  
  // BI
  VISUALIZAR_DASHBOARD_EXECUTIVO: 'visualizar_dashboard_executivo',
} as const;
