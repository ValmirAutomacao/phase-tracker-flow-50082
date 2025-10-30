import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserCog, Plus, Search, Edit, Users, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SetoresForm, SetorFormData } from "./SetoresForm";
import { STORAGE_KEYS, getFromStorage, addToStorage, updateInStorage, deleteFromStorage } from "@/lib/localStorage";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Setor {
  id: string;
  nome: string;
  descricao: string;
  responsavel: string;
  totalColaboradores: number;
  status: string;
}

const Setores = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [setores, setSetores] = useState<Setor[]>([]);

  useEffect(() => {
    const stored = getFromStorage<Setor>(STORAGE_KEYS.SETORES);
    if (stored.length === 0) {
      const defaultSetores: Setor[] = [
        {
          id: "1",
          nome: "Gestão",
          descricao: "Gerenciamento e coordenação geral de projetos",
          responsavel: "João Silva",
          totalColaboradores: 2,
          status: "ativo"
        },
        {
          id: "2",
          nome: "Engenharia",
          descricao: "Execução técnica e acompanhamento de obras",
          responsavel: "Maria Santos",
          totalColaboradores: 5,
          status: "ativo"
        },
        {
          id: "3",
          nome: "Operacional",
          descricao: "Equipes de campo e execução direta",
          responsavel: "Pedro Costa",
          totalColaboradores: 15,
          status: "ativo"
        },
      ];
      setSetores(defaultSetores);
      localStorage.setItem(STORAGE_KEYS.SETORES, JSON.stringify(defaultSetores));
    } else {
      setSetores(stored);
    }
  }, []);

  const [editingSetor, setEditingSetor] = useState<Setor | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const onSubmit = (data: SetorFormData) => {
    if (editingSetor) {
      const updated = updateInStorage<Setor>(STORAGE_KEYS.SETORES, editingSetor.id, data);
      setSetores(updated);
      toast({
        title: "Setor atualizado!",
        description: `${data.nome} foi atualizado com sucesso.`,
      });
      setEditingSetor(null);
    } else {
      const novoSetor: Setor = {
        id: Date.now().toString(),
        nome: data.nome,
        descricao: data.descricao,
        responsavel: data.responsavel,
        totalColaboradores: 0,
        status: "ativo",
      };

      const updated = addToStorage(STORAGE_KEYS.SETORES, novoSetor);
      setSetores(updated);
      toast({
        title: "Setor cadastrado!",
        description: `${data.nome} foi adicionado com sucesso.`,
      });
    }
    setOpen(false);
  };

  const handleEdit = (setor: Setor) => {
    setEditingSetor(setor);
    setOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      const updated = deleteFromStorage<Setor>(STORAGE_KEYS.SETORES, deleteId);
      setSetores(updated);
      toast({
        title: "Setor excluído!",
        description: "O setor foi removido com sucesso.",
      });
      setDeleteId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      ativo: { label: "Ativo", className: "bg-green-100 text-green-700" },
      inativo: { label: "Inativo", className: "bg-gray-100 text-gray-700" },
    };
    
    return (
      <Badge className={variants[status]?.className || ""}>
        {variants[status]?.label || status}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cadastro de Setores</h1>
          <p className="text-muted-foreground">Gerenciamento de departamentos e áreas</p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-accent" onClick={() => { setEditingSetor(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Setor
        </Button>
        <SetoresForm open={open} onOpenChange={setOpen} onSubmit={onSubmit} editData={editingSetor ? { ...editingSetor } : undefined} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Setores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-muted-foreground mt-1">cadastrados no sistema</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Setores Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">6</div>
            <p className="text-xs text-muted-foreground mt-1">em operação</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Colaboradores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">30</div>
            <p className="text-xs text-muted-foreground mt-1">distribuídos nos setores</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Média por Setor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground mt-1">colaboradores/setor</p>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Setores</CardTitle>
              <CardDescription>Todos os departamentos cadastrados</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar setor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {setores.map((setor) => (
              <Card key={setor.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <UserCog className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-base">{setor.nome}</CardTitle>
                          {getStatusBadge(setor.status)}
                        </div>
                        <CardDescription className="text-sm">
                          {setor.descricao}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Responsável:</span>
                    </div>
                    <span className="font-medium">{setor.responsavel}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Colaboradores:</span>
                    <Badge variant="outline">{setor.totalColaboradores}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(setor)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeleteId(setor.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este setor? Esta ação não pode ser desfeita.
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

export default Setores;
