# Epic 4: Módulos Especializados - Brownfield Enhancement

## Epic Goal

Migrar os módulos especializados de Despesas e Vídeos para Supabase, preparando campos específicos para futuras automações n8n (OCR de comprovantes e renderização de vídeos com Google Drive) mantendo funcionalidade atual.

## Epic Description

**Existing System Context:**
- Current relevant functionality: Gestão financeira completa de despesas e sistema de vídeos com status de renderização e upload de fotos
- Technology stack: React + TypeScript + localStorage, upload de arquivos, gestão de status de progresso
- Integration points: src/pages/Financeiro.tsx, src/pages/Videos.tsx, componentes PhotoUpload e VideoRenderer

**Enhancement Details:**
- What's being added/changed: Migração de despesas e vídeos com campos preparatórios para automações (comprovante_url, drive_pasta_id, n8n_job_id)
- How it integrates: Mantém funcionalidade atual + prepara infraestrutura para integrações futuras sem afetar UX
- Success criteria: Módulos funcionando + campos preparatórios criados + relacionamentos com obras preservados

## Stories

1. **Story 1.7:** Migrar módulo DESPESAS - Migrar gestão financeira mantendo funcionalidades + campos preparatórios para OCR
2. **Story 1.8:** Migrar módulo VIDEOS - Migrar sistema de vídeos preservando upload/status + campos para integração Google Drive/n8n

## Compatibility Requirements

- [x] Existing APIs remain unchanged (funcionalidades financeiras mantidas)
- [x] Database schema changes are backward compatible (campos novos opcionais)
- [x] UI changes follow existing patterns (zero alterações visuais por enquanto)
- [x] Performance impact is minimal (campos preparatórios não afetam queries atuais)

## Risk Mitigation

- **Primary Risk:** Campos preparatórios para n8n podem gerar confusão ou bugs se não bem documentados
- **Mitigation:** Campos claramente marcados como "futuro", documentação detalhada, validações adequadas
- **Rollback Plan:** Campos preparatórios podem ser ignorados, funcionalidade atual isolada e preservada

## Definition of Done

- [x] All stories completed with acceptance criteria met
- [x] Existing functionality verified through testing (despesas e vídeos funcionando perfeitamente)
- [x] Integration points working correctly (relacionamentos com obras mantidos)
- [x] Documentation updated appropriately (campos preparatórios documentados)
- [x] No regression in existing features (upload de fotos e gestão financeira preservados)

## Dependencies

- **Predecessors:** Epic 2 (obras funcionando para relacionamentos de despesas e vídeos)
- **Successors:** Epic 5 (validação final inclui estes módulos)
- **External:** Futuras integrações n8n (fora do escopo atual)

## Technical Notes

**Future Integration Preparation:**
- **OCR Despesas**: comprovante_url, fornecedor_cnpj, numero_documento
- **Video Rendering**: drive_pasta_id, drive_subpasta_id, n8n_job_id
- Campos opcionais e bem documentados para não afetar funcionalidade atual

**Critical Integration Points:**
- Despesas linkadas a clientes e obras (foreign keys)
- Vídeos associados a obras específicas
- Upload de fotos e gestão de status preservados
- Cálculos financeiros mantidos

**Business Validation:**
- Funcionalidade financeira completa preservada
- Sistema de vídeos com status e progresso funcionando
- Relacionamentos com obras mantidos
- Performance equivalente ao localStorage

**Performance Criteria:**
- Listagens com filtros < 500ms
- Upload de arquivos não afetado
- Queries financeiras otimizadas