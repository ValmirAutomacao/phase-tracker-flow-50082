import { backupService, type LocalStorageBackup } from './backupService';
import { migrationService, type MigrationResult } from './migrationService';
import { integrityValidator, type IntegrityValidationResult } from './integrityValidator';
import { detailedValidator, type DetailedValidationResult } from './detailedValidator';

export interface MigrationPhase {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: string;
  endTime?: string;
  duration?: number;
  result?: unknown;
  error?: string;
}

export interface CompleteMigrationResult {
  success: boolean;
  startTime: string;
  endTime?: string;
  totalDuration?: number;
  phases: MigrationPhase[];
  backup?: LocalStorageBackup;
  migrationResult?: MigrationResult;
  integrityResult?: IntegrityValidationResult;
  detailedResult?: DetailedValidationResult;
  rollbackExecuted: boolean;
  finalReport: string;
  errors: string[];
}

/**
 * Orquestrador completo de migração localStorage → Supabase
 * Executa todas as fases com monitoramento e rollback automático
 */
export class MigrationOrchestrator {
  private phases: MigrationPhase[] = [
    { name: 'Backup Obrigatório', status: 'pending' },
    { name: 'Migração de Dados', status: 'pending' },
    { name: 'Validação de Integridade', status: 'pending' },
    { name: 'Validação Detalhada', status: 'pending' },
    { name: 'Verificação Final', status: 'pending' }
  ];

  private updatePhase(phaseName: string, status: MigrationPhase['status'], result?: any, error?: string) {
    const phase = this.phases.find(p => p.name === phaseName);
    if (phase) {
      phase.status = status;
      if (status === 'running') {
        phase.startTime = new Date().toISOString();
      } else if (status === 'completed' || status === 'failed') {
        phase.endTime = new Date().toISOString();
        if (phase.startTime) {
          phase.duration = Date.now() - new Date(phase.startTime).getTime();
        }
        if (result) phase.result = result;
        if (error) phase.error = error;
      }
    }
  }

  private logPhaseProgress() {
    const completed = this.phases.filter(p => p.status === 'completed').length;
    const total = this.phases.length;
    console.log(`📊 Progresso da migração: ${completed}/${total} fases concluídas`);
  }

