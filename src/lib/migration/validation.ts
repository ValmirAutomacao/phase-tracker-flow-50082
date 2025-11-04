/**
 * Script de Validação de Integridade - Migração localStorage → Supabase
 * Story: 1.11 - Migrar dados localStorage
 * Author: James (Dev Agent)
 *
 * Validação rigorosa de integridade referencial e consistência de dados
 */

import { supabase } from '../supabaseClient';
import { STORAGE_KEYS } from '../localStorage';

interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  validations: {
    entityName: string;
    localCount: number;
    supabaseCount: number;
    status: 'success' | 'error' | 'warning';
    details?: string;
  }[];
  foreignKeyValidations: {
    relationship: string;
    status: 'success' | 'error';
    brokenReferences: number;
    details?: string;
  }[];
  dataIntegrityChecks: {
    check: string;
    status: 'success' | 'error' | 'warning';
    details?: string;
  }[];
  summary: {
    totalLocalRecords: number;
    totalSupabaseRecords: number;
    matchingCounts: boolean;
    integrityScore: number; // 0-100%
  };
}

/**
 * Obtém contagem de registros no localStorage
 */
function getLocalStorageCount(key: string): number {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data).length : 0;
  } catch (error) {
    console.error(`Erro ao contar registros localStorage ${key}:`, error);
    return 0;
  }
}

/**
 * Obtém contagem de registros no Supabase
 */
async function getSupabaseCount(tableName: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error(`Erro ao contar registros Supabase ${tableName}:`, error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error(`Erro ao contar registros Supabase ${tableName}:`, error);
    return 0;
  }
}

/**
 * Validação de contagem de registros entre localStorage e Supabase
 */
async function validateRecordCounts(): Promise<ValidationResult['validations']> {
  const validations: ValidationResult['validations'] = [];

  const entities = [
    { name: 'clientes', storageKey: STORAGE_KEYS.CLIENTES, tableName: 'clientes' },
    { name: 'setores', storageKey: STORAGE_KEYS.SETORES, tableName: 'setores' },
    { name: 'funcoes', storageKey: STORAGE_KEYS.FUNCOES, tableName: 'funcoes' },
    { name: 'funcionarios', storageKey: STORAGE_KEYS.FUNCIONARIOS, tableName: 'funcionarios' },
    { name: 'obras', storageKey: STORAGE_KEYS.OBRAS, tableName: 'obras' },
    { name: 'despesas', storageKey: STORAGE_KEYS.DESPESAS, tableName: 'despesas' },
    { name: 'videos', storageKey: STORAGE_KEYS.VIDEOS, tableName: 'videos' },
    { name: 'requisicoes', storageKey: STORAGE_KEYS.REQUISICOES, tableName: 'requisicoes' },
  ];

  for (const entity of entities) {
    console.log(`🔍 Validando contagem: ${entity.name}...`);

    const localCount = getLocalStorageCount(entity.storageKey);
    const supabaseCount = await getSupabaseCount(entity.tableName);

    let status: 'success' | 'error' | 'warning' = 'success';
    let details: string | undefined;

    if (localCount !== supabaseCount) {
      if (localCount > supabaseCount) {
        status = 'error';
        details = `Registros perdidos na migração. Local: ${localCount}, Supabase: ${supabaseCount}`;
      } else {
        status = 'warning';
        details = `Mais registros no Supabase que no localStorage. Local: ${localCount}, Supabase: ${supabaseCount}`;
      }
    }

    validations.push({
      entityName: entity.name,
      localCount,
      supabaseCount,
      status,
      details
    });
  }

  return validations;
}

/**
 * Validação de integridade referencial (Foreign Keys)
 */
