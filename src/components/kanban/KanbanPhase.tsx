import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { KanbanCard } from './KanbanCard'
import type { KanbanPhase as KanbanPhaseType, KanbanCard as KanbanCardType } from '@/lib/types/kanban'

interface KanbanPhaseProps {
  phase: KanbanPhaseType
  cards: KanbanCardType[]
  onCardClick: (card: KanbanCardType) => void
}

export function KanbanPhase({ phase, cards, onCardClick }: KanbanPhaseProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: phase.id,
  })

  return (
    <div className="flex flex-col min-w-[320px] max-w-[320px]">
      <Card className={`flex flex-col h-full ${isOver ? 'ring-2 ring-primary' : ''}`}>
        <CardHeader className="pb-3" style={{ borderTop: `4px solid ${phase.cor}` }}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-card-foreground">
              {phase.nome}
            </CardTitle>
            <Badge variant="secondary" className="ml-2">
              {cards.length}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden">
          <div
            ref={setNodeRef}
            className="space-y-2 overflow-y-auto max-h-[calc(100vh-280px)] pr-2 custom-scrollbar"
          >
            <SortableContext
              items={cards.map(c => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {cards.map((card) => (
                <KanbanCard
                  key={card.id}
                  card={card}
                  onClick={() => onCardClick(card)}
                />
              ))}
            </SortableContext>
            
            {cards.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Nenhum lead nesta fase
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
