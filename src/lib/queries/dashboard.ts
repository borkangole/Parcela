// Numbers for the admin dashboard. Everything is calculated from the records,
// never typed in: contract sales, cash collected, outstanding, past due.
import "server-only";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { BLOCKS } from "@/data/costa-preciosa";
import { blocks, lots, projects } from "@/db/schema";

import type { LotStatus } from "@/components/lots/lot-status";
export type { LotStatus };

export async function getProjectLots() {
  const [project] = await db.select().from(projects).orderBy(asc(projects.createdAt)).limit(1);
  if (!project) return null;

  const rows = await db
    .select({ code: lots.code, status: lots.status, area: lots.area, block: blocks.name, notes: lots.notes })
    .from(lots)
    .leftJoin(blocks, eq(blocks.id, lots.blockId))
    .where(and(eq(lots.projectId, project.id), eq(lots.type, "SALEABLE")));

  // Plan order: Block 1, 2A, 2B, 3, 4, and A, B, C… within each block.
  const planOrder = new Map<string, number>();
  BLOCKS.forEach((b, bi) => b.lots.forEach(([letter], li) => planOrder.set(`466-${letter}`, bi * 100 + li)));
  rows.sort((a, b) => (planOrder.get(a.code) ?? 1e6) - (planOrder.get(b.code) ?? 1e6) || a.code.localeCompare(b.code));

  const counts: Record<LotStatus, number> = { AVAILABLE: 0, RESERVED: 0, SOLD: 0, UNAVAILABLE: 0 };
  for (const r of rows) counts[r.status]++;

  return {
    project: { name: project.name },
    lots: rows.map((r) => ({ ...r, area: Number(r.area) })),
    counts,
    total: rows.length,
  };
}

/**
 * Money, in pesos.
 * - contractSales: total price of every contract that isn't cancelled
 * - collected:     verified, non-voided payments on those contracts
 * - outstanding:   contractSales - collected
 * - pastDue:       per contract, what was due before today minus what was paid (never below 0)
 */
export async function getLedger() {
  const result = await db.execute<{
    contracts: string;
    contract_sales: string;
    collected: string;
    past_due: string;
    past_due_accounts: string;
  }>(sql`
    with open_contracts as (
      select id, total_price from contracts where status <> 'CANCELLED'
    ),
    paid as (
      select p.contract_id, sum(p.amount) as amount
      from payments p
      join open_contracts c on c.id = p.contract_id
      where p.verified_at is not null and p.voided_at is null
      group by p.contract_id
    ),
    due_so_far as (
      select i.contract_id, sum(i.amount_due) as amount
      from installments i
      join open_contracts c on c.id = i.contract_id
      where i.due_date < date_trunc('day', now() at time zone 'Asia/Manila') at time zone 'Asia/Manila'
      group by i.contract_id
    ),
    late as (
      select greatest(coalesce(d.amount, 0) - coalesce(p.amount, 0), 0) as amount
      from open_contracts c
      left join due_so_far d on d.contract_id = c.id
      left join paid p on p.contract_id = c.id
    )
    select
      (select count(*) from open_contracts)                       as contracts,
      (select coalesce(sum(total_price), 0) from open_contracts)  as contract_sales,
      (select coalesce(sum(amount), 0) from paid)                 as collected,
      (select coalesce(sum(amount), 0) from late)                 as past_due,
      (select count(*) from late where amount > 0)                as past_due_accounts
  `);
  const r = result.rows[0];
  const contractSales = Number(r.contract_sales);
  const collected = Number(r.collected);
  return {
    contracts: Number(r.contracts),
    contractSales,
    collected,
    outstanding: Math.max(contractSales - collected, 0),
    pastDue: Number(r.past_due),
    pastDueAccounts: Number(r.past_due_accounts),
  };
}

/** Installments falling due in the next 7 days (Philippine time), soonest first. */
export async function getDueThisWeek(limit = 6) {
  const result = await db.execute<{
    due_date: Date;
    amount_due: string;
    number: number;
    buyer: string;
    lot: string;
  }>(sql`
    select i.due_date, i.amount_due, i.number, b.full_name as buyer, l.code as lot
    from installments i
    join contracts c on c.id = i.contract_id and c.status <> 'CANCELLED'
    join buyers b on b.id = c.buyer_id
    join lots l on l.id = c.lot_id
    where i.due_date >= date_trunc('day', now() at time zone 'Asia/Manila') at time zone 'Asia/Manila'
      and i.due_date <  date_trunc('day', now() at time zone 'Asia/Manila') at time zone 'Asia/Manila' + interval '7 days'
    order by i.due_date
    limit ${limit}
  `);
  return result.rows.map((r) => ({ ...r, amount_due: Number(r.amount_due), due_date: new Date(r.due_date) }));
}

export type MonthPoint = { month: string; sales: number; contracts: number; collected: number; scheduled: number };

/**
 * The last 12 months (Philippine time), oldest first, every month present even when zero:
 * - sales / contracts: value and number of contracts signed that month (not cancelled)
 * - collected:         verified, non-voided payments received that month
 * - scheduled:         installments that fell due that month
 */
export async function getMonthlyTrend(): Promise<MonthPoint[]> {
  const result = await db.execute<{
    month: string;
    sales: string;
    contracts: string;
    collected: string;
    scheduled: string;
  }>(sql`
    with months as (
      select generate_series(
        date_trunc('month', now() at time zone 'Asia/Manila') - interval '11 months',
        date_trunc('month', now() at time zone 'Asia/Manila'),
        interval '1 month'
      ) as m
    ),
    s as (
      select date_trunc('month', reserved_at at time zone 'Asia/Manila') as m, sum(total_price) as v, count(*) as n
      from contracts where status <> 'CANCELLED' group by 1
    ),
    c as (
      select date_trunc('month', p.paid_at at time zone 'Asia/Manila') as m, sum(p.amount) as v
      from payments p join contracts k on k.id = p.contract_id and k.status <> 'CANCELLED'
      where p.verified_at is not null and p.voided_at is null group by 1
    ),
    d as (
      select date_trunc('month', i.due_date at time zone 'Asia/Manila') as m, sum(i.amount_due) as v
      from installments i join contracts k on k.id = i.contract_id and k.status <> 'CANCELLED' group by 1
    )
    select to_char(months.m, 'YYYY-MM') as month,
           coalesce(s.v, 0) as sales, coalesce(s.n, 0) as contracts,
           coalesce(c.v, 0) as collected, coalesce(d.v, 0) as scheduled
    from months
    left join s on s.m = months.m
    left join c on c.m = months.m
    left join d on d.m = months.m
    order by months.m
  `);
  return result.rows.map((r) => ({
    month: r.month,
    sales: Number(r.sales),
    contracts: Number(r.contracts),
    collected: Number(r.collected),
    scheduled: Number(r.scheduled),
  }));
}
