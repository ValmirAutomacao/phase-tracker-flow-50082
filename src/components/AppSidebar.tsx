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
  Kanban as KanbanIcon,
  Tag,
  UserPlus,
  UsersRound
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
import { usePermissions } from "@/hooks/usePermissions";
import { useRole } from "@/components/auth/RoleGuard";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    permissions: [], // Livre para todos
  },
  {
    title: "Financeiro",
    url: "/financeiro",
    icon: DollarSign,
    permissions: ["visualizar_financeiro"],
  },
  {
    title: "Projetos",
    url: "/projetos",
    icon: FolderKanban,
    permissions: ["visualizar_obras"],
  },
  {
    title: "Vídeos",
    url: "/videos",
    icon: Video,
    permissions: ["visualizar_videos"],
  },
  {
    title: "CRM Kanban",
    url: "/kanban",
    icon: KanbanIcon,
    permissions: ["visualizar_clientes"], // CRM relacionado a clientes
  },
  {
    title: "Trabalhe Conosco",
    url: "/trabalhe-conosco",
    icon: UserPlus,
    permissions: [], // Livre para todos
  },
];

const cadastrosItems = [
  {
    title: "Clientes",
    url: "/cadastros/clientes",
    icon: Users,
    permissions: ["visualizar_clientes"],
  },
  {
    title: "Obras",
    url: "/cadastros/obras",
    icon: Building2,
    permissions: ["visualizar_obras"],
  },
  {
    title: "Funcionários",
    url: "/cadastros/funcionarios",
    icon: Users,
    permissions: ["visualizar_equipe"],
  },
  {
    title: "Funções",
    url: "/cadastros/funcoes",
    icon: Briefcase,
    permissions: ["gerenciar_equipe"],
  },
  {
    title: "Setores",
    url: "/cadastros/setores",
    icon: UserCog,
    permissions: ["gerenciar_equipe"],
  },
  {
    title: "Categorias",
    url: "/categorias",
    icon: Tag,
    permissions: ["visualizar_financeiro"],
  },
  {
    title: "Currículos Recebidos",
    url: "/admin/curriculos",
    icon: UsersRound,
    permissions: ["gerenciar_equipe"],
  },
];

const comprasItems = [
  {
    title: "Requisições",
    url: "/requisicoes",
    icon: FileText,
    permissions: ["visualizar_compras"],
  },
];

export function AppSidebar() {
  const { hasAnyPermission } = usePermissions();

  // Filtrar itens baseados em permissões
  const filteredMenuItems = menuItems.filter(item =>
    item.permissions.length === 0 || hasAnyPermission(item.permissions)
  );

  const filteredCadastrosItems = cadastrosItems.filter(item =>
    hasAnyPermission(item.permissions)
  );

  const filteredComprasItems = comprasItems.filter(item =>
    hasAnyPermission(item.permissions)
  );

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border px-4 md:px-6 py-4 bg-sidebar">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0">
            <img src="/favicon.png" alt="Sec Engenharia" className="h-8 w-8 rounded-lg" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-lg truncate text-sidebar-foreground">Sec Engenharia</h2>
            <p className="text-xs text-sidebar-accent-foreground truncate">Gestão de Obras</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-accent-foreground font-semibold">Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      end={item.url === "/"}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "hover:bg-sidebar-primary text-sidebar-foreground"
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

        {filteredCadastrosItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-accent-foreground font-semibold">Cadastros</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredCadastrosItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "hover:bg-sidebar-primary text-sidebar-foreground"
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
        )}

        {filteredComprasItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-accent-foreground font-semibold">Compras</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredComprasItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "hover:bg-sidebar-primary text-sidebar-foreground"
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
        )}
      </SidebarContent>
    </Sidebar>
  );
}
