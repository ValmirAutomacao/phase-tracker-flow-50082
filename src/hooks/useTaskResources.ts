import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService, RecursoTarefa } from '@/services/projectService';
import { useToast } from '@/hooks/use-toast';

export function useTaskResources(tarefaId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar Recursos da Tarefa
  const { data: recursos = [], isLoading } = useQuery({
    queryKey: ['recursos_tarefa', tarefaId],
    queryFn: () => projectService.getRecursosTarefa(tarefaId!),
    enabled: !!tarefaId,
  });

  // Mutation: Adicionar Recurso
  const addRecursoMutation = useMutation({
    mutationFn: projectService.addRecursoTarefa,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recursos_tarefa', tarefaId] });
      toast({ title: "Recurso adicionado" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao adicionar recurso", description: error.message, variant: "destructive" });
    }
  });

  // Mutation: Remover Recurso
  const removeRecursoMutation = useMutation({
    mutationFn: projectService.removeRecursoTarefa,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recursos_tarefa', tarefaId] });
      toast({ title: "Recurso removido" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao remover recurso", description: error.message, variant: "destructive" });
    }
  });

  return {
    recursos,
    isLoading,
    addRecurso: addRecursoMutation.mutate,
    removeRecurso: removeRecursoMutation.mutate,
    isAdding: addRecursoMutation.isPending,
  };
}
