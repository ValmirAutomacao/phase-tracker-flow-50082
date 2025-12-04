// ============================================================
// HOOKS REACT QUERY - SISTEMA CRONOGRAMAS
// ============================================================
// Descrição: Hooks React Query para gerenciamento de estado e cache
// do sistema de cronogramas (Gantt)
// Data: 2024-12-03
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
} from '@/types/cronogramas';
import {
  CronogramasService,
  EAPService,
  DependenciasService,
  AlocacoesService,
  BaselinesService,
  CalendariosService,
  RecursosService,
} from '@/services/cronogramasService';

// ============================================================
// QUERY KEYS
// ============================================================

export const cronogramaQueryKeys = {
  all: ['cronogramas'] as const,
  lists: () => [...cronogramaQueryKeys.all, 'list'] as const,
  list: (filters: CronogramaFilters) => [...cronogramaQueryKeys.lists(), { filters }] as const,
  details: () => [...cronogramaQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...cronogramaQueryKeys.details(), id] as const,

  // EAP
  eapItems: (cronogramaId: string) => [...cronogramaQueryKeys.detail(cronogramaId), 'eap'] as const,

  // Dependências
  dependencias: (cronogramaId: string) => [...cronogramaQueryKeys.detail(cronogramaId), 'dependencias'] as const,

  // Alocações
  alocacoes: (atividadeId: string) => ['alocacoes', 'atividade', atividadeId] as const,

  // Baselines
  baselines: (cronogramaId: string) => [...cronogramaQueryKeys.detail(cronogramaId), 'baselines'] as const,

  // Recursos auxiliares
  calendarios: ['calendarios'] as const,
  recursos: ['recursos'] as const,
  tiposRecursos: ['tipos-recursos'] as const,
};

// ============================================================
// HOOKS CRONOGRAMAS PRINCIPAIS
// ============================================================

// Listar cronogramas
export function useCronogramas(filters?: CronogramaFilters) {
  return useQuery({
    queryKey: cronogramaQueryKeys.list(filters || {}),
    queryFn: () => CronogramasService.listar(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Buscar cronograma específico
export function useCronograma(id: string, enabled = true) {
  return useQuery({
    queryKey: cronogramaQueryKeys.detail(id),
    queryFn: () => CronogramasService.buscarPorId(id),
    enabled: enabled && !!id,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

// Criar cronograma
export function useCreateCronograma() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CronogramaCreateRequest) => CronogramasService.criar(data),
    onSuccess: (cronograma) => {
      // Invalidar lista de cronogramas
      queryClient.invalidateQueries({ queryKey: cronogramaQueryKeys.lists() });

      // Adicionar ao cache de detalhes
      queryClient.setQueryData(
        cronogramaQueryKeys.detail(cronograma.id),
        cronograma
      );

      toast.success('Cronograma criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar cronograma:', error);
      toast.error('Falha ao criar cronograma. Tente novamente.');
    },
  });
}

// Atualizar cronograma
export function useUpdateCronograma() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CronogramaUpdateRequest }) =>
      CronogramasService.atualizar(id, data),
    onSuccess: (cronograma, { id }) => {
      // Atualizar cache de detalhes
      queryClient.setQueryData(
        cronogramaQueryKeys.detail(id),
        cronograma
      );

      // Invalidar lista de cronogramas
      queryClient.invalidateQueries({ queryKey: cronogramaQueryKeys.lists() });

      toast.success('Cronograma atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar cronograma:', error);
      toast.error('Falha ao atualizar cronograma. Tente novamente.');
    },
  });
}

// Excluir cronograma
export function useDeleteCronograma() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => CronogramasService.excluir(id),
    onSuccess: (_, id) => {
      // Remover do cache de detalhes
      queryClient.removeQueries({ queryKey: cronogramaQueryKeys.detail(id) });

      // Invalidar lista de cronogramas
      queryClient.invalidateQueries({ queryKey: cronogramaQueryKeys.lists() });

      toast.success('Cronograma excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir cronograma:', error);
      toast.error('Falha ao excluir cronograma. Tente novamente.');
    },
  });
}

// ============================================================
// HOOKS EAP/WBS
// ============================================================

