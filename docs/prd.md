# EngFlow Brownfield Enhancement PRD

**Template ID**: brownfield-prd-template-v2
**Versão**: 2.0
**Data de Criação**: 30/10/2025
**Última Atualização**: 30/10/2025

---

## 📋 Change Log

| Change | Date | Version | Description | Author |
|--------|------|---------|-------------|--------|
| Criação inicial | 30/10/2025 | v1.0 | PRD inicial para migração localStorage → Supabase | Product Manager |

---

## 🔍 Intro Project Analysis and Context

### 📊 Existing Project Overview

**Analysis Source**: IDE-based fresh analysis

**Current Project State**:
O EngFlow é uma aplicação web de gestão empresarial focada em engenharia, construída com tecnologias modernas. Atualmente possui módulos para dashboard, financeiro, projetos, vídeos, cadastros (clientes, obras, funcionários, funções, setores) e requisições. É um sistema SPA (Single Page Application) com navegação lateral e interface responsiva, funcionando 100% com localStorage.

### 📚 Available Documentation Analysis

**Available Documentation**:
- ✅ **Tech Stack Documentation**: Identificado via package.json e arquivos de configuração
- ✅ **Source Tree/Architecture**: Analisado via estrutura de pastas src/
- ✅ **Coding Standards**: Definido em rules.md - protocolo detalhado de desenvolvimento
- ❌ **API Documentation**: Não encontrada - aplicação focada frontend
- ❌ **External API Documentation**: Não identificada
- ⚠️ **UX/UI Guidelines**: Parcial - componentes shadcn-ui
- ❌ **Technical Debt Documentation**: Não encontrada

### 🎯 Enhancement Scope Definition

**Enhancement Type**:
- ✅ **Integration with New Systems**

**Enhancement Description**:
Migração completa do sistema EngFlow de localStorage para Supabase, mantendo toda funcionalidade existente intacta e preparando a base para duas automações futuras com n8n: (1) OCR para inserção de despesas e (2) Sistema de renderização de vídeos com Google Drive.

**Impact Assessment**:
- ✅ **Significant Impact (substantial existing code changes)**

### 🎯 Goals and Background Context

**Goals**:
- Migrar todos os dados de localStorage para Supabase mantendo funcionalidade 100% intacta
- Implementar backend robusto com PostgreSQL e RLS (Row Level Security)
- Preparar infraestrutura para automações n8n futuras
- Manter performance igual ou superior ao localStorage atual
- Estabelecer base sólida para escalabilidade e multi-tenancy

**Background Context**:
O EngFlow atualmente opera 100% com localStorage, limitando sua capacidade de escalabilidade e integração com sistemas externos. Com o crescimento do negócio, há necessidade de implementar um backend robusto que suporte futuras automações: (1) OCR para processamento automático de despesas através de comprovantes fotografados, e (2) sistema de renderização de vídeos integrado com Google Drive através de automações n8n. A migração para Supabase fornecerá a base necessária para essas integrações mantendo toda a funcionalidade atual.

---

## 📝 Requirements

### Functional Requirements

**FR1**: O sistema deve migrar todos os dados de localStorage para Supabase mantendo estrutura idêntica de modelos
**FR2**: O sistema deve criar tabelas Supabase com relacionamentos adequados (clientes→obras, obras→videos, etc.)
**FR3**: O sistema deve implementar CRUD completo no Supabase mantendo todas as funcionalidades atuais
**FR4**: O sistema deve substituir chamadas localStorage por calls Supabase sem alterar UX
**FR5**: O sistema deve preparar estrutura para futuras integrações n8n (campos adicionais para OCR e renderização)
**FR6**: O sistema deve manter dados mockados durante desenvolvimento para testes
**FR7**: O sistema deve implementar RLS (Row Level Security) adequado para futura multi-tenancy
**FR8**: O sistema deve manter cache local através do React Query para operação offline

### Non Functional Requirements

