import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Search, 
  Filter, 
  Download, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Plus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { STORAGE_KEYS, getFromStorage, addToStorage } from "@/lib/localStorage";

const financeiroSchema = z.object({
  descricao: z.string().min(1, "Descrição é obrigatória"),
  cliente: z.string().min(1, "Cliente é obrigatório"),
  categoria: z.string().min(1, "Selecione uma categoria"),
  contaCorrente: z.string().min(1, "Selecione a conta corrente"),
  valorConta: z.string().min(1, "Valor da conta é obrigatório"),
  valorDespesa: z.string().min(1, "Valor da despesa é obrigatório"),
  projeto: z.string().optional(),
  dataEmissao: z.date({ message: "Data de emissão é obrigatória" }),
  dataRegistro: z.date({ message: "Data de registro é obrigatória" }),
  formaPagamento: z.string().min(1, "Selecione a forma de pagamento"),
  notaFiscal: z.string().optional(),
  observacao: z.string().optional(),
  comprovante: z.any().optional(),
});

type FinanceiroFormData = z.infer<typeof financeiroSchema>;

const Financeiro = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [despesas, setDespesas] = useState<any[]>([]);

  useEffect(() => {
    const stored = getFromStorage<any>(STORAGE_KEYS.DESPESAS);
    if (stored.length === 0) {
      const defaultDespesas = [
        {
          id: 1,
          fornecedor: "Construtora XYZ",
          valor: 8500.00,
          categoria: "Material",
          obra: "Edifício Alpha",
          data: "2025-01-15",
          status: "validado",
          responsavel: "João Silva"
        },
        {
          id: 2,
          fornecedor: "Ferragens ABC",
          valor: 2350.00,
          categoria: "Ferramentas",
          obra: "Residencial Beta",
          data: "2025-01-14",
          status: "pendente",
          responsavel: "Maria Santos"
        },
        {
          id: 3,
          fornecedor: "Transportes Rápidos",
          valor: 1200.00,
          categoria: "Logística",
          obra: "Comercial Gamma",
          data: "2025-01-13",
          status: "validado",
          responsavel: "Pedro Costa"
        },
        {
          id: 4,
          fornecedor: "Elétrica Pro",
          valor: 5400.00,
          categoria: "Material Elétrico",
          obra: "Edifício Alpha",
          data: "2025-01-12",
          status: "rejeitado",
          responsavel: "João Silva"
        },
      ];
      setDespesas(defaultDespesas);
      localStorage.setItem(STORAGE_KEYS.DESPESAS, JSON.stringify(defaultDespesas));
    } else {
      setDespesas(stored);
    }
  }, []);

  const mockRequisicoes = [
    { id: "REQ-2025-001", descricao: "Cimento CP-II 50kg", obra: "Edifício Alpha" },
    { id: "REQ-2025-002", descricao: "Kit de ferramentas", obra: "Residencial Beta" },
  ];

  const form = useForm<FinanceiroFormData>({
    resolver: zodResolver(financeiroSchema),
    defaultValues: {
      descricao: "",
      cliente: "",
      categoria: "",
      contaCorrente: "",
      valorConta: "",
      valorDespesa: "",
      projeto: "",
      dataEmissao: new Date(),
      dataRegistro: new Date(),
      formaPagamento: "",
      notaFiscal: "",
      observacao: "",
    },
  });

  const onSubmit = (data: FinanceiroFormData) => {
    const novaDespesa = {
      id: Date.now().toString(),
      fornecedor: data.cliente,
      valor: parseFloat(data.valorDespesa),
      categoria: data.categoria,
      obra: data.projeto || "Sem projeto",
      data: data.dataEmissao.toISOString().split('T')[0],
      status: "pendente",
      responsavel: "Sistema",
    };

    const updated = addToStorage(STORAGE_KEYS.DESPESAS, novaDespesa);
    setDespesas(updated);
    setOpen(false);
    form.reset({
      descricao: "",
      cliente: "",
      categoria: "",
      contaCorrente: "",
      valorConta: "",
      valorDespesa: "",
      projeto: "",
      dataEmissao: new Date(),
      dataRegistro: new Date(),
      formaPagamento: "",
      notaFiscal: "",
      observacao: "",
    });
    toast({
      title: "Despesa registrada!",
      description: "A despesa foi cadastrada no financeiro.",
    });
  };

  const totalDespesas = despesas.reduce((acc, d) => acc + d.valor, 0);
  const despesasValidadas = despesas.filter(d => d.status === "validado").reduce((acc, d) => acc + d.valor, 0);
  const despesasPendentes = despesas.filter(d => d.status === "pendente").reduce((acc, d) => acc + d.valor, 0);

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Módulo Financeiro</h1>
          <p className="text-muted-foreground">Gestão de despesas e comprovantes</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-accent">
                <Plus className="h-4 w-4 mr-2" />
                Nova Despesa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Despesa Financeira</DialogTitle>
                <DialogDescription>
                  Vincule uma despesa a uma requisição de compra
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="descricao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição da Despesa*</FormLabel>
                        <FormControl>
                          <textarea
                            className="flex min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-0 focus:border-2 focus:border-[#0891b2] disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Ex: Compra de material de construção"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cliente"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cliente (Razão Social/CNPJ)*</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome da empresa ou CNPJ" {...field} />
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
                          <FormLabel>Categoria*</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a categoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="material">Material</SelectItem>
                              <SelectItem value="ferramentas">Ferramentas</SelectItem>
                              <SelectItem value="logistica">Logística</SelectItem>
                              <SelectItem value="eletrico">Material Elétrico</SelectItem>
                              <SelectItem value="outros">Outros</SelectItem>
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
                      name="contaCorrente"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Conta Corrente*</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a conta" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="conta1">Conta 1 - Banco do Brasil</SelectItem>
                              <SelectItem value="conta2">Conta 2 - Caixa Econômica</SelectItem>
                              <SelectItem value="conta3">Conta 3 - Itaú</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="valorConta"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor da Conta*</FormLabel>
                          <FormControl>
                            <Input type="text" placeholder="R$ 0,00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="valorDespesa"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor da Despesa (R$)*</FormLabel>
                          <FormControl>
                            <Input type="text" placeholder="R$ 0,00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="projeto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Projeto (Centro de Custo)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o projeto" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="edificio-alpha">Edifício Alpha</SelectItem>
                              <SelectItem value="residencial-beta">Residencial Beta</SelectItem>
                              <SelectItem value="comercial-gamma">Comercial Gamma</SelectItem>
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
                      name="dataEmissao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Emissão (Data da Compra)*</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                              onChange={(e) => field.onChange(new Date(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dataRegistro"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data do Registro*</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                              onChange={(e) => field.onChange(new Date(e.target.value))}
                            />
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
                          <FormLabel>Forma de Pagamento*</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pix">PIX</SelectItem>
                              <SelectItem value="debito">Débito</SelectItem>
                              <SelectItem value="credito">Crédito à vista</SelectItem>
                              <SelectItem value="credito-parcelado">Crédito Parcelado</SelectItem>
                              <SelectItem value="boleto">Boleto</SelectItem>
                              <SelectItem value="dinheiro">Dinheiro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notaFiscal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nota Fiscal</FormLabel>
                          <FormControl>
                            <Input placeholder="Número da nota fiscal" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="observacao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observação</FormLabel>
                        <FormControl>
                          <textarea
                            className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-0 focus:border-2 focus:border-[#0891b2] disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Campo digitável para imputação de dados adicionais"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="comprovante"
                    render={({ field: { onChange, value, ...field } }) => (
                      <FormItem>
                        <FormLabel>Comprovante (Upload)</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Input
                              type="file"
                              accept="image/jpeg,image/png,application/pdf"
                              onChange={(e) => onChange(e.target.files?.[0])}
                              {...field}
                            />
                            <p className="text-xs text-muted-foreground">
                              Aceita imagens (JPG, PNG) e PDF. Este arquivo será processado pela automação.
                            </p>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Registrar Despesa</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDespesas)}</div>
            <p className="text-xs text-muted-foreground mt-1">{despesas.length} despesas registradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(despesasPendentes)}</div>
            <p className="text-xs text-muted-foreground mt-1">{despesas.filter(d => d.status === "pendente").length} validação(ões) pendente(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Validados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(despesasValidadas)}</div>
            <p className="text-xs text-muted-foreground mt-1">{despesas.filter(d => d.status === "validado").length} despesa(s) aprovada(s)</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Despesas</CardTitle>
              <CardDescription>Todas as despesas cadastradas no sistema</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por fornecedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {despesas.map((expense) => (
              <div 
                key={expense.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{expense.fornecedor}</h4>
                      {getStatusBadge(expense.status)}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Obra: {expense.obra} • Categoria: {expense.categoria}</p>
                      <p>Responsável: {expense.responsavel} • Data: {new Date(expense.data).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expense.valor)}
                  </div>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-primary"
                    onClick={() => navigate(`/despesas-detalhes?obra=${encodeURIComponent(expense.obra)}`)}
                  >
                    Ver detalhes
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Financeiro;
