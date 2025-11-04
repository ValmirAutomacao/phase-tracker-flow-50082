import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Search, CheckCircle, Clock, XCircle, AlertTriangle, Trash2, User, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOptimizedSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { useSupabaseCRUD } from "@/hooks/useSupabaseMutation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CarrinhoItens, ItemCarrinho } from "@/components/forms/CarrinhoItens";

// Interface para Obra (para relacionamento)
interface Obra {
  id: string;
  nome: string;
}

// Interface para Funcionário (para relacionamento)
interface Funcionario {
  id: string;
  nome: string;
}

// Interface para Requisição compatível com Supabase
interface RequisicaoItem {
  id: string;
  obra_id: string; // FK para obras
  funcionario_solicitante_id: string; // FK para funcionarios
  titulo: string;
  descricao?: string;
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  data_vencimento?: string;
  funcionario_responsavel_id?: string; // FK para funcionarios
  observacoes?: string;
  anexos?: Record<string, unknown>; // jsonb
  created_at?: string;
  updated_at?: string;
  // Campos de relacionamento
  obra?: {
    id: string;
    nome: string;
  };
  funcionario_solicitante?: {
    id: string;
    nome: string;
  };
  funcionario_responsavel?: {
    id: string;
    nome: string;
  };
  // Campo para produtos/itens da requisição
  itens_produtos?: Array<{
    id: string;
    nome: string;
    quantidade: number;
    valor_unitario: number;
    comprado: boolean;
  }>;
}

const requisicaoSchema = z.object({
  obra_id: z.string().min(1, "Selecione uma obra"),
  funcionario_solicitante_id: z.string().min(1, "Selecione um funcionário solicitante"),
  titulo: z.string().min(10, "O título deve ter no mínimo 10 caracteres"),
  descricao: z.string().optional(),
  prioridade: z.enum(["baixa", "media", "alta", "urgente"]),
  data_vencimento: z.string().optional(),
  funcionario_responsavel_id: z.string().optional(),
  observacoes: z.string().optional(),
});

type RequisicaoFormData = z.infer<typeof requisicaoSchema>;

