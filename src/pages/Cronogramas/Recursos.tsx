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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Users, Wrench, Package, DollarSign, AlertTriangle } from "lucide-react";
import { RecursoEmpresa, TipoRecurso, CategoriaRecurso, NivelExperiencia } from "@/types/cronogramas";

type RecursoFormData = {
  tipo_recurso_id: string;
  nome: string;
  codigo: string;
  descricao: string;
  funcionario_id: string;
  disciplina: string;
  nivel_experiencia: NivelExperiencia | "";
  custo_hora: number;
  fornecedor: string;
  marca: string;
  modelo: string;
  unidade_medida: string;
  custo_unitario: number;
  disponibilidade_maxima: number;
  observacoes: string;
  ativo: boolean;
};

const defaultForm: RecursoFormData = {
  tipo_recurso_id: "",
  nome: "",
  codigo: "",
  descricao: "",
  funcionario_id: "",
  disciplina: "",
  nivel_experiencia: "",
  custo_hora: 0,
  fornecedor: "",
  marca: "",
  modelo: "",
  unidade_medida: "horas",
  custo_unitario: 0,
  disponibilidade_maxima: 8,
  observacoes: "",
  ativo: true,
};

const categoriaIcons: Record<CategoriaRecurso, React.ReactNode> = {
  humano: <Users className="h-4 w-4" />,
  equipamento: <Wrench className="h-4 w-4" />,
  material: <Package className="h-4 w-4" />,
  custo: <DollarSign className="h-4 w-4" />,
};

const categoriaColors: Record<CategoriaRecurso, string> = {
  humano: "bg-blue-100 text-blue-800",
  equipamento: "bg-orange-100 text-orange-800",
  material: "bg-green-100 text-green-800",
  custo: "bg-purple-100 text-purple-800",
};

