import { supabase } from '@/lib/supabaseClient';
import type {
  CampoSelecionado,
  ConsultaBI,
  ResultadoBI,
  FiltrosPadrao
} from '@/types/bi';

/**
 * Serviço para busca e processamento de dados do BI
 * Responsável por construir consultas complexas no Supabase
 */
export class BiDataService {

  /**
   * Constrói uma consulta SQL baseada nos campos selecionados e filtros
   */
  private construirConsulta(consulta: ConsultaBI): {
    select: string;
    joins: string[];
    where: string[];
    groupBy?: string;
    orderBy?: string;
  } {
    const { campos_selecionados, filtros, configuracoes } = consulta;

    // Mapear tabelas principais
    const tabelasPrincipais = new Set(['despesas', 'despesas_variaveis']);
    let tabelaPrincipal = 'despesas'; // padrão

    // Identificar tabela principal baseada nos campos selecionados
    const tabelasUsadas = new Set(campos_selecionados.map(c => c.tabela));
    for (const tabela of tabelasPrincipais) {
      if (tabelasUsadas.has(tabela)) {
        tabelaPrincipal = tabela;
        break;
      }
    }

    // Construir SELECT com aliases únicos
    const selectFields: string[] = [];
    const joins: string[] = [];
    const tabelasJoinadas = new Set([tabelaPrincipal]);

    campos_selecionados.forEach((campo, index) => {
      const alias = `campo_${index}`;

      if (campo.tabela === tabelaPrincipal) {
        selectFields.push(`${tabelaPrincipal}.${campo.campo} as "${alias}"`);
      } else {
        // Adicionar JOIN se necessário
        this.adicionarJoinSeNecessario(
          campo.tabela,
          tabelaPrincipal,
          joins,
          tabelasJoinadas
        );
        selectFields.push(`${campo.tabela}.${campo.campo} as "${alias}"`);
      }
    });

    // Construir WHERE com filtros
    const whereConditions = this.construirFiltros(filtros, tabelaPrincipal);

    // Configurações adicionais
    let groupBy = '';
    if (configuracoes.agrupamento?.length) {
      groupBy = configuracoes.agrupamento.join(', ');
    }

    let orderBy = '';
    if (configuracoes.ordenacao) {
      orderBy = `${configuracoes.ordenacao.campo} ${configuracoes.ordenacao.direcao}`;
    }

    return {
      select: selectFields.join(', '),
      joins,
      where: whereConditions,
      groupBy,
      orderBy
    };
  }

  /**
   * Adiciona JOINs necessários baseado na tabela de relacionamento
   */
  private adicionarJoinSeNecessario(
    tabela: string,
    tabelaPrincipal: string,
    joins: string[],
    tabelasJoinadas: Set<string>
  ): void {
    if (tabelasJoinadas.has(tabela)) return;

    const relacionamentos: Record<string, Record<string, string>> = {
      despesas: {
        clientes: 'LEFT JOIN clientes ON despesas.cliente_id = clientes.id',
        obras: 'LEFT JOIN obras ON despesas.obra_id = obras.id',
        funcionarios: 'LEFT JOIN funcionarios ON despesas.comprador_funcionario_id = funcionarios.id',
        requisicoes: 'LEFT JOIN requisicoes ON despesas.requisicao_id = requisicoes.id'
      },
      despesas_variaveis: {
        clientes: 'LEFT JOIN clientes ON obras.cliente_id = clientes.id LEFT JOIN obras ON despesas_variaveis.obra_id = obras.id',
        obras: 'LEFT JOIN obras ON despesas_variaveis.obra_id = obras.id',
        funcionarios: 'LEFT JOIN funcionarios ON despesas_variaveis.comprador_funcionario_id = funcionarios.id',
        cartoes_credito: 'LEFT JOIN cartoes_credito ON despesas_variaveis.cartao_vinculado_id = cartoes_credito.id'
      }
    };

    const joinConfig = relacionamentos[tabelaPrincipal]?.[tabela];
    if (joinConfig && !tabelasJoinadas.has(tabela)) {
      joins.push(joinConfig);
      tabelasJoinadas.add(tabela);
    }
  }

  /**
   * Constrói as condições WHERE baseadas nos filtros
   */
  private construirFiltros(filtros: Record<string, any>, tabelaPrincipal: string): string[] {
    const conditions: string[] = [];

    // Filtro de período obrigatório
    if (filtros.data_inicio && filtros.data_fim) {
      const campoData = tabelaPrincipal === 'despesas' ? 'data_despesa' : 'data_compra';
      conditions.push(`${tabelaPrincipal}.${campoData} BETWEEN '${filtros.data_inicio}' AND '${filtros.data_fim}'`);
    }

    // Filtros opcionais
    if (filtros.cliente_id) {
      if (tabelaPrincipal === 'despesas') {
        conditions.push(`${tabelaPrincipal}.cliente_id = '${filtros.cliente_id}'`);
      } else {
        conditions.push(`obras.cliente_id = '${filtros.cliente_id}'`);
      }
    }

    if (filtros.obra_id) {
      conditions.push(`${tabelaPrincipal}.obra_id = '${filtros.obra_id}'`);
    }

    if (filtros.categoria) {
      if (tabelaPrincipal === 'despesas') {
        conditions.push(`${tabelaPrincipal}.categoria = '${filtros.categoria}'`);
      }
    }

    if (filtros.forma_pagamento && tabelaPrincipal === 'despesas_variaveis') {
      conditions.push(`${tabelaPrincipal}.forma_pagamento = '${filtros.forma_pagamento}'`);
    }

    if (filtros.status) {
      conditions.push(`${tabelaPrincipal}.status = '${filtros.status}'`);
    }

    if (filtros.funcionario_id) {
      conditions.push(`${tabelaPrincipal}.comprador_funcionario_id = '${filtros.funcionario_id}'`);
    }

    return conditions;
  }

