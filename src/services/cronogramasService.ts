// ============================================================
// SERVIÇOS CRUD - SISTEMA CRONOGRAMAS
// ============================================================
// Descrição: Serviços para operações CRUD do sistema de cronogramas
// Utiliza MCP Supabase para interações com banco de dados
// Data: 2024-12-03
// ============================================================

import {
  Cronograma,
  EAPItem,
  DependenciaAtividade,
  AlocacaoRecurso,
  BaselineCronograma,
  CalendarioTrabalho,
  RecursoEmpresa,
  TipoRecurso,
  CronogramaCreateRequest,
  CronogramaUpdateRequest,
  EAPItemCreateRequest,
  EAPItemUpdateRequest,
  DependenciaCreateRequest,
  AlocacaoCreateRequest,
  BaselineCreateRequest,
  CronogramaFilters,
  EAPItemFilters,
  ApiResponse,
  PaginatedResponse,
} from '@/types/cronogramas';

// ============================================================
// SERVIÇOS CRONOGRAMAS PRINCIPAIS
// ============================================================

export class CronogramasService {
  // Buscar cronogramas com filtros
  static async listar(filters?: CronogramaFilters): Promise<Cronograma[]> {
    try {
      let query = `
        SELECT
          c.*,
          ct.nome as calendario_nome,
          o.nome as obra_nome
        FROM cronogramas c
        LEFT JOIN calendarios_trabalho ct ON ct.id = c.calendario_id
        LEFT JOIN obras o ON o.id = c.obra_id
        WHERE 1=1
      `;

      const params: any[] = [];

      if (filters?.search) {
        query += ` AND (c.nome ILIKE $${params.length + 1} OR c.descricao ILIKE $${params.length + 1})`;
        params.push(`%${filters.search}%`);
      }

      if (filters?.status && filters.status.length > 0) {
        query += ` AND c.status = ANY($${params.length + 1})`;
        params.push(filters.status);
      }

      if (filters?.obra_id) {
        query += ` AND c.obra_id = $${params.length + 1}`;
        params.push(filters.obra_id);
      }

      query += ` ORDER BY c.data_criacao DESC`;

      // Aqui usaríamos o MCP Supabase para executar a query
      // Por enquanto, retornamos uma implementação mock
      console.log('Executando query:', query, 'com parâmetros:', params);

      // TODO: Implementar chamada real via MCP Supabase
      return [];
    } catch (error) {
      console.error('Erro ao listar cronogramas:', error);
      throw new Error('Falha ao buscar cronogramas');
    }
  }

  // Buscar cronograma por ID
  static async buscarPorId(id: string): Promise<Cronograma | null> {
    try {
      const query = `
        SELECT
          c.*,
          ct.nome as calendario_nome
        FROM cronogramas c
        LEFT JOIN calendarios_trabalho ct ON ct.id = c.calendario_id
        WHERE c.id = $1
      `;

      // TODO: Implementar chamada real via MCP Supabase
      console.log('Buscando cronograma:', id);
      return null;
    } catch (error) {
      console.error('Erro ao buscar cronograma:', error);
      throw new Error('Falha ao buscar cronograma');
    }
  }

