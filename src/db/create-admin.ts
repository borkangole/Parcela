// Creates the first Admin account, the one that creates everyone else's logins.
//
//   npm run create-admin -- "Full Name" email@example.com "a-strong-password"
//
// Run it once per environment (your laptop, then the server).
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { user } from "./auth-schema";

async function main() {
  const [name, email, password] = process.argv.slice(2);
  if (!name || !email || !password) {
    console.error('Usage: npm run create-admin -- "Full Name" email@example.com "password"');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("The password must be at least 8 characters.");
    process.exit(1);
  }

  const existing = await db.select({ id: user.id }).from(user).where(eq(user.email, email.toLowerCase()));
  if (existing.length > 0) {
    console.error(`A user with the email ${email} already exists.`);
    process.exit(1);
  }

  const { auth } = await import("@/lib/auth");
  const created = await auth.api.createUser({
    body: { name, email, password, role: "admin" },
  });

  console.log(`Admin account created: ${created.user.name} <${created.user.email}>`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
