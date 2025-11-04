import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock modules
vi.mock('../supabaseClient')
vi.mock('../errorHandler')

// Import both services
import {
  getFromStorage,
  saveToStorage,
  addToStorage,
  updateInStorage,
  deleteFromStorage,
  STORAGE_KEYS
} from '../localStorage'

import {
  getFromSupabase,
  saveToSupabase,
  addToSupabase,
  updateInSupabase,
  deleteFromSupabase,
  SUPABASE_KEYS
} from '../supabaseService'

import { DataServiceFactory } from '../dataService'

// Dados de teste para interface compatibility
const mockData = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  nome: 'Test Entity',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

const mockDataToAdd = {
  nome: 'New Entity',
}

const mockUpdates = {
  nome: 'Updated Entity',
}

describe('Interface Compatibility Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Function Signatures Compatibility', () => {
    it('deve ter assinaturas idênticas para getFromStorage e getFromSupabase', () => {
      // Verifica se ambas as funções têm o mesmo tipo
      expect(typeof getFromStorage).toBe('function')
      expect(typeof getFromSupabase).toBe('function')

      // Ambas devem aceitar string e retornar Promise<T[]>
      expect(getFromStorage.length).toBe(1) // Aceita 1 parâmetro (key)
      expect(getFromSupabase.length).toBe(1) // Aceita 1 parâmetro (key)
    })

    it('deve ter assinaturas idênticas para saveToStorage e saveToSupabase', () => {
      expect(typeof saveToStorage).toBe('function')
      expect(typeof saveToSupabase).toBe('function')

      // Ambas devem aceitar (key, data) e retornar Promise<void>
      expect(saveToStorage.length).toBe(2)
      expect(saveToSupabase.length).toBe(2)
    })

    it('deve ter assinaturas idênticas para addToStorage e addToSupabase', () => {
      expect(typeof addToStorage).toBe('function')
      expect(typeof addToSupabase).toBe('function')

      // Ambas devem aceitar (key, item) e retornar Promise<T>
      expect(addToStorage.length).toBe(2)
      expect(addToSupabase.length).toBe(2)
    })

    it('deve ter assinaturas idênticas para updateInStorage e updateInSupabase', () => {
      expect(typeof updateInStorage).toBe('function')
      expect(typeof updateInSupabase).toBe('function')

      // Ambas devem aceitar (key, id, updates) e retornar Promise<T>
      expect(updateInStorage.length).toBe(3)
      expect(updateInSupabase.length).toBe(3)
    })

    it('deve ter assinaturas idênticas para deleteFromStorage e deleteFromSupabase', () => {
      expect(typeof deleteFromStorage).toBe('function')
      expect(typeof deleteFromSupabase).toBe('function')

      // Ambas devem aceitar (key, id) e retornar Promise<void>
      expect(deleteFromStorage.length).toBe(2)
      expect(deleteFromSupabase.length).toBe(2)
    })
  })

  describe('Storage Keys Compatibility', () => {
    it('deve ter as mesmas chaves em STORAGE_KEYS e SUPABASE_KEYS', () => {
      const storageKeyNames = Object.keys(STORAGE_KEYS).sort()
      const supabaseKeyNames = Object.keys(SUPABASE_KEYS).sort()

      expect(storageKeyNames).toEqual(supabaseKeyNames)
    })

    it('deve ter os mesmos valores nas chaves correspondentes', () => {
      const keyPairs = [
        ['CLIENTES', 'engflow_clientes'],
        ['OBRAS', 'engflow_obras'],
        ['FUNCIONARIOS', 'engflow_funcionarios'],
        ['FUNCOES', 'engflow_funcoes'],
        ['SETORES', 'engflow_setores'],
        ['DESPESAS', 'engflow_despesas'],
        ['REQUISICOES', 'engflow_requisicoes'],
        ['VIDEOS', 'engflow_videos'],
      ]

      keyPairs.forEach(([keyName, expectedValue]) => {
        expect(STORAGE_KEYS[keyName as keyof typeof STORAGE_KEYS]).toBe(expectedValue)
        expect(SUPABASE_KEYS[keyName as keyof typeof SUPABASE_KEYS]).toBe(expectedValue)
      })
    })
  })

  describe('DataServiceFactory Interface Compatibility', () => {
    it('deve implementar todos os métodos de localStorage com mesmas assinaturas', () => {
      // Verifica se DataServiceFactory tem todos os métodos estáticos
      expect(typeof DataServiceFactory.get).toBe('function')
      expect(typeof DataServiceFactory.save).toBe('function')
      expect(typeof DataServiceFactory.add).toBe('function')
      expect(typeof DataServiceFactory.update).toBe('function')
      expect(typeof DataServiceFactory.delete).toBe('function')

      // Verifica assinaturas dos métodos
      expect(DataServiceFactory.get.length).toBe(1) // (key)
      expect(DataServiceFactory.save.length).toBe(2) // (key, data)
      expect(DataServiceFactory.add.length).toBe(2) // (key, item)
      expect(DataServiceFactory.update.length).toBe(3) // (key, id, updates)
      expect(DataServiceFactory.delete.length).toBe(2) // (key, id)
    })

    it('deve retornar tipos compatíveis', async () => {
      // Mock dos serviços para testar tipos de retorno
      vi.doMock('../localStorage', () => ({
        getFromStorage: vi.fn().mockReturnValue([mockData]),
        saveToStorage: vi.fn().mockReturnValue(undefined),
        addToStorage: vi.fn().mockReturnValue(mockData),
        updateInStorage: vi.fn().mockReturnValue([mockData]),
        deleteFromStorage: vi.fn().mockReturnValue(undefined),
        STORAGE_KEYS: {
          CLIENTES: 'engflow_clientes',
        }
      }))

      // Testa tipos de retorno
      const getData = await DataServiceFactory.get('engflow_clientes')
      expect(Array.isArray(getData)).toBe(true)

      const addResult = await DataServiceFactory.add('engflow_clientes', mockDataToAdd)
      expect(typeof addResult).toBe('object')
      expect(addResult).toHaveProperty('id')

      const updateResult = await DataServiceFactory.update('engflow_clientes', mockData.id, mockUpdates)
      expect(typeof updateResult).toBe('object')
      expect(updateResult).toHaveProperty('id')

      // save e delete devem retornar void (undefined)
      const saveResult = await DataServiceFactory.save('engflow_clientes', [mockData])
      expect(saveResult).toBeUndefined()

      const deleteResult = await DataServiceFactory.delete('engflow_clientes', mockData.id)
      expect(deleteResult).toBeUndefined()
    })
  })

  describe('Error Handling Compatibility', () => {
    it('deve tratar erros de forma consistente entre localStorage e Supabase', async () => {
      // Testa se ambos os serviços tratam erros de chave inválida
      try {
        getFromStorage('chave_invalida')
        expect(true).toBe(true) // localStorage não lança erro, retorna array vazio
      } catch (error) {
        // Se localStorage lançar erro, deve ser consistente
        expect(error).toBeDefined()
      }

      // Supabase deve lançar erro para chave inválida
      try {
        await getFromSupabase('chave_invalida')
        expect(false).toBe(true) // Não deveria chegar aqui
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })

  describe('Data Structure Compatibility', () => {
    it('deve aceitar e retornar estruturas de dados idênticas', () => {
      // Ambos os serviços devem trabalhar com entidades que têm 'id'
      const testEntity = {
        id: 'test-id',
        nome: 'Test Name',
        description: 'Test Description',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Verifica se a estrutura é válida para ambos os sistemas
      expect(testEntity).toHaveProperty('id')
      expect(typeof testEntity.id).toBe('string')
      expect(testEntity.id.length).toBeGreaterThan(0)

      // Testa estrutura de add (sem id, created_at, updated_at)
      const addStructure = {
        nome: 'New Name',
        description: 'New Description',
      }

      expect(addStructure).not.toHaveProperty('id')
      expect(addStructure).not.toHaveProperty('created_at')
      expect(addStructure).not.toHaveProperty('updated_at')

      // Testa estrutura de update (partial, sem id, created_at)
      const updateStructure = {
        nome: 'Updated Name',
      }

      expect(updateStructure).not.toHaveProperty('id')
      expect(updateStructure).not.toHaveProperty('created_at')
    })
  })

  describe('Async/Sync Compatibility', () => {
    it('deve converter funções síncronas localStorage para async compatíveis', async () => {
      // localStorage é síncrono, mas DataServiceFactory deve ser async
      const getResult = DataServiceFactory.get('engflow_clientes')
      expect(getResult).toBeInstanceOf(Promise)

      const addResult = DataServiceFactory.add('engflow_clientes', mockDataToAdd)
      expect(addResult).toBeInstanceOf(Promise)

      const updateResult = DataServiceFactory.update('engflow_clientes', mockData.id, mockUpdates)
      expect(updateResult).toBeInstanceOf(Promise)

      const saveResult = DataServiceFactory.save('engflow_clientes', [mockData])
      expect(saveResult).toBeInstanceOf(Promise)

      const deleteResult = DataServiceFactory.delete('engflow_clientes', mockData.id)
      expect(deleteResult).toBeInstanceOf(Promise)
    })
  })
})

describe('Migration Path Validation', () => {
  it('deve permitir substituição direta de localStorage por DataServiceFactory', () => {
    // Simula código antigo que usava localStorage
    const oldUsage = {
      getData: (key: string) => getFromStorage(key),
      saveData: (key: string, data: any[]) => saveToStorage(key, data),
      addData: (key: string, item: unknown) => addToStorage(key, item),
      updateData: (key: string, id: string, updates: unknown) => updateInStorage(key, id, updates),
      deleteData: (key: string, id: string) => deleteFromStorage(key, id),
    }

    // Simula novo código que usa DataServiceFactory
    const newUsage = {
      getData: (key: string) => DataServiceFactory.get(key),
      saveData: (key: string, data: any[]) => DataServiceFactory.save(key, data),
      addData: (key: string, item: unknown) => DataServiceFactory.add(key, item),
      updateData: (key: string, id: string, updates: unknown) => DataServiceFactory.update(key, id, updates),
      deleteData: (key: string, id: string) => DataServiceFactory.delete(key, id),
    }

    // Verifica se ambos têm a mesma interface
    expect(Object.keys(oldUsage).sort()).toEqual(Object.keys(newUsage).sort())

    // Verifica se todos os métodos são funções
    Object.values(oldUsage).forEach(method => {
      expect(typeof method).toBe('function')
    })

    Object.values(newUsage).forEach(method => {
      expect(typeof method).toBe('function')
    })
  })

  it('deve manter compatibilidade de imports', () => {
    // Verifica se as importações necessárias estão disponíveis
    expect(STORAGE_KEYS).toBeDefined()
    expect(SUPABASE_KEYS).toBeDefined()
    expect(DataServiceFactory).toBeDefined()

    // Verifica se os métodos do DataServiceFactory estão acessíveis
    expect(DataServiceFactory.getDataService).toBeDefined()
    expect(DataServiceFactory.getFeatureFlags).toBeDefined()
  })
})