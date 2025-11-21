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