import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, Plus, Search, Edit, Shield, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FuncoesForm, FuncaoFormData } from "./FuncoesForm";
import { useOptimizedSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { useSupabaseCRUD } from "@/hooks/useSupabaseMutation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [editingFuncao, setEditingFuncao] = useState<Funcao | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Hooks Supabase para substituir localStorage
  const { data: funcoes = [], isLoading, error } = useOptimizedSupabaseQuery<any>('FUNCOES');
  const { add, update, delete: deleteFuncao } = useSupabaseCRUD<any>('FUNCOES');

  // Hook para carregar setores para dropdown
  const { data: setores = [] } = useOptimizedSupabaseQuery<any>('SETORES');

  // Filtro de busca memoizado para performance
  const filteredFuncoes = useMemo(() => {
    if (!searchTerm.trim()) return funcoes;

    const searchLower = searchTerm.toLowerCase();
    return funcoes.filter(funcao =>
      funcao.nome.toLowerCase().includes(searchLower) ||
      (funcao.descricao && funcao.descricao.toLowerCase().includes(searchLower)) ||
      (funcao.nivel && funcao.nivel.toLowerCase().includes(searchLower)) ||
      (funcao.setor?.nome && funcao.setor.nome.toLowerCase().includes(searchLower))
    );
  }, [funcoes, searchTerm]);

  const onSubmit = (data: FuncaoFormData) => {
    if (editingFuncao) {
      const updates = {
        nome: data.nome,
        descricao: data.descricao,
        setor_id: data.setor_id,
        nivel: data.nivel,
        permissoes: JSON.stringify(data.permissoes || []),
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
        permissoes: JSON.stringify(data.permissoes || []),
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
    setEditingFuncao(funcao);
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

  // Nivel badge memoizado para performance
  const getNivelBadge = useCallback((nivel: string) => {
    const variants: Record<string, { className: string }> = {
      "Gestão": { className: "bg-purple-100 text-purple-700" },
      "Técnico": { className: "bg-blue-100 text-blue-700" },
      "Operacional": { className: "bg-green-100 text-green-700" },
    };

    return (
      <Badge className={variants[nivel]?.className || ""}>
        {nivel}
      </Badge>
    );
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cadastro de Funções</h1>
          <p className="text-muted-foreground">Gerenciamento de cargos e permissões</p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-accent" onClick={() => { setEditingFuncao(null); setOpen(true); }}>
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

      {/* List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Funções</CardTitle>
              <CardDescription>Todas as funções e suas permissões</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar função..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-6 w-32" />
                          <Skeleton className="h-5 w-16" />
                        </div>
                        <Skeleton className="h-4 w-48" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <div className="flex gap-2">
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-5 w-20" />
                            <Skeleton className="h-5 w-18" />
                          </div>
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                </div>
              ))
            ) : error ? (
              // Error state
              <div className="text-center py-8">
                <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Erro ao carregar funções: {error.message}</p>
                <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
                  Tentar novamente
                </Button>
              </div>
            ) : filteredFuncoes.length === 0 ? (
              // Empty state
              <div className="text-center py-8">
                <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? "Nenhuma função encontrada para a pesquisa." : "Nenhuma função cadastrada ainda."}
                </p>
                {!searchTerm && (
                  <Button
                    className="mt-4"
                    onClick={() => { setEditingFuncao(null); setOpen(true); }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar primeira função
                  </Button>
                )}
              </div>
            ) : (
              filteredFuncoes.map((funcao) => (
              <div 
                key={funcao.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Briefcase className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{funcao.nome}</h4>
                        {funcao.nivel && getNivelBadge(funcao.nivel)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {funcao.descricao}
                      </p>
                      {funcao.setor && (
                        <p className="text-sm text-muted-foreground mb-3 font-medium">
                          Setor: {funcao.setor.nome}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                        <Shield className="h-4 w-4" />
                        <span className="font-medium">Permissões:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(funcao.permissoes || []).map((permissao, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {permissao}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {funcao.totalColaboradores || 0} colaborador(es) nesta função
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(funcao)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeleteId(funcao.id)}>
                      <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </div>
            )))}
          </div>
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
