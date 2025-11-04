import { describe, test, expect } from 'vitest';

interface RequisicaoItem {
  id: string;
  titulo: string;
  descricao?: string;
  obra?: {
    nome: string;
  } | null;
  funcionario_solicitante?: {
    nome: string;
  } | null;
  status: string;
  prioridade: string;
}

describe('Filtro de Requisições - Correção TypeError', () => {
  const mockRequisicoes: RequisicaoItem[] = [
    {
      id: '1',
      titulo: 'Requisição Normal',
      descricao: 'Descrição normal',
      obra: { nome: 'Obra A' },
      funcionario_solicitante: { nome: 'João Silva' },
      status: 'pendente',
      prioridade: 'media'
    },
    {
      id: '2',
      titulo: 'Requisição Sem Relacionamentos',
      obra: null,
      funcionario_solicitante: null,
      status: 'concluida',
      prioridade: 'alta'
    },
    {
      id: '3',
      titulo: 'Requisição Undefined',
      obra: undefined,
      funcionario_solicitante: undefined,
      descricao: undefined,
      status: 'em_andamento',
      prioridade: 'baixa'
    }
  ];

  const filterRequisicoes = (
    requisicoes: RequisicaoItem[],
    searchTerm: string,
    statusFilter: string,
    prioridadeFilter: string
  ) => {
    return requisicoes.filter(req => {
      // Fallback seguro para evitar erros de propriedades undefined/null
      const titulo = req.titulo || '';
      const descricao = req.descricao || '';
      const obraNome = req.obra?.nome || '';
      const funcionarioNome = req.funcionario_solicitante?.nome || '';

      const matchesSearch = titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           obraNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           funcionarioNome.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || req.status === statusFilter;
      const matchesPrioridade = prioridadeFilter === "all" || req.prioridade === prioridadeFilter;

      return matchesSearch && matchesStatus && matchesPrioridade;
    });
  };

  test('deve filtrar sem erro com propriedades undefined', () => {
    expect(() => {
      const result = filterRequisicoes(mockRequisicoes, '', 'all', 'all');
      expect(result).toHaveLength(3);
    }).not.toThrow();
  });

  test('deve filtrar sem erro com propriedades null', () => {
    expect(() => {
      const result = filterRequisicoes(mockRequisicoes, '', 'all', 'all');
      expect(result).toHaveLength(3);
    }).not.toThrow();
  });

  test('deve buscar por título mesmo com outros campos undefined', () => {
    const result = filterRequisicoes(mockRequisicoes, 'undefined', 'all', 'all');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });

  test('deve buscar por obra quando disponível', () => {
    const result = filterRequisicoes(mockRequisicoes, 'obra a', 'all', 'all');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  test('deve buscar por funcionário quando disponível', () => {
    const result = filterRequisicoes(mockRequisicoes, 'joão', 'all', 'all');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  test('deve retornar lista vazia para busca sem correspondência', () => {
    const result = filterRequisicoes(mockRequisicoes, 'inexistente', 'all', 'all');
    expect(result).toHaveLength(0);
  });

  test('deve filtrar por status corretamente', () => {
    const result = filterRequisicoes(mockRequisicoes, '', 'pendente', 'all');
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('pendente');
  });

  test('deve filtrar por prioridade corretamente', () => {
    const result = filterRequisicoes(mockRequisicoes, '', 'all', 'alta');
    expect(result).toHaveLength(1);
    expect(result[0].prioridade).toBe('alta');
  });
});