  /**
   * Executa migração completa com monitoramento em tempo real
   */
  async executeMigration(): Promise<CompleteMigrationResult> {
    const startTime = new Date().toISOString();
    console.log('🚀 Iniciando migração completa localStorage → Supabase');
    console.log('⏰ Data/Hora:', new Date().toLocaleString('pt-BR'));

    const result: CompleteMigrationResult = {
      success: false,
      startTime,
      phases: this.phases,
      rollbackExecuted: false,
      finalReport: '',
      errors: []
    };

    try {
      // FASE 1: Backup Obrigatório
      console.log('\n🔴 FASE 1: Backup Obrigatório');
      this.updatePhase('Backup Obrigatório', 'running');

      try {
        result.backup = backupService.createFullBackup();
        console.log(`✅ Backup criado: ${result.backup.metadata.totalRecords} registros`);
        this.updatePhase('Backup Obrigatório', 'completed', result.backup);
      } catch (error) {
        this.updatePhase('Backup Obrigatório', 'failed', null, error.message);
        result.errors.push(`Falha no backup: ${error.message}`);
        throw new Error('CRÍTICO: Não é possível prosseguir sem backup');
      }

      this.logPhaseProgress();

      // FASE 2: Migração de Dados
      console.log('\n🔴 FASE 2: Migração de Dados');
      this.updatePhase('Migração de Dados', 'running');

      try {
        result.migrationResult = await migrationService.executeMigration();

        if (result.migrationResult.success) {
          console.log(`✅ Migração concluída: ${result.migrationResult.migratedRecords}/${result.migrationResult.totalRecords} registros`);
          this.updatePhase('Migração de Dados', 'completed', result.migrationResult);
        } else {
          throw new Error(`Falhas na migração: ${result.migrationResult.errors.length} erros`);
        }
      } catch (error) {
        this.updatePhase('Migração de Dados', 'failed', null, error.message);
        result.errors.push(error.message);

        // Rollback automático
        console.log('🔄 Executando rollback automático...');
        if (result.backup) {
          result.rollbackExecuted = await migrationService.rollbackMigration(result.backup);
          if (result.rollbackExecuted) {
            console.log('✅ Rollback executado com sucesso');
          } else {
            console.log('❌ Falha no rollback - AÇÃO MANUAL NECESSÁRIA');
            result.errors.push('CRÍTICO: Rollback falhou - dados podem estar inconsistentes');
          }
        }
        throw error;
      }

      this.logPhaseProgress();

      // FASE 3: Validação de Integridade
      console.log('\n🔴 FASE 3: Validação de Integridade');
      this.updatePhase('Validação de Integridade', 'running');

      try {
        result.integrityResult = await integrityValidator.validateIntegrity();

        if (result.integrityResult.success) {
          console.log('✅ Validação de integridade passou');
          this.updatePhase('Validação de Integridade', 'completed', result.integrityResult);
        } else {
          console.log('⚠️ Problemas de integridade detectados - prosseguindo com validação detalhada');
          this.updatePhase('Validação de Integridade', 'completed', result.integrityResult);
          result.errors.push('Problemas de integridade detectados');
        }
      } catch (error) {
        this.updatePhase('Validação de Integridade', 'failed', null, error.message);
        result.errors.push(`Falha na validação de integridade: ${error.message}`);
      }

      this.logPhaseProgress();

      // FASE 4: Validação Detalhada
      console.log('\n🔴 FASE 4: Validação Detalhada');
      this.updatePhase('Validação Detalhada', 'running');

      try {
        result.detailedResult = await detailedValidator.executeDetailedValidation();

        if (result.detailedResult.success) {
          console.log('✅ Validação detalhada passou');
          this.updatePhase('Validação Detalhada', 'completed', result.detailedResult);
        } else {
          console.log('⚠️ Diferenças detectadas na validação linha-a-linha');
          this.updatePhase('Validação Detalhada', 'completed', result.detailedResult);
          result.errors.push('Diferenças detectadas na validação detalhada');
        }
      } catch (error) {
        this.updatePhase('Validação Detalhada', 'failed', null, error.message);
        result.errors.push(`Falha na validação detalhada: ${error.message}`);
      }

      this.logPhaseProgress();

      // FASE 5: Verificação Final
      console.log('\n🔴 FASE 5: Verificação Final');
      this.updatePhase('Verificação Final', 'running');

      const criticalErrors = result.errors.filter(error =>
        error.includes('CRÍTICO') || error.includes('Falha no backup')
      );

      if (criticalErrors.length === 0) {
        // Migração considerada bem-sucedida
        result.success = true;
        console.log('🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
        this.updatePhase('Verificação Final', 'completed');
      } else {
        // Falha crítica detectada
        console.log('❌ MIGRAÇÃO FALHOU - Erros críticos detectados');
        this.updatePhase('Verificação Final', 'failed', null, 'Erros críticos detectados');
      }

      this.logPhaseProgress();

    } catch (error) {
      result.success = false;
      result.errors.push(`Erro geral: ${error.message}`);
      console.error('❌ Migração falhou:', error.message);
    }

    // Finalizar resultado
    result.endTime = new Date().toISOString();
    result.totalDuration = Date.now() - new Date(result.startTime).getTime();
    result.finalReport = this.generateFinalReport(result);

    console.log('\n📋 RELATÓRIO FINAL:');
    console.log(result.finalReport);

    return result;
  }

  /**
   * Gera relatório final completo
   */
  private generateFinalReport(result: CompleteMigrationResult): string {
    let report = '# RELATÓRIO FINAL DE MIGRAÇÃO\n\n';

    // Cabeçalho
    report += `**Status:** ${result.success ? '✅ SUCESSO' : '❌ FALHOU'}\n`;
    report += `**Início:** ${new Date(result.startTime).toLocaleString('pt-BR')}\n`;
    if (result.endTime) {
      report += `**Fim:** ${new Date(result.endTime).toLocaleString('pt-BR')}\n`;
      report += `**Duração Total:** ${Math.round(result.totalDuration / 1000)}s\n`;
    }
    report += `**Rollback Executado:** ${result.rollbackExecuted ? 'SIM' : 'NÃO'}\n\n`;

    // Resumo das fases
    report += '## Resumo das Fases\n';
    for (const phase of result.phases) {
      const duration = phase.duration ? `(${Math.round(phase.duration / 1000)}s)` : '';
      const statusIcon = {
        'completed': '✅',
        'failed': '❌',
        'skipped': '⏭️',
        'running': '🔄',
        'pending': '⏳'
      }[phase.status];

      report += `- **${phase.name}**: ${statusIcon} ${phase.status.toUpperCase()} ${duration}\n`;
      if (phase.error) {
        report += `  - Erro: ${phase.error}\n`;
      }
    }
    report += '\n';

    // Estatísticas de migração
    if (result.migrationResult) {
      report += '## Estatísticas de Migração\n';
      report += `- **Total de Registros:** ${result.migrationResult.totalRecords}\n`;
      report += `- **Registros Migrados:** ${result.migrationResult.migratedRecords}\n`;
      report += `- **Taxa de Sucesso:** ${Math.round((result.migrationResult.migratedRecords / result.migrationResult.totalRecords) * 100)}%\n`;
      report += `- **Erros de Migração:** ${result.migrationResult.errors.length}\n\n`;

      // Detalhes por entidade
      if (result.migrationResult.progress.length > 0) {
        report += '### Por Entidade\n';
        for (const progress of result.migrationResult.progress) {
          report += `- **${progress.entity}**: ${progress.migrated}/${progress.total} `;
          report += `(${progress.status === 'completed' ? '✅' : '❌'})\n`;
        }
        report += '\n';
      }
    }

    // Validação de integridade
    if (result.integrityResult) {
      report += '## Validação de Integridade\n';
      report += `- **Status:** ${result.integrityResult.success ? '✅ Passou' : '❌ Falhou'}\n`;
      report += `- **Erros de FK:** ${result.integrityResult.summary.totalForeignKeyErrors}\n`;
      report += `- **Erros de Contagem:** ${result.integrityResult.summary.totalRecordCountErrors}\n`;
      report += `- **Erros de Estrutura:** ${result.integrityResult.summary.totalStructureErrors}\n\n`;
    }

    // Validação detalhada
    if (result.detailedResult) {
      report += '## Validação Detalhada\n';
      report += `- **Status:** ${result.detailedResult.success ? '✅ Passou' : '❌ Diferenças Encontradas'}\n`;
      report += `- **Registros Idênticos:** ${result.detailedResult.summary.totalIdentical}\n`;
      report += `- **Registros Diferentes:** ${result.detailedResult.summary.totalDifferent}\n`;
      report += `- **Registros Ausentes:** ${result.detailedResult.summary.totalMissing}\n`;
      report += `- **Checksum Geral:** ${result.detailedResult.summary.overallChecksumMatch ? '✅ OK' : '❌ Falha'}\n\n`;
    }

    // Lista de erros
    if (result.errors.length > 0) {
      report += '## Erros Encontrados\n';
      for (let i = 0; i < result.errors.length; i++) {
        report += `${i + 1}. ${result.errors[i]}\n`;
      }
      report += '\n';
    }

    // Backup info
    if (result.backup) {
      report += '## Backup\n';
      report += `- **Data:** ${new Date(result.backup.metadata.timestamp).toLocaleString('pt-BR')}\n`;
      report += `- **Registros:** ${result.backup.metadata.totalRecords}\n`;
      report += `- **Checksum:** ${result.backup.metadata.checksum}\n\n`;
    }

    // Próximos passos
    report += '## Próximos Passos\n';
    if (result.success) {
      report += '✅ Migração concluída com sucesso. O sistema pode operar com Supabase.\n';
      if (result.errors.length > 0) {
        report += '⚠️ Revisar e corrigir os problemas menores identificados.\n';
      }
    } else {
      report += '❌ Migração falhou. Revisar erros e executar novamente.\n';
      if (result.rollbackExecuted) {
        report += '✅ Dados restaurados para localStorage via rollback.\n';
      } else {
        report += '⚠️ VERIFICAR ESTADO DOS DADOS MANUALMENTE.\n';
      }
    }

    return report;
  }

  /**
   * Executa apenas validações (sem migração)
   */
  async validateOnly(): Promise<CompleteMigrationResult> {
    console.log('🔍 Executando apenas validações...');

    const result: CompleteMigrationResult = {
      success: false,
      startTime: new Date().toISOString(),
      phases: [
        { name: 'Validação de Integridade', status: 'pending' },
        { name: 'Validação Detalhada', status: 'pending' }
      ],
      rollbackExecuted: false,
      finalReport: '',
      errors: []
    };

    try {
      // Validação de integridade
      this.updatePhase('Validação de Integridade', 'running');
      result.integrityResult = await integrityValidator.validateIntegrity();
      this.updatePhase('Validação de Integridade', 'completed', result.integrityResult);

      // Validação detalhada
      this.updatePhase('Validação Detalhada', 'running');
      result.detailedResult = await detailedValidator.executeDetailedValidation();
      this.updatePhase('Validação Detalhada', 'completed', result.detailedResult);

      result.success = result.integrityResult.success && result.detailedResult.success;

    } catch (error) {
      result.errors.push(error.message);
    }

    result.endTime = new Date().toISOString();
    result.finalReport = this.generateFinalReport(result);

    return result;
  }
}

// Instância singleton
export const migrationOrchestrator = new MigrationOrchestrator();