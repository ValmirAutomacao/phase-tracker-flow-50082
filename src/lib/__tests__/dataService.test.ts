import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  DataServiceFactory,
  FeatureFlagManager,
  DataProvider
} from '../dataService'

// Mock do localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
})

// Mock modules
vi.mock('../localStorage')
vi.mock('../supabaseService')
vi.mock('../errorHandler')

// Import mocked modules
import {
  getFromStorage,
  saveToStorage,
  addToStorage,
  updateInStorage,
  deleteFromStorage,
} from '../localStorage'

import {
  getFromSupabase,
  saveToSupabase,
  addToSupabase,
  updateInSupabase,
  deleteFromSupabase,
} from '../supabaseService'

import { FallbackStrategy } from '../errorHandler'

// Mock do crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => '123e4567-e89b-12d3-a456-426614174000'),
  },
})

// Dados de teste
const mockCliente = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  nome: 'Empresa Teste',
  email: 'contato@empresateste.com',
  telefone: '(11) 99999-9999',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

const mockClienteToAdd = {
  nome: 'Nova Empresa',
  email: 'nova@empresa.com',
  telefone: '(11) 77777-7777',
}

describe('FeatureFlagManager', () => {
  let manager: FeatureFlagManager

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset singleton instance
    ;(FeatureFlagManager as any).instance = undefined
    manager = FeatureFlagManager.getInstance()
  })

  afterEach(() => {
    // Reset to default state
    ;(FeatureFlagManager as any).instance = undefined
  })

  describe('getInstance', () => {
    it('deve retornar a mesma instância (singleton)', () => {
      const manager1 = FeatureFlagManager.getInstance()
      const manager2 = FeatureFlagManager.getInstance()

      expect(manager1).toBe(manager2)
    })
  })

  describe('setFlag e getFlag', () => {
    it('deve definir e obter flags corretamente', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

      manager.setFlag('USE_SUPABASE', true)

      expect(manager.getFlag('USE_SUPABASE')).toBe(true)
      expect(consoleSpy).toHaveBeenCalledWith('🏳️ Feature flag USE_SUPABASE = true')

      consoleSpy.mockRestore()
    })

    it('deve manter valores padrão para flags não definidas', () => {
      expect(manager.getFlag('USE_SUPABASE')).toBe(false)
      expect(manager.getFlag('AUTO_FALLBACK')).toBe(true)
      expect(manager.getFlag('SYNC_DATA_ON_SWITCH')).toBe(true)
      expect(manager.getFlag('BACKUP_BEFORE_SWITCH')).toBe(true)
    })
  })

  describe('getCurrentProvider', () => {
    it('deve retornar localStorage quando USE_SUPABASE é false', () => {
      manager.setFlag('USE_SUPABASE', false)
      vi.mocked(FallbackStrategy.shouldUseFallback).mockReturnValue(false)

      expect(manager.getCurrentProvider()).toBe(DataProvider.LOCALSTORAGE)
    })

    it('deve retornar Supabase quando USE_SUPABASE é true', () => {
      manager.setFlag('USE_SUPABASE', true)
      vi.mocked(FallbackStrategy.shouldUseFallback).mockReturnValue(false)

      expect(manager.getCurrentProvider()).toBe(DataProvider.SUPABASE)
    })

    it('deve forçar localStorage quando fallback está ativo', () => {
      manager.setFlag('USE_SUPABASE', true)
      vi.mocked(FallbackStrategy.shouldUseFallback).mockReturnValue(true)

      expect(manager.getCurrentProvider()).toBe(DataProvider.LOCALSTORAGE)
    })
  })

  describe('switchProvider', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      // Mock console methods
      vi.spyOn(console, 'info').mockImplementation(() => {})
      vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      vi.useRealTimers()
      vi.restoreAllMocks()
    })

    it('deve alternar de localStorage para Supabase', async () => {
      vi.mocked(getFromStorage).mockReturnValue([mockCliente])
      vi.mocked(saveToSupabase).mockResolvedValue(undefined)

      await manager.switchProvider(DataProvider.SUPABASE)

      expect(manager.getFlag('USE_SUPABASE')).toBe(true)
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('🔄 Switching provider: localStorage → supabase')
      )
    })

    it('deve não fazer nada se já estiver no provider solicitado', async () => {
      manager.setFlag('USE_SUPABASE', true)

      await manager.switchProvider(DataProvider.SUPABASE)

      expect(console.info).toHaveBeenCalledWith('✅ Provider já é supabase')
    })
  })

  describe('rollback', () => {
    it('deve fazer rollback para localStorage', async () => {
      manager.setFlag('USE_SUPABASE', true)
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

      await manager.rollback()

      expect(manager.getFlag('USE_SUPABASE')).toBe(false)
      expect(FallbackStrategy.disableFallback).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith('🔄 Executando rollback para localStorage...')
      expect(consoleSpy).toHaveBeenCalledWith('✅ Rollback completo - usando localStorage')

      consoleSpy.mockRestore()
    })
  })

  describe('getProviderStatus', () => {
    it('deve retornar status completo do provider', () => {
      manager.setFlag('USE_SUPABASE', true)
      vi.mocked(FallbackStrategy.shouldUseFallback).mockReturnValue(false)

      const status = manager.getProviderStatus()

      expect(status).toEqual({
        current: DataProvider.SUPABASE,
        configured: DataProvider.LOCALSTORAGE, // currentProvider interno
        fallbackActive: false,
        isTransitioning: false,
        flags: {
          USE_SUPABASE: true,
          AUTO_FALLBACK: true,
          SYNC_DATA_ON_SWITCH: true,
          BACKUP_BEFORE_SWITCH: true,
        }
      })
    })
  })
})

