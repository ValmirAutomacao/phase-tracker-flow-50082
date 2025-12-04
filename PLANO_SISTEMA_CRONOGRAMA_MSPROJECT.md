# 🚀 PLANO EXECUTIVO: Sistema de Cronograma Profissional MS Project

## 📋 ESPECIFICAÇÕES TÉCNICAS OBRIGATÓRIAS

### 🎯 **OBJETIVO PRINCIPAL**
Implementar sistema de cronograma **idêntico ao Microsoft Project** em funcionalidades, visual e usabilidade, adaptado para empresas de engenharia e arquitetura brasileiras.

### ⚠️ **REGRAS CRÍTICAS DE IMPLEMENTAÇÃO**

#### 🚫 **PROIBIÇÕES ABSOLUTAS**:
- ❌ **ZERO páginas de teste com dados fictícios**
- ❌ **ZERO dados mockados ou localStorage**
- ❌ **ZERO nomenclatura em inglês** (traduzir tudo para português brasileiro)
- ❌ **ZERO funcionalidades incompletas** (só entregar quando 100% funcional)

#### ✅ **OBRIGATORIEDADES**:
- ✅ **Funcionalidades idênticas ao MS Project** (todos os recursos principais)
- ✅ **Relacionamentos N:N robustos** e bem testados
- ✅ **Interface visual profissional** (qualidade MS Project)
- ✅ **Terminologia 100% em português** brasileiro
- ✅ **Exclusão imediata** de páginas teste após validação

---

## 🏗️ ARQUITETURA DO SISTEMA

### 🗂️ **NOVA SEÇÃO: PROJETOS E CRONOGRAMAS**

O sistema terá uma **seção dedicada** separada de "Obras", focada exclusivamente em cronogramas:

```
Menu Principal:
├── Dashboard
├── Projetos (atual - lista básica)
├── 🆕 CRONOGRAMAS (nova seção completa)
│   ├── Meus Cronogramas
│   ├── Criar Novo Cronograma
│   ├── Calendários de Projeto
│   ├── Recursos da Empresa
│   └── Relatórios de Progresso
├── Vídeos
├── Cadastros...
```

### 📊 **ESTRUTURA HIERÁRQUICA MS PROJECT**

```
PROJETO (Obra/Cronograma)
├── FASES DO PROJETO (Grupos principais)
│   ├── PACOTES DE TRABALHO (Subgrupos)
│   │   ├── ATIVIDADES (Tarefas executáveis)
│   │   │   ├── RECURSOS ALOCADOS (Pessoas + Materiais + Equipamentos)
│   │   │   ├── PREDECESSORAS (Dependências)
│   │   │   └── MARCOS DE CONTROLE
│   │   └── LINHAS DE BASE (Baseline)
│   └── ENTREGAS PRINCIPAIS
└── CALENDÁRIOS DE TRABALHO
```

---

## 🔧 MODELAGEM DE BANCO ROBUSTA

### 📋 **TABELAS PRINCIPAIS COM RELACIONAMENTOS N:N**

#### **1. CRONOGRAMAS (Projetos)**
```sql
CREATE TABLE cronogramas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    obra_id uuid REFERENCES obras(id), -- Opcional: link com obra
    nome text NOT NULL,
    descricao text,
    data_inicio_projeto date NOT NULL,
    data_fim_projeto date,
    status_projeto text CHECK (status_projeto IN (
        'planejamento', 'aprovado', 'em_execucao', 'suspenso', 'concluido', 'cancelado'
    )) DEFAULT 'planejamento',

    -- Configurações MS Project
    calendario_padrao_id uuid REFERENCES calendarios_trabalho(id),
    unidade_tempo text DEFAULT 'dias' CHECK (unidade_tempo IN ('horas', 'dias', 'semanas')),
    data_status date DEFAULT CURRENT_DATE, -- Data de atualização do progresso

    -- Linha de Base (Baseline)
    linha_base_aprovada boolean DEFAULT false,
    data_aprovacao_baseline timestamptz,
    baseline_dados jsonb, -- Snapshot das datas/custos originais

    -- Metadados
    gerente_projeto_id uuid REFERENCES funcionarios(id),
    criado_por uuid REFERENCES funcionarios(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

#### **2. CALENDÁRIOS DE TRABALHO**
```sql
CREATE TABLE calendarios_trabalho (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome text NOT NULL,
    descricao text,
    empresa_padrao boolean DEFAULT false,

    -- Dias da semana de trabalho
    segunda_util boolean DEFAULT true,
    terca_util boolean DEFAULT true,
    quarta_util boolean DEFAULT true,
    quinta_util boolean DEFAULT true,
    sexta_util boolean DEFAULT true,
    sabado_util boolean DEFAULT false,
    domingo_util boolean DEFAULT false,

    -- Horários padrão
    inicio_manha time DEFAULT '08:00',
    fim_manha time DEFAULT '12:00',
    inicio_tarde time DEFAULT '13:00',
    fim_tarde time DEFAULT '17:00',

    horas_dia numeric DEFAULT 8.0,
    created_at timestamptz DEFAULT now()
);

