import { createClient } from '@supabase/supabase-js';
import { getFromStorage, STORAGE_KEYS } from '../localStorage';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface ForeignKeyValidation {
  table: string;
  column: string;
  referencedTable: string;
  referencedColumn: string;
  invalidCount: number;
  validCount: number;
  errors: string[];
}

export interface RecordCountValidation {
  entity: string;
  localStorageCount: number;
  supabaseCount: number;
  difference: number;
  isValid: boolean;
}

export interface DataStructureValidation {
  entity: string;
  requiredFields: string[];
  missingFields: string[];
  invalidTypes: string[];
  isValid: boolean;
  errors: string[];
}

export interface IntegrityValidationResult {
  success: boolean;
  foreignKeys: ForeignKeyValidation[];
  recordCounts: RecordCountValidation[];
  dataStructure: DataStructureValidation[];
  summary: {
    totalForeignKeyErrors: number;
    totalRecordCountErrors: number;
    totalStructureErrors: number;
  };
  errors: string[];
}

/**
 * Serviço de validação de integridade referencial pós-migração
 */
export class IntegrityValidator {
  private supabase = createClient(supabaseUrl, supabaseAnonKey);

  /**
   * Valida chaves estrangeiras específicas
   */
  private async validateForeignKey(
    table: string,
    column: string,
    referencedTable: string,
    referencedColumn: string = 'id'
  ): Promise<ForeignKeyValidation> {
    const validation: ForeignKeyValidation = {
      table,
      column,
      referencedTable,
      referencedColumn,
      invalidCount: 0,
      validCount: 0,
      errors: []
    };

    try {
      // Query para encontrar registros com FKs inválidas
      const { data: invalidRecords, error } = await this.supabase.rpc('validate_foreign_key', {
        source_table: table,
        source_column: column,
        target_table: referencedTable,
        target_column: referencedColumn
      });

      if (error) {
        // Fallback para validação manual se a função não existir
        const { data: allRecords } = await this.supabase
          .from(table)
          .select(`${column}`)
          .not(column, 'is', null);

        if (allRecords) {
          for (const record of allRecords) {
            const fkValue = record[column];
            if (fkValue) {
              const { data: referenced } = await this.supabase
                .from(referencedTable)
                .select(referencedColumn)
                .eq(referencedColumn, fkValue)
                .single();

              if (!referenced) {
                validation.invalidCount++;
                validation.errors.push(`FK inválida: ${table}.${column} = ${fkValue}`);
              } else {
                validation.validCount++;
              }
            }
          }
        }
      } else {
        validation.invalidCount = invalidRecords?.length || 0;
        validation.validCount = (allRecords?.length || 0) - validation.invalidCount;
      }

    } catch (error) {
      validation.errors.push(`Erro ao validar FK ${table}.${column}: ${error.message}`);
    }

    return validation;
  }

  /**
   * Valida contagem de registros entre localStorage e Supabase
   */
  private async validateRecordCounts(): Promise<RecordCountValidation[]> {
    const validations: RecordCountValidation[] = [];

    const entityTableMap = {
      CLIENTES: 'clientes',
      SETORES: 'setores',
      FUNCOES: 'funcoes',
      FUNCIONARIOS: 'funcionarios',
      OBRAS: 'obras',
      DESPESAS: 'despesas',
      VIDEOS: 'videos',
      REQUISICOES: 'requisicoes'
    };

    for (const [entityKey, tableName] of Object.entries(entityTableMap)) {
      const storageKey = STORAGE_KEYS[entityKey as keyof typeof STORAGE_KEYS];
      const localData = getFromStorage(storageKey);
      const localStorageCount = localData.length;

      try {
        const { count: supabaseCount, error } = await this.supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (error) {
          validations.push({
            entity: entityKey.toLowerCase(),
            localStorageCount,
            supabaseCount: 0,
            difference: localStorageCount,
            isValid: false
          });
        } else {
          const difference = Math.abs(localStorageCount - (supabaseCount || 0));
          validations.push({
            entity: entityKey.toLowerCase(),
            localStorageCount,
            supabaseCount: supabaseCount || 0,
            difference,
            isValid: difference === 0
          });
        }
      } catch (error) {
        validations.push({
          entity: entityKey.toLowerCase(),
          localStorageCount,
          supabaseCount: 0,
          difference: localStorageCount,
          isValid: false
        });
      }
    }

    return validations;
  }

