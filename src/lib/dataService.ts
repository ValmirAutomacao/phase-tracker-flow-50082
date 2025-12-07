import {
  getFromSupabase,
  saveToSupabase,
  addToSupabase,
  updateInSupabase,
  deleteFromSupabase,
  SUPABASE_KEYS
} from './supabaseService'

// Tipos para o service abstrato
interface BaseEntity {
  id: string
  [key: string]: unknown
}

export enum DataProvider {
  SUPABASE = 'supabase'
}

// Interface comum para o provider
interface DataServiceInterface {
  get<T extends BaseEntity>(key: string): Promise<T[]>
  save<T extends BaseEntity>(key: string, data: T[]): Promise<void>
  add<T extends BaseEntity>(key: string, item: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T>
  update<T extends BaseEntity>(key: string, id: string, updates: Partial<Omit<T, 'id' | 'created_at'>>): Promise<T>
  delete(key: string, id: string): Promise<void>
}

/**
 * Implementação Supabase - única fonte de dados
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
 * Factory para obter o service de dados - sempre Supabase
 */
class DataServiceFactoryClass {
  private static supabaseService = new SupabaseDataService()

  static getDataService(): DataServiceInterface {
    return this.supabaseService
  }

  // Métodos de conveniência
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

// Export das chaves do Supabase (alias para compatibilidade)
export const STORAGE_KEYS = SUPABASE_KEYS

// Export dos principais elementos
export { DataServiceFactoryClass as DataServiceFactory }
export type { DataServiceInterface }
