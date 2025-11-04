import { describe, it, expect } from 'vitest'
import { supabase } from '@/lib/supabaseClient'

describe('Schema Validation Simplificado', () => {
  it('deve conseguir acessar tabela clientes', async () => {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, nome')
      .limit(1)

    // Não deve ter erro de acesso
    expect(error).toBeNull()
    expect(data).toBeDefined()
  })

  it('deve conseguir acessar tabela obras', async () => {
    const { data, error } = await supabase
      .from('obras')
      .select('id, nome')
      .limit(1)

    expect(error).toBeNull()
    expect(data).toBeDefined()
  })

  it('deve conseguir acessar tabela setores', async () => {
    const { data, error } = await supabase
      .from('setores')
      .select('id, nome')
      .limit(1)

    expect(error).toBeNull()
    expect(data).toBeDefined()
  })

  it('deve conseguir acessar tabela funcoes', async () => {
    const { data, error } = await supabase
      .from('funcoes')
      .select('id, nome')
      .limit(1)

    expect(error).toBeNull()
    expect(data).toBeDefined()
  })

  it('deve conseguir acessar tabela funcionarios', async () => {
    const { data, error } = await supabase
      .from('funcionarios')
      .select('id, nome')
      .limit(1)

    expect(error).toBeNull()
    expect(data).toBeDefined()
  })

  it('deve conseguir acessar tabela despesas', async () => {
    const { data, error } = await supabase
      .from('despesas')
      .select('id, valor')
      .limit(1)

    expect(error).toBeNull()
    expect(data).toBeDefined()
  })

  it('deve conseguir acessar tabela videos', async () => {
    const { data, error } = await supabase
      .from('videos')
      .select('id, nome')
      .limit(1)

    expect(error).toBeNull()
    expect(data).toBeDefined()
  })

  it('deve conseguir acessar tabela requisicoes', async () => {
    const { data, error } = await supabase
      .from('requisicoes')
      .select('id, titulo')
      .limit(1)

    expect(error).toBeNull()
    expect(data).toBeDefined()
  })

  it('deve validar constraint de valor positivo em despesas', async () => {
    // Tenta inserir valor negativo (deve falhar)
    const { error } = await supabase
      .from('despesas')
      .insert({
        valor: -100,
        data_despesa: '2024-01-01'
      })

    // Deve ter erro por violação de constraint
    expect(error).toBeDefined()
    expect(error?.message).toContain('valor')
  })
})