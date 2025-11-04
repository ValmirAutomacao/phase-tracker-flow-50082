import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Plus, Search, Edit, MapPin, Calendar, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ObrasForm, ObraFormData } from "./ObrasForm";
import { useOptimizedSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { useSupabaseCRUD } from "@/hooks/useSupabaseMutation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface EtapaObra {
  id?: string;
  nome: string;
  responsavel: string;
  dataInicio: string;
  dataPrevisao: string;
  progresso?: number;
  status?: string;
}

interface Obra {
  id: string;
  cliente_id: string;
  nome: string;
  etapas: EtapaObra[]; // JSONB
  progresso: number; // 0-100
  orcamento: number;
  status: 'planejamento' | 'execucao' | 'concluida';
  data_inicio: Date | string;
  data_fim?: Date | string;
  // Campos de endereço para manter compatibilidade
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  // Campos opcionais para compatibilidade
  cliente?: string; // Nome do cliente (denormalizado)
  responsavel?: string;
  dataInicio?: string; // Para compatibilidade
  dataPrevisao?: string; // Para compatibilidade
  created_at?: string;
  updated_at?: string;
}

const Obras = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);

  // Hooks Supabase para substituir localStorage
  const { data: obras = [], isLoading, error } = useOptimizedSupabaseQuery<any>('OBRAS');
  const { add, update, delete: deleteObra } = useSupabaseCRUD<any>('OBRAS');

  const [editingObra, setEditingObra] = useState<Obra | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Filtro de busca memoizado para performance
  const filteredObras = useMemo(() => {
    if (!searchTerm.trim()) return obras;

    const searchLower = searchTerm.toLowerCase();
    return obras.filter(obra =>
      obra.nome.toLowerCase().includes(searchLower) ||
      (obra.cliente && obra.cliente.toLowerCase().includes(searchLower)) ||
      (obra.endereco && obra.endereco.toLowerCase().includes(searchLower))
    );
  }, [obras, searchTerm]);

  // Função helper para transformar dados do formulário para o formato da obra
  const transformFormDataToObra = useCallback((data: ObraFormData, isUpdate = false) => {
    const baseObra = {
      nome: data.nome,
      cliente_id: data.cliente, // Assumindo que data.cliente contém o ID
      endereco: data.endereco,
      numero: data.numero,
      bairro: data.bairro,
      cidade: data.cidade,
      estado: data.estado,
      cep: data.cep,
      responsavel: data.responsavel,
      status: data.status as 'planejamento' | 'execucao' | 'concluida',
      data_inicio: data.dataInicio,
      data_fim: data.dataPrevisaoFinal,
      orcamento: data.orcamento ? parseFloat(data.orcamento.replace(/\D/g, '')) / 100 : 0,
      etapas: data.etapas,
      // Manter campos de compatibilidade
      cliente: data.cliente,
      dataInicio: data.dataInicio,
      dataPrevisao: data.dataPrevisaoFinal,
    };

    // Adicionar progresso apenas para novas obras
    if (!isUpdate) {
      return { ...baseObra, progresso: 0 };
    }

    return baseObra;
  }, []);

  const onSubmit = (data: ObraFormData) => {
    if (editingObra) {
      const updates = transformFormDataToObra(data, true);

      update.mutate(
        { id: editingObra.id, updates },
        {
          onSuccess: () => {
            toast({
              title: "Obra atualizada!",
              description: `${data.nome} foi atualizada com sucesso.`,
            });
            setOpen(false);
            setEditingObra(null);
          },
          onError: (error) => {
            toast({
              title: "Erro ao atualizar",
              description: error.message || "Ocorreu um erro ao atualizar a obra.",
              variant: "destructive",
            });
          }
        }
      );
    } else {
      const novaObra = transformFormDataToObra(data, false);

      add.mutate(novaObra, {
        onSuccess: () => {
          toast({
            title: "Obra cadastrada!",
            description: `${data.nome} foi adicionada com sucesso com ${data.etapas.length} etapa(s).`,
          });
          setOpen(false);
        },
        onError: (error) => {
          toast({
            title: "Erro ao cadastrar",
            description: error.message || "Ocorreu um erro ao cadastrar a obra.",
            variant: "destructive",
          });
        }
      });
    }
  };

  const handleEdit = (obra: Obra) => {
    setEditingObra(obra);
    setOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteObra.mutate(deleteId, {
        onSuccess: () => {
          toast({
            title: "Obra excluída!",
            description: "A obra foi removida com sucesso.",
          });
          setDeleteId(null);
        },
        onError: (error) => {
          toast({
            title: "Erro ao excluir",
            description: error.message || "Ocorreu um erro ao excluir a obra.",
            variant: "destructive",
          });
        }
      });
    }
  };

  // Status badge memoizado para performance
  const getStatusBadge = useCallback((status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      planejamento: { label: "Planejamento", className: "bg-yellow-100 text-yellow-700" },
      execucao: { label: "Execução", className: "bg-green-100 text-green-700" },
      concluida: { label: "Concluída", className: "bg-blue-100 text-blue-700" },
      // Manter compatibilidade com status antigos
      ativa: { label: "Execução", className: "bg-green-100 text-green-700" },
      pausada: { label: "Pausada", className: "bg-gray-100 text-gray-700" },
    };

    return (
      <Badge className={variants[status]?.className || ""}>
        {variants[status]?.label || status}
      </Badge>
    );
  }, []);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Cadastro de Obras</h1>
          <p className="text-muted-foreground">Gerenciamento completo de obras e projetos</p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-accent" onClick={() => { setEditingObra(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Obra
        </Button>
        <ObrasForm open={open} onOpenChange={setOpen} onSubmit={onSubmit} editData={editingObra ? {
          nome: editingObra.nome,
          cliente: editingObra.cliente || "",
          endereco: editingObra.endereco,
          numero: editingObra.numero,
          bairro: editingObra.bairro,
          cidade: editingObra.cidade,
          estado: editingObra.estado,
          cep: editingObra.cep,
          responsavel: editingObra.responsavel,
          status: editingObra.status,
          dataInicio: editingObra.dataInicio,
          dataPrevisaoFinal: editingObra.dataPrevisao || "",
          orcamento: editingObra.orcamento ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(editingObra.orcamento) : "",
          etapas: editingObra.etapas || [],
          id: editingObra.id
        } : undefined} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Obras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{obras.length}</div>
            <p className="text-xs text-muted-foreground mt-1">cadastradas no sistema</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Em Execução</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {obras.filter(o => o.status === 'execucao' || o.status === 'ativa').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">em andamento</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {obras.filter(o => o.status === 'concluida').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">finalizadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Progresso Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {useMemo(() =>
                obras.length > 0
                  ? Math.round(obras.reduce((acc, obra) => acc + obra.progresso, 0) / obras.length)
                  : 0
              , [obras])}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">de todas as obras</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Lista de Obras</CardTitle>
              <CardDescription>Todas as obras cadastradas</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar obra..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full"
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
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-col gap-2">
                          <Skeleton className="h-6 w-48" />
                          <Skeleton className="h-5 w-24" />
                        </div>
                        <Skeleton className="h-4 w-32" />
                        <div className="flex flex-col gap-2">
                          <Skeleton className="h-4 w-64" />
                          <Skeleton className="h-4 w-40" />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                </div>
              ))
            ) : error ? (
              // Error state
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Erro ao carregar obras: {error.message}</p>
                <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
                  Tentar novamente
                </Button>
              </div>
            ) : filteredObras.length === 0 ? (
              // Empty state
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? "Nenhuma obra encontrada para a pesquisa." : "Nenhuma obra cadastrada ainda."}
                </p>
                {!searchTerm && (
                  <Button
                    className="mt-4"
                    onClick={() => { setEditingObra(null); setOpen(true); }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar primeira obra
                  </Button>
                )}
              </div>
            ) : (
              filteredObras.map((obra) => (
              <div 
                key={obra.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                        <h4 className="font-semibold text-lg truncate">{obra.nome}</h4>
                        {getStatusBadge(obra.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Cliente: {obra.cliente}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1 min-w-0">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{obra.endereco}, {obra.numero} - {obra.bairro}, {obra.cidade}/{obra.estado} - {obra.cep}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 shrink-0" />
                          <span className="text-nowrap">{new Date(obra.dataInicio).toLocaleDateString('pt-BR')} - {new Date(obra.dataPrevisao).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(obra)} className="text-xs sm:text-sm">
                      <Edit className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Editar</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeleteId(obra.id)} className="text-xs sm:text-sm">
                      <Trash2 className="h-4 w-4 sm:mr-1 text-destructive" />
                      <span className="hidden sm:inline">Excluir</span>
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progresso Geral</span>
                    <span className="font-semibold">{obra.progresso}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        obra.progresso === 100 ? 'bg-blue-500' :
                        obra.progresso >= 75 ? 'bg-green-500' :
                        obra.progresso >= 50 ? 'bg-yellow-500' : 'bg-orange-500'
                      }`}
                      style={{ width: `${obra.progresso}%` }}
                    />
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
              Tem certeza que deseja excluir esta obra? Esta ação não pode ser desfeita.
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

export default Obras;
