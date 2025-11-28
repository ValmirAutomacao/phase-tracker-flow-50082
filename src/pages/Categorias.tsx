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
import { Plus, Edit, Trash2, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { DataTable, Column } from "@/components/ui/DataTable";
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
  [key: string]: any;
}

const categoriaSchema = z.object({
  nome: z.string().min(3, "O nome deve ter no mínimo 3 caracteres").max(100, "O nome deve ter no máximo 100 caracteres"),
  descricao: z.string().optional(),
  ativa: z.boolean(),
});

type CategoriaFormData = z.infer<typeof categoriaSchema>;

const Categorias = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<CategoriaItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  const handleDeleteConfirm = (categoria: CategoriaItem) => {
    setDeleteId(categoria.id);
  };

  // Definir colunas da tabela
  const columns: Column<CategoriaItem>[] = [
    {
      key: 'nome',
      title: 'Nome',
      sortable: true,
      filterable: true,
      filterType: 'text',
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Tag className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-xs text-muted-foreground">Categoria</div>
          </div>
        </div>
      )
    },
    {
      key: 'descricao',
      title: 'Descrição',
      filterable: true,
      filterType: 'text',
      render: (value) => (
        <div className="text-sm max-w-md">
          {value || 'Sem descrição'}
        </div>
      )
    },
    {
      key: 'ativa',
      title: 'Status',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { value: 'true', label: 'Ativa' },
        { value: 'false', label: 'Inativa' }
      ],
      render: (value) => getStatusBadge(value)
    },
    {
      key: 'created_at',
      title: 'Data de Criação',
      sortable: true,
      render: (value) => (
        <div className="text-sm">
          {new Date(value || Date.now()).toLocaleDateString('pt-BR')}
        </div>
      )
    },
  ];

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


      {/* Lista de Categorias com DataTable */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Categorias</CardTitle>
          <CardDescription>Todas as categorias cadastradas no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={categorias}
            columns={columns}
            loading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDeleteConfirm}
            searchPlaceholder="Buscar por nome ou descrição..."
            emptyMessage="Nenhuma categoria cadastrada ainda."
            showSelection={false}
            showActions={true}
            globalSearch={true}
            hideFilters={false}
            customActions={(categoria) => (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggleStatus(categoria)}
                className="text-xs"
              >
                {categoria.ativa ? 'Desativar' : 'Ativar'}
              </Button>
            )}
          />
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