**NFR1**: Performance deve ser igual ou superior ao localStorage atual
**NFR2**: Sistema deve funcionar offline com cache local (React Query)
**NFR3**: Todas as rotas internas devem permanecer funcionais durante e após migração
**NFR4**: Zero downtime durante processo de migração
**NFR5**: Implementar metodologia TDD entre cada tarefa de desenvolvimento
**NFR6**: Tempo de resposta das operações CRUD deve ser < 500ms
**NFR7**: Sistema deve suportar até 10.000 registros por tabela sem degradação

### Compatibility Requirements

**CR1**: Manter 100% compatibilidade com interface atual (zero mudanças na UX)
**CR2**: Preservar todos os formulários e validações existentes com React Hook Form + Zod
**CR3**: Manter roteamento React Router intacto
**CR4**: Compatibilidade total com componentes shadcn-ui atuais

---

## 🎨 User Interface Enhancement Goals

**Integration with Existing UI**:
O enhancement não alterará a interface do usuário. Todas as telas, componentes e interações permanecerão idênticas. A migração será 100% transparente para o usuário final, mantendo os padrões visuais estabelecidos com shadcn-ui e Tailwind CSS.

**Modified/New Screens and Views**:
- Nenhuma tela será modificada visualmente
- Possível adição de indicadores de loading/sincronização para operações de rede
- Futuras telas para upload de comprovantes (OCR) e renderização de vídeos serão implementadas em fases posteriores

**UI Consistency Requirements**:
- Manter todos os componentes shadcn-ui existentes
- Preservar esquema de cores e tipografia atual
- Manter responsividade para dispositivos móveis
- Conservar padrões de navegação e layout established

---

## 🔧 Technical Constraints and Integration Requirements

### Existing Technology Stack

**Languages**: TypeScript
**Frameworks**: React 18.3.1, Vite 5.4.19
**Database**: Nenhum (atualmente localStorage) → **Supabase PostgreSQL**
**Infrastructure**: Node.js, npm/bun → **+ Supabase hosting**
**External Dependencies**:
- UI: shadcn-ui, Radix UI, Tailwind CSS
- State: React Query (@tanstack/react-query)
- Routing: React Router DOM
- Forms: React Hook Form + Zod
- Charts: Recharts
- Icons: Lucide React
- **NEW**: @supabase/supabase-js

### Integration Approach

**Database Integration Strategy**:
- Substituir arquivo `src/lib/localStorage.ts` por `src/lib/supabaseService.ts`
- Manter interfaces de dados idênticas
- Implementar React Query para cache e sincronização
- Usar MCP Supabase para operações DDL durante desenvolvimento

**API Integration Strategy**:
- Client-side Supabase SDK para operações CRUD
- Preparar endpoints para futuras integrações n8n
- Implementar retry logic e error handling robusto
- Cache strategies com React Query

**Frontend Integration Strategy**:
- Zero mudanças nos componentes de UI
- Substituir hooks de localStorage por hooks Supabase
- Manter validações Zod existentes
- Implementar loading states apropriados

**Testing Integration Strategy**:
- TDD com dados mockados para cada módulo
- Testes de integração para verificar migração
- Testes de performance comparando localStorage vs Supabase
- Validação de rollback scenarios

### Code Organization and Standards

**File Structure Approach**:
```
src/
├── lib/
│   ├── supabaseService.ts (substitui localStorage.ts)
│   ├── supabaseClient.ts (configuração)
│   └── utils.ts (mantido)
├── hooks/
│   ├── useSupabase.ts (novos hooks)
│   └── ... (hooks existentes mantidos)
├── types/
│   └── database.ts (tipos Supabase)
└── ... (estrutura atual mantida)
```

**Naming Conventions**: Manter convenções TypeScript/React existentes
**Coding Standards**: Seguir rigorosamente as regras definidas em rules.md
**Documentation Standards**: Documentar todas as mudanças conforme protocolo BMAD

### Deployment and Operations

**Build Process Integration**:
- Manter processo de build Vite existente
- Adicionar variáveis de ambiente para Supabase
- Configurar diferentes ambientes (dev/qa/prod)

