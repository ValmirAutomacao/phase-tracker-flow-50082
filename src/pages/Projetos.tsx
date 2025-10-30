import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import GanttTimeline from "@/components/GanttTimeline";
import { 
  FolderKanban, 
  Calendar, 
  Users, 
  Clock,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

const Projetos = () => {
  const [selectedProject, setSelectedProject] = useState("alpha");

  const projects = [
    {
      id: "alpha",
      nome: "Edifício Alpha",
      progresso: 75,
      status: "em-dia",
      prazo: "45 dias",
      responsavel: "João Silva",
      etapas: 12,
      concluidas: 9
    },
    {
      id: "beta",
      nome: "Residencial Beta",
      progresso: 45,
      status: "atraso",
      prazo: "67 dias",
      responsavel: "Maria Santos",
      etapas: 10,
      concluidas: 4
    },
    {
      id: "gamma",
      nome: "Comercial Gamma",
      progresso: 92,
      status: "em-dia",
      prazo: "12 dias",
      responsavel: "Pedro Costa",
      etapas: 8,
      concluidas: 7
    }
  ];

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
      "concluido": { label: "Concluído", className: "bg-blue-100 text-blue-700" },
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Módulo Projetos</h1>
          <p className="text-muted-foreground">Acompanhamento de obras e timeline</p>
        </div>
      </div>

      {/* Projects Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        {projects.map((project) => (
          <Card 
            key={project.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedProject === project.id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setSelectedProject(project.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{project.nome}</CardTitle>
                {getStatusBadge(project.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Progresso</span>
                  <span className="font-semibold">{project.progresso}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all" 
                    style={{ width: `${project.progresso}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {project.prazo}
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3" />
                  {project.concluidas}/{project.etapas}
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-3 w-3" />
                {project.responsavel}
              </div>
            </CardContent>
          </Card>
        ))}
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
              <CardDescription>Visualização Gantt com dependências e progresso</CardDescription>
            </CardHeader>
            <CardContent>
              <GanttTimeline />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="etapas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Etapas do Projeto</CardTitle>
              <CardDescription>Status detalhado de cada etapa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {etapas.map((etapa, index) => (
                  <div key={index} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <span className="font-bold text-primary">{index + 1}</span>
                        </div>
                        <div>
                          <h4 className="font-semibold">{etapa.nome}</h4>
                          <p className="text-sm text-muted-foreground">
                            {etapa.inicio} - {etapa.fim}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(etapa.status)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Progresso</span>
                        <span className="font-semibold">{etapa.progresso}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            etapa.progresso === 100 ? 'bg-green-500' :
                            etapa.progresso >= 50 ? 'bg-blue-500' :
                            etapa.progresso > 0 ? 'bg-yellow-500' : 'bg-gray-300'
                          }`}
                          style={{ width: `${etapa.progresso}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
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
                {["João Silva - Gerente", "Maria Santos - Engenheira", "Pedro Costa - Mestre de Obras", "Ana Lima - Arquiteta"].map((membro, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium">{membro}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Projetos;
