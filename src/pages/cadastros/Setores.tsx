import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserCog, Plus, Search, Edit, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SetoresForm, SetorFormData } from "./SetoresForm";
import { STORAGE_KEYS, getFromStorage, addToStorage } from "@/lib/localStorage";

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

  const onSubmit = (data: SetorFormData) => {
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
    setOpen(false);
    toast({
      title: "Setor cadastrado!",
      description: `${data.nome} foi adicionado com sucesso.`,
    });
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
        <Button className="bg-gradient-to-r from-primary to-accent" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Setor
        </Button>
        <SetoresForm open={open} onOpenChange={setOpen} onSubmit={onSubmit} />
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
                  <Button variant="outline" size="sm" className="w-full">
                    <Edit className="h-4 w-4 mr-1" />
                    Editar Setor
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Setores;
