/**
 * Types para o módulo Kanban CRM
 */

export interface KanbanBoard {
  id: string
  nome: string
  descricao: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface KanbanPhase {
  id: string
  board_id: string
  nome: string
  cor: string
  ordem: number
  created_at: string
  updated_at: string
}

export interface KanbanCard {
  id: string
  board_id: string
  phase_id: string
  titulo: string | null
  cliente_nome: string
  cliente_email: string | null
  cliente_telefone: string | null
  cliente_empresa: string | null
  valor_estimado: number | null
  descricao: string | null
  origem: string
  tags: string[]
  obra_id: string | null
  funcionario_responsavel_id: string | null
  ordem: number
  created_at: string
  updated_at: string
}

export interface KanbanCardActivity {
  id: string
  card_id: string
  tipo: 'criado' | 'movido' | 'editado' | 'comentario'
  descricao: string
  dados_anteriores: Record<string, unknown> | null
  dados_novos: Record<string, unknown> | null
  user_id: string | null
  created_at: string
}

export interface CreateCardInput {
  board_id: string
  phase_id: string
  titulo?: string
  cliente_nome: string
  cliente_email?: string
  cliente_telefone?: string
  cliente_empresa?: string
  valor_estimado?: number
  descricao?: string
  origem?: string
  tags?: string[]
  funcionario_responsavel_id?: string
}

export interface UpdateCardInput {
  titulo?: string
  cliente_nome?: string
  cliente_email?: string
  cliente_telefone?: string
  cliente_empresa?: string
  valor_estimado?: number
  descricao?: string
  tags?: string[]
  funcionario_responsavel_id?: string
}

export interface KanbanMetrics {
  totalLeads: number
  valorTotalNegociacao: number
  taxaConversao: number
  leadsAtivos: number
  leadsPorFase: Record<string, number>
}
