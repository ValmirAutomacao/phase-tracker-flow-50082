import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cronogramaGanttService, TarefaGantt } from '@/services/cronogramaGanttService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useCronogramaGantt(cronogramaId: string) {
  const queryClient = useQueryClient();

  // Buscar cronograma
  const { data: cronograma, isLoading: isLoadingCronograma } = useQuery({
    queryKey: ['cronograma-detail', cronogramaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cronogramas')
        .select('*, obras(nome), calendarios_trabalho(nome)')
        .eq('id', cronogramaId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!cronogramaId,
  });

  // Buscar tarefas (eap_itens)
  const { data: tarefas = [], isLoading: isLoadingTarefas } = useQuery({
    queryKey: ['tarefas-gantt', cronogramaId],
    queryFn: () => cronogramaGanttService.getTarefas(cronogramaId),
    enabled: !!cronogramaId,
  });

  // Buscar dependências
  const { data: dependencies = [], isLoading: isLoadingDeps } = useQuery({
    queryKey: ['dependencies-gantt', cronogramaId],
    queryFn: async () => {
      const deps = await cronogramaGanttService.getDependencias(cronogramaId);
      return deps.map(d => ({
        id: d.id,
        fromTaskId: d.atividade_predecessora_id,
        toTaskId: d.atividade_sucessora_id,
        type: d.tipo,
        lag: d.defasagem_horas || 0
      }));
    },
    enabled: !!cronogramaId,
  });

  // Criar tarefa
  const createTarefaMutation = useMutation({
    mutationFn: cronogramaGanttService.createTarefa,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas-gantt', cronogramaId] });
      toast.success("Tarefa criada com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar tarefa: " + error.message);
    }
  });

  // Atualizar tarefa
  const updateTarefaMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TarefaGantt> }) => 
      cronogramaGanttService.updateTarefa(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas-gantt', cronogramaId] });
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar tarefa: " + error.message);
    }
  });

  // Deletar tarefa
  const deleteTarefaMutation = useMutation({
    mutationFn: cronogramaGanttService.deleteTarefa,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas-gantt', cronogramaId] });
      queryClient.invalidateQueries({ queryKey: ['dependencies-gantt', cronogramaId] });
      toast.success("Tarefa excluída");
    },
    onError: (error: Error) => {
      toast.error("Erro ao excluir tarefa: " + error.message);
    }
  });

  // Criar dependência
  const createDependencyMutation = useMutation({
    mutationFn: async ({ fromId, toId, type }: { fromId: string; toId: string; type: string }) => {
      return cronogramaGanttService.addDependencia(fromId, toId, type, 0);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dependencies-gantt', cronogramaId] });
      toast.success("Dependência criada");
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar dependência: " + error.message);
    }
  });

  // Deletar dependência
  const deleteDependencyMutation = useMutation({
    mutationFn: cronogramaGanttService.removeDependencia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dependencies-gantt', cronogramaId] });
      toast.success("Dependência removida");
    },
    onError: (error: Error) => {
      toast.error("Erro ao remover dependência: " + error.message);
    }
  });

  return {
    cronograma,
    tarefas,
    dependencies,
    isLoading: isLoadingCronograma || isLoadingTarefas || isLoadingDeps,
    createTarefa: createTarefaMutation.mutate,
    updateTarefa: updateTarefaMutation.mutate,
    deleteTarefa: deleteTarefaMutation.mutate,
    createDependency: createDependencyMutation.mutate,
    deleteDependency: deleteDependencyMutation.mutate,
  };
}
