"use client";

// Read-only map of Costa Preciosa: the real lot shapes from the surveyor's sketch plan,
// coloured by status (sold = cherry, as in the logo). Point at a lot for its details.
import { useState } from "react";
import { LOT_SHAPES, MAP_SIZE, type MapShape, OTHER_SHAPES } from "@/data/costa-preciosa-map";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { type LotStatus, STATUS_LABEL, StatusSwatch } from "./lot-status";

type Lot = { code: string; status: LotStatus; area: number; block: string | null; notes: string | null };

const PAD = 4; // metres of margin around the plan
const FILL: Record<LotStatus, string> = {
  AVAILABLE: "fill-white",
  RESERVED: "fill-ink",
  SOLD: "fill-cherry",
  UNAVAILABLE: "fill-[url(#map-hatch)]",
};
const LABEL: Record<LotStatus, string> = {
  AVAILABLE: "fill-ink/70",
  RESERVED: "fill-white",
  SOLD: "fill-white",
  UNAVAILABLE: "fill-grey",
};
const OTHER_NAME: Record<NonNullable<MapShape["kind"]>, string> = {
  ROAD: "Road",
  EASEMENT: "Easement",
  EXCLUDED: "Excluded area",
};

export function SiteMap({ lots }: { lots: Lot[] }) {
  const byCode = new Map(lots.map((l) => [l.code, l]));
  const [hover, setHover] = useState<Lot | null>(null);
  const vb = `${-PAD} ${-PAD} ${MAP_SIZE.width + PAD * 2} ${MAP_SIZE.height + PAD * 2}`;

  return (
    <div>
      {/* Phones: the map keeps a readable size and scrolls sideways. */}
      <div className="-mx-6 overflow-x-auto px-6 pb-1 sm:mx-0 sm:px-0">
        <svg
          viewBox={vb}
          className="w-full min-w-[640px] sm:min-w-0"
          role="img"
          aria-label={`Map of ${lots.length} lots in Costa Preciosa, coloured by status`}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <pattern id="map-hatch" width="1.6" height="1.6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="1.6" height="1.6" fill="#f3f3f3" />
              <line x1="0" y1="0" x2="0" y2="1.6" stroke="#d9d9d9" strokeWidth="0.6" />
            </pattern>
            <pattern id="map-easement" width="2.4" height="2.4" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
              <rect width="2.4" height="2.4" fill="#fafafa" />
              <line x1="0" y1="0" x2="0" y2="2.4" stroke="#e6e6e6" strokeWidth="0.5" />
            </pattern>
          </defs>

          {/* Roads, easement and excluded land */}
          {OTHER_SHAPES.map((s) => (
            <g key={s.code}>
              <path
                d={s.path}
                vectorEffect="non-scaling-stroke"
                strokeWidth={1}
                className={cn(
                  "stroke-silver",
                  s.kind === "ROAD" && "fill-[#f1f1f1]",
                  s.kind === "EASEMENT" && "fill-[url(#map-easement)]",
                  s.kind === "EXCLUDED" && "fill-[#fbfbfb]",
                )}
                strokeDasharray={s.kind === "EXCLUDED" ? "6 3 1 3" : undefined}
              />
              {s.kind !== "EASEMENT" && (
                <text
                  x={s.label[0]}
                  y={s.label[1]}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="pointer-events-none fill-grey font-mono text-[2.6px] tracking-[0.2em] uppercase"
                >
                  {s.kind ? OTHER_NAME[s.kind] : ""}
                </text>
              )}
            </g>
          ))}

          {/* Lots */}
          {LOT_SHAPES.map((s) => {
            const lot = byCode.get(s.code);
            const status: LotStatus = lot?.status ?? "UNAVAILABLE";
            const active = hover?.code === s.code;
            return (
              <g key={s.code} onMouseEnter={() => lot && setHover(lot)}>
                <path
                  d={s.path}
                  vectorEffect="non-scaling-stroke"
                  strokeWidth={active ? 2.5 : 1}
                  strokeLinejoin="round"
                  className={cn(FILL[status], active ? "stroke-ink" : "stroke-ink/35", "transition-[stroke-width] duration-150")}
                />
                <text
                  x={s.label[0]}
                  y={s.label[1]}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={cn("pointer-events-none font-mono text-[2.3px] font-medium", LABEL[status])}
                >
                  {s.code.replace("466-", "")}
                </text>
              </g>
            );
          })}

          <NorthArrow x={MAP_SIZE.width - 6} y={MAP_SIZE.height - 22} />
          <ScaleBar x={2} y={MAP_SIZE.height - 4} />
        </svg>
      </div>

      <div className="mt-4 flex min-h-5 items-center gap-2.5 text-[13px]" aria-live="polite">
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
          <span className="text-grey">Point at a lot to see its details. Shapes are from the surveyor&apos;s sketch plan.</span>
        )}
      </div>
    </div>
  );
}

function NorthArrow({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} className="pointer-events-none" aria-hidden>
      <path d="M0 -7 L2.6 2 L0 0.6 L-2.6 2 Z" className="fill-ink" />
      <text y={-8.6} textAnchor="middle" className="fill-ink font-mono text-[3px] font-semibold">
        N
      </text>
    </g>
  );
}

function ScaleBar({ x, y }: { x: number; y: number }) {
  // 0 – 10 – 20 m, alternating black and white like a survey scale
  return (
    <g transform={`translate(${x} ${y})`} className="pointer-events-none" aria-hidden>
      <rect x={0} y={-1.2} width={10} height={1.2} className="fill-ink" />
      <rect x={10} y={-1.2} width={10} height={1.2} className="fill-white stroke-ink" strokeWidth={0.2} />
      {[0, 10, 20].map((m) => (
        <text key={m} x={m} y={-2.4} textAnchor="middle" className="fill-grey font-mono text-[2.2px]">
          {m === 20 ? "20 m" : m}
        </text>
      ))}
    </g>
  );
}
