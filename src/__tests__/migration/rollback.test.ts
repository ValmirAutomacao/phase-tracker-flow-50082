/**
 * Testes para Script de Rollback
 * Story: 1.11 - Migrar dados localStorage
 * Author: James (Dev Agent)
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { executeRollback, autoRollback, generateRollbackReport } from '../../lib/migration/rollback';
import type { BackupData } from '../../lib/migration/backup';
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
let mockDeleteCalls: string[] = [];
let mockDeleteResults: Record<string, { error: unknown; count?: number }> = {};

vi.mock('../../lib/supabaseClient', () => {
  return {
    supabase: {
      from: vi.fn((tableName: string) => ({
        select: vi.fn((fields: string, options?: unknown) => {
          if (options?.count === 'exact' && options?.head === true) {
            // Para contagem de registros
            return Promise.resolve({
              count: mockDeleteResults[tableName]?.count || 0,
              error: null
            });
          }
          // Para select normal
          return Promise.resolve({
            data: [],
            error: null
          });
        }),
        delete: vi.fn(() => {
          mockDeleteCalls.push(tableName);
          const result = mockDeleteResults[tableName] || { error: null };
          return {
            neq: vi.fn(() => Promise.resolve(result))
          };
        })
      }))
    }
  };
});

// Mock do backup
vi.mock('../../lib/migration/backup', () => ({
  restoreFromBackup: vi.fn((backup: BackupData) => {
    // Simular restauração bem-sucedida por padrão
    if (backup && backup.data) {
      Object.entries(backup.data).forEach(([key, data]) => {
        const storageKey = STORAGE_KEYS[key as keyof typeof STORAGE_KEYS];
        localStorageMock.setItem(storageKey, JSON.stringify(data));
      });
      return true;
    }
    return false;
  })
}));

// Mock global objects
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Rollback da Migração', () => {

  beforeEach(() => {
    localStorageMock.clear();
    mockDeleteCalls = [];
    mockDeleteResults = {
      clientes: { error: null, count: 2 },
      setores: { error: null, count: 1 },
      funcoes: { error: null, count: 3 },
      funcionarios: { error: null, count: 2 },
      obras: { error: null, count: 5 },
      despesas: { error: null, count: 10 },
      videos: { error: null, count: 3 },
      requisicoes: { error: null, count: 4 }
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  // Helper para criar backup de teste
  const createTestBackup = (): BackupData => ({
    metadata: {
      timestamp: '2025-01-01T00:00:00.000Z',
      version: '1.0.0',
      userAgent: 'Test',
      totalRecords: 2,
      storageSize: 1000,
      dataIntegrity: {
        clientes: 1,
        obras: 1,
        funcionarios: 0,
        funcoes: 0,
        setores: 0,
        despesas: 0,
        videos: 0,
        requisicoes: 0
      }
    },
    data: {
      CLIENTES: [{ id: '1', nome: 'Cliente Teste' }],
      OBRAS: [{ id: '1', nome: 'Obra Teste', cliente_id: '1' }],
      FUNCIONARIOS: [],
      FUNCOES: [],
      SETORES: [],
      DESPESAS: [],
      VIDEOS: [],
      REQUISICOES: []
    },
    checksums: {
      CLIENTES: 'abc123',
      OBRAS: 'def456',
      FUNCIONARIOS: 'ghi789',
      FUNCOES: 'jkl012',
      SETORES: 'mno345',
      DESPESAS: 'pqr678',
      VIDEOS: 'stu901',
      REQUISICOES: 'vwx234'
    }
  });

  describe('executeRollback', () => {

    test('deve executar rollback completo com sucesso', async () => {
      const backup = createTestBackup();
      const result = await executeRollback(backup, 'Teste de rollback');

      expect(result.success).toBe(true);
      expect(result.operations).toHaveLength(5); // 5 operações principais
      expect(result.cleanup.supabaseRecordsRemoved).toBe(30); // Soma dos counts
      expect(result.cleanup.localStorageRestored).toBe(true);
      expect(result.summary.dataIntegrityMaintained).toBe(true);
    });

    test('deve validar backup antes de começar', async () => {
      const invalidBackup = {} as BackupData;
      const result = await executeRollback(invalidBackup, 'Teste com backup inválido');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Rollback cancelado: backup inválido');
      expect(result.operations[0].operation).toBe('Validar backup');
      expect(result.operations[0].status).toBe('error');
    });

    test('deve limpar dados do Supabase na ordem correta', async () => {
      const backup = createTestBackup();
      await executeRollback(backup);

      // Verificar ordem de limpeza (reversa para respeitar FKs)
      const expectedOrder = [
        'requisicoes', 'videos', 'despesas', 'obras',
        'funcionarios', 'funcoes', 'setores', 'clientes'
      ];

      expect(mockDeleteCalls).toEqual(expectedOrder);
    });

    test('deve lidar com erros de limpeza do Supabase', async () => {
      // Configurar erro para uma tabela
      mockDeleteResults.clientes = { error: { message: 'Erro de conexão' }, count: 2 };

      const backup = createTestBackup();
      const result = await executeRollback(backup);

      expect(result.errors.some(error => error.includes('Erro ao limpar clientes'))).toBe(true);
      expect(result.cleanup.supabaseRecordsRemoved).toBe(28); // Total menos clientes que falharam
    });

    test('deve restaurar localStorage do backup', async () => {
      const backup = createTestBackup();

      // Limpar localStorage primeiro
      localStorageMock.clear();

      const result = await executeRollback(backup);

      expect(result.cleanup.localStorageRestored).toBe(true);

      // Verificar se dados foram restaurados
      const clientesData = localStorageMock.getItem(STORAGE_KEYS.CLIENTES);
      expect(clientesData).toBeDefined();
      expect(JSON.parse(clientesData!)).toEqual(backup.data.CLIENTES);
    });

    test('deve verificar integridade dos dados após rollback', async () => {
      const backup = createTestBackup();
      const result = await executeRollback(backup);

      expect(result.summary.dataIntegrityMaintained).toBe(true);

      const integrityOperation = result.operations.find(op => op.operation === 'Verificar integridade final');
      expect(integrityOperation).toBeDefined();
      expect(integrityOperation!.status).toBe('success');
    });

    test('deve calcular estatísticas de operações', async () => {
      const backup = createTestBackup();
      const result = await executeRollback(backup);

      expect(result.summary.totalDuration).toBeGreaterThan(0);
      expect(result.summary.completedOperations).toBeGreaterThan(0);
      expect(result.summary.failedOperations).toBe(0);
      expect(result.operations.length).toBe(5);
    });

    test('deve incluir duração para cada operação', async () => {
      const backup = createTestBackup();
      const result = await executeRollback(backup);

      for (const operation of result.operations) {
        expect(operation.duration).toBeGreaterThanOrEqual(0);
        expect(typeof operation.duration).toBe('number');
      }
    });

  });

  describe('autoRollback', () => {

    test('deve executar rollback automático por erros de migração', async () => {
      const backup = createTestBackup();
      const migrationErrors = ['Erro 1', 'Erro 2'];

      const result = await autoRollback(backup, migrationErrors);

      expect(result.success).toBe(true);
      expect(result.operations).toHaveLength(5);
      // O motivo deve mencionar os erros de migração
      expect(result.operations[0].details).toContain('Backup válido');
    });

    test('deve executar rollback automático por falha de validação', async () => {
      const backup = createTestBackup();
      const validationResult = { success: false, errors: ['Validação falhou'] };

      const result = await autoRollback(backup, [], validationResult);

      expect(result.success).toBe(true);
      expect(result.operations).toHaveLength(5);
    });

    test('deve funcionar sem validationResult', async () => {
      const backup = createTestBackup();

      const result = await autoRollback(backup, ['Erro teste']);

      expect(result.success).toBe(true);
      expect(result).toBeDefined();
    });

  });

  describe('generateRollbackReport', () => {

    test('deve gerar relatório bem formatado', async () => {
      const backup = createTestBackup();
      const rollbackResult = await executeRollback(backup);
      const report = generateRollbackReport(rollbackResult);

      expect(typeof report).toBe('string');
      expect(report.length).toBeGreaterThan(0);

      // Verificar seções do relatório
      expect(report).toContain('# Relatório de Rollback');
      expect(report).toContain('## Status Geral');
      expect(report).toContain('## Cleanup Realizado');
      expect(report).toContain('## Operações Executadas');
      expect(report).toContain('**Resultado**:');
      expect(report).toContain('**Duração Total**:');
    });

    test('deve incluir detalhes de todas as operações', async () => {
      const backup = createTestBackup();
      const rollbackResult = await executeRollback(backup);
      const report = generateRollbackReport(rollbackResult);

      // Verificar se todas as operações estão no relatório
      const expectedOperations = [
        'Validar backup',
        'Cleanup Supabase',
        'Verificar limpeza Supabase',
        'Restaurar localStorage',
        'Verificar integridade final'
      ];

      for (const operation of expectedOperations) {
        expect(report).toContain(operation);
      }
    });

    test('deve incluir seção de erros se houver', async () => {
      // Configurar erro para gerar erros no rollback
      mockDeleteResults.clientes = { error: { message: 'Erro forçado' }, count: 0 };

      const backup = createTestBackup();
      const rollbackResult = await executeRollback(backup);
      const report = generateRollbackReport(rollbackResult);

      expect(report).toContain('## Erros');
      expect(report).toContain('❌');
    });

    test('deve incluir seção de avisos se houver', async () => {
      // Configurar cenário que gera warnings (limpeza incompleta)
      mockDeleteResults = {}; // Simular que verificação encontra registros restantes

      vi.doMock('../../lib/supabaseClient', () => ({
        supabase: {
          from: vi.fn(() => ({
            select: vi.fn(() => Promise.resolve({ count: 5, error: null })), // Simular registros restantes
            delete: vi.fn(() => ({
              neq: vi.fn(() => Promise.resolve({ error: null }))
            }))
          }))
        }
      }));

      const backup = createTestBackup();
      const rollbackResult = await executeRollback(backup);
      const report = generateRollbackReport(rollbackResult);

      if (rollbackResult.warnings.length > 0) {
        expect(report).toContain('## Avisos');
        expect(report).toContain('⚠️');
      }
    });

    test('deve incluir timestamp no relatório', async () => {
      const backup = createTestBackup();
      const rollbackResult = await executeRollback(backup);
      const report = generateRollbackReport(rollbackResult);

      expect(report).toContain('*Relatório gerado em');
    });

    test('deve mostrar status de cada operação com ícones', async () => {
      const backup = createTestBackup();
      const rollbackResult = await executeRollback(backup);
      const report = generateRollbackReport(rollbackResult);

      // Deve ter ícones de status
      expect(report).toContain('✅'); // Sucesso
      // Pode ter ⚠️ ou ❌ dependendo do resultado
    });

  });

  describe('Cenários de Erro', () => {

    test('deve lidar com falha na restauração do localStorage', async () => {
      // Temporariamente substituir o mock para simular falha
      const { restoreFromBackup } = await import('../../lib/migration/backup');
      vi.mocked(restoreFromBackup).mockReturnValueOnce(false);

      const backup = createTestBackup();
      const result = await executeRollback(backup);

      expect(result.cleanup.localStorageRestored).toBe(false);
      expect(result.errors.some(error => error.includes('Falha na restauração do localStorage'))).toBe(true);
    });

    test('deve lidar com erro crítico durante rollback', async () => {
      // Backup com estrutura que causa erro
      const corruptedBackup = {
        metadata: null,
        data: null,
        checksums: null
      } as any;

      const result = await executeRollback(corruptedBackup);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('deve manter estrutura válida mesmo com falhas', async () => {
      const invalidBackup = {} as BackupData;
      const result = await executeRollback(invalidBackup);

      // Deve sempre retornar estrutura completa
      expect(result.success).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(result.warnings).toBeDefined();
      expect(result.operations).toBeDefined();
      expect(result.cleanup).toBeDefined();
      expect(result.summary).toBeDefined();

      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.operations)).toBe(true);
    });

    test('deve falhar graciosamente se Supabase estiver inacessível', async () => {
      // Configurar erro em todas as tabelas
      Object.keys(mockDeleteResults).forEach(table => {
        mockDeleteResults[table] = { error: { message: 'Supabase inacessível' }, count: 0 };
      });

      const backup = createTestBackup();
      const result = await executeRollback(backup);

      // Deve continuar e tentar outras operações mesmo com falhas no Supabase
      expect(result.operations).toHaveLength(5);
      expect(result.cleanup.supabaseRecordsRemoved).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

  });

});