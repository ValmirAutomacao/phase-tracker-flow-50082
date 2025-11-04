import { useMutation, useQueryClient, UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import { supabaseService, SUPABASE_KEYS } from '@/lib/supabaseService'
import { FallbackStrategy, AppError } from '@/lib/errorHandler'
import {
  addToStorage,
  updateInStorage,
  deleteFromStorage,
  saveToStorage,
  getFromStorage
} from '@/lib/localStorage'

// Interface genérica para entidades que têm ID
interface BaseEntity {
  id: string
  [key: string]: any
}

/**
 * Hook para mutations de adição com invalidação inteligente de cache
 */
export function useSupabaseAdd<T extends BaseEntity>(
  key: keyof typeof SUPABASE_KEYS,
  options?: Omit<UseMutationOptions<T, AppError, Omit<T, 'id' | 'created_at' | 'updated_at'>>, 'mutationFn'>
): UseMutationResult<T, AppError, Omit<T, 'id' | 'created_at' | 'updated_at'>> {
  const queryClient = useQueryClient()
  const storageKey = SUPABASE_KEYS[key]

  return useMutation({
    mutationFn: async (item: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> => {
      // Fallback para localStorage
      if (FallbackStrategy.shouldUseFallback()) {
        console.info(`🔄 Usando fallback localStorage para adicionar em ${storageKey}`)
        const itemWithId = { ...item, id: crypto.randomUUID() } as T
        addToStorage(storageKey, itemWithId)
        return itemWithId
      }

      try {
        return await supabaseService.addToSupabase<T>(storageKey, item)
      } catch (error) {
        // Fallback automático em caso de erro
        console.warn(`⚠️ Erro ao adicionar em ${storageKey}, usando fallback:`, error)
        FallbackStrategy.enableFallback()
        const itemWithId = { ...item, id: crypto.randomUUID() } as T
        addToStorage(storageKey, itemWithId)
        return itemWithId
      }
    },
    onSuccess: (data, variables) => {
      // Invalidação inteligente do cache
      queryClient.invalidateQueries({ queryKey: ['supabase', storageKey] })

      // Atualização otimista do cache para melhor UX
      queryClient.setQueryData<T[]>(['supabase', storageKey], (oldData) => {
        if (!oldData) return [data]
        return [data, ...oldData]
      })

      options?.onSuccess?.(data, variables, undefined as any)
    },
    onError: (error, variables) => {
      console.error(`Erro ao adicionar ${key}:`, error)
      options?.onError?.(error, variables, undefined as any)
    },
    ...options,
  })
}

/**
 * Hook para mutations de atualização
 */
export function useSupabaseUpdate<T extends BaseEntity>(
  key: keyof typeof SUPABASE_KEYS,
  options?: Omit<UseMutationOptions<T, AppError, { id: string; updates: Partial<Omit<T, 'id' | 'created_at'>> }>, 'mutationFn'>
): UseMutationResult<T, AppError, { id: string; updates: Partial<Omit<T, 'id' | 'created_at'>> }> {
  const queryClient = useQueryClient()
  const storageKey = SUPABASE_KEYS[key]

  return useMutation({
    mutationFn: async ({ id, updates }): Promise<T> => {
      // Fallback para localStorage
      if (FallbackStrategy.shouldUseFallback()) {
        console.info(`🔄 Usando fallback localStorage para atualizar em ${storageKey}`)
        const items = updateInStorage<T>(storageKey, id, updates as any)
        const updatedItem = items.find(item => item.id === id)
        if (!updatedItem) throw new Error(`Item ${id} não encontrado`)
        return updatedItem
      }

      try {
        return await supabaseService.updateInSupabase<T>(storageKey, id, updates as any)
      } catch (error) {
        console.warn(`⚠️ Erro ao atualizar ${storageKey}/${id}, usando fallback:`, error)
        FallbackStrategy.enableFallback()
        const items = updateInStorage<T>(storageKey, id, updates as any)
        const updatedItem = items.find(item => item.id === id)
        if (!updatedItem) throw new Error(`Item ${id} não encontrado`)
        return updatedItem
      }
    },
    onSuccess: (data, variables) => {
      // Invalidação do cache
      queryClient.invalidateQueries({ queryKey: ['supabase', storageKey] })

      // Atualização otimista dos dados em cache
      queryClient.setQueryData<T[]>(['supabase', storageKey], (oldData) => {
        if (!oldData) return [data]
        return oldData.map(item => item.id === variables.id ? data : item)
      })

      // Atualiza cache do item específico
      queryClient.setQueryData(['supabase', storageKey, 'byId', variables.id], data)

      options?.onSuccess?.(data, variables, undefined as any)
    },
    onError: (error, variables) => {
      console.error(`Erro ao atualizar ${key}:`, error)
      options?.onError?.(error, variables, undefined as any)
    },
    ...options,
  })
}

/**
 * Hook para mutations de deleção
 */
export function useSupabaseDelete(
  key: keyof typeof SUPABASE_KEYS,
  options?: Omit<UseMutationOptions<void, AppError, string>, 'mutationFn'>
): UseMutationResult<void, AppError, string> {
  const queryClient = useQueryClient()
  const storageKey = SUPABASE_KEYS[key]

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      // Fallback para localStorage
      if (FallbackStrategy.shouldUseFallback()) {
        console.info(`🔄 Usando fallback localStorage para deletar de ${storageKey}`)
        deleteFromStorage(storageKey, id)
        return
      }

      try {
        await supabaseService.deleteFromSupabase(storageKey, id)
      } catch (error) {
        console.warn(`⚠️ Erro ao deletar ${storageKey}/${id}, usando fallback:`, error)
        FallbackStrategy.enableFallback()
        deleteFromStorage(storageKey, id)
      }
    },
    onSuccess: (_, id) => {
      // Invalidação do cache
      queryClient.invalidateQueries({ queryKey: ['supabase', storageKey] })

      // Remoção otimista do cache
      queryClient.setQueryData<BaseEntity[]>(['supabase', storageKey], (oldData) => {
        if (!oldData) return []
        return oldData.filter(item => item.id !== id)
      })

      // Remove do cache específico por ID
      queryClient.removeQueries({ queryKey: ['supabase', storageKey, 'byId', id] })

      options?.onSuccess?.(undefined as any, id, undefined as any)
    },
    onError: (error, id) => {
      console.error(`Erro ao deletar ${key}:`, error)
      options?.onError?.(error, id, undefined as any)
    },
    ...options,
  })
}

