# 🎨 FUNCIONALIDADES VISUAIS MS PROJECT - ESPECIFICAÇÃO COMPLETA

## 🎯 OBJETIVO
Mapear **todas as funcionalidades visuais** do Microsoft Project que devem ser implementadas, priorizando qualidade visual profissional e experiência do usuário idêntica ao MS Project.

---

## 🖼️ INTERFACE PRINCIPAL - LAYOUT PROFISSIONAL

### **📱 ESTRUTURA RESPONSIVA DA TELA**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🎯 BARRA SUPERIOR - RIBBON (Fitas de Comandos MS Project)                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 📊 PROJETO: Edifício Residencial ABC | 📅 Início: 01/03/24 | 👤 João Silva  │
├─────────────────────────────┬───────────────────────────────────────────────┤
│ 📋 PAINEL ESQUERDO         │ 📅 ÁREA PRINCIPAL - CRONOGRAMA GANTT        │
│ (30% largura)              │ (70% largura)                                 │
│                             │                                               │
│ ▼ 🗂️ ESTRUTURA DO PROJETO   │ 📊 LINHA DO TEMPO VISUAL                     │
│   ├ 📁 1. PLANEJAMENTO     │ Nov │ Dez │ Jan │ Fev │ Mar │ Abr │ Mai      │
│   │  ├ 📄 1.1 Proj.Arq.    │ ████████                                      │
│   │  ├ 📄 1.2 Aprovações   │   ████████                                   │
│   │  └ 💎 1.3 Marco Final  │         ♦                                    │
│   ├ 📁 2. EXECUÇÃO         │                                               │
│   │  ├ 📄 2.1 Fundações    │         █████████                            │
│   │  ├ 📄 2.2 Estrutura    │               ████████████                   │
│   │  └ 📄 2.3 Acabamentos  │                         ████████████         │
│   └ 📁 3. ENTREGA          │                                               │
│      ├ 📄 3.1 Limpeza      │                               ████           │
│      └ 💎 3.2 Entrega      │                                   ♦          │
│                             │                                               │
│ 📊 PAINEL PROPRIEDADES     │ 🔗 LINHAS DE DEPENDÊNCIA                     │
│ ┌─────────────────────────┐ │     A ████──┐                               │
│ │ ATIVIDADE SELECIONADA   │ │             ├──► B ████                     │
│ │ Nome: Concretagem Laje  │ │     C ████──┘                               │
│ │ Duração: 3 dias         │ │                                               │
│ │ Início: 15/03/2024      │ │ 📈 INDICADORES DE PROGRESSO                  │
│ │ % Concluído: 60%        │ │ [▓▓▓▓▓▓░░░░] 60% - Em andamento              │
│ │ Responsável: Equipe     │ │ [▓▓▓▓▓▓▓▓▓▓] 100% - Concluído                │
│ │ Custo: R$ 6.750         │ │ [░░░░░░░░░░] 0% - Não iniciado               │
│ └─────────────────────────┘ │                                               │
└─────────────────────────────┴───────────────────────────────────────────────┘
```

---

## 🎨 ELEMENTOS VISUAIS OBRIGATÓRIOS

### **1. 🎭 BARRA RIBBON (FITAS DE COMANDOS)**

#### **Aba PROJETO**:
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PROJETO │ TAREFA │ RECURSO │ RELATÓRIO │ VISUALIZAR │ FORMATAR │           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 📊 Novo │ ➕ Nova │ 👤 Atrib │ 📄 PDF   │ 🔍 Zoom   │ 🎨 Cores │ 🔧 Config │
│ 📂 Abrir│ ✏️ Edit │ 📋 Lista │ 📊 Excel │ 📅 Escala │ 🖋️ Fonte │          │
│ 💾 Salv │ 🗑️ Excl │ 💰 Custo │ 🖼️ Imagem│ 👁️ Filtro │ 📏 Largr │          │
│ 🔄 Atual│ 📋 Info │ ⚡ Nivela│ 📈 Gráf │ 🔍 Detalh │ 🎯 Estilo│          │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### **Aba TAREFA**:
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ➕ Nova Tarefa │ 🔗 Vincular │ 📅 Reagendar │ 💎 Marco │ 📊 Progresso     │
│ ✏️ Editar      │ ❌ Desvincular │ ⏰ Restric. │ 📋 Notas │ 🔄 Atualizar    │
│ 🗑️ Excluir     │ 🔀 Tipo Vínc. │ ⏸️ Dividir  │ 🏷️ WBS   │ 📈 % Físico     │
│ 📁 Recuar      │ ⏱️ Antecipa.  │ 🚫 Inativar │ 🎯 Crítica│ 💰 % Financ.   │
│ 📂 Avançar     │ ⏳ Esperar    │ ✅ Concluir │ 🔍 Filtros│ 🏁 Linha Base  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### **2. 📊 ÁREA DA ESTRUTURA DO PROJETO (PAINEL ESQUERDO)**

#### **Hierarquia Visual**:
```
┌─────────────────────────────────────────┐
│ 📋 ESTRUTURA ANALÍTICA (WBS)           │
├─────────────────────────────────────────┤
│ ▼ 📁 1. PLANEJAMENTO                    │ ← Nível 0 (fundo cinza escuro)
│   ├ ▼ 📦 1.1 PROJETOS                  │ ← Nível 1 (indentação 20px)
│   │   ├ 📄 1.1.1 Projeto Arquitetônico │ ← Nível 2 (indentação 40px)
│   │   ├ 📄 1.1.2 Projeto Estrutural    │
│   │   └ 📄 1.1.3 Projeto Instalações   │
│   ├ ▼ 📦 1.2 APROVAÇÕES                │
│   │   ├ 📄 1.2.1 Análise Prefeitura    │
│   │   └ 💎 1.2.2 Alvará Expedido       │ ← Marco (losango)
│   └ ▼ 📦 1.3 CONTRATAÇÃO               │
│       ├ 📄 1.3.1 Licitação             │
│       └ 📄 1.3.2 Assinatura Contrato   │
├─────────────────────────────────────────┤
│ ▼ 📁 2. EXECUÇÃO                        │
│   ├ ▼ 📦 2.1 FUNDAÇÕES                 │
│   │   ├ 📄 2.1.1 Escavação             │
│   │   ├ 📄 2.1.2 Armação                │
│   │   └ 📄 2.1.3 Concretagem           │
│   └ ▼ 📦 2.2 SUPERESTRUTURA           │
│       ├ 📄 2.2.1 Pilares               │
│       └ 📄 2.2.2 Vigas e Lajes         │
└─────────────────────────────────────────┘
```

#### **Código de Cores por Nível**:
- **📁 Nível 0** (Fases): `#1F2937` (cinza escuro) + fonte branca bold
- **📦 Nível 1** (Entregáveis): `#374151` (cinza médio) + fonte branca
- **📄 Nível 2** (Atividades): `#F9FAFB` (branco) + fonte preta
- **💎 Marcos**: `#FEF3C7` (amarelo claro) + ícone losango

