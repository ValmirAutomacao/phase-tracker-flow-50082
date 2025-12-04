// ============================================================
// TIPOS TYPESCRIPT - SISTEMA CRONOGRAMAS (GANTT)
// ============================================================
// Descrição: Tipos TypeScript para o sistema completo de cronogramas
// Equivalente ao Microsoft Project em funcionalidades
// Data: 2024-12-03
// ============================================================

// ============================================================
// ENUMS E TIPOS BÁSICOS
// ============================================================

export type TipoItemWBS = 'projeto' | 'fase' | 'atividade' | 'marco';

export type StatusAtividade =
  | 'nao_iniciada'
  | 'em_andamento'
  | 'concluida'
  | 'pausada'
  | 'cancelada'
  | 'atrasada';

export type TipoDependencia = 'TI' | 'II' | 'TT' | 'IT';

export type TipoAlocacao = 'trabalho' | 'material' | 'custo';

export type UnidadeMedida =
  | 'horas'
  | 'dias'
  | 'pecas'
  | 'metros'
  | 'metros_quadrados'
  | 'metros_cubicos'
  | 'quilogramas'
  | 'toneladas'
  | 'litros'
  | 'reais'
  | 'percentual';

export type TipoBaseline = 'inicial' | 'aprovado' | 'replanejamento' | 'intermediario' | 'final';

export type StatusBaseline = 'ativo' | 'historico' | 'suspenso';

export type StatusCronograma = 'planejamento' | 'em_execucao' | 'pausado' | 'concluido' | 'cancelado';

export type CategoriaRecurso = 'humano' | 'material' | 'equipamento' | 'custo';

export type NivelExperiencia = 'junior' | 'pleno' | 'senior' | 'coordenador';

export type TipoExcecao = 'feriado' | 'ponto_facultativo' | 'dia_extra';

// ============================================================
// INTERFACES PRINCIPAIS
// ============================================================

export interface CalendarioTrabalho {
  id: string;
  nome: string;
  descricao?: string;
  empresa_padrao: boolean;
  segunda_util: boolean;
  terca_util: boolean;
  quarta_util: boolean;
  quinta_util: boolean;
  sexta_util: boolean;
  sabado_util: boolean;
  domingo_util: boolean;
  inicio_manha: string;
  fim_manha: string;
  inicio_tarde: string;
  fim_tarde: string;
  horas_dia: number;
  created_at: string;
  updated_at: string;
}

export interface CalendarioExcecao {
  id: string;
  calendario_id: string;
  data_excecao: string;
  tipo_excecao: TipoExcecao;
  descricao?: string;
  trabalha: boolean;
}

export interface TipoRecurso {
  id: string;
  nome: string;
  descricao?: string;
  unidade_padrao?: string;
  categoria: CategoriaRecurso;
  created_at: string;
}

export interface RecursoEmpresa {
  id: string;
  tipo_recurso_id: string;
  nome: string;
  codigo?: string;
  descricao?: string;
  funcionario_id?: string;
  disciplina?: string;
  nivel_experiencia?: NivelExperiencia;
  custo_hora?: number;
  fornecedor?: string;
  marca?: string;
  modelo?: string;
  unidade_medida?: string;
  custo_unitario?: number;
  disponibilidade_maxima?: number;
  observacoes?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;

  // Relacionamentos
  tipo_recurso?: TipoRecurso;
}

export interface Cronograma {
  id: string;
  obra_id?: string;
  nome: string;
  descricao?: string;
  data_inicio: string;
  data_fim?: string;
  data_criacao: string;
  data_atualizacao: string;
  calendario_id: string;
  status: StatusCronograma;
  percentual_conclusao: number;
  unidade_duracao: string;
  permite_sobreposicao: boolean;
  auto_nivelamento: boolean;
  orcamento_total?: number;
  custo_realizado: number;
  criado_por?: string;
  atualizado_por?: string;
  versao: number;

  // Relacionamentos
  calendario_trabalho?: CalendarioTrabalho;
  eap_itens?: EAPItem[];
}

export interface EAPItem {
  id: string;
  cronograma_id: string;
  item_pai_id?: string;
  codigo_wbs: string;
  nome: string;
  descricao?: string;
  tipo: TipoItemWBS;
  nivel_hierarquia: number;
  posicao_irmao: number;
  data_inicio_planejada?: string;
  data_fim_planejada?: string;
  data_inicio_real?: string;
  data_fim_real?: string;
  duracao_planejada: number;
  duracao_realizada: number;
  trabalho_planejado: number;
  trabalho_realizado: number;
  status: StatusAtividade;
  percentual_fisico: number;
  percentual_conclusao: number;
  e_marco: boolean;
  e_critica: boolean;
  e_resumo: boolean;
  permite_divisao: boolean;
  tipo_restricao: string;
  data_restricao?: string;
  custo_fixo: number;
  custo_variavel: number;
  custo_total_planejado: number;
  custo_total_realizado: number;
  folga_total: number;
  folga_livre: number;
  notas?: string;
  prioridade: number;
  data_criacao: string;
  data_atualizacao: string;
  criado_por?: string;
  atualizado_por?: string;
  versao: number;

