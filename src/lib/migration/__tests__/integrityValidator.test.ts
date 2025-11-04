import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        count: 5,
        error: null,
        data: [
          { id: '1', nome: 'Teste', valor: 100 },
          { id: '2', nome: 'Teste 2', progresso: 50 }
        ],
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: '1' },
            error: null
          }))
        })),
        not: vi.fn(() => Promise.resolve({
          data: [{ cliente_id: '1' }],
          error: null
        })),
        limit: vi.fn(() => Promise.resolve({
          data: [
            { id: '1', nome: 'Teste', valor: 100 },
            { id: '2', nome: 'Teste 2', progresso: 50 }
          ],
          error: null
        }))
      }))
    })),
    rpc: vi.fn(() => Promise.resolve({
      data: [],
      error: null
    }))
  }))
}));

// Mock localStorage service
vi.mock('../../localStorage', () => ({
  getFromStorage: vi.fn(() => [
    { id: '1', nome: 'Teste' },
    { id: '2', nome: 'Teste 2' }
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

import { IntegrityValidator } from '../integrityValidator';

describe('IntegrityValidator', () => {
  let validator: IntegrityValidator;

  beforeEach(() => {
    validator = new IntegrityValidator();
    vi.clearAllMocks();
  });

  describe('validateIntegrity', () => {
    it('deve executar validação completa com sucesso', async () => {
      const result = await validator.validateIntegrity();

      expect(result).toBeDefined();
      expect(result.recordCounts).toHaveLength(8); // 8 entidades
      expect(result.dataStructure).toHaveLength(8); // 8 entidades
      expect(result.foreignKeys).toHaveLength(9); // 9 FKs definidas
      expect(result.summary).toBeDefined();
    });

    it('deve detectar diferenças na contagem de registros', async () => {
      // Mock return different count
      const mockSupabase = await import('@supabase/supabase-js');
      const createClient = mockSupabase.createClient as any;
      createClient.mockReturnValue({
        from: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({
            count: 10, // Different from localStorage (2)
            error: null
          }))
        })),
        rpc: vi.fn(() => Promise.resolve({
          data: [],
          error: null
        }))
      });

      validator = new IntegrityValidator();
      const result = await validator.validateIntegrity();

      // Should detect count differences
      const invalidCounts = result.recordCounts.filter(r => !r.isValid);
      expect(invalidCounts.length).toBeGreaterThan(0);
      expect(result.success).toBe(false);
    });
  });

  describe('generateValidationReport', () => {
    it('deve gerar relatório para validação bem-sucedida', () => {
      const mockResult = {
        success: true,
        foreignKeys: [
          {
            table: 'obras',
            column: 'cliente_id',
            referencedTable: 'clientes',
            referencedColumn: 'id',
            invalidCount: 0,
            validCount: 5,
            errors: []
          }
        ],
        recordCounts: [
          {
            entity: 'clientes',
            localStorageCount: 5,
            supabaseCount: 5,
            difference: 0,
            isValid: true
          }
        ],
        dataStructure: [
          {
            entity: 'clientes',
            requiredFields: ['id', 'nome'],
            missingFields: [],
            invalidTypes: [],
            isValid: true,
            errors: []
          }
        ],
        summary: {
          totalForeignKeyErrors: 0,
          totalRecordCountErrors: 0,
          totalStructureErrors: 0
        },
        errors: []
      };

      const report = validator.generateValidationReport(mockResult);

      expect(report).toContain('✅ SUCESSO');
      expect(report).toContain('clientes');
      expect(report).toContain('obras.cliente_id');
    });

    it('deve gerar relatório para validação com erros', () => {
      const mockResult = {
        success: false,
        foreignKeys: [
          {
            table: 'obras',
            column: 'cliente_id',
            referencedTable: 'clientes',
            referencedColumn: 'id',
            invalidCount: 2,
            validCount: 3,
            errors: ['FK inválida']
          }
        ],
        recordCounts: [
          {
            entity: 'clientes',
            localStorageCount: 5,
            supabaseCount: 3,
            difference: 2,
            isValid: false
          }
        ],
        dataStructure: [
          {
            entity: 'clientes',
            requiredFields: ['id', 'nome'],
            missingFields: ['nome'],
            invalidTypes: [],
            isValid: false,
            errors: ['Campo obrigatório ausente']
          }
        ],
        summary: {
          totalForeignKeyErrors: 2,
          totalRecordCountErrors: 1,
          totalStructureErrors: 1
        },
        errors: []
      };

      const report = validator.generateValidationReport(mockResult);

      expect(report).toContain('❌ FALHOU');
      expect(report).toContain('diferença: 2');
      expect(report).toContain('2 inválidas');
      expect(report).toContain('Campos ausentes');
    });
  });

  describe('edge cases', () => {
    it('deve lidar com erro de conexão Supabase', async () => {
      const mockSupabase = await import('@supabase/supabase-js');
      const createClient = mockSupabase.createClient as any;
      createClient.mockReturnValue({
        from: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({
            count: null,
            error: { message: 'Connection error' }
          }))
        })),
        rpc: vi.fn(() => Promise.resolve({
          data: null,
          error: { message: 'RPC error' }
        }))
      });

      validator = new IntegrityValidator();
      const result = await validator.validateIntegrity();

      expect(result.success).toBe(false);
      // Should still complete validation even with errors
      expect(result.recordCounts).toHaveLength(8);
    });

    it('deve validar estrutura com registros vazios', async () => {
      const mockSupabase = await import('@supabase/supabase-js');
      const createClient = mockSupabase.createClient as any;
      createClient.mockReturnValue({
        from: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({
            data: [], // Empty data
            error: null
          }))
        })),
        rpc: vi.fn(() => Promise.resolve({
          data: [],
          error: null
        }))
      });

      validator = new IntegrityValidator();
      const result = await validator.validateIntegrity();

      expect(result.dataStructure).toHaveLength(8);
      // Should still validate structure even with empty data
    });
  });
});