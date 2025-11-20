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
  Edit,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { useSupabaseCRUD } from "@/hooks/useSupabaseMutation";
import { currencyMask, parseCurrencyInput, formatCurrency } from "@/lib/utils";
// import { SeletorProdutos } from "@/components/forms/SeletorProdutos";
// import { ItemCarrinho } from "@/components/forms/CarrinhoItens";
import "@/styles/responsive.css";

// Interface para itens/produtos das requisições
interface ItemProduto {
  id: string;
  numero: string;
  descricao: string;
  quantidade: number;
  unidade_medida: string;
  valor_unitario: number;
  comprado: boolean;
  requisicao_id: string;
}

// Interface para Despesa compatível com Supabase
interface Despesa {
  id: string;
  cliente_id: string; // FK para clientes
  obra_id: string; // FK para obras
  requisicao_id?: string; // FK para requisições (novo campo obrigatório)
  valor: number;
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
  const [selectedObra, setSelectedObra] = useState<string>("");
  const [selectedRequisicao, setSelectedRequisicao] = useState<string>("");
  const [editingDespesa, setEditingDespesa] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedItens, setSelectedItens] = useState<string[]>([]);
  const [itensEditados, setItensEditados] = useState<Record<string, {
    quantidade: number;
    valor_unitario: number;
  }>>({});

  // Hooks Supabase para substituir localStorage
  const { data: despesas = [], isLoading, error } = useSupabaseQuery<any>('DESPESAS');
  const { add, update, delete: deleteDespesa } = useSupabaseCRUD<any>('DESPESAS');
  const crudRequisicoes = useSupabaseCRUD<any>('REQUISICOES');

  // Hooks para carregar dados de relacionamento
  const { data: clientes = [] } = useSupabaseQuery<any>('CLIENTES');
  const { data: todasObras = [] } = useSupabaseQuery<any>('OBRAS');

  // Hook para carregar requisições aprovadas
  const { data: todasRequisicoes = [] } = useSupabaseQuery<any>('REQUISICOES');

  // Hook para carregar categorias ativas
  const { data: categorias = [] } = useSupabaseQuery<any>('CATEGORIAS');

  // Hook para carregar itens das requisições
  const { data: itensRequisicao = [] } = useSupabaseQuery<any>('ITENS_REQUISICAO');

  // Hook para CRUD dos itens de requisição
  const crudItens = useSupabaseCRUD<any>('ITENS_REQUISICAO');

  // Filtrar obras por cliente selecionado
  const obrasFiltradas = useMemo(() => {
    if (!selectedCliente) return todasObras;
    return todasObras.filter(obra => obra.cliente_id === selectedCliente);
  }, [todasObras, selectedCliente]);

  // Filtrar requisições abertas disponíveis da obra selecionada
  const requisicoesAbertas = useMemo(() => {
    if (!selectedObra) return [];

    return todasRequisicoes.filter(req =>
      req.status === 'aberta' &&
      req.obra_id === selectedObra
    );
  }, [todasRequisicoes, selectedObra]);

  // Buscar requisição selecionada e seus itens da nova tabela
  const requisicaoAtual = useMemo(() => {
    if (!selectedRequisicao) return null;
    const req = requisicoesAbertas.find(req => req.id === selectedRequisicao);

    if (req) {
      // Buscar itens da nova tabela de itens_requisicao
      const itensReq = itensRequisicao.filter(item => item.requisicao_id === selectedRequisicao);

      // Calcular quantidade disponível (quantidade total - quantidade já comprada)
      const itensComDisponibilidade = itensReq.map(item => ({
        ...item,
        quantidade_disponivel: Number(item.quantidade) - Number(item.quantidade_comprada || 0),
        quantidade_original: Number(item.quantidade)
      }));

      // Filtrar apenas itens que ainda têm quantidade disponível
      const itensDisponiveis = itensComDisponibilidade.filter(item => item.quantidade_disponivel > 0);

      return { ...req, itens_produtos: itensDisponiveis };
    }

    return req;
  }, [requisicoesAbertas, selectedRequisicao, itensRequisicao]);

  // Filtros avançados memoizados para performance
  const filteredDespesas = useMemo(() => {
    let filtered = [...despesas];

    // Filtro por busca textual
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(despesa =>
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

  const editForm = useForm<DespesaFormData>({
    resolver: zodResolver(despesaSchema),
    defaultValues: {
      cliente_id: "",
      obra_id: "",
      categoria: "",
      valor: "",
      data_despesa: new Date(),
      comprovante_url: "",
      fornecedor_cnpj: "",
      numero_documento: "",
      observacao: "",
    },
  });

  // Atualizar obra quando cliente muda
  useEffect(() => {
    const clienteIdFromForm = form.watch("cliente_id");
    if (clienteIdFromForm !== selectedCliente) {
      setSelectedCliente(clienteIdFromForm);
      form.setValue("obra_id", ""); // Reset obra quando cliente muda
      setSelectedObra("");
      setSelectedRequisicao("");
      setSelectedItens([]);
      setItensEditados({});
    }
  }, [form.watch("cliente_id")]);

  // Atualizar requisições quando obra muda
  useEffect(() => {
    const obraIdFromForm = form.watch("obra_id");
    if (obraIdFromForm !== selectedObra) {
      setSelectedObra(obraIdFromForm);
      form.setValue("requisicao_id", ""); // Reset requisição quando obra muda
      setSelectedRequisicao("");
      setSelectedItens([]);
      setItensEditados({});
    }
  }, [form.watch("obra_id")]);

  // Calcular valor total da despesa automaticamente baseado nos itens selecionados
  useEffect(() => {
    if (selectedItens.length > 0) {
      const valorTotal = selectedItens.reduce((total, itemId) => {
        const itemEditado = itensEditados[itemId];
        if (itemEditado) {
          return total + (itemEditado.quantidade * itemEditado.valor_unitario);
        }
        return total;
      }, 0);

      // Formatar como string monetária para o campo
      const valorFormatado = `R$ ${valorTotal.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
      form.setValue("valor", valorFormatado);
    } else {
      form.setValue("valor", "");
    }
  }, [selectedItens, itensEditados, form]);

  // Populr formulário de edição quando uma despesa for selecionada
  useEffect(() => {
    if (editingDespesa && editOpen) {
      editForm.reset({
        cliente_id: editingDespesa.cliente_id || "",
        obra_id: editingDespesa.obra_id || "",
        categoria: editingDespesa.categoria || "",
        valor: formatCurrency(editingDespesa.valor) || "",
        data_despesa: editingDespesa.data_despesa ? new Date(editingDespesa.data_despesa) : new Date(),
        comprovante_url: editingDespesa.comprovante_url || "",
        fornecedor_cnpj: editingDespesa.fornecedor_cnpj || "",
        numero_documento: editingDespesa.numero_documento || "",
        observacao: editingDespesa.observacao || "",
      });
    }
  }, [editingDespesa, editOpen, editForm]);

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

    // Validar se todos os itens selecionados têm quantidades e valores definidos
    for (const itemId of selectedItens) {
      const itemEditado = itensEditados[itemId];
      if (!itemEditado || itemEditado.quantidade <= 0 || itemEditado.valor_unitario <= 0) {
        toast({
          title: "Erro de validação",
          description: "Todos os itens selecionados devem ter quantidade e valor unitário maiores que zero.",
          variant: "destructive"
        });
        return;
      }
    }

    const novaDespesa = {
      cliente_id: data.cliente_id,
      obra_id: data.obra_id,
      requisicao_id: data.requisicao_id,
      valor: parseCurrencyInput(data.valor),
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
        // Atualizar quantidades compradas na tabela itens_requisicao
        if (selectedItens.length > 0 && requisicaoAtual) {
          try {
            // Atualizar cada item selecionado com a quantidade comprada
            const updatePromises = selectedItens.map(itemId => {
              const item = requisicaoAtual.itens_produtos?.find(i => i.id === itemId);
              const itemEditado = itensEditados[itemId];

              if (item && itemEditado) {
                const novaQuantidadeComprada = Number(item.quantidade_comprada || 0) + itemEditado.quantidade;
                const quantidadeTotal = Number(item.quantidade_original);

                return crudItens.update.mutateAsync({
                  id: itemId,
                  updates: {
                    quantidade_comprada: novaQuantidadeComprada,
                    valor_unitario: itemEditado.valor_unitario,
                    // Marcar como comprado apenas se a quantidade total foi atingida
                    comprado: novaQuantidadeComprada >= quantidadeTotal
                  }
                });
              }
              return Promise.resolve();
            });

            await Promise.all(updatePromises);

            // Verificar se todos os itens da requisição foram completamente comprados
            const todosItensRequisicao = itensRequisicao.filter(item => item.requisicao_id === requisicaoAtual.id);
            let todosItensComprados = true;

            for (const item of todosItensRequisicao) {
              const itemEditado = itensEditados[item.id];
              const quantidadeComprada = itemEditado ?
                Number(item.quantidade_comprada || 0) + itemEditado.quantidade :
                Number(item.quantidade_comprada || 0);

              if (quantidadeComprada < Number(item.quantidade)) {
                todosItensComprados = false;
                break;
              }
            }

            // Atualizar status da requisição
            const novoStatus = todosItensComprados ? 'concluida' : 'aberta';
            if (novoStatus !== requisicaoAtual.status) {
              await crudRequisicoes.update.mutateAsync({
                id: requisicaoAtual.id,
                updates: { status: novoStatus }
              });
            }
          } catch (error) {
            console.error('Erro ao atualizar itens da requisição:', error);
          }
        }

        const totalItensComprados = selectedItens.reduce((acc, itemId) => {
          const itemEditado = itensEditados[itemId];
          return acc + (itemEditado ? itemEditado.quantidade : 0);
        }, 0);

        toast({
          title: "Despesa registrada!",
          description: `Despesa cadastrada com ${selectedItens.length} item(ns) e ${totalItensComprados.toFixed(2)} unidades compradas.`,
        });
        setOpen(false);
        form.reset();
        setSelectedCliente("");
        setSelectedObra("");
        setSelectedRequisicao("");
        setSelectedItens([]);
        setItensEditados({});
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
    filteredDespesas.reduce((acc, d) => acc + parseCurrencyInput(d.valor || 0), 0), [filteredDespesas]);

  const despesasValidadas = useMemo(() =>
    filteredDespesas.filter(d => d.status === "validado").reduce((acc, d) => acc + parseCurrencyInput(d.valor || 0), 0), [filteredDespesas]);

  const despesasPendentes = useMemo(() =>
    filteredDespesas.filter(d => d.status === "pendente").reduce((acc, d) => acc + parseCurrencyInput(d.valor || 0), 0), [filteredDespesas]);

  // Relatórios avançados por categoria e período
  const relatoriosPorCategoria = useMemo(() => {
    const categorias = filteredDespesas.reduce((acc, despesa) => {
      const categoria = despesa.categoria || "Sem categoria";
      acc[categoria] = (acc[categoria] || 0) + parseCurrencyInput(despesa.valor || 0);
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(categorias).sort(([,a], [,b]) => (b as number) - (a as number));
  }, [filteredDespesas]);

  const relatoriosPorCliente = useMemo(() => {
    const clientes = filteredDespesas.reduce((acc, despesa) => {
      const cliente = despesa.cliente?.nome || "Cliente não informado";
      acc[cliente] = (acc[cliente] || 0) + parseCurrencyInput(despesa.valor || 0);
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

  // Função para upload de comprovante no Supabase Storage
  const handleFileUpload = async (file: File) => {
    if (!file) return null;

    try {
      // Importar dinamicamente para evitar problema de dependência circular
      const { SupabaseStorage, COMPROVANTE_TYPES, MAX_COMPROVANTE_SIZE } = await import('@/lib/supabaseStorage');

      // Validar tipo do arquivo
      if (!SupabaseStorage.validateFile(file, COMPROVANTE_TYPES)) {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, envie apenas imagens (JPG, PNG) ou PDF.",
          variant: "destructive",
        });
        return null;
      }

      // Validar tamanho do arquivo
      if (!SupabaseStorage.validateFileSize(file, MAX_COMPROVANTE_SIZE)) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 10MB.",
          variant: "destructive",
        });
        return null;
      }

      // Fazer upload para o Supabase Storage
      const result = await SupabaseStorage.uploadComprovante(file);

      // Atualizar o campo comprovante_url automaticamente
      form.setValue("comprovante_url", result.url);

      toast({
        title: "Comprovante carregado!",
        description: `Arquivo ${file.name} enviado com sucesso.`,
      });

      return result.url;
    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar o arquivo. Tente novamente.",
        variant: "destructive",
      });
      return null;
    }
  };

  const onEditSubmit = async (data: DespesaFormData) => {
    if (!editingDespesa) return;

    try {
      const despesaAtualizada = {
        cliente_id: data.cliente_id,
        obra_id: data.obra_id,
        categoria: data.categoria,
        valor: parseCurrencyInput(data.valor),
        data_despesa: data.data_despesa.toISOString().split('T')[0],
        comprovante_url: data.comprovante_url || null,
        fornecedor_cnpj: data.fornecedor_cnpj || null,
        numero_documento: data.numero_documento || null,
        observacao: data.observacao || null,
      };

      await update.mutateAsync({ id: editingDespesa.id, updates: despesaAtualizada });

      toast({
        title: "Despesa atualizada",
        description: "A despesa foi atualizada com sucesso.",
      });

      setEditOpen(false);
      setEditingDespesa(null);
      editForm.reset();
    } catch (error) {
      console.error('Erro ao atualizar despesa:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a despesa.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
      validado: {
        label: "Validado",
        className: "status-badge-validado",
        icon: CheckCircle
      },
      pendente: {
        label: "Pendente",
        className: "status-badge-pendente",
        icon: Clock
      },
      rejeitado: {
        label: "Rejeitado",
        className: "status-badge-rejeitado",
        icon: AlertCircle
      },
    };

    const variant = variants[status] || variants.pendente;
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
      <div className="page-header">
        <div>
          <h1 className="page-title">Módulo Financeiro</h1>
          <p className="page-description">Gestão de despesas e comprovantes</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Despesa
              </Button>
            </DialogTrigger>
            <DialogContent className="dialog-content-mobile">
              <DialogHeader className="dialog-header">
                <DialogTitle>Registrar Despesa Financeira</DialogTitle>
                <DialogDescription>
                  Vincule uma despesa a uma requisição de compra
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
                  <div className="dialog-form-container space-y-4">

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
                          disabled={!selectedCliente || obrasFiltradas.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={
                                !selectedCliente 
                                  ? "Primeiro selecione cliente e obra" 
                                  : requisicoesAbertas.length === 0
                                    ? "Nenhuma requisição aberta para esta obra"
                                    : "Selecione a requisição aberta"
                              } />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {requisicoesAbertas.map((requisicao) => {
                              const itensReq = itensRequisicao.filter(item => item.requisicao_id === requisicao.id);
                              const itensPendentes = itensReq.filter(item => !item.comprado).length;
                              return (
                                <SelectItem key={requisicao.id} value={requisicao.id}>
                                  {requisicao.titulo}
                                  {itensReq.length > 0 && ` (${itensPendentes} de ${itensReq.length} itens pendentes)`}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Seleção de Itens da Requisição */}
                  {requisicaoAtual?.itens_produtos && requisicaoAtual.itens_produtos.length > 0 && (
                    <div className="mt-4 border rounded-lg p-4 bg-blue-50">
                      <h4 className="font-medium text-blue-900 mb-3">Itens da Requisição</h4>
                      <p className="text-sm text-blue-700 mb-3">
                        Selecione os itens que estão sendo comprados nesta despesa:
                      </p>
                      <div className="space-y-4">
                        {requisicaoAtual.itens_produtos.map((item: any, index: number) => {
                          const itemId = item.id || `item-${index}`;
                          const quantidadeEditada = itensEditados[itemId]?.quantidade || item.quantidade_disponivel;
                          const valorEditado = itensEditados[itemId]?.valor_unitario || item.valor_unitario || 0;
                          const totalCalculado = quantidadeEditada * valorEditado;

                          return (
                            <div key={itemId} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                              {/* Header com checkbox e info básica */}
                              <div className="flex items-start space-x-3">
                                <input
                                  type="checkbox"
                                  checked={selectedItens.includes(itemId)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedItens([...selectedItens, itemId]);
                                      // Inicializar valores editados se não existirem
                                      if (!itensEditados[itemId]) {
                                        setItensEditados(prev => ({
                                          ...prev,
                                          [itemId]: {
                                            quantidade: item.quantidade_disponivel,
                                            valor_unitario: item.valor_unitario || 0
                                          }
                                        }));
                                      }
                                    } else {
                                      setSelectedItens(selectedItens.filter(id => id !== itemId));
                                    }
                                  }}
                                  className="mt-1 h-4 w-4 text-blue-600"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700">
                                      #{item.numero || `${index + 1}`}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      Disponível: {item.quantidade_disponivel} de {item.quantidade_original} {item.unidade_medida || 'UN'}
                                    </span>
                                  </div>
                                  <h5 className="font-medium text-gray-900 mb-1">{item.descricao || item.nome}</h5>
                                </div>
                              </div>

                              {/* Campos editáveis - só aparecem se o item estiver selecionado */}
                              {selectedItens.includes(itemId) && (
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t border-gray-100">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Quantidade a Comprar *
                                    </label>
                                    <input
                                      type="number"
                                      min="0.01"
                                      max={item.quantidade_disponivel}
                                      step="0.01"
                                      value={quantidadeEditada || ""}
                                      onChange={(e) => {
                                        const valor = e.target.value;
                                        const novaQuantidade = valor === "" ? 0 : parseFloat(valor);
                                        setItensEditados(prev => ({
                                          ...prev,
                                          [itemId]: {
                                            ...prev[itemId] || { valor_unitario: item.valor_unitario || 0 },
                                            quantidade: novaQuantidade
                                          }
                                        }));
                                      }}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Unidade
                                    </label>
                                    <input
                                      type="text"
                                      value={item.unidade_medida || 'UN'}
                                      disabled
                                      className="w-full px-2 py-1 text-sm border border-gray-200 rounded bg-gray-50"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Valor Unitário (R$) *
                                    </label>
                                    <input
                                      type="number"
                                      min="0.01"
                                      step="0.01"
                                      value={valorEditado || ""}
                                      onChange={(e) => {
                                        const valor = e.target.value;
                                        const novoValor = valor === "" ? 0 : parseFloat(valor);
                                        setItensEditados(prev => ({
                                          ...prev,
                                          [itemId]: {
                                            ...prev[itemId] || { quantidade: item.quantidade_disponivel },
                                            valor_unitario: novoValor
                                          }
                                        }));
                                      }}
                                      placeholder="0,00"
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Total Calculado
                                    </label>
                                    <div className="w-full px-2 py-1 text-sm border border-gray-200 rounded bg-blue-50 font-semibold text-blue-800">
                                      {formatCurrency(totalCalculado)}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
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
                              {categorias.filter(cat => cat.ativa).map(categoria => (
                                <SelectItem key={categoria.id} value={categoria.nome}>
                                  {categoria.nome}
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

                  {/* Upload de Comprovante */}
                  <FormField
                    control={form.control}
                    name="comprovante"
                    render={({ field: { onChange, value, ...field } }) => (
                      <FormItem>
                        <FormLabel>Comprovante ou Nota Fiscal *</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Input
                              type="file"
                              accept=".jpg,.jpeg,.png,.pdf"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  onChange(file);
                                  await handleFileUpload(file);
                                }
                              }}
                              className="cursor-pointer"
                              {...field}
                            />
                            <p className="text-xs text-muted-foreground">
                              Aceita imagens (JPG, PNG) e PDF. Máximo 10MB.
                            </p>
                            {form.watch("comprovante_url") && (
                              <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 p-2 rounded">
                                <FileText className="h-4 w-4" />
                                <span>Comprovante enviado com sucesso</span>
                                <a
                                  href={form.watch("comprovante_url")}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline hover:text-green-700"
                                >
                                  Visualizar
                                </a>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Campos preparatórios n8n - Opcional */}
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Campos para Automação (Opcional)</h3>
                    <div className="grid grid-cols-1 gap-4">
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

                  </div>
                  
                  <div className="form-actions">
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
            <div className="text-2xl font-bold">{formatCurrency(totalDespesas)}</div>
            <p className="text-xs text-muted-foreground mt-1">{despesas.length} despesas registradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(despesasPendentes)}</div>
            <p className="text-xs text-muted-foreground mt-1">{despesas.filter(d => d.status === "pendente").length} validação(ões) pendente(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Validados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(despesasValidadas)}</div>
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
                      {formatCurrency(Number(valor))}
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
                      {formatCurrency(Number(valor))}
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
                  className="card-item"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="icon-container">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{despesa.categoria || 'Despesa'} - {despesa.obra?.nome || 'N/A'}</h4>
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
                    <div className="text-xl font-bold mb-2">
                      {formatCurrency(despesa.valor)}
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingDespesa(despesa);
                          setEditOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={async () => {
                          if (window.confirm('Tem certeza que deseja excluir esta despesa?')) {
                            try {
                              await deleteDespesa.mutateAsync(despesa.id);
                              toast({
                                title: "Despesa excluída",
                                description: "A despesa foi excluída com sucesso.",
                              });
                            } catch (error) {
                              toast({
                                title: "Erro ao excluir",
                                description: "Não foi possível excluir a despesa.",
                                variant: "destructive",
                              });
                            }
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Edição de Despesa */}
      <Dialog open={editOpen} onOpenChange={(open) => {
        setEditOpen(open);
        if (!open) {
          setEditingDespesa(null);
          editForm.reset();
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Despesa</DialogTitle>
            <DialogDescription>
              Edite os dados da despesa selecionada.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Material">Material</SelectItem>
                          <SelectItem value="Ferramentas">Ferramentas</SelectItem>
                          <SelectItem value="Logística">Logística</SelectItem>
                          <SelectItem value="Material Elétrico">Material Elétrico</SelectItem>
                          <SelectItem value="Outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="R$ 0,00"
                        onChange={(e) => {
                          const formatted = currencyMask(e.target.value);
                          field.onChange(formatted);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="fornecedor_cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ do Fornecedor</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="00.000.000/0000-00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="numero_documento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número do Documento</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="NF-001, REC-123, etc." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="observacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observação</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Observações adicionais..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Salvar Alterações
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Financeiro;
