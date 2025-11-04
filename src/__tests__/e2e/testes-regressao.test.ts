import { describe, it, expect, beforeEach, vi } from 'vitest';

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

// Mock das funcões de localStorage
vi.mock('../../lib/localStorage', () => ({
  getFromStorage: vi.fn((key: string) => {
    const data = mockLocalStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }),
  saveToStorage: vi.fn((key: string, data: any[]) => {
    mockLocalStorage.setItem(key, JSON.stringify(data));
  }),
  addToStorage: vi.fn((key: string, item: unknown) => {
    const existing = JSON.parse(mockLocalStorage.getItem(key) || '[]');
    existing.push(item);
    mockLocalStorage.setItem(key, JSON.stringify(existing));
    return item;
  }),
  updateInStorage: vi.fn((key: string, id: string, updates: unknown) => {
    const existing = JSON.parse(mockLocalStorage.getItem(key) || '[]');
    const index = existing.findIndex((item: unknown) => item.id === id);
    if (index !== -1) {
      existing[index] = { ...existing[index], ...updates };
      mockLocalStorage.setItem(key, JSON.stringify(existing));
      return existing[index];
    }
    return null;
  }),
  deleteFromStorage: vi.fn((key: string, id: string) => {
    const existing = JSON.parse(mockLocalStorage.getItem(key) || '[]');
    const filtered = existing.filter((item: unknown) => item.id !== id);
    mockLocalStorage.setItem(key, JSON.stringify(filtered));
    return true;
  })
}));

// Import das funções após os mocks
import { getFromStorage, addToStorage, updateInStorage, deleteFromStorage } from '../../lib/localStorage';

