#!/usr/bin/env tsx
/**
 * Monitoring Status Script - EngFlow System
 *
 * Exibe status atual do sistema de monitoramento
 *
 * Uso:
 *   npm run monitoring:status
 *   npx tsx scripts/monitoring-status.ts
 */

import { monitoringService } from '../src/lib/monitoring/monitoringService';
import { alertManager } from '../src/lib/monitoring/alertManager';

async function main() {
  console.log('📊 STATUS DO SISTEMA DE MONITORAMENTO ENGFLOW');
  console.log('============================================');
  console.log('');

  try {
    // Obter status atual
    const status = monitoringService.getStatus();
    const healthStats = monitoringService.getHealthStats();
    const activeAlerts = alertManager.getActiveAlerts();

    // Status geral
    console.log('🔍 STATUS GERAL:');
    console.log(`  📊 Serviço: ${status.isRunning ? '✅ Ativo' : '❌ Inativo'}`);

    if (status.isRunning) {
      console.log(`  🕐 Último check: ${status.lastCheck ? new Date(status.lastCheck).toLocaleString('pt-BR') : 'Nunca'}`);
      console.log(`  ⏭️ Próximo check: ${status.nextCheck ? new Date(status.nextCheck).toLocaleString('pt-BR') : 'N/A'}`);
      console.log(`  📋 Checks realizados: ${status.checksPerformed}`);
      console.log(`  ⏱️ Uptime: ${formatUptime(status.uptime)}`);
    } else {
      console.log(`  ⚠️ Serviço parado - use "npm run monitoring:start" para iniciar`);
    }

    console.log('');

    // Saúde atual
    if (status.currentHealth) {
      const health = status.currentHealth;
      const healthEmoji = health.status === 'healthy' ? '✅' :
                         health.status === 'warning' ? '⚠️' : '🚨';

      console.log('💊 SAÚDE ATUAL:');
      console.log(`  ${healthEmoji} Status: ${health.status.toUpperCase()}`);
      console.log(`  📊 Score: ${health.summary.score}/100`);
      console.log(`  🚨 Problemas críticos: ${health.summary.criticalIssues}`);
      console.log(`  ⚠️ Avisos: ${health.summary.warnings}`);

      // Componentes
      console.log('');
      console.log('🔧 COMPONENTES:');
      Object.entries(health.checks).forEach(([component, check]: [string, any]) => {
        const emoji = check.status === 'healthy' ? '✅' :
                      check.status === 'warning' ? '⚠️' : '🚨';
        console.log(`  ${emoji} ${component.toUpperCase()}: ${check.status}`);

        // Detalhes específicos por componente
        if (component === 'database') {
          console.log(`     🔄 Response Time: ${check.responseTime}ms`);
        } else if (component === 'api') {
          console.log(`     📈 Avg Response: ${check.averageResponseTime}ms`);
          console.log(`     ❌ Error Rate: ${check.errorRate.toFixed(1)}%`);
        } else if (component === 'performance') {
          console.log(`     💾 Cache Hit Rate: ${check.cacheHitRate}%`);
        }
      });

      console.log('');
    } else {
      console.log('💊 SAÚDE ATUAL: Não disponível (executar health check)');
      console.log('');
    }

    // Estatísticas históricas
    if (status.checksPerformed > 0) {
      console.log('📈 ESTATÍSTICAS HISTÓRICAS:');
      console.log(`  📊 Score médio: ${healthStats.averageScore}/100`);
      console.log(`  ⏱️ Uptime: ${healthStats.uptimePercentage.toFixed(1)}%`);
      console.log(`  ⚡ Tempo de resposta médio: ${healthStats.averageResponseTime}ms`);
      console.log(`  🚨 Alertas críticos: ${healthStats.criticalAlerts}`);
      console.log(`  ⚠️ Avisos: ${healthStats.warningAlerts}`);
      console.log('');
    }

    // Alertas ativos
    if (activeAlerts.length > 0) {
      console.log('🚨 ALERTAS ATIVOS:');
      activeAlerts.forEach(alert => {
        const emoji = alert.type === 'critical' ? '🚨' :
                      alert.type === 'warning' ? '⚠️' : 'ℹ️';
        const time = new Date(alert.timestamp).toLocaleTimeString('pt-BR');
        console.log(`  ${emoji} [${time}] ${alert.title}`);
        console.log(`     ${alert.message}`);
        if (alert.escalationLevel > 0) {
          console.log(`     🔺 Escalation Level: ${alert.escalationLevel}`);
        }
      });
      console.log('');
    } else {
      console.log('✅ ALERTAS: Nenhum alerta ativo');
      console.log('');
    }

    // Métricas recentes
    const recentMetrics = status.metrics.slice(-5);
    if (recentMetrics.length > 0) {
      console.log('📊 MÉTRICAS RECENTES:');
      console.log('     Timestamp           | Score | DB(ms) | API(ms) | Cache%');
      console.log('     -------------------|-------|--------|---------|-------');

      recentMetrics.reverse().forEach(metric => {
        const time = new Date(metric.timestamp).toLocaleTimeString('pt-BR');
        console.log(`     ${time.padEnd(18)} | ${metric.healthScore.toString().padEnd(5)} | ${metric.responseTime.toString().padEnd(6)} | ${metric.averageResponseTime?.toString().padEnd(7) || 'N/A'} | ${metric.cacheHitRate.toString().padEnd(6)}`);
      });

      console.log('');
    }

    // Recomendações
    if (status.currentHealth && status.currentHealth.summary.recommendations.length > 0) {
      console.log('💡 RECOMENDAÇÕES:');
      status.currentHealth.summary.recommendations.forEach(rec => {
        console.log(`  • ${rec}`);
      });
      console.log('');
    }

    // Comandos úteis
    console.log('🛠️ COMANDOS ÚTEIS:');
    console.log('  npm run monitoring:start        - Iniciar monitoramento');
    console.log('  npm run monitoring:stop         - Parar monitoramento');
    console.log('  npm run diagnose:health         - Health check manual');
    console.log('  npm run diagnose:performance    - Teste de performance');
    console.log('  npm run diagnose:connection     - Teste de conectividade');
    console.log('  npm run diagnose:report         - Relatório completo');
    console.log('');

    // Exit code baseado no status
    let exitCode = 0;

    if (!status.isRunning) {
      exitCode = 1;
    } else if (status.currentHealth) {
      if (status.currentHealth.status === 'critical') {
        exitCode = 2;
      } else if (status.currentHealth.status === 'warning') {
        exitCode = 1;
      }
    }

    if (activeAlerts.some(a => a.type === 'critical')) {
      exitCode = 2;
    }

    process.exit(exitCode);

  } catch (error) {
    console.error('❌ Erro ao obter status do monitoramento:', error);
    console.log('');
    console.log('🔧 POSSÍVEIS SOLUÇÕES:');
    console.log('  • Verificar se o monitoramento foi iniciado');
    console.log('  • Executar "npm run monitoring:start"');
    console.log('  • Verificar configuração do Supabase');
    console.log('');
    process.exit(3);
  }
}

function formatUptime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}min ${seconds % 60}s`;
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}min`;
  } else {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}