### **3. 📅 CRONOGRAMA GANTT (ÁREA PRINCIPAL)**

#### **Timeline Superior**:
```
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ 2024│     │     │     │     │ 2025│     │     │     │ ← Ano
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ Nov │ Dez │ Jan │ Fev │ Mar │ Abr │ Mai │ Jun │ Jul │ ← Mês
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ S1S2│ S3S4│ S1S2│ S3S4│ S1S2│ S3S4│ S1S2│ S3S4│ S1S2│ ← Semana
└─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘
```

#### **Barras de Atividades**:
```
📄 1.1.1 Projeto Arquit. [████████                    ] 25%  ← Azul #3B82F6
📄 1.1.2 Projeto Estrut. [    ████████                ] 40%  ← Verde #10B981
📄 1.1.3 Proj. Install.  [        ████████            ] 60%  ← Laranja #F59E0B
💎 1.2.2 Alvará Expedido [             ♦              ]100%  ← Marco dourado
📄 2.1.1 Escavação       [               ██████       ] 80%  ← Vermelho crítico
📄 2.1.2 Armação         [                 ████████   ] 0%   ← Cinza não iniciado
```

#### **Legenda de Cores Padrão**:
- **🔵 Azul** `#3B82F6`: Planejamento
- **🟢 Verde** `#10B981`: Execução normal
- **🟠 Laranja** `#F59E0B`: Atenção/Próximo prazo
- **🔴 Vermelho** `#EF4444`: Crítico/Atrasado
- **⚫ Cinza** `#6B7280`: Não iniciado
- **💜 Roxo** `#8B5CF6`: Concluído
- **🟡 Amarelo** `#FDE047`: Marco/Entrega

