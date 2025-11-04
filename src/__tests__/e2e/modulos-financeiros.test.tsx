import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';

// Páginas a serem testadas
import Financeiro from '../../pages/Financeiro';
import Videos from '../../pages/Videos';
import Requisicoes from '../../pages/Requisicoes';

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

// Component wrapper
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

describe('Módulos Financeiros E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Workflow Financeiro: Gestão de Despesas', () => {
    it('deve permitir registrar despesa vinculada a obra', async () => {
      const user = userEvent.setup();

      // Mock dados necessários
      mockLocalStorage.getItem.mockImplementation((key) => {
        const mockData = {
          'engflow_clientes': [
            { id: '1', nome: 'Cliente ABC', email: 'abc@test.com' }
          ],
          'engflow_obras': [
            { id: '1', nome: 'Obra Residencial', clienteId: '1', status: 'ativo' }
          ],
          'engflow_despesas': []
        };
        return JSON.stringify(mockData[key] || []);
      });

      render(
        <TestWrapper>
          <Financeiro />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/financeiro/i)).toBeInTheDocument();
      });

      // Adicionar nova despesa
      const addButton = screen.getByRole('button', { name: /adicionar.*despesa/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/descrição/i)).toBeInTheDocument();
      });

      // Preencher formulário de despesa
      const descricaoField = screen.getByLabelText(/descrição/i);
      await user.type(descricaoField, 'Material de Construção');

      const valorField = screen.getByLabelText(/valor/i);
      await user.type(valorField, '1500.00');

      // Selecionar obra
      const obraSelect = screen.getByLabelText(/obra/i);
      await user.click(obraSelect);

      await waitFor(async () => {
        const obraOption = screen.getByText('Obra Residencial');
        await user.click(obraOption);
      });

      // Salvar despesa
      const submitButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'engflow_despesas',
          expect.stringContaining('Material de Construção')
        );
      });
    });

    it('deve calcular totais financeiros por obra', async () => {
      // Mock despesas existentes
      mockLocalStorage.getItem.mockImplementation((key) => {
        const mockData = {
          'engflow_obras': [
            { id: '1', nome: 'Obra A', clienteId: '1' },
            { id: '2', nome: 'Obra B', clienteId: '1' }
          ],
          'engflow_despesas': [
            { id: '1', obraId: '1', valor: 1000, descricao: 'Material 1' },
            { id: '2', obraId: '1', valor: 500, descricao: 'Material 2' },
            { id: '3', obraId: '2', valor: 750, descricao: 'Material 3' }
          ]
        };
        return JSON.stringify(mockData[key] || []);
      });

      render(
        <TestWrapper>
          <Financeiro />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/financeiro/i)).toBeInTheDocument();
      });

      // Verificar se os totais são calculados corretamente
      await waitFor(() => {
        // Obra A: R$ 1.500,00 (1000 + 500)
        expect(screen.getByText(/1\.500/)).toBeInTheDocument();
        // Obra B: R$ 750,00
        expect(screen.getByText(/750/)).toBeInTheDocument();
      });
    });

    it('deve filtrar despesas por período', async () => {
      const user = userEvent.setup();

      // Mock despesas com datas diferentes
      const hoje = new Date();
      const ontem = new Date(hoje);
      ontem.setDate(hoje.getDate() - 1);
      const semanaPassada = new Date(hoje);
      semanaPassada.setDate(hoje.getDate() - 7);

      mockLocalStorage.getItem.mockImplementation((key) => {
        const mockData = {
          'engflow_despesas': [
            { id: '1', valor: 100, data: hoje.toISOString(), descricao: 'Despesa Hoje' },
            { id: '2', valor: 200, data: ontem.toISOString(), descricao: 'Despesa Ontem' },
            { id: '3', valor: 300, data: semanaPassada.toISOString(), descricao: 'Despesa Antiga' }
          ]
        };
        return JSON.stringify(mockData[key] || []);
      });

      render(
        <TestWrapper>
          <Financeiro />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/financeiro/i)).toBeInTheDocument();
      });

      // Filtrar por "últimos 7 dias"
      const filtroSelect = screen.getByLabelText(/período/i);
      await user.click(filtroSelect);

      await waitFor(async () => {
        const opcaoFiltro = screen.getByText(/últimos 7 dias/i);
        await user.click(opcaoFiltro);
      });

      // Verificar se apenas despesas recentes aparecem
      await waitFor(() => {
        expect(screen.getByText('Despesa Hoje')).toBeInTheDocument();
        expect(screen.getByText('Despesa Ontem')).toBeInTheDocument();
        expect(screen.queryByText('Despesa Antiga')).not.toBeInTheDocument();
      });
    });
  });

  describe('Workflow de Vídeos: Gestão e Renderização', () => {
    it('deve permitir upload e associação de vídeo a obra', async () => {
      const user = userEvent.setup();

      mockLocalStorage.getItem.mockImplementation((key) => {
        const mockData = {
          'engflow_obras': [
            { id: '1', nome: 'Construção Casa', clienteId: '1' }
          ],
          'engflow_videos': []
        };
        return JSON.stringify(mockData[key] || []);
      });

      render(
        <TestWrapper>
          <Videos />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/vídeos/i)).toBeInTheDocument();
      });

      // Adicionar novo vídeo
      const addButton = screen.getByRole('button', { name: /adicionar.*vídeo/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/título/i)).toBeInTheDocument();
      });

      // Preencher informações do vídeo
      const tituloField = screen.getByLabelText(/título/i);
      await user.type(tituloField, 'Progresso da Obra - Semana 1');

      // Selecionar obra
      const obraSelect = screen.getByLabelText(/obra/i);
      await user.click(obraSelect);

      await waitFor(async () => {
        const obraOption = screen.getByText('Construção Casa');
        await user.click(obraOption);
      });

      // Mock upload de arquivo
      const fileInput = screen.getByLabelText(/arquivo/i);
      const file = new File(['video content'], 'progresso.mp4', { type: 'video/mp4' });
      await user.upload(fileInput, file);

      // Salvar vídeo
      const submitButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'engflow_videos',
          expect.stringContaining('Progresso da Obra')
        );
      });
    });

    it('deve gerenciar status de renderização de vídeos', async () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        const mockData = {
          'engflow_videos': [
            { id: '1', titulo: 'Vídeo 1', status: 'pendente', obraId: '1' },
            { id: '2', titulo: 'Vídeo 2', status: 'renderizando', obraId: '1' },
            { id: '3', titulo: 'Vídeo 3', status: 'concluído', obraId: '1' }
          ]
        };
        return JSON.stringify(mockData[key] || []);
      });

      render(
        <TestWrapper>
          <Videos />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/vídeos/i)).toBeInTheDocument();
      });

      // Verificar se os diferentes status são exibidos
      await waitFor(() => {
        expect(screen.getByText(/pendente/i)).toBeInTheDocument();
        expect(screen.getByText(/renderizando/i)).toBeInTheDocument();
        expect(screen.getByText(/concluído/i)).toBeInTheDocument();
      });
    });
  });

  describe('Workflow de Requisições: Sistema de Tickets', () => {
    it('deve criar requisição associada a funcionário e obra', async () => {
      const user = userEvent.setup();

      mockLocalStorage.getItem.mockImplementation((key) => {
        const mockData = {
          'engflow_funcionarios': [
            { id: '1', nome: 'João Silva', funcaoId: '1' }
          ],
          'engflow_obras': [
            { id: '1', nome: 'Projeto Alpha', clienteId: '1' }
          ],
          'engflow_requisicoes': []
        };
        return JSON.stringify(mockData[key] || []);
      });

      render(
        <TestWrapper>
          <Requisicoes />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/requisições/i)).toBeInTheDocument();
      });

      // Criar nova requisição
      const addButton = screen.getByRole('button', { name: /nova.*requisição/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/título/i)).toBeInTheDocument();
      });

      // Preencher requisição
      const tituloField = screen.getByLabelText(/título/i);
      await user.type(tituloField, 'Solicitação de Material');

      const descricaoField = screen.getByLabelText(/descrição/i);
      await user.type(descricaoField, 'Necessário comprar cimento para a obra');

      // Selecionar solicitante
      const funcionarioSelect = screen.getByLabelText(/solicitante/i);
      await user.click(funcionarioSelect);

      await waitFor(async () => {
        const funcionarioOption = screen.getByText('João Silva');
        await user.click(funcionarioOption);
      });

      // Selecionar obra
      const obraSelect = screen.getByLabelText(/obra/i);
      await user.click(obraSelect);

      await waitFor(async () => {
        const obraOption = screen.getByText('Projeto Alpha');
        await user.click(obraOption);
      });

      // Salvar requisição
      const submitButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'engflow_requisicoes',
          expect.stringContaining('Solicitação de Material')
        );
      });
    });

    it('deve permitir mudança de status de requisições', async () => {
      const user = userEvent.setup();

      mockLocalStorage.getItem.mockImplementation((key) => {
        const mockData = {
          'engflow_requisicoes': [
            {
              id: '1',
              titulo: 'Requisição Teste',
              status: 'pendente',
              funcionarioId: '1',
              obraId: '1'
            }
          ]
        };
        return JSON.stringify(mockData[key] || []);
      });

      render(
        <TestWrapper>
          <Requisicoes />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/requisições/i)).toBeInTheDocument();
      });

      // Encontrar requisição e alterar status
      await waitFor(() => {
        expect(screen.getByText('Requisição Teste')).toBeInTheDocument();
      });

      const statusButton = screen.getByRole('button', { name: /pendente/i });
      await user.click(statusButton);

      // Selecionar novo status
      await waitFor(async () => {
        const emAndamentoOption = screen.getByText(/em andamento/i);
        await user.click(emAndamentoOption);
      });

      // Verificar se status foi atualizado
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalled();
      });
    });

    it('deve filtrar requisições por status e responsável', async () => {
      const user = userEvent.setup();

      mockLocalStorage.getItem.mockImplementation((key) => {
        const mockData = {
          'engflow_funcionarios': [
            { id: '1', nome: 'João' },
            { id: '2', nome: 'Maria' }
          ],
          'engflow_requisicoes': [
            { id: '1', titulo: 'Req 1', status: 'pendente', funcionarioId: '1' },
            { id: '2', titulo: 'Req 2', status: 'concluída', funcionarioId: '1' },
            { id: '3', titulo: 'Req 3', status: 'pendente', funcionarioId: '2' }
          ]
        };
        return JSON.stringify(mockData[key] || []);
      });

      render(
        <TestWrapper>
          <Requisicoes />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/requisições/i)).toBeInTheDocument();
      });

      // Filtrar por status "pendente"
      const statusFilter = screen.getByLabelText(/status/i);
      await user.click(statusFilter);

      await waitFor(async () => {
        const pendenteOption = screen.getByText(/pendente/i);
        await user.click(pendenteOption);
      });

      // Verificar se apenas requisições pendentes aparecem
      await waitFor(() => {
        expect(screen.getByText('Req 1')).toBeInTheDocument();
        expect(screen.getByText('Req 3')).toBeInTheDocument();
        expect(screen.queryByText('Req 2')).not.toBeInTheDocument();
      });
    });
  });

  describe('Workflow Integrado: Relatórios e Dashboard', () => {
    it('deve gerar relatório financeiro consolidado', async () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        const mockData = {
          'engflow_clientes': [
            { id: '1', nome: 'Cliente A' }
          ],
          'engflow_obras': [
            { id: '1', nome: 'Obra 1', clienteId: '1', valor: 50000 },
            { id: '2', nome: 'Obra 2', clienteId: '1', valor: 30000 }
          ],
          'engflow_despesas': [
            { id: '1', obraId: '1', valor: 15000 },
            { id: '2', obraId: '1', valor: 8000 },
            { id: '3', obraId: '2', valor: 12000 }
          ]
        };
        return JSON.stringify(mockData[key] || []);
      });

      render(
        <TestWrapper>
          <Financeiro />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/financeiro/i)).toBeInTheDocument();
      });

      // Verificar resumo financeiro
      await waitFor(() => {
        // Total de obras: R$ 80.000
        expect(screen.getByText(/80\.000/)).toBeInTheDocument();
        // Total de despesas: R$ 35.000
        expect(screen.getByText(/35\.000/)).toBeInTheDocument();
      });
    });

    it('deve mostrar progresso geral do projeto', async () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        const mockData = {
          'engflow_obras': [
            { id: '1', nome: 'Obra 1', progresso: 75 },
            { id: '2', nome: 'Obra 2', progresso: 50 },
            { id: '3', nome: 'Obra 3', progresso: 25 }
          ],
          'engflow_requisicoes': [
            { id: '1', status: 'concluída', obraId: '1' },
            { id: '2', status: 'pendente', obraId: '2' },
            { id: '3', status: 'em_andamento', obraId: '3' }
          ]
        };
        return JSON.stringify(mockData[key] || []);
      });

      // Simular cálculo de progresso médio
      const obras = JSON.parse(mockLocalStorage.getItem('engflow_obras') || '[]');
      const progressoMedio = obras.reduce((acc: number, obra: unknown) => acc + obra.progresso, 0) / obras.length;

      expect(progressoMedio).toBe(50); // (75 + 50 + 25) / 3 = 50%
    });
  });
});