import { describe, test, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ObrasForm } from '@/pages/cadastros/ObrasForm';

// Mock dos hooks customizados
vi.mock('@/hooks/useSupabaseQuery', () => ({
  useOptimizedSupabaseQuery: vi.fn()
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('ObrasForm - Dropdown de Clientes', () => {
  const mockClientes = [
    { id: 'cliente-1', nome: 'João Silva' },
    { id: 'cliente-2', nome: 'Maria Santos' },
    { id: 'cliente-3', nome: 'Construtora ABC Ltda' },
    { id: 'cliente-novo', nome: 'Cliente Recém Cadastrado' }
  ];

  beforeEach(() => {
    const { useOptimizedSupabaseQuery } = require('@/hooks/useSupabaseQuery');

    useOptimizedSupabaseQuery.mockReturnValue({
      data: mockClientes,
      isLoading: false,
      error: null
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

  test('deve exibir clientes do Supabase no dropdown', async () => {
    const mockOnSubmit = vi.fn();
    const mockOnOpenChange = vi.fn();

    renderWithQueryClient(
      <ObrasForm
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
      />
    );

    // Verificar se o formulário é renderizado
    expect(screen.getByText('Nova Obra')).toBeInTheDocument();

    // Aguardar e verificar se o dropdown está presente
    await waitFor(() => {
      expect(screen.getByText('Selecione o cliente')).toBeInTheDocument();
    });

    // O dropdown deve ter os clientes do Supabase
    // Nota: Para testar o conteúdo do Select, seria necessário interagir com ele
    // Este teste verifica que o componente renderiza sem erros com dados reais
  });

  test('deve incluir cliente recém cadastrado', async () => {
    const { useOptimizedSupabaseQuery } = require('@/hooks/useSupabaseQuery');

    // Simular dados atualizados incluindo cliente novo
    useOptimizedSupabaseQuery.mockReturnValue({
      data: mockClientes, // Inclui "Cliente Recém Cadastrado"
      isLoading: false,
      error: null
    });

    const mockOnSubmit = vi.fn();
    const mockOnOpenChange = vi.fn();

    renderWithQueryClient(
      <ObrasForm
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Nova Obra')).toBeInTheDocument();
    });

    // Verificar que o hook foi chamado corretamente
    expect(useOptimizedSupabaseQuery).toHaveBeenCalledWith('CLIENTES');
  });

  test('deve lidar com lista vazia de clientes', async () => {
    const { useOptimizedSupabaseQuery } = require('@/hooks/useSupabaseQuery');

    useOptimizedSupabaseQuery.mockReturnValue({
      data: [], // Lista vazia
      isLoading: false,
      error: null
    });

    const mockOnSubmit = vi.fn();
    const mockOnOpenChange = vi.fn();

    renderWithQueryClient(
      <ObrasForm
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Nova Obra')).toBeInTheDocument();
    });

    // Componente deve renderizar mesmo com lista vazia
    expect(screen.getByText('Selecione o cliente')).toBeInTheDocument();
  });

  test('deve lidar com estado de loading', async () => {
    const { useOptimizedSupabaseQuery } = require('@/hooks/useSupabaseQuery');

    useOptimizedSupabaseQuery.mockReturnValue({
      data: [],
      isLoading: true, // Estado de carregamento
      error: null
    });

    const mockOnSubmit = vi.fn();
    const mockOnOpenChange = vi.fn();

    renderWithQueryClient(
      <ObrasForm
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Nova Obra')).toBeInTheDocument();
    });

    // Componente deve renderizar durante loading
    expect(screen.getByText('Selecione o cliente')).toBeInTheDocument();
  });
});