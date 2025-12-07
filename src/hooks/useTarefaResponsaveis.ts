import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TarefaResponsavel {
  id: string;
  tarefa_id: string;
  funcionario_id: string;
  papel: string;
  observacoes?: string;
  criado_em?: string;
  funcionario?: {
    id: string;
    nome: string;
    email?: string;
    funcao?: { nome: string };
  };
}

export function useTarefaResponsaveis(tarefaId: string | null) {
  const queryClient = useQueryClient();

  // Buscar responsáveis da tarefa
  const { data: responsaveis = [], isLoading } = useQuery({
    queryKey: ['tarefa-responsaveis', tarefaId],
    queryFn: async () => {
      if (!tarefaId) return [];
      
      const { data, error } = await supabase
        .from('tarefa_responsaveis')
        .select(`
          id,
          tarefa_id,
          funcionario_id,
          papel,
          observacoes,
          criado_em,
          funcionarios:funcionario_id (
            id,
            nome,
            email,
            funcoes:funcao_id (nome)
          )
        `)
        .eq('tarefa_id', tarefaId);

      if (error) throw error;

      return (data || []).map((item: any) => ({
        ...item,
        funcionario: item.funcionarios ? {
          id: item.funcionarios.id,
          nome: item.funcionarios.nome,
          email: item.funcionarios.email,
          funcao: item.funcionarios.funcoes
        } : null
      })) as TarefaResponsavel[];
    },
    enabled: !!tarefaId,
  });

  // Adicionar responsável
  const addResponsavelMutation = useMutation({
    mutationFn: async ({ funcionarioId, papel = 'responsavel' }: { funcionarioId: string; papel?: string }) => {
      if (!tarefaId) throw new Error('Tarefa não selecionada');
      
      const { data, error } = await supabase
        .from('tarefa_responsaveis')
        .insert({
          tarefa_id: tarefaId,
          funcionario_id: funcionarioId,
          papel
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefa-responsaveis', tarefaId] });
      toast.success('Responsável adicionado');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.error('Este funcionário já é responsável por esta tarefa');
      } else {
        toast.error('Erro ao adicionar responsável: ' + error.message);
      }
    }
  });

  // Remover responsável
  const removeResponsavelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tarefa_responsaveis')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefa-responsaveis', tarefaId] });
      toast.success('Responsável removido');
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover responsável: ' + error.message);
    }
  });

  return {
    responsaveis,
    isLoading,
    addResponsavel: addResponsavelMutation.mutate,
    removeResponsavel: removeResponsavelMutation.mutate,
    isAdding: addResponsavelMutation.isPending,
    isRemoving: removeResponsavelMutation.isPending,
  };
}
