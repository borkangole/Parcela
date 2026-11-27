import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageTitle } from "@/components/app/page-header";
import { CollectionsLineChart, SalesBarChart } from "@/components/charts/trend-charts";
import { SiteMap } from "@/components/lots/site-map";
import { STATUS_LABEL, StatusSwatch } from "@/components/lots/lot-status";
import { Skeleton } from "@/components/ui/skeleton";
import { formatLongDate, formatNumber, formatPeso, formatShortDate } from "@/lib/format";
import { type LotStatus } from "@/components/lots/lot-status";
import { getDueThisWeek, getLedger, getMonthlyTrend, getProjectLots } from "@/lib/queries/dashboard";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard | Parcela" };

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}

const ORDER: LotStatus[] = ["SOLD", "RESERVED", "AVAILABLE", "UNAVAILABLE"];

async function Dashboard() {
  await connection();
  const [inventory, ledger, due, trend] = await Promise.all([
    getProjectLots(),
    getLedger(),
    getDueThisWeek(),
    getMonthlyTrend(),
  ]);

  if (!inventory) {
    return (
      <Panel title="No project yet">
        <p className="text-[14px] text-grey">
          The database has no project. Run <code className="text-ink">npm run db:seed</code> to load Costa Preciosa.
        </p>
      </Panel>
    );
  }

  const { counts, total } = inventory;
  const onHold = inventory.lots.filter((l) => l.status === "UNAVAILABLE");
  const sold = counts.SOLD;
  const soldShare = total ? Math.round((sold / total) * 100) : 0;
  const salesYear = trend.reduce((n, m) => n + m.sales, 0);
  const collectedYear = trend.reduce((n, m) => n + m.collected, 0);
  const collectedShare = ledger.contractSales ? Math.round((ledger.collected / ledger.contractSales) * 100) : 0;

  return (
    <div className="dash-enter space-y-6">
      <PageTitle eyebrow="Dashboard" title={inventory.project.name}>
        {formatLongDate(new Date())} · {total} saleable lots in 5 blocks
      </PageTitle>

      {/* Row 1: the plan, and the inventory it adds up to */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel
          title="Site map"
          aside={
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-grey">
              {ORDER.map((s) => (
                <li key={s} className="flex items-center gap-1.5">
                  <StatusSwatch status={s} />
                  {STATUS_LABEL[s]}
                </li>
              ))}
            </ul>
          }
        >
          <SiteMap lots={inventory.lots} />
        </Panel>

        <Panel title="Inventory">
          <p className="text-[44px] leading-none font-semibold tracking-[-0.03em] text-ink tabular-nums">
            {sold}
            <span className="text-[20px] font-medium tracking-normal text-grey"> / {total} sold</span>
          </p>
          <p className="mt-2 text-[13px] text-grey">
            {sold === 0 ? "No lots sold yet." : `${soldShare}% of saleable lots are sold.`}
          </p>

          {/* One bar, split by status */}
          <div className="mt-6 flex h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
            {ORDER.map((s) =>
              counts[s] ? (
                <span
                  key={s}
                  style={{ width: `${(counts[s] / total) * 100}%` }}
                  className={cn(
                    "h-full",
                    s === "SOLD" && "bg-cherry",
                    s === "RESERVED" && "bg-ink",
                    s === "AVAILABLE" && "bg-silver",
                    s === "UNAVAILABLE" && "lot-hatch",
                  )}
                />
              ) : null,
            )}
          </div>

          <dl className="mt-6 divide-y divide-border/70">
            {ORDER.map((s) => (
              <div key={s} className="flex items-center justify-between py-2.5 text-[14px]">
                <dt className="flex items-center gap-2.5 text-grey">
                  <StatusSwatch status={s} />
                  {STATUS_LABEL[s]}
                </dt>
                <dd className="font-medium text-ink tabular-nums">{counts[s]}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>

      {/* Row 2: the money ledger */}
      <section aria-label="Money" className="grid grid-cols-1 overflow-hidden rounded-lg border border-border/80 bg-card sm:grid-cols-2 lg:grid-cols-4">
        <Figure label="Contract sales" value={formatPeso(ledger.contractSales)}>
          {ledger.contracts === 0 ? "No contracts yet" : `${ledger.contracts} active ${ledger.contracts === 1 ? "contract" : "contracts"}`}
        </Figure>
        <Figure label="Collected" value={formatPeso(ledger.collected)}>
          {ledger.contractSales ? `${collectedShare}% of contract sales` : "Verified payments only"}
        </Figure>
        <Figure label="Outstanding" value={formatPeso(ledger.outstanding)}>
          Still owed by buyers
        </Figure>
        <Figure label="Past due" value={formatPeso(ledger.pastDue)} alert={ledger.pastDue > 0}>
          {ledger.pastDueAccounts === 0
            ? "Every account is up to date"
            : `${ledger.pastDueAccounts} ${ledger.pastDueAccounts === 1 ? "account" : "accounts"} behind`}
        </Figure>
      </section>

      {/* Row 3: trends over the last 12 months */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel
          title="Sales per month"
          aside={<span className="text-[13px] text-grey tabular-nums">{formatPeso(salesYear)} in 12 months</span>}
        >
          <SalesBarChart data={trend} />
        </Panel>
        <Panel
          title="Collections"
          aside={<span className="text-[13px] text-grey tabular-nums">{formatPeso(collectedYear)} collected in 12 months</span>}
        >
          <CollectionsLineChart data={trend} />
        </Panel>
      </div>

      {/* Row 4: what needs doing */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Due in the next 7 days" aside={<PanelLink href="/payments">Payments</PanelLink>}>
          {due.length === 0 ? (
            <Empty>No installments fall due this week.</Empty>
          ) : (
            <ul className="divide-y divide-border/70">
              {due.map((d, i) => (
                <li key={i} className="flex items-center justify-between gap-4 py-3 text-[14px]">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{d.buyer}</p>
                    <p className="text-[13px] text-grey">
                      Lot {d.lot} · {d.number === 0 ? "Down payment" : `Installment ${d.number}`}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-medium text-ink tabular-nums">{formatPeso(d.amount_due)}</p>
                    <p className="text-[13px] text-grey">{formatShortDate(d.due_date)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Needs attention" aside={<PanelLink href="/lots">Lots</PanelLink>}>
          {onHold.length === 0 && ledger.pastDueAccounts === 0 ? (
            <Empty>Nothing needs you right now.</Empty>
          ) : (
            <ul className="divide-y divide-border/70">
              {ledger.pastDueAccounts > 0 && (
                <li className="flex items-start gap-3 py-3 text-[14px]">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-cherry" aria-hidden />
                  <div>
                    <p className="font-medium text-ink">
                      {formatPeso(ledger.pastDue)} past due on {ledger.pastDueAccounts}{" "}
                      {ledger.pastDueAccounts === 1 ? "account" : "accounts"}
                    </p>
                    <p className="text-[13px] text-grey">Follow up before adding penalties.</p>
                  </div>
                </li>
              )}
              {onHold.map((l) => (
                <li key={l.code} className="flex items-start gap-3 py-3 text-[14px]">
                  <StatusSwatch status="UNAVAILABLE" className="mt-1" />
                  <div>
                    <p className="font-medium text-ink">
                      Lot {l.code} is on hold
                      <span className="font-normal text-grey">
                        {" "}
                        · Block {l.block} · {formatNumber(l.area)} sq.m.
                      </span>
                    </p>
                    {l.notes ? <p className="text-[13px] text-grey">{l.notes}</p> : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-lg border border-border/80 bg-card p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[14px] font-semibold text-ink">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Figure({
  label,
  value,
  alert,
  children,
}: {
  label: string;
  value: string;
  alert?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="border-border/80 p-6 not-last:border-b sm:nth-[odd]:border-r lg:border-b-0 lg:not-last:border-r">
      <p className="font-mono text-[11px] tracking-[0.16em] text-grey uppercase">{label}</p>
      <p className={cn("mt-3 text-[26px] leading-none font-semibold tracking-[-0.02em] tabular-nums", alert ? "text-cherry" : "text-ink")}>
        {value}
      </p>
      <p className={cn("mt-2 text-[13px]", alert ? "text-cherry" : "text-grey")}>{children}</p>
    </div>
  );
}

function PanelLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group/link flex items-center gap-1 rounded-sm text-[13px] text-grey transition-colors outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
      <ArrowUpRight className="size-3.5 transition-transform duration-200 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
    </Link>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-md bg-muted/60 px-4 py-6 text-center text-[13px] text-grey">{children}</p>;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="mb-8 space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-64" />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Skeleton className="h-[420px] rounded-lg" />
        <Skeleton className="h-[420px] rounded-lg" />
      </div>
      <Skeleton className="h-[130px] rounded-lg" />
    </div>
  );
}
