/**
 * Script de Rollback - Restauração Automática
 * Story: 1.11 - Migrar dados localStorage
 * Author: James (Dev Agent)
 *
 * Sistema de rollback automático para reverter migração em caso de falha
 * Inclui cleanup de dados parciais e restauração para localStorage
 */

import { supabase } from '../supabaseClient';
import { STORAGE_KEYS } from '../localStorage';
import { restoreFromBackup, type BackupData } from './backup';

interface RollbackResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  operations: {
    operation: string;
    status: 'success' | 'error' | 'warning';
    details?: string;
    duration: number;
  }[];
  cleanup: {
    supabaseRecordsRemoved: number;
    localStorageRestored: boolean;
    backupValidated: boolean;
  };
  summary: {
    totalDuration: number;
    completedOperations: number;
    failedOperations: number;
    dataIntegrityMaintained: boolean;
  };
}

/**
 * Limpa todos os dados migrados do Supabase
 */
async function cleanupSupabaseData(): Promise<{ removed: number; errors: string[] }> {
  console.log('🧹 Limpando dados migrados do Supabase...');

  const tables = [
    'requisicoes', // Ordem reversa para respeitar FKs
    'videos',
    'despesas',
    'obras',
    'funcionarios',
    'funcoes',
    'setores',
    'clientes'
  ];

  let totalRemoved = 0;
  const errors: string[] = [];

  for (const table of tables) {
    try {
      console.log(`🗑️ Limpando tabela: ${table}...`);

      // Primeiro contar registros para estatísticas
      const { count: beforeCount } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      // Deletar todos os registros
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Condição que deleta tudo

      if (error) {
        errors.push(`Erro ao limpar ${table}: ${error.message}`);
        console.error(`❌ Erro ao limpar ${table}:`, error);
      } else {
        totalRemoved += beforeCount || 0;
        console.log(`✅ Tabela ${table} limpa: ${beforeCount || 0} registros removidos`);
      }

      // Aguardar um pouco entre operações para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      errors.push(`Erro crítico ao limpar ${table}: ${error}`);
      console.error(`❌ Erro crítico ao limpar ${table}:`, error);
    }
  }

  console.log(`🧹 Cleanup concluído: ${totalRemoved} registros removidos, ${errors.length} erros`);

  return {
    removed: totalRemoved,
    errors
  };
}

/**
 * Verifica se o Supabase ainda contém dados de migração
 */
async function verifySupabaseCleanup(): Promise<{ clean: boolean; remainingRecords: number }> {
  console.log('🔍 Verificando limpeza do Supabase...');

  const tables = ['clientes', 'setores', 'funcoes', 'funcionarios', 'obras', 'despesas', 'videos', 'requisicoes'];
  let totalRemaining = 0;

  for (const table of tables) {
    try {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      totalRemaining += count || 0;
    } catch (error) {
      console.error(`Erro ao verificar ${table}:`, error);
      totalRemaining += 1; // Considerar como não limpo se houver erro
    }
  }

  const isClean = totalRemaining === 0;
  console.log(`🔍 Verificação: ${isClean ? 'Limpo' : `${totalRemaining} registros restantes`}`);

  return {
    clean: isClean,
    remainingRecords: totalRemaining
  };
}

/**
 * Restaura dados do backup para localStorage
 */
async function restoreLocalStorageFromBackup(backup: BackupData): Promise<{ success: boolean; error?: string }> {
  console.log('🔄 Restaurando localStorage do backup...');

  try {
    const success = restoreFromBackup(backup);

    if (success) {
      console.log('✅ localStorage restaurado com sucesso');
      return { success: true };
    } else {
      console.error('❌ Falha na restauração do localStorage');
      return { success: false, error: 'Falha na restauração do backup' };
    }
  } catch (error) {
    console.error('❌ Erro crítico na restauração:', error);
    return { success: false, error: `Erro crítico: ${error}` };
  }
}

/**
 * Verifica integridade dos dados após rollback
 */
