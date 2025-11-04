import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({
        data: [
          { id: '1', nome: 'Cliente 1', tipo: 'fisico', documento: '123456789' },
          { id: '2', nome: 'Cliente 2', tipo: 'juridico', documento: '987654321' }
        ],
        error: null
      }))
    }))
  }))
}));

// Mock localStorage service
vi.mock('../../localStorage', () => ({
  getFromStorage: vi.fn(() => [
    { id: '1', nome: 'Cliente 1', tipo: 'fisico', cpf: '123456789' },
    { id: '2', nome: 'Cliente 2', tipo: 'juridico', cnpj: '987654321' }
  ]),
  STORAGE_KEYS: {
    CLIENTES: 'engflow_clientes',
    SETORES: 'engflow_setores',
    FUNCOES: 'engflow_funcoes',
    FUNCIONARIOS: 'engflow_funcionarios',
    OBRAS: 'engflow_obras',
    DESPESAS: 'engflow_despesas',
    VIDEOS: 'engflow_videos',
    REQUISICOES: 'engflow_requisicoes'
  }
}));

import { DetailedValidator } from '../detailedValidator';

describe('DetailedValidator', () => {
  let validator: DetailedValidator;

  beforeEach(() => {
    validator = new DetailedValidator();
    vi.clearAllMocks();
  });

  describe('generateChecksum', () => {
    it('deve gerar checksums consistentes para o mesmo objeto', () => {
      const obj1 = { id: '1', nome: 'Teste', valor: 100 };
      const obj2 = { nome: 'Teste', id: '1', valor: 100 }; // Different order

      const checksum1 = (validator as any).generateChecksum(obj1);
      const checksum2 = (validator as any).generateChecksum(obj2);

      expect(checksum1).toBe(checksum2);
      expect(checksum1).toBeDefined();
      expect(typeof checksum1).toBe('string');
    });

    it('deve gerar checksums diferentes para objetos diferentes', () => {
      const obj1 = { id: '1', nome: 'Teste 1' };
      const obj2 = { id: '1', nome: 'Teste 2' };

      const checksum1 = (validator as any).generateChecksum(obj1);
      const checksum2 = (validator as any).generateChecksum(obj2);

      expect(checksum1).not.toBe(checksum2);
    });
  });

  describe('normalizeForComparison', () => {
    it('deve normalizar dados para comparação', () => {
      const supabaseRecord = {
        id: '1',
        nome: 'Teste',
        valor: '100.50',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      const normalized = (validator as any).normalizeForComparison(supabaseRecord, true);

      expect(normalized.created_at).toBeUndefined();
      expect(normalized.updated_at).toBeUndefined();
      expect(normalized.valor).toBe(100.5);
    });

    it('deve normalizar valores numéricos corretamente', () => {
      const record = {
        valor: '250.75',
        progresso: '80',
        orcamento: '50000.00'
      };

      const normalized = (validator as any).normalizeForComparison(record);

      expect(normalized.valor).toBe(250.75);
      expect(normalized.progresso).toBe(80);
      expect(normalized.orcamento).toBe(50000);
    });
  });

  describe('mapLocalStorageToSupabaseFormat', () => {
    it('deve mapear cliente corretamente', () => {
      const localCliente = {
        id: '1',
        nome: 'Cliente Teste',
        tipo: 'fisico',
        cpf: '123.456.789-00',
        telefone: '(11) 99999-9999',
        email: 'cliente@teste.com'
      };

      const mapped = (validator as any).mapLocalStorageToSupabaseFormat(localCliente, 'clientes');

      expect(mapped).toEqual({
        id: '1',
        nome: 'Cliente Teste',
        tipo: 'fisico',
        documento: '123.456.789-00',
        endereco: undefined,
        contato: {
          telefone: '(11) 99999-9999',
          email: 'cliente@teste.com',
          contato_principal: '(11) 99999-9999'
        }
      });
    });

    it('deve mapear obra corretamente', () => {
      const localObra = {
        id: '1',
        clienteId: 'cliente1',
        nome: 'Obra Teste',
        progresso: '75',
        orcamento: '100000.50',
        status: 'em_andamento'
      };

      const mapped = (validator as any).mapLocalStorageToSupabaseFormat(localObra, 'obras');

      expect(mapped).toEqual({
        id: '1',
        cliente_id: 'cliente1',
        nome: 'Obra Teste',
        etapas: undefined,
        progresso: 75,
        orcamento: 100000.50,
        status: 'em_andamento',
        data_inicio: undefined,
        data_fim: undefined,
        descricao: undefined
      });
    });

    it('deve mapear despesa corretamente', () => {
      const localDespesa = {
        id: '1',
        clienteId: 'cliente1',
        obraId: 'obra1',
        valor: '500.75',
        descricao: 'Material de construção',
        dataDespesa: '2023-01-15'
      };

      const mapped = (validator as any).mapLocalStorageToSupabaseFormat(localDespesa, 'despesas');

      expect(mapped).toEqual({
        id: '1',
        cliente_id: 'cliente1',
        obra_id: 'obra1',
        valor: 500.75,
        descricao: 'Material de construção',
        data_despesa: '2023-01-15',
        categoria: undefined,
        status: 'pendente',
        comprovante_url: undefined,
        fornecedor_cnpj: undefined,
        numero_documento: undefined
      });
    });
  });

  describe('compareRecords', () => {
    it('deve retornar array vazio para registros idênticos', () => {
      const record1 = { id: '1', nome: 'Teste', valor: 100 };
      const record2 = { id: '1', nome: 'Teste', valor: 100 };

      const differences = (validator as any).compareRecords(record1, record2);

      expect(differences).toEqual([]);
    });

    it('deve detectar diferenças simples', () => {
      const record1 = { id: '1', nome: 'Teste', valor: 100 };
      const record2 = { id: '1', nome: 'Teste Diferente', valor: 200 };

      const differences = (validator as any).compareRecords(record1, record2);

      expect(differences).toHaveLength(2);
      expect(differences[0]).toEqual({
        field: 'nome',
        localValue: 'Teste',
        supabaseValue: 'Teste Diferente'
      });
      expect(differences[1]).toEqual({
        field: 'valor',
        localValue: 100,
        supabaseValue: 200
      });
    });

    it('deve detectar diferenças em objetos aninhados', () => {
      const record1 = {
        id: '1',
        endereco: { rua: 'Rua A', numero: '123' }
      };
      const record2 = {
        id: '1',
        endereco: { rua: 'Rua B', numero: '123' }
      };

      const differences = (validator as any).compareRecords(record1, record2);

      expect(differences).toHaveLength(1);
      expect(differences[0].field).toBe('endereco');
    });
  });

  describe('executeDetailedValidation', () => {
    it('deve executar validação detalhada com sucesso', async () => {
      const result = await validator.executeDetailedValidation();

      expect(result).toBeDefined();
      expect(result.entities).toHaveLength(8); // 8 entidades
      expect(result.timestamp).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary.totalRecords).toBeGreaterThanOrEqual(0);
    });

    it('deve detectar registros ausentes', async () => {
      // Mock data with missing records
      const mockSupabase = await import('@supabase/supabase-js');
      const createClient = mockSupabase.createClient as any;
      createClient.mockReturnValue({
        from: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({
            data: [
              { id: '1', nome: 'Cliente 1' }
              // Missing record with id '2'
            ],
            error: null
          }))
        }))
      });

      validator = new DetailedValidator();
      const result = await validator.executeDetailedValidation();

      expect(result.success).toBe(false);
      expect(result.summary.totalMissing).toBeGreaterThan(0);
    });

    it('deve lidar com erros de conexão', async () => {
      const mockSupabase = await import('@supabase/supabase-js');
      const createClient = mockSupabase.createClient as any;
      createClient.mockReturnValue({
        from: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Connection error' }
          }))
        }))
      });

      validator = new DetailedValidator();
      const result = await validator.executeDetailedValidation();

      expect(result.entities).toHaveLength(8);
      // Should still complete validation even with errors
    });
  });

  describe('generateDifferenceReport', () => {
    it('deve gerar relatório para validação bem-sucedida', () => {
      const mockResult = {
        success: true,
        timestamp: '2023-01-01T12:00:00Z',
        entities: [
          {
            entity: 'clientes',
            totalRecords: 2,
            identicalRecords: 2,
            differentRecords: 0,
            missingInSupabase: 0,
            missingInLocalStorage: 0,
            checksum: {
              localStorage: 'abc123',
              supabase: 'abc123',
              matches: true
            },
            recordComparisons: []
          }
        ],
        summary: {
          totalRecords: 2,
          totalIdentical: 2,
          totalDifferent: 0,
          totalMissing: 0,
          overallChecksumMatch: true
        },
        errors: []
      };

      const report = validator.generateDifferenceReport(mockResult);

      expect(report).toContain('✅ SUCESSO');
      expect(report).toContain('CLIENTES');
      expect(report).toContain('Total: 2');
      expect(report).toContain('Idênticos: 2');
      expect(report).toContain('Checksum: ✅');
    });

    it('deve gerar relatório para validação com problemas', () => {
      const mockResult = {
        success: false,
        timestamp: '2023-01-01T12:00:00Z',
        entities: [
          {
            entity: 'clientes',
            totalRecords: 2,
            identicalRecords: 1,
            differentRecords: 1,
            missingInSupabase: 0,
            missingInLocalStorage: 0,
            checksum: {
              localStorage: 'abc123',
              supabase: 'def456',
              matches: false
            },
            recordComparisons: [
              {
                id: '1',
                entity: 'clientes',
                status: 'different' as const,
                differences: [
                  {
                    field: 'nome',
                    localValue: 'João',
                    supabaseValue: 'João Silva'
                  }
                ]
              }
            ]
          }
        ],
        summary: {
          totalRecords: 2,
          totalIdentical: 1,
          totalDifferent: 1,
          totalMissing: 0,
          overallChecksumMatch: false
        },
        errors: []
      };

      const report = validator.generateDifferenceReport(mockResult);

      expect(report).toContain('❌ PROBLEMAS ENCONTRADOS');
      expect(report).toContain('Diferentes: 1');
      expect(report).toContain('Checksum: ❌');
      expect(report).toContain('Registros com Diferenças');
      expect(report).toContain('ID: 1');
      expect(report).toContain('nome: localStorage="João" ≠ supabase="João Silva"');
    });
  });
});