  /**
   * Valida estrutura de dados migrados
   */
  private async validateDataStructure(): Promise<DataStructureValidation[]> {
    const validations: DataStructureValidation[] = [];

    // Definir campos obrigatórios por entidade
    const requiredFieldsMap = {
      clientes: ['id', 'nome'],
      setores: ['id', 'nome'],
      funcoes: ['id', 'nome'],
      funcionarios: ['id', 'nome'],
      obras: ['id', 'nome'],
      despesas: ['id', 'valor', 'data_despesa'],
      videos: ['id', 'nome'],
      requisicoes: ['id', 'titulo']
    };

    for (const [table, requiredFields] of Object.entries(requiredFieldsMap)) {
      const validation: DataStructureValidation = {
        entity: table,
        requiredFields,
        missingFields: [],
        invalidTypes: [],
        isValid: true,
        errors: []
      };

      try {
        // Buscar alguns registros para validar estrutura
        const { data: records, error } = await this.supabase
          .from(table)
          .select('*')
          .limit(10);

        if (error) {
          validation.isValid = false;
          validation.errors.push(`Erro ao acessar tabela ${table}: ${error.message}`);
        } else if (records && records.length > 0) {
          const firstRecord = records[0];

          // Verificar campos obrigatórios
          for (const field of requiredFields) {
            if (!(field in firstRecord)) {
              validation.missingFields.push(field);
              validation.isValid = false;
            } else if (firstRecord[field] === null || firstRecord[field] === undefined) {
              validation.errors.push(`Campo obrigatório ${field} está nulo`);
              validation.isValid = false;
            }
          }

          // Verificar tipos de dados específicos
          for (const record of records) {
            if (table === 'despesas' && record.valor !== null) {
              if (isNaN(parseFloat(record.valor))) {
                validation.invalidTypes.push('valor deve ser numérico');
                validation.isValid = false;
              }
            }

            if (table === 'obras' && record.progresso !== null) {
              const progresso = parseInt(record.progresso);
              if (isNaN(progresso) || progresso < 0 || progresso > 100) {
                validation.invalidTypes.push('progresso deve estar entre 0 e 100');
                validation.isValid = false;
              }
            }
          }
        }
      } catch (error) {
        validation.isValid = false;
        validation.errors.push(`Erro na validação de estrutura: ${error.message}`);
      }

      validations.push(validation);
    }

    return validations;
  }

