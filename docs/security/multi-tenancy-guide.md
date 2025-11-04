# Guia de Multi-Tenancy - EngFlow

## Visão Geral

Este guia descreve como o sistema EngFlow está preparado para multi-tenancy e os passos necessários para implementação futura. A arquitetura RLS atual serve como base sólida para isolamento completo entre organizações.

## Arquitetura Atual (Single-Tenant)

### Estado Atual
- ✅ RLS habilitado em todas as tabelas
- ✅ Funções de segurança implementadas
- ✅ Políticas básicas de autenticação
- ✅ Estrutura preparada para expansão

### Limitações Atuais
- Todos os usuários autenticados têm acesso total
- Sem isolamento por organização
- UUID de organização hardcoded
- Função `is_admin()` muito permissiva

## Roadmap Multi-Tenancy

### Fase 1: Estrutura de Dados (PRÓXIMA)

#### Adicionar Colunas de Organização
```sql
-- Exemplo para tabela clientes
ALTER TABLE public.clientes
ADD COLUMN organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001';

-- Criar índice para performance
CREATE INDEX idx_clientes_organization_id ON public.clientes(organization_id);
```

#### Aplicar em Todas as Tabelas
- clientes
- obras
- funcionarios
- funcoes
- setores
- despesas
- videos
- requisicoes

### Fase 2: Políticas RLS Avançadas

#### Substituir Políticas Atuais

**Remover políticas genéricas**:
```sql
DROP POLICY "Allow authenticated access to clientes" ON public.clientes;
```

**Implementar isolamento por organização**:
```sql
CREATE POLICY "Organization isolation clientes" ON public.clientes
  FOR ALL
  TO authenticated
  USING (organization_id = current_user_organization())
  WITH CHECK (organization_id = current_user_organization());
```

### Fase 3: Gestão de Usuários

#### Tabela de Organizações
```sql
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'basic',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Tabela de Membros
```sql
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL DEFAULT 'member',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);
```

### Fase 4: Funções de Segurança Avançadas

#### current_user_organization() - Versão Multi-Tenant
```sql
CREATE OR REPLACE FUNCTION current_user_organization()
RETURNS UUID AS $$
DECLARE
  user_org_id UUID;
BEGIN
  -- Obter organização do usuário atual via JWT claim ou tabela
  SELECT organization_id INTO user_org_id
  FROM public.organization_members
  WHERE user_id = auth.uid() AND active = true;

  IF user_org_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não pertence a nenhuma organização ativa';
  END IF;

  RETURN user_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### is_admin() - Versão Role-Based
