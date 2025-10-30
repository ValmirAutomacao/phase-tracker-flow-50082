import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { User, Users, Building2, Plus, Search, Edit, Mail, Phone, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ClientesForm, ClienteFormData } from "./ClientesForm";
import { STORAGE_KEYS, getFromStorage, addToStorage, updateInStorage, deleteFromStorage } from "@/lib/localStorage";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Cliente {
  id: string;
  nome: string;
  tipo: "fisica" | "juridica";
  documento: string;
  email: string;
  telefone: string;
  endereco: string;
  dataCadastro?: string;
}

const Clientes = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const stored = getFromStorage<Cliente>(STORAGE_KEYS.CLIENTES);
    if (stored.length === 0) {
      const defaultClientes: Cliente[] = [
        {
          id: "1",
          nome: "João Silva",
          tipo: "fisica",
          documento: "123.456.789-00",
          email: "joao@email.com",
          telefone: "(11) 98765-4321",
          endereco: "Rua A, 123",
          dataCadastro: "2025-01-01"
        },
        {
          id: "2",
          nome: "Construtora ABC Ltda",
          tipo: "juridica",
          documento: "12.345.678/0001-00",
          email: "contato@abc.com.br",
          telefone: "(11) 3456-7890",
          endereco: "Av. B, 456",
          dataCadastro: "2025-01-02"
        }
      ];
      setClientes(defaultClientes);
      localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(defaultClientes));
    } else {
      setClientes(stored);
    }
  }, []);

  const onSubmit = (data: ClienteFormData) => {
    if (editingCliente) {
      const updated = updateInStorage<Cliente>(STORAGE_KEYS.CLIENTES, editingCliente.id, data);
      setClientes(updated);
      toast({
        title: "Cliente atualizado!",
        description: `${data.nome} foi atualizado com sucesso.`,
      });
    } else {
      const novoCliente: Cliente = {
        id: Date.now().toString(),
        ...data,
        dataCadastro: new Date().toISOString().split('T')[0],
      };
      const updated = addToStorage(STORAGE_KEYS.CLIENTES, novoCliente);
      setClientes(updated);
      toast({
        title: "Cliente cadastrado!",
        description: `${data.nome} foi adicionado com sucesso.`,
      });
    }
    setOpen(false);
    setEditingCliente(null);
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      const updated = deleteFromStorage<Cliente>(STORAGE_KEYS.CLIENTES, deleteId);
      setClientes(updated);
      toast({
        title: "Cliente excluído!",
        description: "O cliente foi removido com sucesso.",
      });
      setDeleteId(null);
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cadastro de Clientes</h1>
          <p className="text-muted-foreground">Gerenciamento de clientes do sistema</p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-accent" onClick={() => { setEditingCliente(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
        <ClientesForm open={open} onOpenChange={setOpen} onSubmit={onSubmit} editData={editingCliente ? { ...editingCliente } : undefined} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Clientes</CardTitle>
              <CardDescription>Todos os clientes cadastrados</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredClientes.map((cliente) => (
              <div 
                key={cliente.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      {cliente.tipo === "fisica" ? <User className="h-6 w-6 text-primary" /> : <Building2 className="h-6 w-6 text-primary" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{cliente.nome}</h4>
                        {getTipoBadge(cliente.tipo)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {cliente.tipo === "fisica" ? "CPF" : "CNPJ"}: {cliente.documento}
                      </p>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {cliente.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {cliente.telefone}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Endereço: {cliente.endereco}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(cliente)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeleteId(cliente.id)}>
                      <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </div>
            ))}
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
