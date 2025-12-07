import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Plus,
  Smartphone,
  Banknote,
  ArrowRightLeft,
  FileText,
  Settings,
  Eye,
  EyeOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOptimizedSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { useSupabaseCRUD } from "@/hooks/useSupabaseMutation";
import { DataTable, Column } from "@/components/ui/DataTable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FormaPagamento {
  id: string;
  nome: string;
  codigo: string;
  descricao?: string;
  icone?: string;
  ativo: boolean;
  permite_parcelamento: boolean;
  requer_cartao: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

interface FormularioFormaPagamento {
  nome: string;
  codigo: string;
  descricao: string;
  icone: string;
  permite_parcelamento: boolean;
  requer_cartao: boolean;
  ordem: number;
}

const iconeOptions = [
  { value: 'CreditCard', label: 'Cartão de Crédito', icon: CreditCard },
  { value: 'Smartphone', label: 'Smartphone/PIX', icon: Smartphone },
  { value: 'Banknote', label: 'Dinheiro', icon: Banknote },
  { value: 'ArrowRightLeft', label: 'Transferência', icon: ArrowRightLeft },
  { value: 'FileText', label: 'Documento', icon: FileText },
  { value: 'Settings', label: 'Outros', icon: Settings }
];

const getIconComponent = (iconeName: string) => {
  const iconOption = iconeOptions.find(opt => opt.value === iconeName);
  return iconOption ? iconOption.icon : Settings;
};

