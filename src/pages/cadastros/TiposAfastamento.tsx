// 🤖 CLAUDE-NOTE: Cadastro de tipos de afastamentos (férias, atestados, licenças)
// 📅 Criado em: 2024-11-28
// 🎯 Propósito: CRUD completo de tipos de afastamentos com validações de negócio
// 🔗 Usado por: Sistema de afastamentos e cálculo de ponto

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Edit, Trash2, Clock, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOptimizedSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { useSupabaseCRUD } from "@/hooks/useSupabaseMutation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DataTable, Column } from "@/components/ui/DataTable";
import { TiposAfastamentoForm, TipoAfastamentoFormData } from "./TiposAfastamentoForm";
import { PermissionGuard } from "@/components/auth/PermissionGuard";

interface TipoAfastamentoLocal {
  id: string;
  nome: string;
  descricao?: string;
  categoria: 'ferias' | 'licenca_medica' | 'licenca_maternidade' | 'licenca_paternidade' | 'atestado' | 'falta_justificada' | 'outros';
  cor: string;
  dias_max_permitidos?: number;
  remunerado: boolean;
  obriga_documentacao: boolean;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

const CATEGORIA_LABELS = {
  ferias: 'Férias',
  licenca_medica: 'Licença Médica',
  licenca_maternidade: 'Licença Maternidade',
  licenca_paternidade: 'Licença Paternidade',
  atestado: 'Atestado Médico',
  falta_justificada: 'Falta Justificada',
  outros: 'Outros'
};

const CATEGORIA_COLORS = {
  ferias: 'bg-green-100 text-green-800',
  licenca_medica: 'bg-blue-100 text-blue-800',
  licenca_maternidade: 'bg-pink-100 text-pink-800',
  licenca_paternidade: 'bg-purple-100 text-purple-800',
  atestado: 'bg-orange-100 text-orange-800',
  falta_justificada: 'bg-yellow-100 text-yellow-800',
  outros: 'bg-gray-100 text-gray-800'
};

// Cores padrão fixas para cada categoria de afastamento
const CORES_PADRAO_AFASTAMENTO = {
  ferias: '#22C55E',        // Verde
  licenca_medica: '#3B82F6',     // Azul
  licenca_maternidade: '#EC4899', // Rosa
  licenca_paternidade: '#A855F7', // Roxo
  atestado: '#F59E0B',           // Laranja
  falta_justificada: '#EAB308',   // Amarelo
  outros: '#6B7280'              // Cinza
};

export default function TiposAfastamento() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoAfastamentoLocal | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // 🤖 CLAUDE-NOTE: Hooks Supabase - sem localStorage conforme diretrizes
  const { data: tipos = [], isLoading, error } = useOptimizedSupabaseQuery<TipoAfastamentoLocal>('TIPOS_AFASTAMENTO_PONTO');
  const { add, update, delete: deleteTipo } = useSupabaseCRUD<TipoAfastamentoLocal>('TIPOS_AFASTAMENTO_PONTO');

