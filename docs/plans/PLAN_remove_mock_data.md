# PLANEJAMENTO: Remoção Completa de Dados Mockados

## 📝 O que vai ser feito:
Análise completa do aplicativo para identificar e remover permanentemente todos os dados mockados, páginas de teste e referências ao localStorage que não sejam mais necessárias, garantindo que apenas dados reais do Supabase sejam exibidos.

## 🎯 Por que isso é necessário:
- O sistema BI está exibindo dados mockados ao invés de dados reais do Supabase
- Pode haver inconsistências entre dados falsos e reais
- Usuário especificamente solicitou limpeza completa de mocks
- Garantir integridade dos relatórios e análises

## 📂 Arquivos que serão analisados e potencialmente modificados:
- [ ] `src/pages/BI/Visualizer.tsx` - [Verificar se há dados mockados]
- [ ] `src/pages/BI/Builder.tsx` - [Verificar geradores de dados falsos]
- [ ] `src/pages/BI/index.tsx` - [Verificar dados de exemplo]
- [ ] `src/types/bi.ts` - [Verificar dados de exemplo]
- [ ] `src/services/` - [Procurar por serviços mock]
- [ ] `src/lib/` - [Verificar localStorage desnecessário]
- [ ] Todos os arquivos `.tsx` e `.ts` - [Busca global por mocks]

## 📦 Dependências necessárias:
- Nenhuma nova dependência
- Apenas remoção de código existente

## ⚠️ RISCOS IDENTIFICADOS:
- **Risco 1**: Remover código necessário para funcionamento → [Fazer backup e análise cuidadosa]
- **Risco 2**: Quebrar funcionalidades que dependem de dados de exemplo → [Testar cada mudança]
- **Risco 3**: Deixar o sistema sem dados de fallback → [Garantir que dados reais funcionem]

## 🔗 O que depende deste código:
- Sistema de BI e relatórios
- Dashboards que podem usar dados mockados
- Componentes de demonstração
- Páginas de desenvolvimento/teste

## 📋 PASSOS DE IMPLEMENTAÇÃO:

### Fase 1: Análise e Mapeamento
1. [ ] Buscar por padrões de dados mockados em todo o código
2. [ ] Identificar arquivos de teste ou desenvolvimento
3. [ ] Mapear referências ao localStorage não migradas
4. [ ] Catalogar todos os mocks encontrados

### Fase 2: Remoção Controlada
5. [ ] Remover dados mockados do sistema BI
6. [ ] Eliminar páginas/componentes de teste
7. [ ] Limpar referências desnecessárias ao localStorage
8. [ ] Atualizar imports e dependências

### Fase 3: Validação e Testes
9. [ ] Testar sistema BI com dados reais únicos
10. [ ] Verificar se não há quebras de funcionalidade
11. [ ] Confirmar que apenas dados Supabase são exibidos

## ✅ Como validar que funcionou:
1. Sistema BI exibe apenas dados reais do Supabase
2. Nenhuma página de teste acessível em produção
3. Console sem erros relacionados a dados inexistentes
4. Busca global por "mock", "test", "fake" não retorna código ativo

## 🤔 AGUARDANDO APROVAÇÃO
- [ ] Li e entendi o plano
- [ ] Concordo com a abordagem
- [ ] Pode prosseguir com a Fase 1

**Status**: ⏸️ AGUARDANDO APROVAÇÃO DO DESENVOLVEDOR