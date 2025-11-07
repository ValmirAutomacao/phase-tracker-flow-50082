import { 
  LayoutDashboard, 
  DollarSign, 
  Building2, 
  Video, 
  Users, 
  Briefcase,
  UserCog,
  FolderKanban,
  FileText,
  Kanban as KanbanIcon
} from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Financeiro",
    url: "/financeiro",
    icon: DollarSign,
  },
  {
    title: "Projetos",
    url: "/projetos",
    icon: FolderKanban,
  },
  {
    title: "Vídeos",
    url: "/videos",
    icon: Video,
  },
  {
    title: "CRM Kanban",
    url: "/kanban",
    icon: KanbanIcon,
  },
];

const cadastrosItems = [
  {
    title: "Clientes",
    url: "/cadastros/clientes",
    icon: Users,
  },
  {
    title: "Obras",
    url: "/cadastros/obras",
    icon: Building2,
  },
  {
    title: "Funcionários",
    url: "/cadastros/funcionarios",
    icon: Users,
  },
  {
    title: "Funções",
    url: "/cadastros/funcoes",
    icon: Briefcase,
  },
  {
    title: "Setores",
    url: "/cadastros/setores",
    icon: UserCog,
  },
];

const comprasItems = [
  {
    title: "Requisições",
    url: "/requisicoes",
    icon: FileText,
  },
];

export function AppSidebar() {
  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="border-b border-border px-4 md:px-6 py-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-lg">E</span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-lg truncate">EngFlow</h2>
            <p className="text-xs text-muted-foreground truncate">Gestão de Obras</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      end={item.url === "/"}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted/50"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Cadastros</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {cadastrosItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted/50"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Compras</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {comprasItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted/50"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