describe('DataServiceFactory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset singleton
    ;(FeatureFlagManager as any).instance = undefined
  })

  describe('getDataService', () => {
    it('deve retornar LocalStorageDataService quando provider é localStorage', () => {
      vi.mocked(FallbackStrategy.shouldUseFallback).mockReturnValue(false)

      const service = DataServiceFactory.getDataService()

      expect(service).toBeDefined()
    })

    it('deve retornar SupabaseDataService quando provider é Supabase', () => {
      const flags = FeatureFlagManager.getInstance()
      flags.setFlag('USE_SUPABASE', true)
      vi.mocked(FallbackStrategy.shouldUseFallback).mockReturnValue(false)

      const service = DataServiceFactory.getDataService()

      expect(service).toBeDefined()
    })
  })

  describe('Métodos de conveniência', () => {
    beforeEach(() => {
      vi.mocked(FallbackStrategy.shouldUseFallback).mockReturnValue(false)
    })

    it('deve fazer get através do service ativo', async () => {
      vi.mocked(getFromStorage).mockReturnValue([mockCliente])

      const result = await DataServiceFactory.get('engflow_clientes')

      expect(result).toEqual([mockCliente])
    })

    it('deve fazer save através do service ativo', async () => {
      await DataServiceFactory.save('engflow_clientes', [mockCliente])

      expect(saveToStorage).toHaveBeenCalledWith('engflow_clientes', [mockCliente])
    })

    it('deve fazer add através do service ativo', async () => {
      const clienteComId = { ...mockClienteToAdd, id: mockCliente.id }
      vi.mocked(addToStorage).mockReturnValue(clienteComId)

      const result = await DataServiceFactory.add('engflow_clientes', mockClienteToAdd)

      expect(result).toEqual(clienteComId)
      expect(addToStorage).toHaveBeenCalledWith('engflow_clientes', mockClienteToAdd)
    })

    it('deve fazer update através do service ativo', async () => {
      const updatedCliente = { ...mockCliente, nome: 'Nome Atualizado' }
      const updates = { nome: 'Nome Atualizado' }
      vi.mocked(updateInStorage).mockReturnValue([updatedCliente])

      const result = await DataServiceFactory.update('engflow_clientes', mockCliente.id, updates)

      expect(result).toEqual(updatedCliente)
      expect(updateInStorage).toHaveBeenCalledWith('engflow_clientes', mockCliente.id, updates)
    })

    it('deve fazer delete através do service ativo', async () => {
      await DataServiceFactory.delete('engflow_clientes', mockCliente.id)

      expect(deleteFromStorage).toHaveBeenCalledWith('engflow_clientes', mockCliente.id)
    })
  })

  describe('getFeatureFlags', () => {
    it('deve retornar a instância do FeatureFlagManager', () => {
      const flags = DataServiceFactory.getFeatureFlags()

      expect(flags).toBeInstanceOf(FeatureFlagManager)
      expect(flags).toBe(FeatureFlagManager.getInstance())
    })
  })
})