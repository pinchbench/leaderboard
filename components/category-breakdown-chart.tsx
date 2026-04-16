"use client";

import { Card } from "@/components/ui/card";
import { CATEGORY_ICONS } from "@/lib/types";

interface CategoryBreakdownChartProps {
  categoryStats: Record<string, { total: number; max: number; count: number }>;
}

const getBarColor = (percentage: number) => {
  if (percentage >= 85) return "bg-green-500";
  if (percentage >= 70) return "bg-yellow-500";
  if (percentage >= 50) return "bg-orange-500";
  return "bg-red-500";
};

const getTextColor = (percentage: number) => {
  if (percentage >= 85) return "text-green-500";
  if (percentage >= 70) return "text-yellow-500";
  if (percentage >= 50) return "text-orange-500";
  return "text-red-500";
};

export function CategoryBreakdownChart({
  categoryStats,
}: CategoryBreakdownChartProps) {
  const sortedCategories = Object.entries(categoryStats).sort(
    ([, a], [, b]) => b.total / b.max - a.total / a.max
  );

  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-4">
        {sortedCategories.map(([category, stats]) => {
          const percentage = (stats.total / stats.max) * 100;
          const icon = CATEGORY_ICONS[category] || "📌";

          return (
            <div key={category}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">{icon}</span>
                  <span className="text-sm font-medium text-foreground capitalize">
                    {category}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({stats.count} task{stats.count !== 1 ? "s" : ""})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-mono">
                    {stats.total.toFixed(1)}/{stats.max.toFixed(1)}
                  </span>
                  <span
                    className={`text-sm font-bold tabular-nums ${getTextColor(percentage)}`}
                  >
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getBarColor(percentage)}`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
