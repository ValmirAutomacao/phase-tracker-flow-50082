import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query'
import { supabaseService, SUPABASE_KEYS } from '@/lib/supabaseService'
import { FallbackStrategy } from '@/lib/errorHandler'
import { getFromStorage } from '@/lib/localStorage'

// Interface genérica para entidades que têm ID
interface BaseEntity {
  id: string
  [key: string]: unknown
}

// Configurações padrão de cache otimizadas para performance
const DEFAULT_CACHE_CONFIG = {
  staleTime: 5 * 60 * 1000, // 5 minutos
  gcTime: 10 * 60 * 1000,   // 10 minutos (anteriormente cacheTime)
  refetchOnWindowFocus: false,
  refetchOnMount: true,
  retry: 1, // Retry limitado pois temos retry no supabaseService
}

/**
 * Hook customizado para queries Supabase com cache React Query
 * Compatível com localStorage como fallback
 */
export function useSupabaseQuery<T extends BaseEntity>(
  key: keyof typeof SUPABASE_KEYS,
  options?: Omit<UseQueryOptions<T[], Error>, 'queryKey' | 'queryFn'>
): UseQueryResult<T[], Error> {
  const storageKey = SUPABASE_KEYS[key]

  return useQuery({
    queryKey: ['supabase', storageKey],
    queryFn: async (): Promise<T[]> => {
      // Verifica se deve usar fallback para localStorage
      if (FallbackStrategy.shouldUseFallback()) {
        console.info(`🔄 Usando fallback localStorage para ${storageKey}`)
        return getFromStorage<T>(storageKey)
      }

      try {
        return await supabaseService.getFromSupabase<T>(storageKey)
      } catch (error) {
        // Em caso de erro, ativa fallback e retorna dados localStorage
        console.warn(`⚠️ Erro Supabase para ${storageKey}, usando fallback:`, error)
        FallbackStrategy.enableFallback()
        return getFromStorage<T>(storageKey)
      }
    },
    ...DEFAULT_CACHE_CONFIG,
    ...options,
  })
}

/**
 * Hook para buscar um item específico por ID
 */
export function useSupabaseQueryById<T extends BaseEntity>(
  key: keyof typeof SUPABASE_KEYS,
  id: string | undefined,
  options?: Omit<UseQueryOptions<T | null, Error>, 'queryKey' | 'queryFn'>
): UseQueryResult<T | null, Error> {
  const storageKey = SUPABASE_KEYS[key]

  return useQuery({
    queryKey: ['supabase', storageKey, 'byId', id],
    queryFn: async (): Promise<T | null> => {
      if (!id) return null

      // Fallback para localStorage
      if (FallbackStrategy.shouldUseFallback()) {
        const items = getFromStorage<T>(storageKey)
        return items.find(item => item.id === id) || null
      }

      try {
        return await supabaseService.getByIdFromSupabase<T>(storageKey, id)
      } catch (error) {
        console.warn(`⚠️ Erro Supabase para ${storageKey}/${id}, usando fallback:`, error)
        const items = getFromStorage<T>(storageKey)
        return items.find(item => item.id === id) || null
      }
    },
    enabled: !!id,
    ...DEFAULT_CACHE_CONFIG,
    ...options,
  })
}

/**
 * Hook para queries com filtros customizados
 */
export function useSupabaseQueryFiltered<T extends BaseEntity>(
  key: keyof typeof SUPABASE_KEYS,
  filters: Record<string, unknown>,
  options?: Omit<UseQueryOptions<T[], Error>, 'queryKey' | 'queryFn'>
): UseQueryResult<T[], Error> {
  const storageKey = SUPABASE_KEYS[key]

  return useQuery({
    queryKey: ['supabase', storageKey, 'filtered', filters],
    queryFn: async (): Promise<T[]> => {
      // Fallback para localStorage com filtro manual
      if (FallbackStrategy.shouldUseFallback()) {
        const items = getFromStorage<T>(storageKey)
        return items.filter(item => {
          return Object.entries(filters).every(([field, value]) => {
            return item[field] === value
          })
        })
      }

      try {
        return await supabaseService.getFilteredFromSupabase<T>(storageKey, filters)
      } catch (error) {
        console.warn(`⚠️ Erro Supabase filtered para ${storageKey}, usando fallback:`, error)
        const items = getFromStorage<T>(storageKey)
        return items.filter(item => {
          return Object.entries(filters).every(([field, value]) => {
            return item[field] === value
          })
        })
      }
    },
    ...DEFAULT_CACHE_CONFIG,
    ...options,
  })
}

/**
 * Cache strategies específicas por entidade
 */
export const cacheStrategies = {
  // Dados que mudam raramente - cache mais longo
  setores: {
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 30 * 60 * 1000,    // 30 minutos
  },
  funcoes: {
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  },
  funcionarios: {
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 20 * 60 * 1000,
  },

  // Dados que mudam com frequência - cache mais curto
  obras: {
    staleTime: 2 * 60 * 1000,  // 2 minutos
    gcTime: 10 * 60 * 1000,
  },
  despesas: {
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  },
  requisicoes: {
    staleTime: 1 * 60 * 1000,  // 1 minuto
    gcTime: 5 * 60 * 1000,
  },

  // Dados dinâmicos - cache muito curto
  videos: {
    staleTime: 30 * 1000,      // 30 segundos
    gcTime: 5 * 60 * 1000,
  },

  // Dados base - cache longo
  clientes: {
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  },
}

/**
 * Hook otimizado por tipo de entidade
 */
export function useOptimizedSupabaseQuery<T extends BaseEntity>(
  key: keyof typeof SUPABASE_KEYS,
  options?: Omit<UseQueryOptions<T[], Error>, 'queryKey' | 'queryFn'>
): UseQueryResult<T[], Error> {
  const strategy = cacheStrategies[key] || DEFAULT_CACHE_CONFIG

  return useSupabaseQuery<T>(key, {
    ...strategy,
    ...options,
  })
}