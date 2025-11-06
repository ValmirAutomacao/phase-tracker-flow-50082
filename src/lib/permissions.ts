/**
 * Sistema centralizado de permissões
 */

export interface Permission {
  id: string;
  label: string;
  description: string;
  module: string;
}

export interface PermissionModule {
  id: string;
  label: string;
  permissions: Permission[];
}

/**
 * Todas as permissões disponíveis no sistema, organizadas por módulo
 */
export const PERMISSION_MODULES: PermissionModule[] = [
  {
    id: 'obras',
    label: 'Obras',
    permissions: [
      {
        id: 'visualizar_obras',
        label: 'Visualizar Obras',
        description: 'Permite visualizar obras e seus detalhes',
        module: 'obras'
      },
      {
        id: 'criar_obras',
        label: 'Criar Obras',
        description: 'Permite criar novas obras',
        module: 'obras'
      },
      {
        id: 'editar_obras',
        label: 'Editar Obras',
        description: 'Permite editar obras existentes',
        module: 'obras'
      },
      {
        id: 'deletar_obras',
        label: 'Deletar Obras',
        description: 'Permite remover obras do sistema',
        module: 'obras'
      }
    ]
  },
  {
    id: 'clientes',
    label: 'Clientes',
    permissions: [
      {
        id: 'visualizar_clientes',
        label: 'Visualizar Clientes',
        description: 'Permite visualizar clientes',
        module: 'clientes'
      },
      {
        id: 'criar_clientes',
        label: 'Criar Clientes',
        description: 'Permite cadastrar novos clientes',
        module: 'clientes'
      },
      {
        id: 'editar_clientes',
        label: 'Editar Clientes',
        description: 'Permite editar dados de clientes',
        module: 'clientes'
      },
      {
        id: 'deletar_clientes',
        label: 'Deletar Clientes',
        description: 'Permite remover clientes',
        module: 'clientes'
      }
    ]
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    permissions: [
      {
        id: 'visualizar_financeiro',
        label: 'Visualizar Financeiro',
        description: 'Permite visualizar despesas e relatórios financeiros',
        module: 'financeiro'
      },
      {
        id: 'criar_despesas',
        label: 'Criar Despesas',
        description: 'Permite registrar novas despesas',
        module: 'financeiro'
      },
      {
        id: 'editar_despesas',
        label: 'Editar Despesas',
        description: 'Permite editar despesas existentes',
        module: 'financeiro'
      },
      {
        id: 'deletar_despesas',
        label: 'Deletar Despesas',
        description: 'Permite remover despesas',
        module: 'financeiro'
      },
      {
        id: 'editar_financeiro',
        label: 'Editar Configurações Financeiras',
        description: 'Permite alterar configurações do módulo financeiro',
        module: 'financeiro'
      }
    ]
  },
  {
    id: 'compras',
    label: 'Compras e Requisições',
    permissions: [
      {
        id: 'visualizar_compras',
        label: 'Visualizar Requisições',
        description: 'Permite visualizar requisições de compra',
        module: 'compras'
      },
      {
        id: 'criar_compras',
        label: 'Criar Requisições',
        description: 'Permite criar novas requisições de compra',
        module: 'compras'
      },
      {
        id: 'editar_compras',
        label: 'Editar Requisições',
        description: 'Permite editar requisições existentes',
        module: 'compras'
      },
      {
        id: 'deletar_compras',
        label: 'Deletar Requisições',
        description: 'Permite remover requisições',
        module: 'compras'
      },
      {
        id: 'aprovar_compras',
        label: 'Aprovar Compras',
        description: 'Permite aprovar ou rejeitar requisições de compra',
        module: 'compras'
      }
    ]
  },
  {
    id: 'videos',
    label: 'Vídeos',
    permissions: [
      {
        id: 'visualizar_videos',
        label: 'Visualizar Vídeos',
        description: 'Permite visualizar vídeos das obras',
        module: 'videos'
      },
      {
        id: 'criar_videos',
        label: 'Criar Vídeos',
        description: 'Permite fazer upload de vídeos',
        module: 'videos'
      },
      {
        id: 'editar_videos',
        label: 'Editar Vídeos',
        description: 'Permite editar informações de vídeos',
        module: 'videos'
      },
      {
        id: 'deletar_videos',
        label: 'Deletar Vídeos',
        description: 'Permite remover vídeos',
        module: 'videos'
      }
    ]
  },
  {
    id: 'equipe',
    label: 'Gestão de Equipe',
    permissions: [
      {
        id: 'gerenciar_equipe',
        label: 'Gerenciar Equipe',
        description: 'Permite gerenciar funcionários, funções e setores',
        module: 'equipe'
      },
      {
        id: 'visualizar_equipe',
        label: 'Visualizar Equipe',
        description: 'Permite visualizar informações da equipe',
        module: 'equipe'
      }
    ]
  }
];

/**
 * Lista plana de todas as permissões
 */
export const ALL_PERMISSIONS: Permission[] = PERMISSION_MODULES.flatMap(
  module => module.permissions
);

/**
 * Obter permissão por ID
 */
export function getPermissionById(id: string): Permission | undefined {
  return ALL_PERMISSIONS.find(p => p.id === id);
}

/**
 * Obter módulo de permissão por ID
 */
export function getModuleById(id: string): PermissionModule | undefined {
  return PERMISSION_MODULES.find(m => m.id === id);
}

/**
 * Validar se uma permissão existe
 */
export function isValidPermission(id: string): boolean {
  return ALL_PERMISSIONS.some(p => p.id === id);
}
