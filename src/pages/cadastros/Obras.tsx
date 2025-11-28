import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, MapPin, Calendar, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ObrasForm, ObraFormData } from "./ObrasForm";
import { useOptimizedSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { useSupabaseCRUD } from "@/hooks/useSupabaseMutation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DataTable, Column } from "@/components/ui/DataTable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EtapaObra {
  id?: string;
  nome: string;
  responsavel: string;
  dataInicio: string;
  dataPrevisao: string;
  progresso?: number;
  status?: string;
}

interface Obra {
  id: string;
  cliente_id: string;
  nome: string;
  etapas: EtapaObra[]; // JSONB
  progresso: number; // 0-100
  orcamento: number;
  status: 'planejamento' | 'execucao' | 'concluida';
  data_inicio: Date | string;
  data_fim?: Date | string;
  // Campos de endereço para manter compatibilidade
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  // Campos opcionais para compatibilidade
  cliente?: string; // Nome do cliente (denormalizado)
  responsavel?: string;
  dataInicio?: string; // Para compatibilidade
  dataPrevisao?: string; // Para compatibilidade
  created_at?: string;
  updated_at?: string;
}

const Obras = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingObra, setEditingObra] = useState<Obra | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Hooks Supabase para substituir localStorage
  const { data: obras = [], isLoading, error } = useOptimizedSupabaseQuery<any>('OBRAS');
  const { add, update, delete: deleteObra } = useSupabaseCRUD<any>('OBRAS');

  // Função helper para transformar dados do formulário para o formato da obra
  const transformFormDataToObra = useCallback((data: ObraFormData, isUpdate = false) => {
    const baseObra = {
      nome: data.nome,
      cliente_id: data.cliente, // Assumindo que data.cliente contém o ID
      endereco: data.endereco,
      numero: data.numero,
      bairro: data.bairro,
      cidade: data.cidade,
      estado: data.estado,
      cep: data.cep,
      status: data.status as 'planejamento' | 'execucao' | 'concluida',
      data_inicio: data.dataInicio,
      data_fim: data.dataPrevisaoFinal,
      orcamento: data.orcamento ? parseFloat(data.orcamento.replace(/\D/g, '')) / 100 : 0,
      etapas: data.etapas,
      // Manter campos de compatibilidade
      cliente: data.cliente,
      dataInicio: data.dataInicio,
      dataPrevisao: data.dataPrevisaoFinal,
    };

    // Adicionar progresso apenas para novas obras
    if (!isUpdate) {
      return { ...baseObra, progresso: 0 };
    }

    return baseObra;
  }, []);

  const onSubmit = (data: ObraFormData) => {
    if (editingObra) {
      const updates = transformFormDataToObra(data, true);

      update.mutate(
        { id: editingObra.id, updates },
        {
          onSuccess: () => {
            toast({
              title: "Obra atualizada!",
              description: `${data.nome} foi atualizada com sucesso.`,
            });
            setOpen(false);
            setEditingObra(null);
          },
          onError: (error) => {
            toast({
              title: "Erro ao atualizar",
              description: error.message || "Ocorreu um erro ao atualizar a obra.",
              variant: "destructive",
            });
          }
        }
      );
    } else {
      const novaObra = transformFormDataToObra(data, false);

      add.mutate(novaObra, {
        onSuccess: () => {
          toast({
            title: "Obra cadastrada!",
            description: `${data.nome} foi adicionada com sucesso com ${data.etapas.length} etapa(s).`,
          });
          setOpen(false);
        },
        onError: (error) => {
          toast({
            title: "Erro ao cadastrar",
            description: error.message || "Ocorreu um erro ao cadastrar a obra.",
            variant: "destructive",
          });
        }
      });
    }
  };

  const handleEdit = (obra: Obra) => {
    setEditingObra(obra);
    setOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteObra.mutate(deleteId, {
        onSuccess: () => {
          toast({
            title: "Obra excluída!",
            description: "A obra foi removida com sucesso.",
          });
          setDeleteId(null);
        },
        onError: (error) => {
          toast({
            title: "Erro ao excluir",
            description: error.message || "Ocorreu um erro ao excluir a obra.",
            variant: "destructive",
          });
        }
      });
    }
  };

  const getStatusBadge = useCallback((status: string) => {
    const variants: Record<string, { label: string; variant: any }> = {
      planejamento: { label: "Planejamento", variant: "secondary" },
      execucao: { label: "Execução", variant: "default" },
      concluida: { label: "Concluída", variant: "outline" },
      ativa: { label: "Execução", variant: "default" },
      pausada: { label: "Pausada", variant: "secondary" },
    };

    const config = variants[status] || { label: status, variant: "outline" };
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  }, []);

  // Definir colunas da tabela
  const columns: Column<Obra>[] = [
    {
      key: 'nome',
      title: 'Nome da Obra',
      sortable: true,
      filterable: true,
      filterType: 'text',
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <Building2 className="h-4 w-4 text-primary" />
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-xs text-muted-foreground">
              Cliente: {row.cliente}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { value: 'planejamento', label: 'Planejamento' },
        { value: 'execucao', label: 'Execução' },
        { value: 'ativa', label: 'Ativa' },
        { value: 'concluida', label: 'Concluída' },
        { value: 'pausada', label: 'Pausada' }
      ],
      render: (value) => getStatusBadge(value)
    },
    {
      key: 'endereco',
      title: 'Localização',
      filterable: true,
      filterType: 'text',
      render: (endereco, row) => (
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <div className="text-sm">
            <div>{endereco}, {row.numero}</div>
            <div className="text-xs text-muted-foreground">
              {row.bairro}, {row.cidade}/{row.estado}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'progresso',
      title: 'Progresso',
      sortable: true,
      render: (value) => (
        <div className="w-full">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-semibold">{value}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                value === 100 ? 'bg-blue-500' :
                value >= 75 ? 'bg-green-500' :
                value >= 50 ? 'bg-yellow-500' : 'bg-orange-500'
              }`}
              style={{ width: `${value}%` }}
            />
          </div>
        </div>
      )
    },
    {
      key: 'data_inicio',
      title: 'Data Início',
      sortable: true,
      filterable: true,
      filterType: 'date',
      render: (value) => value ? (
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">
            {format(new Date(value), 'dd/MM/yyyy', { locale: ptBR })}
          </span>
        </div>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
    {
      key: 'orcamento',
      title: 'Orçamento',
      sortable: true,
      render: (value) => value ? (
        <div className="text-sm font-medium">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(value)}
        </div>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    }
  ];

  const handleDeleteConfirm = (obra: Obra) => {
    setDeleteId(obra.id);
  };

  return (
    <div className="responsive-container p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cadastro de Obras</h1>
          <p className="page-description">Gerenciamento completo de obras e projetos</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => { setEditingObra(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Obra
        </Button>
        <ObrasForm open={open} onOpenChange={setOpen} onSubmit={onSubmit} editData={editingObra ? {
          nome: editingObra.nome,
          cliente: editingObra.cliente || "",
          endereco: editingObra.endereco,
          numero: editingObra.numero,
          bairro: editingObra.bairro,
          cidade: editingObra.cidade,
          estado: editingObra.estado,
          cep: editingObra.cep,
          status: editingObra.status,
          dataInicio: editingObra.dataInicio,
          dataPrevisaoFinal: editingObra.dataPrevisao || "",
          orcamento: editingObra.orcamento ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(editingObra.orcamento) : "",
          etapas: editingObra.etapas || [],
          id: editingObra.id
        } : undefined} />
      </div>

      {/* Stats */}
      <div className="grid-responsive-3 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Obras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{obras.length}</div>
            <p className="text-xs text-muted-foreground mt-1">cadastradas no sistema</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Em Execução</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {obras.filter(o => o.status === 'execucao' || o.status === 'ativa').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">em andamento</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {obras.filter(o => o.status === 'concluida').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">finalizadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Progresso Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {useMemo(() =>
                obras.length > 0
                  ? Math.round(obras.reduce((acc, obra) => acc + obra.progresso, 0) / obras.length)
                  : 0
              , [obras])}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">de todas as obras</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Obras com DataTable */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Lista de Obras</CardTitle>
            <CardDescription>Todas as obras cadastradas no sistema</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={obras}
            columns={columns}
            loading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDeleteConfirm}
            searchPlaceholder="Buscar por nome, cliente, endereço..."
            emptyMessage="Nenhuma obra cadastrada ainda."
            showSelection={false}
            showActions={true}
            globalSearch={true}
            hideFilters={false}
          />
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta obra? Esta ação não pode ser desfeita.
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

export default Obras;
