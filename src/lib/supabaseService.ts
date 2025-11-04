import { supabase } from './supabaseClient'
import type { Database, Tables, TablesInsert, TablesUpdate } from './types/database'
import { ErrorHandler, withErrorHandling, withRetry } from './errorHandler'

// Mapeamento de chaves localStorage para nomes de tabelas Supabase
const TABLE_MAP = {
  'engflow_clientes': 'clientes',
  'engflow_obras': 'obras',
  'engflow_funcionarios': 'funcionarios',
  'engflow_funcoes': 'funcoes',
  'engflow_setores': 'setores',
  'engflow_despesas': 'despesas',
  'engflow_videos': 'videos',
  'engflow_requisicoes': 'requisicoes',
} as const

type StorageKey = keyof typeof TABLE_MAP
type TableName = typeof TABLE_MAP[StorageKey]

// Interface genérica para entidades que têm ID
interface BaseEntity {
  id: string
  [key: string]: unknown
}

/**
 * Serviço Supabase que mantém compatibilidade 100% com localStorage.ts
 * Implementa as mesmas assinaturas de função para facilitar migração
 */
export class SupabaseService {
  private getTableName(key: string): TableName {
    const tableName = TABLE_MAP[key as StorageKey]
    if (!tableName) {
      throw new Error(`Chave de storage inválida: ${key}`)
    }
    return tableName
  }

  /**
   * Compatível com getFromStorage<T>(key: string): T[]
   * Busca todos os registros de uma tabela
   */
  async getFromSupabase<T extends BaseEntity>(key: string): Promise<T[]> {
    const tableName = this.getTableName(key)

    // Configuração específica de JOINs para cada tabela
    let selectQuery = '*'

    if (tableName === 'requisicoes') {
      selectQuery = `
        *,
        obra:obra_id(id, nome),
        funcionario_solicitante:funcionario_solicitante_id(id, nome),
        funcionario_responsavel:funcionario_responsavel_id(id, nome)
      `
    } else if (tableName === 'videos') {
      selectQuery = `
        *,
        obra:obra_id(id, nome)
      `
    } else if (tableName === 'despesas') {
      selectQuery = `
        *,
        cliente:cliente_id(id, nome),
        obra:obra_id(id, nome)
      `
    }

    const { data, error } = await supabase
      .from(tableName)
      .select(selectQuery)
      .order('created_at', { ascending: false })

    if (error) {
      throw ErrorHandler.mapSupabaseError(error)
    }

    return (data || []) as T[]
  }

  /**
   * Compatível com saveToStorage<T>(key: string, data: T[]): void
   * Substitui todos os dados da tabela (uso com cuidado!)
   */
  async saveToSupabase<T extends BaseEntity>(key: string, data: T[]): Promise<void> {
    try {
      const tableName = this.getTableName(key)

      // CUIDADO: Esta operação remove todos os dados existentes
      // Em produção, considerar implementação incremental
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .neq('id', '')  // Delete all records

      if (deleteError) {
        console.error(`Error clearing ${tableName}:`, deleteError)
        throw new Error(`Erro ao limpar ${tableName}: ${deleteError.message}`)
      }

      if (data.length > 0) {
        const { error: insertError } = await supabase
          .from(tableName)
          .insert(data as TablesInsert<TableName>[])

        if (insertError) {
          console.error(`Error inserting data to ${tableName}:`, insertError)
          throw new Error(`Erro ao inserir dados em ${tableName}: ${insertError.message}`)
        }
      }
    } catch (error) {
      console.error(`Error in saveToSupabase for ${key}:`, error)
      throw error
    }
  }

  /**
   * Compatível com addToStorage<T>(key: string, item: T): T
   * Adiciona um novo item e retorna o item criado
   */
  async addToSupabase<T extends BaseEntity>(key: string, item: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    try {
      const tableName = this.getTableName(key)

      const { data, error } = await supabase
        .from(tableName)
        .insert(item as TablesInsert<TableName>)
        .select()
        .single()

      if (error) {
        console.error(`Error adding to ${tableName}:`, error)
        throw new Error(`Erro ao adicionar em ${tableName}: ${error.message}`)
      }

      if (!data) {
        throw new Error(`Nenhum dado retornado ao adicionar em ${tableName}`)
      }

      return data as T
    } catch (error) {
      console.error(`Error in addToSupabase for ${key}:`, error)
      throw error
    }
  }

