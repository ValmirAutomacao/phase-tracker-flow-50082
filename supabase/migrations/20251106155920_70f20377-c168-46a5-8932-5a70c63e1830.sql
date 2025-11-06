-- Remove a política permissiva atual
DROP POLICY IF EXISTS "authenticated_users_all_access" ON public.funcionarios;

-- Política para SELECT: funcionários podem ver apenas seus próprios dados OU têm permissão de gerenciar equipe
CREATE POLICY "funcionarios_select_policy" ON public.funcionarios
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR 
    public.funcionario_tem_permissao(auth.uid(), 'gerenciar_equipe')
  );

-- Política para INSERT: apenas usuários com permissão de gerenciar equipe
CREATE POLICY "funcionarios_insert_policy" ON public.funcionarios
  FOR INSERT
  WITH CHECK (
    public.funcionario_tem_permissao(auth.uid(), 'gerenciar_equipe')
  );

-- Política para UPDATE: funcionários podem atualizar apenas seus próprios dados básicos OU usuários com permissão de gerenciar equipe podem atualizar tudo
CREATE POLICY "funcionarios_update_policy" ON public.funcionarios
  FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR 
    public.funcionario_tem_permissao(auth.uid(), 'gerenciar_equipe')
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR 
    public.funcionario_tem_permissao(auth.uid(), 'gerenciar_equipe')
  );

-- Política para DELETE: apenas usuários com permissão de gerenciar equipe
CREATE POLICY "funcionarios_delete_policy" ON public.funcionarios
  FOR DELETE
  USING (
    public.funcionario_tem_permissao(auth.uid(), 'gerenciar_equipe')
  );