  /**
   * Executa consulta no Supabase e retorna resultados formatados
   */
  async executarConsulta(consulta: ConsultaBI): Promise<ResultadoBI> {
    const tempoInicio = Date.now();

    try {
      const { select, joins, where, groupBy, orderBy } = this.construirConsulta(consulta);

      // Construir query SQL completa
      let sqlQuery = `SELECT ${select}`;

      // Determinar tabela principal
      const tabelasPrincipais = ['despesas', 'despesas_variaveis'];
      const tabelaPrincipal = consulta.campos_selecionados
        .find(c => tabelasPrincipais.includes(c.tabela))?.tabela || 'despesas';

      sqlQuery += ` FROM ${tabelaPrincipal}`;

      // Adicionar JOINs
      if (joins.length > 0) {
        sqlQuery += ` ${joins.join(' ')}`;
      }

      // Adicionar WHERE
      if (where.length > 0) {
        sqlQuery += ` WHERE ${where.join(' AND ')}`;
      }

      // Adicionar GROUP BY
      if (groupBy) {
        sqlQuery += ` GROUP BY ${groupBy}`;
      }

      // Adicionar ORDER BY
      if (orderBy) {
        sqlQuery += ` ORDER BY ${orderBy}`;
      }

      // Adicionar LIMIT
      if (consulta.limite) {
        sqlQuery += ` LIMIT ${consulta.limite}`;
      }

      // Adicionar OFFSET
      if (consulta.offset) {
        sqlQuery += ` OFFSET ${consulta.offset}`;
      }

      console.log('SQL Query:', sqlQuery);

      // Executar query no Supabase
      const { data, error } = await supabase.rpc('execute_raw_sql', {
        query: sqlQuery
      });

      if (error) {
        throw new Error(`Erro na consulta: ${error.message}`);
      }

      // Calcular totais se necessário
      const totais = await this.calcularTotais(consulta, where);

      const tempoExecucao = Date.now() - tempoInicio;

      return {
        dados: data || [],
        totais,
        metadados: {
          total_registros: data?.length || 0,
          tempo_execucao: tempoExecucao,
          filtros_aplicados: consulta.filtros,
          campos_selecionados: consulta.campos_selecionados
        }
      };

    } catch (error) {
      console.error('Erro ao executar consulta BI:', error);
      throw error;
    }
  }

  /**
   * Calcula totais para campos numéricos
   */
  private async calcularTotais(
    consulta: ConsultaBI,
    whereConditions: string[]
  ): Promise<Record<string, number> | undefined> {
    const camposNumericos = consulta.campos_selecionados.filter(
      campo => campo.tipo === 'currency' || campo.tipo === 'number'
    );

    if (camposNumericos.length === 0) return undefined;

    const totais: Record<string, number> = {};

    try {
      for (const campo of camposNumericos) {
        let sqlQuery = `SELECT SUM(${campo.campo}) as total FROM ${campo.tabela}`;

        if (whereConditions.length > 0) {
          sqlQuery += ` WHERE ${whereConditions.join(' AND ')}`;
        }

        const { data, error } = await supabase.rpc('execute_raw_sql', {
          query: sqlQuery
        });

        if (!error && data && data[0]) {
          totais[`${campo.tabela}.${campo.campo}`] = Number(data[0].total) || 0;
        }
      }
    } catch (error) {
      console.warn('Erro ao calcular totais:', error);
    }

    return totais;
  }

  /**
   * Busca dados específicos para preencher filtros (ex: lista de clientes)
   */
  async buscarOpcoesEFilters(): Promise<{
    clientes: { value: string; label: string }[];
    obras: { value: string; label: string }[];
    funcionarios: { value: string; label: string }[];
    categorias: { value: string; label: string }[];
    formas_pagamento: { value: string; label: string }[];
  }> {
    try {
      const [clientesRes, obrasRes, funcionariosRes, categoriasRes, formasRes] = await Promise.all([
        supabase.from('clientes').select('id, nome').eq('ativo', true).order('nome'),
        supabase.from('obras').select('id, nome').order('nome'),
        supabase.from('funcionarios').select('id, nome').eq('ativo', true).order('nome'),
        supabase.from('categorias').select('id, nome').eq('ativa', true).order('nome'),
        supabase.from('formas_pagamento').select('codigo, nome').eq('ativo', true).order('ordem')
      ]);

      return {
        clientes: (clientesRes.data || []).map(c => ({ value: c.id, label: c.nome })),
        obras: (obrasRes.data || []).map(o => ({ value: o.id, label: o.nome })),
        funcionarios: (funcionariosRes.data || []).map(f => ({ value: f.id, label: f.nome })),
        categorias: (categoriasRes.data || []).map(c => ({ value: c.nome, label: c.nome })),
        formas_pagamento: (formasRes.data || []).map(f => ({ value: f.codigo, label: f.nome }))
      };
    } catch (error) {
      console.error('Erro ao buscar opções de filtros:', error);
      return {
        clientes: [],
        obras: [],
        funcionarios: [],
        categorias: [],
        formas_pagamento: []
      };
    }
  }

  // 🚨 CLAUDE-WARNING: Função gerarDadosMock removida em 2025-11-28
  // 💡 TODO: Sistema agora usa apenas dados reais via executarConsulta()
  // ✨ NOVO: Todos os dados vêm diretamente do Supabase, sem mocks
}

// Instância singleton do serviço
export const biDataService = new BiDataService();