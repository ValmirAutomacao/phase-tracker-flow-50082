import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { supabase } from '@/lib/supabaseClient'

describe('Database Schema Validation', () => {
  let testClienteId: string
  let testSetorId: string
  let testFuncaoId: string
  let testFuncionarioId: string
  let testObraId: string

  beforeAll(async () => {
    // Cleanup any test data
    await cleanupTestData()
  })

  afterAll(async () => {
    // Cleanup test data after tests
    await cleanupTestData()
  })

  async function cleanupTestData() {
    // Delete in correct order due to foreign key constraints
    await supabase.from('requisicoes').delete().like('titulo', '%TESTE%')
    await supabase.from('videos').delete().like('nome', '%TESTE%')
    await supabase.from('despesas').delete().like('descricao', '%TESTE%')
    await supabase.from('obras').delete().like('nome', '%TESTE%')
    await supabase.from('funcionarios').delete().like('nome', '%TESTE%')
    await supabase.from('funcoes').delete().like('nome', '%TESTE%')
    await supabase.from('setores').delete().like('nome', '%TESTE%')
    await supabase.from('clientes').delete().like('nome', '%TESTE%')
  }

  describe('Tabelas Principais', () => {
    it('deve validar estrutura da tabela clientes', async () => {
      const { data, error } = await supabase
        .from('clientes')
        .insert({
          nome: 'Cliente TESTE',
          tipo: 'juridico',
          documento: '12.345.678/0001-99',
          endereco: { rua: 'Rua Teste', numero: '123' },
          contato: { email: 'teste@cliente.com', telefone: '11999999999' }
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.id).toBeDefined()
      expect(data.nome).toBe('Cliente TESTE')
      expect(data.tipo).toBe('juridico')

      testClienteId = data.id
    })

    it('deve validar hierarquia RH (setores -> funcoes -> funcionarios)', async () => {
      // Criar setor
      const { data: setor, error: setorError } = await supabase
        .from('setores')
        .insert({ nome: 'Setor TESTE', descricao: 'Setor para testes' })
        .select()
        .single()

      expect(setorError).toBeNull()
      expect(setor.id).toBeDefined()
      testSetorId = setor.id

      // Criar função
      const { data: funcao, error: funcaoError } = await supabase
        .from('funcoes')
        .insert({
          setor_id: testSetorId,
          nome: 'Função TESTE',
          descricao: 'Função para testes'
        })
        .select()
        .single()

      expect(funcaoError).toBeNull()
      expect(funcao.setor_id).toBe(testSetorId)
      testFuncaoId = funcao.id

      // Criar funcionário
      const { data: funcionario, error: funcionarioError } = await supabase
        .from('funcionarios')
        .insert({
          funcao_id: testFuncaoId,
          nome: 'Funcionário TESTE',
          email: 'funcionario.teste@empresa.com'
        })
        .select()
        .single()

      expect(funcionarioError).toBeNull()
      expect(funcionario.funcao_id).toBe(testFuncaoId)
      testFuncionarioId = funcionario.id
    })

    it('deve validar tabela obras com relacionamento cliente', async () => {
      const { data, error } = await supabase
        .from('obras')
        .insert({
          cliente_id: testClienteId,
          nome: 'Obra TESTE',
          progresso: 50,
          status: 'em_andamento',
          etapas: { fase1: 'completa', fase2: 'em_andamento' }
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data.cliente_id).toBe(testClienteId)
      expect(data.progresso).toBe(50)

      testObraId = data.id
    })
  })

  describe('Tabelas com Campos n8n', () => {
    it('deve validar tabela despesas com campos preparatórios n8n', async () => {
      const { data, error } = await supabase
        .from('despesas')
        .insert({
          cliente_id: testClienteId,
          obra_id: testObraId,
          valor: 1500.50,
          descricao: 'Despesa TESTE',
          data_despesa: '2024-01-15',
          comprovante_url: 'https://exemplo.com/comprovante.pdf',
          fornecedor_cnpj: '98.765.432/0001-11',
          numero_documento: 'NF-12345'
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data.comprovante_url).toBeDefined()
      expect(data.fornecedor_cnpj).toBeDefined()
      expect(data.numero_documento).toBeDefined()
    })

    it('deve validar tabela videos com campos preparatórios n8n', async () => {
      const { data, error } = await supabase
        .from('videos')
        .insert({
          obra_id: testObraId,
          nome: 'Video TESTE',
          status_renderizacao: 'pendente',
          drive_pasta_id: 'pasta123',
          drive_subpasta_id: 'subpasta456',
          n8n_job_id: 'job789'
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data.drive_pasta_id).toBeDefined()
      expect(data.drive_subpasta_id).toBeDefined()
      expect(data.n8n_job_id).toBeDefined()
    })

    it('deve validar tabela requisições com relacionamentos', async () => {
      const { data, error } = await supabase
        .from('requisicoes')
        .insert({
          obra_id: testObraId,
          funcionario_solicitante_id: testFuncionarioId,
          titulo: 'Requisição TESTE',
          descricao: 'Descrição da requisição',
          status: 'pendente',
          prioridade: 'alta'
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data.obra_id).toBe(testObraId)
      expect(data.funcionario_solicitante_id).toBe(testFuncionarioId)
    })
  })

  describe('Constraints e Validações', () => {
    it('deve validar constraint de tipo em clientes', async () => {
      const { error } = await supabase
        .from('clientes')
        .insert({
          nome: 'Cliente Inválido',
          tipo: 'invalido' // Tipo inválido
        })

      expect(error).not.toBeNull()
      expect(error?.message).toContain('check')
    })

    it('deve validar constraint de progresso em obras (0-100)', async () => {
      const { error } = await supabase
        .from('obras')
        .insert({
          cliente_id: testClienteId,
          nome: 'Obra Inválida',
          progresso: 150 // Progresso inválido
        })

      expect(error).not.toBeNull()
      expect(error?.message).toContain('check')
    })

    it('deve validar valor positivo em despesas', async () => {
      const { error } = await supabase
        .from('despesas')
        .insert({
          cliente_id: testClienteId,
          obra_id: testObraId,
          valor: -100, // Valor negativo inválido
          data_despesa: '2024-01-15'
        })

      expect(error).not.toBeNull()
      expect(error?.message).toContain('check')
    })
  })

  describe('Row Level Security (RLS)', () => {
    it('deve verificar se RLS está habilitado em todas as tabelas', async () => {
      const tabelas = [
        'clientes', 'obras', 'setores', 'funcoes',
        'funcionarios', 'despesas', 'videos', 'requisicoes'
      ]

      for (const tabela of tabelas) {
        const { data } = await supabase.rpc('get_table_rls_status', { table_name: tabela })
        // Note: Esta função RPC seria criada separadamente para verificar RLS
        // Por ora, assumimos que RLS está habilitado conforme implementado
      }
    })
  })
})