#!/usr/bin/env tsx
/**
 * Script de Diagnóstico de Conectividade - EngFlow System
 *
 * Testa conectividade com Supabase e APIs
 *
 * Uso:
 *   npm run diagnose:connection
 *   npx tsx scripts/diagnose-connection.ts
 */

import { supabase } from '../src/lib/supabaseClient';

interface ConnectionReport {
  executedAt: string;
  supabaseConnection: ConnectionTest;
  tableAccess: TableAccessTest[];
  apiEndpoints: ApiEndpointTest[];
  networkLatency: NetworkLatency;
  summary: ConnectionSummary;
}

interface ConnectionTest {
  success: boolean;
  responseTime: number;
  error?: string;
  projectUrl: string;
}

interface TableAccessTest {
  table: string;
  accessible: boolean;
  responseTime: number;
  recordCount: number;
  error?: string;
}

interface ApiEndpointTest {
  endpoint: string;
  method: string;
  status: number;
  responseTime: number;
  success: boolean;
  error?: string;
}

interface NetworkLatency {
  min: number;
  max: number;
  average: number;
  tests: number;
}

interface ConnectionSummary {
  overallStatus: 'excellent' | 'good' | 'warning' | 'critical';
  supabaseAvailable: boolean;
  tablesAccessible: number;
  totalTables: number;
  averageLatency: number;
  recommendations: string[];
}

async function main() {
  console.log('🌐 DIAGNÓSTICO DE CONECTIVIDADE - ENGFLOW SYSTEM');
  console.log('==============================================');
  console.log('');

  try {
    console.log('🔄 Iniciando testes de conectividade...');

    // 1. Testar conexão com Supabase
    console.log('📡 1. Testando Conexão com Supabase...');
    const supabaseConn = await testSupabaseConnection();

    // 2. Testar acesso às tabelas
    console.log('📊 2. Testando Acesso às Tabelas...');
    const tableAccess = await testTableAccess();

    // 3. Testar endpoints da API
    console.log('🌐 3. Testando Endpoints da API...');
    const apiEndpoints = await testApiEndpoints();

    // 4. Medir latência de rede
    console.log('⚡ 4. Medindo Latência de Rede...');
    const networkLatency = await measureNetworkLatency();

    // 5. Gerar relatório
    console.log('📋 5. Gerando Relatório de Conectividade...');
    const report = generateConnectionReport(supabaseConn, tableAccess, apiEndpoints, networkLatency);

    // 6. Exibir resultados
    displayConnectionResults(report);

    // 7. Salvar relatório
    await saveConnectionReport(report);

    // 8. Exit code baseado no status
    const exitCode = report.summary.overallStatus === 'excellent' || report.summary.overallStatus === 'good' ? 0 :
                    report.summary.overallStatus === 'warning' ? 1 : 2;

    console.log('');
    console.log(`✅ Diagnóstico de conectividade concluído. Status: ${report.summary.overallStatus}`);
    process.exit(exitCode);

  } catch (error) {
    console.error('❌ Erro durante diagnóstico de conectividade:', error);
    console.log('');
    console.log('🚨 DIAGNÓSTICO DE CONECTIVIDADE FALHOU');
    process.exit(3);
  }
}

async function testSupabaseConnection(): Promise<ConnectionTest> {
  const projectUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ibnrtvrxogkksldvxici.supabase.co';

  try {
    const startTime = Date.now();

    // Teste básico de conectividade
    const { data, error } = await supabase
      .from('clientes')
      .select('count')
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        success: false,
        responseTime,
        error: error.message,
        projectUrl
      };
    }

    return {
      success: true,
      responseTime,
      projectUrl
    };

  } catch (error) {
    return {
      success: false,
      responseTime: 0,
      error: error.message,
      projectUrl
    };
  }
}

async function testTableAccess(): Promise<TableAccessTest[]> {
  const tables = ['clientes', 'obras', 'setores', 'funcoes', 'funcionarios', 'despesas', 'videos', 'requisicoes'];
  const results: TableAccessTest[] = [];

  for (const table of tables) {
    try {
      const startTime = Date.now();

      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(1);

      const responseTime = Date.now() - startTime;

      if (error) {
        results.push({
          table,
          accessible: false,
          responseTime,
          recordCount: 0,
          error: error.message
        });
      } else {
        results.push({
          table,
          accessible: true,
          responseTime,
          recordCount: count || 0
        });
      }

      // Pequena pausa entre requests
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      results.push({
        table,
        accessible: false,
        responseTime: 0,
        recordCount: 0,
        error: error.message
      });
    }
  }

  return results;
}

