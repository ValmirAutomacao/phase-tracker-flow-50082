import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Plus, Search, Edit, Shield, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FuncoesForm, FuncaoFormData } from "./FuncoesForm";
import { STORAGE_KEYS, getFromStorage, addToStorage, updateInStorage, deleteFromStorage } from "@/lib/localStorage";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Funcao {
  id: string;
  nome: string;
  descricao: string;
  nivel?: string;
  permissoes: string[];
  totalColaboradores: number;
}

const Funcoes = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [funcoes, setFuncoes] = useState<Funcao[]>([]);
  const [editingFuncao, setEditingFuncao] = useState<Funcao | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const stored = getFromStorage<Funcao>(STORAGE_KEYS.FUNCOES);
    if (stored.length === 0) {
      const defaultFuncoes: Funcao[] = [
        {
          id: "1",
          nome: "Gerente de Obras",
          descricao: "Responsável pela gestão completa de projetos e equipes",
          nivel: "Gestão",
          permissoes: ["Aprovar despesas", "Criar projetos", "Gerenciar equipe"],
          totalColaboradores: 2
        },
        {
          id: "2",
          nome: "Engenheiro Civil",
          descricao: "Responsável técnico pela execução da obra",
          nivel: "Técnico",
          permissoes: ["Validar etapas", "Aprovar materiais"],
          totalColaboradores: 3
        },
      ];
      setFuncoes(defaultFuncoes);
      localStorage.setItem(STORAGE_KEYS.FUNCOES, JSON.stringify(defaultFuncoes));
    } else {
      setFuncoes(stored);
    }
  }, []);

  const onSubmit = (data: FuncaoFormData) => {
    if (editingFuncao) {
      const updated = updateInStorage<Funcao>(STORAGE_KEYS.FUNCOES, editingFuncao.id, data);
      setFuncoes(updated as Funcao[]);
      toast({
        title: "Função atualizada!",
        description: `${data.nome} foi atualizada com sucesso.`,
      });
    } else {
      const novaFuncao: Funcao = {
        id: Date.now().toString(),
        nome: data.nome,
        descricao: data.descricao,
        permissoes: data.permissoes,
        totalColaboradores: 0,
      };
      const updated = addToStorage(STORAGE_KEYS.FUNCOES, novaFuncao);
      setFuncoes(updated);
      toast({
        title: "Função cadastrada!",
        description: `${data.nome} foi adicionada com sucesso.`,
      });
    }
    setOpen(false);
    setEditingFuncao(null);
  };

  const handleEdit = (funcao: Funcao) => {
    setEditingFuncao(funcao);
    setOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      const updated = deleteFromStorage<Funcao>(STORAGE_KEYS.FUNCOES, deleteId);
      setFuncoes(updated as Funcao[]);
      toast({
        title: "Função excluída!",
        description: "A função foi removida com sucesso.",
      });
      setDeleteId(null);
    }
  };

  const getNivelBadge = (nivel: string) => {
    const variants: Record<string, { className: string }> = {
      "Gestão": { className: "bg-purple-100 text-purple-700" },
      "Técnico": { className: "bg-blue-100 text-blue-700" },
      "Operacional": { className: "bg-green-100 text-green-700" },
    };
    
    return (
      <Badge className={variants[nivel]?.className || ""}>
        {nivel}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cadastro de Funções</h1>
          <p className="text-muted-foreground">Gerenciamento de cargos e permissões</p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-accent" onClick={() => { setEditingFuncao(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Função
        </Button>
        <FuncoesForm open={open} onOpenChange={setOpen} onSubmit={onSubmit} editData={editingFuncao ? { ...editingFuncao } : undefined} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Funções</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground mt-1">cadastradas no sistema</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Níveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground mt-1">níveis hierárquicos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Colaboradores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground mt-1">distribuídos nas funções</p>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Funções</CardTitle>
              <CardDescription>Todas as funções e suas permissões</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar função..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {funcoes.map((funcao) => (
              <div 
                key={funcao.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Briefcase className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{funcao.nome}</h4>
                        {funcao.nivel && getNivelBadge(funcao.nivel)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {funcao.descricao}
                      </p>
                      <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                        <Shield className="h-4 w-4" />
                        <span className="font-medium">Permissões:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(funcao.permissoes || []).map((permissao, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {permissao}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {funcao.totalColaboradores} colaborador(es) nesta função
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Funcoes;
