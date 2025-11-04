import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, ShoppingCart, Package, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";

// Interface para Item do Carrinho
export interface ItemCarrinho {
  id: string;
  nome: string;
  quantidade: number;
  descricao?: string;
  status: 'pendente' | 'comprado';
}

// Schema de validação para item
const itemSchema = z.object({
  nome: z.string().min(1, "Nome do item é obrigatório"),
  quantidade: z.number().min(1, "Quantidade deve ser pelo menos 1"),
  descricao: z.string().optional(),
});

type ItemFormData = z.infer<typeof itemSchema>;

interface CarrinhoItensProps {
  itens: ItemCarrinho[];
  onItensChange: (itens: ItemCarrinho[]) => void;
  readonly?: boolean;
}

export function CarrinhoItens({ itens, onItensChange, readonly = false }: CarrinhoItensProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemCarrinho | null>(null);
  const { toast } = useToast();

  const form = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      nome: "",
      quantidade: 1,
      descricao: "",
    },
  });

  const adicionarItem = (data: ItemFormData) => {
    const novoItem: ItemCarrinho = {
      id: crypto.randomUUID(),
      nome: data.nome,
      quantidade: data.quantidade,
      descricao: data.descricao,
      status: 'pendente'
    };

    onItensChange([...itens, novoItem]);
    form.reset();
    setIsDialogOpen(false);

    toast({
      title: "Item adicionado",
      description: `${data.nome} foi adicionado ao carrinho`,
    });
  };

  const editarItem = (data: ItemFormData) => {
    if (!editingItem) return;

    const itensAtualizados = itens.map(item =>
      item.id === editingItem.id
        ? { ...item, nome: data.nome, quantidade: data.quantidade, descricao: data.descricao }
        : item
    );

    onItensChange(itensAtualizados);
    setEditingItem(null);
    setIsDialogOpen(false);
    form.reset();

    toast({
      title: "Item atualizado",
      description: `${data.nome} foi atualizado`,
    });
  };

  const removerItem = (itemId: string) => {
    const itemRemovido = itens.find(item => item.id === itemId);
    const novosItens = itens.filter(item => item.id !== itemId);
    onItensChange(novosItens);

    toast({
      title: "Item removido",
      description: `${itemRemovido?.nome} foi removido do carrinho`,
      variant: "destructive",
    });
  };

  const abrirEdicao = (item: ItemCarrinho) => {
    setEditingItem(item);
    form.setValue('nome', item.nome);
    form.setValue('quantidade', item.quantidade);
    form.setValue('descricao', item.descricao || '');
    setIsDialogOpen(true);
  };

  const fecharDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    form.reset();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Carrinho de Itens
          {itens.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {itens.length} {itens.length === 1 ? 'item' : 'itens'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lista de Itens */}
        {itens.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum item adicionado ainda</p>
            <p className="text-sm">Clique em "Adicionar Item" para começar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {itens.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg bg-background hover:bg-accent/50 transition-colors gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                    <h4 className="font-medium truncate">{item.nome}</h4>
                    <Badge
                      variant={item.status === 'comprado' ? 'default' : 'secondary'}
                      className="text-xs self-start sm:self-center"
                    >
                      {item.status === 'comprado' ? 'Comprado' : 'Pendente'}
                    </Badge>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                    <span className="font-medium">Qtd: {item.quantidade}</span>
                    {item.descricao && (
                      <span className="truncate">{item.descricao}</span>
                    )}
                  </div>
                </div>

                {!readonly && (
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => abrirEdicao(item)}
                      className="h-8 w-8 p-0"
                      title="Editar item"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removerItem(item.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      title="Remover item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Botão Adicionar Item */}
        {!readonly && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setEditingItem(null)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Editar Item' : 'Adicionar Item'}
                </DialogTitle>
                <DialogDescription>
                  {editingItem
                    ? 'Edite as informações do item'
                    : 'Adicione um novo item ao carrinho'
                  }
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(editingItem ? editarItem : adicionarItem)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Item</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Cimento, Tijolos, Tinta..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quantidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="1"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="descricao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição (Opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Detalhes adicionais..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={fecharDialog}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingItem ? 'Atualizar' : 'Adicionar'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}