-- Feriados e exceções
CREATE TABLE calendario_excecoes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    calendario_id uuid REFERENCES calendarios_trabalho(id) ON DELETE CASCADE,
    data_excecao date NOT NULL,
    tipo_excecao text CHECK (tipo_excecao IN ('feriado', 'ponto_facultativo', 'dia_extra')) NOT NULL,
    descricao text,
    trabalha boolean DEFAULT false
);
```

#### **3. ESTRUTURA ANALÍTICA DO PROJETO (EAP/WBS)**
```sql
CREATE TABLE eap_itens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cronograma_id uuid REFERENCES cronogramas(id) ON DELETE CASCADE,
    item_pai_id uuid REFERENCES eap_itens(id), -- Hierarquia infinita

    -- Identificação WBS
    codigo_wbs text, -- Ex: 1.2.3.1
    nome text NOT NULL,
    descricao text,
    nivel integer NOT NULL DEFAULT 0,
    ordem_sequencial integer NOT NULL DEFAULT 0,

    -- Tipo do item EAP
    tipo_item text CHECK (tipo_item IN (
        'projeto', 'fase', 'entregavel', 'pacote_trabalho', 'atividade', 'marco'
    )) NOT NULL DEFAULT 'atividade',

    -- Datas e duração
    data_inicio_planejada date,
    data_fim_planejada date,
    data_inicio_real date,
    data_fim_real date,
    duracao_planejada_dias numeric DEFAULT 0,
    duracao_real_dias numeric,

    -- Progresso e controle
    percentual_fisico integer DEFAULT 0 CHECK (percentual_fisico >= 0 AND percentual_fisico <= 100),
    percentual_financeiro integer DEFAULT 0 CHECK (percentual_financeiro >= 0 AND percentual_financeiro <= 100),
    trabalho_planejado_horas numeric DEFAULT 0,
    trabalho_realizado_horas numeric DEFAULT 0,

    -- Configurações
    e_marco boolean DEFAULT false, -- Milestone
    e_critica boolean DEFAULT false, -- Caminho crítico
    calendario_id uuid REFERENCES calendarios_trabalho(id),

    -- Status e observações
    status_atividade text CHECK (status_atividade IN (
        'nao_iniciada', 'em_andamento', 'concluida', 'cancelada', 'adiada'
    )) DEFAULT 'nao_iniciada',
    observacoes text,

    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

#### **4. RELACIONAMENTO N:N - DEPENDÊNCIAS ENTRE ATIVIDADES**
```sql
CREATE TABLE dependencias_atividades (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    atividade_predecessora_id uuid REFERENCES eap_itens(id) ON DELETE CASCADE,
    atividade_sucessora_id uuid REFERENCES eap_itens(id) ON DELETE CASCADE,

    -- Tipos de dependência (MS Project)
    tipo_dependencia text CHECK (tipo_dependencia IN (
        'TI', -- Término para Início (Finish-to-Start)
        'II', -- Início para Início (Start-to-Start)
        'TT', -- Término para Término (Finish-to-Finish)
        'IT'  -- Início para Término (Start-to-Finish)
    )) DEFAULT 'TI',

    -- Antecipação (-) ou Espera (+) em dias
    antecipacao_dias numeric DEFAULT 0,

    -- Metadados
    created_at timestamptz DEFAULT now(),

    -- Evitar dependência circular
    CONSTRAINT uq_dependencia UNIQUE (atividade_predecessora_id, atividade_sucessora_id),
    CONSTRAINT ck_nao_auto_dependencia CHECK (atividade_predecessora_id != atividade_sucessora_id)
);
```

