import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import {
  useSupabaseAdd,
  useSupabaseUpdate,
  useSupabaseDelete,
  useSupabaseSave,
  useSupabaseCRUD,
  useInvalidateSupabaseCache
} from '../useSupabaseMutation'

// Mock modules
vi.mock('@/lib/supabaseService')
vi.mock('@/lib/localStorage')
vi.mock('@/lib/errorHandler')

// Import mocked modules
import { supabaseService } from '@/lib/supabaseService'
import {
  addToStorage,
  updateInStorage,
  deleteFromStorage,
  saveToStorage
} from '@/lib/localStorage'
import { FallbackStrategy } from '@/lib/errorHandler'

// Mock crypto.randomUUID
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

const mockClienteUpdate = {
  nome: 'Empresa Atualizada',
  telefone: '(11) 88888-8888',
}

// Wrapper para React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useSupabaseAdd', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(FallbackStrategy.shouldUseFallback).mockReturnValue(false)
  })

  it('deve adicionar item via Supabase com sucesso', async () => {
    vi.mocked(supabaseService.addToSupabase).mockResolvedValue(mockCliente)

    const { result } = renderHook(
      () => useSupabaseAdd('CLIENTES'),
      { wrapper: createWrapper() }
    )

    act(() => {
      result.current.mutate(mockClienteToAdd)
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockCliente)
    expect(supabaseService.addToSupabase).toHaveBeenCalledWith('engflow_clientes', mockClienteToAdd)
  })

  it('deve usar fallback quando shouldUseFallback retorna true', async () => {
    vi.mocked(FallbackStrategy.shouldUseFallback).mockReturnValue(true)
    const clienteComId = { ...mockClienteToAdd, id: mockCliente.id }

    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

    const { result } = renderHook(
      () => useSupabaseAdd('CLIENTES'),
      { wrapper: createWrapper() }
    )

    act(() => {
      result.current.mutate(mockClienteToAdd)
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(clienteComId)
    expect(addToStorage).toHaveBeenCalledWith('engflow_clientes', clienteComId)
    expect(supabaseService.addToSupabase).not.toHaveBeenCalled()

    consoleSpy.mockRestore()
  })
})

describe('useSupabaseUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(FallbackStrategy.shouldUseFallback).mockReturnValue(false)
  })

  it('deve atualizar item via Supabase com sucesso', async () => {
    const updatedCliente = { ...mockCliente, ...mockClienteUpdate }
    vi.mocked(supabaseService.updateInSupabase).mockResolvedValue(updatedCliente)

    const { result } = renderHook(
      () => useSupabaseUpdate('CLIENTES'),
      { wrapper: createWrapper() }
    )

    act(() => {
      result.current.mutate({ id: mockCliente.id, updates: mockClienteUpdate })
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(updatedCliente)
    expect(supabaseService.updateInSupabase).toHaveBeenCalledWith(
      'engflow_clientes',
      mockCliente.id,
      mockClienteUpdate
    )
  })
})

describe('useSupabaseDelete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(FallbackStrategy.shouldUseFallback).mockReturnValue(false)
  })

  it('deve deletar item via Supabase com sucesso', async () => {
    vi.mocked(supabaseService.deleteFromSupabase).mockResolvedValue(undefined)

    const { result } = renderHook(
      () => useSupabaseDelete('CLIENTES'),
      { wrapper: createWrapper() }
    )

    act(() => {
      result.current.mutate(mockCliente.id)
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(supabaseService.deleteFromSupabase).toHaveBeenCalledWith('engflow_clientes', mockCliente.id)
  })
})

describe('useSupabaseSave', () => {
  const mockData = [mockCliente]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(FallbackStrategy.shouldUseFallback).mockReturnValue(false)
  })

  it('deve salvar dados via Supabase com sucesso', async () => {
    vi.mocked(supabaseService.saveToSupabase).mockResolvedValue(undefined)

    const { result } = renderHook(
      () => useSupabaseSave('CLIENTES'),
      { wrapper: createWrapper() }
    )

    act(() => {
      result.current.mutate(mockData)
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(supabaseService.saveToSupabase).toHaveBeenCalledWith('engflow_clientes', mockData)
  })
})

describe('useSupabaseCRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(FallbackStrategy.shouldUseFallback).mockReturnValue(false)
  })

  it('deve retornar todos os hooks CRUD', () => {
    const { result } = renderHook(
      () => useSupabaseCRUD('CLIENTES'),
      { wrapper: createWrapper() }
    )

    expect(result.current).toHaveProperty('add')
    expect(result.current).toHaveProperty('update')
    expect(result.current).toHaveProperty('delete')
    expect(result.current).toHaveProperty('save')
    expect(result.current).toHaveProperty('isLoading')
    expect(result.current).toHaveProperty('isError')
    expect(result.current).toHaveProperty('error')
  })
})

describe('useInvalidateSupabaseCache', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    vi.clearAllMocks()
  })

  it('deve invalidar cache específico por chave', () => {
    const { result } = renderHook(
      () => useInvalidateSupabaseCache(),
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        )
      }
    )

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    act(() => {
      result.current.invalidateKey('CLIENTES')
    })

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['supabase', 'engflow_clientes'] })
  })
})