### **4. 🔗 LINHAS DE DEPENDÊNCIA**

#### **Tipos Visuais**:
```
TI (Término-Início) - Padrão:
A ████████────┐
              └──► B ████████

II (Início-Início):
A ████████
  │
  └──► B ████████

TT (Término-Término):
A ████████────┐
              │
B ████████────┘

IT (Início-Término):
A ████████
  │
  └─────► B ████████
```

#### **Especificações das Linhas**:
- **Cor**: `#6B7280` (cinza médio)
- **Espessura**: 2px
- **Estilo**: Sólida para TI, tracejada para outros tipos
- **Setas**: Triangular preenchida 6px
- **Hover**: Destaque em `#3B82F6` (azul) + tooltip

### **5. 📊 INDICADORES DE PROGRESSO**

#### **Barra de Progresso Interna**:
```
Atividade Normal (60% concluída):
┌─────────────────────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░│ 60%
└─────────────────────────────────────┘
 ↑                   ↑
 Concluído          Restante
 (cor sólida)       (cor transparente)

Atividade Atrasada (30% concluída, deveria estar 80%):
┌─────────────────────────────────────┐
│🔴🔴🔴🔴🔴🔴🔴🔴🔴░░░░░░░░░░░░░░░░░░│ 30% (ATRASO!)
└─────────────────────────────────────┘
```

#### **Marcos Visuais**:
```
Marco Concluído:    ♦ (verde #10B981)
Marco Pendente:     ◇ (cinza #6B7280)
Marco Crítico:      ♦ (vermelho #EF4444)
Marco Hoje:         ♦ (azul #3B82F6)
```

### **6. 🎯 LINHA DE DATA ATUAL**

```
                     │ HOJE
                     │ 15/Mar/24
                     │
A ████████           │
           │         │
B          ██████████│████ ← Verde (no prazo)
                     │
C              ██████│     ← Vermelho (atrasado)
                     │
D                    │████ ← Azul (futuro)
```

Especificações:
- **Linha vertical**: `#EF4444` (vermelho) 2px sólida
- **Label**: Caixa flutuante com data atual
- **Atualização**: Automática diariamente

---

## 🖱️ INTERAÇÕES E USABILIDADE

### **1. 📱 DRAG & DROP PROFISSIONAL**

#### **Mover Atividade Horizontalmente** (alterar datas):
```
Estado Inicial:
A ████████

Durante o Drag (cursor mudou):
A ·········█████████ (fantasma transparente)

Resultado Final:
A         ████████ (recalculou dependências)
```

#### **Redimensionar Duração** (bordas da barra):
```
Cursor na borda direita: ⟷
A ████████|←→  (arrastar para alterar fim)

Cursor na borda esquerda: ⟷
A |←→████████  (arrastar para alterar início)
```

#### **Reordenar na Lista** (drag vertical):
```
Estado Original:        Após Drag:
1. Atividade A         1. Atividade B
2. Atividade B    →    2. Atividade A
3. Atividade C         3. Atividade C
```

### **2. 🔍 ZOOM E NAVEGAÇÃO**

#### **Níveis de Zoom**:
- **Horas**: `|01|02|03|04|05|06|07|08|` (para atividades de horas)
- **Dias**: `|S|T|Q|Q|S|S|D|` (semana detalhada)
- **Semanas**: `|S1|S2|S3|S4|` (mensal)
- **Meses**: `|Jan|Fev|Mar|Abr|` (trimestral)
- **Trimestres**: `|Q1|Q2|Q3|Q4|` (anual)
- **Anos**: `|2024|2025|2026|` (plurianual)

#### **Controles de Navegação**:
```
┌─────────────────────────────────────────┐
│ 🔍- │████████│ 🔍+ │ 📅 Hoje │ 🔄 Atual │ ← Barra de zoom
└─────────────────────────────────────────┘

Scroll Horizontal: ◄─────────────────────►
Scroll Vertical:   ▲                       ▼
```

