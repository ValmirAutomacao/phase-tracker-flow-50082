/**
 * Monitoring Service - Orquestrador de Monitoramento EngFlow
 *
 * Coordena health checks, alertas e coleta de métricas:
 * - Execução periódica de health checks
 * - Processamento de alertas
 * - Coleta de métricas de performance
 * - Dashboard de monitoramento
 */

import { healthChecker, HealthCheckResult } from './healthChecker';
import { alertManager, Alert } from './alertManager';

export interface MonitoringConfig {
  enabled: boolean;
  interval: number; // segundos
  retainHistory: number; // quantos resultados manter no histórico
  autoStart: boolean;
}

export interface MonitoringMetrics {
  timestamp: string;
  healthScore: number;
  responseTime: number;
  errorRate: number;
  cacheHitRate: number;
  activeConnections: number;
  memoryUsage: number;
}

export interface MonitoringStatus {
  isRunning: boolean;
  lastCheck: string | null;
  nextCheck: string | null;
  checksPerformed: number;
  uptime: number; // segundos
  currentHealth: HealthCheckResult | null;
  activeAlerts: Alert[];
  metrics: MonitoringMetrics[];
}

const DEFAULT_CONFIG: MonitoringConfig = {
  enabled: true,
  interval: 60, // 1 minuto
  retainHistory: 1440, // 24 horas (1440 minutos)
  autoStart: true
};

export class MonitoringService {
  private config: MonitoringConfig;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private startTime: number = 0;
  private checksPerformed = 0;
  private lastCheck: string | null = null;
  private healthHistory: HealthCheckResult[] = [];
  private metricsHistory: MonitoringMetrics[] = [];

  constructor(config?: Partial<MonitoringConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (this.config.autoStart) {
      this.start();
    }
  }

  /**
   * Inicia o monitoramento
   */
  start(): void {
    if (this.isRunning) {
      console.log('Monitoring service is already running');
      return;
    }

    console.log('🚀 Starting monitoring service...');
    this.isRunning = true;
    this.startTime = Date.now();

    // Executar primeiro check imediatamente
    this.performHealthCheck();

    // Configurar intervalo
    this.intervalId = setInterval(() => {
      this.performHealthCheck();
    }, this.config.interval * 1000);

    console.log(`✅ Monitoring service started - checking every ${this.config.interval}s`);
  }

  /**
   * Para o monitoramento
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('Monitoring service is not running');
      return;
    }

    console.log('🛑 Stopping monitoring service...');

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    console.log('✅ Monitoring service stopped');
  }

  /**
   * Executa health check e processa resultados
   */
  private async performHealthCheck(): Promise<void> {
    try {
      console.log('🔍 Performing health check...');

      const startTime = Date.now();
      const result = await healthChecker.checkSystemHealth();
      const checkDuration = Date.now() - startTime;

      this.checksPerformed++;
      this.lastCheck = new Date().toISOString();

      // Adicionar ao histórico
      this.addToHistory(result);

      // Extrair métricas
      const metrics = this.extractMetrics(result, checkDuration);
      this.addMetrics(metrics);

      // Processar alertas
      await alertManager.processHealthCheck(result);

      // Log do resultado
      this.logHealthCheckResult(result, checkDuration);

    } catch (error) {
      console.error('❌ Health check failed:', error);

      // Criar alerta de falha do monitoramento
      const failureAlert: Alert = {
        id: 'monitoring-failure',
        type: 'critical',
        title: '🚨 Falha no Monitoramento',
        message: `Health check falhou: ${error.message}`,
        timestamp: new Date().toISOString(),
        source: 'monitoring',
        resolved: false,
        escalationLevel: 0,
        data: { error: error.message }
      };

      await alertManager.processHealthCheck({
        status: 'critical',
        timestamp: new Date().toISOString(),
        checks: {
          database: { status: 'critical', connection: false, responseTime: 0, errors: [error.message] },
          api: { status: 'critical', endpoints: [], averageResponseTime: 0, errorRate: 100, errors: [error.message] },
          security: { status: 'critical', rlsEnabled: false, tablesWithoutRLS: [], securityViolations: 0, errors: [error.message] },
          performance: { status: 'critical', cacheHitRate: 0, slowQueries: 0, memoryUsage: 0, errors: [error.message] }
        },
        summary: {
          score: 0,
          criticalIssues: 1,
          warnings: 0,
          recommendations: ['Verificar conectividade e configurações do sistema']
        }
      });
    }
  }

  /**
   * Adiciona resultado ao histórico
   */
  private addToHistory(result: HealthCheckResult): void {
    this.healthHistory.push(result);

    // Manter apenas o número configurado de resultados
    if (this.healthHistory.length > this.config.retainHistory) {
      this.healthHistory.shift();
    }
  }

  /**
   * Extrai métricas do health check
   */
  private extractMetrics(result: HealthCheckResult, checkDuration: number): MonitoringMetrics {
    return {
      timestamp: result.timestamp,
      healthScore: result.summary.score,
      responseTime: result.checks.database.responseTime,
      errorRate: result.checks.api.errorRate,
      cacheHitRate: result.checks.performance.cacheHitRate,
      activeConnections: result.checks.database.activeConnections || 0,
      memoryUsage: result.checks.performance.memoryUsage
    };
  }

