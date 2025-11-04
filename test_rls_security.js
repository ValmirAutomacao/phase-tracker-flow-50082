// Teste crítico de segurança RLS - Verificação de bloqueio anônimo
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ibnrtvrxogkksldvxici.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlibnJ0dnJ4b2dra3NsZHZ4aWNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NDkxMTQsImV4cCI6MjA3NzMyNTExNH0.VcedR4bpqo__fVsnrdYLc09sZVONZovtsQT4kM4r0u0';

// Cliente anônimo - deve ser bloqueado
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAnonSecurity() {
  console.log('🔒 TESTE CRÍTICO DE SEGURANÇA RLS - USUÁRIO ANÔNIMO');
  console.log('=' .repeat(60));

  const tables = ['clientes', 'obras', 'funcionarios', 'funcoes', 'setores', 'despesas', 'videos', 'requisicoes'];

  for (const table of tables) {
    console.log(`\n📊 Testando tabela: ${table}`);

    // Teste 1: SELECT deve ser bloqueado
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`✅ SELECT bloqueado: ${error.message}`);
      } else {
        console.log(`❌ FALHA DE SEGURANÇA: SELECT permitido para anônimo! Dados: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      console.log(`✅ SELECT bloqueado: ${err.message}`);
    }

    // Teste 2: INSERT deve ser bloqueado
    try {
      const testData = getTestData(table);
      const { data, error } = await supabase.from(table).insert([testData]);
      if (error) {
        console.log(`✅ INSERT bloqueado: ${error.message}`);
      } else {
        console.log(`❌ FALHA CRÍTICA: INSERT permitido para anônimo! ID: ${data?.[0]?.id}`);
      }
    } catch (err) {
      console.log(`✅ INSERT bloqueado: ${err.message}`);
    }

    // Teste 3: UPDATE deve ser bloqueado
    try {
      const { data, error } = await supabase.from(table).update({ nome: 'HACKED' }).eq('id', '00000000-0000-0000-0000-000000000000');
      if (error) {
        console.log(`✅ UPDATE bloqueado: ${error.message}`);
      } else {
        console.log(`❌ FALHA CRÍTICA: UPDATE permitido para anônimo!`);
      }
    } catch (err) {
      console.log(`✅ UPDATE bloqueado: ${err.message}`);
    }

    // Teste 4: DELETE deve ser bloqueado
    try {
      const { data, error } = await supabase.from(table).delete().eq('id', '00000000-0000-0000-0000-000000000000');
      if (error) {
        console.log(`✅ DELETE bloqueado: ${error.message}`);
      } else {
        console.log(`❌ FALHA CRÍTICA: DELETE permitido para anônimo!`);
      }
    } catch (err) {
      console.log(`✅ DELETE bloqueado: ${err.message}`);
    }
  }

  console.log('\n🎯 RESULTADO DO TESTE DE SEGURANÇA:');
  console.log('Se todas as operações foram bloqueadas (✅), a segurança RLS está funcionando corretamente.');
  console.log('Se qualquer operação foi permitida (❌), há uma FALHA CRÍTICA DE SEGURANÇA.');
}

function getTestData(table) {
  const baseData = {
    nome: 'TESTE_ANON_HACK',
    created_at: new Date().toISOString()
  };

  switch (table) {
    case 'clientes':
      return { ...baseData, email: 'hack@anon.com', telefone: '00000000000' };
    case 'obras':
      return { ...baseData, descricao: 'HACK_OBRA', cliente_id: '00000000-0000-0000-0000-000000000000' };
    case 'funcionarios':
      return { ...baseData, email: 'hack@anon.com', funcao_id: '00000000-0000-0000-0000-000000000000', setor_id: '00000000-0000-0000-0000-000000000000' };
    case 'despesas':
      return { ...baseData, valor: 999999, obra_id: '00000000-0000-0000-0000-000000000000' };
    case 'videos':
      return { ...baseData, url: 'https://hack.com/video', obra_id: '00000000-0000-0000-0000-000000000000' };
    case 'requisicoes':
      return { ...baseData, descricao: 'HACK_REQ', obra_id: '00000000-0000-0000-0000-000000000000' };
    default:
      return baseData;
  }
}

testAnonSecurity().catch(console.error);