// The admin area: sidebar + top bar around every page in this folder.
// Admins only. Agents are sent to their own phone view at /agent.
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppSidebar } from "@/components/app/app-sidebar";
import { TopBar } from "@/components/app/page-header";
import { UserMenu } from "@/components/app/user-menu";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { can, ROLE_LABELS, type RoleName } from "@/lib/permissions";
import { requireUser } from "@/lib/session";

export default function AdminLayout({ children }: LayoutProps<"/">) {
  return (
    <SidebarProvider>
      <AppSidebar
        userMenu={
          <Suspense fallback={<div className="h-12" />}>
            <SignedInUser />
          </Suspense>
        }
      />
      <SidebarInset className="min-w-0 bg-background">
        <TopBar />
        <div className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-8 sm:px-8 sm:py-10">
          <Suspense fallback={null}>
            <AdminOnly>{children}</AdminOnly>
          </Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

async function SignedInUser() {
  const user = await requireUser();
  return (
    <UserMenu
      user={{ name: user.name, email: user.email, roleLabel: ROLE_LABELS[user.role as RoleName] ?? "User" }}
    />
  );
}

async function AdminOnly({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (!can(user.role, { lot: ["manage"] })) redirect("/agent");
  return children;
}
