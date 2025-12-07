// Tipos e interfaces para o módulo de Business Intelligence

export interface RelatorioBi {
  id: string;
  usuario_id?: string;
  nome: string;
  descricao?: string;
  setor: 'financeiro' | 'obras' | 'rh' | 'geral';
  campos_selecionados: CampoSelecionado[];
  filtros_padrao: FiltrosPadrao;
  configuracoes: ConfiguracaoBi;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  [key: string]: unknown; // Index signature for BaseEntity compatibility
}

export interface CampoSelecionado {
  tabela: string;
  campo: string;
  alias?: string;
  tipo: 'string' | 'number' | 'date' | 'boolean' | 'currency';
  formatacao?: FormatacaoCampo;
}

export interface FormatacaoCampo {
  moeda?: boolean;
  data_formato?: 'dd/mm/yyyy' | 'mm/yyyy' | 'yyyy';
  casas_decimais?: number;
  prefixo?: string;
  sufixo?: string;
}

export interface FiltrosPadrao {
  periodo_obrigatorio?: boolean;
  data_inicio?: string;
  data_fim?: string;
  cliente_id?: string;
  obra_id?: string;
  categoria?: string;
  forma_pagamento?: string;
  status?: string;
  funcionario_id?: string;
}

export interface ConfiguracaoBi {
  ordenacao?: {
    campo: string;
    direcao: 'asc' | 'desc';
  };
  agrupamento?: string[];
  totalizacao?: {
    campo: string;
    funcao: 'sum' | 'count' | 'avg' | 'min' | 'max';
  }[];
  limite_registros?: number;
  mostrar_totais?: boolean;
}

// Definições dos campos disponíveis por tabela do setor financeiro
export interface CampoDisponivelBI {
  key: string;
  label: string;
  tipo: 'string' | 'number' | 'date' | 'boolean' | 'currency';
  tabela: string;
  descricao?: string;
  agrupavel?: boolean;
  totalizavel?: boolean;
  prioridade?: number; // Campo para ordenar prioridade de exibição (1 = mais importante)
}