### **3. 💬 TOOLTIPS INFORMATIVOS**

#### **Tooltip de Atividade**:
```
┌─────────────────────────────────────┐
│ 📄 CONCRETAGEM LAJE TÉRREO          │
├─────────────────────────────────────┤
│ 📅 Início: 15/03/2024 (08:00)       │
│ 🏁 Término: 18/03/2024 (17:00)      │
│ ⏱️ Duração: 3 dias                   │
│ 📊 Progresso: 60% (1,8 dias)        │
│ 👤 Responsável: Equipe Estrutura     │
│ 💰 Custo Plan.: R$ 5.000,00          │
│ 💸 Custo Real: R$ 3.200,00          │
│ 🔗 Predecessoras: 2 atividades      │
│ 🎯 Status: ⚠️ ATENÇÃO - Atraso       │
└─────────────────────────────────────┘
```

#### **Tooltip de Dependência**:
```
┌─────────────────────────────────────┐
│ 🔗 DEPENDÊNCIA TÉRMINO-INÍCIO       │
├─────────────────────────────────────┤
│ 📤 De: Armação da Laje              │
│ 📥 Para: Concretagem da Laje        │
│ ⏰ Tipo: TI (Término-Início)         │
│ ⏳ Antecipação: 0 dias              │
│ 📝 Criada em: 10/03/2024           │
│                                     │
│ [✏️ Editar] [🗑️ Excluir]            │
└─────────────────────────────────────┘
```

---

## 📊 PAINÉIS COMPLEMENTARES

### **1. 👤 PAINEL DE RECURSOS**

```
┌─────────────────────────────────────┐
│ 👥 RECURSOS DO PROJETO              │
├─────────────────────────────────────┤
│ 🔍 [Buscar recurso...]              │
├─────────────────────────────────────┤
│ 👨‍💼 RECURSOS HUMANOS                 │
│ ┌─┬─────────────────┬──────┬────────┐│
│ │✓│João Silva       │ 80%  │🟡 Super││ ← Superalocado
│ │ │Eng. Civil Sênior│      │        ││
│ │✓│Maria Santos     │ 45%  │🟢 OK   ││ ← Normal
│ │ │Arquiteta Plena  │      │        ││
│ │✓│Equipe Fundação  │120%  │🔴 Crítico││ ← Crítico
│ │ │5 profissionais  │      │        ││
│ └─┴─────────────────┴──────┴────────┘│
│                                     │
│ 🧱 MATERIAIS                        │
│ ┌─┬─────────────────┬──────┬────────┐│
│ │✓│Concreto 25MPa   │15 m³ │✅ Disp ││
│ │ │R$ 280,00/m³     │      │        ││
│ │✓│Aço CA-50 12mm   │2,5t  │⏳ Ped. ││ ← Pendente
│ │ │R$ 4.200,00/t    │      │        ││
│ └─┴─────────────────┴──────┴────────┘│
│                                     │
│ 🏗️ EQUIPAMENTOS                     │
│ ┌─┬─────────────────┬──────┬────────┐│
│ │✓│Bomba Concreto   │1 dia │🟢 OK   ││
│ │ │R$ 800,00/dia    │      │        ││
│ │✓│Guindaste 10T    │3 dias│🟠 Reser││ ← Reservado
│ │ │R$ 1.200,00/dia  │      │        ││
│ └─┴─────────────────┴──────┴────────┘│
│                                     │
│ [➕ Novo] [📊 Nivelamento] [📄 Relatório] │
└─────────────────────────────────────┘
```

### **2. 📈 PAINEL DE ESTATÍSTICAS**

