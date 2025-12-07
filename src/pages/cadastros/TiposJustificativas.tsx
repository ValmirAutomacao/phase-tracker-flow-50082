// 🤖 CLAUDE-NOTE: Cadastro de tipos de justificativas para ajustes de ponto
// 📅 Criado em: 2024-11-28
// 🎯 Propósito: CRUD completo de tipos de justificativas com DataTable
// 🔗 Usado por: Sistema de ajustes manuais de ponto

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Plus, Edit, Trash2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOptimizedSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { useSupabaseCRUD } from "@/hooks/useSupabaseMutation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DataTable, Column } from "@/components/ui/DataTable";
import { TiposJustificativasForm, TipoJustificativaFormData } from "./TiposJustificativasForm";
import { PermissionGuard } from "@/components/auth/PermissionGuard";

interface TipoJustificativa {
  id: string;
  nome: string;
  descricao?: string;
  categoria: 'erro_sistema' | 'problema_localizacao' | 'esquecimento' | 'outros';
  cor: string;
  ativo: boolean;
  obriga_documentacao: boolean;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

const CATEGORIA_LABELS = {
  erro_sistema: 'Erro de Sistema',
  problema_localizacao: 'Problema de Localização',
  esquecimento: 'Esquecimento',
  outros: 'Outros'
};

const CATEGORIA_COLORS = {
  erro_sistema: 'bg-red-100 text-red-800',
  problema_localizacao: 'bg-blue-100 text-blue-800',
  esquecimento: 'bg-yellow-100 text-yellow-800',
  outros: 'bg-gray-100 text-gray-800'
};

export default function TiposJustificativas() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoJustificativa | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // 🤖 CLAUDE-NOTE: Hooks Supabase - substituindo localStorage conforme CLAUDE.md
  const { data: tipos = [], isLoading, error } = useOptimizedSupabaseQuery<TipoJustificativa>('TIPOS_JUSTIFICATIVAS_PONTO');
  const { add, update, delete: deleteTipo } = useSupabaseCRUD<TipoJustificativa>('TIPOS_JUSTIFICATIVAS_PONTO');

  const columns: Column<TipoJustificativa>[] = [
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
      render: (_, tipo: TipoJustificativa) => (
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

  const onSubmit = (data: TipoJustificativaFormData) => {
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

  const handleEdit = (tipo: TipoJustificativa) => {
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
            description: error.message || "Não foi possível excluir o tipo.",
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
              <p>Erro ao carregar tipos de justificativas: {error.message}</p>
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
              <Settings className="h-5 w-5" />
              Tipos de Justificativas
            </CardTitle>
            <PermissionGuard permissions={['criar_tipos_justificativas']}>
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
            searchPlaceholder="Buscar tipos de justificativas..."
            loading={isLoading}
            emptyMessage="Nenhum tipo de justificativa encontrado"
          />
        </CardContent>
      </Card>

      {/* Modal do Formulário */}
      <TiposJustificativasForm
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
              Tem certeza que deseja excluir este tipo de justificativa? Esta ação não pode ser desfeita.
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