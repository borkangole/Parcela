// Who can do what in Parcela.
//
// Each "statement" is a resource and the actions on it. Each role gets a subset.
// This file is shared by the server (to enforce) and the browser (to hide buttons),
// so it must not import anything server-only.
//
// Row-level rules (for example, agents seeing only THEIR OWN inquiries and buyers)
// are enforced in the database queries, not here.
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/admin/access";

export const statements = {
  ...defaultStatements, // user + session management, used by Better Auth's admin plugin
  lot: ["view", "manage"],
  agent: ["view", "manage"],
  buyer: ["view", "manage"],
  inquiry: ["view", "manage"],
  contract: ["view", "create", "cancel"],
  payment: ["view", "record", "verify", "void"],
  commission: ["view", "manage"],
  report: ["view"],
  settings: ["manage"], // commission rules, company settings
} as const;

export const ac = createAccessControl(statements);

// Admin: the company side (owner and office). Can do everything.
export const admin = ac.newRole({
  user: ["create", "list", "set-role", "ban", "set-password", "get", "update"],
  session: ["list", "revoke"],
  lot: ["view", "manage"],
  agent: ["view", "manage"],
  buyer: ["view", "manage"],
  inquiry: ["view", "manage"],
  contract: ["view", "create", "cancel"],
  payment: ["view", "record", "verify", "void"],
  commission: ["view", "manage"],
  report: ["view"],
  settings: ["manage"],
});

// Agent (phone): sees lots, logs inquiries, sees only their own buyers and sales.
export const agent = ac.newRole({
  lot: ["view"],
  inquiry: ["view", "manage"],
  buyer: ["view"],
  contract: ["view"],
  payment: ["view"],
});

// More roles can be added later (for example an Accountant who verifies payments
// but can't change lots): define them here and add them to `roles`. No database change needed.
export const roles = { admin, agent };

export type RoleName = keyof typeof roles;

export const ROLE_LABELS: Record<RoleName, string> = {
  admin: "Admin",
  agent: "Agent",
};

type Permissions = {
  [K in keyof typeof statements]?: (typeof statements)[K][number][];
};

/** True if this role may do all of the given actions. */
export function can(role: string | null | undefined, permissions: Permissions): boolean {
  const r = roles[role as RoleName];
  if (!r) return false;
  return r.authorize(permissions as never).success;
}