```
┌─────────────────────────────────────┐
│ 📊 RESUMO DO PROJETO                │
├─────────────────────────────────────┤
│ 📅 CRONOGRAMA                       │
│ Início Previsto: 01/03/2024        │
│ Término Previsto: 31/08/2024       │
│ Duração Total: 184 dias             │
│ Dias Úteis: 132 dias                │
│ Progresso Geral: ████████░░ 76%     │
│                                     │
│ 💰 FINANCEIRO                       │
│ Orçamento Aprovado: R$ 2.850.000    │
│ Custo Realizado: R$ 1.950.000      │
│ Valor Agregado: R$ 2.166.000       │
│ Variação Cronograma: +8,5%          │
│ Variação Custo: -5,2%              │
│                                     │
│ ⚡ ATIVIDADES                        │
│ Total: 156 atividades               │
│ Concluídas: 94 atividades          │
│ Em Andamento: 12 atividades         │
│ Não Iniciadas: 50 atividades       │
│ Atrasadas: 8 atividades            │
│                                     │
│ 🎯 MARCOS                           │
│ Total: 12 marcos                    │
│ Atingidos: 8 marcos ✅             │
│ Pendentes: 4 marcos ⏳             │
│ Críticos: 2 marcos ⚠️              │
└─────────────────────────────────────┘
```

---

## 🎨 TEMAS E PERSONALIZAÇÃO

### **1. 🌈 ESQUEMA DE CORES CORPORATIVO**

#### **Paleta Principal**:
```css
:root {
  /* Cores Principais */
  --azul-principal: #1E40AF;      /* Azul corporativo */
  --verde-sucesso: #059669;       /* Verde aprovação */
  --vermelho-alerta: #DC2626;     /* Vermelho crítico */
  --laranja-atencao: #D97706;     /* Laranja atenção */
  --roxo-concluido: #7C3AED;      /* Roxo finalizado */

  /* Tons de Cinza */
  --cinza-fundo: #F9FAFB;         /* Fundo claro */
  --cinza-borda: #E5E7EB;         /* Bordas sutis */
  --cinza-texto: #374151;         /* Texto principal */
  --cinza-secundario: #6B7280;    /* Texto secundário */

  /* Status das Atividades */
  --nao-iniciada: #9CA3AF;        /* Cinza claro */
  --em-andamento: #3B82F6;        /* Azul dinâmico */
  --concluida: #10B981;           /* Verde êxito */
  --atrasada: #EF4444;            /* Vermelho urgente */
  --cancelada: #6B7280;           /* Cinza neutro */
}
```

#### **Variações por Disciplina** (Engenharia):
```css
/* Disciplinas Técnicas */
--arquitetura: #8B5CF6;      /* Roxo criativo */
--estrutural: #DC2626;       /* Vermelho força */
--eletrica: #F59E0B;         /* Amarelo energia */
--hidraulica: #0EA5E9;       /* Azul água */
--fundacoes: #92400E;        /* Marrom terra */
--acabamentos: #EC4899;      /* Rosa acabamento */
```

### **2. 📐 DIMENSÕES E ESPAÇAMENTOS**

```css
/* Estrutura Principal */
.gantt-container {
  height: calc(100vh - 120px);  /* Tela completa menos header */
  display: grid;
  grid-template-columns: 400px 1fr;  /* 400px lista + resto timeline */
}

/* Timeline */
.gantt-timeline {
  min-width: 800px;            /* Largura mínima para scroll */
  overflow-x: auto;
  overflow-y: hidden;
}

/* Barras de Atividade */
.gantt-bar {
  height: 20px;                /* Altura padrão */
  border-radius: 4px;
  margin: 4px 0;
  min-width: 8px;              /* Mínimo para marcos */
}

/* Espaçamento Hierárquico */
.wbs-level-0 { padding-left: 8px; }   /* Projeto */
.wbs-level-1 { padding-left: 28px; }  /* Fase */
.wbs-level-2 { padding-left: 48px; }  /* Entregável */
.wbs-level-3 { padding-left: 68px; }  /* Atividade */
```

---

## 📱 RESPONSIVIDADE MOBILE

### **Layout Adaptativo**:

#### **📱 Smartphone (< 768px)**:
```
┌─────────────────────────┐
│ 📊 PROJETO: Edifício... │ ← Header compacto
├─────────────────────────┤
│ [📋] [📅] [👥] [📊]     │ ← Abas principais
├─────────────────────────┤
│ 🗂️ MODO LISTA          │ ← Lista prioritária
│ ▼ 📁 PLANEJAMENTO      │
│   📄 Proj. Arquitet.    │
│   📄 Aprovações         │
│   💎 Marco Final        │
│ ▼ 📁 EXECUÇÃO           │
│   📄 Fundações          │
│   📄 Estrutura          │
├─────────────────────────┤
│ [📅 Ver Gantt] [+ Nova] │ ← Ações rápidas
└─────────────────────────┘
```

