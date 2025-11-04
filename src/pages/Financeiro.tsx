import { useState, useEffect, useMemo } from "react";
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
import { useOptimizedSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { useSupabaseCRUD } from "@/hooks/useSupabaseMutation";
import { currencyMask, parseCurrencyInput } from "@/lib/utils";
import { SeletorProdutos } from "@/components/forms/SeletorProdutos";
import { ItemCarrinho } from "@/components/forms/CarrinhoItens";

// Interface para itens/produtos das requisições
interface ItemProduto {
  id: string;
  nome: string;
  quantidade: number;
  valor_unitario: number;
  comprado: boolean;
}

// Interface para Despesa compatível com Supabase
interface Despesa {
  id: string;
  cliente_id: string; // FK para clientes
  obra_id: string; // FK para obras
  requisicao_id?: string; // FK para requisições (novo campo obrigatório)
  valor: number;
  descricao?: string;
  data_despesa: string; // Date ISO string
  categoria?: string;
  status?: string;
  // Campos preparatórios n8n
  comprovante_url?: string;
  fornecedor_cnpj?: string;
  numero_documento?: string;
  // Campos de relacionamento
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
    itens_produtos?: ItemProduto[];
  };
  created_at?: string;
  updated_at?: string;
}

interface Cliente {
  id: string;
  nome: string;
}

interface Obra {
  id: string;
  nome: string;
  cliente_id: string;
}

const despesaSchema = z.object({
  descricao: z.string().min(1, "Descrição é obrigatória"),
  cliente_id: z.string().min(1, "Cliente é obrigatório"),
  obra_id: z.string().min(1, "Obra é obrigatória"),
  requisicao_id: z.string().min(1, "Requisição é obrigatória - despesas devem estar vinculadas a uma requisição aprovada"),
  categoria: z.string().min(1, "Selecione uma categoria"),
  valor: z.string().min(1, "Valor da despesa é obrigatório"),
  data_despesa: z.date({ message: "Data da despesa é obrigatória" }),
  // Campos preparatórios n8n para automação OCR
  comprovante_url: z.string().optional(),
  fornecedor_cnpj: z.string().optional(),
  numero_documento: z.string().optional(),
  // Campos existentes
  observacao: z.string().optional(),
  comprovante: z.any().optional(),
  // Array de produtos selecionados da requisição
  itens_selecionados: z.array(z.string()).optional(),
});

type DespesaFormData = z.infer<typeof despesaSchema>;

