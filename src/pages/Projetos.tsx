import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import GanttTimeline from "@/components/GanttTimeline";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { PageContainer } from "@/components/layout/PageContainer";
import {
  FolderKanban,
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

const Projetos = () => {
  const [selectedProject, setSelectedProject] = useState(null);

  // Buscar obras e funcionários do Supabase
  const { data: obras = [], isLoading } = useSupabaseQuery<any>('OBRAS');
  const { data: funcionarios = [] } = useSupabaseQuery<any>('FUNCIONARIOS');

  useEffect(() => {
    if (obras.length > 0 && !selectedProject) {
      setSelectedProject(obras[0].id);
    }
  }, [obras, selectedProject]);

  const calculateProjectProgress = (etapas: any) => {
    if (!etapas || etapas.length === 0) return 0;
    const totalWeight = etapas.length;
    const completedWeight = etapas.filter(e => e.status === "completed" || e.progresso === 100).length;
    return Math.round((completedWeight / totalWeight) * 100);
  };

  const calculateRemainingDays = (dataPrevisao) => {
    if (!dataPrevisao) return "N/A";
    const hoje = new Date();
    const previsao = new Date(dataPrevisao);
    const diffTime = (previsao as any) - (hoje as any);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays} dias` : "Atrasado";
  };

  const getProjectStatus = (dataPrevisao, progresso) => {
    if (progresso === 100) return "concluido";
    if (!dataPrevisao) return "em-dia";

    const hoje = new Date();
    const previsao = new Date(dataPrevisao);
    const diffDays = Math.ceil(((previsao as any) - (hoje as any)) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "atraso";
    if (diffDays < 7) return "atencao";
    return "em-dia";
  };

  const etapas = [
    { nome: "Fundação", progresso: 100, status: "concluido", inicio: "01/12/2024", fim: "15/12/2024" },
    { nome: "Estrutura", progresso: 85, status: "em-andamento", inicio: "16/12/2024", fim: "10/01/2025" },
    { nome: "Alvenaria", progresso: 60, status: "em-andamento", inicio: "11/01/2025", fim: "05/02/2025" },
    { nome: "Elétrica", progresso: 30, status: "em-andamento", inicio: "20/01/2025", fim: "15/02/2025" },
    { nome: "Acabamento", progresso: 0, status: "pendente", inicio: "16/02/2025", fim: "10/03/2025" },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      "em-dia": { label: "Em Dia", className: "bg-green-100 text-green-700" },
      "atraso": { label: "Atrasado", className: "bg-red-100 text-red-700" },
      "atencao": { label: "Atenção", className: "bg-orange-100 text-orange-700" },
      "concluido": { label: "Concluído", className: "bg-blue-100 text-blue-700" },
      "ativa": { label: "Ativa", className: "bg-green-100 text-green-700" },
      "planejamento": { label: "Planejamento", className: "bg-yellow-100 text-yellow-700" },
      "em-andamento": { label: "Em Andamento", className: "bg-yellow-100 text-yellow-700" },
      "pendente": { label: "Pendente", className: "bg-gray-100 text-gray-700" },
    };

    return (
      <Badge className={variants[status]?.className || ""}>
        {variants[status]?.label || status}
      </Badge>
    );
  };

  return (
    <PageContainer
      title="Módulo Projetos"
      description="Acompanhamento de obras e timeline"
    >

      {/* Projects Overview */}
      <div className="row g-3 g-sm-4">
        {obras.map((obra) => {
          const progresso = obra.progresso || calculateProjectProgress(obra.etapas);
          const status = getProjectStatus(obra.dataPrevisao, progresso);
          const prazoRestante = calculateRemainingDays(obra.dataPrevisao);
          const etapasCount = obra.etapas ? obra.etapas.length : 0;
          const etapasConcluidas = obra.etapas ? obra.etapas.filter(e => e.status === "completed" || e.progresso === 100).length : 0;

          return (
            <div key={obra.id} className="col-12 col-md-6 col-lg-4">
              <Card
                className={`${selectedProject === obra.id ? "ring-2 ring-primary shadow-glow" : "shadow-card"} cursor-pointer transition-all duration-300 hover:shadow-card-hover hover:scale-[1.02]`}
                onClick={() => setSelectedProject(obra.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{obra.nome}</CardTitle>
                    {getStatusBadge(obra.status || status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Progresso</span>
                      <span className="font-semibold">{progresso}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${progresso}%` }}
                      />
                    </div>
                  </div>
                  <div className="row g-2 text-sm">
                    <div className="col-6 flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {prazoRestante}
                    </div>
                    <div className="col-6 flex items-center gap-1 text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3" />
                      {etapasConcluidas}/{etapasCount}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {obra.responsavel}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Cliente: {obra.cliente}
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Project Details */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Timeline Gantt</TabsTrigger>
          <TabsTrigger value="etapas">Etapas</TabsTrigger>
          <TabsTrigger value="equipe">Equipe</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Timeline do Projeto</CardTitle>
              <CardDescription>
                {selectedProject
                  ? `Visualização Gantt da obra: ${obras.find(o => o.id === selectedProject)?.nome || 'Selecionada'}`
                  : 'Selecione uma obra para visualizar o timeline'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GanttTimeline obra={obras.find(o => o.id === selectedProject)} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="etapas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Etapas do Projeto</CardTitle>
              <CardDescription>
                {selectedProject
                  ? `Status detalhado das etapas da obra: ${obras.find(o => o.id === selectedProject)?.nome || 'Selecionada'}`
                  : 'Selecione uma obra para visualizar as etapas'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedProject && obras.find(o => o.id === selectedProject)?.etapas ?
                  obras.find(o => o.id === selectedProject).etapas.map((etapa, index) => (
                    <div key={etapa.id || index} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span className="font-bold text-primary">{index + 1}</span>
                          </div>
                          <div>
                            <h4 className="font-semibold">{etapa.nome}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(etapa.dataInicio).toLocaleDateString('pt-BR')} - {new Date(etapa.dataPrevisao).toLocaleDateString('pt-BR')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Responsável: {etapa.responsavel}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(etapa.status || "em-andamento")}
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Progresso</span>
                          <span className="font-semibold">{etapa.progresso || 0}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              (etapa.progresso || 0) === 100 ? 'bg-green-500' :
                              (etapa.progresso || 0) >= 50 ? 'bg-blue-500' :
                              (etapa.progresso || 0) > 0 ? 'bg-yellow-500' : 'bg-gray-300'
                            }`}
                            style={{ width: `${etapa.progresso || 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-muted-foreground">
                      {selectedProject ? 'Nenhuma etapa cadastrada para esta obra.' : 'Selecione uma obra para visualizar as etapas.'}
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipe" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Equipe do Projeto</CardTitle>
              <CardDescription>Colaboradores alocados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {funcionarios.length > 0 ? funcionarios.slice(0, 6).map((funcionario, index) => (
                  <div key={funcionario.id || index} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium">{funcionario.nome} - {funcionario.funcao?.nome || funcionario.setor?.nome || 'Funcionário'}</span>
                  </div>
                )) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum funcionário cadastrado</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default Projetos;
