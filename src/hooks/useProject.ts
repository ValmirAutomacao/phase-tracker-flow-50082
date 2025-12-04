import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService, Tarefa, Cronograma } from '@/services/projectService';
import { useToast } from '@/hooks/use-toast';

export function useProject(obraId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 1. Buscar Cronograma Ativo
  const { data: cronograma, isLoading: isLoadingCronograma } = useQuery({
    queryKey: ['cronograma', obraId],
    queryFn: () => projectService.getOrCreateCronograma(obraId),
    enabled: !!obraId,
  });

  // 2. Buscar Tarefas do Cronograma
  const { data: tarefas = [], isLoading: isLoadingTarefas } = useQuery({
    queryKey: ['tarefas', cronograma?.id],
    queryFn: () => projectService.getTarefas(cronograma!.id),
    enabled: !!cronograma?.id,
  });

  // Mutations
  const createTarefaMutation = useMutation({
    mutationFn: projectService.createTarefa,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas', cronograma?.id] });
      toast({ title: "Tarefa criada com sucesso" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao criar tarefa", description: error.message, variant: "destructive" });
    }
  });

  const updateTarefaMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Tarefa> }) => 
      projectService.updateTarefa(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas', cronograma?.id] });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar tarefa", description: error.message, variant: "destructive" });
    }
  });

  const deleteTarefaMutation = useMutation({
    mutationFn: projectService.deleteTarefa,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas', cronograma?.id] });
      toast({ title: "Tarefa excluída" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao excluir tarefa", description: error.message, variant: "destructive" });
    }
  });

  return {
    cronograma,
    tarefas,
    isLoading: isLoadingCronograma || isLoadingTarefas,
    createTarefa: createTarefaMutation.mutate,
    updateTarefa: updateTarefaMutation.mutate,
    deleteTarefa: deleteTarefaMutation.mutate,
  };
}