  // Criar novo cronograma
  static async criar(data: CronogramaCreateRequest): Promise<Cronograma> {
    try {
      const query = `
        INSERT INTO cronogramas (
          obra_id, nome, descricao, data_inicio, data_fim,
          calendario_id, status, unidade_duracao, permite_sobreposicao,
          auto_nivelamento, orcamento_total
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const params = [
        data.obra_id || null,
        data.nome,
        data.descricao || null,
        data.data_inicio,
        data.data_fim || null,
        data.calendario_id,
        data.status || 'planejamento',
        data.unidade_duracao || 'dias',
        data.permite_sobreposicao || false,
        data.auto_nivelamento || true,
        data.orcamento_total || null,
      ];

      // TODO: Implementar chamada real via MCP Supabase
      console.log('Criando cronograma:', params);
      throw new Error('Implementação pendente');
    } catch (error) {
      console.error('Erro ao criar cronograma:', error);
      throw new Error('Falha ao criar cronograma');
    }
  }

  // Atualizar cronograma
  static async atualizar(id: string, data: CronogramaUpdateRequest): Promise<Cronograma> {
    try {
      const campos = [];
      const params = [];
      let paramIndex = 1;

      if (data.nome) {
        campos.push(`nome = $${paramIndex++}`);
        params.push(data.nome);
      }

      if (data.descricao !== undefined) {
        campos.push(`descricao = $${paramIndex++}`);
        params.push(data.descricao);
      }

      if (data.data_inicio) {
        campos.push(`data_inicio = $${paramIndex++}`);
        params.push(data.data_inicio);
      }

      if (data.data_fim !== undefined) {
        campos.push(`data_fim = $${paramIndex++}`);
        params.push(data.data_fim);
      }

      if (data.status) {
        campos.push(`status = $${paramIndex++}`);
        params.push(data.status);
      }

      if (data.orcamento_total !== undefined) {
        campos.push(`orcamento_total = $${paramIndex++}`);
        params.push(data.orcamento_total);
      }

      campos.push(`data_atualizacao = NOW()`);
      params.push(id);

      const query = `
        UPDATE cronogramas
        SET ${campos.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      // TODO: Implementar chamada real via MCP Supabase
      console.log('Atualizando cronograma:', query, params);
      throw new Error('Implementação pendente');
    } catch (error) {
      console.error('Erro ao atualizar cronograma:', error);
      throw new Error('Falha ao atualizar cronograma');
    }
  }

  // Excluir cronograma
  static async excluir(id: string): Promise<void> {
    try {
      const query = `DELETE FROM cronogramas WHERE id = $1`;

      // TODO: Implementar chamada real via MCP Supabase
      console.log('Excluindo cronograma:', id);
    } catch (error) {
      console.error('Erro ao excluir cronograma:', error);
      throw new Error('Falha ao excluir cronograma');
    }
  }
}

// ============================================================
// SERVIÇOS EAP/WBS ITENS
// ============================================================

export class EAPService {
  // Buscar itens da EAP por cronograma
  static async listarPorCronograma(cronogramaId: string, filters?: EAPItemFilters): Promise<EAPItem[]> {
    try {
      let query = `
        SELECT *
        FROM eap_itens
        WHERE cronograma_id = $1
      `;

      const params = [cronogramaId];

      if (filters?.search) {
        query += ` AND (nome ILIKE $${params.length + 1} OR descricao ILIKE $${params.length + 1})`;
        params.push(`%${filters.search}%`);
      }

      if (filters?.tipos && filters.tipos.length > 0) {
        query += ` AND tipo = ANY($${params.length + 1})`;
        params.push(filters.tipos.join(','));
      }

      if (filters?.status && filters.status.length > 0) {
        query += ` AND status = ANY($${params.length + 1})`;
        params.push(filters.status.join(','));
      }

      if (filters?.e_critica !== undefined) {
        query += ` AND e_critica = $${params.length + 1}`;
        params.push(String(filters.e_critica));
      }

      query += ` ORDER BY nivel_hierarquia, posicao_irmao`;

      // TODO: Implementar chamada real via MCP Supabase
      console.log('Buscando itens EAP:', query, params);
      return [];
    } catch (error) {
      console.error('Erro ao listar itens EAP:', error);
      throw new Error('Falha ao buscar itens EAP');
    }
  }

  // Criar item da EAP
  static async criarItem(data: EAPItemCreateRequest): Promise<EAPItem> {
    try {
      const query = `
        INSERT INTO eap_itens (
          cronograma_id, item_pai_id, nome, descricao, tipo,
          posicao_irmao, data_inicio_planejada, data_fim_planejada,
          duracao_planejada, trabalho_planejado, status,
          e_marco, prioridade, notas
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;

      const params = [
        data.cronograma_id,
        data.item_pai_id || null,
        data.nome,
        data.descricao || null,
        data.tipo,
        data.posicao_irmao || 1,
        data.data_inicio_planejada || null,
        data.data_fim_planejada || null,
        data.duracao_planejada || 0,
        data.trabalho_planejado || 0,
        data.status || 'nao_iniciada',
        data.e_marco || false,
        data.prioridade || 500,
        data.notas || null,
      ];

      // TODO: Implementar chamada real via MCP Supabase
      console.log('Criando item EAP:', params);
      throw new Error('Implementação pendente');
    } catch (error) {
      console.error('Erro ao criar item EAP:', error);
      throw new Error('Falha ao criar item EAP');
    }
  }

  // Atualizar item da EAP
  static async atualizarItem(id: string, data: EAPItemUpdateRequest): Promise<EAPItem> {
    try {
      const campos = [];
      const params = [];
      let paramIndex = 1;

      // Construir query dinâmica baseada nos campos fornecidos
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'id' && value !== undefined) {
          campos.push(`${key} = $${paramIndex++}`);
          params.push(value);
        }
      });

      campos.push(`data_atualizacao = NOW()`);
      params.push(id);

      const query = `
        UPDATE eap_itens
        SET ${campos.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      // TODO: Implementar chamada real via MCP Supabase
      console.log('Atualizando item EAP:', query, params);
      throw new Error('Implementação pendente');
    } catch (error) {
      console.error('Erro ao atualizar item EAP:', error);
      throw new Error('Falha ao atualizar item EAP');
    }
  }

  // Excluir item da EAP
  static async excluirItem(id: string): Promise<void> {
    try {
      const query = `DELETE FROM eap_itens WHERE id = $1`;

      // TODO: Implementar chamada real via MCP Supabase
      console.log('Excluindo item EAP:', id);
    } catch (error) {
      console.error('Erro ao excluir item EAP:', error);
      throw new Error('Falha ao excluir item EAP');
    }
  }
}

// ============================================================
// SERVIÇOS DEPENDÊNCIAS
// ============================================================

export class DependenciasService {
  // Listar dependências por cronograma
  static async listarPorCronograma(cronogramaId: string): Promise<DependenciaAtividade[]> {
    try {
      const query = `
        SELECT
          da.*,
          ei_pred.codigo_wbs as predecessora_codigo,
          ei_pred.nome as predecessora_nome,
          ei_suc.codigo_wbs as sucessora_codigo,
          ei_suc.nome as sucessora_nome
        FROM dependencias_atividades da
        JOIN eap_itens ei_pred ON ei_pred.id = da.atividade_predecessora_id
        JOIN eap_itens ei_suc ON ei_suc.id = da.atividade_sucessora_id
        WHERE ei_pred.cronograma_id = $1
        ORDER BY ei_pred.codigo_wbs, ei_suc.codigo_wbs
      `;

      // TODO: Implementar chamada real via MCP Supabase
      console.log('Buscando dependências para cronograma:', cronogramaId);
      return [];
    } catch (error) {
      console.error('Erro ao listar dependências:', error);
      throw new Error('Falha ao buscar dependências');
    }
  }