async function verifyDataIntegrity(originalBackup: BackupData): Promise<boolean> {
  console.log('🔍 Verificando integridade dos dados após rollback...');

  try {
    // Verificar se localStorage foi restaurado corretamente
    for (const [key, expectedData] of Object.entries(originalBackup.data)) {
      const storageKey = STORAGE_KEYS[key as keyof typeof STORAGE_KEYS];
      const actualData = localStorage.getItem(storageKey);

      if (!actualData && expectedData.length > 0) {
        console.error(`❌ Dados ausentes no localStorage: ${key}`);
        return false;
      }

      if (actualData) {
        const parsedData = JSON.parse(actualData);
        if (parsedData.length !== expectedData.length) {
          console.error(`❌ Contagem incorreta no localStorage: ${key} (esperado: ${expectedData.length}, atual: ${parsedData.length})`);
          return false;
        }
      }
    }

    console.log('✅ Integridade dos dados verificada');
    return true;
  } catch (error) {
    console.error('❌ Erro na verificação de integridade:', error);
    return false;
  }
}

/**
 * Executa rollback completo da migração
 */
export async function executeRollback(backup: BackupData, reason?: string): Promise<RollbackResult> {
  console.log('🔄 Iniciando rollback da migração...');
  console.log(`📋 Motivo: ${reason || 'Rollback manual solicitado'}`);

  const startTime = Date.now();
  const result: RollbackResult = {
    success: true,
    errors: [],
    warnings: [],
    operations: [],
    cleanup: {
      supabaseRecordsRemoved: 0,
      localStorageRestored: false,
      backupValidated: false
    },
    summary: {
      totalDuration: 0,
      completedOperations: 0,
      failedOperations: 0,
      dataIntegrityMaintained: false
    }
  };

  try {
    // Operação 1: Validar backup antes de começar
    const operationStart = Date.now();
    console.log('🔍 Validando backup antes do rollback...');

    let backupValid = false;
    try {
      // Verificar se backup tem estrutura válida
      if (backup && backup.metadata && backup.data && backup.checksums) {
        backupValid = true;
        result.cleanup.backupValidated = true;
      }
    } catch (error) {
      result.errors.push(`Backup inválido: ${error}`);
    }

    result.operations.push({
      operation: 'Validar backup',
      status: backupValid ? 'success' : 'error',
      details: backupValid ? 'Backup válido e pronto para restauração' : 'Backup inválido ou corrompido',
      duration: Date.now() - operationStart
    });

    if (!backupValid) {
      result.success = false;
      result.errors.push('Rollback cancelado: backup inválido');
      result.summary.totalDuration = Date.now() - startTime;
      return result;
    }

    // Operação 2: Limpar dados do Supabase
    const cleanupStart = Date.now();
    const cleanupResult = await cleanupSupabaseData();

    result.cleanup.supabaseRecordsRemoved = cleanupResult.removed;
    result.errors.push(...cleanupResult.errors);

    result.operations.push({
      operation: 'Cleanup Supabase',
      status: cleanupResult.errors.length === 0 ? 'success' : 'warning',
      details: `${cleanupResult.removed} registros removidos, ${cleanupResult.errors.length} erros`,
      duration: Date.now() - cleanupStart
    });

    // Operação 3: Verificar limpeza do Supabase
    const verifyStart = Date.now();
    const verifyResult = await verifySupabaseCleanup();

    result.operations.push({
      operation: 'Verificar limpeza Supabase',
      status: verifyResult.clean ? 'success' : 'warning',
      details: verifyResult.clean ? 'Supabase completamente limpo' : `${verifyResult.remainingRecords} registros restantes`,
      duration: Date.now() - verifyStart
    });

    if (!verifyResult.clean) {
      result.warnings.push(`Limpeza incompleta: ${verifyResult.remainingRecords} registros restantes no Supabase`);
    }

    // Operação 4: Restaurar localStorage do backup
    const restoreStart = Date.now();
    const restoreResult = await restoreLocalStorageFromBackup(backup);

    result.cleanup.localStorageRestored = restoreResult.success;

    result.operations.push({
      operation: 'Restaurar localStorage',
      status: restoreResult.success ? 'success' : 'error',
      details: restoreResult.success ? 'localStorage restaurado com sucesso' : restoreResult.error,
      duration: Date.now() - restoreStart
    });

    if (!restoreResult.success) {
      result.success = false;
      result.errors.push(`Falha na restauração do localStorage: ${restoreResult.error}`);
    }

    // Operação 5: Verificar integridade final
    const integrityStart = Date.now();
    const integrityValid = await verifyDataIntegrity(backup);

    result.cleanup.backupValidated = integrityValid;
    result.summary.dataIntegrityMaintained = integrityValid;

    result.operations.push({
      operation: 'Verificar integridade final',
      status: integrityValid ? 'success' : 'error',
      details: integrityValid ? 'Integridade dos dados mantida' : 'Integridade comprometida',
      duration: Date.now() - integrityStart
    });

    if (!integrityValid) {
      result.success = false;
      result.errors.push('Integridade dos dados comprometida após rollback');
    }

    // Calcular estatísticas finais
    result.summary.totalDuration = Date.now() - startTime;
    result.summary.completedOperations = result.operations.filter(op => op.status === 'success').length;
    result.summary.failedOperations = result.operations.filter(op => op.status === 'error').length;

    // Determinar sucesso geral
    if (result.errors.length === 0) {
      result.success = true;
      console.log('✅ Rollback concluído com sucesso!');
    } else {
      result.success = false;
      console.log('⚠️ Rollback concluído com problemas');
    }

    console.log('📊 Resumo do rollback:', {
      success: result.success,
      duration: `${result.summary.totalDuration}ms`,
      supabaseRecordsRemoved: result.cleanup.supabaseRecordsRemoved,
      localStorageRestored: result.cleanup.localStorageRestored,
      integrityMaintained: result.summary.dataIntegrityMaintained,
      errors: result.errors.length,
      warnings: result.warnings.length
    });

  } catch (error) {
    console.error('❌ Erro crítico durante rollback:', error);
    result.success = false;
    result.errors.push(`Erro crítico durante rollback: ${error}`);
    result.summary.totalDuration = Date.now() - startTime;
  }

  return result;
}

