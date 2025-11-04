#!/usr/bin/env tsx
/**
 * Start Monitoring Script - EngFlow System
 *
 * Inicia o sistema de monitoramento contínuo
 *
 * Uso:
 *   npm run monitoring:start
 *   npx tsx scripts/start-monitoring.ts
 */

import { monitoringService } from '../src/lib/monitoring/monitoringService';
import { alertManager } from '../src/lib/monitoring/alertManager';

async function main() {
  console.log('🚀 INICIANDO SISTEMA DE MONITORAMENTO ENGFLOW');
  console.log('============================================');
  console.log('');

  try {
    // Verificar se já está rodando
    const currentStatus = monitoringService.getStatus();

    if (currentStatus.isRunning) {
      console.log('⚠️ Sistema de monitoramento já está ativo');
      console.log(`📊 Último check: ${currentStatus.lastCheck}`);
      console.log(`📋 Checks realizados: ${currentStatus.checksPerformed}`);
      console.log(`⏱️ Uptime: ${Math.floor(currentStatus.uptime / 60)} minutos`);
      console.log('');
      console.log('💡 Use "npm run monitoring:stop" para parar o monitoramento');
      console.log('💡 Use "npm run monitoring:status" para ver o status atual');
      return;
    }

    console.log('🔧 Configurando sistema de monitoramento...');

    // Configurar alertas se necessário
    alertManager.updateThresholds({
      critical: {
        responseTime: 2000,
        errorRate: 5,
        healthScore: 50
      },
      warning: {
        responseTime: 500,
        errorRate: 1,
        healthScore: 80
      }
    });

    // Habilitar notificações do browser se disponível
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        console.log(`📱 Permissão para notificações: ${permission}`);
      }
    }

    console.log('✅ Configuração concluída');
    console.log('');

    // Iniciar monitoramento
    console.log('🔄 Iniciando monitoramento contínuo...');
    monitoringService.start();

    // Aguardar primeiro health check
    console.log('⏳ Aguardando primeiro health check...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const status = monitoringService.getStatus();

    console.log('');
    console.log('✅ SISTEMA DE MONITORAMENTO ATIVO');
    console.log('================================');
    console.log('');
    console.log(`📊 Status: ${status.isRunning ? 'Ativo' : 'Inativo'}`);
    console.log(`🕐 Último check: ${status.lastCheck || 'Pendente'}`);
    console.log(`⏱️ Próximo check: ${status.nextCheck || 'Calculando...'}`);
    console.log(`🚨 Alertas ativos: ${status.activeAlerts.length}`);

    if (status.currentHealth) {
      const health = status.currentHealth;
      const healthEmoji = health.status === 'healthy' ? '✅' :
                         health.status === 'warning' ? '⚠️' : '🚨';
      console.log(`${healthEmoji} Saúde atual: ${health.status} (${health.summary.score}/100)`);
    }

    console.log('');
    console.log('📋 COMANDOS DISPONÍVEIS:');
    console.log('  npm run monitoring:status   - Ver status atual');
    console.log('  npm run monitoring:stop     - Parar monitoramento');
    console.log('  npm run diagnose:health     - Health check manual');
    console.log('  npm run diagnose:performance - Teste de performance');
    console.log('');

    console.log('💡 DICAS:');
    console.log('  • O monitoramento roda a cada 60 segundos');
    console.log('  • Alertas críticos são escalados automaticamente');
    console.log('  • Logs são salvos em ./logs/');
    console.log('  • Use Ctrl+C para interromper este script');
    console.log('');

    // Manter o script rodando para mostrar updates
    console.log('🔄 Monitorando em tempo real...');
    console.log('Press Ctrl+C to exit');

    // Loop para mostrar status periodicamente
    const interval = setInterval(() => {
      const currentStatus = monitoringService.getStatus();

      if (!currentStatus.isRunning) {
        console.log('⚠️ Monitoramento foi interrompido');
        clearInterval(interval);
        process.exit(1);
      }

      // Mostrar alertas ativos se houver
      if (currentStatus.activeAlerts.length > 0) {
        console.log('');
        console.log('🚨 ALERTAS ATIVOS:');
        currentStatus.activeAlerts.forEach(alert => {
          const emoji = alert.type === 'critical' ? '🚨' : '⚠️';
          console.log(`  ${emoji} ${alert.title}: ${alert.message}`);
        });
      }

      // Mostrar última verificação de saúde
      if (currentStatus.currentHealth) {
        const health = currentStatus.currentHealth;
        const time = new Date(health.timestamp).toLocaleTimeString('pt-BR');
        const emoji = health.status === 'healthy' ? '✅' :
                     health.status === 'warning' ? '⚠️' : '🚨';

        console.log(`[${time}] ${emoji} Health: ${health.status} (${health.summary.score}/100)`);
      }

    }, 30000); // A cada 30 segundos

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('');
      console.log('🛑 Parando monitoramento...');
      clearInterval(interval);
      monitoringService.stop();
      console.log('✅ Monitoramento parado com sucesso');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('');
      console.log('🛑 Parando monitoramento (SIGTERM)...');
      clearInterval(interval);
      monitoringService.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar monitoramento:', error);
    console.log('');
    console.log('🔧 POSSÍVEIS SOLUÇÕES:');
    console.log('  • Verificar configuração do Supabase (.env)');
    console.log('  • Executar "npm run diagnose:connection"');
    console.log('  • Verificar logs em ./logs/');
    console.log('');
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}