  // Criar dependência
  static async criarDependencia(data: DependenciaCreateRequest): Promise<DependenciaAtividade> {
    try {
      const query = `
        INSERT INTO dependencias_atividades (
          atividade_predecessora_id, atividade_sucessora_id, tipo,
          defasagem_horas, e_obrigatoria, aplicar_calendario, descricao
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const params = [
        data.atividade_predecessora_id,
        data.atividade_sucessora_id,
        data.tipo,
        data.defasagem_horas || 0,
        data.e_obrigatoria !== false,
        data.aplicar_calendario !== false,
        data.descricao || null,
      ];

      // TODO: Implementar chamada real via MCP Supabase
      console.log('Criando dependência:', params);
      throw new Error('Implementação pendente');
    } catch (error) {
      console.error('Erro ao criar dependência:', error);
      throw new Error('Falha ao criar dependência');
    }
  }

  // Excluir dependência
  static async excluirDependencia(id: string): Promise<void> {
    try {
      const query = `DELETE FROM dependencias_atividades WHERE id = $1`;

      // TODO: Implementar chamada real via MCP Supabase
      console.log('Excluindo dependência:', id);
    } catch (error) {
      console.error('Erro ao excluir dependência:', error);
      throw new Error('Falha ao excluir dependência');
    }
  }
}

// ============================================================
// SERVIÇOS ALOCAÇÕES DE RECURSOS
// ============================================================

export class AlocacoesService {
  // Listar alocações por atividade
  static async listarPorAtividade(atividadeId: string): Promise<AlocacaoRecurso[]> {
    try {
      const query = `
        SELECT
          ar.*,
          re.nome as recurso_nome,
          re.codigo as recurso_codigo,
          tr.nome as tipo_recurso_nome
        FROM alocacoes_recursos ar
        JOIN recursos_empresa re ON re.id = ar.recurso_id
        JOIN tipos_recursos tr ON tr.id = re.tipo_recurso_id
        WHERE ar.atividade_id = $1
        ORDER BY re.nome
      `;

      // TODO: Implementar chamada real via MCP Supabase
      console.log('Buscando alocações para atividade:', atividadeId);
      return [];
    } catch (error) {
      console.error('Erro ao listar alocações:', error);
      throw new Error('Falha ao buscar alocações');
    }
  }

  // Criar alocação
  static async criarAlocacao(data: AlocacaoCreateRequest): Promise<AlocacaoRecurso> {
    try {
      const query = `
        INSERT INTO alocacoes_recursos (
          atividade_id, recurso_id, tipo, unidade, quantidade_planejada,
          percentual_dedicacao, horas_por_dia, custo_unitario,
          data_inicio_alocacao, data_fim_alocacao, observacoes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const params = [
        data.atividade_id,
        data.recurso_id,
        data.tipo,
        data.unidade,
        data.quantidade_planejada,
        data.percentual_dedicacao || 100,
        data.horas_por_dia || 8,
        data.custo_unitario || 0,
        data.data_inicio_alocacao || null,
        data.data_fim_alocacao || null,
        data.observacoes || null,
      ];

      // TODO: Implementar chamada real via MCP Supabase
      console.log('Criando alocação:', params);
      throw new Error('Implementação pendente');
    } catch (error) {
      console.error('Erro ao criar alocação:', error);
      throw new Error('Falha ao criar alocação');
    }
  }

  // Excluir alocação
  static async excluirAlocacao(id: string): Promise<void> {
    try {
      const query = `DELETE FROM alocacoes_recursos WHERE id = $1`;

      // TODO: Implementar chamada real via MCP Supabase
      console.log('Excluindo alocação:', id);
    } catch (error) {
      console.error('Erro ao excluir alocação:', error);
      throw new Error('Falha ao excluir alocação');
    }
  }
}

// ============================================================
// SERVIÇOS BASELINES
// ============================================================

export class BaselinesService {
  // Listar baselines por cronograma
  static async listarPorCronograma(cronogramaId: string): Promise<BaselineCronograma[]> {
    try {
      const query = `
        SELECT *
        FROM baselines_cronogramas
        WHERE cronograma_id = $1
        ORDER BY data_baseline DESC
      `;

      // TODO: Implementar chamada real via MCP Supabase
      console.log('Buscando baselines para cronograma:', cronogramaId);
      return [];
    } catch (error) {
      console.error('Erro ao listar baselines:', error);
      throw new Error('Falha ao buscar baselines');
    }
  }

