import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Building2, Plus, Mail, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ClientesForm, ClienteFormData } from "./ClientesForm";
import { useOptimizedSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { useSupabaseCRUD } from "@/hooks/useSupabaseMutation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DataTable, Column } from "@/components/ui/DataTable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Cliente {
  id: string;
  nome: string;
  tipo: "fisico" | "juridico";
  documento: string;
  endereco?: {
    logradouro?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
  };
  contato?: {
    email?: string;
    telefone?: string;
  };
  dataCadastro?: string;
  created_at?: string;
  updated_at?: string;
}

const Clientes = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Hooks Supabase para substituir localStorage
  const { data: clientes = [], isLoading, error } = useOptimizedSupabaseQuery<any>('CLIENTES');
  const { add, update, delete: deleteCliente } = useSupabaseCRUD<any>('CLIENTES');

  const onSubmit = (data: ClienteFormData) => {
    if (editingCliente) {
      update.mutate(
        { id: editingCliente.id, updates: data },
        {
          onSuccess: () => {
            toast({
              title: "Cliente atualizado!",
              description: `${data.nome} foi atualizado com sucesso.`,
            });
            setOpen(false);
            setEditingCliente(null);
          },
          onError: (error) => {
            toast({
              title: "Erro ao atualizar",
              description: error.message || "Ocorreu um erro ao atualizar o cliente.",
              variant: "destructive",
            });
          }
        }
      );
    } else {
      const novoCliente = {
        ...data,
        dataCadastro: new Date().toISOString().split('T')[0],
      };
      add.mutate(novoCliente, {
        onSuccess: () => {
          toast({
            title: "Cliente cadastrado!",
            description: `${data.nome} foi adicionado com sucesso.`,
          });
          setOpen(false);
          setEditingCliente(null);
        },
        onError: (error) => {
          toast({
            title: "Erro ao cadastrar",
            description: error.message || "Ocorreu um erro ao cadastrar o cliente.",
            variant: "destructive",
          });
        }
      });
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteCliente.mutate(deleteId, {
        onSuccess: () => {
          toast({
            title: "Cliente excluído!",
            description: "O cliente foi removido com sucesso.",
          });
          setDeleteId(null);
        },
        onError: (error) => {
          toast({
            title: "Erro ao excluir",
            description: error.message || "Ocorreu um erro ao excluir o cliente.",
            variant: "destructive",
          });
        }
      });
    }
  };

  const getTipoBadge = (tipo: "fisico" | "juridico") => {
    return tipo === "fisico" ? (
      <Badge variant="outline" className="gap-1">
        <User className="h-3 w-3" />
        Pessoa Física
      </Badge>
    ) : (
      <Badge variant="outline" className="gap-1">
        <Building2 className="h-3 w-3" />
        Pessoa Jurídica
      </Badge>
    );
  };

  // Definir colunas da tabela
  const columns: Column<Cliente>[] = [
    {
      key: 'nome',
      title: 'Nome',
      sortable: true,
      filterable: true,
      filterType: 'text',
      render: (value, row) => (
        <div className="flex items-center gap-3">
          {row.tipo === "fisico" ?
            <User className="h-4 w-4 text-blue-600" /> :
            <Building2 className="h-4 w-4 text-green-600" />
          }
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              {getTipoBadge(row.tipo)}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'documento',
      title: 'CPF/CNPJ',
      sortable: true,
      filterable: true,
      filterType: 'text',
      render: (value, row) => (
        <div>
          <div className="font-mono">{value}</div>
          <div className="text-xs text-muted-foreground">
            {row.tipo === "fisico" ? "CPF" : "CNPJ"}
          </div>
        </div>
      )
    },
    {
      key: 'contato.email',
      title: 'E-mail',
      filterable: true,
      filterType: 'text',
      render: (value) => value ? (
        <div className="flex items-center gap-1">
          <Mail className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{value}</span>
        </div>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
    {
      key: 'contato.telefone',
      title: 'Telefone',
      filterable: true,
      filterType: 'text',
      render: (value) => value ? (
        <div className="flex items-center gap-1">
          <Phone className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{value}</span>
        </div>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
    {
      key: 'endereco',
      title: 'Cidade/UF',
      filterable: true,
      filterType: 'text',
      render: (endereco) => endereco ? (
        <div className="text-sm">
          <div>{endereco.cidade}</div>
          <div className="text-xs text-muted-foreground">{endereco.estado}</div>
        </div>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
    {
      key: 'created_at',
      title: 'Data Cadastro',
      sortable: true,
      filterable: true,
      filterType: 'date',
      render: (value) => value ? (
        <div className="text-sm">
          {format(new Date(value), 'dd/MM/yyyy', { locale: ptBR })}
        </div>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    }
  ];

  // Função de controle da tabela
  const handleDeleteConfirm = (cliente: Cliente) => {
    setDeleteId(cliente.id);
  };

  return (
    <div className="responsive-container p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cadastro de Clientes</h1>
          <p className="page-description">Gerenciamento de clientes do sistema</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => { setEditingCliente(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
        <ClientesForm 
          open={open} 
          onOpenChange={setOpen} 
          onSubmit={onSubmit} 
          editData={editingCliente ? {
            id: editingCliente.id,
            nome: editingCliente.nome,
            tipo: editingCliente.tipo === 'fisico' ? 'fisica' : editingCliente.tipo === 'juridico' ? 'juridica' : editingCliente.tipo,
            documento: editingCliente.documento,
            email: editingCliente.contato?.email || '',
            telefone: editingCliente.contato?.telefone || '',
            endereco: editingCliente.endereco?.logradouro || '',
            numero: editingCliente.endereco?.numero || '',
            bairro: editingCliente.endereco?.bairro || '',
            cidade: editingCliente.endereco?.cidade || '',
            estado: editingCliente.endereco?.estado || '',
            cep: editingCliente.endereco?.cep || '',
          } : undefined} 
        />
      </div>

      {/* Stats */}
      <div className="grid-responsive-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientes.length}</div>
            <p className="text-xs text-muted-foreground mt-1">cadastrados no sistema</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pessoa Física</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientes.filter(c => c.tipo === "fisico").length}</div>
            <p className="text-xs text-muted-foreground mt-1">clientes CPF</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pessoa Jurídica</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientes.filter(c => c.tipo === "juridico").length}</div>
            <p className="text-xs text-muted-foreground mt-1">clientes CNPJ</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Clientes com DataTable */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Lista de Clientes</CardTitle>
            <CardDescription>Todos os clientes cadastrados no sistema</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={clientes}
            columns={columns}
            loading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDeleteConfirm}
            searchPlaceholder="Buscar por nome, documento, email..."
            emptyMessage="Nenhum cliente cadastrado ainda."
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
              Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
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

export default Clientes;
