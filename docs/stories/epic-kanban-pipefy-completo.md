# Epic: Sistema Kanban Completo (Pipefy-like) no EngFlow

## 📋 Visão Geral

**Objetivo:** Implementar um sistema Kanban completo com TODAS as funcionalidades do Pipefy integrado ao EngFlow.

**Duração Total:** 4-6 meses (estimativa: 20-26 semanas)

**Equipe Estimada:** 
- 2-3 Desenvolvedores Full Stack
- 1 UX/UI Designer
- 1 QA Engineer
- 1 Product Owner

---

## 🏗️ Arquitetura Técnica

### Stack Tecnológico

**Frontend:**
- React + TypeScript
- @dnd-kit/core (Drag & Drop)
- react-quill (Editor rico)
- react-chartjs-2 (Gráficos)
- zustand (State management)
- react-hook-form (Formulários)
- date-fns (Manipulação de datas)

**Backend:**
- Supabase (PostgreSQL)
- Row Level Security (RLS)
- Realtime Subscriptions
- Edge Functions (Automações)

**Integrações:**
- n8n (Automações externas)
- Google Drive API (Anexos)
- Email notifications

### Estrutura de Dados

```sql
-- Boards (Pipes)
boards
├── board_phases (Fases)
├── board_cards (Cards)
│   ├── card_fields (Campos customizados)
│   ├── card_comments (Comentários)
│   ├── card_attachments (Anexos)
│   ├── card_history (Histórico)
│   └── card_checklists (Checklists)
├── board_automations (Automações)
├── board_templates (Templates)
└── board_permissions (Permissões)
```

---

## 📅 FASE 1: MVP Kanban Básico (3-4 semanas)

### Objetivos
- Sistema Kanban funcional básico
- CRUD completo de boards, fases e cards
- Drag & Drop entre fases
- Integração com módulo Obras existente

### Funcionalidades

#### 1.1 Gestão de Boards (Pipes)
- ✅ Criar/editar/deletar boards
- ✅ Múltiplos boards por organização
- ✅ Boards vinculados a Obras
- ✅ Boards independentes (genéricos)
- ✅ Descrição e cores personalizadas

#### 1.2 Gestão de Fases (Phases)
- ✅ Criar/editar/deletar fases
- ✅ Reordenar fases (drag & drop)
- ✅ Definir cores por fase
- ✅ Configurar se fase é inicial/final
- ✅ Limitar número de cards por fase (WIP)

#### 1.3 Cards Básicos
- ✅ Criar/editar/deletar cards
- ✅ Mover cards entre fases (drag & drop)
- ✅ Campos básicos:
  - Título
  - Descrição (texto simples)
  - Responsável (funcionário)
  - Data de vencimento
  - Prioridade (baixa/média/alta)
  - Tags
- ✅ Visualização em modal
- ✅ Arquivar cards

#### 1.4 UI/UX Básico
- ✅ Layout responsivo
- ✅ Vista Kanban (colunas)
- ✅ Filtros básicos (responsável, tags)
- ✅ Busca por título

### Database Schema

```sql
-- Boards (Pipes)
CREATE TABLE boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  cor VARCHAR(7),
  obra_id UUID REFERENCES obras(id) ON DELETE CASCADE,
  tipo VARCHAR(50) DEFAULT 'generico', -- 'obra', 'requisicao', 'generico'
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Fases dos Boards
CREATE TABLE board_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  cor VARCHAR(7),
  ordem INTEGER NOT NULL,
  is_inicial BOOLEAN DEFAULT false,
  is_final BOOLEAN DEFAULT false,
  limite_wip INTEGER, -- Work In Progress limit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Cards
CREATE TABLE board_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES board_phases(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  responsavel_id UUID REFERENCES funcionarios(id),
  data_vencimento DATE,
  prioridade VARCHAR(20) DEFAULT 'media', -- 'baixa', 'media', 'alta', 'critica'
  tags JSONB DEFAULT '[]',
  ordem INTEGER NOT NULL,
  arquivado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_boards_obra ON boards(obra_id);
CREATE INDEX idx_phases_board ON board_phases(board_id);
CREATE INDEX idx_cards_board ON board_cards(board_id);
CREATE INDEX idx_cards_phase ON board_cards(phase_id);
CREATE INDEX idx_cards_responsavel ON board_cards(responsavel_id);
```

