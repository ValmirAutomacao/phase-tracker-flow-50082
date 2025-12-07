import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, MapPin, Calendar, Users, GanttChart, ArrowLeft, Plus, Trash2, Edit, UserPlus, Phone, Mail } from "lucide-react";
import { useOptimizedSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { useSupabaseCRUD } from "@/hooks/useSupabaseMutation";
import { PageContainer } from "@/components/layout/PageContainer";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

const ObraDetalhes = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("info");
  const [addEquipeOpen, setAddEquipeOpen] = useState(false);
  const [addResponsavelOpen, setAddResponsavelOpen] = useState(false);
  
  // Form states
  const [selectedFuncionario, setSelectedFuncionario] = useState("");
  const [funcaoNaObra, setFuncaoNaObra] = useState("");
  const [tipoResponsabilidade, setTipoResponsabilidade] = useState("responsavel");

  // Data queries
  const { data: obras = [] } = useOptimizedSupabaseQuery<any>('OBRAS');
  const { data: funcionarios = [] } = useOptimizedSupabaseQuery<any>('FUNCIONARIOS');
  const [equipe, setEquipe] = useState<any[]>([]);
  const [responsaveis, setResponsaveis] = useState<any[]>([]);
  const [cronogramas, setCronogramas] = useState<any[]>([]);

  const obra = obras.find((o: any) => o.id === id);

  // Carregar relacionamentos
  useEffect(() => {
    if (id) {
      loadEquipe();
      loadResponsaveis();
      loadCronogramas();
    }
  }, [id]);

  const loadEquipe = async () => {
    const { data } = await supabase
      .from('obras_equipes')
      .select(`
        *,
        funcionario:funcionarios(id, nome, email, telefone, funcao:funcoes(nome))
      `)
      .eq('obra_id', id)
      .eq('ativo', true);
    setEquipe(data || []);
  };

  const loadResponsaveis = async () => {
    const { data } = await supabase
      .from('obras_responsaveis')
      .select(`
        *,
        funcionario:funcionarios(id, nome, email, telefone, funcao:funcoes(nome))
      `)
      .eq('obra_id', id)
      .eq('ativo', true);
    setResponsaveis(data || []);
  };

  const loadCronogramas = async () => {
    const { data } = await supabase
      .from('cronogramas')
      .select('*')
      .eq('obra_id', id);
    setCronogramas(data || []);
  };

  const handleAddEquipe = async () => {
    if (!selectedFuncionario) {
      toast({ title: "Selecione um funcionário", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from('obras_equipes').insert({
      obra_id: id,
      funcionario_id: selectedFuncionario,
      funcao_na_obra: funcaoNaObra || null,
    });

    if (error) {
      toast({ title: "Erro ao adicionar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Funcionário adicionado à equipe!" });
      loadEquipe();
      setAddEquipeOpen(false);
      setSelectedFuncionario("");
      setFuncaoNaObra("");
    }
  };

  const handleAddResponsavel = async () => {
    if (!selectedFuncionario) {
      toast({ title: "Selecione um funcionário", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from('obras_responsaveis').insert({
      obra_id: id,
      funcionario_id: selectedFuncionario,
      tipo_responsabilidade: tipoResponsabilidade,
    });

    if (error) {
      toast({ title: "Erro ao adicionar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Responsável adicionado!" });
      loadResponsaveis();
      setAddResponsavelOpen(false);
      setSelectedFuncionario("");
      setTipoResponsabilidade("responsavel");
    }
  };

  const handleRemoveEquipe = async (membroId: string) => {
    const { error } = await supabase.from('obras_equipes').update({ ativo: false }).eq('id', membroId);
    if (!error) {
      toast({ title: "Membro removido da equipe" });
      loadEquipe();
    }
  };

  const handleRemoveResponsavel = async (respId: string) => {
    const { error } = await supabase.from('obras_responsaveis').update({ ativo: false }).eq('id', respId);
    if (!error) {
      toast({ title: "Responsável removido" });
      loadResponsaveis();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      planejamento: { label: "Planejamento", className: "bg-yellow-100 text-yellow-700" },
      execucao: { label: "Em Execução", className: "bg-green-100 text-green-700" },
      ativa: { label: "Ativa", className: "bg-green-100 text-green-700" },
      concluida: { label: "Concluída", className: "bg-blue-100 text-blue-700" },
      pausada: { label: "Pausada", className: "bg-gray-100 text-gray-700" },
    };
    const config = variants[status] || { label: status, className: "" };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getTipoResponsabilidadeLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      responsavel: "Responsável Técnico",
      gerente: "Gerente de Obra",
      encarregado: "Encarregado",
      tecnico: "Técnico",
    };
    return labels[tipo] || tipo;
  };

  if (!obra) {
    return (
      <PageContainer title="Obra não encontrada">
        <Button onClick={() => navigate('/obras')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={obra.nome}
      description="Detalhes da obra e gestão de equipe"
    >
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" onClick={() => navigate('/obras')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button variant="outline" onClick={() => navigate(`/obras/cadastro?edit=${id}`)}>
          <Edit className="h-4 w-4 mr-2" />
          Editar Obra
        </Button>
        {cronogramas.length > 0 && (
          <Button onClick={() => navigate(`/obras/${id}/planejamento`)}>
            <GanttChart className="h-4 w-4 mr-2" />
            Ver Cronograma
          </Button>
        )}
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="responsaveis">Responsáveis ({responsaveis.length})</TabsTrigger>
          <TabsTrigger value="equipe">Equipe ({equipe.length})</TabsTrigger>
          <TabsTrigger value="cronogramas">Cronogramas ({cronogramas.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Dados da Obra
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  {getStatusBadge(obra.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-semibold">{obra.progresso || 0}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full transition-all"
                    style={{ width: `${obra.progresso || 0}%` }}
                  />
                </div>
                {obra.orcamento && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Orçamento</span>
                    <span className="font-semibold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(obra.orcamento)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Localização
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {obra.endereco && (
                  <p>{obra.endereco}, {obra.numero}</p>
                )}
                {obra.bairro && <p>{obra.bairro}</p>}
                {obra.cidade && obra.estado && (
                  <p>{obra.cidade}/{obra.estado}</p>
                )}
                {obra.cep && <p>CEP: {obra.cep}</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Datas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {obra.data_inicio && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Início</span>
                    <span>{format(new Date(obra.data_inicio), 'dd/MM/yyyy', { locale: ptBR })}</span>
                  </div>
                )}
                {obra.data_fim && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Previsão de Término</span>
                    <span>{format(new Date(obra.data_fim), 'dd/MM/yyyy', { locale: ptBR })}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="responsaveis" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Responsáveis pela Obra</CardTitle>
                <CardDescription>Gerentes, responsáveis técnicos e encarregados</CardDescription>
              </div>
              <Dialog open={addResponsavelOpen} onOpenChange={setAddResponsavelOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Adicionar Responsável
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Responsável</DialogTitle>
                    <DialogDescription>Selecione um funcionário para ser responsável pela obra</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Funcionário</Label>
                      <Select value={selectedFuncionario} onValueChange={setSelectedFuncionario}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um funcionário" />
                        </SelectTrigger>
                        <SelectContent>
                          {funcionarios.filter(f => f.ativo).map((f: any) => (
                            <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Responsabilidade</Label>
                      <Select value={tipoResponsabilidade} onValueChange={setTipoResponsabilidade}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="responsavel">Responsável Técnico</SelectItem>
                          <SelectItem value="gerente">Gerente de Obra</SelectItem>
                          <SelectItem value="encarregado">Encarregado</SelectItem>
                          <SelectItem value="tecnico">Técnico</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAddResponsavel} className="w-full">Adicionar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {responsaveis.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum responsável cadastrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {responsaveis.map((resp: any) => (
                    <div key={resp.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{resp.funcionario?.nome}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Badge variant="outline">{getTipoResponsabilidadeLabel(resp.tipo_responsabilidade)}</Badge>
                            {resp.funcionario?.funcao?.nome && (
                              <span>{resp.funcionario.funcao.nome}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            {resp.funcionario?.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {resp.funcionario.email}
                              </span>
                            )}
                            {resp.funcionario?.telefone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {resp.funcionario.telefone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveResponsavel(resp.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipe" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Equipe da Obra</CardTitle>
                <CardDescription>Funcionários alocados nesta obra</CardDescription>
              </div>
              <Dialog open={addEquipeOpen} onOpenChange={setAddEquipeOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Adicionar à Equipe
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar à Equipe</DialogTitle>
                    <DialogDescription>Selecione um funcionário para adicionar à equipe da obra</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Funcionário</Label>
                      <Select value={selectedFuncionario} onValueChange={setSelectedFuncionario}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um funcionário" />
                        </SelectTrigger>
                        <SelectContent>
                          {funcionarios.filter(f => f.ativo).map((f: any) => (
                            <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Função na Obra (opcional)</Label>
                      <Input 
                        placeholder="Ex: Mestre de Obras, Eletricista..." 
                        value={funcaoNaObra}
                        onChange={(e) => setFuncaoNaObra(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleAddEquipe} className="w-full">Adicionar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {equipe.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum funcionário na equipe</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {equipe.map((membro: any) => (
                    <div key={membro.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{membro.funcionario?.nome}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            {membro.funcao_na_obra && (
                              <Badge variant="outline">{membro.funcao_na_obra}</Badge>
                            )}
                            {membro.funcionario?.funcao?.nome && (
                              <span>{membro.funcionario.funcao.nome}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            {membro.funcionario?.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {membro.funcionario.email}
                              </span>
                            )}
                            {membro.funcionario?.telefone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {membro.funcionario.telefone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveEquipe(membro.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cronogramas" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Cronogramas</CardTitle>
                <CardDescription>Cronogramas vinculados a esta obra</CardDescription>
              </div>
              <Button onClick={() => navigate(`/cronogramas?obra=${id}`)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Cronograma
              </Button>
            </CardHeader>
            <CardContent>
              {cronogramas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <GanttChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum cronograma cadastrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cronogramas.map((crono: any) => (
                    <div 
                      key={crono.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => navigate(`/obras/${id}/planejamento`)}
                    >
                      <div className="flex items-center gap-4">
                        <GanttChart className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{crono.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {crono.data_inicio && format(new Date(crono.data_inicio), 'dd/MM/yyyy', { locale: ptBR })}
                            {crono.data_fim && ` - ${format(new Date(crono.data_fim), 'dd/MM/yyyy', { locale: ptBR })}`}
                          </p>
                        </div>
                      </div>
                      <Badge>{crono.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default ObraDetalhes;
