/**
 * Testes de Performance RLS (Row Level Security)
 * Story: 1.10 - Implementar RLS completo
 * Author: James (Dev Agent)
 *
 * Valida se as políticas RLS não impactam significativamente a performance
 */

import { describe, test, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../lib/types/database';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const publicClient = createClient<Database>(supabaseUrl, supabaseKey);

describe('RLS Performance Tests', () => {

  test('Consultas devem responder em menos de 2 segundos', async () => {
    const tabelas = ['clientes', 'obras', 'funcionarios', 'funcoes', 'setores', 'despesas', 'videos', 'requisicoes'];

    for (const tabela of tabelas) {
      const startTime = Date.now();

      const { data, error } = await publicClient
        .from(tabela as keyof Database['public']['Tables'])
        .select('*')
        .limit(100);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Consulta deve ser rápida mesmo com RLS (< 2 segundos)
      expect(executionTime).toBeLessThan(2000);

      // Erro é esperado devido ao RLS
      expect(error).toBeTruthy();
      expect(error?.message).toMatch(/permission denied|forbidden/i);
    }
  });

  test('Múltiplas consultas paralelas devem manter performance', async () => {
    const startTime = Date.now();

    const promises = [
      publicClient.from('clientes').select('*').limit(10),
      publicClient.from('obras').select('*').limit(10),
      publicClient.from('funcionarios').select('*').limit(10),
      publicClient.from('despesas').select('*').limit(10)
    ];

    const results = await Promise.all(promises);

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Todas as consultas paralelas devem completar em menos de 3 segundos
    expect(totalTime).toBeLessThan(3000);

    // Todas devem retornar erro devido ao RLS
    results.forEach(({ error }) => {
      expect(error).toBeTruthy();
    });
  });

  test('Operações INSERT devem falhar rapidamente', async () => {
    const startTime = Date.now();

    const { data, error } = await publicClient
      .from('clientes')
      .insert({
        nome: 'Performance Test',
        email: 'test@example.com',
        telefone: '11999999999'
      });

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Operação deve falhar rapidamente (< 1 segundo)
    expect(executionTime).toBeLessThan(1000);
    expect(error).toBeTruthy();
    expect(data).toBeNull();
  });

});