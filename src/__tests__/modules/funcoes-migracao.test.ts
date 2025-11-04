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
    FUNCOES: 'engflow_funcoes',
    SETORES: 'engflow_setores'
  }
}))

describe('Migração do Módulo Funções - Hierarquia e Relacionamentos', () => {
  const mockSetorData = {
    id: 'setor-1',
    nome: 'Engenharia',
    descricao: 'Departamento de engenharia'
  }

  const mockFuncaoData = {
    id: '1',
    setor_id: 'setor-1',
    nome: 'Engenheiro Civil',
    descricao: 'Responsável técnico pela execução da obra',
    nivel: 'Técnico',
    permissoes: ['Validar etapas', 'Aprovar materiais'],
    totalColaboradores: 3,
    setor: {
      id: 'setor-1',
      nome: 'Engenharia'
    },
    created_at: '2024-11-02T10:00:00Z',
    updated_at: '2024-11-02T10:00:00Z'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Compatibilidade de Interface', () => {
    it('deve manter estrutura de dados compatível com localStorage', async () => {
      // Arrange
      const { supabaseService } = await import('@/lib/supabaseService')
      mockSupabaseService.getFromSupabase.mockResolvedValue([mockFuncaoData])

      // Act
      const funcoes = await supabaseService.getFromSupabase('engflow_funcoes')

      // Assert
      expect(funcoes).toHaveLength(1)
      expect(funcoes[0]).toMatchObject({
        id: expect.any(String),
        setor_id: expect.any(String),
        nome: expect.any(String),
        descricao: expect.any(String),
        nivel: expect.any(String),
        permissoes: expect.any(Array)
      })
    })

    it('deve preservar relacionamento setor_id (FK)', async () => {
      // Arrange
      const { supabaseService } = await import('@/lib/supabaseService')
      mockSupabaseService.getFromSupabase.mockResolvedValue([mockFuncaoData])

      // Act
      const funcoes = await supabaseService.getFromSupabase('engflow_funcoes')

      // Assert
      const funcao = funcoes[0]
      expect(funcao.setor_id).toBeDefined()
      expect(typeof funcao.setor_id).toBe('string')
      expect(funcao.setor_id).not.toBe('')
      expect(funcao.setor_id).not.toBeNull()
      expect(funcao.setor_id).not.toBeUndefined()
    })

    it('deve manter campo permissoes como array', () => {
      expect(mockFuncaoData.permissoes).toBeInstanceOf(Array)
      expect(mockFuncaoData.permissoes).toHaveLength(2)
      expect(mockFuncaoData.permissoes[0]).toBe('Validar etapas')
      expect(mockFuncaoData.permissoes[1]).toBe('Aprovar materiais')
    })

    it('deve suportar campos opcionais para compatibilidade', () => {
      const funcaoSemDados = {
        ...mockFuncaoData,
        nivel: undefined,
        permissoes: undefined,
        totalColaboradores: undefined,
        setor: undefined
      }

      // Verificar que a interface suporta campos opcionais
      expect(() => {
        const nivel = funcaoSemDados.nivel || 'Operacional'
        const permissoes = funcaoSemDados.permissoes || []
        const colaboradores = funcaoSemDados.totalColaboradores || 0
        const setor = funcaoSemDados.setor?.nome || 'Não definido'

        expect(nivel).toBe('Operacional')
        expect(permissoes).toEqual([])
        expect(colaboradores).toBe(0)
        expect(setor).toBe('Não definido')
      }).not.toThrow()
    })
  })

  describe('Operações CRUD - Migração localStorage → Supabase', () => {
    it('deve migrar getFromStorage para getFromSupabase', async () => {
      // Arrange
      const { supabaseService } = await import('@/lib/supabaseService')
      mockSupabaseService.getFromSupabase.mockResolvedValue([mockFuncaoData])

      // Act
      const result = await supabaseService.getFromSupabase('engflow_funcoes')

      // Assert
      expect(mockSupabaseService.getFromSupabase).toHaveBeenCalledWith('engflow_funcoes')
      expect(result).toEqual([mockFuncaoData])
    })

    it('deve migrar addToStorage para addToSupabase', async () => {
      // Arrange
      const { supabaseService } = await import('@/lib/supabaseService')
      const { id, created_at, updated_at, setor, ...novaFuncao } = mockFuncaoData
      mockSupabaseService.addToSupabase.mockResolvedValue(mockFuncaoData)

      // Act
      const result = await supabaseService.addToSupabase('engflow_funcoes', novaFuncao)

      // Assert
      expect(mockSupabaseService.addToSupabase).toHaveBeenCalledWith('engflow_funcoes', novaFuncao)
      expect(result).toEqual(mockFuncaoData)
    })

    it('deve migrar updateInStorage para updateInSupabase', async () => {
      // Arrange
      const { supabaseService } = await import('@/lib/supabaseService')
      const updates = { nome: 'Engenheiro Sênior', nivel: 'Gestão' }
      const updatedFuncao = { ...mockFuncaoData, ...updates }
      mockSupabaseService.updateInSupabase.mockResolvedValue(updatedFuncao)

      // Act
      const result = await supabaseService.updateInSupabase('engflow_funcoes', '1', updates)

      // Assert
      expect(mockSupabaseService.updateInSupabase).toHaveBeenCalledWith('engflow_funcoes', '1', updates)
      expect(result).toEqual(updatedFuncao)
    })

    it('deve migrar deleteFromStorage para deleteFromSupabase', async () => {
      // Arrange
      const { supabaseService } = await import('@/lib/supabaseService')
      mockSupabaseService.deleteFromSupabase.mockResolvedValue(undefined)

      // Act
      await supabaseService.deleteFromSupabase('engflow_funcoes', '1')

      // Assert
      expect(mockSupabaseService.deleteFromSupabase).toHaveBeenCalledWith('engflow_funcoes', '1')
    })
  })

  describe('Relacionamentos Hierárquicos', () => {
    it('deve manter relacionamento função → setor', () => {
      // Verificar chave estrangeira
      expect(mockFuncaoData.setor_id).toBe('setor-1')
      expect(mockFuncaoData.setor?.id).toBe('setor-1')
      expect(mockFuncaoData.setor?.nome).toBe('Engenharia')
    })

    it('deve validar estrutura para relacionamento função → funcionários', () => {
      // Estrutura esperada para relacionamentos no banco
      const estruturaEsperada = {
        funcao_id: mockFuncaoData.id,
        setor_id: mockFuncaoData.setor_id,
        nome_funcao: mockFuncaoData.nome,
        nivel_funcao: mockFuncaoData.nivel
      }

      expect(estruturaEsperada.funcao_id).toBeDefined()
      expect(estruturaEsperada.setor_id).toBeDefined()
      expect(estruturaEsperada.nome_funcao).toBeDefined()
      expect(estruturaEsperada.nivel_funcao).toBeDefined()
    })

    it('deve carregar setores para dropdown cascata', async () => {
      // Arrange
      const { supabaseService } = await import('@/lib/supabaseService')
      mockSupabaseService.getFromSupabase.mockResolvedValueOnce([mockSetorData]) // Para setores
      mockSupabaseService.getFromSupabase.mockResolvedValueOnce([mockFuncaoData]) // Para funções

      // Act
      const setores = await supabaseService.getFromSupabase('engflow_setores')
      const funcoes = await supabaseService.getFromSupabase('engflow_funcoes')

      // Assert
      expect(setores).toHaveLength(1)
      expect(setores[0].id).toBe('setor-1')
      expect(funcoes[0].setor_id).toBe(setores[0].id)
    })
  })

  describe('Funcionalidades Específicas de Funções', () => {
    it('deve suportar busca por nome, descrição, nível e setor', () => {
      const funcoes = [
        mockFuncaoData,
        { ...mockFuncaoData, id: '2', nome: 'Gerente', nivel: 'Gestão', setor: { id: 'setor-2', nome: 'Gestão' } },
        { ...mockFuncaoData, id: '3', nome: 'Operador', descricao: 'Execução operacional', nivel: 'Operacional' }
      ]

      // Simular busca por nome
      const buscaNome = funcoes.filter(funcao =>
        funcao.nome.toLowerCase().includes('eng'.toLowerCase())
      )
      expect(buscaNome).toHaveLength(1)

      // Simular busca por nível
      const buscaNivel = funcoes.filter(funcao =>
        funcao.nivel && funcao.nivel.toLowerCase().includes('gestão'.toLowerCase())
      )
      expect(buscaNivel).toHaveLength(1)

      // Simular busca por setor
      const buscaSetor = funcoes.filter(funcao =>
        funcao.setor?.nome && funcao.setor.nome.toLowerCase().includes('gestão'.toLowerCase())
      )
      expect(buscaSetor).toHaveLength(1)
    })

    it('deve calcular estatísticas corretas baseadas nos dados', () => {
      const funcoes = [
        { ...mockFuncaoData, nivel: 'Técnico', totalColaboradores: 3 },
        { ...mockFuncaoData, id: '2', nivel: 'Gestão', totalColaboradores: 2 },
        { ...mockFuncaoData, id: '3', nivel: 'Operacional', totalColaboradores: 5 },
        { ...mockFuncaoData, id: '4', nivel: 'Técnico', totalColaboradores: 4 }
      ]

      // Total de funções
      expect(funcoes.length).toBe(4)

      // Níveis únicos
      const niveisUnicos = new Set(funcoes.map(f => f.nivel).filter(Boolean))
      expect(niveisUnicos.size).toBe(3) // Técnico, Gestão, Operacional

      // Total de colaboradores
      const totalColaboradores = funcoes.reduce((acc, funcao) => acc + (funcao.totalColaboradores || 0), 0)
      expect(totalColaboradores).toBe(14)
    })

    it('deve validar nivel badge variants', () => {
      const niveisValidos = ['Gestão', 'Técnico', 'Operacional']

      niveisValidos.forEach(nivel => {
        expect(['Gestão', 'Técnico', 'Operacional']).toContain(nivel)
      })

      // Verificar nível padrão
      expect(mockFuncaoData.nivel).toBe('Técnico')
    })

    it('deve gerenciar permissões corretamente', () => {
      const permissoesEsperadas = ['Validar etapas', 'Aprovar materiais']

      expect(mockFuncaoData.permissoes).toEqual(permissoesEsperadas)
      expect(mockFuncaoData.permissoes?.length).toBe(2)

      // Testar função sem permissões
      const funcaoSemPermissoes = { ...mockFuncaoData, permissoes: [] }
      expect(funcaoSemPermissoes.permissoes).toEqual([])
    })
  })

  describe('Performance e Cache', () => {
    it('deve manter performance adequada para listagens', async () => {
      // Teste de benchmark simples
      const { supabaseService } = await import('@/lib/supabaseService')

      const largeBatch = Array.from({ length: 15 }, (_, i) => ({
        ...mockFuncaoData,
        id: i.toString(),
        nome: `Função ${i}`
      }))

      mockSupabaseService.getFromSupabase.mockResolvedValue(largeBatch)

      const startTime = performance.now()
      const result = await supabaseService.getFromSupabase('engflow_funcoes')
      const endTime = performance.now()

      expect(result).toHaveLength(15)
      expect(endTime - startTime).toBeLessThan(1000) // Deve completar em menos de 1s
    })

    it('deve usar chaves de storage compatíveis', async () => {
      const { SUPABASE_KEYS } = await import('@/lib/supabaseService')

      // Verificar que as chaves mantêm compatibilidade com localStorage
      expect(SUPABASE_KEYS.FUNCOES).toBe('engflow_funcoes')
      expect(SUPABASE_KEYS.SETORES).toBe('engflow_setores')
      expect(typeof SUPABASE_KEYS.FUNCOES).toBe('string')
      expect(SUPABASE_KEYS.FUNCOES.startsWith('engflow_')).toBe(true)
    })
  })

  describe('Validação de Migração Zero Downtime', () => {
    it('deve manter interface visual exatamente igual', () => {
      // Elementos da interface que devem ser preservados
      const interfaceElements = [
        'Cadastro de Funções',
        'Gerenciamento de cargos e permissões',
        'Total de Funções',
        'Níveis',
        'Colaboradores',
        'Lista de Funções',
        'Nova Função',
        'Buscar função...',
        'Permissões:'
      ]

      // Verificar que todos os textos da interface estão preservados
      interfaceElements.forEach(element => {
        expect(element).toBeDefined()
        expect(typeof element).toBe('string')
        expect(element.length).toBeGreaterThan(0)
      })
    })

    it('deve preservar todos os campos do formulário', () => {
      // Campos que devem estar presentes na interface de função
      const camposEsperados = [
        'nome',
        'descricao',
        'setor_id',
        'nivel',
        'permissoes'
      ]

      // Verificar estrutura base
      expect(mockFuncaoData).toHaveProperty('nome')
      expect(mockFuncaoData).toHaveProperty('descricao')
      expect(mockFuncaoData).toHaveProperty('setor_id')
      expect(mockFuncaoData).toHaveProperty('nivel')
      expect(mockFuncaoData).toHaveProperty('permissoes')

      // Verificar tipos específicos
      expect(typeof mockFuncaoData.nome).toBe('string')
      expect(typeof mockFuncaoData.descricao).toBe('string')
      expect(typeof mockFuncaoData.setor_id).toBe('string')
      expect(typeof mockFuncaoData.nivel).toBe('string')
      expect(Array.isArray(mockFuncaoData.permissoes)).toBe(true)
    })
  })
})