const Financeiro = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: ""
  });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("all");
  const [clienteFilter, setClienteFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<string>("");
  const [selectedRequisicao, setSelectedRequisicao] = useState<string>("");
  const [selectedItens, setSelectedItens] = useState<string[]>([]);

  // Hooks Supabase para substituir localStorage
  const { data: despesas = [], isLoading, error } = useOptimizedSupabaseQuery<any>('DESPESAS');
  const { add, update, delete: deleteDespesa } = useSupabaseCRUD<any>('DESPESAS');
  const { update: updateRequisicao } = useSupabaseCRUD<any>('REQUISICOES');

  // Hooks para carregar dados de relacionamento
  const { data: clientes = [] } = useOptimizedSupabaseQuery<any>('CLIENTES');
  const { data: todasObras = [] } = useOptimizedSupabaseQuery<any>('OBRAS');

  // Hook para carregar requisições aprovadas
  const { data: todasRequisicoes = [] } = useOptimizedSupabaseQuery<any>('REQUISICOES');

  // Filtrar obras por cliente selecionado
  const obrasFiltradas = useMemo(() => {
    if (!selectedCliente) return todasObras;
    return todasObras.filter(obra => obra.cliente_id === selectedCliente);
  }, [todasObras, selectedCliente]);

  // Filtrar requisições aprovadas disponíveis
  const requisicoesAprovadas = useMemo(() => {
    return todasRequisicoes.filter(req =>
      req.status === 'aprovada' || req.status === 'concluida'
    );
  }, [todasRequisicoes]);

  // Buscar requisição selecionada e seus produtos
  const requisicaoAtual = useMemo(() => {
    if (!selectedRequisicao) return null;
    return requisicoesAprovadas.find(req => req.id === selectedRequisicao);
  }, [requisicoesAprovadas, selectedRequisicao]);

  // Filtros avançados memoizados para performance
  const filteredDespesas = useMemo(() => {
    let filtered = [...despesas];

    // Filtro por busca textual
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(despesa =>
        (despesa.descricao && despesa.descricao.toLowerCase().includes(searchLower)) ||
        (despesa.categoria && despesa.categoria.toLowerCase().includes(searchLower)) ||
        (despesa.cliente?.nome && despesa.cliente.nome.toLowerCase().includes(searchLower)) ||
        (despesa.obra?.nome && despesa.obra.nome.toLowerCase().includes(searchLower)) ||
        (despesa.fornecedor_cnpj && despesa.fornecedor_cnpj.toLowerCase().includes(searchLower))
      );
    }

    // Filtro por período de datas
    if (dateFilter.startDate) {
      filtered = filtered.filter(despesa =>
        new Date(despesa.data_despesa) >= new Date(dateFilter.startDate)
      );
    }
    if (dateFilter.endDate) {
      filtered = filtered.filter(despesa =>
        new Date(despesa.data_despesa) <= new Date(dateFilter.endDate)
      );
    }

    // Filtro por status
    if (statusFilter !== "all") {
      filtered = filtered.filter(despesa => despesa.status === statusFilter);
    }

    // Filtro por categoria
    if (categoriaFilter !== "all") {
      filtered = filtered.filter(despesa => despesa.categoria === categoriaFilter);
    }

    // Filtro por cliente
    if (clienteFilter !== "all") {
      filtered = filtered.filter(despesa => despesa.cliente_id === clienteFilter);
    }

    return filtered;
  }, [despesas, searchTerm, dateFilter, statusFilter, categoriaFilter, clienteFilter]);

  const form = useForm<DespesaFormData>({
    resolver: zodResolver(despesaSchema),
    defaultValues: {
      descricao: "",
      cliente_id: "",
      obra_id: "",
      categoria: "",
      valor: "",
      data_despesa: new Date(),
      // Campos preparatórios n8n
      comprovante_url: "",
      fornecedor_cnpj: "",
      numero_documento: "",
      // Campos existentes
      observacao: "",
    },
  });

  // Atualizar obra quando cliente muda
  useEffect(() => {
    const clienteIdFromForm = form.watch("cliente_id");
    if (clienteIdFromForm !== selectedCliente) {
      setSelectedCliente(clienteIdFromForm);
      form.setValue("obra_id", ""); // Reset obra quando cliente muda
    }
  }, [form.watch("cliente_id")]);

  const onSubmit = async (data: DespesaFormData) => {
    // Validar se pelo menos um item foi selecionado se existem itens não comprados
    if (requisicaoAtual?.itens_produtos?.some(item => !item.comprado) && selectedItens.length === 0) {
      toast({
        title: "Erro de validação",
        description: "Selecione pelo menos um item da requisição para esta despesa.",
        variant: "destructive"
      });
      return;
    }

    const novaDespesa = {
      cliente_id: data.cliente_id,
      obra_id: data.obra_id,
      requisicao_id: data.requisicao_id,
      valor: parseCurrencyInput(data.valor),
      descricao: data.descricao,
      categoria: data.categoria,
      data_despesa: data.data_despesa.toISOString().split('T')[0],
      status: "pendente",
      // Campos preparatórios n8n
      comprovante_url: data.comprovante_url || null,
      fornecedor_cnpj: data.fornecedor_cnpj || null,
      numero_documento: data.numero_documento || null,
    };

    add.mutate(novaDespesa, {
      onSuccess: async () => {
        // Atualizar status dos itens como comprados na requisição
        if (selectedItens.length > 0 && requisicaoAtual) {
          const itensAtualizados = requisicaoAtual.itens_produtos?.map(item =>
            selectedItens.includes(item.id) ? { ...item, comprado: true } : item
          );

          try {
            await updateRequisicao.mutateAsync({
              id: requisicaoAtual.id,
              updates: { itens_produtos: itensAtualizados } as any
            });
          } catch (error) {
            console.error('Erro ao atualizar itens da requisição:', error);
          }
        }

        toast({
          title: "Despesa registrada!",
          description: `Despesa cadastrada e ${selectedItens.length} itens marcados como comprados.`,
        });
        setOpen(false);
        form.reset();
        setSelectedCliente("");
        setSelectedRequisicao("");
        setSelectedItens([]);
      },
      onError: (error) => {
        toast({
          title: "Erro ao cadastrar",
          description: error.message || "Ocorreu um erro ao cadastrar a despesa.",
          variant: "destructive",
        });
      }
    });
  };

  // Cálculos financeiros memoizados para performance (baseados nos filtros)
  const totalDespesas = useMemo(() =>
    filteredDespesas.reduce((acc, d) => acc + (d.valor || 0), 0), [filteredDespesas]);

  const despesasValidadas = useMemo(() =>
    filteredDespesas.filter(d => d.status === "validado").reduce((acc, d) => acc + (d.valor || 0), 0), [filteredDespesas]);

  const despesasPendentes = useMemo(() =>
    filteredDespesas.filter(d => d.status === "pendente").reduce((acc, d) => acc + (d.valor || 0), 0), [filteredDespesas]);

  // Relatórios avançados por categoria e período
  const relatoriosPorCategoria = useMemo(() => {
    const categorias = filteredDespesas.reduce((acc, despesa) => {
      const categoria = despesa.categoria || "Sem categoria";
      acc[categoria] = (acc[categoria] || 0) + (despesa.valor || 0);
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(categorias).sort(([,a], [,b]) => (b as number) - (a as number));
  }, [filteredDespesas]);

  const relatoriosPorCliente = useMemo(() => {
    const clientes = filteredDespesas.reduce((acc, despesa) => {
      const cliente = despesa.cliente?.nome || "Cliente não informado";
      acc[cliente] = (acc[cliente] || 0) + (despesa.valor || 0);
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(clientes).sort(([,a], [,b]) => (b as number) - (a as number));
  }, [filteredDespesas]);

  // Função para resetar todos os filtros
  const resetFilters = () => {
    setSearchTerm("");
    setDateFilter({ startDate: "", endDate: "" });
    setStatusFilter("all");
    setCategoriaFilter("all");
    setClienteFilter("all");
  };

  // Função para processar upload de comprovante
  const handleFileUpload = async (file: File) => {
    if (!file) return null;

    try {
      // Aqui será implementada a integração com storage (Supabase Storage ou similar)
      // Por enquanto, vamos simular um URL para preparar a integração n8n
      const timestamp = Date.now();
      const fileName = `comprovante_${timestamp}_${file.name}`;
      const mockUrl = `https://storage.exemplo.com/comprovantes/${fileName}`;

      // Atualizar o campo comprovante_url automaticamente
      form.setValue("comprovante_url", mockUrl);

      toast({
        title: "Comprovante carregado!",
        description: `Arquivo ${file.name} preparado para processamento.`,
      });

      return mockUrl;
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: "Não foi possível processar o arquivo.",
        variant: "destructive",
      });
      return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
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
    const IconComponent = variant.icon;
    
    return (
      <Badge className={variant.className as any}>
        <IconComponent className="h-3 w-3 mr-1" />
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
                      name="cliente_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cliente*</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o cliente" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {clientes.map(cliente => (
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
                          <FormLabel>Obra*</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={!selectedCliente}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={selectedCliente ? "Selecione a obra" : "Primeiro selecione o cliente"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {obrasFiltradas.map(obra => (
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

                  {/* Campo Requisição - Obrigatório */}
                  <FormField
                    control={form.control}
                    name="requisicao_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Requisição Aprovada*</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedRequisicao(value);
                            setSelectedItens([]); // Reset items when changing requisition
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a requisição aprovada" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {requisicoesAprovadas.map((requisicao) => (
                              <SelectItem key={requisicao.id} value={requisicao.id}>
                                {requisicao.titulo} - {requisicao.obra?.nome || 'Obra não informada'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Lista de Produtos/Itens da Requisição */}
                  {requisicaoAtual?.itens_produtos && requisicaoAtual.itens_produtos.length > 0 && (
                    <div className="space-y-3">
                      <FormLabel>Produtos/Itens da Requisição*</FormLabel>
                      <div className="border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto">
                        {requisicaoAtual.itens_produtos.map((item: ItemProduto) => (
                          <div key={item.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`item-${item.id}`}
                              disabled={item.comprado}
                              checked={selectedItens.includes(item.id) || item.comprado}
                              onChange={(e) => {
                                if (e.target.checked && !item.comprado) {
                                  setSelectedItens(prev => [...prev, item.id]);
                                } else if (!item.comprado) {
                                  setSelectedItens(prev => prev.filter(id => id !== item.id));
                                }
                              }}
                              className="h-4 w-4"
                            />
                            <label
                              htmlFor={`item-${item.id}`}
                              className={`flex-1 text-sm ${item.comprado ? 'line-through text-gray-500' : ''}`}
                            >
                              {item.nome} - Qtd: {item.quantidade} -
                              R$ {item.valor_unitario.toFixed(2)}
                              {item.comprado && (
                                <span className="ml-2 text-green-600 font-medium">✓ Comprado</span>
                              )}
                            </label>
                          </div>
                        ))}
                      </div>
                      {selectedItens.length === 0 && requisicaoAtual.itens_produtos.some(item => !item.comprado) && (
                        <p className="text-sm text-amber-600">
                          ⚠️ Selecione pelo menos um item para esta despesa
                        </p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="categoria"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria*</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a categoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Material">Material</SelectItem>
                              <SelectItem value="Ferramentas">Ferramentas</SelectItem>
                              <SelectItem value="Logística">Logística</SelectItem>
                              <SelectItem value="Material Elétrico">Material Elétrico</SelectItem>
                              <SelectItem value="Outros">Outros</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="valor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor da Despesa (R$)*</FormLabel>
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
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="data_despesa"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data da Despesa*</FormLabel>
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
                      name="numero_documento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número do Documento</FormLabel>
                          <FormControl>
                            <Input placeholder="Número da nota fiscal ou recibo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Campos preparatórios n8n - Opcional */}
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Campos para Automação (Opcional)</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name="comprovante_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL do Comprovante</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Link do comprovante digitalizado"
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
                          name="fornecedor_cnpj"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CNPJ do Fornecedor</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="00.000.000/0000-00"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="numero_documento"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número do Documento</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Número da nota/recibo"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
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
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  onChange(file);
                                  await handleFileUpload(file);
                                }
                              }}
                              {...field}
                            />
                            <p className="text-xs text-muted-foreground">
                              Aceita imagens (JPG, PNG) e PDF. Este arquivo será processado pela automação.
                            </p>
                            {form.watch("comprovante_url") && (
                              <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 p-2 rounded">
                                <FileText className="h-4 w-4" />
                                <span>Comprovante integrado com automação</span>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Seletor de Produtos da Requisição */}
                  {requisicaoAtual && requisicaoAtual.itens_produtos && (
                    <div className="pt-4">
                      <SeletorProdutos
                        itensRequisicao={requisicaoAtual.itens_produtos as ItemCarrinho[]}
                        itensSelecionados={selectedItens}
                        onSelecaoChange={setSelectedItens}
                      />
                    </div>
                  )}

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

      {/* Relatórios Financeiros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Despesas por Categoria</CardTitle>
            <CardDescription>Total gasto por categoria no período filtrado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {relatoriosPorCategoria.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma despesa encontrada</p>
              ) : (
                relatoriosPorCategoria.map(([categoria, valor]) => (
                  <div key={categoria} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{categoria}</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor as number)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Despesas por Cliente</CardTitle>
            <CardDescription>Total gasto por cliente no período filtrado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {relatoriosPorCliente.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma despesa encontrada</p>
              ) : (
                relatoriosPorCliente.slice(0, 5).map(([cliente, valor]) => (
                  <div key={cliente} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{cliente}</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor as number)}
                    </span>
                  </div>
                ))
              )}
              {relatoriosPorCliente.length > 5 && (
                <p className="text-xs text-muted-foreground mt-2">
                  E mais {relatoriosPorCliente.length - 5} clientes...
                </p>
              )}
            </div>
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
              <Button variant="outline" onClick={resetFilters}>
                Limpar Filtros
              </Button>
            </div>
          </div>

          {/* Filtros Avançados */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Data Início</label>
              <Input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Data Fim</label>
              <Input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="validado">Validado</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="rejeitado">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Categoria</label>
              <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="Material">Material</SelectItem>
                  <SelectItem value="Ferramentas">Ferramentas</SelectItem>
                  <SelectItem value="Logística">Logística</SelectItem>
                  <SelectItem value="Material Elétrico">Material Elétrico</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Cliente</label>
              <Select value={clienteFilter} onValueChange={setClienteFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {clientes.map(cliente => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="h-10 w-10 rounded-lg bg-primary/10" />
                      <div className="flex-1 space-y-2">
                        <div className="h-6 bg-gray-200 rounded w-1/3" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                        <div className="h-4 bg-gray-200 rounded w-2/3" />
                      </div>
                    </div>
                    <div className="h-8 bg-gray-200 rounded w-24" />
                  </div>
                </div>
              ))
            ) : error ? (
              // Error state
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Erro ao carregar despesas: {error.message}</p>
                <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
                  Tentar novamente
                </Button>
              </div>
            ) : filteredDespesas.length === 0 ? (
              // Empty state
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? "Nenhuma despesa encontrada para a pesquisa." : "Nenhuma despesa cadastrada ainda."}
                </p>
                {!searchTerm && (
                  <Button
                    className="mt-4"
                    onClick={() => setOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar primeira despesa
                  </Button>
                )}
              </div>
            ) : (
              filteredDespesas.map((despesa) => (
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
                        <h4 className="font-semibold">{despesa.descricao || 'Despesa sem descrição'}</h4>
                        {getStatusBadge(despesa.status || 'pendente')}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          Cliente: {despesa.cliente?.nome || 'N/A'} •
                          Obra: {despesa.obra?.nome || 'N/A'}
                        </p>
                        <p>
                          Categoria: {despesa.categoria || 'N/A'} •
                          Data: {new Date(despesa.data_despesa).toLocaleDateString('pt-BR')}
                        </p>
                        {despesa.numero_documento && (
                          <p>Documento: {despesa.numero_documento}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(despesa.valor || 0)}
                    </div>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-primary"
                      onClick={() => navigate(`/despesas-detalhes?obra=${encodeURIComponent(despesa.obra?.nome || '')}`)}
                    >
                      Ver detalhes
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Financeiro;
