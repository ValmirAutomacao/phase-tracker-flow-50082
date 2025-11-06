-- Corrigir RLS policies para permitir acesso de usuários autenticados
-- O problema é que auth.role() não é a função correta, devemos usar auth.uid()

-- Clientes
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.clientes;
DROP POLICY IF EXISTS "rls_clientes_security" ON public.clientes;

CREATE POLICY "authenticated_users_all_access" ON public.clientes
  FOR ALL 
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Obras
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.obras;
DROP POLICY IF EXISTS "rls_obras_security" ON public.obras;

CREATE POLICY "authenticated_users_all_access" ON public.obras
  FOR ALL 
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Funcionarios
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.funcionarios;
DROP POLICY IF EXISTS "rls_funcionarios_security" ON public.funcionarios;

CREATE POLICY "authenticated_users_all_access" ON public.funcionarios
  FOR ALL 
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Funcoes
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.funcoes;
DROP POLICY IF EXISTS "rls_funcoes_security" ON public.funcoes;

CREATE POLICY "authenticated_users_all_access" ON public.funcoes
  FOR ALL 
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Setores
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.setores;
DROP POLICY IF EXISTS "rls_setores_security" ON public.setores;

CREATE POLICY "authenticated_users_all_access" ON public.setores
  FOR ALL 
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Despesas
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.despesas;
DROP POLICY IF EXISTS "rls_despesas_security" ON public.despesas;

CREATE POLICY "authenticated_users_all_access" ON public.despesas
  FOR ALL 
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Videos
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.videos;
DROP POLICY IF EXISTS "rls_videos_security" ON public.videos;

CREATE POLICY "authenticated_users_all_access" ON public.videos
  FOR ALL 
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Requisicoes
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.requisicoes;
DROP POLICY IF EXISTS "rls_requisicoes_security" ON public.requisicoes;

CREATE POLICY "authenticated_users_all_access" ON public.requisicoes
  FOR ALL 
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);