  // Relacionamentos
  cronograma?: Cronograma;
  item_pai?: EAPItem;
  filhos?: EAPItem[];
  dependencias_como_predecessora?: DependenciaAtividade[];
  dependencias_como_sucessora?: DependenciaAtividade[];
  alocacoes?: AlocacaoRecurso[];
}

export interface DependenciaAtividade {
  id: string;
  atividade_predecessora_id: string;
  atividade_sucessora_id: string;
  tipo: TipoDependencia;
  defasagem_horas: number;
  e_obrigatoria: boolean;
  aplicar_calendario: boolean;
  descricao?: string;
  criado_em: string;
  criado_por?: string;

  // Relacionamentos
  atividade_predecessora?: EAPItem;
  atividade_sucessora?: EAPItem;
}

export interface AlocacaoRecurso {
  id: string;
  atividade_id: string;
  recurso_id: string;
  tipo: TipoAlocacao;
  unidade: UnidadeMedida;
  quantidade_planejada: number;
  percentual_dedicacao: number;
  horas_por_dia: number;
  quantidade_realizada: number;
  horas_realizadas: number;
  custo_unitario: number;
  custo_total_planejado: number;
  custo_total_realizado: number;
  data_inicio_alocacao?: string;
  data_fim_alocacao?: string;
  e_recurso_critico: boolean;
  permite_sobre_alocacao: boolean;
  prioridade_alocacao: number;
  trabalho_distribuido: boolean;
  curva_trabalho: string;
  observacoes?: string;
  criado_em: string;
  atualizado_em: string;
  criado_por?: string;
  atualizado_por?: string;

  // Relacionamentos
  atividade?: EAPItem;
  recurso?: RecursoEmpresa;
}

export interface DisponibilidadeRecurso {
  id: string;
  recurso_id: string;
  data_inicio: string;
  data_fim: string;
  horas_segunda: number;
  horas_terca: number;
  horas_quarta: number;
  horas_quinta: number;
  horas_sexta: number;
  horas_sabado: number;
  horas_domingo: number;
  e_periodo_ferias: boolean;
  e_periodo_licenca: boolean;
  multiplicador_custo: number;
  observacoes?: string;
  criado_em: string;
  criado_por?: string;

  // Relacionamentos
  recurso?: RecursoEmpresa;
}

export interface BaselineCronograma {
  id: string;
  cronograma_id: string;
  nome: string;
  descricao?: string;
  tipo: TipoBaseline;
  numero_versao: number;
  status: StatusBaseline;
  data_baseline: string;
  data_aprovacao?: string;
  data_inicio_baseline: string;
  data_fim_baseline?: string;
  orcamento_total_baseline?: number;
  trabalho_total_baseline?: number;
  custo_total_baseline?: number;
  total_atividades: number;
  total_marcos: number;
  duracao_total_dias: number;
  criado_por?: string;
  aprovado_por?: string;
  observacoes?: string;
  criado_em: string;
  atualizado_em: string;

  // Relacionamentos
  cronograma?: Cronograma;
  atividades?: BaselineAtividade[];
}

export interface BaselineAtividade {
  id: string;
  baseline_id: string;
  atividade_id: string;
  codigo_wbs_baseline: string;
  nome_baseline: string;
  tipo_baseline: TipoItemWBS;
  item_pai_id_baseline?: string;
  nivel_hierarquia_baseline: number;
  posicao_irmao_baseline: number;
  data_inicio_baseline?: string;
  data_fim_baseline?: string;
  duracao_planejada_baseline: number;
  trabalho_planejado_baseline: number;
  custo_fixo_baseline: number;
  custo_total_baseline: number;
  status_baseline: StatusAtividade;
  percentual_conclusao_baseline: number;
  e_marco_baseline: boolean;
  e_critica_baseline: boolean;
  prioridade_baseline: number;
  notas_baseline?: string;
  criado_em: string;

  // Relacionamentos
  baseline?: BaselineCronograma;
  atividade?: EAPItem;
}

// ============================================================
// TIPOS PARA VIEWS E RELATÓRIOS
// ============================================================

