-- Adicionar coluna user_id em funcionarios para vincular com auth.users
ALTER TABLE public.funcionarios 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Adicionar índice para melhor performance
CREATE INDEX idx_funcionarios_user_id ON public.funcionarios(user_id);

-- Adicionar coluna permissoes em funcoes para armazenar array de permissões
ALTER TABLE public.funcoes 
ADD COLUMN permissoes jsonb DEFAULT '[]'::jsonb;

-- Adicionar coluna nivel em funcoes se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'funcoes' AND column_name = 'nivel'
  ) THEN
    ALTER TABLE public.funcoes ADD COLUMN nivel text;
  END IF;
END $$;

-- Função helper para verificar se um funcionário tem uma permissão específica
CREATE OR REPLACE FUNCTION public.funcionario_tem_permissao(_user_id uuid, _permissao text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.funcionarios f
    JOIN public.funcoes func ON f.funcao_id = func.id
    WHERE f.user_id = _user_id
      AND f.ativo = true
      AND func.permissoes ? _permissao
  )
$$;

-- Função helper para obter todas as permissões de um funcionário
CREATE OR REPLACE FUNCTION public.obter_permissoes_funcionario(_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(func.permissoes, '[]'::jsonb)
  FROM public.funcionarios f
  JOIN public.funcoes func ON f.funcao_id = func.id
  WHERE f.user_id = _user_id
    AND f.ativo = true
  LIMIT 1
$$;

-- Comentários para documentação
COMMENT ON COLUMN public.funcionarios.user_id IS 'Referência ao usuário de autenticação do Supabase';
COMMENT ON COLUMN public.funcoes.permissoes IS 'Array JSON de IDs de permissões concedidas a esta função';
COMMENT ON FUNCTION public.funcionario_tem_permissao IS 'Verifica se um funcionário tem uma permissão específica através de sua função';
COMMENT ON FUNCTION public.obter_permissoes_funcionario IS 'Retorna todas as permissões de um funcionário baseado em sua função';