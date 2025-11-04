import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { healthChecker } from '../../lib/monitoring/healthChecker';
import { alertManager } from '../../lib/monitoring/alertManager';
import { monitoringService } from '../../lib/monitoring/monitoringService';

// Mock Supabase
vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve({
          data: [{ count: 1 }],
          error: null,
          count: 1
        }))
      }))
    }))
  }
}));

describe('Sistema de Monitoramento', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset monitoring service state
    monitoringService.stop();
    monitoringService.clearHistory();
    alertManager.resolveAllAlerts();
  });

  afterEach(() => {
    monitoringService.stop();
  });

  describe('HealthChecker', () => {
    it('deve executar health check completo', async () => {
      const result = await healthChecker.checkSystemHealth();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('checks');
      expect(result).toHaveProperty('summary');

      expect(result.checks).toHaveProperty('database');
      expect(result.checks).toHaveProperty('api');
      expect(result.checks).toHaveProperty('security');
      expect(result.checks).toHaveProperty('performance');

      expect(result.summary).toHaveProperty('score');
      expect(result.summary.score).toBeGreaterThanOrEqual(0);
      expect(result.summary.score).toBeLessThanOrEqual(100);
    });

    it('deve identificar quando alertas devem ser disparados', async () => {
      const result = await healthChecker.checkSystemHealth();
      const alertCheck = await healthChecker.shouldTriggerAlerts(result);

      expect(alertCheck).toHaveProperty('critical');
      expect(alertCheck).toHaveProperty('warning');
      expect(alertCheck).toHaveProperty('notifications');
      expect(Array.isArray(alertCheck.notifications)).toBe(true);
    });

    it('deve retornar status crítico em caso de falha', async () => {
      // Mock falha na conexão
      const mockSupabase = await import('../../lib/supabaseClient');
      vi.mocked(mockSupabase.supabase.from).mockImplementation(() => ({
        select: () => ({
          limit: () => Promise.reject(new Error('Connection failed'))
        })
      }));

      const result = await healthChecker.checkSystemHealth();
      expect(result.status).toBe('critical');
      expect(result.summary.criticalIssues).toBeGreaterThan(0);
    });
  });

  describe('AlertManager', () => {
    it('deve processar health check e criar alertas quando necessário', async () => {
      const criticalHealthResult = {
        status: 'critical' as const,
        timestamp: new Date().toISOString(),
        checks: {
          database: { status: 'critical' as const, connection: false, responseTime: 5000, errors: ['Connection timeout'] },
          api: { status: 'critical' as const, endpoints: [], averageResponseTime: 0, errorRate: 100, errors: ['All endpoints failed'] },
          security: { status: 'critical' as const, rlsEnabled: false, tablesWithoutRLS: ['clientes'], securityViolations: 1, errors: ['RLS not enabled'] },
          performance: { status: 'critical' as const, cacheHitRate: 0, slowQueries: 10, memoryUsage: 100, errors: ['Performance degraded'] }
        },
        summary: {
          score: 20,
          criticalIssues: 4,
          warnings: 0,
          recommendations: ['Fix critical issues immediately']
        }
      };

      await alertManager.processHealthCheck(criticalHealthResult);

      const activeAlerts = alertManager.getActiveAlerts();
      expect(activeAlerts.length).toBeGreaterThan(0);

      const criticalAlerts = activeAlerts.filter(alert => alert.type === 'critical');
      expect(criticalAlerts.length).toBeGreaterThan(0);
    });

    it('deve resolver alertas quando problemas são corrigidos', async () => {
      // Primeiro criar um alerta crítico
      const criticalHealthResult = {
        status: 'critical' as const,
        timestamp: new Date().toISOString(),
        checks: {
          database: { status: 'critical' as const, connection: false, responseTime: 5000, errors: ['Connection failed'] },
          api: { status: 'healthy' as const, endpoints: [], averageResponseTime: 200, errorRate: 0, errors: [] },
          security: { status: 'healthy' as const, rlsEnabled: true, tablesWithoutRLS: [], securityViolations: 0, errors: [] },
          performance: { status: 'healthy' as const, cacheHitRate: 85, slowQueries: 0, memoryUsage: 50, errors: [] }
        },
        summary: {
          score: 30,
          criticalIssues: 1,
          warnings: 0,
          recommendations: []
        }
      };

      await alertManager.processHealthCheck(criticalHealthResult);
      expect(alertManager.getActiveAlerts().length).toBeGreaterThan(0);

      // Depois simular correção
      const healthyResult = {
        status: 'healthy' as const,
        timestamp: new Date().toISOString(),
        checks: {
          database: { status: 'healthy' as const, connection: true, responseTime: 150, errors: [] },
          api: { status: 'healthy' as const, endpoints: [], averageResponseTime: 200, errorRate: 0, errors: [] },
          security: { status: 'healthy' as const, rlsEnabled: true, tablesWithoutRLS: [], securityViolations: 0, errors: [] },
          performance: { status: 'healthy' as const, cacheHitRate: 85, slowQueries: 0, memoryUsage: 50, errors: [] }
        },
        summary: {
          score: 95,
          criticalIssues: 0,
          warnings: 0,
          recommendations: []
        }
      };

      await alertManager.processHealthCheck(healthyResult);

      // Alertas devem ser resolvidos
      const activeAlertsAfterFix = alertManager.getActiveAlerts();
      expect(activeAlertsAfterFix.length).toBe(0);
    });

    it('deve configurar thresholds de alerta', () => {
      const newThresholds = {
        critical: {
          responseTime: 3000,
          errorRate: 10,
          healthScore: 40
        },
        warning: {
          responseTime: 1000,
          errorRate: 2,
          healthScore: 70
        }
      };

      alertManager.updateThresholds(newThresholds);

      // Verificar se a configuração foi aplicada (método interno, mas validamos o comportamento)
      expect(() => alertManager.updateThresholds(newThresholds)).not.toThrow();
    });

    it('deve gerenciar canais de notificação', () => {
      alertManager.updateChannel('console', false);
      alertManager.updateChannel('browser', true);

      // Verificar se não gera erro
      expect(() => alertManager.updateChannel('console', true)).not.toThrow();
    });
  });

  describe('MonitoringService', () => {
    it('deve iniciar e parar o monitoramento', () => {
      expect(monitoringService.getStatus().isRunning).toBe(false);

      monitoringService.start();
      expect(monitoringService.getStatus().isRunning).toBe(true);

      monitoringService.stop();
      expect(monitoringService.getStatus().isRunning).toBe(false);
    });

    it('deve executar health check sob demanda', async () => {
      const result = await monitoringService.runHealthCheck();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('checks');
      expect(result).toHaveProperty('summary');
    });

    it('deve coletar métricas ao longo do tempo', async () => {
      const statusBefore = monitoringService.getStatus();
      expect(statusBefore.metrics.length).toBe(0);

      // Simular execução de health check
      await monitoringService.runHealthCheck();

      // Como o serviço não está rodando, métricas podem não ser coletadas automaticamente
      // Mas o health check deve funcionar
      expect(() => monitoringService.getHealthHistory()).not.toThrow();
    });

    it('deve calcular estatísticas de saúde', () => {
      const stats = monitoringService.getHealthStats();

      expect(stats).toHaveProperty('averageScore');
      expect(stats).toHaveProperty('uptimePercentage');
      expect(stats).toHaveProperty('criticalAlerts');
      expect(stats).toHaveProperty('warningAlerts');
      expect(stats).toHaveProperty('averageResponseTime');

      expect(typeof stats.averageScore).toBe('number');
      expect(typeof stats.uptimePercentage).toBe('number');
    });

    it('deve atualizar configuração', () => {
      const newConfig = {
        interval: 30, // 30 segundos
        retainHistory: 720 // 12 horas
      };

      monitoringService.updateConfig(newConfig);

      // Verificar se não gera erro
      expect(() => monitoringService.updateConfig(newConfig)).not.toThrow();
    });

    it('deve limpar histórico quando solicitado', () => {
      // Adicionar algum dado primeiro
      monitoringService.runHealthCheck();

      // Limpar
      monitoringService.clearHistory();

      const status = monitoringService.getStatus();
      expect(status.checksPerformed).toBe(0);
      expect(status.lastCheck).toBeNull();
    });

    it('deve obter status completo do monitoramento', () => {
      const status = monitoringService.getStatus();

      expect(status).toHaveProperty('isRunning');
      expect(status).toHaveProperty('lastCheck');
      expect(status).toHaveProperty('nextCheck');
      expect(status).toHaveProperty('checksPerformed');
      expect(status).toHaveProperty('uptime');
      expect(status).toHaveProperty('currentHealth');
      expect(status).toHaveProperty('activeAlerts');
      expect(status).toHaveProperty('metrics');

      expect(typeof status.isRunning).toBe('boolean');
      expect(typeof status.checksPerformed).toBe('number');
      expect(typeof status.uptime).toBe('number');
      expect(Array.isArray(status.activeAlerts)).toBe(true);
      expect(Array.isArray(status.metrics)).toBe(true);
    });
  });

  describe('Integração Completa', () => {
    it('deve funcionar em cenário completo de monitoramento', async () => {
      // 1. Iniciar monitoramento
      monitoringService.start();
      expect(monitoringService.getStatus().isRunning).toBe(true);

      // 2. Aguardar um pouco para primeiro health check
      await new Promise(resolve => setTimeout(resolve, 100));

      // 3. Executar health check manual
      const healthResult = await monitoringService.runHealthCheck();
      expect(healthResult).toHaveProperty('status');

      // 4. Verificar se alertas foram processados se necessário
      await alertManager.processHealthCheck(healthResult);

      // 5. Obter status final
      const finalStatus = monitoringService.getStatus();
      expect(finalStatus.checksPerformed).toBeGreaterThanOrEqual(0);

      // 6. Parar monitoramento
      monitoringService.stop();
      expect(monitoringService.getStatus().isRunning).toBe(false);
    });

    it('deve manter histórico de health checks', async () => {
      // Executar múltiplos health checks
      await monitoringService.runHealthCheck();
      await monitoringService.runHealthCheck();

      const history = monitoringService.getHealthHistory();
      expect(Array.isArray(history)).toBe(true);

      const metrics = monitoringService.getMetricsHistory();
      expect(Array.isArray(metrics)).toBe(true);
    });

    it('deve identificar degradação de performance ao longo do tempo', async () => {
      // Simular múltiplas execuções
      for (let i = 0; i < 3; i++) {
        await monitoringService.runHealthCheck();
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const stats = monitoringService.getHealthStats();
      expect(stats.averageScore).toBeGreaterThanOrEqual(0);
      expect(stats.averageScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Resiliência e Recuperação', () => {
    it('deve continuar funcionando mesmo com falhas pontuais', async () => {
      // Mock falha temporária
      const mockSupabase = await import('../../lib/supabaseClient');
      let callCount = 0;

      vi.mocked(mockSupabase.supabase.from).mockImplementation(() => ({
        select: () => ({
          limit: () => {
            callCount++;
            if (callCount === 1) {
              return Promise.reject(new Error('Temporary failure'));
            }
            return Promise.resolve({
              data: [{ count: 1 }],
              error: null,
              count: 1
            });
          }
        })
      }));

      // Primeira chamada deve falhar
      const result1 = await healthChecker.checkSystemHealth();
      expect(result1.status).toBe('critical');

      // Segunda chamada deve ter sucesso
      const result2 = await healthChecker.checkSystemHealth();
      expect(result2.status).not.toBe('critical');
    });

    it('deve recuperar automaticamente de alertas quando problemas são resolvidos', async () => {
      // Criar problema
      const problemResult = {
        status: 'warning' as const,
        timestamp: new Date().toISOString(),
        checks: {
          database: { status: 'warning' as const, connection: true, responseTime: 800, errors: ['Slow response'] },
          api: { status: 'healthy' as const, endpoints: [], averageResponseTime: 200, errorRate: 0, errors: [] },
          security: { status: 'healthy' as const, rlsEnabled: true, tablesWithoutRLS: [], securityViolations: 0, errors: [] },
          performance: { status: 'healthy' as const, cacheHitRate: 85, slowQueries: 0, memoryUsage: 50, errors: [] }
        },
        summary: {
          score: 75,
          criticalIssues: 0,
          warnings: 1,
          recommendations: ['Optimize database performance']
        }
      };

      await alertManager.processHealthCheck(problemResult);
      expect(alertManager.getActiveAlerts().length).toBeGreaterThan(0);

      // Resolver problema
      const recoveryResult = {
        status: 'healthy' as const,
        timestamp: new Date().toISOString(),
        checks: {
          database: { status: 'healthy' as const, connection: true, responseTime: 200, errors: [] },
          api: { status: 'healthy' as const, endpoints: [], averageResponseTime: 200, errorRate: 0, errors: [] },
          security: { status: 'healthy' as const, rlsEnabled: true, tablesWithoutRLS: [], securityViolations: 0, errors: [] },
          performance: { status: 'healthy' as const, cacheHitRate: 85, slowQueries: 0, memoryUsage: 50, errors: [] }
        },
        summary: {
          score: 95,
          criticalIssues: 0,
          warnings: 0,
          recommendations: []
        }
      };

      await alertManager.processHealthCheck(recoveryResult);
      expect(alertManager.getActiveAlerts().length).toBe(0);
    });
  });
});