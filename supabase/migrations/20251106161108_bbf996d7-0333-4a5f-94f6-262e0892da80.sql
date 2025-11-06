-- ========================================
-- RLS POLICIES BASEADAS EM PERMISSÕES
-- ========================================

-- ========================================
-- TABELA: clientes
-- ========================================
DROP POLICY IF EXISTS "authenticated_users_all_access" ON public.clientes;

CREATE POLICY "clientes_select_policy" ON public.clientes
  FOR SELECT
  USING (
    public.funcionario_tem_permissao(auth.uid(), 'visualizar_obras')
  );

CREATE POLICY "clientes_insert_policy" ON public.clientes
  FOR INSERT
  WITH CHECK (
    public.funcionario_tem_permissao(auth.uid(), 'criar_obras')
  );

CREATE POLICY "clientes_update_policy" ON public.clientes
  FOR UPDATE
  USING (
    public.funcionario_tem_permissao(auth.uid(), 'editar_obras')
  )
  WITH CHECK (
    public.funcionario_tem_permissao(auth.uid(), 'editar_obras')
  );

CREATE POLICY "clientes_delete_policy" ON public.clientes
  FOR DELETE
  USING (
    public.funcionario_tem_permissao(auth.uid(), 'deletar_obras')
  );

-- ========================================
-- TABELA: obras
-- ========================================
DROP POLICY IF EXISTS "authenticated_users_all_access" ON public.obras;

CREATE POLICY "obras_select_policy" ON public.obras
  FOR SELECT
  USING (
    public.funcionario_tem_permissao(auth.uid(), 'visualizar_obras')
  );

CREATE POLICY "obras_insert_policy" ON public.obras
  FOR INSERT
  WITH CHECK (
    public.funcionario_tem_permissao(auth.uid(), 'criar_obras')
  );

CREATE POLICY "obras_update_policy" ON public.obras
  FOR UPDATE
  USING (
    public.funcionario_tem_permissao(auth.uid(), 'editar_obras')
  )
  WITH CHECK (
    public.funcionario_tem_permissao(auth.uid(), 'editar_obras')
  );

CREATE POLICY "obras_delete_policy" ON public.obras
  FOR DELETE
  USING (
    public.funcionario_tem_permissao(auth.uid(), 'deletar_obras')
  );

-- ========================================
-- TABELA: despesas
-- ========================================
DROP POLICY IF EXISTS "authenticated_users_all_access" ON public.despesas;

CREATE POLICY "despesas_select_policy" ON public.despesas
  FOR SELECT
  USING (
    public.funcionario_tem_permissao(auth.uid(), 'visualizar_financeiro')
  );

CREATE POLICY "despesas_insert_policy" ON public.despesas
  FOR INSERT
  WITH CHECK (
    public.funcionario_tem_permissao(auth.uid(), 'criar_despesas')
  );

CREATE POLICY "despesas_update_policy" ON public.despesas
  FOR UPDATE
  USING (
    public.funcionario_tem_permissao(auth.uid(), 'editar_despesas')
  )
  WITH CHECK (
    public.funcionario_tem_permissao(auth.uid(), 'editar_despesas')
  );

CREATE POLICY "despesas_delete_policy" ON public.despesas
  FOR DELETE
  USING (
    public.funcionario_tem_permissao(auth.uid(), 'deletar_despesas')
  );

-- ========================================
-- TABELA: requisicoes
-- ========================================
DROP POLICY IF EXISTS "authenticated_users_all_access" ON public.requisicoes;

CREATE POLICY "requisicoes_select_policy" ON public.requisicoes
  FOR SELECT
  USING (
    public.funcionario_tem_permissao(auth.uid(), 'visualizar_compras')
  );

CREATE POLICY "requisicoes_insert_policy" ON public.requisicoes
  FOR INSERT
  WITH CHECK (
    public.funcionario_tem_permissao(auth.uid(), 'criar_compras')
  );

CREATE POLICY "requisicoes_update_policy" ON public.requisicoes
  FOR UPDATE
  USING (
    public.funcionario_tem_permissao(auth.uid(), 'editar_compras')
  )
  WITH CHECK (
    public.funcionario_tem_permissao(auth.uid(), 'editar_compras')
  );

CREATE POLICY "requisicoes_delete_policy" ON public.requisicoes
  FOR DELETE
  USING (
    public.funcionario_tem_permissao(auth.uid(), 'deletar_compras')
  );

-- ========================================
-- TABELA: videos
-- ========================================
DROP POLICY IF EXISTS "authenticated_users_all_access" ON public.videos;

CREATE POLICY "videos_select_policy" ON public.videos
  FOR SELECT
  USING (
    public.funcionario_tem_permissao(auth.uid(), 'visualizar_obras')
  );

CREATE POLICY "videos_insert_policy" ON public.videos
  FOR INSERT
  WITH CHECK (
    public.funcionario_tem_permissao(auth.uid(), 'criar_obras')
  );

CREATE POLICY "videos_update_policy" ON public.videos
  FOR UPDATE
  USING (
    public.funcionario_tem_permissao(auth.uid(), 'editar_obras')
  )
  WITH CHECK (
    public.funcionario_tem_permissao(auth.uid(), 'editar_obras')
  );

CREATE POLICY "videos_delete_policy" ON public.videos
  FOR DELETE
  USING (
    public.funcionario_tem_permissao(auth.uid(), 'deletar_obras')
  );

-- ========================================
-- TABELA: funcoes
-- ========================================
DROP POLICY IF EXISTS "authenticated_users_all_access" ON public.funcoes;

CREATE POLICY "funcoes_select_policy" ON public.funcoes
  FOR SELECT
  USING (
    public.funcionario_tem_permissao(auth.uid(), 'gerenciar_equipe')
  );

CREATE POLICY "funcoes_insert_policy" ON public.funcoes
  FOR INSERT
  WITH CHECK (
    public.funcionario_tem_permissao(auth.uid(), 'gerenciar_equipe')
  );

CREATE POLICY "funcoes_update_policy" ON public.funcoes
  FOR UPDATE
  USING (
    public.funcionario_tem_permissao(auth.uid(), 'gerenciar_equipe')
  )
  WITH CHECK (
    public.funcionario_tem_permissao(auth.uid(), 'gerenciar_equipe')
  );

CREATE POLICY "funcoes_delete_policy" ON public.funcoes
  FOR DELETE
  USING (
    public.funcionario_tem_permissao(auth.uid(), 'gerenciar_equipe')
  );

-- ========================================
-- TABELA: setores
-- ========================================
DROP POLICY IF EXISTS "authenticated_users_all_access" ON public.setores;

CREATE POLICY "setores_select_policy" ON public.setores
  FOR SELECT
  USING (
    public.funcionario_tem_permissao(auth.uid(), 'gerenciar_equipe')
  );

CREATE POLICY "setores_insert_policy" ON public.setores
  FOR INSERT
  WITH CHECK (
    public.funcionario_tem_permissao(auth.uid(), 'gerenciar_equipe')
  );

CREATE POLICY "setores_update_policy" ON public.setores
  FOR UPDATE
  USING (
    public.funcionario_tem_permissao(auth.uid(), 'gerenciar_equipe')
  )
  WITH CHECK (
    public.funcionario_tem_permissao(auth.uid(), 'gerenciar_equipe')
  );

CREATE POLICY "setores_delete_policy" ON public.setores
  FOR DELETE
  USING (
    public.funcionario_tem_permissao(auth.uid(), 'gerenciar_equipe')
  );