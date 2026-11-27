// The Parcela logo, "The plot": a subdivision plan seen from above, six plots of
// different sizes separated by thin roads. One plot is cherry red: the lot that's sold.
import { cn } from "@/lib/utils";

/** The plots on a 40 x 40 grid: [x, y, width, height]. The last one is the sold (cherry) plot. */
export const PLOTS: [number, number, number, number][] = [
  [0, 0, 18, 11],
  [20, 0, 20, 11],
  [0, 13, 11, 27],
  [13, 13, 13, 13],
  [13, 28, 27, 12],
  [28, 13, 12, 13], // sold
];

/** The mark alone. Takes the text colour (currentColor); the sold plot is always cherry. */
export function ParcelaMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn("size-8", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {PLOTS.map(([x, y, w, h], i) => (
        <rect
          key={i}
          x={x}
          y={y}
          width={w}
          height={h}
          className={i === PLOTS.length - 1 ? "fill-cherry" : "fill-current"}
        />
      ))}
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
