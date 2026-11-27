// The Parcela logo: a "P" built from nine square lots, like blocks on a site plan.
// The top-right lot is cherry red: the lot that's sold.
import { cn } from "@/lib/utils";

const UNIT = 8.4; // size of one lot
const GAP = 1.6; // the road between lots
const STEP = UNIT + GAP;
const OFFSET_X = (40 - (3 * UNIT + 2 * GAP)) / 2;
const OFFSET_Y = (40 - (4 * UNIT + 3 * GAP)) / 2;

// [column, row] of each lot in the P (3 columns x 4 rows)
const LOTS: [number, number][] = [
  [0, 0], [1, 0], [2, 0],
  [0, 1], [2, 1],
  [0, 2], [1, 2], [2, 2],
  [0, 3],
];
const SOLD: [number, number] = [2, 0];

/** The mark alone. Takes the text colour (currentColor); the sold lot is always cherry. */
export function ParcelaMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn("size-8", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {LOTS.map(([c, r]) => {
        const sold = c === SOLD[0] && r === SOLD[1];
        return (
          <rect
            key={`${c}-${r}`}
            x={OFFSET_X + c * STEP}
            y={OFFSET_Y + r * STEP}
            width={UNIT}
            height={UNIT}
            className={sold ? "fill-cherry" : "fill-current"}
          />
        );
      })}
    </svg>
  );
}

/** Mark + wordmark. `introTarget` marks it as the spot the login intro's logo lands on. */
export function ParcelaLogo({
  className,
  markClassName,
  introTarget,
}: {
  className?: string;
  markClassName?: string;
  introTarget?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)} data-intro-target={introTarget || undefined}>
      <ParcelaMark className={markClassName} />
      <span className="text-[0.95em] font-semibold tracking-[0.32em] uppercase">
        Parcela
        <span className="sr-only">, AAAC Corporation</span>
      </span>
    </span>
  );
}
