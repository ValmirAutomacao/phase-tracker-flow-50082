/**
 * Health Checker - Sistema de Monitoramento EngFlow
 *
 * Sistema abrangente de verificação de saúde incluindo:
 * - Database connectivity
 * - API performance
 * - RLS status
 * - Error rate tracking
 * - Performance metrics
 */

import { supabase } from '../supabaseClient';

export interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'critical';
  timestamp: string;
  checks: {
    database: DatabaseHealth;
    api: ApiHealth;
    security: SecurityHealth;
    performance: PerformanceHealth;
  };
  summary: {
    score: number; // 0-100
    criticalIssues: number;
    warnings: number;
    recommendations: string[];
  };
}

interface DatabaseHealth {
  status: 'healthy' | 'warning' | 'critical';
  connection: boolean;
  responseTime: number;
  activeConnections?: number;
  errors: string[];
}

interface ApiHealth {
  status: 'healthy' | 'warning' | 'critical';
  endpoints: EndpointHealth[];
  averageResponseTime: number;
  errorRate: number;
  errors: string[];
}

interface SecurityHealth {
  status: 'healthy' | 'warning' | 'critical';
  rlsEnabled: boolean;
  tablesWithoutRLS: string[];
  securityViolations: number;
  errors: string[];
}

interface PerformanceHealth {
  status: 'healthy' | 'warning' | 'critical';
  cacheHitRate: number;
  slowQueries: number;
  memoryUsage: number;
  errors: string[];
}

interface EndpointHealth {
  endpoint: string;
  status: number;
  responseTime: number;
  lastChecked: string;
}

// Thresholds para alertas
const THRESHOLDS = {
  database: {
    responseTime: { warning: 500, critical: 2000 },
    connections: { warning: 80, critical: 95 }
  },
  api: {
    responseTime: { warning: 500, critical: 1000 },
    errorRate: { warning: 0.1, critical: 5 }
  },
  performance: {
    cacheHitRate: { warning: 70, critical: 50 },
    slowQueries: { warning: 5, critical: 10 }
  }
};