**Deployment Strategy**:
- Deploy incremental por módulo
- Rollback plan para cada milestone
- Feature flags para controlar migração

**Monitoring and Logging**:
- Implementar logging para operações Supabase
- Monitoring de performance database
- Error tracking para operações falhadas

**Configuration Management**:
- Variáveis de ambiente para conexão Supabase
- Configuração de RLS policies
- Backup e restore procedures

### Risk Assessment and Mitigation

**Technical Risks**:
- **Risco**: Latência de rede vs localStorage
  **Mitigação**: Cache agressivo com React Query
- **Risco**: Perda de dados durante migração
  **Mitigação**: Backup completo antes de cada etapa

**Integration Risks**:
- **Risco**: Quebra de funcionalidades existentes
  **Mitigação**: TDD rigoroso e testes de regressão
- **Risco**: Inconsistência de dados
  **Mitigação**: Validação de integridade em cada step

**Deployment Risks**:
- **Risco**: Downtime durante migração
  **Mitigação**: Blue/green deployment strategy
- **Risco**: Rollback complexo
  **Mitigação**: Scripts de rollback testados

**Mitigation Strategies**:
- Implementação incremental por módulo
- Testes extensivos em ambiente staging
- Monitoramento contínuo de performance
- Backup automatizado de dados

---

## 📊 Epic and Story Structure

### Epic Approach

**Epic Structure Decision**: **Single Epic** com rationale baseado na análise do projeto existente.

**Rationale**: Todas as mudanças são interdependentes e focadas na mesma migração de arquitetura. Separar em múltiplos épicos criaria dependências complexas e aumentaria o risco de inconsistências. A migração localStorage → Supabase requer coordenação entre todos os módulos para manter integridade dos relacionamentos de dados.

---

## 🎯 Epic 1: Migração EngFlow localStorage → Supabase

**Epic Goal**: Migrar completamente o sistema EngFlow de localStorage para Supabase, mantendo 100% da funcionalidade existente e preparando a infraestrutura para futuras automações n8n (OCR de despesas e renderização de vídeos).

**Integration Requirements**:
- Zero breaking changes na interface do usuário
- Performance igual ou superior ao localStorage
- Preparação para multi-tenancy com RLS
- Base sólida para integrações futuras com n8n

### 📋 Stories Sequenciadas (Metodologia TDD)

#### Story 1.1: Configurar ambiente Supabase

Como desenvolvedor,
Quero configurar o projeto Supabase com todas as dependências necessárias,
Para que eu possa começar a migração dos dados do localStorage.

**Acceptance Criteria**:
1. Projeto Supabase criado e configurado
2. Dependência @supabase/supabase-js instalada
3. Variáveis de ambiente configuradas
4. Cliente Supabase inicializado
5. Conexão testada e funcionando

**Integration Verification**:
- **IV1**: Verificar que aplicação atual continua funcionando com localStorage
- **IV2**: Validar que cliente Supabase conecta sem afetar funcionalidades existentes
- **IV3**: Confirmar que build process não foi impactado

---

#### Story 1.2: Criar schema de banco completo

Como desenvolvedor,
Quero criar todas as tabelas no Supabase com relacionamentos corretos,
Para que a estrutura esteja pronta para receber os dados migrados.

**Acceptance Criteria**:
1. Tabela `clientes` criada com todos os campos
2. Tabela `obras` criada com FK para clientes
3. Tabelas `funcionarios`, `funcoes`, `setores` criadas com relacionamentos
4. Tabela `despesas` criada com FK para obras e clientes
5. Tabela `videos` criada com FK para obras
6. Tabela `requisicoes` criada com FK para obras e funcionários
7. RLS policies básicas implementadas
8. Indexes para performance criados

**Integration Verification**:
- **IV1**: Schema válido e sem conflitos
- **IV2**: Relacionamentos funcionando corretamente
- **IV3**: Performance de queries testada

---

#### Story 1.3: Implementar serviço Supabase

Como desenvolvedor,
Quero criar um serviço que substitua as funções do localStorage,
Para que eu possa usar Supabase com a mesma interface.