async function validateForeignKeyIntegrity(): Promise<ValidationResult['foreignKeyValidations']> {
  const validations: ValidationResult['foreignKeyValidations'] = [];

  console.log('🔗 Validando integridade de chaves estrangeiras...');

  // Validar funcoes → setores
  try {
    const { data: brokenFuncoes, error } = await supabase
      .from('funcoes')
      .select('id, setor_id')
      .not('setor_id', 'is', null);

    if (error) throw error;

    let brokenReferences = 0;
    for (const funcao of brokenFuncoes || []) {
      const { data: setorExists } = await supabase
        .from('setores')
        .select('id')
        .eq('id', funcao.setor_id)
        .single();

      if (!setorExists) brokenReferences++;
    }

    validations.push({
      relationship: 'funcoes → setores',
      status: brokenReferences === 0 ? 'success' : 'error',
      brokenReferences,
      details: brokenReferences > 0 ? `${brokenReferences} funções com setor_id inválido` : undefined
    });
  } catch (error) {
    validations.push({
      relationship: 'funcoes → setores',
      status: 'error',
      brokenReferences: -1,
      details: `Erro na validação: ${error}`
    });
  }

  // Validar funcionarios → funcoes
  try {
    const { data: brokenFuncionarios, error } = await supabase
      .from('funcionarios')
      .select('id, funcao_id')
      .not('funcao_id', 'is', null);

    if (error) throw error;

    let brokenReferences = 0;
    for (const funcionario of brokenFuncionarios || []) {
      const { data: funcaoExists } = await supabase
        .from('funcoes')
        .select('id')
        .eq('id', funcionario.funcao_id)
        .single();

      if (!funcaoExists) brokenReferences++;
    }

    validations.push({
      relationship: 'funcionarios → funcoes',
      status: brokenReferences === 0 ? 'success' : 'error',
      brokenReferences,
      details: brokenReferences > 0 ? `${brokenReferences} funcionários com funcao_id inválido` : undefined
    });
  } catch (error) {
    validations.push({
      relationship: 'funcionarios → funcoes',
      status: 'error',
      brokenReferences: -1,
      details: `Erro na validação: ${error}`
    });
  }

  // Validar obras → clientes
  try {
    const { data: brokenObras, error } = await supabase
      .from('obras')
      .select('id, cliente_id')
      .not('cliente_id', 'is', null);

    if (error) throw error;

    let brokenReferences = 0;
    for (const obra of brokenObras || []) {
      const { data: clienteExists } = await supabase
        .from('clientes')
        .select('id')
        .eq('id', obra.cliente_id)
        .single();

      if (!clienteExists) brokenReferences++;
    }

    validations.push({
      relationship: 'obras → clientes',
      status: brokenReferences === 0 ? 'success' : 'error',
      brokenReferences,
      details: brokenReferences > 0 ? `${brokenReferences} obras com cliente_id inválido` : undefined
    });
  } catch (error) {
    validations.push({
      relationship: 'obras → clientes',
      status: 'error',
      brokenReferences: -1,
      details: `Erro na validação: ${error}`
    });
  }

  // Validar despesas → obras + clientes
  try {
    const { data: brokenDespesas, error } = await supabase
      .from('despesas')
      .select('id, obra_id, cliente_id');

    if (error) throw error;

    let brokenReferences = 0;
    for (const despesa of brokenDespesas || []) {
      if (despesa.obra_id) {
        const { data: obraExists } = await supabase
          .from('obras')
          .select('id')
          .eq('id', despesa.obra_id)
          .single();

        if (!obraExists) brokenReferences++;
      }

      if (despesa.cliente_id) {
        const { data: clienteExists } = await supabase
          .from('clientes')
          .select('id')
          .eq('id', despesa.cliente_id)
          .single();

        if (!clienteExists) brokenReferences++;
      }
    }

    validations.push({
      relationship: 'despesas → obras/clientes',
      status: brokenReferences === 0 ? 'success' : 'error',
      brokenReferences,
      details: brokenReferences > 0 ? `${brokenReferences} despesas com referências inválidas` : undefined
    });
  } catch (error) {
    validations.push({
      relationship: 'despesas → obras/clientes',
      status: 'error',
      brokenReferences: -1,
      details: `Erro na validação: ${error}`
    });
  }

  // Validar videos → obras
  try {
    const { data: brokenVideos, error } = await supabase
      .from('videos')
      .select('id, obra_id')
      .not('obra_id', 'is', null);

    if (error) throw error;

    let brokenReferences = 0;
    for (const video of brokenVideos || []) {
      const { data: obraExists } = await supabase
        .from('obras')
        .select('id')
        .eq('id', video.obra_id)
        .single();

      if (!obraExists) brokenReferences++;
    }

    validations.push({
      relationship: 'videos → obras',
      status: brokenReferences === 0 ? 'success' : 'error',
      brokenReferences,
      details: brokenReferences > 0 ? `${brokenReferences} vídeos com obra_id inválido` : undefined
    });
  } catch (error) {
    validations.push({
      relationship: 'videos → obras',
      status: 'error',
      brokenReferences: -1,
      details: `Erro na validação: ${error}`
    });
  }

  // Validar requisicoes → obras + funcionarios
  try {
    const { data: brokenRequisicoes, error } = await supabase
      .from('requisicoes')
      .select('id, obra_id, funcionario_id');

    if (error) throw error;

    let brokenReferences = 0;
    for (const requisicao of brokenRequisicoes || []) {
      if (requisicao.obra_id) {
        const { data: obraExists } = await supabase
          .from('obras')
          .select('id')
          .eq('id', requisicao.obra_id)
          .single();

        if (!obraExists) brokenReferences++;
      }

      if (requisicao.funcionario_id) {
        const { data: funcionarioExists } = await supabase
          .from('funcionarios')
          .select('id')
          .eq('id', requisicao.funcionario_id)
          .single();

        if (!funcionarioExists) brokenReferences++;
      }
    }

    validations.push({
      relationship: 'requisicoes → obras/funcionarios',
      status: brokenReferences === 0 ? 'success' : 'error',
      brokenReferences,
      details: brokenReferences > 0 ? `${brokenReferences} requisições com referências inválidas` : undefined
    });
  } catch (error) {
    validations.push({
      relationship: 'requisicoes → obras/funcionarios',
      status: 'error',
      brokenReferences: -1,
      details: `Erro na validação: ${error}`
    });
  }

  return validations;
}

