import {
  getFromStorage,
  saveToStorage,
  addToStorage,
  updateInStorage,
  deleteFromStorage,
  STORAGE_KEYS
} from './localStorage'
import {
  getFromSupabase,
  saveToSupabase,
  addToSupabase,
  updateInSupabase,
  deleteFromSupabase,
  SUPABASE_KEYS
} from './supabaseService'
import { ErrorHandler, FallbackStrategy } from './errorHandler'

// Tipos para o service abstrato
interface BaseEntity {
  id: string
  [key: string]: any
}

export enum DataProvider {
  LOCALSTORAGE = 'localStorage',
  SUPABASE = 'supabase'
}

// Interface comum para ambos os providers
interface DataServiceInterface {
  get<T extends BaseEntity>(key: string): Promise<T[]>
  save<T extends BaseEntity>(key: string, data: T[]): Promise<void>
  add<T extends BaseEntity>(key: string, item: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T>
  update<T extends BaseEntity>(key: string, id: string, updates: Partial<Omit<T, 'id' | 'created_at'>>): Promise<T>
  delete(key: string, id: string): Promise<void>
}

/**
 * Implementação localStorage (síncrona adaptada para async)
 */
class LocalStorageDataService implements DataServiceInterface {
  async get<T extends BaseEntity>(key: string): Promise<T[]> {
    try {
      return getFromStorage<T>(key)
    } catch (error) {
      console.error('LocalStorage get error:', error)
      return []
    }
  }

  async save<T extends BaseEntity>(key: string, data: T[]): Promise<void> {
    try {
      saveToStorage(key, data)
    } catch (error) {
      console.error('LocalStorage save error:', error)
      throw error
    }
  }

  async add<T extends BaseEntity>(key: string, item: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    try {
      const itemWithId = { ...item, id: crypto.randomUUID() } as T
      addToStorage(key, itemWithId)
      return itemWithId
    } catch (error) {
      console.error('LocalStorage add error:', error)
      throw error
    }
  }

  async update<T extends BaseEntity>(key: string, id: string, updates: Partial<Omit<T, 'id' | 'created_at'>>): Promise<T> {
    try {
      const items = updateInStorage<T>(key, id, updates as any)
      const updatedItem = items.find(item => item.id === id)
      if (!updatedItem) {
        throw new Error(`Item com ID ${id} não encontrado`)
      }
      return updatedItem
    } catch (error) {
      console.error('LocalStorage update error:', error)
      throw error
    }
  }

  async delete(key: string, id: string): Promise<void> {
    try {
      deleteFromStorage(key, id)
    } catch (error) {
      console.error('LocalStorage delete error:', error)
      throw error
    }
  }
}

/**
 * Implementação Supabase
 */
class SupabaseDataService implements DataServiceInterface {
  async get<T extends BaseEntity>(key: string): Promise<T[]> {
    return await getFromSupabase<T>(key)
  }

  async save<T extends BaseEntity>(key: string, data: T[]): Promise<void> {
    await saveToSupabase<T>(key, data)
  }

  async add<T extends BaseEntity>(key: string, item: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    return await addToSupabase<T>(key, item)
  }

  async update<T extends BaseEntity>(key: string, id: string, updates: Partial<Omit<T, 'id' | 'created_at'>>): Promise<T> {
    return await updateInSupabase<T>(key, id, updates)
  }

  async delete(key: string, id: string): Promise<void> {
    await deleteFromSupabase(key, id)
  }
}

/**
 * Gerenciador de Feature Flags para switching entre providers
 */
class FeatureFlagManager {
  private static instance: FeatureFlagManager
  private currentProvider: DataProvider = DataProvider.LOCALSTORAGE
  private isTransitioning = false

  // Feature flags configuráveis
  private flags = {
    USE_SUPABASE: false,
    AUTO_FALLBACK: true,
    SYNC_DATA_ON_SWITCH: true,
    BACKUP_BEFORE_SWITCH: true,
  }

  static getInstance(): FeatureFlagManager {
    if (!this.instance) {
      this.instance = new FeatureFlagManager()
    }
    return this.instance
  }

  setFlag(flag: keyof typeof this.flags, value: boolean): void {
    this.flags[flag] = value
    console.info(`🏳️ Feature flag ${flag} = ${value}`)
  }

  getFlag(flag: keyof typeof this.flags): boolean {
    return this.flags[flag]
  }

  getCurrentProvider(): DataProvider {
    // Se há fallback ativo, força localStorage
    if (this.flags.AUTO_FALLBACK && FallbackStrategy.shouldUseFallback()) {
      return DataProvider.LOCALSTORAGE
    }

    return this.flags.USE_SUPABASE ? DataProvider.SUPABASE : DataProvider.LOCALSTORAGE
  }

