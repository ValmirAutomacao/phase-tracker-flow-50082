/**
 * Script de Migração Sequencial localStorage → Supabase
 * Story: 1.11 - Migrar dados localStorage
 * Author: James (Dev Agent)
 *
 * Migra dados do localStorage para Supabase respeitando dependências FK
 */

import { supabase } from '../supabaseClient';
import { STORAGE_KEYS } from '../localStorage';
import { Database } from '../types/database';
import { createBackup, BackupData } from './backup';

// Tipos das entidades para migração
type ClienteLocal = {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  documento?: string;
  tipo?: string;
  endereco?: unknown;
  contato?: unknown;
};

type SetorLocal = {
  id: string;
  nome: string;
  descricao?: string;
};

type FuncaoLocal = {
  id: string;
  nome: string;
  descricao?: string;
  setor_id?: string;
};

type FuncionarioLocal = {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  funcao_id?: string;
  salario?: number;
  data_admissao?: string;
};

type ObraLocal = {
  id: string;
  nome: string;
  descricao?: string;
  cliente_id: string;
  status?: string;
  data_inicio?: string;
  data_fim?: string;
  valor_total?: number;
  progresso?: number;
  etapas?: unknown;
};

type DespesaLocal = {
  id: string;
  valor: number;
  data_despesa: string;
  descricao?: string;
  categoria?: string;
  cliente_id?: string;
  obra_id?: string;
  numero_documento?: string;
  fornecedor_cnpj?: string;
  comprovante_url?: string;
  status?: string;
};

type VideoLocal = {
  id: string;
  nome: string;
  obra_id: string;
  url?: string;
  status?: string;
  created_at?: string;
};

type RequisicaoLocal = {
  id: string;
  titulo: string;
  descricao?: string;
  obra_id?: string;
  funcionario_id?: string;
  status?: string;
  prioridade?: string;
  data_criacao?: string;
  data_prazo?: string;
};

interface MigrationProgress {
  entity: string;
  localCount: number;
  migratedCount: number;
  errors: string[];
  startTime: Date;
  endTime?: Date;
}

interface MigrationResult {
  success: boolean;
  totalRecords: number;
  migratedRecords: number;
  errors: string[];
  progress: MigrationProgress[];
  backup?: BackupData;
  duration: number;
}

/**
 * Obtém dados de uma entidade do localStorage
 */
function getLocalData<T>(key: string): T[] {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : [];
  } catch (error) {
    console.error(`Erro ao ler ${key} do localStorage:`, error);
    return [];
  }
}

/**
 * Migra clientes (sem dependências)
 */
async function migrateClientes(): Promise<MigrationProgress> {
  const progress: MigrationProgress = {
    entity: 'clientes',
    localCount: 0,
    migratedCount: 0,
    errors: [],
    startTime: new Date()
  };

  try {
    console.log('🔄 Migrando clientes...');

    const localClientes = getLocalData<ClienteLocal>(STORAGE_KEYS.CLIENTES);
    progress.localCount = localClientes.length;

    if (localClientes.length === 0) {
      console.log('⚪ Nenhum cliente para migrar');
      progress.endTime = new Date();
      return progress;
    }

    // Preparar dados para inserção
    const clientesForInsert = localClientes.map(cliente => ({
      id: cliente.id,
      nome: cliente.nome,
      documento: cliente.documento || null,
      tipo: cliente.tipo || null,
      endereco: cliente.endereco || null,
      contato: {
        email: cliente.email,
        telefone: cliente.telefone,
        ...(cliente.contato || {})
      }
    }));

    // Inserir no Supabase
    const { data, error } = await supabase
      .from('clientes')
      .insert(clientesForInsert);

    if (error) {
      progress.errors.push(`Erro ao inserir clientes: ${error.message}`);
      console.error('❌ Erro ao migrar clientes:', error);
    } else {
      progress.migratedCount = localClientes.length;
      console.log(`✅ Migrados ${localClientes.length} clientes`);
    }

  } catch (error) {
    progress.errors.push(`Erro na migração de clientes: ${error}`);
    console.error('❌ Erro na migração de clientes:', error);
  }

  progress.endTime = new Date();
  return progress;
}

/**
 * Migra setores (sem dependências)
 */
