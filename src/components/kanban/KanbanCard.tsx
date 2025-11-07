import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GripVertical, Mail, Phone, Building2, DollarSign } from 'lucide-react'
import type { KanbanCard as KanbanCardType } from '@/lib/types/kanban'

interface KanbanCardProps {
  card: KanbanCardType
  onClick: () => void
}

export function KanbanCard({ card, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const formatCurrency = (value: number | null) => {
    if (!value) return 'N/A'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow bg-card border-border"
        onClick={onClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-semibold text-card-foreground line-clamp-2">
                {card.titulo || card.cliente_nome}
              </CardTitle>
            </div>
            <button
              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
              {...attributes}
              {...listeners}
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-2">
          <div className="text-sm font-medium text-foreground">
            {card.cliente_nome}
          </div>
          
          {card.cliente_empresa && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3" />
              <span className="truncate">{card.cliente_empresa}</span>
            </div>
          )}
          
          {card.cliente_email && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="truncate">{card.cliente_email}</span>
            </div>
          )}
          
          {card.cliente_telefone && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{card.cliente_telefone}</span>
            </div>
          )}
          
          {card.valor_estimado && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <DollarSign className="h-3 w-3" />
              <span>{formatCurrency(card.valor_estimado)}</span>
            </div>
          )}
          
          <div className="flex flex-wrap gap-1 pt-1">
            <Badge variant="secondary" className="text-xs">
              {card.origem}
            </Badge>
            {card.tags && card.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
