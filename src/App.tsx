import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PermissionGuard } from "@/components/PermissionGuard";
import { PERMISSIONS } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Financeiro from "./pages/Financeiro";
import DespesasDetalhes from "./pages/DespesasDetalhes";
// Novos componentes do módulo financeiro
import FinanceiroDashboard from "./pages/financeiro/Dashboard";
import DespesasRequisicao from "./pages/financeiro/DespesasRequisicao";
import DespesasVariaveis from "./pages/financeiro/DespesasVariaveis";
import CartoesCredito from "./pages/financeiro/CartoesCredito";
import FormasPagamento from "./pages/financeiro/FormasPagamento";
import Projetos from "./pages/Projetos";
import Videos from "./pages/Videos";
import Clientes from "./pages/cadastros/Clientes";
import Obras from "./pages/cadastros/Obras";
import Funcionarios from "./pages/cadastros/Funcionarios";
import Funcoes from "./pages/cadastros/Funcoes";
import Setores from "./pages/cadastros/Setores";
import TiposJustificativas from "./pages/cadastros/TiposJustificativas";
import TiposAfastamento from "./pages/cadastros/TiposAfastamento";
import Categorias from "./pages/Categorias";
import Requisicoes from "./pages/Requisicoes";
import Kanban from "./pages/Kanban";
import TrabalheConosco from "./pages/TrabalheConosco";
import CurriculosAdmin from "./pages/CurriculosAdmin";
import RegistroPonto from "./pages/RegistroPonto";
import ControlePonto from "./pages/RH/ControlePonto";
import Jornadas from "./pages/RH/Jornadas";
import GerenciarAfastamentos from "./pages/RH/GerenciarAfastamentos";
// Módulo BI
import BIDashboard from "./pages/BI/index";
import BIBuilder from "./pages/BI/Builder";
import BIVisualizer from "./pages/BI/Visualizer";
import CronogramasPage from "./pages/Cronogramas";
import CalendariosPage from "./pages/Cronogramas/Calendarios";
import RecursosPage from "./pages/Cronogramas/Recursos";
import CronogramaGanttView from "./pages/Cronogramas/GanttView";
import PlanejamentoObra from "./pages/obras/Planejamento";
import ObrasIndex from "./pages/obras/index";
import ObraDetalhes from "./pages/obras/ObraDetalhes";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppHeader() {
  const { user, signOut } = useAuth();

  return (
    <header className="h-14 border-b border-sidebar-border flex items-center justify-between px-4 bg-sidebar shrink-0">
      <div className="flex items-center">
        <SidebarTrigger className="mr-2 md:mr-4 text-sidebar-foreground" />
        <h1 className="text-base md:text-lg font-semibold truncate text-sidebar-foreground">
          <span className="hidden sm:inline">SecEngenharia - Sistema de Gestão</span>
          <span className="sm:hidden">SecEngenharia</span>
        </h1>
      </div>
      {user && (
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-sm text-sidebar-foreground">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-accent-foreground font-medium text-xs">
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col">
                <span className="font-medium leading-none">{user.email}</span>
                <span className="text-xs text-sidebar-accent-foreground opacity-70">Usuário logado</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-sidebar-foreground hover:bg-sidebar-primary hover:text-sidebar-accent-foreground">
            <LogOut className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      )}
    </header>
  );
}

function AppLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <AppHeader />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              
              <Route path="/financeiro" element={
                <ProtectedRoute>
                  <PermissionGuard requiredPermission="visualizar_dashboard_financeiro">
                    <Financeiro />
                  </PermissionGuard>
                </ProtectedRoute>
              } />

              {/* Novas rotas do módulo financeiro */}
              <Route path="/financeiro/dashboard" element={
                <ProtectedRoute>
                  <PermissionGuard requiredPermission="visualizar_dashboard_financeiro">
                    <FinanceiroDashboard />
                  </PermissionGuard>
                </ProtectedRoute>
              } />

              <Route path="/financeiro/despesas-requisicao" element={
                <ProtectedRoute>
                  <PermissionGuard requiredPermission="visualizar_despesas_requisicao">
                    <DespesasRequisicao />
                  </PermissionGuard>
                </ProtectedRoute>
              } />

              <Route path="/financeiro/despesas-variaveis" element={
                <ProtectedRoute>
                  <PermissionGuard requiredPermission="visualizar_despesas_variaveis">
                    <DespesasVariaveis />
                  </PermissionGuard>
                </ProtectedRoute>
              } />

              <Route path="/financeiro/cartoes-credito" element={
                <ProtectedRoute>
                  <PermissionGuard requiredPermission="visualizar_cartoes_credito">
                    <CartoesCredito />
                  </PermissionGuard>
                </ProtectedRoute>
              } />

              <Route path="/financeiro/formas-pagamento" element={
                <ProtectedRoute>
                  <PermissionGuard requiredPermission="visualizar_formas_pagamento">
                    <FormasPagamento />
                  </PermissionGuard>
                </ProtectedRoute>
              } />

              <Route path="/despesas-detalhes" element={
                <ProtectedRoute>
                  <PermissionGuard requiredPermission="visualizar_dashboard_financeiro">
                    <DespesasDetalhes />
                  </PermissionGuard>
                </ProtectedRoute>
              } />
              
              <Route path="/projetos" element={
                <ProtectedRoute>
                  <PermissionGuard requiredPermission="visualizar_obras">
                    <Projetos />
                  </PermissionGuard>
                </ProtectedRoute>
              } />
              
              <Route path="/videos" element={<ProtectedRoute><Videos /></ProtectedRoute>} />
              
              {/* Módulo Gestão de Obras/Gantt */}
              <Route path="/obras" element={<ProtectedRoute><ObrasIndex /></ProtectedRoute>} />
              <Route path="/obras/cadastro" element={<ProtectedRoute><Obras /></ProtectedRoute>} />
              <Route path="/obras/:id" element={<ProtectedRoute><ObraDetalhes /></ProtectedRoute>} />
              <Route path="/obras/:id/planejamento" element={<ProtectedRoute><PlanejamentoObra /></ProtectedRoute>} />
              <Route path="/cronogramas" element={<ProtectedRoute><CronogramasPage /></ProtectedRoute>} />
              <Route path="/cronogramas/:id/gantt" element={<ProtectedRoute><CronogramaGanttView /></ProtectedRoute>} />
              <Route path="/cronogramas/calendarios" element={<ProtectedRoute><CalendariosPage /></ProtectedRoute>} />
              <Route path="/cronogramas/recursos" element={<ProtectedRoute><RecursosPage /></ProtectedRoute>} />
              
              <Route path="/cadastros/clientes" element={
                <ProtectedRoute>
                  <PermissionGuard requiredPermission="visualizar_clientes">
                    <Clientes />
                  </PermissionGuard>
                </ProtectedRoute>
              } />
              
              <Route path="/cadastros/obras" element={
                <ProtectedRoute>
                  <PermissionGuard requiredPermission="visualizar_obras">
                    <Obras />
                  </PermissionGuard>
                </ProtectedRoute>
              } />
              
              <Route path="/cadastros/funcionarios" element={
                <ProtectedRoute>
                  <PermissionGuard requiredPermission="visualizar_funcionarios">
                    <Funcionarios />
                  </PermissionGuard>
                </ProtectedRoute>
              } />
              
              <Route path="/cadastros/funcoes" element={
                <ProtectedRoute>
                  <PermissionGuard requiredPermission="visualizar_funcoes">
                    <Funcoes />
                  </PermissionGuard>
                </ProtectedRoute>
              } />
              
              <Route path="/cadastros/setores" element={
                <ProtectedRoute>
                  <PermissionGuard requiredPermission="visualizar_setores">
                    <Setores />
                  </PermissionGuard>
                </ProtectedRoute>
              } />

              <Route path="/cadastros/tipos-justificativas" element={
                <ProtectedRoute>
                  <PermissionGuard requiredPermission="visualizar_tipos_justificativas">
                    <TiposJustificativas />
                  </PermissionGuard>
                </ProtectedRoute>
              } />

              <Route path="/cadastros/tipos-afastamento" element={
                <ProtectedRoute>
                  <PermissionGuard requiredPermission="visualizar_tipos_afastamento">
                    <TiposAfastamento />
                  </PermissionGuard>
                </ProtectedRoute>
              } />

              <Route path="/categorias" element={
                <ProtectedRoute>
                  <PermissionGuard requiredPermission="visualizar_categorias_financeiro">
                    <Categorias />
                  </PermissionGuard>
                </ProtectedRoute>
              } />

              <Route path="/requisicoes" element={
                <ProtectedRoute>
                  <PermissionGuard requiredPermission="visualizar_requisicoes">
                    <Requisicoes />
                  </PermissionGuard>
                </ProtectedRoute>
              } />
              
              <Route path="/kanban" element={<ProtectedRoute><Kanban /></ProtectedRoute>} />

              <Route path="/trabalhe-conosco" element={<TrabalheConosco />} />

              <Route path="/ponto" element={
                <ProtectedRoute>
                  <PermissionGuard requiredPermission="registrar_ponto">
                    <RegistroPonto />
                  </PermissionGuard>
                </ProtectedRoute>
              } />

              <Route path="/rh/controle-ponto" element={
                <ProtectedRoute>
                  <PermissionGuard requiredPermission="gerenciar_ponto">
                    <ControlePonto />
                  </PermissionGuard>
                </ProtectedRoute>
              } />

              <Route path="/rh/curriculos" element={
                <ProtectedRoute>
                  <PermissionGuard requiredPermission="visualizar_curriculos">
                    <CurriculosAdmin />
                  </PermissionGuard>
                </ProtectedRoute>
              } />

              <Route path="/rh/jornadas" element={
                <ProtectedRoute>
                  <PermissionGuard requiredPermission="visualizar_jornadas">
                    <Jornadas />
                  </PermissionGuard>
                </ProtectedRoute>
              } />

              <Route path="/rh/afastamentos" element={
                <ProtectedRoute>
                  <PermissionGuard requiredPermission="visualizar_afastamentos">
                    <GerenciarAfastamentos />
                  </PermissionGuard>
                </ProtectedRoute>
              } />

              {/* Rotas do módulo BI */}
              <Route path="/bi" element={
                <ProtectedRoute>
                  <PermissionGuard requiredPermission="visualizar_dashboard_executivo">
                    <BIDashboard />
                  </PermissionGuard>
                </ProtectedRoute>
              } />

              <Route path="/bi/builder" element={
                <ProtectedRoute>
                  <PermissionGuard requiredPermission="criar_relatorios_bi">
                    <BIBuilder />
                  </PermissionGuard>
                </ProtectedRoute>
              } />

              <Route path="/bi/visualizer/:id" element={
                <ProtectedRoute>
                  <PermissionGuard requiredPermission="visualizar_dashboard_executivo">
                    <BIVisualizer />
                  </PermissionGuard>
                </ProtectedRoute>
              } />

              <Route path="/bi/visualizer/preview" element={
                <ProtectedRoute>
                  <PermissionGuard requiredPermission="visualizar_dashboard_executivo">
                    <BIVisualizer />
                  </PermissionGuard>
                </ProtectedRoute>
              } />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/*" element={<AppLayout />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
