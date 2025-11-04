/**
 * Script de Validação Detalhada - Linha a Linha
 * Story: 1.11 - Migrar dados localStorage
 * Author: James (Dev Agent)
 *
 * Comparação detalhada linha-a-linha entre localStorage e Supabase
 * Checksum detalhado e relatório de diferenças
 */

import { supabase } from '../supabaseClient';
import { STORAGE_KEYS } from '../localStorage';

interface DetailedValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  recordComparisons: {
    entityName: string;
    status: 'success' | 'error' | 'warning';
    localRecords: number;
    supabaseRecords: number;
    matchingRecords: number;
    missingRecords: any[];
    extraRecords: any[];
    modifiedRecords: {
      id: string;
      differences: {
        field: string;
        localValue: unknown;
        supabaseValue: unknown;
      }[];
    }[];
    checksum: {
      local: string;
      supabase: string;
      match: boolean;
    };
  }[];
  summary: {
    totalLocalRecords: number;
    totalSupabaseRecords: number;
    totalMatchingRecords: number;
    overallChecksum: {
      local: string;
      supabase: string;
      match: boolean;
    };
    accuracyPercentage: number; // 0-100%
  };
  differences: {
    missingRecordsTotal: number;
    extraRecordsTotal: number;
    modifiedRecordsTotal: number;
    criticalDifferences: string[];
  };
}

/**
 * Calcula checksum MD5 simples para dados
 */
function calculateDataChecksum(data: any[]): string {
  const normalized = data.map(item => {
    // Normalizar dados removendo campos temporários/timestamps para comparação
    const normalized = { ...item };
    delete normalized.created_at;
    delete normalized.updated_at;
    return normalized;
  }).sort((a, b) => (a.id || '').localeCompare(b.id || ''));

  const dataString = JSON.stringify(normalized);

  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash).toString(16);
}

/**
 * Obtém dados normalizados do localStorage
 */