async function migrateSetores(): Promise<MigrationProgress> {
  const progress: MigrationProgress = {
    entity: 'setores',
    localCount: 0,
    migratedCount: 0,
    errors: [],
    startTime: new Date()
  };

  try {
    console.log('🔄 Migrando setores...');

    const localSetores = getLocalData<SetorLocal>(STORAGE_KEYS.SETORES);
    progress.localCount = localSetores.length;

    if (localSetores.length === 0) {
      console.log('⚪ Nenhum setor para migrar');
      progress.endTime = new Date();
      return progress;
    }

    // Preparar dados para inserção
    const setoresForInsert = localSetores.map(setor => ({
      id: setor.id,
      nome: setor.nome,
      descricao: setor.descricao || null
    }));

    // Inserir no Supabase
    const { data, error } = await supabase
      .from('setores')
      .insert(setoresForInsert);

    if (error) {
      progress.errors.push(`Erro ao inserir setores: ${error.message}`);
      console.error('❌ Erro ao migrar setores:', error);
    } else {
      progress.migratedCount = localSetores.length;
      console.log(`✅ Migrados ${localSetores.length} setores`);
    }

  } catch (error) {
    progress.errors.push(`Erro na migração de setores: ${error}`);
    console.error('❌ Erro na migração de setores:', error);
  }

  progress.endTime = new Date();
  return progress;
}

/**
 * Migra funções (depende de setores)
 */
async function migrateFuncoes(): Promise<MigrationProgress> {
  const progress: MigrationProgress = {
    entity: 'funcoes',
    localCount: 0,
    migratedCount: 0,
    errors: [],
    startTime: new Date()
  };

  try {
    console.log('🔄 Migrando funções...');

    const localFuncoes = getLocalData<FuncaoLocal>(STORAGE_KEYS.FUNCOES);
    progress.localCount = localFuncoes.length;

    if (localFuncoes.length === 0) {
      console.log('⚪ Nenhuma função para migrar');
      progress.endTime = new Date();
      return progress;
    }

    // Preparar dados para inserção
    const funcoesForInsert = localFuncoes.map(funcao => ({
      id: funcao.id,
      nome: funcao.nome,
      descricao: funcao.descricao || null,
      setor_id: funcao.setor_id || null
    }));

    // Inserir no Supabase
    const { data, error } = await supabase
      .from('funcoes')
      .insert(funcoesForInsert);

    if (error) {
      progress.errors.push(`Erro ao inserir funções: ${error.message}`);
      console.error('❌ Erro ao migrar funções:', error);
    } else {
      progress.migratedCount = localFuncoes.length;
      console.log(`✅ Migrados ${localFuncoes.length} funções`);
    }

  } catch (error) {
    progress.errors.push(`Erro na migração de funções: ${error}`);
    console.error('❌ Erro na migração de funções:', error);
  }

  progress.endTime = new Date();
  return progress;
}

/**
 * Migra funcionários (depende de funções)
 */
async function migrateFuncionarios(): Promise<MigrationProgress> {
  const progress: MigrationProgress = {
    entity: 'funcionarios',
    localCount: 0,
    migratedCount: 0,
    errors: [],
    startTime: new Date()
  };

  try {
    console.log('🔄 Migrando funcionários...');

    const localFuncionarios = getLocalData<FuncionarioLocal>(STORAGE_KEYS.FUNCIONARIOS);
    progress.localCount = localFuncionarios.length;

    if (localFuncionarios.length === 0) {
      console.log('⚪ Nenhum funcionário para migrar');
      progress.endTime = new Date();
      return progress;
    }

    // Preparar dados para inserção
    const funcionariosForInsert = localFuncionarios.map(funcionario => ({
      id: funcionario.id,
      nome: funcionario.nome,
      email: funcionario.email || null,
      telefone: funcionario.telefone || null,
      funcao_id: funcionario.funcao_id || null,
      salario: funcionario.salario || null,
      data_admissao: funcionario.data_admissao || null
    }));

    // Inserir no Supabase
    const { data, error } = await supabase
      .from('funcionarios')
      .insert(funcionariosForInsert);

    if (error) {
      progress.errors.push(`Erro ao inserir funcionários: ${error.message}`);
      console.error('❌ Erro ao migrar funcionários:', error);
    } else {
      progress.migratedCount = localFuncionarios.length;
      console.log(`✅ Migrados ${localFuncionarios.length} funcionários`);
    }

  } catch (error) {
    progress.errors.push(`Erro na migração de funcionários: ${error}`);
    console.error('❌ Erro na migração de funcionários:', error);
  }

  progress.endTime = new Date();
  return progress;
}

/**
 * Migra obras (depende de clientes)
 */
