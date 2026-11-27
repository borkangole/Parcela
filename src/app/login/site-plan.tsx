"use client";

// The Costa Preciosa map on the login screen: the real lot shapes from the surveyor's
// sketch plan, drawn on black. Point at a lot to light it cherry and read its details.
// Public facts only (lot codes, blocks, areas). No sale status is shown before login.
import { useState } from "react";
import { BLOCKS, PROJECT, SALEABLE_AREA, SALEABLE_LOT_COUNT } from "@/data/costa-preciosa";
import { LOT_SHAPES, MAP_SIZE, OTHER_SHAPES } from "@/data/costa-preciosa-map";
import { cn } from "@/lib/utils";

const PAD = 3; // metres of margin around the plan
const fmt = new Intl.NumberFormat("en-PH");

// Block and official area for each lot code, from the area breakdown
const LOT_INFO = new Map<string, { block: string; area: number }>();
for (const b of BLOCKS) for (const [letter, area] of b.lots) LOT_INFO.set(`466-${letter}`, { block: b.name, area });

type Hovered = { code: string; block: string; area: number } | null;

export function SitePlan() {
  const [hovered, setHovered] = useState<Hovered>(null);
  const vb = `${-PAD} ${-PAD} ${MAP_SIZE.width + PAD * 2} ${MAP_SIZE.height + PAD * 2}`;

  return (
    <div className="w-full">
      <svg viewBox={vb} className="w-full" aria-hidden onMouseLeave={() => setHovered(null)}>
        <defs>
          <pattern id="login-easement" width="2.4" height="2.4" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
            <rect width="2.4" height="2.4" fill="#111111" />
            <line x1="0" y1="0" x2="0" y2="2.4" stroke="#222222" strokeWidth="0.5" />
          </pattern>
        </defs>

        {/* Roads, easement and excluded land: quiet, so the lots read first */}
        {OTHER_SHAPES.map((s) => (
          <path
            key={s.code}
            d={s.path}
            vectorEffect="non-scaling-stroke"
            strokeWidth={1}
            strokeDasharray={s.kind === "EXCLUDED" ? "6 3 1 3" : undefined}
            className={cn(
              "site-lot",
              s.kind === "ROAD" && "fill-[#101010] stroke-[#222222]",
              s.kind === "EASEMENT" && "fill-[url(#login-easement)] stroke-[#262626]",
              s.kind === "EXCLUDED" && "fill-transparent stroke-ink-3",
            )}
            style={{ animationDelay: "0ms" }}
          />
        ))}

        {/* Lots */}
        {LOT_SHAPES.map((s, i) => {
          const info = LOT_INFO.get(s.code);
          const active = hovered?.code === s.code;
          return (
            <g
              key={s.code}
              className="site-lot cursor-crosshair"
              style={{ animationDelay: `${120 + i * 22}ms` }}
              onMouseEnter={() => info && setHovered({ code: s.code, ...info })}
            >
              <path
                d={s.path}
                vectorEffect="non-scaling-stroke"
                strokeWidth={1}
                strokeLinejoin="round"
                className={
                  active
                    ? "fill-cherry stroke-cherry transition-colors duration-150"
                    : "fill-[#202020] stroke-[#3d3d3d] transition-colors duration-300 hover:fill-[#2c2c2c]"
                }
              />
              <text
                x={s.label[0]}
                y={s.label[1]}
                textAnchor="middle"
                dominantBaseline="central"
                className={cn(
                  "pointer-events-none font-mono text-[2.8px] transition-colors",
                  active ? "fill-white" : "fill-[#8a8a8a]",
                )}
              >
                {s.code.replace("466-", "")}
              </text>
            </g>
          );
        })}

        {/* North arrow and scale */}
        <g transform={`translate(${MAP_SIZE.width - 6} ${MAP_SIZE.height - 22})`} className="pointer-events-none">
          <path d="M0 -7 L2.6 2 L0 0.6 L-2.6 2 Z" className="fill-silver" />
          <text y={-8.6} textAnchor="middle" className="fill-silver font-mono text-[3px] font-semibold">
            N
          </text>
        </g>
        <g transform={`translate(2 ${MAP_SIZE.height - 4})`} className="pointer-events-none">
          <rect x={0} y={-1.2} width={10} height={1.2} className="fill-silver" />
          <rect x={10} y={-1.2} width={10} height={1.2} className="fill-ink stroke-silver" strokeWidth={0.2} />
          {[0, 10, 20].map((m) => (
            <text key={m} x={m} y={-2.4} textAnchor="middle" className="fill-grey font-mono text-[2.2px]">
              {m === 20 ? "20 m" : m}
            </text>
          ))}
        </g>
      </svg>

      {/* Readout under the map */}
      <div className="mt-6 flex h-5 items-center gap-3 font-mono text-[11px] tracking-[0.16em] text-silver uppercase">
        <span className={`size-2 transition-colors ${hovered ? "bg-cherry" : "bg-ink-3"}`} />
        {hovered ? (
          <span>
            Lot {hovered.code} <span className="text-grey">·</span> Block {hovered.block}{" "}
            <span className="text-grey">·</span> {fmt.format(hovered.area)} sq.m.
          </span>
        ) : (
          <span>
            {PROJECT.name} <span className="text-grey">·</span> {SALEABLE_LOT_COUNT} lots{" "}
            <span className="text-grey">·</span> {fmt.format(SALEABLE_AREA)} sq.m.
          </span>
        )}
      </div>
    </div>
  );
}
