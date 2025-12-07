import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Plus, Calendar, ClipboardList, Users, Settings, 
  Eye, Pencil, Trash2, Play, Pause, CheckCircle,
  BarChart3, Clock, AlertTriangle
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Cronograma, StatusCronograma } from "@/types/cronogramas";

type CronogramaFormData = {
  nome: string;
  descricao: string;
  obra_id: string;
  calendario_id: string;
  data_inicio: string;
  data_fim: string;
  orcamento_total: number;
};

const defaultForm: CronogramaFormData = {
  nome: "",
  descricao: "",
  obra_id: "",
  calendario_id: "",
  data_inicio: new Date().toISOString().split("T")[0],
  data_fim: "",
  orcamento_total: 0,
};

const statusColors: Record<StatusCronograma, string> = {
  planejamento: "bg-blue-100 text-blue-800",
  em_execucao: "bg-green-100 text-green-800",
  pausado: "bg-yellow-100 text-yellow-800",
  concluido: "bg-gray-100 text-gray-800",
  cancelado: "bg-red-100 text-red-800",
};

const statusLabels: Record<StatusCronograma, string> = {
  planejamento: "Planejamento",
  em_execucao: "Em Execução",
  pausado: "Pausado",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export default function CronogramasPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("cronogramas");
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CronogramaFormData>(defaultForm);

  // Fetch cronogramas
  const { data: cronogramas = [], isLoading } = useQuery({
    queryKey: ["cronogramas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cronogramas")
        .select("*, obras(nome), calendarios_trabalho(nome)")
        .order("data_criacao", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch obras (todas exceto canceladas)
  const { data: obras = [] } = useQuery({
    queryKey: ["obras_para_cronograma"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("obras")
        .select("id, nome, status")
        .neq("status", "cancelada")
        .order("nome");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch calendários
  const { data: calendarios = [] } = useQuery({
    queryKey: ["calendarios_trabalho"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calendarios_trabalho")
        .select("id, nome")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  // Estatísticas rápidas
  const stats = {
    total: cronogramas.length,
    emExecucao: cronogramas.filter((c) => c.status === "em_execucao").length,
    atrasados: cronogramas.filter((c) => {
      if (!c.data_fim) return false;
      return new Date(c.data_fim) < new Date() && c.status !== "concluido";
    }).length,
    concluidos: cronogramas.filter((c) => c.status === "concluido").length,
  };

  // Criar/Atualizar cronograma
  const saveMutation = useMutation({
    mutationFn: async (data: CronogramaFormData) => {
      const payload = {
        ...data,
        obra_id: data.obra_id || null,
        data_fim: data.data_fim || null,
        orcamento_total: data.orcamento_total || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from("cronogramas")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cronogramas")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cronogramas"] });
      toast.success(editingId ? "Cronograma atualizado!" : "Cronograma criado!");
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Erro: " + error.message);
    },
  });

  // Atualizar status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StatusCronograma }) => {
      const { error } = await supabase
        .from("cronogramas")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cronogramas"] });
      toast.success("Status atualizado!");
    },
  });

  // Deletar cronograma
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("cronogramas")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cronogramas"] });
      toast.success("Cronograma excluído!");
    },
  });

  const handleCloseDialog = () => {
    setIsOpen(false);
    setEditingId(null);
    setFormData(defaultForm);
  };

  const handleEdit = (cron: Cronograma) => {
    setEditingId(cron.id);
    setFormData({
      nome: cron.nome,
      descricao: cron.descricao || "",
      obra_id: cron.obra_id || "",
      calendario_id: cron.calendario_id,
      data_inicio: cron.data_inicio,
      data_fim: cron.data_fim || "",
      orcamento_total: cron.orcamento_total || 0,
    });
    setIsOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Cronogramas</h1>
          <p className="text-muted-foreground">Gerencie cronogramas de obras no estilo MS Project</p>
        </div>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Novo Cronograma
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <ClipboardList className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Execução</p>
                <p className="text-2xl font-bold text-green-600">{stats.emExecucao}</p>
              </div>
              <Play className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Atrasados</p>
                <p className="text-2xl font-bold text-destructive">{stats.atrasados}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Concluídos</p>
                <p className="text-2xl font-bold">{stats.concluidos}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="cronogramas" className="gap-2">
            <ClipboardList className="h-4 w-4" /> Cronogramas
          </TabsTrigger>
          <TabsTrigger value="calendarios" className="gap-2" asChild>
            <Link to="/cronogramas/calendarios">
              <Calendar className="h-4 w-4" /> Calendários
            </Link>
          </TabsTrigger>
          <TabsTrigger value="recursos" className="gap-2" asChild>
            <Link to="/cronogramas/recursos">
              <Users className="h-4 w-4" /> Recursos
            </Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cronogramas">
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : cronogramas.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg">Nenhum cronograma cadastrado</p>
                  <Button className="mt-4" onClick={() => setIsOpen(true)}>
                    Criar Primeiro Cronograma
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Obra</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Progresso</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[150px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cronogramas.map((cron) => (
                      <TableRow key={cron.id}>
                        <TableCell className="font-medium">{cron.nome}</TableCell>
                        <TableCell>{cron.obras?.nome || "-"}</TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(cron.data_inicio).toLocaleDateString("pt-BR")}
                            {cron.data_fim && ` - ${new Date(cron.data_fim).toLocaleDateString("pt-BR")}`}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={cron.percentual_conclusao || 0} className="w-20 h-2" />
                            <span className="text-sm">{cron.percentual_conclusao || 0}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[cron.status as StatusCronograma]}>
                            {statusLabels[cron.status as StatusCronograma]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/cronogramas/${cron.id}/gantt`)}
                              title="Abrir Gantt"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(cron as Cronograma)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {cron.status === "planejamento" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => updateStatusMutation.mutate({ id: cron.id, status: "em_execucao" })}
                                title="Iniciar"
                              >
                                <Play className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            {cron.status === "em_execucao" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => updateStatusMutation.mutate({ id: cron.id, status: "pausado" })}
                                title="Pausar"
                              >
                                <Pause className="h-4 w-4 text-yellow-600" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { if (confirm("Excluir cronograma?")) deleteMutation.mutate(cron.id); }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Cronograma */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Cronograma" : "Novo Cronograma"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Cronograma da Obra X"
              />
            </div>

            <div>
              <Label>Descrição</Label>
              <Input
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Obra</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={formData.obra_id}
                  onChange={(e) => setFormData({ ...formData, obra_id: e.target.value })}
                >
                  <option value="">Sem vínculo</option>
                  {obras.map((o) => (
                    <option key={o.id} value={o.id}>{o.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Calendário *</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={formData.calendario_id}
                  onChange={(e) => setFormData({ ...formData, calendario_id: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  {calendarios.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Início *</Label>
                <Input
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                />
              </div>
              <div>
                <Label>Data Fim (Prevista)</Label>
                <Input
                  type="date"
                  value={formData.data_fim}
                  onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Orçamento Total (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.orcamento_total}
                onChange={(e) => setFormData({ ...formData, orcamento_total: Number(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
            <Button
              onClick={() => saveMutation.mutate(formData)}
              disabled={saveMutation.isPending || !formData.nome || !formData.calendario_id}
            >
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
