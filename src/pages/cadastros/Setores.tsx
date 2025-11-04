import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserCog, Plus, Search, Edit, Users, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SetoresForm, SetorFormData } from "./SetoresForm";
import { useOptimizedSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { useSupabaseCRUD } from "@/hooks/useSupabaseMutation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [editingSetor, setEditingSetor] = useState<Setor | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Hooks Supabase para substituir localStorage
  const { data: setores = [], isLoading, error } = useOptimizedSupabaseQuery<any>('SETORES');
  const { add, update, delete: deleteSetor } = useSupabaseCRUD<any>('SETORES');

  // Filtro de busca memoizado para performance
  const filteredSetores = useMemo(() => {
    if (!searchTerm.trim()) return setores;

    const searchLower = searchTerm.toLowerCase();
    return setores.filter(setor =>
      setor.nome.toLowerCase().includes(searchLower) ||
      (setor.descricao && setor.descricao.toLowerCase().includes(searchLower)) ||
      (setor.responsavel && setor.responsavel.toLowerCase().includes(searchLower))
    );
  }, [setores, searchTerm]);

  const onSubmit = (data: SetorFormData) => {
    if (editingSetor) {
      const updates: any = {
        nome: data.nome,
        descricao: data.descricao,
        responsavel: data.responsavel,
        status: (data as any).status || "ativo",
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
        responsavel: data.responsavel,
        totalColaboradores: 0,
        status: data.status || "ativo",
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

  // Status badge memoizado para performance
  const getStatusBadge = useCallback((status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      ativo: { label: "Ativo", className: "bg-green-100 text-green-700" },
      inativo: { label: "Inativo", className: "bg-gray-100 text-gray-700" },
    };

    return (
      <Badge className={variants[status]?.className || ""}>
        {variants[status]?.label || status}
      </Badge>
    );
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cadastro de Setores</h1>
          <p className="text-muted-foreground">Gerenciamento de departamentos e áreas</p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-accent" onClick={() => { setEditingSetor(null); setOpen(true); }}>
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
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Setores Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {setores.filter(s => s.status === 'ativo').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">em operação</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Colaboradores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {useMemo(() =>
                setores.reduce((acc, setor) => acc + (setor.totalColaboradores || 0), 0)
              , [setores])}
            </div>
            <p className="text-xs text-muted-foreground mt-1">distribuídos nos setores</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Média por Setor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {useMemo(() => {
                const totalColaboradores = setores.reduce((acc, setor) => acc + (setor.totalColaboradores || 0), 0);
                return setores.length > 0 ? Math.round(totalColaboradores / setores.length) : 0;
              }, [setores])}
            </div>
            <p className="text-xs text-muted-foreground mt-1">colaboradores/setor</p>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Setores</CardTitle>
              <CardDescription>Todos os departamentos cadastrados</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar setor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Skeleton className="h-12 w-12 rounded-lg" />
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-5 w-16" />
                          </div>
                          <Skeleton className="h-4 w-48" />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-5 w-8" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-8 flex-1" />
                      <Skeleton className="h-8 w-10" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : error ? (
              // Error state
              <div className="col-span-2 text-center py-8">
                <UserCog className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Erro ao carregar setores: {error.message}</p>
                <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
                  Tentar novamente
                </Button>
              </div>
            ) : filteredSetores.length === 0 ? (
              // Empty state
              <div className="col-span-2 text-center py-8">
                <UserCog className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? "Nenhum setor encontrado para a pesquisa." : "Nenhum setor cadastrado ainda."}
                </p>
                {!searchTerm && (
                  <Button
                    className="mt-4"
                    onClick={() => { setEditingSetor(null); setOpen(true); }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar primeiro setor
                  </Button>
                )}
              </div>
            ) : (
              filteredSetores.map((setor) => (
              <Card key={setor.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <UserCog className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-base">{setor.nome}</CardTitle>
                          {getStatusBadge(setor.status || "ativo")}
                        </div>
                        <CardDescription className="text-sm">
                          {setor.descricao}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Responsável:</span>
                    </div>
                    <span className="font-medium">{setor.responsavel || "Não definido"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Colaboradores:</span>
                    <Badge variant="outline">{setor.totalColaboradores || 0}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(setor)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeleteId(setor.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )))}
          </div>
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
