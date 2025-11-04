#!/usr/bin/env tsx
/**
 * Script de Diagnóstico de Saúde - EngFlow System
 *
 * Executa verificação completa de saúde do sistema e gera relatório
 *
 * Uso:
 *   npm run diagnose:health
 *   npx tsx scripts/diagnose-health.ts
 */

// Configurar ambiente primeiro
import './config.js';

import { healthChecker } from '../src/lib/monitoring/healthChecker.js';
import { monitoringService } from '../src/lib/monitoring/monitoringService.js';

interface DiagnosticReport {
  executedAt: string;
  systemHealth: any;
  monitoringStatus: any;
  recommendations: string[];
  actionItems: string[];
}

async function main() {
  console.log('🔍 DIAGNÓSTICO DE SAÚDE DO SISTEMA ENGFLOW');
  console.log('========================================');
  console.log('');

  try {
    // 1. Executar health check completo
    console.log('📊 1. Executando Health Check Completo...');
    const healthResult = await healthChecker.checkSystemHealth();

    // 2. Obter status do monitoramento
    console.log('📈 2. Verificando Status do Monitoramento...');
    const monitoringStatus = monitoringService.getStatus();

    // 3. Obter estatísticas
    console.log('📋 3. Coletando Estatísticas...');
    const healthStats = monitoringService.getHealthStats();

    // 4. Gerar relatório
    console.log('📄 4. Gerando Relatório...');
    const report = generateDiagnosticReport(healthResult, monitoringStatus, healthStats);

    // 5. Exibir resultados
    displayResults(report);

    // 6. Salvar relatório
    await saveReport(report);

    // 7. Exit code baseado na saúde
    const exitCode = healthResult.status === 'healthy' ? 0 :
                    healthResult.status === 'warning' ? 1 : 2;

    console.log('');
    console.log(`✅ Diagnóstico concluído. Exit code: ${exitCode}`);
    process.exit(exitCode);

  } catch (error) {
    console.error('❌ Erro durante diagnóstico:', error);
    console.log('');
    console.log('🚨 DIAGNÓSTICO FALHOU - VERIFICAR CONFIGURAÇÕES');
    process.exit(3);
  }
}

function generateDiagnosticReport(healthResult: any, monitoringStatus: any, healthStats: any): DiagnosticReport {
  const recommendations: string[] = [];
  const actionItems: string[] = [];

  // Analisar resultados e gerar recomendações
  if (healthResult.status === 'critical') {
    actionItems.push('🚨 AÇÃO IMEDIATA: Sistema em estado crítico');
    recommendations.push('Executar procedimentos de emergência');
    recommendations.push('Verificar logs do Supabase');
    recommendations.push('Considerar rollback se necessário');
  }

  if (healthResult.checks.database.status !== 'healthy') {
    actionItems.push('⚡ Verificar conectividade com banco de dados');
    recommendations.push(`Database response time: ${healthResult.checks.database.responseTime}ms`);

    if (healthResult.checks.database.responseTime > 1000) {
      recommendations.push('Otimizar queries lentas');
      recommendations.push('Verificar índices do banco');
    }
  }

  if (healthResult.checks.api.status !== 'healthy') {
    actionItems.push('🔧 Otimizar performance das APIs');
    recommendations.push(`Error rate: ${healthResult.checks.api.errorRate.toFixed(1)}%`);
    recommendations.push(`Avg response time: ${healthResult.checks.api.averageResponseTime}ms`);
  }

  if (healthResult.checks.security.status !== 'healthy') {
    actionItems.push('🔒 CRÍTICO: Corrigir problemas de segurança');
    recommendations.push('Verificar políticas RLS');
    recommendations.push('Revisar permissões de acesso');
  }

  if (healthStats.uptimePercentage < 99) {
    recommendations.push(`Uptime baixo: ${healthStats.uptimePercentage}%`);
    recommendations.push('Investigar causas de instabilidade');
  }

  if (healthStats.averageResponseTime > 500) {
    recommendations.push('Performance degradada detectada');
    recommendations.push('Implementar cache otimizado');
  }

  return {
    executedAt: new Date().toISOString(),
    systemHealth: healthResult,
    monitoringStatus,
    recommendations,
    actionItems
  };
}

