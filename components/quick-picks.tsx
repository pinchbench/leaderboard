import Link from "next/link";
import type { RecommendationPick } from "@/lib/types";
import { formatCost } from "@/lib/recommendations";

interface QuickPicksProps {
  picks: RecommendationPick[];
}

export function QuickPicks({ picks }: QuickPicksProps) {
  if (picks.length === 0) return null;

  return (
    <section className="mb-8 rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card p-4 shadow-sm md:p-5">
      <div className="mb-4 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Quick Picks</p>
          <h2 className="text-xl font-bold text-foreground">Best AI models for common use cases</h2>
        </div>
        <Link href="/best-for/coding" className="text-sm text-primary hover:underline">
          Explore best-for guides
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {picks.map((pick) => (
          <Link
            key={pick.key}
            href={pick.href}
            className="group rounded-xl border border-border bg-background/70 p-4 transition-colors hover:border-primary/60 hover:bg-background"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xl" aria-hidden="true">{pick.icon}</span>
                <span className="font-semibold text-foreground">{pick.label}</span>
              </div>
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {pick.metricValue}
              </span>
            </div>
            <code className="block truncate text-sm font-semibold text-foreground group-hover:text-primary">
              {pick.entry.model}
            </code>
            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>{pick.metricLabel}</span>
              <span>{pick.entry.percentage.toFixed(1)}% overall · {formatCost(pick.entry.best_cost_usd)}</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{pick.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
