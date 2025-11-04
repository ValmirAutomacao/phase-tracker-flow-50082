import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BackupService } from '../backupService';
import { STORAGE_KEYS } from '../../localStorage';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock DOM methods
Object.defineProperty(document, 'createElement', {
  value: vi.fn(() => ({
    href: '',
    download: '',
    click: vi.fn(),
  })),
});

Object.defineProperty(document.body, 'appendChild', {
  value: vi.fn(),
});

Object.defineProperty(document.body, 'removeChild', {
  value: vi.fn(),
});

Object.defineProperty(window.URL, 'createObjectURL', {
  value: vi.fn(() => 'blob:mock-url'),
});

Object.defineProperty(window.URL, 'revokeObjectURL', {
  value: vi.fn(),
});

describe('BackupService', () => {
  let backupService: BackupService;

  beforeEach(() => {
    backupService = new BackupService();
    vi.clearAllMocks();
  });

  describe('exportLocalStorage', () => {
    it('deve exportar dados do localStorage corretamente', () => {
      // Mock data
      const mockClientes = [{ id: '1', nome: 'Cliente 1' }];
      const mockObras = [{ id: '1', nome: 'Obra 1', clienteId: '1' }];

      localStorageMock.getItem.mockImplementation((key) => {
        switch (key) {
          case STORAGE_KEYS.CLIENTES:
            return JSON.stringify(mockClientes);
          case STORAGE_KEYS.OBRAS:
            return JSON.stringify(mockObras);
          default:
            return null;
        }
      });

      const backup = backupService.exportLocalStorage();

      expect(backup.data[STORAGE_KEYS.CLIENTES]).toEqual(mockClientes);
      expect(backup.data[STORAGE_KEYS.OBRAS]).toEqual(mockObras);
      expect(backup.metadata.totalRecords).toBe(2);
      expect(backup.metadata.entities.CLIENTES).toBe(1);
      expect(backup.metadata.entities.OBRAS).toBe(1);
      expect(backup.metadata.checksum).toBeDefined();
      expect(backup.metadata.timestamp).toBeDefined();
    });

    it('deve tratar erros de parse JSON gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');

      const backup = backupService.exportLocalStorage();

      Object.values(STORAGE_KEYS).forEach(key => {
        expect(backup.data[key]).toEqual([]);
      });
    });
  });

  describe('validateBackup', () => {
    it('deve validar backup válido', () => {
      const validBackup = {
        metadata: {
          timestamp: '2023-01-01T00:00:00.000Z',
          version: '1.0',
          totalRecords: 1,
          entities: { CLIENTES: 1 },
          checksum: '0' // Will be calculated
        },
        data: {
          [STORAGE_KEYS.CLIENTES]: [{ id: '1', nome: 'Cliente 1' }],
          [STORAGE_KEYS.OBRAS]: [],
          [STORAGE_KEYS.FUNCIONARIOS]: [],
          [STORAGE_KEYS.FUNCOES]: [],
          [STORAGE_KEYS.SETORES]: [],
          [STORAGE_KEYS.DESPESAS]: [],
          [STORAGE_KEYS.REQUISICOES]: [],
          [STORAGE_KEYS.VIDEOS]: [],
        }
      };

      // Calculate real checksum
      const dataString = JSON.stringify(validBackup.data);
      let hash = 0;
      for (let i = 0; i < dataString.length; i++) {
        const char = dataString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      validBackup.metadata.checksum = Math.abs(hash).toString(16);

      const isValid = backupService.validateBackup(validBackup);
      expect(isValid).toBe(true);
    });

    it('deve rejeitar backup com checksum inválido', () => {
      const invalidBackup = {
        metadata: {
          timestamp: '2023-01-01T00:00:00.000Z',
          version: '1.0',
          totalRecords: 1,
          entities: { CLIENTES: 1 },
          checksum: 'invalid-checksum'
        },
        data: {
          [STORAGE_KEYS.CLIENTES]: [{ id: '1', nome: 'Cliente 1' }],
          [STORAGE_KEYS.OBRAS]: [],
          [STORAGE_KEYS.FUNCIONARIOS]: [],
          [STORAGE_KEYS.FUNCOES]: [],
          [STORAGE_KEYS.SETORES]: [],
          [STORAGE_KEYS.DESPESAS]: [],
          [STORAGE_KEYS.REQUISICOES]: [],
          [STORAGE_KEYS.VIDEOS]: [],
        }
      };

      const isValid = backupService.validateBackup(invalidBackup);
      expect(isValid).toBe(false);
    });

    it('deve rejeitar backup com chaves ausentes', () => {
      const incompleteBackup = {
        metadata: {
          timestamp: '2023-01-01T00:00:00.000Z',
          version: '1.0',
          totalRecords: 0,
          entities: {},
          checksum: '0'
        },
        data: {
          [STORAGE_KEYS.CLIENTES]: []
          // Missing other required keys
        }
      };

      const isValid = backupService.validateBackup(incompleteBackup);
      expect(isValid).toBe(false);
    });
  });

  describe('restoreFromBackup', () => {
    it('deve restaurar backup válido', () => {
      const validBackup = {
        metadata: {
          timestamp: '2023-01-01T00:00:00.000Z',
          version: '1.0',
          totalRecords: 1,
          entities: { CLIENTES: 1 },
          checksum: '0'
        },
        data: {
          [STORAGE_KEYS.CLIENTES]: [{ id: '1', nome: 'Cliente 1' }],
          [STORAGE_KEYS.OBRAS]: [],
          [STORAGE_KEYS.FUNCIONARIOS]: [],
          [STORAGE_KEYS.FUNCOES]: [],
          [STORAGE_KEYS.SETORES]: [],
          [STORAGE_KEYS.DESPESAS]: [],
          [STORAGE_KEYS.REQUISICOES]: [],
          [STORAGE_KEYS.VIDEOS]: [],
        }
      };

      // Calculate real checksum
      const dataString = JSON.stringify(validBackup.data);
      let hash = 0;
      for (let i = 0; i < dataString.length; i++) {
        const char = dataString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      validBackup.metadata.checksum = Math.abs(hash).toString(16);

      const success = backupService.restoreFromBackup(validBackup);

      expect(success).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.CLIENTES,
        JSON.stringify([{ id: '1', nome: 'Cliente 1' }])
      );
    });

    it('deve falhar ao restaurar backup inválido', () => {
      const invalidBackup = {
        metadata: {
          timestamp: '2023-01-01T00:00:00.000Z',
          version: '1.0',
          totalRecords: 1,
          entities: { CLIENTES: 1 },
          checksum: 'invalid'
        },
        data: {
          [STORAGE_KEYS.CLIENTES]: [{ id: '1', nome: 'Cliente 1' }]
        }
      };

      const success = backupService.restoreFromBackup(invalidBackup);

      expect(success).toBe(false);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('createFullBackup', () => {
    it('deve criar backup completo e salvar arquivo', () => {
      localStorageMock.getItem.mockReturnValue('[]');

      const backup = backupService.createFullBackup();

      expect(backup).toBeDefined();
      expect(backup.metadata).toBeDefined();
      expect(backup.data).toBeDefined();
    });
  });
});