```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.organization_members
  WHERE user_id = auth.uid()
    AND organization_id = current_user_organization()
    AND active = true;

  RETURN user_role IN ('admin', 'owner');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Função de Verificação de Permissões
```sql
CREATE OR REPLACE FUNCTION has_permission(required_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  role_hierarchy TEXT[] := ARRAY['member', 'manager', 'admin', 'owner'];
  required_level INTEGER;
  user_level INTEGER;
BEGIN
  -- Obter role do usuário
  SELECT role INTO user_role
  FROM public.organization_members
  WHERE user_id = auth.uid()
    AND organization_id = current_user_organization()
    AND active = true;

  -- Verificar hierarquia
  SELECT array_position(role_hierarchy, required_role) INTO required_level;
  SELECT array_position(role_hierarchy, user_role) INTO user_level;

  RETURN user_level >= required_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Políticas RLS Multi-Tenant

### Modelo de Política Padrão
```sql
-- Política para operações de leitura
CREATE POLICY "org_isolation_read_[tabela]" ON public.[tabela]
  FOR SELECT
  TO authenticated
  USING (organization_id = current_user_organization());

-- Política para inserção (auto-assign organização)
CREATE POLICY "org_isolation_insert_[tabela]" ON public.[tabela]
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = current_user_organization());

-- Política para atualização
CREATE POLICY "org_isolation_update_[tabela]" ON public.[tabela]
  FOR UPDATE
  TO authenticated
  USING (organization_id = current_user_organization())
  WITH CHECK (organization_id = current_user_organization());

-- Política para exclusão
CREATE POLICY "org_isolation_delete_[tabela]" ON public.[tabela]
  FOR DELETE
  TO authenticated
  USING (organization_id = current_user_organization());
```

### Políticas Específicas por Role

#### Exemplo: Apenas Admins Podem Deletar
```sql
CREATE POLICY "admin_only_delete_funcionarios" ON public.funcionarios
  FOR DELETE
  TO authenticated
  USING (
    organization_id = current_user_organization()
    AND has_permission('admin')
  );
```

## Migração de Dados

### Script de Migração
```sql
-- Backup dos dados atuais
CREATE TABLE backup_clientes AS SELECT * FROM public.clientes;

-- Adicionar coluna organization_id com valor padrão
ALTER TABLE public.clientes
ADD COLUMN organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001';

-- Aplicar em todas as tabelas...
-- (repetir para cada tabela)

-- Verificação pós-migração
SELECT
  table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT organization_id) as unique_orgs
FROM information_schema.tables t
JOIN (
  SELECT 'clientes' as table_name, COUNT(*) as cnt, COUNT(DISTINCT organization_id) as orgs FROM public.clientes
  UNION ALL
  SELECT 'obras', COUNT(*), COUNT(DISTINCT organization_id) FROM public.obras
  -- ... continuar para todas as tabelas
) stats ON stats.table_name = t.table_name
WHERE t.table_schema = 'public';
```

## Testes Multi-Tenancy

### Suíte de Testes de Isolamento
```typescript
describe('Multi-Tenancy Isolation Tests', () => {
  test('Usuários de organizações diferentes não podem ver dados uns dos outros', async () => {
    // Implementar testes específicos
  });

  test('Admins só podem gerenciar sua própria organização', async () => {
    // Implementar testes de role-based access
  });

  test('Performance não é impactada com múltiplas organizações', async () => {
    // Implementar testes de performance
  });
});
```

## Interface de Administração

### Funcionalidades Necessárias

1. **Gestão de Organizações**
   - Criar/editar organizações
   - Configurar planos e limites
   - Ativar/desativar organizações

2. **Gestão de Usuários**
   - Convidar usuários para organização
   - Atribuir/modificar roles
   - Remover usuários

3. **Auditoria e Logs**
   - Log de acessos por organização
   - Relatórios de uso por tenant
   - Monitoramento de violações de acesso

## Considerações de Performance

### Índices Necessários
```sql
-- Índices em organization_id para todas as tabelas
CREATE INDEX CONCURRENTLY idx_clientes_org_id ON public.clientes(organization_id);
CREATE INDEX CONCURRENTLY idx_obras_org_id ON public.obras(organization_id);
-- ... para todas as tabelas

-- Índices compostos para consultas específicas
CREATE INDEX CONCURRENTLY idx_obras_org_cliente ON public.obras(organization_id, cliente_id);
```

### Particionamento (Futuro)
Para organizações muito grandes, considerar particionamento por organization_id:
```sql
-- Exemplo de particionamento (PostgreSQL 12+)
CREATE TABLE public.clientes_partitioned (LIKE public.clientes INCLUDING ALL)
PARTITION BY HASH (organization_id);
```

## Segurança Adicional

### Rate Limiting por Organização
```sql
-- Função para verificar limites de uso
CREATE OR REPLACE FUNCTION check_usage_limits()
RETURNS BOOLEAN AS $$
DECLARE
  org_plan TEXT;
  current_usage INTEGER;
  plan_limit INTEGER;
BEGIN
  -- Verificar plano da organização
  SELECT plan INTO org_plan
  FROM public.organizations
  WHERE id = current_user_organization();

  -- Aplicar limites baseados no plano
  -- Implementar lógica específica

  RETURN true; -- ou false se exceder limites
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Auditoria de Acessos
```sql
-- Tabela de logs de auditoria
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  record_id UUID,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Cronograma de Implementação

### Q1 2025
- [ ] Implementar estrutura de organizações
- [ ] Migrar dados existentes
- [ ] Atualizar funções de segurança

### Q2 2025
- [ ] Implementar políticas RLS multi-tenant
- [ ] Desenvolver interface de administração
- [ ] Testes extensivos de isolamento

### Q3 2025
- [ ] Otimização de performance
- [ ] Auditoria e monitoramento
- [ ] Documentação para clientes

## Conclusão

A implementação RLS atual fornece a base sólida necessária para multi-tenancy. A migração pode ser feita incrementalmente, mantendo o sistema funcionando durante toda a transição.

**Próximo Passo**: Implementar estrutura de organizações e usuários

---

**Versão**: 1.0
**Data**: 2025-11-03
**Status**: 📋 Planejamento