"use client";

// The bar across the top of every admin page: sidebar toggle + where you are.
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { findNav } from "./nav";

export function TopBar({ actions }: { actions?: ReactNode }) {
  const pathname = usePathname();
  const here = findNav(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border/70 bg-background/90 px-4 backdrop-blur sm:px-6">
      <SidebarTrigger className="-ml-1 size-9 text-grey hover:text-ink" />
      <span aria-hidden className="h-4 w-px bg-border" />
      <nav aria-label="Breadcrumb" className="min-w-0 text-[13px]">
        {here ? (
          <ol className="flex items-center gap-2">
            <li className="text-grey">{here.section}</li>
            <li aria-hidden className="text-silver">/</li>
            <li className="truncate font-medium text-ink" aria-current="page">
              {here.item.title}
            </li>
          </ol>
        ) : null}
      </nav>
      {actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}

/** Page title block: an eyebrow, the title, and an optional line under it. */
export function PageTitle({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-8">
      {eyebrow ? (
        <p className="font-mono text-[11px] tracking-[0.2em] text-grey uppercase">{eyebrow}</p>
      ) : null}
      <h1 className="mt-2 text-[28px] leading-tight font-semibold tracking-[-0.02em] text-balance text-ink">
        {title}
      </h1>
      {children ? <div className="mt-2 text-[14px] text-grey">{children}</div> : null}
    </div>
  );
}
