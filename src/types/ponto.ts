export type TipoRegistroPonto = 'PE' | 'PS' | 'INT_ENTRADA' | 'INT_SAIDA' | 'SE' | 'SS' | 'HE_INICIO' | 'HE_FIM';

export interface JornadaTrabalho {
  id: string;
  nome: string;
  descricao?: string;
  pe_esperado?: string; // TIME format
  ps_esperado?: string;
  se_esperado?: string;
  ss_esperado?: string;
  carga_horaria_diaria: number;
  tem_intervalo: boolean;
  duracao_intervalo: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface RegistroPonto {
  id: string;
  funcionario_id: string;
  data_registro: string; // DATE format
  hora_registro: string; // TIME format
  timestamp_registro: string; // TIMESTAMP format
  tipo_registro: TipoRegistroPonto;
  ip_address?: string;
  user_agent?: string;
  localizacao_gps?: string;
  observacoes?: string;
  comprovante_gerado: boolean;
  created_at: string;
}

export interface ComprovantePonto {
  id: string;
  funcionario_id: string;
  registro_ponto_id: string;
  tipo_comprovante: 'individual' | 'mensal';
  periodo_inicio?: string;
  periodo_fim?: string;
  pdf_url?: string;
  hash_verificacao?: string;
  data_emissao: string;
  created_at: string;
}

export interface FuncionarioCompleto {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  cpf?: string;
  ctps?: string;
  data_admissao?: string;
  ativo: boolean;
  jornada_trabalho_id?: string;
  senha_ponto?: string; // Hash
  funcao?: {
    id: string;
    nome: string;
    setor?: {
      id: string;
      nome: string;
    };
  };
  jornada?: JornadaTrabalho;
}

export interface PontoDiario {
  funcionario_nome: string;
  funcionario_id: string;
  cpf?: string;
  setor_nome?: string;
  funcao_nome?: string;
  jornada_nome?: string;
  data_registro: string;
  primeira_entrada?: string;
  primeira_saida?: string;
  intervalo_entrada?: string;
  intervalo_saida?: string;
  segunda_entrada?: string;
  segunda_saida?: string;
  he_inicio?: string;
  he_fim?: string;
  total_horas?: string;
  horas_extras?: string;
  status_dia?: 'presente' | 'ausente' | 'afastado' | 'nao_util';
}

export const TIPO_REGISTRO_LABELS: Record<TipoRegistroPonto, string> = {
  'PE': 'Primeira Entrada',
  'PS': 'Primeira Saída',
  'INT_ENTRADA': 'Entrada Intervalo',
  'INT_SAIDA': 'Saída Intervalo',
  'SE': 'Segunda Entrada',
  'SS': 'Segunda Saída',
  'HE_INICIO': 'H.E. Início',
  'HE_FIM': 'H.E. Fim'
};

export const TIPO_REGISTRO_COLORS: Record<TipoRegistroPonto, string> = {
  'PE': 'bg-green-500 hover:bg-green-600',
  'PS': 'bg-orange-500 hover:bg-orange-600',
  'INT_ENTRADA': 'bg-blue-500 hover:bg-blue-600',
  'INT_SAIDA': 'bg-blue-600 hover:bg-blue-700',
  'SE': 'bg-green-600 hover:bg-green-700',
  'SS': 'bg-red-500 hover:bg-red-600',
  'HE_INICIO': 'bg-purple-500 hover:bg-purple-600',
  'HE_FIM': 'bg-purple-600 hover:bg-purple-700'
};

export interface RegistroPontoInsert {
  funcionario_id: string;
  data_registro: string;
  hora_registro: string;
  timestamp_registro: string;
  tipo_registro: TipoRegistroPonto;
  ip_address?: string;
  user_agent?: string;
  observacoes?: string;
}

export const DIAS_SEMANA = [
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
  'Domingo'
] as const;

export const MESES_EXTENSO = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
] as const;

// CLAUDE-NOTE: Tipos para sistema de ajustes de ponto
export type TipoAjustePonto = 'entrada' | 'saida' | 'intervalo_entrada' | 'intervalo_saida' | 'exclusao' | 'adicao';

