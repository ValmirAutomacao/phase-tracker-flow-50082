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
import { Plus, Search, CheckCircle, Clock, XCircle, AlertTriangle, Trash2, User, Building, ThumbsUp, ThumbsDown, Edit, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { useSupabaseCRUD } from "@/hooks/useSupabaseMutation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CarrinhoItens, ItemCarrinho } from "@/components/forms/CarrinhoItens";
import { usePermissions } from "@/hooks/usePermissions";
import { StatusBadge, PriorityBadge } from "@/components/ui/status-badge";
import "@/styles/responsive.css";

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
  status: 'pendente' | 'aprovada' | 'aberta' | 'concluida' | 'cancelada';
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
  funcionario_responsavel_id: z.string().optional(),
  observacoes: z.string().optional(),
});

type RequisicaoFormData = z.infer<typeof requisicaoSchema>;

const Requisicoes = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [editingRequisicao, setEditingRequisicao] = useState<RequisicaoItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewDetailsId, setViewDetailsId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [prioridadeFilter, setPrioridadeFilter] = useState<string>("all");
  const [itensCarrinho, setItensCarrinho] = useState<ItemCarrinho[]>([]);

  // Hooks Supabase para substituir localStorage
  const { data: requisicoes = [], isLoading, error } = useSupabaseQuery<any>('REQUISICOES');
  const { add, update, delete: deleteRequisicao } = useSupabaseCRUD<any>('REQUISICOES');

  // Hook para itens das requisições
  const { data: itensRequisicao = [] } = useSupabaseQuery<any>('ITENS_REQUISICAO');
  const crudItens = useSupabaseCRUD<any>('ITENS_REQUISICAO');

  // Hook de permissões para controlar ações
  const { hasAnyPermission } = usePermissions();
  const podeAprovar = hasAnyPermission(['aprovar_compras']);
  const podeEditar = hasAnyPermission(['editar_compras']);
  const podeExcluir = hasAnyPermission(['deletar_compras']);

  // Query para obras (para dropdown)
  const { data: obras = [] } = useSupabaseQuery<any>('OBRAS');

  // Query para funcionários (para dropdown)
  const { data: funcionarios = [] } = useSupabaseQuery<any>('FUNCIONARIOS');

  const handleDelete = async () => {
    if (deleteId) {
      try {
        // Primeiro excluir itens relacionados
        const itensParaExcluir = itensRequisicao.filter(item => item.requisicao_id === deleteId);
        const deleteItensPromises = itensParaExcluir.map(item =>
          crudItens.delete.mutateAsync(item.id)
        );
        await Promise.all(deleteItensPromises);

        // Depois excluir a requisição
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
      } catch (error) {
        toast({
          title: "Erro ao excluir itens",
          description: "Não foi possível excluir os itens da requisição.",
          variant: "destructive",
        });
      }
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
      funcionario_responsavel_id: "",
      observacoes: "",
    },
  });

  const onSubmit = (data: RequisicaoFormData) => {
    console.log('onSubmit - itensCarrinho:', itensCarrinho);
    console.log('onSubmit - itensCarrinho.length:', itensCarrinho.length);

    // Validação: requisição deve ter pelo menos 1 item
    if (itensCarrinho.length === 0) {
      toast({
        title: "Erro de validação",
        description: "Adicione pelo menos um item ao carrinho antes de salvar a requisição.",
        variant: "destructive",
      });
      return;
    }

    const requisicaoData = {
      obra_id: data.obra_id,
      funcionario_solicitante_id: data.funcionario_solicitante_id,
      titulo: data.titulo,
      descricao: data.descricao || null,
      prioridade: data.prioridade,
      funcionario_responsavel_id: data.funcionario_responsavel_id || null,
      observacoes: data.observacoes || null,
      anexos: null,
    };

    if (editingRequisicao) {
      // Editando requisição existente
      update.mutate(
        { id: editingRequisicao.id, updates: requisicaoData as any },
        {
          onSuccess: async () => {
            // Excluir itens antigos e adicionar novos
            try {
              // Excluir itens existentes da requisição
              const itensExistentes = itensRequisicao.filter(item => item.requisicao_id === editingRequisicao.id);
              const deletePromises = itensExistentes.map(item =>
                crudItens.delete.mutateAsync(item.id)
              );
              await Promise.all(deletePromises);

              // Adicionar novos itens
              const addPromises = itensCarrinho.map((item, index) =>
                crudItens.add.mutateAsync({
                  requisicao_id: editingRequisicao.id,
                  numero: String(index + 1),
                  descricao: item.nome,
                  quantidade: item.quantidade,
                  unidade_medida: 'Un',
                  valor_unitario: item.valor_unitario || 0,
                  comprado: false
                })
              );
              await Promise.all(addPromises);

            } catch (error) {
              console.error('Erro ao atualizar itens:', error);
            }

            toast({
              title: "Requisição atualizada!",
              description: "A requisição foi atualizada com sucesso.",
            });
            setOpen(false);
            setEditingRequisicao(null);
            form.reset();
            setItensCarrinho([]);
          },
          onError: (error) => {
            toast({
              title: "Erro ao atualizar requisição",
              description: error.message || "Tente novamente em alguns instantes.",
              variant: "destructive",
            });
          },
        }
      );
    } else {
      // Criando nova requisição
      const novaRequisicao = {
        ...requisicaoData,
        status: "pendente" as const,
      };

      add.mutate(novaRequisicao, {
        onSuccess: async (requisicaoCriada) => {
          try {
            // Adicionar itens do carrinho à nova tabela itens_requisicao
            const addPromises = itensCarrinho.map((item, index) =>
              crudItens.add.mutateAsync({
                requisicao_id: requisicaoCriada.id,
                numero: String(index + 1),
                descricao: item.nome,
                quantidade: item.quantidade,
                unidade_medida: 'Un',
                valor_unitario: item.valor_unitario || 0,
                comprado: false
              })
            );
            await Promise.all(addPromises);

            toast({
              title: "Requisição criada!",
              description: "A requisição foi criada com sucesso e está aguardando aprovação.",
            });
          } catch (error) {
            console.error('Erro ao adicionar itens:', error);
            toast({
              title: "Requisição criada com aviso",
              description: "A requisição foi criada, mas houve erro ao salvar os itens.",
              variant: "destructive",
            });
          }

          setOpen(false);
          form.reset();
          setItensCarrinho([]);
        },
        onError: (error) => {
          toast({
            title: "Erro ao criar requisição",
            description: error.message || "Tente novamente em alguns instantes.",
            variant: "destructive",
          });
        },
      });
    }
  };

  const handleStatusChange = (id: string, novoStatus: RequisicaoItem['status']) => {
    const requisicao = requisicoes.find(r => r.id === id);
    if (!requisicao) return;

    const updatedRequisicao = {
      status: novoStatus,
    };

    update.mutate(
      { id, updates: updatedRequisicao as any },
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

  const handleAprovar = (id: string) => {
    if (!podeAprovar) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para aprovar requisições.",
        variant: "destructive",
      });
      return;
    }

    // Quando aprovada, fica como "aberta" para permitir despesas
    handleStatusChange(id, "aberta");
  };

  const handleRecusar = (id: string) => {
    if (!podeAprovar) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para recusar requisições.",
        variant: "destructive",
      });
      return;
    }

    handleStatusChange(id, "cancelada");
  };

  const handleEdit = (requisicao: RequisicaoItem) => {
    if (!podeEditar) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para editar requisições.",
        variant: "destructive",
      });
      return;
    }

    setEditingRequisicao(requisicao);
    // Buscar itens da nova tabela itens_requisicao
    const itensReq = itensRequisicao.filter(item => item.requisicao_id === requisicao.id);
    const itensCarrinhoFormat = itensReq.map(item => ({
      id: item.id,
      nome: item.descricao,
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario || 0
    }));
    setItensCarrinho(itensCarrinhoFormat);
    form.reset({
      obra_id: requisicao.obra_id,
      funcionario_solicitante_id: requisicao.funcionario_solicitante_id,
      titulo: requisicao.titulo,
      descricao: requisicao.descricao || "",
      prioridade: requisicao.prioridade,
      funcionario_responsavel_id: requisicao.funcionario_responsavel_id || "",
      observacoes: requisicao.observacoes || "",
    });
    setOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string; icon: React.ElementType }> = {
      pendente: {
        label: "Pendente",
        className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
        icon: Clock
      },
      aberta: {
        label: "Aberta",
        className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
        icon: AlertTriangle
      },
      aprovada: {
        label: "Aprovada",
        className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
        icon: CheckCircle
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
        <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            // Resetar formulário quando fechar o dialog
            setEditingRequisicao(null);
            setItensCarrinho([]);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Requisição
            </Button>
          </DialogTrigger>
          <DialogContent className="dialog-content-mobile">
            <DialogHeader className="dialog-header">
              <DialogTitle>{editingRequisicao ? "Editar Requisição" : "Nova Requisição"}</DialogTitle>
              <DialogDescription>
                {editingRequisicao
                  ? "Atualize os dados da requisição de compra"
                  : "Crie uma nova solicitação ou ticket. Preencha os dados obrigatórios e opcionais conforme necessário."
                }
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
                <div className="dialog-form-container space-y-4">
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

                <div className="grid-responsive gap-4">
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

                </div>

                <FormField
                  control={form.control}
                  name="funcionario_responsavel_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Funcionário Responsável</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
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

                </div>
                
                <div className="form-actions">
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
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-lg-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total de Requisições</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{requisicoes.length}</div>
              <p className="text-xs text-muted-foreground mt-1">solicitações cadastradas</p>
            </CardContent>
          </Card>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
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
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Abertas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {requisicoes.filter(r => r.status === "aberta").length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">disponíveis para despesas</p>
            </CardContent>
          </Card>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
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
      </div>

      {/* Filtros Avançados */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busque e filtre requisições por critérios específicos</CardDescription>
        </CardHeader>
          <CardContent>
            <div className="row g-3">
              <div className="col-12">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por título, descrição, obra..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="col-12 col-sm-6">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="aberta">Aberta</SelectItem>
                    <SelectItem value="aprovada">Aprovada</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-12 col-sm-6">
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
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                    {/* Botões de aprovação/recusa (apenas para quem tem permissão e status pendente) */}
                    {req.status === "pendente" && podeAprovar && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAprovar(req.id)}
                          className="text-green-600 hover:text-green-700 w-full sm:w-auto"
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRecusar(req.id)}
                          className="text-red-600 hover:text-red-700 w-full sm:w-auto"
                        >
                          <ThumbsDown className="h-4 w-4 mr-1" />
                          Recusar
                        </Button>
                      </>
                    )}

                    {/* Botões de controle de status (para requisições abertas) */}
                    {req.status === "aberta" && podeAprovar && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(req.id, "concluida")}
                          className="text-green-600 hover:text-green-700 w-full sm:w-auto"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Marcar como Concluída
                        </Button>
                      </>
                    )}

                    {/* Botão de editar (apenas para quem tem permissão) */}
                    {podeEditar && req.status === "pendente" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(req)}
                        className="w-full sm:w-auto"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}

                    {/* Botão de ver detalhes */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewDetailsId(req.id)}
                      className="w-full sm:w-auto"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Detalhes
                    </Button>

                    {/* Botão de excluir (apenas para quem tem permissão) */}
                    {podeExcluir && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteId(req.id)}
                        className="w-full sm:w-auto"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
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

      {/* Modal de Detalhes da Requisição */}
      <Dialog open={!!viewDetailsId} onOpenChange={() => setViewDetailsId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detalhes da Requisição
            </DialogTitle>
          </DialogHeader>

          {(() => {
            const requisicao = filteredRequisicoes.find(req => req.id === viewDetailsId);
            if (!requisicao) return null;

            const itensRequisicaoDetalhes = itensRequisicao.filter(item => item.requisicao_id === viewDetailsId);

            return (
              <div className="space-y-6">
                {/* Informações Básicas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Título</label>
                      <p className="font-semibold">{requisicao.titulo}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="mt-1">{getStatusBadge(requisicao.status)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Prioridade</label>
                      <div className="mt-1">{getPrioridadeBadge(requisicao.prioridade)}</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Obra</label>
                      <p className="font-semibold">{requisicao.obra?.nome || 'Obra não encontrada'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Solicitante</label>
                      <p className="font-semibold">{requisicao.funcionario_solicitante?.nome || 'Funcionário não encontrado'}</p>
                    </div>
                    {requisicao.funcionario_responsavel && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Responsável</label>
                        <p className="font-semibold">{requisicao.funcionario_responsavel.nome}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Descrição */}
                {requisicao.descricao && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                    <p className="mt-1 p-3 bg-muted/50 rounded-lg">{requisicao.descricao}</p>
                  </div>
                )}

                {/* Observações */}
                {requisicao.observacoes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Observações</label>
                    <p className="mt-1 p-3 bg-muted/50 rounded-lg">{requisicao.observacoes}</p>
                  </div>
                )}

                {/* Itens da Requisição */}
                {itensRequisicaoDetalhes.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-3 block">
                      Itens da Requisição ({itensRequisicaoDetalhes.length})
                    </label>
                    <div className="space-y-3">
                      {itensRequisicaoDetalhes.map((item, index) => (
                        <div key={item.id || index} className="border rounded-lg p-4 bg-muted/50">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Número</p>
                              <p className="font-medium">{item.numero}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Descrição</p>
                              <p className="font-medium">{item.descricao}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Qtd.</p>
                                <p className="font-medium">{item.quantidade}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Unidade</p>
                                <p className="font-medium">{item.unidade_medida}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Status</p>
                              <Badge className={`${item.quantidade_comprada > 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {item.quantidade_comprada > 0 ? 'Parcialmente Comprado' : 'Pendente'}
                              </Badge>
                            </div>
                          </div>
                          {item.valor_unitario && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Valor Unitário:</span>
                                  <p className="font-semibold">R$ {Number(item.valor_unitario).toFixed(2)}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Qtd. Comprada:</span>
                                  <p className="font-semibold">{item.quantidade_comprada || 0}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Total:</span>
                                  <p className="font-semibold">R$ {(Number(item.valor_unitario) * Number(item.quantidade)).toFixed(2)}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Datas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Criada em</label>
                    <p className="font-medium">{new Date(requisicao.created_at || Date.now()).toLocaleDateString('pt-BR')}</p>
                  </div>
                  {requisicao.data_vencimento && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Vencimento</label>
                      <p className="font-medium">{new Date(requisicao.data_vencimento).toLocaleDateString('pt-BR')}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Requisicoes;
