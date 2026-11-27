// Better Auth: login, sessions, and user management.
// Server code only: never import this from a "use client" file (use auth-client.ts there).
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { ac, roles } from "@/lib/permissions";

export const auth = betterAuth({
  appName: "Parcela",
  database: drizzleAdapter(db, { provider: "pg", schema }),

  emailAndPassword: {
    enabled: true,
    // Nobody can create their own account. An admin creates every user.
    disableSignUp: true,
    minPasswordLength: 8,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // stay logged in for 7 days
    updateAge: 60 * 60 * 24, // refresh the session once a day while in use
  },

  plugins: [
    adminPlugin({
      ac,
      roles,
      defaultRole: "agent", // safest default: the role with the fewest permissions
      adminRoles: ["admin"],
      bannedUserMessage: "Your account has been deactivated. Please contact the administrator.",
    }),
    nextCookies(), // must be last: lets server actions set the login cookie
  ],
});

export type Session = typeof auth.$Infer.Session;
