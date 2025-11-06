-- Adicionar políticas alternativas para admins (via user_roles)
-- Isso permite que admins tenham acesso total mesmo sem estar em funcionarios

-- Clientes
CREATE POLICY "admins_full_access_clientes"
  ON public.clientes
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Obras
CREATE POLICY "admins_full_access_obras"
  ON public.obras
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Despesas
CREATE POLICY "admins_full_access_despesas"
  ON public.despesas
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Requisições
CREATE POLICY "admins_full_access_requisicoes"
  ON public.requisicoes
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Vídeos
CREATE POLICY "admins_full_access_videos"
  ON public.videos
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Funções
CREATE POLICY "admins_full_access_funcoes"
  ON public.funcoes
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Setores
CREATE POLICY "admins_full_access_setores"
  ON public.setores
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Funcionários
CREATE POLICY "admins_full_access_funcionarios"
  ON public.funcionarios
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());