#### **5. RELACIONAMENTO N:N - RECURSOS DO PROJETO**
```sql
-- Cadastro de tipos de recursos
CREATE TABLE tipos_recursos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome text NOT NULL UNIQUE, -- Humano, Material, Custo, Equipamento
    descricao text,
    unidade_padrao text, -- horas, dias, m3, kg, un, etc.
    created_at timestamptz DEFAULT now()
);

-- Recursos disponíveis na empresa
CREATE TABLE recursos_empresa (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_recurso_id uuid REFERENCES tipos_recursos(id),

    nome text NOT NULL,
    codigo text UNIQUE, -- Código interno

    -- Para recursos humanos
    funcionario_id uuid REFERENCES funcionarios(id), -- Se for pessoa interna
    disciplina text, -- Engenharia Civil, Arquitetura, etc.
    nivel_experiencia text CHECK (nivel_experiencia IN ('junior', 'pleno', 'senior', 'coordenador')),

    -- Para materiais/equipamentos
    fornecedor text,
    marca text,
    modelo text,

    -- Custos e disponibilidade
    custo_hora numeric DEFAULT 0,
    custo_uso numeric DEFAULT 0,
    disponibilidade_maxima numeric DEFAULT 100, -- % ou quantidade máxima

    -- Status
    ativo boolean DEFAULT true,
    observacoes text,

    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Alocação N:N de recursos em atividades
CREATE TABLE alocacoes_recursos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    atividade_id uuid REFERENCES eap_itens(id) ON DELETE CASCADE,
    recurso_id uuid REFERENCES recursos_empresa(id),

    -- Alocação planejada
    unidades_planejadas numeric NOT NULL DEFAULT 1, -- Quantidade ou %
    custo_unitario_planejado numeric DEFAULT 0,
    trabalho_planejado_horas numeric DEFAULT 0,

    -- Alocação realizada
    unidades_realizadas numeric DEFAULT 0,
    custo_unitario_real numeric DEFAULT 0,
    trabalho_realizado_horas numeric DEFAULT 0,

    -- Datas de alocação
    data_inicio_alocacao date,
    data_fim_alocacao date,

    -- Status
    status_alocacao text CHECK (status_alocacao IN (
        'planejada', 'confirmada', 'em_uso', 'finalizada', 'cancelada'
    )) DEFAULT 'planejada',

    observacoes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),

    -- Constraint de unicidade por atividade+recurso
    CONSTRAINT uq_alocacao_atividade_recurso UNIQUE (atividade_id, recurso_id)
);
```

#### **6. LINHAS DE BASE (BASELINE) - CONTROLE DE MUDANÇAS**
```sql
CREATE TABLE linhas_base (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cronograma_id uuid REFERENCES cronogramas(id) ON DELETE CASCADE,

    nome text NOT NULL, -- "Baseline Original", "Baseline Revisão 1", etc.
    descricao text,
    data_criacao timestamptz DEFAULT now(),
    aprovada boolean DEFAULT false,
    aprovada_por uuid REFERENCES funcionarios(id),
    data_aprovacao timestamptz,

    -- Dados consolidados da baseline
    data_inicio_projeto date,
    data_fim_projeto date,
    custo_total_planejado numeric DEFAULT 0,
    trabalho_total_planejado_horas numeric DEFAULT 0
);

-- Snapshot das atividades na baseline
CREATE TABLE baseline_atividades (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    linha_base_id uuid REFERENCES linhas_base(id) ON DELETE CASCADE,
    atividade_id uuid REFERENCES eap_itens(id) ON DELETE CASCADE,

    -- Snapshot dos dados na data da baseline
    data_inicio_baseline date,
    data_fim_baseline date,
    duracao_baseline_dias numeric,
    trabalho_baseline_horas numeric,
    custo_baseline numeric,

    CONSTRAINT uq_baseline_atividade UNIQUE (linha_base_id, atividade_id)
);
```

