import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCog, Plus, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SetoresForm, SetorFormData } from "./SetoresForm";
import { useOptimizedSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { useSupabaseCRUD } from "@/hooks/useSupabaseMutation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DataTable, Column } from "@/components/ui/DataTable";

interface Setor {
  id: string;
  nome: string;
  descricao: string;
  responsavel?: string;
  totalColaboradores?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

const Setores = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingSetor, setEditingSetor] = useState<Setor | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Hooks Supabase para substituir localStorage
  const { data: setores = [], isLoading, error } = useOptimizedSupabaseQuery<any>('SETORES');
  const { add, update, delete: deleteSetor } = useSupabaseCRUD<any>('SETORES');

  const onSubmit = (data: SetorFormData) => {
    if (editingSetor) {
      const updates: any = {
        nome: data.nome,
        descricao: data.descricao,
      };

      update.mutate(
        { id: editingSetor.id, updates },
        {
          onSuccess: () => {
            toast({
              title: "Setor atualizado!",
              description: `${data.nome} foi atualizado com sucesso.`,
            });
            setOpen(false);
            setEditingSetor(null);
          },
          onError: (error) => {
            toast({
              title: "Erro ao atualizar",
              description: error.message || "Ocorreu um erro ao atualizar o setor.",
              variant: "destructive",
            });
          }
        }
      );
    } else {
      const novoSetor = {
        nome: data.nome,
        descricao: data.descricao,
      };

      add.mutate(novoSetor, {
        onSuccess: () => {
          toast({
            title: "Setor cadastrado!",
            description: `${data.nome} foi adicionado com sucesso.`,
          });
          setOpen(false);
        },
        onError: (error) => {
          toast({
            title: "Erro ao cadastrar",
            description: error.message || "Ocorreu um erro ao cadastrar o setor.",
            variant: "destructive",
          });
        }
      });
    }
  };

  const handleEdit = (setor: Setor) => {
    setEditingSetor(setor);
    setOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteSetor.mutate(deleteId, {
        onSuccess: () => {
          toast({
            title: "Setor excluído!",
            description: "O setor foi removido com sucesso.",
          });
          setDeleteId(null);
        },
        onError: (error) => {
          toast({
            title: "Erro ao excluir",
            description: error.message || "Ocorreu um erro ao excluir o setor.",
            variant: "destructive",
          });
        }
      });
    }
  };

  // Definir colunas da tabela
  const columns: Column<Setor>[] = [
    {
      key: 'nome',
      title: 'Nome do Setor',
      sortable: true,
      filterable: true,
      filterType: 'text',
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <UserCog className="h-4 w-4 text-primary" />
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-xs text-muted-foreground">Departamento</div>
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
      key: 'totalColaboradores',
      title: 'Colaboradores',
      sortable: true,
      render: (value) => (
        <div className="text-center">
          <span className="font-medium">{value || 0}</span>
        </div>
      )
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { value: 'ativo', label: 'Ativo' },
        { value: 'inativo', label: 'Inativo' }
      ],
      render: (value) => (
        <span className="text-sm text-green-600 font-medium">
          {value || 'Ativo'}
        </span>
      )
    }
  ];

  const handleDeleteConfirm = (setor: Setor) => {
    setDeleteId(setor.id);
  };


  return (
    <div className="responsive-container p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cadastro de Setores</h1>
          <p className="page-description">Gerenciamento de departamentos e áreas</p>
        </div>
        <Button onClick={() => { setEditingSetor(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Setor
        </Button>
        <SetoresForm open={open} onOpenChange={setOpen} onSubmit={onSubmit} editData={editingSetor ? { ...editingSetor } as any : undefined} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Setores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{setores.length}</div>
            <p className="text-xs text-muted-foreground mt-1">cadastrados no sistema</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Setores com DataTable */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Lista de Setores</CardTitle>
            <CardDescription>Todos os departamentos cadastrados no sistema</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={setores}
            columns={columns}
            loading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDeleteConfirm}
            searchPlaceholder="Buscar por nome, descrição..."
            emptyMessage="Nenhum setor cadastrado ainda."
            showSelection={false}
            showActions={true}
            globalSearch={true}
            hideFilters={false}
          />
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este setor? Esta ação não pode ser desfeita.
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

export default Setores;
