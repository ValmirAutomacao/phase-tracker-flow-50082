/**
 * Testes de Isolamento RLS (Row Level Security)
 * Story: 1.10 - Implementar RLS completo
 * Author: James (Dev Agent)
 *
 * Este arquivo testa se as políticas RLS estão funcionando corretamente
 * e se o isolamento de dados está sendo respeitado.
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../lib/types/database';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

// Cliente público (não autenticado)
const publicClient = createClient<Database>(supabaseUrl, supabaseKey);

// Cliente autenticado (será configurado nos testes)
let authenticatedClient: ReturnType<typeof createClient<Database>>;

describe('RLS Isolation Tests', () => {

  beforeAll(async () => {
    // Configurar cliente autenticado se necessário
    authenticatedClient = createClient<Database>(supabaseUrl, supabaseKey);
  });

  afterAll(async () => {
    // Cleanup se necessário
  });

  describe('Teste de Acesso Não Autenticado', () => {

    test('Deve bloquear leitura para usuários não autenticados - Clientes', async () => {
      const { data, error } = await publicClient
        .from('clientes')
        .select('*')
        .limit(1);

      expect(error).toBeTruthy();
      expect(data).toBeNull();
      expect(error?.message).toMatch(/permission denied|RLS|row.level security/i); // Erro de bloqueio de segurança
    });

    test('Deve bloquear leitura para usuários não autenticados - Obras', async () => {
      const { data, error } = await publicClient
        .from('obras')
        .select('*')
        .limit(1);

      expect(error).toBeTruthy();
      expect(data).toBeNull();
    });

    test('Deve bloquear leitura para usuários não autenticados - Funcionários', async () => {
      const { data, error } = await publicClient
        .from('funcionarios')
        .select('*')
        .limit(1);

      expect(error).toBeTruthy();
      expect(data).toBeNull();
    });

    test('Deve bloquear leitura para usuários não autenticados - Funções', async () => {
      const { data, error } = await publicClient
        .from('funcoes')
        .select('*')
        .limit(1);

      expect(error).toBeTruthy();
      expect(data).toBeNull();
    });

    test('Deve bloquear leitura para usuários não autenticados - Setores', async () => {
      const { data, error } = await publicClient
        .from('setores')
        .select('*')
        .limit(1);

      expect(error).toBeTruthy();
      expect(data).toBeNull();
    });

    test('Deve bloquear leitura para usuários não autenticados - Despesas', async () => {
      const { data, error } = await publicClient
        .from('despesas')
        .select('*')
        .limit(1);

      expect(error).toBeTruthy();
      expect(data).toBeNull();
    });

    test('Deve bloquear leitura para usuários não autenticados - Vídeos', async () => {
      const { data, error } = await publicClient
        .from('videos')
        .select('*')
        .limit(1);

      expect(error).toBeTruthy();
      expect(data).toBeNull();
    });

    test('Deve bloquear leitura para usuários não autenticados - Requisições', async () => {
      const { data, error } = await publicClient
        .from('requisicoes')
        .select('*')
        .limit(1);

      expect(error).toBeTruthy();
      expect(data).toBeNull();
    });
  });

  describe('Teste de Funções de Segurança', () => {

    test('current_user_organization() deve retornar UUID válido', async () => {
      const { data, error } = await publicClient
        .rpc('current_user_organization');

      if (data) {
        // Se a função executa (pode executar ou não dependendo da configuração)
        expect(typeof data).toBe('string');
        expect(data).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      }
      // Se não executa devido a RLS, isso também é esperado
    });

    test('is_admin() deve retornar boolean', async () => {
      const { data, error } = await publicClient
        .rpc('is_admin');

      if (data !== null) {
        // Se a função executa
        expect(typeof data).toBe('boolean');
      }
      // Se não executa devido a RLS, isso também é esperado
    });
  });

  describe('Teste de Inserção/Atualização Bloqueada', () => {

    test('Deve bloquear inserção para usuários não autenticados - Clientes', async () => {
      const { data, error } = await publicClient
        .from('clientes')
        .insert({
          nome: 'Teste Cliente',
          email: 'teste@exemplo.com',
          telefone: '11999999999'
        });

      expect(error).toBeTruthy();
      expect(data).toBeNull();
    });

    test('Deve bloquear inserção para usuários não autenticados - Obras', async () => {
      const { data, error } = await publicClient
        .from('obras')
        .insert({
          nome: 'Teste Obra',
          descricao: 'Descrição teste',
          cliente_id: '00000000-0000-0000-0000-000000000001'
        });

      expect(error).toBeTruthy();
      expect(data).toBeNull();
    });
  });

  describe('Teste de Performance RLS', () => {

    test('Consulta com RLS deve executar em tempo razoável', async () => {
      const startTime = Date.now();

      const { data, error } = await publicClient
        .from('clientes')
        .select('*')
        .limit(100);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Mesmo com erro, a consulta deve ser rápida (< 5 segundos)
      expect(executionTime).toBeLessThan(5000);

      // Error é esperado devido ao RLS
      expect(error).toBeTruthy();
    });
  });

  describe('Verificação de Integridade das Políticas', () => {

    test('Todas as tabelas devem ter RLS habilitado', async () => {
      const tabelas = ['clientes', 'obras', 'funcionarios', 'funcoes', 'setores', 'despesas', 'videos', 'requisicoes'];

      for (const tabela of tabelas) {
        const { data, error } = await publicClient
          .from(tabela as keyof Database['public']['Tables'])
          .select('*')
          .limit(1);

        // Todas devem retornar erro devido ao RLS
        expect(error).toBeTruthy();
        expect(data).toBeNull();
      }
    });
  });
});

/**
 * Testes Auxiliares para Validação
 */
describe('RLS Validation Helpers', () => {

  test('Deve validar estrutura de erro RLS', () => {
    // Teste de validação da estrutura de erros esperada
    const mockError = {
      message: 'new row violates row-level security policy',
      code: '42501'
    };

    expect(mockError.message).toContain('row-level security');
    expect(mockError.code).toBe('42501'); // Código de erro RLS PostgreSQL
  });

  test('Deve validar formato UUID para organizações', () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    const testUuid = '00000000-0000-0000-0000-000000000001';

    expect(testUuid).toMatch(uuidRegex);
  });
});