// 🔄 CLAUDE-MODIFIED: 2025-11-28 - Removidos campos ID e priorizados números de documento
// 📌 Original: Incluía campos ID técnicos
// ✨ Novo: Prioriza números de documento como referência principal
export const CAMPOS_FINANCEIRO: Record<string, CampoDisponivelBI[]> = {
  despesas: [
    { key: 'numero_documento', label: 'Número Documento', tipo: 'string', tabela: 'despesas', prioridade: 1 },
    { key: 'data_despesa', label: 'Data da Despesa', tipo: 'date', tabela: 'despesas', agrupavel: true },
    { key: 'valor', label: 'Valor da Despesa', tipo: 'currency', tabela: 'despesas', totalizavel: true },
    { key: 'categoria', label: 'Categoria', tipo: 'string', tabela: 'despesas', agrupavel: true },
    { key: 'status', label: 'Status', tipo: 'string', tabela: 'despesas', agrupavel: true },
    { key: 'fornecedor_cnpj', label: 'CNPJ Fornecedor', tipo: 'string', tabela: 'despesas' },
    { key: 'descricao', label: 'Descrição', tipo: 'string', tabela: 'despesas' },
    { key: 'created_at', label: 'Data Criação', tipo: 'date', tabela: 'despesas', agrupavel: true }
  ],

  despesas_variaveis: [
    { key: 'nr_documento', label: 'Número Documento', tipo: 'string', tabela: 'despesas_variaveis', prioridade: 1 },
    { key: 'data_compra', label: 'Data da Compra', tipo: 'date', tabela: 'despesas_variaveis', agrupavel: true },
    { key: 'data_lancamento', label: 'Data de Lançamento', tipo: 'date', tabela: 'despesas_variaveis', agrupavel: true },
    { key: 'valor_compra', label: 'Valor da Compra', tipo: 'currency', tabela: 'despesas_variaveis', totalizavel: true },
    { key: 'nome_fornecedor', label: 'Nome Fornecedor', tipo: 'string', tabela: 'despesas_variaveis', agrupavel: true },
    { key: 'cnpj_fornecedor', label: 'CNPJ Fornecedor', tipo: 'string', tabela: 'despesas_variaveis' },
    { key: 'forma_pagamento', label: 'Forma de Pagamento', tipo: 'string', tabela: 'despesas_variaveis', agrupavel: true },
    { key: 'numero_parcelas', label: 'Número de Parcelas', tipo: 'number', tabela: 'despesas_variaveis' },
    { key: 'status_ocr', label: 'Status OCR', tipo: 'string', tabela: 'despesas_variaveis', agrupavel: true },
    { key: 'descricao', label: 'Descrição', tipo: 'string', tabela: 'despesas_variaveis' },
    { key: 'created_at', label: 'Data Criação', tipo: 'date', tabela: 'despesas_variaveis', agrupavel: true }
  ],

  cartoes_credito: [
    { key: 'numero_cartao_masked', label: 'Número Cartão', tipo: 'string', tabela: 'cartoes_credito', prioridade: 1 },
    { key: 'bandeira', label: 'Bandeira', tipo: 'string', tabela: 'cartoes_credito', agrupavel: true },
    { key: 'vencimento_mes', label: 'Mês Vencimento', tipo: 'number', tabela: 'cartoes_credito' },
    { key: 'vencimento_ano', label: 'Ano Vencimento', tipo: 'number', tabela: 'cartoes_credito' },
    { key: 'ativo', label: 'Ativo', tipo: 'boolean', tabela: 'cartoes_credito', agrupavel: true },
    { key: 'created_at', label: 'Data Criação', tipo: 'date', tabela: 'cartoes_credito', agrupavel: true }
  ],

  formas_pagamento: [
    { key: 'codigo', label: 'Código', tipo: 'string', tabela: 'formas_pagamento', prioridade: 1 },
    { key: 'nome', label: 'Nome', tipo: 'string', tabela: 'formas_pagamento', agrupavel: true },
    { key: 'ativo', label: 'Ativo', tipo: 'boolean', tabela: 'formas_pagamento', agrupavel: true },
    { key: 'permite_parcelamento', label: 'Permite Parcelamento', tipo: 'boolean', tabela: 'formas_pagamento', agrupavel: true },
    { key: 'requer_cartao', label: 'Requer Cartão', tipo: 'boolean', tabela: 'formas_pagamento', agrupavel: true }
  ],

  categorias: [
    { key: 'nome', label: 'Nome', tipo: 'string', tabela: 'categorias', agrupavel: true, prioridade: 1 },
    { key: 'tipo', label: 'Tipo', tipo: 'string', tabela: 'categorias', agrupavel: true },
    { key: 'descricao', label: 'Descrição', tipo: 'string', tabela: 'categorias' },
    { key: 'ativa', label: 'Ativa', tipo: 'boolean', tabela: 'categorias', agrupavel: true }
  ],

  // Campos de relacionamento
  clientes: [
    { key: 'documento', label: 'Documento Cliente', tipo: 'string', tabela: 'clientes', prioridade: 1 },
    { key: 'nome', label: 'Nome do Cliente', tipo: 'string', tabela: 'clientes', agrupavel: true },
    { key: 'tipo', label: 'Tipo Cliente', tipo: 'string', tabela: 'clientes', agrupavel: true }
  ],

  obras: [
    { key: 'nome', label: 'Nome da Obra', tipo: 'string', tabela: 'obras', agrupavel: true, prioridade: 1 },
    { key: 'status', label: 'Status Obra', tipo: 'string', tabela: 'obras', agrupavel: true },
    { key: 'progresso', label: 'Progresso (%)', tipo: 'number', tabela: 'obras' },
    { key: 'orcamento', label: 'Orçamento', tipo: 'currency', tabela: 'obras', totalizavel: true },
    { key: 'data_inicio', label: 'Data Início', tipo: 'date', tabela: 'obras', agrupavel: true },
    { key: 'data_fim', label: 'Data Fim', tipo: 'date', tabela: 'obras', agrupavel: true }
  ],

  funcionarios: [
    { key: 'nome', label: 'Nome do Funcionário', tipo: 'string', tabela: 'funcionarios', agrupavel: true, prioridade: 1 },
    { key: 'email', label: 'Email', tipo: 'string', tabela: 'funcionarios' },
    { key: 'telefone', label: 'Telefone', tipo: 'string', tabela: 'funcionarios' },
    { key: 'ativo', label: 'Funcionário Ativo', tipo: 'boolean', tabela: 'funcionarios', agrupavel: true }
  ],

  requisicoes: [
    { key: 'titulo', label: 'Título Requisição', tipo: 'string', tabela: 'requisicoes', agrupavel: true, prioridade: 1 },
    { key: 'status', label: 'Status Requisição', tipo: 'string', tabela: 'requisicoes', agrupavel: true },
    { key: 'prioridade', label: 'Prioridade', tipo: 'string', tabela: 'requisicoes', agrupavel: true },
    { key: 'data_vencimento', label: 'Data Vencimento', tipo: 'date', tabela: 'requisicoes', agrupavel: true }
  ]
};