  async switchProvider(newProvider: DataProvider, options: {
    syncData?: boolean
    createBackup?: boolean
  } = {}): Promise<void> {
    if (this.isTransitioning) {
      throw new Error('Provider switch já em andamento')
    }

    const oldProvider = this.currentProvider
    if (oldProvider === newProvider) {
      console.info(`✅ Provider já é ${newProvider}`)
      return
    }

    this.isTransitioning = true

    try {
      console.info(`🔄 Switching provider: ${oldProvider} → ${newProvider}`)

      // Backup antes do switch se solicitado
      if (options.createBackup !== false && this.flags.BACKUP_BEFORE_SWITCH) {
        await this.createBackup()
      }

      // Sincronização de dados se solicitado
      if (options.syncData !== false && this.flags.SYNC_DATA_ON_SWITCH) {
        await this.syncData(oldProvider, newProvider)
      }

      // Atualiza o provider
      this.flags.USE_SUPABASE = newProvider === DataProvider.SUPABASE
      this.currentProvider = newProvider

      console.info(`✅ Provider switch completo: ${newProvider}`)
    } catch (error) {
      console.error('❌ Erro durante switch de provider:', error)
      throw error
    } finally {
      this.isTransitioning = false
    }
  }

  private async createBackup(): Promise<void> {
    try {
      const timestamp = new Date().toISOString()
      console.info(`💾 Criando backup - ${timestamp}`)

      // Cria backup de todos os dados localStorage
      const backupData: Record<string, any> = {}
      Object.values(STORAGE_KEYS).forEach(key => {
        backupData[key] = getFromStorage(key)
      })

      // Salva backup no localStorage com chave especial
      localStorage.setItem(`engflow_backup_${timestamp}`, JSON.stringify(backupData))

      console.info(`✅ Backup criado com sucesso`)
    } catch (error) {
      console.error('❌ Erro ao criar backup:', error)
      throw error
    }
  }

  private async syncData(fromProvider: DataProvider, toProvider: DataProvider): Promise<void> {
    console.info(`🔄 Sincronizando dados: ${fromProvider} → ${toProvider}`)

    const sourceService = fromProvider === DataProvider.LOCALSTORAGE
      ? new LocalStorageDataService()
      : new SupabaseDataService()

    const targetService = toProvider === DataProvider.LOCALSTORAGE
      ? new LocalStorageDataService()
      : new SupabaseDataService()

    // Sincroniza cada tipo de dados
    for (const [_, storageKey] of Object.entries(STORAGE_KEYS)) {
      try {
        console.info(`📦 Sincronizando ${storageKey}...`)

        const data = await sourceService.get(storageKey)
        if (data.length > 0) {
          await targetService.save(storageKey, data)
          console.info(`✅ ${storageKey}: ${data.length} registros sincronizados`)
        } else {
          console.info(`ℹ️ ${storageKey}: nenhum dado para sincronizar`)
        }
      } catch (error) {
        console.error(`❌ Erro ao sincronizar ${storageKey}:`, error)
        // Continua com as outras tabelas mesmo se uma falhar
      }
    }

    console.info(`✅ Sincronização completa`)
  }

  async rollback(): Promise<void> {
    console.info('🔄 Executando rollback para localStorage...')

    // Força uso do localStorage
    this.flags.USE_SUPABASE = false
    this.currentProvider = DataProvider.LOCALSTORAGE

    // Desativa fallback se ativo
    FallbackStrategy.disableFallback()

    console.info('✅ Rollback completo - usando localStorage')
  }

  // Métodos para teste A/B
  getProviderStatus() {
    return {
      current: this.getCurrentProvider(),
      configured: this.currentProvider,
      fallbackActive: FallbackStrategy.shouldUseFallback(),
      isTransitioning: this.isTransitioning,
      flags: { ...this.flags }
    }
  }
}

/**
 * Factory para obter o service de dados baseado na feature flag
 */
class DataServiceFactoryClass {
  private static localStorageService = new LocalStorageDataService()
  private static supabaseService = new SupabaseDataService()
  private static featureFlags = FeatureFlagManager.getInstance()

  static getDataService(): DataServiceInterface {
    const provider = this.featureFlags.getCurrentProvider()

    switch (provider) {
      case DataProvider.SUPABASE:
        return this.supabaseService
      case DataProvider.LOCALSTORAGE:
      default:
        return this.localStorageService
    }
  }

  static getFeatureFlags(): FeatureFlagManager {
    return this.featureFlags
  }

  // Métodos de conveniência que mantêm compatibilidade com localStorage.ts
  static async get<T extends BaseEntity>(key: string): Promise<T[]> {
    return await this.getDataService().get<T>(key)
  }

  static async save<T extends BaseEntity>(key: string, data: T[]): Promise<void> {
    await this.getDataService().save<T>(key, data)
  }

  static async add<T extends BaseEntity>(key: string, item: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    return await this.getDataService().add<T>(key, item)
  }

  static async update<T extends BaseEntity>(key: string, id: string, updates: Partial<Omit<T, 'id' | 'created_at'>>): Promise<T> {
    return await this.getDataService().update<T>(key, id, updates)
  }

  static async delete(key: string, id: string): Promise<void> {
    await this.getDataService().delete(key, id)
  }
}

// Export dos principais elementos
export { FeatureFlagManager, DataServiceFactoryClass as DataServiceFactory }
export type { DataServiceInterface }