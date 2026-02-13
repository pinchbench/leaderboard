# API Integration Plan for PinchBench Leaderboard

## Overview

The leaderboard frontend needs to be updated to fetch data from the live API at `https://api.pinchbench.com` instead of using mock data.

## API Endpoints

| Endpoint               | Purpose                                 |
| ---------------------- | --------------------------------------- |
| `/api/leaderboard`     | Main leaderboard rankings               |
| `/api/submissions/:id` | Detailed submission with task breakdown |
| `/api/stats`           | Summary statistics (optional)           |

## Data Mapping

### LeaderboardEntry Type Mapping

Current [`LeaderboardEntry`](lib/types.ts:1) type vs API `/api/leaderboard` response:

| Current Field   | API Field               | Transformation                                               |
| --------------- | ----------------------- | ------------------------------------------------------------ |
| `rank`          | _(not provided)_        | **Calculate with proper ranking** (see below)                |
| `model`         | `model`                 | Direct - may extract display name from `provider/model-name` |
| `provider`      | `provider`              | Direct                                                       |
| `total_score`   | _(not in leaderboard)_  | **Drop from leaderboard rows** (keep only percentage)        |
| `max_score`     | _(not in leaderboard)_  | **Drop from leaderboard rows**                               |
| `percentage`    | `best_score_percentage` | Multiply by 100 to convert from decimal                      |
| `timestamp`     | `latest_submission`     | Direct                                                       |
| `submission_id` | `best_submission_id`    | Direct                                                       |

### Ranking Logic

The `rank` field should be calculated properly to handle ties, using a
deterministic tie-breaker (latest submission wins) and float-safe comparison:

```typescript
function calculateRanks(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  const EPSILON = 1e-6;
  const sorted = [...entries].sort((a, b) => {
    // Primary: score desc
    if (Math.abs(b.percentage - a.percentage) > EPSILON) {
      return b.percentage - a.percentage;
    }
    // Tie-breaker: latest submission wins (newest first)
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return sorted.map((entry, index) => {
    if (
      index > 0 &&
      Math.abs(entry.percentage - sorted[index - 1].percentage) <= EPSILON
    ) {
      return { ...entry, rank: sorted[index - 1].rank };
    }
    return { ...entry, rank: index + 1 };
  });
}
```

### Max Score Handling

The `max_score` (currently 11) may change with benchmark versions. Decision:

- **Leaderboard rows:** use percentage only (no total/max score display)
- **Submission detail:** use `submission.total_score` and `submission.max_score`

**New API fields for Speed/Cost views:**

| New Field                        | API Field                        | Notes                       |
| -------------------------------- | -------------------------------- | --------------------------- |
| `average_execution_time_seconds` | `average_execution_time_seconds` | For Speed view (nullable)   |
| `best_execution_time_seconds`    | `best_execution_time_seconds`    | For Speed view (nullable)   |
| `average_cost_usd`               | `average_cost_usd`               | For Cost view (nullable)    |
| `best_cost_usd`                  | `best_cost_usd`                  | For Cost view (nullable)    |
| `submission_count`               | `submission_count`               | Display submission count    |
| `average_score_percentage`       | `average_score_percentage`       | For showing average vs best |

### Submission Detail Type Mapping

Current [`Submission`](lib/types.ts:24) type vs API `/api/submissions/:id` response:

| Current Field      | API Field                     | Notes                                |
| ------------------ | ----------------------------- | ------------------------------------ |
| `submission_id`    | `submission.id`               | Rename                               |
| `timestamp`        | `submission.timestamp`        | Direct                               |
| `openclaw_version` | `submission.openclaw_version` | Direct - may be null                 |
| `model`            | `submission.model`            | Direct                               |
| `provider`         | `submission.provider`         | Direct                               |
| `task_results`     | `submission.tasks`            | ✅ Available - needs minor transform |
| `total_score`      | `submission.total_score`      | Direct                               |
| `max_score`        | `submission.max_score`        | Direct                               |
| `metadata`         | `submission.metadata`         | ✅ Available - richer than current   |

