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
import { Logo } from '@admin/logo';
import { type ResourceConfig, resourceConfigs } from '@admin/resource-config';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { ChevronRight, ChevronsUpDown, ExternalLink, Flame, LogOut } from 'lucide-react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useShallow } from 'zustand/react/shallow';
import { ModeToggle } from './mode-toggle';

interface NavItem {
  label: string;
  href: string;
}

function subItems(resource: ResourceConfig): NavItem[] {
  const items: NavItem[] = [{ label: 'Lista alla', href: `/${resource.name}` }];
  if (resource.canCreate) items.push({ label: 'Skapa ny', href: `/${resource.name}/new` });
  if (resource.extraNav) items.push(...resource.extraNav);
  return items;
}

export function AppSidebar() {
  const router = useRouter();
  const [municipalityId, setMunicipalityId] = useLocalStorage(
    useShallow((s) => [s.municipalityId, s.setMunicipalityId])
  );
  const pathOnly = router.asPath.split('?')[0];
  const active = (name: string) => pathOnly === `/${name}` || pathOnly.startsWith(`/${name}/`);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <NextLink
          href="/"
          className="flex items-center overflow-hidden rounded-md p-1.5 hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1"
          aria-label="Draken – till startsidan"
        >
          {/* Compact mark when collapsed to the icon rail */}
          <div className="hidden aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground group-data-[collapsible=icon]:flex">
            <Flame className="size-5" />
          </div>
          {/* Sundsvalls kommun logo when expanded */}
          <Logo className="h-8 w-auto shrink-0 text-sidebar-foreground group-data-[collapsible=icon]:hidden" />
        </NextLink>
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
                        {subItems(resource).map((item) => (
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
                    <AvatarFallback className="rounded-lg text-xs">ME</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate text-sm font-medium">Max Eriksson</span>
                    <span className="truncate text-xs text-muted-foreground">max.z.eriksson@sundsvall.se</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Max Eriksson</span>
                    <span className="text-xs text-muted-foreground">max.z.eriksson@sundsvall.se</span>
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
