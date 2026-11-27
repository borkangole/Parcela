"use client";

import { ChevronsUpDown, LogOut, Smartphone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { signOut } from "@/lib/auth-client";

export type MenuUser = { name: string; email: string; roleLabel: string };

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function UserMenu({ user }: { user: MenuUser }) {
  const router = useRouter();
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="h-12 gap-3 px-2 text-white hover:bg-ink-2 data-popup-open:bg-ink-2"
              />
            }
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-ink-3 text-[12px] font-semibold tracking-wide">
              {initials(user.name)}
            </span>
            <span className="grid flex-1 text-left leading-tight">
              <span className="truncate text-[13px] font-medium">{user.name}</span>
              <span className="truncate text-[12px] text-white/50">{user.roleLabel}</span>
            </span>
            <ChevronsUpDown className="ml-auto text-white/40" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side={isMobile ? "top" : "right"} align="end" sideOffset={8} className="w-60">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-2 py-1.5">
                <span className="block text-[13px] font-medium text-foreground">{user.name}</span>
                <span className="block truncate text-[12px] font-normal">{user.email}</span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/agent" />} className="gap-2 px-2 py-1.5">
              <Smartphone />
              Preview the agent view
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 px-2 py-1.5"
              onClick={async () => {
                await signOut();
                router.replace("/login");
                router.refresh();
              }}
            >
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
