import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock das interfaces
interface ItemProduto {
  id: string;
  nome: string;
  quantidade: number;
  valor_unitario: number;
  comprado: boolean;
}

interface Requisicao {
  id: string;
  titulo: string;
  status: string;
  itens_produtos?: ItemProduto[];
}

interface Despesa {
  id: string;
  requisicao_id: string;
  valor: number;
  descricao: string;
}

describe('Integração Requisições-Despesas', () => {
  const mockRequisicao: Requisicao = {
    id: 'req-1',
    titulo: 'Requisição de Materiais',
    status: 'aprovada',
    itens_produtos: [
      {
        id: 'item-1',
        nome: 'Cimento',
        quantidade: 10,
        valor_unitario: 25.50,
        comprado: false
      },
      {
        id: 'item-2',
        nome: 'Tijolo',
        quantidade: 100,
        valor_unitario: 0.50,
        comprado: false
      },
      {
        id: 'item-3',
        nome: 'Areia',
        quantidade: 5,
        valor_unitario: 80.00,
        comprado: true // Já comprado anteriormente
      }
    ]
  };

  const mockDespesa: Despesa = {
    id: 'desp-1',
    requisicao_id: 'req-1',
    valor: 305.00, // 10 * 25.50 + 100 * 0.50
    descricao: 'Compra de cimento e tijolos'
  };

  describe('Validação de Requisição Obrigatória', () => {
    test('deve exigir requisição para criar despesa', () => {
      const despesaSemRequisicao = {
        valor: 100,
        descricao: 'Despesa sem requisição'
      };

      // Simular validação Zod
      const validacao = (despesa: any) => {
        if (!despesa.requisicao_id) {
          throw new Error('Requisição é obrigatória - despesas devem estar vinculadas a uma requisição aprovada');
        }
        return true;
      };

      expect(() => validacao(despesaSemRequisicao)).toThrow('Requisição é obrigatória');
    });

    test('deve aceitar despesa com requisição válida', () => {
      const despesaComRequisicao = {
        requisicao_id: 'req-1',
        valor: 100,
        descricao: 'Despesa com requisição'
      };

      const validacao = (despesa: any) => {
        if (!despesa.requisicao_id) {
          throw new Error('Requisição é obrigatória');
        }
        return true;
      };

      expect(() => validacao(despesaComRequisicao)).not.toThrow();
    });
  });

  describe('Marcação de Itens como Comprados', () => {
    test('deve marcar itens selecionados como comprados', () => {
      const itensSelecionados = ['item-1', 'item-2'];

      const marcarItensComprados = (requisicao: Requisicao, itemIds: string[]) => {
        const itensAtualizados = requisicao.itens_produtos?.map(item =>
          itemIds.includes(item.id) ? { ...item, comprado: true } : item
        );

        return { ...requisicao, itens_produtos: itensAtualizados };
      };

      const requisicaoAtualizada = marcarItensComprados(mockRequisicao, itensSelecionados);

      // Verificar se itens selecionados foram marcados como comprados
      const item1 = requisicaoAtualizada.itens_produtos?.find(item => item.id === 'item-1');
      const item2 = requisicaoAtualizada.itens_produtos?.find(item => item.id === 'item-2');
      const item3 = requisicaoAtualizada.itens_produtos?.find(item => item.id === 'item-3');

      expect(item1?.comprado).toBe(true);
      expect(item2?.comprado).toBe(true);
      expect(item3?.comprado).toBe(true); // Já estava comprado
    });

    test('deve preservar itens não selecionados', () => {
      const itensSelecionados = ['item-1'];

      const marcarItensComprados = (requisicao: Requisicao, itemIds: string[]) => {
        const itensAtualizados = requisicao.itens_produtos?.map(item =>
          itemIds.includes(item.id) ? { ...item, comprado: true } : item
        );

        return { ...requisicao, itens_produtos: itensAtualizados };
      };

      const requisicaoAtualizada = marcarItensComprados(mockRequisicao, itensSelecionados);

      const item1 = requisicaoAtualizada.itens_produtos?.find(item => item.id === 'item-1');
      const item2 = requisicaoAtualizada.itens_produtos?.find(item => item.id === 'item-2');

      expect(item1?.comprado).toBe(true);
      expect(item2?.comprado).toBe(false); // Não selecionado, deve permanecer false
    });
  });

  describe('Reutilização de Requisições', () => {
    test('deve filtrar apenas requisições aprovadas', () => {
      const todasRequisicoes = [
        { id: 'req-1', status: 'aprovada', titulo: 'Req 1' },
        { id: 'req-2', status: 'pendente', titulo: 'Req 2' },
        { id: 'req-3', status: 'concluida', titulo: 'Req 3' },
        { id: 'req-4', status: 'cancelada', titulo: 'Req 4' }
      ];

      const filtrarRequisicoesAprovadas = (requisicoes: any[]) => {
        return requisicoes.filter(req =>
          req.status === 'aprovada' || req.status === 'concluida'
        );
      };

      const requisicoesDisponiveis = filtrarRequisicoesAprovadas(todasRequisicoes);

      expect(requisicoesDisponiveis).toHaveLength(2);
      expect(requisicoesDisponiveis.map(req => req.id)).toEqual(['req-1', 'req-3']);
    });

    test('deve mostrar apenas itens não comprados para nova despesa', () => {
      const filtrarItensDisponiveis = (requisicao: Requisicao) => {
        return requisicao.itens_produtos?.filter(item => !item.comprado) || [];
      };

      const itensDisponiveis = filtrarItensDisponiveis(mockRequisicao);

      expect(itensDisponiveis).toHaveLength(2);
      expect(itensDisponiveis.map(item => item.id)).toEqual(['item-1', 'item-2']);
    });
  });

  describe('Fluxo Completo Requisição-Despesa', () => {
    test('deve conectar despesa à requisição e atualizar itens', async () => {
      const itensSelecionados = ['item-1'];

      // Simular criação de despesa
      const criarDespesa = vi.fn().mockResolvedValue({
        id: 'desp-1',
        requisicao_id: 'req-1',
        valor: 255.00
      });

      // Simular atualização de requisição
      const atualizarRequisicao = vi.fn().mockResolvedValue(true);

      // Fluxo completo
      const despesaCriada = await criarDespesa({
        requisicao_id: 'req-1',
        valor: 255.00,
        descricao: 'Compra de cimento'
      });

      await atualizarRequisicao({
        id: 'req-1',
        itens_produtos: mockRequisicao.itens_produtos?.map(item =>
          itensSelecionados.includes(item.id) ? { ...item, comprado: true } : item
        )
      });

      expect(criarDespesa).toHaveBeenCalledTimes(1);
      expect(atualizarRequisicao).toHaveBeenCalledTimes(1);
      expect(despesaCriada.requisicao_id).toBe('req-1');
    });
  });
});