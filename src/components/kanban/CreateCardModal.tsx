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
import { X } from 'lucide-react'
import { useCreateCard } from '@/hooks/useKanban'
import type { CreateCardInput } from '@/lib/types/kanban'

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

interface CreateCardModalProps {
  boardId: string
  phaseId: string
  open: boolean
  onClose: () => void
}

export function CreateCardModal({ boardId, phaseId, open, onClose }: CreateCardModalProps) {
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const createCard = useCreateCard()

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CardFormData>({
    resolver: zodResolver(cardSchema),
  })

  const onSubmit = (data: CardFormData) => {
    const input: CreateCardInput = {
      board_id: boardId,
      phase_id: phaseId,
      titulo: data.titulo,
      cliente_nome: data.cliente_nome,
      cliente_email: data.cliente_email || undefined,
      cliente_telefone: data.cliente_telefone || undefined,
      cliente_empresa: data.cliente_empresa || undefined,
      valor_estimado: data.valor_estimado || undefined,
      descricao: data.descricao || undefined,
      origem: 'manual',
      tags
    }
    
    createCard.mutate(input, {
      onSuccess: () => {
        reset()
        setTags([])
        onClose()
      }
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

  const handleClose = () => {
    reset()
    setTags([])
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Lead</DialogTitle>
          <DialogDescription>
            Preencha os dados do novo lead para adicioná-lo ao pipeline
          </DialogDescription>
        </DialogHeader>

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
                placeholder="(00) 00000-0000"
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
              placeholder="0,00"
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

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createCard.isPending}>
              {createCard.isPending ? 'Criando...' : 'Criar Lead'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
