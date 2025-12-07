-- Tabela para associar funcionários responsáveis às tarefas (eap_itens)
CREATE TABLE public.tarefa_responsaveis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tarefa_id UUID NOT NULL REFERENCES public.eap_itens(id) ON DELETE CASCADE,
  funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  papel VARCHAR(50) DEFAULT 'responsavel',
  observacoes TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  criado_por UUID,
  UNIQUE(tarefa_id, funcionario_id)
);

-- Habilitar RLS
ALTER TABLE public.tarefa_responsaveis ENABLE ROW LEVEL SECURITY;

-- Política para visualização
CREATE POLICY "Usuários podem visualizar responsáveis de tarefas permitidas"
ON public.tarefa_responsaveis FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM eap_itens ei
    JOIN cronogramas c ON c.id = ei.cronograma_id
    JOIN obras o ON o.id = c.obra_id
    WHERE ei.id = tarefa_responsaveis.tarefa_id
  )
);

-- Política para inserção
CREATE POLICY "Usuários podem inserir responsáveis em tarefas permitidas"
ON public.tarefa_responsaveis FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM eap_itens ei
    JOIN cronogramas c ON c.id = ei.cronograma_id
    JOIN obras o ON o.id = c.obra_id
    WHERE ei.id = tarefa_responsaveis.tarefa_id
  )
);

-- Política para atualização
CREATE POLICY "Usuários podem atualizar responsáveis de tarefas permitidas"
ON public.tarefa_responsaveis FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM eap_itens ei
    JOIN cronogramas c ON c.id = ei.cronograma_id
    JOIN obras o ON o.id = c.obra_id
    WHERE ei.id = tarefa_responsaveis.tarefa_id
  )
);

-- Política para exclusão
CREATE POLICY "Usuários podem excluir responsáveis de tarefas permitidas"
ON public.tarefa_responsaveis FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM eap_itens ei
    JOIN cronogramas c ON c.id = ei.cronograma_id
    JOIN obras o ON o.id = c.obra_id
    WHERE ei.id = tarefa_responsaveis.tarefa_id
  )
);

-- Índices para performance
CREATE INDEX idx_tarefa_responsaveis_tarefa ON public.tarefa_responsaveis(tarefa_id);
CREATE INDEX idx_tarefa_responsaveis_funcionario ON public.tarefa_responsaveis(funcionario_id);