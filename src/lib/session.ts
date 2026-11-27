// Helpers for server components, server actions, and route handlers.
//
//   const user = await requireUser();                     // must be logged in
//   const user = await requirePermission({ payment: ["verify"] });  // must be allowed
import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";

/** The current session, or null if not logged in. Cached for one request. */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/** The logged-in user. Sends visitors who aren't logged in to /login. */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.user;
}

/** The logged-in user, if their role allows these actions. Otherwise sends them to /no-access. */
export async function requirePermission(permissions: Parameters<typeof can>[1]) {
  const user = await requireUser();
  if (!can(user.role, permissions)) redirect("/no-access");
  return user;
}