**Acceptance Criteria**:
1. Arquivo `supabaseService.ts` criado
2. Funções CRUD implementadas (get, add, update, delete)
3. Interface idêntica ao localStorage.ts
4. Error handling robusto implementado
5. Cache local com React Query configurado
6. Tipos TypeScript definidos

**Integration Verification**:
- **IV1**: Serviço funciona isoladamente
- **IV2**: Interface compatível com código existente
- **IV3**: Error handling não quebra aplicação

---

#### Story 1.4: Migrar módulo CLIENTES

Como usuário,
Quero que o gerenciamento de clientes continue funcionando exatamente igual,
Para que não haja impacto na minha operação diária.

**Acceptance Criteria**:
1. CRUD de clientes funcionando via Supabase
2. Validações mantidas (React Hook Form + Zod)
3. Interface não alterada
4. Performance igual ou melhor
5. Dados mockados transferidos
6. Busca e filtros funcionando

**Integration Verification**:
- **IV1**: Todas as funcionalidades de clientes funcionam identicamente
- **IV2**: Relacionamentos com obras mantidos
- **IV3**: Performance não degradada

---

#### Story 1.5: Migrar módulo OBRAS

Como usuário,
Quero que o gerenciamento de obras mantenha todos os relacionamentos com clientes,
Para que a gestão de projetos continue fluindo normalmente.

**Acceptance Criteria**:
1. CRUD de obras funcionando via Supabase
2. Relacionamento com clientes funcionando
3. Etapas de obras preservadas
4. Cálculos de progresso mantidos
5. Interface de timeline/Gantt mantida
6. Dados mockados com relacionamentos transferidos

**Integration Verification**:
- **IV1**: Obras linkadas corretamente aos clientes
- **IV2**: Funcionalidades de etapas e progresso intactas
- **IV3**: Timeline visual funcionando

---

#### Story 1.6: Migrar módulo FUNCIONARIOS/FUNCOES/SETORES

Como usuário,
Quero que o RH continue operando normalmente,
Para que não haja interrupção na gestão de pessoas.

**Acceptance Criteria**:
1. CRUD de funcionários via Supabase
2. Relacionamentos funcionários → funções → setores
3. Dropdowns de seleção funcionando
4. Validações de integridade referencial
5. Interface de cadastros mantida
6. Dados mockados com hierarquia transferidos

**Integration Verification**:
- **IV1**: Hierarquia setores → funções → funcionários preservada
- **IV2**: Seleções em dropdowns funcionando
- **IV3**: Não há funcionários órfãos ou referências quebradas

---

#### Story 1.7: Migrar módulo DESPESAS

Como usuário,
Quero que o módulo financeiro continue funcionando perfeitamente,
Para que eu possa manter controle das despesas e preparar para futura automação OCR.

**Acceptance Criteria**:
1. CRUD de despesas via Supabase
2. Relacionamentos com obras e clientes
3. Cálculos financeiros preservados
4. Categorização mantida
5. Campos preparados para futura integração OCR
6. Relatórios financeiros funcionando

**Integration Verification**:
- **IV1**: Despesas linkadas corretamente a obras e clientes
- **IV2**: Cálculos e totalizações corretos
- **IV3**: Filtros e busca funcionando

---

#### Story 1.8: Migrar módulo VIDEOS

Como usuário,
Quero que o módulo de vídeos continue funcionando,
Para que eu possa preparar para a automação de renderização futura.

**Acceptance Criteria**:
1. CRUD de vídeos via Supabase
2. Status e progresso de vídeos mantidos
3. Relacionamento com obras preservado
4. Campos preparados para integração Google Drive
5. Upload de fotos (PhotoUpload) funcionando
6. Interface de renderização mantida

**Integration Verification**:
- **IV1**: Vídeos linkados corretamente às obras
- **IV2**: Estados de progresso e status funcionando
- **IV3**: Upload de arquivos não impactado

---

#### Story 1.9: Migrar módulo REQUISICOES

