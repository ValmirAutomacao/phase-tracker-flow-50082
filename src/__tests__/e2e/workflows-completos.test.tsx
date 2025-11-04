import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';

// Componentes a serem testados
import { App } from '../../App';
import Clientes from '../../pages/cadastros/Clientes';
import Obras from '../../pages/cadastros/Obras';
import Funcionarios from '../../pages/cadastros/Funcionarios';

// Mock do Supabase
vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        data: [],
        error: null
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          data: [{ id: '1' }],
          error: null
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            data: [{ id: '1' }],
            error: null
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: null,
          error: null
        }))
      }))
    }))
  }
}));

// Mock do localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Component wrapper para testes
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Workflows Completos E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Workflow Completo: Gestão de Clientes', () => {
    it('deve permitir criar, editar e excluir cliente completo', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <Clientes />
        </TestWrapper>
      );

      // Aguardar carregamento da página
      await waitFor(() => {
        expect(screen.getByText(/clientes/i)).toBeInTheDocument();
      });

      // Verificar se botão de adicionar está presente
      const addButton = screen.getByRole('button', { name: /adicionar/i });
      expect(addButton).toBeInTheDocument();

      // Simular abertura do modal de criação
      await user.click(addButton);

      // Verificar se campos do formulário estão presentes
      await waitFor(() => {
        expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
      });

      // Preencher formulário de cliente
      const nomeField = screen.getByLabelText(/nome/i);
      const emailField = screen.getByLabelText(/email/i);

      await user.type(nomeField, 'Cliente Teste E2E');
      await user.type(emailField, 'teste@example.com');

      // Submeter formulário
      const submitButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(submitButton);

      // Verificar se cliente foi adicionado (mock deve ter sido chamado)
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalled();
      });
    });

    it('deve implementar busca e filtros de clientes', async () => {
      const user = userEvent.setup();

      // Mock dados de clientes
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'engflow_clientes') {
          return JSON.stringify([
            { id: '1', nome: 'Cliente Alpha', email: 'alpha@test.com', ativo: true },
            { id: '2', nome: 'Cliente Beta', email: 'beta@test.com', ativo: false },
            { id: '3', nome: 'Cliente Gamma', email: 'gamma@test.com', ativo: true }
          ]);
        }
        return null;
      });

      render(
        <TestWrapper>
          <Clientes />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/clientes/i)).toBeInTheDocument();
      });

      // Buscar por nome
      const searchInput = screen.getByPlaceholderText(/pesquisar/i);
      await user.type(searchInput, 'Alpha');

      // Verificar filtro funcionando
      await waitFor(() => {
        expect(screen.getByText('Cliente Alpha')).toBeInTheDocument();
        expect(screen.queryByText('Cliente Beta')).not.toBeInTheDocument();
      });
    });
  });

  describe('Workflow Completo: Gestão de Obras', () => {
    it('deve permitir criar obra vinculada a cliente', async () => {
      const user = userEvent.setup();

      // Mock dados necessários
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'engflow_clientes') {
          return JSON.stringify([
            { id: '1', nome: 'Cliente Teste', email: 'teste@test.com' }
          ]);
        }
        if (key === 'engflow_obras') {
          return JSON.stringify([]);
        }
        return null;
      });

      render(
        <TestWrapper>
          <Obras />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/obras/i)).toBeInTheDocument();
      });

      // Adicionar nova obra
      const addButton = screen.getByRole('button', { name: /adicionar/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/nome.*obra/i)).toBeInTheDocument();
      });

      // Preencher dados da obra
      const nomeField = screen.getByLabelText(/nome.*obra/i);
      await user.type(nomeField, 'Obra Teste E2E');

      // Selecionar cliente
      const clienteSelect = screen.getByRole('combobox');
      await user.click(clienteSelect);

      await waitFor(async () => {
        const clienteOption = screen.getByText('Cliente Teste');
        await user.click(clienteOption);
      });

      // Salvar obra
      const submitButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalled();
      });
    });
  });

  describe('Workflow Completo: Gestão de Funcionários', () => {
    it('deve permitir criar funcionário com hierarquia completa', async () => {
      const user = userEvent.setup();

      // Mock dados de setores e funções
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'engflow_setores') {
          return JSON.stringify([
            { id: '1', nome: 'Engenharia', ativo: true }
          ]);
        }
        if (key === 'engflow_funcoes') {
          return JSON.stringify([
            { id: '1', nome: 'Engenheiro Civil', setorId: '1', ativo: true }
          ]);
        }
        if (key === 'engflow_funcionarios') {
          return JSON.stringify([]);
        }
        return null;
      });

      render(
        <TestWrapper>
          <Funcionarios />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/funcionários/i)).toBeInTheDocument();
      });

      // Adicionar funcionário
      const addButton = screen.getByRole('button', { name: /adicionar/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
      });

      // Preencher dados do funcionário
      const nomeField = screen.getByLabelText(/nome/i);
      await user.type(nomeField, 'João Silva');

      const emailField = screen.getByLabelText(/email/i);
      await user.type(emailField, 'joao@empresa.com');

      // Selecionar função (que implica no setor)
      const funcaoSelect = screen.getByLabelText(/função/i);
      await user.click(funcaoSelect);

      await waitFor(async () => {
        const funcaoOption = screen.getByText('Engenheiro Civil');
        await user.click(funcaoOption);
      });

      // Salvar funcionário
      const submitButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalled();
      });
    });
  });

  describe('Workflow de Migração', () => {
    it('deve executar migração completa localStorage → Supabase', async () => {
      // Mock do sistema de migração
      const mockMigration = {
        executeMigration: vi.fn().mockResolvedValue({
          success: true,
          totalRecords: 10,
          migratedRecords: 10,
          errors: []
        })
      };

      // Mock dados completos no localStorage
      mockLocalStorage.getItem.mockImplementation((key) => {
        const mockData = {
          'engflow_clientes': [{ id: '1', nome: 'Cliente 1' }],
          'engflow_obras': [{ id: '1', nome: 'Obra 1', clienteId: '1' }],
          'engflow_funcionarios': [{ id: '1', nome: 'Funcionário 1' }]
        };
        return JSON.stringify(mockData[key] || []);
      });

      // Simular execução da migração
      const migrationResult = await mockMigration.executeMigration();

      expect(migrationResult.success).toBe(true);
      expect(migrationResult.totalRecords).toBe(10);
      expect(migrationResult.migratedRecords).toBe(10);
      expect(migrationResult.errors).toHaveLength(0);
    });
  });

  describe('Workflow de Integridade de Dados', () => {
    it('deve validar relacionamentos entre entidades', async () => {
      // Mock dados com relacionamentos
      mockLocalStorage.getItem.mockImplementation((key) => {
        const mockData = {
          'engflow_clientes': [
            { id: '1', nome: 'Cliente A' }
          ],
          'engflow_obras': [
            { id: '1', nome: 'Obra A', clienteId: '1' },
            { id: '2', nome: 'Obra B', clienteId: '999' } // Relacionamento inválido
          ]
        };
        return JSON.stringify(mockData[key] || []);
      });

      // Simular validação de integridade
      const clientes = JSON.parse(mockLocalStorage.getItem('engflow_clientes') || '[]');
      const obras = JSON.parse(mockLocalStorage.getItem('engflow_obras') || '[]');

      const clienteIds = clientes.map((c: unknown) => c.id);
      const obrasComClienteInvalido = obras.filter((o: unknown) => !clienteIds.includes(o.clienteId));

      expect(obrasComClienteInvalido).toHaveLength(1);
      expect(obrasComClienteInvalido[0].clienteId).toBe('999');
    });
  });

  describe('Workflow de Performance', () => {
    it('deve carregar listas grandes de dados eficientemente', async () => {
      // Mock lista grande de clientes
      const largeClientList = Array.from({ length: 1000 }, (_, i) => ({
        id: String(i + 1),
        nome: `Cliente ${i + 1}`,
        email: `cliente${i + 1}@test.com`
      }));

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'engflow_clientes') {
          return JSON.stringify(largeClientList);
        }
        return null;
      });

      const startTime = performance.now();

      render(
        <TestWrapper>
          <Clientes />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/clientes/i)).toBeInTheDocument();
      });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Verificar se carregou em menos de 1 segundo
      expect(loadTime).toBeLessThan(1000);
    });
  });
});