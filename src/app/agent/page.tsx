// The agent's phone view (first version): which lots are available right now.
// Logging inquiries comes in Step 6.
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ParcelaLogo } from "@/components/brand/logo";
import { SignOutButton } from "@/components/sign-out-button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/format";
import { can } from "@/lib/permissions";
import { getProjectLots } from "@/lib/queries/dashboard";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Available lots | Parcela" };

export default function AgentHome() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border/70 bg-background/90 px-5 backdrop-blur">
        <ParcelaLogo className="text-[12px] text-ink" markClassName="size-7" />
        <SignOutButton />
      </header>
      <main className="mx-auto w-full max-w-xl px-5 py-8">
        <Suspense fallback={<AgentSkeleton />}>
          <AvailableLots />
        </Suspense>
      </main>
    </div>
  );
}

async function AvailableLots() {
  await connection();
  const user = await requirePermission({ lot: ["view"] });
  const data = await getProjectLots();
  const firstName = user.name.split(" ")[0];

  const available = (data?.lots ?? []).filter((l) => l.status === "AVAILABLE");
  const blocks = new Map<string, typeof available>();
  for (const lot of available) {
    const key = lot.block ?? "Other";
    blocks.set(key, [...(blocks.get(key) ?? []), lot]);
  }

  return (
    <div className="dash-enter space-y-8">
      {can(user.role, { lot: ["manage"] }) ? (
        <p className="rounded-md border border-dashed border-silver px-4 py-3 text-[13px] text-grey">
          You&apos;re previewing what agents see.{" "}
          <Link href="/dashboard" className="font-medium text-ink underline-offset-4 hover:underline">
            Back to the dashboard
          </Link>
        </p>
      ) : null}

      <div>
        <p className="font-mono text-[11px] tracking-[0.2em] text-grey uppercase">Hi, {firstName}</p>
        <h1 className="mt-2 text-[28px] leading-tight font-semibold tracking-[-0.02em] text-ink">
          {available.length} lots available
        </h1>
        <p className="mt-1 text-[14px] text-grey">{data?.project.name} · updated live</p>
      </div>

      {[...blocks.entries()].map(([block, lots]) => (
        <section key={block}>
          <h2 className="mb-3 flex items-baseline justify-between text-[14px] font-semibold text-ink">
            Block {block}
            <span className="text-[13px] font-normal text-grey">{lots.length} available</span>
          </h2>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {lots.map((l) => (
              <li key={l.code} className="rounded-md border border-border/80 bg-card px-4 py-3">
                <p className="text-[15px] font-semibold text-ink tabular-nums">{l.code}</p>
                <p className="text-[13px] text-grey tabular-nums">{formatNumber(l.area)} sq.m.</p>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {available.length === 0 ? (
        <p className="rounded-md bg-muted/60 px-4 py-8 text-center text-[14px] text-grey">
          No lots are available right now.
        </p>
      ) : null}
    </div>
  );
}

function AgentSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-8 w-52" />
      <div className="grid grid-cols-2 gap-2 pt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-md" />
        ))}
      </div>
    </div>
  );
}
