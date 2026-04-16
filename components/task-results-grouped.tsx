"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { CATEGORY_ICONS } from "@/lib/types";
import type { TaskResult } from "@/lib/types";

interface TaskResultsGroupedProps {
  tasks: TaskResult[];
}

const getScoreColor = (score: number, max: number) => {
  const pct = (score / max) * 100;
  if (pct >= 85) return "text-green-500";
  if (pct >= 70) return "text-yellow-500";
  if (pct >= 50) return "text-orange-500";
  return "text-red-500";
};

const getBarColor = (pct: number) => {
  if (pct >= 85) return "bg-green-500";
  if (pct >= 70) return "bg-yellow-500";
  if (pct >= 50) return "bg-orange-500";
  return "bg-red-500";
};

const getGradingLabel = (type: string) => {
  if (type === "llm_judge") return "LLM Judge";
  if (type === "automated") return "Auto";
  return "Hybrid";
};

export function TaskResultsGrouped({ tasks }: TaskResultsGroupedProps) {
  const grouped = tasks.reduce(
    (acc, task) => {
      const cat = task.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(task);
      return acc;
    },
    {} as Record<string, TaskResult[]>
  );

  const sortedCategories = Object.entries(grouped).sort(([, a], [, b]) => {
    const aTotal = a.reduce((s, t) => s + t.score, 0);
    const aMax = a.reduce((s, t) => s + t.max_score, 0);
    const bTotal = b.reduce((s, t) => s + t.score, 0);
    const bMax = b.reduce((s, t) => s + t.max_score, 0);
    return bTotal / bMax - aTotal / aMax;
  });

  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(sortedCategories.map(([cat]) => cat))
  );

  const toggleCategory = (cat: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {sortedCategories.map(([category, categoryTasks]) => {
        const icon = CATEGORY_ICONS[category] || "📌";
        const totalScore = categoryTasks.reduce((s, t) => s + t.score, 0);
        const maxScore = categoryTasks.reduce((s, t) => s + t.max_score, 0);
        const pct = (totalScore / maxScore) * 100;
        const passed = categoryTasks.filter(
          (t) => t.score / t.max_score >= 0.5
        ).length;
        const isExpanded = expanded.has(category);

        return (
          <Card
            key={category}
            className="bg-card border-border overflow-hidden"
          >
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className="text-base">{icon}</span>
                <span className="text-sm font-semibold text-foreground capitalize">
                  {category}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({passed}/{categoryTasks.length} passed)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 bg-muted rounded-full h-2 overflow-hidden hidden sm:block">
                  <div
                    className={`h-full rounded-full ${getBarColor(pct)}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <span
                  className={`text-sm font-bold tabular-nums ${getScoreColor(totalScore, maxScore)}`}
                >
                  {pct.toFixed(0)}%
                </span>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-border divide-y divide-border">
                {categoryTasks
                  .sort(
                    (a, b) =>
                      b.score / b.max_score - a.score / a.max_score
                  )
                  .map((task) => {
                    const taskPct = (task.score / task.max_score) * 100;
                    const isPassed = taskPct >= 50;

                    return (
                      <div
                        key={task.task_id}
                        className="px-4 py-2.5 flex items-center justify-between hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {task.timed_out ? (
                            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                          ) : isPassed ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                          )}
                          <span className="text-sm text-foreground truncate">
                            {task.task_name}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 shrink-0 hidden sm:inline-flex"
                          >
                            {getGradingLabel(task.grading_type)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-2">
                          {task.execution_time_seconds != null && (
                            <span className="text-xs text-muted-foreground tabular-nums hidden md:flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {task.execution_time_seconds < 60
                                ? `${task.execution_time_seconds.toFixed(0)}s`
                                : `${(task.execution_time_seconds / 60).toFixed(1)}m`}
                            </span>
                          )}
                          <span
                            className={`text-sm font-mono tabular-nums ${getScoreColor(task.score, task.max_score)}`}
                          >
                            {task.score.toFixed(2)}/{task.max_score}
                          </span>
                          {task.timed_out && (
                            <span className="text-[10px] text-amber-500 font-medium">
                              TIMEOUT
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
