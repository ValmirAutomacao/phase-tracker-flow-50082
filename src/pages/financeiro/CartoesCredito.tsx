import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Plus,
  User,
  Calendar,
  Shield,
  Eye,
  EyeOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOptimizedSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { useSupabaseCRUD } from "@/hooks/useSupabaseMutation";
import { DataTable, Column } from "@/components/ui/DataTable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMascaras } from "@/hooks/useMascaras";

type Bandeira = 'visa' | 'mastercard' | 'elo' | 'amex' | 'hipercard' | 'outros';

interface CartaoCredito {
  id: string;
  funcionario_id: string;
  numero_cartao_hash: string;
  numero_cartao_masked: string;
  bandeira: Bandeira;
  vencimento_mes: number;
  vencimento_ano: number;
  ativo: boolean;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

interface FormularioCartao {
  funcionario_id: string;
  numero_cartao: string;
  bandeira: 'visa' | 'mastercard' | 'elo' | 'amex' | 'hipercard' | 'outros';
  vencimento_mes: number;
  vencimento_ano: number;
  observacoes: string;
}

const CartoesCredito = () => {
  const { toast } = useToast();
  const { formatarCartao, validarCartao, detectarBandeiraCartao } = useMascaras();
  const [open, setOpen] = useState(false);
  const [editingCartao, setEditingCartao] = useState<CartaoCredito | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showCardNumber, setShowCardNumber] = useState(true);

  // Form state
  const [formData, setFormData] = useState<FormularioCartao>({
    funcionario_id: '',
    numero_cartao: '',
    bandeira: 'visa',
    vencimento_mes: new Date().getMonth() + 1,
    vencimento_ano: new Date().getFullYear(),
    observacoes: ''
  });

  // Queries
  const { data: cartoes = [], isLoading } = useOptimizedSupabaseQuery<CartaoCredito>('CARTOES_CREDITO');
  const { data: funcionarios = [] } = useOptimizedSupabaseQuery<any>('FUNCIONARIOS');
  const { add, update, delete: deleteCartao } = useSupabaseCRUD<CartaoCredito>('CARTOES_CREDITO');

  // Função para mascarar número do cartão
  const mascarNumeroCartao = (numero: string) => {
    const cleaned = numero.replace(/\s/g, '');
    if (cleaned.length >= 4) {
      return '**** **** **** ' + cleaned.slice(-4);
    }
    return cleaned;
  };

  // Função para hash simples (em produção usar uma biblioteca adequada)
  const hashNumeroCartao = (numero: string) => {
    const cleaned = numero.replace(/\s/g, '');
    // Em produção, usar uma função de hash segura
    return btoa(cleaned); // Base64 como exemplo
  };

  const resetForm = () => {
    setFormData({
      funcionario_id: '',
      numero_cartao: '',
      bandeira: 'visa',
      vencimento_mes: new Date().getMonth() + 1,
      vencimento_ano: new Date().getFullYear(),
      observacoes: ''
    });
    setEditingCartao(null);
    setShowCardNumber(true); // Mostrar número por padrão ao criar novo cartão
  };