export interface DependenciaDetalhada {
  id: string;
  tipo: TipoDependencia;
  defasagem_horas: number;
  e_obrigatoria: boolean;
  predecessora_id: string;
  predecessora_codigo_wbs: string;
  predecessora_nome: string;
  predecessora_data_inicio?: string;
  predecessora_data_fim?: string;
  predecessora_status: StatusAtividade;
  sucessora_id: string;
  sucessora_codigo_wbs: string;
  sucessora_nome: string;
  sucessora_data_inicio?: string;
  sucessora_data_fim?: string;
  sucessora_status: StatusAtividade;
  cronograma_id: string;
  cronograma_nome: string;
  obra_nome: string;
}

export interface AlocacaoDetalhada {
  id: string;
  tipo: TipoAlocacao;
  unidade: UnidadeMedida;
  quantidade_planejada: number;
  quantidade_realizada: number;
  percentual_dedicacao: number;
  custo_total_planejado: number;
  custo_total_realizado: number;
  e_recurso_critico: boolean;
  atividade_id: string;
  codigo_wbs: string;
  atividade_nome: string;
  atividade_data_inicio?: string;
  atividade_data_fim?: string;
  atividade_status: StatusAtividade;
  recurso_id: string;
  recurso_nome: string;
  recurso_codigo?: string;
  tipo_recurso_nome: string;
  custo_hora?: number;
  disponibilidade_maxima?: number;
  cronograma_id: string;
  cronograma_nome: string;
  obra_nome: string;
  percentual_conclusao_recurso: number;
}

export interface UtilizacaoRecurso {
  recurso_id: string;
  recurso_nome: string;
  recurso_codigo?: string;
  tipo_recurso_nome: string;
  total_alocacoes: number;
  total_quantidade_planejada: number;
  total_quantidade_realizada: number;
  total_custo_planejado: number;
  total_custo_realizado: number;
  alocacoes_criticas: number;
  percentual_utilizacao: number;
}

export interface BaselineResumo {
  id: string;
  cronograma_id: string;
  nome: string;
  tipo: TipoBaseline;
  status: StatusBaseline;
  numero_versao: number;
  data_baseline: string;
  data_aprovacao?: string;
  data_inicio_baseline: string;
  data_fim_baseline?: string;
  total_atividades: number;
  total_marcos: number;
  duracao_total_dias: number;
  orcamento_total_baseline?: number;
  trabalho_total_baseline?: number;
  custo_total_baseline?: number;
  cronograma_nome: string;
  obra_nome: string;
  atividades_no_baseline: number;
  marcos_no_baseline: number;
  atividades_criticas_no_baseline: number;
}

export interface ComparacaoBaseline {
  atividade_id: string;
  codigo_wbs: string;
  nome_atividade: string;
  data_inicio_baseline?: string;
  data_inicio_atual?: string;
  variacao_inicio_dias?: number;
  data_fim_baseline?: string;
  data_fim_atual?: string;
  variacao_fim_dias?: number;
  trabalho_baseline: number;
  trabalho_atual: number;
  variacao_trabalho: number;
  custo_baseline: number;
  custo_atual: number;
  variacao_custo: number;
  status_baseline: StatusAtividade;
  status_atual: StatusAtividade;
  percentual_baseline: number;
  percentual_atual: number;
  variacao_percentual: number;
}

// ============================================================
// TIPOS PARA FORMULÁRIOS E REQUESTS
// ============================================================

export interface CronogramaCreateRequest {
  obra_id?: string;
  nome: string;
  descricao?: string;
  data_inicio: string;
  data_fim?: string;
  calendario_id: string;
  status?: StatusCronograma;
  unidade_duracao?: string;
  permite_sobreposicao?: boolean;
  auto_nivelamento?: boolean;
  orcamento_total?: number;
}

export interface CronogramaUpdateRequest extends Partial<CronogramaCreateRequest> {
  id: string;
}

export interface EAPItemCreateRequest {
  cronograma_id: string;
  item_pai_id?: string;
  nome: string;
  descricao?: string;
  tipo: TipoItemWBS;
  posicao_irmao?: number;
  data_inicio_planejada?: string;
  data_fim_planejada?: string;
  duracao_planejada?: number;
  trabalho_planejado?: number;
  status?: StatusAtividade;
  e_marco?: boolean;
  prioridade?: number;
  notas?: string;
}

export interface EAPItemUpdateRequest extends Partial<EAPItemCreateRequest> {
  id: string;
}

export interface DependenciaCreateRequest {
  atividade_predecessora_id: string;
  atividade_sucessora_id: string;
  tipo: TipoDependencia;
  defasagem_horas?: number;
  e_obrigatoria?: boolean;
  aplicar_calendario?: boolean;
  descricao?: string;
}

