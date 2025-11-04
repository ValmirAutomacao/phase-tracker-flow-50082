#!/usr/bin/env tsx
/**
 * Stop Monitoring Script - EngFlow System
 *
 * Para o sistema de monitoramento
 *
 * Uso:
 *   npm run monitoring:stop
 *   npx tsx scripts/stop-monitoring.ts
 */

import { monitoringService } from '../src/lib/monitoring/monitoringService';
import { alertManager } from '../src/lib/monitoring/alertManager';

async function main() {
  console.log('🛑 PARANDO SISTEMA DE MONITORAMENTO ENGFLOW');
  console.log('==========================================');
  console.log('');

  try {
    // Verificar se está rodando
    const currentStatus = monitoringService.getStatus();

    if (!currentStatus.isRunning) {
      console.log('⚠️ Sistema de monitoramento já está parado');
      console.log('');
      console.log('💡 Use "npm run monitoring:start" para iniciar o monitoramento');
      console.log('💡 Use "npm run monitoring:status" para ver o status atual');
      return;
    }

    console.log('📊 STATUS ANTES DA PARADA:');
    console.log(`  🕐 Último check: ${currentStatus.lastCheck}`);
    console.log(`  📋 Checks realizados: ${currentStatus.checksPerformed}`);
    console.log(`  ⏱️ Uptime: ${formatUptime(currentStatus.uptime)}`);
    console.log(`  🚨 Alertas ativos: ${currentStatus.activeAlerts.length}`);

    if (currentStatus.currentHealth) {
      const health = currentStatus.currentHealth;
      const healthEmoji = health.status === 'healthy' ? '✅' :
                         health.status === 'warning' ? '⚠️' : '🚨';
      console.log(`  ${healthEmoji} Última saúde: ${health.status} (${health.summary.score}/100)`);
    }

    console.log('');

    // Mostrar alertas ativos antes de parar
    if (currentStatus.activeAlerts.length > 0) {
      console.log('⚠️ ALERTAS ATIVOS QUE SERÃO SUSPENSOS:');
      currentStatus.activeAlerts.forEach(alert => {
        const emoji = alert.type === 'critical' ? '🚨' : '⚠️';
        console.log(`  ${emoji} ${alert.title}: ${alert.message}`);
      });
      console.log('');

      // Confirmar se usuário quer continuar
      console.log('❓ Tem certeza que deseja parar o monitoramento com alertas ativos?');
      console.log('   Os alertas serão suspensos e problemas podem não ser detectados.');
      console.log('');

      // Em um ambiente de produção, aqui poderíamos pedir confirmação do usuário
      // Por agora, vamos continuar automaticamente
      console.log('⚠️ Continuando automaticamente...');
    }

    console.log('🔄 Parando monitoramento...');

    // Parar o serviço de monitoramento
    monitoringService.stop();

    // Resolver todos os alertas ativos (já que o monitoramento está parando)
    await alertManager.resolveAllAlerts();

    // Gerar relatório final se houver dados
    const finalStats = monitoringService.getHealthStats();
    if (finalStats.averageScore > 0) {
      console.log('');
      console.log('📊 RELATÓRIO FINAL DA SESSÃO:');
      console.log(`  📈 Score médio: ${finalStats.averageScore}/100`);
      console.log(`  ⏱️ Uptime: ${finalStats.uptimePercentage.toFixed(1)}%`);
      console.log(`  ⚡ Tempo de resposta médio: ${finalStats.averageResponseTime}ms`);
      console.log(`  🚨 Total de alertas críticos: ${finalStats.criticalAlerts}`);
      console.log(`  ⚠️ Total de avisos: ${finalStats.warningAlerts}`);
    }

    // Salvar relatório de sessão
    await saveSessionReport(currentStatus, finalStats);

    console.log('');
    console.log('✅ MONITORAMENTO PARADO COM SUCESSO');
    console.log('==================================');
    console.log('');
    console.log('💡 PRÓXIMOS PASSOS:');
    console.log('  • Use "npm run monitoring:start" para reiniciar');
    console.log('  • Use "npm run diagnose:health" para health check manual');
    console.log('  • Verifique logs em ./logs/ para histórico');
    console.log('');

    console.log('📋 LEMBRETES:');
    console.log('  • Sem monitoramento ativo, problemas não serão detectados automaticamente');
    console.log('  • Considere executar health checks manuais periodicamente');
    console.log('  • Alertas ativos foram resolvidos automaticamente');
    console.log('');

  } catch (error) {
    console.error('❌ Erro ao parar monitoramento:', error);
    console.log('');
    console.log('🔧 TENTATIVAS DE CORREÇÃO:');
    console.log('  • Forçando parada do serviço...');

    try {
      monitoringService.stop();
      console.log('  ✅ Serviço parado com sucesso');
    } catch (stopError) {
      console.log('  ❌ Falha ao parar serviço:', stopError.message);
    }

    console.log('');
    process.exit(1);
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

async function saveSessionReport(status: any, stats: any) {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');

    const logsDir = path.join(process.cwd(), 'logs');
    await fs.mkdir(logsDir, { recursive: true });

    const sessionReport = {
      sessionEndedAt: new Date().toISOString(),
      sessionDuration: status.uptime,
      checksPerformed: status.checksPerformed,
      lastHealth: status.currentHealth,
      finalStats: stats,
      alertsAtEnd: status.activeAlerts.length,
      summary: {
        successfulSession: stats.averageScore >= 80,
        majorIssues: stats.criticalAlerts > 0,
        overallPerformance: stats.averageResponseTime < 500 ? 'good' : 'needs improvement'
      }
    };

    const filename = `monitoring-session-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;
    const filepath = path.join(logsDir, filename);

    await fs.writeFile(filepath, JSON.stringify(sessionReport, null, 2));
    console.log(`📄 Relatório da sessão salvo em: ${filepath}`);
  } catch (error) {
    console.warn('⚠️ Não foi possível salvar relatório da sessão:', error.message);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}