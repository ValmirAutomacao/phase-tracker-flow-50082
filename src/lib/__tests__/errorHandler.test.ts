import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  ErrorHandler,
  AppError,
  AppErrorType,
  FallbackStrategy,
  withErrorHandling,
  withRetry
} from '../errorHandler'

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

describe('ErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('mapSupabaseError', () => {
    it('deve mapear erro PGRST116 para NOT_FOUND', () => {
      const supabaseError = { code: 'PGRST116', message: 'No rows returned' }

      const result = ErrorHandler.mapSupabaseError(supabaseError)

      expect(result).toEqual({
        type: AppErrorType.NOT_FOUND,
        message: 'Registro não encontrado.'
      })
    })

    it('deve mapear erro 23505 para CONFLICT', () => {
      const supabaseError = { code: '23505', message: 'Duplicate key violation' }

      const result = ErrorHandler.mapSupabaseError(supabaseError)

      expect(result).toEqual({
        type: AppErrorType.CONFLICT,
        message: 'Registro já existe com essas informações.'
      })
    })

    it('deve mapear erro 23503 para VALIDATION_ERROR', () => {
      const supabaseError = { code: '23503', message: 'Foreign key constraint' }

      const result = ErrorHandler.mapSupabaseError(supabaseError)

      expect(result).toEqual({
        type: AppErrorType.VALIDATION_ERROR,
        message: 'Erro de relacionamento entre dados.'
      })
    })

    it('deve mapear erro 23514 para VALIDATION_ERROR', () => {
      const supabaseError = { code: '23514', message: 'Check constraint violation' }

      const result = ErrorHandler.mapSupabaseError(supabaseError)

      expect(result).toEqual({
        type: AppErrorType.VALIDATION_ERROR,
        message: 'Dados inválidos fornecidos.'
      })
    })

    it('deve mapear erro 42601 para VALIDATION_ERROR', () => {
      const supabaseError = { code: '42601', message: 'Syntax error' }

      const result = ErrorHandler.mapSupabaseError(supabaseError)

      expect(result).toEqual({
        type: AppErrorType.VALIDATION_ERROR,
        message: 'Erro na estrutura da consulta.'
      })
    })

    it('deve mapear erro de rede para NETWORK_ERROR', () => {
      const networkError = { message: 'NetworkError when attempting to fetch resource.' }

      const result = ErrorHandler.mapSupabaseError(networkError)

      expect(result).toEqual({
        type: AppErrorType.NETWORK_ERROR,
        message: 'Erro de conexão. Verifique sua internet.'
      })
    })

    it('deve mapear erro de timeout para NETWORK_ERROR', () => {
      const timeoutError = { message: 'The operation was aborted.' }

      const result = ErrorHandler.mapSupabaseError(timeoutError)

      expect(result).toEqual({
        type: AppErrorType.NETWORK_ERROR,
        message: 'Timeout na operação. Tente novamente.'
      })
    })

    it('deve mapear erro desconhecido para DATABASE_ERROR', () => {
      const unknownError = { code: 'UNKNOWN', message: 'Something went wrong' }

      const result = ErrorHandler.mapSupabaseError(unknownError)

      expect(result).toEqual({
        type: AppErrorType.DATABASE_ERROR,
        message: 'Something went wrong'
      })
    })

    it('deve mapear erro sem código para DATABASE_ERROR', () => {
      const errorWithoutCode = { message: 'Generic error' }

      const result = ErrorHandler.mapSupabaseError(errorWithoutCode)

      expect(result).toEqual({
        type: AppErrorType.DATABASE_ERROR,
        message: 'Generic error'
      })
    })
  })

  describe('isRetryableError', () => {
    it('deve retornar true para NETWORK_ERROR', () => {
      const error: AppError = { type: AppErrorType.NETWORK_ERROR, message: 'Network error' }

      expect(ErrorHandler.isRetryableError(error)).toBe(true)
    })

    it('deve retornar true para DATABASE_ERROR', () => {
      const error: AppError = { type: AppErrorType.DATABASE_ERROR, message: 'Database error' }

      expect(ErrorHandler.isRetryableError(error)).toBe(true)
    })

    it('deve retornar false para NOT_FOUND', () => {
      const error: AppError = { type: AppErrorType.NOT_FOUND, message: 'Not found' }

      expect(ErrorHandler.isRetryableError(error)).toBe(false)
    })

    it('deve retornar false para VALIDATION_ERROR', () => {
      const error: AppError = { type: AppErrorType.VALIDATION_ERROR, message: 'Validation error' }

      expect(ErrorHandler.isRetryableError(error)).toBe(false)
    })

    it('deve retornar false para CONFLICT', () => {
      const error: AppError = { type: AppErrorType.CONFLICT, message: 'Conflict error' }

      expect(ErrorHandler.isRetryableError(error)).toBe(false)
    })
  })

  describe('logError', () => {
    it('deve fazer log do erro com contexto', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error: AppError = { type: AppErrorType.DATABASE_ERROR, message: 'Test error' }
      const context = { operation: 'test', table: 'clientes' }

      ErrorHandler.logError(error, context)

      expect(consoleSpy).toHaveBeenCalledWith(
        '🚨 [DATABASE_ERROR] Test error',
        context
      )

      consoleSpy.mockRestore()
    })

    it('deve fazer log sem contexto', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error: AppError = { type: AppErrorType.NETWORK_ERROR, message: 'Network error' }

      ErrorHandler.logError(error)

      expect(consoleSpy).toHaveBeenCalledWith(
        '🚨 [NETWORK_ERROR] Network error',
        undefined
      )

      consoleSpy.mockRestore()
    })
  })
})