### Componentes UI

```
src/pages/kanban/
├── KanbanPage.tsx (Listagem de boards)
├── BoardView.tsx (Vista do board)
└── CardModal.tsx (Detalhes do card)

src/components/kanban/
├── KanbanBoard.tsx (Container principal)
├── KanbanPhase.tsx (Coluna de fase)
├── KanbanCard.tsx (Card individual)
├── BoardForm.tsx (Criar/editar board)
├── PhaseForm.tsx (Criar/editar fase)
└── CardForm.tsx (Criar/editar card)

src/hooks/kanban/
├── useBoards.ts
├── useBoardPhases.ts
├── useBoardCards.ts
└── useCardDragDrop.ts

src/lib/kanban/
├── kanbanService.ts (API calls)
└── kanbanTypes.ts (TypeScript types)
```

### Testes
- ✅ CRUD de boards
- ✅ CRUD de fases
- ✅ CRUD de cards
- ✅ Drag & drop funcional
- ✅ Filtros e busca
- ✅ RLS policies

**Tempo Estimado:** 3-4 semanas

---

## 📅 FASE 2: Cards Avançados & Campos Customizados (4-5 semanas)

### Objetivos
- Campos customizados ilimitados por board
- Tipos de campos avançados
- Relacionamentos entre cards
- Checklists e subtarefas

### Funcionalidades

#### 2.1 Campos Customizados
- ✅ Criar campos customizados por board
- ✅ Tipos de campos:
  - Texto curto
  - Texto longo (textarea)
  - Número
  - Moeda
  - Data
  - Data/Hora
  - Select (dropdown)
  - Multi-select
  - Checkbox
  - Email
  - Telefone
  - URL
  - CPF/CNPJ
  - CEP
  - Arquivo (upload)
- ✅ Configurar campos obrigatórios
- ✅ Validações customizadas
- ✅ Valores padrão

#### 2.2 Editor Rico
- ✅ Descrição com formatação (Quill.js)
- ✅ Markdown support
- ✅ Menções (@usuário)
- ✅ Upload de imagens inline

#### 2.3 Relacionamentos
- ✅ Conectar cards (dependências)
- ✅ Cards pai-filho (subtarefas)
- ✅ Cards bloqueadores
- ✅ Visualização de relacionamentos

#### 2.4 Checklists
- ✅ Múltiplas checklists por card
- ✅ Itens com checkbox
- ✅ Progresso visual (%)
- ✅ Atribuir responsáveis a itens

#### 2.5 Anexos
- ✅ Upload de arquivos
- ✅ Integração Google Drive
- ✅ Prévia de imagens
- ✅ Versionamento de arquivos

### Database Schema

```sql
-- Definição de campos customizados por board
CREATE TABLE board_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- 'text', 'number', 'date', 'select', etc.
  configuracao JSONB, -- opcoes, validacoes, etc.
  obrigatorio BOOLEAN DEFAULT false,
  ordem INTEGER NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Valores dos campos customizados
CREATE TABLE card_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES board_cards(id) ON DELETE CASCADE,
  field_definition_id UUID NOT NULL REFERENCES board_field_definitions(id) ON DELETE CASCADE,
  valor JSONB, -- valor dinâmico
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(card_id, field_definition_id)
);

-- Relacionamentos entre cards
CREATE TABLE card_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_origem_id UUID NOT NULL REFERENCES board_cards(id) ON DELETE CASCADE,
  card_destino_id UUID NOT NULL REFERENCES board_cards(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL, -- 'depende_de', 'bloqueia', 'relacionado', 'pai_filho'
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (card_origem_id != card_destino_id)
);

-- Checklists
CREATE TABLE card_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES board_cards(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  ordem INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES card_checklists(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  concluido BOOLEAN DEFAULT false,
  responsavel_id UUID REFERENCES funcionarios(id),
  ordem INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Anexos
CREATE TABLE card_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES board_cards(id) ON DELETE CASCADE,
  nome_arquivo TEXT NOT NULL,
  url TEXT NOT NULL,
  tipo_mime VARCHAR(100),
  tamanho_bytes BIGINT,
  drive_file_id TEXT, -- ID do Google Drive
  uploader_id UUID REFERENCES funcionarios(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Componentes UI

```
src/components/kanban/fields/
├── FieldBuilder.tsx (Criar campos customizados)
├── FieldRenderer.tsx (Renderizar campo por tipo)
├── TextFieldInput.tsx
├── NumberFieldInput.tsx
├── DateFieldInput.tsx
├── SelectFieldInput.tsx
└── FileFieldInput.tsx

