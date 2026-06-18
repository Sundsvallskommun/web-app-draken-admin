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
  SidebarRail,
} from '@components/ui/sidebar';
import { pocResources } from '@poc/poc-resources';
import { ChevronsUpDown, ExternalLink, Flame, LogOut } from 'lucide-react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { ModeToggle } from './mode-toggle';

export function AppSidebar() {
  const router = useRouter();
  const active = (name: string) => router.asPath.startsWith(`/poc/${name}`);

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
              const implemented = resource.name === 'statuses';
              return (
                <SidebarMenuItem key={resource.name}>
                  {implemented ? (
                    <SidebarMenuButton asChild isActive={active(resource.name)} tooltip={resource.label}>
                      <NextLink href={`/poc/${resource.name}`}>
                        <Icon />
                        <span>{resource.label}</span>
                      </NextLink>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton
                      tooltip={resource.label}
                      onClick={() => toast.info('Endast "Statusar" är med i PoC:n ännu.')}
                    >
                      <Icon />
                      <span>{resource.label}</span>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-2">
        <div className="group-data-[collapsible=icon]:hidden">
          <Select defaultValue="2281">
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
