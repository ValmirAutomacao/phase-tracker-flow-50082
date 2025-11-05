import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Building2, Video, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { StatsCard } from "@/components/layout/StatsCard";

const Dashboard = () => {
  const stats = [
    {
      title: "Total de Despesas",
      value: "R$ 127.450,00",
      description: "este mês",
      trendValue: "+12.5%",
      icon: DollarSign,
      trend: "up" as const,
      variant: "default" as const,
    },
    {
      title: "Obras Ativas",
      value: "8",
      description: "em andamento",
      trendValue: "+2",
      icon: Building2,
      trend: "up" as const,
      variant: "success" as const,
    },
    {
      title: "Vídeos Gerados",
      value: "24",
      description: "esta semana",
      trendValue: "+8",
      icon: Video,
      trend: "up" as const,
      variant: "default" as const,
    },
    {
      title: "Progresso Médio",
      value: "67%",
      description: "das obras",
      trendValue: "+5.2%",
      icon: TrendingUp,
      trend: "up" as const,
      variant: "success" as const,
    }
  ];

  const recentActivities = [
    { type: "success", message: "Obra Alpha - Etapa de Fundação concluída", time: "2h atrás" },
    { type: "warning", message: "Despesa pendente de validação - R$ 8.500,00", time: "4h atrás" },
    { type: "success", message: "Vídeo arquitetônico gerado para Obra Beta", time: "1 dia atrás" },
    { type: "warning", message: "Obra Gamma com atraso de 3 dias", time: "1 dia atrás" },
  ];

  const ongoingProjects = [
    { name: "Edifício Alpha", progress: 75, status: "Em dia", daysLeft: 45 },
    { name: "Residencial Beta", progress: 45, status: "Atraso leve", daysLeft: 67 },
    { name: "Comercial Gamma", progress: 92, status: "Em dia", daysLeft: 12 },
  ];

  return (
    <PageContainer
      title="Dashboard"
      description="Visão geral do sistema EngFlow"
    >
      {/* Stats Grid */}
      <div className="grid gap-4 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="shadow-card hover:shadow-card-hover transition-all duration-300">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse-slow" />
              Atividades Recentes
            </CardTitle>
            <CardDescription>Últimas atualizações do sistema</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors duration-200"
                >
                  {activity.type === "success" ? (
                    <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center shrink-0">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-950 flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ongoing Projects */}
        <Card className="shadow-card hover:shadow-card-hover transition-all duration-300">
          <CardHeader className="border-b border-border/50">
            <CardTitle>Obras em Andamento</CardTitle>
            <CardDescription>Status dos projetos ativos</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {ongoingProjects.map((project, index) => (
                <div key={index} className="space-y-3 p-3 rounded-lg hover:bg-muted/50 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{project.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="inline-flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {project.daysLeft} dias restantes
                        </span>
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                      project.status === "Em dia" 
                        ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400" 
                        : "bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400"
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-semibold">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default Dashboard;
