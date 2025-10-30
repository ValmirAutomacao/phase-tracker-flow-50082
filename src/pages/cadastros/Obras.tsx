import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Search, Edit, MapPin, Calendar, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ObrasForm, ObraFormData } from "./ObrasForm";
import { STORAGE_KEYS, getFromStorage, addToStorage, updateInStorage, deleteFromStorage } from "@/lib/localStorage";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Obra {
  id: string;
  nome: string;
  cliente?: string;
  endereco: string;
  dataInicio: string;
  dataPrevisao?: string;
  status: string;
  progresso: number;
  responsavel: string;
  orcamento?: number;
}

const Obras = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [obras, setObras] = useState<Obra[]>([]);

  useEffect(() => {
    const stored = getFromStorage<Obra>(STORAGE_KEYS.OBRAS);
    if (stored.length === 0) {
      const defaultObras: Obra[] = [
        {
          id: "1",
          nome: "Edifício Alpha",
          cliente: "Construtora XYZ Ltda",
          endereco: "Av. Paulista, 1000 - São Paulo/SP",
          dataInicio: "2024-12-01",
          dataPrevisao: "2025-06-30",
          status: "ativa",
          progresso: 75,
          responsavel: "João Silva"
        },
        {
          id: "2",
          nome: "Residencial Beta",
          cliente: "Imobiliária ABC S.A.",
          endereco: "Rua das Flores, 500 - Rio de Janeiro/RJ",
          dataInicio: "2024-11-15",
          dataPrevisao: "2025-08-15",
          status: "ativa",
          progresso: 45,
          responsavel: "Maria Santos"
        },
        {
          id: "3",
          nome: "Comercial Gamma",
          cliente: "Empresa Delta Corp",
          endereco: "Av. Central, 250 - Belo Horizonte/MG",
          dataInicio: "2024-10-01",
          dataPrevisao: "2025-02-28",
          status: "ativa",
          progresso: 92,
          responsavel: "Pedro Costa"
        },
      ];
      setObras(defaultObras);
      localStorage.setItem(STORAGE_KEYS.OBRAS, JSON.stringify(defaultObras));
    } else {
      setObras(stored);
    }
  }, []);

  const [editingObra, setEditingObra] = useState<Obra | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const onSubmit = (data: ObraFormData) => {
    if (editingObra) {
      const updated = updateInStorage<Obra>(STORAGE_KEYS.OBRAS, editingObra.id, {
        nome: data.nome,
        cliente: data.cliente,
        endereco: data.endereco,
        responsavel: data.responsavel,
        status: data.status,
        dataInicio: data.dataInicio,
        dataPrevisao: data.dataPrevisaoFinal,
        orcamento: parseFloat(data.orcamento),
      });
      setObras(updated);
      toast({
        title: "Obra atualizada!",
        description: `${data.nome} foi atualizada com sucesso.`,
      });
      setEditingObra(null);
    } else {
      const novaObra: Obra = {
        id: Date.now().toString(),
        nome: data.nome,
        cliente: data.cliente,
        endereco: data.endereco,
        responsavel: data.responsavel,
        status: data.status,
        dataInicio: data.dataInicio,
        dataPrevisao: data.dataPrevisaoFinal,
        orcamento: parseFloat(data.orcamento),
        progresso: 0,
      };

      const updated = addToStorage(STORAGE_KEYS.OBRAS, novaObra);
      setObras(updated);
      toast({
        title: "Obra cadastrada!",
        description: `${data.nome} foi adicionada com sucesso com ${data.etapas.length} etapa(s).`,
      });
    }
    setOpen(false);
  };

  const handleEdit = (obra: Obra) => {
    setEditingObra(obra);
    setOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      const updated = deleteFromStorage<Obra>(STORAGE_KEYS.OBRAS, deleteId);
      setObras(updated);
      toast({
        title: "Obra excluída!",
        description: "A obra foi removida com sucesso.",
      });
      setDeleteId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      ativa: { label: "Ativa", className: "bg-green-100 text-green-700" },
      concluida: { label: "Concluída", className: "bg-blue-100 text-blue-700" },
      pausada: { label: "Pausada", className: "bg-yellow-100 text-yellow-700" },
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
          <h1 className="text-3xl font-bold">Cadastro de Obras</h1>
          <p className="text-muted-foreground">Gerenciamento completo de obras e projetos</p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-accent" onClick={() => { setEditingObra(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Obra
        </Button>
        <ObrasForm open={open} onOpenChange={setOpen} onSubmit={onSubmit} editData={editingObra ? { 
          nome: editingObra.nome,
          cliente: editingObra.cliente || "",
          endereco: editingObra.endereco,
          responsavel: editingObra.responsavel,
          status: editingObra.status,
          dataInicio: editingObra.dataInicio,
          dataPrevisaoFinal: editingObra.dataPrevisao || "",
          orcamento: editingObra.orcamento?.toString() || "",
          etapas: [],
          id: editingObra.id
        } : undefined} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Obras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground mt-1">cadastradas no sistema</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Obras Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">3</div>
            <p className="text-xs text-muted-foreground mt-1">em andamento</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">1</div>
            <p className="text-xs text-muted-foreground mt-1">este ano</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Progresso Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground mt-1">de todas as obras ativas</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Obras</CardTitle>
              <CardDescription>Todas as obras cadastradas</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar obra..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {obras.map((obra) => (
              <div 
                key={obra.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-lg">{obra.nome}</h4>
                        {getStatusBadge(obra.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Cliente: {obra.cliente}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {obra.endereco}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(obra.dataInicio).toLocaleDateString('pt-BR')} - {new Date(obra.dataPrevisao).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(obra)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeleteId(obra.id)}>
                      <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                      Excluir
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progresso Geral</span>
                    <span className="font-semibold">{obra.progresso}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        obra.progresso === 100 ? 'bg-blue-500' :
                        obra.progresso >= 75 ? 'bg-green-500' :
                        obra.progresso >= 50 ? 'bg-yellow-500' : 'bg-orange-500'
                      }`}
                      style={{ width: `${obra.progresso}%` }}
                    />
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