// Listar itens da EAP
export function useEAPItems(cronogramaId: string, filters?: EAPItemFilters) {
  return useQuery({
    queryKey: [...cronogramaQueryKeys.eapItems(cronogramaId), { filters }],
    queryFn: () => EAPService.listarPorCronograma(cronogramaId, filters),
    enabled: !!cronogramaId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

// Criar item da EAP
export function useCreateEAPItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EAPItemCreateRequest) => EAPService.criarItem(data),
    onSuccess: (item) => {
      // Invalidar itens da EAP do cronograma
      queryClient.invalidateQueries({
        queryKey: cronogramaQueryKeys.eapItems(item.cronograma_id),
      });

      toast.success('Item adicionado à EAP com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar item EAP:', error);
      toast.error('Falha ao adicionar item à EAP. Tente novamente.');
    },
  });
}

// Atualizar item da EAP
export function useUpdateEAPItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EAPItemUpdateRequest }) =>
      EAPService.atualizarItem(id, data),
    onSuccess: (item) => {
      // Invalidar itens da EAP do cronograma
      queryClient.invalidateQueries({
        queryKey: cronogramaQueryKeys.eapItems(item.cronograma_id),
      });

      toast.success('Item da EAP atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar item EAP:', error);
      toast.error('Falha ao atualizar item da EAP. Tente novamente.');
    },
  });
}

// Excluir item da EAP
export function useDeleteEAPItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, cronogramaId }: { id: string; cronogramaId: string }) =>
      EAPService.excluirItem(id),
    onSuccess: (_, { cronogramaId }) => {
      // Invalidar itens da EAP do cronograma
      queryClient.invalidateQueries({
        queryKey: cronogramaQueryKeys.eapItems(cronogramaId),
      });

      toast.success('Item removido da EAP com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir item EAP:', error);
      toast.error('Falha ao remover item da EAP. Tente novamente.');
    },
  });
}

// ============================================================
// HOOKS DEPENDÊNCIAS
// ============================================================

// Listar dependências
export function useDependencias(cronogramaId: string) {
  return useQuery({
    queryKey: cronogramaQueryKeys.dependencias(cronogramaId),
    queryFn: () => DependenciasService.listarPorCronograma(cronogramaId),
    enabled: !!cronogramaId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

// Criar dependência
export function useCreateDependencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DependenciaCreateRequest) =>
      DependenciasService.criarDependencia(data),
    onSuccess: async (dependencia) => {
      // Precisamos buscar o cronograma_id através das atividades
      // Por enquanto, invalidamos todas as dependências
      queryClient.invalidateQueries({
        queryKey: ['cronogramas'],
        predicate: (query) =>
          query.queryKey.includes('dependencias'),
      });

      toast.success('Dependência criada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar dependência:', error);
      if (error.message.includes('circular')) {
        toast.error('Não é possível criar esta dependência: causaria um ciclo no cronograma.');
      } else {
        toast.error('Falha ao criar dependência. Tente novamente.');
      }
    },
  });
}

// Excluir dependência
export function useDeleteDependencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, cronogramaId }: { id: string; cronogramaId: string }) =>
      DependenciasService.excluirDependencia(id),
    onSuccess: (_, { cronogramaId }) => {
      // Invalidar dependências do cronograma
      queryClient.invalidateQueries({
        queryKey: cronogramaQueryKeys.dependencias(cronogramaId),
      });

      toast.success('Dependência removida com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir dependência:', error);
      toast.error('Falha ao remover dependência. Tente novamente.');
    },
  });
}

// ============================================================
// HOOKS ALOCAÇÕES DE RECURSOS
// ============================================================

// Listar alocações por atividade
export function useAlocacoes(atividadeId: string) {
  return useQuery({
    queryKey: cronogramaQueryKeys.alocacoes(atividadeId),
    queryFn: () => AlocacoesService.listarPorAtividade(atividadeId),
    enabled: !!atividadeId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

// Criar alocação
export function useCreateAlocacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AlocacaoCreateRequest) =>
      AlocacoesService.criarAlocacao(data),
    onSuccess: (alocacao) => {
      // Invalidar alocações da atividade
      queryClient.invalidateQueries({
        queryKey: cronogramaQueryKeys.alocacoes(alocacao.atividade_id),
      });

      toast.success('Recurso alocado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar alocação:', error);
      if (error.message.includes('sobrealoca')) {
        toast.error('Recurso já está sobrealcoado no período especificado.');
      } else {
        toast.error('Falha ao alocar recurso. Tente novamente.');
      }
    },
  });
}