async function testApiEndpoints(): Promise<ApiEndpointTest[]> {
  const endpoints = [
    { path: '/rest/v1/clientes', method: 'GET' },
    { path: '/rest/v1/obras', method: 'GET' },
    { path: '/rest/v1/setores', method: 'GET' },
    { path: '/rest/v1/funcoes', method: 'GET' },
    { path: '/rest/v1/funcionarios', method: 'GET' },
    { path: '/rest/v1/despesas', method: 'GET' },
    { path: '/rest/v1/videos', method: 'GET' },
    { path: '/rest/v1/requisicoes', method: 'GET' }
  ];

  const results: ApiEndpointTest[] = [];

  for (const endpoint of endpoints) {
    try {
      const startTime = Date.now();

      // Extrair nome da tabela do path
      const tableName = endpoint.path.split('/').pop();
      if (!tableName) continue;

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      const responseTime = Date.now() - startTime;

      results.push({
        endpoint: endpoint.path,
        method: endpoint.method,
        status: error ? 500 : 200,
        responseTime,
        success: !error,
        error: error?.message
      });

      // Pequena pausa
      await new Promise(resolve => setTimeout(resolve, 50));

    } catch (error) {
      results.push({
        endpoint: endpoint.path,
        method: endpoint.method,
        status: 500,
        responseTime: 0,
        success: false,
        error: error.message
      });
    }
  }

  return results;
}

async function measureNetworkLatency(): Promise<NetworkLatency> {
  const latencies: number[] = [];
  const testCount = 5;

  console.log(`   🔄 Executando ${testCount} testes de latência...`);

  for (let i = 0; i < testCount; i++) {
    try {
      const startTime = Date.now();

      // Ping simples via Supabase
      await supabase.from('clientes').select('count').limit(1);

      const latency = Date.now() - startTime;
      latencies.push(latency);

      // Pausa entre testes
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      // Se falhou, usar 0 como latência
      latencies.push(0);
    }
  }

  const validLatencies = latencies.filter(l => l > 0);

  if (validLatencies.length === 0) {
    return {
      min: 0,
      max: 0,
      average: 0,
      tests: testCount
    };
  }

  return {
    min: Math.min(...validLatencies),
    max: Math.max(...validLatencies),
    average: validLatencies.reduce((sum, l) => sum + l, 0) / validLatencies.length,
    tests: testCount
  };
}