async function migrateObras(): Promise<MigrationProgress> {
  const progress: MigrationProgress = {
    entity: 'obras',
    localCount: 0,
    migratedCount: 0,
    errors: [],
    startTime: new Date()
  };

  try {
    console.log('🔄 Migrando obras...');

    const localObras = getLocalData<ObraLocal>(STORAGE_KEYS.OBRAS);
    progress.localCount = localObras.length;

    if (localObras.length === 0) {
      console.log('⚪ Nenhuma obra para migrar');
      progress.endTime = new Date();
      return progress;
    }

    // Preparar dados para inserção
    const obrasForInsert = localObras.map(obra => ({
      id: obra.id,
      nome: obra.nome,
      descricao: obra.descricao || null,
      cliente_id: obra.cliente_id,
      status: obra.status || null,
      data_inicio: obra.data_inicio || null,
      data_fim: obra.data_fim || null,
      valor_total: obra.valor_total || null,
      progresso: obra.progresso || null,
      etapas: obra.etapas || null
    }));

    // Inserir no Supabase
    const { data, error } = await supabase
      .from('obras')
      .insert(obrasForInsert);

    if (error) {
      progress.errors.push(`Erro ao inserir obras: ${error.message}`);
      console.error('❌ Erro ao migrar obras:', error);
    } else {
      progress.migratedCount = localObras.length;
      console.log(`✅ Migrados ${localObras.length} obras`);
    }

  } catch (error) {
    progress.errors.push(`Erro na migração de obras: ${error}`);
    console.error('❌ Erro na migração de obras:', error);
  }

  progress.endTime = new Date();
  return progress;
}

/**
 * Migra despesas (depende de clientes e obras)
 */
async function migrateDespesas(): Promise<MigrationProgress> {
  const progress: MigrationProgress = {
    entity: 'despesas',
    localCount: 0,
    migratedCount: 0,
    errors: [],
    startTime: new Date()
  };

  try {
    console.log('🔄 Migrando despesas...');

    const localDespesas = getLocalData<DespesaLocal>(STORAGE_KEYS.DESPESAS);
    progress.localCount = localDespesas.length;

    if (localDespesas.length === 0) {
      console.log('⚪ Nenhuma despesa para migrar');
      progress.endTime = new Date();
      return progress;
    }

    // Preparar dados para inserção
    const despesasForInsert = localDespesas.map(despesa => ({
      id: despesa.id,
      valor: despesa.valor,
      data_despesa: despesa.data_despesa,
      descricao: despesa.descricao || null,
      categoria: despesa.categoria || null,
      cliente_id: despesa.cliente_id || null,
      obra_id: despesa.obra_id || null,
      numero_documento: despesa.numero_documento || null,
      fornecedor_cnpj: despesa.fornecedor_cnpj || null,
      comprovante_url: despesa.comprovante_url || null,
      status: despesa.status || null
    }));

    // Inserir no Supabase
    const { data, error } = await supabase
      .from('despesas')
      .insert(despesasForInsert);

    if (error) {
      progress.errors.push(`Erro ao inserir despesas: ${error.message}`);
      console.error('❌ Erro ao migrar despesas:', error);
    } else {
      progress.migratedCount = localDespesas.length;
      console.log(`✅ Migrados ${localDespesas.length} despesas`);
    }

  } catch (error) {
    progress.errors.push(`Erro na migração de despesas: ${error}`);
    console.error('❌ Erro na migração de despesas:', error);
  }

  progress.endTime = new Date();
  return progress;
}

/**
 * Migra vídeos (depende de obras)
 */
async function migrateVideos(): Promise<MigrationProgress> {
  const progress: MigrationProgress = {
    entity: 'videos',
    localCount: 0,
    migratedCount: 0,
    errors: [],
    startTime: new Date()
  };

  try {
    console.log('🔄 Migrando vídeos...');

    const localVideos = getLocalData<VideoLocal>(STORAGE_KEYS.VIDEOS);
    progress.localCount = localVideos.length;

    if (localVideos.length === 0) {
      console.log('⚪ Nenhum vídeo para migrar');
      progress.endTime = new Date();
      return progress;
    }

    // Preparar dados para inserção
    const videosForInsert = localVideos.map(video => ({
      id: video.id,
      nome: video.nome,
      obra_id: video.obra_id,
      url: video.url || null,
      status: video.status || null
    }));

    // Inserir no Supabase
    const { data, error } = await supabase
      .from('videos')
      .insert(videosForInsert);

    if (error) {
      progress.errors.push(`Erro ao inserir vídeos: ${error.message}`);
      console.error('❌ Erro ao migrar vídeos:', error);
    } else {
      progress.migratedCount = localVideos.length;
      console.log(`✅ Migrados ${localVideos.length} vídeos`);
    }

  } catch (error) {
    progress.errors.push(`Erro na migração de vídeos: ${error}`);
    console.error('❌ Erro na migração de vídeos:', error);
  }

  progress.endTime = new Date();
  return progress;
}