/**
 * Hook para substituição completa de dados (equivale a saveToStorage)
 * USO COM CUIDADO: Remove todos os dados existentes
 */
export function useSupabaseSave<T extends BaseEntity>(
  key: keyof typeof SUPABASE_KEYS,
  options?: Omit<UseMutationOptions<void, AppError, T[]>, 'mutationFn'>
): UseMutationResult<void, AppError, T[]> {
  const queryClient = useQueryClient()
  const storageKey = SUPABASE_KEYS[key]

  return useMutation({
    mutationFn: async (data: T[]): Promise<void> => {
      // Fallback para localStorage
      if (FallbackStrategy.shouldUseFallback()) {
        console.info(`🔄 Usando fallback localStorage para salvar em ${storageKey}`)
        saveToStorage(storageKey, data)
        return
      }

      try {
        await supabaseService.saveToSupabase<T>(storageKey, data)
      } catch (error) {
        console.warn(`⚠️ Erro ao salvar ${storageKey}, usando fallback:`, error)
        FallbackStrategy.enableFallback()
        saveToStorage(storageKey, data)
      }
    },
    onSuccess: (_, variables) => {
      // Atualização completa do cache
      queryClient.setQueryData(['supabase', storageKey], variables)

      // Invalidação de queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['supabase', storageKey] })

      options?.onSuccess?.(undefined as any, variables, undefined as any)
    },
    onError: (error, variables) => {
      console.error(`Erro ao salvar ${key}:`, error)
      options?.onError?.(error, variables, undefined as any)
    },
    ...options,
  })
}

/**
 * Hook combinado para todas as operações CRUD
 */
export function useSupabaseCRUD<T extends BaseEntity>(key: keyof typeof SUPABASE_KEYS) {
  const add = useSupabaseAdd<T>(key)
  const update = useSupabaseUpdate<T>(key)
  const remove = useSupabaseDelete(key)
  const save = useSupabaseSave<T>(key)

  return {
    add,
    update,
    delete: remove,
    save,

    // Estados consolidados
    isLoading: add.isPending || update.isPending || remove.isPending || save.isPending,
    isError: add.isError || update.isError || remove.isError || save.isError,
    error: add.error || update.error || remove.error || save.error,
  }
}

/**
 * Utilitário para invalidação manual de cache
 */
export function useInvalidateSupabaseCache() {
  const queryClient = useQueryClient()

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ['supabase'] })
    },
    invalidateKey: (key: keyof typeof SUPABASE_KEYS) => {
      const storageKey = SUPABASE_KEYS[key]
      queryClient.invalidateQueries({ queryKey: ['supabase', storageKey] })
    },
    clearAll: () => {
      queryClient.clear()
    },
  }
}