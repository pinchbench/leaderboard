# New Charts Plan

## Context

The leaderboard currently has two scatter plots (Performance vs Cost, Performance vs Speed) and a bar chart (Success Rate view). A data agent recommended 8 additional chart types. After reviewing the recommendations against the available data and existing charts, we're implementing 3 new charts that add the most visual diversity and analytical value.

## Decisions

### Implementing

1. **Heatmap -- Task-Level Performance Grid** (highest value)
   - Exposes per-task granularity that no existing chart shows
   - Models on Y-axis, tasks on X-axis, cells colored by score/max_score
   - Data source: fetch each model's best submission via `/submissions/{id}` to get task_results[]
   - Color scale: red (0%) -> yellow (50%) -> green (100%)
   - Sorting: tasks by category, models by overall score

2. **Box Plot -- Score Distribution per Model**
   - Surfaces consistency/variance dimension currently missing
   - Shows median, Q1, Q3, min, max of score_percentage per model
   - Data source: `/submissions?limit=500` grouped by model
   - Custom implementation using Recharts ComposedChart (no native box plot)

3. **Radar Chart -- Multi-Dimensional Model Profile**
   - Lets users compare models across all metrics simultaneously
   - Select 2-3 models to overlay
   - Axes: Score %, Cost efficiency (inverted), Speed efficiency (inverted), input token efficiency, output token efficiency
   - All axes normalized to 0-1 scale
   - Uses Recharts RadarChart

### Rejected

4. **Bar Chart (Leaderboard Ranking)** -- Already exists as the Success Rate view in simple-leaderboard.tsx
5. **Grouped Bar Chart (Provider Comparison)** -- Providers have wildly different model counts making averages misleading. Provider filter + existing charts suffice.
6. **Line Chart (Performance Over Time)** -- API doesn't expose historical version-over-version scores per model. Models aren't consistently re-run across versions.
7. **Scatter Plot (Token Efficiency)** -- Would be a third scatter plot with only a different X-axis. Low visual diversity. Radar chart covers this dimension.
8. **Donut Chart (Token Ratio)** -- Low insight value for a dedicated chart. Radar chart covers this as one axis.

## Implementation Details

### New Files
- `components/task-heatmap.tsx` -- Heatmap component
- `components/score-distribution.tsx` -- Box plot component
- `components/model-radar.tsx` -- Radar chart component

### Modified Files
- `lib/api.ts` -- May need helpers for batch-fetching submission details
- `lib/types.ts` -- Any new types needed for chart data
- `components/leaderboard-view.tsx` -- Wire up new views
- `components/scatter-graphs.tsx` -- Refactor into sub-tab system within Graphs view

### UI Integration
- Extend the "Graphs" view to have sub-tabs:
  - Scatter Plots (existing)
  - Task Heatmap
  - Score Distribution
  - Model Comparison (Radar)

### Data Fetching
- **Heatmap**: Client-side fetch of submission details for each model's best_submission_id. Show loading state while fetching. Cache results.
- **Box Plot**: Client-side fetch via fetchSubmissions(version, 500). Group by model, compute quartiles.
- **Radar**: Uses existing LeaderboardEntry data (already available as props). No additional API calls for basic metrics. Token data may require submission detail fetches.
