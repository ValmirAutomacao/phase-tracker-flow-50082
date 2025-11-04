import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ArrowLeft,
  Edit,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
  Plus,
  ShoppingCart,
  Receipt,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { STORAGE_KEYS, getFromStorage, addToStorage, updateInStorage, deleteFromStorage } from "@/lib/localStorage";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const despesaSchema = z.object({
  requisicao_id: z.string().optional(),
  fornecedor: z.string().min(1, "Fornecedor é obrigatório"),
  cnpj: z.string().min(1, "CNPJ é obrigatório"),
  data: z.string().min(1, "Data é obrigatória"),
  hora: z.string().min(1, "Hora é obrigatória"),
  formaPagamento: z.string().min(1, "Forma de pagamento é obrigatória"),
  tipoParcela: z.string().min(1, "Tipo de parcela é obrigatório"),
  quantidadeParcelas: z.string().min(1, "Quantidade de parcelas é obrigatória"),
  valorParcela: z.string().min(1, "Valor da parcela é obrigatório"),
  bandeira: z.string().min(1, "Bandeira é obrigatória"),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  responsavel: z.string().min(1, "Responsável é obrigatório"),
  status: z.string().min(1, "Status é obrigatório"),
  imagemComprovante: z.string().optional(),
  observacoes: z.string().optional(),
  itens_relacionados: z.array(z.object({
    id: z.string(),
    nome: z.string(),
    quantidade: z.number(),
    valor_unitario: z.number().optional(),
    comprado: z.boolean(),
  })).optional(),
});

type DespesaFormData = z.infer<typeof despesaSchema>;

interface Despesa {
  id: string;
  requisicao_id?: string;
  fornecedor: string;
  cnpj: string;
  data: string;
  hora: string;
  formaPagamento: string;
  tipoParcela: string;
  quantidadeParcelas: number;
  valorParcela: number;
  bandeira: string;
  categoria: string;
  status: string;
  responsavel: string;
  imagemComprovante?: string;
  observacoes?: string;
  itens_relacionados?: Array<{
    id: string;
    nome: string;
    quantidade: number;
    valor_unitario?: number;
    comprado: boolean;
  }>;
}

interface Requisicao {
  id: string;
  titulo: string;
  obra_id: string;
  funcionario_solicitante_id: string;
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
  itens_produtos?: Array<{
    id: string;
    nome: string;
    quantidade: number;
    valor_unitario?: number;
    comprado: boolean;
  }>;
}

