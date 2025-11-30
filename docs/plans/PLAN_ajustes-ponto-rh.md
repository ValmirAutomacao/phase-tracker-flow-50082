# PLANEJAMENTO: Ajustes de Ponto RH

## 📝 O que vai ser feito:
Implementação de sistema completo para ajustes manuais de ponto pelo RH, incluindo:
1. Interface para ajustes manuais de batidas de ponto (entrada, saída, intervalos)
2. Sistema obrigatório de justificativas para todos os ajustes
3. Registro de afastamentos (atestados, férias, licenças) com documentação anexa
4. Consulta histórica de ajustes e afastamentos realizados
5. Exportação de relatórios detalhados em PDF/CSV

## 🎯 Por que isso é necessário:
- **Conformidade Legal**: CLT exige controle rigoroso de ponto e registro de justificativas
- **Auditoria**: Manter histórico completo de modificações para fiscalizações
- **Gestão RH**: Facilitar correção de erros de sistema/localização e registro de afastamentos
- **Transparência**: Documentar todas as alterações com motivos detalhados
- **Eficiência**: Centralizar todas as operações de ajuste de ponto em uma interface única

## 📂 Arquivos que serão modificados:
- [ ] `src/types/ponto.ts` - [Adicionar tipos para ajustes e afastamentos]
- [ ] `src/pages/RH/ControlePonto.tsx` - [Adicionar funcionalidades de ajuste e modais]
- [ ] (novo) `src/components/RH/ModalAjustePonto.tsx` - [Interface para ajustar batidas]
- [ ] (novo) `src/components/RH/ModalAfastamento.tsx` - [Interface para registrar afastamentos]
- [ ] (novo) `src/components/RH/ModalHistoricoAjustes.tsx` - [Consulta de ajustes realizados]
- [ ] (novo) `src/components/RH/RelatorioAjustes.tsx` - [Geração de relatórios]
- [ ] (novo) `src/hooks/useAjustesPonto.ts` - [Hook para gerenciar operações de ajuste]

## 📦 Dependências necessárias:
- [ ] React Hook Form + Zod - [Para validação de formulários de ajuste]
- [ ] React Query - [Para cache de dados e mutations]
- [ ] Supabase Storage - [Para armazenar documentos de afastamentos]
- [ ] jsPDF ou similar - [Para geração de relatórios em PDF]
- [ ] Papa Parse - [Para exportação CSV]

## ⚠️ RISCOS IDENTIFICADOS:
- **Risco 1**: Perder dados originais de ponto → [Manter registro original + criar registro de ajuste separado]
- **Risco 2**: Ajustes sem justificativa adequada → [Campo obrigatório de justificativa com validação]
- **Risco 3**: Performance com muitos registros → [Implementar paginação e filtros eficientes]
- **Risco 4**: Conflitos de permissões → [Validar permissões RLS no Supabase]
- **Risco 5**: Perda de documentos de afastamento → [Backup automático no Supabase Storage]

## 🔗 O que depende deste código:
- Sistema de folha de pagamento (depende dos ajustes para cálculo correto)
- Relatórios de frequência (afetados por afastamentos registrados)
- Dashboard de RH (estatísticas incluirão ajustes realizados)
- Controle de acesso (apenas RH pode fazer ajustes)
- Auditoria externa (relatórios devem atender requisitos legais)

## 📋 PASSOS DE IMPLEMENTAÇÃO:

### Fase 1: Preparação (Checkpoint 1)
1. [ ] Criar tipos TypeScript para ajustes e afastamentos
2. [ ] Criar estrutura de componentes vazios/básicos
3. [ ] Verificar tabelas do Supabase necessárias (ajustes_ponto, afastamentos)
4. [ ] Configurar permissões RLS básicas
5. [ ] Validar que projeto ainda compila e roda

### Fase 2: Implementação Core (Checkpoint 2)
6. [ ] Implementar ModalAjustePonto com formulário completo
7. [ ] Implementar sistema de justificativas obrigatórias
8. [ ] Criar hook useAjustesPonto para operações CRUD
9. [ ] Implementar salvamento de ajustes no Supabase
10. [ ] Testar funcionalidade de ajuste isoladamente