// Interface para filtros do BI
export interface FiltroBI {
  key: string;
  label: string;
  tipo: 'text' | 'select' | 'date' | 'number' | 'dateRange';
  opcoes?: { value: string; label: string }[];
  obrigatorio?: boolean;
  placeholder?: string;
}

export const FILTROS_FINANCEIRO: FiltroBI[] = [
  {
    key: 'periodo',
    label: 'Período',
    tipo: 'dateRange',
    obrigatorio: true,
    placeholder: 'Selecione o período'
  },
  {
    key: 'cliente_id',
    label: 'Cliente',
    tipo: 'select',
    placeholder: 'Todos os clientes'
  },
  {
    key: 'obra_id',
    label: 'Obra',
    tipo: 'select',
    placeholder: 'Todas as obras'
  },
  {
    key: 'categoria',
    label: 'Categoria',
    tipo: 'select',
    placeholder: 'Todas as categorias'
  },
  {
    key: 'forma_pagamento',
    label: 'Forma de Pagamento',
    tipo: 'select',
    placeholder: 'Todas as formas'
  },
  {
    key: 'status',
    label: 'Status',
    tipo: 'select',
    opcoes: [
      { value: 'pendente', label: 'Pendente' },
      { value: 'validado', label: 'Validado' },
      { value: 'rejeitado', label: 'Rejeitado' }
    ],
    placeholder: 'Todos os status'
  },
  {
    key: 'funcionario_id',
    label: 'Funcionário Comprador',
    tipo: 'select',
    placeholder: 'Todos os funcionários'
  }
];

// Tipos para resultado do relatório
export interface ResultadoBI {
  dados: Record<string, any>[];
  totais?: Record<string, number>;
  metadados: {
    total_registros: number;
    tempo_execucao: number;
    filtros_aplicados: Record<string, any>;
    campos_selecionados: CampoSelecionado[];
  };
}

// Tipos para exportação
export interface ConfiguracaoExportacao {
  formato: 'xlsx' | 'pdf' | 'csv';
  incluir_logo: boolean;
  incluir_filtros: boolean;
  incluir_totais: boolean;
  titulo_personalizado?: string;
  orientacao_pdf?: 'portrait' | 'landscape';
}

// Interface para consulta do BI
export interface ConsultaBI {
  relatorio_id?: string;
  campos_selecionados: CampoSelecionado[];
  filtros: Record<string, any>;
  configuracoes: ConfiguracaoBi;
  limite?: number;
  offset?: number;
}