const DespesasDetalhes = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const obraId = searchParams.get("obra");

  const [openEdit, setOpenEdit] = useState(false);
  const [openNew, setOpenNew] = useState(false);
  const [selectedDespesa, setSelectedDespesa] = useState<Despesa | null>(null);
  const [selectedRequisicao, setSelectedRequisicao] = useState<string>("");

  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [requisicoes, setRequisicoes] = useState<Requisicao[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const storedDespesas = getFromStorage<Despesa>(STORAGE_KEYS.DESPESAS);
    const storedRequisicoes = getFromStorage<Requisicao>(STORAGE_KEYS.REQUISICOES);
    setDespesas(storedDespesas);
    setRequisicoes(storedRequisicoes.filter(req =>
      obraId ? req.obra_id === obraId : true
    ));
  }, [obraId]);

  const form = useForm<DespesaFormData>({
    resolver: zodResolver(despesaSchema),
    defaultValues: {
      requisicao_id: "",
      fornecedor: "",
      cnpj: "",
      data: "",
      hora: "",
      formaPagamento: "",
      tipoParcela: "",
      quantidadeParcelas: "1",
      valorParcela: "",
      bandeira: "",
      categoria: "",
      responsavel: "",
      status: "pendente",
      imagemComprovante: "",
      observacoes: "",
      itens_relacionados: [],
    },
  });


  const handleCreate = (data: DespesaFormData) => {
    const requisicaoSelecionada = requisicoes.find(r => r.id === data.requisicao_id);

    const novaDespesa: Despesa = {
      id: crypto.randomUUID(),
      requisicao_id: data.requisicao_id,
      fornecedor: data.fornecedor,
      cnpj: data.cnpj,
      data: data.data,
      hora: data.hora,
      formaPagamento: data.formaPagamento,
      tipoParcela: data.tipoParcela,
      quantidadeParcelas: parseInt(data.quantidadeParcelas),
      valorParcela: parseFloat(data.valorParcela),
      bandeira: data.bandeira,
      categoria: data.categoria,
      status: data.status,
      responsavel: data.responsavel,
      imagemComprovante: data.imagemComprovante,
      observacoes: data.observacoes,
      itens_relacionados: requisicaoSelecionada?.itens_produtos || [],
    };

    const updated = addToStorage<Despesa>(STORAGE_KEYS.DESPESAS, novaDespesa);
    setDespesas(updated);
    setOpenNew(false);
    form.reset();
    setSelectedRequisicao("");

    toast({
      title: "Nova despesa criada!",
      description: "A despesa foi registrada com sucesso.",
    });
  };

  const handleEdit = (data: DespesaFormData) => {
    if (!selectedDespesa) return;

    const updated = updateInStorage<Despesa>(STORAGE_KEYS.DESPESAS, selectedDespesa.id.toString(), {
      requisicao_id: data.requisicao_id,
      fornecedor: data.fornecedor,
      cnpj: data.cnpj,
      data: data.data,
      hora: data.hora,
      formaPagamento: data.formaPagamento,
      tipoParcela: data.tipoParcela,
      quantidadeParcelas: parseInt(data.quantidadeParcelas),
      valorParcela: parseFloat(data.valorParcela),
      bandeira: data.bandeira,
      categoria: data.categoria,
      status: data.status,
      responsavel: data.responsavel,
      imagemComprovante: data.imagemComprovante,
      observacoes: data.observacoes,
      itens_relacionados: data.itens_relacionados,
    });

    setDespesas(updated);
    setOpenEdit(false);
    setSelectedDespesa(null);
    form.reset();
    toast({
      title: "Despesa atualizada!",
      description: "As alterações foram salvas com sucesso.",
    });
  };

  const handleDelete = () => {
    if (deleteId) {
      const updated = deleteFromStorage<Despesa>(STORAGE_KEYS.DESPESAS, deleteId);
      setDespesas(updated);
      toast({
        title: "Despesa excluída!",
        description: "A despesa foi removida com sucesso.",
      });
      setDeleteId(null);
    }
  };

  const openEditDialog = (despesa: Despesa) => {
    setSelectedDespesa(despesa);
    form.reset({
      requisicao_id: despesa.requisicao_id || "",
      fornecedor: despesa.fornecedor,
      cnpj: despesa.cnpj,
      data: despesa.data,
      hora: despesa.hora,
      formaPagamento: despesa.formaPagamento,
      tipoParcela: despesa.tipoParcela,
      quantidadeParcelas: despesa.quantidadeParcelas.toString(),
      valorParcela: despesa.valorParcela.toString(),
      bandeira: despesa.bandeira,
      categoria: despesa.categoria,
      responsavel: despesa.responsavel,
      status: despesa.status,
      imagemComprovante: despesa.imagemComprovante,
      observacoes: despesa.observacoes || "",
      itens_relacionados: despesa.itens_relacionados || [],
    });
    setOpenEdit(true);
  };

  const openNewDialog = () => {
    form.reset();
    setSelectedRequisicao("");
    setOpenNew(true);
  };

  const handleRequisicaoChange = (requisicaoId: string) => {
    setSelectedRequisicao(requisicaoId);
    const requisicao = requisicoes.find(r => r.id === requisicaoId);

    if (requisicao) {
      form.setValue('requisicao_id', requisicaoId);
      form.setValue('categoria', 'Material'); // Categoria padrão para requisições
      form.setValue('itens_relacionados', requisicao.itens_produtos || []);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string; icon: React.ComponentType }> = {
      validado: { 
        label: "Validado", 
        className: "bg-green-100 text-green-700 hover:bg-green-100",
        icon: CheckCircle
      },
      pendente: { 
        label: "Pendente", 
        className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
        icon: Clock
      },
      rejeitado: { 
        label: "Rejeitado", 
        className: "bg-red-100 text-red-700 hover:bg-red-100",
        icon: AlertCircle
      },
    };
    
    const variant = variants[status];
    const Icon = variant.icon;
    
    return (
      <Badge className={variant.className}>
        <Icon className="h-3 w-3 mr-1" />
        {variant.label}
      </Badge>
    );
  };

  const totalDespesas = despesas.reduce((acc, d) => acc + (d.valorParcela * d.quantidadeParcelas), 0);
  const despesasValidadas = despesas.filter(d => d.status === "validado").reduce((acc, d) => acc + (d.valorParcela * d.quantidadeParcelas), 0);
  const despesasPendentes = despesas.filter(d => d.status === "pendente").reduce((acc, d) => acc + (d.valorParcela * d.quantidadeParcelas), 0);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Despesas - {obraId || "Geral"}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Gerenciamento de despesas da obra</p>
          </div>
        </div>
        <Button onClick={openNewDialog} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nova Despesa
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Total de Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDespesas)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{despesas.length} despesas registradas</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Validadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(despesasValidadas)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">despesas aprovadas</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(despesasPendentes)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">aguardando validação</p>
          </CardContent>
        </Card>
      </div>

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Despesas</CardTitle>
          <CardDescription>Todas as despesas desta obra</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {despesas.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground">Nenhuma despesa registrada ainda</p>
                <p className="text-sm text-muted-foreground">Clique em "Nova Despesa" para começar</p>
              </div>
            ) : (
              despesas.map((despesa) => {
                const requisicaoRelacionada = requisicoes.find(r => r.id === despesa.requisicao_id);

                return (
                  <div
                    key={despesa.id}
                    className="flex flex-col lg:flex-row lg:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4"
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <h4 className="font-semibold truncate">{despesa.fornecedor}</h4>
                          <div className="flex gap-2">
                            {getStatusBadge(despesa.status)}
                            {requisicaoRelacionada && (
                              <Badge variant="outline" className="text-xs">
                                <ShoppingCart className="h-3 w-3 mr-1" />
                                Requisição
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Informações da requisição relacionada */}
                        {requisicaoRelacionada && (
                          <div className="mb-2 p-2 bg-blue-50 rounded text-sm">
                            <p className="font-medium text-blue-900">
                              Requisição: {requisicaoRelacionada.titulo}
                            </p>
                            {despesa.itens_relacionados && despesa.itens_relacionados.length > 0 && (
                              <p className="text-blue-700 text-xs">
                                {despesa.itens_relacionados.length} itens relacionados
                              </p>
                            )}
                          </div>
                        )}

                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex flex-wrap gap-4">
                            <span>CNPJ: {despesa.cnpj}</span>
                            <span>Bandeira: {despesa.bandeira}</span>
                          </div>
                          <p>{despesa.formaPagamento} - {despesa.quantidadeParcelas}x de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(despesa.valorParcela)}</p>
                          <div className="flex flex-wrap gap-4">
                            <span>Categoria: {despesa.categoria}</span>
                            <span>Responsável: {despesa.responsavel}</span>
                          </div>
                          <p>Data: {new Date(despesa.data).toLocaleDateString('pt-BR')} às {despesa.hora}</p>
                          {despesa.observacoes && (
                            <p className="text-xs bg-gray-50 p-2 rounded mt-2">{despesa.observacoes}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground mb-1">Total</div>
                        <div className="text-xl font-bold">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(despesa.valorParcela * despesa.quantidadeParcelas)}
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(despesa)} className="flex-1 sm:flex-none">
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setDeleteId(despesa.id.toString())} className="shrink-0">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>


      {/* New Expense Dialog */}
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Despesa</DialogTitle>
            <DialogDescription>
              Registre uma nova despesa, opcionalmente vinculada a uma requisição
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
              {/* Seleção de Requisição */}
              <FormField
                control={form.control}
                name="requisicao_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requisição (Opcional)</FormLabel>
                    <Select onValueChange={handleRequisicaoChange} value={selectedRequisicao}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma requisição para vincular" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {requisicoes.map(req => (
                          <SelectItem key={req.id} value={req.id}>
                            {req.titulo} ({req.status})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Resto do formulário aqui será adicionado */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fornecedor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fornecedor (Estabelecimento)</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do estabelecimento" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl>
                        <Input placeholder="00.000.000/0000-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="data"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data da Compra</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hora"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora da Compra</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="formaPagamento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de Pagamento</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Crédito à vista">Crédito à vista</SelectItem>
                          <SelectItem value="Crédito parcelado">Crédito parcelado</SelectItem>
                          <SelectItem value="Débito">Débito</SelectItem>
                          <SelectItem value="PIX">PIX</SelectItem>
                          <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                          <SelectItem value="Transferência">Transferência</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bandeira"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bandeira</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Visa">Visa</SelectItem>
                          <SelectItem value="Mastercard">Mastercard</SelectItem>
                          <SelectItem value="Elo">Elo</SelectItem>
                          <SelectItem value="American Express">American Express</SelectItem>
                          <SelectItem value="Hipercard">Hipercard</SelectItem>
                          <SelectItem value="N/A">Não se aplica</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="tipoParcela"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Parcela</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="À vista">À vista</SelectItem>
                          <SelectItem value="Parcelado">Parcelado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="quantidadeParcelas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade de Parcelas</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" placeholder="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="valorParcela"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor da Parcela (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="categoria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Material, Equipamento" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="responsavel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsável</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do responsável" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="validado">Validado</SelectItem>
                          <SelectItem value="rejeitado">Rejeitado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Informações adicionais sobre a despesa..." rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imagemComprovante"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imagem do Comprovante (URL)</FormLabel>
                    <FormControl>
                      <Input placeholder="URL da imagem do comprovante" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setOpenNew(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Criar Despesa</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Despesa</DialogTitle>
            <DialogDescription>
              Atualize as informações da despesa
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEdit)} className="space-y-4">
              {/* Mesmo layout do formulário de criação */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fornecedor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fornecedor (Estabelecimento)</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do estabelecimento" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl>
                        <Input placeholder="00.000.000/0000-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="data"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data da Compra</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hora"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora da Compra</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="formaPagamento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de Pagamento</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Crédito à vista">Crédito à vista</SelectItem>
                          <SelectItem value="Crédito parcelado">Crédito parcelado</SelectItem>
                          <SelectItem value="Débito">Débito</SelectItem>
                          <SelectItem value="PIX">PIX</SelectItem>
                          <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                          <SelectItem value="Transferência">Transferência</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bandeira"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bandeira</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Visa">Visa</SelectItem>
                          <SelectItem value="Mastercard">Mastercard</SelectItem>
                          <SelectItem value="Elo">Elo</SelectItem>
                          <SelectItem value="American Express">American Express</SelectItem>
                          <SelectItem value="Hipercard">Hipercard</SelectItem>
                          <SelectItem value="N/A">Não se aplica</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="tipoParcela"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Parcela</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="À vista">À vista</SelectItem>
                          <SelectItem value="Parcelado">Parcelado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="quantidadeParcelas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade de Parcelas</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" placeholder="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="valorParcela"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor da Parcela (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="categoria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Material, Equipamento" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="responsavel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsável</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do responsável" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="validado">Validado</SelectItem>
                          <SelectItem value="rejeitado">Rejeitado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Informações adicionais sobre a despesa..." rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imagemComprovante"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imagem do Comprovante (URL)</FormLabel>
                    <FormControl>
                      <Input placeholder="URL da imagem do comprovante" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setOpenEdit(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar Alterações</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

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

export default DespesasDetalhes;
