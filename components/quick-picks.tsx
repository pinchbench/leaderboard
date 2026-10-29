import Link from "next/link";
import type { ReactNode } from "react";
import {
  Crown,
  Unlock,
  Ruler,
  Zap,
  PiggyBank,
  Gem,
  Wrench,
  BarChart3,
} from "lucide-react";
import type { RecommendationPick } from "@/lib/types";
import { formatCost, getAverageScorePercent } from "@/lib/recommendations";

interface QuickPicksProps {
  picks: RecommendationPick[];
}

const PICK_ICONS: Record<string, ReactNode> = {
  "Best Overall": <Crown className="h-4 w-4" />,
  "Best Open-Weights": <Unlock className="h-4 w-4" />,
  "Best SLM": <Ruler className="h-4 w-4" />,
  Fastest: <Zap className="h-4 w-4" />,
  "Best Budget": <PiggyBank className="h-4 w-4" />,
  "Best Value": <Gem className="h-4 w-4" />,
  "Best for Code": <Wrench className="h-4 w-4" />,
  "Best for Data": <BarChart3 className="h-4 w-4" />,
};

// LeaderboardView reads its filters from the URL only when it mounts, so a client-side
// navigation from the home page to e.g. /?slm=true would change the URL without applying
// the filter. Cards that point at the home leaderboard use a full page load instead.
export function isHomeLeaderboardHref(href: string): boolean {
  return href === "/" || href.startsWith("/?");
}

function PickLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  if (isHomeLeaderboardHref(href)) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function QuickPicks({ picks }: QuickPicksProps) {
  if (picks.length === 0) return null;

  return (
    <section className="mb-8 rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card p-4 shadow-sm md:p-5">
      <div className="mb-4 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs text-primary">Quick Picks</p>
          <h2 className="text-xl font-semibold text-foreground">Best AI models for common use cases</h2>
        </div>
        <Link href="/best-for/coding" className="text-sm text-primary hover:underline">
          Explore best-for guides
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {picks.map((pick) => (
          <PickLink
            key={pick.key}
            href={pick.href}
            className="group rounded-xl border border-border bg-background/70 p-4 transition-colors hover:border-primary/60 hover:bg-background"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-primary" aria-hidden="true">
                  {PICK_ICONS[pick.label] ?? <Crown className="h-4 w-4" />}
                </span>
                <span className="font-semibold text-foreground">{pick.label}</span>
              </div>
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {pick.metricValue}
              </span>
            </div>
            <code className="block truncate font-mono text-sm font-semibold text-foreground group-hover:text-primary">
              {pick.entry.model}
            </code>
            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>{pick.metricLabel}</span>
              <span>
                {(pick.useAverageScore ? getAverageScorePercent(pick.entry) : pick.entry.percentage)?.toFixed(1) ?? "n/a"}% overall
                {" · "}
                {pick.entry.submission_count != null ? `${pick.entry.submission_count} runs` : "run count unavailable"}
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{pick.description}</p>
          </PickLink>
        ))}
      </div>
    </section>
  );
}
