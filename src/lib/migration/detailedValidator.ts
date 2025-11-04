import { createClient } from '@supabase/supabase-js';
import { getFromStorage, STORAGE_KEYS } from '../localStorage';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface RecordComparison {
  id: string;
  entity: string;
  status: 'identical' | 'different' | 'missing_in_supabase' | 'missing_in_localstorage';
  differences: {
    field: string;
    localValue: unknown;
    supabaseValue: unknown;
  }[];
}

export interface EntityValidation {
  entity: string;
  totalRecords: number;
  identicalRecords: number;
  differentRecords: number;
  missingInSupabase: number;
  missingInLocalStorage: number;
  checksum: {
    localStorage: string;
    supabase: string;
    matches: boolean;
  };
  recordComparisons: RecordComparison[];
}

export interface DetailedValidationResult {
  success: boolean;
  timestamp: string;
  entities: EntityValidation[];
  summary: {
    totalRecords: number;
    totalIdentical: number;
    totalDifferent: number;
    totalMissing: number;
    overallChecksumMatch: boolean;
  };
  errors: string[];
}

/**
 * Serviço de validação detalhada linha-a-linha
 * Compara dados entre localStorage e Supabase com precisão
 */
export class DetailedValidator {
  private supabase = createClient(supabaseUrl, supabaseAnonKey);

