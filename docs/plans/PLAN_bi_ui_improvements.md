# PLANEJAMENTO: Melhorias de UX/UI para Sistema BI

## 📝 O que vai ser feito:
Otimizar a experiência do usuário no sistema BI removendo IDs da visualização e melhorando exportações com foco em relatórios limpos e profissionais, priorizando números de documento como referência principal.

## 🎯 Por que isso é necessário:
- IDs técnicos não são úteis para usuários finais
- Documentos exportados devem ser profissionais (logo, título, dados essenciais)
- Números de documento são mais significativos como referência
- Filtros não devem aparecer em relatórios impressos/exportados
- Totais devem sempre estar visíveis nos relatórios

## 📂 Arquivos que serão modificados:
- [ ] `src/types/bi.ts` - [Remover IDs da lista de campos, priorizar documento]
- [ ] `src/pages/BI/Visualizer.tsx` - [Melhorar layout de exportação]
- [ ] `src/pages/BI/Builder.tsx` - [Remover IDs dos campos selecionáveis]
- [ ] `src/services/exportService.ts` - [Implementar exportação limpa com logo]
- [ ] `src/hooks/useBIExport.ts` - [Otimizar dados para exportação]

## 📦 Dependências necessárias:
- Logo da empresa (secengenharia) para exportações
- Biblioteca de geração PDF/Excel otimizada
- Templates profissionais de relatório

## ⚠️ RISCOS IDENTIFICADOS:
- **Risco 1**: Remover campos ID pode quebrar relacionamentos → [Manter IDs internamente, ocultar apenas na UI]
- **Risco 2**: Exportações podem não funcionar corretamente → [Testar cada formato]
- **Risco 3**: Totais podem ser perdidos na exportação → [Garantir que totais sejam sempre incluídos]

## 🔗 O que depende deste código:
- Todas as funcionalidades de BI já implementadas
- Sistema de exportação existente
- DataTable e suas configurações de display
- Hooks de filtros e busca

## 📋 PASSOS DE IMPLEMENTAÇÃO:

### Fase 1: Otimização dos Campos Disponíveis
1. [ ] Remover campos ID das listas de seleção no BI
2. [ ] Priorizar campos de número/documento como referência
3. [ ] Atualizar mapeamento de campos em `types/bi.ts`

### Fase 2: Melhoria do Layout de Visualização
4. [ ] Ajustar Visualizer para ocultar filtros na impressão
5. [ ] Criar layout limpo focado apenas em dados essenciais
6. [ ] Garantir que totais estejam sempre visíveis

### Fase 3: Exportação Profissional
7. [ ] Implementar template com logo da secengenharia
8. [ ] Configurar exportação Excel/PDF com layout limpo
9. [ ] Incluir nome do relatório e totais em todas exportações
10. [ ] Testar impressão direta do navegador

### Fase 4: Validação Completa
11. [ ] Testar todos os formatos de exportação
12. [ ] Verificar se dados essenciais estão preservados
13. [ ] Validar que relacionamentos internos continuam funcionando

## ✅ Como validar que funcionou:
1. BI não exibe mais campos ID para seleção
2. Relatórios exportados mostram apenas: logo, título, dados, totais
3. Números de documento aparecem como referência principal
4. Filtros não aparecem em documentos exportados
5. Impressão direta funciona corretamente

## 🤔 AGUARDANDO APROVAÇÃO
- [ ] Li e entendi o plano
- [ ] Concordo com a abordagem de ocultar IDs e priorizar documentos
- [ ] Concordo com exportações limpas (apenas dados essenciais)
- [ ] Pode prosseguir com a Fase 1

**Status**: ⏸️ AGUARDANDO APROVAÇÃO DO DESENVOLVEDOR