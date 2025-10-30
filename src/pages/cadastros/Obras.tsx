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

interface Etapa {
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
  nome: string;
  cliente?: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  dataInicio: string;
  dataPrevisao?: string;
  status: string;
  progresso: number;
  responsavel: string;
  orcamento?: number;
  etapas?: Etapa[];
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
          endereco: "Avenida Paulista",
          numero: "1000",
          bairro: "Bela Vista",
          cidade: "São Paulo",
          estado: "SP",
          cep: "01310-000",
          dataInicio: "2024-12-01",
          dataPrevisao: "2025-06-30",
          status: "ativa",
          progresso: 75,
          responsavel: "João Silva",
          etapas: [
            {
              id: "etapa-1",
              nome: "Fundação",
              responsavel: "João Silva",
              dataInicio: "2024-12-01",
              dataPrevisao: "2024-12-15",
              progresso: 100,
              status: "completed"
            },
            {
              id: "etapa-2",
              nome: "Estrutura",
              responsavel: "Maria Santos",
              dataInicio: "2024-12-16",
              dataPrevisao: "2025-01-30",
              progresso: 60,
              status: "em-andamento"
            }
          ]
        },
        {
          id: "2",
          nome: "Residencial Beta",
          cliente: "Imobiliária ABC S.A.",
          endereco: "Rua das Flores",
          numero: "500",
          bairro: "Copacabana",
          cidade: "Rio de Janeiro",
          estado: "RJ",
          cep: "22070-000",
          dataInicio: "2024-11-15",
          dataPrevisao: "2025-08-15",
          status: "ativa",
          progresso: 45,
          responsavel: "Maria Santos",
          etapas: [
            {
              id: "etapa-3",
              nome: "Terraplanagem",
              responsavel: "Pedro Costa",
              dataInicio: "2024-11-15",
              dataPrevisao: "2024-12-01",
              progresso: 100,
              status: "completed"
            },
            {
              id: "etapa-4",
              nome: "Fundação",
              responsavel: "Maria Santos",
              dataInicio: "2024-12-02",
              dataPrevisao: "2025-01-15",
              progresso: 30,
              status: "em-andamento"
            }
          ]
        },
        {
          id: "3",
          nome: "Comercial Gamma",
          cliente: "Empresa Delta Corp",
          endereco: "Avenida Central",
          numero: "250",
          bairro: "Centro",
          cidade: "Belo Horizonte",
          estado: "MG",
          cep: "30112-000",
          dataInicio: "2024-10-01",
          dataPrevisao: "2025-02-28",
          status: "ativa",
          progresso: 92,
          responsavel: "Pedro Costa",
          etapas: [
            {
              id: "etapa-5",
              nome: "Estrutura",
              responsavel: "Pedro Costa",
              dataInicio: "2024-10-01",
              dataPrevisao: "2024-11-15",
              progresso: 100,
              status: "completed"
            },
            {
              id: "etapa-6",
              nome: "Alvenaria",
              responsavel: "Ana Lima",
              dataInicio: "2024-11-16",
              dataPrevisao: "2024-12-30",
              progresso: 100,
              status: "completed"
            },
            {
              id: "etapa-7",
              nome: "Acabamento",
              responsavel: "Pedro Costa",
              dataInicio: "2025-01-01",
              dataPrevisao: "2025-02-28",
              progresso: 85,
              status: "em-andamento"
            }
          ]
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
        numero: data.numero,
        bairro: data.bairro,
        cidade: data.cidade,
        estado: data.estado,
        cep: data.cep,
        responsavel: data.responsavel,
        status: data.status,
        dataInicio: data.dataInicio,
        dataPrevisao: data.dataPrevisaoFinal,
        orcamento: data.orcamento ? parseFloat(data.orcamento.replace(/\D/g, '')) / 100 : 0,
        etapas: data.etapas,
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
        numero: data.numero,
        bairro: data.bairro,
        cidade: data.cidade,
        estado: data.estado,
        cep: data.cep,
        responsavel: data.responsavel,
        status: data.status,
        dataInicio: data.dataInicio,
        dataPrevisao: data.dataPrevisaoFinal,
        orcamento: data.orcamento ? parseFloat(data.orcamento.replace(/\D/g, '')) / 100 : 0,
        progresso: 0,
        etapas: data.etapas,
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
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Cadastro de Obras</h1>
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
          numero: editingObra.numero,
          bairro: editingObra.bairro,
          cidade: editingObra.cidade,
          estado: editingObra.estado,
          cep: editingObra.cep,
          responsavel: editingObra.responsavel,
          status: editingObra.status,
          dataInicio: editingObra.dataInicio,
          dataPrevisaoFinal: editingObra.dataPrevisao || "",
          orcamento: editingObra.orcamento ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(editingObra.orcamento) : "",
          etapas: editingObra.etapas || [],
          id: editingObra.id
        } : undefined} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Lista de Obras</CardTitle>
              <CardDescription>Todas as obras cadastradas</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar obra..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full"
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
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                        <h4 className="font-semibold text-lg truncate">{obra.nome}</h4>
                        {getStatusBadge(obra.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Cliente: {obra.cliente}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1 min-w-0">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{obra.endereco}, {obra.numero} - {obra.bairro}, {obra.cidade}/{obra.estado} - {obra.cep}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 shrink-0" />
                          <span className="text-nowrap">{new Date(obra.dataInicio).toLocaleDateString('pt-BR')} - {new Date(obra.dataPrevisao).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(obra)} className="text-xs sm:text-sm">
                      <Edit className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Editar</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeleteId(obra.id)} className="text-xs sm:text-sm">
                      <Trash2 className="h-4 w-4 sm:mr-1 text-destructive" />
                      <span className="hidden sm:inline">Excluir</span>
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
