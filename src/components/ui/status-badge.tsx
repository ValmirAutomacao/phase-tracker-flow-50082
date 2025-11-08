import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react"

interface StatusBadgeProps {
  status: string
  variant?: 'with-icon' | 'simple'
}

export const StatusBadge = ({ status, variant = 'with-icon' }: StatusBadgeProps) => {
  const statusConfig = {
    // Status de requisições
    pendente: {
      label: "Pendente",
      className: "status-badge-pendente",
      icon: Clock
    },
    aprovada: {
      label: "Aprovada",
      className: "status-badge-aprovada",
      icon: CheckCircle
    },
    aberta: {
      label: "Aberta",
      className: "status-badge-aberta",
      icon: AlertTriangle
    },
    concluida: {
      label: "Concluída",
      className: "status-badge-concluida",
      icon: CheckCircle
    },
    cancelada: {
      label: "Cancelada",
      className: "status-badge-cancelada",
      icon: XCircle
    },

    // Status de despesas
    validado: {
      label: "Validado",
      className: "status-badge-validado",
      icon: CheckCircle
    },
    rejeitado: {
      label: "Rejeitado",
      className: "status-badge-rejeitado",
      icon: XCircle
    },

    // Status de obras
    'em-andamento': {
      label: "Em Andamento",
      className: "status-badge-aberta",
      icon: Clock
    },
    'em-dia': {
      label: "Em Dia",
      className: "status-badge-validado",
      icon: CheckCircle
    },
    atrasado: {
      label: "Atrasado",
      className: "status-badge-rejeitado",
      icon: AlertTriangle
    },
  }

  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    className: "status-badge-pendente",
    icon: Clock
  }

  const IconComponent = config.icon

  if (variant === 'simple') {
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    )
  }

  return (
    <Badge className={config.className}>
      <IconComponent className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  )
}

interface PriorityBadgeProps {
  priority: string
}

export const PriorityBadge = ({ priority }: PriorityBadgeProps) => {
  const priorityConfig = {
    baixa: {
      label: "Baixa",
      className: "priority-badge-baixa"
    },
    media: {
      label: "Média",
      className: "priority-badge-media"
    },
    alta: {
      label: "Alta",
      className: "priority-badge-alta"
    },
    urgente: {
      label: "Urgente",
      className: "priority-badge-urgente"
    },
  }

  const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.media

  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  )
}