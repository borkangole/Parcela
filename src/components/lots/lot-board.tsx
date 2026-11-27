"use client";

// The site plan with every lot coloured by its status. Same meaning as the logo:
// sold lots are cherry. Reserved are black, available are open ground, on hold are hatched.
import { useState } from "react";
import { BLOCKS } from "@/data/costa-preciosa";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { type LotStatus, STATUS_LABEL, StatusSwatch } from "./lot-status";

const W = 760;
const ROW_H = 44;
const ROAD = 22;
const GAP = 3;
const LABEL_W = 40;
const MAX_BLOCK_AREA = Math.max(...BLOCKS.map((b) => b.lots.reduce((n, [, a]) => n + a, 0)));

const FILL: Record<LotStatus, string> = {
  AVAILABLE: "fill-white stroke-silver",
  RESERVED: "fill-ink stroke-ink",
  SOLD: "fill-cherry stroke-cherry",
  UNAVAILABLE: "fill-[url(#lot-hatch)] stroke-silver",
};
const TEXT: Record<LotStatus, string> = {
  AVAILABLE: "fill-grey",
  RESERVED: "fill-white",
  SOLD: "fill-white",
  UNAVAILABLE: "fill-grey",
};

type Lot = { code: string; status: LotStatus; area: number; block: string | null; notes: string | null };

export function LotBoard({ lots }: { lots: Lot[] }) {
  const byCode = new Map(lots.map((l) => [l.code, l]));
  const [hover, setHover] = useState<Lot | null>(null);
  const height = BLOCKS.length * ROW_H + (BLOCKS.length - 1) * ROAD;

  return (
    <div>
      {/* On phones the plan keeps a readable size and scrolls sideways. */}
      <div className="-mx-6 overflow-x-auto px-6 pb-1 sm:mx-0 sm:px-0">
      <svg
        viewBox={`-2 -2 ${W + LABEL_W + 4} ${height + 4}`}
        className="w-full min-w-[620px] sm:min-w-0"
        role="img"
        aria-label={`Site plan: ${lots.length} lots coloured by status`}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <pattern id="lot-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="#f3f3f3" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="#d9d9d9" strokeWidth="2" />
          </pattern>
        </defs>
        {BLOCKS.map((block, row) => {
          const y = row * (ROW_H + ROAD);
          const blockArea = block.lots.reduce((n, [, a]) => n + a, 0);
          const usable = (blockArea / MAX_BLOCK_AREA) * W - GAP * (block.lots.length - 1);
          let x = LABEL_W;
          return (
            <g key={block.name}>
              <text x={0} y={y + ROW_H / 2} dominantBaseline="central" className="fill-grey font-mono text-[10px] tracking-[0.15em]">
                B{block.name}
              </text>
              {block.lots.map(([letter, area]) => {
                const code = `466-${letter}`;
                const lot = byCode.get(code);
                const status: LotStatus = lot?.status ?? "UNAVAILABLE";
                const w = (area / blockArea) * usable;
                const lx = x;
                x += w + GAP;
                const active = hover?.code === code;
                return (
                  <g
                    key={code}
                    className="cursor-default"
                    onMouseEnter={() => lot && setHover(lot)}
                  >
                    <rect
                      x={lx}
                      y={y}
                      width={w}
                      height={ROW_H}
                      rx={2}
                      strokeWidth={active ? 2 : 1}
                      className={cn(FILL[status], "transition-[stroke] duration-150", active && "stroke-ink")}
                    />
                    <text
                      x={lx + w / 2}
                      y={y + ROW_H / 2}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className={cn("pointer-events-none font-mono text-[9.5px]", TEXT[status])}
                    >
                      {letter}
                    </text>
                  </g>
                );
              })}
              {row < BLOCKS.length - 1 && (
                <line
                  x1={LABEL_W}
                  x2={LABEL_W + W}
                  y1={y + ROW_H + ROAD / 2}
                  y2={y + ROW_H + ROAD / 2}
                  className="stroke-silver"
                  strokeDasharray="5 6"
                />
              )}
            </g>
          );
        })}
      </svg>
      </div>

      <div className="mt-5 flex min-h-5 items-center gap-2.5 text-[13px]" aria-live="polite">
        {hover ? (
          <>
            <StatusSwatch status={hover.status} />
            <span className="font-medium text-ink tabular-nums">Lot {hover.code}</span>
            <span className="text-grey">
              Block {hover.block} · {formatNumber(hover.area)} sq.m. · {STATUS_LABEL[hover.status]}
            </span>
            {hover.notes ? <span className="truncate text-grey/80">· {hover.notes}</span> : null}
          </>
        ) : (
          <span className="text-grey">Point at a lot to see its details.</span>
        )}
      </div>
    </div>
  );
}
