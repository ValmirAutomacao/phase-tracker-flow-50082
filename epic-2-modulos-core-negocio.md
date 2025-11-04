# Epic 2: Módulos Core de Negócio - Brownfield Enhancement

## Epic Goal

Migrar os módulos fundamentais do negócio (Clientes e Obras) para Supabase, estabelecendo o relacionamento core cliente→obra e validando a arquitetura de migração com as entidades mais críticas do sistema.

## Epic Description

**Existing System Context:**
- Current relevant functionality: Gestão completa de clientes (físicos/jurídicos) e obras com relacionamentos, etapas, progresso e orçamentos
- Technology stack: React + TypeScript + localStorage para CRUD, formulários com React Hook Form + Zod
- Integration points: src/pages/cadastros/Clientes.tsx, src/pages/cadastros/Obras.tsx, relacionamento cliente_id nas obras

**Enhancement Details:**
- What's being added/changed: Migração completa dos módulos Clientes e Obras para Supabase mantendo 100% da funcionalidade
- How it integrates: Substitui chamadas localStorage por supabaseService mantendo interface de usuário idêntica
- Success criteria: CRUD completo funcionando via Supabase, relacionamentos preservados, performance equivalente

## Stories

1. **Story 1.4:** Migrar módulo CLIENTES - Substituir localStorage por Supabase no módulo de clientes mantendo todas as funcionalidades CRUD
2. **Story 1.5:** Migrar módulo OBRAS - Migrar gestão de obras mantendo relacionamentos com clientes e funcionalidades de etapas/progresso

## Compatibility Requirements

- [x] Existing APIs remain unchanged (interface CRUD mantida)
- [x] Database schema changes are backward compatible (relacionamentos funcionando)
- [x] UI changes follow existing patterns (zero alterações visuais)
- [x] Performance impact is minimal (cache React Query otimizado)

## Risk Mitigation

- **Primary Risk:** Quebra do relacionamento cliente→obra pode corromper dados de negócio críticos
- **Mitigation:** Migração sequencial (clientes primeiro), validação completa de relacionamentos, backup de dados localStorage
- **Rollback Plan:** Reativação do localStorage para módulos específicos via feature flag, restauração de dados backup

## Definition of Done

- [x] All stories completed with acceptance criteria met
- [x] Existing functionality verified through testing (CRUD completo funcionando)
- [x] Integration points working correctly (relacionamento cliente→obra preservado)
- [x] Documentation updated appropriately (interfaces de dados documentadas)
- [x] No regression in existing features (validação de não-regressão nos módulos migrados)

## Dependencies

- **Predecessors:** Epic 1 (Infraestrutura) deve estar 100% concluído
- **Successors:** Épicos 3, 4 e 5 dependem dos relacionamentos cliente→obra estabelecidos
- **External:** Dados mockados de clientes e obras para migração

## Technical Notes

**Critical Integration Points:**
- Relacionamento FK cliente_id em obras deve ser preservado
- Formulários React Hook Form + Zod devem permanecer inalterados
- Cache React Query deve otimizar performance vs localStorage

**Business Validation:**
- Todos os clientes existentes migrados com integridade
- Obras linkadas corretamente aos clientes
- Funcionalidades de busca e filtros preservadas
- Etapas de obra (JSONB) funcionando corretamente

**Performance Criteria:**
- Tempo de carregamento ≤ localStorage atual
- Operações CRUD < 500ms
- Cache otimizado para operações frequentes