// Excluir alocação
export function useDeleteAlocacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, atividadeId }: { id: string; atividadeId: string }) =>
      AlocacoesService.excluirAlocacao(id),
    onSuccess: (_, { atividadeId }) => {
      // Invalidar alocações da atividade
      queryClient.invalidateQueries({
        queryKey: cronogramaQueryKeys.alocacoes(atividadeId),
      });

      toast.success('Alocação removida com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir alocação:', error);
      toast.error('Falha ao remover alocação. Tente novamente.');
    },
  });
}

// ============================================================
// HOOKS BASELINES
// ============================================================

// Listar baselines
export function useBaselines(cronogramaId: string) {
  return useQuery({
    queryKey: cronogramaQueryKeys.baselines(cronogramaId),
    queryFn: () => BaselinesService.listarPorCronograma(cronogramaId),
    enabled: !!cronogramaId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Criar baseline
export function useCreateBaseline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BaselineCreateRequest) =>
      BaselinesService.criarBaseline(data),
    onSuccess: (baseline) => {
      // Invalidar baselines do cronograma
      queryClient.invalidateQueries({
        queryKey: cronogramaQueryKeys.baselines(baseline.cronograma_id),
      });

      toast.success('Baseline criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar baseline:', error);
      toast.error('Falha ao criar baseline. Tente novamente.');
    },
  });
}

// Ativar baseline
export function useActivateBaseline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ baselineId, cronogramaId }: { baselineId: string; cronogramaId: string }) =>
      BaselinesService.ativarBaseline(baselineId),
    onSuccess: (_, { cronogramaId }) => {
      // Invalidar baselines do cronograma
      queryClient.invalidateQueries({
        queryKey: cronogramaQueryKeys.baselines(cronogramaId),
      });

      toast.success('Baseline ativado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao ativar baseline:', error);
      toast.error('Falha ao ativar baseline. Tente novamente.');
    },
  });
}

// ============================================================
// HOOKS RECURSOS AUXILIARES
// ============================================================

// Listar calendários de trabalho
export function useCalendarios() {
  return useQuery({
    queryKey: cronogramaQueryKeys.calendarios,
    queryFn: () => CalendariosService.listar(),
    staleTime: 15 * 60 * 1000, // 15 minutos
  });
}

// Listar recursos da empresa
export function useRecursos() {
  return useQuery({
    queryKey: cronogramaQueryKeys.recursos,
    queryFn: () => RecursosService.listar(),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

// Listar tipos de recursos
export function useTiposRecursos() {
  return useQuery({
    queryKey: cronogramaQueryKeys.tiposRecursos,
    queryFn: () => RecursosService.listarTipos(),
    staleTime: 30 * 60 * 1000, // 30 minutos
  });
}

// ============================================================
// HOOKS COMPOSTOS PARA PÁGINAS ESPECÍFICAS
// ============================================================

// Hook composto para página de cronograma
export function useCronogramaPage(cronogramaId: string) {
  const cronograma = useCronograma(cronogramaId);
  const eapItems = useEAPItems(cronogramaId);
  const dependencias = useDependencias(cronogramaId);
  const baselines = useBaselines(cronogramaId);

  return {
    cronograma,
    eapItems,
    dependencias,
    baselines,
    isLoading: cronograma.isLoading || eapItems.isLoading,
    error: cronograma.error || eapItems.error,
  };
}

// Hook para recursos necessários na criação de cronogramas
export function useCronogramaFormData() {
  const calendarios = useCalendarios();
  const recursos = useRecursos();
  const tiposRecursos = useTiposRecursos();

  return {
    calendarios,
    recursos,
    tiposRecursos,
    isLoading: calendarios.isLoading || recursos.isLoading || tiposRecursos.isLoading,
    error: calendarios.error || recursos.error || tiposRecursos.error,
  };
}

// ============================================================
// UTILS PARA INVALIDAÇÃO EM LOTE
// ============================================================

export function useInvalidateCronogramaQueries() {
  const queryClient = useQueryClient();

  return {
    // Invalidar todas as queries relacionadas a cronogramas
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: cronogramaQueryKeys.all });
    },

    // Invalidar queries de um cronograma específico
    invalidateCronograma: (cronogramaId: string) => {
      queryClient.invalidateQueries({
        queryKey: cronogramaQueryKeys.detail(cronogramaId)
      });
    },

    // Invalidar listas de cronogramas
    invalidateLists: () => {
      queryClient.invalidateQueries({ queryKey: cronogramaQueryKeys.lists() });
    },
  };
}