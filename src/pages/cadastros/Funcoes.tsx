import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Plus, Edit, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FuncoesForm, FuncaoFormData } from "./FuncoesForm";
import { useOptimizedSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { useSupabaseCRUD } from "@/hooks/useSupabaseMutation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DataTable, Column } from "@/components/ui/DataTable";

interface Funcao {
  id: string;
  setor_id: string; // FK para setores
  nome: string;
  descricao: string;
  nivel?: string;
  permissoes?: string[];
  totalColaboradores?: number;
  // Campos de relacionamento
  setor?: {
    id: string;
    nome: string;
  };
  created_at?: string;
  updated_at?: string;
}

const Funcoes = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingFuncao, setEditingFuncao] = useState<Funcao | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Hooks Supabase para substituir localStorage
  const { data: funcoes = [], isLoading, error } = useOptimizedSupabaseQuery<any>('FUNCOES');
  const { add, update, delete: deleteFuncao } = useSupabaseCRUD<any>('FUNCOES');

  // Hook para carregar setores para dropdown
  const { data: setores = [] } = useOptimizedSupabaseQuery<any>('SETORES');

  const onSubmit = (data: FuncaoFormData) => {
    if (editingFuncao) {
      const updates = {
        nome: data.nome,
        descricao: data.descricao,
        setor_id: data.setor_id,
        nivel: data.nivel,
        permissoes: data.permissoes || [],
      };

      update.mutate(
        { id: editingFuncao.id, updates },
        {
          onSuccess: () => {
            toast({
              title: "Função atualizada!",
              description: `${data.nome} foi atualizada com sucesso com ${data.permissoes?.length || 0} permissões.`,
            });
            setOpen(false);
            setEditingFuncao(null);
          },
          onError: (error) => {
            toast({
              title: "Erro ao atualizar",
              description: error.message || "Ocorreu um erro ao atualizar a função.",
              variant: "destructive",
            });
          }
        }
      );
    } else {
      const novaFuncao = {
        nome: data.nome,
        descricao: data.descricao,
        setor_id: data.setor_id,
        nivel: data.nivel,
        permissoes: data.permissoes || [],
      };

      add.mutate(novaFuncao, {
        onSuccess: () => {
          toast({
            title: "Função cadastrada!",
            description: `${data.nome} foi adicionada com ${data.permissoes?.length || 0} permissões.`,
          });
          setOpen(false);
        },
        onError: (error) => {
          toast({
            title: "Erro ao cadastrar",
            description: error.message || "Ocorreu um erro ao cadastrar a função.",
            variant: "destructive",
          });
        }
      });
    }
  };

  const handleEdit = (funcao: Funcao) => {
    // Garantir que permissoes seja sempre um array
    const funcaoParaEditar = {
      ...funcao,
      permissoes: Array.isArray(funcao.permissoes) 
        ? funcao.permissoes 
        : typeof funcao.permissoes === 'string'
          ? JSON.parse(funcao.permissoes)
          : []
    };
    setEditingFuncao(funcaoParaEditar);
    setOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteFuncao.mutate(deleteId, {
        onSuccess: () => {
          toast({
            title: "Função excluída!",
            description: "A função foi removida com sucesso.",
          });
          setDeleteId(null);
        },
        onError: (error) => {
          toast({
            title: "Erro ao excluir",
            description: error.message || "Ocorreu um erro ao excluir a função.",
            variant: "destructive",
          });
        }
      });
    }
  };

  const getNivelBadge = useCallback((nivel: string) => {
    const variants: Record<string, { variant: any }> = {
      "Gestão": { variant: "default" },
      "Técnico": { variant: "secondary" },
      "Operacional": { variant: "outline" },
    };

    const config = variants[nivel] || { variant: "outline" };
    return (
      <Badge variant={config.variant}>
        {nivel}
      </Badge>
    );
  }, []);

  // Definir colunas da tabela
  const columns: Column<Funcao>[] = [
    {
      key: 'nome',
      title: 'Função',
      sortable: true,
      filterable: true,
      filterType: 'text',
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <Briefcase className="h-4 w-4 text-primary" />
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-xs text-muted-foreground">
              {row.setor?.nome || 'Setor não definido'}
            </div>
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
        <div className="text-sm max-w-xs">
          {value || '-'}
        </div>
      )
    },
    {
      key: 'nivel',
      title: 'Nível',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { value: 'Gestão', label: 'Gestão' },
        { value: 'Técnico', label: 'Técnico' },
        { value: 'Operacional', label: 'Operacional' }
      ],
      render: (value) => value ? getNivelBadge(value) : (
        <span className="text-muted-foreground">-</span>
      )
    },
    {
      key: 'permissoes',
      title: 'Permissões',
      render: (permissoes) => {
        const permissoesArray = Array.isArray(permissoes)
          ? permissoes
          : typeof permissoes === 'string'
            ? JSON.parse(permissoes || '[]')
            : [];

        return (
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">{permissoesArray.length} permissão(ões)</span>
          </div>
        );
      }
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
    }
  ];

  const handleDeleteConfirm = (funcao: Funcao) => {
    setDeleteId(funcao.id);
  };

  return (
    <div className="responsive-container p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cadastro de Funções</h1>
          <p className="page-description">Gerenciamento de cargos e permissões</p>
        </div>
        <Button onClick={() => { setEditingFuncao(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Função
        </Button>
        <FuncoesForm
          open={open}
          onOpenChange={setOpen}
          onSubmit={onSubmit}
          editData={editingFuncao ? { ...editingFuncao } as any : undefined}
          setores={setores}
        />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Funções</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{funcoes.length}</div>
            <p className="text-xs text-muted-foreground mt-1">cadastradas no sistema</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Níveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {useMemo(() => {
                const niveisUnicos = new Set(funcoes.map(f => f.nivel).filter(Boolean));
                return niveisUnicos.size;
              }, [funcoes])}
            </div>
            <p className="text-xs text-muted-foreground mt-1">níveis hierárquicos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Colaboradores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {useMemo(() =>
                funcoes.reduce((acc, funcao) => acc + (funcao.totalColaboradores || 0), 0)
              , [funcoes])}
            </div>
            <p className="text-xs text-muted-foreground mt-1">distribuídos nas funções</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Funções com DataTable */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Lista de Funções</CardTitle>
            <CardDescription>Todas as funções e suas permissões cadastradas no sistema</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={funcoes}
            columns={columns}
            loading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDeleteConfirm}
            searchPlaceholder="Buscar por nome, descrição, nível, setor..."
            emptyMessage="Nenhuma função cadastrada ainda."
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
              Tem certeza que deseja excluir esta função? Esta ação não pode ser desfeita.
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

export default Funcoes;