  /**
   * Gera checksum MD5-like para um objeto
   */
  private generateChecksum(data: unknown): string {
    const str = JSON.stringify(data, Object.keys(data).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Normaliza objeto para comparação (remove campos de timestamp)
   */
  private normalizeForComparison(obj: any, isSupabase: boolean = false): any {
    const normalized = { ...obj };

    // Remover campos de metadados do Supabase
    if (isSupabase) {
      delete normalized.created_at;
      delete normalized.updated_at;
    }

    // Normalizar campos que podem ter formatos diferentes
    if (normalized.endereco && typeof normalized.endereco === 'string') {
      try {
        normalized.endereco = JSON.parse(normalized.endereco);
      } catch {
        // Keep as string if not valid JSON
      }
    }

    if (normalized.contato && typeof normalized.contato === 'string') {
      try {
        normalized.contato = JSON.parse(normalized.contato);
      } catch {
        // Keep as string if not valid JSON
      }
    }

    // Normalizar valores numéricos
    Object.keys(normalized).forEach(key => {
      if (key === 'valor' || key === 'orcamento') {
        normalized[key] = parseFloat(normalized[key]) || 0;
      } else if (key === 'progresso') {
        normalized[key] = parseInt(normalized[key]) || 0;
      }
    });

    return normalized;
  }

  /**
   * Mapeia registro localStorage para formato Supabase para comparação
   */
  private mapLocalStorageToSupabaseFormat(record: any, entity: string): any {
    const mapped = { ...record };

    switch (entity) {
      case 'clientes':
        return {
          id: mapped.id,
          nome: mapped.nome,
          tipo: mapped.tipo || 'fisico',
          documento: mapped.cpf || mapped.cnpj || mapped.documento,
          endereco: mapped.endereco,
          contato: {
            telefone: mapped.telefone,
            email: mapped.email,
            contato_principal: mapped.contato_principal || mapped.telefone
          }
        };

      case 'obras':
        return {
          id: mapped.id,
          cliente_id: mapped.clienteId || mapped.cliente_id,
          nome: mapped.nome,
          etapas: mapped.etapas,
          progresso: parseInt(mapped.progresso) || 0,
          orcamento: parseFloat(mapped.orcamento) || null,
          status: mapped.status || 'planejamento',
          data_inicio: mapped.dataInicio || mapped.data_inicio,
          data_fim: mapped.dataFim || mapped.data_fim,
          descricao: mapped.descricao
        };

      case 'funcionarios':
        return {
          id: mapped.id,
          funcao_id: mapped.funcaoId || mapped.funcao_id,
          nome: mapped.nome,
          email: mapped.email,
          telefone: mapped.telefone,
          ativo: mapped.ativo !== false
        };

      case 'funcoes':
        return {
          id: mapped.id,
          setor_id: mapped.setorId || mapped.setor_id,
          nome: mapped.nome,
          descricao: mapped.descricao
        };

      case 'despesas':
        return {
          id: mapped.id,
          cliente_id: mapped.clienteId || mapped.cliente_id,
          obra_id: mapped.obraId || mapped.obra_id,
          valor: parseFloat(mapped.valor) || 0,
          descricao: mapped.descricao,
          data_despesa: mapped.dataDespesa || mapped.data_despesa,
          categoria: mapped.categoria,
          status: mapped.status || 'pendente',
          comprovante_url: mapped.comprovanteUrl || mapped.comprovante_url,
          fornecedor_cnpj: mapped.fornecedorCnpj || mapped.fornecedor_cnpj,
          numero_documento: mapped.numeroDocumento || mapped.numero_documento
        };

      case 'videos':
        return {
          id: mapped.id,
          obra_id: mapped.obraId || mapped.obra_id,
          nome: mapped.nome,
          status_renderizacao: mapped.statusRenderizacao || mapped.status_renderizacao || 'pendente',
          arquivo_original_url: mapped.arquivoOriginalUrl || mapped.arquivo_original_url,
          arquivo_renderizado_url: mapped.arquivoRenderizadoUrl || mapped.arquivo_renderizado_url,
          duracao_segundos: parseInt(mapped.duracaoSegundos) || mapped.duracao_segundos,
          drive_pasta_id: mapped.drivePastaId || mapped.drive_pasta_id,
          drive_subpasta_id: mapped.driveSubpastaId || mapped.drive_subpasta_id,
          n8n_job_id: mapped.n8nJobId || mapped.n8n_job_id
        };

      case 'requisicoes':
        return {
          id: mapped.id,
          obra_id: mapped.obraId || mapped.obra_id,
          funcionario_solicitante_id: mapped.funcionarioSolicitanteId || mapped.funcionario_solicitante_id,
          titulo: mapped.titulo,
          descricao: mapped.descricao,
          status: mapped.status || 'pendente',
          prioridade: mapped.prioridade || 'media',
          data_vencimento: mapped.dataVencimento || mapped.data_vencimento,
          funcionario_responsavel_id: mapped.funcionarioResponsavelId || mapped.funcionario_responsavel_id,
          observacoes: mapped.observacoes,
          anexos: mapped.anexos
        };

      default:
        return mapped;
    }
  }

  /**
   * Compara dois registros e retorna diferenças
   */
  private compareRecords(localRecord: any, supabaseRecord: unknown): RecordComparison['differences'] {
    const differences: RecordComparison['differences'] = [];
    const localNormalized = this.normalizeForComparison(localRecord);
    const supabaseNormalized = this.normalizeForComparison(supabaseRecord, true);

    // Comparar todos os campos do registro local
    Object.keys(localNormalized).forEach(field => {
      const localValue = localNormalized[field];
      const supabaseValue = supabaseNormalized[field];

      // Comparação profunda para objetos
      if (typeof localValue === 'object' && typeof supabaseValue === 'object') {
        if (JSON.stringify(localValue) !== JSON.stringify(supabaseValue)) {
          differences.push({
            field,
            localValue,
            supabaseValue
          });
        }
      } else if (localValue !== supabaseValue) {
        differences.push({
          field,
          localValue,
          supabaseValue
        });
      }
    });

    return differences;
  }

  /**
   * Valida uma entidade específica linha por linha
   */
  private async validateEntity(entity: string, tableName: string): Promise<EntityValidation> {
    const storageKey = STORAGE_KEYS[entity.toUpperCase() as keyof typeof STORAGE_KEYS];
    const localData = getFromStorage(storageKey);

    const validation: EntityValidation = {
      entity,
      totalRecords: localData.length,
      identicalRecords: 0,
      differentRecords: 0,
      missingInSupabase: 0,
      missingInLocalStorage: 0,
      checksum: {
        localStorage: '',
        supabase: '',
        matches: false
      },
      recordComparisons: []
    };

    try {
      // Buscar todos os registros do Supabase
      const { data: supabaseData, error } = await this.supabase
        .from(tableName)
        .select('*');

      if (error) {
        throw new Error(`Erro ao buscar dados de ${tableName}: ${error.message}`);
      }

      const supabaseRecords = supabaseData || [];

      // Criar mapas por ID para comparação eficiente
      const localMap = new Map(localData.map(record => [record.id, record]));
      const supabaseMap = new Map(supabaseRecords.map(record => [record.id, record]));

      // Comparar registros do localStorage
      for (const localRecord of localData) {
        const mappedLocal = this.mapLocalStorageToSupabaseFormat(localRecord, entity);
        const supabaseRecord = supabaseMap.get(localRecord.id);

        if (!supabaseRecord) {
          validation.missingInSupabase++;
          validation.recordComparisons.push({
            id: localRecord.id,
            entity,
            status: 'missing_in_supabase',
            differences: []
          });
        } else {
          const differences = this.compareRecords(mappedLocal, supabaseRecord);

          if (differences.length === 0) {
            validation.identicalRecords++;
            validation.recordComparisons.push({
              id: localRecord.id,
              entity,
              status: 'identical',
              differences: []
            });
          } else {
            validation.differentRecords++;
            validation.recordComparisons.push({
              id: localRecord.id,
              entity,
              status: 'different',
              differences
            });
          }
        }
      }

      // Verificar registros extras no Supabase
      for (const supabaseRecord of supabaseRecords) {
        if (!localMap.has(supabaseRecord.id)) {
          validation.missingInLocalStorage++;
          validation.recordComparisons.push({
            id: supabaseRecord.id,
            entity,
            status: 'missing_in_localstorage',
            differences: []
          });
        }
      }

      // Calcular checksums
      const mappedLocalData = localData.map(record =>
        this.normalizeForComparison(this.mapLocalStorageToSupabaseFormat(record, entity))
      ).sort((a, b) => a.id.localeCompare(b.id));

      const normalizedSupabaseData = supabaseRecords
        .map(record => this.normalizeForComparison(record, true))
        .sort((a, b) => a.id.localeCompare(b.id));

      validation.checksum.localStorage = this.generateChecksum(mappedLocalData);
      validation.checksum.supabase = this.generateChecksum(normalizedSupabaseData);
      validation.checksum.matches = validation.checksum.localStorage === validation.checksum.supabase;

    } catch (error) {
      console.error(`Erro na validação detalhada de ${entity}:`, error);
    }

    return validation;
  }

  /**
   * Executa validação detalhada completa
   */
  async executeDetailedValidation(): Promise<DetailedValidationResult> {
    console.log('🔍 Iniciando validação detalhada linha-a-linha...');

    const result: DetailedValidationResult = {
      success: false,
      timestamp: new Date().toISOString(),
      entities: [],
      summary: {
        totalRecords: 0,
        totalIdentical: 0,
        totalDifferent: 0,
        totalMissing: 0,
        overallChecksumMatch: true
      },
      errors: []
    };

    const entityTableMap = {
      clientes: 'clientes',
      setores: 'setores',
      funcoes: 'funcoes',
      funcionarios: 'funcionarios',
      obras: 'obras',
      despesas: 'despesas',
      videos: 'videos',
      requisicoes: 'requisicoes'
    };

    try {
      // Validar cada entidade
      for (const [entity, tableName] of Object.entries(entityTableMap)) {
        console.log(`🔄 Validando ${entity}...`);
        const entityValidation = await this.validateEntity(entity, tableName);
        result.entities.push(entityValidation);

        // Atualizar resumo
        result.summary.totalRecords += entityValidation.totalRecords;
        result.summary.totalIdentical += entityValidation.identicalRecords;
        result.summary.totalDifferent += entityValidation.differentRecords;
        result.summary.totalMissing += entityValidation.missingInSupabase + entityValidation.missingInLocalStorage;

        if (!entityValidation.checksum.matches) {
          result.summary.overallChecksumMatch = false;
        }
      }

      // Determinar sucesso
      const hasIssues = result.summary.totalDifferent > 0 ||
                       result.summary.totalMissing > 0 ||
                       !result.summary.overallChecksumMatch;

      result.success = !hasIssues;

      // Log de resultados
      if (result.success) {
        console.log('✅ Validação detalhada passou com sucesso!');
        console.log(`📊 ${result.summary.totalIdentical} registros idênticos`);
      } else {
        console.log('⚠️ Validação detalhada encontrou problemas:');
        console.log(`- Registros diferentes: ${result.summary.totalDifferent}`);
        console.log(`- Registros ausentes: ${result.summary.totalMissing}`);
        console.log(`- Checksum geral: ${result.summary.overallChecksumMatch ? 'OK' : 'FALHA'}`);
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Erro geral na validação: ${error.message}`);
      console.error('❌ Erro na validação detalhada:', error);
    }

    return result;
  }

  /**
   * Gera relatório detalhado de diferenças
   */
  generateDifferenceReport(result: DetailedValidationResult): string {
    let report = '# Relatório Detalhado de Validação\n\n';

    // Cabeçalho
    report += `**Data/Hora:** ${new Date(result.timestamp).toLocaleString('pt-BR')}\n`;
    report += `**Status:** ${result.success ? '✅ SUCESSO' : '❌ PROBLEMAS ENCONTRADOS'}\n\n`;

    // Resumo geral
    report += '## Resumo Geral\n';
    report += `- **Total de Registros:** ${result.summary.totalRecords}\n`;
    report += `- **Registros Idênticos:** ${result.summary.totalIdentical}\n`;
    report += `- **Registros Diferentes:** ${result.summary.totalDifferent}\n`;
    report += `- **Registros Ausentes:** ${result.summary.totalMissing}\n`;
    report += `- **Checksum Geral:** ${result.summary.overallChecksumMatch ? '✅ OK' : '❌ FALHA'}\n\n`;

    // Detalhes por entidade
    for (const entity of result.entities) {
      report += `## ${entity.entity.toUpperCase()}\n`;
      report += `- **Total:** ${entity.totalRecords}\n`;
      report += `- **Idênticos:** ${entity.identicalRecords}\n`;
      report += `- **Diferentes:** ${entity.differentRecords}\n`;
      report += `- **Ausentes no Supabase:** ${entity.missingInSupabase}\n`;
      report += `- **Ausentes no localStorage:** ${entity.missingInLocalStorage}\n`;
      report += `- **Checksum:** ${entity.checksum.matches ? '✅' : '❌'}\n`;

      // Listar diferenças específicas
      const differentRecords = entity.recordComparisons.filter(r => r.status === 'different');
      if (differentRecords.length > 0) {
        report += '\n### Registros com Diferenças\n';
        for (const record of differentRecords.slice(0, 5)) { // Limit to first 5
          report += `**ID: ${record.id}**\n`;
          for (const diff of record.differences) {
            report += `- ${diff.field}: localStorage="${diff.localValue}" ≠ supabase="${diff.supabaseValue}"\n`;
          }
          report += '\n';
        }
        if (differentRecords.length > 5) {
          report += `... e mais ${differentRecords.length - 5} registros com diferenças.\n\n`;
        }
      }

      // Listar registros ausentes
      const missingRecords = entity.recordComparisons.filter(r =>
        r.status === 'missing_in_supabase' || r.status === 'missing_in_localstorage'
      );
      if (missingRecords.length > 0) {
        report += '\n### Registros Ausentes\n';
        for (const record of missingRecords.slice(0, 5)) {
          const location = record.status === 'missing_in_supabase' ? 'Supabase' : 'localStorage';
          report += `- **${record.id}**: ausente no ${location}\n`;
        }
        if (missingRecords.length > 5) {
          report += `... e mais ${missingRecords.length - 5} registros ausentes.\n\n`;
        }
      }

      report += '\n---\n\n';
    }

    return report;
  }
}

// Instância singleton
export const detailedValidator = new DetailedValidator();