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
      // Gestão de Obras
      {
        id: 'visualizar_obras',
        label: 'Visualizar Obras',
        description: 'Ver lista e detalhes das obras registradas',
        module: 'obras'
      },
      {
        id: 'criar_obras',
        label: 'Criar Obras',
        description: 'Criar novas obras no sistema',
        module: 'obras'
      },
      {
        id: 'editar_obras',
        label: 'Editar Obras',
        description: 'Editar dados das obras existentes',
        module: 'obras'
      },
      {
        id: 'deletar_obras',
        label: 'Deletar Obras',
        description: 'Remover obras do sistema',
        module: 'obras'
      },

      // Etapas de Obras
      {
        id: 'visualizar_etapas_obras',
        label: 'Visualizar Etapas',
        description: 'Ver etapas das obras e seu progresso',
        module: 'obras'
      },
      {
        id: 'criar_etapas_obras',
        label: 'Criar Etapas',
        description: 'Criar novas etapas para obras',
        module: 'obras'
      },
      {
        id: 'editar_etapas_obras',
        label: 'Editar Etapas',
        description: 'Editar etapas das obras',
        module: 'obras'
      },
      {
        id: 'deletar_etapas_obras',
        label: 'Deletar Etapas',
        description: 'Remover etapas das obras',
        module: 'obras'
      },
      {
        id: 'alterar_progresso_obras',
        label: 'Alterar Progresso',
        description: 'Atualizar percentual de progresso das etapas',
        module: 'obras'
      },

      // Orçamentos e Contratos
      {
        id: 'visualizar_orcamentos_obras',
        label: 'Visualizar Orçamentos',
        description: 'Ver orçamentos das obras',
        module: 'obras'
      },
      {
        id: 'criar_orcamentos_obras',
        label: 'Criar Orçamentos',
        description: 'Criar orçamentos para obras',
        module: 'obras'
      },
      {
        id: 'editar_orcamentos_obras',
        label: 'Editar Orçamentos',
        description: 'Editar orçamentos das obras',
        module: 'obras'
      },
      {
        id: 'aprovar_orcamentos_obras',
        label: 'Aprovar Orçamentos',
        description: 'Aprovar ou rejeitar orçamentos',
        module: 'obras'
      },

      // Relatórios de Obras
      {
        id: 'visualizar_relatorios_obras',
        label: 'Visualizar Relatórios Obras',
        description: 'Acessar relatórios do módulo de obras',
        module: 'obras'
      },
      {
        id: 'exportar_relatorios_obras',
        label: 'Exportar Relatórios Obras',
        description: 'Exportar relatórios de obras',
        module: 'obras'
      }
    ]
  },
  {
    id: 'clientes',
    label: 'Clientes',
    permissions: [
      // Cadastro de Clientes
      {
        id: 'visualizar_clientes',
        label: 'Visualizar Clientes',
        description: 'Ver lista e detalhes dos clientes',
        module: 'clientes'
      },
      {
        id: 'criar_clientes',
        label: 'Criar Clientes',
        description: 'Cadastrar novos clientes',
        module: 'clientes'
      },
      {
        id: 'editar_clientes',
        label: 'Editar Clientes',
        description: 'Editar dados dos clientes',
        module: 'clientes'
      },
      {
        id: 'deletar_clientes',
        label: 'Deletar Clientes',
        description: 'Remover clientes do sistema',
        module: 'clientes'
      },

      // Contatos de Clientes
      {
        id: 'visualizar_contatos_clientes',
        label: 'Visualizar Contatos',
        description: 'Ver contatos dos clientes',
        module: 'clientes'
      },
      {
        id: 'criar_contatos_clientes',
        label: 'Criar Contatos',
        description: 'Adicionar contatos aos clientes',
        module: 'clientes'
      },
      {
        id: 'editar_contatos_clientes',
        label: 'Editar Contatos',
        description: 'Editar contatos dos clientes',
        module: 'clientes'
      },
      {
        id: 'deletar_contatos_clientes',
        label: 'Deletar Contatos',
        description: 'Remover contatos dos clientes',
        module: 'clientes'
      },

      // Endereços de Clientes
      {
        id: 'visualizar_enderecos_clientes',
        label: 'Visualizar Endereços',
        description: 'Ver endereços dos clientes',
        module: 'clientes'
      },
      {
        id: 'criar_enderecos_clientes',
        label: 'Criar Endereços',
        description: 'Adicionar endereços aos clientes',
        module: 'clientes'
      },
      {
        id: 'editar_enderecos_clientes',
        label: 'Editar Endereços',
        description: 'Editar endereços dos clientes',
        module: 'clientes'
      },
      {
        id: 'deletar_enderecos_clientes',
        label: 'Deletar Endereços',
        description: 'Remover endereços dos clientes',
        module: 'clientes'
      },

      // Relatórios de Clientes
      {
        id: 'visualizar_relatorios_clientes',
        label: 'Visualizar Relatórios Clientes',
        description: 'Acessar relatórios do módulo de clientes',
        module: 'clientes'
      },
      {
        id: 'exportar_relatorios_clientes',
        label: 'Exportar Relatórios Clientes',
        description: 'Exportar relatórios de clientes',
        module: 'clientes'
      }
    ]
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    permissions: [
      // Dashboard Financeiro
      {
        id: 'visualizar_dashboard_financeiro',
        label: 'Visualizar Dashboard Financeiro',
        description: 'Acesso ao dashboard principal do módulo financeiro',
        module: 'financeiro'
      },
      {
        id: 'criar_dashboard_financeiro',
        label: 'Criar Relatórios Dashboard',
        description: 'Criar novos relatórios no dashboard financeiro',
        module: 'financeiro'
      },
      {
        id: 'editar_dashboard_financeiro',
        label: 'Editar Dashboard Financeiro',
        description: 'Editar configurações do dashboard financeiro',
        module: 'financeiro'
      },

      // Despesas por Requisição
      {
        id: 'visualizar_despesas_requisicao',
        label: 'Visualizar Despesas por Requisição',
        description: 'Ver despesas vinculadas às requisições',
        module: 'financeiro'
      },
      {
        id: 'criar_despesas_requisicao',
        label: 'Criar Despesas por Requisição',
        description: 'Registrar despesas vinculadas a requisições',
        module: 'financeiro'
      },
      {
        id: 'editar_despesas_requisicao',
        label: 'Editar Despesas por Requisição',
        description: 'Editar despesas vinculadas a requisições',
        module: 'financeiro'
      },
      {
        id: 'deletar_despesas_requisicao',
        label: 'Deletar Despesas por Requisição',
        description: 'Remover despesas vinculadas a requisições',
        module: 'financeiro'
      },
      {
        id: 'aprovar_despesas_requisicao',
        label: 'Aprovar Despesas por Requisição',
        description: 'Aprovar ou rejeitar despesas de requisições',
        module: 'financeiro'
      },

      // Despesas Variáveis
      {
        id: 'visualizar_despesas_variaveis',
        label: 'Visualizar Despesas Variáveis',
        description: 'Ver despesas variáveis e comprovantes',
        module: 'financeiro'
      },
      {
        id: 'criar_despesas_variaveis',
        label: 'Criar Despesas Variáveis',
        description: 'Registrar novas despesas variáveis',
        module: 'financeiro'
      },
      {
        id: 'editar_despesas_variaveis',
        label: 'Editar Despesas Variáveis',
        description: 'Editar despesas variáveis existentes',
        module: 'financeiro'
      },
      {
        id: 'deletar_despesas_variaveis',
        label: 'Deletar Despesas Variáveis',
        description: 'Remover despesas variáveis',
        module: 'financeiro'
      },
      {
        id: 'aprovar_despesas_variaveis',
        label: 'Aprovar Despesas Variáveis',
        description: 'Aprovar ou rejeitar despesas variáveis',
        module: 'financeiro'
      },
      {
        id: 'processar_ocr_despesas',
        label: 'Processar OCR Despesas',
        description: 'Processar comprovantes via OCR',
        module: 'financeiro'
      },

      // Cartões de Crédito
      {
        id: 'visualizar_cartoes_credito',
        label: 'Visualizar Cartões de Crédito',
        description: 'Ver cartões de crédito cadastrados',
        module: 'financeiro'
      },
      {
        id: 'criar_cartoes_credito',
        label: 'Criar Cartões de Crédito',
        description: 'Cadastrar novos cartões de crédito',
        module: 'financeiro'
      },
      {
        id: 'editar_cartoes_credito',
        label: 'Editar Cartões de Crédito',
        description: 'Editar cartões de crédito existentes',
        module: 'financeiro'
      },
      {
        id: 'deletar_cartoes_credito',
        label: 'Deletar Cartões de Crédito',
        description: 'Remover cartões de crédito',
        module: 'financeiro'
      },

      // Formas de Pagamento
      {
        id: 'visualizar_formas_pagamento',
        label: 'Visualizar Formas de Pagamento',
        description: 'Ver formas de pagamento disponíveis',
        module: 'financeiro'
      },
      {
        id: 'criar_formas_pagamento',
        label: 'Criar Formas de Pagamento',
        description: 'Cadastrar novas formas de pagamento',
        module: 'financeiro'
      },
      {
        id: 'editar_formas_pagamento',
        label: 'Editar Formas de Pagamento',
        description: 'Editar formas de pagamento existentes',
        module: 'financeiro'
      },
      {
        id: 'deletar_formas_pagamento',
        label: 'Deletar Formas de Pagamento',
        description: 'Remover formas de pagamento',
        module: 'financeiro'
      },

      // Categorias Financeiras
      {
        id: 'visualizar_categorias_financeiro',
        label: 'Visualizar Categorias Financeiro',
        description: 'Ver categorias do módulo financeiro',
        module: 'financeiro'
      },
      {
        id: 'criar_categorias_financeiro',
        label: 'Criar Categorias Financeiro',
        description: 'Criar categorias financeiras',
        module: 'financeiro'
      },
      {
        id: 'editar_categorias_financeiro',
        label: 'Editar Categorias Financeiro',
        description: 'Editar categorias financeiras',
        module: 'financeiro'
      },
      {
        id: 'deletar_categorias_financeiro',
        label: 'Deletar Categorias Financeiro',
        description: 'Remover categorias financeiras',
        module: 'financeiro'
      }
    ]
  },
  {
    id: 'compras',
    label: 'Compras e Requisições',
    permissions: [
      // Requisições de Compra
      {
        id: 'visualizar_requisicoes',
        label: 'Visualizar Requisições',
        description: 'Ver requisições de compra registradas',
        module: 'compras'
      },
      {
        id: 'criar_requisicoes',
        label: 'Criar Requisições',
        description: 'Criar novas requisições de compra',
        module: 'compras'
      },
      {
        id: 'editar_requisicoes',
        label: 'Editar Requisições',
        description: 'Editar requisições existentes',
        module: 'compras'
      },
      {
        id: 'deletar_requisicoes',
        label: 'Deletar Requisições',
        description: 'Remover requisições de compra',
        module: 'compras'
      },
      {
        id: 'aprovar_requisicoes',
        label: 'Aprovar Requisições',
        description: 'Aprovar ou rejeitar requisições de compra',
        module: 'compras'
      },

      // Itens de Requisição
      {
        id: 'visualizar_itens_requisicao',
        label: 'Visualizar Itens de Requisição',
        description: 'Ver itens das requisições de compra',
        module: 'compras'
      },
      {
        id: 'criar_itens_requisicao',
        label: 'Criar Itens de Requisição',
        description: 'Adicionar itens às requisições',
        module: 'compras'
      },
      {
        id: 'editar_itens_requisicao',
        label: 'Editar Itens de Requisição',
        description: 'Editar itens das requisições',
        module: 'compras'
      },
      {
        id: 'deletar_itens_requisicao',
        label: 'Deletar Itens de Requisição',
        description: 'Remover itens das requisições',
        module: 'compras'
      },

      // Relatórios de Compras
      {
        id: 'visualizar_relatorios_compras',
        label: 'Visualizar Relatórios de Compras',
        description: 'Acessar relatórios do módulo de compras',
        module: 'compras'
      },
      {
        id: 'exportar_relatorios_compras',
        label: 'Exportar Relatórios de Compras',
        description: 'Exportar relatórios de compras',
        module: 'compras'
      }
    ]
  },
  {
    id: 'videos',
    label: 'Vídeos',
    permissions: [
      // Gerenciamento de Vídeos
      {
        id: 'visualizar_videos',
        label: 'Visualizar Vídeos',
        description: 'Ver lista e detalhes dos vídeos das obras',
        module: 'videos'
      },
      {
        id: 'criar_videos',
        label: 'Fazer Upload de Vídeos',
        description: 'Fazer upload de novos vídeos',
        module: 'videos'
      },
      {
        id: 'editar_videos',
        label: 'Editar Vídeos',
        description: 'Editar informações e metadados dos vídeos',
        module: 'videos'
      },
      {
        id: 'deletar_videos',
        label: 'Deletar Vídeos',
        description: 'Remover vídeos do sistema',
        module: 'videos'
      },

      // Renderização e Processamento
      {
        id: 'visualizar_status_renderizacao',
        label: 'Visualizar Status Renderização',
        description: 'Ver status do processamento dos vídeos',
        module: 'videos'
      },
      {
        id: 'iniciar_renderizacao',
        label: 'Iniciar Renderização',
        description: 'Iniciar processo de renderização de vídeos',
        module: 'videos'
      },
      {
        id: 'cancelar_renderizacao',
        label: 'Cancelar Renderização',
        description: 'Cancelar processo de renderização em andamento',
        module: 'videos'
      },

      // Organização e Categorização
      {
        id: 'organizar_videos_obras',
        label: 'Organizar Vídeos por Obra',
        description: 'Organizar e categorizar vídeos por obra',
        module: 'videos'
      },
      {
        id: 'gerenciar_categorias_videos',
        label: 'Gerenciar Categorias',
        description: 'Criar e gerenciar categorias de vídeos',
        module: 'videos'
      },

      // Compartilhamento e Links
      {
        id: 'gerar_links_videos',
        label: 'Gerar Links de Compartilhamento',
        description: 'Gerar links para compartilhar vídeos',
        module: 'videos'
      },
      {
        id: 'gerenciar_permissoes_videos',
        label: 'Gerenciar Permissões de Acesso',
        description: 'Definir qui pode acessar cada vídeo',
        module: 'videos'
      },

      // Relatórios de Vídeos
      {
        id: 'visualizar_relatorios_videos',
        label: 'Visualizar Relatórios Vídeos',
        description: 'Acessar relatórios do módulo de vídeos',
        module: 'videos'
      },
      {
        id: 'exportar_relatorios_videos',
        label: 'Exportar Relatórios Vídeos',
        description: 'Exportar relatórios de vídeos',
        module: 'videos'
      }
    ]
  },
  {
    id: 'equipe',
    label: 'Gestão de Equipe',
    permissions: [
      // Funcionários
      {
        id: 'visualizar_funcionarios',
        label: 'Visualizar Funcionários',
        description: 'Ver lista e detalhes dos funcionários',
        module: 'equipe'
      },
      {
        id: 'criar_funcionarios',
        label: 'Criar Funcionários',
        description: 'Cadastrar novos funcionários',
        module: 'equipe'
      },
      {
        id: 'editar_funcionarios',
        label: 'Editar Funcionários',
        description: 'Editar dados dos funcionários',
        module: 'equipe'
      },
      {
        id: 'deletar_funcionarios',
        label: 'Deletar Funcionários',
        description: 'Remover funcionários do sistema',
        module: 'equipe'
      },
      {
        id: 'ativar_desativar_funcionarios',
        label: 'Ativar/Desativar Funcionários',
        description: 'Ativar ou desativar funcionários',
        module: 'equipe'
      },

      // Funções
      {
        id: 'visualizar_funcoes',
        label: 'Visualizar Funções',
        description: 'Ver lista de funções e cargos',
        module: 'equipe'
      },
      {
        id: 'criar_funcoes',
        label: 'Criar Funções',
        description: 'Criar novas funções e cargos',
        module: 'equipe'
      },
      {
        id: 'editar_funcoes',
        label: 'Editar Funções',
        description: 'Editar funções existentes',
        module: 'equipe'
      },
      {
        id: 'deletar_funcoes',
        label: 'Deletar Funções',
        description: 'Remover funções do sistema',
        module: 'equipe'
      },

      // Setores
      {
        id: 'visualizar_setores',
        label: 'Visualizar Setores',
        description: 'Ver lista de setores da empresa',
        module: 'equipe'
      },
      {
        id: 'criar_setores',
        label: 'Criar Setores',
        description: 'Criar novos setores',
        module: 'equipe'
      },
      {
        id: 'editar_setores',
        label: 'Editar Setores',
        description: 'Editar setores existentes',
        module: 'equipe'
      },
      {
        id: 'deletar_setores',
        label: 'Deletar Setores',
        description: 'Remover setores do sistema',
        module: 'equipe'
      },

      // Permissões
      {
        id: 'gerenciar_permissoes',
        label: 'Gerenciar Permissões',
        description: 'Gerenciar permissões dos funcionários',
        module: 'equipe'
      },
      {
        id: 'visualizar_permissoes',
        label: 'Visualizar Permissões',
        description: 'Ver permissões dos funcionários',
        module: 'equipe'
      },

      // Relatórios de Equipe
      {
        id: 'visualizar_relatorios_equipe',
        label: 'Visualizar Relatórios Equipe',
        description: 'Acessar relatórios do módulo de equipe',
        module: 'equipe'
      },
      {
        id: 'exportar_relatorios_equipe',
        label: 'Exportar Relatórios Equipe',
        description: 'Exportar relatórios de equipe',
        module: 'equipe'
      }
    ]
  },
  {
    id: 'ponto',
    label: 'Controle de Ponto',
    permissions: [
      // Registro de Ponto (Funcionário)
      {
        id: 'registrar_ponto',
        label: 'Registrar Ponto',
        description: 'Permite registrar entrada/saída no controle de ponto',
        module: 'ponto'
      },
      {
        id: 'visualizar_ponto_proprio',
        label: 'Visualizar Próprio Ponto',
        description: 'Permite visualizar próprios registros de ponto',
        module: 'ponto'
      },
      {
        id: 'solicitar_ajuste_proprio',
        label: 'Solicitar Ajuste Próprio',
        description: 'Permite solicitar ajuste no próprio ponto',
        module: 'ponto'
      },

      // Gestão de Ponto (RH/Gestor)
      {
        id: 'gerenciar_ponto',
        label: 'Gerenciar Controle de Ponto',
        description: 'Permite visualizar e gerenciar registros de todos os funcionários',
        module: 'ponto'
      },
      {
        id: 'visualizar_ajustes_ponto',
        label: 'Visualizar Ajustes de Ponto',
        description: 'Ver histórico de ajustes de ponto',
        module: 'ponto'
      },
      {
        id: 'criar_ajustes_ponto',
        label: 'Criar Ajustes de Ponto',
        description: 'Criar ajustes de ponto manualmente',
        module: 'ponto'
      },
      {
        id: 'editar_ajustes_ponto',
        label: 'Editar Ajustes de Ponto',
        description: 'Editar ajustes de ponto existentes',
        module: 'ponto'
      },
      {
        id: 'deletar_ajustes_ponto',
        label: 'Deletar Ajustes de Ponto',
        description: 'Remover ajustes de ponto',
        module: 'ponto'
      },
      {
        id: 'aprovar_ajustes_ponto',
        label: 'Aprovar Ajustes de Ponto',
        description: 'Aprovar ou rejeitar solicitações de ajuste',
        module: 'ponto'
      },

      // Gestão de Afastamentos
      {
        id: 'visualizar_afastamentos',
        label: 'Visualizar Afastamentos',
        description: 'Ver lista de afastamentos',
        module: 'ponto'
      },
      {
        id: 'criar_afastamentos',
        label: 'Criar Afastamentos',
        description: 'Registrar novos afastamentos',
        module: 'ponto'
      },
      {
        id: 'editar_afastamentos',
        label: 'Editar Afastamentos',
        description: 'Editar afastamentos existentes',
        module: 'ponto'
      },
      {
        id: 'deletar_afastamentos',
        label: 'Deletar Afastamentos',
        description: 'Remover afastamentos do sistema',
        module: 'ponto'
      },
      {
        id: 'aprovar_afastamentos',
        label: 'Aprovar Afastamentos',
        description: 'Aprovar ou rejeitar solicitações de afastamento',
        module: 'ponto'
      },

      // Configuração de Jornadas
      {
        id: 'visualizar_jornadas',
        label: 'Visualizar Jornadas',
        description: 'Ver jornadas de trabalho cadastradas',
        module: 'ponto'
      },
      {
        id: 'criar_jornadas',
        label: 'Criar Jornadas',
        description: 'Criar novas jornadas de trabalho',
        module: 'ponto'
      },
      {
        id: 'editar_jornadas',
        label: 'Editar Jornadas',
        description: 'Editar jornadas de trabalho',
        module: 'ponto'
      },
      {
        id: 'deletar_jornadas',
        label: 'Deletar Jornadas',
        description: 'Remover jornadas de trabalho',
        module: 'ponto'
      },

      // Configuração de Tipos de Justificativa
      {
        id: 'visualizar_tipos_justificativas',
        label: 'Visualizar Tipos Justificativa',
        description: 'Ver tipos de justificativa cadastrados',
        module: 'ponto'
      },
      {
        id: 'criar_tipos_justificativas',
        label: 'Criar Tipos Justificativa',
        description: 'Cadastrar novos tipos de justificativa',
        module: 'ponto'
      },
      {
        id: 'editar_tipos_justificativas',
        label: 'Editar Tipos Justificativa',
        description: 'Editar tipos de justificativa',
        module: 'ponto'
      },
      {
        id: 'deletar_tipos_justificativas',
        label: 'Deletar Tipos Justificativa',
        description: 'Remover tipos de justificativa',
        module: 'ponto'
      },

      // Configuração de Tipos de Afastamento
      {
        id: 'visualizar_tipos_afastamento',
        label: 'Visualizar Tipos Afastamento',
        description: 'Ver tipos de afastamento cadastrados',
        module: 'ponto'
      },
      {
        id: 'criar_tipos_afastamento',
        label: 'Criar Tipos Afastamento',
        description: 'Cadastrar novos tipos de afastamento',
        module: 'ponto'
      },
      {
        id: 'editar_tipos_afastamento',
        label: 'Editar Tipos Afastamento',
        description: 'Editar tipos de afastamento',
        module: 'ponto'
      },
      {
        id: 'deletar_tipos_afastamento',
        label: 'Deletar Tipos Afastamento',
        description: 'Remover tipos de afastamento',
        module: 'ponto'
      },

      // Relatórios e Auditoria
      {
        id: 'visualizar_auditoria_ponto',
        label: 'Visualizar Auditoria Ponto',
        description: 'Permite ver histórico completo de auditoria de ponto',
        module: 'ponto'
      },
      {
        id: 'gerar_relatorios_rh',
        label: 'Gerar Relatórios RH',
        description: 'Permite gerar relatórios de recursos humanos',
        module: 'ponto'
      }
    ]
  },
  {
    id: 'kanban',
    label: 'CRM Kanban',
    permissions: [
      // Visualização de Kanban
      {
        id: 'visualizar_kanban',
        label: 'Visualizar Kanban',
        description: 'Ver quadro CRM Kanban e seus cards',
        module: 'kanban'
      },
      {
        id: 'visualizar_kanban_todos',
        label: 'Visualizar Todos os Cards',
        description: 'Ver cards de todos os vendedores',
        module: 'kanban'
      },
      {
        id: 'visualizar_kanban_proprio',
        label: 'Visualizar Próprios Cards',
        description: 'Ver apenas seus próprios cards',
        module: 'kanban'
      },

      // Gestão de Cards
      {
        id: 'criar_cards_kanban',
        label: 'Criar Cards Kanban',
        description: 'Criar novos cards/leads no Kanban',
        module: 'kanban'
      },
      {
        id: 'editar_cards_kanban',
        label: 'Editar Cards Kanban',
        description: 'Editar cards existentes no Kanban',
        module: 'kanban'
      },
      {
        id: 'deletar_cards_kanban',
        label: 'Deletar Cards Kanban',
        description: 'Remover cards do Kanban',
        module: 'kanban'
      },
      {
        id: 'mover_cards_kanban',
        label: 'Mover Cards entre Fases',
        description: 'Arrastar cards entre diferentes fases',
        module: 'kanban'
      },

      // Gestão de Fases
      {
        id: 'visualizar_fases_kanban',
        label: 'Visualizar Fases Kanban',
        description: 'Ver fases/colunas do Kanban',
        module: 'kanban'
      },
      {
        id: 'criar_fases_kanban',
        label: 'Criar Fases Kanban',
        description: 'Criar novas fases no Kanban',
        module: 'kanban'
      },
      {
        id: 'editar_fases_kanban',
        label: 'Editar Fases Kanban',
        description: 'Editar fases existentes',
        module: 'kanban'
      },
      {
        id: 'deletar_fases_kanban',
        label: 'Deletar Fases Kanban',
        description: 'Remover fases do Kanban',
        module: 'kanban'
      },
      {
        id: 'reordenar_fases_kanban',
        label: 'Reordenar Fases Kanban',
        description: 'Alterar ordem das fases',
        module: 'kanban'
      },

      // Relatórios e Análises
      {
        id: 'visualizar_relatorios_kanban',
        label: 'Visualizar Relatórios Kanban',
        description: 'Acessar relatórios do CRM Kanban',
        module: 'kanban'
      },
      {
        id: 'exportar_relatorios_kanban',
        label: 'Exportar Relatórios Kanban',
        description: 'Exportar relatórios de vendas',
        module: 'kanban'
      },
      {
        id: 'visualizar_funil_vendas',
        label: 'Visualizar Funil de Vendas',
        description: 'Ver métricas do funil de vendas',
        module: 'kanban'
      }
    ]
  },
  {
    id: 'curriculos',
    label: 'Trabalhe Conosco',
    permissions: [
      // Visualização de Currículos
      {
        id: 'visualizar_curriculos',
        label: 'Visualizar Currículos',
        description: 'Ver lista de currículos recebidos',
        module: 'curriculos'
      },
      {
        id: 'visualizar_detalhes_curriculos',
        label: 'Visualizar Detalhes Currículos',
        description: 'Ver detalhes completos dos currículos',
        module: 'curriculos'
      },
      {
        id: 'baixar_curriculos',
        label: 'Baixar Currículos',
        description: 'Fazer download dos arquivos de currículo',
        module: 'curriculos'
      },

      // Gestão de Currículos
      {
        id: 'aprovar_curriculos',
        label: 'Aprovar Currículos',
        description: 'Aprovar currículos para próximas etapas',
        module: 'curriculos'
      },
      {
        id: 'rejeitar_curriculos',
        label: 'Rejeitar Currículos',
        description: 'Rejeitar currículos com justificativas',
        module: 'curriculos'
      },
      {
        id: 'arquivar_curriculos',
        label: 'Arquivar Currículos',
        description: 'Arquivar currículos para referência futura',
        module: 'curriculos'
      },
      {
        id: 'deletar_curriculos',
        label: 'Deletar Currículos',
        description: 'Remover currículos do sistema',
        module: 'curriculos'
      },

      // Processo Seletivo
      {
        id: 'criar_processos_seletivos',
        label: 'Criar Processos Seletivos',
        description: 'Criar novos processos seletivos',
        module: 'curriculos'
      },
      {
        id: 'gerenciar_etapas_selecao',
        label: 'Gerenciar Etapas Seleção',
        description: 'Gerenciar etapas do processo seletivo',
        module: 'curriculos'
      },
      {
        id: 'agendar_entrevistas',
        label: 'Agendar Entrevistas',
        description: 'Agendar entrevistas com candidatos',
        module: 'curriculos'
      },

      // Comunicação
      {
        id: 'enviar_emails_candidatos',
        label: 'Enviar E-mails Candidatos',
        description: 'Enviar e-mails para candidatos',
        module: 'curriculos'
      },
      {
        id: 'criar_templates_email',
        label: 'Criar Templates E-mail',
        description: 'Criar templates de e-mail padronizados',
        module: 'curriculos'
      },

      // Relatórios
      {
        id: 'visualizar_relatorios_rh',
        label: 'Visualizar Relatórios RH',
        description: 'Acessar relatórios de recrutamento',
        module: 'curriculos'
      },
      {
        id: 'exportar_relatorios_rh',
        label: 'Exportar Relatórios RH',
        description: 'Exportar relatórios de RH',
        module: 'curriculos'
      }
    ]
  },
  {
    id: 'bi',
    label: 'Business Intelligence',
    permissions: [
      // Dashboards Executivos
      {
        id: 'visualizar_dashboard_executivo',
        label: 'Visualizar Dashboard Executivo',
        description: 'Acessar dashboard executivo principal',
        module: 'bi'
      },
      {
        id: 'visualizar_dashboard_financeiro_bi',
        label: 'Visualizar Dashboard Financeiro BI',
        description: 'Ver dashboard de análises financeiras',
        module: 'bi'
      },
      {
        id: 'visualizar_dashboard_obras_bi',
        label: 'Visualizar Dashboard Obras BI',
        description: 'Ver dashboard de performance das obras',
        module: 'bi'
      },
      {
        id: 'visualizar_dashboard_vendas_bi',
        label: 'Visualizar Dashboard Vendas BI',
        description: 'Ver dashboard de vendas e CRM',
        module: 'bi'
      },
      {
        id: 'visualizar_dashboard_rh_bi',
        label: 'Visualizar Dashboard RH BI',
        description: 'Ver dashboard de recursos humanos',
        module: 'bi'
      },

      // Relatórios Avançados
      {
        id: 'criar_relatorios_bi',
        label: 'Criar Relatórios BI',
        description: 'Criar novos relatórios personalizados',
        module: 'bi'
      },
      {
        id: 'editar_relatorios_bi',
        label: 'Editar Relatórios BI',
        description: 'Editar relatórios existentes',
        module: 'bi'
      },
      {
        id: 'deletar_relatorios_bi',
        label: 'Deletar Relatórios BI',
        description: 'Remover relatórios do sistema',
        module: 'bi'
      },
      {
        id: 'agendar_relatorios_bi',
        label: 'Agendar Relatórios BI',
        description: 'Agendar geração automática de relatórios',
        module: 'bi'
      },

      // Análises e Indicadores
      {
        id: 'visualizar_kpis',
        label: 'Visualizar KPIs',
        description: 'Ver indicadores chave de performance',
        module: 'bi'
      },
      {
        id: 'criar_kpis',
        label: 'Criar KPIs',
        description: 'Criar novos indicadores de performance',
        module: 'bi'
      },
      {
        id: 'configurar_alertas_bi',
        label: 'Configurar Alertas BI',
        description: 'Configurar alertas baseados em métricas',
        module: 'bi'
      },

      // Configurações de BI
      {
        id: 'gerenciar_fontes_dados',
        label: 'Gerenciar Fontes de Dados',
        description: 'Configurar conexões com fontes de dados',
        module: 'bi'
      },
      {
        id: 'configurar_dashboards',
        label: 'Configurar Dashboards',
        description: 'Personalizar layout e widgets dos dashboards',
        module: 'bi'
      },

      // Exportação e Compartilhamento
      {
        id: 'exportar_relatorios_bi',
        label: 'Exportar Relatórios BI',
        description: 'Exportar relatórios em diversos formatos',
        module: 'bi'
      },
      {
        id: 'compartilhar_dashboards',
        label: 'Compartilhar Dashboards',
        description: 'Compartilhar dashboards com outros usuários',
        module: 'bi'
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

/**
 * Email do usuário master do sistema
 */
export const MASTER_USER_EMAILS = ['valmirmoreirajunior@gmail.com', 'valmirmoreirajunior@gamail.com', 'valmirmoreirajunior@gamail.com.br'];

/**
 * Verificar se o usuário é master (desenvolvedor)
 */
export function isMasterUser(userEmail?: string): boolean {
  return userEmail ? MASTER_USER_EMAILS.includes(userEmail) : false;
}

/**
 * Verificar se usuário tem permissão (com bypass para master)
 */
export function hasPermission(userPermissions: string[], permissionId: string, userEmail?: string): boolean {
  // Master user sempre tem todas as permissões
  if (isMasterUser(userEmail)) {
    return true;
  }

  return userPermissions.includes(permissionId);
}

/**
 * Obter todas as permissões para um usuário (com bypass para master)
 */
export function getUserPermissions(userPermissions: string[], userEmail?: string): string[] {
  // Master user tem todas as permissões
  if (isMasterUser(userEmail)) {
    return ALL_PERMISSIONS.map(p => p.id);
  }

  return userPermissions;
}
