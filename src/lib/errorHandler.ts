import { PostgrestError } from '@supabase/supabase-js'

// Tipos de erro específicos da aplicação
export enum AppErrorType {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  FORBIDDEN = 'FORBIDDEN',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  type: AppErrorType
  message: string
  originalError?: any
  code?: string
  details?: Record<string, any>
}

/**
 * Handler centralizado de erros para mapear erros Supabase para formato conhecido
 */
export class ErrorHandler {
  /**
   * Mapeia erros do Supabase para erros padronizados da aplicação
   */
  static mapSupabaseError(error: PostgrestError | Error | any): AppError {
    // Error de rede/conectividade
    if (error.name === 'NetworkError' || error.message?.includes('network')) {
      return {
        type: AppErrorType.NETWORK,
        message: 'Erro de conexão. Verifique sua internet e tente novamente.',
        originalError: error,
      }
    }

    // Erro PostgreSQL/Supabase
    if (error.code) {
      switch (error.code) {
        case 'PGRST116':
          return {
            type: AppErrorType.NOT_FOUND,
            message: 'Registro não encontrado.',
            originalError: error,
            code: error.code,
          }

        case 'PGRST301':
          return {
            type: AppErrorType.AUTH,
            message: 'Acesso negado. Verifique suas permissões.',
            originalError: error,
            code: error.code,
          }

        case '23505': // unique_violation
          return {
            type: AppErrorType.VALIDATION,
            message: 'Este registro já existe. Verifique os dados e tente novamente.',
            originalError: error,
            code: error.code,
          }

        case '23503': // foreign_key_violation
          return {
            type: AppErrorType.VALIDATION,
            message: 'Não é possível executar esta operação devido a relacionamentos existentes.',
            originalError: error,
            code: error.code,
          }

        case '23502': // not_null_violation
          return {
            type: AppErrorType.VALIDATION,
            message: 'Campos obrigatórios não foram preenchidos.',
            originalError: error,
            code: error.code,
          }

        case '23514': // check_violation
          return {
            type: AppErrorType.VALIDATION,
            message: 'Os dados fornecidos não atendem aos critérios de validação.',
            originalError: error,
            code: error.code,
          }

        default:
          return {
            type: AppErrorType.SERVER,
            message: `Erro no servidor: ${error.message || 'Erro desconhecido'}`,
            originalError: error,
            code: error.code,
          }
      }
    }

    // Erro de autenticação
    if (error.status === 401 || error.message?.includes('auth')) {
      return {
        type: AppErrorType.AUTH,
        message: 'Sessão expirada. Faça login novamente.',
        originalError: error,
      }
    }

    // Erro de permissão
    if (error.status === 403) {
      return {
        type: AppErrorType.FORBIDDEN,
        message: 'Você não tem permissão para executar esta ação.',
        originalError: error,
      }
    }

    // Erro genérico
    return {
      type: AppErrorType.UNKNOWN,
      message: error.message || 'Ocorreu um erro inesperado. Tente novamente.',
      originalError: error,
    }
  }

  /**
   * Registra o erro no console com informações estruturadas
   */
  static logError(error: AppError, context?: string): void {
    const logData = {
      type: error.type,
      message: error.message,
      code: error.code,
      context,
      timestamp: new Date().toISOString(),
      originalError: error.originalError,
    }

    console.error('🚨 Application Error:', logData)

    // Em produção, aqui seria enviado para serviço de logging (Sentry, LogRocket, etc.)
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrar com serviço de logging externo
    }
  }

  /**
   * Determina se o erro é recuperável (pode tentar novamente)
   */
  static isRecoverable(error: AppError): boolean {
    switch (error.type) {
      case AppErrorType.NETWORK:
      case AppErrorType.SERVER:
        return true
      case AppErrorType.AUTH:
      case AppErrorType.FORBIDDEN:
      case AppErrorType.VALIDATION:
      case AppErrorType.NOT_FOUND:
        return false
      default:
        return false
    }
  }

  /**
   * Retorna uma mensagem amigável para o usuário
   */
  static getUserMessage(error: AppError): string {
    return error.message
  }
}

/**
 * Hook para wrapping de operações que podem gerar erro
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  operation: T,
  context?: string
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await operation(...args)
    } catch (error) {
      const appError = ErrorHandler.mapSupabaseError(error)
      ErrorHandler.logError(appError, context)
      throw appError
    }
  }) as T
}

/**
 * Strategy de fallback para localStorage em caso de erro Supabase
 */
export class FallbackStrategy {
  private static fallbackToLocalStorage = false

  static enableFallback(): void {
    // Fallback desabilitado - sempre usar Supabase
    console.warn('⚠️ Tentativa de ativar fallback ignorada - sistema configurado para usar apenas Supabase')
  }

  static disableFallback(): void {
    this.fallbackToLocalStorage = false
    console.info('✅ Sistema usando Supabase como fonte primária')
  }

  static shouldUseFallback(): boolean {
    // Sempre retorna false - não usar fallback
    return false
  }

  /**
   * Monitora erros consecutivos para ativar fallback automático
   */
  private static consecutiveErrors = 0
  private static readonly MAX_CONSECUTIVE_ERRORS = 3

  static recordError(): void {
    this.consecutiveErrors++
    if (this.consecutiveErrors >= this.MAX_CONSECUTIVE_ERRORS) {
      this.enableFallback()
    }
  }

  static recordSuccess(): void {
    this.consecutiveErrors = 0
    if (this.fallbackToLocalStorage) {
      this.disableFallback()
    }
  }
}

/**
 * Decorator para retry automático em operações Supabase
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  operation: T,
  maxRetries = 3,
  delay = 1000
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    let lastError: AppError

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation(...args)
        FallbackStrategy.recordSuccess()
        return result
      } catch (error) {
        lastError = error instanceof Error ? ErrorHandler.mapSupabaseError(error) : error
        FallbackStrategy.recordError()

        // Se não é recuperável ou é a última tentativa, lança o erro
        if (!ErrorHandler.isRecoverable(lastError) || attempt === maxRetries) {
          throw lastError
        }

        // Aguarda antes da próxima tentativa
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
      }
    }

    throw lastError!
  }) as T
}

// Export das principais funções para uso
// AppErrorType e AppError já foram exportados anteriormente