// Lot status names and colour swatches. A plain module (not "use client") so both
// server pages and client components can use it.
import { cn } from "@/lib/utils";

export type LotStatus = "AVAILABLE" | "RESERVED" | "SOLD" | "UNAVAILABLE";

export const STATUS_LABEL: Record<LotStatus, string> = {
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  SOLD: "Sold",
  UNAVAILABLE: "On hold",
};

export function StatusSwatch({ status, className }: { status: LotStatus; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-2.5 shrink-0 rounded-[2px]",
        status === "AVAILABLE" && "border border-silver bg-white",
        status === "RESERVED" && "bg-ink",
        status === "SOLD" && "bg-cherry",
        status === "UNAVAILABLE" && "lot-hatch border border-silver",
        className,
      )}
    />
  );
}