---

## 🎨 FUNCIONALIDADES VISUAIS MS PROJECT

### 📊 **INTERFACE PRINCIPAL - VISÃO GANTT**

#### **Layout Profissional**:
```
┌──────────────────────────────────────────────────────────────────────┐
│ 🗂️ PROJETO: Edifício Residencial ABC          👤 Gerente: João Silva   │
├──────────────────────────────────────────────────────────────────────┤
│ 📋 ESTRUTURA DO PROJETO    │ 📅 CRONOGRAMA VISUAL (GANTT)              │
│ (30% da tela)              │ (70% da tela)                             │
├────────────────────────────┼───────────────────────────────────────────┤
│ ▼ 📁 PLANEJAMENTO         │ Jan  │ Fev  │ Mar  │ Abr  │ Mai  │ Jun    │
│   ├ 📄 Projeto Arquitet.   │ ████████                                  │
│   ├ 📄 Aprovações PMSP     │   ████████                               │
│   └ 💎 Aprovação Final     │         ♦                                │
│ ▼ 📁 EXECUÇÃO             │                                           │
│   ├ 📄 Fundações          │         ██████████                       │
│   ├ 📄 Estrutura          │                 ████████████             │
│   └ 📄 Acabamentos        │                           ████████████   │
│ ▼ 📁 ENTREGA              │                                           │
│   ├ 📄 Limpeza Final      │                                 ████     │
│   └ 💎 Entrega ao Cliente │                                     ♦    │
└────────────────────────────┴───────────────────────────────────────────┘
```

#### **Elementos Visuais Obrigatórios**:

1. **🔵 Barras de Atividade**:
   - Cor por tipo: Azul (planejamento), Verde (execução), Laranja (crítica)
   - Progresso interno: barra preenchida
   - Tooltips com detalhes completos

2. **💎 Marcos (Milestones)**:
   - Formato losango (♦)
   - Cores: Verde (concluído), Vermelho (crítico), Azul (planejado)
   - Label com nome do marco

3. **🔗 Linhas de Dependência**:
   - Setas conectando atividades
   - Cores diferentes por tipo (TI, II, TT, IT)
   - Tooltips mostrando tipo de dependência

4. **📊 Indicadores de Status**:
   - ✅ Verde: Concluído
   - 🟡 Amarelo: Em andamento
   - 🔴 Vermelho: Atrasado
   - ⚫ Cinza: Não iniciado

### 🛠️ **PAINÉIS LATERAIS MS PROJECT**

#### **Painel de Propriedades da Atividade**:
```
┌─────────────────────────────────────┐
│ PROPRIEDADES DA ATIVIDADE           │
├─────────────────────────────────────┤
│ Nome: Concretagem Laje              │
│ Duração: 3 dias                     │
│ Início: 15/03/2024                  │
│ Término: 18/03/2024                 │
│ % Concluído: 60%                    │
│ Responsável: Equipe de Estrutura    │
│ Calendário: Padrão da Empresa       │
│                                     │
│ PREDECESSORAS:                      │
│ • Armação de Laje (TI)              │
│                                     │
│ RECURSOS ALOCADOS:                  │
│ • João Silva (80%) - R$ 50/h        │
│ • Concreto (15 m³) - R$ 280/m³      │
│ • Bomba de Concreto (1 dia)         │
│                                     │
│ CUSTO TOTAL: R$ 6.750,00            │
│                                     │
│ [✏️ Editar] [📋 Copiar] [🗑️ Excluir] │
└─────────────────────────────────────┘
```

