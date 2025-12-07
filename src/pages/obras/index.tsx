import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Plus, MapPin, Calendar, Users, GanttChart, TrendingUp, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useOptimizedSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { PageContainer } from "@/components/layout/PageContainer";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ObrasIndex = () => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("overview");

  const { data: obras = [], isLoading } = useOptimizedSupabaseQuery<any>('OBRAS');
  const { data: cronogramas = [] } = useOptimizedSupabaseQuery<any>('CRONOGRAMAS');

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

  const stats = {
    total: obras.length,
    emExecucao: obras.filter(o => o.status === 'execucao' || o.status === 'ativa').length,
    concluidas: obras.filter(o => o.status === 'concluida').length,
    planejamento: obras.filter(o => o.status === 'planejamento').length,
    cronogramasAtivos: cronogramas.filter(c => c.status !== 'arquivado').length,
  };

  return (
    <PageContainer
      title="Gestão de Obras"
      description="Visão geral de obras, projetos e cronogramas"
    >
      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/obras/cadastro')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Obras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/obras/cadastro')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Em Execução</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.emExecucao}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/obras/cadastro')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Concluídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.concluidas}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/obras/cadastro')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Planejamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.planejamento}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/cronogramas')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cronogramas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.cronogramasAtivos}</div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button onClick={() => navigate('/obras/cadastro')} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Obra
        </Button>
        <Button variant="outline" onClick={() => navigate('/cronogramas')} className="gap-2">
          <GanttChart className="h-4 w-4" />
          Cronogramas
        </Button>
        <Button variant="outline" onClick={() => navigate('/cronogramas/calendarios')} className="gap-2">
          <Calendar className="h-4 w-4" />
          Calendários
        </Button>
        <Button variant="outline" onClick={() => navigate('/cronogramas/recursos')} className="gap-2">
          <Users className="h-4 w-4" />
          Recursos
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="recentes">Obras Recentes</TabsTrigger>
          <TabsTrigger value="atrasadas">Atenção Necessária</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {obras.slice(0, 6).map((obra: any) => (
              <Card 
                key={obra.id} 
                className="cursor-pointer hover:shadow-md transition-all"
                onClick={() => navigate(`/obras/${obra.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      {obra.nome}
                    </CardTitle>
                    {getStatusBadge(obra.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Progresso</span>
                      <span className="font-semibold">{obra.progresso || 0}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${obra.progresso || 0}%` }}
                      />
                    </div>
                  </div>
                  {obra.cidade && obra.estado && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {obra.cidade}/{obra.estado}
                    </div>
                  )}
                  {obra.data_inicio && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Início: {format(new Date(obra.data_inicio), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          
          {obras.length > 6 && (
            <div className="text-center">
              <Button variant="outline" onClick={() => navigate('/obras/cadastro')}>
                Ver todas as obras ({obras.length})
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="recentes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Obras Recentes</CardTitle>
              <CardDescription>Últimas obras cadastradas ou atualizadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {obras.slice(0, 10).map((obra: any) => (
                  <div 
                    key={obra.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/obras/${obra.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{obra.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {obra.cidade && obra.estado ? `${obra.cidade}/${obra.estado}` : 'Localização não informada'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(obra.status)}
                      <span className="text-sm font-medium">{obra.progresso || 0}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="atrasadas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Obras que Precisam de Atenção</CardTitle>
              <CardDescription>Obras pausadas ou com prazo próximo</CardDescription>
            </CardHeader>
            <CardContent>
              {obras.filter(o => o.status === 'pausada' || o.progresso < 30).length > 0 ? (
                <div className="space-y-3">
                  {obras.filter(o => o.status === 'pausada' || o.progresso < 30).map((obra: any) => (
                    <div 
                      key={obra.id}
                      className="flex items-center justify-between p-3 border border-orange-200 bg-orange-50 rounded-lg hover:bg-orange-100 cursor-pointer"
                      onClick={() => navigate(`/obras/${obra.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-orange-600" />
                        <div>
                          <p className="font-medium">{obra.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {obra.status === 'pausada' ? 'Obra pausada' : 'Progresso abaixo de 30%'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(obra.status)}
                        <span className="text-sm font-medium">{obra.progresso || 0}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma obra precisa de atenção no momento!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default ObrasIndex;
