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
  'engflow_categorias': 'categorias',
  'engflow_itens_requisicao': 'itens_requisicao',
} as const

type StorageKey = keyof typeof TABLE_MAP
type TableName = typeof TABLE_MAP[StorageKey]

// Interface genérica para entidades que têm ID
interface BaseEntity {
  id: string
  [key: string]: any
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

    if (tableName === 'funcionarios') {
      selectQuery = `
        *,
        funcao:funcao_id(
          id,
          nome,
          nivel,
          setor_id,
          setor:setor_id(id, nome)
        )
      `
    } else if (tableName === 'funcoes') {
      selectQuery = `
        *,
        setor:setor_id(id, nome)
      `
    } else if (tableName === 'requisicoes') {
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

    // Transforma os dados para o formato esperado pelo frontend
    const transformedData = (data || []).map(item =>
      this.transformDataFromSupabase(tableName, item)
    )

    return transformedData as T[]
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
          .insert(data as unknown as TablesInsert<TableName>[])

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
   * Transforma dados do formato localStorage para o formato Supabase
   */
  private transformDataForSupabase(tableName: string, item: any): any {
    if (tableName === 'clientes') {
      // Transforma dados de cliente do formato localStorage para JSONB
      const transformed = {
        nome: item.nome,
        tipo: item.tipo === 'fisica' ? 'fisico' : item.tipo === 'juridica' ? 'juridico' : item.tipo,
        documento: item.documento,
        endereco: {
          logradouro: item.endereco,
          numero: item.numero,
          bairro: item.bairro,
          cidade: item.cidade,
          estado: item.estado,
          cep: item.cep
        },
        contato: {
          email: item.email,
          telefone: item.telefone
        }
      }
      return transformed
    }

    if (tableName === 'obras') {
      // Para obras, precisamos mapear os campos corretamente
      let orcamentoValue = 0;
      if (item.orcamento) {
        if (typeof item.orcamento === 'string') {
          // Se for string, remove formatação e converte para número
          orcamentoValue = parseFloat(item.orcamento.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
        } else if (typeof item.orcamento === 'number') {
          // Se já for número, usa diretamente
          orcamentoValue = item.orcamento;
        }
      }

      const transformed = {
        nome: item.nome,
        cliente_id: item.cliente, // Mapeia 'cliente' para 'cliente_id'
        status: item.status,
        data_inicio: item.dataInicio, // Mapeia 'dataInicio' para 'data_inicio'
        data_fim: item.dataPrevisaoFinal, // Mapeia 'dataPrevisaoFinal' para 'data_fim'
        orcamento: orcamentoValue,
        etapas: item.etapas || [],
        progresso: 0 // Inicialmente 0%
        // Remove campos de endereço que não existem na tabela obras
      }
      return transformed
    }

    if (tableName === 'requisicoes') {
      // Para requisições, mapear alguns campos se necessário
      const transformed = {
        ...item,
        // Mapeia campos de funcionário para o formato correto
        funcionario_responsavel_id: item.funcionario_responsavel_id || item.funcionario_responsavel || null,
        funcionario_solicitante_id: item.funcionario_solicitante_id || item.funcionario_solicitante || null,
        // Garante que datas sejam strings se fornecidas
        data_vencimento: item.data_vencimento || null,
        // REMOVIDO: itens_produtos agora vai para tabela separada itens_requisicao
      }

      // Remove campos com nomenclatura incorreta se existirem
      delete transformed.funcionario_responsavel;
      delete transformed.funcionario_solicitante;
      // Remove campo que não existe mais na tabela
      delete transformed.itens_produtos;

      return transformed
    }

    if (tableName === 'despesas') {
      // Para despesas, pode precisar converter tipos
      let valorValue = 0;
      if (item.valor) {
        if (typeof item.valor === 'string') {
          // Se for string, remove formatação e converte para número
          valorValue = parseFloat(item.valor.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
        } else if (typeof item.valor === 'number') {
          // Se já for número, usa diretamente
          valorValue = item.valor;
        }
      }

      const transformed = {
        ...item,
        // Converte valor de string formatada para number se necessário
        valor: valorValue,
        // Garante que data_despesa seja uma data válida
        data_despesa: item.data_despesa instanceof Date ? item.data_despesa.toISOString().split('T')[0] : item.data_despesa
      }
      return transformed
    }

    // Para outras tabelas, retorna os dados como estão
    return item
  }

  /**
   * Transforma dados do formato Supabase para o formato localStorage
   */
  private transformDataFromSupabase(tableName: string, item: any): any {
    if (tableName === 'clientes' && item.endereco && item.contato) {
      // Transforma dados de cliente do formato JSONB para localStorage
      const transformed = {
        ...item,
        tipo: item.tipo === 'fisico' ? 'fisica' : item.tipo === 'juridico' ? 'juridica' : item.tipo,
        endereco: item.endereco?.logradouro || '',
        numero: item.endereco?.numero || '',
        bairro: item.endereco?.bairro || '',
        cidade: item.endereco?.cidade || '',
        estado: item.endereco?.estado || '',
        cep: item.endereco?.cep || '',
        email: item.contato?.email || '',
        telefone: item.contato?.telefone || ''
      }
      // Remove os campos JSONB para manter compatibilidade com localStorage
      delete transformed.contato
      return transformed
    }

    if (tableName === 'obras') {
      // Para obras, mapeia os campos de volta para o formato esperado pelo frontend
      const transformed = {
        ...item,
        cliente: item.cliente_id, // Mapeia 'cliente_id' para 'cliente'
        dataInicio: item.data_inicio, // Mapeia 'data_inicio' para 'dataInicio'
        dataPrevisaoFinal: item.data_fim, // Mapeia 'data_fim' para 'dataPrevisaoFinal'
        orcamento: item.orcamento ? `R$ ${item.orcamento.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}` : 'R$ 0,00',
        // Adiciona campos de endereço vazios para compatibilidade com o form
        endereco: '',
        numero: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: ''
      }
      return transformed
    }

    if (tableName === 'despesas') {
      // Para despesas, formata valores de volta para o frontend
      const transformed = {
        ...item,
        // Formata valor como string monetária para o frontend
        valor: item.valor ? `R$ ${item.valor.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}` : 'R$ 0,00'
      }
      return transformed
    }

    // Para outras tabelas (requisicoes, etc.), retorna os dados como estão
    return item
  }

  /**
   * Compatível com addToStorage<T>(key: string, item: T): T
   * Adiciona um novo item e retorna o item criado
   */
  async addToSupabase<T extends BaseEntity>(key: string, item: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    try {
      const tableName = this.getTableName(key)

      // Transforma os dados para o formato esperado pelo Supabase
      const transformedItem = this.transformDataForSupabase(tableName, item)

      const { data, error } = await supabase
        .from(tableName)
        .insert(transformedItem as unknown as TablesInsert<TableName>)
        .select()
        .single()

      if (error) {
        console.error(`Error adding to ${tableName}:`, error)
        throw new Error(`Erro ao adicionar em ${tableName}: ${error.message}`)
      }

      if (!data) {
        throw new Error(`Nenhum dado retornado ao adicionar em ${tableName}`)
      }

      // Transforma os dados de volta para o formato esperado pelo frontend
      const transformedData = this.transformDataFromSupabase(tableName, data)
      return transformedData as T
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

      // Transforma os dados para o formato esperado pelo Supabase
      const transformedUpdates = this.transformDataForSupabase(tableName, updates)

      const { data, error } = await supabase
        .from(tableName)
        .update(transformedUpdates as TablesUpdate<TableName>)
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

      // Transforma os dados de volta para o formato esperado pelo frontend
      const transformedData = this.transformDataFromSupabase(tableName, data)
      return transformedData as T
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

      // Transforma os dados para o formato esperado pelo frontend
      const transformedData = this.transformDataFromSupabase(tableName, data)
      return transformedData as T
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

      // Transforma os dados para o formato esperado pelo frontend
      const transformedData = (data || []).map(item =>
        this.transformDataFromSupabase(tableName, item)
      )

      return transformedData as T[]
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
  CATEGORIAS: 'engflow_categorias',
  ITENS_REQUISICAO: 'engflow_itens_requisicao',
} as const