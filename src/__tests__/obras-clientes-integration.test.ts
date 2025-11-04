import { describe, test, expect } from 'vitest';

describe('Integração Obras-Clientes', () => {
  interface Cliente {
    id: string;
    nome: string;
  }

  const mockClientes: Cliente[] = [
    { id: 'cliente-1', nome: 'João Silva' },
    { id: 'cliente-2', nome: 'Construtora ABC Ltda' },
    { id: 'cliente-3', nome: 'Maria Santos' },
    { id: 'cliente-novo', nome: 'Cliente Recém Cadastrado' }
  ];

  describe('Dropdown de Clientes', () => {
    test('deve incluir todos os clientes disponíveis', () => {
      const clientesParaDropdown = mockClientes.map(cliente => ({
        value: cliente.id,
        label: cliente.nome
      }));

      expect(clientesParaDropdown).toHaveLength(4);
      expect(clientesParaDropdown[0]).toEqual({
        value: 'cliente-1',
        label: 'João Silva'
      });
    });

    test('deve incluir cliente recém cadastrado', () => {
      const clienteNovo = mockClientes.find(cliente =>
        cliente.nome === 'Cliente Recém Cadastrado'
      );

      expect(clienteNovo).toBeDefined();
      expect(clienteNovo?.id).toBe('cliente-novo');
      expect(clienteNovo?.nome).toBe('Cliente Recém Cadastrado');
    });

    test('deve mapear corretamente ID para valor do dropdown', () => {
      const clienteSelecionado = 'cliente-novo';
      const cliente = mockClientes.find(c => c.id === clienteSelecionado);

      expect(cliente).toBeDefined();
      expect(cliente?.nome).toBe('Cliente Recém Cadastrado');
    });

    test('deve validar seleção obrigatória de cliente', () => {
      const validarFormulario = (clienteId: string) => {
        if (!clienteId || clienteId.trim() === '') {
          throw new Error('Selecione um cliente');
        }
        return true;
      };

      // Teste com valor válido
      expect(() => validarFormulario('cliente-1')).not.toThrow();

      // Teste com valor inválido
      expect(() => validarFormulario('')).toThrow('Selecione um cliente');
      expect(() => validarFormulario('   ')).toThrow('Selecione um cliente');
    });

    test('deve lidar com lista vazia de clientes', () => {
      const clientesVazios: Cliente[] = [];

      const gerarOpcoesDropdown = (clientes: Cliente[]) => {
        return clientes.map(cliente => ({
          value: cliente.id,
          label: cliente.nome
        }));
      };

      const opcoes = gerarOpcoesDropdown(clientesVazios);
      expect(opcoes).toEqual([]);
      expect(opcoes).toHaveLength(0);
    });
  });

  describe('Transformação de Dados para Obra', () => {
    test('deve usar ID do cliente ao criar obra', () => {
      const formData = {
        nome: 'Obra Teste',
        cliente: 'cliente-novo', // ID do cliente selecionado
        endereco: 'Rua Teste, 123'
      };

      const obraData = {
        nome: formData.nome,
        cliente_id: formData.cliente, // Mapear para cliente_id
        endereco: formData.endereco
      };

      expect(obraData.cliente_id).toBe('cliente-novo');
      expect(obraData.nome).toBe('Obra Teste');
    });

    test('deve mapear nome do cliente para exibição', () => {
      const obraExistente = {
        id: 'obra-1',
        nome: 'Obra Existente',
        cliente_id: 'cliente-2'
      };

      const cliente = mockClientes.find(c => c.id === obraExistente.cliente_id);
      const nomeCliente = cliente?.nome || 'Cliente não encontrado';

      expect(nomeCliente).toBe('Construtora ABC Ltda');
    });
  });

  describe('Casos Extremos', () => {
    test('deve lidar com cliente não encontrado', () => {
      const clienteInexistente = mockClientes.find(c => c.id === 'cliente-inexistente');

      expect(clienteInexistente).toBeUndefined();
    });

    test('deve validar estrutura dos dados do cliente', () => {
      const clienteValido = mockClientes[0];

      expect(clienteValido).toHaveProperty('id');
      expect(clienteValido).toHaveProperty('nome');
      expect(typeof clienteValido.id).toBe('string');
      expect(typeof clienteValido.nome).toBe('string');
      expect(clienteValido.id.length).toBeGreaterThan(0);
      expect(clienteValido.nome.length).toBeGreaterThan(0);
    });
  });
});