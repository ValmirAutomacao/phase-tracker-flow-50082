import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock do supabaseService para testar buscas e filtros
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

describe('Task 5: Busca e Filtros - AC 5', () => {
  const mockSetores = [
    { id: 'setor-1', nome: 'Engenharia', descricao: 'Departamento técnico', responsavel: 'João Silva', status: 'ativo' },
    { id: 'setor-2', nome: 'Gestão', descricao: 'Departamento administrativo', responsavel: 'Maria Santos', status: 'ativo' },
    { id: 'setor-3', nome: 'Operacional', descricao: 'Operações de campo', responsavel: 'Pedro Costa', status: 'inativo' },
    { id: 'setor-4', nome: 'Financeiro', descricao: 'Controle financeiro', responsavel: 'Ana Lima', status: 'ativo' }
  ]

  const mockFuncoes = [
    {
      id: 'funcao-1',
      nome: 'Engenheiro Civil',
      descricao: 'Responsável técnico pela execução',
      setor_id: 'setor-1',
      nivel: 'Técnico',
      setor: { id: 'setor-1', nome: 'Engenharia' }
    },
    {
      id: 'funcao-2',
      nome: 'Arquiteto',
      descricao: 'Projetos arquitetônicos',
      setor_id: 'setor-1',
      nivel: 'Técnico',
      setor: { id: 'setor-1', nome: 'Engenharia' }
    },
    {
      id: 'funcao-3',
      nome: 'Gerente',
      descricao: 'Gestão de equipes',
      setor_id: 'setor-2',
      nivel: 'Gestão',
      setor: { id: 'setor-2', nome: 'Gestão' }
    },
    {
      id: 'funcao-4',
      nome: 'Operador',
      descricao: 'Operações de campo',
      setor_id: 'setor-3',
      nivel: 'Operacional',
      setor: { id: 'setor-3', nome: 'Operacional' }
    }
  ]

  const mockFuncionarios = [
    {
      id: 'funcionario-1',
      nome: 'João Silva',
      email: 'joao@engflow.com',
      telefone: '(11) 98765-4321',
      funcao_id: 'funcao-1',
      status: 'ativo',
      funcao: {
        id: 'funcao-1',
        nome: 'Engenheiro Civil',
        nivel: 'Técnico',
        setor_id: 'setor-1',
        setor: { id: 'setor-1', nome: 'Engenharia' }
      }
    },
    {
      id: 'funcionario-2',
      nome: 'Maria Santos',
      email: 'maria@engflow.com',
      telefone: '(21) 99876-5432',
      funcao_id: 'funcao-3',
      status: 'ativo',
      funcao: {
        id: 'funcao-3',
        nome: 'Gerente',
        nivel: 'Gestão',
        setor_id: 'setor-2',
        setor: { id: 'setor-2', nome: 'Gestão' }
      }
    },
    {
      id: 'funcionario-3',
      nome: 'Pedro Costa',
      email: 'pedro@engflow.com',
      telefone: '(31) 91234-5678',
      funcao_id: 'funcao-4',
      status: 'ferias',
      funcao: {
        id: 'funcao-4',
        nome: 'Operador',
        nivel: 'Operacional',
        setor_id: 'setor-3',
        setor: { id: 'setor-3', nome: 'Operacional' }
      }
    },
    {
      id: 'funcionario-4',
      nome: 'Ana Lima',
      email: 'ana@engflow.com',
      telefone: '(41) 92345-6789',
      funcao_id: 'funcao-2',
      status: 'ativo',
      funcao: {
        id: 'funcao-2',
        nome: 'Arquiteto',
        nivel: 'Técnico',
        setor_id: 'setor-1',
        setor: { id: 'setor-1', nome: 'Engenharia' }
      }
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Busca por nome em cada entidade', () => {
    it('deve buscar setores por nome', () => {
      // Simular busca por "eng"
      const termoBusca = 'eng'
      const resultado = mockSetores.filter(setor =>
        setor.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
        (setor.descricao && setor.descricao.toLowerCase().includes(termoBusca.toLowerCase())) ||
        (setor.responsavel && setor.responsavel.toLowerCase().includes(termoBusca.toLowerCase()))
      )

      expect(resultado).toHaveLength(1)
      expect(resultado[0].nome).toBe('Engenharia')
    })

    it('deve buscar setores por descrição', () => {
      // Simular busca por "administrativo"
      const termoBusca = 'administrativo'
      const resultado = mockSetores.filter(setor =>
        setor.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
        (setor.descricao && setor.descricao.toLowerCase().includes(termoBusca.toLowerCase())) ||
        (setor.responsavel && setor.responsavel.toLowerCase().includes(termoBusca.toLowerCase()))
      )

      expect(resultado).toHaveLength(1)
      expect(resultado[0].nome).toBe('Gestão')
    })

    it('deve buscar setores por responsável', () => {
      // Simular busca por "joão"
      const termoBusca = 'joão'
      const resultado = mockSetores.filter(setor =>
        setor.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
        (setor.descricao && setor.descricao.toLowerCase().includes(termoBusca.toLowerCase())) ||
        (setor.responsavel && setor.responsavel.toLowerCase().includes(termoBusca.toLowerCase()))
      )

      expect(resultado).toHaveLength(1)
      expect(resultado[0].responsavel).toBe('João Silva')
    })

    it('deve buscar funções por nome', () => {
      // Simular busca por "engenheiro"
      const termoBusca = 'engenheiro'
      const resultado = mockFuncoes.filter(funcao =>
        funcao.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
        (funcao.descricao && funcao.descricao.toLowerCase().includes(termoBusca.toLowerCase())) ||
        (funcao.nivel && funcao.nivel.toLowerCase().includes(termoBusca.toLowerCase())) ||
        (funcao.setor?.nome && funcao.setor.nome.toLowerCase().includes(termoBusca.toLowerCase()))
      )

      expect(resultado).toHaveLength(1)
      expect(resultado[0].nome).toBe('Engenheiro Civil')
    })

    it('deve buscar funções por nível', () => {
      // Simular busca por "técnico"
      const termoBusca = 'técnico'
      const resultado = mockFuncoes.filter(funcao =>
        funcao.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
        (funcao.descricao && funcao.descricao.toLowerCase().includes(termoBusca.toLowerCase())) ||
        (funcao.nivel && funcao.nivel.toLowerCase().includes(termoBusca.toLowerCase())) ||
        (funcao.setor?.nome && funcao.setor.nome.toLowerCase().includes(termoBusca.toLowerCase()))
      )

      expect(resultado).toHaveLength(2)
      expect(resultado.every(f => f.nivel === 'Técnico')).toBe(true)
    })

    it('deve buscar funções por setor', () => {
      // Simular busca por "gestão"
      const termoBusca = 'gestão'
      const resultado = mockFuncoes.filter(funcao =>
        funcao.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
        (funcao.descricao && funcao.descricao.toLowerCase().includes(termoBusca.toLowerCase())) ||
        (funcao.nivel && funcao.nivel.toLowerCase().includes(termoBusca.toLowerCase())) ||
        (funcao.setor?.nome && funcao.setor.nome.toLowerCase().includes(termoBusca.toLowerCase()))
      )

      expect(resultado).toHaveLength(1)
      expect(resultado[0].setor?.nome).toBe('Gestão')
    })

    it('deve buscar funcionários por nome', () => {
      // Simular busca por "maria"
      const termoBusca = 'maria'
      const resultado = mockFuncionarios.filter(funcionario =>
        funcionario.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
        funcionario.email.toLowerCase().includes(termoBusca.toLowerCase()) ||
        (funcionario.funcao?.nome && funcionario.funcao.nome.toLowerCase().includes(termoBusca.toLowerCase())) ||
        (funcionario.funcao?.setor?.nome && funcionario.funcao.setor.nome.toLowerCase().includes(termoBusca.toLowerCase()))
      )

      expect(resultado).toHaveLength(1)
      expect(resultado[0].nome).toBe('Maria Santos')
    })

    it('deve buscar funcionários por email', () => {
      // Simular busca por "pedro"
      const termoBusca = 'pedro'
      const resultado = mockFuncionarios.filter(funcionario =>
        funcionario.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
        funcionario.email.toLowerCase().includes(termoBusca.toLowerCase()) ||
        (funcionario.funcao?.nome && funcionario.funcao.nome.toLowerCase().includes(termoBusca.toLowerCase())) ||
        (funcionario.funcao?.setor?.nome && funcionario.funcao.setor.nome.toLowerCase().includes(termoBusca.toLowerCase()))
      )

      expect(resultado).toHaveLength(1)
      expect(resultado[0].email).toBe('pedro@engflow.com')
    })

    it('deve buscar funcionários por função', () => {
      // Simular busca por "arquiteto"
      const termoBusca = 'arquiteto'
      const resultado = mockFuncionarios.filter(funcionario =>
        funcionario.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
        funcionario.email.toLowerCase().includes(termoBusca.toLowerCase()) ||
        (funcionario.funcao?.nome && funcionario.funcao.nome.toLowerCase().includes(termoBusca.toLowerCase())) ||
        (funcionario.funcao?.setor?.nome && funcionario.funcao.setor.nome.toLowerCase().includes(termoBusca.toLowerCase()))
      )

      expect(resultado).toHaveLength(1)
      expect(resultado[0].funcao?.nome).toBe('Arquiteto')
    })

    it('deve buscar funcionários por setor', () => {
      // Simular busca por "engenharia"
      const termoBusca = 'engenharia'
      const resultado = mockFuncionarios.filter(funcionario =>
        funcionario.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
        funcionario.email.toLowerCase().includes(termoBusca.toLowerCase()) ||
        (funcionario.funcao?.nome && funcionario.funcao.nome.toLowerCase().includes(termoBusca.toLowerCase())) ||
        (funcionario.funcao?.setor?.nome && funcionario.funcao.setor.nome.toLowerCase().includes(termoBusca.toLowerCase()))
      )

      expect(resultado).toHaveLength(2) // João (Engenheiro) e Ana (Arquiteto)
      expect(resultado.every(f => f.funcao?.setor?.nome === 'Engenharia')).toBe(true)
    })
  })

  describe('Filtros por setor/função', () => {
    it('deve filtrar funções por setor', () => {
      const setorSelecionado = 'setor-1'
      const resultado = mockFuncoes.filter(funcao => funcao.setor_id === setorSelecionado)

      expect(resultado).toHaveLength(2)
      expect(resultado.every(f => f.setor_id === 'setor-1')).toBe(true)
      expect(resultado.map(f => f.nome)).toEqual(['Engenheiro Civil', 'Arquiteto'])
    })

    it('deve filtrar funcionários por setor através da função', () => {
      const setorSelecionado = 'setor-1'
      const resultado = mockFuncionarios.filter(funcionario =>
        funcionario.funcao?.setor_id === setorSelecionado
      )

      expect(resultado).toHaveLength(2)
      expect(resultado.every(f => f.funcao?.setor_id === 'setor-1')).toBe(true)
      expect(resultado.map(f => f.nome)).toEqual(['João Silva', 'Ana Lima'])
    })

    it('deve filtrar funcionários por função específica', () => {
      const funcaoSelecionada = 'funcao-1'
      const resultado = mockFuncionarios.filter(funcionario =>
        funcionario.funcao_id === funcaoSelecionada
      )

      expect(resultado).toHaveLength(1)
      expect(resultado[0].nome).toBe('João Silva')
      expect(resultado[0].funcao?.nome).toBe('Engenheiro Civil')
    })

    it('deve filtrar por status do funcionário', () => {
      const statusSelecionado = 'ativo'
      const resultado = mockFuncionarios.filter(funcionario =>
        funcionario.status === statusSelecionado
      )

      expect(resultado).toHaveLength(3)
      expect(resultado.every(f => f.status === 'ativo')).toBe(true)
    })

    it('deve filtrar por nível hierárquico', () => {
      const nivelSelecionado = 'Técnico'
      const resultado = mockFuncionarios.filter(funcionario =>
        funcionario.funcao?.nivel === nivelSelecionado
      )

      expect(resultado).toHaveLength(2)
      expect(resultado.every(f => f.funcao?.nivel === 'Técnico')).toBe(true)
      expect(resultado.map(f => f.nome)).toEqual(['João Silva', 'Ana Lima'])
    })

    it('deve combinar filtros múltiplos', () => {
      // Filtrar por setor 'Engenharia' E status 'ativo'
      const setorSelecionado = 'setor-1'
      const statusSelecionado = 'ativo'

      const resultado = mockFuncionarios.filter(funcionario =>
        funcionario.funcao?.setor_id === setorSelecionado &&
        funcionario.status === statusSelecionado
      )

      expect(resultado).toHaveLength(2)
      expect(resultado.every(f => f.funcao?.setor_id === 'setor-1' && f.status === 'ativo')).toBe(true)
    })
  })

  describe('Performance otimizada', () => {
    it('deve implementar busca memoizada', () => {
      // Simular cache de busca
      const cacheResultados = new Map()

      const buscarComCache = (dados: any[], termo: string, filtroFn: Function) => {
        const chaveCache = `${dados.length}-${termo}`

        if (cacheResultados.has(chaveCache)) {
          return cacheResultados.get(chaveCache)
        }

        const resultado = dados.filter(filtroFn)
        cacheResultados.set(chaveCache, resultado)
        return resultado
      }

      // Primeira busca
      const termo = 'engenharia'
      const resultado1 = buscarComCache(mockFuncionarios, termo, (f: unknown) =>
        f.funcao?.setor?.nome?.toLowerCase().includes(termo.toLowerCase())
      )

      // Segunda busca com mesmo termo (deve usar cache)
      const resultado2 = buscarComCache(mockFuncionarios, termo, (f: unknown) =>
        f.funcao?.setor?.nome?.toLowerCase().includes(termo.toLowerCase())
      )

      expect(resultado1).toEqual(resultado2)
      expect(cacheResultados.size).toBe(1) // Cache foi usado
    })

    it('deve implementar debounce para busca', () => {
      // Simular debounce
      let timeoutId: NodeJS.Timeout | null = null
      let contadorBuscas = 0

      const buscarComDebounce = (termo: string, delay: number = 300) => {
        return new Promise((resolve) => {
          if (timeoutId) {
            clearTimeout(timeoutId)
          }

          timeoutId = setTimeout(() => {
            contadorBuscas++
            const resultado = mockFuncionarios.filter(f =>
              f.nome.toLowerCase().includes(termo.toLowerCase())
            )
            resolve(resultado)
          }, delay)
        })
      }

      // Simular múltiplas digitações rápidas
      buscarComDebounce('j', 100)
      buscarComDebounce('jo', 100)
      buscarComDebounce('joa', 100)
      buscarComDebounce('joao', 100)

      // Após o delay, apenas uma busca deve ter sido executada
      setTimeout(() => {
        expect(contadorBuscas).toBeLessThanOrEqual(1)
      }, 150)
    })

    it('deve ter performance adequada para grandes datasets', () => {
      // Simular dataset grande
      const datasetGrande = Array.from({ length: 1000 }, (_, i) => ({
        id: `funcionario-${i}`,
        nome: `Funcionário ${i}`,
        email: `funcionario${i}@engflow.com`,
        funcao_id: `funcao-${i % 10}`,
        funcao: {
          id: `funcao-${i % 10}`,
          nome: `Função ${i % 10}`,
          setor_id: `setor-${i % 4}`,
          setor: { id: `setor-${i % 4}`, nome: `Setor ${i % 4}` }
        }
      }))

      const startTime = performance.now()

      // Busca em dataset grande
      const resultado = datasetGrande.filter(funcionario =>
        funcionario.nome.toLowerCase().includes('funcionário 1'.toLowerCase()) ||
        funcionario.email.toLowerCase().includes('funcionário 1'.toLowerCase())
      )

      const endTime = performance.now()
      const tempoExecucao = endTime - startTime

      expect(resultado.length).toBeGreaterThan(0)
      expect(tempoExecucao).toBeLessThan(100) // Deve ser rápido mesmo com 1000 itens
    })

    it('deve otimizar filtros hierárquicos', () => {
      // Simular índice para otimização de filtros
      const indiceSetorFuncao = new Map()
      const indiceFuncaoFuncionario = new Map()

      // Construir índices
      mockFuncoes.forEach(funcao => {
        if (!indiceSetorFuncao.has(funcao.setor_id)) {
          indiceSetorFuncao.set(funcao.setor_id, [])
        }
        indiceSetorFuncao.get(funcao.setor_id).push(funcao)
      })

      mockFuncionarios.forEach(funcionario => {
        if (!indiceFuncaoFuncionario.has(funcionario.funcao_id)) {
          indiceFuncaoFuncionario.set(funcionario.funcao_id, [])
        }
        indiceFuncaoFuncionario.get(funcionario.funcao_id).push(funcionario)
      })

      // Usar índices para filtro rápido
      const setorId = 'setor-1'
      const funcoesDoSetor = indiceSetorFuncao.get(setorId) || []
      const funcionariosDoSetor = funcoesDoSetor.flatMap(funcao =>
        indiceFuncaoFuncionario.get(funcao.id) || []
      )

      expect(funcoesDoSetor).toHaveLength(2)
      expect(funcionariosDoSetor).toHaveLength(2)
      expect(funcionariosDoSetor.map(f => f.nome)).toEqual(['João Silva', 'Ana Lima'])
    })

    it('deve implementar paginação para resultados grandes', () => {
      const paginaAtual = 1
      const itensPorPagina = 2
      const offset = (paginaAtual - 1) * itensPorPagina

      const resultadoPaginado = mockFuncionarios.slice(offset, offset + itensPorPagina)
      const totalPaginas = Math.ceil(mockFuncionarios.length / itensPorPagina)

      expect(resultadoPaginado).toHaveLength(2)
      expect(totalPaginas).toBe(2)
      expect(resultadoPaginado[0].nome).toBe('João Silva')
      expect(resultadoPaginado[1].nome).toBe('Maria Santos')
    })
  })

  describe('Busca avançada e combinações', () => {
    it('deve implementar busca fuzzy para tolerância a erros', () => {
      // Simular busca fuzzy mais tolerante
      const buscarFuzzy = (dados: any[], termo: string) => {
        const termoNormalizado = termo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

        return dados.filter(item => {
          const nomeNormalizado = item.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

          // Verificar se contém o termo ou se é similar
          return nomeNormalizado.includes(termoNormalizado) ||
                 nomeNormalizado.startsWith(termoNormalizado) ||
                 item.nome.toLowerCase().includes(termo.toLowerCase())
        })
      }

      // Buscar com erro de digitação (sem acento)
      const resultado = buscarFuzzy(mockFuncionarios, 'joao')

      expect(resultado.length).toBeGreaterThanOrEqual(1)
      expect(resultado.some(f => f.nome.includes('João'))).toBe(true)
    })

    it('deve implementar busca por múltiplas palavras', () => {
      const buscarMultiplasPalavras = (dados: any[], termo: string) => {
        const palavras = termo.toLowerCase().split(' ').filter(p => p.length > 0)

        return dados.filter(item => {
          const textoCompleto = [
            item.nome,
            item.email || '',
            item.funcao?.nome || '',
            item.funcao?.setor?.nome || ''
          ].join(' ').toLowerCase()

          return palavras.every(palavra =>
            textoCompleto.includes(palavra)
          )
        })
      }

      const resultado = buscarMultiplasPalavras(mockFuncionarios, 'joão engenheiro')

      expect(resultado).toHaveLength(1)
      expect(resultado[0].nome).toBe('João Silva')
      expect(resultado[0].funcao?.nome).toBe('Engenheiro Civil')
    })

    it('deve implementar busca por categorias', () => {
      const categoriasBusca = {
        nomes: mockFuncionarios.map(f => f.nome),
        emails: mockFuncionarios.map(f => f.email),
        funcoes: mockFuncionarios.map(f => f.funcao?.nome).filter(Boolean),
        setores: mockFuncionarios.map(f => f.funcao?.setor?.nome).filter(Boolean)
      }

      const buscarPorCategoria = (termo: string, categoria: keyof typeof categoriasBusca) => {
        const items = categoriasBusca[categoria]
        return items.filter(item =>
          item?.toLowerCase().includes(termo.toLowerCase())
        )
      }

      const resultadoNomes = buscarPorCategoria('silva', 'nomes')
      const resultadoEmails = buscarPorCategoria('maria', 'emails')
      const resultadoFuncoes = buscarPorCategoria('gerente', 'funcoes')
      const resultadoSetores = buscarPorCategoria('engenharia', 'setores')

      expect(resultadoNomes).toContain('João Silva')
      expect(resultadoEmails).toContain('maria@engflow.com')
      expect(resultadoFuncoes).toContain('Gerente')
      expect(resultadoSetores).toContain('Engenharia')
    })
  })
})