src/components/kanban/card/
├── CardRelationships.tsx
├── CardChecklists.tsx
├── ChecklistItem.tsx
├── CardAttachments.tsx
└── RichTextEditor.tsx
```

### Testes
- ✅ Criação de campos customizados
- ✅ Validações de campos
- ✅ Relacionamentos entre cards
- ✅ Checklists funcionais
- ✅ Upload de anexos
- ✅ Performance com muitos campos

**Tempo Estimado:** 4-5 semanas

---

## 📅 FASE 3: Automações & Workflows (5-6 semanas)

### Objetivos
- Sistema completo de automações
- Triggers e ações configuráveis
- Integração com n8n
- Notificações automáticas

### Funcionalidades

#### 3.1 Automações Internas
- ✅ Builder visual de automações
- ✅ Triggers:
  - Card criado
  - Card movido para fase
  - Campo alterado
  - Data de vencimento próxima
  - Card atrasado
  - Comentário adicionado
  - Checklist completa
- ✅ Condições:
  - Se campo X = valor Y
  - Se responsável = usuário
  - Se data < hoje
  - Se fase = fase X
  - Condições compostas (AND/OR)
- ✅ Ações:
  - Mover para fase
  - Alterar responsável
  - Alterar campo
  - Criar card filho
  - Enviar notificação
  - Enviar email
  - Adicionar comentário
  - Adicionar tag
  - Executar webhook

#### 3.2 Integração n8n
- ✅ Trigger webhooks para n8n
- ✅ Receber dados do n8n
- ✅ Automações externas (OCR, Email, etc.)

#### 3.3 Notificações
- ✅ Notificações in-app
- ✅ Email notifications
- ✅ Configurar preferências de notificação
- ✅ Resumo diário/semanal

#### 3.4 SLA & Prazos
- ✅ Definir SLA por fase
- ✅ Alertas de SLA próximo
- ✅ Métricas de cumprimento

### Database Schema

```sql
-- Automações
CREATE TABLE board_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  trigger_tipo VARCHAR(50) NOT NULL,
  trigger_config JSONB, -- configuração do trigger
  condicoes JSONB, -- array de condições
  acoes JSONB, -- array de ações
  ordem INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Log de execuções de automações
CREATE TABLE automation_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES board_automations(id) ON DELETE CASCADE,
  card_id UUID REFERENCES board_cards(id) ON DELETE SET NULL,
  sucesso BOOLEAN NOT NULL,
  erro TEXT,
  dados_execucao JSONB,
  executed_at TIMESTAMPTZ DEFAULT now()
);

-- Notificações
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL, -- 'card_atribuido', 'comentario', 'vencimento', etc.
  titulo TEXT NOT NULL,
  mensagem TEXT,
  lida BOOLEAN DEFAULT false,
  url TEXT, -- link para o card/board
  card_id UUID REFERENCES board_cards(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Preferências de notificações
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  tipo_notificacao VARCHAR(50) NOT NULL,
  in_app BOOLEAN DEFAULT true,
  email BOOLEAN DEFAULT false,
  UNIQUE(user_id, tipo_notificacao)
);

