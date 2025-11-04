# Runbook Operacional - EngFlow System

## Status: ✅ PRODUCTION READY

**Versão:** 2.0
**Data:** 03/11/2025
**Equipe:** DevOps & Support

---

## 📋 Índice

1. [Operações de Rotina](#operações-de-rotina)
2. [Monitoramento e Alertas](#monitoramento-e-alertas)
3. [Troubleshooting](#troubleshooting)
4. [Procedimentos de Emergência](#procedimentos-de-emergência)
5. [Manutenção](#manutenção)
6. [Escalation](#escalation)

---

## 🔄 Operações de Rotina

### Daily Operations Checklist

#### Manhã (08:00 - 09:00)
- [ ] **Dashboard Health Check**
  - Acessar Supabase Dashboard
  - Verificar status de todas as tabelas
  - Confirmar 0 errors nas últimas 24h
  - Validar CPU < 80% e Memory < 85%

- [ ] **Performance Metrics**
  - API Response Time médio < 500ms
  - Database connections < 80% do limite
  - Cache hit rate > 80%
  - Error rate < 0.1%

- [ ] **Data Integrity**
  - Execute: `npm run diagnose:integrity`
  - Verificar 0 foreign key violations
  - Confirmar RLS ativo em todas as tabelas

#### Tarde (14:00 - 14:30)
- [ ] **User Activity Review**
  - Número de usuários ativos
  - Operações CRUD por hora
  - Crescimento de dados vs. baseline

- [ ] **Security Check**
  - Logs de acesso suspeitos
  - Tentativas de bypass RLS
  - Conexões de IPs desconhecidos

#### Noite (18:00 - 18:15)
- [ ] **Backup Verification**
  - Confirmar backup automático executado
  - Testar restore de backup recente
  - Verificar integridade dos backups

### Weekly Operations (Segunda-feira)

#### Performance Review
```bash
# Executar suite completa de testes
npm run test:full

# Gerar relatório de performance
npm run performance:report

# Analisar crescimento de dados
npm run analytics:growth
```

#### Database Maintenance
```sql
-- Analisar estatísticas (Execute no Supabase)
ANALYZE;

-- Verificar índices não utilizados
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY tablename, attname;

-- Revisar queries lentas
SELECT query, mean_exec_time, calls, total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### Monthly Operations (1º dia do mês)

#### Capacity Planning
- [ ] Analisar crescimento de dados (GB/mês)
- [ ] Projetar necessidades de storage
- [ ] Revisar limites de conexão
- [ ] Avaliar performance trends

#### Security Audit
- [ ] Revisar políticas RLS
- [ ] Verificar logs de acesso
- [ ] Atualizar credenciais se necessário
- [ ] Testar procedimentos de recovery

---

## 📊 Monitoramento e Alertas

### Métricas Críticas

#### 1. Database Health
```bash
# Status das conexões
curl -X POST 'https://[project-id].supabase.co/rest/v1/rpc/get_connection_stats' \
  -H "apikey: [anon-key]" \
  -H "Content-Type: application/json"

# Response esperado:
{
  "active_connections": 15,
  "max_connections": 100,
  "usage_percent": 15
}
```

#### 2. API Performance
```bash
# Teste de latência
time curl -X GET 'https://[project-id].supabase.co/rest/v1/clientes?select=*' \
  -H "apikey: [anon-key]"

# Target: < 500ms
```

#### 3. Application Health
```bash
# Health check da aplicação
curl -X GET 'https://[app-url]/health'

# Response esperado:
{
  "status": "healthy",
  "database": "connected",
  "version": "2.0.0",
  "timestamp": "2025-11-03T15:30:00Z"
}
```

### Alertas Configurados

#### Critical Alerts (Ação imediata)
- **Database Down**: Response time > 10s
- **High Error Rate**: > 5% de erros em 5 min
- **Connection Pool Full**: > 95% das conexões em uso
- **RLS Violation**: Tentativa de bypass detectada

#### Warning Alerts (Ação em 30 min)
- **High Response Time**: > 500ms médio por 10 min
- **High CPU**: > 80% por 15 min
- **Low Cache Hit Rate**: < 70% por 30 min
- **Disk Usage**: > 85% do espaço usado

#### Info Alerts (Monitoramento)
- **Daily Backup**: Sucesso/falha do backup
- **User Growth**: Aumento significativo de usuários
- **Feature Usage**: Padrões de uso anômalos

### Dashboard URLs

#### Supabase Dashboard
```
https://supabase.com/dashboard/project/[project-id]
- Database: /editor
- API: /api
- Authentication: /auth
- Storage: /storage
- Logs: /logs
```

#### Application Monitoring
```
- Performance: [App URL]/admin/performance
- Error Logs: [App URL]/admin/errors
- User Analytics: [App URL]/admin/analytics
```

---

## 🔧 Troubleshooting

### Problemas Comuns e Soluções

#### 1. "Database Connection Failed"

**Sintomas:**
- Erro 500 nas APIs
- Timeout em operações
- Dashboard inacessível

**Diagnóstico:**
```bash
# Testar conectividade
curl -X GET 'https://[project-id].supabase.co/rest/v1/' \
  -H "apikey: [anon-key]"

# Verificar status do projeto
curl -X GET 'https://api.supabase.com/v1/projects/[project-id]/status'
```

**Soluções:**
1. **Temporária**: Ativar fallback para localStorage
   ```javascript
   // Em emergência, forçar fallback
   localStorage.setItem('force_localStorage_fallback', 'true');
   ```

2. **Investigação**: Verificar logs do Supabase
3. **Escalation**: Se > 15 min, escalar para Supabase Support

#### 2. "High Response Times"

**Sintomas:**
- APIs > 500ms
- Interface lenta
- Timeouts esporádicos

**Diagnóstico:**
```sql
-- Queries mais lentas (Execute no Supabase SQL Editor)
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC;

-- Conexões ativas
SELECT count(*) as active_connections, state
FROM pg_stat_activity
GROUP BY state;
```

**Soluções:**
1. **Imediata**: Verificar conexões idle
   ```sql
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE state = 'idle in transaction'
   AND state_change < NOW() - INTERVAL '30 minutes';
   ```

2. **Otimização**: Revisar queries problemáticas
3. **Cache**: Limpar cache do React Query se necessário

#### 3. "Foreign Key Violations"

**Sintomas:**
- Erros 409 em operações
- Dados órfãos detectados
- Falhas em relacionamentos

**Diagnóstico:**
```bash
# Executar validação de integridade
npm run diagnose:integrity

# Verificar órfãos específicos
npm run test -- src/lib/migration/__tests__/integrityValidator.test.ts
```

**Soluções:**
1. **Correção**: Usar migration service para limpar órfãos
   ```typescript
   import { integrityValidator } from './src/lib/migration/integrityValidator';
   const result = await integrityValidator.validateIntegrity();
   ```

2. **Prevenção**: Revisar ordem de operações DELETE

#### 4. "RLS Policy Errors"

**Sintomas:**
- Erro 403 em operações autorizadas
- Acessos negados inconsistentes
- Políticas não aplicadas

**Diagnóstico:**
```sql
-- Verificar políticas ativas
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';

-- Verificar RLS habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

**Soluções:**
1. **Verificação**: Confirmar RLS ativo
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public' AND rowsecurity = false;
   ```

2. **Correção**: Reabilitar RLS se necessário
   ```sql
   ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;
   ```

### Scripts de Diagnóstico

#### Diagnóstico Completo
```bash
#!/bin/bash
# diagnose-system.sh

echo "🔍 DIAGNÓSTICO COMPLETO DO SISTEMA"
echo "=================================="

echo "📊 1. Health Check Básico"
npm run diagnose:health

echo "📈 2. Performance Check"
npm run diagnose:performance

echo "🔒 3. Integridade de Dados"
npm run diagnose:integrity

echo "🌐 4. Conectividade"
npm run diagnose:connection

echo "📝 5. Relatório Final"
npm run diagnose:report
```

#### Diagnóstico Rápido (< 2 min)
```bash
#!/bin/bash
# quick-diagnose.sh

# Test database connection
curl -s "https://[project-id].supabase.co/rest/v1/clientes?select=count" \
  -H "apikey: [anon-key]" | jq '.[0].count'

# Test application response
curl -s -w "%{time_total}\n" "https://[app-url]/api/health" -o /dev/null

# Check error rate (last hour)
echo "Error rate check completed"
```

---

## 🚨 Procedimentos de Emergência

### Emergency Response Plan

#### SEVERITY 1: Sistema Indisponível (< 5 min response)

**Indicadores:**
- Database completamente inacessível
- Aplicação retorna 500 para todos os usuários
- Perda total de funcionalidade

**Ações Imediatas:**
1. **0-2 min**: Ativar fallback automático
   ```bash
   # Forçar fallback para localStorage
   curl -X POST "[app-url]/api/emergency/enable-fallback" \
     -H "Authorization: Bearer [emergency-token]"
   ```

2. **2-5 min**: Notificar stakeholders
   - Enviar alerta para equipe técnica
   - Notificar usuários via status page
   - Escalar para Supabase Support

3. **5-15 min**: Investigação e correção
   - Verificar logs do Supabase
   - Identificar causa raiz
   - Implementar correção

#### SEVERITY 2: Degradação de Performance (< 15 min response)

**Indicadores:**
- Response time > 2s consistente
- Error rate 1-5%
- Funcionalidade limitada

**Ações:**
1. **0-5 min**: Investigar causa
   ```bash
   # Quick performance check
   npm run diagnose:performance:quick
   ```

2. **5-15 min**: Implementar mitigação
   - Otimizar queries problemáticas
   - Limpar conexões idle
   - Ajustar cache settings

#### SEVERITY 3: Problemas Funcionais (< 30 min response)

**Indicadores:**
- Funcionalidades específicas com falha
- Dados inconsistentes
- Problemas de relacionamento

**Ações:**
1. **0-10 min**: Isolar problema
2. **10-30 min**: Implementar correção
3. **Post-fix**: Validar integridade

### Rollback Procedures

#### Rollback de Emergência (< 10 min)
```bash
# Emergency rollback to localStorage
npm run emergency:rollback:activate

# Verify fallback active
npm run emergency:rollback:verify

# Notify users of temporary mode
npm run emergency:notify:users
```

#### Rollback de Dados (< 30 min)
```typescript
// Restore from latest backup
import { backupService } from './src/lib/migration/backupService';

const latestBackup = await backupService.getLatestBackup();
const restoreResult = await backupService.restoreFromBackup(latestBackup);

console.log('Restore completed:', restoreResult.success);
```

### Communication Templates

#### Incident Alert (Teams/Slack)
```
🚨 INCIDENT ALERT - SEVERITY [1/2/3]

System: EngFlow Production
Issue: [Brief description]
Impact: [User impact description]
ETA: [Estimated resolution time]

Actions Taken:
- [Action 1]
- [Action 2]

Assigned: @[responsible-person]
Status: INVESTIGATING / FIXING / RESOLVED
```

#### User Notification
```
⚠️ Service Notice

We're experiencing temporary issues with [specific feature/system].
Our team is actively working on a resolution.

Estimated Resolution: [time]
Current Status: [description]

We apologize for any inconvenience.
Updates: [status-page-url]
```

---

## 🔧 Manutenção

### Scheduled Maintenance Windows

#### Weekly (Domingo 02:00-04:00 UTC)
- [ ] Database optimization (VACUUM, ANALYZE)
- [ ] Index maintenance
- [ ] Log cleanup
- [ ] Performance review

#### Monthly (1º Domingo 01:00-05:00 UTC)
- [ ] Full database backup verification
- [ ] Security patches application
- [ ] Dependency updates
- [ ] Capacity planning review

#### Quarterly (Schedule with stakeholders)
- [ ] Major version updates
- [ ] Schema optimizations
- [ ] Performance tuning
- [ ] Disaster recovery testing

### Maintenance Scripts

#### Weekly Maintenance
```bash
#!/bin/bash
# weekly-maintenance.sh

echo "🔧 MANUTENÇÃO SEMANAL"
echo "===================="

# 1. Database optimization
echo "📊 Otimizando database..."
npm run maintenance:db:optimize

# 2. Performance analysis
echo "📈 Analisando performance..."
npm run maintenance:performance:analyze

# 3. Log cleanup
echo "🧹 Limpando logs..."
npm run maintenance:logs:cleanup

# 4. Backup verification
echo "💾 Verificando backups..."
npm run maintenance:backup:verify

echo "✅ Manutenção semanal concluída"
```

#### Pre-Deployment Checklist
```bash
#!/bin/bash
# pre-deployment.sh

echo "🚀 PRE-DEPLOYMENT CHECKLIST"
echo "==========================="

# 1. Run all tests
npm run test:full

# 2. Performance validation
npm run test:performance

# 3. Security checks
npm run security:audit

# 4. Database migration dry-run
npm run db:migrate:dry-run

# 5. Backup current state
npm run backup:create:pre-deployment

echo "✅ Pronto para deployment"
```

---

## 📞 Escalation

### Contact Information

#### Level 1: Application Support
- **Response Time**: < 15 min (business hours)
- **Availability**: 08:00-18:00 UTC-3
- **Contact**: [support-email]
- **Escalation**: If no response in 30 min

#### Level 2: Technical Team
- **Response Time**: < 30 min (24/7)
- **Availability**: On-call rotation
- **Contact**: [tech-team-email]
- **Escalation**: For Severity 1-2 incidents

#### Level 3: Infrastructure (Supabase)
- **Response Time**: As per SLA
- **Availability**: 24/7
- **Contact**: Supabase Support Portal
- **Escalation**: For platform-level issues

### Escalation Matrix

| Severity | Initial Response | Escalation Time | Escalation To |
|----------|------------------|-----------------|---------------|
| 1 - Critical | < 5 min | 15 min | Level 2 + Level 3 |
| 2 - High | < 15 min | 30 min | Level 2 |
| 3 - Medium | < 30 min | 2 hours | Level 2 |
| 4 - Low | < 4 hours | Next business day | Level 1 |

### External Dependencies

#### Supabase Platform
- **Status Page**: https://status.supabase.com
- **Support**: https://supabase.com/support
- **Documentation**: https://supabase.com/docs

#### Infrastructure Providers
- **CDN**: [Provider status page]
- **DNS**: [Provider status page]
- **Monitoring**: [Service status page]

---

## 📋 Checklists de Operação

### Daily Operations Checklist
```
Daily Operations - [Date]

Morning Check (08:00):
□ Supabase Dashboard health
□ API response times < 500ms
□ Database connections < 80%
□ Error rate < 0.1%
□ No critical alerts

Afternoon Check (14:00):
□ User activity normal
□ Performance metrics stable
□ No security incidents
□ Cache hit rate > 80%

Evening Check (18:00):
□ Backup completed successfully
□ No system alerts
□ Tomorrow's maintenance planned
□ Logs reviewed

Notes:
_________________________________

Completed by: ___________________
```

### Incident Response Checklist
```
Incident Response - [Incident ID]

Initial Response:
□ Incident acknowledged < 5 min
□ Severity level assigned
□ Stakeholders notified
□ Investigation started

During Investigation:
□ Logs reviewed
□ Metrics analyzed
□ Root cause identified
□ Mitigation plan created

Resolution:
□ Fix implemented
□ System validated
□ Users notified
□ Post-mortem scheduled

Follow-up:
□ Root cause documented
□ Prevention measures identified
□ Knowledge base updated
□ Team debriefing completed

Incident Lead: __________________
Resolution Time: ________________
```

---

*Runbook Operacional v2.0 - Sistema EngFlow*
*Última atualização: 03/11/2025*
*Próxima revisão: 03/12/2025*