#### **Painel de Recursos**:
```
┌─────────────────────────────────────┐
│ RECURSOS DA EMPRESA                 │
├─────────────────────────────────────┤
│ 👥 RECURSOS HUMANOS                 │
│ • João Silva - Eng. Civil (80%)     │
│ • Maria Santos - Arquiteta (40%)    │
│ • Equipe Fundação (120%)            │
│                                     │
│ 🧱 MATERIAIS                        │
│ • Concreto 25MPa                    │
│ • Aço CA-50                         │
│ • Cerâmica Porcelanato              │
│                                     │
│ 🏗️ EQUIPAMENTOS                     │
│ • Bomba de Concreto                 │
│ • Guindaste 10T                     │
│ • Betoneira 400L                    │
│                                     │
│ [➕ Novo Recurso] [📊 Nivelamento]   │
└─────────────────────────────────────┘
```

---

## 🧪 PLANO DE IMPLEMENTAÇÃO EXECUTIVO

### **CRONOGRAMA DE DESENVOLVIMENTO - 12 SEMANAS**

#### **📋 FASE 1: INFRAESTRUTURA (Semanas 1-2)**
- [ ] **1.1** Criar seção "Cronogramas" no menu principal
- [ ] **1.2** Implementar todas as migrações SQL (7 tabelas novas)
- [ ] **1.3** Atualizar tipos TypeScript Supabase
- [ ] **1.4** Criar serviços CRUD básicos para todas as entidades
- [ ] **1.5** Configurar hooks React Query
- [ ] **1.6** Testes de integridade dos relacionamentos N:N

#### **📋 FASE 2: CALENDÁRIOS E RECURSOS (Semanas 3-4)**
- [ ] **2.1** Interface de cadastro de calendários de trabalho
- [ ] **2.2** Gestão de feriados e exceções
- [ ] **2.3** Cadastro completo de recursos da empresa
- [ ] **2.4** Classificação por tipos e disciplinas
- [ ] **2.5** Cálculo automático de disponibilidade
- [ ] **2.6** Interface de nivelamento de recursos

#### **📋 FASE 3: ESTRUTURA ANALÍTICA DO PROJETO (Semanas 5-6)**
- [ ] **3.1** Interface hierárquica (árvore) da EAP/WBS
- [ ] **3.2** Drag & drop para reorganizar estrutura
- [ ] **3.3** Códigos WBS automáticos (1.2.3.1)
- [ ] **3.4** Tipos de itens (fase, entregável, atividade, marco)
- [ ] **3.5** Expansão/colapso de níveis
- [ ] **3.6** Cálculo automático de rollup (fases recalculam baseado nas atividades filhas)

#### **📋 FASE 4: CRONOGRAMA VISUAL GANTT (Semanas 7-8)**
- [ ] **4.1** Componente Gantt Chart profissional
- [ ] **4.2** Timeline escalável (dias, semanas, meses)
- [ ] **4.3** Barras proporcionais com cores por status
- [ ] **4.4** Indicadores de progresso visual
- [ ] **4.5** Marcos (♦) posicionados corretamente
- [ ] **4.6** Zoom e navegação fluida
- [ ] **4.7** Grid de datas de fundo
- [ ] **4.8** Responsividade completa

#### **📋 FASE 5: DEPENDÊNCIAS E CAMINHOS (Semanas 9-10)**
- [ ] **5.1** Interface para criar dependências (drag entre atividades)
- [ ] **5.2** Linhas visuais conectando atividades
- [ ] **5.3** Algoritmo de recálculo automático de datas
- [ ] **5.4** Detecção de caminho crítico
- [ ] **5.5** Validação de dependências circulares
- [ ] **5.6** Antecipação e espera entre atividades
- [ ] **5.7** Tooltip informativo nas linhas

#### **📋 FASE 6: CONTROLE E BASELINE (Semanas 11-12)**
- [ ] **6.1** Sistema de linhas de base (snapshot do projeto)
- [ ] **6.2** Comparativo visual: planejado vs realizado
- [ ] **6.3** Atualização de progresso por atividade
- [ ] **6.4** Relatórios de variação (cronograma e custo)
- [ ] **6.5** Análise de valor agregado básica
- [ ] **6.6** Exportação profissional (PDF, Excel)

### **🎯 CRITÉRIOS DE ACEITE POR FASE**

#### **✅ FASE 1 APROVADA QUANDO**:
1. Menu "Cronogramas" funcional e separado de Obras
2. Todas as 7 tabelas criadas com relacionamentos N:N funcionando
3. CRUD básico de todas as entidades sem erro
4. **ZERO dados fictícios** - apenas estrutura

