#!/usr/bin/env tsx
/**
 * Script de Diagnóstico de Performance - EngFlow System
 *
 * Executa testes de performance e analisa métricas do sistema
 *
 * Uso:
 *   npm run diagnose:performance
 *   npx tsx scripts/diagnose-performance.ts
 */

import { supabase } from '../src/lib/supabaseClient';

interface PerformanceReport {
  executedAt: string;
  databasePerformance: DatabasePerformance;
  apiPerformance: ApiPerformance;
  frontendPerformance: FrontendPerformance;
  recommendations: string[];
  score: number;
}

interface DatabasePerformance {
  connectionTime: number;
  queryPerformance: QueryPerformance[];
  averageResponseTime: number;
  slowQueries: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

interface QueryPerformance {
  operation: string;
  table: string;
  responseTime: number;
  recordCount: number;
  throughput: number; // records/second
}

interface ApiPerformance {
  endpoints: EndpointPerformance[];
  averageResponseTime: number;
  throughputScore: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

interface EndpointPerformance {
  endpoint: string;
  method: string;
  responseTime: number;
  status: number;
  recordsReturned: number;
}

interface FrontendPerformance {
  cacheHitRate: number;
  bundleSize: number;
  loadTime: number;
  interactiveTime: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

// Thresholds de performance
const PERFORMANCE_THRESHOLDS = {
  database: {
    excellent: 100,
    good: 300,
    warning: 500,
    critical: 1000
  },
  api: {
    excellent: 200,
    good: 500,
    warning: 1000,
    critical: 2000
  },
  cache: {
    excellent: 90,
    good: 80,
    warning: 70,
    critical: 50
  }
};

async function main() {
  console.log('⚡ DIAGNÓSTICO DE PERFORMANCE - ENGFLOW SYSTEM');
  console.log('=============================================');
  console.log('');

  try {
    console.log('🔄 Iniciando testes de performance...');

    // 1. Testar performance do banco
    console.log('📊 1. Testando Performance do Banco de Dados...');
    const databasePerf = await testDatabasePerformance();

    // 2. Testar performance das APIs
    console.log('🌐 2. Testando Performance das APIs...');
    const apiPerf = await testApiPerformance();

    // 3. Analisar performance do frontend
    console.log('💻 3. Analisando Performance do Frontend...');
    const frontendPerf = await analyzeFrontendPerformance();

    // 4. Gerar relatório
    console.log('📋 4. Gerando Relatório de Performance...');
    const report = generatePerformanceReport(databasePerf, apiPerf, frontendPerf);

    // 5. Exibir resultados
    displayPerformanceResults(report);

    // 6. Salvar relatório
    await savePerformanceReport(report);

    // 7. Exit code baseado no score
    const exitCode = report.score >= 80 ? 0 :
                    report.score >= 60 ? 1 : 2;

    console.log('');
    console.log(`✅ Diagnóstico de performance concluído. Score: ${report.score}/100`);
    process.exit(exitCode);

  } catch (error) {
    console.error('❌ Erro durante diagnóstico de performance:', error);
    console.log('');
    console.log('🚨 DIAGNÓSTICO DE PERFORMANCE FALHOU');
    process.exit(3);
  }
}

async function testDatabasePerformance(): Promise<DatabasePerformance> {
  const queries: QueryPerformance[] = [];
  const tables = ['clientes', 'obras', 'setores', 'funcoes', 'funcionarios', 'despesas', 'videos', 'requisicoes'];

  let totalResponseTime = 0;
  let slowQueries = 0;

  // Teste de conectividade
  const connectionStart = Date.now();
  try {
    await supabase.from('clientes').select('count').limit(1);
  } catch (error) {
    // Connection test
  }
  const connectionTime = Date.now() - connectionStart;

  // Testar cada tabela
  for (const table of tables) {
    try {
      // SELECT simples
      const selectStart = Date.now();
      const { data: selectData, count: selectCount } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(10);
      const selectTime = Date.now() - selectStart;

      const recordCount = selectData?.length || 0;
      const throughput = recordCount > 0 ? recordCount / (selectTime / 1000) : 0;

      queries.push({
        operation: 'SELECT',
        table,
        responseTime: selectTime,
        recordCount,
        throughput
      });

      totalResponseTime += selectTime;
      if (selectTime > PERFORMANCE_THRESHOLDS.database.warning) {
        slowQueries++;
      }

      // Pequena pausa entre queries
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.warn(`⚠️ Erro testando tabela ${table}:`, error.message);
    }
  }

  const averageResponseTime = totalResponseTime / queries.length;

  // Determinar status
  let status: 'excellent' | 'good' | 'warning' | 'critical';
  if (averageResponseTime <= PERFORMANCE_THRESHOLDS.database.excellent) {
    status = 'excellent';
  } else if (averageResponseTime <= PERFORMANCE_THRESHOLDS.database.good) {
    status = 'good';
  } else if (averageResponseTime <= PERFORMANCE_THRESHOLDS.database.warning) {
    status = 'warning';
  } else {
    status = 'critical';
  }

  return {
    connectionTime,
    queryPerformance: queries,
    averageResponseTime,
    slowQueries,
    status
  };
}

async function testApiPerformance(): Promise<ApiPerformance> {
  const endpoints: EndpointPerformance[] = [];
  const tables = ['clientes', 'obras', 'setores', 'funcoes', 'funcionarios', 'despesas', 'videos', 'requisicoes'];

  let totalResponseTime = 0;

  for (const table of tables) {
    try {
      // GET request
      const start = Date.now();
      const { data, status, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(5);
      const responseTime = Date.now() - start;

      endpoints.push({
        endpoint: `/rest/v1/${table}`,
        method: 'GET',
        responseTime,
        status: status === 200 ? 200 : status || 500,
        recordsReturned: data?.length || 0
      });

      totalResponseTime += responseTime;

      // Pequena pausa
      await new Promise(resolve => setTimeout(resolve, 50));

    } catch (error) {
      endpoints.push({
        endpoint: `/rest/v1/${table}`,
        method: 'GET',
        responseTime: 0,
        status: 500,
        recordsReturned: 0
      });
    }
  }

  const averageResponseTime = totalResponseTime / endpoints.length;
  const successfulRequests = endpoints.filter(e => e.status === 200);
  const throughputScore = (successfulRequests.length / endpoints.length) * 100;

  // Determinar status
  let status: 'excellent' | 'good' | 'warning' | 'critical';
  if (averageResponseTime <= PERFORMANCE_THRESHOLDS.api.excellent && throughputScore >= 95) {
    status = 'excellent';
  } else if (averageResponseTime <= PERFORMANCE_THRESHOLDS.api.good && throughputScore >= 90) {
    status = 'good';
  } else if (averageResponseTime <= PERFORMANCE_THRESHOLDS.api.warning && throughputScore >= 80) {
    status = 'warning';
  } else {
    status = 'critical';
  }

  return {
    endpoints,
    averageResponseTime,
    throughputScore,
    status
  };
}

async function analyzeFrontendPerformance(): Promise<FrontendPerformance> {
  // Simular análise de performance do frontend
  // Em produção, isso viria de métricas reais do browser

  const cacheHitRate = 85; // Placeholder - integrar com React Query DevTools
  const bundleSize = 1.2; // MB - verificar build stats
  const loadTime = 800; // ms - Time to First Byte
  const interactiveTime = 1200; // ms - Time to Interactive

  // Determinar status baseado nas métricas
  let status: 'excellent' | 'good' | 'warning' | 'critical';

  if (cacheHitRate >= PERFORMANCE_THRESHOLDS.cache.excellent &&
      loadTime <= 500 && interactiveTime <= 1000) {
    status = 'excellent';
  } else if (cacheHitRate >= PERFORMANCE_THRESHOLDS.cache.good &&
             loadTime <= 1000 && interactiveTime <= 2000) {
    status = 'good';
  } else if (cacheHitRate >= PERFORMANCE_THRESHOLDS.cache.warning &&
             loadTime <= 2000 && interactiveTime <= 3000) {
    status = 'warning';
  } else {
    status = 'critical';
  }

  return {
    cacheHitRate,
    bundleSize,
    loadTime,
    interactiveTime,
    status
  };
}

function generatePerformanceReport(
  database: DatabasePerformance,
  api: ApiPerformance,
  frontend: FrontendPerformance
): PerformanceReport {
  const recommendations: string[] = [];

  // Score baseado nos componentes
  const dbScore = getStatusScore(database.status);
  const apiScore = getStatusScore(api.status);
  const frontendScore = getStatusScore(frontend.status);

  const score = Math.round((dbScore + apiScore + frontendScore) / 3);

  // Gerar recomendações baseadas nos resultados
  if (database.status !== 'excellent') {
    recommendations.push(`Database: Avg response ${database.averageResponseTime}ms - otimizar queries`);
    if (database.slowQueries > 0) {
      recommendations.push(`${database.slowQueries} queries lentas detectadas - revisar índices`);
    }
  }

  if (api.status !== 'excellent') {
    recommendations.push(`APIs: Avg response ${api.averageResponseTime}ms - otimizar endpoints`);
    if (api.throughputScore < 90) {
      recommendations.push(`Taxa de sucesso ${api.throughputScore.toFixed(1)}% - verificar errors`);
    }
  }

  if (frontend.status !== 'excellent') {
    recommendations.push(`Frontend: Cache hit rate ${frontend.cacheHitRate}% - otimizar cache`);
    if (frontend.loadTime > 1000) {
      recommendations.push(`Load time ${frontend.loadTime}ms - otimizar bundle e assets`);
    }
  }

  if (score < 80) {
    recommendations.push('Performance geral abaixo do ideal - implementar otimizações');
  }

  return {
    executedAt: new Date().toISOString(),
    databasePerformance: database,
    apiPerformance: api,
    frontendPerformance: frontend,
    recommendations,
    score
  };
}

function getStatusScore(status: string): number {
  switch (status) {
    case 'excellent': return 100;
    case 'good': return 80;
    case 'warning': return 60;
    case 'critical': return 30;
    default: return 0;
  }
}

function displayPerformanceResults(report: PerformanceReport) {
  console.log('');
  console.log('⚡ RELATÓRIO DE PERFORMANCE');
  console.log('==========================');
  console.log('');

  // Score geral
  const scoreEmoji = report.score >= 90 ? '🚀' :
                    report.score >= 80 ? '✅' :
                    report.score >= 60 ? '⚠️' : '🚨';
  console.log(`${scoreEmoji} SCORE GERAL: ${report.score}/100`);
  console.log('');

  // Database Performance
  const dbEmoji = getStatusEmoji(report.databasePerformance.status);
  console.log(`${dbEmoji} DATABASE PERFORMANCE: ${report.databasePerformance.status.toUpperCase()}`);
  console.log(`  🔄 Connection Time: ${report.databasePerformance.connectionTime}ms`);
  console.log(`  📊 Avg Response Time: ${report.databasePerformance.averageResponseTime.toFixed(1)}ms`);
  console.log(`  🐌 Slow Queries: ${report.databasePerformance.slowQueries}`);
  console.log('');

  // Queries mais lentas
  const slowestQueries = report.databasePerformance.queryPerformance
    .sort((a, b) => b.responseTime - a.responseTime)
    .slice(0, 3);

  if (slowestQueries.length > 0) {
    console.log('  🐌 Queries Mais Lentas:');
    slowestQueries.forEach(q => {
      console.log(`    • ${q.table} (${q.operation}): ${q.responseTime}ms`);
    });
    console.log('');
  }

  // API Performance
  const apiEmoji = getStatusEmoji(report.apiPerformance.status);
  console.log(`${apiEmoji} API PERFORMANCE: ${report.apiPerformance.status.toUpperCase()}`);
  console.log(`  🌐 Avg Response Time: ${report.apiPerformance.averageResponseTime.toFixed(1)}ms`);
  console.log(`  ✅ Success Rate: ${report.apiPerformance.throughputScore.toFixed(1)}%`);
  console.log('');

  // Endpoints mais lentos
  const slowestEndpoints = report.apiPerformance.endpoints
    .filter(e => e.status === 200)
    .sort((a, b) => b.responseTime - a.responseTime)
    .slice(0, 3);

  if (slowestEndpoints.length > 0) {
    console.log('  🐌 Endpoints Mais Lentos:');
    slowestEndpoints.forEach(e => {
      console.log(`    • ${e.endpoint}: ${e.responseTime}ms`);
    });
    console.log('');
  }

  // Frontend Performance
  const frontendEmoji = getStatusEmoji(report.frontendPerformance.status);
  console.log(`${frontendEmoji} FRONTEND PERFORMANCE: ${report.frontendPerformance.status.toUpperCase()}`);
  console.log(`  💾 Cache Hit Rate: ${report.frontendPerformance.cacheHitRate}%`);
  console.log(`  📦 Bundle Size: ${report.frontendPerformance.bundleSize}MB`);
  console.log(`  ⚡ Load Time: ${report.frontendPerformance.loadTime}ms`);
  console.log(`  🎯 Interactive Time: ${report.frontendPerformance.interactiveTime}ms`);
  console.log('');

  // Recomendações
  if (report.recommendations.length > 0) {
    console.log('💡 RECOMENDAÇÕES DE OTIMIZAÇÃO:');
    report.recommendations.forEach(rec => console.log(`  • ${rec}`));
    console.log('');
  }
}

function getStatusEmoji(status: string): string {
  switch (status) {
    case 'excellent': return '🚀';
    case 'good': return '✅';
    case 'warning': return '⚠️';
    case 'critical': return '🚨';
    default: return '❓';
  }
}

async function savePerformanceReport(report: PerformanceReport) {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');

    const logsDir = path.join(process.cwd(), 'logs');
    await fs.mkdir(logsDir, { recursive: true });

    const filename = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(logsDir, filename);

    await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    console.log(`📄 Relatório de performance salvo em: ${filepath}`);
  } catch (error) {
    console.warn('⚠️ Não foi possível salvar o relatório:', error.message);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}