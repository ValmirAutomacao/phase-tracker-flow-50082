import React, { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Receipt,
  Camera,
  Upload,
  Plus,
  X,
  Search,
  Edit,
  Trash2,
  FileText,
  CreditCard,
  Building2,
  User,
  Calendar,
  DollarSign,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOptimizedSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { useSupabaseCRUD } from "@/hooks/useSupabaseMutation";
import { DataTable, Column } from "@/components/ui/DataTable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { OCRService } from "@/services/ocrService";
import { supabase } from "@/lib/supabaseClient";

type FormaPagamentoType = 'cartao_avista' | 'cartao_parcelado' | 'pix' | 'dinheiro' | 'transferencia' | 'boleto' | 'debito';

interface DespesaVariavel {
  id: string;
  obra_id: string;
  obra?: { id: string; nome: string }; // JOIN com obras
  comprador_funcionario_id: string;
  funcionario?: { id: string; nome: string }; // JOIN com funcionarios
  nome_fornecedor: string;
  cnpj_fornecedor: string;
  valor_compra: number;
  forma_pagamento: FormaPagamentoType;
  numero_parcelas?: number;
  nr_documento: string;
  comprovante_url?: string;
  cartao_vinculado_id?: string;
  categorias: string[];
  descricao?: string;
  data_compra?: string;
  data_lancamento?: string;
  status_ocr: 'pendente' | 'processando' | 'concluido' | 'erro';
  dados_ocr: unknown;
  origem_dados?: string;
  funcionario_nome_ocr?: string;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

interface FormularioDespesa {
  obra_id: string;
  comprador_funcionario_id: string;
  nome_fornecedor: string;
  cnpj_fornecedor: string;
  valor_compra: string;
  forma_pagamento: FormaPagamentoType;
  numero_parcelas: number;
  nr_documento: string;
  cartao_vinculado_id: string;
  categorias: string[];
  descricao: string;
  data_compra: string;
  data_lancamento: string;
}

const DespesasVariaveis = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingDespesa, setEditingDespesa] = useState<DespesaVariavel | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [comprovante, setComprovante] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processandoOCR, setProcessandoOCR] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<FormularioDespesa>({
    obra_id: '',
    comprador_funcionario_id: '',
    nome_fornecedor: '',
    cnpj_fornecedor: '',
    valor_compra: '',
    forma_pagamento: 'pix',
    numero_parcelas: 1,
    nr_documento: '',
    cartao_vinculado_id: '',
    categorias: [],
    descricao: '',
    data_compra: new Date().toISOString().split('T')[0], // Data atual no formato YYYY-MM-DD
    data_lancamento: new Date().toISOString().split('T')[0] // Data de lançamento padrão hoje
  });

  // Queries
  const { data: despesas = [], isLoading } = useOptimizedSupabaseQuery<DespesaVariavel>('DESPESAS_VARIAVEIS');
  // Filtrar despesas OCR pendentes do lado cliente
  const despesasOCR = despesas.filter((despesa: DespesaVariavel) =>
    despesa.origem_dados === 'ocr' &&
    despesa.status_ocr === 'pendente' &&
    (!despesa.obra_id || !despesa.comprador_funcionario_id) // Despesas incompletas
  );
  const { data: obras = [] } = useOptimizedSupabaseQuery<any>('OBRAS');
  const { data: funcionarios = [] } = useOptimizedSupabaseQuery<any>('FUNCIONARIOS');
  const { data: cartoes = [] } = useOptimizedSupabaseQuery<any>('CARTOES_CREDITO');
  const { data: categorias = [] } = useOptimizedSupabaseQuery<any>('CATEGORIAS');
  const { data: formasPagamento = [] } = useOptimizedSupabaseQuery<any>('FORMAS_PAGAMENTO');

  const { add, update, delete: deleteDespesa } = useSupabaseCRUD<DespesaVariavel>('DESPESAS_VARIAVEIS');

  // Filtrar categorias para despesas variáveis
  const categoriasDisponiveis = categorias.filter((cat: any) =>
    cat.ativa && (cat.tipo === 'despesa_variavel' || cat.tipo === 'geral')
  );

  // Filtrar e ordenar formas de pagamento ativas
  const formasAtivas = formasPagamento
    .filter((forma: any) => forma.ativo)
    .sort((a: any, b: any) => a.ordem - b.ordem);

  // Filtrar cartões ativos para o funcionário selecionado
  // Na edição, incluir o cartão vinculado mesmo que seja de outro funcionário
  const cartoesDisponiveis = cartoes.filter((cartao: any) => {
    if (!cartao.ativo) return false;

    // Se estiver editando e o cartão for o vinculado, sempre incluir
    if (editingDespesa && cartao.id === formData.cartao_vinculado_id) {
      return true;
    }

    // Senão, filtrar pelo funcionário selecionado
    return cartao.funcionario_id === formData.comprador_funcionario_id;
  });

  // Função de upload para Supabase Storage
  const uploadComprovante = async (file: File): Promise<string | null> => {
    try {
      // Gerar nome único para o arquivo
      const timestamp = new Date().getTime();
      const fileExtension = file.name.split('.').pop();
      const fileName = `comprovante_${timestamp}.${fileExtension}`;
      const filePath = `despesas-variaveis/${fileName}`;

      // Upload para o bucket 'comprovantes'
      const { data, error } = await supabase.storage
        .from('comprovantes')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Erro no upload:', error);
        return null;
      }

      // Obter URL pública do arquivo
      const { data: publicUrlData } = supabase.storage
        .from('comprovantes')
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Erro no upload:', error);
      return null;
    }
  };

  // Funções de upload de comprovante
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setComprovante(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);

        // Simular processamento OCR básico
        processarOCR(file);
      } else {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Por favor, selecione uma imagem (JPG, PNG, etc.)",
          variant: "destructive",
        });
      }
    }
  };

  const processarOCR = async (file: File) => {
    setProcessandoOCR(true);

    toast({
      title: "Processando comprovante...",
      description: "Extraindo dados do comprovante automaticamente",
    });

    try {
      const resultado = await OCRService.processDocument(file);

      if (resultado.success && resultado.dados_extraidos) {
        // Normalizar dados do OCR para o formato do formulário
        const dadosNormalizados = OCRService.normalizeDadosOCR(resultado.dados_extraidos);

        // Mapear forma de pagamento do n8n para o sistema
        const mapearFormaPagamento = (formaN8n: string): string => {
          if (!formaN8n || formasAtivas.length === 0) {
            return formasAtivas.find((f: any) => f.codigo === 'pix')?.codigo || formasAtivas[0]?.codigo || 'pix';
          }

          const forma = formaN8n.toLowerCase();

          // Tentar encontrar correspondência exata
          for (const formaAtiva of formasAtivas) {
            const nomeForma = formaAtiva.nome.toLowerCase();
            const codigoForma = formaAtiva.codigo.toLowerCase();

            // Verificações específicas baseadas no código/nome
            if (forma.includes('pix') && codigoForma.includes('pix')) {
              return formaAtiva.codigo;
            }
            if ((forma.includes('débito') || forma.includes('debito') || forma.includes('vista'))
                && (codigoForma.includes('vista') || codigoForma.includes('avista'))) {
              return formaAtiva.codigo;
            }
            if (forma.includes('parcelado') && codigoForma.includes('parcelado')) {
              return formaAtiva.codigo;
            }
            if ((forma.includes('cartão') || forma.includes('cartao') || forma.includes('crédito') || forma.includes('credito'))
                && (codigoForma.includes('cartao') || codigoForma.includes('credito'))) {
              return formaAtiva.codigo;
            }
            if (forma.includes('dinheiro') && codigoForma.includes('dinheiro')) {
              return formaAtiva.codigo;
            }
          }

          // Fallback: primeira forma ativa ou padrão
          return formasAtivas[0]?.codigo || 'pix';
        };

        const formaPagamentoMapeada = mapearFormaPagamento(dadosNormalizados.forma_pagamento || '');

        setFormData((prev: FormularioDespesa): FormularioDespesa => {
          // Formatar valor_compra corretamente para o input
          const valorFormatado = dadosNormalizados.valor_compra
            ? typeof dadosNormalizados.valor_compra === 'number'
              ? dadosNormalizados.valor_compra.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : String(dadosNormalizados.valor_compra)
            : prev.valor_compra;

          // Formatar data da compra do OCR para o formato YYYY-MM-DD
          let dataCompraFormatada = prev.data_compra;
          if (dadosNormalizados.data_compra) {
            const dataOCR = dadosNormalizados.data_compra;
            if (typeof dataOCR === 'string') {
              dataCompraFormatada = dataOCR;
            } else if (dataOCR && typeof dataOCR === 'object' && 'toISOString' in dataOCR) {
              dataCompraFormatada = (dataOCR as Date).toISOString().split('T')[0];
            }
          }

          console.log('📅 Data da compra processada:', {
            original: dadosNormalizados.data_compra,
            formatada: dataCompraFormatada
          });

          return {
            ...prev,
            nome_fornecedor: dadosNormalizados.nome_fornecedor || prev.nome_fornecedor,
            cnpj_fornecedor: dadosNormalizados.cnpj_fornecedor || prev.cnpj_fornecedor,
            valor_compra: valorFormatado,
            forma_pagamento: formaPagamentoMapeada as FormaPagamentoType,
            nr_documento: dadosNormalizados.nr_documento || prev.nr_documento,
            descricao: dadosNormalizados.descricao || prev.descricao,
            data_compra: dataCompraFormatada,
            data_lancamento: prev.data_lancamento,
            // Pré-selecionar obra e funcionário se não estiverem preenchidos
            obra_id: prev.obra_id || (obras.length > 0 ? obras[0].id : ''),
            comprador_funcionario_id: prev.comprador_funcionario_id || (funcionarios.length > 0 ? funcionarios[0].id : '')
          };
        });

        toast({
          title: "Dados extraídos com sucesso!",
          description: `Forma de pagamento detectada: ${formaPagamentoMapeada.replace('_', ' ')}. Verifique e ajuste se necessário.`,
        });
      } else {
        throw new Error(resultado.message || "Erro no processamento OCR");
      }
    } catch (error) {
      console.error("Erro ao processar OCR:", error);
      toast({
        title: "Erro no processamento OCR",
        description: error instanceof Error ? error.message : "Não foi possível extrair dados do comprovante",
        variant: "destructive",
      });
    } finally {
      setProcessandoOCR(false);
    }
  };

  const adicionarCategoria = (categoriaId: string) => {
    if (!formData.categorias.includes(categoriaId)) {
      setFormData(prev => ({
        ...prev,
        categorias: [...prev.categorias, categoriaId]
      }));
    }
  };

  const removerCategoria = (categoriaId: string) => {
    setFormData(prev => ({
      ...prev,
      categorias: prev.categorias.filter(id => id !== categoriaId)
    }));
  };

  const resetForm = () => {
    setFormData({
      obra_id: '',
      comprador_funcionario_id: '',
      nome_fornecedor: '',
      cnpj_fornecedor: '',
      valor_compra: '',
      forma_pagamento: 'pix',
      numero_parcelas: 1,
      nr_documento: '',
      cartao_vinculado_id: '',
      categorias: [],
      descricao: '',
      data_compra: new Date().toISOString().split('T')[0],
      data_lancamento: new Date().toISOString().split('T')[0]
    });
    setComprovante(null);
    setPreviewUrl(null);
    setProcessandoOCR(false);
    setEditingDespesa(null);
  };

  const handleSubmit = async () => {
    // Validações básicas
    if (!formData.obra_id || !formData.comprador_funcionario_id || !formData.valor_compra || !formData.data_compra || !formData.data_lancamento) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha obra, comprador, valor, data da compra e data de lançamento",
        variant: "destructive",
      });
      return;
    }

    // Upload do comprovante se houver
    let comprovanteUrl = editingDespesa?.comprovante_url || null;
    if (comprovante) {
      const uploadedUrl = await uploadComprovante(comprovante);
      if (!uploadedUrl) {
        toast({
          title: "Erro no upload",
          description: "Não foi possível fazer upload do comprovante",
          variant: "destructive",
        });
        return;
      }
      comprovanteUrl = uploadedUrl;
    }

    // Tratar valor corretamente
    let valorTratado = 0;
    if (typeof formData.valor_compra === 'string') {
      // Remove pontos (separadores de milhares) e substitui vírgula por ponto
      const valorString = formData.valor_compra
        .replace(/\./g, '') // Remove pontos
        .replace(',', '.'); // Troca vírgula por ponto
      valorTratado = parseFloat(valorString) || 0;
    } else {
      valorTratado = formData.valor_compra || 0;
    }

    const despesaData = {
      ...formData,
      valor_compra: valorTratado,
      status_ocr: 'concluido' as const,
      origem_dados: comprovante ? 'ocr' : 'manual',
      comprovante_url: comprovanteUrl, // URL do comprovante no Supabase Storage
      data_lancamento: formData.data_lancamento, // Garante que a data de lançamento seja incluída
      dados_ocr: {
        arquivo_processado: !!comprovante,
        timestamp: new Date().toISOString(),
        arquivo_original: comprovante?.name
      }
    };

    if (editingDespesa) {
      update.mutate(
        { id: editingDespesa.id, updates: despesaData },
        {
          onSuccess: () => {
            toast({
              title: "Despesa atualizada!",
              description: "Despesa variável foi atualizada com sucesso.",
            });
            setOpen(false);
            resetForm();
          },
          onError: (error) => {
            toast({
              title: "Erro ao atualizar",
              description: error.message,
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
            description: "Nova despesa variável foi adicionada com sucesso.",
          });
          setOpen(false);
          resetForm();
        },
        onError: (error) => {
          toast({
            title: "Erro ao cadastrar",
            description: error.message,
            variant: "destructive",
          });
        }
      });
    }
  };

  const handleEdit = (despesa: DespesaVariavel) => {
    // Formatar valor para exibição (com vírgula)
    const valorFormatado = despesa.valor_compra
      ? despesa.valor_compra.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '';

    setFormData({
      obra_id: despesa.obra_id || '',
      comprador_funcionario_id: despesa.comprador_funcionario_id || '',
      nome_fornecedor: despesa.nome_fornecedor || '',
      cnpj_fornecedor: despesa.cnpj_fornecedor || '',
      valor_compra: valorFormatado,
      forma_pagamento: despesa.forma_pagamento || formasAtivas[0]?.codigo || 'pix',
      numero_parcelas: despesa.numero_parcelas || 1,
      nr_documento: despesa.nr_documento || '',
      cartao_vinculado_id: despesa.cartao_vinculado_id || '',
      categorias: despesa.categorias || [],
      descricao: despesa.descricao || '',
      data_compra: despesa.data_compra || new Date().toISOString().split('T')[0],
      data_lancamento: despesa.data_lancamento || new Date().toISOString().split('T')[0]
    });

    // Carregar preview da imagem se existir comprovante
    if (despesa.comprovante_url) {
      setPreviewUrl(despesa.comprovante_url);
    } else {
      setPreviewUrl(null);
    }

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
        onError: (error) => {
          toast({
            title: "Erro ao excluir",
            description: error.message,
            variant: "destructive",
          });
        }
      });
    }
  };

  // Definir colunas da tabela
  const columns: Column<DespesaVariavel>[] = [
    {
      key: 'data_compra',
      title: 'Data Compra',
      sortable: true,
      filterable: true,
      filterType: 'date',
      render: (value, row) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {value
                ? format(new Date(value), 'dd/MM/yyyy', { locale: ptBR })
                : format(new Date(row.created_at), 'dd/MM/yyyy', { locale: ptBR })
              }
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            Lanç.: {row.data_lancamento
              ? format(new Date(row.data_lancamento), 'dd/MM/yyyy', { locale: ptBR })
              : format(new Date(row.created_at), 'dd/MM/yyyy', { locale: ptBR })
            }
          </div>
        </div>
      )
    },
    {
      key: 'obra_id',
      title: 'Obra/Projeto',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: obras.map((obra: any) => ({
        value: obra.id,
        label: obra.nome
      })),
      render: (value, row) => {
        const obra = obras.find((o: any) => o.id === value);
        return (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {obra?.nome || 'Obra não encontrada'}
            </span>
          </div>
        );
      }
    },
    {
      key: 'comprador_funcionario_id',
      title: 'Comprador',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: funcionarios.map((func: any) => ({
        value: func.id,
        label: func.nome
      })),
      render: (value, row) => {
        const funcionario = funcionarios.find((f: any) => f.id === value);
        return (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {funcionario?.nome || 'Funcionário não encontrado'}
            </span>
          </div>
        );
      }
    },
    {
      key: 'nome_fornecedor',
      title: 'Fornecedor',
      sortable: true,
      filterable: true,
      filterType: 'text',
      render: (value, row) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-xs text-muted-foreground">
            {row.cnpj_fornecedor && `CNPJ: ${row.cnpj_fornecedor}`}
          </div>
          <div className="text-xs text-muted-foreground">
            {row.nr_documento && `Doc: ${row.nr_documento}`}
          </div>
        </div>
      )
    },
    {
      key: 'valor_compra',
      title: 'Valor',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-1">
          <DollarSign className="h-3 w-3 text-muted-foreground" />
          <span className="font-medium">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(value)}
          </span>
        </div>
      )
    },
    {
      key: 'forma_pagamento',
      title: 'Forma Pagamento',
      filterable: true,
      filterType: 'select',
      filterOptions: formasAtivas.map((forma: any) => ({
        value: forma.codigo,
        label: forma.nome
      })),
      render: (value, row) => {
        const forma = formasAtivas.find((f: any) => f.codigo === value);
        const label = forma ? forma.nome : value;
        const displayLabel = forma?.permite_parcelamento && row.numero_parcelas > 1
          ? `${label} ${row.numero_parcelas}x`
          : label;
        return <Badge variant="outline">{displayLabel}</Badge>;
      }
    },
    {
      key: 'descricao',
      title: 'Descrição/Categorias',
      render: (value, row) => (
        <div className="space-y-1">
          {value && (
            <div className="text-sm font-medium line-clamp-2">
              {value}
            </div>
          )}
          <div className="flex flex-wrap gap-1">
            {row.categorias?.slice(0, 2).map((catId: string) => {
              const categoria = categoriasDisponiveis.find((c: any) => c.id === catId);
              return (
                <Badge key={catId} variant="secondary" className="text-xs">
                  {categoria?.nome || catId}
                </Badge>
              );
            })}
            {row.categorias?.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{row.categorias.length - 2}
              </Badge>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'status_ocr',
      title: 'Status OCR',
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { value: 'pendente', label: 'Pendente' },
        { value: 'processando', label: 'Processando' },
        { value: 'concluido', label: 'Concluído' },
        { value: 'erro', label: 'Erro' }
      ],
      render: (value) => {
        const variants = {
          pendente: 'outline',
          processando: 'secondary',
          concluido: 'default',
          erro: 'destructive'
        } as const;
        return <Badge variant={variants[value]}>{value}</Badge>;
      }
    },
    {
      key: 'comprovante_url',
      title: 'Comprovante',
      render: (value) => (
        <div className="flex items-center gap-1">
          {value ? (
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
            >
              <FileText className="h-4 w-4" />
              <span className="text-xs">Ver</span>
            </a>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Despesas Variáveis</h1>
          <p className="page-description">Registro de despesas com processamento OCR de comprovantes</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Despesa Variável
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingDespesa ? 'Editar Despesa Variável' : 'Nova Despesa Variável'}
              </DialogTitle>
              <DialogDescription>
                Registre despesas com processamento automático de comprovantes
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upload de Comprovante */}
              <div className="space-y-4">
                <Label>Comprovante de Pagamento</Label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6">
                  {previewUrl ? (
                    <div className="space-y-4">
                      <img src={previewUrl} alt="Preview" className="w-full h-48 object-contain rounded" />
                      {processandoOCR && (
                        <div className="flex items-center justify-center gap-2 py-2 bg-blue-50 rounded-lg">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                          <span className="text-sm text-blue-700">Processando comprovante...</span>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={processandoOCR}
                        >
                          <Camera className="h-4 w-4 mr-1" />
                          Trocar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPreviewUrl(null);
                            setComprovante(null);
                          }}
                          disabled={processandoOCR}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remover
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="flex justify-center">
                        {processandoOCR ? (
                          <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                        ) : (
                          <Receipt className="h-12 w-12 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {processandoOCR
                            ? "Processando..."
                            : editingDespesa
                              ? "Alterar Comprovante"
                              : "Adicionar Comprovante"
                          }
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {processandoOCR
                            ? "Extraindo dados automaticamente do comprovante"
                            : editingDespesa
                              ? "Clique para alterar o comprovante (opcional)"
                              : "Tire uma foto ou faça upload de DANFE, comprovante de cartão ou recibo"
                          }
                        </p>
                      </div>
                      <div className="flex justify-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={processandoOCR}
                        >
                          <Camera className="h-4 w-4 mr-1" />
                          Câmera/Upload
                        </Button>
                      </div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={processandoOCR}
                  />
                </div>
              </div>

              {/* Formulário */}
              <div className="space-y-4">
                {/* Obra */}
                <div>
                  <Label>Obra/Projeto *</Label>
                  <Select value={formData.obra_id} onValueChange={(value) =>
                    setFormData(prev => ({ ...prev, obra_id: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a obra" />
                    </SelectTrigger>
                    <SelectContent>
                      {obras.map((obra: any) => (
                        <SelectItem key={obra.id} value={obra.id}>
                          {obra.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Comprador */}
                <div>
                  <Label>Comprador (Funcionário) *</Label>
                  <Select value={formData.comprador_funcionario_id} onValueChange={(value) =>
                    setFormData(prev => ({ ...prev, comprador_funcionario_id: value, cartao_vinculado_id: '' }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o funcionário" />
                    </SelectTrigger>
                    <SelectContent>
                      {funcionarios.map((funcionario: any) => (
                        <SelectItem key={funcionario.id} value={funcionario.id}>
                          {funcionario.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Nome do Fornecedor */}
                <div>
                  <Label className="flex items-center gap-2">
                    Nome do Fornecedor
                    {comprovante && (
                      <Badge variant="secondary" className="text-xs">
                        Via OCR
                      </Badge>
                    )}
                  </Label>
                  <Input
                    value={formData.nome_fornecedor}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome_fornecedor: e.target.value }))}
                    placeholder="Nome da empresa ou pessoa"
                  />
                </div>

                {/* CNPJ */}
                <div>
                  <Label>CNPJ do Fornecedor</Label>
                  <Input
                    value={formData.cnpj_fornecedor}
                    onChange={(e) => setFormData(prev => ({ ...prev, cnpj_fornecedor: e.target.value }))}
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                {/* Valor da Compra */}
                <div>
                  <Label>Valor da Compra *</Label>
                  <Input
                    value={formData.valor_compra}
                    onChange={(e) => {
                      let valor = e.target.value;
                      // Permitir apenas números, vírgulas e pontos
                      valor = valor.replace(/[^\d,.]/g, '');
                      setFormData(prev => ({ ...prev, valor_compra: valor }));
                    }}
                    placeholder="237,90 ou 1.237,90"
                  />
                </div>

                {/* Data da Compra */}
                <div>
                  <Label>Data da Compra *</Label>
                  <Input
                    type="date"
                    value={formData.data_compra}
                    onChange={(e) => setFormData(prev => ({ ...prev, data_compra: e.target.value }))}
                  />
                </div>

                {/* Data de Lançamento */}
                <div>
                  <Label>Data de Lançamento *</Label>
                  <Input
                    type="date"
                    value={formData.data_lancamento}
                    onChange={(e) => setFormData(prev => ({ ...prev, data_lancamento: e.target.value }))}
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Data em que a despesa foi lançada no sistema
                  </div>
                </div>

                {/* Forma de Pagamento */}
                <div>
                  <Label className="flex items-center gap-2">
                    Forma de Pagamento
                    {comprovante && (
                      <Badge variant="secondary" className="text-xs">
                        Detectado via OCR
                      </Badge>
                    )}
                  </Label>
                  <Select value={formData.forma_pagamento} onValueChange={(value: any) =>
                    setFormData(prev => ({ ...prev, forma_pagamento: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a forma de pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {formasAtivas.map((forma: any) => (
                        <SelectItem key={forma.codigo} value={forma.codigo}>
                          {forma.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Número de Parcelas */}
                {(() => {
                  const formaSelecionada = formasAtivas.find((f: any) => f.codigo === formData.forma_pagamento);
                  return formaSelecionada?.permite_parcelamento;
                })() && (
                  <div>
                    <Label>Número de Parcelas</Label>
                    <Input
                      type="number"
                      min="2"
                      max="48"
                      value={formData.numero_parcelas}
                      onChange={(e) => setFormData(prev => ({ ...prev, numero_parcelas: parseInt(e.target.value) }))}
                    />
                  </div>
                )}

                {/* Cartão Vinculado */}
                {(() => {
                  const formaSelecionada = formasAtivas.find((f: any) => f.codigo === formData.forma_pagamento);
                  return formaSelecionada?.requer_cartao;
                })() && (
                  <div>
                    <Label>Cartão Vinculado</Label>
                    <Select value={formData.cartao_vinculado_id} onValueChange={(value) =>
                      setFormData(prev => ({ ...prev, cartao_vinculado_id: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cartão" />
                      </SelectTrigger>
                      <SelectContent>
                        {cartoesDisponiveis.map((cartao: any) => (
                          <SelectItem key={cartao.id} value={cartao.id}>
                            {cartao.numero_cartao_masked} - {cartao.bandeira}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Número do Documento */}
                <div>
                  <Label>Número do Documento</Label>
                  <Input
                    value={formData.nr_documento}
                    onChange={(e) => setFormData(prev => ({ ...prev, nr_documento: e.target.value }))}
                    placeholder="Número do comprovante, DANFE ou recibo"
                  />
                </div>
              </div>
            </div>

            {/* Categorias */}
            <div className="space-y-3">
              <Label>Categorias da Compra</Label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.categorias.map(catId => {
                  const categoria = categoriasDisponiveis.find((c: any) => c.id === catId);
                  return (
                    <Badge key={catId} variant="default" className="gap-1">
                      {categoria?.nome}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => removerCategoria(catId)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  );
                })}
              </div>
              <Select onValueChange={adicionarCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Adicionar categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categoriasDisponiveis
                    .filter((cat: any) => !formData.categorias.includes(cat.id))
                    .map((categoria: any) => (
                    <SelectItem key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Descrição */}
            <div>
              <Label>Descrição da Compra</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Detalhes adicionais sobre a compra..."
                rows={3}
              />
            </div>

            {/* Ações */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={processandoOCR}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={processandoOCR}>
                {processandoOCR ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  `${editingDespesa ? 'Atualizar' : 'Salvar'} Despesa`
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Despesas OCR Pendentes */}
      {despesasOCR.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Receipt className="h-5 w-5" />
              Despesas OCR Pendentes ({despesasOCR.length})
            </CardTitle>
            <CardDescription className="text-blue-700">
              Despesas processadas via OCR que precisam ser completadas manualmente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {despesasOCR.map((despesa) => (
                <div key={despesa.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{despesa.nome_fornecedor}</div>
                    <div className="text-xs text-gray-600">
                      {despesa.funcionario_nome_ocr || 'Funcionário não identificado'} • R$ {despesa.valor_compra} • {despesa.nr_documento}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Origem: {despesa.origem_dados === 'ocr' ? 'Upload OCR' : despesa.origem_dados}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      // Preencher formulário com dados do OCR formatados corretamente
                      const valorFormatado = despesa.valor_compra
                        ? despesa.valor_compra.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : '';

                      setFormData({
                        obra_id: despesa.obra_id || '',
                        comprador_funcionario_id: despesa.comprador_funcionario_id || '',
                        nome_fornecedor: despesa.nome_fornecedor || '',
                        cnpj_fornecedor: despesa.cnpj_fornecedor || '',
                        valor_compra: valorFormatado,
                        forma_pagamento: (despesa.forma_pagamento || formasAtivas[0]?.codigo || 'pix') as FormaPagamentoType,
                        numero_parcelas: despesa.numero_parcelas || 1,
                        nr_documento: despesa.nr_documento || '',
                        cartao_vinculado_id: despesa.cartao_vinculado_id || '',
                        categorias: despesa.categorias || [],
                        descricao: despesa.descricao || '',
                        data_compra: despesa.data_compra || new Date().toISOString().split('T')[0],
                        data_lancamento: despesa.data_lancamento || new Date().toISOString().split('T')[0]
                      });
                      setEditingDespesa(despesa);
                      setOpen(true);
                    }}
                  >
                    Completar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(
                despesas
                  .filter(d => {
                    const data = new Date(d.created_at);
                    const agora = new Date();
                    return data.getMonth() === agora.getMonth() && data.getFullYear() === agora.getFullYear();
                  })
                  .reduce((acc, d) => acc + d.valor_compra, 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">despesas variáveis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Comprovantes OCR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {despesas.filter(d => d.status_ocr === 'concluido').length}
            </div>
            <p className="text-xs text-muted-foreground">processados automaticamente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {despesas.filter(d => d.status_ocr === 'pendente').length}
            </div>
            <p className="text-xs text-muted-foreground">aguardando processamento</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Despesas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Despesas Variáveis</CardTitle>
          <CardDescription>Todas as despesas registradas com OCR</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={despesas}
            columns={columns}
            loading={isLoading}
            onEdit={handleEdit}
            onDelete={(despesa) => setDeleteId(despesa.id)}
            searchPlaceholder="Buscar por fornecedor, valor..."
            emptyMessage="Nenhuma despesa variável cadastrada ainda."
            showSelection={false}
            showActions={true}
            globalSearch={true}
            hideFilters={false}
          />
        </CardContent>
      </Card>

      {/* Dialog de confirmação de exclusão */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Confirmar Exclusão</h3>
            <p className="text-gray-600 mb-4">
              Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteId(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DespesasVariaveis;