import { Avatar, AvatarFallback } from '@components/ui/avatar';
import { Badge } from '@components/ui/badge';
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
import { type PocResource, pocResources } from '@poc/poc-resources';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { ChevronRight, ChevronsUpDown, ExternalLink, Flame, LogOut } from 'lucide-react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';
import { ModeToggle } from './mode-toggle';

interface NavItem {
  label: string;
  href: string;
}

function subItems(resource: PocResource): NavItem[] {
  const items: NavItem[] = [{ label: 'Lista alla', href: `/poc/${resource.name}` }];
  if (resource.canCreate) items.push({ label: 'Skapa ny', href: `/poc/${resource.name}/new` });
  if (resource.extraNav) items.push(...resource.extraNav);
  return items;
}

export function AppSidebar() {
  const router = useRouter();
  const [municipalityId, setMunicipalityId] = useLocalStorage(
    useShallow((s) => [s.municipalityId, s.setMunicipalityId])
  );
  const pathOnly = router.asPath.split('?')[0];
  const active = (name: string) => pathOnly === `/poc/${name}` || pathOnly.startsWith(`/poc/${name}/`);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Flame className="size-5" />
          </div>
          <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-semibold">Draken Admin</span>
            <span className="truncate text-xs text-muted-foreground">shadcn PoC</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Resurser</SidebarGroupLabel>
          <SidebarMenu>
            {pocResources.map((resource) => {
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
        <div className="group-data-[collapsible=icon]:hidden">
          <Select value={String(municipalityId)} onValueChange={(v) => setMunicipalityId(Number(v))}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2281">Sundsvall</SelectItem>
              <SelectItem value="2260">Ånge</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" className="w-full justify-between group-data-[collapsible=icon]:hidden" asChild>
          <a href="https://smaug-test.sundsvall.se/start" target="_blank" rel="noreferrer">
            Smaug
            <ExternalLink className="size-4" />
          </a>
        </Button>

        <div className="flex items-center gap-2 group-data-[collapsible=icon]:flex-col">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex-1 justify-start gap-2 px-2">
                <Avatar className="size-7">
                  <AvatarFallback className="text-xs">ME</AvatarFallback>
                </Avatar>
                <span className="truncate group-data-[collapsible=icon]:hidden">Max Eriksson</span>
                <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Max Eriksson</span>
                  <span className="text-xs text-muted-foreground">max.z.eriksson@sundsvall.se</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toast('Utloggning (PoC – ingen riktig session).')}>
                <LogOut className="size-4" />
                Logga ut
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ModeToggle className="group-data-[collapsible=icon]:w-full" />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