  const columns: Column<TipoAfastamentoLocal>[] = [
    {
      key: 'nome',
      title: 'Nome',
      sortable: true,
      filterable: true,
      filterType: 'text'
    },
    {
      key: 'categoria',
      title: 'Categoria',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: Object.entries(CATEGORIA_LABELS).map(([value, label]) => ({ value, label })),
      render: (value: string) => (
        <Badge className={CATEGORIA_COLORS[value as keyof typeof CATEGORIA_COLORS]}>
          {CATEGORIA_LABELS[value as keyof typeof CATEGORIA_LABELS]}
        </Badge>
      )
    },
    {
      key: 'cor',
      title: 'Cor',
      sortable: false,
      filterable: false,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded border border-gray-300"
            style={{ backgroundColor: value }}
          />
          <span className="text-xs font-mono text-gray-600">{value}</span>
        </div>
      )
    },
    {
      key: 'dias_max_permitidos',
      title: 'Dias Máx.',
      sortable: true,
      filterable: true,
      filterType: 'number',
      render: (value: number | null) => (
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4 text-gray-500" />
          <span>{value ? `${value} dias` : 'Ilimitado'}</span>
        </div>
      )
    },
    {
      key: 'remunerado',
      title: 'Remuneração',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { value: 'true', label: 'Remunerado' },
        { value: 'false', label: 'Não Remunerado' }
      ],
      render: (value: boolean) => (
        <div className="flex items-center gap-2">
          <DollarSign className={`h-4 w-4 ${value ? 'text-green-600' : 'text-red-600'}`} />
          <Badge variant={value ? 'default' : 'destructive'}>
            {value ? 'Remunerado' : 'Não Remunerado'}
          </Badge>
        </div>
      )
    },
    {
      key: 'obriga_documentacao',
      title: 'Documentação',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { value: 'true', label: 'Obrigatória' },
        { value: 'false', label: 'Opcional' }
      ],
      render: (value: boolean) => (
        <Badge variant={value ? 'destructive' : 'secondary'}>
          {value ? 'Obrigatória' : 'Opcional'}
        </Badge>
      )
    },
    {
      key: 'ativo',
      title: 'Status',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { value: 'true', label: 'Ativo' },
        { value: 'false', label: 'Inativo' }
      ],
      render: (value: boolean) => (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Ativo' : 'Inativo'}
        </Badge>
      )
    },
    {
      key: 'actions',
      title: 'Ações',
      width: '120px',
      render: (_, tipo: TipoAfastamento) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(tipo)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteId(tipo.id)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  const onSubmit = (data: TipoAfastamentoFormData) => {
    if (editingTipo) {
      update.mutate(
        { id: editingTipo.id, updates: data },
        {
          onSuccess: () => {
            toast({
              title: "Tipo atualizado!",
              description: `${data.nome} foi atualizado com sucesso.`,
            });
            setOpen(false);
            setEditingTipo(null);
          },
          onError: (error) => {
            toast({
              title: "Erro ao atualizar",
              description: error.message || "Ocorreu um erro ao atualizar o tipo.",
              variant: "destructive",
            });
          }
        }
      );
    } else {
      add.mutate(data, {
        onSuccess: () => {
          toast({
            title: "Tipo cadastrado!",
            description: `${data.nome} foi adicionado com sucesso.`,
          });
          setOpen(false);
        },
        onError: (error) => {
          toast({
            title: "Erro ao cadastrar",
            description: error.message || "Ocorreu um erro ao cadastrar o tipo.",
            variant: "destructive",
          });
        }
      });
    }
  };

  const handleEdit = (tipo: TipoAfastamentoLocal) => {
    setEditingTipo(tipo);
    setOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteTipo.mutate(deleteId, {
        onSuccess: () => {
          toast({
            title: "Tipo excluído!",
            description: "O tipo foi excluído com sucesso.",
          });
          setDeleteId(null);
        },
        onError: (error) => {
          toast({
            title: "Erro ao excluir",
            description: error.message || "Não foi possível excluir o tipo. Verifique se não há afastamentos utilizando este tipo.",
            variant: "destructive",
          });
          setDeleteId(null);
        }
      });
    }
  };

  const handleNew = () => {
    setEditingTipo(null);
    setOpen(true);
  };

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>Erro ao carregar tipos de afastamento: {error.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Tipos de Afastamento
            </CardTitle>
            <PermissionGuard permissions={['criar_tipos_afastamento']}>
              <Button onClick={handleNew} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Novo Tipo
              </Button>
            </PermissionGuard>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={tipos}
            columns={columns}
            searchPlaceholder="Buscar tipos de afastamento..."
            loading={isLoading}
            emptyMessage="Nenhum tipo de afastamento encontrado"
          />
        </CardContent>
      </Card>

      {/* Modal do Formulário */}
      <TiposAfastamentoForm
        open={open}
        onOpenChange={setOpen}
        onSubmit={onSubmit}
        initialData={editingTipo}
        isLoading={add.isPending || update.isPending}
      />

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este tipo de afastamento? Esta ação não pode ser desfeita
              e pode afetar afastamentos existentes que utilizam este tipo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}