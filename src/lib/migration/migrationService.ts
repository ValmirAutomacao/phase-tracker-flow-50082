import { createClient } from '@supabase/supabase-js';
import { getFromStorage, STORAGE_KEYS } from '../localStorage';
import { backupService, type LocalStorageBackup } from './backupService';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface MigrationProgress {
  entity: string;
  total: number;
  migrated: number;
  errors: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface MigrationResult {
  success: boolean;
  totalRecords: number;
  migratedRecords: number;
  errors: string[];
  progress: MigrationProgress[];
  backup?: LocalStorageBackup;
}

/**
 * Serviço de migração completa localStorage → Supabase
 * Segue ordem de dependências para manter integridade referencial
 */
export class MigrationService {
  private supabase = createClient(supabaseUrl, supabaseAnonKey);
  private migrationOrder = [
    'clientes',    // independente
    'setores',     // independente
    'funcoes',     // depends setores
    'funcionarios', // depends funcoes
    'obras',       // depends clientes
    'despesas',    // depends clientes, obras
    'videos',      // depends obras
    'requisicoes'  // depends obras, funcionarios
  ] as const;

  /**
   * Mapeia dados localStorage para formato Supabase
   */
  private mapClienteToSupabase(cliente: unknown) {
    return {
      id: cliente.id,
      nome: cliente.nome,
      tipo: cliente.tipo || 'fisico',
      documento: cliente.cpf || cliente.cnpj || cliente.documento,
      endereco: {
        rua: cliente.endereco?.rua || cliente.rua,
        numero: cliente.endereco?.numero || cliente.numero,
        bairro: cliente.endereco?.bairro || cliente.bairro,
        cidade: cliente.endereco?.cidade || cliente.cidade,
        cep: cliente.endereco?.cep || cliente.cep,
        estado: cliente.endereco?.estado || cliente.estado
      },
      contato: {
        telefone: cliente.telefone,
        email: cliente.email,
        contato_principal: cliente.contato_principal || cliente.telefone
      }
    };
  }

  private mapSetorToSupabase(setor: unknown) {
    return {
      id: setor.id,
      nome: setor.nome,
      descricao: setor.descricao
    };
  }

  private mapFuncaoToSupabase(funcao: any, setorIdMap: Map<string, string>) {
    return {
      id: funcao.id,
      setor_id: setorIdMap.get(funcao.setorId) || null,
      nome: funcao.nome,
      descricao: funcao.descricao
    };
  }

  private mapFuncionarioToSupabase(funcionario: any, funcaoIdMap: Map<string, string>) {
    return {
      id: funcionario.id,
      funcao_id: funcaoIdMap.get(funcionario.funcaoId) || funcaoIdMap.get(funcionario.funcao_id) || null,
      nome: funcionario.nome,
      email: funcionario.email,
      telefone: funcionario.telefone,
      ativo: funcionario.ativo !== false
    };
  }

  private mapObraToSupabase(obra: any, clienteIdMap: Map<string, string>) {
    return {
      id: obra.id,
      cliente_id: clienteIdMap.get(obra.clienteId) || clienteIdMap.get(obra.cliente_id) || null,
      nome: obra.nome,
      etapas: obra.etapas || null,
      progresso: parseInt(obra.progresso) || 0,
      orcamento: parseFloat(obra.orcamento) || null,
      status: obra.status || 'planejamento',
      data_inicio: obra.dataInicio || obra.data_inicio || null,
      data_fim: obra.dataFim || obra.data_fim || null,
      descricao: obra.descricao
    };
  }

  private mapDespesaToSupabase(despesa: any, clienteIdMap: Map<string, string>, obraIdMap: Map<string, string>) {
    return {
      id: despesa.id,
      cliente_id: clienteIdMap.get(despesa.clienteId) || clienteIdMap.get(despesa.cliente_id) || null,
      obra_id: obraIdMap.get(despesa.obraId) || obraIdMap.get(despesa.obra_id) || null,
      valor: parseFloat(despesa.valor) || 0,
      descricao: despesa.descricao,
      data_despesa: despesa.dataDespesa || despesa.data_despesa || new Date().toISOString().split('T')[0],
      categoria: despesa.categoria,
      status: despesa.status || 'pendente',
      comprovante_url: despesa.comprovanteUrl || despesa.comprovante_url,
      fornecedor_cnpj: despesa.fornecedorCnpj || despesa.fornecedor_cnpj,
      numero_documento: despesa.numeroDocumento || despesa.numero_documento
    };
  }

  private mapVideoToSupabase(video: any, obraIdMap: Map<string, string>) {
    return {
      id: video.id,
      obra_id: obraIdMap.get(video.obraId) || obraIdMap.get(video.obra_id) || null,
      nome: video.nome,
      status_renderizacao: video.statusRenderizacao || video.status_renderizacao || 'pendente',
      arquivo_original_url: video.arquivoOriginalUrl || video.arquivo_original_url,
      arquivo_renderizado_url: video.arquivoRenderizadoUrl || video.arquivo_renderizado_url,
      duracao_segundos: parseInt(video.duracaoSegundos) || video.duracao_segundos || null,
      drive_pasta_id: video.drivePastaId || video.drive_pasta_id,
      drive_subpasta_id: video.driveSubpastaId || video.drive_subpasta_id,
      n8n_job_id: video.n8nJobId || video.n8n_job_id
    };
  }

  private mapRequisicaoToSupabase(requisicao: any, obraIdMap: Map<string, string>, funcionarioIdMap: Map<string, string>) {
    return {
      id: requisicao.id,
      obra_id: obraIdMap.get(requisicao.obraId) || obraIdMap.get(requisicao.obra_id) || null,
      funcionario_solicitante_id: funcionarioIdMap.get(requisicao.funcionarioSolicitanteId) || funcionarioIdMap.get(requisicao.funcionario_solicitante_id) || null,
      titulo: requisicao.titulo,
      descricao: requisicao.descricao,
      status: requisicao.status || 'pendente',
      prioridade: requisicao.prioridade || 'media',
      data_vencimento: requisicao.dataVencimento || requisicao.data_vencimento || null,
      funcionario_responsavel_id: funcionarioIdMap.get(requisicao.funcionarioResponsavelId) || funcionarioIdMap.get(requisicao.funcionario_responsavel_id) || null,
      observacoes: requisicao.observacoes,
      anexos: requisicao.anexos || null
    };
  }

  /**
   * Migra uma entidade específica para Supabase
   */
  private async migrateEntity(
    entityName: string,
    tableName: string,
    localData: any[],
    mapper: (item: any, ...args: any[]) => any,
    ...mapperArgs: any[]
  ): Promise<MigrationProgress> {
    const progress: MigrationProgress = {
      entity: entityName,
      total: localData.length,
      migrated: 0,
      errors: [],
      status: 'in_progress'
    };

    if (localData.length === 0) {
      progress.status = 'completed';
      return progress;
    }

    try {
      console.log(`🔄 Migrando ${entityName}: ${localData.length} registros`);

      // Mapear dados para formato Supabase
      const mappedData = localData.map(item => mapper(item, ...mapperArgs));

      // Inserir em lotes para performance
      const batchSize = 100;
      for (let i = 0; i < mappedData.length; i += batchSize) {
        const batch = mappedData.slice(i, i + batchSize);

        const { error } = await this.supabase
          .from(tableName)
          .upsert(batch, { onConflict: 'id' });

        if (error) {
          const errorMsg = `Erro no lote ${Math.floor(i/batchSize) + 1}: ${error.message}`;
          progress.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        } else {
          progress.migrated += batch.length;
        }
      }

      progress.status = progress.errors.length === 0 ? 'completed' : 'failed';
      console.log(`✅ ${entityName}: ${progress.migrated}/${progress.total} migrados`);

    } catch (error) {
      progress.status = 'failed';
      progress.errors.push(`Erro geral: ${error.message}`);
      console.error(`❌ Erro ao migrar ${entityName}:`, error);
    }

    return progress;
  }

  /**
   * Executa migração completa com backup automático
   */
  async executeMigration(): Promise<MigrationResult> {
    console.log('🚀 Iniciando migração completa localStorage → Supabase');

    const result: MigrationResult = {
      success: false,
      totalRecords: 0,
      migratedRecords: 0,
      errors: [],
      progress: []
    };

    try {
      // 1. Criar backup obrigatório
      console.log('📦 Criando backup do localStorage...');
      result.backup = backupService.createFullBackup();

      // 2. Mapas para rastreamento de IDs migrados
      const idMaps = {
        clientes: new Map<string, string>(),
        setores: new Map<string, string>(),
        funcoes: new Map<string, string>(),
        funcionarios: new Map<string, string>(),
        obras: new Map<string, string>()
      };

      // 3. Migração sequencial respeitando dependências
      for (const entity of this.migrationOrder) {
        const storageKey = STORAGE_KEYS[entity.toUpperCase() as keyof typeof STORAGE_KEYS];
        const localData = getFromStorage(storageKey);
        result.totalRecords += localData.length;

        let progress: MigrationProgress;

        switch (entity) {
          case 'clientes':
            progress = await this.migrateEntity(
              'clientes', 'clientes', localData, this.mapClienteToSupabase.bind(this)
            );
            localData.forEach(item => idMaps.clientes.set(item.id, item.id));
            break;

          case 'setores':
            progress = await this.migrateEntity(
              'setores', 'setores', localData, this.mapSetorToSupabase.bind(this)
            );
            localData.forEach(item => idMaps.setores.set(item.id, item.id));
            break;

          case 'funcoes':
            progress = await this.migrateEntity(
              'funcoes', 'funcoes', localData, this.mapFuncaoToSupabase.bind(this), idMaps.setores
            );
            localData.forEach(item => idMaps.funcoes.set(item.id, item.id));
            break;

          case 'funcionarios':
            progress = await this.migrateEntity(
              'funcionarios', 'funcionarios', localData, this.mapFuncionarioToSupabase.bind(this), idMaps.funcoes
            );
            localData.forEach(item => idMaps.funcionarios.set(item.id, item.id));
            break;

          case 'obras':
            progress = await this.migrateEntity(
              'obras', 'obras', localData, this.mapObraToSupabase.bind(this), idMaps.clientes
            );
            localData.forEach(item => idMaps.obras.set(item.id, item.id));
            break;

          case 'despesas':
            progress = await this.migrateEntity(
              'despesas', 'despesas', localData, this.mapDespesaToSupabase.bind(this), idMaps.clientes, idMaps.obras
            );
            break;

          case 'videos':
            progress = await this.migrateEntity(
              'videos', 'videos', localData, this.mapVideoToSupabase.bind(this), idMaps.obras
            );
            break;

          case 'requisicoes':
            progress = await this.migrateEntity(
              'requisicoes', 'requisicoes', localData, this.mapRequisicaoToSupabase.bind(this), idMaps.obras, idMaps.funcionarios
            );
            break;

          default:
            progress = {
              entity,
              total: 0,
              migrated: 0,
              errors: [`Entidade ${entity} não implementada`],
              status: 'failed'
            };
        }

        result.progress.push(progress);
        result.migratedRecords += progress.migrated;
        result.errors.push(...progress.errors);
      }

      // 4. Determinar sucesso da migração
      const allCompleted = result.progress.every(p => p.status === 'completed');
      const noErrors = result.errors.length === 0;
      result.success = allCompleted && noErrors;

      if (result.success) {
        console.log('🎉 Migração concluída com sucesso!');
        console.log(`📊 Total: ${result.migratedRecords}/${result.totalRecords} registros migrados`);
      } else {
        console.log('⚠️ Migração concluída com erros');
        console.log(`📊 Migrados: ${result.migratedRecords}/${result.totalRecords}`);
        console.log(`❌ Erros: ${result.errors.length}`);
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Erro geral na migração: ${error.message}`);
      console.error('❌ Erro crítico na migração:', error);
    }

    return result;
  }

  /**
   * Executa rollback usando backup
   */
  async rollbackMigration(backup: LocalStorageBackup): Promise<boolean> {
    try {
      console.log('🔄 Executando rollback da migração...');

      // Limpar dados das tabelas Supabase
      for (const entity of [...this.migrationOrder].reverse()) {
        const tableName = entity;
        await this.supabase.from(tableName).delete().neq('id', '');
      }

      // Restaurar localStorage
      const restored = backupService.restoreFromBackup(backup);

      if (restored) {
        console.log('✅ Rollback executado com sucesso');
        return true;
      } else {
        console.error('❌ Falha ao restaurar backup');
        return false;
      }

    } catch (error) {
      console.error('❌ Erro no rollback:', error);
      return false;
    }
  }
}

// Instância singleton
export const migrationService = new MigrationService();