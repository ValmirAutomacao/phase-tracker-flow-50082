import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import type { KanbanBoard, KanbanPhase, KanbanCard, CreateCardInput, UpdateCardInput, KanbanCardActivity } from '@/lib/types/kanban'

const KANBAN_KEYS = {
  boards: 'kanban_boards',
  phases: 'kanban_phases',
  cards: 'kanban_cards',
  activities: 'kanban_card_activities'
}

// Hook para buscar boards
export function useKanbanBoards() {
  return useQuery({
    queryKey: [KANBAN_KEYS.boards],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kanban_boards')
        .select('*')
        .eq('ativo', true)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as KanbanBoard[]
    }
  })
}

// Hook para buscar fases de um board
export function useKanbanPhases(boardId: string | undefined) {
  return useQuery({
    queryKey: [KANBAN_KEYS.phases, boardId],
    queryFn: async () => {
      if (!boardId) return []
      
      const { data, error } = await supabase
        .from('kanban_phases')
        .select('*')
        .eq('board_id', boardId)
        .order('ordem', { ascending: true })
      
      if (error) throw error
      return data as KanbanPhase[]
    },
    enabled: !!boardId
  })
}

// Hook para buscar cards de um board
export function useKanbanCards(boardId: string | undefined) {
  return useQuery({
    queryKey: [KANBAN_KEYS.cards, boardId],
    queryFn: async () => {
      if (!boardId) return []
      
      const { data, error } = await supabase
        .from('kanban_cards')
        .select('*')
        .eq('board_id', boardId)
        .order('ordem', { ascending: true })
      
      if (error) throw error
      return data as KanbanCard[]
    },
    enabled: !!boardId
  })
}

// Hook para buscar atividades de um card
export function useCardActivities(cardId: string | undefined) {
  return useQuery({
    queryKey: [KANBAN_KEYS.activities, cardId],
    queryFn: async () => {
      if (!cardId) return []
      
      const { data, error } = await supabase
        .from('kanban_card_activities')
        .select('*')
        .eq('card_id', cardId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as KanbanCardActivity[]
    },
    enabled: !!cardId
  })
}

// Hook para criar card
export function useCreateCard() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: CreateCardInput) => {
      const { data, error } = await supabase
        .from('kanban_cards')
        .insert({
          ...input,
          origem: input.origem || 'manual',
          tags: input.tags || []
        })
        .select()
        .single()
      
      if (error) throw error
      
      // Registrar atividade
      await supabase
        .from('kanban_card_activities')
        .insert([{
          card_id: data.id,
          tipo: 'criado',
          descricao: `Card criado manualmente`
        }])
      
      return data as KanbanCard
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [KANBAN_KEYS.cards, variables.board_id] })
      toast.success('Lead criado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar lead: ' + error.message)
    }
  })
}

// Hook para atualizar card
export function useUpdateCard() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, boardId, updates }: { id: string; boardId: string; updates: UpdateCardInput }) => {
      const { data, error } = await supabase
        .from('kanban_cards')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      // Registrar atividade
      await supabase
        .from('kanban_card_activities')
        .insert([{
          card_id: id,
          tipo: 'editado',
          descricao: `Card atualizado`
        }])
      
      return data as KanbanCard
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [KANBAN_KEYS.cards, variables.boardId] })
      toast.success('Lead atualizado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar lead: ' + error.message)
    }
  })
}

// Hook para mover card entre fases
export function useMoveCard() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      cardId, 
      boardId,
      newPhaseId, 
      newOrder,
      oldPhaseName,
      newPhaseName
    }: { 
      cardId: string
      boardId: string
      newPhaseId: string
      newOrder: number
      oldPhaseName: string
      newPhaseName: string
    }) => {
      const { data, error } = await supabase
        .from('kanban_cards')
        .update({ phase_id: newPhaseId, ordem: newOrder })
        .eq('id', cardId)
        .select()
        .single()
      
      if (error) throw error
      
      // Registrar atividade
      await supabase
        .from('kanban_card_activities')
        .insert([{
          card_id: cardId,
          tipo: 'movido',
          descricao: `Card movido de "${oldPhaseName}" para "${newPhaseName}"`
        }])
      
      return data as KanbanCard
    },
    onMutate: async ({ cardId, boardId, newPhaseId, newOrder }) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: [KANBAN_KEYS.cards, boardId] })
      
      // Snapshot do estado anterior
      const previousCards = queryClient.getQueryData<KanbanCard[]>([KANBAN_KEYS.cards, boardId])
      
      // Update otimista
      if (previousCards) {
        queryClient.setQueryData<KanbanCard[]>(
          [KANBAN_KEYS.cards, boardId],
          previousCards.map(card => 
            card.id === cardId 
              ? { ...card, phase_id: newPhaseId, ordem: newOrder }
              : card
          )
        )
      }
      
      return { previousCards }
    },
    onError: (error: Error, variables, context) => {
      // Reverter em caso de erro
      if (context?.previousCards) {
        queryClient.setQueryData([KANBAN_KEYS.cards, variables.boardId], context.previousCards)
      }
      toast.error('Erro ao mover card: ' + error.message)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [KANBAN_KEYS.cards, variables.boardId] })
    }
  })
}

// Hook para deletar card
export function useDeleteCard() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, boardId }: { id: string; boardId: string }) => {
      const { error } = await supabase
        .from('kanban_cards')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [KANBAN_KEYS.cards, variables.boardId] })
      toast.success('Lead removido com sucesso!')
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover lead: ' + error.message)
    }
  })
}