export interface AlocacaoCreateRequest {
  atividade_id: string;
  recurso_id: string;
  tipo: TipoAlocacao;
  unidade: UnidadeMedida;
  quantidade_planejada: number;
  percentual_dedicacao?: number;
  horas_por_dia?: number;
  custo_unitario?: number;
  data_inicio_alocacao?: string;
  data_fim_alocacao?: string;
  observacoes?: string;
}

export interface BaselineCreateRequest {
  cronograma_id: string;
  nome: string;
  tipo: TipoBaseline;
  descricao?: string;
}

// ============================================================
// TIPOS PARA COMPONENTES DE UI
// ============================================================

export interface GanttBarProps {
  item: EAPItem;
  position: { x: number; y: number; width: number; height: number };
  isSelected: boolean;
  isDragging: boolean;
  onSelect: (item: EAPItem) => void;
  onDragStart: (item: EAPItem) => void;
  onDragEnd: (item: EAPItem, newDates: { start: Date; end: Date }) => void;
}

export interface TimelineHeaderProps {
  startDate: Date;
  endDate: Date;
  scale: 'days' | 'weeks' | 'months' | 'quarters';
  onScaleChange: (scale: string) => void;
}

export interface WBSTreeProps {
  items: EAPItem[];
  selectedItem?: EAPItem;
  onItemSelect: (item: EAPItem) => void;
  onItemAdd: (parentId: string | null) => void;
  onItemEdit: (item: EAPItem) => void;
  onItemDelete: (item: EAPItem) => void;
  onItemMove: (item: EAPItem, newParentId: string | null, newPosition: number) => void;
}

export interface ResourceGridProps {
  allocations: AlocacaoDetalhada[];
  resources: RecursoEmpresa[];
  onAllocationAdd: (allocation: AlocacaoCreateRequest) => void;
  onAllocationEdit: (allocation: AlocacaoDetalhada) => void;
  onAllocationDelete: (allocationId: string) => void;
}

export interface DependencyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activities: EAPItem[];
  dependency?: DependenciaDetalhada;
  onSave: (dependency: DependenciaCreateRequest) => void;
}

// ============================================================
// TIPOS DE FILTROS E BUSCA
// ============================================================

export interface CronogramaFilters {
  search?: string;
  status?: StatusCronograma[];
  obra_id?: string;
  data_inicio_de?: string;
  data_inicio_ate?: string;
  criado_por?: string;
}

export interface EAPItemFilters {
  search?: string;
  tipos?: TipoItemWBS[];
  status?: StatusAtividade[];
  e_critica?: boolean;
  e_marco?: boolean;
  nivel_hierarquia?: number;
  data_inicio_de?: string;
  data_inicio_ate?: string;
}

export interface RecursoFilters {
  search?: string;
  categoria?: CategoriaRecurso[];
  disciplina?: string;
  nivel_experiencia?: NivelExperiencia[];
  ativo?: boolean;
}

// ============================================================
// TIPOS DE RESPOSTA DA API
// ============================================================

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CronogramaStats {
  total_cronogramas: number;
  cronogramas_ativos: number;
  cronogramas_concluidos: number;
  total_atividades: number;
  atividades_concluidas: number;
  percentual_geral: number;
}

// ============================================================
// CONSTANTES E CONFIGURAÇÕES
// ============================================================

export const TIPOS_DEPENDENCIA_LABELS: Record<TipoDependencia, string> = {
  TI: 'Término-Início (TI)',
  II: 'Início-Início (II)',
  TT: 'Término-Término (TT)',
  IT: 'Início-Término (IT)',
};

export const STATUS_ATIVIDADE_LABELS: Record<StatusAtividade, string> = {
  nao_iniciada: 'Não Iniciada',
  em_andamento: 'Em Andamento',
  concluida: 'Concluída',
  pausada: 'Pausada',
  cancelada: 'Cancelada',
  atrasada: 'Atrasada',
};

export const STATUS_ATIVIDADE_CORES: Record<StatusAtividade, string> = {
  nao_iniciada: '#6B7280',
  em_andamento: '#3B82F6',
  concluida: '#10B981',
  pausada: '#F59E0B',
  cancelada: '#EF4444',
  atrasada: '#DC2626',
};

export const TIPOS_ITEM_WBS_LABELS: Record<TipoItemWBS, string> = {
  projeto: 'Projeto',
  fase: 'Fase',
  atividade: 'Atividade',
  marco: 'Marco',
};

export const GANTT_CONFIG = {
  ROW_HEIGHT: 32,
  HEADER_HEIGHT: 60,
  MIN_COLUMN_WIDTH: 30,
  DEFAULT_ZOOM: 'weeks' as const,
  COLORS: {
    GRID: '#E5E7EB',
    SELECTED: '#3B82F6',
    CRITICAL: '#DC2626',
    MILESTONE: '#8B5CF6',
    BACKGROUND: '#FFFFFF',
  },
} as const;