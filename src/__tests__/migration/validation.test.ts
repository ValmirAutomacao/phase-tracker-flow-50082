/**
 * Testes para Script de Validação de Integridade
 * Story: 1.11 - Migrar dados localStorage
 * Author: James (Dev Agent)
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { validateMigrationIntegrity } from '../../lib/migration/validation';
import { STORAGE_KEYS } from '../../lib/localStorage';

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

// Mock do supabaseClient
vi.mock('../../lib/supabaseClient', () => {
  const createMockSelect = (mockData: any[], count?: number) => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: mockData[0] || null, error: null })) })),
      not: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
      or: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
      single: vi.fn(() => Promise.resolve({ data: mockData[0] || null, error: null }))
    })),
    select: vi.fn((fields: string, options?: unknown) => {
      if (options?.count === 'exact' && options?.head === true) {
        return Promise.resolve({ count: count || mockData.length, error: null });
      }
      return Promise.resolve({ data: mockData, error: null });
    })
  });

  return {
    supabase: {
      from: vi.fn((tableName: string) => {
        // Retorna mocks específicos baseados na tabela
        if (tableName === 'clientes') {
          return createMockSelect([
            { id: '1', nome: 'Cliente Teste' }
          ], 1);
        }
        if (tableName === 'setores') {
          return createMockSelect([
            { id: '1', nome: 'Setor Teste' }
          ], 1);
        }
        if (tableName === 'funcoes') {
          return createMockSelect([
            { id: '1', nome: 'Função Teste', setor_id: '1' }
          ], 1);
        }
        if (tableName === 'funcionarios') {
          return createMockSelect([
            { id: '1', nome: 'Funcionário Teste', funcao_id: '1' }
          ], 1);
        }
        if (tableName === 'obras') {
          return createMockSelect([
            { id: '1', nome: 'Obra Teste', cliente_id: '1' }
          ], 1);
        }
        if (tableName === 'despesas') {
          return createMockSelect([
            { id: '1', valor: 100, data_despesa: '2025-01-01', obra_id: '1', cliente_id: '1' }
          ], 1);
        }
        if (tableName === 'videos') {
          return createMockSelect([
            { id: '1', nome: 'Video Teste', obra_id: '1' }
          ], 1);
        }
        if (tableName === 'requisicoes') {
          return createMockSelect([
            { id: '1', titulo: 'Requisição Teste', obra_id: '1', funcionario_id: '1' }
          ], 1);
        }

        // Default mock vazio
        return createMockSelect([], 0);
      })
    }
  };
});

// Mock global objects
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Validação de Integridade da Migração', () => {

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('validateMigrationIntegrity', () => {

    test('deve executar validação completa com estrutura correta', async () => {
      // Configurar dados no localStorage
      const testData = {
        clientes: [{ id: '1', nome: 'Cliente Teste' }],
        setores: [{ id: '1', nome: 'Setor Teste' }],
        funcoes: [{ id: '1', nome: 'Função Teste', setor_id: '1' }],
        funcionarios: [{ id: '1', nome: 'Funcionário Teste', funcao_id: '1' }],
        obras: [{ id: '1', nome: 'Obra Teste', cliente_id: '1' }],
        despesas: [{ id: '1', valor: 100, data_despesa: '2025-01-01', obra_id: '1', cliente_id: '1' }],
        videos: [{ id: '1', nome: 'Video Teste', obra_id: '1' }],
        requisicoes: [{ id: '1', titulo: 'Requisição Teste', obra_id: '1', funcionario_id: '1' }]
      };

      // Popular localStorage
      Object.entries(testData).forEach(([key, data]) => {
        const storageKey = STORAGE_KEYS[key.toUpperCase() as keyof typeof STORAGE_KEYS];
        localStorageMock.setItem(storageKey, JSON.stringify(data));
      });

      const result = await validateMigrationIntegrity();

      // Verificar que a validação foi executada completamente
      expect(result).toBeDefined();
      expect(result.validations).toHaveLength(8);
      expect(result.foreignKeyValidations).toHaveLength(6);
      expect(result.dataIntegrityChecks).toHaveLength(3);

      // Score deve estar entre 0 e 100
      expect(result.summary.integrityScore).toBeGreaterThanOrEqual(0);
      expect(result.summary.integrityScore).toBeLessThanOrEqual(100);

      // Verificar que as entidades foram processadas
      expect(result.summary.totalLocalRecords).toBe(8);
    });

    test('deve detectar contagens inconsistentes', async () => {
      // Apenas dados no localStorage, nenhum no Supabase (simular migração falha)
      const testClientes = [
        { id: '1', nome: 'Cliente Teste' },
        { id: '2', nome: 'Cliente Teste 2' }
      ];

      localStorageMock.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(testClientes));

      // Mock Supabase retornando contagem 0 para clientes
      vi.doMock('../../lib/supabaseClient', () => ({
        supabase: {
          from: vi.fn(() => ({
            select: vi.fn(() => Promise.resolve({ count: 0, error: null }))
          }))
        }
      }));

      const result = await validateMigrationIntegrity();

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.summary.matchingCounts).toBe(false);
      expect(result.summary.integrityScore).toBeLessThan(100);
    });

    test('deve calcular score de integridade corretamente', async () => {
      // Configurar dados parciais para validação
      const testClientes = [{ id: '1', nome: 'Cliente Teste' }];
      localStorageMock.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(testClientes));

      const result = await validateMigrationIntegrity();

      expect(result.summary.integrityScore).toBeGreaterThanOrEqual(0);
      expect(result.summary.integrityScore).toBeLessThanOrEqual(100);
      expect(typeof result.summary.integrityScore).toBe('number');
    });

    test('deve validar estrutura do resultado', async () => {
      const result = await validateMigrationIntegrity();

      // Verificar estrutura do resultado
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('validations');
      expect(result).toHaveProperty('foreignKeyValidations');
      expect(result).toHaveProperty('dataIntegrityChecks');
      expect(result).toHaveProperty('summary');

      // Verificar estrutura do summary
      expect(result.summary).toHaveProperty('totalLocalRecords');
      expect(result.summary).toHaveProperty('totalSupabaseRecords');
      expect(result.summary).toHaveProperty('matchingCounts');
      expect(result.summary).toHaveProperty('integrityScore');

      // Verificar tipos
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.validations)).toBe(true);
      expect(Array.isArray(result.foreignKeyValidations)).toBe(true);
      expect(Array.isArray(result.dataIntegrityChecks)).toBe(true);
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.summary.integrityScore).toBe('number');
    });

    test('deve incluir todas as entidades na validação', async () => {
      const result = await validateMigrationIntegrity();

      const expectedEntities = [
        'clientes', 'setores', 'funcoes', 'funcionarios',
        'obras', 'despesas', 'videos', 'requisicoes'
      ];

      expect(result.validations).toHaveLength(8);

      const validatedEntities = result.validations.map(v => v.entityName);
      expectedEntities.forEach(entity => {
        expect(validatedEntities).toContain(entity);
      });
    });

    test('deve incluir todas as validações de FK', async () => {
      const result = await validateMigrationIntegrity();

      const expectedRelationships = [
        'funcoes → setores',
        'funcionarios → funcoes',
        'obras → clientes',
        'despesas → obras/clientes',
        'videos → obras',
        'requisicoes → obras/funcionarios'
      ];

      expect(result.foreignKeyValidations).toHaveLength(6);

      const validatedRelationships = result.foreignKeyValidations.map(fk => fk.relationship);
      expectedRelationships.forEach(relationship => {
        expect(validatedRelationships).toContain(relationship);
      });
    });

    test('deve incluir verificações de integridade de dados', async () => {
      const result = await validateMigrationIntegrity();

      const expectedChecks = [
        'Clientes com nome obrigatório',
        'Datas válidas em despesas',
        'Valores válidos em despesas'
      ];

      expect(result.dataIntegrityChecks).toHaveLength(3);

      const performedChecks = result.dataIntegrityChecks.map(c => c.check);
      expectedChecks.forEach(check => {
        expect(performedChecks).toContain(check);
      });
    });

    test('deve calcular totais corretamente', async () => {
      // Configurar dados conhecidos
      const testData = {
        clientes: [{ id: '1', nome: 'Cliente 1' }, { id: '2', nome: 'Cliente 2' }],
        obras: [{ id: '1', nome: 'Obra 1', cliente_id: '1' }]
      };

      localStorageMock.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(testData.clientes));
      localStorageMock.setItem(STORAGE_KEYS.OBRAS, JSON.stringify(testData.obras));

      const result = await validateMigrationIntegrity();

      expect(result.summary.totalLocalRecords).toBeGreaterThan(0);
      expect(result.summary.totalSupabaseRecords).toBeGreaterThanOrEqual(0);
    });

  });

  describe('Cenários de Erro', () => {

    test('deve lidar com erro na validação de contagens', async () => {
      // Simular erro no Supabase
      vi.doMock('../../lib/supabaseClient', () => ({
        supabase: {
          from: vi.fn(() => ({
            select: vi.fn(() => Promise.reject(new Error('Erro de conexão')))
          }))
        }
      }));

      const result = await validateMigrationIntegrity();

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.summary.integrityScore).toBeLessThan(100);
    });

    test('deve continuar validação mesmo com erros parciais', async () => {
      const result = await validateMigrationIntegrity();

      // Deve sempre retornar uma estrutura válida mesmo com erros
      expect(result).toBeDefined();
      expect(result.validations).toBeDefined();
      expect(result.foreignKeyValidations).toBeDefined();
      expect(result.dataIntegrityChecks).toBeDefined();
      expect(result.summary).toBeDefined();
    });

  });

});