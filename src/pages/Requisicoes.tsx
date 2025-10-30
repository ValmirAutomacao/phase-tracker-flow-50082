import { useState, useEffect } from "react";
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
import { Plus, Search, CheckCircle, Clock, XCircle, ShoppingCart, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { STORAGE_KEYS, getFromStorage, addToStorage, updateInStorage, deleteFromStorage } from "@/lib/localStorage";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { currencyMask, parseCurrencyInput } from "@/lib/utils";

const produtoSchema = z.object({
  numeroItem: z.string().min(1, "Número do item é obrigatório"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  quantidade: z.string().min(1, "Quantidade é obrigatória"),
  unidadeMedida: z.string().min(1, "Unidade de medida é obrigatória"),
  valor: z.string().min(1, "Valor é obrigatório"),
});

const requisicaoSchema = z.object({
  obraId: z.string().min(1, "Selecione uma obra"),
  compradorId: z.string().min(1, "Selecione um comprador"),
  fornecedor: z.string().min(1, "Fornecedor é obrigatório"),
  setorCompra: z.string().min(1, "Selecione um setor"),
  engenheiroId: z.string().min(1, "Selecione um engenheiro"),
});

type ProdutoFormData = z.infer<typeof produtoSchema>;
type RequisicaoFormData = z.infer<typeof requisicaoSchema>;

interface Produto {
  id: string;
  numeroItem: string;
  descricao: string;
  quantidade: string;
  unidadeMedida: string;
  valor: number;
}

interface Requisicao {
  id: string;
  numero: string;
  obra: string;
  comprador: string;
  fornecedor: string;
  setor: string;
  produtos: Produto[];
  valorTotal: number;
  engenheiro: string;
  status: "aguardando" | "aprovada" | "rejeitada";
  dataCriacao: string;
}

const Requisicoes = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [requisicoes, setRequisicoes] = useState<Requisicao[]>([]);
  const [carrinho, setCarrinho] = useState<Produto[]>([]);
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = () => {
    if (deleteId) {
      const updated = deleteFromStorage<Requisicao>(STORAGE_KEYS.REQUISICOES, deleteId);
      setRequisicoes(updated);
      toast({
        title: "Requisição excluída!",
        description: "A requisição foi removida com sucesso.",
      });
      setDeleteId(null);
    }
  };

  const mockObras = getFromStorage(STORAGE_KEYS.OBRAS, [
    { id: "1", nome: "Edifício Alpha" },
    { id: "2", nome: "Residencial Beta" },
    { id: "3", nome: "Comercial Gamma" },
  ]);

  const mockCompradores = getFromStorage(STORAGE_KEYS.FUNCIONARIOS, [
    { id: "1", nome: "Maria Santos" },
    { id: "2", nome: "Pedro Costa" },
    { id: "3", nome: "Carlos Mendes" },
  ]);

  const mockEngenheiros = [
    { id: "1", nome: "João Silva" },
    { id: "2", nome: "Ana Lima" },
  ];

  const mockSetores = [
    "Material de Construção",
    "Ferramentas",
    "Material Elétrico",
    "Hidráulica",
    "Acabamento",
  ];

  const mockUnidadesMedida = [
    "unidade",
    "metro",
    "metro²",
    "metro³",
    "quilograma",
    "tonelada",
    "litro",
    "galão",
    "saco",
    "caixa",
    "rolo",
    "barra",
    "peça",
    "conjunto",
    "dúzia",
    "pacote",
  ];

  useEffect(() => {
    const stored = getFromStorage<Requisicao>(STORAGE_KEYS.REQUISICOES);
    if (stored.length === 0) {
      const defaultRequisicoes: Requisicao[] = [
        {
          id: "1",
          numero: "REQ-2025-001",
          obra: "Edifício Alpha",
          comprador: "Maria Santos",
          fornecedor: "Construtora XYZ",
          setor: "Material de Construção",
          produtos: [
            {
              id: "p1",
              numeroItem: "ITEM-001",
              descricao: "Cimento CP-II 50kg",
              quantidade: "100",
              unidadeMedida: "saco",
              valor: 2500.00
            }
          ],
          valorTotal: 2500.00,
          engenheiro: "João Silva",
          status: "aguardando",
          dataCriacao: "2025-01-15"
        },
      ];
      setRequisicoes(defaultRequisicoes);
      localStorage.setItem(STORAGE_KEYS.REQUISICOES, JSON.stringify(defaultRequisicoes));
    } else {
      setRequisicoes(stored);
    }
  }, []);

  const form = useForm<RequisicaoFormData>({
    resolver: zodResolver(requisicaoSchema),
    defaultValues: {
      obraId: "",
      compradorId: "",
      fornecedor: "",
      setorCompra: "",
      engenheiroId: "",
    },
  });

  const produtoForm = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      numeroItem: "",
      descricao: "",
      quantidade: "",
      unidadeMedida: "",
      valor: "",
    },
  });

  const adicionarAoCarrinho = (data: ProdutoFormData) => {
    if (editingProduct) {
      setCarrinho(carrinho.map(p =>
        p.id === editingProduct.id
          ? { ...p, ...data, valor: parseCurrencyInput(data.valor) }
          : p
      ));
      setEditingProduct(null);
      toast({ title: "Produto atualizado no carrinho!" });
    } else {
      const novoProduto: Produto = {
        id: Date.now().toString(),
        ...data,
        valor: parseCurrencyInput(data.valor),
      };
      setCarrinho([...carrinho, novoProduto]);
      toast({ title: "Produto adicionado ao carrinho!" });
    }
    produtoForm.reset();
  };

  const editarProduto = (produto: Produto) => {
    setEditingProduct(produto);
    produtoForm.reset({
      numeroItem: produto.numeroItem,
      descricao: produto.descricao,
      quantidade: produto.quantidade,
      unidadeMedida: produto.unidadeMedida,
      valor: currencyMask((produto.valor * 100).toString()),
    });
  };

  const removerDoCarrinho = (id: string) => {
    setCarrinho(carrinho.filter(p => p.id !== id));
    toast({ title: "Produto removido do carrinho" });
  };

  const onSubmit = (data: RequisicaoFormData) => {
    if (carrinho.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione pelo menos um produto à requisição",
        variant: "destructive",
      });
      return;
    }

    const valorTotal = carrinho.reduce((sum, p) => sum + p.valor, 0);
    const novaRequisicao: Requisicao = {
      id: Date.now().toString(),
      numero: `REQ-2025-${String(requisicoes.length + 1).padStart(3, '0')}`,
      obra: mockObras.find(o => o.id === data.obraId)?.nome || "",
      comprador: mockCompradores.find(c => c.id === data.compradorId)?.nome || "",
      fornecedor: data.fornecedor,
      setor: data.setorCompra,
      produtos: [...carrinho],
      valorTotal,
      engenheiro: mockEngenheiros.find(e => e.id === data.engenheiroId)?.nome || "",
      status: "aguardando",
      dataCriacao: new Date().toISOString().split('T')[0],
    };

    const updated = addToStorage(STORAGE_KEYS.REQUISICOES, novaRequisicao);
    setRequisicoes(updated);
    setCarrinho([]);
    setOpen(false);
    form.reset();
    toast({
      title: "Requisição criada!",
      description: `Requisição ${novaRequisicao.numero} criada com sucesso.`,
    });
  };

  const handleStatusChange = (id: string, novoStatus: "aprovada" | "rejeitada") => {
    const updated = updateInStorage<Requisicao>(STORAGE_KEYS.REQUISICOES, id, { status: novoStatus });
    setRequisicoes(updated);
    toast({
      title: novoStatus === "aprovada" ? "Requisição aprovada!" : "Requisição rejeitada!",
      description: `Status atualizado com sucesso.`,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string; icon: any }> = {
      aguardando: { 
        label: "Aguardando", 
        className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
        icon: Clock
      },
      aprovada: { 
        label: "Aprovada", 
        className: "bg-green-100 text-green-700 hover:bg-green-100",
        icon: CheckCircle
      },
      rejeitada: { 
        label: "Rejeitada", 
        className: "bg-red-100 text-red-700 hover:bg-red-100",
        icon: XCircle
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
          <h1 className="text-3xl font-bold">Requisições de Compras</h1>
          <p className="text-muted-foreground">Gerenciamento de requisições e aprovações</p>
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
              <DialogTitle>Nova Requisição de Compra</DialogTitle>
              <DialogDescription>
                Preencha os dados da requisição e adicione produtos ao carrinho.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Dados da Requisição */}
              <Form {...form}>
                <div className="space-y-4">
                  <h3 className="font-semibold">Dados da Requisição</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="obraId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Obra</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a obra" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {mockObras.map(obra => (
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
                      name="compradorId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Comprador</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o comprador" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {mockCompradores.map(comprador => (
                                <SelectItem key={comprador.id} value={comprador.id}>{comprador.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="fornecedor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fornecedor</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do fornecedor" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="setorCompra"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Setor da Compra</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o setor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {mockSetores.map(setor => (
                                <SelectItem key={setor} value={setor}>{setor}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="engenheiroId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Engenheiro Responsável</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o engenheiro" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {mockEngenheiros.map(eng => (
                                <SelectItem key={eng.id} value={eng.id}>{eng.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </Form>

              {/* Carrinho de Produtos */}
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Carrinho de Produtos ({carrinho.length})
                </h3>

                {/* Form Adicionar Produto */}
                <Form {...produtoForm}>
                  <form onSubmit={produtoForm.handleSubmit(adicionarAoCarrinho)} className="space-y-4 mb-4 p-4 bg-muted/50 rounded-lg">
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={produtoForm.control}
                        name="numeroItem"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número do Item</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: ITEM-001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={produtoForm.control}
                        name="quantidade"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantidade</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: 100" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={produtoForm.control}
                        name="unidadeMedida"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unidade de Medida</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {mockUnidadesMedida.map(unidade => (
                                  <SelectItem key={unidade} value={unidade}>{unidade}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={produtoForm.control}
                      name="descricao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Input placeholder="Descrição detalhada do item" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={produtoForm.control}
                      name="valor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Total (R$)</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="R$ 0,00"
                              value={field.value}
                              onChange={(e) => {
                                const masked = currencyMask(e.target.value);
                                field.onChange(masked);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" variant="outline" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      {editingProduct ? "Atualizar Produto" : "Adicionar ao Carrinho"}
                    </Button>
                  </form>
                </Form>

                {/* Lista do Carrinho */}
                {carrinho.length > 0 && (
                  <div className="space-y-2">
                    {carrinho.map((produto) => (
                      <div key={produto.id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                        <div className="flex-1">
                          <div className="font-medium">{produto.numeroItem} - {produto.descricao}</div>
                          <div className="text-sm text-muted-foreground">
                            {produto.quantidade} {produto.unidadeMedida} • {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.valor)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            onClick={() => editarProduto(produto)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removerDoCarrinho(produto.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="text-right font-semibold text-lg pt-2">
                      Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(carrinho.reduce((sum, p) => sum + p.valor, 0))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={form.handleSubmit(onSubmit)}>
                  Criar Requisição
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requisicoes.length}</div>
            <p className="text-xs text-muted-foreground mt-1">requisições</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Aguardando</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {requisicoes.filter(r => r.status === "aguardando").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">pendentes de aprovação</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {requisicoes.filter(r => r.status === "aprovada").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">aprovadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Rejeitadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {requisicoes.filter(r => r.status === "rejeitada").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">recusadas</p>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Requisições</CardTitle>
              <CardDescription>Todas as requisições de compra</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar requisição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {requisicoes.filter(req => 
              req.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
              req.obra.toLowerCase().includes(searchTerm.toLowerCase())
            ).map((req) => (
              <div 
                key={req.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{req.numero}</h4>
                      {getStatusBadge(req.status)}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div><strong>Obra:</strong> {req.obra}</div>
                      <div><strong>Comprador:</strong> {req.comprador}</div>
                      <div><strong>Fornecedor:</strong> {req.fornecedor}</div>
                      <div><strong>Produtos:</strong> {req.produtos.length} itens</div>
                      <div className="font-semibold text-foreground">
                        Valor Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(req.valorTotal)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {req.status === "aguardando" && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleStatusChange(req.id, "aprovada")}
                        className="text-green-600 hover:text-green-700"
                      >
                        Aprovar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleStatusChange(req.id, "rejeitada")}
                        className="text-red-600 hover:text-red-700"
                      >
                        Rejeitar
                      </Button>
                    </>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setDeleteId(req.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
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
