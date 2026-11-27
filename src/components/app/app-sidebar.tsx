"use client";

// The admin sidebar: black, quiet, with a cherry marker on the page you're on.
// Collapses to icons on desktop (Ctrl/Cmd + B) and becomes a slide-out menu on phones.
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ParcelaLogo, ParcelaMark } from "@/components/brand/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { NAV, type NavItem, SETTINGS_ITEM } from "./nav";

export function AppSidebar({ userMenu }: { userMenu: ReactNode }) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="h-16 justify-center px-4 group-data-[collapsible=icon]:px-2">
        <Link
          href="/dashboard"
          className="flex items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          aria-label="Parcela dashboard"
        >
          <ParcelaLogo
            className="text-[12px] text-white group-data-[collapsible=icon]:hidden"
            markClassName="size-7"
          />
          <ParcelaMark className="hidden size-7 text-white group-data-[collapsible=icon]:block" />
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-1 px-2 pt-2">
        {NAV.map((section) => (
          <SidebarGroup key={section.label} className="py-1">
            <SidebarGroupLabel className="h-7 font-mono text-[10px] tracking-[0.2em] text-grey uppercase">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <NavLink key={item.href} item={item} pathname={pathname} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="gap-1 border-t border-sidebar-border px-2 py-3">
        <SidebarMenu>
          <NavLink item={SETTINGS_ITEM} pathname={pathname} />
        </SidebarMenu>
        {userMenu}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const { setOpenMobile } = useSidebar();
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={active}
        tooltip={item.title}
        render={<Link href={item.href} onClick={() => setOpenMobile(false)} />}
        className="nav-link h-9 gap-3 px-3 text-[13.5px] text-white/60 hover:bg-ink-2 hover:text-white data-active:bg-ink-2 data-active:text-white"
      >
        <Icon className="transition-colors" />
        <span>{item.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
