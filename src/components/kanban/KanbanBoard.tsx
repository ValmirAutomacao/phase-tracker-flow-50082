import { useState, useMemo, useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { KanbanPhase } from './KanbanPhase'
import { KanbanCard } from './KanbanCard'
import { CardModal } from './CardModal'
import { CreateCardModal } from './CreateCardModal'
import { Button } from '@/components/ui/button'
import { Plus, Loader2 } from 'lucide-react'
import { useKanbanPhases, useKanbanCards, useMoveCard } from '@/hooks/useKanban'
import { supabase } from '@/integrations/supabase/client'
import type { KanbanCard as KanbanCardType } from '@/lib/types/kanban'

interface KanbanBoardProps {
  boardId: string
}

export function KanbanBoard({ boardId }: KanbanBoardProps) {
  const [activeCard, setActiveCard] = useState<KanbanCardType | null>(null)
  const [selectedCard, setSelectedCard] = useState<KanbanCardType | null>(null)
  const [createModalPhaseId, setCreateModalPhaseId] = useState<string | null>(null)

  const { data: phases = [], isLoading: phasesLoading } = useKanbanPhases(boardId)
  const { data: cards = [], isLoading: cardsLoading } = useKanbanCards(boardId)
  const moveCard = useMoveCard()

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('kanban-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kanban_cards',
          filter: `board_id=eq.${boardId}`
        },
        () => {
          // Refetch será automático via React Query invalidation
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [boardId])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const cardsByPhase = useMemo(() => {
    const grouped: Record<string, KanbanCardType[]> = {}
    phases.forEach(phase => {
      grouped[phase.id] = cards
        .filter(card => card.phase_id === phase.id)
        .sort((a, b) => a.ordem - b.ordem)
    })
    return grouped
  }, [cards, phases])

  const handleDragStart = (event: DragStartEvent) => {
    const card = cards.find(c => c.id === event.active.id)
    setActiveCard(card || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCard(null)

    if (!over) return

    const cardId = active.id as string
    const newPhaseId = over.id as string
    const card = cards.find(c => c.id === cardId)
    const oldPhase = phases.find(p => p.id === card?.phase_id)
    const newPhase = phases.find(p => p.id === newPhaseId)

    if (!card || !oldPhase || !newPhase || card.phase_id === newPhaseId) return

    // Calcular nova ordem
    const cardsInNewPhase = cardsByPhase[newPhaseId] || []
    const newOrder = cardsInNewPhase.length

    moveCard.mutate({
      cardId,
      boardId,
      newPhaseId,
      newOrder,
      oldPhaseName: oldPhase.nome,
      newPhaseName: newPhase.nome
    })
  }

  if (phasesLoading || cardsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
          {phases.map((phase) => (
            <div key={phase.id} className="flex flex-col gap-2">
              <KanbanPhase
                phase={phase}
                cards={cardsByPhase[phase.id] || []}
                onCardClick={setSelectedCard}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateModalPhaseId(phase.id)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Lead
              </Button>
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeCard ? (
            <div className="opacity-50">
              <KanbanCard card={activeCard} onClick={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <CardModal
        card={selectedCard}
        boardId={boardId}
        open={!!selectedCard}
        onClose={() => setSelectedCard(null)}
      />

      <CreateCardModal
        boardId={boardId}
        phaseId={createModalPhaseId || phases[0]?.id || ''}
        open={!!createModalPhaseId}
        onClose={() => setCreateModalPhaseId(null)}
      />
    </>
  )
}
