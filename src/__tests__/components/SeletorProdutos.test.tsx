import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SeletorProdutos } from '@/components/forms/SeletorProdutos';
import { ItemCarrinho } from '@/components/forms/CarrinhoItens';

describe('SeletorProdutos', () => {
  const mockItensRequisicao: ItemCarrinho[] = [
    {
      id: '1',
      nome: 'Cimento',
      quantidade: 10,
      descricao: 'Cimento Portland',
      status: 'pendente'
    },
    {
      id: '2',
      nome: 'Tijolos',
      quantidade: 500,
      status: 'pendente'
    },
    {
      id: '3',
      nome: 'Tinta',
      quantidade: 5,
      descricao: 'Tinta branca',
      status: 'comprado'
    }
  ];

  const mockOnSelecaoChange = vi.fn();

  beforeEach(() => {
    cleanup();
    mockOnSelecaoChange.mockClear();
  });

  test('deve renderizar lista vazia quando não há itens', () => {
    render(
      <SeletorProdutos
        itensRequisicao={[]}
        itensSelecionados={[]}
        onSelecaoChange={mockOnSelecaoChange}
      />
    );

    expect(screen.getByText('Itens da Requisição')).toBeInTheDocument();
    expect(screen.getByText('Nenhum item encontrado na requisição')).toBeInTheDocument();
    expect(screen.getByText('Selecione uma requisição que contenha itens')).toBeInTheDocument();
  });

  test('deve renderizar itens pendentes e comprados separadamente', () => {
    render(
      <SeletorProdutos
        itensRequisicao={mockItensRequisicao}
        itensSelecionados={[]}
        onSelecaoChange={mockOnSelecaoChange}
      />
    );

    // Seção de itens pendentes
    expect(screen.getByText('Itens Pendentes (2)')).toBeInTheDocument();
    expect(screen.getByText('Cimento')).toBeInTheDocument();
    expect(screen.getByText('Tijolos')).toBeInTheDocument();

    // Seção de itens comprados
    expect(screen.getByText('Itens já Comprados (1)')).toBeInTheDocument();
    expect(screen.getByText('Tinta')).toBeInTheDocument();
  });

  test('deve permitir selecionar item individual', async () => {
    const user = userEvent.setup();

    render(
      <SeletorProdutos
        itensRequisicao={mockItensRequisicao}
        itensSelecionados={[]}
        onSelecaoChange={mockOnSelecaoChange}
      />
    );

    // Clicar no primeiro item (Cimento)
    const checkboxes = screen.getAllByRole('checkbox');
    const cimentoCheckbox = checkboxes[0];
    await user.click(cimentoCheckbox);

    expect(mockOnSelecaoChange).toHaveBeenCalledWith(['1']);
  });

  test('deve permitir selecionar todos os itens', async () => {
    const user = userEvent.setup();

    render(
      <SeletorProdutos
        itensRequisicao={mockItensRequisicao}
        itensSelecionados={[]}
        onSelecaoChange={mockOnSelecaoChange}
      />
    );

    await user.click(screen.getByText('Selecionar Todos'));

    expect(mockOnSelecaoChange).toHaveBeenCalledWith(['1', '2']);
  });

  test('deve permitir limpar seleção', async () => {
    const user = userEvent.setup();

    render(
      <SeletorProdutos
        itensRequisicao={mockItensRequisicao}
        itensSelecionados={['1', '2']}
        onSelecaoChange={mockOnSelecaoChange}
      />
    );

    await user.click(screen.getByText('Limpar Seleção'));

    expect(mockOnSelecaoChange).toHaveBeenCalledWith([]);
  });

  test('deve exibir badge com quantidade selecionada', () => {
    const { rerender } = render(
      <SeletorProdutos
        itensRequisicao={mockItensRequisicao}
        itensSelecionados={['1']}
        onSelecaoChange={mockOnSelecaoChange}
      />
    );

    expect(screen.getByText('1 selecionado')).toBeInTheDocument();

    // Re-render com múltiplos selecionados
    rerender(
      <SeletorProdutos
        itensRequisicao={mockItensRequisicao}
        itensSelecionados={['1', '2']}
        onSelecaoChange={mockOnSelecaoChange}
      />
    );

    expect(screen.getByText('2 selecionados')).toBeInTheDocument();
  });

  test('deve exibir mensagem de validação quando nenhum item selecionado', () => {
    render(
      <SeletorProdutos
        itensRequisicao={mockItensRequisicao}
        itensSelecionados={[]}
        onSelecaoChange={mockOnSelecaoChange}
      />
    );

    expect(screen.getByText(/⚠️ Selecione pelo menos um item/)).toBeInTheDocument();
  });

  test('deve exibir resumo da seleção quando itens selecionados', () => {
    render(
      <SeletorProdutos
        itensRequisicao={mockItensRequisicao}
        itensSelecionados={['1']}
        onSelecaoChange={mockOnSelecaoChange}
      />
    );

    expect(screen.getByText(/📋 1 item selecionado para esta despesa/)).toBeInTheDocument();
  });

  test('deve exibir resumo da seleção com múltiplos itens', () => {
    render(
      <SeletorProdutos
        itensRequisicao={mockItensRequisicao}
        itensSelecionados={['1', '2']}
        onSelecaoChange={mockOnSelecaoChange}
      />
    );

    // Verificar que existe uma div com bg-blue-50 (resumo da seleção)
    const resumoDiv = document.querySelector('.bg-blue-50');
    expect(resumoDiv).toBeInTheDocument();
  });

  test('deve desmarcar item ao clicar novamente', async () => {
    const user = userEvent.setup();

    render(
      <SeletorProdutos
        itensRequisicao={mockItensRequisicao}
        itensSelecionados={['1']}
        onSelecaoChange={mockOnSelecaoChange}
      />
    );

    // Item já está selecionado, clicar novamente deve desmarcar
    const checkboxes = screen.getAllByRole('checkbox');
    const cimentoCheckbox = checkboxes[0]; // Primeiro checkbox (Cimento)

    await user.click(cimentoCheckbox);

    expect(mockOnSelecaoChange).toHaveBeenCalledWith([]);
  });

  test('deve funcionar em modo readonly', () => {
    render(
      <SeletorProdutos
        itensRequisicao={mockItensRequisicao}
        itensSelecionados={['1']}
        onSelecaoChange={mockOnSelecaoChange}
        readonly={true}
      />
    );

    // Não deve ter checkboxes no modo readonly
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);

    // Não deve ter botões de controle
    expect(screen.queryByText('Selecionar Todos')).not.toBeInTheDocument();
    expect(screen.queryByText('Limpar Seleção')).not.toBeInTheDocument();

    // Não deve ter mensagem de validação
    expect(screen.queryByText(/⚠️ Selecione pelo menos um item/)).not.toBeInTheDocument();
  });

  test('deve exibir informações corretas dos itens', () => {
    render(
      <SeletorProdutos
        itensRequisicao={mockItensRequisicao}
        itensSelecionados={[]}
        onSelecaoChange={mockOnSelecaoChange}
      />
    );

    // Verificar informações do Cimento
    expect(screen.getByText('Cimento')).toBeInTheDocument();
    expect(screen.getByText('Qtd: 10')).toBeInTheDocument();
    expect(screen.getByText('Cimento Portland')).toBeInTheDocument();

    // Verificar informações dos Tijolos
    expect(screen.getByText('Tijolos')).toBeInTheDocument();
    expect(screen.getByText('Qtd: 500')).toBeInTheDocument();

    // Verificar item comprado
    expect(screen.getByText('Tinta')).toBeInTheDocument();
    expect(screen.getByText('Qtd: 5')).toBeInTheDocument();
    expect(screen.getByText('Tinta branca')).toBeInTheDocument();
  });

  test('deve desabilitar botão "Selecionar Todos" quando todos já selecionados', () => {
    render(
      <SeletorProdutos
        itensRequisicao={mockItensRequisicao}
        itensSelecionados={['1', '2']} // Todos os pendentes selecionados
        onSelecaoChange={mockOnSelecaoChange}
      />
    );

    const selecionarTodosBtn = screen.getByText('Selecionar Todos');
    expect(selecionarTodosBtn).toBeDisabled();
  });

  test('deve desabilitar botão "Limpar Seleção" quando nenhum selecionado', () => {
    render(
      <SeletorProdutos
        itensRequisicao={mockItensRequisicao}
        itensSelecionados={[]}
        onSelecaoChange={mockOnSelecaoChange}
      />
    );

    const limparSelecaoBtn = screen.getByText('Limpar Seleção');
    expect(limparSelecaoBtn).toBeDisabled();
  });
});