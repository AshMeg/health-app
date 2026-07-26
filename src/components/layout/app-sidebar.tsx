import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  BookOpen,
  Droplets,
  Dumbbell,
  Flower2,
  Heart,
  LayoutDashboard,
  type LucideIcon,
  Moon,
  Plug,
  Ruler,
  Scale,
  Settings,
  Sprout,
  Target,
  UtensilsCrossed,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  useSidebar,
} from "@/components/ui/sidebar";

type NavItem = { title: string; url: string; icon: LucideIcon };

/** Always visible, expanded or collapsed — the three places you live in. */
const primaryItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Goals", url: "/goals", icon: Target },
  { title: "Your Garden", url: "/garden", icon: Flower2 },
];

/** Every page that answers a question about one part of your health. */
const healthItems: NavItem[] = [
  { title: "Weight", url: "/weight", icon: Scale },
  { title: "Nutrition", url: "/nutrition", icon: UtensilsCrossed },
  { title: "Sleep", url: "/sleep", icon: Moon },
  { title: "Training", url: "/training", icon: Dumbbell },
  { title: "Recovery", url: "/recovery", icon: Heart },
  { title: "Cycle", url: "/cycle", icon: Droplets },
  { title: "Measurements", url: "/measurements", icon: Ruler },
  { title: "Journal", url: "/journal", icon: BookOpen },
];

const insightsItems: NavItem[] = [{ title: "Analytics", url: "/analytics", icon: BarChart3 }];

const systemItems: NavItem[] = [
  { title: "Integrations", url: "/integrations", icon: Plug },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { state, isMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  const isActive = (url: string) => pathname === url || pathname.startsWith(`${url}/`);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sage-soft">
            <Sprout className="h-4 w-4 text-sage" />
          </div>
          <span className="font-display text-base font-medium group-data-[collapsible=icon]:hidden">
            Bloom
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavGroup items={primaryItems} isActive={isActive} />

        {collapsed ? (
          /* Collapsed: everything else folds into one Health menu. */
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton
                        tooltip="Health"
                        isActive={[...healthItems, ...insightsItems, ...systemItems].some((i) =>
                          isActive(i.url),
                        )}
                      >
                        <Activity className="h-4 w-4" />
                        <span>Health</span>
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start" className="w-52">
                      <DropdownMenuLabel className="font-normal text-muted-foreground">
                        Health
                      </DropdownMenuLabel>
                      {healthItems.map((item) => (
                        <MenuLink key={item.url} item={item} />
                      ))}
                      <DropdownMenuSeparator />
                      {[...insightsItems, ...systemItems].map((item) => (
                        <MenuLink key={item.url} item={item} />
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <>
            <NavGroup label="Health" items={healthItems} isActive={isActive} />
            <NavGroup label="Insights" items={insightsItems} isActive={isActive} />
            <NavGroup label="System" items={systemItems} isActive={isActive} />
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}

function MenuLink({ item }: { item: NavItem }) {
  return (
    <DropdownMenuItem asChild>
      <Link to={item.url} className="cursor-pointer">
        <item.icon className="mr-2 h-4 w-4" />
        {item.title}
      </Link>
    </DropdownMenuItem>
  );
}

function NavGroup({
  label,
  items,
  isActive,
}: {
  label?: string;
  items: NavItem[];
  isActive: (url: string) => boolean;
}) {
  return (
    <SidebarGroup>
      {label ? (
        <SidebarGroupLabel className="text-xs font-normal tracking-normal text-muted-foreground normal-case">
          {label}
        </SidebarGroupLabel>
      ) : null}
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