/**
 * Migra requisições (depende de obras e funcionários)
 */
async function migrateRequisicoes(): Promise<MigrationProgress> {
  const progress: MigrationProgress = {
    entity: 'requisicoes',
    localCount: 0,
    migratedCount: 0,
    errors: [],
    startTime: new Date()
  };

  try {
    console.log('🔄 Migrando requisições...');

    const localRequisicoes = getLocalData<RequisicaoLocal>(STORAGE_KEYS.REQUISICOES);
    progress.localCount = localRequisicoes.length;

    if (localRequisicoes.length === 0) {
      console.log('⚪ Nenhuma requisição para migrar');
      progress.endTime = new Date();
      return progress;
    }

    // Preparar dados para inserção
    const requisicoesForInsert = localRequisicoes.map(requisicao => ({
      id: requisicao.id,
      titulo: requisicao.titulo,
      descricao: requisicao.descricao || null,
      obra_id: requisicao.obra_id || null,
      funcionario_id: requisicao.funcionario_id || null,
      status: requisicao.status || null,
      prioridade: requisicao.prioridade || null,
      data_criacao: requisicao.data_criacao || null,
      data_prazo: requisicao.data_prazo || null
    }));

    // Inserir no Supabase
    const { data, error } = await supabase
      .from('requisicoes')
      .insert(requisicoesForInsert);

    if (error) {
      progress.errors.push(`Erro ao inserir requisições: ${error.message}`);
      console.error('❌ Erro ao migrar requisições:', error);
    } else {
      progress.migratedCount = localRequisicoes.length;
      console.log(`✅ Migrados ${localRequisicoes.length} requisições`);
    }

  } catch (error) {
    progress.errors.push(`Erro na migração de requisições: ${error}`);
    console.error('❌ Erro na migração de requisições:', error);
  }

  progress.endTime = new Date();
  return progress;
}

/**
 * Executa migração completa seguindo ordem de dependências
 */
export async function executeMigration(): Promise<MigrationResult> {
  const startTime = Date.now();
  const result: MigrationResult = {
    success: false,
    totalRecords: 0,
    migratedRecords: 0,
    errors: [],
    progress: [],
    duration: 0
  };

  try {
    console.log('🚀 Iniciando migração localStorage → Supabase...');

    // Criar backup antes da migração
    console.log('📦 Criando backup de segurança...');
    result.backup = createBackup();

    // Migração em ordem de dependências
    const migrationSteps = [
      migrateClientes,     // 1. clientes (independente)
      migrateSetores,      // 2. setores (independente)
      migrateFuncoes,      // 3. funcoes (depends setores)
      migrateFuncionarios, // 4. funcionarios (depends funcoes)
      migrateObras,        // 5. obras (depends clientes)
      migrateDespesas,     // 6. despesas (depends clientes, obras)
      migrateVideos,       // 7. videos (depends obras)
      migrateRequisicoes   // 8. requisicoes (depends obras, funcionarios)
    ];

    // Executar migrações sequencialmente
    for (const migrationStep of migrationSteps) {
      const progress = await migrationStep();
      result.progress.push(progress);

      result.totalRecords += progress.localCount;
      result.migratedRecords += progress.migratedCount;
      result.errors.push(...progress.errors);

      // Se houver erros críticos, interromper migração
      if (progress.errors.length > 0 && progress.migratedCount === 0 && progress.localCount > 0) {
        console.error(`❌ Falha crítica na migração de ${progress.entity}`);
        result.success = false;
        break;
      }
    }

    // Determinar sucesso geral
    result.success = result.errors.length === 0 && result.migratedRecords === result.totalRecords;

    if (result.success) {
      console.log('✅ Migração concluída com sucesso!');
    } else {
      console.log(`⚠️ Migração concluída com problemas: ${result.errors.length} erros`);
    }

  } catch (error) {
    console.error('❌ Erro crítico na migração:', error);
    result.errors.push(`Erro crítico: ${error}`);
    result.success = false;
  }

  result.duration = Date.now() - startTime;
  return result;
}

export type { MigrationResult, MigrationProgress };