### TaskResult Type Mapping

Current [`TaskResult`](lib/types.ts:12) type vs API task objects:

| Current Field  | API Field                | Notes                                         |
| -------------- | ------------------------ | --------------------------------------------- |
| `task_id`      | `task_id`                | Direct                                        |
| `task_name`    | _(not provided)_         | Need to derive from task_id or create mapping |
| `category`     | _(not provided)_         | Need to derive from task_id or create mapping |
| `score`        | `score`                  | Direct                                        |
| `max_score`    | `max_score`              | Direct                                        |
| `breakdown`    | `breakdown`              | Direct                                        |
| `grading_type` | `grading_type`           | Direct                                        |
| `timed_out`    | `timed_out`              | Direct                                        |
| `notes`        | `notes`                  | Direct - empty string or LLM judge feedback   |
| _(new)_        | `execution_time_seconds` | ✅ NEW - can use for Speed view               |

### New Data Available

The `/api/submissions/:id` endpoint provides **additional data** not in current types:

```typescript
// Usage/Cost data - enables Cost view!
usage_summary: {
  total_input_tokens: number
  total_output_tokens: number
  total_requests: number
  total_cost_usd: number  // Direct cost!
}

// Execution time per task - enables Speed view!
tasks[].execution_time_seconds: number

// Additional metadata
rank: number  // Model's rank
percentile: number  // e.g., 95.45
verified: boolean
run_id: string
metadata.system: {...}  // System info where benchmark ran
```

## Task Name/Category

The API now returns `frontmatter` per task with `name` and `category`:

```typescript
// New API task structure:
{
  task_id: "task_02_stock",
  score: 0.9,
  frontmatter: {
    id: "task_02_stock",
    name: "Stock",           // ← Use for display
    category: "api",         // ← Use for categorization
    grading_type: "automated",
    timeout_seconds: 120
  }
}
```

**Fallback for older submissions** (without frontmatter):

```typescript
const TASK_FALLBACK: Record<string, { name: string; category: string }> = {
  task_00_sanity: { name: "Sanity Check", category: "validation" },
  task_01_calendar: { name: "Calendar Event", category: "calendar" },
  task_02_stock: { name: "Stock Research", category: "api" },
  task_03_blog: { name: "Blog Post", category: "writing" },
  task_04_weather: { name: "Weather Script", category: "coding" },
  task_05_summary: { name: "Document Summary", category: "comprehension" },
  task_06_events: { name: "Events Research", category: "research" },
  task_07_email: { name: "Email Draft", category: "writing" },
  task_08_memory: { name: "Memory Retrieval", category: "context" },
  task_09_files: { name: "File Operations", category: "coding" },
  task_10_workflow: { name: "Multi-step Workflow", category: "complex" },
};
```

## Implementation Plan

### Phase 1: API Client Layer

Create [`lib/api.ts`](lib/api.ts):

```typescript
const API_BASE = "https://api.pinchbench.com/api";

export async function fetchLeaderboard(): Promise<LeaderboardResponse>;
export async function fetchSubmission(
  id: string,
): Promise<SubmissionDetailResponse>;
export async function fetchStats(): Promise<StatsResponse>;
```

### Phase 2: Data Transformation Layer

Create [`lib/transforms.ts`](lib/transforms.ts):

```typescript
export function transformLeaderboardEntry(apiEntry, index): LeaderboardEntry;
export function transformSubmission(apiSubmission): Submission;
export function transformTaskResult(apiTask): TaskResult;
```

### Phase 3: Update Types

Update [`lib/types.ts`](lib/types.ts):

- Add API response interfaces
- Add `execution_time_seconds` to TaskResult
- Add `UsageSummary` type for cost data
- Update `PROVIDER_COLORS` with new providers

New providers to add:

```typescript
export const PROVIDER_COLORS: Record<string, string> = {
  // Existing
  anthropic: "#DA7756", // Coral/Terra Cotta
  openai: "#10A37F", // Teal Green
  google: "#4796E3", // Gemini Blue
  meta: "#0668E1", // Facebook Blue
  mistral: "#FF7000", // Orange (Mistral)
  cohere: "#D18EE2", // Purple

  // New providers
  moonshotai: "#5865F2", // Discord-like purple accent
  "x-ai": "#FFFFFF", // White (displays well on dark bg)
  "z-ai": "#3366FF", // Electric Blue (Zhipu)
  minimax: "#6366F1", // Purple-Blue (Indigo)
  "arcee-ai": "#8B5CF6", // Purple
  deepseek: "#3C5DFF", // Dodger Blue
  stepfun: "#00D4AA", // Teal (estimated)
  mistralai: "#FF7000", // Same as mistral
};
```

### Phase 4: Update Components

1. **[`app/page.tsx`](app/page.tsx:1)** - Fetch from API with loading state and `revalidate: 60`
2. **[`app/submission/[id]/page.tsx`](app/submission/[id]/page.tsx:1)** - Fetch detailed submission with `revalidate: 60`
3. **Enable Speed tab** - Use `execution_time_seconds` data
4. **Enable Cost tab** - Use `usage_summary.total_cost_usd` data

### Phase 5: Add Loading/Error States

- Skeleton loaders during fetch
- Error boundaries for failed requests
- Use Next.js `fetch` caching; avoid client-side SWR for now

## Data Flow Diagram

```mermaid
flowchart TD
    subgraph API
        A1[/api/leaderboard]
        A2[/api/submissions/:id]
        A3[/api/stats]
    end

    subgraph lib/api.ts
        F1[fetchLeaderboard]
        F2[fetchSubmission]
        F3[fetchStats]
    end

    subgraph lib/transforms.ts
        T1[transformLeaderboardEntry]
        T2[transformSubmission]
        T3[transformTaskResult]
    end

    subgraph Components
        C1[Home Page]
        C2[Submission Detail]
    end

    A1 --> F1 --> T1 --> C1
    A2 --> F2 --> T2 --> C2
    T2 --> T3
    A3 --> F3 --> C1
```

## Files to Create/Modify

| File                                | Action | Description                                        |
| ----------------------------------- | ------ | -------------------------------------------------- |
| `lib/api.ts`                        | Create | API client functions                               |
| `lib/transforms.ts`                 | Create | Data transformation utilities                      |
| `lib/task-metadata.ts`              | Create | Task ID to name/category mapping                   |
| `lib/types.ts`                      | Modify | Add API types, new provider colors, execution_time |
| `app/page.tsx`                      | Modify | Use API instead of mock data                       |
| `app/submission/[id]/page.tsx`      | Modify | Fetch submission from API                          |
| `components/simple-leaderboard.tsx` | Modify | Add Speed/Cost view implementations                |
| `lib/mock-data.ts`                  | Keep   | Keep as fallback during development                |

## Speed & Cost View Implementation

✅ **Good news!** The leaderboard endpoint now includes speed and cost data directly!

### Speed View

- **Source:** `/api/leaderboard` fields:
  - `average_execution_time_seconds` - Average across all submissions
  - `best_execution_time_seconds` - Fastest submission time
- **Display:** Sort by execution time, show time in seconds/minutes
- **Handle null:** Exclude from ranking; show "N/A" rows below ranked entries

### Cost View

- **Source:** `/api/leaderboard` fields:
  - `average_cost_usd` - Average cost across submissions
  - `best_cost_usd` - Lowest cost submission
- **Display:** Sort by cost, format as currency ($X.XX)
- **Handle null:** Exclude from ranking; show "N/A" rows below ranked entries

### View Sorting Logic

| View         | Sort Field                    | Order                      |
| ------------ | ----------------------------- | -------------------------- |
| Success Rate | `best_score_percentage`       | Descending (highest first) |
| Speed        | `best_execution_time_seconds` | Ascending (fastest first)  |
| Cost         | `best_cost_usd`               | Ascending (cheapest first) |

Null values are excluded from the sorted set; remaining nulls are rendered
after ranked entries with no rank ("N/A").

**Note:** Currently all speed/cost values are `null` in the API. The UI should gracefully handle this state until data is populated.