function displayResults(report: DiagnosticReport) {
  const health = report.systemHealth;
  const monitoring = report.monitoringStatus;

  console.log('');
  console.log('📋 RELATÓRIO DE DIAGNÓSTICO');
  console.log('==========================');
  console.log('');

  // Status Geral
  const statusEmoji = health.status === 'healthy' ? '✅' :
                     health.status === 'warning' ? '⚠️' : '🚨';
  console.log(`${statusEmoji} STATUS GERAL: ${health.status.toUpperCase()}`);
  console.log(`📊 SCORE DE SAÚDE: ${health.summary.score}/100`);
  console.log('');

  // Componentes
  console.log('🔧 COMPONENTES:');
  Object.entries(health.checks).forEach(([component, check]: [string, any]) => {
    const emoji = check.status === 'healthy' ? '✅' :
                  check.status === 'warning' ? '⚠️' : '🚨';
    console.log(`  ${emoji} ${component.toUpperCase()}: ${check.status}`);

    if (check.errors && check.errors.length > 0) {
      check.errors.forEach((error: string) => {
        console.log(`     ❌ ${error}`);
      });
    }
  });

  console.log('');

  // Métricas
  console.log('📈 MÉTRICAS:');
  console.log(`  🔄 Database Response: ${health.checks.database.responseTime}ms`);
  console.log(`  📡 API Avg Response: ${health.checks.api.averageResponseTime}ms`);
  console.log(`  ❌ API Error Rate: ${health.checks.api.errorRate.toFixed(1)}%`);
  console.log(`  💾 Cache Hit Rate: ${health.checks.performance.cacheHitRate}%`);
  console.log('');

  // Monitoramento
  console.log('🔍 MONITORAMENTO:');
  console.log(`  📊 Status: ${monitoring.isRunning ? '✅ Ativo' : '❌ Inativo'}`);
  console.log(`  🕐 Último Check: ${monitoring.lastCheck || 'Nunca'}`);
  console.log(`  📋 Checks Realizados: ${monitoring.checksPerformed}`);
  console.log(`  ⏱️ Uptime: ${Math.floor(monitoring.uptime / 60)} minutos`);
  console.log(`  🚨 Alertas Ativos: ${monitoring.activeAlerts.length}`);
  console.log('');

  // Alertas Ativos
  if (monitoring.activeAlerts.length > 0) {
    console.log('🚨 ALERTAS ATIVOS:');
    monitoring.activeAlerts.forEach((alert: any) => {
      const emoji = alert.type === 'critical' ? '🚨' : '⚠️';
      console.log(`  ${emoji} ${alert.title}: ${alert.message}`);
    });
    console.log('');
  }

  // Itens de Ação
  if (report.actionItems.length > 0) {
    console.log('⚡ ITENS DE AÇÃO IMEDIATA:');
    report.actionItems.forEach(item => console.log(`  ${item}`));
    console.log('');
  }

  // Recomendações
  if (report.recommendations.length > 0) {
    console.log('💡 RECOMENDAÇÕES:');
    report.recommendations.forEach(rec => console.log(`  • ${rec}`));
    console.log('');
  }
}

async function saveReport(report: DiagnosticReport) {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');

    const logsDir = path.join(process.cwd(), 'logs');
    await fs.mkdir(logsDir, { recursive: true });

    const filename = `health-report-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(logsDir, filename);

    await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    console.log(`📄 Relatório salvo em: ${filepath}`);
  } catch (error) {
    console.warn('⚠️ Não foi possível salvar o relatório:', error.message);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}