export default function RecursosPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isTipoOpen, setIsTipoOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CategoriaRecurso>("humano");
  const [formData, setFormData] = useState<RecursoFormData>(defaultForm);
  const [tipoForm, setTipoForm] = useState({ nome: "", descricao: "", categoria: "humano" as CategoriaRecurso, unidade_padrao: "horas" });

  // Fetch tipos de recursos
  const { data: tiposRecursos = [] } = useQuery({
    queryKey: ["tipos_recursos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tipos_recursos")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data as TipoRecurso[];
    },
  });

  // Fetch recursos da empresa
  const { data: recursos = [], isLoading } = useQuery({
    queryKey: ["recursos_empresa"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recursos_empresa")
        .select("*, tipos_recursos(*)")
        .order("nome");
      if (error) throw error;
      return data as (RecursoEmpresa & { tipos_recursos: TipoRecurso })[];
    },
  });

  // Fetch funcionários para vincular
  const { data: funcionarios = [] } = useQuery({
    queryKey: ["funcionarios_ativos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("funcionarios")
        .select("id, nome")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  // Fetch super-alocações (recursos com mais de 100% alocados)
  const { data: superAlocacoes = [] } = useQuery({
    queryKey: ["super_alocacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_utilizacao_recursos")
        .select("*")
        .gt("percentual_utilizacao", 100);
      if (error) throw error;
      return data;
    },
  });

  // Criar tipo de recurso
  const saveTipoMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("tipos_recursos")
        .insert(tipoForm);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipos_recursos"] });
      toast.success("Tipo de recurso criado!");
      setIsTipoOpen(false);
      setTipoForm({ nome: "", descricao: "", categoria: "humano", unidade_padrao: "horas" });
    },
    onError: (error) => {
      toast.error("Erro: " + error.message);
    },
  });

  // Criar/Atualizar recurso
  const saveMutation = useMutation({
    mutationFn: async (data: RecursoFormData) => {
      const payload = {
        ...data,
        funcionario_id: data.funcionario_id || null,
        nivel_experiencia: data.nivel_experiencia || null,
      };
      
      if (editingId) {
        const { error } = await supabase
          .from("recursos_empresa")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("recursos_empresa")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recursos_empresa"] });
      toast.success(editingId ? "Recurso atualizado!" : "Recurso criado!");
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Erro ao salvar: " + error.message);
    },
  });

  // Deletar recurso
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("recursos_empresa")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recursos_empresa"] });
      toast.success("Recurso excluído!");
    },
  });

  const handleCloseDialog = () => {
    setIsOpen(false);
    setEditingId(null);
    setFormData(defaultForm);
  };

  const handleEdit = (rec: RecursoEmpresa) => {
    setEditingId(rec.id);
    setFormData({
      tipo_recurso_id: rec.tipo_recurso_id,
      nome: rec.nome,
      codigo: rec.codigo || "",
      descricao: rec.descricao || "",
      funcionario_id: rec.funcionario_id || "",
      disciplina: rec.disciplina || "",
      nivel_experiencia: rec.nivel_experiencia || "",
      custo_hora: rec.custo_hora || 0,
      fornecedor: rec.fornecedor || "",
      marca: rec.marca || "",
      modelo: rec.modelo || "",
      unidade_medida: rec.unidade_medida || "horas",
      custo_unitario: rec.custo_unitario || 0,
      disponibilidade_maxima: rec.disponibilidade_maxima || 8,
      observacoes: rec.observacoes || "",
      ativo: rec.ativo,
    });
    setIsOpen(true);
  };

  const handleOpenNew = (categoria: CategoriaRecurso) => {
    const tipoCategoria = tiposRecursos.find(t => t.categoria === categoria);
    setFormData({
      ...defaultForm,
      tipo_recurso_id: tipoCategoria?.id || "",
    });
    setIsOpen(true);
  };

  const filteredRecursos = recursos.filter(r => r.tipos_recursos?.categoria === activeTab);
  const tiposFiltrados = tiposRecursos.filter(t => t.categoria === activeTab);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Recursos da Empresa</h1>
          <p className="text-muted-foreground">Gerencie funcionários, equipamentos, materiais e custos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsTipoOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Tipo de Recurso
          </Button>
          <Button onClick={() => handleOpenNew(activeTab)}>
            <Plus className="h-4 w-4 mr-2" /> Novo Recurso
          </Button>
        </div>
      </div>

      {/* Alertas de Super-alocação */}
      {superAlocacoes.length > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Alertas de Super-alocação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {superAlocacoes.map((aloc: { recurso_id: string; recurso_nome: string; percentual_utilizacao: number }) => (
                <div key={aloc.recurso_id} className="flex items-center justify-between p-2 bg-background rounded border">
                  <span className="font-medium">{aloc.recurso_nome}</span>
                  <Badge variant="destructive">
                    {aloc.percentual_utilizacao.toFixed(0)}% alocado
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs por Categoria */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CategoriaRecurso)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="humano" className="gap-2">
            <Users className="h-4 w-4" /> Humanos
          </TabsTrigger>
          <TabsTrigger value="equipamento" className="gap-2">
            <Wrench className="h-4 w-4" /> Equipamentos
          </TabsTrigger>
          <TabsTrigger value="material" className="gap-2">
            <Package className="h-4 w-4" /> Materiais
          </TabsTrigger>
          <TabsTrigger value="custo" className="gap-2">
            <DollarSign className="h-4 w-4" /> Custos
          </TabsTrigger>
        </TabsList>

        {["humano", "equipamento", "material", "custo"].map((cat) => (
          <TabsContent key={cat} value={cat}>
            <Card>
              <CardContent className="pt-6">
                {isLoading ? (
                  <div className="text-center py-8">Carregando...</div>
                ) : filteredRecursos.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhum recurso cadastrado nesta categoria</p>
                    <Button variant="outline" className="mt-4" onClick={() => handleOpenNew(cat as CategoriaRecurso)}>
                      <Plus className="h-4 w-4 mr-2" /> Adicionar Primeiro
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        {cat === "humano" && <TableHead>Nível</TableHead>}
                        <TableHead>Custo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecursos.map((rec) => (
                        <TableRow key={rec.id}>
                          <TableCell className="font-mono text-sm">{rec.codigo || "-"}</TableCell>
                          <TableCell className="font-medium">{rec.nome}</TableCell>
                          <TableCell>
                            <Badge className={categoriaColors[rec.tipos_recursos?.categoria as CategoriaRecurso]}>
                              {rec.tipos_recursos?.nome}
                            </Badge>
                          </TableCell>
                          {cat === "humano" && (
                            <TableCell>
                              {rec.nivel_experiencia ? (
                                <Badge variant="outline">{rec.nivel_experiencia}</Badge>
                              ) : "-"}
                            </TableCell>
                          )}
                          <TableCell>
                            {cat === "humano" || cat === "equipamento" 
                              ? `R$ ${(rec.custo_hora || 0).toFixed(2)}/h`
                              : `R$ ${(rec.custo_unitario || 0).toFixed(2)}`}
                          </TableCell>
                          <TableCell>
                            <Badge variant={rec.ativo ? "default" : "secondary"}>
                              {rec.ativo ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(rec)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => { if (confirm("Excluir este recurso?")) deleteMutation.mutate(rec.id); }}
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
        ))}
      </Tabs>

      {/* Dialog Recurso */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Recurso" : "Novo Recurso"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Recurso *</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={formData.tipo_recurso_id}
                  onChange={(e) => setFormData({ ...formData, tipo_recurso_id: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  {tiposRecursos.map((t) => (
                    <option key={t.id} value={t.id}>{t.nome} ({t.categoria})</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Código</Label>
                <Input
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="RH001, EQ002..."
                />
              </div>
            </div>

            <div>
              <Label>Nome *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>

            <div>
              <Label>Descrição</Label>
              <Input
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              />
            </div>

            {/* Campos específicos para Humano */}
            {tiposRecursos.find(t => t.id === formData.tipo_recurso_id)?.categoria === "humano" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Funcionário Vinculado</Label>
                    <select
                      className="w-full border rounded-md p-2"
                      value={formData.funcionario_id}
                      onChange={(e) => setFormData({ ...formData, funcionario_id: e.target.value })}
                    >
                      <option value="">Nenhum (recurso genérico)</option>
                      {funcionarios.map((f) => (
                        <option key={f.id} value={f.id}>{f.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Nível de Experiência</Label>
                    <select
                      className="w-full border rounded-md p-2"
                      value={formData.nivel_experiencia}
                      onChange={(e) => setFormData({ ...formData, nivel_experiencia: e.target.value as NivelExperiencia })}
                    >
                      <option value="">Selecione...</option>
                      <option value="junior">Júnior</option>
                      <option value="pleno">Pleno</option>
                      <option value="senior">Sênior</option>
                      <option value="coordenador">Coordenador</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Disciplina</Label>
                    <Input
                      value={formData.disciplina}
                      onChange={(e) => setFormData({ ...formData, disciplina: e.target.value })}
                      placeholder="Arquitetura, Estrutural, Elétrica..."
                    />
                  </div>
                  <div>
                    <Label>Custo/Hora (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.custo_hora}
                      onChange={(e) => setFormData({ ...formData, custo_hora: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Campos específicos para Equipamento */}
            {tiposRecursos.find(t => t.id === formData.tipo_recurso_id)?.categoria === "equipamento" && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Marca</Label>
                  <Input
                    value={formData.marca}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Modelo</Label>
                  <Input
                    value={formData.modelo}
                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Custo/Hora (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.custo_hora}
                    onChange={(e) => setFormData({ ...formData, custo_hora: Number(e.target.value) })}
                  />
                </div>
              </div>
            )}

            {/* Campos específicos para Material */}
            {tiposRecursos.find(t => t.id === formData.tipo_recurso_id)?.categoria === "material" && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Fornecedor</Label>
                  <Input
                    value={formData.fornecedor}
                    onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Unidade de Medida</Label>
                  <Input
                    value={formData.unidade_medida}
                    onChange={(e) => setFormData({ ...formData, unidade_medida: e.target.value })}
                    placeholder="m², m³, kg, un..."
                  />
                </div>
                <div>
                  <Label>Custo Unitário (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.custo_unitario}
                    onChange={(e) => setFormData({ ...formData, custo_unitario: Number(e.target.value) })}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Disponibilidade Máxima (h/dia)</Label>
                <Input
                  type="number"
                  value={formData.disponibilidade_maxima}
                  onChange={(e) => setFormData({ ...formData, disponibilidade_maxima: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
                <Label>Recurso Ativo</Label>
              </div>
            </div>

            <div>
              <Label>Observações</Label>
              <Input
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
            <Button 
              onClick={() => saveMutation.mutate(formData)} 
              disabled={saveMutation.isPending || !formData.nome || !formData.tipo_recurso_id}
            >
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Tipo de Recurso */}
      <Dialog open={isTipoOpen} onOpenChange={setIsTipoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Tipo de Recurso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={tipoForm.nome}
                onChange={(e) => setTipoForm({ ...tipoForm, nome: e.target.value })}
                placeholder="Engenheiro, Betoneira, Cimento..."
              />
            </div>
            <div>
              <Label>Categoria *</Label>
              <select
                className="w-full border rounded-md p-2"
                value={tipoForm.categoria}
                onChange={(e) => setTipoForm({ ...tipoForm, categoria: e.target.value as CategoriaRecurso })}
              >
                <option value="humano">Humano</option>
                <option value="equipamento">Equipamento</option>
                <option value="material">Material</option>
                <option value="custo">Custo</option>
              </select>
            </div>
            <div>
              <Label>Unidade Padrão</Label>
              <Input
                value={tipoForm.unidade_padrao}
                onChange={(e) => setTipoForm({ ...tipoForm, unidade_padrao: e.target.value })}
                placeholder="horas, m², kg..."
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input
                value={tipoForm.descricao}
                onChange={(e) => setTipoForm({ ...tipoForm, descricao: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTipoOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveTipoMutation.mutate()} disabled={saveTipoMutation.isPending || !tipoForm.nome}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
