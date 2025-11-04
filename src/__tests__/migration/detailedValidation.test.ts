/**
 * Testes para Script de Validação Detalhada
 * Story: 1.11 - Migrar dados localStorage
 * Author: James (Dev Agent)
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { performDetailedValidation, generateDifferencesReport } from '../../lib/migration/detailedValidation';
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
  return {
    supabase: {
      from: vi.fn((tableName: string) => ({
        select: vi.fn(() => ({
          order: vi.fn(() => {
            // Retorna dados específicos por tabela para testes
            if (tableName === 'clientes') {
              return Promise.resolve({
                data: [
                  { id: '1', nome: 'Cliente Teste', documento: '12345678901' }
                ],
                error: null
              });
            }
            if (tableName === 'obras') {
              return Promise.resolve({
                data: [
                  { id: '1', nome: 'Obra Teste', cliente_id: '1' },
                  { id: '2', nome: 'Obra Extra', cliente_id: '1' } // Extra no Supabase
                ],
                error: null
              });
            }
            if (tableName === 'despesas') {
              return Promise.resolve({
                data: [
                  { id: '1', valor: 150, data_despesa: '2025-01-01', obra_id: '1' } // Valor modificado
                ],
                error: null
              });
            }

            // Outras tabelas vazias por padrão
            return Promise.resolve({ data: [], error: null });
          })
        }))
      }))
    }
  };
});

// Mock global objects
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Validação Detalhada Linha-a-Linha', () => {

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('performDetailedValidation', () => {

    test('deve executar validação detalhada completa', async () => {
      // Configurar dados de teste no localStorage
      const testData = {
        clientes: [{ id: '1', nome: 'Cliente Teste', documento: '12345678901' }],
        obras: [{ id: '1', nome: 'Obra Teste', cliente_id: '1' }], // Faltando obra '2'
        despesas: [{ id: '1', valor: 100, data_despesa: '2025-01-01', obra_id: '1' }] // Valor diferente
      };

      localStorageMock.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(testData.clientes));
      localStorageMock.setItem(STORAGE_KEYS.OBRAS, JSON.stringify(testData.obras));
      localStorageMock.setItem(STORAGE_KEYS.DESPESAS, JSON.stringify(testData.despesas));

      const result = await performDetailedValidation();

      expect(result).toBeDefined();
      expect(result.recordComparisons).toHaveLength(8); // 8 entidades
      expect(result.summary).toBeDefined();
      expect(result.differences).toBeDefined();

      // Verificar estrutura dos resultados
      expect(typeof result.success).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(typeof result.summary.accuracyPercentage).toBe('number');
    });

    test('deve detectar registros coincidentes corretamente', async () => {
      // Cliente que coincide exatamente
      const testClientes = [{ id: '1', nome: 'Cliente Teste', documento: '12345678901' }];
      localStorageMock.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(testClientes));

      const result = await performDetailedValidation();

      const clientesComparison = result.recordComparisons.find(c => c.entityName === 'clientes');
      expect(clientesComparison).toBeDefined();
      expect(clientesComparison!.matchingRecords).toBe(1);
      expect(clientesComparison!.missingRecords).toEqual([]);
      expect(clientesComparison!.modifiedRecords).toEqual([]);
      expect(clientesComparison!.status).toBe('success');
    });

    test('deve detectar registros ausentes', async () => {
      // Obra '2' está no Supabase mas não no localStorage
      const testObras = [{ id: '1', nome: 'Obra Teste', cliente_id: '1' }];
      localStorageMock.setItem(STORAGE_KEYS.OBRAS, JSON.stringify(testObras));

      const result = await performDetailedValidation();

      const obrasComparison = result.recordComparisons.find(c => c.entityName === 'obras');
      expect(obrasComparison).toBeDefined();
      expect(obrasComparison!.extraRecords).toHaveLength(1);
      expect(obrasComparison!.extraRecords[0].id).toBe('2');
      expect(obrasComparison!.status).toBe('warning');
    });

    test('deve detectar registros modificados', async () => {
      // Despesa com valor diferente
      const testDespesas = [{ id: '1', valor: 100, data_despesa: '2025-01-01', obra_id: '1' }];
      localStorageMock.setItem(STORAGE_KEYS.DESPESAS, JSON.stringify(testDespesas));

      const result = await performDetailedValidation();

      const despesasComparison = result.recordComparisons.find(c => c.entityName === 'despesas');
      expect(despesasComparison).toBeDefined();
      expect(despesasComparison!.modifiedRecords).toHaveLength(1);
      expect(despesasComparison!.modifiedRecords[0].id).toBe('1');
      expect(despesasComparison!.modifiedRecords[0].differences).toHaveLength(1);
      expect(despesasComparison!.modifiedRecords[0].differences[0].field).toBe('valor');
      expect(despesasComparison!.modifiedRecords[0].differences[0].localValue).toBe(100);
      expect(despesasComparison!.modifiedRecords[0].differences[0].supabaseValue).toBe(150);
      expect(despesasComparison!.status).toBe('error');
    });

    test('deve calcular checksums corretamente', async () => {
      const testClientes = [{ id: '1', nome: 'Cliente Teste', documento: '12345678901' }];
      localStorageMock.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(testClientes));

      const result = await performDetailedValidation();

      const clientesComparison = result.recordComparisons.find(c => c.entityName === 'clientes');
      expect(clientesComparison).toBeDefined();
      expect(clientesComparison!.checksum.local).toBeDefined();
      expect(clientesComparison!.checksum.supabase).toBeDefined();
      expect(typeof clientesComparison!.checksum.local).toBe('string');
      expect(typeof clientesComparison!.checksum.supabase).toBe('string');
      expect(typeof clientesComparison!.checksum.match).toBe('boolean');
    });

    test('deve calcular percentual de precisão', async () => {
      // Configurar dados mistos para testar cálculo de precisão
      const testData = {
        clientes: [{ id: '1', nome: 'Cliente Teste', documento: '12345678901' }], // 1 coincidente
        despesas: [{ id: '1', valor: 100, data_despesa: '2025-01-01', obra_id: '1' }] // 1 modificado
      };

      localStorageMock.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(testData.clientes));
      localStorageMock.setItem(STORAGE_KEYS.DESPESAS, JSON.stringify(testData.despesas));

      const result = await performDetailedValidation();

      expect(result.summary.accuracyPercentage).toBeGreaterThanOrEqual(0);
      expect(result.summary.accuracyPercentage).toBeLessThanOrEqual(100);
      expect(result.summary.totalLocalRecords).toBe(2);
      expect(result.summary.totalMatchingRecords).toBe(1); // Apenas clientes coincide
      expect(result.summary.accuracyPercentage).toBe(50); // 1/2 = 50%
    });

    test('deve contar diferenças totais corretamente', async () => {
      const testData = {
        obras: [{ id: '1', nome: 'Obra Teste', cliente_id: '1' }], // Extra no Supabase
        despesas: [{ id: '1', valor: 100, data_despesa: '2025-01-01', obra_id: '1' }] // Modificado
      };

      localStorageMock.setItem(STORAGE_KEYS.OBRAS, JSON.stringify(testData.obras));
      localStorageMock.setItem(STORAGE_KEYS.DESPESAS, JSON.stringify(testData.despesas));

      const result = await performDetailedValidation();

      expect(result.differences.extraRecordsTotal).toBe(2); // 1 cliente + 1 obra extra no Supabase
      expect(result.differences.modifiedRecordsTotal).toBe(1); // Despesa modificada
      expect(result.differences.criticalDifferences.length).toBeGreaterThan(0);
    });

    test('deve incluir todas as entidades na validação', async () => {
      const result = await performDetailedValidation();

      const expectedEntities = [
        'clientes', 'setores', 'funcoes', 'funcionarios',
        'obras', 'despesas', 'videos', 'requisicoes'
      ];

      expect(result.recordComparisons).toHaveLength(8);

      const validatedEntities = result.recordComparisons.map(c => c.entityName);
      expectedEntities.forEach(entity => {
        expect(validatedEntities).toContain(entity);
      });
    });

    test('deve gerar checksum geral', async () => {
      const result = await performDetailedValidation();

      expect(result.summary.overallChecksum).toBeDefined();
      expect(result.summary.overallChecksum.local).toBeDefined();
      expect(result.summary.overallChecksum.supabase).toBeDefined();
      expect(typeof result.summary.overallChecksum.match).toBe('boolean');
    });

  });

  describe('generateDifferencesReport', () => {

    test('deve gerar relatório bem formatado', async () => {
      // Executar validação primeiro
      const testData = {
        clientes: [{ id: '1', nome: 'Cliente Teste', documento: '12345678901' }],
        despesas: [{ id: '1', valor: 100, data_despesa: '2025-01-01', obra_id: '1' }]
      };

      localStorageMock.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(testData.clientes));
      localStorageMock.setItem(STORAGE_KEYS.DESPESAS, JSON.stringify(testData.despesas));

      const validation = await performDetailedValidation();
      const report = generateDifferencesReport(validation);

      expect(typeof report).toBe('string');
      expect(report.length).toBeGreaterThan(0);

      // Verificar seções do relatório
      expect(report).toContain('# Relatório de Validação Detalhada');
      expect(report).toContain('## Resumo Geral');
      expect(report).toContain('## Detalhes por Entidade');
      expect(report).toContain('**Precisão**:');
      expect(report).toContain('**Total localStorage**:');
      expect(report).toContain('**Total Supabase**:');
    });

    test('deve incluir diferenças críticas no relatório', async () => {
      // Configurar dados com diferenças
      const testDespesas = [{ id: '1', valor: 100, data_despesa: '2025-01-01', obra_id: '1' }];
      localStorageMock.setItem(STORAGE_KEYS.DESPESAS, JSON.stringify(testDespesas));

      const validation = await performDetailedValidation();
      const report = generateDifferencesReport(validation);

      expect(report).toContain('## Diferenças Críticas');
      expect(report).toContain('despesas[1].valor');
    });

    test('deve incluir seção de erros se houver', async () => {
      const testDespesas = [{ id: '1', valor: 100, data_despesa: '2025-01-01', obra_id: '1' }];
      localStorageMock.setItem(STORAGE_KEYS.DESPESAS, JSON.stringify(testDespesas));

      const validation = await performDetailedValidation();
      const report = generateDifferencesReport(validation);

      if (validation.errors.length > 0) {
        expect(report).toContain('## Erros');
        expect(report).toContain('❌');
      }
    });

    test('deve incluir seção de avisos se houver', async () => {
      const testObras = [{ id: '1', nome: 'Obra Teste', cliente_id: '1' }];
      localStorageMock.setItem(STORAGE_KEYS.OBRAS, JSON.stringify(testObras));

      const validation = await performDetailedValidation();
      const report = generateDifferencesReport(validation);

      if (validation.warnings.length > 0) {
        expect(report).toContain('## Avisos');
        expect(report).toContain('⚠️');
      }
    });

    test('deve incluir timestamp no relatório', async () => {
      const validation = await performDetailedValidation();
      const report = generateDifferencesReport(validation);

      expect(report).toContain('*Relatório gerado em');
    });

  });

  describe('Cenários de Erro', () => {

    test('deve lidar com erro na leitura do Supabase', async () => {
      // Simular erro no Supabase
      vi.doMock('../../lib/supabaseClient', () => ({
        supabase: {
          from: vi.fn(() => ({
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: null, error: new Error('Erro de conexão') }))
            }))
          }))
        }
      }));

      const result = await performDetailedValidation();

      // Deve continuar funcionando mesmo com erros
      expect(result).toBeDefined();
      expect(result.recordComparisons).toHaveLength(8);
    });

    test('deve lidar com dados corrompidos no localStorage', async () => {
      // Configurar dados inválidos
      localStorageMock.setItem(STORAGE_KEYS.CLIENTES, 'dados-corrompidos-nao-json');

      const result = await performDetailedValidation();

      // Deve processar sem falhar
      expect(result).toBeDefined();
      expect(result.recordComparisons).toHaveLength(8);

      const clientesComparison = result.recordComparisons.find(c => c.entityName === 'clientes');
      expect(clientesComparison!.localRecords).toBe(0); // Deve tratar como vazio
    });

    test('deve manter estrutura válida mesmo com falhas', async () => {
      const result = await performDetailedValidation();

      // Sempre deve retornar estrutura completa
      expect(result.success).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(result.warnings).toBeDefined();
      expect(result.recordComparisons).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.differences).toBeDefined();

      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.recordComparisons)).toBe(true);
    });

  });

});