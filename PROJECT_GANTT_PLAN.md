# Planejamento de Implementação: Módulo de Gestão de Projetos e Gantt Avançado

Este documento detalha o roteiro para transformar a funcionalidade básica de obras existente em um sistema robusto de Gerenciamento de Projetos (PPM), comparável às funcionalidades core do MS Project, adaptado para o contexto de Engenharia e Arquitetura no Brasil.

## 1. Visão Geral e Objetivos

O objetivo é desacoplar o cronograma do cadastro básico da obra, permitindo um planejamento complexo com dependências, múltiplos recursos, análise de caminho crítico e controle financeiro detalhado.

### Principais Mudanças Conceituais
- **Desacoplamento:** "Etapas" deixam de ser um campo JSON dentro da tabela `obras` e tornam-se entidades relacionais independentes (Tarefas).
- **Profundidade:** Suporte a hierarquia infinita (EAP/WBS), não apenas uma lista plana de etapas.
- **Interatividade:** O gráfico de Gantt deixa de ser apenas visualização e passa a ser a ferramenta de edição do cronograma.

## 2. Glossário Técnico (Localização para Engenharia/Arquitetura BR)

| Termo MS Project (EN) | Termo Sistema (PT-BR) | Definição Técnica |
|-----------------------|-----------------------|-------------------|
| **Task** | **Atividade** ou **Tarefa** | Menor unidade de trabalho gerenciável. |
| **Summary Task** | **Etapa** ou **Pacote de Trabalho** | Tarefa agrupadora que consolida prazos e custos das filhas. |
| **WBS (Work Breakdown Structure)** | **EAP (Estrutura Analítica do Projeto)** | Hierarquia que organiza o escopo total do projeto. |
| **Milestone** | **Marco** ou **Entrega** | Ponto de controle com duração zero (ex: "Concretagem Finalizada"). |
| **Dependency** | **Vínculo** ou **Precedência** | Relação lógica entre tarefas (ex: FS - Término-Início). |
| **Lead / Lag** | **Antecipação / Espera** | Tempo de sobreposição ou atraso entre tarefas vinculadas. |
| **Baseline** | **Linha de Base** | "Fotografia" do plano aprovado para comparação futura (Previsto x Realizado). |
| **Resource** | **Recurso** | Pessoas, Equipamentos ou Materiais necessários para executar a tarefa. |
| **Assignment** | **Alocação** | Vínculo entre um Recurso e uma Tarefa. |
| **Leveling** | **Nivelamento** | Resolução de conflitos de superalocação de recursos. |
| **Critical Path** | **Caminho Crítico** | Sequência de tarefas que determina a duração mínima do projeto. |

## 3. Análise da Situação Atual (AS-IS)

- **Dados:** As etapas são armazenadas em uma coluna `jsonb` (`etapas`) dentro da tabela `obras`.
- **Estrutura:** Lista plana ou com hierarquia simples simulada no JSON.
- **Visualização:** Componente `GanttTimeline.tsx` customizado, apenas leitura ou com interatividade limitada.
- **Recursos:** Tabela `funcionarios` existe, mas não há vínculo direto (N:N) com tarefas específicas com definição de esforço/custo.

## 4. Arquitetura Proposta (TO-BE)

### 4.1. Modelagem de Dados (Novas Tabelas Supabase)

Será necessário criar uma estrutura relacional para suportar a complexidade.

