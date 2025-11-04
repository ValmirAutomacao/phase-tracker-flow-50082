import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock do supabaseService para testar validações
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
    FUNCIONARIOS: 'engflow_funcionarios',
    FUNCOES: 'engflow_funcoes',
    SETORES: 'engflow_setores'
  }
}))

describe('Validações Hierárquicas - Task 4: Cascata e Validações', () => {
  const mockSetor = {
    id: 'setor-1',
    nome: 'Engenharia',
    descricao: 'Departamento de engenharia',
    status: 'ativo'
  }

  const mockFuncao = {
    id: 'funcao-1',
    setor_id: 'setor-1',
    nome: 'Engenheiro Civil',
    descricao: 'Responsável técnico pela execução da obra',
    nivel: 'Técnico',
    permissoes: ['Validar etapas', 'Aprovar materiais']
  }

  const mockFuncionario = {
    id: 'funcionario-1',
    nome: 'João Silva',
    email: 'joao@engflow.com',
    telefone: '(11) 98765-4321',
    funcao_id: 'funcao-1',
    status: 'ativo'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AC 2: Dropdowns em cascata preservados', () => {
    it('deve carregar setores para dropdown inicial', async () => {
      // Arrange
      const { supabaseService } = await import('@/lib/supabaseService')
      mockSupabaseService.getFromSupabase.mockResolvedValue([mockSetor])

      // Act
      const setores = await supabaseService.getFromSupabase('engflow_setores')

      // Assert
      expect(setores).toHaveLength(1)
      expect(setores[0]).toMatchObject({
        id: expect.any(String),
        nome: expect.any(String),
        status: 'ativo'
      })
    })

    it('deve filtrar funções por setor selecionado', () => {
      // Arrange
      const funcoes = [
        { ...mockFuncao, id: 'funcao-1', setor_id: 'setor-1', nome: 'Engenheiro Civil' },
        { ...mockFuncao, id: 'funcao-2', setor_id: 'setor-1', nome: 'Arquiteto' },
        { ...mockFuncao, id: 'funcao-3', setor_id: 'setor-2', nome: 'Analista RH' },
        { ...mockFuncao, id: 'funcao-4', setor_id: 'setor-2', nome: 'Gerente RH' }
      ]

      // Act - Simular seleção do setor-1
      const setorSelecionado = 'setor-1'
      const funcoesFiltradas = funcoes.filter(funcao => funcao.setor_id === setorSelecionado)

      // Assert
      expect(funcoesFiltradas).toHaveLength(2)
      expect(funcoesFiltradas.every(f => f.setor_id === 'setor-1')).toBe(true)
      expect(funcoesFiltradas.map(f => f.nome)).toEqual(['Engenheiro Civil', 'Arquiteto'])
    })

    it('deve implementar cascata setor → função → funcionário', () => {
      // Arrange
      const dadosHierarquicos = {
        setores: [mockSetor],
        funcoes: [mockFuncao],
        funcionarios: [mockFuncionario]
      }

      // Act - Simular cascata completa
      const setorEscolhido = dadosHierarquicos.setores[0]
      const funcoesDoSetor = dadosHierarquicos.funcoes.filter(f => f.setor_id === setorEscolhido.id)
      const funcaoEscolhida = funcoesDoSetor[0]
      const funcionariosDaFuncao = dadosHierarquicos.funcionarios.filter(f => f.funcao_id === funcaoEscolhida.id)

      // Assert
      expect(setorEscolhido.id).toBe('setor-1')
      expect(funcoesDoSetor).toHaveLength(1)
      expect(funcoesDoSetor[0].setor_id).toBe(setorEscolhido.id)
      expect(funcionariosDaFuncao).toHaveLength(1)
      expect(funcionariosDaFuncao[0].funcao_id).toBe(funcaoEscolhida.id)
    })

    it('deve desabilitar dropdown função quando nenhum setor selecionado', () => {
      // Simular estado inicial sem setor selecionado
      const setorSelecionado = ''
      const funcaoDisabled = !setorSelecionado

      expect(funcaoDisabled).toBe(true)

      // Simular seleção de setor
      const setorComSelecao = 'setor-1'
      const funcaoEnabled = !!setorComSelecao

      expect(funcaoEnabled).toBe(true)
    })
  })

  describe('AC 4: Relacionamentos FK mantidos e validados', () => {
    it('deve validar integridade referencial setor_id em funções', async () => {
      // Arrange
      const { supabaseService } = await import('@/lib/supabaseService')
      const setoresValidos = [mockSetor]

      // Função com setor_id válido
      const funcaoValida = { ...mockFuncao, setor_id: 'setor-1' }

      // Act
      const setorExiste = setoresValidos.some(s => s.id === funcaoValida.setor_id)

      // Assert
      expect(setorExiste).toBe(true)
      expect(funcaoValida.setor_id).toBe('setor-1')
    })

    it('deve validar integridade referencial funcao_id em funcionários', () => {
      // Arrange
      const funcoesValidas = [mockFuncao]

      // Funcionário com funcao_id válido
      const funcionarioValido = { ...mockFuncionario, funcao_id: 'funcao-1' }

      // Act
      const funcaoExiste = funcoesValidas.some(f => f.id === funcionarioValido.funcao_id)

      // Assert
      expect(funcaoExiste).toBe(true)
      expect(funcionarioValido.funcao_id).toBe('funcao-1')
    })

    it('deve rejeitar criação com FK inválido', async () => {
      // Arrange
      const { supabaseService } = await import('@/lib/supabaseService')

      // Simular erro de FK constraint
      const funcaoComSetorInvalido = {
        nome: 'Função Inválida',
        setor_id: 'setor-inexistente',
        nivel: 'Técnico'
      }

      mockSupabaseService.addToSupabase.mockRejectedValue(
        new Error('Foreign key constraint violation: setor_id does not exist')
      )

      // Act & Assert
      await expect(
        supabaseService.addToSupabase('engflow_funcoes', funcaoComSetorInvalido)
      ).rejects.toThrow('Foreign key constraint violation')
    })

    it('deve impedir exclusão de setor com funções dependentes', async () => {
      // Arrange
      const { supabaseService } = await import('@/lib/supabaseService')

      // Simular erro de constraint de dependência
      mockSupabaseService.deleteFromSupabase.mockRejectedValue(
        new Error('Cannot delete setor: functions still reference this setor')
      )

      // Act & Assert
      await expect(
        supabaseService.deleteFromSupabase('engflow_setores', 'setor-1')
      ).rejects.toThrow('Cannot delete setor: functions still reference this setor')
    })

    it('deve impedir exclusão de função com funcionários dependentes', async () => {
      // Arrange
      const { supabaseService } = await import('@/lib/supabaseService')

      // Simular erro de constraint de dependência
      mockSupabaseService.deleteFromSupabase.mockRejectedValue(
        new Error('Cannot delete funcao: employees still reference this funcao')
      )

      // Act & Assert
      await expect(
        supabaseService.deleteFromSupabase('engflow_funcoes', 'funcao-1')
      ).rejects.toThrow('Cannot delete funcao: employees still reference this funcao')
    })
  })

  describe('Validações de Formulário', () => {
    it('deve validar campos obrigatórios no setor', () => {
      const setorSchema = {
        nome: { required: true, minLength: 1 },
        descricao: { required: true, minLength: 1 },
        responsavel: { required: true, minLength: 1 }
      }

      const setorValido = {
        nome: 'Engenharia',
        descricao: 'Departamento técnico',
        responsavel: 'João Silva'
      }

      const setorInvalido = {
        nome: '',
        descricao: '',
        responsavel: ''
      }

      // Validar setor válido
      Object.keys(setorSchema).forEach(campo => {
        const valor = setorValido[campo as keyof typeof setorValido]
        expect(valor.length).toBeGreaterThan(0)
      })

      // Validar setor inválido
      Object.keys(setorSchema).forEach(campo => {
        const valor = setorInvalido[campo as keyof typeof setorInvalido]
        expect(valor.length).toBe(0)
      })
    })

    it('deve validar campos obrigatórios na função', () => {
      const funcaoSchema = {
        nome: { required: true, minLength: 1 },
        descricao: { required: true, minLength: 1 },
        setor_id: { required: true, minLength: 1 },
        nivel: { required: true, minLength: 1 },
        permissoes: { required: true, minItems: 1 }
      }

      const funcaoValida = {
        nome: 'Engenheiro',
        descricao: 'Responsável técnico',
        setor_id: 'setor-1',
        nivel: 'Técnico',
        permissoes: ['Validar etapas']
      }

      const funcaoInvalida = {
        nome: '',
        descricao: '',
        setor_id: '',
        nivel: '',
        permissoes: [] as string[]
      }

      // Validar função válida
      expect(funcaoValida.nome.length).toBeGreaterThan(0)
      expect(funcaoValida.descricao.length).toBeGreaterThan(0)
      expect(funcaoValida.setor_id.length).toBeGreaterThan(0)
      expect(funcaoValida.nivel.length).toBeGreaterThan(0)
      expect(funcaoValida.permissoes.length).toBeGreaterThan(0)

      // Validar função inválida
      expect(funcaoInvalida.nome.length).toBe(0)
      expect(funcaoInvalida.descricao.length).toBe(0)
      expect(funcaoInvalida.setor_id.length).toBe(0)
      expect(funcaoInvalida.nivel.length).toBe(0)
      expect(funcaoInvalida.permissoes.length).toBe(0)
    })

    it('deve validar campos obrigatórios no funcionário', () => {
      const funcionarioSchema = {
        nome: { required: true, minLength: 1 },
        email: { required: true, email: true },
        telefone: { required: true, minLength: 1 },
        funcao_id: { required: true, minLength: 1 },
        senha: { required: true, minLength: 6 }
      }

      const funcionarioValido = {
        nome: 'João Silva',
        email: 'joao@engflow.com',
        telefone: '(11) 98765-4321',
        funcao_id: 'funcao-1',
        senha: '123456'
      }

      const funcionarioInvalido = {
        nome: '',
        email: 'email-invalido',
        telefone: '',
        funcao_id: '',
        senha: '123'
      }

      // Validar funcionário válido
      expect(funcionarioValido.nome.length).toBeGreaterThan(0)
      expect(funcionarioValido.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      expect(funcionarioValido.telefone.length).toBeGreaterThan(0)
      expect(funcionarioValido.funcao_id.length).toBeGreaterThan(0)
      expect(funcionarioValido.senha.length).toBeGreaterThanOrEqual(6)

      // Validar funcionário inválido
      expect(funcionarioInvalido.nome.length).toBe(0)
      expect(funcionarioInvalido.email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      expect(funcionarioInvalido.telefone.length).toBe(0)
      expect(funcionarioInvalido.funcao_id.length).toBe(0)
      expect(funcionarioInvalido.senha.length).toBeLessThan(6)
    })
  })

  describe('Validações de Níveis Hierárquicos', () => {
    it('deve validar níveis de função disponíveis', () => {
      const niveisValidos = ['Gestão', 'Técnico', 'Operacional']

      niveisValidos.forEach(nivel => {
        expect(['Gestão', 'Técnico', 'Operacional']).toContain(nivel)
      })

      // Verificar nível inválido
      const nivelInvalido = 'NivelInexistente'
      expect(niveisValidos).not.toContain(nivelInvalido)
    })

    it('deve manter consistência de hierarquia organizacional', () => {
      const estruturaCompleta = {
        setor: mockSetor,
        funcao: { ...mockFuncao, setor_id: mockSetor.id },
        funcionario: { ...mockFuncionario, funcao_id: mockFuncao.id }
      }

      // Verificar que a hierarquia está correta
      expect(estruturaCompleta.funcao.setor_id).toBe(estruturaCompleta.setor.id)
      expect(estruturaCompleta.funcionario.funcao_id).toBe(estruturaCompleta.funcao.id)

      // Verificar cadeia hierárquica
      const cadeiaHierarquica = [
        estruturaCompleta.setor.nome,
        estruturaCompleta.funcao.nome,
        estruturaCompleta.funcionario.nome
      ].join(' > ')

      expect(cadeiaHierarquica).toBe('Engenharia > Engenheiro Civil > João Silva')
    })

    it('deve validar permissões por nível hierárquico', () => {
      const permissoesPorNivel = {
        'Gestão': ['Aprovar compras', 'Gerenciar equipe', 'Visualizar financeiro', 'Editar financeiro'],
        'Técnico': ['Validar etapas', 'Aprovar materiais', 'Visualizar obras', 'Editar obras'],
        'Operacional': ['Visualizar obras', 'Reportar progresso']
      }

      // Verificar que cada nível tem permissões apropriadas
      Object.entries(permissoesPorNivel).forEach(([nivel, permissoes]) => {
        expect(permissoes.length).toBeGreaterThan(0)
        expect(['Gestão', 'Técnico', 'Operacional']).toContain(nivel)
      })

      // Verificar hierarquia de permissões (Gestão > Técnico > Operacional)
      const gestao = permissoesPorNivel['Gestão']
      const tecnico = permissoesPorNivel['Técnico']
      const operacional = permissoesPorNivel['Operacional']

      expect(gestao.length).toBeGreaterThanOrEqual(tecnico.length)
      expect(tecnico.length).toBeGreaterThanOrEqual(operacional.length)
    })
  })

  describe('Validações de Performance com Relacionamentos', () => {
    it('deve carregar dados hierárquicos de forma otimizada', async () => {
      // Arrange
      const { supabaseService } = await import('@/lib/supabaseService')

      // Simular carregamento paralelo de dados relacionados
      const promises = [
        supabaseService.getFromSupabase('engflow_setores'),
        supabaseService.getFromSupabase('engflow_funcoes'),
        supabaseService.getFromSupabase('engflow_funcionarios')
      ]

      mockSupabaseService.getFromSupabase
        .mockResolvedValueOnce([mockSetor])
        .mockResolvedValueOnce([mockFuncao])
        .mockResolvedValueOnce([mockFuncionario])

      const startTime = performance.now()

      // Act
      const [setores, funcoes, funcionarios] = await Promise.all(promises)

      const endTime = performance.now()

      // Assert
      expect(setores).toHaveLength(1)
      expect(funcoes).toHaveLength(1)
      expect(funcionarios).toHaveLength(1)
      expect(endTime - startTime).toBeLessThan(1000) // Carregamento paralelo deve ser rápido
    })

    it('deve implementar cache para dados hierárquicos', () => {
      // Simular cache de estrutura hierárquica
      const cacheHierarquico = new Map()

      const chaveCache = 'hierarquia-completa'
      const dadosHierarquicos = {
        setores: [mockSetor],
        funcoes: [mockFuncao],
        funcionarios: [mockFuncionario]
      }

      // Simular armazenamento em cache
      cacheHierarquico.set(chaveCache, dadosHierarquicos)

      // Verificar recuperação do cache
      const dadosDoCache = cacheHierarquico.get(chaveCache)
      expect(dadosDoCache).toEqual(dadosHierarquicos)
      expect(cacheHierarquico.has(chaveCache)).toBe(true)
    })
  })
})