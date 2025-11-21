# Sistema de Permissões - Controle de Ponto

## Visão Geral

O sistema de controle de ponto introduziu novas permissões específicas para garantir controle granular sobre as funcionalidades relacionadas ao registro e gerenciamento de ponto dos funcionários.

## Novas Permissões Implementadas

### 1. `registrar_ponto`
- **Descrição**: Permite registrar entrada/saída no controle de ponto
- **Aplicação**: Página `/ponto` - Interface de registro de ponto
- **Usuários**: Todos os funcionários que precisam registrar ponto
- **Funcionalidades permitidas**:
  - Registrar PE (Primeira Entrada)
  - Registrar PS (Primeira Saída)
  - Registrar INT_ENTRADA/INT_SAIDA (Intervalos)
  - Registrar SE (Segunda Entrada)
  - Registrar SS (Segunda Saída)
  - Registrar HE_INICIO/HE_FIM (Hora Extra)
  - Gerar comprovantes PDF

### 2. `visualizar_ponto_proprio`
- **Descrição**: Permite visualizar próprios registros de ponto
- **Aplicação**: Futuramente para histórico pessoal de ponto
- **Usuários**: Funcionários visualizando seu próprio histórico
- **Funcionalidades permitidas**:
  - Visualizar histórico pessoal de registros
  - Baixar comprovantes próprios
  - Consultar jornada de trabalho atribuída

### 3. `gerenciar_ponto`
- **Descrição**: Permite visualizar e gerenciar registros de todos os funcionários
- **Aplicação**: Página `/rh/controle-ponto` - Painel administrativo
- **Usuários**: RH, supervisores, gerentes
- **Funcionalidades permitidas**:
  - Visualizar registros de todos os funcionários
  - Filtrar por funcionário, data, setor
  - Gerar relatórios consolidados
  - Exportar dados para Excel
  - Imprimir folhas de ponto mensais

### 4. `configurar_jornadas`
- **Descrição**: Permite criar e editar jornadas de trabalho
- **Aplicação**: Página `/rh/jornadas` - Configuração de jornadas
- **Usuários**: RH, administradores
- **Funcionalidades permitidas**:
  - Criar novas jornadas de trabalho
  - Editar jornadas existentes
  - Definir horários esperados (PE, PS, SE, SS)
  - Configurar intervalos e carga horária
  - Desativar jornadas obsoletas

## Integração com Sistema Existente

### Funcionários
- Todos os funcionários criados recebem automaticamente a permissão `registrar_ponto`
- CPF é obrigatório para geração de senha padrão de ponto
- CTPS e data de admissão são obrigatórios para comprovantes
- Jornada de trabalho é opcional (pode ser atribuída posteriormente)

### Compatibilidade
- As permissões antigas (`gerenciar_equipe`) continuam funcionando para:
  - Cadastro de funcionários
  - Gerenciamento de funções/setores
  - Currículos recebidos
- O sistema mantém compatibilidade total com funcionalidades existentes

## Fluxo de Permissões Recomendado

### Para Funcionários Comuns:
```
registrar_ponto + visualizar_ponto_proprio
```

### Para Supervisores:
```
registrar_ponto + visualizar_ponto_proprio + gerenciar_ponto
```

### Para RH/Administradores:
```
registrar_ponto + visualizar_ponto_proprio + gerenciar_ponto + configurar_jornadas + gerenciar_equipe
```

## Considerações de Segurança

1. **Autenticação de Ponto**: Cada registro requer senha específica do funcionário
2. **Senhas Padrão**: Baseadas nos 4 últimos dígitos do CPF (ou "1234" se CPF inválido)
3. **Comprovantes**: Gerados automaticamente com hash de verificação
4. **Auditoria**: Todos os registros incluem IP, user-agent e timestamp para auditoria

## Migração e Implementação

### Status Atual:
- ✅ Permissões criadas e implementadas
- ✅ Interfaces atualizadas para usar permissões específicas
- ✅ Formulário de funcionários integrado com campos de ponto
- ✅ Página de jornadas criada e funcional
- ✅ Sistema de auto-login corrigido

### Próximos Passos:
1. Configurar permissões padrão para novos funcionários
2. Migrar funcionários existentes para o novo sistema
3. Configurar jornadas de trabalho padrão
4. Treinar usuários nas novas funcionalidades

## Notas Técnicas

- As permissões são verificadas via `usePermissions()` hook
- PermissionGuard componentes protegem rotas e UI elements
- Sistema compatível com estrutura RLS do Supabase
- Fallback para permissões completas quando sistema não está configurado

## Arquivos Modificados

- `src/lib/permissions.ts` - Adicionadas permissões de ponto
- `src/hooks/usePermissions.ts` - Constantes atualizadas
- `src/App.tsx` - Rotas protegidas com permissões específicas
- `src/components/AppSidebar.tsx` - Menu com permissões atualizadas
- `src/pages/cadastros/Funcionarios.tsx` - Campos de ponto integrados
- `src/pages/RH/Jornadas.tsx` - Nova página criada
- `src/pages/RegistroPonto.tsx` - Correções de persistência visual
- `docs/PERMISSOES_PONTO.md` - Documentação criada