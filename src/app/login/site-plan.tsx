"use client";

// The Costa Preciosa site plan on the login screen: the real 39 lots, drawn block by
// block, each lot as wide as its area. Hover a lot to light it cherry and read its details.
// Only public facts (lot codes and areas). No sale status is shown before login.
import { useState } from "react";
import { BLOCKS, PROJECT, SALEABLE_AREA, SALEABLE_LOT_COUNT } from "@/data/costa-preciosa";

const W = 560; // drawing width
const ROW_H = 46;
const ROAD = 26; // the road between blocks
const LOT_GAP = 3;
const LABEL_W = 44; // room for the block name on the left
const MAX_BLOCK_AREA = Math.max(...BLOCKS.map((b) => b.lots.reduce((n, [, a]) => n + a, 0)));

type Hovered = { code: string; block: string; area: number } | null;

const fmt = new Intl.NumberFormat("en-PH");

export function SitePlan() {
  const [hovered, setHovered] = useState<Hovered>(null);
  let lotIndex = 0;
  const height = BLOCKS.length * ROW_H + (BLOCKS.length - 1) * ROAD;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W + LABEL_W} ${height}`}
        className="w-full"
        aria-hidden
        onMouseLeave={() => setHovered(null)}
      >
        {BLOCKS.map((block, row) => {
          const y = row * (ROW_H + ROAD);
          const blockArea = block.lots.reduce((n, [, a]) => n + a, 0);
          const rowWidth = (blockArea / MAX_BLOCK_AREA) * W;
          const usable = rowWidth - LOT_GAP * (block.lots.length - 1);
          let x = LABEL_W;

          return (
            <g key={block.name}>
              <text
                x={0}
                y={y + ROW_H / 2}
                dominantBaseline="central"
                className="fill-grey font-mono text-[10px] tracking-[0.18em]"
              >
                B{block.name}
              </text>

              {block.lots.map(([letter, area]) => {
                const w = (area / blockArea) * usable;
                const lotX = x;
                x += w + LOT_GAP;
                const code = `466-${letter}`;
                const active = hovered?.code === code;
                const delay = lotIndex++ * 22;
                return (
                  <g
                    key={code}
                    className="site-lot cursor-crosshair"
                    style={{ animationDelay: `${delay}ms` }}
                    onMouseEnter={() => setHovered({ code, block: block.name, area })}
                  >
                    <rect
                      x={lotX}
                      y={y}
                      width={w}
                      height={ROW_H}
                      className={
                        active
                          ? "fill-cherry stroke-cherry transition-colors duration-150"
                          : "fill-ink-2 stroke-ink-3 transition-colors duration-300 hover:fill-ink-3"
                      }
                      strokeWidth={1}
                    />
                    <text
                      x={lotX + w / 2}
                      y={y + ROW_H / 2}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className={`pointer-events-none font-mono text-[9px] transition-colors ${active ? "fill-white" : "fill-grey"}`}
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
                  className="stroke-ink-3"
                  strokeDasharray="6 6"
                  strokeWidth={1}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Readout under the plan */}
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
