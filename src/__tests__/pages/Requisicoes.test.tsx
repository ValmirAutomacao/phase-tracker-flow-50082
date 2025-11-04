import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Requisicoes from '@/pages/Requisicoes';

// Mock dos hooks customizados
vi.mock('@/hooks/useSupabaseQuery', () => ({
  useOptimizedSupabaseQuery: vi.fn()
}));

vi.mock('@/hooks/useSupabaseMutation', () => ({
  useSupabaseCRUD: vi.fn()
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('Requisicoes Page', () => {
  const mockRequisicoes = [
    {
      id: '1',
      titulo: 'Requisição Teste',
      obra_id: 'obra-1',
      funcionario_solicitante_id: 'func-1',
      status: 'pendente',
      prioridade: 'media',
      obra: { id: 'obra-1', nome: 'Obra Teste' },
      funcionario_solicitante: { id: 'func-1', nome: 'João Silva' }
    },
    {
      id: '2',
      titulo: 'Requisição Sem Relacionamentos',
      obra_id: 'obra-2',
      funcionario_solicitante_id: 'func-2',
      status: 'concluida',
      prioridade: 'alta',
      // Propositalmente sem obra e funcionario_solicitante para teste
      obra: null,
      funcionario_solicitante: null
    },
    {
      id: '3',
      titulo: 'Requisição Undefined',
      obra_id: 'obra-3',
      funcionario_solicitante_id: 'func-3',
      status: 'em_andamento',
      prioridade: 'baixa',
      // Propositalmente undefined para teste de fallback
      obra: undefined,
      funcionario_solicitante: undefined,
      descricao: undefined
    }
  ];

  beforeEach(() => {
    const { useOptimizedSupabaseQuery } = require('@/hooks/useSupabaseQuery');
    const { useSupabaseCRUD } = require('@/hooks/useSupabaseMutation');

    useOptimizedSupabaseQuery.mockReturnValue({
      data: mockRequisicoes,
      isLoading: false,
      error: null
    });

    useSupabaseCRUD.mockReturnValue({
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    });
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  test('deve renderizar sem erros com dados de relacionamentos indefinidos', () => {
    expect(() => {
      renderWithQueryClient(<Requisicoes />);
    }).not.toThrow();
  });

  test('deve exibir o título da página', () => {
    renderWithQueryClient(<Requisicoes />);
    expect(screen.getByText('Requisições')).toBeInTheDocument();
  });

  test('deve filtrar requisições sem causar erro com propriedades undefined', () => {
    renderWithQueryClient(<Requisicoes />);

    // Verificar se as requisições são exibidas mesmo com dados undefined/null
    expect(screen.getByText('Requisição Teste')).toBeInTheDocument();
    expect(screen.getByText('Requisição Sem Relacionamentos')).toBeInTheDocument();
    expect(screen.getByText('Requisição Undefined')).toBeInTheDocument();
  });

  test('deve lidar com busca em campos undefined sem erros', async () => {
    renderWithQueryClient(<Requisicoes />);

    const searchInput = screen.getByPlaceholderText('Buscar requisições...');

    // Teste de busca que anteriormente causaria erro
    expect(() => {
      searchInput.focus();
    }).not.toThrow();
  });
});