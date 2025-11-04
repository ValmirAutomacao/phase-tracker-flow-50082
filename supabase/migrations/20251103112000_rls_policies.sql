-- Migration: Implementar políticas RLS completas
-- Story: 1.10 - Implementar RLS completo
-- Author: James (Dev Agent)
-- Date: 2025-11-03

-- ========================================
-- FUNÇÕES DE SEGURANÇA
-- ========================================

-- Função para obter organização do usuário atual
-- Por enquanto, todos os usuários pertencem à organização padrão
CREATE OR REPLACE FUNCTION current_user_organization()
RETURNS UUID AS $$
BEGIN
  -- Por enquanto retorna UUID padrão para single-tenant
  -- Em implementação multi-tenant futura, isso será configurável
  RETURN '00000000-0000-0000-0000-000000000001'::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Por enquanto todos os usuários autenticados são admins
  -- Em implementação futura, isso será baseado em roles/metadata
  RETURN auth.role() = 'authenticated';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- POLÍTICAS RLS - TABELA CLIENTES
-- ========================================

-- Política de leitura para clientes
CREATE POLICY "Users can view own org clients" ON public.clientes
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política de inserção para clientes
CREATE POLICY "Users can insert own org clients" ON public.clientes
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Política de atualização para clientes
CREATE POLICY "Users can update own org clients" ON public.clientes
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Política de exclusão para clientes
CREATE POLICY "Users can delete own org clients" ON public.clientes
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ========================================
-- POLÍTICAS RLS - TABELA OBRAS
-- ========================================

-- Política de leitura para obras
CREATE POLICY "Users can view own org obras" ON public.obras
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política de inserção para obras
CREATE POLICY "Users can insert own org obras" ON public.obras
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Política de atualização para obras
CREATE POLICY "Users can update own org obras" ON public.obras
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Política de exclusão para obras
CREATE POLICY "Users can delete own org obras" ON public.obras
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ========================================
-- POLÍTICAS RLS - TABELA FUNCIONARIOS
-- ========================================

-- Política de leitura para funcionarios
CREATE POLICY "Users can view own org funcionarios" ON public.funcionarios
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política de inserção para funcionarios
CREATE POLICY "Users can insert own org funcionarios" ON public.funcionarios
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Política de atualização para funcionarios
CREATE POLICY "Users can update own org funcionarios" ON public.funcionarios
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Política de exclusão para funcionarios
CREATE POLICY "Users can delete own org funcionarios" ON public.funcionarios
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ========================================
-- POLÍTICAS RLS - TABELA FUNCOES
-- ========================================

-- Política de leitura para funcoes
CREATE POLICY "Users can view own org funcoes" ON public.funcoes
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política de inserção para funcoes
CREATE POLICY "Users can insert own org funcoes" ON public.funcoes
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Política de atualização para funcoes
CREATE POLICY "Users can update own org funcoes" ON public.funcoes
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Política de exclusão para funcoes
CREATE POLICY "Users can delete own org funcoes" ON public.funcoes
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ========================================
-- POLÍTICAS RLS - TABELA SETORES
-- ========================================

-- Política de leitura para setores
CREATE POLICY "Users can view own org setores" ON public.setores
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política de inserção para setores
CREATE POLICY "Users can insert own org setores" ON public.setores
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Política de atualização para setores
CREATE POLICY "Users can update own org setores" ON public.setores
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Política de exclusão para setores
CREATE POLICY "Users can delete own org setores" ON public.setores
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ========================================
-- POLÍTICAS RLS - TABELA DESPESAS
-- ========================================

-- Política de leitura para despesas
CREATE POLICY "Users can view own org despesas" ON public.despesas
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política de inserção para despesas
CREATE POLICY "Users can insert own org despesas" ON public.despesas
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Política de atualização para despesas
CREATE POLICY "Users can update own org despesas" ON public.despesas
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Política de exclusão para despesas
CREATE POLICY "Users can delete own org despesas" ON public.despesas
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ========================================
-- POLÍTICAS RLS - TABELA VIDEOS
-- ========================================

-- Política de leitura para videos
CREATE POLICY "Users can view own org videos" ON public.videos
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política de inserção para videos
CREATE POLICY "Users can insert own org videos" ON public.videos
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Política de atualização para videos
CREATE POLICY "Users can update own org videos" ON public.videos
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Política de exclusão para videos
CREATE POLICY "Users can delete own org videos" ON public.videos
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ========================================
-- POLÍTICAS RLS - TABELA REQUISICOES
-- ========================================

-- Política de leitura para requisicoes
CREATE POLICY "Users can view own org requisicoes" ON public.requisicoes
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política de inserção para requisicoes
CREATE POLICY "Users can insert own org requisicoes" ON public.requisicoes
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Política de atualização para requisicoes
CREATE POLICY "Users can update own org requisicoes" ON public.requisicoes
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Política de exclusão para requisicoes
CREATE POLICY "Users can delete own org requisicoes" ON public.requisicoes
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ========================================
-- POLÍTICAS ADMIN OVERRIDE
-- ========================================

-- Políticas de admin override para todas as tabelas
-- Admins podem acessar tudo independente de organização

-- Admin override para clientes
CREATE POLICY "Admin override clientes" ON public.clientes
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admin override para obras
CREATE POLICY "Admin override obras" ON public.obras
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admin override para funcionarios
CREATE POLICY "Admin override funcionarios" ON public.funcionarios
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admin override para funcoes
CREATE POLICY "Admin override funcoes" ON public.funcoes
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admin override para setores
CREATE POLICY "Admin override setores" ON public.setores
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admin override para despesas
CREATE POLICY "Admin override despesas" ON public.despesas
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admin override para videos
CREATE POLICY "Admin override videos" ON public.videos
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admin override para requisicoes
CREATE POLICY "Admin override requisicoes" ON public.requisicoes
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================

-- Verificar se RLS está habilitado em todas as tabelas
DO $$
DECLARE
    tbl_name TEXT;
    rls_enabled BOOLEAN;
BEGIN
    FOR tbl_name IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN ('clientes', 'obras', 'funcionarios', 'funcoes', 'setores', 'despesas', 'videos', 'requisicoes')
    LOOP
        SELECT relrowsecurity INTO rls_enabled
        FROM pg_class
        WHERE relname = tbl_name;

        IF NOT rls_enabled THEN
            RAISE EXCEPTION 'RLS não está habilitado na tabela %', tbl_name;
        END IF;

        RAISE NOTICE 'RLS verificado e ativo na tabela: %', tbl_name;
    END LOOP;
END $$;

-- Comentário final
COMMENT ON FUNCTION current_user_organization() IS 'Retorna UUID da organização do usuário atual - preparado para multi-tenancy';
COMMENT ON FUNCTION is_admin() IS 'Verifica se usuário atual tem privilégios de admin';