/**
 * Verificações de integridade de dados (estrutura, formatos, etc.)
 */
async function performDataIntegrityChecks(): Promise<ValidationResult['dataIntegrityChecks']> {
  const checks: ValidationResult['dataIntegrityChecks'] = [];

  console.log('📊 Executando verificações de integridade de dados...');

  // Verificar campos obrigatórios
  try {
    // Clientes sem nome
    const { data: clientesSemNome, error } = await supabase
      .from('clientes')
      .select('id')
      .or('nome.is.null,nome.eq.');

    if (error) throw error;

    checks.push({
      check: 'Clientes com nome obrigatório',
      status: (clientesSemNome?.length || 0) === 0 ? 'success' : 'error',
      details: (clientesSemNome?.length || 0) > 0 ? `${clientesSemNome?.length} clientes sem nome` : undefined
    });
  } catch (error) {
    checks.push({
      check: 'Clientes com nome obrigatório',
      status: 'error',
      details: `Erro na verificação: ${error}`
    });
  }

  // Verificar datas válidas em despesas
  try {
    const { data: despesasDataInvalida, error } = await supabase
      .from('despesas')
      .select('id, data_despesa')
      .not('data_despesa', 'is', null);

    if (error) throw error;

    let datasInvalidas = 0;
    for (const despesa of despesasDataInvalida || []) {
      const data = new Date(despesa.data_despesa);
      if (isNaN(data.getTime()) || data.getFullYear() < 2000 || data.getFullYear() > 2030) {
        datasInvalidas++;
      }
    }

    checks.push({
      check: 'Datas válidas em despesas',
      status: datasInvalidas === 0 ? 'success' : 'warning',
      details: datasInvalidas > 0 ? `${datasInvalidas} despesas com datas inválidas` : undefined
    });
  } catch (error) {
    checks.push({
      check: 'Datas válidas em despesas',
      status: 'error',
      details: `Erro na verificação: ${error}`
    });
  }

  // Verificar valores numéricos em despesas
  try {
    const { data: despesasValorInvalido, error } = await supabase
      .from('despesas')
      .select('id, valor')
      .or('valor.is.null,valor.lt.0');

    if (error) throw error;

    checks.push({
      check: 'Valores válidos em despesas',
      status: (despesasValorInvalido?.length || 0) === 0 ? 'success' : 'warning',
      details: (despesasValorInvalido?.length || 0) > 0 ? `${despesasValorInvalido?.length} despesas com valores inválidos` : undefined
    });
  } catch (error) {
    checks.push({
      check: 'Valores válidos em despesas',
      status: 'error',
      details: `Erro na verificação: ${error}`
    });
  }

  return checks;
}

