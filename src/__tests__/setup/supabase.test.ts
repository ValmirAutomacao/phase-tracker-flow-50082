import { describe, it, expect, vi, beforeAll } from 'vitest'
import { supabase } from '@/lib/supabaseClient'

// Mock das variáveis de ambiente para teste
beforeAll(() => {
  vi.stubGlobal('import', {
    meta: {
      env: {
        VITE_SUPABASE_URL: 'https://ibnrtvrxogkksldvxici.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlibnJ0dnJ4b2dra3NsZHZ4aWNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NDkxMTQsImV4cCI6MjA3NzMyNTExNH0.VcedR4bpqo__fVsnrdYLc09sZVONZovtsQT4kM4r0u0'
      }
    }
  })
})

describe('Configuração Supabase', () => {
  it('deve criar cliente Supabase com sucesso', () => {
    expect(supabase).toBeDefined()
    expect(supabase.supabaseUrl).toBe('https://ibnrtvrxogkksldvxici.supabase.co')
    expect(supabase.supabaseKey).toBeDefined()

    // Validar que o cliente tem os métodos esperados para migração
    expect(supabase.from).toBeDefined()
    expect(supabase.auth).toBeDefined()
    expect(supabase.storage).toBeDefined()
    expect(typeof supabase.from).toBe('function')
  })

  it('deve validar resposta da API Supabase', async () => {
    // Teste básico de conectividade
    const { error } = await supabase.from('_non_existent_table').select('*').limit(1)

    // Esperamos um erro específico de tabela não encontrada, não erro de conectividade
    expect(error).toBeDefined()
    expect(error?.message).toMatch(/could not find|relation.*does not exist|table.*doesn't exist/i)
  }, 10000)

  it('deve verificar auth service disponível', async () => {
    const { data, error } = await supabase.auth.getSession()

    // Auth service deve responder (mesmo que sem sessão ativa)
    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data.session).toBeNull() // Esperado: não há sessão ativa inicialmente
  })

  it('deve confirmar storage service acessível', async () => {
    const { data, error } = await supabase.storage.listBuckets()

    // Storage service deve responder (mesmo que vazio ou com erro de permissão)
    expect(data !== undefined || error !== null).toBe(true)

    if (error) {
      // Se há erro, deve ser relacionado à permissão, não conectividade
      expect(error.message).not.toMatch(/network|connection|timeout/i)
    }
  })
})