export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      clientes: {
        Row: {
          contato: Json | null
          created_at: string | null
          documento: string | null
          endereco: Json | null
          id: string
          nome: string
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          contato?: Json | null
          created_at?: string | null
          documento?: string | null
          endereco?: Json | null
          id?: string
          nome: string
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          contato?: Json | null
          created_at?: string | null
          documento?: string | null
          endereco?: Json | null
          id?: string
          nome?: string
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      despesas: {
        Row: {
          categoria: string | null
          cliente_id: string | null
          comprovante_url: string | null
          created_at: string | null
          data_despesa: string
          descricao: string | null
          fornecedor_cnpj: string | null
          id: string
          numero_documento: string | null
          obra_id: string | null
          status: string | null
          updated_at: string | null
          valor: number
        }
        Insert: {
          categoria?: string | null
          cliente_id?: string | null
          comprovante_url?: string | null
          created_at?: string | null
          data_despesa: string
          descricao?: string | null
          fornecedor_cnpj?: string | null
          id?: string
          numero_documento?: string | null
          obra_id?: string | null
          status?: string | null
          updated_at?: string | null
          valor: number
        }
        Update: {
          categoria?: string | null
          cliente_id?: string | null
          comprovante_url?: string | null
          created_at?: string | null
          data_despesa?: string
          descricao?: string | null
          fornecedor_cnpj?: string | null
          id?: string
          numero_documento?: string | null
          obra_id?: string | null
          status?: string | null
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "despesas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "despesas_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      funcionarios: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          email: string | null
          funcao_id: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          email?: string | null
          funcao_id?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          email?: string | null
          funcao_id?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_funcao_id_fkey"
            columns: ["funcao_id"]
            isOneToOne: false
            referencedRelation: "funcoes"
            referencedColumns: ["id"]
          },
        ]
      }
      funcoes: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          setor_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          setor_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          setor_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funcoes_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores"
            referencedColumns: ["id"]
          },
        ]
      }
      obras: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          etapas: Json | null
          id: string
          nome: string
          orcamento: number | null
          progresso: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          etapas?: Json | null
          id?: string
          nome: string
          orcamento?: number | null
          progresso?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          etapas?: Json | null
          id?: string
          nome?: string
          orcamento?: number | null
          progresso?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "obras_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      requisicoes: {
        Row: {
          anexos: Json | null
          created_at: string | null
          data_vencimento: string | null
          descricao: string | null
          funcionario_responsavel_id: string | null
          funcionario_solicitante_id: string | null
          id: string
          obra_id: string | null
          observacoes: string | null
          prioridade: string | null
          status: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          anexos?: Json | null
          created_at?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          funcionario_responsavel_id?: string | null
          funcionario_solicitante_id?: string | null
          id?: string
          obra_id?: string | null
          observacoes?: string | null
          prioridade?: string | null
          status?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          anexos?: Json | null
          created_at?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          funcionario_responsavel_id?: string | null
          funcionario_solicitante_id?: string | null
          id?: string
          obra_id?: string | null
          observacoes?: string | null
          prioridade?: string | null
          status?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requisicoes_funcionario_responsavel_id_fkey"
            columns: ["funcionario_responsavel_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requisicoes_funcionario_solicitante_id_fkey"
            columns: ["funcionario_solicitante_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requisicoes_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      setores: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      videos: {
        Row: {
          arquivo_original_url: string | null
          arquivo_renderizado_url: string | null
          created_at: string | null
          drive_pasta_id: string | null
          drive_subpasta_id: string | null
          duracao_segundos: number | null
          id: string
          n8n_job_id: string | null
          nome: string
          obra_id: string | null
          status_renderizacao: string | null
          updated_at: string | null
        }
        Insert: {
          arquivo_original_url?: string | null
          arquivo_renderizado_url?: string | null
          created_at?: string | null
          drive_pasta_id?: string | null
          drive_subpasta_id?: string | null
          duracao_segundos?: number | null
          id?: string
          n8n_job_id?: string | null
          nome: string
          obra_id?: string | null
          status_renderizacao?: string | null
          updated_at?: string | null
        }
        Update: {
          arquivo_original_url?: string | null
          arquivo_renderizado_url?: string | null
          created_at?: string | null
          drive_pasta_id?: string | null
          drive_subpasta_id?: string | null
          duracao_segundos?: number | null
          id?: string
          n8n_job_id?: string | null
          nome?: string
          obra_id?: string | null
          status_renderizacao?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "videos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// Helper types para compatibilidade com localStorage
export type Cliente = Tables<'clientes'>
export type Obra = Tables<'obras'>
export type Funcionario = Tables<'funcionarios'>
export type Funcao = Tables<'funcoes'>
export type Setor = Tables<'setores'>
export type Despesa = Tables<'despesas'>
export type Video = Tables<'videos'>
export type Requisicao = Tables<'requisicoes'>

// Types para inserção
export type ClienteInsert = TablesInsert<'clientes'>
export type ObraInsert = TablesInsert<'obras'>
export type FuncionarioInsert = TablesInsert<'funcionarios'>
export type FuncaoInsert = TablesInsert<'funcoes'>
export type SetorInsert = TablesInsert<'setores'>
export type DespesaInsert = TablesInsert<'despesas'>
export type VideoInsert = TablesInsert<'videos'>
export type RequisicaoInsert = TablesInsert<'requisicoes'>

// Types para update
export type ClienteUpdate = TablesUpdate<'clientes'>
export type ObraUpdate = TablesUpdate<'obras'>
export type FuncionarioUpdate = TablesUpdate<'funcionarios'>
export type FuncaoUpdate = TablesUpdate<'funcoes'>
export type SetorUpdate = TablesUpdate<'setores'>
export type DespesaUpdate = TablesUpdate<'despesas'>
export type VideoUpdate = TablesUpdate<'videos'>
export type RequisicaoUpdate = TablesUpdate<'requisicoes'>