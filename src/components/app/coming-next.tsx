// Placeholder for pages that get built in a later step. Says what the page will do,
// so every menu link works today and nobody lands on a blank screen.
import { ParcelaMark } from "@/components/brand/logo";
import { PageTitle } from "./page-header";

export function ComingNext({
  section,
  title,
  step,
  summary,
  points,
}: {
  section: string;
  title: string;
  step: string;
  summary: string;
  points: string[];
}) {
  return (
    <div className="dash-enter">
      <PageTitle eyebrow={section} title={title}>
        {summary}
      </PageTitle>
      <section className="grid gap-8 rounded-lg border border-dashed border-silver bg-card p-8 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="font-mono text-[11px] tracking-[0.16em] text-cherry uppercase">Coming in {step}</p>
          <ul className="mt-4 space-y-2.5 text-[14px] text-ink">
            {points.map((p) => (
              <li key={p} className="flex gap-3">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-[1px] bg-silver" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <ParcelaMark className="hidden size-20 text-muted md:block" />
      </section>
    </div>
  );
}