const FormasPagamento = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingForma, setEditingForma] = useState<FormaPagamento | null>(null);

  // Form state
  const [formData, setFormData] = useState<FormularioFormaPagamento>({
    nome: '',
    codigo: '',
    descricao: '',
    icone: 'CreditCard',
    permite_parcelamento: false,
    requer_cartao: false,
    ordem: 0
  });

  // Queries
  const { data: formasPagamento = [], isLoading } = useOptimizedSupabaseQuery<FormaPagamento>('FORMAS_PAGAMENTO');
  const { add, update, delete: deleteForma } = useSupabaseCRUD<FormaPagamento>('FORMAS_PAGAMENTO');

  const resetForm = () => {
    setFormData({
      nome: '',
      codigo: '',
      descricao: '',
      icone: 'CreditCard',
      permite_parcelamento: false,
      requer_cartao: false,
      ordem: formasPagamento.length + 1
    });
    setEditingForma(null);
  };

  const gerarCodigo = (nome: string) => {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]/g, '_') // Replace caracteres especiais por underscore
      .replace(/_+/g, '_') // Remove underscores duplicados
      .replace(/^_|_$/g, ''); // Remove underscore do início e fim
  };

  const handleNomeChange = (nome: string) => {
    setFormData(prev => ({
      ...prev,
      nome,
      codigo: editingForma ? prev.codigo : gerarCodigo(nome)
    }));
  };

  const handleSubmit = () => {
    // Validações básicas
    if (!formData.nome || !formData.codigo) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome e código da forma de pagamento",
        variant: "destructive",
      });
      return;
    }

    // Verificar se código já existe (exceto se estiver editando)
    const codigoExiste = formasPagamento.some(fp =>
      fp.codigo === formData.codigo && fp.id !== editingForma?.id
    );

    if (codigoExiste) {
      toast({
        title: "Código já existe",
        description: "Este código já está sendo usado por outra forma de pagamento",
        variant: "destructive",
      });
      return;
    }

    const formaData = {
      ...formData,
      ativo: true
    };

    if (editingForma) {
      update.mutate(
        { id: editingForma.id, updates: formaData },
        {
          onSuccess: () => {
            toast({
              title: "Forma de pagamento atualizada!",
              description: "As informações foram atualizadas com sucesso.",
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
      add.mutate(formaData, {
        onSuccess: () => {
          toast({
            title: "Forma de pagamento cadastrada!",
            description: "Nova forma de pagamento foi adicionada com sucesso.",
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

  const handleEdit = (forma: FormaPagamento) => {
    setFormData({
      nome: forma.nome,
      codigo: forma.codigo,
      descricao: forma.descricao || '',
      icone: forma.icone || 'CreditCard',
      permite_parcelamento: forma.permite_parcelamento,
      requer_cartao: forma.requer_cartao,
      ordem: forma.ordem
    });
    setEditingForma(forma);
    setOpen(true);
  };

  const handleToggleActive = (forma: FormaPagamento) => {
    update.mutate(
      {
        id: forma.id,
        updates: { ativo: !forma.ativo }
      },
      {
        onSuccess: () => {
          toast({
            title: forma.ativo ? "Forma de pagamento desativada!" : "Forma de pagamento ativada!",
            description: `A forma de pagamento foi ${forma.ativo ? 'desativada' : 'ativada'} com sucesso.`,
          });
        },
        onError: (error) => {
          toast({
            title: "Erro ao atualizar status",
            description: error.message,
            variant: "destructive",
          });
        }
      }
    );
  };

  // Definir colunas da tabela
  const columns: Column<FormaPagamento>[] = [
    {
      key: 'ordem',
      title: 'Ordem',
      sortable: true,
      render: (ordem) => (
        <div className="w-12 text-center">
          <Badge variant="outline">{ordem}</Badge>
        </div>
      )
    },
    {
      key: 'nome',
      title: 'Nome',
      sortable: true,
      filterable: true,
      filterType: 'text',
      render: (nome, row) => {
        const IconComponent = getIconComponent(row.icone || 'Settings');
        return (
          <div className="flex items-center gap-3">
            <IconComponent className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="font-medium">{nome}</div>
              <div className="text-xs text-muted-foreground">
                <code>{row.codigo}</code>
              </div>
            </div>
          </div>
        );
      }
    },
    {
      key: 'descricao',
      title: 'Descrição',
      render: (descricao) => (
        <span className="text-sm text-muted-foreground">
          {descricao || 'Sem descrição'}
        </span>
      )
    },
    {
      key: 'permite_parcelamento',
      title: 'Parcelamento',
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { value: 'true', label: 'Permite' },
        { value: 'false', label: 'Não permite' }
      ],
      render: (permite) => (
        <Badge variant={permite ? 'default' : 'secondary'}>
          {permite ? 'Permite' : 'À vista'}
        </Badge>
      )
    },
    {
      key: 'requer_cartao',
      title: 'Requer Cartão',
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { value: 'true', label: 'Sim' },
        { value: 'false', label: 'Não' }
      ],
      render: (requer) => (
        <Badge variant={requer ? 'destructive' : 'outline'}>
          {requer ? 'Sim' : 'Não'}
        </Badge>
      )
    },
    {
      key: 'ativo',
      title: 'Status',
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { value: 'true', label: 'Ativo' },
        { value: 'false', label: 'Inativo' }
      ],
      render: (ativo) => (
        <Badge variant={ativo ? 'default' : 'secondary'}>
          {ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      )
    },
    {
      key: 'created_at',
      title: 'Data Cadastro',
      sortable: true,
      render: (value) => (
        <span className="text-sm">
          {format(new Date(value), 'dd/MM/yyyy', { locale: ptBR })}
        </span>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Formas de Pagamento</h1>
          <p className="page-description">Gestão das formas de pagamento disponíveis no sistema</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Forma de Pagamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingForma ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento'}
              </DialogTitle>
              <DialogDescription>
                {editingForma ? 'Atualize as informações da forma de pagamento' : 'Cadastre uma nova forma de pagamento no sistema'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Nome */}
              <div>
                <Label>Nome da Forma de Pagamento *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => handleNomeChange(e.target.value)}
                  placeholder="Ex: PIX, Cartão de Crédito"
                />
              </div>

              {/* Código */}
              <div>
                <Label>Código do Sistema *</Label>
                <Input
                  value={formData.codigo}
                  onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
                  placeholder="Ex: pix, cartao_avista"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Código único usado internamente pelo sistema
                </p>
              </div>

              {/* Descrição */}
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Descrição da forma de pagamento..."
                  rows={2}
                />
              </div>

              {/* Ícone */}
              <div>
                <Label>Ícone</Label>
                <Select value={formData.icone} onValueChange={(value) =>
                  setFormData(prev => ({ ...prev, icone: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Configurações */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Permite Parcelamento</Label>
                    <p className="text-xs text-muted-foreground">
                      Esta forma de pagamento aceita parcelamento
                    </p>
                  </div>
                  <Switch
                    checked={formData.permite_parcelamento}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({ ...prev, permite_parcelamento: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Requer Cartão Vinculado</Label>
                    <p className="text-xs text-muted-foreground">
                      Necessário selecionar um cartão de crédito
                    </p>
                  </div>
                  <Switch
                    checked={formData.requer_cartao}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({ ...prev, requer_cartao: checked }))
                    }
                  />
                </div>
              </div>

              {/* Ordem */}
              <div>
                <Label>Ordem de Exibição</Label>
                <Input
                  type="number"
                  value={formData.ordem}
                  onChange={(e) => setFormData(prev => ({ ...prev, ordem: parseInt(e.target.value) || 0 }))}
                  min="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ordem em que aparece nos formulários (menor = primeiro)
                </p>
              </div>

              {/* Ações */}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit}>
                  {editingForma ? 'Atualizar' : 'Salvar'} Forma de Pagamento
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Formas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formasPagamento.length}</div>
            <p className="text-xs text-muted-foreground">cadastradas no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Formas Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formasPagamento.filter(f => f.ativo).length}
            </div>
            <p className="text-xs text-muted-foreground">disponíveis para uso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Com Parcelamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formasPagamento.filter(f => f.permite_parcelamento && f.ativo).length}
            </div>
            <p className="text-xs text-muted-foreground">aceitam parcelamento</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Formas de Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Formas de Pagamento</CardTitle>
          <CardDescription>Configuração das formas de pagamento disponíveis</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={formasPagamento}
            columns={columns}
            loading={isLoading}
            onEdit={handleEdit}
            searchPlaceholder="Buscar por nome, código..."
            emptyMessage="Nenhuma forma de pagamento cadastrada ainda."
            showSelection={false}
            showActions={true}
            globalSearch={true}
            hideFilters={false}
            customActions={(forma) => (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggleActive(forma)}
                className={forma.ativo ? "text-orange-600" : "text-green-600"}
              >
                {forma.ativo ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                {forma.ativo ? 'Desativar' : 'Ativar'}
              </Button>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default FormasPagamento;