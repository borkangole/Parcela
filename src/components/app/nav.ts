// The admin menu: one place to add, rename or reorder pages.
import {
  Banknote,
  Contact,
  FileSignature,
  HandCoins,
  IdCard,
  KeyRound,
  LandPlot,
  LayoutDashboard,
  type LucideIcon,
  MessageSquareText,
  Settings,
} from "lucide-react";

export type NavItem = { title: string; href: string; icon: LucideIcon };
export type NavSection = { label: string; items: NavItem[] };

export const NAV: NavSection[] = [
  { label: "Overview", items: [{ title: "Dashboard", href: "/dashboard", icon: LayoutDashboard }] },
  { label: "Inventory", items: [{ title: "Lots", href: "/lots", icon: LandPlot }] },
  {
    label: "Sales",
    items: [
      { title: "Inquiries", href: "/inquiries", icon: MessageSquareText },
      { title: "Contracts", href: "/contracts", icon: FileSignature },
      { title: "Buyers", href: "/buyers", icon: Contact },
    ],
  },
  {
    label: "Money",
    items: [
      { title: "Payments", href: "/payments", icon: Banknote },
      { title: "Commissions", href: "/commissions", icon: HandCoins },
    ],
  },
  {
    label: "People",
    items: [
      { title: "Agents", href: "/agents", icon: IdCard },
      { title: "Users", href: "/users", icon: KeyRound },
    ],
  },
];

export const SETTINGS_ITEM: NavItem = { title: "Settings", href: "/settings", icon: Settings };

/** The section and page for a path, for breadcrumbs: "Sales / Contracts". */
export function findNav(pathname: string) {
  for (const section of NAV) {
    for (const item of section.items) {
      if (pathname === item.href || pathname.startsWith(`${item.href}/`)) return { section: section.label, item };
    }
  }
  if (pathname.startsWith(SETTINGS_ITEM.href)) return { section: "System", item: SETTINGS_ITEM };
  return null;
}
