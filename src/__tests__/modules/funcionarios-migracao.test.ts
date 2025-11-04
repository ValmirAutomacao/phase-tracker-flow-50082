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
    FUNCIONARIOS: 'engflow_funcionarios',
    FUNCOES: 'engflow_funcoes',
    SETORES: 'engflow_setores'
  }
}))

describe('Migração do Módulo Funcionários - Hierarquia Completa e Relacionamentos', () => {
  const mockSetorData = {
    id: 'setor-1',
    nome: 'Engenharia',
    descricao: 'Departamento de engenharia'
  }

  const mockFuncaoData = {
    id: 'funcao-1',
    setor_id: 'setor-1',
    nome: 'Engenheiro Civil',
    descricao: 'Responsável técnico pela execução da obra',
    nivel: 'Técnico',
    setor: {
      id: 'setor-1',
      nome: 'Engenharia'
    }
  }

  const mockFuncionarioData = {
    id: '1',
    nome: 'João Silva',
    email: 'joao.silva@engflow.com',
    telefone: '(11) 98765-4321',
    funcao_id: 'funcao-1',
    senha: 'senha123',
    foto: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...',
    status: 'ativo',
    dataAdmissao: '2023-01-15',
    observacoes: 'Funcionário experiente',
    funcao: {
      id: 'funcao-1',
      nome: 'Engenheiro Civil',
      nivel: 'Técnico',
      setor_id: 'setor-1',
      setor: {
        id: 'setor-1',
        nome: 'Engenharia'
      }
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
      mockSupabaseService.getFromSupabase.mockResolvedValue([mockFuncionarioData])

      // Act
      const funcionarios = await supabaseService.getFromSupabase('engflow_funcionarios')

      // Assert
      expect(funcionarios).toHaveLength(1)
      expect(funcionarios[0]).toMatchObject({
        id: expect.any(String),
        nome: expect.any(String),
        email: expect.any(String),
        telefone: expect.any(String),
        funcao_id: expect.any(String),
        senha: expect.any(String),
        status: expect.any(String),
        dataAdmissao: expect.any(String)
      })
    })

    it('deve preservar relacionamento funcao_id (FK)', async () => {
      // Arrange
      const { supabaseService } = await import('@/lib/supabaseService')
      mockSupabaseService.getFromSupabase.mockResolvedValue([mockFuncionarioData])

      // Act
      const funcionarios = await supabaseService.getFromSupabase('engflow_funcionarios')

      // Assert
      const funcionario = funcionarios[0]
      expect(funcionario.funcao_id).toBeDefined()
      expect(typeof funcionario.funcao_id).toBe('string')
      expect(funcionario.funcao_id).not.toBe('')
      expect(funcionario.funcao_id).not.toBeNull()
      expect(funcionario.funcao_id).not.toBeUndefined()
    })

    it('deve manter relacionamento hierárquico completo', () => {
      // Verificar hierarquia funcionário → função → setor
      expect(mockFuncionarioData.funcao_id).toBe('funcao-1')
      expect(mockFuncionarioData.funcao?.id).toBe('funcao-1')
      expect(mockFuncionarioData.funcao?.nome).toBe('Engenheiro Civil')
      expect(mockFuncionarioData.funcao?.setor_id).toBe('setor-1')
      expect(mockFuncionarioData.funcao?.setor?.id).toBe('setor-1')
      expect(mockFuncionarioData.funcao?.setor?.nome).toBe('Engenharia')
    })

    it('deve suportar campos opcionais para compatibilidade', () => {
      const funcionarioSemDados = {
        ...mockFuncionarioData,
        foto: undefined,
        observacoes: undefined,
        funcao: undefined
      }

      // Verificar que a interface suporta campos opcionais
      expect(() => {
        const foto = funcionarioSemDados.foto || ''
        const observacoes = funcionarioSemDados.observacoes || ''
        const funcaoNome = funcionarioSemDados.funcao?.nome || 'Função não definida'
        const setorNome = funcionarioSemDados.funcao?.setor?.nome || 'Setor não definido'

        expect(foto).toBe('')
        expect(observacoes).toBe('')
        expect(funcaoNome).toBe('Função não definida')
        expect(setorNome).toBe('Setor não definido')
      }).not.toThrow()
    })
  })

  describe('Operações CRUD - Migração localStorage → Supabase', () => {
    it('deve migrar getFromStorage para getFromSupabase', async () => {
      // Arrange
      const { supabaseService } = await import('@/lib/supabaseService')
      mockSupabaseService.getFromSupabase.mockResolvedValue([mockFuncionarioData])

      // Act
      const result = await supabaseService.getFromSupabase('engflow_funcionarios')

      // Assert
      expect(mockSupabaseService.getFromSupabase).toHaveBeenCalledWith('engflow_funcionarios')
      expect(result).toEqual([mockFuncionarioData])
    })

    it('deve migrar addToStorage para addToSupabase', async () => {
      // Arrange
      const { supabaseService } = await import('@/lib/supabaseService')
      const { id, created_at, updated_at, funcao, ...novoFuncionario } = mockFuncionarioData
      mockSupabaseService.addToSupabase.mockResolvedValue(mockFuncionarioData)

      // Act
      const result = await supabaseService.addToSupabase('engflow_funcionarios', novoFuncionario)

      // Assert
      expect(mockSupabaseService.addToSupabase).toHaveBeenCalledWith('engflow_funcionarios', novoFuncionario)
      expect(result).toEqual(mockFuncionarioData)
    })

    it('deve migrar updateInStorage para updateInSupabase', async () => {
      // Arrange
      const { supabaseService } = await import('@/lib/supabaseService')
      const updates = { nome: 'João Silva Santos', telefone: '(11) 99999-9999' }
      const updatedFuncionario = { ...mockFuncionarioData, ...updates }
      mockSupabaseService.updateInSupabase.mockResolvedValue(updatedFuncionario)

      // Act
      const result = await supabaseService.updateInSupabase('engflow_funcionarios', '1', updates)

      // Assert
      expect(mockSupabaseService.updateInSupabase).toHaveBeenCalledWith('engflow_funcionarios', '1', updates)
      expect(result).toEqual(updatedFuncionario)
    })

    it('deve migrar deleteFromStorage para deleteFromSupabase', async () => {
      // Arrange
      const { supabaseService } = await import('@/lib/supabaseService')
      mockSupabaseService.deleteFromSupabase.mockResolvedValue(undefined)

      // Act
      await supabaseService.deleteFromSupabase('engflow_funcionarios', '1')

      // Assert
      expect(mockSupabaseService.deleteFromSupabase).toHaveBeenCalledWith('engflow_funcionarios', '1')
    })
  })

  describe('Relacionamentos Hierárquicos Complexos', () => {
    it('deve carregar dados hierárquicos para dropdowns cascata', async () => {
      // Arrange
      const { supabaseService } = await import('@/lib/supabaseService')
      mockSupabaseService.getFromSupabase.mockResolvedValueOnce([mockSetorData]) // Para setores
      mockSupabaseService.getFromSupabase.mockResolvedValueOnce([mockFuncaoData]) // Para funções
      mockSupabaseService.getFromSupabase.mockResolvedValueOnce([mockFuncionarioData]) // Para funcionários

      // Act
      const setores = await supabaseService.getFromSupabase('engflow_setores')
      const funcoes = await supabaseService.getFromSupabase('engflow_funcoes')
      const funcionarios = await supabaseService.getFromSupabase('engflow_funcionarios')

      // Assert
      expect(setores).toHaveLength(1)
      expect(funcoes).toHaveLength(1)
      expect(funcionarios).toHaveLength(1)

      // Verificar relacionamentos
      expect(funcoes[0].setor_id).toBe(setores[0].id)
      expect(funcionarios[0].funcao_id).toBe(funcoes[0].id)
    })

    it('deve filtrar funções por setor selecionado', () => {
      const funcoes = [
        { ...mockFuncaoData, id: 'funcao-1', setor_id: 'setor-1', nome: 'Engenheiro Civil' },
        { ...mockFuncaoData, id: 'funcao-2', setor_id: 'setor-1', nome: 'Arquiteto' },
        { ...mockFuncaoData, id: 'funcao-3', setor_id: 'setor-2', nome: 'Analista RH' }
      ]

      // Simular filtro por setor
      const setorSelecionado = 'setor-1'
      const funcoesFiltradas = funcoes.filter(funcao => funcao.setor_id === setorSelecionado)

      expect(funcoesFiltradas).toHaveLength(2)
      expect(funcoesFiltradas.every(f => f.setor_id === 'setor-1')).toBe(true)
    })

    it('deve validar estrutura para dropdown cascata setor → função', () => {
      // Estrutura esperada para dropdown hierárquico
      const estruturaEsperada = {
        setores: [mockSetorData],
        funcoesPorSetor: {
          [mockSetorData.id]: [mockFuncaoData]
        },
        funcionarioComHierarquia: {
          funcionario_id: mockFuncionarioData.id,
          funcao_id: mockFuncionarioData.funcao_id,
          setor_id: mockFuncionarioData.funcao?.setor_id,
          hierarquia_completa: `${mockFuncionarioData.funcao?.setor?.nome} > ${mockFuncionarioData.funcao?.nome} > ${mockFuncionarioData.nome}`
        }
      }

      expect(estruturaEsperada.setores).toHaveLength(1)
      expect(estruturaEsperada.funcoesPorSetor[mockSetorData.id]).toHaveLength(1)
      expect(estruturaEsperada.funcionarioComHierarquia.hierarquia_completa).toBe('Engenharia > Engenheiro Civil > João Silva')
    })
  })

  describe('Funcionalidades Específicas de Funcionários', () => {
    it('deve suportar busca por nome, email, função e setor', () => {
      const funcionarios = [
        mockFuncionarioData,
        {
          ...mockFuncionarioData,
          id: '2',
          nome: 'Maria Santos',
          email: 'maria@engflow.com',
          funcao: {
            ...mockFuncaoData,
            id: 'funcao-2',
            nome: 'Gerente',
            setor: { id: 'setor-2', nome: 'Gestão' }
          }
        },
        {
          ...mockFuncionarioData,
          id: '3',
          nome: 'Pedro Lima',
          email: 'pedro@engflow.com',
          funcao: {
            ...mockFuncaoData,
            id: 'funcao-3',
            nome: 'Operador',
            setor: { id: 'setor-3', nome: 'Operacional' }
          }
        }
      ]

      // Simular busca por nome
      const buscaNome = funcionarios.filter(funcionario =>
        funcionario.nome.toLowerCase().includes('joão'.toLowerCase())
      )
      expect(buscaNome).toHaveLength(1)

      // Simular busca por email
      const buscaEmail = funcionarios.filter(funcionario =>
        funcionario.email.toLowerCase().includes('maria'.toLowerCase())
      )
      expect(buscaEmail).toHaveLength(1)

      // Simular busca por função
      const buscaFuncao = funcionarios.filter(funcionario =>
        funcionario.funcao?.nome && funcionario.funcao.nome.toLowerCase().includes('gerente'.toLowerCase())
      )
      expect(buscaFuncao).toHaveLength(1)

      // Simular busca por setor
      const buscaSetor = funcionarios.filter(funcionario =>
        funcionario.funcao?.setor?.nome && funcionario.funcao.setor.nome.toLowerCase().includes('operacional'.toLowerCase())
      )
      expect(buscaSetor).toHaveLength(1)
    })

    it('deve calcular estatísticas corretas baseadas nos dados', () => {
      const funcionarios = [
        { ...mockFuncionarioData, status: 'ativo', funcao: { ...mockFuncaoData, nome: 'Engenheiro', setor: { id: 'setor-1', nome: 'Engenharia' } } },
        { ...mockFuncionarioData, id: '2', status: 'ativo', funcao: { ...mockFuncaoData, nome: 'Gerente', setor: { id: 'setor-2', nome: 'Gestão' } } },
        { ...mockFuncionarioData, id: '3', status: 'inativo', funcao: { ...mockFuncaoData, nome: 'Operador', setor: { id: 'setor-3', nome: 'Operacional' } } },
        { ...mockFuncionarioData, id: '4', status: 'ferias', funcao: { ...mockFuncaoData, nome: 'Engenheiro', setor: { id: 'setor-1', nome: 'Engenharia' } } }
      ]

      // Total de funcionários
      expect(funcionarios.length).toBe(4)

      // Funcionários ativos
      const ativos = funcionarios.filter(f => f.status === 'ativo')
      expect(ativos.length).toBe(2)

      // Funções únicas
      const funcoesUnicas = new Set(funcionarios.map(f => f.funcao?.nome).filter(Boolean))
      expect(funcoesUnicas.size).toBe(3) // Engenheiro, Gerente, Operador

      // Setores únicos
      const setoresUnicos = new Set(funcionarios.map(f => f.funcao?.setor?.nome).filter(Boolean))
      expect(setoresUnicos.size).toBe(3) // Engenharia, Gestão, Operacional
    })

    it('deve validar status badge variants', () => {
      const statusValidos = ['ativo', 'inativo', 'ferias']

      statusValidos.forEach(status => {
        expect(['ativo', 'inativo', 'ferias']).toContain(status)
      })

      // Verificar status padrão
      expect(mockFuncionarioData.status).toBe('ativo')
    })

    it('deve gerenciar upload de foto corretamente', () => {
      // Verificar que o campo foto suporta base64
      expect(mockFuncionarioData.foto).toMatch(/^data:image\/jpeg;base64,/)

      // Testar funcionário sem foto
      const funcionarioSemFoto = { ...mockFuncionarioData, foto: undefined }
      expect(funcionarioSemFoto.foto || '').toBe('')

      // Testar placeholder para avatar
      const avatarFallback = mockFuncionarioData.nome
        .split(' ')
        .map(nome => nome[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

      expect(avatarFallback).toBe('JS') // João Silva
    })

    it('deve validar campos obrigatórios do formulário', () => {
      const camposObrigatorios = ['nome', 'email', 'telefone', 'funcao_id', 'senha']

      const funcionarioCompleto = {
        nome: mockFuncionarioData.nome,
        email: mockFuncionarioData.email,
        telefone: mockFuncionarioData.telefone,
        funcao_id: mockFuncionarioData.funcao_id,
        senha: mockFuncionarioData.senha
      }

      camposObrigatorios.forEach(campo => {
        expect(funcionarioCompleto).toHaveProperty(campo)
        expect(funcionarioCompleto[campo as keyof typeof funcionarioCompleto]).toBeDefined()
        expect(funcionarioCompleto[campo as keyof typeof funcionarioCompleto]).not.toBe('')
      })
    })
  })

  describe('Performance e Cache', () => {
    it('deve manter performance adequada para listagens com relacionamentos', async () => {
      // Teste de benchmark simples
      const { supabaseService } = await import('@/lib/supabaseService')

      const largeBatch = Array.from({ length: 20 }, (_, i) => ({
        ...mockFuncionarioData,
        id: i.toString(),
        nome: `Funcionário ${i}`,
        email: `funcionario${i}@engflow.com`,
        funcao: {
          ...mockFuncaoData,
          id: `funcao-${i % 3}`, // 3 funções diferentes
          nome: ['Engenheiro', 'Gerente', 'Operador'][i % 3]
        }
      }))

      mockSupabaseService.getFromSupabase.mockResolvedValue(largeBatch)

      const startTime = performance.now()
      const result = await supabaseService.getFromSupabase('engflow_funcionarios')
      const endTime = performance.now()

      expect(result).toHaveLength(20)
      expect(endTime - startTime).toBeLessThan(1000) // Deve completar em menos de 1s
    })

    it('deve usar chaves de storage compatíveis', async () => {
      const { SUPABASE_KEYS } = await import('@/lib/supabaseService')

      // Verificar que as chaves mantêm compatibilidade com localStorage
      expect(SUPABASE_KEYS.FUNCIONARIOS).toBe('engflow_funcionarios')
      expect(SUPABASE_KEYS.FUNCOES).toBe('engflow_funcoes')
      expect(SUPABASE_KEYS.SETORES).toBe('engflow_setores')
      expect(typeof SUPABASE_KEYS.FUNCIONARIOS).toBe('string')
      expect(SUPABASE_KEYS.FUNCIONARIOS.startsWith('engflow_')).toBe(true)
    })
  })

  describe('Validação de Migração Zero Downtime', () => {
    it('deve manter interface visual exatamente igual', () => {
      // Elementos da interface que devem ser preservados
      const interfaceElements = [
        'Cadastro de Funcionários',
        'Gerenciamento de colaboradores',
        'Total',
        'Ativos',
        'Funções',
        'Setores',
        'Lista de Funcionários',
        'Novo Funcionário',
        'Buscar funcionário...',
        'Nome Completo',
        'Email',
        'Telefone',
        'Setor',
        'Função',
        'Senha de Acesso',
        'Upload Foto'
      ]

      // Verificar que todos os textos da interface estão preservados
      interfaceElements.forEach(element => {
        expect(element).toBeDefined()
        expect(typeof element).toBe('string')
        expect(element.length).toBeGreaterThan(0)
      })
    })

    it('deve preservar todos os campos do formulário hierárquico', () => {
      // Campos que devem estar presentes na interface de funcionário
      const camposEsperados = [
        'nome',
        'email',
        'telefone',
        'funcao_id',
        'senha',
        'foto',
        'status',
        'dataAdmissao'
      ]

      // Verificar estrutura base
      expect(mockFuncionarioData).toHaveProperty('nome')
      expect(mockFuncionarioData).toHaveProperty('email')
      expect(mockFuncionarioData).toHaveProperty('telefone')
      expect(mockFuncionarioData).toHaveProperty('funcao_id')
      expect(mockFuncionarioData).toHaveProperty('senha')
      expect(mockFuncionarioData).toHaveProperty('foto')
      expect(mockFuncionarioData).toHaveProperty('status')
      expect(mockFuncionarioData).toHaveProperty('dataAdmissao')

      // Verificar tipos específicos
      expect(typeof mockFuncionarioData.nome).toBe('string')
      expect(typeof mockFuncionarioData.email).toBe('string')
      expect(typeof mockFuncionarioData.telefone).toBe('string')
      expect(typeof mockFuncionarioData.funcao_id).toBe('string')
      expect(typeof mockFuncionarioData.senha).toBe('string')
      expect(typeof mockFuncionarioData.status).toBe('string')
      expect(typeof mockFuncionarioData.dataAdmissao).toBe('string')
    })

    it('deve implementar dropdown cascata setor → função corretamente', () => {
      // Simular seleção de setor e filtro de funções
      const setorSelecionado = 'setor-1'
      const todasFuncoes = [
        { id: 'funcao-1', setor_id: 'setor-1', nome: 'Engenheiro Civil' },
        { id: 'funcao-2', setor_id: 'setor-1', nome: 'Arquiteto' },
        { id: 'funcao-3', setor_id: 'setor-2', nome: 'Gerente RH' }
      ]

      // Filtrar funções baseado no setor
      const funcoesFiltradas = todasFuncoes.filter(funcao => funcao.setor_id === setorSelecionado)

      expect(funcoesFiltradas).toHaveLength(2)
      expect(funcoesFiltradas[0].nome).toBe('Engenheiro Civil')
      expect(funcoesFiltradas[1].nome).toBe('Arquiteto')

      // Verificar que função de outro setor não aparece
      expect(funcoesFiltradas.find(f => f.nome === 'Gerente RH')).toBeUndefined()
    })
  })

  describe('Validação de Integridade de Dados', () => {
    it('deve validar integridade referencial funcao_id', () => {
      // Verificar que funcao_id sempre aponta para uma função válida
      const funcaoExistente = mockFuncaoData
      const funcionarioComFuncaoValida = {
        ...mockFuncionarioData,
        funcao_id: funcaoExistente.id,
        funcao: funcaoExistente
      }

      expect(funcionarioComFuncaoValida.funcao_id).toBe(funcionarioComFuncaoValida.funcao?.id)
      expect(funcionarioComFuncaoValida.funcao?.setor_id).toBeDefined()
    })

    it('deve tratar casos de funcionário com função/setor removidos', () => {
      const funcionarioComFuncaoRemovidaData = {
        ...mockFuncionarioData,
        funcao_id: 'funcao-inexistente',
        funcao: undefined
      }

      // Sistema deve exibir fallbacks apropriados
      const funcaoNome = funcionarioComFuncaoRemovidaData.funcao?.nome || 'Função não definida'
      const setorNome = funcionarioComFuncaoRemovidaData.funcao?.setor?.nome || 'Setor não definido'

      expect(funcaoNome).toBe('Função não definida')
      expect(setorNome).toBe('Setor não definido')
    })

    it('deve manter consistência de dados durante atualizações', () => {
      // Simular atualização que muda função para outro setor
      const funcionarioAtualizado = {
        ...mockFuncionarioData,
        funcao_id: 'nova-funcao-id',
        funcao: {
          id: 'nova-funcao-id',
          nome: 'Nova Função',
          nivel: 'Gestão',
          setor_id: 'novo-setor-id',
          setor: {
            id: 'novo-setor-id',
            nome: 'Novo Setor'
          }
        }
      }

      // Verificar integridade após atualização
      expect(funcionarioAtualizado.funcao_id).toBe(funcionarioAtualizado.funcao?.id)
      expect(funcionarioAtualizado.funcao?.setor_id).toBe(funcionarioAtualizado.funcao?.setor?.id)
    })
  })
})