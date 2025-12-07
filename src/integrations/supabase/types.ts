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
      afastamentos: {
        Row: {
          aprovado_por_id: string | null
          created_at: string | null
          data_aprovacao: string | null
          data_fim: string
          data_inicio: string
          documento_nome: string | null
          documento_tamanho_bytes: number | null
          documento_url: string | null
          funcionario_id: string
          id: string
          motivo: string
          motivo_rejeicao: string | null
          observacoes: string | null
          solicitado_por_id: string
          status: string | null
          tipo_afastamento_id: string
          total_dias: number | null
          updated_at: string | null
        }
        Insert: {
          aprovado_por_id?: string | null
          created_at?: string | null
          data_aprovacao?: string | null
          data_fim: string
          data_inicio: string
          documento_nome?: string | null
          documento_tamanho_bytes?: number | null
          documento_url?: string | null
          funcionario_id: string
          id?: string
          motivo: string
          motivo_rejeicao?: string | null
          observacoes?: string | null
          solicitado_por_id: string
          status?: string | null
          tipo_afastamento_id: string
          total_dias?: number | null
          updated_at?: string | null
        }
        Update: {
          aprovado_por_id?: string | null
          created_at?: string | null
          data_aprovacao?: string | null
          data_fim?: string
          data_inicio?: string
          documento_nome?: string | null
          documento_tamanho_bytes?: number | null
          documento_url?: string | null
          funcionario_id?: string
          id?: string
          motivo?: string
          motivo_rejeicao?: string | null
          observacoes?: string | null
          solicitado_por_id?: string
          status?: string | null
          tipo_afastamento_id?: string
          total_dias?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "afastamentos_aprovado_por_id_fkey"
            columns: ["aprovado_por_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "afastamentos_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "afastamentos_solicitado_por_id_fkey"
            columns: ["solicitado_por_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "afastamentos_tipo_afastamento_id_fkey"
            columns: ["tipo_afastamento_id"]
            isOneToOne: false
            referencedRelation: "tipos_afastamento"
            referencedColumns: ["id"]
          },
        ]
      }
      ajustes_ponto: {
        Row: {
          aprovado_por_id: string | null
          created_at: string | null
          data_ajuste: string | null
          data_nova: string
          data_original: string | null
          documento_url: string | null
          funcionario_id: string
          hora_nova: string
          hora_original: string | null
          id: string
          ip_address: unknown
          justificativa_id: string | null
          justificativa_texto: string
          registro_ponto_id: string | null
          status: string | null
          tipo_registro_novo: string
          tipo_registro_original: string | null
          usuario_ajuste_id: string
        }
        Insert: {
          aprovado_por_id?: string | null
          created_at?: string | null
          data_ajuste?: string | null
          data_nova: string
          data_original?: string | null
          documento_url?: string | null
          funcionario_id: string
          hora_nova: string
          hora_original?: string | null
          id?: string
          ip_address?: unknown
          justificativa_id?: string | null
          justificativa_texto: string
          registro_ponto_id?: string | null
          status?: string | null
          tipo_registro_novo: string
          tipo_registro_original?: string | null
          usuario_ajuste_id: string
        }
        Update: {
          aprovado_por_id?: string | null
          created_at?: string | null
          data_ajuste?: string | null
          data_nova?: string
          data_original?: string | null
          documento_url?: string | null
          funcionario_id?: string
          hora_nova?: string
          hora_original?: string | null
          id?: string
          ip_address?: unknown
          justificativa_id?: string | null
          justificativa_texto?: string
          registro_ponto_id?: string | null
          status?: string | null
          tipo_registro_novo?: string
          tipo_registro_original?: string | null
          usuario_ajuste_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ajustes_ponto_aprovado_por_id_fkey"
            columns: ["aprovado_por_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ajustes_ponto_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ajustes_ponto_justificativa_id_fkey"
            columns: ["justificativa_id"]
            isOneToOne: false
            referencedRelation: "tipos_justificativas_ponto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ajustes_ponto_registro_ponto_id_fkey"
            columns: ["registro_ponto_id"]
            isOneToOne: false
            referencedRelation: "registros_ponto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ajustes_ponto_usuario_ajuste_id_fkey"
            columns: ["usuario_ajuste_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      alocacoes_recursos: {
        Row: {
          atividade_id: string
          atualizado_em: string | null
          atualizado_por: string | null
          criado_em: string | null
          criado_por: string | null
          curva_trabalho: string | null
          custo_total_planejado: number | null
          custo_total_realizado: number | null
          custo_unitario: number | null
          data_fim_alocacao: string | null
          data_inicio_alocacao: string | null
          e_recurso_critico: boolean | null
          horas_por_dia: number | null
          horas_realizadas: number | null
          id: string
          observacoes: string | null
          percentual_dedicacao: number | null
          permite_sobre_alocacao: boolean | null
          prioridade_alocacao: number | null
          quantidade_planejada: number
          quantidade_realizada: number | null
          recurso_id: string
          tipo: Database["public"]["Enums"]["tipo_alocacao"]
          trabalho_distribuido: boolean | null
          unidade: Database["public"]["Enums"]["unidade_medida"]
        }
        Insert: {
          atividade_id: string
          atualizado_em?: string | null
          atualizado_por?: string | null
          criado_em?: string | null
          criado_por?: string | null
          curva_trabalho?: string | null
          custo_total_planejado?: number | null
          custo_total_realizado?: number | null
          custo_unitario?: number | null
          data_fim_alocacao?: string | null
          data_inicio_alocacao?: string | null
          e_recurso_critico?: boolean | null
          horas_por_dia?: number | null
          horas_realizadas?: number | null
          id?: string
          observacoes?: string | null
          percentual_dedicacao?: number | null
          permite_sobre_alocacao?: boolean | null
          prioridade_alocacao?: number | null
          quantidade_planejada?: number
          quantidade_realizada?: number | null
          recurso_id: string
          tipo: Database["public"]["Enums"]["tipo_alocacao"]
          trabalho_distribuido?: boolean | null
          unidade: Database["public"]["Enums"]["unidade_medida"]
        }
        Update: {
          atividade_id?: string
          atualizado_em?: string | null
          atualizado_por?: string | null
          criado_em?: string | null
          criado_por?: string | null
          curva_trabalho?: string | null
          custo_total_planejado?: number | null
          custo_total_realizado?: number | null
          custo_unitario?: number | null
          data_fim_alocacao?: string | null
          data_inicio_alocacao?: string | null
          e_recurso_critico?: boolean | null
          horas_por_dia?: number | null
          horas_realizadas?: number | null
          id?: string
          observacoes?: string | null
          percentual_dedicacao?: number | null
          permite_sobre_alocacao?: boolean | null
          prioridade_alocacao?: number | null
          quantidade_planejada?: number
          quantidade_realizada?: number | null
          recurso_id?: string
          tipo?: Database["public"]["Enums"]["tipo_alocacao"]
          trabalho_distribuido?: boolean | null
          unidade?: Database["public"]["Enums"]["unidade_medida"]
        }
        Relationships: [
          {
            foreignKeyName: "alocacoes_recursos_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "eap_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alocacoes_recursos_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "vw_alocacoes_detalhadas"
            referencedColumns: ["atividade_id"]
          },
          {
            foreignKeyName: "alocacoes_recursos_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "vw_dependencias_detalhadas"
            referencedColumns: ["predecessora_id"]
          },
          {
            foreignKeyName: "alocacoes_recursos_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "vw_dependencias_detalhadas"
            referencedColumns: ["sucessora_id"]
          },
          {
            foreignKeyName: "alocacoes_recursos_recurso_id_fkey"
            columns: ["recurso_id"]
            isOneToOne: false
            referencedRelation: "recursos_empresa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alocacoes_recursos_recurso_id_fkey"
            columns: ["recurso_id"]
            isOneToOne: false
            referencedRelation: "vw_alocacoes_detalhadas"
            referencedColumns: ["recurso_id"]
          },
          {
            foreignKeyName: "alocacoes_recursos_recurso_id_fkey"
            columns: ["recurso_id"]
            isOneToOne: false
            referencedRelation: "vw_utilizacao_recursos"
            referencedColumns: ["recurso_id"]
          },
        ]
      }
      ativos: {
        Row: {
          created_at: string | null
          custo_hora: number | null
          id: string
          marca: string | null
          modelo: string | null
          nome: string
          placa_serie: string | null
          status: string | null
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custo_hora?: number | null
          id?: string
          marca?: string | null
          modelo?: string | null
          nome: string
          placa_serie?: string | null
          status?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custo_hora?: number | null
          id?: string
          marca?: string | null
          modelo?: string | null
          nome?: string
          placa_serie?: string | null
          status?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      auditoria_ponto: {
        Row: {
          acao: string
          created_at: string | null
          dados_anteriores: Json | null
          dados_novos: Json | null
          data_acao: string | null
          descricao: string
          funcionario_id: string
          id: string
          ip_address: unknown
          registro_id: string
          tabela_afetada: string
          user_agent: string | null
          usuario_id: string
        }
        Insert: {
          acao: string
          created_at?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          data_acao?: string | null
          descricao: string
          funcionario_id: string
          id?: string
          ip_address?: unknown
          registro_id: string
          tabela_afetada: string
          user_agent?: string | null
          usuario_id: string
        }
        Update: {
          acao?: string
          created_at?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          data_acao?: string | null
          descricao?: string
          funcionario_id?: string
          id?: string
          ip_address?: unknown
          registro_id?: string
          tabela_afetada?: string
          user_agent?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_ponto_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditoria_ponto_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      baselines_atividades: {
        Row: {
          atividade_id: string
          baseline_id: string
          codigo_wbs_baseline: string
          criado_em: string | null
          custo_fixo_baseline: number | null
          custo_total_baseline: number | null
          data_fim_baseline: string | null
          data_inicio_baseline: string | null
          duracao_planejada_baseline: number | null
          e_critica_baseline: boolean | null
          e_marco_baseline: boolean | null
          id: string
          item_pai_id_baseline: string | null
          nivel_hierarquia_baseline: number
          nome_baseline: string
          notas_baseline: string | null
          percentual_conclusao_baseline: number | null
          posicao_irmao_baseline: number
          prioridade_baseline: number | null
          status_baseline:
            | Database["public"]["Enums"]["status_atividade"]
            | null
          tipo_baseline: Database["public"]["Enums"]["tipo_item_wbs"]
          trabalho_planejado_baseline: number | null
        }
        Insert: {
          atividade_id: string
          baseline_id: string
          codigo_wbs_baseline: string
          criado_em?: string | null
          custo_fixo_baseline?: number | null
          custo_total_baseline?: number | null
          data_fim_baseline?: string | null
          data_inicio_baseline?: string | null
          duracao_planejada_baseline?: number | null
          e_critica_baseline?: boolean | null
          e_marco_baseline?: boolean | null
          id?: string
          item_pai_id_baseline?: string | null
          nivel_hierarquia_baseline: number
          nome_baseline: string
          notas_baseline?: string | null
          percentual_conclusao_baseline?: number | null
          posicao_irmao_baseline: number
          prioridade_baseline?: number | null
          status_baseline?:
            | Database["public"]["Enums"]["status_atividade"]
            | null
          tipo_baseline: Database["public"]["Enums"]["tipo_item_wbs"]
          trabalho_planejado_baseline?: number | null
        }
        Update: {
          atividade_id?: string
          baseline_id?: string
          codigo_wbs_baseline?: string
          criado_em?: string | null
          custo_fixo_baseline?: number | null
          custo_total_baseline?: number | null
          data_fim_baseline?: string | null
          data_inicio_baseline?: string | null
          duracao_planejada_baseline?: number | null
          e_critica_baseline?: boolean | null
          e_marco_baseline?: boolean | null
          id?: string
          item_pai_id_baseline?: string | null
          nivel_hierarquia_baseline?: number
          nome_baseline?: string
          notas_baseline?: string | null
          percentual_conclusao_baseline?: number | null
          posicao_irmao_baseline?: number
          prioridade_baseline?: number | null
          status_baseline?:
            | Database["public"]["Enums"]["status_atividade"]
            | null
          tipo_baseline?: Database["public"]["Enums"]["tipo_item_wbs"]
          trabalho_planejado_baseline?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "baselines_atividades_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "eap_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "baselines_atividades_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "vw_alocacoes_detalhadas"
            referencedColumns: ["atividade_id"]
          },
          {
            foreignKeyName: "baselines_atividades_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "vw_dependencias_detalhadas"
            referencedColumns: ["predecessora_id"]
          },
          {
            foreignKeyName: "baselines_atividades_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "vw_dependencias_detalhadas"
            referencedColumns: ["sucessora_id"]
          },
          {
            foreignKeyName: "baselines_atividades_baseline_id_fkey"
            columns: ["baseline_id"]
            isOneToOne: false
            referencedRelation: "baselines_cronogramas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "baselines_atividades_baseline_id_fkey"
            columns: ["baseline_id"]
            isOneToOne: false
            referencedRelation: "vw_baselines_resumo"
            referencedColumns: ["id"]
          },
        ]
      }
      baselines_cronogramas: {
        Row: {
          aprovado_por: string | null
          atualizado_em: string | null
          criado_em: string | null
          criado_por: string | null
          cronograma_id: string
          custo_total_baseline: number | null
          data_aprovacao: string | null
          data_baseline: string
          data_fim_baseline: string | null
          data_inicio_baseline: string
          descricao: string | null
          duracao_total_dias: number | null
          id: string
          nome: string
          numero_versao: number
          observacoes: string | null
          orcamento_total_baseline: number | null
          status: Database["public"]["Enums"]["status_baseline"] | null
          tipo: Database["public"]["Enums"]["tipo_baseline"]
          total_atividades: number | null
          total_marcos: number | null
          trabalho_total_baseline: number | null
        }
        Insert: {
          aprovado_por?: string | null
          atualizado_em?: string | null
          criado_em?: string | null
          criado_por?: string | null
          cronograma_id: string
          custo_total_baseline?: number | null
          data_aprovacao?: string | null
          data_baseline: string
          data_fim_baseline?: string | null
          data_inicio_baseline: string
          descricao?: string | null
          duracao_total_dias?: number | null
          id?: string
          nome: string
          numero_versao?: number
          observacoes?: string | null
          orcamento_total_baseline?: number | null
          status?: Database["public"]["Enums"]["status_baseline"] | null
          tipo: Database["public"]["Enums"]["tipo_baseline"]
          total_atividades?: number | null
          total_marcos?: number | null
          trabalho_total_baseline?: number | null
        }
        Update: {
          aprovado_por?: string | null
          atualizado_em?: string | null
          criado_em?: string | null
          criado_por?: string | null
          cronograma_id?: string
          custo_total_baseline?: number | null
          data_aprovacao?: string | null
          data_baseline?: string
          data_fim_baseline?: string | null
          data_inicio_baseline?: string
          descricao?: string | null
          duracao_total_dias?: number | null
          id?: string
          nome?: string
          numero_versao?: number
          observacoes?: string | null
          orcamento_total_baseline?: number | null
          status?: Database["public"]["Enums"]["status_baseline"] | null
          tipo?: Database["public"]["Enums"]["tipo_baseline"]
          total_atividades?: number | null
          total_marcos?: number | null
          trabalho_total_baseline?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "baselines_cronogramas_cronograma_id_fkey"
            columns: ["cronograma_id"]
            isOneToOne: false
            referencedRelation: "cronogramas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "baselines_cronogramas_cronograma_id_fkey"
            columns: ["cronograma_id"]
            isOneToOne: false
            referencedRelation: "vw_alocacoes_detalhadas"
            referencedColumns: ["cronograma_id"]
          },
          {
            foreignKeyName: "baselines_cronogramas_cronograma_id_fkey"
            columns: ["cronograma_id"]
            isOneToOne: false
            referencedRelation: "vw_dependencias_detalhadas"
            referencedColumns: ["cronograma_id"]
          },
        ]
      }
      calendario_excecoes: {
        Row: {
          calendario_id: string
          data_excecao: string
          descricao: string | null
          id: string
          tipo_excecao: string
          trabalha: boolean | null
        }
        Insert: {
          calendario_id: string
          data_excecao: string
          descricao?: string | null
          id?: string
          tipo_excecao: string
          trabalha?: boolean | null
        }
        Update: {
          calendario_id?: string
          data_excecao?: string
          descricao?: string | null
          id?: string
          tipo_excecao?: string
          trabalha?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "calendario_excecoes_calendario_id_fkey"
            columns: ["calendario_id"]
            isOneToOne: false
            referencedRelation: "calendarios_trabalho"
            referencedColumns: ["id"]
          },
        ]
      }
      calendarios_trabalho: {
        Row: {
          created_at: string | null
          descricao: string | null
          domingo_util: boolean | null
          empresa_padrao: boolean | null
          fim_manha: string | null
          fim_tarde: string | null
          horas_dia: number | null
          id: string
          inicio_manha: string | null
          inicio_tarde: string | null
          nome: string
          quarta_util: boolean | null
          quinta_util: boolean | null
          sabado_util: boolean | null
          segunda_util: boolean | null
          sexta_util: boolean | null
          terca_util: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          domingo_util?: boolean | null
          empresa_padrao?: boolean | null
          fim_manha?: string | null
          fim_tarde?: string | null
          horas_dia?: number | null
          id?: string
          inicio_manha?: string | null
          inicio_tarde?: string | null
          nome: string
          quarta_util?: boolean | null
          quinta_util?: boolean | null
          sabado_util?: boolean | null
          segunda_util?: boolean | null
          sexta_util?: boolean | null
          terca_util?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          domingo_util?: boolean | null
          empresa_padrao?: boolean | null
          fim_manha?: string | null
          fim_tarde?: string | null
          horas_dia?: number | null
          id?: string
          inicio_manha?: string | null
          inicio_tarde?: string | null
          nome?: string
          quarta_util?: boolean | null
          quinta_util?: boolean | null
          sabado_util?: boolean | null
          segunda_util?: boolean | null
          sexta_util?: boolean | null
          terca_util?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cartoes_credito: {
        Row: {
          ativo: boolean | null
          bandeira: string
          created_at: string | null
          funcionario_id: string
          id: string
          numero_cartao_hash: string
          numero_cartao_masked: string
          observacoes: string | null
          updated_at: string | null
          vencimento_ano: number
          vencimento_mes: number
        }
        Insert: {
          ativo?: boolean | null
          bandeira: string
          created_at?: string | null
          funcionario_id: string
          id?: string
          numero_cartao_hash: string
          numero_cartao_masked: string
          observacoes?: string | null
          updated_at?: string | null
          vencimento_ano: number
          vencimento_mes: number
        }
        Update: {
          ativo?: boolean | null
          bandeira?: string
          created_at?: string | null
          funcionario_id?: string
          id?: string
          numero_cartao_hash?: string
          numero_cartao_masked?: string
          observacoes?: string | null
          updated_at?: string | null
          vencimento_ano?: number
          vencimento_mes?: number
        }
        Relationships: [
          {
            foreignKeyName: "cartoes_credito_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          ativa: boolean | null
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          ativa?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          ativa?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
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
      comprovantes_ponto: {
        Row: {
          created_at: string | null
          data_emissao: string | null
          funcionario_id: string
          hash_verificacao: string | null
          id: string
          pdf_url: string | null
          periodo_fim: string | null
          periodo_inicio: string | null
          registro_ponto_id: string
          tipo_comprovante: string
        }
        Insert: {
          created_at?: string | null
          data_emissao?: string | null
          funcionario_id: string
          hash_verificacao?: string | null
          id?: string
          pdf_url?: string | null
          periodo_fim?: string | null
          periodo_inicio?: string | null
          registro_ponto_id: string
          tipo_comprovante?: string
        }
        Update: {
          created_at?: string | null
          data_emissao?: string | null
          funcionario_id?: string
          hash_verificacao?: string | null
          id?: string
          pdf_url?: string | null
          periodo_fim?: string | null
          periodo_inicio?: string | null
          registro_ponto_id?: string
          tipo_comprovante?: string
        }
        Relationships: [
          {
            foreignKeyName: "comprovantes_ponto_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comprovantes_ponto_registro_ponto_id_fkey"
            columns: ["registro_ponto_id"]
            isOneToOne: false
            referencedRelation: "registros_ponto"
            referencedColumns: ["id"]
          },
        ]
      }
      cronogramas: {
        Row: {
          atualizado_por: string | null
          auto_nivelamento: boolean | null
          calendario_id: string
          criado_por: string | null
          custo_realizado: number | null
          data_atualizacao: string | null
          data_criacao: string | null
          data_fim: string | null
          data_inicio: string
          descricao: string | null
          id: string
          nome: string
          obra_id: string | null
          orcamento_total: number | null
          percentual_conclusao: number | null
          permite_sobreposicao: boolean | null
          status: string | null
          unidade_duracao: string | null
          versao: number | null
        }
        Insert: {
          atualizado_por?: string | null
          auto_nivelamento?: boolean | null
          calendario_id: string
          criado_por?: string | null
          custo_realizado?: number | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          data_fim?: string | null
          data_inicio: string
          descricao?: string | null
          id?: string
          nome: string
          obra_id?: string | null
          orcamento_total?: number | null
          percentual_conclusao?: number | null
          permite_sobreposicao?: boolean | null
          status?: string | null
          unidade_duracao?: string | null
          versao?: number | null
        }
        Update: {
          atualizado_por?: string | null
          auto_nivelamento?: boolean | null
          calendario_id?: string
          criado_por?: string | null
          custo_realizado?: number | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          data_fim?: string | null
          data_inicio?: string
          descricao?: string | null
          id?: string
          nome?: string
          obra_id?: string | null
          orcamento_total?: number | null
          percentual_conclusao?: number | null
          permite_sobreposicao?: boolean | null
          status?: string | null
          unidade_duracao?: string | null
          versao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cronogramas_calendario_id_fkey"
            columns: ["calendario_id"]
            isOneToOne: false
            referencedRelation: "calendarios_trabalho"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cronogramas_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculos: {
        Row: {
          arquivo_nome: string | null
          arquivo_tamanho: number | null
          arquivo_url: string | null
          cargo_interesse: string | null
          created_at: string | null
          data_envio: string | null
          email: string
          experiencia: string | null
          id: string
          nome: string
          observacoes: string | null
          status: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          arquivo_nome?: string | null
          arquivo_tamanho?: number | null
          arquivo_url?: string | null
          cargo_interesse?: string | null
          created_at?: string | null
          data_envio?: string | null
          email: string
          experiencia?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          status?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          arquivo_nome?: string | null
          arquivo_tamanho?: number | null
          arquivo_url?: string | null
          cargo_interesse?: string | null
          created_at?: string | null
          data_envio?: string | null
          email?: string
          experiencia?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          status?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      dependencias_atividades: {
        Row: {
          aplicar_calendario: boolean | null
          atividade_predecessora_id: string
          atividade_sucessora_id: string
          criado_em: string | null
          criado_por: string | null
          defasagem_horas: number | null
          descricao: string | null
          e_obrigatoria: boolean | null
          id: string
          tipo: Database["public"]["Enums"]["tipo_dependencia"]
        }
        Insert: {
          aplicar_calendario?: boolean | null
          atividade_predecessora_id: string
          atividade_sucessora_id: string
          criado_em?: string | null
          criado_por?: string | null
          defasagem_horas?: number | null
          descricao?: string | null
          e_obrigatoria?: boolean | null
          id?: string
          tipo?: Database["public"]["Enums"]["tipo_dependencia"]
        }
        Update: {
          aplicar_calendario?: boolean | null
          atividade_predecessora_id?: string
          atividade_sucessora_id?: string
          criado_em?: string | null
          criado_por?: string | null
          defasagem_horas?: number | null
          descricao?: string | null
          e_obrigatoria?: boolean | null
          id?: string
          tipo?: Database["public"]["Enums"]["tipo_dependencia"]
        }
        Relationships: [
          {
            foreignKeyName: "dependencias_atividades_atividade_predecessora_id_fkey"
            columns: ["atividade_predecessora_id"]
            isOneToOne: false
            referencedRelation: "eap_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dependencias_atividades_atividade_predecessora_id_fkey"
            columns: ["atividade_predecessora_id"]
            isOneToOne: false
            referencedRelation: "vw_alocacoes_detalhadas"
            referencedColumns: ["atividade_id"]
          },
          {
            foreignKeyName: "dependencias_atividades_atividade_predecessora_id_fkey"
            columns: ["atividade_predecessora_id"]
            isOneToOne: false
            referencedRelation: "vw_dependencias_detalhadas"
            referencedColumns: ["predecessora_id"]
          },
          {
            foreignKeyName: "dependencias_atividades_atividade_predecessora_id_fkey"
            columns: ["atividade_predecessora_id"]
            isOneToOne: false
            referencedRelation: "vw_dependencias_detalhadas"
            referencedColumns: ["sucessora_id"]
          },
          {
            foreignKeyName: "dependencias_atividades_atividade_sucessora_id_fkey"
            columns: ["atividade_sucessora_id"]
            isOneToOne: false
            referencedRelation: "eap_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dependencias_atividades_atividade_sucessora_id_fkey"
            columns: ["atividade_sucessora_id"]
            isOneToOne: false
            referencedRelation: "vw_alocacoes_detalhadas"
            referencedColumns: ["atividade_id"]
          },
          {
            foreignKeyName: "dependencias_atividades_atividade_sucessora_id_fkey"
            columns: ["atividade_sucessora_id"]
            isOneToOne: false
            referencedRelation: "vw_dependencias_detalhadas"
            referencedColumns: ["predecessora_id"]
          },
          {
            foreignKeyName: "dependencias_atividades_atividade_sucessora_id_fkey"
            columns: ["atividade_sucessora_id"]
            isOneToOne: false
            referencedRelation: "vw_dependencias_detalhadas"
            referencedColumns: ["sucessora_id"]
          },
        ]
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
          requisicao_id: string | null
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
          requisicao_id?: string | null
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
          requisicao_id?: string | null
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
          {
            foreignKeyName: "despesas_requisicao_id_fkey"
            columns: ["requisicao_id"]
            isOneToOne: false
            referencedRelation: "requisicoes"
            referencedColumns: ["id"]
          },
        ]
      }
      despesas_variaveis: {
        Row: {
          cartao_vinculado_id: string | null
          categorias: Json | null
          cnpj_fornecedor: string | null
          comprador_funcionario_id: string | null
          comprovante_url: string | null
          created_at: string | null
          dados_ocr: Json | null
          data_compra: string | null
          data_lancamento: string | null
          descricao: string | null
          forma_pagamento: string
          funcionario_nome_ocr: string | null
          funcionario_telefone_ocr: string | null
          id: string
          nome_fornecedor: string | null
          nr_documento: string | null
          numero_parcelas: number | null
          obra_id: string | null
          origem_dados: string | null
          status_aprovacao: string | null
          status_ocr: string | null
          updated_at: string | null
          valor_compra: number
        }
        Insert: {
          cartao_vinculado_id?: string | null
          categorias?: Json | null
          cnpj_fornecedor?: string | null
          comprador_funcionario_id?: string | null
          comprovante_url?: string | null
          created_at?: string | null
          dados_ocr?: Json | null
          data_compra?: string | null
          data_lancamento?: string | null
          descricao?: string | null
          forma_pagamento: string
          funcionario_nome_ocr?: string | null
          funcionario_telefone_ocr?: string | null
          id?: string
          nome_fornecedor?: string | null
          nr_documento?: string | null
          numero_parcelas?: number | null
          obra_id?: string | null
          origem_dados?: string | null
          status_aprovacao?: string | null
          status_ocr?: string | null
          updated_at?: string | null
          valor_compra: number
        }
        Update: {
          cartao_vinculado_id?: string | null
          categorias?: Json | null
          cnpj_fornecedor?: string | null
          comprador_funcionario_id?: string | null
          comprovante_url?: string | null
          created_at?: string | null
          dados_ocr?: Json | null
          data_compra?: string | null
          data_lancamento?: string | null
          descricao?: string | null
          forma_pagamento?: string
          funcionario_nome_ocr?: string | null
          funcionario_telefone_ocr?: string | null
          id?: string
          nome_fornecedor?: string | null
          nr_documento?: string | null
          numero_parcelas?: number | null
          obra_id?: string | null
          origem_dados?: string | null
          status_aprovacao?: string | null
          status_ocr?: string | null
          updated_at?: string | null
          valor_compra?: number
        }
        Relationships: [
          {
            foreignKeyName: "despesas_variaveis_comprador_funcionario_id_fkey"
            columns: ["comprador_funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "despesas_variaveis_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_despesas_variaveis_cartao_vinculado"
            columns: ["cartao_vinculado_id"]
            isOneToOne: false
            referencedRelation: "cartoes_credito"
            referencedColumns: ["id"]
          },
        ]
      }
      disponibilidade_recursos: {
        Row: {
          criado_em: string | null
          criado_por: string | null
          data_fim: string
          data_inicio: string
          e_periodo_ferias: boolean | null
          e_periodo_licenca: boolean | null
          horas_domingo: number | null
          horas_quarta: number | null
          horas_quinta: number | null
          horas_sabado: number | null
          horas_segunda: number | null
          horas_sexta: number | null
          horas_terca: number | null
          id: string
          multiplicador_custo: number | null
          observacoes: string | null
          recurso_id: string
        }
        Insert: {
          criado_em?: string | null
          criado_por?: string | null
          data_fim: string
          data_inicio: string
          e_periodo_ferias?: boolean | null
          e_periodo_licenca?: boolean | null
          horas_domingo?: number | null
          horas_quarta?: number | null
          horas_quinta?: number | null
          horas_sabado?: number | null
          horas_segunda?: number | null
          horas_sexta?: number | null
          horas_terca?: number | null
          id?: string
          multiplicador_custo?: number | null
          observacoes?: string | null
          recurso_id: string
        }
        Update: {
          criado_em?: string | null
          criado_por?: string | null
          data_fim?: string
          data_inicio?: string
          e_periodo_ferias?: boolean | null
          e_periodo_licenca?: boolean | null
          horas_domingo?: number | null
          horas_quarta?: number | null
          horas_quinta?: number | null
          horas_sabado?: number | null
          horas_segunda?: number | null
          horas_sexta?: number | null
          horas_terca?: number | null
          id?: string
          multiplicador_custo?: number | null
          observacoes?: string | null
          recurso_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "disponibilidade_recursos_recurso_id_fkey"
            columns: ["recurso_id"]
            isOneToOne: false
            referencedRelation: "recursos_empresa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disponibilidade_recursos_recurso_id_fkey"
            columns: ["recurso_id"]
            isOneToOne: false
            referencedRelation: "vw_alocacoes_detalhadas"
            referencedColumns: ["recurso_id"]
          },
          {
            foreignKeyName: "disponibilidade_recursos_recurso_id_fkey"
            columns: ["recurso_id"]
            isOneToOne: false
            referencedRelation: "vw_utilizacao_recursos"
            referencedColumns: ["recurso_id"]
          },
        ]
      }
      eap_itens: {
        Row: {
          atualizado_por: string | null
          codigo_wbs: string
          criado_por: string | null
          cronograma_id: string
          custo_fixo: number | null
          custo_total_planejado: number | null
          custo_total_realizado: number | null
          custo_variavel: number | null
          data_atualizacao: string | null
          data_criacao: string | null
          data_fim_planejada: string | null
          data_fim_real: string | null
          data_inicio_planejada: string | null
          data_inicio_real: string | null
          data_restricao: string | null
          descricao: string | null
          duracao_planejada: number | null
          duracao_realizada: number | null
          e_critica: boolean | null
          e_marco: boolean | null
          e_resumo: boolean | null
          folga_livre: number | null
          folga_total: number | null
          id: string
          item_pai_id: string | null
          nivel_hierarquia: number
          nome: string
          notas: string | null
          percentual_conclusao: number | null
          percentual_fisico: number | null
          permite_divisao: boolean | null
          posicao_irmao: number
          prioridade: number | null
          status: Database["public"]["Enums"]["status_atividade"] | null
          tipo: Database["public"]["Enums"]["tipo_item_wbs"]
          tipo_restricao: string | null
          trabalho_planejado: number | null
          trabalho_realizado: number | null
          versao: number | null
        }
        Insert: {
          atualizado_por?: string | null
          codigo_wbs: string
          criado_por?: string | null
          cronograma_id: string
          custo_fixo?: number | null
          custo_total_planejado?: number | null
          custo_total_realizado?: number | null
          custo_variavel?: number | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          data_fim_planejada?: string | null
          data_fim_real?: string | null
          data_inicio_planejada?: string | null
          data_inicio_real?: string | null
          data_restricao?: string | null
          descricao?: string | null
          duracao_planejada?: number | null
          duracao_realizada?: number | null
          e_critica?: boolean | null
          e_marco?: boolean | null
          e_resumo?: boolean | null
          folga_livre?: number | null
          folga_total?: number | null
          id?: string
          item_pai_id?: string | null
          nivel_hierarquia?: number
          nome: string
          notas?: string | null
          percentual_conclusao?: number | null
          percentual_fisico?: number | null
          permite_divisao?: boolean | null
          posicao_irmao?: number
          prioridade?: number | null
          status?: Database["public"]["Enums"]["status_atividade"] | null
          tipo: Database["public"]["Enums"]["tipo_item_wbs"]
          tipo_restricao?: string | null
          trabalho_planejado?: number | null
          trabalho_realizado?: number | null
          versao?: number | null
        }
        Update: {
          atualizado_por?: string | null
          codigo_wbs?: string
          criado_por?: string | null
          cronograma_id?: string
          custo_fixo?: number | null
          custo_total_planejado?: number | null
          custo_total_realizado?: number | null
          custo_variavel?: number | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          data_fim_planejada?: string | null
          data_fim_real?: string | null
          data_inicio_planejada?: string | null
          data_inicio_real?: string | null
          data_restricao?: string | null
          descricao?: string | null
          duracao_planejada?: number | null
          duracao_realizada?: number | null
          e_critica?: boolean | null
          e_marco?: boolean | null
          e_resumo?: boolean | null
          folga_livre?: number | null
          folga_total?: number | null
          id?: string
          item_pai_id?: string | null
          nivel_hierarquia?: number
          nome?: string
          notas?: string | null
          percentual_conclusao?: number | null
          percentual_fisico?: number | null
          permite_divisao?: boolean | null
          posicao_irmao?: number
          prioridade?: number | null
          status?: Database["public"]["Enums"]["status_atividade"] | null
          tipo?: Database["public"]["Enums"]["tipo_item_wbs"]
          tipo_restricao?: string | null
          trabalho_planejado?: number | null
          trabalho_realizado?: number | null
          versao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "eap_itens_cronograma_id_fkey"
            columns: ["cronograma_id"]
            isOneToOne: false
            referencedRelation: "cronogramas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eap_itens_cronograma_id_fkey"
            columns: ["cronograma_id"]
            isOneToOne: false
            referencedRelation: "vw_alocacoes_detalhadas"
            referencedColumns: ["cronograma_id"]
          },
          {
            foreignKeyName: "eap_itens_cronograma_id_fkey"
            columns: ["cronograma_id"]
            isOneToOne: false
            referencedRelation: "vw_dependencias_detalhadas"
            referencedColumns: ["cronograma_id"]
          },
          {
            foreignKeyName: "eap_itens_item_pai_id_fkey"
            columns: ["item_pai_id"]
            isOneToOne: false
            referencedRelation: "eap_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eap_itens_item_pai_id_fkey"
            columns: ["item_pai_id"]
            isOneToOne: false
            referencedRelation: "vw_alocacoes_detalhadas"
            referencedColumns: ["atividade_id"]
          },
          {
            foreignKeyName: "eap_itens_item_pai_id_fkey"
            columns: ["item_pai_id"]
            isOneToOne: false
            referencedRelation: "vw_dependencias_detalhadas"
            referencedColumns: ["predecessora_id"]
          },
          {
            foreignKeyName: "eap_itens_item_pai_id_fkey"
            columns: ["item_pai_id"]
            isOneToOne: false
            referencedRelation: "vw_dependencias_detalhadas"
            referencedColumns: ["sucessora_id"]
          },
        ]
      }
      formas_pagamento: {
        Row: {
          ativo: boolean | null
          codigo: string
          created_at: string | null
          descricao: string | null
          icone: string | null
          id: string
          nome: string
          ordem: number | null
          permite_parcelamento: boolean | null
          requer_cartao: boolean | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          codigo: string
          created_at?: string | null
          descricao?: string | null
          icone?: string | null
          id?: string
          nome: string
          ordem?: number | null
          permite_parcelamento?: boolean | null
          requer_cartao?: boolean | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          codigo?: string
          created_at?: string | null
          descricao?: string | null
          icone?: string | null
          id?: string
          nome?: string
          ordem?: number | null
          permite_parcelamento?: boolean | null
          requer_cartao?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      funcionarios: {
        Row: {
          ativo: boolean | null
          cpf: string | null
          created_at: string | null
          ctps: string | null
          data_admissao: string | null
          email: string | null
          funcao_id: string | null
          id: string
          jornada_trabalho_id: string | null
          nome: string
          senha_ponto: string | null
          telefone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          cpf?: string | null
          created_at?: string | null
          ctps?: string | null
          data_admissao?: string | null
          email?: string | null
          funcao_id?: string | null
          id?: string
          jornada_trabalho_id?: string | null
          nome: string
          senha_ponto?: string | null
          telefone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          cpf?: string | null
          created_at?: string | null
          ctps?: string | null
          data_admissao?: string | null
          email?: string | null
          funcao_id?: string | null
          id?: string
          jornada_trabalho_id?: string | null
          nome?: string
          senha_ponto?: string | null
          telefone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_funcao_id_fkey"
            columns: ["funcao_id"]
            isOneToOne: false
            referencedRelation: "funcoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funcionarios_jornada_trabalho_id_fkey"
            columns: ["jornada_trabalho_id"]
            isOneToOne: false
            referencedRelation: "jornadas_trabalho"
            referencedColumns: ["id"]
          },
        ]
      }
      funcoes: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          nivel: string | null
          nome: string
          permissoes: Json | null
          setor_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nivel?: string | null
          nome: string
          permissoes?: Json | null
          setor_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nivel?: string | null
          nome?: string
          permissoes?: Json | null
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
      itens_requisicao: {
        Row: {
          comprado: boolean | null
          created_at: string | null
          descricao: string
          id: string
          numero: number
          observacoes: string | null
          quantidade: number
          quantidade_comprada: number | null
          requisicao_id: string
          unidade_medida: string
          updated_at: string | null
          valor_unitario: number | null
        }
        Insert: {
          comprado?: boolean | null
          created_at?: string | null
          descricao: string
          id?: string
          numero: number
          observacoes?: string | null
          quantidade?: number
          quantidade_comprada?: number | null
          requisicao_id: string
          unidade_medida?: string
          updated_at?: string | null
          valor_unitario?: number | null
        }
        Update: {
          comprado?: boolean | null
          created_at?: string | null
          descricao?: string
          id?: string
          numero?: number
          observacoes?: string | null
          quantidade?: number
          quantidade_comprada?: number | null
          requisicao_id?: string
          unidade_medida?: string
          updated_at?: string | null
          valor_unitario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "itens_requisicao_requisicao_id_fkey"
            columns: ["requisicao_id"]
            isOneToOne: false
            referencedRelation: "requisicoes"
            referencedColumns: ["id"]
          },
        ]
      }
      jornadas_trabalho: {
        Row: {
          ativo: boolean | null
          carga_horaria_diaria: number
          created_at: string | null
          descricao: string | null
          duracao_intervalo: number | null
          id: string
          nome: string
          pe_esperado: string | null
          ps_esperado: string | null
          se_esperado: string | null
          ss_esperado: string | null
          tem_intervalo: boolean | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          carga_horaria_diaria?: number
          created_at?: string | null
          descricao?: string | null
          duracao_intervalo?: number | null
          id?: string
          nome: string
          pe_esperado?: string | null
          ps_esperado?: string | null
          se_esperado?: string | null
          ss_esperado?: string | null
          tem_intervalo?: boolean | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          carga_horaria_diaria?: number
          created_at?: string | null
          descricao?: string | null
          duracao_intervalo?: number | null
          id?: string
          nome?: string
          pe_esperado?: string | null
          ps_esperado?: string | null
          se_esperado?: string | null
          ss_esperado?: string | null
          tem_intervalo?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      kanban_boards: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      kanban_card_activities: {
        Row: {
          card_id: string
          created_at: string | null
          dados_anteriores: Json | null
          dados_novos: Json | null
          descricao: string
          id: string
          tipo: string
          user_id: string | null
        }
        Insert: {
          card_id: string
          created_at?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          descricao: string
          id?: string
          tipo: string
          user_id?: string | null
        }
        Update: {
          card_id?: string
          created_at?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          descricao?: string
          id?: string
          tipo?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kanban_card_activities_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "kanban_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_cards: {
        Row: {
          board_id: string
          cliente_email: string | null
          cliente_empresa: string | null
          cliente_nome: string
          cliente_telefone: string | null
          created_at: string | null
          descricao: string | null
          funcionario_responsavel_id: string | null
          id: string
          obra_id: string | null
          ordem: number
          origem: string
          phase_id: string
          tags: Json | null
          titulo: string | null
          updated_at: string | null
          valor_estimado: number | null
        }
        Insert: {
          board_id: string
          cliente_email?: string | null
          cliente_empresa?: string | null
          cliente_nome: string
          cliente_telefone?: string | null
          created_at?: string | null
          descricao?: string | null
          funcionario_responsavel_id?: string | null
          id?: string
          obra_id?: string | null
          ordem?: number
          origem?: string
          phase_id: string
          tags?: Json | null
          titulo?: string | null
          updated_at?: string | null
          valor_estimado?: number | null
        }
        Update: {
          board_id?: string
          cliente_email?: string | null
          cliente_empresa?: string | null
          cliente_nome?: string
          cliente_telefone?: string | null
          created_at?: string | null
          descricao?: string | null
          funcionario_responsavel_id?: string | null
          id?: string
          obra_id?: string | null
          ordem?: number
          origem?: string
          phase_id?: string
          tags?: Json | null
          titulo?: string | null
          updated_at?: string | null
          valor_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kanban_cards_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "kanban_boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kanban_cards_funcionario_responsavel_id_fkey"
            columns: ["funcionario_responsavel_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kanban_cards_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kanban_cards_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "kanban_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_phases: {
        Row: {
          board_id: string
          cor: string
          created_at: string | null
          id: string
          nome: string
          ordem: number
          updated_at: string | null
        }
        Insert: {
          board_id: string
          cor: string
          created_at?: string | null
          id?: string
          nome: string
          ordem: number
          updated_at?: string | null
        }
        Update: {
          board_id?: string
          cor?: string
          created_at?: string | null
          id?: string
          nome?: string
          ordem?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kanban_phases_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "kanban_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      obras: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          cliente_id: string | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          endereco: string | null
          estado: string | null
          etapas: Json | null
          id: string
          nome: string
          numero: string | null
          orcamento: number | null
          progresso: number | null
          status: string | null
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cliente_id?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          endereco?: string | null
          estado?: string | null
          etapas?: Json | null
          id?: string
          nome: string
          numero?: string | null
          orcamento?: number | null
          progresso?: number | null
          status?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cliente_id?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          endereco?: string | null
          estado?: string | null
          etapas?: Json | null
          id?: string
          nome?: string
          numero?: string | null
          orcamento?: number | null
          progresso?: number | null
          status?: string | null
          tipo?: string | null
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
      projeto_cronogramas: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          data_base_inicial: string | null
          descricao: string | null
          id: string
          nome: string
          obra_id: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          data_base_inicial?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          obra_id: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          data_base_inicial?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          obra_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projeto_cronogramas_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      projeto_dependencias: {
        Row: {
          created_at: string | null
          cronograma_id: string
          id: string
          lag_dias: number | null
          tarefa_destino_id: string
          tarefa_origem_id: string
          tipo_vinculo: string | null
        }
        Insert: {
          created_at?: string | null
          cronograma_id: string
          id?: string
          lag_dias?: number | null
          tarefa_destino_id: string
          tarefa_origem_id: string
          tipo_vinculo?: string | null
        }
        Update: {
          created_at?: string | null
          cronograma_id?: string
          id?: string
          lag_dias?: number | null
          tarefa_destino_id?: string
          tarefa_origem_id?: string
          tipo_vinculo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projeto_dependencias_cronograma_id_fkey"
            columns: ["cronograma_id"]
            isOneToOne: false
            referencedRelation: "projeto_cronogramas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projeto_dependencias_tarefa_destino_id_fkey"
            columns: ["tarefa_destino_id"]
            isOneToOne: false
            referencedRelation: "projeto_tarefas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projeto_dependencias_tarefa_origem_id_fkey"
            columns: ["tarefa_origem_id"]
            isOneToOne: false
            referencedRelation: "projeto_tarefas"
            referencedColumns: ["id"]
          },
        ]
      }
      projeto_recursos: {
        Row: {
          ativo_id: string | null
          created_at: string | null
          custo_total_planejado: number | null
          custo_unitario: number | null
          funcionario_id: string | null
          id: string
          nome_recurso_externo: string | null
          quantidade_planejada: number | null
          tarefa_id: string
          tipo_recurso: string | null
          unidade_medida: string | null
          updated_at: string | null
        }
        Insert: {
          ativo_id?: string | null
          created_at?: string | null
          custo_total_planejado?: number | null
          custo_unitario?: number | null
          funcionario_id?: string | null
          id?: string
          nome_recurso_externo?: string | null
          quantidade_planejada?: number | null
          tarefa_id: string
          tipo_recurso?: string | null
          unidade_medida?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo_id?: string | null
          created_at?: string | null
          custo_total_planejado?: number | null
          custo_unitario?: number | null
          funcionario_id?: string | null
          id?: string
          nome_recurso_externo?: string | null
          quantidade_planejada?: number | null
          tarefa_id?: string
          tipo_recurso?: string | null
          unidade_medida?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projeto_recursos_ativo_id_fkey"
            columns: ["ativo_id"]
            isOneToOne: false
            referencedRelation: "ativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projeto_recursos_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projeto_recursos_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "projeto_tarefas"
            referencedColumns: ["id"]
          },
        ]
      }
      projeto_tarefas: {
        Row: {
          created_at: string | null
          cronograma_id: string
          data_fim_planejada: string | null
          data_fim_real: string | null
          data_inicio_planejada: string | null
          data_inicio_real: string | null
          descricao: string | null
          duracao_dias: number | null
          esforco_horas: number | null
          id: string
          indice: number
          nivel: number
          nome: string
          ordem_wbs: string | null
          parent_id: string | null
          percentual_concluido: number | null
          status: string | null
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          cronograma_id: string
          data_fim_planejada?: string | null
          data_fim_real?: string | null
          data_inicio_planejada?: string | null
          data_inicio_real?: string | null
          descricao?: string | null
          duracao_dias?: number | null
          esforco_horas?: number | null
          id?: string
          indice?: number
          nivel?: number
          nome: string
          ordem_wbs?: string | null
          parent_id?: string | null
          percentual_concluido?: number | null
          status?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          cronograma_id?: string
          data_fim_planejada?: string | null
          data_fim_real?: string | null
          data_inicio_planejada?: string | null
          data_inicio_real?: string | null
          descricao?: string | null
          duracao_dias?: number | null
          esforco_horas?: number | null
          id?: string
          indice?: number
          nivel?: number
          nome?: string
          ordem_wbs?: string | null
          parent_id?: string | null
          percentual_concluido?: number | null
          status?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projeto_tarefas_cronograma_id_fkey"
            columns: ["cronograma_id"]
            isOneToOne: false
            referencedRelation: "projeto_cronogramas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projeto_tarefas_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "projeto_tarefas"
            referencedColumns: ["id"]
          },
        ]
      }
      recursos_empresa: {
        Row: {
          ativo: boolean | null
          codigo: string | null
          created_at: string | null
          custo_hora: number | null
          custo_unitario: number | null
          descricao: string | null
          disciplina: string | null
          disponibilidade_maxima: number | null
          fornecedor: string | null
          funcionario_id: string | null
          id: string
          marca: string | null
          modelo: string | null
          nivel_experiencia: string | null
          nome: string
          observacoes: string | null
          tipo_recurso_id: string
          unidade_medida: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          codigo?: string | null
          created_at?: string | null
          custo_hora?: number | null
          custo_unitario?: number | null
          descricao?: string | null
          disciplina?: string | null
          disponibilidade_maxima?: number | null
          fornecedor?: string | null
          funcionario_id?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          nivel_experiencia?: string | null
          nome: string
          observacoes?: string | null
          tipo_recurso_id: string
          unidade_medida?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          codigo?: string | null
          created_at?: string | null
          custo_hora?: number | null
          custo_unitario?: number | null
          descricao?: string | null
          disciplina?: string | null
          disponibilidade_maxima?: number | null
          fornecedor?: string | null
          funcionario_id?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          nivel_experiencia?: string | null
          nome?: string
          observacoes?: string | null
          tipo_recurso_id?: string
          unidade_medida?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recursos_empresa_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recursos_empresa_tipo_recurso_id_fkey"
            columns: ["tipo_recurso_id"]
            isOneToOne: false
            referencedRelation: "tipos_recursos"
            referencedColumns: ["id"]
          },
        ]
      }
      registros_ponto: {
        Row: {
          comprovante_gerado: boolean | null
          created_at: string | null
          data_registro: string
          funcionario_id: string
          hora_registro: string
          id: string
          ip_address: unknown
          localizacao_gps: unknown
          observacoes: string | null
          timestamp_registro: string
          tipo_registro: string
          user_agent: string | null
        }
        Insert: {
          comprovante_gerado?: boolean | null
          created_at?: string | null
          data_registro?: string
          funcionario_id: string
          hora_registro?: string
          id?: string
          ip_address?: unknown
          localizacao_gps?: unknown
          observacoes?: string | null
          timestamp_registro?: string
          tipo_registro: string
          user_agent?: string | null
        }
        Update: {
          comprovante_gerado?: boolean | null
          created_at?: string | null
          data_registro?: string
          funcionario_id?: string
          hora_registro?: string
          id?: string
          ip_address?: unknown
          localizacao_gps?: unknown
          observacoes?: string | null
          timestamp_registro?: string
          tipo_registro?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registros_ponto_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      relatorios_bi: {
        Row: {
          ativo: boolean | null
          campos_selecionados: Json
          configuracoes: Json | null
          created_at: string | null
          descricao: string | null
          filtros_padrao: Json | null
          id: string
          nome: string
          setor: string | null
          updated_at: string | null
          usuario_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          campos_selecionados?: Json
          configuracoes?: Json | null
          created_at?: string | null
          descricao?: string | null
          filtros_padrao?: Json | null
          id?: string
          nome: string
          setor?: string | null
          updated_at?: string | null
          usuario_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          campos_selecionados?: Json
          configuracoes?: Json | null
          created_at?: string | null
          descricao?: string | null
          filtros_padrao?: Json | null
          id?: string
          nome?: string
          setor?: string | null
          updated_at?: string | null
          usuario_id?: string | null
        }
        Relationships: []
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
      tipos_afastamento: {
        Row: {
          ativo: boolean | null
          categoria: string
          cor: string
          created_at: string | null
          descricao: string | null
          dias_max_permitidos: number | null
          id: string
          nome: string
          obriga_documentacao: boolean | null
          remunerado: boolean | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          categoria: string
          cor?: string
          created_at?: string | null
          descricao?: string | null
          dias_max_permitidos?: number | null
          id?: string
          nome: string
          obriga_documentacao?: boolean | null
          remunerado?: boolean | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          categoria?: string
          cor?: string
          created_at?: string | null
          descricao?: string | null
          dias_max_permitidos?: number | null
          id?: string
          nome?: string
          obriga_documentacao?: boolean | null
          remunerado?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tipos_justificativas_ponto: {
        Row: {
          ativo: boolean | null
          categoria: string
          cor: string
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          obriga_documentacao: boolean | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          categoria: string
          cor?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          obriga_documentacao?: boolean | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          categoria?: string
          cor?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          obriga_documentacao?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tipos_recursos: {
        Row: {
          categoria: string | null
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          unidade_padrao: string | null
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          unidade_padrao?: string | null
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          unidade_padrao?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      videos_renderizados: {
        Row: {
          created_at: string | null
          duration: string | null
          file_size: string | null
          folder_id: string | null
          id: string
          project_name: string | null
          status: string | null
          video_id: string
          video_url: string
        }
        Insert: {
          created_at?: string | null
          duration?: string | null
          file_size?: string | null
          folder_id?: string | null
          id?: string
          project_name?: string | null
          status?: string | null
          video_id: string
          video_url: string
        }
        Update: {
          created_at?: string | null
          duration?: string | null
          file_size?: string | null
          folder_id?: string | null
          id?: string
          project_name?: string | null
          status?: string | null
          video_id?: string
          video_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      vw_alocacoes_detalhadas: {
        Row: {
          atividade_data_fim: string | null
          atividade_data_inicio: string | null
          atividade_id: string | null
          atividade_nome: string | null
          atividade_status:
            | Database["public"]["Enums"]["status_atividade"]
            | null
          codigo_wbs: string | null
          cronograma_id: string | null
          cronograma_nome: string | null
          custo_hora: number | null
          custo_total_planejado: number | null
          custo_total_realizado: number | null
          disponibilidade_maxima: number | null
          e_recurso_critico: boolean | null
          id: string | null
          obra_nome: string | null
          percentual_conclusao_recurso: number | null
          percentual_dedicacao: number | null
          quantidade_planejada: number | null
          quantidade_realizada: number | null
          recurso_codigo: string | null
          recurso_id: string | null
          recurso_nome: string | null
          tipo: Database["public"]["Enums"]["tipo_alocacao"] | null
          tipo_recurso_nome: string | null
          unidade: Database["public"]["Enums"]["unidade_medida"] | null
        }
        Relationships: []
      }
      vw_baselines_resumo: {
        Row: {
          atividades_criticas_no_baseline: number | null
          atividades_no_baseline: number | null
          cronograma_id: string | null
          cronograma_nome: string | null
          custo_total_baseline: number | null
          data_aprovacao: string | null
          data_baseline: string | null
          data_fim_baseline: string | null
          data_inicio_baseline: string | null
          duracao_total_dias: number | null
          id: string | null
          marcos_no_baseline: number | null
          nome: string | null
          numero_versao: number | null
          obra_nome: string | null
          orcamento_total_baseline: number | null
          status: Database["public"]["Enums"]["status_baseline"] | null
          tipo: Database["public"]["Enums"]["tipo_baseline"] | null
          total_atividades: number | null
          total_marcos: number | null
          trabalho_total_baseline: number | null
        }
        Relationships: [
          {
            foreignKeyName: "baselines_cronogramas_cronograma_id_fkey"
            columns: ["cronograma_id"]
            isOneToOne: false
            referencedRelation: "cronogramas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "baselines_cronogramas_cronograma_id_fkey"
            columns: ["cronograma_id"]
            isOneToOne: false
            referencedRelation: "vw_alocacoes_detalhadas"
            referencedColumns: ["cronograma_id"]
          },
          {
            foreignKeyName: "baselines_cronogramas_cronograma_id_fkey"
            columns: ["cronograma_id"]
            isOneToOne: false
            referencedRelation: "vw_dependencias_detalhadas"
            referencedColumns: ["cronograma_id"]
          },
        ]
      }
      vw_dependencias_detalhadas: {
        Row: {
          cronograma_id: string | null
          cronograma_nome: string | null
          defasagem_horas: number | null
          e_obrigatoria: boolean | null
          id: string | null
          obra_nome: string | null
          predecessora_codigo_wbs: string | null
          predecessora_data_fim: string | null
          predecessora_data_inicio: string | null
          predecessora_id: string | null
          predecessora_nome: string | null
          predecessora_status:
            | Database["public"]["Enums"]["status_atividade"]
            | null
          sucessora_codigo_wbs: string | null
          sucessora_data_fim: string | null
          sucessora_data_inicio: string | null
          sucessora_id: string | null
          sucessora_nome: string | null
          sucessora_status:
            | Database["public"]["Enums"]["status_atividade"]
            | null
          tipo: Database["public"]["Enums"]["tipo_dependencia"] | null
        }
        Relationships: []
      }
      vw_utilizacao_recursos: {
        Row: {
          alocacoes_criticas: number | null
          percentual_utilizacao: number | null
          recurso_codigo: string | null
          recurso_id: string | null
          recurso_nome: string | null
          tipo_recurso_nome: string | null
          total_alocacoes: number | null
          total_custo_planejado: number | null
          total_custo_realizado: number | null
          total_quantidade_planejada: number | null
          total_quantidade_realizada: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      atualizar_codigos_wbs_recursivo: {
        Args: { p_cronograma_id: string }
        Returns: undefined
      }
      calcular_custo_alocacao: {
        Args: { p_alocacao_id: string }
        Returns: number
      }
      calcular_data_inicio_mais_cedo: {
        Args: { p_atividade_id: string }
        Returns: string
      }
      comparar_com_baseline: {
        Args: { p_baseline_id?: string; p_cronograma_id: string }
        Returns: {
          atividade_id: string
          codigo_wbs: string
          custo_atual: number
          custo_baseline: number
          data_fim_atual: string
          data_fim_baseline: string
          data_inicio_atual: string
          data_inicio_baseline: string
          nome_atividade: string
          percentual_atual: number
          percentual_baseline: number
          status_atual: Database["public"]["Enums"]["status_atividade"]
          status_baseline: Database["public"]["Enums"]["status_atividade"]
          trabalho_atual: number
          trabalho_baseline: number
          variacao_custo: number
          variacao_fim_dias: number
          variacao_inicio_dias: number
          variacao_percentual: number
          variacao_trabalho: number
        }[]
      }
      criar_baseline_cronograma: {
        Args: {
          p_criado_por?: string
          p_cronograma_id: string
          p_descricao?: string
          p_nome: string
          p_tipo: Database["public"]["Enums"]["tipo_baseline"]
        }
        Returns: string
      }
      current_user_organization: { Args: never; Returns: string }
      detectar_dependencia_circular: {
        Args: {
          p_atividade_fim: string
          p_atividade_inicio: string
          p_cronograma_id?: string
        }
        Returns: boolean
      }
      funcionario_tem_permissao: {
        Args: { _permissao: string; _user_id: string }
        Returns: boolean
      }
      gerar_codigo_wbs: {
        Args: {
          p_cronograma_id: string
          p_item_pai_id: string
          p_posicao_irmao: number
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_active_employee: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_manager: { Args: never; Returns: boolean }
      obter_dependencias_atividade: {
        Args: { p_atividade_id: string }
        Returns: {
          data_fim_predecessora: string
          data_inicio_predecessora: string
          defasagem_horas: number
          nome_predecessora: string
          predecessora_id: string
          tipo_dependencia: Database["public"]["Enums"]["tipo_dependencia"]
        }[]
      }
      obter_permissoes_funcionario: {
        Args: { _user_id: string }
        Returns: Json
      }
      obter_permissoes_usuario: { Args: never; Returns: Json }
      registrar_auditoria: {
        Args: {
          p_acao: string
          p_dados_anteriores: Json
          p_dados_novos: Json
          p_descricao: string
          p_funcionario_id: string
          p_ip_address?: unknown
          p_registro_id: string
          p_tabela: string
          p_usuario_id: string
        }
        Returns: undefined
      }
      usuario_tem_permissao: { Args: { permissao: string }; Returns: boolean }
      verificar_sobrealocacao_recurso: {
        Args: {
          p_data_fim: string
          p_data_inicio: string
          p_excluir_alocacao_id?: string
          p_recurso_id: string
        }
        Returns: {
          data_conflito: string
          excesso_horas: number
          horas_alocadas: number
          horas_disponiveis: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "user"
      status_atividade:
        | "nao_iniciada"
        | "em_andamento"
        | "concluida"
        | "pausada"
        | "cancelada"
        | "atrasada"
      status_baseline: "ativo" | "historico" | "suspenso"
      tipo_alocacao: "trabalho" | "material" | "custo"
      tipo_baseline:
        | "inicial"
        | "aprovado"
        | "replanejamento"
        | "intermediario"
        | "final"
      tipo_dependencia: "TI" | "II" | "TT" | "IT"
      tipo_item_wbs: "projeto" | "fase" | "atividade" | "marco"
      unidade_medida:
        | "horas"
        | "dias"
        | "pecas"
        | "metros"
        | "metros_quadrados"
        | "metros_cubicos"
        | "quilogramas"
        | "toneladas"
        | "litros"
        | "reais"
        | "percentual"
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
    Enums: {
      app_role: ["admin", "manager", "user"],
      status_atividade: [
        "nao_iniciada",
        "em_andamento",
        "concluida",
        "pausada",
        "cancelada",
        "atrasada",
      ],
      status_baseline: ["ativo", "historico", "suspenso"],
      tipo_alocacao: ["trabalho", "material", "custo"],
      tipo_baseline: [
        "inicial",
        "aprovado",
        "replanejamento",
        "intermediario",
        "final",
      ],
      tipo_dependencia: ["TI", "II", "TT", "IT"],
      tipo_item_wbs: ["projeto", "fase", "atividade", "marco"],
      unidade_medida: [
        "horas",
        "dias",
        "pecas",
        "metros",
        "metros_quadrados",
        "metros_cubicos",
        "quilogramas",
        "toneladas",
        "litros",
        "reais",
        "percentual",
      ],
    },
  },
} as const
