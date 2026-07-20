import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  BookOpen,
  Dumbbell,
  Heart,
  LayoutDashboard,
  type LucideIcon,
  Moon,
  Plug,
  Ruler,
  Scale,
  Settings,
  UtensilsCrossed,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type NavItem = { title: string; url: string; icon: LucideIcon };

const trackingItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Weight", url: "/weight", icon: Scale },
  { title: "Nutrition", url: "/nutrition", icon: UtensilsCrossed },
  { title: "Sleep", url: "/sleep", icon: Moon },
  { title: "Training", url: "/training", icon: Dumbbell },
  { title: "Recovery", url: "/recovery", icon: Heart },
  { title: "Measurements", url: "/measurements", icon: Ruler },
  { title: "Journal", url: "/journal", icon: BookOpen },
];

const insightsItems: NavItem[] = [
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

const systemItems: NavItem[] = [
  { title: "Integrations", url: "/integrations", icon: Plug },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) => pathname === url;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
            Vitals
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavGroup label="Tracking" items={trackingItems} isActive={isActive} />
        <NavGroup label="Insights" items={insightsItems} isActive={isActive} />
        <NavGroup label="System" items={systemItems} isActive={isActive} />
      </SidebarContent>
    </Sidebar>
  );
}

function NavGroup({
  label,
  items,
  isActive,
}: {
  label: string;
  items: NavItem[];
  isActive: (url: string) => boolean;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                <Link to={item.url} className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
