import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CarrinhoItens, ItemCarrinho } from '@/components/forms/CarrinhoItens';

// Mock do hook de toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('CarrinhoItens', () => {
  const mockItens: ItemCarrinho[] = [
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
      status: 'comprado'
    }
  ];

  const mockOnItensChange = vi.fn();

  beforeEach(() => {
    mockOnItensChange.mockClear();
  });

  test('deve renderizar lista de itens vazia corretamente', () => {
    render(
      <CarrinhoItens
        itens={[]}
        onItensChange={mockOnItensChange}
      />
    );

    expect(screen.getByText('Carrinho de Itens')).toBeInTheDocument();
    expect(screen.getByText('Nenhum item adicionado ainda')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Adicionar Item' })).toBeInTheDocument();
  });

  test('deve renderizar lista de itens com dados corretamente', () => {
    render(
      <CarrinhoItens
        itens={mockItens}
        onItensChange={mockOnItensChange}
      />
    );

    expect(screen.getByText('Cimento')).toBeInTheDocument();
    expect(screen.getByText('Qtd: 10')).toBeInTheDocument();
    expect(screen.getByText('Cimento Portland')).toBeInTheDocument();
    expect(screen.getByText('Pendente')).toBeInTheDocument();

    expect(screen.getByText('Tijolos')).toBeInTheDocument();
    expect(screen.getByText('Qtd: 500')).toBeInTheDocument();
    expect(screen.getByText('Comprado')).toBeInTheDocument();

    expect(screen.getByText('2 itens')).toBeInTheDocument();
  });

  test('deve abrir dialog ao clicar em Adicionar Item', async () => {
    const user = userEvent.setup();

    render(
      <CarrinhoItens
        itens={[]}
        onItensChange={mockOnItensChange}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Adicionar Item' }));

    expect(screen.getByText('Adicione um novo item ao carrinho')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome do Item')).toBeInTheDocument();
    expect(screen.getByLabelText('Quantidade')).toBeInTheDocument();
  });

  test('deve adicionar novo item com sucesso', async () => {
    const user = userEvent.setup();

    render(
      <CarrinhoItens
        itens={[]}
        onItensChange={mockOnItensChange}
      />
    );

    // Abrir dialog
    await user.click(screen.getByRole('button', { name: 'Adicionar Item' }));

    // Preencher formulário
    await user.type(screen.getByLabelText('Nome do Item'), 'Areia');
    await user.clear(screen.getByLabelText('Quantidade'));
    await user.type(screen.getByLabelText('Quantidade'), '5');
    await user.type(screen.getByLabelText('Descrição (Opcional)'), 'Areia fina');

    // Submeter
    await user.click(screen.getByRole('button', { name: 'Adicionar' }));

    await waitFor(() => {
      expect(mockOnItensChange).toHaveBeenCalledWith([
        expect.objectContaining({
          nome: 'Areia',
          quantidade: 5,
          descricao: 'Areia fina',
          status: 'pendente'
        })
      ]);
    });
  });

  test('deve validar campos obrigatórios', async () => {
    const user = userEvent.setup();

    render(
      <CarrinhoItens
        itens={[]}
        onItensChange={mockOnItensChange}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Adicionar Item' }));
    await user.click(screen.getByRole('button', { name: 'Adicionar' }));

    await waitFor(() => {
      expect(screen.getByText('Nome do item é obrigatório')).toBeInTheDocument();
    });
  });

  test('deve remover item quando clicar no botão de excluir', async () => {
    const user = userEvent.setup();

    render(
      <CarrinhoItens
        itens={mockItens}
        onItensChange={mockOnItensChange}
      />
    );

    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(btn =>
      btn.querySelector('svg')?.classList.contains('lucide-trash-2')
    );

    if (deleteButton) {
      await user.click(deleteButton);

      expect(mockOnItensChange).toHaveBeenCalledWith([mockItens[1]]);
    }
  });

  test('deve abrir edição ao clicar no botão de editar', async () => {
    const user = userEvent.setup();

    render(
      <CarrinhoItens
        itens={mockItens}
        onItensChange={mockOnItensChange}
      />
    );

    const editButtons = screen.getAllByRole('button');
    const editButton = editButtons.find(btn =>
      btn.querySelector('svg')?.classList.contains('lucide-edit')
    );

    if (editButton) {
      await user.click(editButton);

      expect(screen.getByText('Editar Item')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Cimento')).toBeInTheDocument();
      expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    }
  });

  test('deve funcionar em modo readonly', () => {
    render(
      <CarrinhoItens
        itens={mockItens}
        onItensChange={mockOnItensChange}
        readonly={true}
      />
    );

    expect(screen.queryByRole('button', { name: 'Adicionar Item' })).not.toBeInTheDocument();

    const editButtons = screen.queryAllByRole('button').filter(btn =>
      btn.querySelector('svg')?.classList.contains('lucide-edit')
    );
    const deleteButtons = screen.queryAllByRole('button').filter(btn =>
      btn.querySelector('svg')?.classList.contains('lucide-trash-2')
    );

    expect(editButtons).toHaveLength(0);
    expect(deleteButtons).toHaveLength(0);
  });

  test('deve exibir badge correto para quantidade de itens', () => {
    // Teste com 1 item
    const { rerender } = render(
      <CarrinhoItens
        itens={[mockItens[0]]}
        onItensChange={mockOnItensChange}
      />
    );

    expect(screen.getByText('1 item')).toBeInTheDocument();

    // Teste com múltiplos itens
    rerender(
      <CarrinhoItens
        itens={mockItens}
        onItensChange={mockOnItensChange}
      />
    );

    expect(screen.getByText('2 itens')).toBeInTheDocument();
  });
});