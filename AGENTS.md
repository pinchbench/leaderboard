# AGENTS.md

Quick reference for AI agents working on this codebase.

## Purpose

PinchBench Leaderboard is the public frontend at https://pinchbench.com. It displays benchmark results for LLM coding agents, ranking models by score, speed, and cost across 23 real-world tasks.

## System Architecture

This repo is one of three components:

- **pinchbench-skill** (github.com/olearycrew/pinchbench-skill): runs benchmarks against LLMs using OpenClaw, uploads results
- **pinchbench-api** (api.pinchbench.com): backend API that stores and serves all benchmark data; has an admin section at /admin used by the system owner
- **pinchbench-leaderboard** (this repo, pinchbench.com): Next.js frontend, reads from the API

## Tech Stack

- Next.js 16, React 19, TypeScript 5.7
- Tailwind CSS v3 + CSS custom properties (dark theme only)
- shadcn/ui (Radix UI primitives) in `components/ui/`
- Recharts for all data visualizations
- Deployed on Cloudflare Pages
- Bun as package manager
- PostHog for analytics

## Key Files & Directories

- `app/` — Next.js App Router pages (`page.tsx`, `runs/page.tsx`, `submission/[id]/page.tsx`, `about/page.tsx`)
- `components/` — React components
  - `leaderboard-view.tsx` — client orchestrator, manages URL state
  - `simple-leaderboard.tsx` — primary display (bar chart + table, 3 view modes)
  - `leaderboard-header.tsx` — sticky header with filters and nav
  - `scatter-graphs.tsx`, `task-heatmap.tsx`, `score-distribution.tsx`, `model-radar.tsx` — chart components
  - `score-gauge.tsx`, `task-breakdown.tsx` — submission detail components
- `lib/api.ts` — all API client functions
- `lib/types.ts` — TypeScript types + `PROVIDER_COLORS` + `CATEGORY_ICONS` constants
- `lib/transforms.ts` — API response → internal type transformations
- `plans/` — implementation planning docs (read before making large changes)

## API Integration

All data comes from `https://api.pinchbench.com/api`. Key endpoints:

- `GET /leaderboard?version=&verified=true`
- `GET /submissions/:id`
- `GET /submissions?version=&limit=&offset=`
- `GET /benchmark_versions`
- `GET /stats`
- `GET /model-submissions?model=`

All API calls are in `lib/api.ts`. Server components use `fetch` with `{ next: { revalidate: 60 } }` for ISR. Client components use the `*Client()` variants (no cache).

## Data Flow

```
API → lib/api.ts → lib/transforms.ts → app/page.tsx (Server Component) → LeaderboardView (client) → display components
```

Raw API types are prefixed `Api*` (e.g. `ApiLeaderboardEntry`). Always transform via `lib/transforms.ts` before passing to UI.

## Key Patterns

- **Server vs Client Components**: Server Components fetch data; Client Components handle interactivity. Mark with `'use client'` only when needed.
- **URL as state**: `LeaderboardView` syncs `?view=`, `?score=`, `?provider=`, `?graph=`, `?verified=` to URL via `router.replace()`.
- **Score coloring**: green (`#22c55e`) ≥85%, yellow (`#f59e0b`) ≥70%, red (`#ef4444`) otherwise — keep consistent.
- **Emoji ranking**: 🦞 #1, 🦀 #2, 🦐 #3 — appears in `ScoreGauge`, `SimpleLeaderboard`, and OG image route.
- **Screenshot exclusion**: `data-share-exclude="true"` on any UI element that should be excluded from screenshot captures.
- **Build errors**: `next.config.mjs` has `ignoreBuildErrors: true` — TypeScript errors won't block builds, but new code should still be type-safe.

## Adding New Providers

Add to `PROVIDER_COLORS` in `lib/types.ts` **and** in `app/api/og/route.tsx` (separate copy for Edge runtime).

## Benchmark Versioning

Versions are git commit SHAs of the pinchbench-skill repo. `VersionSelector` drives the `?version=<hash>` param.
