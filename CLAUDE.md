# CLAUDE.md

Este arquivo fornece orientações para o Claude Code (claude.ai/code) ao trabalhar com código neste repositório.

## Visão Geral do Projeto

EngFlow é um SPA de gestão empresarial para empresas de engenharia, atualmente operando 100% com localStorage. O sistema gerencia clientes, projetos (obras), funcionários, despesas, vídeos e requisições através de uma stack moderna React + TypeScript com componentes shadcn-ui.

**MIGRAÇÃO CRÍTICA EM ANDAMENTO**: O projeto está passando por uma migração completa do localStorage para Supabase. Siga as especificações detalhadas em `docs/prd.md` e aderir rigorosamente aos protocolos de desenvolvimento em `rules.md`.

## Comandos de Desenvolvimento

```bash
# Servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Build para desenvolvimento
npm run build:dev

# Verificação de código
npm run lint

# Preview do build de produção
npm run preview
```

## Arquitetura e Gerenciamento de Dados

### Camada de Dados Atual
A aplicação usa um sistema centralizado de localStorage via `src/lib/localStorage.ts` com operações CRUD padronizadas:

- **Chaves de Storage**: Todas as entidades de dados usam chaves prefixadas (`engflow_clientes`, `engflow_obras`, etc.)
- **Funções Genéricas**: `getFromStorage`, `saveToStorage`, `addToStorage`, `updateInStorage`, `deleteFromStorage`
- **Modelos de Dados**: 8 entidades principais com relacionamentos (clientes → obras → videos/despesas/requisicoes)

### Arquitetura da UI
- **Layout**: SPA com navegação lateral (`AppSidebar`) e área de conteúdo dinâmica
- **Gerenciamento de Estado**: React Query para cache, React Hook Form + Zod para formulários
- **Sistema de Componentes**: shadcn-ui + Tailwind CSS com componentes customizados em `src/components/ui/`
- **Roteamento**: React Router DOM com organização de páginas baseada em módulos em `src/pages/`

### Estrutura dos Módulos
Cada módulo de negócio segue o mesmo padrão:
- **Páginas**: Interfaces CRUD com busca, filtros e modais
- **Formulários**: Componentes de formulário separados com validação
- **Dados**: Integração localStorage via chaves de storage
- **Tipos**: Interfaces TypeScript para modelos de dados

**Módulos Principais**:
- `Clientes` (clientes com endereço e informações de contato)
- `Obras` (projetos com etapas, progresso e relacionamentos com clientes)
- `Funcionarios/Funcoes/Setores` (RH com relacionamentos hierárquicos)
- `Despesas` (despesas com rastreamento financeiro)
- `Videos` (gerenciamento de vídeos com status de renderização)
- `Requisicoes` (sistema de solicitações/tickets)

## Protocolos de Desenvolvimento (OBRIGATÓRIOS)

### Antes de QUALQUER Mudança no Código
1. **LEIA `rules.md` COMPLETAMENTE** - Contém protocolos obrigatórios de desenvolvimento
2. **Crie documento de planejamento** em `docs/plans/PLAN_[nome-feature].md`
3. **Aguarde aprovação explícita** antes da implementação
4. **Siga metodologia TDD** entre cada tarefa

### Diretrizes de Migração (Projeto Ativo)
A migração localStorage → Supabase deve:
- **Manter 100% de compatibilidade UX** (zero mudanças visíveis)
- **Preservar todos os relacionamentos de dados** e lógica de negócio
- **Implementar migração incremental** por módulo (seguir 12 stories no PRD)
- **Usar MCP Supabase** para operações de banco durante desenvolvimento
- **Preparar para integrações n8n** (OCR despesas + renderização de vídeos)

### Regras de Proteção de Código
- **NUNCA modifique arquivos existentes** sem análise de impacto
- **Sempre faça backup dos dados localStorage** antes dos passos de migração
- **Use validação de checkpoint** entre cada story
- **Implemente estratégias de rollback** para cada mudança
- **Documente todas as modificações** com comentários CLAUDE-NOTE

### Estrutura de Arquivos Obrigatória para Novo Desenvolvimento
```
docs/
├── plans/PLAN_[feature].md     # Antes de qualquer implementação
├── decisions/DECISION_[topico].md # Decisões técnicas
└── explanations/EXPLAIN_[conceito].md # Lógica complexa explicada
```

## Integração Supabase (Em Progresso)

### Schema do Banco de Dados
Tabelas espelham estrutura localStorage com melhorias PostgreSQL:
- **Chaves Primárias**: UUID com `gen_random_uuid()`
- **Relacionamentos**: Chaves estrangeiras com restrições adequadas
- **Segurança**: Políticas RLS para preparação multi-tenancy
- **Performance**: Índices em campos de relacionamento e busca

### Integrações Futuras
A arquitetura está sendo preparada para:
1. **Automação OCR**: Processamento de comprovantes de despesas via n8n
2. **Renderização de Vídeos**: Integração Google Drive com workflows n8n

## Notas Importantes

- **Comentários em Português**: Toda documentação e comentários em português brasileiro
- **Zero Downtime**: Migração não deve impactar operações atuais
- **MCP Supabase**: Use ferramentas MCP para todas as operações de banco
- **Aprovação de Checkpoint**: Aguarde validação entre fases de implementação
- **Rigor TDD**: Teste cada módulo completamente antes de prosseguir
- **COMUNICAÇÃO OBRIGATÓRIA**: Sempre responda em português do Brasil

Consulte `docs/prd.md` para especificações completas de migração e `rules.md` para protocolos obrigatórios de desenvolvimento.