Como usuário,
Quero que as requisições mantenham todos os relacionamentos,
Para que o workflow de solicitações continue intacto.

**Acceptance Criteria**:
1. CRUD de requisições via Supabase
2. Relacionamentos com obras e funcionários
3. Estados de workflow preservados
4. Priorização e categorização mantida
5. Notificações (se existentes) funcionando
6. Filtros por status/prioridade funcionando

**Integration Verification**:
- **IV1**: Requisições linkadas a obras e funcionários
- **IV2**: Workflow de aprovação/rejeição mantido
- **IV3**: Filtros e busca operacionais

---

#### Story 1.10: Implementar RLS e segurança

Como administrador,
Quero que o sistema tenha segurança adequada,
Para que esteja preparado para multi-tenancy e uso em produção.

**Acceptance Criteria**:
1. RLS policies implementadas para todas as tabelas
2. Autenticação básica preparada (para futuro)
3. Isolation de dados por tenant (preparação)
4. Backup e recovery procedures
5. Logs de auditoria básicos
6. Performance otimizada com indexes

**Integration Verification**:
- **IV1**: Policies de segurança não impedem operações normais
- **IV2**: Performance não degradada por RLS
- **IV3**: Integridade de dados garantida

---

#### Story 1.11: Transferir dados mockados

Como usuário,
Quero que todos os dados de teste sejam transferidos para Supabase,
Para que eu possa validar completamente a migração.

**Acceptance Criteria**:
1. Script de migração de dados criado
2. Todos os dados mockados transferidos
3. Relacionamentos preservados
4. Integridade referencial validada
5. Backup dos dados localStorage criado
6. Rollback testado e funcionando

**Integration Verification**:
- **IV1**: Dados transferidos mantêm todas as relações
- **IV2**: Quantidades e valores conferem
- **IV3**: Não há perda de informação

---

#### Story 1.12: Testes finais e validação

Como usuário,
Quero que todo o sistema funcione identicamente ao localStorage,
Para que a migração seja completamente transparente.

**Acceptance Criteria**:
1. Todos os módulos testados end-to-end
2. Performance igual ou superior validada
3. Funcionalidades de busca/filtro funcionando
4. Relatórios e dashboards operacionais
5. Responsividade mobile mantida
6. Documentação de migração criada

**Integration Verification**:
- **IV1**: Sistema completo funciona sem localStorage
- **IV2**: Performance benchmarks atingidos
- **IV3**: Zero regressões identificadas

---

## 📊 Modelos de Dados Detalhados

### Estrutura das Tabelas Supabase