  /**
   * Compatível com updateInStorage<T>(key: string, id: string, updates: Partial<T>): T
   * Atualiza um item específico e retorna o item atualizado
   */
  async updateInSupabase<T extends BaseEntity>(
    key: string,
    id: string,
    updates: Partial<Omit<T, 'id' | 'created_at'>>
  ): Promise<T> {
    try {
      const tableName = this.getTableName(key)

      const { data, error } = await supabase
        .from(tableName)
        .update(updates as TablesUpdate<TableName>)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error(`Error updating ${tableName}:`, error)
        throw new Error(`Erro ao atualizar em ${tableName}: ${error.message}`)
      }

      if (!data) {
        throw new Error(`Item com ID ${id} não encontrado em ${tableName}`)
      }

      return data as T
    } catch (error) {
      console.error(`Error in updateInSupabase for ${key}:`, error)
      throw error
    }
  }

  /**
   * Compatível com deleteFromStorage(key: string, id: string): void
   * Remove um item específico
   */
  async deleteFromSupabase(key: string, id: string): Promise<void> {
    try {
      const tableName = this.getTableName(key)

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)

      if (error) {
        console.error(`Error deleting from ${tableName}:`, error)
        throw new Error(`Erro ao deletar de ${tableName}: ${error.message}`)
      }
    } catch (error) {
      console.error(`Error in deleteFromSupabase for ${key}:`, error)
      throw error
    }
  }

  /**
   * Busca um item específico por ID
   * Funcionalidade adicional não presente em localStorage
   */
  async getByIdFromSupabase<T extends BaseEntity>(key: string, id: string): Promise<T | null> {
    try {
      const tableName = this.getTableName(key)

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // No rows returned
        }
        console.error(`Error fetching ${tableName} by id:`, error)
        throw new Error(`Erro ao buscar ${tableName} por ID: ${error.message}`)
      }

      return data as T
    } catch (error) {
      console.error(`Error in getByIdFromSupabase for ${key}:`, error)
      return null
    }
  }

  /**
   * Busca itens com filtros
   * Funcionalidade adicional para queries mais específicas
   */
  async getFilteredFromSupabase<T extends BaseEntity>(
    key: string,
    filters: Record<string, unknown>
  ): Promise<T[]> {
    try {
      const tableName = this.getTableName(key)

      let query = supabase.from(tableName).select('*')

      // Aplica filtros
      Object.entries(filters).forEach(([field, value]) => {
        query = query.eq(field, value)
      })

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error(`Error filtering ${tableName}:`, error)
        throw new Error(`Erro ao filtrar ${tableName}: ${error.message}`)
      }

      return (data || []) as T[]
    } catch (error) {
      console.error(`Error in getFilteredFromSupabase for ${key}:`, error)
      return []
    }
  }
}

// Instância singleton do serviço
export const supabaseService = new SupabaseService()

// Funções standalone compatíveis com localStorage.ts com retry automático
export const getFromSupabase = withRetry(
  <T extends BaseEntity>(key: string): Promise<T[]> =>
    supabaseService.getFromSupabase<T>(key),
  3, 1000
)

export const saveToSupabase = withRetry(
  <T extends BaseEntity>(key: string, data: T[]): Promise<void> =>
    supabaseService.saveToSupabase<T>(key, data),
  2, 1500
)

export const addToSupabase = withRetry(
  <T extends BaseEntity>(key: string, item: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> =>
    supabaseService.addToSupabase<T>(key, item),
  3, 1000
)

export const updateInSupabase = withRetry(
  <T extends BaseEntity>(
    key: string,
    id: string,
    updates: Partial<Omit<T, 'id' | 'created_at'>>
  ): Promise<T> =>
    supabaseService.updateInSupabase<T>(key, id, updates),
  3, 1000
)

export const deleteFromSupabase = withRetry(
  (key: string, id: string): Promise<void> =>
    supabaseService.deleteFromSupabase(key, id),
  2, 1000
)

// Chaves de storage compatíveis com localStorage
export const SUPABASE_KEYS = {
  CLIENTES: 'engflow_clientes',
  OBRAS: 'engflow_obras',
  FUNCIONARIOS: 'engflow_funcionarios',
  FUNCOES: 'engflow_funcoes',
  SETORES: 'engflow_setores',
  DESPESAS: 'engflow_despesas',
  REQUISICOES: 'engflow_requisicoes',
  VIDEOS: 'engflow_videos',
} as const