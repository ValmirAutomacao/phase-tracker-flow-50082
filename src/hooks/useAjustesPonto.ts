// 🤖 CLAUDE-NOTE: Hook para gerenciar operações CRUD de ajustes de ponto
// 📅 Criado em: 2024-11-29
// 🎯 Propósito: Centralizar lógica de ajustes, afastamentos e histórico
// ⚠️ IMPORTANTE: Integração com Supabase preservando dados originais
// 🔗 Usado por: ControlePonto.tsx, Modais de ajuste e afastamento

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AjustePonto,
  AjustePontoInsert,
  Afastamento,
  AfastamentoInsert,
  RegistroPonto,
  FuncionarioCompleto
} from "@/types/ponto";

interface UseAjustesPontoOptions {
  funcionario_id?: string;
  data_inicio?: string;
  data_fim?: string;
}

export function useAjustesPonto(options: UseAjustesPontoOptions = {}) {
  const queryClient = useQueryClient();

  // Buscar ajustes de ponto usando MCP Supabase
  const {
    data: ajustes = [],
    isLoading: isLoadingAjustes,
    error: errorAjustes
  } = useQuery({
    queryKey: ['ajustes-ponto', options],
    queryFn: () => buscarAjustes(options),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Buscar afastamentos usando MCP Supabase
  const {
    data: afastamentos = [],
    isLoading: isLoadingAfastamentos,
    error: errorAfastamentos
  } = useQuery({
    queryKey: ['afastamentos', options],
    queryFn: () => buscarAfastamentos(options),
    staleTime: 5 * 60 * 1000,
  });

  // Buscar histórico completo (ajustes + afastamentos)
  const {
    data: historico = [],
    isLoading: isLoadingHistorico
  } = useQuery({
    queryKey: ['historico-ajustes', options],
    queryFn: () => buscarHistoricoCompleto(options),
    staleTime: 5 * 60 * 1000,
  });

  // Mutation para criar ajuste
  const criarAjusteMutation = useMutation({
    mutationFn: async (data: AjustePontoInsert) => {
      return await criarAjustePonto(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ajustes-ponto'] });
      queryClient.invalidateQueries({ queryKey: ['historico-ajustes'] });
      queryClient.invalidateQueries({ queryKey: ['registros-ponto'] });
    },
  });

  // Mutation para criar afastamento
  const criarAfastamentoMutation = useMutation({
    mutationFn: async (data: AfastamentoInsert & { arquivo?: File }) => {
      return await criarAfastamento(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['afastamentos'] });
      queryClient.invalidateQueries({ queryKey: ['historico-ajustes'] });
    },
  });

  // Mutation para deletar ajuste
  const deletarAjusteMutation = useMutation({
    mutationFn: async (ajusteId: string) => {
      return await deletarAjuste(ajusteId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ajustes-ponto'] });
      queryClient.invalidateQueries({ queryKey: ['historico-ajustes'] });
    },
  });

  return {
    // Dados
    ajustes,
    afastamentos,
    historico,

    // Estados de loading
    isLoadingAjustes,
    isLoadingAfastamentos,
    isLoadingHistorico,
    isLoading: isLoadingAjustes || isLoadingAfastamentos || isLoadingHistorico,

    // Erros
    errorAjustes,
    errorAfastamentos,

    // Ações
    criarAjuste: criarAjusteMutation.mutateAsync,
    criarAfastamento: criarAfastamentoMutation.mutateAsync,
    deletarAjuste: deletarAjusteMutation.mutateAsync,

    // Estados das mutations
    isCriandoAjuste: criarAjusteMutation.isPending,
    isCriandoAfastamento: criarAfastamentoMutation.isPending,
    isDeletandoAjuste: deletarAjusteMutation.isPending,
  };
}

// Implementação real usando MCP Supabase
async function buscarAjustes(options: UseAjustesPontoOptions): Promise<AjustePonto[]> {
  try {
    let query = `
      SELECT
        aj.*,
        f.nome as funcionario_nome,
        fu.nome as usuario_ajuste_nome
      FROM ajustes_ponto aj
      JOIN funcionarios f ON f.id = aj.funcionario_id
      JOIN funcionarios fu ON fu.id = aj.usuario_ajuste_id
      WHERE aj.status = 'ativo'
    `;

    const params: string[] = [];

    if (options.funcionario_id) {
      query += ` AND aj.funcionario_id = $${params.length + 1}`;
      params.push(options.funcionario_id);
    }

    if (options.data_inicio) {
      query += ` AND aj.data_nova >= $${params.length + 1}`;
      params.push(options.data_inicio);
    }

    if (options.data_fim) {
      query += ` AND aj.data_nova <= $${params.length + 1}`;
      params.push(options.data_fim);
    }

    query += ` ORDER BY aj.created_at DESC`;

    // Usar MCP Supabase diretamente
    const response = await (globalThis as any).mcp__supabase__execute_sql({
      query,
      params
    });

    // Mapear resultado para interface AjustePonto
    return (response || []).map((row: any) => ({
      id: row.id,
      registro_ponto_id: row.registro_ponto_id,
      funcionario_id: row.funcionario_id,
      funcionario_nome: row.funcionario_nome,
      data_ajuste: row.data_nova,
      tipo_ajuste: determinarTipoAjuste({
        registro_ponto_id: row.registro_ponto_id,
        hora_original: row.hora_original,
        tipo_registro_novo: row.tipo_registro_novo
      } as any),
      tipo_registro: row.tipo_registro_novo,
      hora_original: row.hora_original,
      hora_ajustada: row.hora_nova,
      justificativa: row.justificativa_texto,
      usuario_ajuste_id: row.usuario_ajuste_id,
      usuario_ajuste_nome: row.usuario_ajuste_nome,
      observacoes: null,
      created_at: row.created_at,
      updated_at: row.created_at
    }));

  } catch (error) {
    console.error("Erro ao buscar ajustes via MCP:", error);
    throw error;
  }
}

async function buscarAfastamentos(options: UseAjustesPontoOptions): Promise<Afastamento[]> {
  try {
    let query = `
      SELECT
        af.*,
        f.nome as funcionario_nome,
        fu.nome as usuario_cadastro_nome,
        ta.nome as tipo_nome
      FROM afastamentos af
      JOIN funcionarios f ON f.id = af.funcionario_id
      JOIN funcionarios fu ON fu.id = af.solicitado_por_id
      JOIN tipos_afastamento ta ON ta.id = af.tipo_afastamento_id
      WHERE af.status IN ('pendente', 'aprovado')
    `;

    const params: string[] = [];

    if (options.funcionario_id) {
      query += ` AND af.funcionario_id = $${params.length + 1}`;
      params.push(options.funcionario_id);
    }

    if (options.data_inicio) {
      query += ` AND af.data_fim >= $${params.length + 1}`;
      params.push(options.data_inicio);
    }

    if (options.data_fim) {
      query += ` AND af.data_inicio <= $${params.length + 1}`;
      params.push(options.data_fim);
    }

    query += ` ORDER BY af.created_at DESC`;

    const response = await (globalThis as any).mcp__supabase__execute_sql({
      query,
      params
    });

    // Mapear resultado para interface Afastamento
    return (response || []).map((row: any) => ({
      id: row.id,
      funcionario_id: row.funcionario_id,
      funcionario_nome: row.funcionario_nome,
      tipo_afastamento: row.tipo_nome,
      data_inicio: row.data_inicio,
      data_fim: row.data_fim,
      total_dias: row.total_dias,
      motivo: row.motivo,
      observacoes: row.observacoes,
      documento_anexo_url: row.documento_url,
      documento_anexo_nome: row.documento_nome,
      usuario_cadastro_id: row.solicitado_por_id,
      usuario_cadastro_nome: row.usuario_cadastro_nome,
      ativo: row.status === 'aprovado',
      created_at: row.created_at,
      updated_at: row.updated_at
    }));

  } catch (error) {
    console.error("Erro ao buscar afastamentos via MCP:", error);
    throw error;
  }
}

async function buscarHistoricoCompleto(options: UseAjustesPontoOptions) {
  console.log("Buscando histórico completo com opções:", options);

  // Combinar ajustes e afastamentos em timeline única
  const ajustes = await buscarAjustes(options);
  const afastamentos = await buscarAfastamentos(options);

  const historico = [
    ...ajustes.map(ajuste => ({
      id: ajuste.id,
      tipo: 'ajuste' as const,
      funcionario_nome: ajuste.funcionario_nome,
      data_operacao: ajuste.created_at,
      descricao: `${ajuste.tipo_ajuste} - ${ajuste.hora_original} → ${ajuste.hora_ajustada}`,
      usuario_responsavel: ajuste.usuario_ajuste_nome,
      detalhes: ajuste.justificativa,
      justificativa: ajuste.justificativa,
    })),
    ...afastamentos.map(afastamento => ({
      id: afastamento.id,
      tipo: 'afastamento' as const,
      funcionario_nome: afastamento.funcionario_nome,
      data_operacao: afastamento.created_at,
      descricao: `${afastamento.tipo_afastamento} - ${afastamento.total_dias} dias`,
      usuario_responsavel: afastamento.usuario_cadastro_nome,
      detalhes: afastamento.motivo,
      justificativa: afastamento.motivo,
    }))
  ];

  // Ordenar por data mais recente primeiro
  return historico.sort((a, b) =>
    new Date(b.data_operacao).getTime() - new Date(a.data_operacao).getTime()
  );
}

async function criarAjustePonto(data: AjustePontoInsert): Promise<AjustePonto> {
  try {
    console.log("Criando ajuste de ponto via MCP:", data);

    // 1. Validar se registro existe (para ajustes) - só se tiver registro_ponto_id
    if (data.registro_ponto_id) {
      const validacao = await (globalThis as any).mcp__supabase__execute_sql({
        query: `SELECT id FROM registros_ponto WHERE id = $1 AND funcionario_id = $2`,
        params: [data.registro_ponto_id, data.funcionario_id]
      });

      if (!validacao || validacao.length === 0) {
        throw new Error('Registro de ponto não encontrado ou não pertence ao funcionário');
      }
    }

    // 2. Inserir ajuste na tabela usando MCP
    const insertQuery = `
      INSERT INTO ajustes_ponto (
        registro_ponto_id, funcionario_id, tipo_registro_original,
        hora_original, data_original, tipo_registro_novo,
        hora_nova, data_nova, justificativa_id, justificativa_texto,
        documento_url, usuario_ajuste_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'ativo')
      RETURNING *
    `;

    const result = await (globalThis as any).mcp__supabase__execute_sql({
      query: insertQuery,
      params: [
        data.registro_ponto_id || null,
        data.funcionario_id,
        data.tipo_registro_original || null,
        data.hora_original || null,
        data.data_original || null,
        data.tipo_registro_novo,
        data.hora_nova,
        data.data_nova,
        data.justificativa_id || null,
        data.justificativa_texto,
        data.documento_url || null,
        data.usuario_ajuste_id
      ]
    });

    if (!result || result.length === 0) {
      throw new Error('Falha ao criar ajuste de ponto');
    }

    const ajusteCriado = result[0];

    // 3. Buscar nomes para retorno completo
    const nomes = await (globalThis as any).mcp__supabase__execute_sql({
      query: `
        SELECT f.nome as funcionario_nome, fu.nome as usuario_ajuste_nome
        FROM funcionarios f, funcionarios fu
        WHERE f.id = $1 AND fu.id = $2
      `,
      params: [data.funcionario_id, data.usuario_ajuste_id]
    });

    const nomesInfo = nomes?.[0] || { funcionario_nome: '', usuario_ajuste_nome: '' };

    // 4. Retornar ajuste com nomes
    return {
      id: ajusteCriado.id,
      registro_ponto_id: ajusteCriado.registro_ponto_id,
      funcionario_id: ajusteCriado.funcionario_id,
      funcionario_nome: nomesInfo.funcionario_nome,
      data_ajuste: ajusteCriado.data_nova,
      tipo_ajuste: determinarTipoAjuste(data),
      tipo_registro: ajusteCriado.tipo_registro_novo,
      hora_original: ajusteCriado.hora_original,
      hora_ajustada: ajusteCriado.hora_nova,
      justificativa: ajusteCriado.justificativa_texto,
      usuario_ajuste_id: ajusteCriado.usuario_ajuste_id,
      usuario_ajuste_nome: nomesInfo.usuario_ajuste_nome,
      observacoes: null,
      created_at: ajusteCriado.created_at,
      updated_at: ajusteCriado.created_at
    };

  } catch (error) {
    console.error("Erro ao criar ajuste de ponto via MCP:", error);
    throw error;
  }
}

function determinarTipoAjuste(data: AjustePontoInsert): 'entrada' | 'saida' | 'intervalo_entrada' | 'intervalo_saida' | 'exclusao' | 'adicao' {
  if (!data.registro_ponto_id) return 'adicao';
  if (!data.hora_original) return 'adicao';

  const tipoRegistro = data.tipo_registro_novo;
  if (tipoRegistro === 'PE' || tipoRegistro === 'SE') return 'entrada';
  if (tipoRegistro === 'PS' || tipoRegistro === 'SS') return 'saida';
  if (tipoRegistro === 'INT_ENTRADA') return 'intervalo_entrada';
  if (tipoRegistro === 'INT_SAIDA') return 'intervalo_saida';

  return 'entrada'; // fallback
}

async function criarAfastamento(data: AfastamentoInsert & { arquivo?: File }): Promise<Afastamento> {
  try {
    console.log("Criando afastamento via MCP:", data);

    let documento_url = null;
    let documento_nome = null;
    let documento_tamanho = null;

    // 1. Upload do arquivo para Supabase Storage (se fornecido)
    if (data.arquivo) {
      try {
        // TODO: Implementar upload real para Supabase Storage
        // Por ora vamos criar o afastamento sem documento
        console.log("Upload de arquivo será implementado na próxima iteração");
      } catch (uploadError) {
        console.error("Erro no upload do arquivo:", uploadError);
        throw new Error("Falha no upload do documento");
      }
    }

    // 2. Inserir afastamento na tabela usando MCP
    const insertQuery = `
      INSERT INTO afastamentos (
        funcionario_id, tipo_afastamento_id, data_inicio, data_fim,
        motivo, observacoes, documento_url, documento_nome,
        documento_tamanho_bytes, status, solicitado_por_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pendente', $10)
      RETURNING *
    `;

    const result = await (globalThis as any).mcp__supabase__execute_sql({
      query: insertQuery,
      params: [
        data.funcionario_id,
        data.tipo_afastamento_id,
        data.data_inicio,
        data.data_fim,
        data.motivo,
        data.observacoes || null,
        documento_url,
        documento_nome,
        documento_tamanho,
        data.usuario_cadastro_id
      ]
    });

    if (!result || result.length === 0) {
      throw new Error('Falha ao criar afastamento');
    }

    const afastamentoCriado = result[0];

    // 3. Buscar nomes e tipo para retorno completo
    const detalhes = await (globalThis as any).mcp__supabase__execute_sql({
      query: `
        SELECT
          f.nome as funcionario_nome,
          fu.nome as usuario_cadastro_nome,
          ta.nome as tipo_nome
        FROM funcionarios f, funcionarios fu, tipos_afastamento ta
        WHERE f.id = $1 AND fu.id = $2 AND ta.id = $3
      `,
      params: [data.funcionario_id, data.usuario_cadastro_id, data.tipo_afastamento_id]
    });

    const info = detalhes?.[0] || {
      funcionario_nome: '',
      usuario_cadastro_nome: '',
      tipo_nome: ''
    };

    // 4. Retornar afastamento completo
    return {
      id: afastamentoCriado.id,
      funcionario_id: afastamentoCriado.funcionario_id,
      funcionario_nome: info.funcionario_nome,
      tipo_afastamento: info.tipo_nome,
      data_inicio: afastamentoCriado.data_inicio,
      data_fim: afastamentoCriado.data_fim,
      total_dias: afastamentoCriado.total_dias,
      motivo: afastamentoCriado.motivo,
      observacoes: afastamentoCriado.observacoes,
      documento_anexo_url: afastamentoCriado.documento_url,
      documento_anexo_nome: afastamentoCriado.documento_nome,
      usuario_cadastro_id: afastamentoCriado.solicitado_por_id,
      usuario_cadastro_nome: info.usuario_cadastro_nome,
      ativo: afastamentoCriado.status === 'aprovado',
      created_at: afastamentoCriado.created_at,
      updated_at: afastamentoCriado.updated_at
    };

  } catch (error) {
    console.error("Erro ao criar afastamento via MCP:", error);
    throw error;
  }
}

async function deletarAjuste(ajusteId: string): Promise<void> {
  try {
    console.log("Deletando ajuste via MCP:", ajusteId);

    // Usar soft delete marcando como cancelado
    await (globalThis as any).mcp__supabase__execute_sql({
      query: `UPDATE ajustes_ponto SET status = 'cancelado' WHERE id = $1`,
      params: [ajusteId]
    });

  } catch (error) {
    console.error("Erro ao deletar ajuste via MCP:", error);
    throw error;
  }
}

// Hook específico para buscar funcionários ativos
export function useFuncionarios() {
  return useQuery({
    queryKey: ['funcionarios-ativos'],
    queryFn: async (): Promise<FuncionarioCompleto[]> => {
      try {
        const response = await (globalThis as any).mcp__supabase__execute_sql({
          query: `
            SELECT
              f.*,
              fn.id as funcao_id, fn.nome as funcao_nome,
              s.id as setor_id, s.nome as setor_nome
            FROM funcionarios f
            LEFT JOIN funcoes fn ON fn.id = f.funcao_id
            LEFT JOIN setores s ON s.id = fn.setor_id
            WHERE f.ativo = true
            ORDER BY f.nome
          `
        });

        return (response || []).map((row: any) => ({
          id: row.id,
          nome: row.nome,
          email: row.email,
          telefone: row.telefone,
          cpf: row.cpf,
          ctps: row.ctps,
          data_admissao: row.data_admissao,
          ativo: row.ativo,
          jornada_trabalho_id: row.jornada_trabalho_id,
          senha_ponto: row.senha_ponto,
          funcao: row.funcao_id ? {
            id: row.funcao_id,
            nome: row.funcao_nome,
            setor: row.setor_id ? {
              id: row.setor_id,
              nome: row.setor_nome
            } : undefined
          } : undefined
        }));
      } catch (error) {
        console.error("Erro ao buscar funcionários via MCP:", error);
        throw new Error("Falha ao carregar funcionários");
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}