```sql
-- CLIENTES
CREATE TABLE clientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR NOT NULL,
    tipo VARCHAR CHECK (tipo IN ('fisica', 'juridica')) NOT NULL,
    documento VARCHAR NOT NULL,
    email VARCHAR,
    telefone VARCHAR,
    endereco VARCHAR,
    numero VARCHAR,
    bairro VARCHAR,
    cidade VARCHAR,
    estado VARCHAR,
    cep VARCHAR,
    data_cadastro TIMESTAMP DEFAULT NOW()
);

-- OBRAS
CREATE TABLE obras (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR NOT NULL,
    cliente_id UUID REFERENCES clientes(id),
    endereco VARCHAR,
    numero VARCHAR,
    bairro VARCHAR,
    cidade VARCHAR,
    estado VARCHAR,
    cep VARCHAR,
    data_inicio DATE,
    data_previsao DATE,
    status VARCHAR,
    progresso INTEGER DEFAULT 0,
    responsavel VARCHAR,
    orcamento DECIMAL,
    etapas JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- FUNCIONARIOS
CREATE TABLE funcionarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR NOT NULL,
    funcao_id UUID REFERENCES funcoes(id),
    setor_id UUID REFERENCES setores(id),
    email VARCHAR,
    telefone VARCHAR,
    status VARCHAR DEFAULT 'ativo',
    created_at TIMESTAMP DEFAULT NOW()
);

-- FUNCOES
CREATE TABLE funcoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- SETORES
CREATE TABLE setores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- DESPESAS
CREATE TABLE despesas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    descricao VARCHAR NOT NULL,
    cliente_id UUID REFERENCES clientes(id),
    obra_id UUID REFERENCES obras(id),
    categoria VARCHAR,
    conta_corrente VARCHAR,
    valor_conta DECIMAL,
    valor_despesa DECIMAL,
    data_emissao DATE,
    data_registro DATE,
    forma_pagamento VARCHAR,
    nota_fiscal VARCHAR,
    observacao TEXT,
    comprovante_url VARCHAR, -- para futura integração OCR
    fornecedor_cnpj VARCHAR, -- para futura integração OCR
    numero_documento VARCHAR, -- para futura integração OCR
    created_at TIMESTAMP DEFAULT NOW()
);

-- VIDEOS
CREATE TABLE videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    obra_id UUID REFERENCES obras(id),
    status VARCHAR CHECK (status IN ('concluido', 'processando', 'fila', 'aguardando_fotos')),
    progresso INTEGER DEFAULT 0,
    data_criacao TIMESTAMP DEFAULT NOW(),
    duracao VARCHAR,
    tamanho VARCHAR,
    prompt TEXT,
    quantidade_fotos INTEGER,
    video_url VARCHAR,
    drive_pasta_id VARCHAR, -- para integração Google Drive
    drive_subpasta_id VARCHAR, -- para integração Google Drive
    n8n_job_id VARCHAR -- para tracking da automação
);

-- REQUISICOES
CREATE TABLE requisicoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo VARCHAR NOT NULL,
    obra_id UUID REFERENCES obras(id),
    solicitante_id UUID REFERENCES funcionarios(id),
    prioridade VARCHAR,
    categoria VARCHAR,
    status VARCHAR,
    descricao TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔄 Preparação para Integrações n8n Futuras

### Automação 1: OCR para Despesas
**Campos preparados**:
- `comprovante_url`: URL do comprovante fotografado
- `fornecedor_cnpj`: CNPJ extraído pelo OCR
- `numero_documento`: Número do documento extraído

**Workflow futuro**:
1. Usuario fotografa comprovante
2. Upload para storage Supabase
3. Webhook para n8n com URL da imagem
4. n8n processa OCR e retorna dados
5. Frontend preenche formulário automaticamente

### Automação 2: Renderização de Vídeos
**Campos preparados**:
- `drive_pasta_id`: ID da pasta no Google Drive
- `drive_subpasta_id`: ID da subpasta (obra + data)
- `n8n_job_id`: ID do job de renderização

**Workflow futuro**:
1. Usuario cria video (obra + prompt)
2. Sistema cria pasta no Google Drive
3. Upload de fotos → subpasta
4. Chamada para n8n iniciar renderização
5. Polling de status via n8n_job_id
6. Video renderizado → download/compartilhamento

---

## ✅ Success Criteria

### Critérios de Aceitação da Migração

1. **Funcionalidade**: 100% das features atuais funcionando identicamente
2. **Performance**: Tempo de resposta ≤ 500ms para operações CRUD
3. **Dados**: Zero perda de dados durante migração
4. **UX**: Interface idêntica, zero mudanças visíveis ao usuário
5. **Integridade**: Todos os relacionamentos preservados
6. **Segurança**: RLS implementado e funcionando
7. **Preparação**: Base pronta para integrações n8n futuras

### Definition of Done

- [ ] Todos os módulos migrados e testados
- [ ] Performance benchmarks atingidos
- [ ] Dados mockados transferidos com integridade
- [ ] RLS policies funcionando
- [ ] Documentação completa criada
- [ ] Rollback plan testado
- [ ] Aprovação do stakeholder recebida

---

**Status do PRD**: ✅ **APROVADO E PRONTO PARA IMPLEMENTAÇÃO**
**Próximo Passo**: Usar este documento junto com rules.md para solicitar implementação ao agente /dev

---

*Este documento serve como especificação completa para a migração EngFlow localStorage → Supabase e deve ser usado como referência única durante todo o processo de desenvolvimento.*