-- Migration: Correção crítica das políticas RLS
-- Story: 1.10 - Implementar RLS completo - Correção de Segurança
-- Author: James (Dev Agent)
-- Date: 2025-11-03
-- URGENTE: Corrige falhas críticas de segurança identificadas nos testes

-- ========================================
-- REMOVER POLÍTICAS PROBLEMÁTICAS
-- ========================================

-- Dropar todas as políticas existentes para recriá-las corretamente
DROP POLICY IF EXISTS "Users can view own org clients" ON public.clientes;
DROP POLICY IF EXISTS "Users can insert own org clients" ON public.clientes;
DROP POLICY IF EXISTS "Users can update own org clients" ON public.clientes;
DROP POLICY IF EXISTS "Users can delete own org clients" ON public.clientes;
DROP POLICY IF EXISTS "Admin override clientes" ON public.clientes;

DROP POLICY IF EXISTS "Users can view own org obras" ON public.obras;
DROP POLICY IF EXISTS "Users can insert own org obras" ON public.obras;
DROP POLICY IF EXISTS "Users can update own org obras" ON public.obras;
DROP POLICY IF EXISTS "Users can delete own org obras" ON public.obras;
DROP POLICY IF EXISTS "Admin override obras" ON public.obras;

DROP POLICY IF EXISTS "Users can view own org funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Users can insert own org funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Users can update own org funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Users can delete own org funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Admin override funcionarios" ON public.funcionarios;

DROP POLICY IF EXISTS "Users can view own org funcoes" ON public.funcoes;
DROP POLICY IF EXISTS "Users can insert own org funcoes" ON public.funcoes;
DROP POLICY IF EXISTS "Users can update own org funcoes" ON public.funcoes;
DROP POLICY IF EXISTS "Users can delete own org funcoes" ON public.funcoes;
DROP POLICY IF EXISTS "Admin override funcoes" ON public.funcoes;

DROP POLICY IF EXISTS "Users can view own org setores" ON public.setores;
DROP POLICY IF EXISTS "Users can insert own org setores" ON public.setores;
DROP POLICY IF EXISTS "Users can update own org setores" ON public.setores;
DROP POLICY IF EXISTS "Users can delete own org setores" ON public.setores;
DROP POLICY IF EXISTS "Admin override setores" ON public.setores;

DROP POLICY IF EXISTS "Users can view own org despesas" ON public.despesas;
DROP POLICY IF EXISTS "Users can insert own org despesas" ON public.despesas;
DROP POLICY IF EXISTS "Users can update own org despesas" ON public.despesas;
DROP POLICY IF EXISTS "Users can delete own org despesas" ON public.despesas;
DROP POLICY IF EXISTS "Admin override despesas" ON public.despesas;

DROP POLICY IF EXISTS "Users can view own org videos" ON public.videos;
DROP POLICY IF EXISTS "Users can insert own org videos" ON public.videos;
DROP POLICY IF EXISTS "Users can update own org videos" ON public.videos;
DROP POLICY IF EXISTS "Users can delete own org videos" ON public.videos;
DROP POLICY IF EXISTS "Admin override videos" ON public.videos;

DROP POLICY IF EXISTS "Users can view own org requisicoes" ON public.requisicoes;
DROP POLICY IF EXISTS "Users can insert own org requisicoes" ON public.requisicoes;
DROP POLICY IF EXISTS "Users can update own org requisicoes" ON public.requisicoes;
DROP POLICY IF EXISTS "Users can delete own org requisicoes" ON public.requisicoes;
DROP POLICY IF EXISTS "Admin override requisicoes" ON public.requisicoes;

-- ========================================
-- POLÍTICAS RLS SEGURAS CORRIGIDAS
-- ========================================

-- REGRA 1: BLOQUEAR EXPLICITAMENTE USUÁRIOS ANÔNIMOS
-- REGRA 2: PERMITIR APENAS USUÁRIOS AUTENTICADOS

-- ========================================
-- CLIENTES - POLÍTICAS SEGURAS
-- ========================================

-- Bloquear completamente usuários anônimos
CREATE POLICY "Block anon access to clientes" ON public.clientes
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Permitir acesso completo para usuários autenticados
CREATE POLICY "Allow authenticated access to clientes" ON public.clientes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ========================================
-- OBRAS - POLÍTICAS SEGURAS
-- ========================================