  // Criar baseline
  static async criarBaseline(data: BaselineCreateRequest): Promise<BaselineCronograma> {
    try {
      const query = `SELECT criar_baseline_cronograma($1, $2, $3, $4)`;

      const params = [
        data.cronograma_id,
        data.nome,
        data.tipo,
        data.descricao || null,
      ];

      // TODO: Implementar chamada real via MCP Supabase
      console.log('Criando baseline:', params);
      throw new Error('Implementação pendente');
    } catch (error) {
      console.error('Erro ao criar baseline:', error);
      throw new Error('Falha ao criar baseline');
    }
  }

  // Ativar baseline
  static async ativarBaseline(baselineId: string): Promise<void> {
    try {
      const query = `
        UPDATE baselines_cronogramas
        SET status = CASE
          WHEN id = $1 THEN 'ativo'::status_baseline
          ELSE 'historico'::status_baseline
        END
        WHERE cronograma_id = (
          SELECT cronograma_id FROM baselines_cronogramas WHERE id = $1
        )
      `;

      // TODO: Implementar chamada real via MCP Supabase
      console.log('Ativando baseline:', baselineId);
    } catch (error) {
      console.error('Erro ao ativar baseline:', error);
      throw new Error('Falha ao ativar baseline');
    }
  }
}

// ============================================================
// SERVIÇOS AUXILIARES
// ============================================================

export class CalendariosService {
  static async listar(): Promise<CalendarioTrabalho[]> {
    try {
      const query = `
        SELECT *
        FROM calendarios_trabalho
        ORDER BY empresa_padrao DESC, nome
      `;

      // TODO: Implementar chamada real via MCP Supabase
      console.log('Buscando calendários de trabalho');
      return [];
    } catch (error) {
      console.error('Erro ao listar calendários:', error);
      throw new Error('Falha ao buscar calendários');
    }
  }
}

export class RecursosService {
  static async listar(): Promise<RecursoEmpresa[]> {
    try {
      const query = `
        SELECT
          re.*,
          tr.nome as tipo_recurso_nome
        FROM recursos_empresa re
        JOIN tipos_recursos tr ON tr.id = re.tipo_recurso_id
        WHERE re.ativo = true
        ORDER BY tr.categoria, re.nome
      `;

      // TODO: Implementar chamada real via MCP Supabase
      console.log('Buscando recursos da empresa');
      return [];
    } catch (error) {
      console.error('Erro ao listar recursos:', error);
      throw new Error('Falha ao buscar recursos');
    }
  }

  static async listarTipos(): Promise<TipoRecurso[]> {
    try {
      const query = `
        SELECT *
        FROM tipos_recursos
        ORDER BY categoria, nome
      `;

      // TODO: Implementar chamada real via MCP Supabase
      console.log('Buscando tipos de recursos');
      return [];
    } catch (error) {
      console.error('Erro ao listar tipos de recursos:', error);
      throw new Error('Falha ao buscar tipos de recursos');
    }
  }
}

// ============================================================
// EXPORTAÇÕES
// ============================================================

// Serviço unificado para facilitar importação
export const CronogramaServices = {
  cronogramas: CronogramasService,
  eap: EAPService,
  dependencias: DependenciasService,
  alocacoes: AlocacoesService,
  baselines: BaselinesService,
  calendarios: CalendariosService,
  recursos: RecursosService,
};

export default CronogramaServices;