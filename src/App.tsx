import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Financeiro from "./pages/Financeiro";
import DespesasDetalhes from "./pages/DespesasDetalhes";
import Projetos from "./pages/Projetos";
import Videos from "./pages/Videos";
import Clientes from "./pages/cadastros/Clientes";
import Obras from "./pages/cadastros/Obras";
import Funcionarios from "./pages/cadastros/Funcionarios";
import Funcoes from "./pages/cadastros/Funcoes";
import Setores from "./pages/cadastros/Setores";
import Requisicoes from "./pages/Requisicoes";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppHeader() {
  const { user, signOut } = useAuth();
  
  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card shrink-0">
      <div className="flex items-center">
        <SidebarTrigger className="mr-2 md:mr-4" />
        <h1 className="text-base md:text-lg font-semibold truncate">
          <span className="hidden sm:inline">EngFlow - Sistema de Gestão</span>
          <span className="sm:hidden">EngFlow</span>
        </h1>
      </div>
      {user && (
        <Button variant="ghost" size="sm" onClick={signOut}>
          <LogOut className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Sair</span>
        </Button>
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
              <Route path="/financeiro" element={<ProtectedRoute><Financeiro /></ProtectedRoute>} />
              <Route path="/despesas-detalhes" element={<ProtectedRoute><DespesasDetalhes /></ProtectedRoute>} />
              <Route path="/projetos" element={<ProtectedRoute><Projetos /></ProtectedRoute>} />
              <Route path="/videos" element={<ProtectedRoute><Videos /></ProtectedRoute>} />
              <Route path="/cadastros/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
              <Route path="/cadastros/obras" element={<ProtectedRoute><Obras /></ProtectedRoute>} />
              <Route path="/cadastros/funcionarios" element={<ProtectedRoute><Funcionarios /></ProtectedRoute>} />
              <Route path="/cadastros/funcoes" element={<ProtectedRoute><Funcoes /></ProtectedRoute>} />
              <Route path="/cadastros/setores" element={<ProtectedRoute><Setores /></ProtectedRoute>} />
              <Route path="/requisicoes" element={<ProtectedRoute><Requisicoes /></ProtectedRoute>} />
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