-- SLA por fase
CREATE TABLE phase_sla (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES board_phases(id) ON DELETE CASCADE,
  tempo_limite_horas INTEGER NOT NULL,
  alerta_antecedencia_horas INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Edge Functions

```typescript
// supabase/functions/process-automation/index.ts
// Processa automações em background

// supabase/functions/send-notifications/index.ts
// Envia notificações por email

// supabase/functions/sla-monitor/index.ts
// Monitora SLAs e dispara alertas
```

### Componentes UI

```
src/components/kanban/automations/
├── AutomationBuilder.tsx (Builder visual)
├── TriggerSelector.tsx
├── ConditionBuilder.tsx
├── ActionBuilder.tsx
└── AutomationList.tsx

src/components/notifications/
├── NotificationCenter.tsx
├── NotificationItem.tsx
└── NotificationPreferences.tsx
```

### Testes
- ✅ Criação de automações
- ✅ Execução de triggers
- ✅ Condições funcionando
- ✅ Ações executadas corretamente
- ✅ Notificações enviadas
- ✅ Performance com muitas automações

**Tempo Estimado:** 5-6 semanas

---

## 📅 FASE 4: Formulários, Templates & Relatórios (4-5 semanas)

### Objetivos
- Formulários públicos para criação de cards
- Templates reutilizáveis
- Dashboards e relatórios avançados
- Exportação de dados

### Funcionalidades

#### 4.1 Formulários Públicos
- ✅ Criar formulários baseados nos campos do board
- ✅ Gerar links públicos
- ✅ Formulários embedáveis (iframe)
- ✅ Customizar campos visíveis
- ✅ Notificar criação via formulário
- ✅ Recaptcha para segurança

#### 4.2 Templates
- ✅ Criar templates de boards
- ✅ Templates de cards
- ✅ Clonar boards completos
- ✅ Biblioteca de templates
- ✅ Importar/exportar templates

#### 4.3 Relatórios & Analytics
- ✅ Dashboard por board:
  - Cards por fase
  - Cards por responsável
  - Taxa de conclusão
  - Tempo médio por fase
  - Cards atrasados
  - Throughput (cards/semana)
  - Lead time
  - Cycle time
- ✅ Gráficos:
  - Burndown
  - Cumulative flow
  - Velocity
  - Controle de SLA
- ✅ Filtros de período
- ✅ Comparação entre boards

#### 4.4 Exportação
- ✅ Exportar para CSV
- ✅ Exportar para Excel
- ✅ Exportar para PDF
- ✅ Agendamento de relatórios

### Database Schema

```sql
-- Formulários públicos
CREATE TABLE board_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  public_token TEXT UNIQUE NOT NULL,
  campos_visiveis JSONB, -- array de field IDs
  fase_destino_id UUID REFERENCES board_phases(id),
  ativo BOOLEAN DEFAULT true,
  requires_captcha BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Submissões de formulários
CREATE TABLE form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES board_forms(id) ON DELETE CASCADE,
  card_id UUID REFERENCES board_cards(id) ON DELETE SET NULL,
  dados JSONB NOT NULL,
  ip_address INET,
  user_agent TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

-- Templates de boards
CREATE TABLE board_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria VARCHAR(50),
  board_config JSONB NOT NULL, -- configuração completa do board
  publico BOOLEAN DEFAULT false,
  criador_id UUID REFERENCES funcionarios(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Templates de cards
CREATE TABLE card_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  card_config JSONB NOT NULL, -- campos preenchidos
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Métricas calculadas (cache)
CREATE TABLE board_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  metricas JSONB NOT NULL, -- todas as métricas do dia
  calculated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(board_id, data)
);
```

### Componentes UI

```
src/components/kanban/forms/
├── FormBuilder.tsx
├── PublicForm.tsx (página pública)
└── FormSubmissions.tsx

src/components/kanban/templates/
├── TemplateGallery.tsx
├── TemplateSelector.tsx
└── TemplateEditor.tsx

src/components/kanban/reports/
├── BoardDashboard.tsx
├── MetricsCards.tsx
├── BurndownChart.tsx
├── CumulativeFlowChart.tsx
├── VelocityChart.tsx
└── ExportDialog.tsx
```

### Testes
- ✅ Formulários públicos funcionais
- ✅ Criação via formulário
- ✅ Templates aplicados corretamente
- ✅ Métricas calculadas corretamente
- ✅ Gráficos renderizando
- ✅ Exportações funcionais

**Tempo Estimado:** 4-5 semanas

---

## 📅 FASE 5: Colaboração, Permissões & Recursos Avançados (4-5 semanas)

### Objetivos
- Sistema completo de permissões granulares
- Colaboração em tempo real
- Recursos avançados de UX
- Otimizações de performance

### Funcionalidades

#### 5.1 Permissões Granulares
- ✅ Permissões por board:
  - Visualizar
  - Criar cards
  - Editar cards
  - Deletar cards
  - Gerenciar fases
  - Gerenciar automações
  - Administrador
- ✅ Permissões por fase
- ✅ Permissões por usuário/grupo
- ✅ Visibility rules (cards visíveis só para alguns)

#### 5.2 Colaboração
- ✅ Comentários em cards
- ✅ Menções @usuário
- ✅ Reações (👍 ❤️ 🎉)
- ✅ Histórico de atividades
- ✅ Quem está visualizando (presence)
- ✅ Edição colaborativa em tempo real

#### 5.3 Histórico & Auditoria
- ✅ Log completo de mudanças
- ✅ Quem alterou o quê e quando
- ✅ Reverter alterações
- ✅ Exportar histórico

#### 5.4 Recursos Avançados
- ✅ Vistas alternativas:
  - Lista
  - Tabela
  - Calendário
  - Timeline (Gantt)
  - Mapa mental
- ✅ Filtros salvos
- ✅ Ordenação customizada
- ✅ Agrupamento por campo
- ✅ Pesquisa avançada (full-text)
- ✅ Atalhos de teclado
- ✅ Modo offline (PWA)

#### 5.5 Performance
- ✅ Virtualização de listas longas
- ✅ Lazy loading de cards
- ✅ Caching inteligente
- ✅ Otimização de queries

### Database Schema

```sql
-- Permissões de board
CREATE TABLE board_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES funcionarios(id),
  funcao_id UUID REFERENCES funcoes(id),
  permissoes JSONB NOT NULL, -- array de permissões
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (user_id IS NOT NULL OR funcao_id IS NOT NULL)
);

-- Comentários
CREATE TABLE card_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES board_cards(id) ON DELETE CASCADE,
  autor_id UUID NOT NULL REFERENCES funcionarios(id),
  texto TEXT NOT NULL,
  mencoes JSONB DEFAULT '[]', -- array de user IDs mencionados
  parent_id UUID REFERENCES card_comments(id), -- para threads
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Reações a comentários
CREATE TABLE comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES card_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES funcionarios(id),
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comment_id, user_id, emoji)
);

-- Histórico de mudanças
CREATE TABLE card_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES board_cards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES funcionarios(id),
  acao VARCHAR(50) NOT NULL, -- 'criado', 'movido', 'campo_alterado', etc.
  campo_alterado TEXT,
  valor_anterior JSONB,
  valor_novo JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Vistas salvas
CREATE TABLE saved_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES funcionarios(id),
  nome TEXT NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- 'kanban', 'lista', 'tabela', 'calendario'
  filtros JSONB,
  ordenacao JSONB,
  agrupamento VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Presence (quem está onde)
CREATE TABLE board_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES funcionarios(id),
  card_id UUID REFERENCES board_cards(id) ON DELETE SET NULL,
  last_seen TIMESTAMPTZ DEFAULT now(),
  UNIQUE(board_id, user_id)
);
```

### Componentes UI

```
src/components/kanban/permissions/
├── PermissionsManager.tsx
├── UserPermissions.tsx
└── RolePermissions.tsx

src/components/kanban/comments/
├── CommentsList.tsx
├── CommentItem.tsx
├── CommentForm.tsx
└── ReactionPicker.tsx

src/components/kanban/views/
├── ListView.tsx
├── TableView.tsx
├── CalendarView.tsx
├── TimelineView.tsx
└── ViewSelector.tsx

src/components/kanban/history/
├── ActivityFeed.tsx
├── HistoryItem.tsx
└── HistoryFilter.tsx
```

### Realtime Features

```typescript
// Supabase Realtime subscriptions
- boards (insert, update, delete)
- board_cards (insert, update, delete)
- card_comments (insert)
- board_presence (update)
```

### Testes
- ✅ Permissões funcionando corretamente
- ✅ Comentários e menções
- ✅ Histórico completo
- ✅ Vistas alternativas
- ✅ Realtime sincronizando
- ✅ Performance com 1000+ cards

**Tempo Estimado:** 4-5 semanas

---

## 📊 Cronograma Visual (Gantt)

```
Mês 1    |████████████████| FASE 1: MVP Básico (4 sem)
Mês 2    |████████████████████| FASE 2: Cards Avançados (5 sem)
Mês 3    |██████████████████████| FASE 2 (cont.) + FASE 3: Automações (1+5 sem)
Mês 4    |████████████████████| FASE 3 (cont.) + FASE 4: Relatórios (1+4 sem)
Mês 5    |██████████████████████| FASE 4 (cont.) + FASE 5: Colaboração (1+5 sem)
Mês 6    |████████████| FASE 5 (cont.) + Testes Finais (3 sem)

Total: 24-26 semanas (6 meses)
```

---

## 🎯 Marcos (Milestones)

### M1: MVP Funcional (Fim Fase 1)
- ✅ Sistema Kanban básico operacional
- ✅ Integrado ao módulo Obras
- ✅ CRUD completo

### M2: Cards Profissionais (Fim Fase 2)
- ✅ Campos customizados ilimitados
- ✅ Relacionamentos entre cards
- ✅ Editor rico

### M3: Automação Completa (Fim Fase 3)
- ✅ Builder de automações funcional
- ✅ Integração n8n
- ✅ Notificações automáticas

### M4: Análise Avançada (Fim Fase 4)
- ✅ Formulários públicos
- ✅ Dashboards completos
- ✅ Exportação de dados

### M5: Sistema Completo (Fim Fase 5)
- ✅ Permissões granulares
- ✅ Colaboração em tempo real
- ✅ Todas as funcionalidades Pipefy

---

## 🚨 Riscos e Mitigações

### Riscos Técnicos

**R1: Performance com muitos cards**
- **Impacto:** Alto
- **Probabilidade:** Média
- **Mitigação:** 
  - Virtualização de listas
  - Paginação inteligente
  - Índices otimizados no DB
  - Caching agressivo

**R2: Complexidade das automações**
- **Impacto:** Alto
- **Probabilidade:** Média
- **Mitigação:**
  - Queue system para processar em background
  - Rate limiting
  - Logs detalhados de execução
  - Testes extensivos

**R3: Sincronização em tempo real**
- **Impacto:** Médio
- **Probabilidade:** Baixa
- **Mitigação:**
  - Usar Supabase Realtime (maduro)
  - Fallback para polling
  - Conflict resolution strategy

### Riscos de Negócio

**R4: Scope creep**
- **Impacto:** Alto
- **Probabilidade:** Alta
- **Mitigação:**
  - Seguir estritamente o plano faseado
  - Sprint reviews e demos
  - Documentação clara de requisitos

**R5: Adoção dos usuários**
- **Impacto:** Alto
- **Probabilidade:** Média
- **Mitigação:**
  - Testes com usuários reais a cada fase
  - Onboarding intuitivo
  - Documentação e vídeos tutoriais

---

## ✅ Critérios de Sucesso

### Técnicos
- [ ] Sistema suporta 10.000+ cards sem degradação
- [ ] Tempo de resposta < 200ms para operações comuns
- [ ] 99.9% uptime
- [ ] 100% cobertura de testes nas funcionalidades críticas
- [ ] Zero vulnerabilidades de segurança críticas

### Funcionais
- [ ] 100% paridade com funcionalidades do Pipefy
- [ ] Formulários públicos com 1000+ submissões/dia
- [ ] Automações executando corretamente 99.9% das vezes
- [ ] Relatórios gerados em < 3 segundos

### Negócio
- [ ] 80%+ dos usuários usando o sistema semanalmente
- [ ] NPS > 8
- [ ] Redução de 40% no tempo de gestão de projetos
- [ ] ROI positivo em 6 meses pós-lançamento

---

## 📚 Documentação Necessária

### Para Desenvolvedores
- [ ] Architecture Decision Records (ADRs)
- [ ] API Documentation (OpenAPI/Swagger)
- [ ] Database Schema Documentation
- [ ] Component Library Storybook
- [ ] Testing Guidelines

### Para Usuários
- [ ] Manual do Usuário
- [ ] Vídeos Tutoriais (5-10 min cada)
- [ ] FAQs
- [ ] Guia de Onboarding
- [ ] Changelog público

---

## 💰 Estimativa de Custos

### Desenvolvimento
- **Equipe (6 meses):** 2-3 devs + designer + QA + PO
- **Infraestrutura Supabase:** ~$100-300/mês (dependendo do uso)
- **Serviços externos:** Google Drive API, Email (SendGrid), n8n
- **Total estimado:** Depende dos salários da equipe

### Manutenção (pós-lançamento)
- **Infraestrutura:** $300-500/mês
- **Suporte:** 1 dev part-time
- **Updates e melhorias:** Ongoing

---

## 🎓 Treinamento da Equipe

### Tecnologias Novas
- [ ] @dnd-kit/core workshop (Drag & Drop)
- [ ] Supabase Realtime deep dive
- [ ] Edge Functions best practices
- [ ] React Query advanced patterns
- [ ] Zustand state management

### Domínio de Negócio
- [ ] Workshop sobre Kanban/Agile
- [ ] Análise do Pipefy (hands-on)
- [ ] User Stories e Product Discovery

---

## 🚀 Próximos Passos Imediatos

1. **Aprovação do Plano** (Esta semana)
   - Review com stakeholders
   - Ajustes finais no cronograma
   - Aprovação formal

2. **Kick-off FASE 1** (Semana 1)
   - Setup do ambiente de desenvolvimento
   - Criação dos repositórios
   - Primeira sprint planning
   - Design inicial das telas

3. **Sprint 1 - FASE 1** (Semanas 1-2)
   - Database schema básico
   - CRUD de Boards
   - UI básico do Kanban

4. **Sprint 2 - FASE 1** (Semanas 3-4)
   - Drag & Drop funcional
   - CRUD de Cards
   - Integração com Obras

---

## 📞 Contatos e Responsabilidades

**Product Owner:** [Nome]
- Decisões de produto
- Priorização de features
- Aceite de entregas

**Tech Lead:** [Nome]
- Arquitetura técnica
- Code reviews
- Performance

**Scrum Master:** [Nome]
- Cerimônias ágeis
- Remoção de impedimentos
- Métricas de time

---

## 📈 KPIs de Acompanhamento

### Por Sprint
- Velocity (story points)
- Burndown
- Bugs encontrados vs. resolvidos
- Code coverage

### Por Fase
- Features completadas vs. planejadas
- Tech debt acumulado
- Performance benchmarks
- User satisfaction score

---

## 🎉 Conclusão

Este plano representa **6 meses de desenvolvimento intenso** para criar um sistema Kanban completo e profissional, com **paridade total ao Pipefy**.

O sucesso depende de:
✅ Equipe dedicada e qualificada
✅ Seguir o cronograma faseado rigorosamente
✅ Testes constantes com usuários reais
✅ Comunicação clara entre todos os envolvidos
✅ Flexibilidade para ajustes no caminho

**Pronto para começar a FASE 1?** 🚀
