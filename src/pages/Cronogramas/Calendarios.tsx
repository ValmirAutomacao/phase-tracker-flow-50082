import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Calendar, Clock, Star } from "lucide-react";
import { CalendarioTrabalho, CalendarioExcecao, TipoExcecao } from "@/types/cronogramas";

type CalendarioFormData = {
  nome: string;
  descricao: string;
  empresa_padrao: boolean;
  segunda_util: boolean;
  terca_util: boolean;
  quarta_util: boolean;
  quinta_util: boolean;
  sexta_util: boolean;
  sabado_util: boolean;
  domingo_util: boolean;
  inicio_manha: string;
  fim_manha: string;
  inicio_tarde: string;
  fim_tarde: string;
  horas_dia: number;
};

const defaultForm: CalendarioFormData = {
  nome: "",
  descricao: "",
  empresa_padrao: false,
  segunda_util: true,
  terca_util: true,
  quarta_util: true,
  quinta_util: true,
  sexta_util: true,
  sabado_util: false,
  domingo_util: false,
  inicio_manha: "08:00",
  fim_manha: "12:00",
  inicio_tarde: "13:00",
  fim_tarde: "17:00",
  horas_dia: 8,
};

export default function CalendariosPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isExcecaoOpen, setIsExcecaoOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCalendarioId, setSelectedCalendarioId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CalendarioFormData>(defaultForm);
  const [excecaoForm, setExcecaoForm] = useState({
    data_excecao: "",
    tipo_excecao: "feriado" as TipoExcecao,
    descricao: "",
    trabalha: false,
  });

  // Fetch calendários
  const { data: calendarios = [], isLoading } = useQuery({
    queryKey: ["calendarios_trabalho"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calendarios_trabalho")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data as CalendarioTrabalho[];
    },
  });

  // Fetch exceções do calendário selecionado
  const { data: excecoes = [] } = useQuery({
    queryKey: ["calendario_excecoes", selectedCalendarioId],
    queryFn: async () => {
      if (!selectedCalendarioId) return [];
      const { data, error } = await supabase
        .from("calendario_excecoes")
        .select("*")
        .eq("calendario_id", selectedCalendarioId)
        .order("data_excecao");
      if (error) throw error;
      return data as CalendarioExcecao[];
    },
    enabled: !!selectedCalendarioId,
  });

  // Create/Update calendário
  const saveMutation = useMutation({
    mutationFn: async (data: CalendarioFormData) => {
      if (editingId) {
        const { error } = await supabase
          .from("calendarios_trabalho")
          .update(data)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("calendarios_trabalho")
          .insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendarios_trabalho"] });
      toast.success(editingId ? "Calendário atualizado!" : "Calendário criado!");
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Erro ao salvar calendário: " + error.message);
    },
  });

  // Delete calendário
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("calendarios_trabalho")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendarios_trabalho"] });
      toast.success("Calendário excluído!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir: " + error.message);
    },
  });

  // Create exceção
  const saveExcecaoMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCalendarioId) return;
      const { error } = await supabase
        .from("calendario_excecoes")
        .insert({
          calendario_id: selectedCalendarioId,
          ...excecaoForm,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendario_excecoes", selectedCalendarioId] });
      toast.success("Exceção adicionada!");
      setIsExcecaoOpen(false);
      setExcecaoForm({ data_excecao: "", tipo_excecao: "feriado", descricao: "", trabalha: false });
    },
    onError: (error) => {
      toast.error("Erro ao adicionar exceção: " + error.message);
    },
  });

  // Delete exceção
  const deleteExcecaoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("calendario_excecoes")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendario_excecoes", selectedCalendarioId] });
      toast.success("Exceção removida!");
    },
  });

  const handleCloseDialog = () => {
    setIsOpen(false);
    setEditingId(null);
    setFormData(defaultForm);
  };

  const handleEdit = (cal: CalendarioTrabalho) => {
    setEditingId(cal.id);
    setFormData({
      nome: cal.nome,
      descricao: cal.descricao || "",
      empresa_padrao: cal.empresa_padrao,
      segunda_util: cal.segunda_util,
      terca_util: cal.terca_util,
      quarta_util: cal.quarta_util,
      quinta_util: cal.quinta_util,
      sexta_util: cal.sexta_util,
      sabado_util: cal.sabado_util,
      domingo_util: cal.domingo_util,
      inicio_manha: cal.inicio_manha,
      fim_manha: cal.fim_manha,
      inicio_tarde: cal.inicio_tarde,
      fim_tarde: cal.fim_tarde,
      horas_dia: cal.horas_dia,
    });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Excluir este calendário?")) {
      deleteMutation.mutate(id);
    }
  };

  const diasSemana = [
    { key: "segunda_util", label: "Seg" },
    { key: "terca_util", label: "Ter" },
    { key: "quarta_util", label: "Qua" },
    { key: "quinta_util", label: "Qui" },
    { key: "sexta_util", label: "Sex" },
    { key: "sabado_util", label: "Sáb" },
    { key: "domingo_util", label: "Dom" },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Calendários de Trabalho</h1>
          <p className="text-muted-foreground">Gerencie horários, dias úteis e feriados</p>
        </div>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Novo Calendário
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Calendários */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" /> Calendários
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando...</div>
              ) : calendarios.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum calendário cadastrado
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Dias Úteis</TableHead>
                      <TableHead>Horário</TableHead>
                      <TableHead>Horas/Dia</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calendarios.map((cal) => (
                      <TableRow 
                        key={cal.id} 
                        className={`cursor-pointer ${selectedCalendarioId === cal.id ? 'bg-muted' : ''}`}
                        onClick={() => setSelectedCalendarioId(cal.id)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {cal.empresa_padrao && <Star className="h-4 w-4 text-yellow-500" />}
                            {cal.nome}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {diasSemana.map((dia) => (
                              <Badge 
                                key={dia.key} 
                                variant={cal[dia.key as keyof CalendarioTrabalho] ? "default" : "secondary"}
                                className="text-xs px-1"
                              >
                                {dia.label}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {cal.inicio_manha}-{cal.fim_manha} / {cal.inicio_tarde}-{cal.fim_tarde}
                        </TableCell>
                        <TableCell>{cal.horas_dia}h</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(cal); }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(cal.id); }}>
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
        </div>

        {/* Painel de Exceções */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" /> Exceções
                </CardTitle>
                {selectedCalendarioId && (
                  <Button size="sm" variant="outline" onClick={() => setIsExcecaoOpen(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedCalendarioId ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Selecione um calendário para ver exceções
                </p>
              ) : excecoes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma exceção cadastrada
                </p>
              ) : (
                <div className="space-y-2">
                  {excecoes.map((exc) => (
                    <div key={exc.id} className="flex items-center justify-between p-2 border rounded-lg">
                      <div>
                        <div className="font-medium text-sm">
                          {new Date(exc.data_excecao).toLocaleDateString("pt-BR")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {exc.descricao || exc.tipo_excecao}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={exc.trabalha ? "default" : "secondary"}>
                          {exc.trabalha ? "Trabalha" : "Não trabalha"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => deleteExcecaoMutation.mutate(exc.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog Calendário */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Calendário" : "Novo Calendário"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>
              <div>
                <Label>Horas por dia</Label>
                <Input
                  type="number"
                  value={formData.horas_dia}
                  onChange={(e) => setFormData({ ...formData, horas_dia: Number(e.target.value) })}
                />
              </div>
            </div>
            
            <div>
              <Label>Descrição</Label>
              <Input
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.empresa_padrao}
                onCheckedChange={(checked) => setFormData({ ...formData, empresa_padrao: checked })}
              />
              <Label>Calendário padrão da empresa</Label>
            </div>

            <div>
              <Label className="mb-2 block">Dias úteis</Label>
              <div className="flex gap-2 flex-wrap">
                {diasSemana.map((dia) => (
                  <Button
                    key={dia.key}
                    variant={formData[dia.key as keyof CalendarioFormData] ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormData({ 
                      ...formData, 
                      [dia.key]: !formData[dia.key as keyof CalendarioFormData] 
                    })}
                    type="button"
                  >
                    {dia.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Manhã</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="time"
                    value={formData.inicio_manha}
                    onChange={(e) => setFormData({ ...formData, inicio_manha: e.target.value })}
                  />
                  <span className="self-center">às</span>
                  <Input
                    type="time"
                    value={formData.fim_manha}
                    onChange={(e) => setFormData({ ...formData, fim_manha: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Tarde</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="time"
                    value={formData.inicio_tarde}
                    onChange={(e) => setFormData({ ...formData, inicio_tarde: e.target.value })}
                  />
                  <span className="self-center">às</span>
                  <Input
                    type="time"
                    value={formData.fim_tarde}
                    onChange={(e) => setFormData({ ...formData, fim_tarde: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate(formData)} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Exceção */}
      <Dialog open={isExcecaoOpen} onOpenChange={setIsExcecaoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Exceção</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Data</Label>
              <Input
                type="date"
                value={excecaoForm.data_excecao}
                onChange={(e) => setExcecaoForm({ ...excecaoForm, data_excecao: e.target.value })}
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <select
                className="w-full border rounded-md p-2"
                value={excecaoForm.tipo_excecao}
                onChange={(e) => setExcecaoForm({ ...excecaoForm, tipo_excecao: e.target.value as TipoExcecao })}
              >
                <option value="feriado">Feriado</option>
                <option value="ponto_facultativo">Ponto Facultativo</option>
                <option value="dia_extra">Dia Extra de Trabalho</option>
              </select>
            </div>
            <div>
              <Label>Descrição</Label>
              <Input
                value={excecaoForm.descricao}
                onChange={(e) => setExcecaoForm({ ...excecaoForm, descricao: e.target.value })}
                placeholder="Ex: Natal, Ano Novo..."
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={excecaoForm.trabalha}
                onCheckedChange={(checked) => setExcecaoForm({ ...excecaoForm, trabalha: checked })}
              />
              <Label>Dia de trabalho</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExcecaoOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveExcecaoMutation.mutate()} disabled={saveExcecaoMutation.isPending}>
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