/**
 * Executa rollback automático com base em condições de falha
 */
export async function autoRollback(
  backup: BackupData,
  migrationErrors: string[],
  validationResult?: any
): Promise<RollbackResult> {
  console.log('🤖 Iniciando rollback automático...');

  // Determinar motivo do rollback
  let reason = 'Rollback automático - ';
  if (migrationErrors.length > 0) {
    reason += `${migrationErrors.length} erros de migração detectados`;
  } else if (validationResult && !validationResult.success) {
    reason += 'falha na validação de integridade';
  } else {
    reason += 'condições de falha detectadas';
  }

  return executeRollback(backup, reason);
}

/**
 * Cria relatório detalhado do rollback
 */
export function generateRollbackReport(rollbackResult: RollbackResult): string {
  let report = `# Relatório de Rollback\n\n`;

  report += `## Status Geral\n`;
  report += `- **Resultado**: ${rollbackResult.success ? 'Sucesso' : 'Falha'}\n`;
  report += `- **Duração Total**: ${rollbackResult.summary.totalDuration}ms\n`;
  report += `- **Operações Concluídas**: ${rollbackResult.summary.completedOperations}\n`;
  report += `- **Operações Falhadas**: ${rollbackResult.summary.failedOperations}\n`;
  report += `- **Integridade Mantida**: ${rollbackResult.summary.dataIntegrityMaintained ? 'Sim' : 'Não'}\n\n`;

  report += `## Cleanup Realizado\n`;
  report += `- **Registros Removidos do Supabase**: ${rollbackResult.cleanup.supabaseRecordsRemoved}\n`;
  report += `- **localStorage Restaurado**: ${rollbackResult.cleanup.localStorageRestored ? 'Sim' : 'Não'}\n`;
  report += `- **Backup Validado**: ${rollbackResult.cleanup.backupValidated ? 'Sim' : 'Não'}\n\n`;

  report += `## Operações Executadas\n\n`;
  for (const operation of rollbackResult.operations) {
    const statusIcon = operation.status === 'success' ? '✅' : operation.status === 'error' ? '❌' : '⚠️';
    report += `### ${statusIcon} ${operation.operation}\n`;
    report += `- **Status**: ${operation.status}\n`;
    report += `- **Duração**: ${operation.duration}ms\n`;
    if (operation.details) {
      report += `- **Detalhes**: ${operation.details}\n`;
    }
    report += `\n`;
  }

  if (rollbackResult.errors.length > 0) {
    report += `## Erros\n\n`;
    for (const error of rollbackResult.errors) {
      report += `- ❌ ${error}\n`;
    }
    report += `\n`;
  }

  if (rollbackResult.warnings.length > 0) {
    report += `## Avisos\n\n`;
    for (const warning of rollbackResult.warnings) {
      report += `- ⚠️ ${warning}\n`;
    }
    report += `\n`;
  }

  report += `---\n`;
  report += `*Relatório gerado em ${new Date().toLocaleString('pt-BR')}*\n`;

  return report;
}

export type { RollbackResult };