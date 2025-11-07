-- =====================================================
-- KANBAN CRM - Correções de Segurança
-- =====================================================

-- 1. Mover extensão pg_trgm para schema extensions (melhor prática)
DROP EXTENSION IF EXISTS pg_trgm CASCADE;
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

-- 2. Recriar índices GIN que dependiam da extensão
DROP INDEX IF EXISTS idx_kanban_cards_cliente_nome;
CREATE INDEX idx_kanban_cards_cliente_nome ON public.kanban_cards USING gin(cliente_nome extensions.gin_trgm_ops);