export class HealthChecker {
  /**
   * Executa verificação completa de saúde do sistema
   */
  async checkSystemHealth(): Promise<HealthCheckResult> {
    const timestamp = new Date().toISOString();

    try {
      // Executar todas as verificações em paralelo
      const [database, api, security, performance] = await Promise.all([
        this.checkDatabaseHealth(),
        this.checkApiHealth(),
        this.checkSecurityHealth(),
        this.checkPerformanceHealth()
      ]);

      // Calcular status geral e score
      const summary = this.calculateSummary({ database, api, security, performance });

      const overallStatus = this.determineOverallStatus(summary);

      return {
        status: overallStatus,
        timestamp,
        checks: { database, api, security, performance },
        summary
      };
    } catch (error) {
      console.error('Health check failed:', error);

      return {
        status: 'critical',
        timestamp,
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
          recommendations: ['Sistema inacessível - verificar conectividade e configurações']
        }
      };
    }
  }

  /**
   * Verifica saúde do banco de dados
   */
  private async checkDatabaseHealth(): Promise<DatabaseHealth> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // Teste de conectividade básica
      const { data, error } = await supabase
        .from('clientes')
        .select('count')
        .limit(1);

      const responseTime = Date.now() - startTime;

      if (error) {
        errors.push(`Database connectivity error: ${error.message}`);
        return {
          status: 'critical',
          connection: false,
          responseTime,
          errors
        };
      }

      // Verificar response time
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (responseTime > THRESHOLDS.database.responseTime.critical) {
        status = 'critical';
        errors.push(`Critical response time: ${responseTime}ms`);
      } else if (responseTime > THRESHOLDS.database.responseTime.warning) {
        status = 'warning';
        errors.push(`High response time: ${responseTime}ms`);
      }

      return {
        status,
        connection: true,
        responseTime,
        errors
      };
    } catch (error) {
      return {
        status: 'critical',
        connection: false,
        responseTime: Date.now() - startTime,
        errors: [`Database check failed: ${error.message}`]
      };
    }
  }

  /**
   * Verifica saúde das APIs
   */
  private async checkApiHealth(): Promise<ApiHealth> {
    const endpoints = ['clientes', 'obras', 'setores', 'funcoes', 'funcionarios', 'despesas', 'videos', 'requisicoes'];
    const endpointResults: EndpointHealth[] = [];
    const errors: string[] = [];

    // Verificar cada endpoint
    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        const { error } = await supabase
          .from(endpoint)
          .select('*')
          .limit(1);

        const responseTime = Date.now() - startTime;

        endpointResults.push({
          endpoint,
          status: error ? 500 : 200,
          responseTime,
          lastChecked: new Date().toISOString()
        });

        if (error) {
          errors.push(`${endpoint}: ${error.message}`);
        }
      } catch (error) {
        endpointResults.push({
          endpoint,
          status: 500,
          responseTime: 0,
          lastChecked: new Date().toISOString()
        });
        errors.push(`${endpoint}: ${error.message}`);
      }
    }

    // Calcular métricas
    const successfulRequests = endpointResults.filter(r => r.status === 200);
    const averageResponseTime = successfulRequests.length > 0
      ? successfulRequests.reduce((sum, r) => sum + r.responseTime, 0) / successfulRequests.length
      : 0;

    const errorRate = ((endpoints.length - successfulRequests.length) / endpoints.length) * 100;

    // Determinar status
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (errorRate > THRESHOLDS.api.errorRate.critical) {
      status = 'critical';
    } else if (errorRate > THRESHOLDS.api.errorRate.warning ||
               averageResponseTime > THRESHOLDS.api.responseTime.warning) {
      status = 'warning';
    }

    return {
      status,
      endpoints: endpointResults,
      averageResponseTime,
      errorRate,
      errors
    };
  }

  /**
   * Verifica segurança (RLS, políticas)
   */
  private async checkSecurityHealth(): Promise<SecurityHealth> {
    const errors: string[] = [];
    const tablesWithoutRLS: string[] = [];

    try {
      // Verificar RLS nas tabelas principais
      const tables = ['clientes', 'obras', 'setores', 'funcoes', 'funcionarios', 'despesas', 'videos', 'requisicoes'];

      for (const table of tables) {
        try {
          // Tentar verificar se RLS está ativo (método indireto)
          const { error } = await supabase
            .from(table)
            .select('*')
            .limit(1);

          if (error && error.message.includes('row-level security')) {
            // RLS está ativo (bom)
            continue;
          } else if (!error) {
            // Conseguiu acessar sem autenticação (possível problema)
            tablesWithoutRLS.push(table);
          }
        } catch (err) {
          errors.push(`Error checking RLS for ${table}: ${err.message}`);
        }
      }

      const rlsEnabled = tablesWithoutRLS.length === 0;
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';

      if (!rlsEnabled) {
        status = 'critical';
        errors.push(`Tables without RLS: ${tablesWithoutRLS.join(', ')}`);
      }

      return {
        status,
        rlsEnabled,
        tablesWithoutRLS,
        securityViolations: tablesWithoutRLS.length,
        errors
      };
    } catch (error) {
      return {
        status: 'critical',
        rlsEnabled: false,
        tablesWithoutRLS: [],
        securityViolations: 1,
        errors: [`Security check failed: ${error.message}`]
      };
    }
  }

  /**
   * Verifica performance (cache, queries lentas)
   */
  private async checkPerformanceHealth(): Promise<PerformanceHealth> {
    const errors: string[] = [];

    try {
      // Simular verificação de cache hit rate
      // Em produção, isso viria do React Query DevTools ou métricas do Supabase
      const cacheHitRate = 85; // Placeholder - implementar métricas reais

      // Simular verificação de queries lentas
      const slowQueries = 2; // Placeholder - verificar logs do Supabase

      // Simular uso de memória
      const memoryUsage = 45; // Placeholder - métricas do browser/sistema

      let status: 'healthy' | 'warning' | 'critical' = 'healthy';

      if (cacheHitRate < THRESHOLDS.performance.cacheHitRate.critical ||
          slowQueries > THRESHOLDS.performance.slowQueries.critical) {
        status = 'critical';
        errors.push('Critical performance issues detected');
      } else if (cacheHitRate < THRESHOLDS.performance.cacheHitRate.warning ||
                 slowQueries > THRESHOLDS.performance.slowQueries.warning) {
        status = 'warning';
        errors.push('Performance degradation detected');
      }

      return {
        status,
        cacheHitRate,
        slowQueries,
        memoryUsage,
        errors
      };
    } catch (error) {
      return {
        status: 'critical',
        cacheHitRate: 0,
        slowQueries: 0,
        memoryUsage: 100,
        errors: [`Performance check failed: ${error.message}`]
      };
    }
  }

  /**
   * Calcula resumo e score geral
   */
  private calculateSummary(checks: {
    database: DatabaseHealth;
    api: ApiHealth;
    security: SecurityHealth;
    performance: PerformanceHealth;
  }) {
    const allChecks = Object.values(checks);
    const criticalIssues = allChecks.filter(c => c.status === 'critical').length;
    const warnings = allChecks.filter(c => c.status === 'warning').length;

    // Calcular score (0-100)
    let score = 100;
    score -= criticalIssues * 25; // -25 por cada issue crítico
    score -= warnings * 10; // -10 por cada warning
    score = Math.max(0, score);

    // Gerar recomendações
    const recommendations: string[] = [];

    if (checks.database.status !== 'healthy') {
      recommendations.push('Verificar conectividade e performance do banco de dados');
    }
    if (checks.api.status !== 'healthy') {
      recommendations.push('Otimizar endpoints com alta latência ou errors');
    }
    if (checks.security.status !== 'healthy') {
      recommendations.push('Revisar e corrigir políticas RLS');
    }
    if (checks.performance.status !== 'healthy') {
      recommendations.push('Otimizar cache e queries lentas');
    }

    return {
      score,
      criticalIssues,
      warnings,
      recommendations
    };
  }

  /**
   * Determina status geral do sistema
   */
  private determineOverallStatus(summary: { criticalIssues: number; warnings: number }): 'healthy' | 'warning' | 'critical' {
    if (summary.criticalIssues > 0) {
      return 'critical';
    }
    if (summary.warnings > 0) {
      return 'warning';
    }
    return 'healthy';
  }

  /**
   * Verifica se alertas devem ser disparados
   */
  async shouldTriggerAlerts(result: HealthCheckResult): Promise<{
    critical: boolean;
    warning: boolean;
    notifications: string[];
  }> {
    const notifications: string[] = [];

    const critical = result.status === 'critical';
    const warning = result.status === 'warning';

    if (critical) {
      notifications.push(`🚨 CRITICAL: Sistema com ${result.summary.criticalIssues} problemas críticos`);
      notifications.push(`Score de saúde: ${result.summary.score}/100`);
    }

    if (warning) {
      notifications.push(`⚠️ WARNING: Sistema com ${result.summary.warnings} avisos`);
    }

    // Adicionar recomendações específicas
    result.summary.recommendations.forEach(rec => {
      notifications.push(`📋 Recomendação: ${rec}`);
    });

    return {
      critical,
      warning,
      notifications
    };
  }
}

// Instância singleton
export const healthChecker = new HealthChecker();