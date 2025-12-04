-- 20251203000000_gantt_schema.sql

-- Habilita extensões necessárias (caso não estejam)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Cronogramas
-- Cada obra terá, idealmente, um cronograma principal ativo.
-- Permitimos múltiplos para simulações (cenários).
CREATE TABLE IF NOT EXISTS public.projeto_cronogramas (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    obra_id uuid NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
    nome text NOT NULL DEFAULT 'Cronograma Principal',
    descricao text,
    ativo boolean DEFAULT true,
    data_base_inicial date, -- Data de referência para cálculo
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Tabela de Tarefas (Hierárquica)
CREATE TABLE IF NOT EXISTS public.projeto_tarefas (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    cronograma_id uuid NOT NULL REFERENCES public.projeto_cronogramas(id) ON DELETE CASCADE,
    parent_id uuid REFERENCES public.projeto_tarefas(id) ON DELETE CASCADE, -- Para sub-tarefas
    
    nome text NOT NULL,
    descricao text,
    tipo text CHECK (tipo IN ('tarefa', 'etapa', 'marco')) DEFAULT 'tarefa',
    
    -- WBS / Ordenação
    ordem_wbs text, -- Ex: "1.2.3" (opcional, mas útil para ordenação visual)
    indice integer NOT NULL DEFAULT 0, -- Ordem dentro do pai
    nivel integer NOT NULL DEFAULT 0, -- Profundidade na árvore
    
    -- Planejamento
    data_inicio_planejada timestamptz,
    data_fim_planejada timestamptz,
    duracao_dias numeric DEFAULT 0, -- Duração estimada em dias (pode ser fracionado)
    esforco_horas numeric DEFAULT 0, -- Work (Trabalho total estimado em horas)
    
    -- Execução / Tracking
    percentual_concluido integer CHECK (percentual_concluido >= 0 AND percentual_concluido <= 100) DEFAULT 0,
    status text CHECK (status IN ('nao_iniciado', 'em_andamento', 'concluido', 'atrasado', 'cancelado')) DEFAULT 'nao_iniciado',
    data_inicio_real timestamptz,
    data_fim_real timestamptz,
    
    -- Metadados
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Tabela de Dependências (Vínculos)
CREATE TABLE IF NOT EXISTS public.projeto_dependencias (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    cronograma_id uuid NOT NULL REFERENCES public.projeto_cronogramas(id) ON DELETE CASCADE, -- Redundância útil para queries
    tarefa_origem_id uuid NOT NULL REFERENCES public.projeto_tarefas(id) ON DELETE CASCADE,
    tarefa_destino_id uuid NOT NULL REFERENCES public.projeto_tarefas(id) ON DELETE CASCADE,
    tipo_vinculo text CHECK (tipo_vinculo IN ('FS', 'SS', 'FF', 'SF')) DEFAULT 'FS',
    lag_dias numeric DEFAULT 0, -- Lead (negativo) ou Lag (positivo)
    created_at timestamptz DEFAULT now(),
    
    -- Evitar duplicatas
    CONSTRAINT uk_dependencia UNIQUE (tarefa_origem_id, tarefa_destino_id)
);

-- 4. Tabela de Alocação de Recursos
CREATE TABLE IF NOT EXISTS public.projeto_recursos (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tarefa_id uuid NOT NULL REFERENCES public.projeto_tarefas(id) ON DELETE CASCADE,
    
    -- Tipo de Recurso
    tipo_recurso text CHECK (tipo_recurso IN ('humano', 'material', 'equipamento', 'custo')) DEFAULT 'humano',
    
    -- Vínculo com Funcionario (se humano e interno)
    funcionario_id uuid REFERENCES public.funcionarios(id) ON DELETE SET NULL,
    
    -- Nome para recursos externos ou materiais genéricos (Ex: "Betoneira", "Empreiteira X")
    nome_recurso_externo text,
    
    -- Custos e Esforço
    unidade_medida text DEFAULT 'horas', -- horas, dias, m2, m3, un, vb (verba)
    quantidade_planejada numeric DEFAULT 0,
    custo_unitario numeric DEFAULT 0, -- Custo por unidade (R$/h, R$/m3)
    custo_total_planejado numeric GENERATED ALWAYS AS (quantidade_planejada * custo_unitario) STORED,
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Índices para Performance
CREATE INDEX idx_tarefas_cronograma ON public.projeto_tarefas(cronograma_id);
CREATE INDEX idx_tarefas_parent ON public.projeto_tarefas(parent_id);
CREATE INDEX idx_dependencias_cronograma ON public.projeto_dependencias(cronograma_id);
CREATE INDEX idx_dependencias_origem ON public.projeto_dependencias(tarefa_origem_id);
CREATE INDEX idx_dependencias_destino ON public.projeto_dependencias(tarefa_destino_id);
CREATE INDEX idx_recursos_tarefa ON public.projeto_recursos(tarefa_id);

-- RLS (Row Level Security) - Habilitar segurança
ALTER TABLE public.projeto_cronogramas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projeto_tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projeto_dependencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projeto_recursos ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS (Simplificadas: Autenticados podem ver e editar tudo por enquanto, 
-- idealmente deve filtrar por permissões de Obra/Tenant no futuro)

CREATE POLICY "Permitir acesso total a cronogramas para autenticados" ON public.projeto_cronogramas
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir acesso total a tarefas para autenticados" ON public.projeto_tarefas
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir acesso total a dependencias para autenticados" ON public.projeto_dependencias
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir acesso total a recursos para autenticados" ON public.projeto_recursos
    FOR ALL USING (auth.role() = 'authenticated');

-- Comentários para documentação automática
COMMENT ON TABLE public.projeto_cronogramas IS 'Armazena os cabeçalhos dos cronogramas de obras (Gantt)';
COMMENT ON TABLE public.projeto_tarefas IS 'Tabela central do Gantt: armazena a estrutura analítica (WBS) e dados de prazo';
COMMENT ON COLUMN public.projeto_tarefas.tipo IS 'Define se é uma Tarefa executável, uma Etapa agrupadora (Summary) ou um Marco (Milestone)';
COMMENT ON TABLE public.projeto_dependencias IS 'Define a lógica de precedência entre tarefas (FS, SS, etc)';
COMMENT ON TABLE public.projeto_recursos IS 'Alocação de recursos (pessoas, materiais) às tarefas';
