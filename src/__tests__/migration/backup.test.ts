/**
 * Testes para Script de Backup localStorage
 * Story: 1.11 - Migrar dados localStorage
 * Author: James (Dev Agent)
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { createBackup, validateBackup, restoreFromBackup, downloadBackup } from '../../lib/migration/backup';
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

// Mock global objects
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Test Browser 1.0'
  }
});

// Mock URL e Blob para testes de download
global.URL = {
  createObjectURL: vi.fn(() => 'mock-url'),
  revokeObjectURL: vi.fn()
} as any;

global.Blob = vi.fn() as any;

describe('Backup localStorage', () => {

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('createBackup', () => {

    test('deve criar backup vazio quando localStorage está vazio', () => {
      const backup = createBackup();

      expect(backup).toBeDefined();
      expect(backup.metadata).toBeDefined();
      expect(backup.data).toBeDefined();
      expect(backup.checksums).toBeDefined();
      expect(backup.metadata.totalRecords).toBe(0);
    });

    test('deve criar backup com dados do localStorage', () => {
      // Adicionar dados de teste
      const testClientes = [
        { id: '1', nome: 'Cliente Teste', email: 'teste@exemplo.com' }
      ];
      const testFuncoes = [
        { id: '1', nome: 'Função Teste', descricao: 'Descrição teste' }
      ];

      localStorageMock.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(testClientes));
      localStorageMock.setItem(STORAGE_KEYS.FUNCOES, JSON.stringify(testFuncoes));

      const backup = createBackup();

      expect(backup.metadata.totalRecords).toBe(2);
      expect(backup.data.CLIENTES).toEqual(testClientes);
      expect(backup.data.FUNCOES).toEqual(testFuncoes);
      expect(backup.metadata.dataIntegrity.clientes).toBe(1);
      expect(backup.metadata.dataIntegrity.funcoes).toBe(1);
    });

    test('deve incluir metadata completa no backup', () => {
      const backup = createBackup();

      expect(backup.metadata.timestamp).toBeDefined();
      expect(backup.metadata.version).toBe('1.0.0');
      expect(backup.metadata.userAgent).toBe('Test Browser 1.0');
      expect(backup.metadata.storageSize).toBeGreaterThanOrEqual(0);
      expect(backup.metadata.dataIntegrity).toBeDefined();
    });

    test('deve calcular checksums para todas as entidades', () => {
      const testData = [{ id: '1', nome: 'Teste' }];
      localStorageMock.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(testData));

      const backup = createBackup();

      expect(backup.checksums.CLIENTES).toBeDefined();
      expect(backup.checksums.CLIENTES).toMatch(/^[0-9a-f]+$/); // Checksum hexadecimal
      expect(backup.checksums.OBRAS).toBeDefined();
    });

  });

  describe('validateBackup', () => {

    test('deve validar backup válido', () => {
      const backup = createBackup();
      const isValid = validateBackup(backup);

      expect(isValid).toBe(true);
    });

    test('deve rejeitar backup com estrutura inválida', () => {
      const invalidBackup = {
        metadata: null,
        data: {},
        checksums: {}
      } as any;

      const isValid = validateBackup(invalidBackup);

      expect(isValid).toBe(false);
    });

    test('deve rejeitar backup com checksum inválido', () => {
      const backup = createBackup();
      backup.checksums.CLIENTES = 'checksum-inválido';

      const isValid = validateBackup(backup);

      expect(isValid).toBe(false);
    });

    test('deve rejeitar backup com total de registros incorreto', () => {
      const backup = createBackup();
      backup.metadata.totalRecords = 999;

      const isValid = validateBackup(backup);

      expect(isValid).toBe(false);
    });

  });

  describe('restoreFromBackup', () => {

    test('deve restaurar dados válidos para localStorage', () => {
      const testClientes = [
        { id: '1', nome: 'Cliente Teste' }
      ];

      const backup = createBackup();
      backup.data.CLIENTES = testClientes;
      backup.metadata.totalRecords = 1;
      backup.metadata.dataIntegrity.clientes = 1;

      // Recalcular checksum após modificação
      backup.checksums.CLIENTES = Math.abs(JSON.stringify(testClientes).split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0)).toString(16);

      const success = restoreFromBackup(backup);

      expect(success).toBe(true);
      expect(localStorageMock.getItem(STORAGE_KEYS.CLIENTES)).toBe(JSON.stringify(testClientes));
    });

    test('deve falhar ao restaurar backup inválido', () => {
      const invalidBackup = {
        metadata: { totalRecords: 1 },
        data: { CLIENTES: [{ id: '1' }] },
        checksums: { CLIENTES: 'invalid' }
      } as any;

      const success = restoreFromBackup(invalidBackup);

      expect(success).toBe(false);
    });

  });

  describe('downloadBackup', () => {

    test('deve criar link de download para backup', () => {
      // Mock createElement e appendChild
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      };

      const appendChildSpy = vi.fn();
      const removeChildSpy = vi.fn();

      Object.defineProperty(document, 'createElement', {
        value: vi.fn(() => mockLink)
      });

      Object.defineProperty(document.body, 'appendChild', {
        value: appendChildSpy
      });

      Object.defineProperty(document.body, 'removeChild', {
        value: removeChildSpy
      });

      const backup = createBackup();

      expect(() => downloadBackup(backup)).not.toThrow();

      expect(global.Blob).toHaveBeenCalledWith(
        [JSON.stringify(backup, null, 2)],
        { type: 'application/json' }
      );
      expect(mockLink.click).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
      expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
    });

  });

  describe('Cenários de Integração', () => {

    test('deve criar backup completo com todos os tipos de dados', () => {
      // Simular dados completos
      const testData = {
        clientes: [{ id: '1', nome: 'Cliente 1' }],
        obras: [{ id: '1', nome: 'Obra 1', cliente_id: '1' }],
        funcionarios: [{ id: '1', nome: 'Funcionário 1' }],
        funcoes: [{ id: '1', nome: 'Função 1' }],
        setores: [{ id: '1', nome: 'Setor 1' }],
        despesas: [{ id: '1', valor: 100, data_despesa: '2025-01-01' }],
        videos: [{ id: '1', nome: 'Video 1' }],
        requisicoes: [{ id: '1', titulo: 'Requisição 1' }]
      };

      // Popullar localStorage
      localStorageMock.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(testData.clientes));
      localStorageMock.setItem(STORAGE_KEYS.OBRAS, JSON.stringify(testData.obras));
      localStorageMock.setItem(STORAGE_KEYS.FUNCIONARIOS, JSON.stringify(testData.funcionarios));
      localStorageMock.setItem(STORAGE_KEYS.FUNCOES, JSON.stringify(testData.funcoes));
      localStorageMock.setItem(STORAGE_KEYS.SETORES, JSON.stringify(testData.setores));
      localStorageMock.setItem(STORAGE_KEYS.DESPESAS, JSON.stringify(testData.despesas));
      localStorageMock.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(testData.videos));
      localStorageMock.setItem(STORAGE_KEYS.REQUISICOES, JSON.stringify(testData.requisicoes));

      const backup = createBackup();

      expect(backup.metadata.totalRecords).toBe(8);
      expect(validateBackup(backup)).toBe(true);

      // Verificar se todos os dados foram capturados
      expect(backup.data.CLIENTES).toEqual(testData.clientes);
      expect(backup.data.OBRAS).toEqual(testData.obras);
      expect(backup.data.FUNCIONARIOS).toEqual(testData.funcionarios);
      expect(backup.data.FUNCOES).toEqual(testData.funcoes);
      expect(backup.data.SETORES).toEqual(testData.setores);
      expect(backup.data.DESPESAS).toEqual(testData.despesas);
      expect(backup.data.VIDEOS).toEqual(testData.videos);
      expect(backup.data.REQUISICOES).toEqual(testData.requisicoes);
    });

    test('deve fazer backup e restore completo sem perda de dados', () => {
      // Dados originais
      const originalClientes = [
        { id: '1', nome: 'Cliente Original', email: 'original@test.com' }
      ];

      localStorageMock.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(originalClientes));

      // Criar backup
      const backup = createBackup();

      // Limpar localStorage
      localStorageMock.clear();

      // Restaurar backup
      const success = restoreFromBackup(backup);

      expect(success).toBe(true);

      const restoredData = JSON.parse(localStorageMock.getItem(STORAGE_KEYS.CLIENTES) || '[]');
      expect(restoredData).toEqual(originalClientes);
    });

  });

});