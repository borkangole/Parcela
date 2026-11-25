import { Suspense } from "react";
import { connection } from "next/server";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { lots, projects } from "@/db/schema";

// Temporary home page: confirms the app can read the database.
// Replaced by the admin dashboard once login and the app shell are built.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <header>
        <p className="text-sm font-medium text-neutral-500">AAAC Corporation</p>
        <h1 className="text-3xl font-semibold tracking-tight">Parcela</h1>
        <p className="mt-2 text-neutral-600">Real estate management system</p>
      </header>
      <Suspense fallback={<p className="text-neutral-500">Loading lots…</p>}>
        <LotSummary />
      </Suspense>
    </main>
  );
}

const STATUSES = ["AVAILABLE", "RESERVED", "SOLD", "UNAVAILABLE"] as const;

async function LotSummary() {
  await connection();

  let counts: Record<string, number>;
  let project: string | undefined;
  try {
    const [rows, first] = await Promise.all([
      db
        .select({ status: lots.status, n: count() })
        .from(lots)
        .where(eq(lots.type, "SALEABLE"))
        .groupBy(lots.status),
      db.select({ name: projects.name }).from(projects).limit(1),
    ]);
    counts = Object.fromEntries(rows.map((r) => [r.status, r.n]));
    project = first[0]?.name;
  } catch {
    return (
      <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
        Can&apos;t reach the database. Run <code>npm run db:up</code>, then{" "}
        <code>npm run db:migrate</code> and <code>npm run db:seed</code>.
      </p>
    );
  }

  if (!project) {
    return (
      <p className="rounded-lg border p-4 text-neutral-600">
        Database is connected but empty. Run <code>npm run db:seed</code>.
      </p>
    );
  }

  return (
    <section>
      <h2 className="mb-3 text-lg font-medium">{project}: saleable lots</h2>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATUSES.map((s) => (
          <div key={s} className="rounded-lg border p-4">
            <dt className="text-xs font-medium tracking-wide text-neutral-500">{s}</dt>
            <dd className="mt-1 text-2xl font-semibold">{counts[s] ?? 0}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
