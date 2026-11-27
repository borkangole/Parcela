"use client";

// Dashboard trend charts (Recharts). One axis each; recessive grid; hover for exact values.
// Black and grey only: cherry stays reserved for "sold" and "past due".
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatPeso } from "@/lib/format";
import type { MonthPoint } from "@/lib/queries/dashboard";

const INK = "#0b0b0b";
const GREY = "#6b6b6b";
const GRID = "#ececec";
const AXIS_TEXT = { fill: GREY, fontSize: 12 };

const compactPeso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  notation: "compact",
  maximumFractionDigits: 1,
});

/** "2026-11" -> "Nov", and "Jan '27" at the start of a year. */
function monthTick(m: string) {
  const [y, mo] = m.split("-").map(Number);
  const name = new Date(y, mo - 1, 1).toLocaleDateString("en-PH", { month: "short" });
  return mo === 1 ? `${name} '${String(y).slice(2)}` : name;
}
function monthLong(m: string) {
  const [y, mo] = m.split("-").map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString("en-PH", { month: "long", year: "numeric" });
}

function TooltipCard({ title, rows }: { title: string; rows: { label: string; value: string; dash?: boolean; color?: string }[] }) {
  return (
    <div className="min-w-44 rounded-md border border-border bg-popover px-3 py-2.5 text-[12px] shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)]">
      <p className="mb-1.5 font-medium text-ink">{title}</p>
      {rows.map((r) => (
        <p key={r.label} className="flex items-center justify-between gap-6 text-grey">
          <span className="flex items-center gap-2">
            {r.color ? (
              <span
                aria-hidden
                className="inline-block w-3 border-t-2"
                style={{ borderColor: r.color, borderTopStyle: r.dash ? "dashed" : "solid" }}
              />
            ) : null}
            {r.label}
          </span>
          <span className="font-medium text-ink tabular-nums">{r.value}</span>
        </p>
      ))}
    </div>
  );
}

function EmptyOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <p className="rounded-md bg-background/90 px-3 py-1.5 text-[13px] text-grey">{children}</p>
    </div>
  );
}

const yAxisProps = {
  tickFormatter: (v: number) => (v === 0 ? "0" : compactPeso.format(v)),
  tick: AXIS_TEXT,
  axisLine: false,
  tickLine: false,
  width: 56,
} as const;
const xAxisProps = { dataKey: "month", tickFormatter: monthTick, tick: AXIS_TEXT, axisLine: false, tickLine: false, interval: 0 } as const;

/** Bar chart: value of contracts signed per month. */
export function SalesBarChart({ data }: { data: MonthPoint[] }) {
  const empty = data.every((d) => d.sales === 0);
  return (
    <div className="relative h-60">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis {...xAxisProps} />
          <YAxis {...yAxisProps} />
          <Tooltip
            cursor={{ fill: "#f3f3f3" }}
            content={(p) => {
              const d = p.payload?.[0]?.payload as MonthPoint | undefined;
              if (!p.active || !d) return null;
              return (
                <TooltipCard
                  title={monthLong(d.month)}
                  rows={[
                    { label: "Contract value", value: formatPeso(d.sales) },
                    { label: "Contracts signed", value: String(d.contracts) },
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="sales" fill={INK} radius={[4, 4, 0, 0]} maxBarSize={28} activeBar={{ fill: "#333333" }} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
      {empty ? <EmptyOverlay>No contracts signed in the last 12 months.</EmptyOverlay> : null}
    </div>
  );
}

/** Line chart: cash collected vs installments scheduled, per month. */
export function CollectionsLineChart({ data }: { data: MonthPoint[] }) {
  const empty = data.every((d) => d.collected === 0 && d.scheduled === 0);
  return (
    <div>
      {/* Legend: line style + name, so the two series never depend on colour alone */}
      <ul className="mb-3 flex items-center gap-5 text-[12px] text-grey">
        <li className="flex items-center gap-2">
          <span aria-hidden className="inline-block w-4 border-t-2 border-ink" />
          Collected
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden className="inline-block w-4 border-t-2 border-dashed border-grey" />
          Scheduled
        </li>
      </ul>
      <div className="relative h-60">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip
              cursor={{ stroke: "#d9d9d9", strokeWidth: 1 }}
              content={(p) => {
                const d = p.payload?.[0]?.payload as MonthPoint | undefined;
                if (!p.active || !d) return null;
                const gap = d.scheduled - d.collected;
                return (
                  <TooltipCard
                    title={monthLong(d.month)}
                    rows={[
                      { label: "Collected", value: formatPeso(d.collected), color: INK },
                      { label: "Scheduled", value: formatPeso(d.scheduled), color: GREY, dash: true },
                      ...(gap > 0 ? [{ label: "Short by", value: formatPeso(gap) }] : []),
                    ]}
                  />
                );
              }}
            />
            <Line
              type="linear"
              dataKey="scheduled"
              stroke={GREY}
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              activeDot={{ r: 4, fill: GREY, stroke: "#fff", strokeWidth: 2 }}
              isAnimationActive={false}
            />
            <Line
              type="linear"
              dataKey="collected"
              stroke={INK}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: INK, stroke: "#fff", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
        {empty ? <EmptyOverlay>No payments scheduled or received yet.</EmptyOverlay> : null}
      </div>
    </div>
  );
}
