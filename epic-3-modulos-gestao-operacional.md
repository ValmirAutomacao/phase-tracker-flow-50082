# Epic 3: Módulos de Gestão Operacional - Brownfield Enhancement

## Epic Goal

Migrar os módulos de gestão de recursos humanos (Funcionários, Funções, Setores) e sistema de requisições para Supabase, estabelecendo a hierarquia organizacional e workflows internos mantendo toda operação funcional.

## Epic Description

**Existing System Context:**
- Current relevant functionality: Gestão completa de RH com hierarquia setores→funções→funcionários e sistema de requisições/tickets vinculado a obras e funcionários
- Technology stack: React + TypeScript + localStorage, dropdowns hierárquicos, sistema de status para requisições
- Integration points: src/pages/cadastros/Funcionarios.tsx, Funcoes.tsx, Setores.tsx, src/pages/Requisicoes.tsx

**Enhancement Details:**
- What's being added/changed: Migração completa dos módulos de RH e Requisições mantendo hierarquias e relacionamentos
- How it integrates: Substitui localStorage por Supabase preservando dropdowns hierárquicos e workflow de requisições
- Success criteria: Hierarquia organizacional funcionando, requisições linkadas a obras e funcionários, workflows preservados

## Stories

1. **Story 1.6:** Migrar módulo FUNCIONARIOS/FUNCOES/SETORES - Migrar gestão de RH mantendo hierarquia organizacional e integridade referencial
2. **Story 1.9:** Migrar módulo REQUISICOES - Migrar sistema de requisições preservando relacionamentos com obras e funcionários

## Compatibility Requirements

- [x] Existing APIs remain unchanged (interfaces de RH mantidas)
- [x] Database schema changes are backward compatible (hierarquia preservada)
- [x] UI changes follow existing patterns (dropdowns hierárquicos funcionando)
- [x] Performance impact is minimal (queries otimizadas para relacionamentos)

## Risk Mitigation

- **Primary Risk:** Quebra da hierarquia organizacional pode impactar workflows de aprovação e responsabilidades
- **Mitigation:** Migração sequencial (setores→funções→funcionários), validação completa de relacionamentos hierárquicos
- **Rollback Plan:** Restauração da hierarquia via localStorage backup, reativação de módulos específicos via feature flags

## Definition of Done

- [x] All stories completed with acceptance criteria met
- [x] Existing functionality verified through testing (hierarquia organizacional funcionando)
- [x] Integration points working correctly (requisições linkadas a obras e funcionários)
- [x] Documentation updated appropriately (estrutura organizacional documentada)
- [x] No regression in existing features (workflows de requisições preservados)

## Dependencies

- **Predecessors:** Epic 2 (obras funcionando para linkagem de requisições)
- **Successors:** Epic 4 pode referenciar funcionários, Epic 5 usa dados de todos os módulos
- **External:** Dados organizacionais existentes, estrutura hierárquica atual

## Technical Notes

**Critical Integration Points:**
- Hierarquia: setores → funções → funcionários (foreign keys)
- Requisições linkadas a obras (Epic 2) e funcionários solicitantes
- Dropdowns em cascata devem funcionar perfeitamente
- Status e workflow de requisições preservados

**Business Validation:**
- Estrutura organizacional completa migrada
- Funcionários corretamente associados a funções e setores
- Requisições preservam histórico e relacionamentos
- Workflows de aprovação mantidos

**Performance Criteria:**
- Queries hierárquicas otimizadas com índices adequados
- Carregamento de dropdowns < 200ms
- Listagem de requisições com joins < 500ms