```sql
-- Tabela Mestra de Projetos (Extensão da Obra ou Nova Entidade)
-- Pode-se manter 'obras' como a entidade principal e criar 'projeto_cronogramas'
CREATE TABLE projeto_cronogramas (
    id uuid PRIMARY KEY,
    obra_id uuid REFERENCES obras(id),
    nome text,
    ativo boolean DEFAULT true,
    data_base_inicial date,
    created_at timestamptz
);

-- Tabela de Tarefas (O coração do Gantt)
CREATE TABLE projeto_tarefas (
    id uuid PRIMARY KEY,
    cronograma_id uuid REFERENCES projeto_cronogramas(id),
    parent_id uuid REFERENCES projeto_tarefas(id), -- Para hierarquia (EAP)
    nome text NOT NULL,
    descricao text,
    tipo text CHECK (tipo IN ('tarefa', 'etapa', 'marco')),
    
    -- Planejamento
    data_inicio_planejada timestamptz,
    data_fim_planejada timestamptz,
    duracao_dias numeric, -- Duração estimada
    esforço_horas numeric, -- Work (Trabalho total)
    
    -- Execução
    percentual_concluido integer DEFAULT 0,
    status text DEFAULT 'nao_iniciado',
    data_inicio_real timestamptz,
    data_fim_real timestamptz,
    
    -- Ordenação na WBS
    ordem_wbs text, -- ex: "1.2.3"
    indice integer
);

-- Tabela de Vínculos (Dependências)
CREATE TABLE projeto_dependencias (
    id uuid PRIMARY KEY,
    tarefa_origem_id uuid REFERENCES projeto_tarefas(id), -- Predecessora
    tarefa_destino_id uuid REFERENCES projeto_tarefas(id), -- Sucessora
    tipo_vinculo text DEFAULT 'FS', -- FS (Finish-Start), SS, FF, SF
    lag_dias numeric DEFAULT 0 -- Tempo de espera ou antecipação (negativo)
);

-- Tabela de Alocação de Recursos
CREATE TABLE projeto_recursos (
    id uuid PRIMARY KEY,
    tarefa_id uuid REFERENCES projeto_tarefas(id),
    tipo_recurso text CHECK (tipo_recurso IN ('humano', 'material', 'equipamento', 'custo')),
    
    -- Referências Opcionais (Polimorfismo)
    funcionario_id uuid REFERENCES funcionarios(id), -- Se for humano interno
    nome_recurso_externo text, -- Se for terceirizado ou material
    
    -- Custos e Esforço
    unidade_medida text, -- "horas", "m3", "un"
    quantidade_planejada numeric,
    custo_unitario numeric,
    custo_total_planejado numeric
);
```

## 5. Roteiro de Implementação (Phases)

### Fase 1: Reestruturação de Dados (Backend First)
1.  [ ] Criar as migrações SQL para as novas tabelas (`cronogramas`, `tarefas`, `dependencias`, `recursos`).
2.  [ ] Criar script de migração de dados: Ler o JSON `etapas` das obras existentes e converter em linhas na tabela `projeto_tarefas`.
3.  [ ] Atualizar os tipos TypeScript (`src/integrations/supabase/types.ts`) e gerar interfaces de domínio.

### Fase 2: Refatoração do Cadastro de Obras
1.  [ ] Remover a seção de "Etapas" do formulário de criação/edição de Obras (`ObrasForm.tsx`).
2.  [ ] Criar uma rota/página dedicada: `/obras/:id/planejamento`.
3.  [ ] Garantir que ao criar uma Obra, um `cronograma` padrão seja criado automaticamente.

### Fase 3: Interface Gantt Interativa (O Core)
1.  [ ] Implementar biblioteca de Gantt robusta (Sugestão: `gantt-task-react` para começar, ou componente customizado via SVG/Canvas se precisarmos de performance extrema, mas bibliotecas prontas aceleram o MVP).
2.  [ ] Funcionalidades da View:
    - [ ] Visualizar hierarquia (WBS).
    - [ ] Expandir/Colher Etapas.
    - [ ] Renderizar barras de tarefas e losangos de marcos.
    - [ ] Desenhar linhas de dependência.
3.  [ ] Funcionalidades de Edição:
    - [ ] Drag & drop para mover tarefas (atualiza datas).
    - [ ] Resize para alterar duração.
    - [ ] Modal de detalhes da tarefa (Edição completa).

### Fase 4: Gestão de Recursos e Custos
1.  [ ] Interface para atribuir funcionários/recursos às tarefas selecionadas.
2.  [ ] Cálculo automático: `Duração * Custo Recurso = Custo Tarefa`.
3.  [ ] Rollup de custos: A soma das tarefas alimenta o custo da Etapa, que alimenta o custo da Obra.

### Fase 5: Monitoramento e Baseline
1.  [ ] Implementar lógica de "Linha de Base" (Salvar cópia estática das datas/custos).
2.  [ ] Visualização "Tracking Gantt" (Comparar barra cinza da baseline com barra colorida do real).
3.  [ ] Dashboards de Avanço Físico vs. Financeiro.

## 6. Próximos Passos Imediatos

1.  Aprovar este plano.
2.  Executar a **Fase 1 (Migrações SQL)**.
3.  Executar a **Fase 2 (Limpeza do Form de Obras)**.
