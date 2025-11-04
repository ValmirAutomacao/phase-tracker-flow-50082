/**
 * Alert Manager - Sistema de Alertas EngFlow
 *
 * Gerencia alertas e notificações baseado em métricas do sistema:
 * - Email notifications
 * - Browser notifications
 * - Console alerts
 * - Escalation procedures
 */

import { HealthCheckResult } from './healthChecker';

export interface AlertConfig {
  enabled: boolean;
  channels: AlertChannel[];
  thresholds: AlertThresholds;
  escalation: EscalationConfig;
}

export interface AlertChannel {
  type: 'email' | 'browser' | 'console' | 'webhook';
  config: Record<string, any>;
  enabled: boolean;
}

export interface AlertThresholds {
  critical: {
    responseTime: number; // ms
    errorRate: number; // %
    healthScore: number; // 0-100
  };
  warning: {
    responseTime: number; // ms
    errorRate: number; // %
    healthScore: number; // 0-100
  };
}

export interface EscalationConfig {
  enabled: boolean;
  levels: EscalationLevel[];
}

export interface EscalationLevel {
  level: number;
  timeThreshold: number; // minutos
  channels: string[];
  message: string;
}

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  source: string;
  resolved: boolean;
  escalationLevel: number;
  data?: unknown;
}

// Configuração padrão de alertas
const DEFAULT_CONFIG: AlertConfig = {
  enabled: true,
  channels: [
    {
      type: 'console',
      config: { level: 'warn' },
      enabled: true
    },
    {
      type: 'browser',
      config: { persistent: true },
      enabled: true
    }
  ],
  thresholds: {
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
  },
  escalation: {
    enabled: true,
    levels: [
      {
        level: 1,
        timeThreshold: 5, // 5 minutos
        channels: ['console', 'browser'],
        message: 'Alerta ativo há 5 minutos - verificar sistema'
      },
      {
        level: 2,
        timeThreshold: 15, // 15 minutos
        channels: ['console', 'browser'],
        message: 'ESCALATION: Problema crítico há 15 minutos - ação imediata necessária'
      },
      {
        level: 3,
        timeThreshold: 30, // 30 minutos
        channels: ['console', 'browser'],
        message: 'ESCALATION LEVEL 3: Sistema crítico há 30 minutos - contatar suporte'
      }
    ]
  }
};

