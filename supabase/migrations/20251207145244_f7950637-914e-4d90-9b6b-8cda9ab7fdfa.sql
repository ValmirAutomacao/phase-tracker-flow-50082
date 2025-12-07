
-- ============================================================
-- TABELAS DE RELACIONAMENTO N:N PARA OBRAS/PROJETOS E GANTT
-- ============================================================

-- Responsáveis por Obra (N:N entre obras e funcionarios)
CREATE TABLE IF NOT EXISTS obras_responsaveis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  obra_id UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  funcionario_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  tipo_responsabilidade VARCHAR(50) NOT NULL DEFAULT 'responsavel', -- responsavel, gerente, encarregado, tecnico
  data_atribuicao DATE DEFAULT CURRENT_DATE,
  ativo BOOLEAN DEFAULT TRUE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(obra_id, funcionario_id, tipo_responsabilidade)
);

-- Equipe de Obra (N:N entre obras e funcionarios - alocação de equipe)
CREATE TABLE IF NOT EXISTS obras_equipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  obra_id UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  funcionario_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  funcao_na_obra VARCHAR(100), -- Função específica na obra
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE,
  carga_horaria_semanal INTEGER DEFAULT 44,
  ativo BOOLEAN DEFAULT TRUE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(obra_id, funcionario_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_obras_responsaveis_obra ON obras_responsaveis(obra_id);
CREATE INDEX IF NOT EXISTS idx_obras_responsaveis_funcionario ON obras_responsaveis(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_obras_equipes_obra ON obras_equipes(obra_id);
CREATE INDEX IF NOT EXISTS idx_obras_equipes_funcionario ON obras_equipes(funcionario_id);

-- Habilitar RLS
ALTER TABLE obras_responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE obras_equipes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para obras_responsaveis
CREATE POLICY "obras_responsaveis_read_authenticated" ON obras_responsaveis
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "obras_responsaveis_write_managers" ON obras_responsaveis
  FOR ALL USING (is_manager()) WITH CHECK (is_manager());

-- Políticas RLS para obras_equipes
CREATE POLICY "obras_equipes_read_authenticated" ON obras_equipes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "obras_equipes_write_managers" ON obras_equipes
  FOR ALL USING (is_manager()) WITH CHECK (is_manager());

-- Adicionar campo responsavel_id na tabela obras (responsável principal)
ALTER TABLE obras ADD COLUMN IF NOT EXISTS responsavel_id UUID REFERENCES funcionarios(id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_obras_relacionamentos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_obras_responsaveis_updated_at
  BEFORE UPDATE ON obras_responsaveis
  FOR EACH ROW EXECUTE FUNCTION update_obras_relacionamentos_updated_at();

CREATE TRIGGER update_obras_equipes_updated_at
  BEFORE UPDATE ON obras_equipes
  FOR EACH ROW EXECUTE FUNCTION update_obras_relacionamentos_updated_at();