#### **✅ FASE 2 APROVADA QUANDO**:
1. Calendário da empresa configurado (seg-sex, 8h/dia)
2. Feriados nacionais 2024/2025 cadastrados
3. 5 recursos humanos reais cadastrados (funcionários da empresa)
4. 10 materiais básicos de construção cadastrados
5. Disponibilidade calculada corretamente

#### **✅ FASE 3 APROVADA QUANDO**:
1. EAP de 3 níveis criada visualmente (Fases → Entregáveis → Atividades)
2. Códigos WBS automáticos funcionando (1.1.1, 1.1.2, etc.)
3. Drag & drop reorganização funcional
4. Rollup automático: fases calculam datas das atividades filhas

#### **✅ FASE 4 APROVADA QUANDO**:
1. Gantt visual idêntico ao MS Project (qualidade profissional)
2. Barras coloridas e proporcionais
3. Timeline navegável por 12 meses
4. Zoom de dias até trimestres funcional
5. Performance fluida com 100+ atividades

#### **✅ FASE 5 APROVADA QUANDO**:
1. Dependências TI, II, TT, IT funcionando
2. Recálculo automático quando move atividade
3. Caminho crítico identificado visualmente (barras vermelhas)
4. Validação impede dependências circulares

#### **✅ FASE 6 APROVADA QUANDO**:
1. Baseline salva e comparativo visual funcionando
2. % físico atualizável por atividade
3. Relatórios PDF gerados com qualidade profissional
4. Sistema completo MS Project funcional

---

## 🛡️ PROTOCOLOS DE QUALIDADE

### **🚫 EXCLUSÕES OBRIGATÓRIAS**

Após cada validação de fase, **EXCLUIR IMEDIATAMENTE**:
- Páginas de teste temporárias
- Dados de exemplo/mock
- Componentes de debug
- Console.logs de desenvolvimento
- Comentários TODO temporários

### **✅ PADRÕES DE CÓDIGO**

#### **Nomenclatura Portuguesa**:
```typescript
// ❌ ERRADO (inglês)
interface Task { name: string; startDate: Date; }
const createProject = () => {}

// ✅ CORRETO (português)
interface Atividade { nome: string; dataInicio: Date; }
const criarProjeto = () => {}
```

#### **Componentes Organizados**:
```
src/modules/cronogramas/
├── components/           # Componentes UI
│   ├── Gantt/           # Componentes do gráfico
│   ├── EAP/             # Estrutura analítica
│   ├── Recursos/        # Gestão de recursos
│   └── Relatorios/      # Exportações
├── services/            # Serviços de API
├── hooks/               # Hooks React Query
├── types/               # Tipos TypeScript
└── utils/               # Utilitários
```

### **🔍 TESTES DE RELACIONAMENTO N:N**

Validar **obrigatoriamente** em cada fase:

1. **Atividades ↔ Recursos**: Uma atividade pode ter múltiplos recursos, um recurso pode estar em múltiplas atividades
2. **Dependências**: Evitar ciclos, calcular corretamente TI/II/TT/IT
3. **Baseline**: Snapshots preservam dados históricos sem quebrar
4. **Integridade**: Exclusão em cascata funciona corretamente
5. **Performance**: Queries otimizadas para grandes volumes

---

## 📊 ENTREGÁVEL FINAL

### **🎯 SISTEMA COMPLETO MS PROJECT**

**Funcionalidades Obrigatórias**:
- ✅ Interface visual idêntica ao MS Project
- ✅ Todas as operações de cronograma profissionais
- ✅ Relacionamentos N:N robustos e testados
- ✅ Controle de baseline e variações
- ✅ Exportações profissionais
- ✅ Performance com projetos grandes (1000+ atividades)
- ✅ **ZERO código de teste ou mock restante**

**Critério de Sucesso**: Cliente deve ser capaz de migrar projeto MS Project real para o sistema sem perda de funcionalidade.

---

**Status**: ⏸️ **AGUARDANDO APROVAÇÃO PARA INICIAR FASE 1**