  const handleSubmit = () => {
    // Validações básicas
    if (!formData.funcionario_id || !formData.numero_cartao) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha funcionário e número do cartão",
        variant: "destructive",
      });
      return;
    }

    // Validar número do cartão usando algoritmo de Luhn
    if (!validarCartao(formData.numero_cartao)) {
      toast({
        title: "Número do cartão inválido",
        description: "O número do cartão não é válido",
        variant: "destructive",
      });
      return;
    }

    // Detectar bandeira automaticamente se não especificada
    const bandeiraDetectada = detectarBandeiraCartao(formData.numero_cartao);
    const bandeiraFinal = formData.bandeira === 'outros' ? bandeiraDetectada : formData.bandeira;

    const cartaoData = {
      funcionario_id: formData.funcionario_id,
      numero_cartao_hash: hashNumeroCartao(formData.numero_cartao),
      numero_cartao_masked: mascarNumeroCartao(formData.numero_cartao),
      bandeira: bandeiraFinal as Bandeira,
      vencimento_mes: formData.vencimento_mes,
      vencimento_ano: formData.vencimento_ano,
      observacoes: formData.observacoes,
      ativo: true
    };

    if (editingCartao) {
      update.mutate(
        { id: editingCartao.id, updates: cartaoData },
        {
          onSuccess: () => {
            toast({
              title: "Cartão atualizado!",
              description: "Cartão de crédito foi atualizado com sucesso.",
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
      add.mutate(cartaoData, {
        onSuccess: () => {
          toast({
            title: "Cartão cadastrado!",
            description: "Novo cartão de crédito foi adicionado com sucesso.",
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

  const handleEdit = (cartao: CartaoCredito) => {
    setFormData({
      funcionario_id: cartao.funcionario_id,
      numero_cartao: '', // Por segurança, não preenchemos o número
      bandeira: cartao.bandeira,
      vencimento_mes: cartao.vencimento_mes,
      vencimento_ano: cartao.vencimento_ano,
      observacoes: cartao.observacoes || ''
    });
    setEditingCartao(cartao);
    setOpen(true);
  };

  const handleToggleActive = (cartao: CartaoCredito) => {
    update.mutate(
      {
        id: cartao.id,
        updates: { ativo: !cartao.ativo }
      },
      {
        onSuccess: () => {
          toast({
            title: cartao.ativo ? "Cartão desativado!" : "Cartão ativado!",
            description: `O cartão foi ${cartao.ativo ? 'desativado' : 'ativado'} com sucesso.`,
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

  // Função para formatar vencimento
  const formatarVencimento = (mes: number, ano: number) => {
    return `${mes.toString().padStart(2, '0')}/${ano}`;
  };

  // Definir colunas da tabela
  const columns: Column<CartaoCredito>[] = [
    {
      key: 'funcionario_id',
      title: 'Funcionário',
      filterable: true,
      filterType: 'select',
      filterOptions: funcionarios.map((f: any) => ({ value: f.id, label: f.nome })),
      render: (funcionarioId) => {
        const funcionario = funcionarios.find((f: any) => f.id === funcionarioId);
        return (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{funcionario?.nome || 'Funcionário não encontrado'}</span>
          </div>
        );
      }
    },
    {
      key: 'numero_cartao_masked',
      title: 'Número do Cartão',
      render: (numeroMascarado) => (
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <code className="text-sm font-mono">{numeroMascarado}</code>
        </div>
      )
    },
    {
      key: 'bandeira',
      title: 'Bandeira',
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { value: 'visa', label: 'Visa' },
        { value: 'mastercard', label: 'Mastercard' },
        { value: 'elo', label: 'Elo' },
        { value: 'amex', label: 'American Express' },
        { value: 'hipercard', label: 'Hipercard' },
        { value: 'outros', label: 'Outros' }
      ],
      render: (bandeira) => (
        <Badge variant="outline" className="capitalize">
          {bandeira === 'amex' ? 'American Express' : bandeira}
        </Badge>
      )
    },
    {
      key: 'vencimento_mes',
      title: 'Vencimento',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{formatarVencimento(row.vencimento_mes, row.vencimento_ano)}</span>
        </div>
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

  // Gerar anos para select (próximos 10 anos)
  const anos = Array.from({ length: 15 }, (_, i) => new Date().getFullYear() + i);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Cartões de Crédito</h1>
          <p className="page-description">Gestão de cartões vinculados aos funcionários</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cartão
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCartao ? 'Editar Cartão de Crédito' : 'Novo Cartão de Crédito'}
              </DialogTitle>
              <DialogDescription>
                {editingCartao ? 'Atualize as informações do cartão' : 'Vincule um novo cartão a um funcionário'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Funcionário */}
              <div>
                <Label>Funcionário *</Label>
                <Select value={formData.funcionario_id} onValueChange={(value) =>
                  setFormData(prev => ({ ...prev, funcionario_id: value }))
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

              {/* Número do Cartão */}
              <div>
                <Label>Número do Cartão *</Label>
                <div className="relative">
                  <Input
                    type={showCardNumber ? "text" : "password"}
                    value={formData.numero_cartao}
                    onChange={(e) => {
                      const valorFormatado = formatarCartao(e.target.value);
                      setFormData(prev => ({ ...prev, numero_cartao: valorFormatado }));

                      // Auto-detectar bandeira
                      const bandeiraDetectada = detectarBandeiraCartao(valorFormatado);
                      if (bandeiraDetectada !== 'outros') {
                        setFormData(prev => ({ ...prev, bandeira: bandeiraDetectada as any }));
                      }
                    }}
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setShowCardNumber(!showCardNumber)}
                  >
                    {showCardNumber ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex justify-between items-center mt-1">
                  {editingCartao && (
                    <p className="text-xs text-muted-foreground">
                      Deixe em branco para manter o número atual
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Clique no ícone para {showCardNumber ? 'ocultar' : 'mostrar'} o número
                  </p>
                </div>
              </div>

              {/* Bandeira */}
              <div>
                <Label>Bandeira *</Label>
                <Select value={formData.bandeira} onValueChange={(value: any) =>
                  setFormData(prev => ({ ...prev, bandeira: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visa">Visa</SelectItem>
                    <SelectItem value="mastercard">Mastercard</SelectItem>
                    <SelectItem value="elo">Elo</SelectItem>
                    <SelectItem value="amex">American Express</SelectItem>
                    <SelectItem value="hipercard">Hipercard</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Vencimento */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Mês</Label>
                  <Select value={formData.vencimento_mes.toString()} onValueChange={(value) =>
                    setFormData(prev => ({ ...prev, vencimento_mes: parseInt(value) }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(mes => (
                        <SelectItem key={mes} value={mes.toString()}>
                          {mes.toString().padStart(2, '0')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Ano</Label>
                  <Select value={formData.vencimento_ano.toString()} onValueChange={(value) =>
                    setFormData(prev => ({ ...prev, vencimento_ano: parseInt(value) }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {anos.map(ano => (
                        <SelectItem key={ano} value={ano.toString()}>
                          {ano}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Observações */}
              <div>
                <Label>Observações</Label>
                <Input
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Observações adicionais..."
                />
              </div>

              {/* Ações */}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit}>
                  {editingCartao ? 'Atualizar' : 'Salvar'} Cartão
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
            <CardTitle className="text-sm font-medium">Total de Cartões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cartoes.length}</div>
            <p className="text-xs text-muted-foreground">cadastrados no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cartões Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {cartoes.filter(c => c.ativo).length}
            </div>
            <p className="text-xs text-muted-foreground">em uso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Funcionários com Cartão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(cartoes.filter(c => c.ativo).map(c => c.funcionario_id)).size}
            </div>
            <p className="text-xs text-muted-foreground">únicos</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Cartões */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Cartões de Crédito</CardTitle>
          <CardDescription>Cartões vinculados aos funcionários</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={cartoes}
            columns={columns}
            loading={isLoading}
            onEdit={handleEdit}
            searchPlaceholder="Buscar por funcionário, bandeira..."
            emptyMessage="Nenhum cartão de crédito cadastrado ainda."
            showSelection={false}
            showActions={true}
            globalSearch={true}
            hideFilters={false}
            customActions={(cartao) => (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggleActive(cartao)}
                className={cartao.ativo ? "text-orange-600" : "text-green-600"}
              >
                <Shield className="h-4 w-4 mr-1" />
                {cartao.ativo ? 'Desativar' : 'Ativar'}
              </Button>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CartoesCredito;