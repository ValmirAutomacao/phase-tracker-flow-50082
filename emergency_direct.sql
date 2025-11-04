-- MIGRAÇÃO DE EMERGÊNCIA DIRETA
-- Remover políticas existentes e criar políticas ultra-restritivas

-- ========================================
-- REMOVER TODAS AS POLÍTICAS EXISTENTES
-- ========================================

-- Desabilitar RLS temporariamente
ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.obras DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.setores DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.requisicoes DISABLE ROW LEVEL SECURITY;

-- Dropar todas as políticas existentes
DROP POLICY IF EXISTS "Block anon access to clientes" ON public.clientes;
DROP POLICY IF EXISTS "Allow authenticated access to clientes" ON public.clientes;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.clientes;

DROP POLICY IF EXISTS "Block anon access to obras" ON public.obras;
DROP POLICY IF EXISTS "Allow authenticated access to obras" ON public.obras;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.obras;

DROP POLICY IF EXISTS "Block anon access to funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Allow authenticated access to funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.funcionarios;

DROP POLICY IF EXISTS "Block anon access to funcoes" ON public.funcoes;
DROP POLICY IF EXISTS "Allow authenticated access to funcoes" ON public.funcoes;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.funcoes;

DROP POLICY IF EXISTS "Block anon access to setores" ON public.setores;
DROP POLICY IF EXISTS "Allow authenticated access to setores" ON public.setores;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.setores;

DROP POLICY IF EXISTS "Block anon access to despesas" ON public.despesas;
DROP POLICY IF EXISTS "Allow authenticated access to despesas" ON public.despesas;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.despesas;

DROP POLICY IF EXISTS "Block anon access to videos" ON public.videos;
DROP POLICY IF EXISTS "Allow authenticated access to videos" ON public.videos;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.videos;

DROP POLICY IF EXISTS "Block anon access to requisicoes" ON public.requisicoes;
DROP POLICY IF EXISTS "Allow authenticated access to requisicoes" ON public.requisicoes;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.requisicoes;

-- ========================================
-- REABILITAR RLS E CRIAR POLÍTICAS ÚNICAS
-- ========================================

-- Habilitar RLS novamente
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requisicoes ENABLE ROW LEVEL SECURITY;

-- Criar política única ultra-restritiva para cada tabela
CREATE POLICY "rls_clientes_security" ON public.clientes
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "rls_obras_security" ON public.obras
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "rls_funcionarios_security" ON public.funcionarios
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "rls_funcoes_security" ON public.funcoes
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "rls_setores_security" ON public.setores
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "rls_despesas_security" ON public.despesas
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "rls_videos_security" ON public.videos
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "rls_requisicoes_security" ON public.requisicoes
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ========================================
-- REVOGAR ACESSO ANÔNIMO
-- ========================================

REVOKE ALL ON public.clientes FROM anon;
REVOKE ALL ON public.obras FROM anon;
REVOKE ALL ON public.funcionarios FROM anon;
REVOKE ALL ON public.funcoes FROM anon;
REVOKE ALL ON public.setores FROM anon;
REVOKE ALL ON public.despesas FROM anon;
REVOKE ALL ON public.videos FROM anon;
REVOKE ALL ON public.requisicoes FROM anon;

GRANT ALL ON public.clientes TO authenticated;
GRANT ALL ON public.obras TO authenticated;
GRANT ALL ON public.funcionarios TO authenticated;
GRANT ALL ON public.funcoes TO authenticated;
GRANT ALL ON public.setores TO authenticated;
GRANT ALL ON public.despesas TO authenticated;
GRANT ALL ON public.videos TO authenticated;
GRANT ALL ON public.requisicoes TO authenticated;