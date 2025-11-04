#!/usr/bin/env tsx
/**
 * Simple Health Check Script - EngFlow System
 *
 * Executa verificação simplificada de saúde do sistema
 */

// Configurar ambiente primeiro
import './config.js';
import { supabase } from './supabase-client.js';

interface SimpleHealthResult {
  timestamp: string;
  supabaseConnection: boolean;
  tablesAccessible: number;
  totalTables: number;
  averageResponseTime: number;
  errors: string[];
  status: 'healthy' | 'warning' | 'critical';
  score: number;
}

async function main() {
  console.log('🔍 VERIFICAÇÃO RÁPIDA DE SAÚDE - ENGFLOW SYSTEM');
  console.log('==============================================');
  console.log('');

  const result = await performSimpleHealthCheck();
  displayResults(result);

  // Exit code baseado no status
  const exitCode = result.status === 'healthy' ? 0 :
                  result.status === 'warning' ? 1 : 2;

  process.exit(exitCode);
}

async function performSimpleHealthCheck(): Promise<SimpleHealthResult> {
  const timestamp = new Date().toISOString();
  const errors: string[] = [];
  const tables = ['clientes', 'obras', 'setores', 'funcoes', 'funcionarios', 'despesas', 'videos', 'requisicoes'];

  let supabaseConnection = false;
  let tablesAccessible = 0;
  let totalResponseTime = 0;
  const responseTimes: number[] = [];

  console.log('📊 Testando conectividade com Supabase...');

  // Teste básico de conectividade
  try {
    const startTime = Date.now();
    const { error } = await supabase
      .from('clientes')
      .select('count')
      .limit(1);

    const responseTime = Date.now() - startTime;
    responseTimes.push(responseTime);

    if (!error) {
      supabaseConnection = true;
      console.log(`  ✅ Conectado ao Supabase (${responseTime}ms)`);
    } else {
      errors.push(`Conexão Supabase: ${error.message}`);
      console.log(`  ❌ Falha na conexão: ${error.message}`);
    }
  } catch (error) {
    errors.push(`Erro de conectividade: ${error.message}`);
    console.log(`  ❌ Erro de conectividade: ${error.message}`);
  }

  // Testar acesso às tabelas
  console.log('📋 Testando acesso às tabelas...');

  for (const table of tables) {
    try {
      const startTime = Date.now();
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      const responseTime = Date.now() - startTime;
      responseTimes.push(responseTime);
      totalResponseTime += responseTime;

      if (!error) {
        tablesAccessible++;
        console.log(`  ✅ ${table} (${responseTime}ms)`);
      } else {
        errors.push(`Tabela ${table}: ${error.message}`);
        console.log(`  ❌ ${table}: ${error.message}`);
      }

      // Pequena pausa entre requests
      await new Promise(resolve => setTimeout(resolve, 50));

    } catch (error) {
      errors.push(`Erro na tabela ${table}: ${error.message}`);
      console.log(`  ❌ ${table}: ${error.message}`);
    }
  }

  // Calcular métricas
  const averageResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length
    : 0;

  // Determinar status e score
  let status: 'healthy' | 'warning' | 'critical';
  let score = 100;

  if (!supabaseConnection) {
    status = 'critical';
    score = 0;
  } else if (tablesAccessible === tables.length && averageResponseTime < 500) {
    status = 'healthy';
    score = 100;
  } else if (tablesAccessible >= tables.length * 0.8 && averageResponseTime < 1000) {
    status = 'warning';
    score = 75;
  } else {
    status = 'critical';
    score = 25;
  }

  // Ajustar score baseado em problemas
  score -= (tables.length - tablesAccessible) * 10; // -10 por tabela inacessível
  if (averageResponseTime > 500) score -= 10;
  if (averageResponseTime > 1000) score -= 15;

  score = Math.max(0, Math.min(100, score));

  return {
    timestamp,
    supabaseConnection,
    tablesAccessible,
    totalTables: tables.length,
    averageResponseTime,
    errors,
    status,
    score
  };
}

function displayResults(result: SimpleHealthResult) {
  console.log('');
  console.log('📋 RESULTADO DA VERIFICAÇÃO');
  console.log('===========================');
  console.log('');

  // Status geral
  const statusEmoji = result.status === 'healthy' ? '✅' :
                     result.status === 'warning' ? '⚠️' : '🚨';
  console.log(`${statusEmoji} STATUS GERAL: ${result.status.toUpperCase()}`);
  console.log(`📊 SCORE DE SAÚDE: ${result.score}/100`);
  console.log('');

  // Conectividade
  const connEmoji = result.supabaseConnection ? '✅' : '🚨';
  console.log(`${connEmoji} CONECTIVIDADE:`);
  console.log(`  📡 Supabase: ${result.supabaseConnection ? 'Conectado' : 'Falhou'}`);
  console.log(`  📊 Tabelas acessíveis: ${result.tablesAccessible}/${result.totalTables}`);
  console.log(`  ⚡ Tempo de resposta médio: ${result.averageResponseTime.toFixed(0)}ms`);
  console.log('');

  // Análise de performance
  if (result.averageResponseTime > 0) {
    if (result.averageResponseTime < 300) {
      console.log('🚀 PERFORMANCE: Excelente');
    } else if (result.averageResponseTime < 500) {
      console.log('✅ PERFORMANCE: Boa');
    } else if (result.averageResponseTime < 1000) {
      console.log('⚠️ PERFORMANCE: Degradada');
    } else {
      console.log('🚨 PERFORMANCE: Crítica');
    }
    console.log('');
  }

  // Problemas encontrados
  if (result.errors.length > 0) {
    console.log('🚨 PROBLEMAS ENCONTRADOS:');
    result.errors.forEach(error => console.log(`  • ${error}`));
    console.log('');
  }

  // Recomendações
  console.log('💡 RECOMENDAÇÕES:');

  if (!result.supabaseConnection) {
    console.log('  🔧 Verificar configuração VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
    console.log('  🌐 Verificar conectividade de rede');
    console.log('  📋 Verificar status do projeto Supabase');
  } else if (result.tablesAccessible < result.totalTables) {
    console.log('  🔒 Verificar permissões de acesso às tabelas');
    console.log('  📊 Verificar políticas RLS se configuradas');
  } else if (result.averageResponseTime > 500) {
    console.log('  ⚡ Otimizar queries do banco de dados');
    console.log('  📈 Verificar performance do Supabase');
  } else {
    console.log('  ✅ Sistema funcionando dentro dos parâmetros normais');
    console.log('  📊 Continuar monitoramento regular');
  }

  console.log('');

  // Comandos úteis
  console.log('🛠️ COMANDOS ÚTEIS:');
  console.log('  npm run diagnose:performance    - Teste de performance detalhado');
  console.log('  npm run diagnose:connection     - Teste de conectividade completo');
  console.log('  npm run monitoring:start        - Iniciar monitoramento contínuo');
  console.log('');
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erro durante verificação:', error);
    process.exit(3);
  });
}