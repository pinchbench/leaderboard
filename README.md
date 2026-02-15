# PinchBench Leaderboard

[**Run the benchmark yourself →**](https://github.com/pinchbench/skill)

A streamlined, crab-themed benchmarking leaderboard for comparing LLM models as OpenClaw coding agents. Built with Next.js 16, React 19, and Tailwind CSS.

## Features

### Main Leaderboard (`/`)

- **Clean tabbed interface** for Success Rate, Speed, and Cost views
- **Crab-themed rankings** - Lobster for #1, Crab for #2, Shrimp for #3
- **Visual bar chart** showing model performance at a glance
- **Simplified table** with essential metrics only
- **Color-coded scores** (green/yellow/red) for quick assessment
- **Provider color coding** with brand colors (Anthropic, OpenAI, Google, etc.)
- **Minimal, data-focused design** inspired by SkateBench

### Submission Detail Page (`/submission/[id]`)

- **Circular score gauge** showing overall performance percentage
- **Category breakdown** with scores by task type (Calendar, Coding, Research, etc.)
- **Expandable task cards** with detailed criterion-by-criterion scoring
- **Grading type badges** (Automated, LLM Judge, Hybrid)
- **Status indicators** for success, warnings, and timeouts
- **Metadata display** including OpenClaw version and submission timestamp

### Design Features

- **Dark, minimal theme** with focus on data clarity
- **Crab and lobster emojis** throughout for fun, themed experience
- **Streamlined layout** - removed unnecessary sections
- **Tab-based navigation** for different metric views
- **Simple bar charts** for quick visual comparison
- **Clean typography** with monospace code fonts
- **Mobile-responsive** design

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 19.2
- **Styling:** Tailwind CSS with custom design tokens
- **Components:** shadcn/ui (Radix UI primitives)
- **Icons:** Lucide React
- **Date Formatting:** date-fns
- **Type Safety:** TypeScript

## Project Structure

```
├── app/
│   ├── page.tsx                    # Main leaderboard page
│   ├── submission/[id]/page.tsx    # Submission detail page
│   ├── layout.tsx                  # Root layout
│   └── globals.css                 # Global styles & theme
├── components/
│   ├── leaderboard-table.tsx       # Main table component
│   ├── task-breakdown.tsx          # Expandable task list
│   ├── score-gauge.tsx             # Circular score visualization
│   └── ui/                         # shadcn/ui components
├── lib/
│   ├── types.ts                    # TypeScript interfaces
│   ├── mock-data.ts                # Sample benchmark data
│   └── utils.ts                    # Utility functions
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended)

### Installation

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Run the development server:**

   ```bash
   pnpm dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
pnpm build
pnpm start
```

## Deploying to Cloudflare Pages (Recommended)

This project is a Next.js App Router app and should be deployed with **Cloudflare Pages**, not **Workers**. The error you saw (`Missing entry-point to Worker script or to assets directory`) happens when Wrangler is used without a Worker entry-point.

### Pages Build Settings

- **Framework preset:** Next.js
- **Build command:** `pnpm run build`
- **Build output directory:** `.next`
- **Root directory:** `/`

### Notes

- Do **not** use `npx wrangler deploy` for Pages. Pages builds and deploys automatically from the repo.
- If you already created a Workers project, create a new **Pages** project and connect this repo.
- Node.js 18+ and pnpm are supported by Pages; no extra config is required for this repo.

## Connecting to Real APIs

Currently, the app uses mock data from `lib/mock-data.ts`. To connect to real benchmark APIs:

### 1. Create API Route Handlers

Create files in `app/api/`:

```typescript
// app/api/leaderboard/route.ts
export async function GET() {
  const response = await fetch("YOUR_API_ENDPOINT/leaderboard");
  const data = await response.json();
  return Response.json(data);
}

// app/api/results/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const response = await fetch(`YOUR_API_ENDPOINT/results/${id}`);
  const data = await response.json();
  return Response.json(data);
}
```

### 2. Replace Mock Data

Update components to fetch from API routes instead of importing mock data:

```typescript
// In app/page.tsx
const response = await fetch("/api/leaderboard");
const entries = await response.json();
```

### 3. Add Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
API_SECRET_KEY=your-secret-key
```

## Customization

### Theme Colors

Edit `app/globals.css` to customize the color scheme:

```css
:root {
  --background: 0 0% 7%;
  --primary: 217 91% 60%;
  --success: 142 71% 45%;
  --warning: 38 92% 50%;
  /* ... */
}
```

### Provider Colors

Edit `lib/types.ts` to add/modify provider brand colors:

```typescript
export const PROVIDER_COLORS: Record<string, string> = {
  anthropic: "#d97757",
  openai: "#10a37f",
  google: "#4285f4",
  // Add more providers
};
```

### Task Categories

Add new task categories in `lib/types.ts`:

```typescript
export const CATEGORY_ICONS: Record<string, string> = {
  calendar: "📅",
  coding: "💻",
  // Add more categories
};
```

## Key Components

### LeaderboardTable

Responsive table with sorting, filtering, and mobile card layout.

**Props:**

- `entries: LeaderboardEntry[]` - Array of leaderboard entries

### TaskBreakdown

Expandable accordion showing detailed task results with criterion breakdowns.

**Props:**

- `tasks: TaskResult[]` - Array of task results

### ScoreGauge

Circular progress indicator showing overall score percentage.

**Props:**

- `score: number` - Current score
- `maxScore: number` - Maximum possible score

## Data Types

See `lib/types.ts` for complete TypeScript interfaces:

- `LeaderboardEntry` - Main leaderboard row data
- `TaskResult` - Individual task performance
- `Submission` - Complete submission with all task details

## Accessibility

- Semantic HTML elements (`<main>`, `<header>`, `<table>`)
- Keyboard navigation support
- WCAG AA contrast ratios
- Screen reader friendly labels
- Color + icon indicators (not color alone)

## Performance

- Server-side rendering with Next.js 16
- Optimized images and assets
- Code splitting and lazy loading
- Turbopack for faster builds

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

MIT

## Credits

Built with [v0](https://v0.dev) for OpenClaw
