import {
  LayoutDashboard, Users, Droplets, Smartphone, AlertTriangle,
  Settings, ChevronDown, List, Package, Shield,
  ShoppingCart, BarChart2, Warehouse,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const mainItems = [
  { title: "Dashboard",   url: "/",           icon: LayoutDashboard },
  { title: "Clientes",    url: "/clientes",   icon: Users },
  { title: "Cobranças",   url: "/cobrancas",  icon: AlertTriangle },
];

const perfumeItems = [
  { title: "Vendas",   url: "/perfumes/vendas",   icon: List },
  { title: "Estoque",  url: "/perfumes/catalogo", icon: Package },
];

const eletronicosItems = [
  { title: "Vendas",   url: "/eletronicos/vendas",   icon: List },
  { title: "Estoque",  url: "/eletronicos/catalogo", icon: Package },
];

const operacoesItems = [
  { title: "Compras",    url: "/compras",    icon: ShoppingCart },
  { title: "Estoque",    url: "/estoque",    icon: Warehouse },
  { title: "Relatórios", url: "/relatorios", icon: BarChart2 },
];

const supportItems = [
  { title: "Configurações", url: "/configuracoes", icon: Settings },
  { title: "Admin",          url: "/admin",          icon: Shield },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location  = useLocation();
  const path      = location.pathname;

  const isPerfumeActive     = perfumeItems.some((i)     => path.startsWith(i.url));
  const isEletronicosActive = eletronicosItems.some((i) => path.startsWith(i.url));
  const isOperacoesActive   = operacoesItems.some((i)   => path.startsWith(i.url));

  const link   = "flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-sm";
  const active = "bg-sidebar-accent text-primary font-medium";

  function NavItem({ url, icon: Icon, title }: { url: string; icon: React.ElementType; title: string }) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <NavLink to={url} end className={link} activeClassName={active}>
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{title}</span>}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  function CollapseGroup({
    label, icon: Icon, items, defaultOpen,
  }: { label: string; icon: React.ElementType; items: { title: string; url: string; icon: React.ElementType }[]; defaultOpen: boolean }) {
    if (collapsed) {
      return (
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to={items[0].url} className={link} activeClassName={active}>
                    <Icon className="h-4 w-4 shrink-0" />
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      );
    }
    return (
      <SidebarGroup>
        <Collapsible defaultOpen={defaultOpen}>
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:text-sidebar-foreground px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors">
              <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
              <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]:rotate-180" />
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <NavItem key={item.url} url={item.url} icon={item.icon} title={item.title} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </Collapsible>
      </SidebarGroup>
    );
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">SV</span>
            </div>
            <span className="font-semibold text-sm">Sales View</span>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="gap-0">
        {/* Geral */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-xs uppercase tracking-wide px-3 mb-1">Geral</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <NavItem key={item.url} url={item.url} icon={item.icon} title={item.title} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Perfumes */}
        <CollapseGroup label="Perfumes" icon={Droplets} items={perfumeItems} defaultOpen={isPerfumeActive} />

        {/* Eletrônicos */}
        <CollapseGroup label="Eletrônicos" icon={Smartphone} items={eletronicosItems} defaultOpen={isEletronicosActive} />

        {/* Operações */}
        <CollapseGroup label="Operações" icon={BarChart2} items={operacoesItems} defaultOpen={isOperacoesActive} />

        {/* Suporte */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-xs uppercase tracking-wide px-3 mb-1">Sistema</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {supportItems.map((item) => (
                <NavItem key={item.url} url={item.url} icon={item.icon} title={item.title} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}