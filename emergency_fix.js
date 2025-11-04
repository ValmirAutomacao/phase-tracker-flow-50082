// MIGRAÇÃO DE EMERGÊNCIA via JavaScript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ibnrtvrxogkksldvxici.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlibnJ0dnJ4b2dra3NsZHZ4aWNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTc0OTExNCwiZXhwIjoyMDc3MzI1MTE0fQ.0k-j3OR4epb91GzlB7ivY6SJYw16kuP__K_ufPOuV28'; // SERVICE ROLE

const supabase = createClient(supabaseUrl, supabaseKey);

async function emergencySecurityFix() {
  console.log('🚨 EXECUTANDO MIGRAÇÃO DE EMERGÊNCIA DE SEGURANÇA RLS');

  const tables = ['clientes', 'obras', 'funcionarios', 'funcoes', 'setores', 'despesas', 'videos', 'requisicoes'];

  try {
    // Desabilitar RLS temporariamente
    console.log('📝 Desabilitando RLS...');
    for (const table of tables) {
      const { error } = await supabase.rpc('execute_sql', {
        sql: `ALTER TABLE public.${table} DISABLE ROW LEVEL SECURITY;`
      });
      if (error) console.log(`Erro desabilitando RLS em ${table}:`, error);
    }

    // Remover todas as políticas
    console.log('🗑️ Removendo todas as políticas...');
    for (const table of tables) {
      const { data: policies } = await supabase.rpc('execute_sql', {
        sql: `SELECT policyname FROM pg_policies WHERE tablename = '${table}';`
      });

      if (policies) {
        for (const policy of policies) {
          await supabase.rpc('execute_sql', {
            sql: `DROP POLICY IF EXISTS "${policy.policyname}" ON public.${table};`
          });
        }
      }
    }

    // Reabilitar RLS
    console.log('🔐 Reabilitando RLS...');
    for (const table of tables) {
      await supabase.rpc('execute_sql', {
        sql: `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`
      });
    }

    // Criar políticas ultra-restritivas
    console.log('🛡️ Criando políticas ultra-restritivas...');
    for (const table of tables) {
      await supabase.rpc('execute_sql', {
        sql: `
          CREATE POLICY "rls_${table}_security" ON public.${table}
            FOR ALL
            USING (auth.role() = 'authenticated')
            WITH CHECK (auth.role() = 'authenticated');
        `
      });
    }

    // Revogar acesso anônimo
    console.log('❌ Revogando acesso anônimo...');
    for (const table of tables) {
      await supabase.rpc('execute_sql', {
        sql: `REVOKE ALL ON public.${table} FROM anon;`
      });
      await supabase.rpc('execute_sql', {
        sql: `GRANT ALL ON public.${table} TO authenticated;`
      });
    }

    console.log('✅ MIGRAÇÃO DE EMERGÊNCIA CONCLUÍDA!');

  } catch (error) {
    console.error('❌ ERRO NA MIGRAÇÃO DE EMERGÊNCIA:', error);
  }
}

emergencySecurityFix();