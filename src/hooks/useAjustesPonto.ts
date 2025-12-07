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

    // Usar SupabaseService em vez de MCP
    const { SupabaseService } = await import('@/lib/supabaseService');
    const supabaseService = new SupabaseService();

    // Buscar dados usando o serviço
    const ajustes = await supabaseService.getFromSupabase('ajustes_ponto') || [];
    const funcionarios = await supabaseService.getFromSupabase('FUNCIONARIOS') || [];

    // Aplicar filtros manualmente
    let response = ajustes.filter((aj: any) => aj.status === 'ativo');

    if (options.funcionario_id) {
      response = response.filter((aj: any) => aj.funcionario_id === options.funcionario_id);
    }

    if (options.data_inicio) {
      response = response.filter((aj: any) => aj.data_nova >= options.data_inicio);
    }

    if (options.data_fim) {
      response = response.filter((aj: any) => aj.data_nova <= options.data_fim);
    }

    // Enriquecer com dados de funcionários
    response = response.map((aj: any) => {
      const funcionario = funcionarios.find((f: any) => f.id === aj.funcionario_id);
      const usuarioAjuste = funcionarios.find((f: any) => f.id === aj.usuario_ajuste_id);

      return {
        ...aj,
        funcionario_nome: funcionario?.nome || 'N/A',
        usuario_ajuste_nome: usuarioAjuste?.nome || 'N/A'
      };
    }).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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

    // Usar SupabaseService em vez de MCP
    const { SupabaseService } = await import('@/lib/supabaseService');
    const supabaseService = new SupabaseService();

    // Buscar dados usando o serviço
    const afastamentos = await supabaseService.getFromSupabase('afastamentos') || [];
    const funcionarios = await supabaseService.getFromSupabase('FUNCIONARIOS') || [];
    const tiposAfastamento = await supabaseService.getFromSupabase('TIPOS_AFASTAMENTO') || [];

    // Aplicar filtros manualmente
    let response = afastamentos.filter((af: any) => ['pendente', 'aprovado'].includes(af.status));

    if (options.funcionario_id) {
      response = response.filter((af: any) => af.funcionario_id === options.funcionario_id);
    }

    if (options.data_inicio) {
      response = response.filter((af: any) => af.data_fim >= options.data_inicio);
    }

    if (options.data_fim) {
      response = response.filter((af: any) => af.data_inicio <= options.data_fim);
    }

    // Enriquecer com dados relacionados
    response = response.map((af: any) => {
      const funcionario = funcionarios.find((f: any) => f.id === af.funcionario_id);
      const usuario = funcionarios.find((f: any) => f.id === af.solicitado_por_id);
      const tipo = tiposAfastamento.find((t: any) => t.id === af.tipo_afastamento_id);

      return {
        ...af,
        funcionario_nome: funcionario?.nome || 'N/A',
        usuario_cadastro_nome: usuario?.nome || 'N/A',
        tipo_nome: tipo?.nome || 'N/A'
      };
    }).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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
    console.log("Criando ajuste de ponto:", data);

    const { SupabaseService } = await import('@/lib/supabaseService');
    const supabaseService = new SupabaseService();

    // 1. Validar se registro existe (para ajustes) - só se tiver registro_ponto_id
    if (data.registro_ponto_id) {
      const registrosPonto = await supabaseService.getFromSupabase('registros_ponto') || [];
      const registroValido = registrosPonto.find((r: any) =>
        r.id === data.registro_ponto_id && r.funcionario_id === data.funcionario_id
      );

      if (!registroValido) {
        throw new Error('Registro de ponto não encontrado ou não pertence ao funcionário');
      }
    }

    // 2. Inserir ajuste usando SupabaseService
    const novoAjuste = {
      registro_ponto_id: data.registro_ponto_id || null,
      funcionario_id: data.funcionario_id,
      tipo_registro_original: data.tipo_registro_original || null,
      hora_original: data.hora_original || null,
      data_original: data.data_original || null,
      tipo_registro_novo: data.tipo_registro_novo,
      hora_nova: data.hora_nova,
      data_nova: data.data_nova,
      justificativa_id: data.justificativa_id || null,
      justificativa_texto: data.justificativa_texto,
      documento_url: data.documento_url || null,
      usuario_ajuste_id: data.usuario_ajuste_id,
      status: 'ativo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const result = await supabaseService.addToSupabase('ajustes_ponto', novoAjuste);

    if (!result) {
      throw new Error('Falha ao criar ajuste de ponto');
    }

    const ajusteCriado = result;

    // 3. Buscar nomes para retorno completo
    const funcionarios = await supabaseService.getFromSupabase('FUNCIONARIOS') || [];

    const funcionario = funcionarios.find((f: any) => f.id === data.funcionario_id);
    const usuarioAjuste = funcionarios.find((f: any) => f.id === data.usuario_ajuste_id);

    const nomesInfo = {
      funcionario_nome: funcionario?.nome || '',
      usuario_ajuste_nome: usuarioAjuste?.nome || ''
    };

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

    // 2. Inserir afastamento usando SupabaseService
    const { SupabaseService } = await import('@/lib/supabaseService');
    const supabaseService = new SupabaseService();

    const novoAfastamento = {
      funcionario_id: data.funcionario_id,
      tipo_afastamento_id: data.tipo_afastamento_id,
      data_inicio: data.data_inicio,
      data_fim: data.data_fim,
      total_dias: Math.ceil((new Date(data.data_fim).getTime() - new Date(data.data_inicio).getTime()) / (1000 * 60 * 60 * 24)) + 1,
      motivo: data.motivo,
      observacoes: data.observacoes || null,
      documento_url: documento_url,
      documento_nome: documento_nome,
      documento_tamanho_bytes: documento_tamanho,
      status: 'pendente',
      solicitado_por_id: data.usuario_cadastro_id || data.funcionario_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const afastamentoCriado = await supabaseService.addToSupabase('afastamentos', novoAfastamento);

    if (!afastamentoCriado) {
      throw new Error('Falha ao criar afastamento');
    }

    // 3. Buscar dados para retorno completo
    const funcionarios = await supabaseService.getFromSupabase('FUNCIONARIOS') || [];
    const tiposAfastamento = await supabaseService.getFromSupabase('TIPOS_AFASTAMENTO') || [];

    const funcionario = funcionarios.find((f: any) => f.id === data.funcionario_id);
    const usuario = funcionarios.find((f: any) => f.id === (data.usuario_cadastro_id || data.funcionario_id));
    const tipo = tiposAfastamento.find((t: any) => t.id === data.tipo_afastamento_id);

    const info = {
      funcionario_nome: funcionario?.nome || '',
      usuario_cadastro_nome: usuario?.nome || '',
      tipo_nome: tipo?.nome || ''
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
    console.log("Deletando ajuste:", ajusteId);

    const { SupabaseService } = await import('@/lib/supabaseService');
    const supabaseService = new SupabaseService();

    // Usar soft delete marcando como cancelado
    await supabaseService.updateInSupabase('ajustes_ponto', ajusteId, {
      status: 'cancelado',
      updated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error("Erro ao deletar ajuste:", error);
    throw error;
  }
}

// Hook específico para buscar funcionários ativos
export function useFuncionarios() {
  return useQuery({
    queryKey: ['funcionarios-ativos'],
    queryFn: async (): Promise<FuncionarioCompleto[]> => {
      try {
        const { SupabaseService } = await import('@/lib/supabaseService');
        const supabaseService = new SupabaseService();

        const funcionarios = await supabaseService.getFromSupabase('FUNCIONARIOS') || [];
        const funcoes = await supabaseService.getFromSupabase('FUNCOES') || [];
        const setores = await supabaseService.getFromSupabase('SETORES') || [];

        const funcionariosAtivos = funcionarios.filter((f: any) => f.ativo);

        const response = funcionariosAtivos.map((f: any) => {
          const funcao = funcoes.find((fn: any) => fn.id === f.funcao_id);
          const setor = setores.find((s: any) => s.id === funcao?.setor_id);

          return {
            ...f,
            funcao_id: funcao?.id || null,
            funcao_nome: funcao?.nome || null,
            setor_id: setor?.id || null,
            setor_nome: setor?.nome || null
          };
        }).sort((a: any, b: any) => a.nome.localeCompare(b.nome));

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