/**
 * Executa validação completa de integridade da migração
 */
export async function validateMigrationIntegrity(): Promise<ValidationResult> {
  console.log('🔍 Iniciando validação de integridade da migração...');

  const result: ValidationResult = {
    success: true,
    errors: [],
    warnings: [],
    validations: [],
    foreignKeyValidations: [],
    dataIntegrityChecks: [],
    summary: {
      totalLocalRecords: 0,
      totalSupabaseRecords: 0,
      matchingCounts: true,
      integrityScore: 100
    }
  };

  try {
    // 1. Validar contagens de registros
    result.validations = await validateRecordCounts();

    // 2. Validar integridade referencial
    result.foreignKeyValidations = await validateForeignKeyIntegrity();

    // 3. Verificações de integridade de dados
    result.dataIntegrityChecks = await performDataIntegrityChecks();

    // 4. Calcular resumo
    result.summary.totalLocalRecords = result.validations.reduce((sum, v) => sum + v.localCount, 0);
    result.summary.totalSupabaseRecords = result.validations.reduce((sum, v) => sum + v.supabaseCount, 0);
    result.summary.matchingCounts = result.validations.every(v => v.localCount === v.supabaseCount);

    // 5. Coletar erros e warnings
    result.validations.forEach(v => {
      if (v.status === 'error') result.errors.push(v.details || `Erro em ${v.entityName}`);
      if (v.status === 'warning') result.warnings.push(v.details || `Warning em ${v.entityName}`);
    });

    result.foreignKeyValidations.forEach(fk => {
      if (fk.status === 'error') result.errors.push(fk.details || `Erro FK: ${fk.relationship}`);
    });

    result.dataIntegrityChecks.forEach(check => {
      if (check.status === 'error') result.errors.push(check.details || `Erro: ${check.check}`);
      if (check.status === 'warning') result.warnings.push(check.details || `Warning: ${check.check}`);
    });

    // 6. Calcular score de integridade
    const totalChecks = result.validations.length + result.foreignKeyValidations.length + result.dataIntegrityChecks.length;
    const successfulChecks = result.validations.filter(v => v.status === 'success').length +
                           result.foreignKeyValidations.filter(fk => fk.status === 'success').length +
                           result.dataIntegrityChecks.filter(c => c.status === 'success').length;

    result.summary.integrityScore = totalChecks > 0 ? Math.round((successfulChecks / totalChecks) * 100) : 0;

    // 7. Determinar sucesso geral
    result.success = result.errors.length === 0;

    console.log('✅ Validação de integridade concluída:', {
      success: result.success,
      errors: result.errors.length,
      warnings: result.warnings.length,
      integrityScore: `${result.summary.integrityScore}%`
    });

  } catch (error) {
    console.error('❌ Erro durante validação de integridade:', error);
    result.success = false;
    result.errors.push(`Erro crítico na validação: ${error}`);
    result.summary.integrityScore = 0;
  }

  return result;
}

export type { ValidationResult };