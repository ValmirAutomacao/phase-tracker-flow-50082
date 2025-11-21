export interface Curriculo {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  cargo_interesse: string;
  experiencia?: string;
  arquivo_url: string;
  arquivo_nome: string;
  arquivo_tamanho: number;
  data_envio: string;
  status: 'pendente' | 'analisando' | 'aprovado' | 'rejeitado';
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface CurriculoInsert {
  nome: string;
  email: string;
  telefone?: string;
  cargo_interesse: string;
  experiencia?: string;
  arquivo_url: string;
  arquivo_nome: string;
  arquivo_tamanho: number;
}

export interface CurriculoUpdate {
  status?: Curriculo['status'];
  observacoes?: string;
}

export const CARGO_OPTIONS = [
  "Engenheiro Civil",
  "Arquiteto",
  "Mestre de Obras",
  "Encarregado",
  "Pedreiro",
  "Eletricista",
  "Encanador",
  "Pintor",
  "Carpinteiro",
  "Soldador",
  "Operador de Máquinas",
  "Auxiliar de Construção",
  "Técnico em Segurança do Trabalho",
  "Administrativo",
  "Financeiro",
  "Recursos Humanos",
  "Outro"
] as const;

export const STATUS_COLORS = {
  pendente: "bg-yellow-100 text-yellow-800",
  analisando: "bg-blue-100 text-blue-800",
  aprovado: "bg-green-100 text-green-800",
  rejeitado: "bg-red-100 text-red-800"
} as const;

export const STATUS_LABELS = {
  pendente: "Pendente",
  analisando: "Analisando",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado"
} as const;