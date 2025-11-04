import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import {
  useSupabaseQuery,
  useSupabaseQueryById,
  useSupabaseQueryFiltered,
  useOptimizedSupabaseQuery
} from '../useSupabaseQuery'

// Mock modules
vi.mock('@/lib/supabaseService')
vi.mock('@/lib/localStorage')
vi.mock('@/lib/errorHandler')

// Import mocked modules
import { supabaseService } from '@/lib/supabaseService'
import { getFromStorage } from '@/lib/localStorage'
import { FallbackStrategy } from '@/lib/errorHandler'

// Dados de teste
const mockCliente = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  nome: 'Empresa Teste',
  email: 'contato@empresateste.com',
  telefone: '(11) 99999-9999',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

const mockClientes = [mockCliente]

// Wrapper para React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
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

describe('useSupabaseQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(FallbackStrategy.shouldUseFallback).mockReturnValue(false)
  })

  it('deve buscar dados do Supabase com sucesso', async () => {
    vi.mocked(supabaseService.getFromSupabase).mockResolvedValue(mockClientes)

    const { result } = renderHook(
      () => useSupabaseQuery('CLIENTES'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockClientes)
    expect(supabaseService.getFromSupabase).toHaveBeenCalledWith('engflow_clientes')
  })

  it('deve usar fallback quando shouldUseFallback retorna true', async () => {
    vi.mocked(FallbackStrategy.shouldUseFallback).mockReturnValue(true)
    vi.mocked(getFromStorage).mockReturnValue(mockClientes)

    const { result } = renderHook(
      () => useSupabaseQuery('CLIENTES'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockClientes)
    expect(getFromStorage).toHaveBeenCalledWith('engflow_clientes')
    expect(supabaseService.getFromSupabase).not.toHaveBeenCalled()
  })

  it('deve ativar fallback quando Supabase falha', async () => {
    const mockError = new Error('Supabase error')
    vi.mocked(supabaseService.getFromSupabase).mockRejectedValue(mockError)
    vi.mocked(getFromStorage).mockReturnValue(mockClientes)

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { result } = renderHook(
      () => useSupabaseQuery('CLIENTES'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockClientes)
    expect(FallbackStrategy.enableFallback).toHaveBeenCalled()
    expect(getFromStorage).toHaveBeenCalledWith('engflow_clientes')

    consoleSpy.mockRestore()
  })
})

describe('useSupabaseQueryById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(FallbackStrategy.shouldUseFallback).mockReturnValue(false)
  })

  it('deve buscar item específico por ID', async () => {
    vi.mocked(supabaseService.getByIdFromSupabase).mockResolvedValue(mockCliente)

    const { result } = renderHook(
      () => useSupabaseQueryById('CLIENTES', mockCliente.id),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockCliente)
    expect(supabaseService.getByIdFromSupabase).toHaveBeenCalledWith('engflow_clientes', mockCliente.id)
  })

  it('deve retornar null quando ID não é fornecido', async () => {
    const { result } = renderHook(
      () => useSupabaseQueryById('CLIENTES', undefined),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeNull()
    expect(supabaseService.getByIdFromSupabase).not.toHaveBeenCalled()
  })
})

describe('useSupabaseQueryFiltered', () => {
  const filters = { ativo: true, setor: 'TI' }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(FallbackStrategy.shouldUseFallback).mockReturnValue(false)
  })

  it('deve buscar dados com filtros aplicados', async () => {
    vi.mocked(supabaseService.getFilteredFromSupabase).mockResolvedValue(mockClientes)

    const { result } = renderHook(
      () => useSupabaseQueryFiltered('CLIENTES', filters),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockClientes)
    expect(supabaseService.getFilteredFromSupabase).toHaveBeenCalledWith('engflow_clientes', filters)
  })
})

describe('useOptimizedSupabaseQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(FallbackStrategy.shouldUseFallback).mockReturnValue(false)
  })

  it('deve usar estratégia de cache específica', async () => {
    vi.mocked(supabaseService.getFromSupabase).mockResolvedValue([])

    const { result } = renderHook(
      () => useOptimizedSupabaseQuery('SETORES'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(supabaseService.getFromSupabase).toHaveBeenCalledWith('engflow_setores')
  })
})