function generateConnectionReport(
  supabaseConn: ConnectionTest,
  tableAccess: TableAccessTest[],
  apiEndpoints: ApiEndpointTest[],
  networkLatency: NetworkLatency
): ConnectionReport {
  const accessibleTables = tableAccess.filter(t => t.accessible).length;
  const totalTables = tableAccess.length;
  const successfulEndpoints = apiEndpoints.filter(e => e.success).length;

  // Determinar status geral
  let overallStatus: 'excellent' | 'good' | 'warning' | 'critical';

  if (!supabaseConn.success) {
    overallStatus = 'critical';
  } else if (accessibleTables === totalTables &&
             successfulEndpoints === apiEndpoints.length &&
             networkLatency.average < 300) {
    overallStatus = 'excellent';
  } else if (accessibleTables >= totalTables * 0.8 &&
             successfulEndpoints >= apiEndpoints.length * 0.8 &&
             networkLatency.average < 500) {
    overallStatus = 'good';
  } else if (accessibleTables >= totalTables * 0.6 &&
             successfulEndpoints >= apiEndpoints.length * 0.6) {
    overallStatus = 'warning';
  } else {
    overallStatus = 'critical';
  }

  // Gerar recomendações
  const recommendations: string[] = [];

  if (!supabaseConn.success) {
    recommendations.push('🚨 Verificar configuração VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
    recommendations.push('🔍 Verificar status do projeto Supabase');
  }

  if (accessibleTables < totalTables) {
    recommendations.push(`📊 ${totalTables - accessibleTables} tabelas inacessíveis - verificar permissões`);
  }

  if (networkLatency.average > 500) {
    recommendations.push(`⚡ Latência alta (${networkLatency.average.toFixed(0)}ms) - verificar conexão`);
  }

  if (successfulEndpoints < apiEndpoints.length) {
    recommendations.push(`🌐 ${apiEndpoints.length - successfulEndpoints} endpoints com falha - verificar APIs`);
  }

  const summary: ConnectionSummary = {
    overallStatus,
    supabaseAvailable: supabaseConn.success,
    tablesAccessible: accessibleTables,
    totalTables,
    averageLatency: networkLatency.average,
    recommendations
  };

  return {
    executedAt: new Date().toISOString(),
    supabaseConnection: supabaseConn,
    tableAccess,
    apiEndpoints,
    networkLatency,
    summary
  };
}

function displayConnectionResults(report: ConnectionReport) {
  console.log('');
  console.log('🌐 RELATÓRIO DE CONECTIVIDADE');
  console.log('============================');
  console.log('');

  // Status geral
  const statusEmoji = getStatusEmoji(report.summary.overallStatus);
  console.log(`${statusEmoji} STATUS GERAL: ${report.summary.overallStatus.toUpperCase()}`);
  console.log('');

  // Conexão Supabase
  const supabaseEmoji = report.supabaseConnection.success ? '✅' : '🚨';
  console.log(`${supabaseEmoji} SUPABASE CONNECTION:`);
  console.log(`  📡 Status: ${report.supabaseConnection.success ? 'Conectado' : 'Falhou'}`);
  console.log(`  🌐 URL: ${report.supabaseConnection.projectUrl}`);
  console.log(`  ⚡ Response Time: ${report.supabaseConnection.responseTime}ms`);
  if (report.supabaseConnection.error) {
    console.log(`  ❌ Error: ${report.supabaseConnection.error}`);
  }
  console.log('');

  // Acesso às Tabelas
  console.log('📊 ACESSO ÀS TABELAS:');
  console.log(`  ✅ Acessíveis: ${report.summary.tablesAccessible}/${report.summary.totalTables}`);

  const inaccessibleTables = report.tableAccess.filter(t => !t.accessible);
  if (inaccessibleTables.length > 0) {
    console.log('  🚨 Tabelas com Problemas:');
    inaccessibleTables.forEach(table => {
      console.log(`    • ${table.table}: ${table.error || 'Erro desconhecido'}`);
    });
  }
  console.log('');

  // Latência de Rede
  console.log('⚡ LATÊNCIA DE REDE:');
  console.log(`  📊 Média: ${report.networkLatency.average.toFixed(0)}ms`);
  console.log(`  🔻 Mínima: ${report.networkLatency.min}ms`);
  console.log(`  🔺 Máxima: ${report.networkLatency.max}ms`);
  console.log(`  📋 Testes: ${report.networkLatency.tests}`);
  console.log('');

  // Endpoints da API
  const successfulEndpoints = report.apiEndpoints.filter(e => e.success).length;
  console.log('🌐 ENDPOINTS DA API:');
  console.log(`  ✅ Funcionando: ${successfulEndpoints}/${report.apiEndpoints.length}`);

  const failedEndpoints = report.apiEndpoints.filter(e => !e.success);
  if (failedEndpoints.length > 0) {
    console.log('  🚨 Endpoints com Falha:');
    failedEndpoints.forEach(endpoint => {
      console.log(`    • ${endpoint.method} ${endpoint.endpoint}: ${endpoint.error || 'Erro desconhecido'}`);
    });
  }
  console.log('');

  // Recomendações
  if (report.summary.recommendations.length > 0) {
    console.log('💡 RECOMENDAÇÕES:');
    report.summary.recommendations.forEach(rec => console.log(`  ${rec}`));
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

async function saveConnectionReport(report: ConnectionReport) {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');

    const logsDir = path.join(process.cwd(), 'logs');
    await fs.mkdir(logsDir, { recursive: true });

    const filename = `connection-report-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(logsDir, filename);

    await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    console.log(`📄 Relatório de conectividade salvo em: ${filepath}`);
  } catch (error) {
    console.warn('⚠️ Não foi possível salvar o relatório:', error.message);
  }
}

// Executar se chamado diretamente
if (import.meta.url.startsWith('file:') && process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch(console.error);
}