#### **📱 Tablet (768px - 1024px)**:
```
┌─────────────────────────────────────────────┐
│ 📊 PROJETO: Edifício ABC | 📅 15/03/24     │
├───────────────────┬─────────────────────────┤
│ 📋 ESTRUTURA      │ 📅 GANTT COMPACTO      │
│ (45% largura)     │ (55% largura)           │
│                   │                         │
│ ▼ 📁 PLANEJAMENTO │ Mar │ Abr │ Mai │ Jun  │
│   📄 Projeto      │ ████                    │
│   💎 Aprovação    │   ♦                     │
│ ▼ 📁 EXECUÇÃO     │                         │
│   📄 Fundações    │   ████████              │
│   📄 Estrutura    │       ████████          │
└───────────────────┴─────────────────────────┘
```

### **Gestos Touch**:
- **Pinch to Zoom**: Zoom timeline
- **Swipe Horizontal**: Navegar tempo
- **Long Press**: Menu contextual
- **Double Tap**: Editar atividade
- **Swipe Vertical**: Scroll lista

---

## ⚙️ CONFIGURAÇÕES AVANÇADAS

### **1. 🎛️ Configurações de Visualização**

```
┌─────────────────────────────────────┐
│ ⚙️ CONFIGURAÇÕES DO GANTT           │
├─────────────────────────────────────┤
│ 📅 ESCALA DE TEMPO                  │
│ ◉ Automática                        │
│ ○ Dias                              │
│ ○ Semanas                           │
│ ○ Meses                             │
│                                     │
│ 🎨 CORES DAS BARRAS                 │
│ ☑️ Por Status                       │
│ ☑️ Por Responsável                  │
│ ☑️ Por Disciplina                   │
│ ☑️ Por Criticidade                  │
│                                     │
│ 👁️ ELEMENTOS VISUAIS               │
│ ☑️ Mostrar linhas de dependência    │
│ ☑️ Mostrar marcos                   │
│ ☑️ Mostrar linha data atual         │
│ ☑️ Mostrar progresso interno        │
│ ☑️ Mostrar códigos WBS              │
│                                     │
│ 📊 INFORMAÇÕES EXIBIDAS            │
│ ☑️ Nome da atividade                │
│ ☑️ Duração                          │
│ ☑️ Datas início/fim                 │
│ ☑️ Responsável                      │
│ ☑️ % Progresso                      │
│ ☑️ Custo                            │
│                                     │
│ [💾 Salvar] [🔄 Restaurar Padrão]   │
└─────────────────────────────────────┘
```

### **2. 🔧 Configurações de Calendário**

```
┌─────────────────────────────────────┐
│ 📅 CALENDÁRIO DO PROJETO            │
├─────────────────────────────────────┤
│ Calendário Base: Padrão Empresa ▼  │
│                                     │
│ 🗓️ DIAS DE TRABALHO                │
│ ☑️ Segunda    08:00 - 17:00         │
│ ☑️ Terça      08:00 - 17:00         │
│ ☑️ Quarta     08:00 - 17:00         │
│ ☑️ Quinta     08:00 - 17:00         │
│ ☑️ Sexta      08:00 - 17:00         │
│ ☐ Sábado     --:-- - --:--          │
│ ☐ Domingo    --:-- - --:--          │
│                                     │
│ ⏰ CONFIGURAÇÕES                    │
│ Horas por dia: [8] horas            │
│ Intervalo almoço: [1] hora          │
│                                     │
│ 🎊 FERIADOS 2024                    │
│ 01/01 - Confraternização Universal │
│ 12/02 - Carnaval                   │
│ 13/02 - Carnaval                   │
│ 29/03 - Sexta-feira Santa          │
│ 21/04 - Tiradentes                 │
│ [+ Adicionar Feriado]              │
│                                     │
│ [💾 Aplicar] [📋 Ver Exceções]      │
└─────────────────────────────────────┘
```

Esta especificação garante que a interface será **visualmente idêntica e funcionalmente superior** ao MS Project, atendendo às expectativas profissionais dos clientes de engenharia e arquitetura.