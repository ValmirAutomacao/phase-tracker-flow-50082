import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Search, Edit, Trash2, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { useSupabaseCRUD } from "@/hooks/useSupabaseMutation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import "@/styles/responsive.css";

// Interface para Categoria compatível com Supabase
interface CategoriaItem {
  id: string;
  nome: string;
  descricao?: string;
  ativa: boolean;
  created_at?: string;
  updated_at?: string;
}

const categoriaSchema = z.object({
  nome: z.string().min(3, "O nome deve ter no mínimo 3 caracteres").max(100, "O nome deve ter no máximo 100 caracteres"),
  descricao: z.string().optional(),
  ativa: z.boolean().default(true),
});

type CategoriaFormData = z.infer<typeof categoriaSchema>;

const Categorias = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<CategoriaItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Hooks Supabase para substituir localStorage
  const { data: categorias = [], isLoading, error } = useSupabaseQuery<CategoriaItem>('CATEGORIAS');

  const { add: addCategoria, update: updateCategoria, delete: deleteCategoria } = useSupabaseCRUD<CategoriaItem>('CATEGORIAS');

  const handleDelete = () => {
    if (deleteId) {
      deleteCategoria.mutate(deleteId, {
        onSuccess: () => {
          toast({
            title: "Categoria excluída!",
            description: "A categoria foi removida com sucesso.",
          });
          setDeleteId(null);
        },
        onError: (error) => {
          toast({
            title: "Erro ao excluir categoria",
            description: error.message || "Tente novamente em alguns instantes.",
            variant: "destructive",
          });
        },
      });
    }
  };

  // Filtros avançados com memoização para performance
  const filteredCategorias = useMemo(() => {
    return categorias.filter(categoria => {
      // Fallback seguro para evitar erros de propriedades undefined/null
      const nome = categoria.nome || '';
      const descricao = categoria.descricao || '';

      const matchesSearch = nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           descricao.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesStatus = true;
      if (statusFilter === "ativas") {
        matchesStatus = categoria.ativa;
      } else if (statusFilter === "inativas") {
        matchesStatus = !categoria.ativa;
      }

      return matchesSearch && matchesStatus;
    });
  }, [categorias, searchTerm, statusFilter]);

  const form = useForm<CategoriaFormData>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      ativa: true,
    },
  });

  const onSubmit = (data: CategoriaFormData) => {
    const categoriaData = {
      nome: data.nome,
      descricao: data.descricao || null,
      ativa: data.ativa,
    };

    if (editingCategoria) {
      // Editando categoria existente
      updateCategoria.mutate(
        { id: editingCategoria.id, updates: categoriaData },
        {
          onSuccess: () => {
            toast({
              title: "Categoria atualizada!",
              description: "A categoria foi atualizada com sucesso.",
            });
            setOpen(false);
            setEditingCategoria(null);
            form.reset();
          },
          onError: (error) => {
            toast({
              title: "Erro ao atualizar categoria",
              description: error.message || "Tente novamente em alguns instantes.",
              variant: "destructive",
            });
          },
        }
      );
    } else {
      // Criando nova categoria
      addCategoria.mutate(categoriaData, {
        onSuccess: () => {
          toast({
            title: "Categoria criada!",
            description: "A categoria foi criada com sucesso.",
          });
          setOpen(false);
          form.reset();
        },
        onError: (error) => {
          toast({
            title: "Erro ao criar categoria",
            description: error.message || "Tente novamente em alguns instantes.",
            variant: "destructive",
          });
        },
      });
    }
  };

  const handleEdit = (categoria: CategoriaItem) => {
    setEditingCategoria(categoria);
    form.reset({
      nome: categoria.nome,
      descricao: categoria.descricao || "",
      ativa: categoria.ativa,
    });
    setOpen(true);
  };

  const handleToggleStatus = (categoria: CategoriaItem) => {
    updateCategoria.mutate(
      { id: categoria.id, updates: { ativa: !categoria.ativa } },
      {
        onSuccess: () => {
          toast({
            title: `Categoria ${categoria.ativa ? 'desativada' : 'ativada'}!`,
            description: "Status atualizado com sucesso.",
          });
        },
        onError: (error) => {
          toast({
            title: "Erro ao atualizar status",
            description: error.message || "Tente novamente em alguns instantes.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const getStatusBadge = (ativa: boolean) => {
    return (
      <Badge className={ativa ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-gray-100 text-gray-700 hover:bg-gray-100"}>
        {ativa ? "Ativa" : "Inativa"}
      </Badge>
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Categorias</h1>
          <p className="text-muted-foreground">Gerenciamento de categorias para despesas</p>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            // Resetar formulário quando fechar o dialog
            setEditingCategoria(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent className="dialog-content-mobile">
            <DialogHeader className="dialog-header">
              <DialogTitle>{editingCategoria ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
              <DialogDescription>
                {editingCategoria
                  ? "Atualize os dados da categoria"
                  : "Crie uma nova categoria para classificar despesas"
                }
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
                <div className="dialog-form-container space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Categoria *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Material, Equipamento, Mão de Obra"
                          {...field}
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
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva o que esta categoria inclui..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ativa"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Categoria Ativa
                        </FormLabel>
                        <FormDescription>
                          Categorias inativas não aparecerão nos formulários
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                </div>

                <div className="form-actions">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">{editingCategoria ? "Salvar Alterações" : "Criar Categoria"}</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-lg-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total de Categorias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categorias.length}</div>
              <p className="text-xs text-muted-foreground mt-1">categorias cadastradas</p>
            </CardContent>
          </Card>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {categorias.filter(c => c.ativa).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">disponíveis para uso</p>
            </CardContent>
          </Card>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Inativas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {categorias.filter(c => !c.ativa).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">não disponíveis</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busque e filtre categorias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="row g-3">
            <div className="col-12">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="col-12 col-sm-6">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Todos os Status</option>
                <option value="ativas">Apenas Ativas</option>
                <option value="inativas">Apenas Inativas</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Categorias */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Categorias</CardTitle>
          <CardDescription>
            {filteredCategorias.length} de {categorias.length} categorias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="flex flex-col lg:flex-row lg:items-center justify-between p-4 border rounded-lg gap-4"
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="h-12 w-12 rounded-lg bg-muted animate-pulse shrink-0" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                      <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 w-20 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              ))
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Erro ao carregar categorias: {error.message}</p>
              </div>
            ) : filteredCategorias.length === 0 ? (
              <div className="text-center py-8">
                <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {categorias.length === 0
                    ? "Nenhuma categoria cadastrada ainda."
                    : "Nenhuma categoria encontrada com os filtros aplicados."
                  }
                </p>
              </div>
            ) : (
              filteredCategorias.map((categoria) => (
                <div
                  key={categoria.id}
                  className="flex flex-col lg:flex-row lg:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4"
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Tag className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h4 className="font-semibold truncate">{categoria.nome}</h4>
                        <div className="flex gap-2">
                          {getStatusBadge(categoria.ativa)}
                        </div>
                      </div>
                      {categoria.descricao && (
                        <p className="text-sm text-muted-foreground mb-2">{categoria.descricao}</p>
                      )}
                      <div className="text-xs text-muted-foreground">
                        <span>Criada em: {new Date(categoria.created_at || Date.now()).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                    {/* Botão de ativar/desativar */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(categoria)}
                      className="w-full sm:w-auto"
                    >
                      {categoria.ativa ? 'Desativar' : 'Ativar'}
                    </Button>

                    {/* Botão de editar */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(categoria)}
                      className="w-full sm:w-auto"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    {/* Botão de excluir */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteId(categoria.id)}
                      className="w-full sm:w-auto"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Categorias;