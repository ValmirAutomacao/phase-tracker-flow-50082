import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock all migration services
vi.mock('../backupService', () => ({
  backupService: {
    createFullBackup: vi.fn(() => ({
      metadata: {
        timestamp: '2023-01-01T00:00:00Z',
        totalRecords: 10,
        checksum: 'abc123'
      },
      data: {}
    }))
  }
}));

vi.mock('../migrationService', () => ({
  migrationService: {
    executeMigration: vi.fn(() => Promise.resolve({
      success: true,
      totalRecords: 10,
      migratedRecords: 10,
      errors: [],
      progress: [
        { entity: 'clientes', total: 5, migrated: 5, status: 'completed', errors: [] }
      ]
    })),
    rollbackMigration: vi.fn(() => Promise.resolve(true))
  }
}));

vi.mock('../integrityValidator', () => ({
  integrityValidator: {
    validateIntegrity: vi.fn(() => Promise.resolve({
      success: true,
      foreignKeys: [],
      recordCounts: [],
      dataStructure: [],
      summary: {
        totalForeignKeyErrors: 0,
        totalRecordCountErrors: 0,
        totalStructureErrors: 0
      },
      errors: []
    }))
  }
}));

vi.mock('../detailedValidator', () => ({
  detailedValidator: {
    executeDetailedValidation: vi.fn(() => Promise.resolve({
      success: true,
      timestamp: '2023-01-01T00:00:00Z',
      entities: [],
      summary: {
        totalRecords: 10,
        totalIdentical: 10,
        totalDifferent: 0,
        totalMissing: 0,
        overallChecksumMatch: true
      },
      errors: []
    }))
  }
}));

import { MigrationOrchestrator } from '../migrationOrchestrator';

describe('MigrationOrchestrator', () => {
  let orchestrator: MigrationOrchestrator;

  beforeEach(() => {
    orchestrator = new MigrationOrchestrator();
    vi.clearAllMocks();
  });

  describe('executeMigration', () => {
    it('deve executar migração completa com sucesso', async () => {
      const result = await orchestrator.executeMigration();

      expect(result.success).toBe(true);
      expect(result.phases).toHaveLength(5);
      expect(result.backup).toBeDefined();
      expect(result.migrationResult).toBeDefined();
      expect(result.integrityResult).toBeDefined();
      expect(result.detailedResult).toBeDefined();
      expect(result.rollbackExecuted).toBe(false);
      expect(result.finalReport).toContain('SUCESSO');
      expect(result.startTime).toBeDefined();
      expect(result.endTime).toBeDefined();
      expect(result.totalDuration).toBeGreaterThan(0);
    });

    it('deve executar rollback automático em caso de falha na migração', async () => {
      // Mock migration failure
      const { migrationService } = await import('../migrationService');
      (migrationService.executeMigration as any).mockResolvedValueOnce({
        success: false,
        totalRecords: 10,
        migratedRecords: 5,
        errors: ['Erro de conexão'],
        progress: []
      });

      const result = await orchestrator.executeMigration();

      expect(result.success).toBe(false);
      expect(result.rollbackExecuted).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(migrationService.rollbackMigration).toHaveBeenCalled();
    });

    it('deve continuar validações mesmo com problemas menores', async () => {
      // Mock integrity validation with issues
      const { integrityValidator } = await import('../integrityValidator');
      (integrityValidator.validateIntegrity as any).mockResolvedValueOnce({
        success: false,
        summary: {
          totalForeignKeyErrors: 1,
          totalRecordCountErrors: 0,
          totalStructureErrors: 0
        },
        errors: ['FK inválida encontrada']
      });

      const result = await orchestrator.executeMigration();

      // Should still complete migration despite integrity issues
      expect(result.success).toBe(true); // Overall success
      expect(result.errors).toContain('Problemas de integridade detectados');
      expect(result.phases.find(p => p.name === 'Validação Detalhada')?.status).toBe('completed');
    });

    it('deve lidar com falha no backup', async () => {
      // Mock backup failure
      const { backupService } = await import('../backupService');
      (backupService.createFullBackup as any).mockImplementationOnce(() => {
        throw new Error('Falha no backup');
      });

      const result = await orchestrator.executeMigration();

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Falha no backup: Falha no backup');
      expect(result.phases.find(p => p.name === 'Backup Obrigatório')?.status).toBe('failed');
      // Migration should not proceed without backup
      expect(result.phases.find(p => p.name === 'Migração de Dados')?.status).toBe('pending');
    });
  });

  describe('validateOnly', () => {
    it('deve executar apenas validações', async () => {
      const result = await orchestrator.validateOnly();

      expect(result.phases).toHaveLength(2);
      expect(result.phases[0].name).toBe('Validação de Integridade');
      expect(result.phases[1].name).toBe('Validação Detalhada');
      expect(result.migrationResult).toBeUndefined();
      expect(result.backup).toBeUndefined();
      expect(result.success).toBe(true);
    });

    it('deve detectar falhas apenas nas validações', async () => {
      // Mock validation failures
      const { integrityValidator } = await import('../integrityValidator');
      const { detailedValidator } = await import('../detailedValidator');

      (integrityValidator.validateIntegrity as any).mockResolvedValueOnce({
        success: false,
        summary: { totalForeignKeyErrors: 5 },
        errors: []
      });

      (detailedValidator.executeDetailedValidation as any).mockResolvedValueOnce({
        success: false,
        summary: { totalDifferent: 3 },
        errors: []
      });

      const result = await orchestrator.validateOnly();

      expect(result.success).toBe(false);
      expect(result.integrityResult?.success).toBe(false);
      expect(result.detailedResult?.success).toBe(false);
    });
  });

  describe('generateFinalReport', () => {
    it('deve gerar relatório completo', async () => {
      const result = await orchestrator.executeMigration();

      expect(result.finalReport).toContain('RELATÓRIO FINAL DE MIGRAÇÃO');
      expect(result.finalReport).toContain('Resumo das Fases');
      expect(result.finalReport).toContain('Estatísticas de Migração');
      expect(result.finalReport).toContain('Validação de Integridade');
      expect(result.finalReport).toContain('Validação Detalhada');
      expect(result.finalReport).toContain('Backup');
      expect(result.finalReport).toContain('Próximos Passos');
      expect(result.finalReport).toContain('SUCESSO');
    });
  });

  describe('error handling', () => {
    it('deve capturar erros gerais na migração', async () => {
      // Mock unexpected error
      const { migrationService } = await import('../migrationService');
      (migrationService.executeMigration as any).mockRejectedValueOnce(
        new Error('Erro inesperado')
      );

      const result = await orchestrator.executeMigration();

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Erro geral: Erro inesperado');
    });

    it('deve continuar mesmo com falhas em validações', async () => {
      // Mock validation error
      const { integrityValidator } = await import('../integrityValidator');
      (integrityValidator.validateIntegrity as any).mockRejectedValueOnce(
        new Error('Erro na validação')
      );

      const result = await orchestrator.executeMigration();

      // Should still complete other phases
      expect(result.phases.find(p => p.name === 'Migração de Dados')?.status).toBe('completed');
      expect(result.phases.find(p => p.name === 'Validação de Integridade')?.status).toBe('failed');
      expect(result.phases.find(p => p.name === 'Validação Detalhada')?.status).toBe('completed');
    });
  });
});