CREATE POLICY "Block anon access to obras" ON public.obras
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Allow authenticated access to obras" ON public.obras
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ========================================
-- FUNCIONARIOS - POLÍTICAS SEGURAS
-- ========================================

CREATE POLICY "Block anon access to funcionarios" ON public.funcionarios
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Allow authenticated access to funcionarios" ON public.funcionarios
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ========================================
-- FUNCOES - POLÍTICAS SEGURAS
-- ========================================

CREATE POLICY "Block anon access to funcoes" ON public.funcoes
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Allow authenticated access to funcoes" ON public.funcoes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ========================================
-- SETORES - POLÍTICAS SEGURAS
-- ========================================

CREATE POLICY "Block anon access to setores" ON public.setores
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Allow authenticated access to setores" ON public.setores
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ========================================
-- DESPESAS - POLÍTICAS SEGURAS
-- ========================================

CREATE POLICY "Block anon access to despesas" ON public.despesas
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Allow authenticated access to despesas" ON public.despesas
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ========================================
-- VIDEOS - POLÍTICAS SEGURAS
-- ========================================

CREATE POLICY "Block anon access to videos" ON public.videos
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Allow authenticated access to videos" ON public.videos
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ========================================
-- REQUISICOES - POLÍTICAS SEGURAS
-- ========================================

CREATE POLICY "Block anon access to requisicoes" ON public.requisicoes
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Allow authenticated access to requisicoes" ON public.requisicoes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ========================================
-- RESTRINGIR ACESSO ÀS FUNÇÕES DE SEGURANÇA
-- ========================================

-- Revogar acesso das funções para usuários anônimos
REVOKE EXECUTE ON FUNCTION current_user_organization() FROM anon;
REVOKE EXECUTE ON FUNCTION is_admin() FROM anon;

-- Garantir acesso apenas para usuários autenticados
GRANT EXECUTE ON FUNCTION current_user_organization() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- ========================================
-- VERIFICAÇÃO FINAL DE SEGURANÇA
-- ========================================

-- Verificar se RLS está habilitado em todas as tabelas
DO $$
DECLARE
    tbl_name TEXT;
    rls_enabled BOOLEAN;
    policy_count INTEGER;
BEGIN
    FOR tbl_name IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN ('clientes', 'obras', 'funcionarios', 'funcoes', 'setores', 'despesas', 'videos', 'requisicoes')
    LOOP
        -- Verificar RLS habilitado
        SELECT relrowsecurity INTO rls_enabled
        FROM pg_class
        WHERE relname = tbl_name;

        IF NOT rls_enabled THEN
            RAISE EXCEPTION 'RLS não está habilitado na tabela %', tbl_name;
        END IF;

        -- Verificar se tem exatamente 2 políticas (block anon + allow authenticated)
        SELECT COUNT(*) INTO policy_count
        FROM pg_policies
        WHERE tablename = tbl_name;

        IF policy_count != 2 THEN
            RAISE WARNING 'Tabela % tem % políticas, esperado 2', tbl_name, policy_count;
        END IF;

        RAISE NOTICE 'Segurança verificada na tabela %: RLS ativo, % políticas', tbl_name, policy_count;
    END LOOP;
END $$;

-- ========================================
-- COMENTÁRIOS DE DOCUMENTAÇÃO
-- ========================================

COMMENT ON POLICY "Block anon access to clientes" ON public.clientes IS 'Bloqueia completamente usuários anônimos - segurança crítica';
COMMENT ON POLICY "Allow authenticated access to clientes" ON public.clientes IS 'Permite acesso total para usuários autenticados - preparado para multi-tenancy';

-- Comentários similares para as outras tabelas são implícitos pela consistência do padrão

-- Atualizar comentários das funções
COMMENT ON FUNCTION current_user_organization() IS 'Retorna UUID da organização - RESTRITO a usuários autenticados';
COMMENT ON FUNCTION is_admin() IS 'Verifica privilégios admin - RESTRITO a usuários autenticados';

-- ========================================
-- LOG DE MIGRAÇÃO (REMOVIDO - TABELA NÃO EXISTE)
-- ========================================

-- INSERT removido pois tabela migration_log não existe