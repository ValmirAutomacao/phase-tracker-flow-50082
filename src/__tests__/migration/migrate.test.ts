/**
 * Testes para Script de Migração localStorage → Supabase
 * Story: 1.11 - Migrar dados localStorage
 * Author: James (Dev Agent)
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { executeMigration } from '../../lib/migration/migrate';
import { STORAGE_KEYS } from '../../lib/localStorage';
import { supabase } from '../../lib/supabaseClient';

// Mock do localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    hasOwnProperty: (key: string) => key in store,
    get length() {
      return Object.keys(store).length;
    }
  };
})();

// Mock do supabaseClient deve vir antes dos imports
vi.mock('../../lib/supabaseClient', () => {
  const mockInsert = vi.fn(() => Promise.resolve({ data: [], error: null }));
  const mockFrom = vi.fn(() => ({
    insert: mockInsert,
    select: vi.fn(() => Promise.resolve({ data: [], error: null })),
    update: vi.fn(() => Promise.resolve({ data: [], error: null })),
    delete: vi.fn(() => Promise.resolve({ data: [], error: null }))
  }));

  return {
    supabase: {
      from: mockFrom
    }
  };
});

// Mock global objects
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Test Browser 1.0'
  }
});

// Mock URL e Blob
global.URL = {
  createObjectURL: vi.fn(() => 'mock-url'),
  revokeObjectURL: vi.fn()
} as any;

global.Blob = vi.fn() as any;

describe('Migração localStorage → Supabase', () => {

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('executeMigration', () => {

    test('deve executar migração vazia com sucesso', async () => {
      const result = await executeMigration();

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.totalRecords).toBe(0);
      expect(result.migratedRecords).toBe(0);
      expect(result.errors).toEqual([]);
      expect(result.progress).toHaveLength(8); // 8 entidades
      expect(result.backup).toBeDefined();
      expect(result.duration).toBeGreaterThan(0);
    });

    test('deve migrar dados em ordem de dependências', async () => {
      // Adicionar dados de teste
      const testData = {
        clientes: [{ id: '1', nome: 'Cliente 1' }],
        setores: [{ id: '1', nome: 'Setor 1' }],
        funcoes: [{ id: '1', nome: 'Função 1', setor_id: '1' }],
        funcionarios: [{ id: '1', nome: 'Funcionário 1', funcao_id: '1' }],
        obras: [{ id: '1', nome: 'Obra 1', cliente_id: '1' }],
        despesas: [{ id: '1', valor: 100, data_despesa: '2025-01-01', obra_id: '1' }],
        videos: [{ id: '1', nome: 'Video 1', obra_id: '1' }],
        requisicoes: [{ id: '1', titulo: 'Requisição 1', obra_id: '1' }]
      };

      // Popular localStorage
      Object.entries(testData).forEach(([key, data]) => {
        const storageKey = STORAGE_KEYS[key.toUpperCase() as keyof typeof STORAGE_KEYS];
        localStorageMock.setItem(storageKey, JSON.stringify(data));
      });

      const result = await executeMigration();

      expect(result.success).toBe(true);
      expect(result.totalRecords).toBe(8);
      expect(result.migratedRecords).toBe(8);

      // Verificar ordem de migração
      const entityOrder = result.progress.map(p => p.entity);
      expect(entityOrder).toEqual([
        'clientes',
        'setores',
        'funcoes',
        'funcionarios',
        'obras',
        'despesas',
        'videos',
        'requisicoes'
      ]);

      // Verificar que todos os inserts foram chamados
      expect(supabase.from).toHaveBeenCalledTimes(8);
    });

    test('deve lidar com erro em uma entidade', async () => {
      // Configurar erro para clientes
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Erro de teste' } })),
        select: vi.fn(() => Promise.resolve({ data: [], error: null })),
        update: vi.fn(() => Promise.resolve({ data: [], error: null })),
        delete: vi.fn(() => Promise.resolve({ data: [], error: null }))
      } as any);

      const testClientes = [{ id: '1', nome: 'Cliente 1' }];
      localStorageMock.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(testClientes));

      const result = await executeMigration();

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Erro ao inserir clientes');
    });

    test('deve criar backup antes da migração', async () => {
      const testClientes = [{ id: '1', nome: 'Cliente 1' }];
      localStorageMock.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(testClientes));

      const result = await executeMigration();

      expect(result.backup).toBeDefined();
      expect(result.backup?.metadata).toBeDefined();
      expect(result.backup?.data).toBeDefined();
      expect(result.backup?.checksums).toBeDefined();
    });

    test('deve registrar progresso detalhado por entidade', async () => {
      const testClientes = [
        { id: '1', nome: 'Cliente 1' },
        { id: '2', nome: 'Cliente 2' }
      ];
      localStorageMock.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(testClientes));

      const result = await executeMigration();

      const clientesProgress = result.progress.find(p => p.entity === 'clientes');
      expect(clientesProgress).toBeDefined();
      expect(clientesProgress?.localCount).toBe(2);
      expect(clientesProgress?.migratedCount).toBe(2);
      expect(clientesProgress?.startTime).toBeDefined();
      expect(clientesProgress?.endTime).toBeDefined();
      expect(clientesProgress?.errors).toEqual([]);
    });

    test('deve preservar relacionamentos FK', async () => {
      // Dados com relacionamentos
      const clientes = [{ id: 'c1', nome: 'Cliente 1' }];
      const obras = [{ id: 'o1', nome: 'Obra 1', cliente_id: 'c1' }];
      const despesas = [{ id: 'd1', valor: 100, data_despesa: '2025-01-01', cliente_id: 'c1', obra_id: 'o1' }];

      localStorageMock.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(clientes));
      localStorageMock.setItem(STORAGE_KEYS.OBRAS, JSON.stringify(obras));
      localStorageMock.setItem(STORAGE_KEYS.DESPESAS, JSON.stringify(despesas));

      const result = await executeMigration();

      expect(result.success).toBe(true);

      // Verificar que Supabase foi chamado na ordem correta
      const fromCalls = vi.mocked(supabase.from).mock.calls;
      expect(fromCalls[0][0]).toBe('clientes'); // Primeiro clientes
      expect(fromCalls[4][0]).toBe('obras');    // Depois obras (posição 4 = clientes, setores, funcoes, funcionarios, obras)
      expect(fromCalls[5][0]).toBe('despesas'); // Por último despesas
    });

    test('deve converter dados localStorage para formato Supabase', async () => {
      const clienteLocal = {
        id: '1',
        nome: 'Cliente Teste',
        email: 'teste@exemplo.com',
        telefone: '11999999999',
        documento: '12345678901',
        tipo: 'pessoa_fisica',
        endereco: { rua: 'Rua Teste', numero: '123' },
        contato: { observacoes: 'Teste' }
      };

      localStorageMock.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify([clienteLocal]));

      await executeMigration();

      // Verificar se insert foi chamado com dados convertidos
      const fromMock = vi.mocked(supabase.from);
      const insertMock = fromMock.mock.results[0].value.insert;
      const insertCall = insertMock.mock.calls[0][0][0];
      expect(insertCall).toEqual({
        id: '1',
        nome: 'Cliente Teste',
        documento: '12345678901',
        tipo: 'pessoa_fisica',
        endereco: { rua: 'Rua Teste', numero: '123' },
        contato: {
          email: 'teste@exemplo.com',
          telefone: '11999999999',
          observacoes: 'Teste'
        }
      });
    });

    test('deve calcular duração da migração', async () => {
      const result = await executeMigration();

      expect(result.duration).toBeGreaterThan(0);
      expect(typeof result.duration).toBe('number');
    });

  });

  describe('Cenários de Erro', () => {

    test('deve interromper migração em caso de falha crítica', async () => {
      // Simular falha crítica que impede migração
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Connection error' } })),
        select: vi.fn(() => Promise.resolve({ data: [], error: null })),
        update: vi.fn(() => Promise.resolve({ data: [], error: null })),
        delete: vi.fn(() => Promise.resolve({ data: [], error: null }))
      } as any);

      const testClientes = [{ id: '1', nome: 'Cliente 1' }];
      localStorageMock.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(testClientes));

      const result = await executeMigration();

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('deve continuar migração se entidade estiver vazia', async () => {
      // Apenas clientes com dados, outras entidades vazias
      const testClientes = [{ id: '1', nome: 'Cliente 1' }];
      localStorageMock.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(testClientes));

      const result = await executeMigration();

      expect(result.success).toBe(true);
      expect(result.totalRecords).toBe(1);
      expect(result.migratedRecords).toBe(1);

      // Deve ter processado todas as 8 entidades mesmo com algumas vazias
      expect(result.progress).toHaveLength(8);
    });

  });

});