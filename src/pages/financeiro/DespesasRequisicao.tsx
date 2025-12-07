import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FileText, CheckCircle, Clock, AlertCircle, Plus, Edit, Trash2, Eye, Building2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOptimizedSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { useSupabaseCRUD } from "@/hooks/useSupabaseMutation";
import { DataTable, Column } from "@/components/ui/DataTable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DatePicker } from "@/components/ui/date-picker";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Interface para Despesa
interface Despesa {
  id: string;
  cliente_id: string;
  obra_id: string;
  requisicao_id?: string;
  categoria: string;
  valor: number;
  data_despesa: string;
  status?: string;
  comprovante_url?: string;
  fornecedor_cnpj?: string;
  numero_documento?: string;
  observacao?: string;
  // Relacionamentos
  cliente?: {
    id: string;
    nome: string;
  };
  obra?: {
    id: string;
    nome: string;
  };
  requisicao?: {
    id: string;
    titulo: string;
  };
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

interface Cliente {
  id: string;
  nome: string;
  [key: string]: unknown;
}

interface Obra {
  id: string;
  nome: string;
  cliente_id: string;
  [key: string]: unknown;
}

interface Requisicao {
  id: string;
  titulo: string;
  obra_id: string;
  status: string;
  [key: string]: unknown;
}

const despesaSchema = z.object({
  cliente_id: z.string().min(1, "Cliente é obrigatório"),
  obra_id: z.string().min(1, "Obra é obrigatória"),
  requisicao_id: z.string().optional(),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  valor: z.string().min(1, "Valor é obrigatório"),
  data_despesa: z.date({ message: "Data é obrigatória" }),
  observacao: z.string().optional(),
  comprovante_url: z.string().optional(),
  fornecedor_cnpj: z.string().optional(),
  numero_documento: z.string().optional(),
});

type DespesaFormData = z.infer<typeof despesaSchema>;

const DespesasRequisicao = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingDespesa, setEditingDespesa] = useState<Despesa | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedCliente, setSelectedCliente] = useState<string>("");

  // Hooks Supabase
  const { data: despesas = [], isLoading } = useOptimizedSupabaseQuery<Despesa>('DESPESAS');
  const { add, update, delete: deleteDespesa } = useSupabaseCRUD<Despesa>('DESPESAS');

  // Dados de relacionamento
  const { data: clientes = [] } = useOptimizedSupabaseQuery<Cliente>('CLIENTES');
  const { data: todasObras = [] } = useOptimizedSupabaseQuery<Obra>('OBRAS');
  const { data: requisicoes = [] } = useOptimizedSupabaseQuery<Requisicao>('REQUISICOES');

  // Filtrar obras por cliente selecionado
  const obrasFiltradas = useMemo(() => {
    if (!selectedCliente) return todasObras;
    return todasObras.filter(obra => obra.cliente_id === selectedCliente);
  }, [todasObras, selectedCliente]);

  // Form
  const form = useForm<DespesaFormData>({
    resolver: zodResolver(despesaSchema),
    defaultValues: {
      cliente_id: "",
      obra_id: "",
      requisicao_id: "",
      categoria: "",
      valor: "",
      data_despesa: new Date(),
      observacao: "",
      comprovante_url: "",
      fornecedor_cnpj: "",
      numero_documento: "",
    },
  });

  // Atualizar obras quando cliente muda
  useEffect(() => {
    const clienteId = form.watch("cliente_id");
    if (clienteId !== selectedCliente) {
      setSelectedCliente(clienteId);
      form.setValue("obra_id", "");
      form.setValue("requisicao_id", "");
    }
  }, [form.watch("cliente_id")]);

  // Quando editar, popular formulário
  useEffect(() => {
    if (editingDespesa) {
      setSelectedCliente(editingDespesa.cliente_id);
      form.reset({
        cliente_id: editingDespesa.cliente_id,
        obra_id: editingDespesa.obra_id,
        requisicao_id: editingDespesa.requisicao_id || "",
        categoria: editingDespesa.categoria,
        valor: editingDespesa.valor.toString(),
        data_despesa: new Date(editingDespesa.data_despesa),
        observacao: editingDespesa.observacao || "",
        comprovante_url: editingDespesa.comprovante_url || "",
        fornecedor_cnpj: editingDespesa.fornecedor_cnpj || "",
        numero_documento: editingDespesa.numero_documento || "",
      });
    } else {
      form.reset({
        cliente_id: "",
        obra_id: "",
        requisicao_id: "",
        categoria: "",
        valor: "",
        data_despesa: new Date(),
        observacao: "",
        comprovante_url: "",
        fornecedor_cnpj: "",
        numero_documento: "",
      });
      setSelectedCliente("");
    }
  }, [editingDespesa, form]);

  const onSubmit = (data: DespesaFormData) => {
    const valorNumerico = parseFloat(data.valor.replace(/[R$\s.]/g, '').replace(',', '.'));

    const despesaData = {
      cliente_id: data.cliente_id,
      obra_id: data.obra_id,
      requisicao_id: data.requisicao_id || null,
      categoria: data.categoria,
      valor: valorNumerico,
      data_despesa: data.data_despesa.toISOString(),
      observacao: data.observacao,
      comprovante_url: data.comprovante_url,
      fornecedor_cnpj: data.fornecedor_cnpj,
      numero_documento: data.numero_documento,
      status: 'pendente'
    };

    if (editingDespesa) {
      update.mutate(
        { id: editingDespesa.id, updates: despesaData },
        {
          onSuccess: () => {
            toast({
              title: "Despesa atualizada!",
              description: "A despesa foi atualizada com sucesso.",
            });
            setOpen(false);
            setEditingDespesa(null);
          },
          onError: (error: any) => {
            toast({
              title: "Erro ao atualizar",
              description: error.message || "Ocorreu um erro ao atualizar a despesa.",
              variant: "destructive",
            });
          }
        }
      );
    } else {
      add.mutate(despesaData, {
        onSuccess: () => {
          toast({
            title: "Despesa cadastrada!",
            description: "A despesa foi adicionada com sucesso.",
          });
          setOpen(false);
        },
        onError: (error: any) => {
          toast({
            title: "Erro ao cadastrar",
            description: error.message || "Ocorreu um erro ao cadastrar a despesa.",
            variant: "destructive",
          });
        }
      });
    }
  };

  const handleEdit = (despesa: Despesa) => {
    setEditingDespesa(despesa);
    setOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteDespesa.mutate(deleteId, {
        onSuccess: () => {
          toast({
            title: "Despesa excluída!",
            description: "A despesa foi removida com sucesso.",
          });
          setDeleteId(null);
        },
        onError: (error: any) => {
          toast({
            title: "Erro ao excluir",
            description: error.message || "Ocorreu um erro ao excluir a despesa.",
            variant: "destructive",
          });
        }
      });
    }
  };

  const handleDeleteConfirm = (despesa: Despesa) => {
    setDeleteId(despesa.id);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadgeVariant = (status?: string) => {
    switch (status) {
      case 'aprovada': return 'default';
      case 'pendente': return 'secondary';
      case 'rejeitada': return 'destructive';
      default: return 'outline';
    }
  };

  // Definir colunas da tabela
  const columns: Column<Despesa>[] = [
    {
      key: 'data_despesa',
      title: 'Data',
      sortable: true,
      width: '110px',
      render: (value) => (
        <div className="text-sm">
          {format(new Date(value), 'dd/MM/yyyy', { locale: ptBR })}
        </div>
      )
    },
    {
      key: 'cliente',
      title: 'Cliente',
      filterable: true,
      filterType: 'text',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium text-sm">
              {row.cliente?.nome || 'Cliente não informado'}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'obra',
      title: 'Obra',
      filterable: true,
      filterType: 'text',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium text-sm">
              {row.obra?.nome || 'Obra não informada'}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'categoria',
      title: 'Categoria',
      filterable: true,
      filterType: 'text',
      render: (value) => (
        <Badge variant="outline" className="text-xs">
          {value}
        </Badge>
      )
    },
    {
      key: 'valor',
      title: 'Valor',
      sortable: true,
      width: '120px',
      render: (value) => (
        <div className="font-medium text-right">
          {formatCurrency(Number(value))}
        </div>
      )
    },
    {
      key: 'status',
      title: 'Status',
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { value: 'pendente', label: 'Pendente' },
        { value: 'aprovada', label: 'Aprovada' },
        { value: 'rejeitada', label: 'Rejeitada' }
      ],
      width: '120px',
      render: (value) => (
        <Badge variant={getStatusBadgeVariant(value)}>
          {value === 'pendente' && <Clock className="h-3 w-3 mr-1" />}
          {value === 'aprovada' && <CheckCircle className="h-3 w-3 mr-1" />}
          {value === 'rejeitada' && <AlertCircle className="h-3 w-3 mr-1" />}
          {value || 'Pendente'}
        </Badge>
      )
    },
  ];

  // Calcular estatísticas
  const totalDespesas = despesas.reduce((acc, despesa) => acc + Number(despesa.valor), 0);
  const despesasPendentes = despesas.filter(d => d.status === 'pendente').length;
  const despesasAprovadas = despesas.filter(d => d.status === 'aprovada').length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Despesas por Requisição</h1>
          <p className="text-muted-foreground">Gerencimento de despesas vinculadas às requisições</p>
        </div>
        <Button onClick={() => { setEditingDespesa(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Despesa
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{despesas.length}</div>
            <p className="text-xs text-muted-foreground mt-1">cadastradas no sistema</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDespesas)}</div>
            <p className="text-xs text-muted-foreground mt-1">em despesas registradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{despesasPendentes}</div>
            <p className="text-xs text-muted-foreground mt-1">aguardando aprovação</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{despesasAprovadas}</div>
            <p className="text-xs text-muted-foreground mt-1">já aprovadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Despesas com DataTable */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Despesas</CardTitle>
          <CardDescription>Todas as despesas por requisição cadastradas no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={despesas}
            columns={columns}
            loading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDeleteConfirm}
            searchPlaceholder="Buscar por categoria, cliente, obra..."
            emptyMessage="Nenhuma despesa cadastrada ainda."
            showSelection={false}
            showActions={true}
            globalSearch={true}
            hideFilters={false}
          />
        </CardContent>
      </Card>

      {/* Dialog do Formulário */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDespesa ? 'Editar Despesa' : 'Nova Despesa por Requisição'}
            </DialogTitle>
            <DialogDescription>
              {editingDespesa
                ? 'Atualize os dados da despesa abaixo.'
                : 'Preencha os dados da nova despesa vinculada a uma requisição.'
              }
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cliente_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="todos">Selecione um cliente</SelectItem>
                          {clientes.map((cliente) => (
                            <SelectItem key={cliente.id} value={cliente.id}>
                              {cliente.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="obra_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Obra</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma obra" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="todos">Selecione uma obra</SelectItem>
                          {obrasFiltradas.map((obra) => (
                            <SelectItem key={obra.id} value={obra.id}>
                              {obra.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="categoria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Material de construção" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: R$ 1.500,00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="data_despesa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Despesa</FormLabel>
                    <FormControl>
                      <DatePicker
                        selected={field.value}
                        onSelect={field.onChange}
                        mode="single"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="observacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observações adicionais sobre a despesa..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={add.isPending || update.isPending}>
                  {editingDespesa ? 'Atualizar' : 'Cadastrar'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.
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

export default DespesasRequisicao;