function getLocalStorageData(key: string): any[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Erro ao ler ${key} do localStorage:`, error);
    return [];
  }
}

/**
 * Obtém dados do Supabase
 */
async function getSupabaseData(tableName: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('id');

    if (error) {
      console.error(`Erro ao ler ${tableName} do Supabase:`, error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error(`Erro ao ler ${tableName} do Supabase:`, error);
    return [];
  }
}

/**
 * Compara dois objetos linha a linha e retorna diferenças
 */
function compareRecords(local: any, supabase: unknown): { field: string; localValue: unknown; supabaseValue: unknown; }[] {
  const differences: { field: string; localValue: unknown; supabaseValue: unknown; }[] = [];

  // Obter todas as chaves únicas dos dois objetos
  const allKeys = new Set([...Object.keys(local), ...Object.keys(supabase)]);

  for (const key of allKeys) {
    // Ignorar campos de timestamp do Supabase
    if (key === 'created_at' || key === 'updated_at') continue;

    const localValue = local[key];
    const supabaseValue = supabase[key];

    // Comparação profunda para objetos
    if (typeof localValue === 'object' && typeof supabaseValue === 'object') {
      if (JSON.stringify(localValue) !== JSON.stringify(supabaseValue)) {
        differences.push({
          field: key,
          localValue: localValue,
          supabaseValue: supabaseValue
        });
      }
    } else if (localValue !== supabaseValue) {
      differences.push({
        field: key,
        localValue: localValue,
        supabaseValue: supabaseValue
      });
    }
  }

  return differences;
}

/**
 * Valida uma entidade específica linha por linha
 */
async function validateEntityDetailed(
  entityName: string,
  storageKey: string,
  tableName: string
): Promise<DetailedValidationResult['recordComparisons'][0]> {

  console.log(`🔍 Validação detalhada: ${entityName}...`);

  const localData = getLocalStorageData(storageKey);
  const supabaseData = await getSupabaseData(tableName);

  // Criar mapas por ID para comparação eficiente
  const localMap = new Map(localData.map(item => [item.id, item]));
  const supabaseMap = new Map(supabaseData.map(item => [item.id, item]));

  // Encontrar registros ausentes, extras e modificados
  const missingRecords: any[] = [];
  const extraRecords: any[] = [];
  const modifiedRecords: {
    id: string;
    differences: { field: string; localValue: unknown; supabaseValue: unknown; }[];
  }[] = [];

  let matchingRecords = 0;

  // Verificar registros do localStorage
  for (const [id, localRecord] of localMap) {
    const supabaseRecord = supabaseMap.get(id);

    if (!supabaseRecord) {
      missingRecords.push(localRecord);
    } else {
      const differences = compareRecords(localRecord, supabaseRecord);

      if (differences.length === 0) {
        matchingRecords++;
      } else {
        modifiedRecords.push({
          id,
          differences
        });
      }
    }
  }

  // Verificar registros extras no Supabase
  for (const [id, supabaseRecord] of supabaseMap) {
    if (!localMap.has(id)) {
      extraRecords.push(supabaseRecord);
    }
  }

  // Calcular checksums
  const localChecksum = calculateDataChecksum(localData);
  const supabaseChecksum = calculateDataChecksum(supabaseData);

  // Determinar status
  let status: 'success' | 'error' | 'warning' = 'success';
  if (missingRecords.length > 0 || modifiedRecords.length > 0) {
    status = 'error';
  } else if (extraRecords.length > 0) {
    status = 'warning';
  }

  return {
    entityName,
    status,
    localRecords: localData.length,
    supabaseRecords: supabaseData.length,
    matchingRecords,
    missingRecords,
    extraRecords,
    modifiedRecords,
    checksum: {
      local: localChecksum,
      supabase: supabaseChecksum,
      match: localChecksum === supabaseChecksum
    }
  };
}

/**
 * Executa validação detalhada completa linha por linha
 */
export async function performDetailedValidation(): Promise<DetailedValidationResult> {
  console.log('🔍 Iniciando validação detalhada linha-a-linha...');

  const result: DetailedValidationResult = {
    success: true,
    errors: [],
    warnings: [],
    recordComparisons: [],
    summary: {
      totalLocalRecords: 0,
      totalSupabaseRecords: 0,
      totalMatchingRecords: 0,
      overallChecksum: {
        local: '',
        supabase: '',
        match: false
      },
      accuracyPercentage: 100
    },
    differences: {
      missingRecordsTotal: 0,
      extraRecordsTotal: 0,
      modifiedRecordsTotal: 0,
      criticalDifferences: []
    }
  };

  try {
    // Entidades para validação
    const entities = [
      { name: 'clientes', storageKey: STORAGE_KEYS.CLIENTES, tableName: 'clientes' },
      { name: 'setores', storageKey: STORAGE_KEYS.SETORES, tableName: 'setores' },
      { name: 'funcoes', storageKey: STORAGE_KEYS.FUNCOES, tableName: 'funcoes' },
      { name: 'funcionarios', storageKey: STORAGE_KEYS.FUNCIONARIOS, tableName: 'funcionarios' },
      { name: 'obras', storageKey: STORAGE_KEYS.OBRAS, tableName: 'obras' },
      { name: 'despesas', storageKey: STORAGE_KEYS.DESPESAS, tableName: 'despesas' },
      { name: 'videos', storageKey: STORAGE_KEYS.VIDEOS, tableName: 'videos' },
      { name: 'requisicoes', storageKey: STORAGE_KEYS.REQUISICOES, tableName: 'requisicoes' }
    ];

    // Validar cada entidade detalhadamente
    for (const entity of entities) {
      const comparison = await validateEntityDetailed(
        entity.name,
        entity.storageKey,
        entity.tableName
      );

      result.recordComparisons.push(comparison);

      // Acumular totais
      result.summary.totalLocalRecords += comparison.localRecords;
      result.summary.totalSupabaseRecords += comparison.supabaseRecords;
      result.summary.totalMatchingRecords += comparison.matchingRecords;

      // Acumular diferenças
      result.differences.missingRecordsTotal += comparison.missingRecords.length;
      result.differences.extraRecordsTotal += comparison.extraRecords.length;
      result.differences.modifiedRecordsTotal += comparison.modifiedRecords.length;

      // Coletar erros e warnings
      if (comparison.status === 'error') {
        if (comparison.missingRecords.length > 0) {
          result.errors.push(`${entity.name}: ${comparison.missingRecords.length} registros ausentes`);
        }
        if (comparison.modifiedRecords.length > 0) {
          result.errors.push(`${entity.name}: ${comparison.modifiedRecords.length} registros modificados`);

          // Adicionar diferenças críticas
          comparison.modifiedRecords.forEach(record => {
            record.differences.forEach(diff => {
              result.differences.criticalDifferences.push(
                `${entity.name}[${record.id}].${diff.field}: "${diff.localValue}" → "${diff.supabaseValue}"`
              );
            });
          });
        }
      }

      if (comparison.status === 'warning') {
        if (comparison.extraRecords.length > 0) {
          result.warnings.push(`${entity.name}: ${comparison.extraRecords.length} registros extras no Supabase`);
        }
      }

      if (!comparison.checksum.match) {
        result.errors.push(`${entity.name}: Checksum não confere (Local: ${comparison.checksum.local}, Supabase: ${comparison.checksum.supabase})`);
      }
    }

    // Calcular checksum geral
    const allLocalData = result.recordComparisons.map(c => ({
      entity: c.entityName,
      count: c.localRecords,
      checksum: c.checksum.local
    }));

    const allSupabaseData = result.recordComparisons.map(c => ({
      entity: c.entityName,
      count: c.supabaseRecords,
      checksum: c.checksum.supabase
    }));

    result.summary.overallChecksum.local = calculateDataChecksum(allLocalData);
    result.summary.overallChecksum.supabase = calculateDataChecksum(allSupabaseData);
    result.summary.overallChecksum.match = result.summary.overallChecksum.local === result.summary.overallChecksum.supabase;

    // Calcular percentual de precisão
    const totalRecords = result.summary.totalLocalRecords;
    if (totalRecords > 0) {
      result.summary.accuracyPercentage = Math.round(
        (result.summary.totalMatchingRecords / totalRecords) * 100
      );
    }

    // Determinar sucesso geral
    result.success = result.errors.length === 0;

    console.log('✅ Validação detalhada concluída:', {
      success: result.success,
      accuracyPercentage: `${result.summary.accuracyPercentage}%`,
      missingRecords: result.differences.missingRecordsTotal,
      extraRecords: result.differences.extraRecordsTotal,
      modifiedRecords: result.differences.modifiedRecordsTotal,
      errors: result.errors.length,
      warnings: result.warnings.length
    });

  } catch (error) {
    console.error('❌ Erro durante validação detalhada:', error);
    result.success = false;
    result.errors.push(`Erro crítico na validação detalhada: ${error}`);
    result.summary.accuracyPercentage = 0;
  }

  return result;
}

/**
 * Gera relatório detalhado de diferenças em formato legível
 */
export function generateDifferencesReport(validation: DetailedValidationResult): string {
  let report = `# Relatório de Validação Detalhada\n\n`;

  report += `## Resumo Geral\n`;
  report += `- **Status**: ${validation.success ? 'Sucesso' : 'Falhas detectadas'}\n`;
  report += `- **Precisão**: ${validation.summary.accuracyPercentage}%\n`;
  report += `- **Total localStorage**: ${validation.summary.totalLocalRecords} registros\n`;
  report += `- **Total Supabase**: ${validation.summary.totalSupabaseRecords} registros\n`;
  report += `- **Registros Coincidentes**: ${validation.summary.totalMatchingRecords}\n`;
  report += `- **Checksum Geral**: ${validation.summary.overallChecksum.match ? 'Confere' : 'Não confere'}\n\n`;

  if (validation.differences.missingRecordsTotal > 0 ||
      validation.differences.extraRecordsTotal > 0 ||
      validation.differences.modifiedRecordsTotal > 0) {

    report += `## Diferenças Encontradas\n`;
    report += `- **Registros Ausentes**: ${validation.differences.missingRecordsTotal}\n`;
    report += `- **Registros Extras**: ${validation.differences.extraRecordsTotal}\n`;
    report += `- **Registros Modificados**: ${validation.differences.modifiedRecordsTotal}\n\n`;
  }

  // Detalhes por entidade
  report += `## Detalhes por Entidade\n\n`;
  for (const comparison of validation.recordComparisons) {
    report += `### ${comparison.entityName}\n`;
    report += `- **Status**: ${comparison.status}\n`;
    report += `- **localStorage**: ${comparison.localRecords} registros\n`;
    report += `- **Supabase**: ${comparison.supabaseRecords} registros\n`;
    report += `- **Coincidentes**: ${comparison.matchingRecords} registros\n`;
    report += `- **Checksum**: ${comparison.checksum.match ? 'Confere' : 'Não confere'}\n`;

    if (comparison.missingRecords.length > 0) {
      report += `- **Ausentes**: ${comparison.missingRecords.length} registros\n`;
    }

    if (comparison.extraRecords.length > 0) {
      report += `- **Extras**: ${comparison.extraRecords.length} registros\n`;
    }

    if (comparison.modifiedRecords.length > 0) {
      report += `- **Modificados**: ${comparison.modifiedRecords.length} registros\n`;
    }

    report += `\n`;
  }

  // Diferenças críticas
  if (validation.differences.criticalDifferences.length > 0) {
    report += `## Diferenças Críticas (Linha a Linha)\n\n`;
    for (const diff of validation.differences.criticalDifferences.slice(0, 20)) { // Limitar a 20 para legibilidade
      report += `- ${diff}\n`;
    }

    if (validation.differences.criticalDifferences.length > 20) {
      report += `- ... e mais ${validation.differences.criticalDifferences.length - 20} diferenças\n`;
    }
    report += `\n`;
  }

  // Erros e warnings
  if (validation.errors.length > 0) {
    report += `## Erros\n\n`;
    for (const error of validation.errors) {
      report += `- ❌ ${error}\n`;
    }
    report += `\n`;
  }

  if (validation.warnings.length > 0) {
    report += `## Avisos\n\n`;
    for (const warning of validation.warnings) {
      report += `- ⚠️ ${warning}\n`;
    }
    report += `\n`;
  }

  report += `---\n`;
  report += `*Relatório gerado em ${new Date().toLocaleString('pt-BR')}*\n`;

  return report;
}

export type { DetailedValidationResult };