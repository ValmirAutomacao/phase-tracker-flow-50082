# Epic 1: Infraestrutura e Foundation - Brownfield Enhancement

## Epic Goal

Estabelecer a infraestrutura base do Supabase e criar os serviços fundamentais para migração segura do localStorage, preparando uma foundation robusta para as próximas fases sem impacto nos usuários finais.

## Epic Description

**Existing System Context:**
- Current relevant functionality: Sistema EngFlow operando 100% com localStorage, 8 módulos independentes (clientes, obras, funcionários, despesas, vídeos, requisições)
- Technology stack: React 18.3.1 + TypeScript + Vite + shadcn-ui + localStorage para dados
- Integration points: src/lib/localStorage.ts centraliza todas as operações CRUD

**Enhancement Details:**
- What's being added/changed: Configuração completa do ambiente Supabase, criação do schema de banco completo, implementação da camada de serviços Supabase
- How it integrates: Substitui localStorage.ts por supabaseService.ts mantendo interface idêntica
- Success criteria: Ambiente Supabase funcional, schema criado, serviços prontos para migração de módulos

## Stories

1. **Story 1.1:** Configurar ambiente Supabase - Setup completo do projeto Supabase, dependências, variáveis de ambiente e cliente configurado
2. **Story 1.2:** Criar schema de banco completo - Criação de todas as tabelas PostgreSQL com relacionamentos, índices e RLS básico
3. **Story 1.3:** Implementar serviço Supabase - Desenvolvimento da camada de abstração que substitui localStorage mantendo interface compatível

## Compatibility Requirements

- [x] Existing APIs remain unchanged (localStorage interface mantida)
- [x] Database schema changes are backward compatible (novo schema, não altera localStorage)
- [x] UI changes follow existing patterns (zero mudanças na UI)
- [x] Performance impact is minimal (apenas preparação, sem uso ativo)

## Risk Mitigation

- **Primary Risk:** Configuração incorreta do Supabase pode bloquear desenvolvimento futuro
- **Mitigation:** Validação completa do ambiente local e cloud, testes de conectividade, documentação detalhada
- **Rollback Plan:** Reversão para localStorage original está garantida (nenhum módulo migrado ainda)

## Definition of Done

- [x] All stories completed with acceptance criteria met
- [x] Existing functionality verified through testing (localStorage permanece intacto)
- [x] Integration points working correctly (camada de serviços testada isoladamente)
- [x] Documentation updated appropriately (docs técnicos atualizados)
- [x] No regression in existing features (zero impacto aos usuários)

## Dependencies

- **Predecessors:** Nenhum (epic inicial)
- **Successors:** Epic 2 (Módulos Core) depende da conclusão deste epic
- **External:** Acesso ao Supabase Cloud, configuração de variáveis de ambiente

## Technical Notes

**Integration Points:**
- src/lib/localStorage.ts → src/lib/supabaseService.ts (interface compatibility)
- package.json → adicionar @supabase/supabase-js
- .env.local → configuração de URLs e chaves Supabase

**Validation Criteria:**
- Supabase local rodando sem erros
- Schema aplicado com sucesso no ambiente local
- Testes unitários do supabaseService passando
- Documentação técnica atualizada