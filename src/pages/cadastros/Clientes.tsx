import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Users, Building2, Plus, Search, Edit, Mail, Phone, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ClientesForm, ClienteFormData } from "./ClientesForm";
import { useOptimizedSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { useSupabaseCRUD } from "@/hooks/useSupabaseMutation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Cliente {
  id: string;
  nome: string;
  tipo: "fisica" | "juridica";
  documento: string;
  email: string;
  telefone: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  dataCadastro?: string;
  created_at?: string;
  updated_at?: string;
}

const Clientes = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
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

  const getTipoBadge = (tipo: "fisica" | "juridica") => {
    return tipo === "fisica" ? (
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

  const filteredClientes = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.documento.includes(searchTerm)
  );

  return (
    <div className="responsive-container p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Cadastro de Clientes</h1>
          <p className="text-muted-foreground">Gerenciamento de clientes do sistema</p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-accent w-full sm:w-auto" onClick={() => { setEditingCliente(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
        <ClientesForm open={open} onOpenChange={setOpen} onSubmit={onSubmit} editData={editingCliente ? { ...editingCliente } : undefined} />
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
            <div className="text-2xl font-bold">{clientes.filter(c => c.tipo === "fisica").length}</div>
            <p className="text-xs text-muted-foreground mt-1">clientes CPF</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pessoa Jurídica</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientes.filter(c => c.tipo === "juridica").length}</div>
            <p className="text-xs text-muted-foreground mt-1">clientes CNPJ</p>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Lista de Clientes</CardTitle>
              <CardDescription>Todos os clientes cadastrados</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full"
              />
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
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-6 w-32" />
                          <Skeleton className="h-5 w-20" />
                        </div>
                        <Skeleton className="h-4 w-48" />
                        <div className="flex gap-4">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-4 w-64" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                </div>
              ))
            ) : error ? (
              // Error state
              <div className="text-center py-8">
                <p className="text-muted-foreground">Erro ao carregar clientes: {error.message}</p>
                <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
                  Tentar novamente
                </Button>
              </div>
            ) : filteredClientes.length === 0 ? (
              // Empty state
              <div className="text-center py-8">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? "Nenhum cliente encontrado para a pesquisa." : "Nenhum cliente cadastrado ainda."}
                </p>
                {!searchTerm && (
                  <Button
                    className="mt-4"
                    onClick={() => { setEditingCliente(null); setOpen(true); }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar primeiro cliente
                  </Button>
                )}
              </div>
            ) : (
              filteredClientes.map((cliente) => (
              <div
                key={cliente.id}
                className="list-item-responsive p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {cliente.tipo === "fisica" ? <User className="h-6 w-6 text-primary" /> : <Building2 className="h-6 w-6 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                        <h4 className="font-semibold text-truncate-responsive">{cliente.nome}</h4>
                        {getTipoBadge(cliente.tipo)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {cliente.tipo === "fisica" ? "CPF" : "CNPJ"}: {cliente.documento}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:gap-4 gap-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="text-truncate-responsive">{cliente.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          {cliente.telefone}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 text-truncate-responsive">
                        Endereço: {cliente.endereco}, {cliente.numero} - {cliente.bairro}, {cliente.cidade}/{cliente.estado} - {cliente.cep}
                      </p>
                    </div>
                  </div>
                  <div className="mobile-action-buttons sm:flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(cliente)}>
                      <Edit className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Editar</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeleteId(cliente.id)}>
                      <Trash2 className="h-4 w-4 sm:mr-1 text-destructive" />
                      <span className="hidden sm:inline">Excluir</span>
                    </Button>
                  </div>
                </div>
              </div>
            )))}
          </div>
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
