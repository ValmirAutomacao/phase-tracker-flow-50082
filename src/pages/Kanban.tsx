import { PageContainer } from '@/components/layout/PageContainer'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { KanbanMetrics } from '@/components/kanban/KanbanMetrics'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Webhook, HelpCircle } from 'lucide-react'
import { useKanbanBoards, useKanbanCards, useKanbanPhases } from '@/hooks/useKanban'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const DEFAULT_BOARD_ID = '00000000-0000-0000-0000-000000000001'

export default function Kanban() {
  const [showWebhookInfo, setShowWebhookInfo] = useState(false)
  const { data: boards = [], isLoading: boardsLoading } = useKanbanBoards()
  const { data: cards = [] } = useKanbanCards(DEFAULT_BOARD_ID)
  const { data: phases = [] } = useKanbanPhases(DEFAULT_BOARD_ID)

  const webhookUrl = `https://ibnrtvrxogkksldvxici.supabase.co/functions/v1/create-lead-webhook`

  if (boardsLoading) {
    return (
      <PageContainer title="CRM Kanban" description="Gerenciamento de leads e pipeline de vendas">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer 
      title="CRM Kanban" 
      description="Gerenciamento de leads e pipeline de vendas"
    >
      <div className="space-y-6">
        {/* Metrics Dashboard */}
        <KanbanMetrics cards={cards} phases={phases} />

        {/* Webhook Info Card */}
        <Card className="bg-accent/20 border-primary/20">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Webhook className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-base">Automação de Leads</CardTitle>
                  <CardDescription>
                    Integre via webhook para criar leads automaticamente
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowWebhookInfo(true)}
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Ver Documentação
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Kanban Board */}
        <KanbanBoard boardId={DEFAULT_BOARD_ID} />
      </div>

      {/* Webhook Documentation Modal */}
      <Dialog open={showWebhookInfo} onOpenChange={setShowWebhookInfo}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Integração via Webhook</DialogTitle>
            <DialogDescription>
              Como integrar automações externas (n8n, Zapier, Make, etc) ao CRM
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-2">Endpoint do Webhook</h4>
              <code className="block bg-muted p-3 rounded-lg text-xs break-all">
                {webhookUrl}
              </code>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2">Método HTTP</h4>
              <code className="bg-muted px-2 py-1 rounded text-xs">POST</code>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2">Headers</h4>
              <code className="block bg-muted p-3 rounded-lg text-xs">
                Content-Type: application/json
              </code>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2">Payload JSON (Exemplo)</h4>
              <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
{`{
  "cliente_nome": "João Silva",
  "cliente_email": "joao@exemplo.com",
  "cliente_telefone": "(11) 98765-4321",
  "cliente_empresa": "Empresa XYZ",
  "valor_estimado": 150000,
  "origem": "n8n",
  "titulo": "Construção Residencial",
  "descricao": "Cliente interessado em obra residencial",
  "tags": ["residencial", "urgente"]
}`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2">Campos Obrigatórios</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li><code className="bg-muted px-1 rounded">cliente_nome</code> - Nome do cliente</li>
                <li><code className="bg-muted px-1 rounded">origem</code> - Origem do lead (ex: "n8n", "webhook", "site")</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2">Campos Opcionais</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li><code className="bg-muted px-1 rounded">titulo</code> - Título do lead</li>
                <li><code className="bg-muted px-1 rounded">cliente_email</code> - Email do cliente</li>
                <li><code className="bg-muted px-1 rounded">cliente_telefone</code> - Telefone</li>
                <li><code className="bg-muted px-1 rounded">cliente_empresa</code> - Nome da empresa</li>
                <li><code className="bg-muted px-1 rounded">valor_estimado</code> - Valor estimado (número)</li>
                <li><code className="bg-muted px-1 rounded">descricao</code> - Descrição detalhada</li>
                <li><code className="bg-muted px-1 rounded">tags</code> - Array de tags (strings)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2">Resposta de Sucesso</h4>
              <pre className="bg-muted p-3 rounded-lg text-xs">
{`{
  "success": true,
  "card_id": "uuid-do-card-criado",
  "message": "Lead criado com sucesso"
}`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2">Exemplo com cURL</h4>
              <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
{`curl -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -d '{
    "cliente_nome": "João Silva",
    "origem": "n8n",
    "cliente_email": "joao@exemplo.com"
  }'`}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
