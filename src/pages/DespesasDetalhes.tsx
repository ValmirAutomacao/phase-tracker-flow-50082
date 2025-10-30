import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  ArrowLeft,
  Edit,
  FileText,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { STORAGE_KEYS, getFromStorage, addToStorage, updateInStorage, deleteFromStorage } from "@/lib/localStorage";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const despesaSchema = z.object({
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
});

type DespesaFormData = z.infer<typeof despesaSchema>;

interface Despesa {
  id: string;
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
}

const DespesasDetalhes = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const obraId = searchParams.get("obra");
  
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedDespesa, setSelectedDespesa] = useState<Despesa | null>(null);

  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const stored = getFromStorage<Despesa>(STORAGE_KEYS.DESPESAS);
    setDespesas(stored);
  }, []);

  const form = useForm<DespesaFormData>({
    resolver: zodResolver(despesaSchema),
    defaultValues: {
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
    },
  });

  const handleCreate = (data: DespesaFormData) => {
    const novaDespesa: any = {
      id: Date.now().toString(),
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
    };

    const updated = addToStorage(STORAGE_KEYS.DESPESAS, novaDespesa);
    setDespesas(updated);
    setOpenCreate(false);
    form.reset();
    toast({
      title: "Despesa cadastrada!",
      description: "A despesa foi adicionada com sucesso.",
    });
  };

  const handleEdit = (data: DespesaFormData) => {
    if (!selectedDespesa) return;

    const updated = updateInStorage<Despesa>(STORAGE_KEYS.DESPESAS, selectedDespesa.id.toString(), {
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
    });
    setOpenEdit(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string; icon: any }> = {
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Despesas - {obraId || "Edifício Alpha"}</h1>
            <p className="text-muted-foreground">Gerenciamento de despesas da obra</p>
          </div>
        </div>
        <Button className="bg-gradient-to-r from-primary to-accent" onClick={() => setOpenCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Despesa
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDespesas)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{despesas.length} despesas registradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Validadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(despesasValidadas)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">despesas aprovadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
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
            {despesas.map((despesa) => (
              <div 
                key={despesa.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{despesa.fornecedor}</h4>
                      {getStatusBadge(despesa.status)}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>CNPJ: {despesa.cnpj} • Bandeira: {despesa.bandeira}</p>
                      <p>{despesa.formaPagamento} - {despesa.quantidadeParcelas}x de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(despesa.valorParcela)}</p>
                      <p>Categoria: {despesa.categoria} • Responsável: {despesa.responsavel}</p>
                      <p>Data: {new Date(despesa.data).toLocaleDateString('pt-BR')} às {despesa.hora}</p>
                    </div>
                  </div>
                </div>
                  <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground mb-1">Total</div>
                    <div className="text-xl font-bold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(despesa.valorParcela * despesa.quantidadeParcelas)}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(despesa)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDeleteId(despesa.id.toString())}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Despesa</DialogTitle>
            <DialogDescription>
              Cadastre uma nova despesa para esta obra
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="formaPagamento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de Pagamento</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          <SelectItem value="Outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tipoParcela"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Parcela</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <FormField
                  control={form.control}
                  name="categoria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Material" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Cadastrar</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Despesa</DialogTitle>
            <DialogDescription>
              Atualize as informações da despesa
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEdit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="formaPagamento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de Pagamento</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          <SelectItem value="Outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tipoParcela"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Parcela</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <FormField
                  control={form.control}
                  name="categoria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Material" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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

              <div className="flex justify-end gap-3">
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