describe('FallbackStrategy', () => {
  const FALLBACK_KEY = 'engflow_fallback_active'

  beforeEach(() => {
    vi.clearAllMocks()
    FallbackStrategy.disableFallback() // Reset state
  })

  afterEach(() => {
    FallbackStrategy.disableFallback() // Cleanup
  })

  describe('enableFallback', () => {
    it('deve ativar o fallback e salvar no localStorage', () => {
      FallbackStrategy.enableFallback()

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(FALLBACK_KEY, 'true')
      expect(FallbackStrategy.shouldUseFallback()).toBe(true)
    })
  })

  describe('disableFallback', () => {
    it('deve desativar o fallback e remover do localStorage', () => {
      FallbackStrategy.enableFallback()
      FallbackStrategy.disableFallback()

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(FALLBACK_KEY)
      expect(FallbackStrategy.shouldUseFallback()).toBe(false)
    })
  })

  describe('shouldUseFallback', () => {
    it('deve retornar true quando fallback está ativo em memória', () => {
      FallbackStrategy.enableFallback()

      expect(FallbackStrategy.shouldUseFallback()).toBe(true)
    })

    it('deve verificar localStorage quando não está em memória', () => {
      mockLocalStorage.getItem.mockReturnValue('true')

      expect(FallbackStrategy.shouldUseFallback()).toBe(true)
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(FALLBACK_KEY)
    })

    it('deve retornar false quando não está ativo', () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      expect(FallbackStrategy.shouldUseFallback()).toBe(false)
    })
  })

  describe('getStatus', () => {
    it('deve retornar status completo do fallback', () => {
      FallbackStrategy.enableFallback()

      const status = FallbackStrategy.getStatus()

      expect(status).toEqual({
        active: true,
        activatedAt: expect.any(Date),
        reason: 'Erro de conectividade com Supabase'
      })
    })

    it('deve retornar status inativo', () => {
      const status = FallbackStrategy.getStatus()

      expect(status).toEqual({
        active: false,
        activatedAt: null,
        reason: null
      })
    })
  })
})

