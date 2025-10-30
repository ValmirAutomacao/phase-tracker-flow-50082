import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Building2, Video, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

const Dashboard = () => {
  const stats = [
    {
      title: "Total de Despesas",
      value: "R$ 127.450,00",
      change: "+12.5%",
      icon: DollarSign,
      trend: "up"
    },
    {
      title: "Obras Ativas",
      value: "8",
      change: "+2 este mês",
      icon: Building2,
      trend: "up"
    },
    {
      title: "Vídeos Gerados",
      value: "24",
      change: "+8 esta semana",
      icon: Video,
      trend: "up"
    },
    {
      title: "Progresso Médio",
      value: "67%",
      change: "+5.2% vs mês anterior",
      icon: TrendingUp,
      trend: "up"
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
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do sistema EngFlow</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="transition-all hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
            <CardDescription>Últimas atualizações do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  {activity.type === "success" ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ongoing Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Obras em Andamento</CardTitle>
            <CardDescription>Status dos projetos ativos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ongoingProjects.map((project, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{project.name}</p>
                      <p className="text-xs text-muted-foreground">{project.daysLeft} dias restantes</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      project.status === "Em dia" 
                        ? "bg-green-100 text-green-700" 
                        : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all" 
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