export interface AjustePonto {
  id: string;
  registro_ponto_id?: string; // null para adições
  funcionario_id: string;
  funcionario_nome: string;
  data_ajuste: string; // DATE format
  tipo_ajuste: TipoAjustePonto;
  tipo_registro: TipoRegistroPonto;
  hora_original?: string; // TIME format - null para adições
  hora_ajustada: string; // TIME format
  justificativa: string;
  usuario_ajuste_id: string;
  usuario_ajuste_nome: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface AjustePontoInsert {
  registro_ponto_id?: string;
  funcionario_id: string;
  tipo_registro_original?: string;
  hora_original?: string;
  data_original?: string;
  tipo_registro_novo: string;
  hora_nova: string;
  data_nova: string;
  justificativa_id?: string;
  justificativa_texto: string;
  documento_url?: string;
  usuario_ajuste_id: string;
  observacoes?: string;
}

// CLAUDE-NOTE: Tipos para sistema de afastamentos
export type TipoAfastamentoEnum = 'atestado' | 'ferias' | 'licenca_maternidade' | 'licenca_paternidade' | 'licenca_sem_vencimento' | 'falta_justificada' | 'falta_injustificada' | 'suspensao' | 'outro';

export interface Afastamento {
  id: string;
  funcionario_id: string;
  funcionario_nome: string;
  tipo_afastamento: TipoAfastamentoEnum | string;
  tipo_afastamento_id?: string;
  data_inicio: string; // DATE format
  data_fim: string; // DATE format
  total_dias: number;
  motivo: string;
  observacoes?: string;
  documento_url?: string; // Supabase Storage URL
  documento_anexo_url?: string;
  documento_anexo_nome?: string;
  usuario_cadastro_id: string;
  usuario_cadastro_nome: string;
  status?: string;
  solicitado_por?: { id: string; nome: string };
  funcionario?: { id: string; nome: string; email?: string };
  tipo_afastamento_obj?: { id: string; nome: string; cor?: string; categoria?: string };
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface AfastamentoInsert {
  funcionario_id: string;
  tipo_afastamento_id: string;
  data_inicio: string;
  data_fim: string;
  motivo: string;
  observacoes?: string;
  documento_url?: string;
  documento_anexo_url?: string;
  documento_anexo_nome?: string;
  usuario_cadastro_id: string;
}

// Manter compatibilidade com tipo antigo
export type TipoAfastamento = TipoAfastamentoEnum;

export const TIPO_AJUSTE_LABELS: Record<TipoAjustePonto, string> = {
  'entrada': 'Ajuste de Entrada',
  'saida': 'Ajuste de Saída',
  'intervalo_entrada': 'Ajuste Entrada Intervalo',
  'intervalo_saida': 'Ajuste Saída Intervalo',
  'exclusao': 'Exclusão de Registro',
  'adicao': 'Adição de Registro'
};

export const TIPO_AFASTAMENTO_LABELS: Record<TipoAfastamento, string> = {
  'atestado': 'Atestado Médico',
  'ferias': 'Férias',
  'licenca_maternidade': 'Licença Maternidade',
  'licenca_paternidade': 'Licença Paternidade',
  'licenca_sem_vencimento': 'Licença sem Vencimento',
  'falta_justificada': 'Falta Justificada',
  'falta_injustificada': 'Falta Injustificada',
  'suspensao': 'Suspensão',
  'outro': 'Outro'
};

export const TIPO_AFASTAMENTO_COLORS: Record<TipoAfastamento, string> = {
  'atestado': 'bg-blue-500 hover:bg-blue-600',
  'ferias': 'bg-green-500 hover:bg-green-600',
  'licenca_maternidade': 'bg-pink-500 hover:bg-pink-600',
  'licenca_paternidade': 'bg-cyan-500 hover:bg-cyan-600',
  'licenca_sem_vencimento': 'bg-gray-500 hover:bg-gray-600',
  'falta_justificada': 'bg-yellow-500 hover:bg-yellow-600',
  'falta_injustificada': 'bg-red-500 hover:bg-red-600',
  'suspensao': 'bg-red-700 hover:bg-red-800',
  'outro': 'bg-purple-500 hover:bg-purple-600'
};