describe('withErrorHandling', () => {
  it('deve executar função com sucesso', async () => {
    const mockFn = vi.fn().mockResolvedValue('success')
    const wrappedFn = withErrorHandling(mockFn, 'test operation')

    const result = await wrappedFn('arg1', 'arg2')

    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
  })

  it('deve capturar e transformar erros', async () => {
    const mockError = new Error('Test error')
    const mockFn = vi.fn().mockRejectedValue(mockError)
    const wrappedFn = withErrorHandling(mockFn, 'test operation')

    const spyMapError = vi.spyOn(ErrorHandler, 'mapSupabaseError')
    const spyLogError = vi.spyOn(ErrorHandler, 'logError')

    const mappedError: AppError = { type: AppErrorType.DATABASE_ERROR, message: 'Mapped error' }
    spyMapError.mockReturnValue(mappedError)
    spyLogError.mockImplementation(() => {})

    await expect(wrappedFn('arg1')).rejects.toEqual(mappedError)

    expect(spyMapError).toHaveBeenCalledWith(mockError)
    expect(spyLogError).toHaveBeenCalledWith(mappedError, { operation: 'test operation' })

    spyMapError.mockRestore()
    spyLogError.mockRestore()
  })
})

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('deve executar função com sucesso na primeira tentativa', async () => {
    const mockFn = vi.fn().mockResolvedValue('success')
    const retryFn = withRetry(mockFn, 3, 1000)

    const result = await retryFn('arg1')

    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(mockFn).toHaveBeenCalledWith('arg1')
  })

  it('deve fazer retry em erros retentáveis', async () => {
    const retryableError: AppError = { type: AppErrorType.NETWORK_ERROR, message: 'Network error' }
    const mockFn = vi.fn()
      .mockRejectedValueOnce(retryableError)
      .mockRejectedValueOnce(retryableError)
      .mockResolvedValue('success')

    const spyIsRetryable = vi.spyOn(ErrorHandler, 'isRetryableError').mockReturnValue(true)
    const retryFn = withRetry(mockFn, 3, 100)

    const resultPromise = retryFn('arg1')

    // Avança os timers para simular delay entre retries
    await vi.advanceTimersByTimeAsync(200) // Primeira retry
    await vi.advanceTimersByTimeAsync(200) // Segunda retry

    const result = await resultPromise

    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(3)

    spyIsRetryable.mockRestore()
  })

  it('deve falhar após esgotar tentativas', async () => {
    const retryableError: AppError = { type: AppErrorType.NETWORK_ERROR, message: 'Network error' }
    const mockFn = vi.fn().mockRejectedValue(retryableError)

    const spyIsRetryable = vi.spyOn(ErrorHandler, 'isRetryableError').mockReturnValue(true)
    const retryFn = withRetry(mockFn, 2, 100)

    const resultPromise = retryFn('arg1')

    // Avança os timers para simular delay entre retries
    await vi.advanceTimersByTimeAsync(100)

    await expect(resultPromise).rejects.toEqual(retryableError)
    expect(mockFn).toHaveBeenCalledTimes(2)

    spyIsRetryable.mockRestore()
  })

  it('deve falhar imediatamente em erros não retentáveis', async () => {
    const nonRetryableError: AppError = { type: AppErrorType.VALIDATION_ERROR, message: 'Validation error' }
    const mockFn = vi.fn().mockRejectedValue(nonRetryableError)

    const spyIsRetryable = vi.spyOn(ErrorHandler, 'isRetryableError').mockReturnValue(false)
    const retryFn = withRetry(mockFn, 3, 100)

    await expect(retryFn('arg1')).rejects.toEqual(nonRetryableError)
    expect(mockFn).toHaveBeenCalledTimes(1)

    spyIsRetryable.mockRestore()
  })

  it('deve usar backoff exponencial', async () => {
    const retryableError: AppError = { type: AppErrorType.NETWORK_ERROR, message: 'Network error' }
    const mockFn = vi.fn().mockRejectedValue(retryableError)

    const spyIsRetryable = vi.spyOn(ErrorHandler, 'isRetryableError').mockReturnValue(true)
    const retryFn = withRetry(mockFn, 3, 100)

    const resultPromise = retryFn('arg1')

    // Primeira retry: 100ms
    await vi.advanceTimersByTimeAsync(100)
    expect(mockFn).toHaveBeenCalledTimes(2)

    // Segunda retry: 200ms (backoff exponencial)
    await vi.advanceTimersByTimeAsync(200)
    expect(mockFn).toHaveBeenCalledTimes(3)

    await expect(resultPromise).rejects.toEqual(retryableError)

    spyIsRetryable.mockRestore()
  })
})