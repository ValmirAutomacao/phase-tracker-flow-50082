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
  Tag
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
              {filteredMenuItems.map((item) => (
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

        {filteredCadastrosItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Cadastros</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredCadastrosItems.map((item) => (
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
        )}

        {filteredComprasItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Compras</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredComprasItems.map((item) => (
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
        )}
      </SidebarContent>
    </Sidebar>
  );
}
