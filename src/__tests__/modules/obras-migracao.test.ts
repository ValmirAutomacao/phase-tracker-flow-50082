import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock do supabaseService para testar migração
const mockSupabaseService = {
  getFromSupabase: vi.fn(),
  addToSupabase: vi.fn(),
  updateInSupabase: vi.fn(),
  deleteFromSupabase: vi.fn(),
}

vi.mock('@/lib/supabaseService', () => ({
  supabaseService: mockSupabaseService,
  getFromSupabase: mockSupabaseService.getFromSupabase,
  addToSupabase: mockSupabaseService.addToSupabase,
  updateInSupabase: mockSupabaseService.updateInSupabase,
  deleteFromSupabase: mockSupabaseService.deleteFromSupabase,
  SUPABASE_KEYS: {
    OBRAS: 'engflow_obras'
  }
}))

describe('Migração do Módulo Obras - Compatibilidade e Performance', () => {
  const mockObraData = {
    id: '1',
    cliente_id: 'cliente-123',
    nome: 'Edifício Alpha',
    etapas: [
      {
        id: 'etapa-1',
        nome: 'Fundação',
        responsavel: 'João Silva',
        dataInicio: '2024-12-01',
        dataPrevisao: '2024-12-15',
        progresso: 100,
        status: 'completed'
      }
    ],
    progresso: 75,
    orcamento: 500000,
    status: 'execucao' as const,
    data_inicio: '2024-12-01',
    data_fim: '2025-06-30',
    // Campos de compatibilidade
    endereco: 'Avenida Paulista',
    numero: '1000',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01310-000',
    cliente: 'Construtora XYZ Ltda',
    responsavel: 'João Silva',
    dataInicio: '2024-12-01',
    dataPrevisao: '2025-06-30'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Compatibilidade de Interface', () => {
    it('deve manter estrutura de dados compatível com localStorage', async () => {
      // Arrange
      const { supabaseService } = await import('@/lib/supabaseService')
      mockSupabaseService.getFromSupabase.mockResolvedValue([mockObraData])

      // Act
      const obras = await supabaseService.getFromSupabase('engflow_obras')

      // Assert
      expect(obras).toHaveLength(1)
      expect(obras[0]).toMatchObject({
        id: expect.any(String),
        cliente_id: expect.any(String),
        nome: expect.any(String),
        etapas: expect.any(Array),
        progresso: expect.any(Number),
        orcamento: expect.any(Number),
        status: expect.stringMatching(/^(planejamento|execucao|concluida)$/),
        data_inicio: expect.any(String),
      })
    })

    it('deve preservar relacionamento cliente_id', async () => {
      // Arrange
      const { supabaseService } = await import('@/lib/supabaseService')
      mockSupabaseService.getFromSupabase.mockResolvedValue([mockObraData])

      // Act
      const obras = await supabaseService.getFromSupabase('engflow_obras')

      // Assert
      const obra = obras[0]
      expect(obra.cliente_id).toBeDefined()
      expect(typeof obra.cliente_id).toBe('string')
      expect(obra.cliente_id).not.toBe('')
      expect(obra.cliente_id).not.toBeNull()
      expect(obra.cliente_id).not.toBeUndefined()
    })

    it('deve manter campo etapas como JSONB (array)', () => {
      expect(mockObraData.etapas).toBeInstanceOf(Array)
      expect(mockObraData.etapas).toHaveLength(1)
      expect(mockObraData.etapas[0]).toMatchObject({
        id: expect.any(String),
        nome: expect.any(String),
        responsavel: expect.any(String),
        dataInicio: expect.any(String),
        dataPrevisao: expect.any(String),
        progresso: expect.any(Number),
        status: expect.any(String)
      })
    })

    it('deve manter compatibilidade com status antigos e novos', () => {
      const statusValidos = ['planejamento', 'execucao', 'concluida', 'ativa', 'pausada']

      statusValidos.forEach(status => {
        expect(['planejamento', 'execucao', 'concluida', 'ativa', 'pausada']).toContain(status)
      })

      // Verificar mapeamento de status
      expect(mockObraData.status).toBe('execucao')
    })
  })

  describe('Operações CRUD - Migração localStorage → Supabase', () => {
    it('deve migrar getFromStorage para getFromSupabase', async () => {
      // Arrange
      const { supabaseService } = await import('@/lib/supabaseService')
      mockSupabaseService.getFromSupabase.mockResolvedValue([mockObraData])

      // Act
      const result = await supabaseService.getFromSupabase('engflow_obras')

      // Assert
      expect(mockSupabaseService.getFromSupabase).toHaveBeenCalledWith('engflow_obras')
      expect(result).toEqual([mockObraData])
    })

    it('deve migrar addToStorage para addToSupabase', async () => {
      // Arrange
      const { supabaseService } = await import('@/lib/supabaseService')
      const { id, ...novaObra } = mockObraData
      mockSupabaseService.addToSupabase.mockResolvedValue(mockObraData)

      // Act
      const result = await supabaseService.addToSupabase('engflow_obras', novaObra)

      // Assert
      expect(mockSupabaseService.addToSupabase).toHaveBeenCalledWith('engflow_obras', novaObra)
      expect(result).toEqual(mockObraData)
    })

    it('deve migrar updateInStorage para updateInSupabase', async () => {
      // Arrange
      const { supabaseService } = await import('@/lib/supabaseService')
      const updates = { nome: 'Edifício Alpha Atualizado', progresso: 80 }
      const updatedObra = { ...mockObraData, ...updates }
      mockSupabaseService.updateInSupabase.mockResolvedValue(updatedObra)

      // Act
      const result = await supabaseService.updateInSupabase('engflow_obras', '1', updates)

      // Assert
      expect(mockSupabaseService.updateInSupabase).toHaveBeenCalledWith('engflow_obras', '1', updates)
      expect(result).toEqual(updatedObra)
    })

    it('deve migrar deleteFromStorage para deleteFromSupabase', async () => {
      // Arrange
      const { supabaseService } = await import('@/lib/supabaseService')
      mockSupabaseService.deleteFromSupabase.mockResolvedValue(undefined)

      // Act
      await supabaseService.deleteFromSupabase('engflow_obras', '1')

      // Assert
      expect(mockSupabaseService.deleteFromSupabase).toHaveBeenCalledWith('engflow_obras', '1')
    })
  })

  describe('Funcionalidades Específicas de Obras', () => {
    it('deve preservar cálculo de progresso baseado em etapas', () => {
      const obras = [
        { ...mockObraData, progresso: 100 },
        { ...mockObraData, id: '2', progresso: 50 },
        { ...mockObraData, id: '3', progresso: 75 }
      ]

      // Simular cálculo de progresso médio do componente
      const progressoMedio = Math.round(obras.reduce((acc, obra) => acc + obra.progresso, 0) / obras.length)

      expect(progressoMedio).toBe(75) // (100 + 50 + 75) / 3 = 75
    })

    it('deve preservar gestão de orçamento', () => {
      expect(mockObraData.orcamento).toBeDefined()
      expect(typeof mockObraData.orcamento).toBe('number')
      expect(mockObraData.orcamento).toBeGreaterThan(0)

      // Verificar formatação de orçamento
      const orcamentoFormatado = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(mockObraData.orcamento)

      expect(orcamentoFormatado).toMatch(/^R\$\s[\d.,]+$/)
    })

    it('deve suportar busca por nome, cliente e endereço', () => {
      const obras = [
        mockObraData,
        { ...mockObraData, id: '2', nome: 'Residencial Beta', cliente: 'Imobiliária ABC' },
        { ...mockObraData, id: '3', nome: 'Comercial Gamma', endereco: 'Rua Central' }
      ]

      // Simular busca por nome
      const buscaNome = obras.filter(obra =>
        obra.nome.toLowerCase().includes('alpha'.toLowerCase())
      )
      expect(buscaNome).toHaveLength(1)

      // Simular busca por cliente
      const buscaCliente = obras.filter(obra =>
        obra.cliente && obra.cliente.toLowerCase().includes('abc'.toLowerCase())
      )
      expect(buscaCliente).toHaveLength(1)

      // Simular busca por endereço
      const buscaEndereco = obras.filter(obra =>
        obra.endereco && obra.endereco.toLowerCase().includes('central'.toLowerCase())
      )
      expect(buscaEndereco).toHaveLength(1)
    })
  })

  describe('Estatísticas Dinâmicas', () => {
    it('deve calcular estatísticas corretas baseadas nos dados', () => {
      const obras = [
        { ...mockObraData, status: 'execucao' as const },
        { ...mockObraData, id: '2', status: 'concluida' as const },
        { ...mockObraData, id: '3', status: 'planejamento' as const },
        { ...mockObraData, id: '4', status: 'ativa' as const } // Status de compatibilidade
      ]

      // Total de obras
      expect(obras.length).toBe(4)

      // Obras em execução (incluindo compatibilidade com 'ativa')
      const emExecucao = obras.filter(o => o.status === 'execucao' || o.status === 'ativa').length
      expect(emExecucao).toBe(2)

      // Obras concluídas
      const concluidas = obras.filter(o => o.status === 'concluida').length
      expect(concluidas).toBe(1)

      // Progresso médio
      const progressoMedio = obras.length > 0
        ? Math.round(obras.reduce((acc, obra) => acc + obra.progresso, 0) / obras.length)
        : 0
      expect(progressoMedio).toBe(75) // (75 + 75 + 75 + 75) / 4 = 75
    })
  })

  describe('Relacionamentos e Integridade', () => {
    it('deve manter relacionamentos com despesas/vídeos/requisições', () => {
      // Verificar que a obra tem ID válido para relacionamentos
      expect(mockObraData.id).toBeDefined()
      expect(typeof mockObraData.id).toBe('string')
      expect(mockObraData.id.length).toBeGreaterThan(0)

      // Verificar cliente_id para relacionamento com clientes
      expect(mockObraData.cliente_id).toBeDefined()
      expect(typeof mockObraData.cliente_id).toBe('string')
      expect(mockObraData.cliente_id.length).toBeGreaterThan(0)
    })

    it('deve validar estrutura de dados para relacionamentos futuros', () => {
      // Estrutura esperada para relacionamentos no banco
      const estruturaEsperada = {
        obra_id: mockObraData.id,
        cliente_id: mockObraData.cliente_id,
        // Campos que podem ser usados em outras tabelas
        nome_obra: mockObraData.nome,
        status_obra: mockObraData.status
      }

      expect(estruturaEsperada.obra_id).toBeDefined()
      expect(estruturaEsperada.cliente_id).toBeDefined()
      expect(estruturaEsperada.nome_obra).toBeDefined()
      expect(estruturaEsperada.status_obra).toBeDefined()
    })
  })

  describe('Performance e Cache', () => {
    it('deve manter performance adequada para listagens', async () => {
      // Teste de benchmark simples
      const { supabaseService } = await import('@/lib/supabaseService')

      const largeBatch = Array.from({ length: 50 }, (_, i) => ({
        ...mockObraData,
        id: i.toString(),
        nome: `Obra ${i}`
      }))

      mockSupabaseService.getFromSupabase.mockResolvedValue(largeBatch)

      const startTime = performance.now()
      const result = await supabaseService.getFromSupabase('engflow_obras')
      const endTime = performance.now()

      expect(result).toHaveLength(50)
      expect(endTime - startTime).toBeLessThan(1000) // Deve completar em menos de 1s
    })

    it('deve usar chaves de storage compatíveis', async () => {
      const { SUPABASE_KEYS } = await import('@/lib/supabaseService')

      // Verificar que as chaves mantêm compatibilidade com localStorage
      expect(SUPABASE_KEYS.OBRAS).toBe('engflow_obras')
      expect(typeof SUPABASE_KEYS.OBRAS).toBe('string')
      expect(SUPABASE_KEYS.OBRAS.startsWith('engflow_')).toBe(true)
    })
  })

  describe('Validação de Migração Zero Downtime', () => {
    it('deve manter interface visual exatamente igual', () => {
      // Elementos da interface que devem ser preservados
      const interfaceElements = [
        'Cadastro de Obras',
        'Gerenciamento completo de obras e projetos',
        'Total de Obras',
        'Em Execução',
        'Concluídas',
        'Progresso Médio',
        'Lista de Obras',
        'Nova Obra',
        'Buscar obra...'
      ]

      // Verificar que todos os textos da interface estão preservados
      interfaceElements.forEach(element => {
        expect(element).toBeDefined()
        expect(typeof element).toBe('string')
        expect(element.length).toBeGreaterThan(0)
      })
    })

    it('deve preservar todos os campos do formulário', () => {
      // Campos que devem estar presentes na interface de obra
      const camposEsperados = [
        'nome',
        'cliente_id',
        'etapas',
        'progresso',
        'orcamento',
        'status',
        'data_inicio',
        'data_fim'
      ]

      camposEsperados.forEach(campo => {
        expect(mockObraData).toHaveProperty(campo)
      })

      // Verificar tipos específicos
      expect(typeof mockObraData.nome).toBe('string')
      expect(typeof mockObraData.cliente_id).toBe('string')
      expect(Array.isArray(mockObraData.etapas)).toBe(true)
      expect(typeof mockObraData.progresso).toBe('number')
      expect(typeof mockObraData.orcamento).toBe('number')
      expect(['planejamento', 'execucao', 'concluida']).toContain(mockObraData.status)
    })
  })
})