export class AlertManager {
  private config: AlertConfig;
  private activeAlerts: Map<string, Alert> = new Map();
  private escalationTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(config?: Partial<AlertConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Processa resultado do health check e dispara alertas necessários
   */
  async processHealthCheck(result: HealthCheckResult): Promise<void> {
    try {
      // Verificar se novos alertas devem ser criados
      const newAlerts = this.evaluateHealthCheck(result);

      for (const alert of newAlerts) {
        await this.createAlert(alert);
      }

      // Verificar se alertas existentes devem ser resolvidos
      await this.checkForResolvedAlerts(result);

    } catch (error) {
      console.error('Error processing health check alerts:', error);
    }
  }

  /**
   * Avalia health check e identifica alertas necessários
   */
  private evaluateHealthCheck(result: HealthCheckResult): Alert[] {
    const alerts: Alert[] = [];

    // Alerta geral do sistema
    if (result.status === 'critical') {
      if (!this.hasActiveAlert('system-critical')) {
        alerts.push({
          id: 'system-critical',
          type: 'critical',
          title: '🚨 Sistema Crítico',
          message: `Sistema em estado crítico com score ${result.summary.score}/100. ${result.summary.criticalIssues} problemas críticos detectados.`,
          timestamp: new Date().toISOString(),
          source: 'system',
          resolved: false,
          escalationLevel: 0,
          data: result
        });
      }
    } else if (result.status === 'warning') {
      if (!this.hasActiveAlert('system-warning')) {
        alerts.push({
          id: 'system-warning',
          type: 'warning',
          title: '⚠️ Sistema com Problemas',
          message: `Sistema com avisos. Score: ${result.summary.score}/100. ${result.summary.warnings} problemas detectados.`,
          timestamp: new Date().toISOString(),
          source: 'system',
          resolved: false,
          escalationLevel: 0,
          data: result
        });
      }
    }

    // Alertas específicos por componente
    alerts.push(...this.evaluateComponentAlerts(result));

    return alerts;
  }

  /**
   * Avalia alertas específicos por componente
   */
  private evaluateComponentAlerts(result: HealthCheckResult): Alert[] {
    const alerts: Alert[] = [];

    // Database alerts
    if (result.checks.database.status === 'critical') {
      if (!this.hasActiveAlert('database-critical')) {
        alerts.push({
          id: 'database-critical',
          type: 'critical',
          title: '🚨 Database Crítico',
          message: `Database inacessível ou com problemas graves. Response time: ${result.checks.database.responseTime}ms`,
          timestamp: new Date().toISOString(),
          source: 'database',
          resolved: false,
          escalationLevel: 0,
          data: result.checks.database
        });
      }
    } else if (result.checks.database.status === 'warning') {
      if (!this.hasActiveAlert('database-warning')) {
        alerts.push({
          id: 'database-warning',
          type: 'warning',
          title: '⚠️ Database Lento',
          message: `Database com performance degradada. Response time: ${result.checks.database.responseTime}ms`,
          timestamp: new Date().toISOString(),
          source: 'database',
          resolved: false,
          escalationLevel: 0,
          data: result.checks.database
        });
      }
    }

    // API alerts
    if (result.checks.api.status === 'critical') {
      if (!this.hasActiveAlert('api-critical')) {
        alerts.push({
          id: 'api-critical',
          type: 'critical',
          title: '🚨 APIs Críticas',
          message: `Alta taxa de erro nas APIs: ${result.checks.api.errorRate.toFixed(1)}%. Avg response: ${result.checks.api.averageResponseTime}ms`,
          timestamp: new Date().toISOString(),
          source: 'api',
          resolved: false,
          escalationLevel: 0,
          data: result.checks.api
        });
      }
    }

    // Security alerts
    if (result.checks.security.status === 'critical') {
      if (!this.hasActiveAlert('security-critical')) {
        alerts.push({
          id: 'security-critical',
          type: 'critical',
          title: '🚨 Problema de Segurança',
          message: `RLS não configurado ou problemas de segurança detectados. Tabelas sem RLS: ${result.checks.security.tablesWithoutRLS.length}`,
          timestamp: new Date().toISOString(),
          source: 'security',
          resolved: false,
          escalationLevel: 0,
          data: result.checks.security
        });
      }
    }

    return alerts;
  }

  /**
   * Cria um novo alerta
   */
  private async createAlert(alert: Alert): Promise<void> {
    this.activeAlerts.set(alert.id, alert);

    // Enviar notificações
    await this.sendNotifications(alert);

    // Configurar escalation se habilitado
    if (this.config.escalation.enabled && alert.type === 'critical') {
      this.setupEscalation(alert);
    }

    // Log do alerta
    console.log(`[ALERT] ${alert.type.toUpperCase()}: ${alert.title} - ${alert.message}`);
  }

  /**
   * Envia notificações através dos canais configurados
   */
  private async sendNotifications(alert: Alert): Promise<void> {
    for (const channel of this.config.channels) {
      if (!channel.enabled) continue;

      try {
        await this.sendNotification(channel, alert);
      } catch (error) {
        console.error(`Failed to send notification via ${channel.type}:`, error);
      }
    }
  }

  /**
   * Envia notificação por canal específico
   */
  private async sendNotification(channel: AlertChannel, alert: Alert): Promise<void> {
    switch (channel.type) {
      case 'console':
        this.sendConsoleNotification(alert, channel.config);
        break;

      case 'browser':
        await this.sendBrowserNotification(alert, channel.config);
        break;

      case 'email':
        await this.sendEmailNotification(alert, channel.config);
        break;

      case 'webhook':
        await this.sendWebhookNotification(alert, channel.config);
        break;

      default:
        console.warn(`Unknown notification channel: ${channel.type}`);
    }
  }

  /**
   * Notificação via console
   */
  private sendConsoleNotification(alert: Alert, config: unknown): void {
    const method = alert.type === 'critical' ? 'error' : alert.type === 'warning' ? 'warn' : 'info';
    console[method](`[${alert.timestamp}] ${alert.title}: ${alert.message}`);
  }

  /**
   * Notificação via browser
   */
  private async sendBrowserNotification(alert: Alert, config: unknown): Promise<void> {
    if ('Notification' in window) {
      // Pedir permissão se necessário
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      if (Notification.permission === 'granted') {
        const icon = alert.type === 'critical' ? '🚨' : alert.type === 'warning' ? '⚠️' : 'ℹ️';

        new Notification(alert.title, {
          body: alert.message,
          icon: `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${icon}</text></svg>`,
          tag: alert.id,
          requireInteraction: config.persistent || alert.type === 'critical'
        });
      }
    }
  }

  /**
   * Notificação via email (placeholder)
   */
  private async sendEmailNotification(alert: Alert, config: unknown): Promise<void> {
    // Implementar integração com serviço de email
    console.log(`[EMAIL] Would send email for alert: ${alert.title}`);
  }

  /**
   * Notificação via webhook (placeholder)
   */
  private async sendWebhookNotification(alert: Alert, config: unknown): Promise<void> {
    // Implementar integração com webhook
    console.log(`[WEBHOOK] Would send webhook for alert: ${alert.title}`);
  }

  /**
   * Configura escalation para alerta crítico
   */
  private setupEscalation(alert: Alert): void {
    if (this.escalationTimers.has(alert.id)) {
      clearTimeout(this.escalationTimers.get(alert.id));
    }

    const escalateAlert = (level: number) => {
      const escalationLevel = this.config.escalation.levels[level];
      if (!escalationLevel) return;

      alert.escalationLevel = level + 1;

      // Enviar notificação de escalation
      this.sendConsoleNotification({
        ...alert,
        title: `ESCALATION LEVEL ${level + 1}`,
        message: escalationLevel.message
      }, {});

      // Configurar próximo nível se existir
      if (level + 1 < this.config.escalation.levels.length) {
        const nextLevel = this.config.escalation.levels[level + 1];
        const timer = setTimeout(() => escalateAlert(level + 1), nextLevel.timeThreshold * 60 * 1000);
        this.escalationTimers.set(alert.id, timer);
      }
    };

    // Configurar primeiro nível de escalation
    const firstLevel = this.config.escalation.levels[0];
    if (firstLevel) {
      const timer = setTimeout(() => escalateAlert(0), firstLevel.timeThreshold * 60 * 1000);
      this.escalationTimers.set(alert.id, timer);
    }
  }

  /**
   * Verifica se alertas devem ser resolvidos
   */
  private async checkForResolvedAlerts(result: HealthCheckResult): Promise<void> {
    for (const [alertId, alert] of this.activeAlerts) {
      let shouldResolve = false;

      // Verificar se alerta deve ser resolvido baseado no status atual
      if (alertId.startsWith('system-') && result.status === 'healthy') {
        shouldResolve = true;
      } else if (alertId.startsWith('database-') && result.checks.database.status === 'healthy') {
        shouldResolve = true;
      } else if (alertId.startsWith('api-') && result.checks.api.status === 'healthy') {
        shouldResolve = true;
      } else if (alertId.startsWith('security-') && result.checks.security.status === 'healthy') {
        shouldResolve = true;
      }

      if (shouldResolve) {
        await this.resolveAlert(alertId);
      }
    }
  }

  /**
   * Resolve um alerta
   */
  private async resolveAlert(alertId: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return;

    alert.resolved = true;

    // Limpar timer de escalation
    if (this.escalationTimers.has(alertId)) {
      clearTimeout(this.escalationTimers.get(alertId));
      this.escalationTimers.delete(alertId);
    }

    // Notificar resolução
    console.log(`[ALERT RESOLVED] ${alert.title} - Problema resolvido`);

    // Remover da lista de alertas ativos
    this.activeAlerts.delete(alertId);
  }

  /**
   * Verifica se existe alerta ativo
   */
  private hasActiveAlert(alertId: string): boolean {
    return this.activeAlerts.has(alertId);
  }

  /**
   * Obtém todos os alertas ativos
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Configura thresholds de alerta
   */
  updateThresholds(thresholds: Partial<AlertThresholds>): void {
    this.config.thresholds = { ...this.config.thresholds, ...thresholds };
  }

  /**
   * Habilita/desabilita canal de notificação
   */
  updateChannel(type: string, enabled: boolean): void {
    const channel = this.config.channels.find(c => c.type === type);
    if (channel) {
      channel.enabled = enabled;
    }
  }

  /**
   * Força resolução de todos os alertas (para testes)
   */
  async resolveAllAlerts(): Promise<void> {
    for (const alertId of this.activeAlerts.keys()) {
      await this.resolveAlert(alertId);
    }
  }
}

// Instância singleton
export const alertManager = new AlertManager();