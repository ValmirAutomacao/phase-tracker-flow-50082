import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      upsert: vi.fn(() => Promise.resolve({ error: null })),
      delete: vi.fn(() => ({
        neq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }))
}));

// Mock localStorage service
vi.mock('../../localStorage', () => ({
  getFromStorage: vi.fn(() => []),
  STORAGE_KEYS: {
    CLIENTES: 'engflow_clientes',
    SETORES: 'engflow_setores',
    FUNCOES: 'engflow_funcoes',
    FUNCIONARIOS: 'engflow_funcionarios',
    OBRAS: 'engflow_obras',
    DESPESAS: 'engflow_despesas',
    VIDEOS: 'engflow_videos',
    REQUISICOES: 'engflow_requisicoes'
  }
}));

// Mock backup service
vi.mock('../backupService', () => ({
  backupService: {
    createFullBackup: vi.fn(() => ({
      metadata: {
        timestamp: '2023-01-01T00:00:00.000Z',
        totalRecords: 0,
        checksum: 'test'
      },
      data: {}
    })),
    restoreFromBackup: vi.fn(() => true)
  }
}));

import { MigrationService } from '../migrationService';

describe('MigrationService', () => {
  let migrationService: MigrationService;

  beforeEach(() => {
    migrationService = new MigrationService();
    vi.clearAllMocks();
  });

  describe('mappers', () => {
    it('deve mapear cliente corretamente', () => {
      const cliente = {
        id: '1',
        nome: 'Cliente Teste',
        tipo: 'fisico',
        cpf: '123.456.789-00',
        endereco: {
          rua: 'Rua Teste',
          numero: '123',
          bairro: 'Centro',
          cidade: 'São Paulo',
          cep: '01000-000',
          estado: 'SP'
        },
        telefone: '(11) 99999-9999',
        email: 'cliente@teste.com'
      };

      // Access private method through prototype
      const mapped = (migrationService as any).mapClienteToSupabase(cliente);

      expect(mapped).toEqual({
        id: '1',
        nome: 'Cliente Teste',
        tipo: 'fisico',
        documento: '123.456.789-00',
        endereco: {
          rua: 'Rua Teste',
          numero: '123',
          bairro: 'Centro',
          cidade: 'São Paulo',
          cep: '01000-000',
          estado: 'SP'
        },
        contato: {
          telefone: '(11) 99999-9999',
          email: 'cliente@teste.com',
          contato_principal: '(11) 99999-9999'
        }
      });
    });

    it('deve mapear setor corretamente', () => {
      const setor = {
        id: '1',
        nome: 'Administrativo',
        descricao: 'Setor administrativo'
      };

      const mapped = (migrationService as any).mapSetorToSupabase(setor);

      expect(mapped).toEqual({
        id: '1',
        nome: 'Administrativo',
        descricao: 'Setor administrativo'
      });
    });

    it('deve mapear função com relacionamento de setor', () => {
      const funcao = {
        id: '1',
        setorId: 'setor1',
        nome: 'Engenheiro',
        descricao: 'Engenheiro Civil'
      };

      const setorIdMap = new Map([['setor1', 'new-setor1']]);
      const mapped = (migrationService as any).mapFuncaoToSupabase(funcao, setorIdMap);

      expect(mapped).toEqual({
        id: '1',
        setor_id: 'new-setor1',
        nome: 'Engenheiro',
        descricao: 'Engenheiro Civil'
      });
    });

    it('deve mapear funcionário com relacionamento de função', () => {
      const funcionario = {
        id: '1',
        funcaoId: 'funcao1',
        nome: 'João Silva',
        email: 'joao@teste.com',
        telefone: '(11) 99999-9999',
        ativo: true
      };

      const funcaoIdMap = new Map([['funcao1', 'new-funcao1']]);
      const mapped = (migrationService as any).mapFuncionarioToSupabase(funcionario, funcaoIdMap);

      expect(mapped).toEqual({
        id: '1',
        funcao_id: 'new-funcao1',
        nome: 'João Silva',
        email: 'joao@teste.com',
        telefone: '(11) 99999-9999',
        ativo: true
      });
    });

    it('deve mapear obra com relacionamento de cliente', () => {
      const obra = {
        id: '1',
        clienteId: 'cliente1',
        nome: 'Obra Teste',
        progresso: '50',
        orcamento: '100000.50',
        status: 'em_andamento'
      };

      const clienteIdMap = new Map([['cliente1', 'new-cliente1']]);
      const mapped = (migrationService as any).mapObraToSupabase(obra, clienteIdMap);

      expect(mapped).toEqual({
        id: '1',
        cliente_id: 'new-cliente1',
        nome: 'Obra Teste',
        etapas: null,
        progresso: 50,
        orcamento: 100000.50,
        status: 'em_andamento',
        data_inicio: null,
        data_fim: null,
        descricao: undefined
      });
    });
  });

  describe('executeMigration', () => {
    it('deve executar migração com dados vazios', async () => {
      const { getFromStorage } = await import('../../localStorage');
      (getFromStorage as any).mockReturnValue([]);

      const result = await migrationService.executeMigration();

      expect(result.success).toBe(true);
      expect(result.totalRecords).toBe(0);
      expect(result.migratedRecords).toBe(0);
      expect(result.progress).toHaveLength(8); // 8 entidades
      expect(result.backup).toBeDefined();
    });
  });

  describe('rollbackMigration', () => {
    it('deve executar rollback com sucesso', async () => {
      const { backupService } = await import('../backupService');
      (backupService.restoreFromBackup as any).mockReturnValue(true);

      const mockBackup = {
        metadata: {
          timestamp: '2023-01-01T00:00:00.000Z',
          totalRecords: 5,
          checksum: 'test'
        },
        data: {}
      };

      const success = await migrationService.rollbackMigration(mockBackup as any);

      expect(success).toBe(true);
      expect(backupService.restoreFromBackup).toHaveBeenCalledWith(mockBackup);
    });

    it('deve lidar com falha no rollback', async () => {
      const { backupService } = await import('../backupService');
      (backupService.restoreFromBackup as any).mockReturnValue(false);

      const mockBackup = {
        metadata: {
          timestamp: '2023-01-01T00:00:00.000Z',
          totalRecords: 5,
          checksum: 'test'
        },
        data: {}
      };

      const success = await migrationService.rollbackMigration(mockBackup as any);

      expect(success).toBe(false);
    });
  });
});