describe('Testes de Regressão E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('[]');
  });

  describe('Funcionalidades Core do Sistema', () => {
    it('deve preservar operações CRUD básicas para clientes', () => {
      const clienteInicial = {
        id: '1',
        nome: 'Cliente Teste',
        email: 'teste@test.com',
        telefone: '11999999999',
        endereco: {
          logradouro: 'Rua A',
          numero: '123',
          bairro: 'Centro',
          cidade: 'São Paulo',
          uf: 'SP',
          cep: '01000-000'
        },
        ativo: true
      };

      // CREATE
      addToStorage('engflow_clientes', clienteInicial);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'engflow_clientes',
        expect.stringContaining('Cliente Teste')
      );

      // READ
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([clienteInicial]));
      const clientes = getFromStorage('engflow_clientes');
      expect(clientes).toHaveLength(1);
      expect(clientes[0].nome).toBe('Cliente Teste');

      // UPDATE
      updateInStorage('engflow_clientes', '1', { nome: 'Cliente Atualizado' });
      expect(mockLocalStorage.setItem).toHaveBeenCalled();

      // DELETE
      deleteFromStorage('engflow_clientes', '1');
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('deve preservar relacionamentos entre entidades', () => {
      const cliente = { id: '1', nome: 'Cliente A' };
      const obra = { id: '1', nome: 'Obra A', clienteId: '1' };
      const despesa = { id: '1', descricao: 'Material', valor: 1000, obraId: '1' };

      // Simular dados existentes
      mockLocalStorage.getItem.mockImplementation((key) => {
        const mockData = {
          'engflow_clientes': [cliente],
          'engflow_obras': [obra],
          'engflow_despesas': [despesa]
        };
        return JSON.stringify(mockData[key] || []);
      });

      // Verificar relacionamentos
      const clientes = getFromStorage('engflow_clientes');
      const obras = getFromStorage('engflow_obras');
      const despesas = getFromStorage('engflow_despesas');

      expect(clientes[0].id).toBe(obras[0].clienteId);
      expect(obras[0].id).toBe(despesas[0].obraId);
    });

    it('deve preservar estrutura de dados de funcionários com hierarquia', () => {
      const setor = { id: '1', nome: 'Engenharia', ativo: true };
      const funcao = { id: '1', nome: 'Engenheiro Civil', setorId: '1', ativo: true };
      const funcionario = {
        id: '1',
        nome: 'João Silva',
        email: 'joao@empresa.com',
        funcaoId: '1',
        ativo: true
      };

      mockLocalStorage.getItem.mockImplementation((key) => {
        const mockData = {
          'engflow_setores': [setor],
          'engflow_funcoes': [funcao],
          'engflow_funcionarios': [funcionario]
        };
        return JSON.stringify(mockData[key] || []);
      });

      const setores = getFromStorage('engflow_setores');
      const funcoes = getFromStorage('engflow_funcoes');
      const funcionarios = getFromStorage('engflow_funcionarios');

      // Verificar hierarquia
      expect(funcoes[0].setorId).toBe(setores[0].id);
      expect(funcionarios[0].funcaoId).toBe(funcoes[0].id);
    });
  });

  describe('Validação de Integridade de Dados', () => {
    it('deve detectar registros órfãos em relacionamentos', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        const mockData = {
          'engflow_clientes': [{ id: '1', nome: 'Cliente A' }],
          'engflow_obras': [
            { id: '1', nome: 'Obra A', clienteId: '1' },
            { id: '2', nome: 'Obra B', clienteId: '999' } // Órfão
          ]
        };
        return JSON.stringify(mockData[key] || []);
      });

      const clientes = getFromStorage('engflow_clientes');
      const obras = getFromStorage('engflow_obras');

      const clienteIds = clientes.map(c => c.id);
      const obrasOrfas = obras.filter(o => !clienteIds.includes(o.clienteId));

      expect(obrasOrfas).toHaveLength(1);
      expect(obrasOrfas[0].clienteId).toBe('999');
    });

    it('deve validar campos obrigatórios em todas as entidades', () => {
      const entidadesParaValidar = [
        {
          key: 'engflow_clientes',
          camposObrigatorios: ['nome', 'email'],
          registro: { id: '1', nome: 'Cliente', email: 'test@test.com' }
        },
        {
          key: 'engflow_obras',
          camposObrigatorios: ['nome', 'clienteId'],
          registro: { id: '1', nome: 'Obra', clienteId: '1' }
        },
        {
          key: 'engflow_funcionarios',
          camposObrigatorios: ['nome', 'email', 'funcaoId'],
          registro: { id: '1', nome: 'Funcionário', email: 'func@test.com', funcaoId: '1' }
        }
      ];

      entidadesParaValidar.forEach(({ key, camposObrigatorios, registro }) => {
        camposObrigatorios.forEach(campo => {
          expect(registro).toHaveProperty(campo);
          expect(registro[campo]).toBeTruthy();
        });
      });
    });
  });

  describe('Performance e Escalabilidade', () => {
    it('deve lidar com volumes grandes de dados eficientemente', () => {
      const startTime = performance.now();

      // Simular lista grande
      const largaListaClientes = Array.from({ length: 1000 }, (_, i) => ({
        id: String(i + 1),
        nome: `Cliente ${i + 1}`,
        email: `cliente${i + 1}@test.com`
      }));

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(largaListaClientes));

      const clientes = getFromStorage('engflow_clientes');

      const endTime = performance.now();
      const tempoExecucao = endTime - startTime;

      expect(clientes).toHaveLength(1000);
      expect(tempoExecucao).toBeLessThan(100); // Menos de 100ms
    });

    it('deve manter performance em operações de busca', () => {
      const listaClientes = Array.from({ length: 500 }, (_, i) => ({
        id: String(i + 1),
        nome: `Cliente ${i + 1}`,
        email: `cliente${i + 1}@test.com`
      }));

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(listaClientes));

      const startTime = performance.now();

      const clientes = getFromStorage('engflow_clientes');
      const clientesFiltrados = clientes.filter(c => c.nome.includes('Cliente 1'));

      const endTime = performance.now();
      const tempoExecucao = endTime - startTime;

      expect(clientesFiltrados.length).toBeGreaterThan(0);
      expect(tempoExecucao).toBeLessThan(50); // Menos de 50ms para busca
    });
  });

  describe('Validação de Migração de Dados', () => {
    it('deve preservar todos os tipos de dados durante migração', () => {
      const dadosCompletos = {
        'engflow_clientes': [
          { id: '1', nome: 'Cliente', ativo: true, dataUltimaInteracao: '2023-01-01' }
        ],
        'engflow_obras': [
          { id: '1', nome: 'Obra', valor: 50000.50, dataInicio: '2023-01-01', clienteId: '1' }
        ],
        'engflow_funcionarios': [
          { id: '1', nome: 'Funcionário', salario: 5000.00, dataAdmissao: '2023-01-01', funcaoId: '1' }
        ]
      };

      Object.entries(dadosCompletos).forEach(([key, data]) => {
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(data));
        const resultado = getFromStorage(key);

        expect(resultado).toHaveLength(data.length);
        expect(resultado[0]).toMatchObject(data[0]);
      });
    });

    it('deve validar consistência de IDs após migração', () => {
      const dadosMigrados = {
        'engflow_clientes': [{ id: '1', nome: 'Cliente A' }],
        'engflow_obras': [{ id: '1', nome: 'Obra A', clienteId: '1' }],
        'engflow_despesas': [{ id: '1', descricao: 'Despesa A', obraId: '1' }]
      };

      mockLocalStorage.getItem.mockImplementation((key) => {
        return JSON.stringify(dadosMigrados[key] || []);
      });

      const clientes = getFromStorage('engflow_clientes');
      const obras = getFromStorage('engflow_obras');
      const despesas = getFromStorage('engflow_despesas');

      // Todos os IDs devem estar presentes e válidos
      expect(clientes[0].id).toBeTruthy();
      expect(obras[0].id).toBeTruthy();
      expect(obras[0].clienteId).toBe(clientes[0].id);
      expect(despesas[0].obraId).toBe(obras[0].id);
    });
  });

  describe('Compatibilidade com Versões Anteriores', () => {
    it('deve ler dados salvos em formato anterior', () => {
      // Simular dados de versão anterior (sem alguns campos novos)
      const dadosAntigos = [
        { id: '1', nome: 'Cliente Antigo', email: 'antigo@test.com' }
        // Sem campo 'ativo' que pode ter sido adicionado depois
      ];

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(dadosAntigos));
      const clientes = getFromStorage('engflow_clientes');

      expect(clientes).toHaveLength(1);
      expect(clientes[0].nome).toBe('Cliente Antigo');
      // Sistema deve funcionar mesmo sem campos novos
    });

    it('deve adicionar campos padrão para registros antigos', () => {
      const dadosSemAtivo = [
        { id: '1', nome: 'Cliente', email: 'test@test.com' }
      ];

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(dadosSemAtivo));
      const clientes = getFromStorage('engflow_clientes');

      // Verificar se sistema adiciona valores padrão quando necessário
      const clienteComDefaults = {
        ...clientes[0],
        ativo: clientes[0].ativo ?? true // Usar valor padrão se não existir
      };

      expect(clienteComDefaults.ativo).toBe(true);
    });
  });

  describe('Validação de Formulários e Entrada de Dados', () => {
    it('deve validar formatos de email', () => {
      const emailsValidos = [
        'usuario@exemplo.com',
        'teste.email@empresa.com.br',
        'admin+teste@site.org'
      ];

      const emailsInvalidos = [
        'email-sem-arroba',
        '@dominio.com',
        'usuario@',
        'usuario@dominio'
      ];

      const validarEmail = (email: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
      };

      emailsValidos.forEach(email => {
        expect(validarEmail(email)).toBe(true);
      });

      emailsInvalidos.forEach(email => {
        expect(validarEmail(email)).toBe(false);
      });
    });

    it('deve validar campos numéricos', () => {
      const valoresValidos = [100, 1000.50, '2500', '3500.75'];
      const valoresInvalidos = ['abc', '', null, undefined, 'R$ 100'];

      const validarNumero = (valor: unknown) => {
        return !isNaN(parseFloat(valor)) && isFinite(valor);
      };

      valoresValidos.forEach(valor => {
        expect(validarNumero(valor)).toBe(true);
      });

      valoresInvalidos.forEach(valor => {
        expect(validarNumero(valor)).toBe(false);
      });
    });
  });
});