### Fase 3: Afastamentos e Documentos (Checkpoint 3)
11. [ ] Implementar ModalAfastamento com upload de documentos
12. [ ] Configurar Supabase Storage para documentos
13. [ ] Criar sistema de tipos de afastamento (atestado, férias, licenças)
14. [ ] Implementar validação de datas e sobreposições
15. [ ] Testar upload e visualização de documentos

### Fase 4: Consultas e Relatórios (Checkpoint 4)
16. [ ] Implementar ModalHistoricoAjustes com filtros
17. [ ] Criar componente RelatorioAjustes
18. [ ] Implementar exportação PDF e CSV
19. [ ] Adicionar busca avançada e paginação
20. [ ] Integrar com interface principal do ControlePonto

### Fase 5: Refinamento e Validação (Checkpoint 5)
21. [ ] Adicionar validações de negócio (horários válidos, etc.)
22. [ ] Implementar feedback visual para ações
23. [ ] Otimizar performance com React.memo onde necessário
24. [ ] Adicionar tooltips explicativos
25. [ ] Executar testes finais e validação completa

## ✅ Como validar que funcionou:
1. **Teste de Ajuste Manual**: RH consegue ajustar qualquer batida com justificativa obrigatória
2. **Teste de Histórico**: Sistema mantém registro original + registro de ajuste
3. **Teste de Afastamento**: Upload de documento e marcação automática de dias
4. **Teste de Relatório**: Exportação PDF/CSV com todos os dados necessários
5. **Teste de Auditoria**: Consulta histórica mostra quem, quando e por que ajustou

## 🔄 Como reverter se der errado:
1. Backup automático das tabelas existentes antes da migração
2. Scripts de rollback para remover novas tabelas se necessário
3. Interface original permanece funcional durante implementação
4. Feature flags para ativar/desativar novas funcionalidades
5. Logs detalhados de todas as operações para troubleshooting

## 🤔 AGUARDANDO APROVAÇÃO
- [ ] Li e entendi o plano completo
- [ ] Concordo com a abordagem incremental por checkpoints
- [ ] Aprovo o uso do Supabase Storage para documentos
- [ ] Confirmo que todas as validações legais estão contempladas
- [ ] Pode prosseguir com a implementação

**Status**: ⏸️ AGUARDANDO APROVAÇÃO DO DESENVOLVEDOR

---

## 📊 ANÁLISE DE IMPACTO: Módulo RH Existente

### O que existe atualmente:
- ControlePonto.tsx: Interface de visualização de registros de ponto
- Sistema de filtros por funcionário, data, setor e jornada
- Tabela com visualização de todas as batidas de ponto
- Estatísticas básicas (presença, horas extras, atrasos)
- Integração com Supabase para buscar dados

### O que será modificado:
- Adicionar botões de ação para ajustar batidas na tabela
- Inserir modais para formulários de ajuste e afastamento
- Expandir sistema de filtros para incluir ajustes realizados
- Adicionar nova aba/seção para histórico de ajustes
- Melhorar exportação existente (atualmente apenas placeholder)

### Quem usa este código:
- Módulo RH (único usuário direto)
- Sistema de relatórios (usa dados processados)
- Dashboard principal (estatísticas agregadas)
- Não identificadas dependências críticas externas

### Possíveis quebras:
- ⚠️ Mudança na interface pode confundir usuários acostumados
- ⚠️ Performance pode degradar com volume alto de ajustes
- ⚠️ Conflitos de estado se múltiplos usuários RH editarem simultaneamente

### Como proteger:
- ✅ Implementar feature flags para rollback rápido
- ✅ Manter interface original como fallback
- ✅ Implementar debounce e loading states
- ✅ Usar React Query para gerenciar cache e conflitos
- ✅ Testes extensivos em ambiente de desenvolvimento

---

**📅 Criado em**: 2024-11-28
**🎯 Responsável**: Claude Code IA
**⚡ Prioridade**: Alta (conformidade legal)
**🕒 Estimativa**: 5 checkpoints / ~20-30 arquivos modificados/criados