const Requisicoes = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [prioridadeFilter, setPrioridadeFilter] = useState<string>("all");
  const [itensCarrinho, setItensCarrinho] = useState<ItemCarrinho[]>([]);

  // Hooks Supabase para substituir localStorage
  const { data: requisicoes = [], isLoading, error } = useOptimizedSupabaseQuery<RequisicaoItem>('REQUISICOES');
  const { add, update, delete: deleteRequisicao } = useSupabaseCRUD<RequisicaoItem>('REQUISICOES');

  // Query para obras (para dropdown)
  const { data: obras = [] } = useOptimizedSupabaseQuery<Obra>('OBRAS');

  // Query para funcionários (para dropdown)
  const { data: funcionarios = [] } = useOptimizedSupabaseQuery<Funcionario>('FUNCIONARIOS');

  const handleDelete = () => {
    if (deleteId) {
      deleteRequisicao.mutate(deleteId, {
        onSuccess: () => {
          toast({
            title: "Requisição excluída!",
            description: "A requisição foi removida com sucesso.",
          });
          setDeleteId(null);
        },
        onError: (error) => {
          toast({
            title: "Erro ao excluir requisição",
            description: error.message || "Tente novamente em alguns instantes.",
            variant: "destructive",
          });
        },
      });
    }
  };

  // Filtros avançados com memoização para performance
  const filteredRequisicoes = useMemo(() => {
    return requisicoes.filter(req => {
      // Fallback seguro para evitar erros de propriedades undefined/null
      const titulo = req.titulo || '';
      const descricao = req.descricao || '';
      const obraNome = req.obra?.nome || '';
      const funcionarioNome = req.funcionario_solicitante?.nome || '';

      const matchesSearch = titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           obraNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           funcionarioNome.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || req.status === statusFilter;
      const matchesPrioridade = prioridadeFilter === "all" || req.prioridade === prioridadeFilter;

      return matchesSearch && matchesStatus && matchesPrioridade;
    });
  }, [requisicoes, searchTerm, statusFilter, prioridadeFilter]);

  const form = useForm<RequisicaoFormData>({
    resolver: zodResolver(requisicaoSchema),
    defaultValues: {
      obra_id: "",
      funcionario_solicitante_id: "",
      titulo: "",
      descricao: "",
      prioridade: "media",
      data_vencimento: "",
      funcionario_responsavel_id: "",
      observacoes: "",
    },
  });

  const onSubmit = (data: RequisicaoFormData) => {
    // Validação: requisição deve ter pelo menos 1 item
    if (itensCarrinho.length === 0) {
      toast({
        title: "Erro de validação",
        description: "Adicione pelo menos um item ao carrinho antes de criar a requisição.",
        variant: "destructive",
      });
      return;
    }

    const novaRequisicao = {
      obra_id: data.obra_id,
      funcionario_solicitante_id: data.funcionario_solicitante_id,
      titulo: data.titulo,
      descricao: data.descricao || null,
      status: "pendente" as const,
      prioridade: data.prioridade,
      data_vencimento: data.data_vencimento || null,
      funcionario_responsavel_id: data.funcionario_responsavel_id || null,
      observacoes: data.observacoes || null,
      anexos: null,
      itens_produtos: itensCarrinho,
    };

    add.mutate(novaRequisicao, {
      onSuccess: () => {
        toast({
          title: "Requisição criada!",
          description: "A requisição foi criada com sucesso e está aguardando aprovação.",
        });
        setOpen(false);
        form.reset();
        setItensCarrinho([]); // Limpar carrinho após sucesso
      },
      onError: (error) => {
        toast({
          title: "Erro ao criar requisição",
          description: error.message || "Tente novamente em alguns instantes.",
          variant: "destructive",
        });
      },
    });
  };

  const handleStatusChange = (id: string, novoStatus: RequisicaoItem['status']) => {
    const requisicao = requisicoes.find(r => r.id === id);
    if (!requisicao) return;

    const updatedRequisicao = {
      ...requisicao,
      status: novoStatus,
    };

    update.mutate(
      { id, data: updatedRequisicao },
      {
        onSuccess: () => {
          const statusLabels = {
            pendente: "pendente",
            em_andamento: "em andamento",
            concluida: "concluída",
            cancelada: "cancelada"
          };
          toast({
            title: `Requisição ${statusLabels[novoStatus]}!`,
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string; icon: React.ElementType }> = {
      pendente: {
        label: "Pendente",
        className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
        icon: Clock
      },
      em_andamento: {
        label: "Em Andamento",
        className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
        icon: AlertTriangle
      },
      concluida: {
        label: "Concluída",
        className: "bg-green-100 text-green-700 hover:bg-green-100",
        icon: CheckCircle
      },
      cancelada: {
        label: "Cancelada",
        className: "bg-red-100 text-red-700 hover:bg-red-100",
        icon: XCircle
      },
    };

    const variant = variants[status] || variants.pendente;
    const Icon = variant.icon;

    return (
      <Badge className={variant.className}>
        <Icon className="h-3 w-3 mr-1" />
        {variant.label}
      </Badge>
    );
  };

  const getPrioridadeBadge = (prioridade: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      baixa: {
        label: "Baixa",
        className: "bg-gray-100 text-gray-700"
      },
      media: {
        label: "Média",
        className: "bg-blue-100 text-blue-700"
      },
      alta: {
        label: "Alta",
        className: "bg-orange-100 text-orange-700"
      },
      urgente: {
        label: "Urgente",
        className: "bg-red-100 text-red-700"
      },
    };

    const variant = variants[prioridade] || variants.media;

    return (
      <Badge variant="secondary" className={variant.className}>
        {variant.label}
      </Badge>
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Requisições & Tickets</h1>
          <p className="text-muted-foreground">Sistema de solicitações e acompanhamento de tarefas</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Requisição
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Requisição</DialogTitle>
              <DialogDescription>
                Crie uma nova solicitação ou ticket. Preencha os dados obrigatórios e opcionais conforme necessário.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="obra_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Obra *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a obra" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {obras.map(obra => (
                            <SelectItem key={obra.id} value={obra.id}>{obra.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="funcionario_solicitante_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Funcionário Solicitante *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o funcionário" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {funcionarios.map(funcionario => (
                            <SelectItem key={funcionario.id} value={funcionario.id}>{funcionario.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="titulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título da Requisição *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Solicitação de materiais para acabamento do 3º andar"
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
                          placeholder="Descreva detalhadamente a solicitação..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="prioridade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioridade *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a prioridade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="baixa">Baixa</SelectItem>
                            <SelectItem value="media">Média</SelectItem>
                            <SelectItem value="alta">Alta</SelectItem>
                            <SelectItem value="urgente">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="data_vencimento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Vencimento</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="funcionario_responsavel_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Funcionário Responsável</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o responsável (opcional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {funcionarios.map(funcionario => (
                            <SelectItem key={funcionario.id} value={funcionario.id}>{funcionario.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Observações adicionais..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Carrinho de Itens */}
                <div className="pt-4">
                  <CarrinhoItens
                    itens={itensCarrinho}
                    onItensChange={setItensCarrinho}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Criar Requisição</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Requisições</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requisicoes.length}</div>
            <p className="text-xs text-muted-foreground mt-1">solicitações cadastradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {requisicoes.filter(r => r.status === "pendente").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">aguardando análise</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {requisicoes.filter(r => r.status === "em_andamento").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">em execução</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {requisicoes.filter(r => r.status === "concluida").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">finalizadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros Avançados */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busque e filtre requisições por critérios específicos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, descrição, obra..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
              <Select value={prioridadeFilter} onValueChange={setPrioridadeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Prioridades</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Requisições */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Requisições</CardTitle>
          <CardDescription>
            {filteredRequisicoes.length} de {requisicoes.length} requisições
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
                      <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 w-20 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              ))
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Erro ao carregar requisições: {error.message}</p>
              </div>
            ) : filteredRequisicoes.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {requisicoes.length === 0
                    ? "Nenhuma requisição cadastrada ainda."
                    : "Nenhuma requisição encontrada com os filtros aplicados."
                  }
                </p>
              </div>
            ) : (
              filteredRequisicoes.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col lg:flex-row lg:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4"
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h4 className="font-semibold truncate">{req.titulo}</h4>
                        <div className="flex gap-2">
                          {getStatusBadge(req.status)}
                          {getPrioridadeBadge(req.prioridade)}
                        </div>
                      </div>
                      {req.descricao && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{req.descricao}</p>
                      )}
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex flex-wrap gap-4">
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            <span><strong>Obra:</strong> {req.obra?.nome || 'Obra não encontrada'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span><strong>Solicitante:</strong> {req.funcionario_solicitante?.nome || 'Funcionário não encontrado'}</span>
                          </div>
                        </div>
                        {req.funcionario_responsavel && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span><strong>Responsável:</strong> {req.funcionario_responsavel.nome}</span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-4 text-xs">
                          <span>Criada: {new Date(req.created_at || Date.now()).toLocaleDateString('pt-BR')}</span>
                          {req.data_vencimento && (
                            <span>Vencimento: {new Date(req.data_vencimento).toLocaleDateString('pt-BR')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                    {req.status === "pendente" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(req.id, "em_andamento")}
                          className="text-blue-600 hover:text-blue-700 w-full sm:w-auto"
                        >
                          Iniciar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(req.id, "cancelada")}
                          className="text-red-600 hover:text-red-700 w-full sm:w-auto"
                        >
                          Cancelar
                        </Button>
                      </>
                    )}
                    {req.status === "em_andamento" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(req.id, "concluida")}
                          className="text-green-600 hover:text-green-700 w-full sm:w-auto"
                        >
                          Concluir
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(req.id, "cancelada")}
                          className="text-red-600 hover:text-red-700 w-full sm:w-auto"
                        >
                          Cancelar
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteId(req.id)}
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
              Tem certeza que deseja excluir esta requisição? Esta ação não pode ser desfeita.
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

export default Requisicoes;
