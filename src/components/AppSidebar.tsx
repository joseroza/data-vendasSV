import {
  LayoutDashboard, Users, Droplets, Smartphone, AlertTriangle, Settings, ChevronDown,
  ShoppingCart, List, BookOpen
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Cobranças", url: "/cobrancas", icon: AlertTriangle },
];

const perfumeItems = [
  { title: "Nova Venda", url: "/perfumes/nova-venda", icon: ShoppingCart },
  { title: "Vendas", url: "/perfumes/vendas", icon: List },
  { title: "Catálogo", url: "/perfumes/catalogo", icon: BookOpen },
];

const eletronicosItems = [
  { title: "Nova Venda", url: "/eletronicos/nova-venda", icon: ShoppingCart },
  { title: "Vendas", url: "/eletronicos/vendas", icon: List },
  { title: "Catálogo", url: "/eletronicos/catalogo", icon: BookOpen },
];

const settingsItems = [
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const isPerfumeActive = perfumeItems.some((i) => isActive(i.url));
  const isEletronicosActive = eletronicosItems.some((i) => isActive(i.url));

  const linkClass = "flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-sm";
  const activeClass = "bg-sidebar-accent text-primary font-medium";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm font-display">SV</span>
            </div>
            <span className="font-display font-bold text-sidebar-accent-foreground">Sales View</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <span className="text-primary-foreground font-bold text-sm font-display">SV</span>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="py-2">
        {/* Main */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/50 px-3">
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={linkClass} activeClassName={activeClass}>
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Perfumes */}
        {!collapsed ? (
          <Collapsible defaultOpen={isPerfumeActive} className="group/collapsible">
            <SidebarGroup>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-1.5 text-xs uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground/80 transition-colors">
                <div className="flex items-center gap-2">
                  <Droplets className="h-3.5 w-3.5" />
                  <span>Perfumes</span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {perfumeItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} end className={linkClass} activeClassName={activeClass}>
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ) : (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/perfumes/vendas" className={linkClass} activeClassName={activeClass}>
                      <Droplets className="h-4 w-4 shrink-0" />
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Eletrônicos */}
        {!collapsed ? (
          <Collapsible defaultOpen={isEletronicosActive} className="group/collapsible">
            <SidebarGroup>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-1.5 text-xs uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground/80 transition-colors">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>Eletrônicos</span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {eletronicosItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} end className={linkClass} activeClassName={activeClass}>
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ) : (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/eletronicos/vendas" className={linkClass} activeClassName={activeClass}>
                      <Smartphone className="h-4 w-4 shrink-0" />
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Settings */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={linkClass} activeClassName={activeClass}>
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
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
