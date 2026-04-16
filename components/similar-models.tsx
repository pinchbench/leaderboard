"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { PROVIDER_COLORS } from "@/lib/types";
import type { LeaderboardEntry } from "@/lib/types";

interface SimilarModelsProps {
  models: LeaderboardEntry[];
  currentModel: LeaderboardEntry;
  officialOnly: boolean;
}

function encodeModelPath(provider: string, model: string): string {
  return `${encodeURIComponent(provider)}/${model.split("/").map((s) => encodeURIComponent(s)).join("/")}`;
}

export function SimilarModels({
  models,
  currentModel,
  officialOnly,
}: SimilarModelsProps) {
  const officialParam = officialOnly ? "" : "?official=false";
  const sorted = [...models].sort((a, b) => a.rank - b.rank);

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              Rank
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              Model
            </th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">
              Score
            </th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground hidden sm:table-cell">
              Cost
            </th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground hidden md:table-cell">
              Speed
            </th>
            <th className="px-4 py-3 text-center font-medium text-muted-foreground hidden sm:table-cell">
              Δ Score
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sorted.map((model) => {
            const isCurrent =
              model.model.toLowerCase() === currentModel.model.toLowerCase();
            const providerColor =
              PROVIDER_COLORS[model.provider.toLowerCase()] || "#666";
            const diff = model.percentage - currentModel.percentage;
            const diffStr =
              diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
            const diffColor =
              diff > 0
                ? "text-green-500"
                : diff < 0
                  ? "text-red-500"
                  : "text-muted-foreground";

            return (
              <tr
                key={model.submission_id}
                className={`transition-colors ${isCurrent ? "bg-primary/5" : "hover:bg-muted/30"}`}
              >
                <td className="px-4 py-3 text-muted-foreground">
                  #{model.rank}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/model/${encodeModelPath(model.provider, model.model)}${officialParam}`}
                    className="flex items-center gap-2"
                  >
                    {isCurrent && (
                      <span className="text-xs text-primary font-bold">▸</span>
                    )}
                    <code
                      className={`font-mono truncate max-w-[200px] ${isCurrent ? "text-foreground font-semibold" : "text-foreground hover:text-primary transition-colors"}`}
                    >
                      {model.model}
                    </code>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 shrink-0"
                      style={{
                        borderColor: providerColor,
                        color: providerColor,
                      }}
                    >
                      {model.provider}
                    </Badge>
                  </Link>
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`font-bold tabular-nums ${
                      model.percentage >= 85
                        ? "text-green-500"
                        : model.percentage >= 70
                          ? "text-yellow-500"
                          : "text-red-500"
                    }`}
                  >
                    {model.percentage.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">
                  {model.best_cost_usd != null && model.best_cost_usd > 0
                    ? `$${model.best_cost_usd.toFixed(2)}`
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell">
                  {model.best_execution_time_seconds != null
                    ? `${Math.round(model.best_execution_time_seconds / 60)}m`
                    : "—"}
                </td>
                <td
                  className={`px-4 py-3 text-center font-medium tabular-nums hidden sm:table-cell ${diffColor}`}
                >
                  {isCurrent ? "—" : diffStr}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
