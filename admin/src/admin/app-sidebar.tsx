import { Avatar, AvatarFallback } from '@components/ui/avatar';
import { Button } from '@components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@components/ui/sidebar';
import { EnvironmentIndicator } from '@admin/environment-indicator';
import { Logo } from '@admin/logo';
import { LogoMark } from '@admin/logo-mark';
import { type ResourceConfig, type ResourceNavItem, resourceConfigs } from '@admin/resource-config';
import { useUserStore } from '@services/user-service/user-service';
import { cn } from '@utils/cn';
import { useAdminEnvironment } from '@utils/use-is-production-env.hook';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { ChevronRight, ChevronsUpDown, ExternalLink, LogOut } from 'lucide-react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useShallow } from 'zustand/react/shallow';
import { ModeToggle } from './mode-toggle';

function subItems(resource: ResourceConfig, showTestFeatures: boolean): ResourceNavItem[] {
  const items: ResourceNavItem[] = [{ label: 'Lista alla', href: `/${resource.name}` }];
  if (resource.canCreate) items.push({ label: 'Skapa ny', href: `/${resource.name}/new` });
  if (resource.extraNav) items.push(...resource.extraNav.filter((item) => !item.testOnly || showTestFeatures));
  return items;
}

export function AppSidebar() {
  const router = useRouter();
  const user = useUserStore(useShallow((s) => s.user));
  const { environment, showTestFeatures } = useAdminEnvironment();
  const [municipalityId, setMunicipalityId] = useLocalStorage(
    useShallow((s) => [s.municipalityId, s.setMunicipalityId])
  );
  const pathOnly = router.asPath.split('?')[0];
  const active = (name: string) => pathOnly === `/${name}` || pathOnly.startsWith(`/${name}/`);
  const displayName = user.name || user.username || 'Inloggad användare';
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <Sidebar collapsible="icon" className={cn('border-l-4', environment.sidebarAccentClassName)}>
      <SidebarHeader>
        <NextLink
          href="/"
          className="flex items-center overflow-hidden rounded-md p-1.5 hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1"
          aria-label="Draken – till startsidan"
        >
          {/* Compact Sundsvall mark when collapsed to the icon rail */}
          <LogoMark className="hidden h-8 w-auto shrink-0 text-sidebar-foreground group-data-[collapsible=icon]:block" />
          {/* Sundsvalls kommun logo when expanded */}
          <Logo className="h-8 w-auto shrink-0 text-sidebar-foreground group-data-[collapsible=icon]:hidden" />
        </NextLink>
        <EnvironmentIndicator
          environment={environment}
          className="mx-1.5 justify-center group-data-[collapsible=icon]:hidden"
        />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Resurser</SidebarGroupLabel>
          <SidebarMenu>
            {resourceConfigs.map((resource) => {
              const Icon = resource.icon;
              const isActive = active(resource.name);
              return (
                <Collapsible key={resource.name} asChild defaultOpen={isActive} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={resource.label} isActive={isActive}>
                        <Icon />
                        <span>{resource.label}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {subItems(resource, showTestFeatures).map((item) => (
                          <SidebarMenuSubItem key={item.href}>
                            <SidebarMenuSubButton asChild isActive={pathOnly === item.href}>
                              <NextLink href={item.href}>{item.label}</NextLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-2">
        {/* Hidden when the sidebar is collapsed to the icon rail */}
        <div className="flex flex-col gap-2 group-data-[collapsible=icon]:hidden">
          <Select value={String(municipalityId)} onValueChange={(v) => setMunicipalityId(Number(v))}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2281">Sundsvall</SelectItem>
              <SelectItem value="2260">Ånge</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="w-full justify-between" asChild>
            <a href="https://smaug-test.sundsvall.se/start" target="_blank" rel="noreferrer">
              Smaug
              <ExternalLink className="size-4" />
            </a>
          </Button>

          <ModeToggle className="w-full justify-start" />
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg text-xs">{initials || 'DU'}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate text-sm font-medium">{displayName}</span>
                    {user.username && <span className="truncate text-xs text-muted-foreground">{user.username}</span>}
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{displayName}</span>
                    {user.username && <span className="text-xs text-muted-foreground">{user.username}</span>}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <NextLink href="/logout">
                    <LogOut className="size-4" />
                    Logga ut
                  </NextLink>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
