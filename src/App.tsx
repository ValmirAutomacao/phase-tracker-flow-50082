import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="min-h-screen flex w-full bg-background">
            <AppSidebar />
            <div className="flex-1 flex flex-col">
              <header className="h-14 border-b border-border flex items-center px-4 bg-card">
                <SidebarTrigger className="mr-4" />
                <h1 className="text-lg font-semibold">EngFlow - Sistema de Gestão</h1>
              </header>
              <main className="flex-1 overflow-auto">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/financeiro" element={<Financeiro />} />
                  <Route path="/despesas-detalhes" element={<DespesasDetalhes />} />
                  <Route path="/projetos" element={<Projetos />} />
                  <Route path="/videos" element={<Videos />} />
                  <Route path="/cadastros/clientes" element={<Clientes />} />
                  <Route path="/cadastros/obras" element={<Obras />} />
                  <Route path="/cadastros/funcionarios" element={<Funcionarios />} />
              <Route path="/cadastros/funcoes" element={<Funcoes />} />
              <Route path="/cadastros/setores" element={<Setores />} />
              <Route path="/requisicoes" element={<Requisicoes />} />
              <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