  /**
   * Adiciona métricas ao histórico
   */
  private addMetrics(metrics: MonitoringMetrics): void {
    this.metricsHistory.push(metrics);

    // Manter apenas o número configurado de métricas
    if (this.metricsHistory.length > this.config.retainHistory) {
      this.metricsHistory.shift();
    }
  }

  /**
   * Log do resultado do health check
   */
  private logHealthCheckResult(result: HealthCheckResult, duration: number): void {
    const status = result.status.toUpperCase();
    const score = result.summary.score;
    const emoji = result.status === 'healthy' ? '✅' : result.status === 'warning' ? '⚠️' : '🚨';

    console.log(`${emoji} Health Check [${status}] - Score: ${score}/100 (${duration}ms)`);

    if (result.summary.criticalIssues > 0) {
      console.log(`   🚨 Critical Issues: ${result.summary.criticalIssues}`);
    }

    if (result.summary.warnings > 0) {
      console.log(`   ⚠️ Warnings: ${result.summary.warnings}`);
    }

    // Log de componentes com problemas
    Object.entries(result.checks).forEach(([component, check]) => {
      if (check.status !== 'healthy') {
        const componentEmoji = check.status === 'critical' ? '🚨' : '⚠️';
        console.log(`   ${componentEmoji} ${component}: ${check.status}`);
        if (check.errors.length > 0) {
          check.errors.forEach(error => console.log(`      ❌ ${error}`));
        }
      }
    });

    // Log de recomendações
    if (result.summary.recommendations.length > 0) {
      console.log('   📋 Recomendações:');
      result.summary.recommendations.forEach(rec => console.log(`      • ${rec}`));
    }
  }

  /**
   * Obtém status atual do monitoramento
   */
  getStatus(): MonitoringStatus {
    const currentTime = Date.now();
    const uptime = this.isRunning ? Math.floor((currentTime - this.startTime) / 1000) : 0;

    let nextCheck: string | null = null;
    if (this.isRunning && this.lastCheck) {
      const lastCheckTime = new Date(this.lastCheck).getTime();
      const nextCheckTime = lastCheckTime + (this.config.interval * 1000);
      nextCheck = new Date(nextCheckTime).toISOString();
    }

    return {
      isRunning: this.isRunning,
      lastCheck: this.lastCheck,
      nextCheck,
      checksPerformed: this.checksPerformed,
      uptime,
      currentHealth: this.healthHistory[this.healthHistory.length - 1] || null,
      activeAlerts: alertManager.getActiveAlerts(),
      metrics: this.metricsHistory.slice(-24) // Últimas 24 métricas
    };
  }

  /**
   * Obtém histórico de health checks
   */
  getHealthHistory(limit?: number): HealthCheckResult[] {
    const history = this.healthHistory;
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Obtém histórico de métricas
   */
  getMetricsHistory(limit?: number): MonitoringMetrics[] {
    const metrics = this.metricsHistory;
    return limit ? metrics.slice(-limit) : metrics;
  }

  /**
   * Executa health check sob demanda
   */
  async runHealthCheck(): Promise<HealthCheckResult> {
    console.log('🔍 Running on-demand health check...');
    return await healthChecker.checkSystemHealth();
  }

  /**
   * Atualiza configuração
   */
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    const wasRunning = this.isRunning;

    if (wasRunning) {
      this.stop();
    }

    this.config = { ...this.config, ...newConfig };

    if (wasRunning && this.config.enabled) {
      this.start();
    }

    console.log('📝 Monitoring configuration updated:', this.config);
  }

  /**
   * Obtém estatísticas de saúde
   */
  getHealthStats(): {
    averageScore: number;
    uptimePercentage: number;
    criticalAlerts: number;
    warningAlerts: number;
    averageResponseTime: number;
  } {
    if (this.healthHistory.length === 0) {
      return {
        averageScore: 0,
        uptimePercentage: 0,
        criticalAlerts: 0,
        warningAlerts: 0,
        averageResponseTime: 0
      };
    }

    const scores = this.healthHistory.map(h => h.summary.score);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    const healthyChecks = this.healthHistory.filter(h => h.status === 'healthy').length;
    const uptimePercentage = (healthyChecks / this.healthHistory.length) * 100;

    const criticalAlerts = this.healthHistory.filter(h => h.status === 'critical').length;
    const warningAlerts = this.healthHistory.filter(h => h.status === 'warning').length;

    const responseTimes = this.healthHistory.map(h => h.checks.database.responseTime);
    const averageResponseTime = responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length;

    return {
      averageScore: Math.round(averageScore),
      uptimePercentage: Math.round(uptimePercentage * 100) / 100,
      criticalAlerts,
      warningAlerts,
      averageResponseTime: Math.round(averageResponseTime)
    };
  }

  /**
   * Força limpeza dos dados (para testes)
   */
  clearHistory(): void {
    this.healthHistory = [];
    this.metricsHistory = [];
    this.checksPerformed = 0;
    this.lastCheck = null;
    console.log('📝 Monitoring history cleared');
  }
}

// Instância singleton
export const monitoringService = new MonitoringService();