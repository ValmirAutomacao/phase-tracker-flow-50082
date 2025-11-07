-- =====================================================
-- KANBAN CRM - Schema Completo
-- =====================================================

-- Extensão para trigram (busca textual avançada)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================================
-- 1. TABELA: kanban_boards
-- =====================================================
CREATE TABLE IF NOT EXISTS public.kanban_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. TABELA: kanban_phases
-- =====================================================
CREATE TABLE IF NOT EXISTS public.kanban_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES public.kanban_boards(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  cor TEXT NOT NULL, -- hex color
  ordem INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(board_id, ordem)
);

-- =====================================================
-- 3. TABELA: kanban_cards
-- =====================================================
CREATE TABLE IF NOT EXISTS public.kanban_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES public.kanban_boards(id) ON DELETE CASCADE NOT NULL,
  phase_id UUID REFERENCES public.kanban_phases(id) ON DELETE CASCADE NOT NULL,
  
  -- Dados do Lead/Card
  titulo TEXT,
  cliente_nome TEXT NOT NULL,
  cliente_email TEXT,
  cliente_telefone TEXT,
  cliente_empresa TEXT,
  valor_estimado NUMERIC(15,2),
  descricao TEXT,
  origem TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'webhook', 'n8n', 'whatsapp', etc
  tags JSONB DEFAULT '[]'::jsonb,
  
  -- Relacionamentos opcionais
  obra_id UUID REFERENCES public.obras(id) ON DELETE SET NULL,
  funcionario_responsavel_id UUID REFERENCES public.funcionarios(id) ON DELETE SET NULL,
  
  -- Ordenação e metadados
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. TABELA: kanban_card_activities
-- =====================================================
CREATE TABLE IF NOT EXISTS public.kanban_card_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES public.kanban_cards(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL, -- 'criado', 'movido', 'editado', 'comentario'
  descricao TEXT NOT NULL,
  dados_anteriores JSONB,
  dados_novos JSONB,
  user_id UUID, -- pode ser null para automações
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. ÍNDICES para Performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_kanban_cards_board_phase ON public.kanban_cards(board_id, phase_id);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_ordem ON public.kanban_cards(phase_id, ordem);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_cliente_nome ON public.kanban_cards USING gin(cliente_nome gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_tags ON public.kanban_cards USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_kanban_card_activities_card ON public.kanban_card_activities(card_id, created_at DESC);

-- =====================================================
-- 6. TRIGGERS para updated_at
-- =====================================================
CREATE TRIGGER update_kanban_boards_updated_at
  BEFORE UPDATE ON public.kanban_boards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kanban_phases_updated_at
  BEFORE UPDATE ON public.kanban_phases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kanban_cards_updated_at
  BEFORE UPDATE ON public.kanban_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE public.kanban_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_card_activities ENABLE ROW LEVEL SECURITY;

-- Políticas: Usuários autenticados têm acesso completo
CREATE POLICY "kanban_boards_full_access" ON public.kanban_boards
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "kanban_phases_full_access" ON public.kanban_phases
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "kanban_cards_full_access" ON public.kanban_cards
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "kanban_card_activities_full_access" ON public.kanban_card_activities
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Políticas para admins
CREATE POLICY "admins_full_access_kanban_boards" ON public.kanban_boards
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "admins_full_access_kanban_phases" ON public.kanban_phases
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "admins_full_access_kanban_cards" ON public.kanban_cards
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "admins_full_access_kanban_card_activities" ON public.kanban_card_activities
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- =====================================================
-- 8. SEED DATA - Board padrão e 5 fases
-- =====================================================

-- Inserir board padrão
INSERT INTO public.kanban_boards (id, nome, descricao, ativo)
VALUES (
  '00000000-0000-0000-0000-000000000001'::UUID,
  'Pipeline de Vendas',
  'Funil de vendas padrão para gerenciamento de leads e oportunidades',
  true
) ON CONFLICT (id) DO NOTHING;

-- Inserir 5 fases padrão
INSERT INTO public.kanban_phases (board_id, nome, cor, ordem) VALUES
  ('00000000-0000-0000-0000-000000000001'::UUID, 'Novo Lead', '#F59E0B', 1),
  ('00000000-0000-0000-0000-000000000001'::UUID, 'Orçamento', '#3B82F6', 2),
  ('00000000-0000-0000-0000-000000000001'::UUID, 'Negociação', '#F97316', 3),
  ('00000000-0000-0000-0000-000000000001'::UUID, 'Fechado', '#10B981', 4),
  ('00000000-0000-0000-0000-000000000001'::UUID, 'Perdido', '#EF4444', 5)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 9. DADOS DEMO - 20 Leads de demonstração
-- =====================================================

-- Função auxiliar para obter phase_id por nome
DO $$
DECLARE
  phase_novo_lead UUID;
  phase_orcamento UUID;
  phase_negociacao UUID;
  phase_fechado UUID;
  phase_perdido UUID;
BEGIN
  SELECT id INTO phase_novo_lead FROM public.kanban_phases WHERE nome = 'Novo Lead' LIMIT 1;
  SELECT id INTO phase_orcamento FROM public.kanban_phases WHERE nome = 'Orçamento' LIMIT 1;
  SELECT id INTO phase_negociacao FROM public.kanban_phases WHERE nome = 'Negociação' LIMIT 1;
  SELECT id INTO phase_fechado FROM public.kanban_phases WHERE nome = 'Fechado' LIMIT 1;
  SELECT id INTO phase_perdido FROM public.kanban_phases WHERE nome = 'Perdido' LIMIT 1;

  -- Leads em "Novo Lead" (5 cards)
  INSERT INTO public.kanban_cards (board_id, phase_id, titulo, cliente_nome, cliente_email, cliente_telefone, cliente_empresa, valor_estimado, origem, tags, ordem) VALUES
    ('00000000-0000-0000-0000-000000000001'::UUID, phase_novo_lead, 'Construção Residencial', 'João Silva', 'joao.silva@email.com', '(11) 98765-4321', 'Silva Construtora', 85000, 'site', '["residencial", "urgente"]'::jsonb, 1),
    ('00000000-0000-0000-0000-000000000001'::UUID, phase_novo_lead, 'Reforma Comercial', 'Maria Santos', 'maria.santos@empresa.com', '(21) 97654-3210', 'Santos & Cia', 45000, 'whatsapp', '["comercial", "reforma"]'::jsonb, 2),
    ('00000000-0000-0000-0000-000000000001'::UUID, phase_novo_lead, 'Projeto Arquitetônico', 'Carlos Oliveira', 'carlos@arq.com.br', '(31) 96543-2109', null, 25000, 'indicacao', '["arquitetura"]'::jsonb, 3),
    ('00000000-0000-0000-0000-000000000001'::UUID, phase_novo_lead, 'Loteamento', 'Ana Costa', 'ana.costa@gmail.com', '(41) 95432-1098', 'Costa Empreendimentos', 320000, 'manual', '["loteamento", "grande"]'::jsonb, 4),
    ('00000000-0000-0000-0000-000000000001'::UUID, phase_novo_lead, 'Casa Popular', 'Pedro Almeida', 'pedro.almeida@hotmail.com', '(51) 94321-0987', null, 65000, 'site', '["residencial"]'::jsonb, 5);

  -- Leads em "Orçamento" (5 cards)
  INSERT INTO public.kanban_cards (board_id, phase_id, titulo, cliente_nome, cliente_email, cliente_telefone, cliente_empresa, valor_estimado, origem, tags, ordem) VALUES
    ('00000000-0000-0000-0000-000000000001'::UUID, phase_orcamento, 'Galpão Industrial', 'Roberto Fernandes', 'roberto.f@industria.com', '(61) 93210-9876', 'Fernandes Indústria', 180000, 'whatsapp', '["industrial", "galpao"]'::jsonb, 1),
    ('00000000-0000-0000-0000-000000000001'::UUID, phase_orcamento, 'Edifício Comercial', 'Juliana Pereira', 'juliana@edificios.com.br', '(71) 92109-8765', 'Pereira Construções', 450000, 'indicacao', '["comercial", "edificio"]'::jsonb, 2),
    ('00000000-0000-0000-0000-000000000001'::UUID, phase_orcamento, 'Condomínio Fechado', 'Fernando Lima', 'fernando.lima@gmail.com', '(81) 91098-7654', 'Lima Empreendimentos', 1200000, 'site', '["condominio", "luxo"]'::jsonb, 3),
    ('00000000-0000-0000-0000-000000000001'::UUID, phase_orcamento, 'Shopping Center', 'Patricia Souza', 'patricia.souza@shopping.com', '(85) 90987-6543', 'Souza Shoppings', 2500000, 'manual', '["comercial", "shopping"]'::jsonb, 4),
    ('00000000-0000-0000-0000-000000000001'::UUID, phase_orcamento, 'Reforma de Fachada', 'Lucas Martins', 'lucas.martins@yahoo.com', '(91) 89876-5432', null, 32000, 'whatsapp', '["reforma"]'::jsonb, 5);

  -- Leads em "Negociação" (4 cards)
  INSERT INTO public.kanban_cards (board_id, phase_id, titulo, cliente_nome, cliente_email, cliente_telefone, cliente_empresa, valor_estimado, origem, tags, ordem) VALUES
    ('00000000-0000-0000-0000-000000000001'::UUID, phase_negociacao, 'Hotel Boutique', 'Camila Ribeiro', 'camila.ribeiro@hotel.com', '(11) 98765-1111', 'Ribeiro Hotéis', 890000, 'indicacao', '["hotelaria", "luxo"]'::jsonb, 1),
    ('00000000-0000-0000-0000-000000000001'::UUID, phase_negociacao, 'Prédio Residencial', 'Ricardo Azevedo', 'ricardo@construtora.com.br', '(21) 97654-2222', 'Azevedo Construções', 680000, 'site', '["residencial", "predio"]'::jsonb, 2),
    ('00000000-0000-0000-0000-000000000001'::UUID, phase_negociacao, 'Academia Premium', 'Fernanda Castro', 'fernanda.castro@fit.com', '(31) 96543-3333', 'Castro Fitness', 120000, 'whatsapp', '["comercial", "fitness"]'::jsonb, 3),
    ('00000000-0000-0000-0000-000000000001'::UUID, phase_negociacao, 'Clínica Médica', 'Gustavo Rocha', 'gustavo.rocha@clinica.com', '(41) 95432-4444', 'Rocha Saúde', 240000, 'manual', '["saude", "clinica"]'::jsonb, 4);

  -- Leads em "Fechado" (3 cards)
  INSERT INTO public.kanban_cards (board_id, phase_id, titulo, cliente_nome, cliente_email, cliente_telefone, cliente_empresa, valor_estimado, origem, tags, ordem) VALUES
    ('00000000-0000-0000-0000-000000000001'::UUID, phase_fechado, 'Casa de Alto Padrão', 'Mariana Dias', 'mariana.dias@luxo.com', '(51) 94321-5555', null, 450000, 'indicacao', '["residencial", "luxo"]'::jsonb, 1),
    ('00000000-0000-0000-0000-000000000001'::UUID, phase_fechado, 'Restaurante Gourmet', 'Bruno Carvalho', 'bruno@restaurante.com.br', '(61) 93210-6666', 'Carvalho Gastronomia', 180000, 'site', '["comercial", "gastronomia"]'::jsonb, 2),
    ('00000000-0000-0000-0000-000000000001'::UUID, phase_fechado, 'Escola Particular', 'Aline Monteiro', 'aline.monteiro@escola.com', '(71) 92109-7777', 'Monteiro Educação', 520000, 'whatsapp', '["educacao"]'::jsonb, 3);

  -- Leads em "Perdido" (3 cards)
  INSERT INTO public.kanban_cards (board_id, phase_id, titulo, cliente_nome, cliente_email, cliente_telefone, cliente_empresa, valor_estimado, origem, tags, descricao, ordem) VALUES
    ('00000000-0000-0000-0000-000000000001'::UUID, phase_perdido, 'Obra Industrial', 'Daniel Teixeira', 'daniel@industria.com.br', '(81) 91098-8888', 'Teixeira Indústria', 750000, 'manual', '["industrial"]'::jsonb, 'Cliente optou por concorrente com prazo menor', 1),
    ('00000000-0000-0000-0000-000000000001'::UUID, phase_perdido, 'Ampliação Residencial', 'Sandra Freitas', 'sandra.freitas@gmail.com', '(85) 90987-9999', null, 95000, 'site', '["residencial", "reforma"]'::jsonb, 'Orçamento acima do esperado', 2),
    ('00000000-0000-0000-0000-000000000001'::UUID, phase_perdido, 'Projeto Comercial', 'Rafael Campos', 'rafael.campos@comercio.com', '(91) 89876-0000', 'Campos Comércio', 210000, 'whatsapp', '["comercial"]'::jsonb, 'Cliente desistiu do projeto', 3);

END $$;