import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trash2, X } from 'lucide-react'
import { useUpdateCard, useDeleteCard, useCardActivities } from '@/hooks/useKanban'
import type { KanbanCard } from '@/lib/types/kanban'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const cardSchema = z.object({
  titulo: z.string().optional(),
  cliente_nome: z.string().min(1, 'Nome é obrigatório'),
  cliente_email: z.string().email('Email inválido').optional().or(z.literal('')),
  cliente_telefone: z.string().optional(),
  cliente_empresa: z.string().optional(),
  valor_estimado: z.number().optional().or(z.nan()),
  descricao: z.string().optional(),
})

type CardFormData = z.infer<typeof cardSchema>

interface CardModalProps {
  card: KanbanCard | null
  boardId: string
  open: boolean
  onClose: () => void
}

export function CardModal({ card, boardId, open, onClose }: CardModalProps) {
  const [newTag, setNewTag] = useState('')
  const updateCard = useUpdateCard()
  const deleteCard = useDeleteCard()
  const { data: activities = [] } = useCardActivities(card?.id)

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<CardFormData>({
    resolver: zodResolver(cardSchema),
    values: card ? {
      titulo: card.titulo || '',
      cliente_nome: card.cliente_nome,
      cliente_email: card.cliente_email || '',
      cliente_telefone: card.cliente_telefone || '',
      cliente_empresa: card.cliente_empresa || '',
      valor_estimado: card.valor_estimado || undefined,
      descricao: card.descricao || '',
    } : undefined
  })

  const [tags, setTags] = useState<string[]>(card?.tags || [])

  const onSubmit = (data: CardFormData) => {
    if (!card) return
    
    updateCard.mutate({
      id: card.id,
      boardId,
      updates: {
        ...data,
        tags
      }
    }, {
      onSuccess: () => onClose()
    })
  }

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleDelete = () => {
    if (!card) return
    if (!confirm('Tem certeza que deseja excluir este lead?')) return
    
    deleteCard.mutate({ id: card.id, boardId }, {
      onSuccess: () => onClose()
    })
  }

  if (!card) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Lead</DialogTitle>
          <DialogDescription>
            Criado em {format(new Date(card.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="activity">Atividade</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  {...register('titulo')}
                  placeholder="Título do lead (opcional)"
                />
              </div>

              <div>
                <Label htmlFor="cliente_nome">Nome do Cliente *</Label>
                <Input
                  id="cliente_nome"
                  {...register('cliente_nome')}
                  className={errors.cliente_nome ? 'border-destructive' : ''}
                />
                {errors.cliente_nome && (
                  <p className="text-xs text-destructive mt-1">{errors.cliente_nome.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cliente_email">Email</Label>
                  <Input
                    id="cliente_email"
                    type="email"
                    {...register('cliente_email')}
                    className={errors.cliente_email ? 'border-destructive' : ''}
                  />
                  {errors.cliente_email && (
                    <p className="text-xs text-destructive mt-1">{errors.cliente_email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="cliente_telefone">Telefone</Label>
                  <Input
                    id="cliente_telefone"
                    {...register('cliente_telefone')}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cliente_empresa">Empresa</Label>
                <Input
                  id="cliente_empresa"
                  {...register('cliente_empresa')}
                />
              </div>

              <div>
                <Label htmlFor="valor_estimado">Valor Estimado (R$)</Label>
                <Input
                  id="valor_estimado"
                  type="number"
                  step="0.01"
                  {...register('valor_estimado', { valueAsNumber: true })}
                />
              </div>

              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  {...register('descricao')}
                  rows={3}
                  placeholder="Observações sobre o lead..."
                />
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Nova tag"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                  <Button type="button" onClick={handleAddTag} variant="secondary">
                    Adicionar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="gap-1">
                      {tag}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={updateCard.isPending}>
                    {updateCard.isPending ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="activity" className="space-y-3">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma atividade registrada
              </p>
            ) : (
              <div className="space-y-2">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="border border-border rounded-lg p-3 bg-card"
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-sm text-foreground">{activity.descricao}</p>
                      <Badge variant="secondary" className="text-xs">
                        {activity.tipo}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(activity.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