  /**
   * Executa validação completa de integridade
   */
  async validateIntegrity(): Promise<IntegrityValidationResult> {
    console.log('🔍 Iniciando validação de integridade...');

    const result: IntegrityValidationResult = {
      success: false,
      foreignKeys: [],
      recordCounts: [],
      dataStructure: [],
      summary: {
        totalForeignKeyErrors: 0,
        totalRecordCountErrors: 0,
        totalStructureErrors: 0
      },
      errors: []
    };

    try {
      // 1. Validar contagem de registros
      console.log('📊 Validando contagem de registros...');
      result.recordCounts = await this.validateRecordCounts();
      result.summary.totalRecordCountErrors = result.recordCounts.filter(v => !v.isValid).length;

      // 2. Validar estrutura de dados
      console.log('🏗️ Validando estrutura de dados...');
      result.dataStructure = await this.validateDataStructure();
      result.summary.totalStructureErrors = result.dataStructure.filter(v => !v.isValid).length;

      // 3. Validar chaves estrangeiras críticas
      console.log('🔗 Validando chaves estrangeiras...');
      const foreignKeyChecks = [
        { table: 'obras', column: 'cliente_id', referencedTable: 'clientes' },
        { table: 'funcoes', column: 'setor_id', referencedTable: 'setores' },
        { table: 'funcionarios', column: 'funcao_id', referencedTable: 'funcoes' },
        { table: 'despesas', column: 'cliente_id', referencedTable: 'clientes' },
        { table: 'despesas', column: 'obra_id', referencedTable: 'obras' },
        { table: 'videos', column: 'obra_id', referencedTable: 'obras' },
        { table: 'requisicoes', column: 'obra_id', referencedTable: 'obras' },
        { table: 'requisicoes', column: 'funcionario_solicitante_id', referencedTable: 'funcionarios' },
        { table: 'requisicoes', column: 'funcionario_responsavel_id', referencedTable: 'funcionarios' }
      ];

      for (const check of foreignKeyChecks) {
        const validation = await this.validateForeignKey(
          check.table,
          check.column,
          check.referencedTable
        );
        result.foreignKeys.push(validation);
        result.summary.totalForeignKeyErrors += validation.invalidCount;
      }

      // 4. Determinar sucesso geral
      const hasErrors = result.summary.totalForeignKeyErrors > 0 ||
                       result.summary.totalRecordCountErrors > 0 ||
                       result.summary.totalStructureErrors > 0;

      result.success = !hasErrors;

      // 5. Log de resultados
      if (result.success) {
        console.log('✅ Validação de integridade passou com sucesso!');
      } else {
        console.log('⚠️ Validação de integridade encontrou problemas:');
        console.log(`- Erros de FK: ${result.summary.totalForeignKeyErrors}`);
        console.log(`- Erros de contagem: ${result.summary.totalRecordCountErrors}`);
        console.log(`- Erros de estrutura: ${result.summary.totalStructureErrors}`);
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Erro geral na validação: ${error.message}`);
      console.error('❌ Erro na validação de integridade:', error);
    }

    return result;
  }

  /**
   * Gera relatório detalhado da validação
   */
  generateValidationReport(result: IntegrityValidationResult): string {
    let report = '# Relatório de Validação de Integridade\n\n';

    // Status geral
    report += `## Status Geral: ${result.success ? '✅ SUCESSO' : '❌ FALHOU'}\n\n`;

    // Resumo
    report += '## Resumo\n';
    report += `- Erros de Chaves Estrangeiras: ${result.summary.totalForeignKeyErrors}\n`;
    report += `- Erros de Contagem de Registros: ${result.summary.totalRecordCountErrors}\n`;
    report += `- Erros de Estrutura de Dados: ${result.summary.totalStructureErrors}\n\n`;

    // Contagem de registros
    report += '## Contagem de Registros\n';
    for (const count of result.recordCounts) {
      report += `- **${count.entity}**: localStorage=${count.localStorageCount}, Supabase=${count.supabaseCount}`;
      if (!count.isValid) {
        report += ` ❌ (diferença: ${count.difference})`;
      } else {
        report += ' ✅';
      }
      report += '\n';
    }

    // Chaves estrangeiras
    if (result.foreignKeys.length > 0) {
      report += '\n## Chaves Estrangeiras\n';
      for (const fk of result.foreignKeys) {
        report += `- **${fk.table}.${fk.column} → ${fk.referencedTable}**: `;
        if (fk.invalidCount === 0) {
          report += `✅ ${fk.validCount} válidas`;
        } else {
          report += `❌ ${fk.invalidCount} inválidas, ${fk.validCount} válidas`;
        }
        report += '\n';
      }
    }

    // Estrutura de dados
    if (result.dataStructure.length > 0) {
      report += '\n## Estrutura de Dados\n';
      for (const structure of result.dataStructure) {
        report += `- **${structure.entity}**: ${structure.isValid ? '✅' : '❌'}`;
        if (!structure.isValid) {
          if (structure.missingFields.length > 0) {
            report += ` - Campos ausentes: ${structure.missingFields.join(', ')}`;
          }
          if (structure.errors.length > 0) {
            report += ` - Erros: ${structure.errors.join(', ')}`;
          }
        }
        report += '\n';
      }
    }

    return report;
  }
}

// Instância singleton
export const integrityValidator = new IntegrityValidator();