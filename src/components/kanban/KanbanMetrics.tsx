import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, DollarSign, Target, Activity } from 'lucide-react'
import type { KanbanCard, KanbanPhase } from '@/lib/types/kanban'

interface KanbanMetricsProps {
  cards: KanbanCard[]
  phases: KanbanPhase[]
}

export function KanbanMetrics({ cards, phases }: KanbanMetricsProps) {
  const totalLeads = cards.length
  
  const valorTotalNegociacao = cards
    .filter(card => {
      const phase = phases.find(p => p.id === card.phase_id)
      return phase?.nome === 'Negociação'
    })
    .reduce((sum, card) => sum + (card.valor_estimado || 0), 0)

  const leadsFechados = cards.filter(card => {
    const phase = phases.find(p => p.id === card.phase_id)
    return phase?.nome === 'Fechado'
  }).length

  const taxaConversao = totalLeads > 0 
    ? ((leadsFechados / totalLeads) * 100).toFixed(1)
    : '0.0'

  const leadsAtivos = cards.filter(card => {
    const phase = phases.find(p => p.id === card.phase_id)
    return !['Fechado', 'Perdido'].includes(phase?.nome || '')
  }).length

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total de Leads
          </CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalLeads}</div>
          <p className="text-xs text-muted-foreground">
            {leadsAtivos} ativos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Em Negociação
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(valorTotalNegociacao)}</div>
          <p className="text-xs text-muted-foreground">
            Valor estimado
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Taxa de Conversão
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{taxaConversao}%</div>
          <p className="text-xs text-muted-foreground">
            {leadsFechados} fechados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Leads Ativos
          </CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{leadsAtivos}</div>
          <p className="text-xs text-muted-foreground">
            Aguardando ação
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
