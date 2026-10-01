# PinchBench Leaderboard Improvement Roadmap

## Context

PinchBench Leaderboard already has a broad product surface: URL-addressable filters, success/speed/cost/value rankings, recommendation cards, multiple analytical charts, detailed submission pages, Best-for landing pages, dynamic social images, and public methodology information.

The next stage should not add more charts or ranking modes. The highest-value work is to make the existing product more trustworthy, correct, resilient, accessible, and efficient.

The review that produced this plan found four recurring themes:

1. Some controls, ranking labels, and shared images do not exactly match the data being shown.
2. Rankings based on a single best observation lack sample-size and uncertainty context.
3. API failures and malformed responses are not represented precisely enough.
4. The application has strong unit-level foundations but lacks enforced CI and end-to-end protection for critical behavior.

This roadmap turns those findings into phased, independently shippable work. Each phase should leave the application in a valid deployable state. Correctness and trust take priority over visual polish or feature expansion.

## Goals

- Ensure every ranking, graph control, URL, and shared image truthfully represents the same underlying state.
- Give users enough provenance and sample-size context to interpret rankings responsibly.
- Validate external data at runtime and distinguish not-found, malformed-data, timeout, and upstream-failure cases.
- Enforce type safety, tests, linting, and production builds in pull requests.
- Reduce server and browser request fan-out without changing visible behavior.
- Make the primary leaderboard workflows usable on mobile, with a keyboard, and with assistive technology.
- Improve discoverability for stable, high-intent pages after their behavior is correct.
- Remove stale scaffolding and document the actual development and deployment workflow.

## Non-Goals

- Adding new chart types or ranking modes.
- Redesigning the entire visual identity before correctness work is complete.
- Replacing the backend in this repository.
- Introducing compatibility layers without a demonstrated persisted-data or external-consumer requirement.
- Optimizing for a coverage percentage instead of protecting important behavior.

## Guiding Principles

### Trust before novelty

When a metric has limitations, disclose them where the decision is made. Do not rely on a distant methodology page or hidden tooltip.

### One state, one meaning

A URL parameter, visible control, table, chart, screenshot, and OG image must agree. Unsupported controls should be hidden rather than accepted and ignored.

### Validate at boundaries

External JSON is unknown until parsed. Components and transforms should receive validated domain data rather than repeatedly defending against malformed API payloads.

### Preserve partial value

If one detail request fails, show the successful data and identify what is missing. Do not silently convert partial failures into apparently complete results.

### Ship in vertical slices

Each work item should include behavior, error handling, tests, and relevant documentation. Avoid large refactors that defer verification until the end.

## Success Measures

Track these before and after the roadmap where practical:

- Zero known cases where the selected score mode differs from the displayed metric.
- Zero known differences between a shared URL or image and the corresponding visible leaderboard state.
- All recommendation and extrema-based ranking surfaces show sample count and metric basis.
- Pull requests cannot merge with TypeScript, lint, test, or production-build failures.
- API payload shape failures produce explicit diagnostics rather than rendering incorrect data.
- Actual 404s render not-found UI; upstream failures render retryable error UI.
- The homepage and Best-for pages reduce detail-request fan-out substantially, ideally to one aggregate or batch request per data shape.
- Critical navigation and filtering workflows pass automated browser tests on desktop and mobile viewports.
- Primary controls meet keyboard and accessible-name requirements.

## Phase Overview

| Phase | Theme | Outcome |
| --- | --- | --- |
| 0 | Baseline and decisions | Shared terminology, documented ranking semantics, and reproducible baseline |
| 1 | Trust and correctness | Rankings, controls, benchmark facts, and shared state agree |
| 2 | Reliability and CI | Validated API data, precise errors, and enforced quality gates |
| 3 | Data efficiency | Correct pagination, reduced request fan-out, and coherent caching |
| 4 | UX and accessibility | Clear hierarchy and usable mobile, keyboard, and chart experiences |
| 5 | SEO and transparency | Accurate metadata, provenance, methodology, and stable indexing |
| 6 | Cleanup and maintenance | Consistent tooling, documentation, styling, and reduced dead code |

---

## Phase 0: Baseline and Product Decisions

### Purpose

Resolve semantic questions before changing calculations. Otherwise, different components may continue implementing reasonable but conflicting definitions.

### Tasks

- [x] Write a short metric contract for each view:
  - Success: best score versus average score.
  - Speed: fastest observed versus average execution time.
  - Cost: cheapest observed versus average cost.
  - Value: exact formula, score basis, cost basis, zero-cost treatment, and missing-data treatment.
- [x] Decide the canonical default score mode. The current leaderboard treats `average` as the default while radar URL handling treats `best` as the default.
- [x] Define eligibility for Quick Picks and recommendation claims:
  - Minimum submission count.
  - Official-only versus community-inclusive behavior.
  - Treatment of missing or zero cost.
  - Tie-breaking behavior.
- [ ] Define canonical benchmark metadata by version:
  - Task count.
  - Benchmark commit/version.
  - Last-updated time.
  - Official-run criteria.
- [ ] Capture current network request counts for the homepage, one Best-for page, heatmap, and distribution views.
- [ ] Record the current primary workflows for later Playwright tests.

### Decision record

The executable contract is `lib/metric-contract.ts`, covered by `lib/metric-contract.test.ts`.

- Omitted `score` means `average`. `score=best` is the only non-default score value. Radar currently deletes `score=best` as though best were the default; that is a deviation to fix in Phase 1.1, not the contract.
- Omitted `view` means `success`. Omitted `graph` means `scatter`. Omitted `sort` means `quality`.
- The live scope parameter is `official`, not `verified`. Omitted `official` means official-only. `official=false` includes community results. `verified` is not interpreted.
- Omitted `version` means the API's current benchmark version.
- Success in average mode uses `average_score_percentage * 100`. A missing average is unranked and must not fall back to the best score. `lib/recommendations.ts` still has that fallback and must be aligned when recommendation labels change.
- Success in best mode uses `percentage`, which is the best observed success rate. Label it "Best observed".
- Speed and Cost tables always rank fastest and cheapest observed runs. Score mode does not reorder those tables. It does select best versus average axes for graphs that support both bases. Missing graph metrics are unavailable, not neutral values.
- Value Score is `best success percent / best observed cost`. It ignores score mode. Cost must be greater than `1e-6`; zero and missing costs are ineligible.
- Zero-cost rows are hidden on the Cost table unless `zerocost=true`.
- Equal primary metrics share a competition rank. Display order breaks ties by the active success percentage, then newer timestamp, then model name.
- Recommendation eligibility follows the already selected official/community set. The minimum sample size remains 1 until sample counts are visible; explicit zero counts are ineligible. Do not hide low-sample models before the disclosure work explains why.
- Target labels are "Average", "Best observed", "Fastest observed", "Cheapest observed", and "Value Score". Existing UI copy still says "Best Score", "Best Time", and "Best Cost" and should adopt the contract labels with the sample-size work.

### Outputs

- [x] A metric contract in this plan or a focused methodology document.
- [x] Agreed defaults and eligibility rules represented by tests before component changes.
- [ ] Baseline request counts and page behavior for comparison.

### Acceptance Criteria

- Every ranking has an explicit data source, sort direction, eligibility rule, tie-breaker, and label.
- The canonical URL behavior for omitted `score`, `view`, `version`, and `verified` parameters is documented.
- Product wording distinguishes average metrics from best-observed metrics.

---

## Phase 1: Trust and Correctness Release

This is the highest-priority release. Complete it before adding new product surface.

### 1.1 Make score mode truthful everywhere

#### Current Evidence

- `components/filter-panel.tsx` offers Best Run and Average controls for graphs.
- `components/scatter-graphs.tsx` receives `scoreMode` but uses average score, cost, and time.
- `components/score-distribution.tsx` receives `scoreMode` without applying it.
- `components/model-radar.tsx` and `components/leaderboard-view.tsx` disagree about the URL default.

#### Tasks

- [x] Centralize score-mode parsing and serialization.
- [x] Define which graph types support score-mode changes.
- [x] Apply the selected mode to scatter metrics where the API provides both bases.
- [x] Either implement score-mode behavior for distribution or hide/disable the control for that graph with explanatory copy.
- [x] Make radar use the canonical default and represent unavailable metrics as unavailable rather than neutral.
- [x] Add regression tests for default, `score=best`, and `score=average` URLs.

#### Acceptance Criteria

- Changing score mode changes every compatible visualization immediately.
- Incompatible visualizations do not present a control they ignore.
- Reloading or sharing the URL reproduces the same visible state.

### 1.2 Add sample-size and uncertainty context

#### Current Evidence

- Speed and Cost can rank a model by one fastest or cheapest run.
- Value combines best score and best observed cost.
- Quick Picks use extrema without displaying run count.
- Cost-quality warnings appear only inside a filter tooltip.

#### Tasks

- [ ] Display submission count on ranking rows and Quick Picks where extrema are used.
- [ ] Label metrics consistently as `Best observed`, `Average`, `Fastest observed`, or `Cheapest observed`.
- [ ] Apply the Phase 0 minimum-run eligibility rule to recommendation claims.
- [ ] Add a visible confidence or limited-data treatment for low-sample models.
- [ ] Put zero-cost and incomplete-cost warnings beside Cost and Value results.
- [ ] Ensure missing metrics remain unranked rather than receiving synthetic neutral values.

#### Acceptance Criteria

- A user can tell whether a claim is based on one run or many without opening a submission.
- Recommendations do not silently compare low-sample extrema with well-sampled averages.
- Cost and Value caveats are visible at the point of use.

### 1.3 Establish one benchmark metadata source

#### Current Evidence

- `app/about/page.tsx` states 147 tasks.
- `app/api/og/route.tsx` falls back to 148 tasks.
- Homepage metadata is inferred from submission details for only the top overall entries.

#### Tasks

- [ ] Add or consume a version-aware benchmark metadata source.
- [ ] Remove hardcoded task-count fallbacks from UI and OG generation.
- [ ] Use the same metadata in the homepage evidence strip, About page, OG images, and screenshots.
- [ ] Decide how unavailable metadata is displayed; do not replace it with an unverified number.

#### Acceptance Criteria

- Every page and generated image shows the same task count for a given benchmark version.
- Task count is not inferred from a limited candidate subset.

### 1.4 Fix known interaction defects

#### Tasks

- [x] Standardize the provider callback used by `components/simple-leaderboard.tsx` and `components/leaderboard-view.tsx`.
- [x] Make `components/version-selector.tsx` preserve the current pathname and compatible query parameters.
- [x] Debounce model-search URL synchronization or keep text local until selection/submit.
- [ ] Verify browser back/forward behavior after filter, search, view, and version changes.

#### Acceptance Criteria

- Provider buttons reliably toggle the expected provider.
- Changing versions on a Best-for page remains on that Best-for route.
- Typing in search does not issue a navigation for every keystroke.
- Browser navigation restores visible state without stale controls.

### 1.5 Make shared outputs reproduce visible state

#### Tasks

- [x] Add a Value branch to `app/api/og/route.tsx` using the same formula as the UI.
- [x] Apply the same zero-cost policy to OG Cost and Value rankings as the visible leaderboard.
- [ ] Pass all materially relevant state to metadata and OG generation.
- [ ] Add benchmark version, official/community scope, task count, and generation date to captured PNGs.
- [ ] Extract shared ranking functions so UI, OG generation, and tests do not reimplement formulas.

#### Acceptance Criteria

- The top entries in an OG image match the corresponding URL.
- Captured images identify their benchmark provenance.
- Ranking formulas have one tested implementation per metric.

### Phase 1 Primary Files

- `components/filter-panel.tsx`
- `components/leaderboard-view.tsx`
- `components/simple-leaderboard.tsx`
- `components/scatter-graphs.tsx`
- `components/score-distribution.tsx`
- `components/model-radar.tsx`
- `components/quick-picks.tsx`
- `components/version-selector.tsx`
- `components/model-search.tsx`
- `components/shareable-wrapper.tsx`
- `lib/recommendations.ts`
- `app/api/og/route.tsx`
- `app/page.tsx`
- `app/about/page.tsx`

---

## Phase 2: API Reliability and Enforced Quality

### 2.1 Validate API responses at the boundary

#### Current Evidence

- `lib/api.ts` casts `response.json()` directly to generic TypeScript types.
- `lib/github-contributors.ts` uses the same assertion pattern.
- `lib/transforms.ts` assumes required arrays exist and casts metadata.
- Zod is already installed.

#### Tasks

- [ ] Define Zod schemas for each API response consumed by the application.
- [ ] Parse responses in `lib/api.ts` before returning them.
- [ ] Infer raw API TypeScript types from schemas where practical to prevent drift.
- [ ] Validate GitHub contributor responses or narrow them through an explicit parser.
- [ ] Include endpoint and concise validation diagnostics in logs without exposing sensitive payloads.
- [ ] Add fixture-based tests for valid, missing-field, nullable-field, and malformed responses.

#### Guidance

- Keep API schemas separate from transformed UI/domain types.
- Preserve explicit nullable fields rather than coercing missing data into zero.
- Do not scatter `safeParse` calls through components; parsing belongs at the external boundary.

#### Acceptance Criteria

- Malformed responses cannot silently enter transformation or presentation code.
- Schema failures produce a typed, diagnosable error.
- Tests cover representative payloads for every primary endpoint.

### 2.2 Introduce typed errors, timeout, and cancellation

#### Tasks

- [ ] Add an `ApiError` with HTTP status, endpoint, retryability, and optional cause.
- [ ] Add bounded request timeouts with `AbortController`.
- [ ] Allow client fetch helpers to accept and compose an external `AbortSignal`.
- [ ] Define a conservative retry policy for idempotent transient failures only.
- [ ] Replace silent catches with partial-result reporting or explicit fallback behavior.
- [ ] Add structured production exception reporting using the existing analytics/observability stack or a dedicated error service.

#### Acceptance Criteria

- Requests cannot hang indefinitely.
- Superseded client requests do not update state.
- Users receive retryable error UI for transient failures.
- Partial chart data is labeled partial rather than appearing complete.

### 2.3 Distinguish not found from upstream failure

#### Current Evidence

- Non-2xx API responses currently become the same generic error.
- Submission and user pages can treat network or 5xx failures as missing resources.

#### Tasks

- [ ] Call `notFound()` only for an actual upstream 404.
- [ ] Rethrow timeout, malformed-response, and 5xx errors to route error boundaries.
- [ ] Add route tests for 200, 404, malformed response, timeout, and 500 behavior.
- [ ] Ensure error boundaries provide retry behavior and do not expose internals.

#### Acceptance Criteria

- Missing resources produce a stable 404 response.
- Service failures never become false 404s.
- Retryable failures reach the correct error UI.

### 2.4 Add required CI

#### Current Evidence

- The only GitHub workflow performs secret scanning.
- `next.config.mjs` ignores TypeScript build errors.
- The lint script relies on obsolete `next lint` behavior under Next.js 16.

#### Tasks

- [ ] Add a `typecheck` script using `tsc --noEmit`.
- [ ] Configure ESLint for the current Next.js and TypeScript versions.
- [ ] Replace the obsolete lint script.
- [ ] Add a pull-request workflow that runs:
  1. Frozen dependency installation.
  2. Type checking.
  3. Linting.
  4. Unit and component tests.
  5. Production build.
- [ ] Remove `ignoreBuildErrors` after existing failures are corrected.
- [ ] Cache package-manager and build artifacts only after correctness is established.
- [ ] Keep secret scanning as a separate job or workflow.

#### Acceptance Criteria

- A TypeScript error fails CI and the production build.
- The documented local validation commands match CI exactly.
- CI is required before merging to the protected branch.

### 2.5 Add targeted integration and browser tests

#### Tasks

- [ ] Add rendered component tests for loading, empty, partial, and error states.
- [ ] Add API contract tests for schema validation and pagination.
- [ ] Add a small Playwright suite for:
  - Homepage render and primary navigation.
  - Provider filtering.
  - Best/Average score mode and URL restoration.
  - Version switching from homepage and Best-for pages.
  - Search behavior.
  - Shared URL reload behavior.
  - Submission 404 versus upstream error.
  - Mobile navigation.
- [ ] Use deterministic API fixtures for browser tests; keep a minimal optional smoke test against production data.

#### Acceptance Criteria

- Every defect fixed in Phase 1 has a regression test at the lowest useful layer.
- Critical browser tests run reliably in CI without depending on mutable production data.

### Phase 2 Primary Files

- `lib/api.ts`
- `lib/transforms.ts`
- `lib/github-contributors.ts`
- `app/error.tsx`
- `app/submission/[id]/page.tsx`
- `app/user/[github_username]/page.tsx`
- `next.config.mjs`
- `package.json`
- `.github/workflows/`
- New API schema and browser-test files as needed

---

## Phase 3: Data Efficiency and Caching

### 3.1 Fix badge pagination immediately

#### Current Evidence

- `lib/badges.ts` requests and advances by 1,000 records.
- The API maximum documented in `lib/api.ts` is 200.
- If the API clamps the limit, offsets of 0, 1000, 2000 can skip records.

#### Tasks

- [x] Use the supported page size.
- [x] Advance by returned item count or explicit next-page metadata.
- [x] Stop on a short page or authoritative total.
- [x] Add a regression test for server-clamped page size.
- [x] Add duplicate and no-progress protection to prevent infinite pagination.

#### Acceptance Criteria

- Every submission can be visited exactly once even when the server clamps page size.
- Pagination tests cover empty, exact-page, short-final-page, and clamped responses.

### 3.2 Reduce server request fan-out

#### Current Evidence

- The homepage may fetch details for 40 entries after initial requests.
- Best-for pages may fetch details for 60 entries.
- Category recommendation scope is therefore limited to top overall models.

#### Preferred Backend Work

- [ ] Add a batch submission-detail endpoint or include required aggregates in leaderboard responses.
- [ ] Add version-aware category leaderboard aggregates across all eligible models.
- [ ] Add benchmark metadata to a dedicated endpoint or existing version response.

#### Frontend Interim Work

- [ ] Fetch details only for models actually needed by the visible feature.
- [ ] Share detail promises through a coherent cache rather than component-specific maps.
- [ ] Limit concurrency to avoid bursts against the API.
- [ ] Disclose candidate-pool limits until the backend supports complete category rankings.

#### Acceptance Criteria

- Category winners are evaluated across all eligible models or clearly labeled as limited.
- Homepage and Best-for page request counts are materially lower than the Phase 0 baseline.

### 3.3 Reduce client chart fan-out

#### Current Evidence

- Heatmap makes one submission-detail request per model.
- Distribution can fetch hundreds of submissions client-side.
- Category filtering can fetch per-model details.

#### Tasks

- [ ] Prefer aggregate endpoints for heatmap and distribution data.
- [ ] Until available, fetch only selected or visible models.
- [ ] Share fetched data between graph views.
- [ ] Limit concurrency and expose progressive/partial states.
- [ ] Replace the heatmap Boolean cancellation ref with a generation token or abort signal.
- [ ] Validate, version, and expire persisted `sessionStorage` data.

#### Acceptance Criteria

- Switching rapidly between versions or graph views cannot render stale data.
- Chart caches have a schema version and expiration.
- Large graph views do not issue unbounded parallel requests.

### 3.4 Define a resource-specific caching policy

#### Tasks

- [ ] Classify resources by mutability:
  - Submission detail: effectively immutable.
  - Benchmark versions and metadata: slowly changing.
  - Leaderboard and stream: frequently changing.
  - GitHub contributors: slowly changing and non-critical.
- [ ] Replace the blanket 60-second policy with resource-specific freshness.
- [ ] Prefer framework caching and tags over process-local timers where supported by the deployment target.
- [ ] Document invalidation behavior and failure fallback.
- [ ] Confirm Cloudflare Pages compatibility before adopting Next.js cache APIs.

#### Acceptance Criteria

- Cache behavior is intentional and documented per endpoint.
- Immutable detail responses are not repeatedly fetched without need.
- Deployment-runtime constraints are tested rather than assumed.

### Phase 3 Primary Files

- `lib/badges.ts`
- `lib/api.ts`
- `app/page.tsx`
- `app/best-for/[slug]/page.tsx`
- `components/leaderboard-view.tsx`
- `components/task-heatmap.tsx`
- `components/score-distribution.tsx`

---

## Phase 4: Information Hierarchy, Mobile UX, and Accessibility

### 4.1 Clarify homepage hierarchy

#### Tasks

- [ ] Add a single descriptive `<h1>`.
- [ ] Add a compact evidence strip with benchmark version, task count, scope, last updated, and methodology.
- [ ] Reduce sticky header content to the controls needed during scrolling.
- [ ] Keep secondary context visible but non-sticky.
- [ ] Confirm that screenshot exclusion attributes still produce useful captures.

#### Acceptance Criteria

- The page has a logical heading hierarchy.
- Users can identify what was measured and when without opening Filters or About.
- Sticky UI does not dominate short mobile viewports.

### 4.2 Restore complete mobile navigation

#### Current Evidence

- About, Best For, and Contributors disappear on mobile without a replacement.

#### Tasks

- [ ] Add an accessible mobile navigation menu.
- [ ] Make category filters horizontally scrollable or collapsible.
- [ ] Ensure search, filters, ranking views, and graph modes remain reachable at narrow widths.
- [ ] Test common phone widths and zoomed text.

#### Acceptance Criteria

- All primary desktop destinations are reachable on mobile.
- Controls do not overlap, truncate essential meaning, or require horizontal page scrolling.

### 4.3 Replace custom interaction semantics

#### Tasks

- [ ] Use Radix Tabs for view and graph tabs, or implement complete tab semantics.
- [ ] Use Radix DropdownMenu for sharing, including focus management and dismissal.
- [ ] Add accessible names to icon-only filter, clear, and remove controls.
- [ ] Add `aria-expanded`, `aria-controls`, and selected-state semantics where applicable.
- [ ] Add a skip link to main content.
- [ ] Respect reduced-motion preferences.

#### Acceptance Criteria

- All primary controls are operable by keyboard alone.
- Focus remains visible and moves predictably.
- Automated accessibility checks report no serious violations on primary pages.

### 4.4 Make charts accessible and decision-oriented

#### Tasks

- [ ] Add textual summaries and accessible table alternatives for scatter and distribution charts.
- [ ] Make heatmap cells focusable and provide details on focus, click, and touch.
- [ ] Label only selected or top models in scatter plots to reduce collisions.
- [ ] Replace unexplained midpoint quadrants with user-defined or clearly explained thresholds.
- [ ] Make distribution jitter deterministic.
- [ ] Show missing radar metrics as unavailable rather than assigning 50.
- [ ] Provide compact ranked-list alternatives on mobile where a chart becomes unreadable.

#### Acceptance Criteria

- Chart insights are available without hover or visual interpretation alone.
- Re-rendering does not move jittered points randomly.
- Missing values cannot appear as average performance.

### Phase 4 Primary Files

- `components/site-nav.tsx`
- `components/leaderboard-header.tsx`
- `components/leaderboard-view.tsx`
- `components/filter-panel.tsx`
- `components/shareable-wrapper.tsx`
- `components/scatter-graphs.tsx`
- `components/task-heatmap.tsx`
- `components/score-distribution.tsx`
- `components/model-radar.tsx`
- `app/layout.tsx`

---

## Phase 5: SEO, Sharing, and Methodology

Begin this phase after the underlying ranking and canonical-state behavior is stable.

### 5.1 Add detail-page metadata

#### Tasks

- [ ] Add dynamic metadata for model pages using validated model data.
- [ ] Add model-specific OG images or extend the existing route safely.
- [ ] Decide whether submission pages are canonical public records or should be `noindex`.
- [ ] Add canonical URLs for filter and version variants.
- [ ] Avoid indexing duplicate parameter combinations that render equivalent content.

#### Acceptance Criteria

- Model pages have unique titles, descriptions, canonical URLs, and social previews.
- Submission indexing behavior is deliberate and documented.

### 5.2 Expand sitemap coverage intentionally

#### Tasks

- [ ] Include stable Best-for routes.
- [ ] Include stable model routes when source data is authoritative.
- [ ] Evaluate Stream and profile routes for indexing value and stability.
- [ ] Exclude transient or combinatorial filter URLs.
- [ ] Add `Dataset` and/or `ItemList` structured data if it accurately represents the page.

#### Acceptance Criteria

- Search engines can discover stable high-intent pages without crawling parameter explosions.
- Structured data validates and matches visible content.

### 5.3 Turn About into a maintained methodology system

#### Current Evidence

- The task catalog is hardcoded in `app/about/page.tsx`.
- Methodology, task catalog, grading, versioning, repositories, contributing, and FAQ share one long page.

#### Tasks

- [ ] Source task metadata from the benchmark manifest or API.
- [ ] Separate or clearly section methodology, task catalog, version changelog, limitations, and reproducibility.
- [ ] Document official-run criteria, judge configuration, retry policy, model settings, and known limitations.
- [ ] Link concise methodology and limitations from ranking surfaces.
- [ ] Reuse benchmark metadata rather than maintaining facts in multiple files.

#### Acceptance Criteria

- Task documentation cannot drift independently from benchmark metadata.
- Users can understand ranking limitations without reading the full About page.
- Version changes have a discoverable explanation.

### Phase 5 Primary Files

- `app/model/[...slug]/page.tsx`
- `app/submission/[id]/page.tsx`
- `app/sitemap.ts`
- `app/page.tsx`
- `app/about/page.tsx`
- `app/api/og/route.tsx`

---

## Phase 6: Tooling, Documentation, and Codebase Cleanup

### 6.1 Standardize package management

#### Current Evidence

- Both `bun.lock` and `pnpm-lock.yaml` are committed.
- README instructions use pnpm while tests use Bun.
- `package.json` has no `packageManager` field and is named `my-project`.

#### Tasks

- [ ] Choose Bun or pnpm as the only supported package manager. Bun is the architecture document's stated default.
- [ ] Add an exact `packageManager` field.
- [ ] Keep one lockfile and update CI accordingly.
- [ ] Rename the package to a project-specific private name.
- [ ] Verify Tailwind/PostCSS package-version compatibility and remove mismatched unused packages.

#### Acceptance Criteria

- Local docs and CI use the same commands and lockfile.
- A clean checkout has one deterministic installation path.

### 6.2 Update repository documentation

#### Tasks

- [ ] Remove README claims that the application uses mock data.
- [ ] Document the real API origin configuration and development flow.
- [ ] Document local validation commands and deployment expectations.
- [ ] Explain the server/client data flow and cache policy.
- [ ] Mark completed or obsolete planning documents as historical where useful.

#### Acceptance Criteria

- A new contributor can install, run, test, and understand the production data flow from current documentation.

### 6.3 Consolidate stale scaffolding

#### Candidates to Verify

- `lib/mock-data.ts`
- `components/leaderboard-table.tsx`
- Duplicate global CSS locations
- Duplicate toast/mobile hooks
- Unused Geist font loading
- `generator: 'v0.app'` metadata

#### Tasks

- [ ] Confirm each candidate is unused before deletion.
- [ ] Remove alternate implementations that can drift from the active leaderboard.
- [ ] Establish one intentional typography path: apply Geist consistently or remove it.
- [ ] Remove obsolete generator metadata.
- [ ] Run typecheck, tests, and build after each cleanup group.

#### Acceptance Criteria

- There is one active implementation for each primary concern.
- Removed files have no runtime, import, or documentation references.

---

## Recommended Pull Request Breakdown

Keep pull requests narrow enough to review and roll back independently.

1. Metric contract and shared score-mode URL helpers.
2. Graph score-mode corrections and regression tests.
3. Sample-count labels, eligibility, and cost caveats.
4. Benchmark metadata source and task-count cleanup.
5. Provider, version-selector, and search interaction fixes.
6. Shared ranking functions and OG/captured-image parity.
7. Zod schemas and API contract tests.
8. Typed API errors, timeouts, and route-status handling.
9. ESLint, typecheck, CI workflow, and removal of ignored build errors.
10. Badge pagination fix and tests.
11. Server request fan-out reduction.
12. Client chart cancellation, persistence, and aggregate-data work.
13. Homepage evidence strip and mobile navigation.
14. Tabs, menus, accessible names, and skip link.
15. Accessible chart alternatives and deterministic visualization behavior.
16. Dynamic metadata, canonical strategy, and sitemap expansion.
17. Methodology/task-catalog restructuring.
18. Package-manager, README, typography, and dead-code cleanup.

## Testing Strategy

### Unit Tests

Use for deterministic calculations and parsers:

- Ranking and tie-breaking.
- Value-score formula.
- Recommendation eligibility.
- URL parameter parsing and canonical serialization.
- Zod schemas and transforms.
- Pagination.
- Cache expiration and persisted-data validation.

### Component Tests

Use for stateful rendering without full browser navigation:

- Best/Average controls.
- Missing and partial metric display.
- Sample-size and caveat labels.
- Loading, empty, partial, and failed chart states.
- Keyboard interaction for tabs, menus, and heatmap cells.

### Browser Tests

Use for cross-component and routing behavior:

- URL state restoration and back/forward navigation.
- Provider, view, graph, score, verified, and version filters.
- Search debouncing and selection.
- Version changes from nested routes.
- Mobile navigation.
- Actual 404 versus retryable error behavior.
- Screenshot/share state where practical.

### Manual Verification

Use a short release checklist for behavior that benefits from visual inspection:

- Desktop and mobile chart readability.
- Focus order and focus visibility.
- Screen-reader labels on icon controls.
- OG image content and provenance.
- Captured PNG exclusions and metadata.
- Cloudflare deployment caching behavior.

## Dependencies and Coordination

Some improvements require changes in `pinchbench-api` or `pinchbench-skill`:

- Complete category ranking data across all eligible models.
- Batch submission details.
- Heatmap and score-distribution aggregates.
- Version-aware benchmark metadata and task manifest.
- Explicit pagination metadata or cursors.

For each backend dependency:

1. Define the response contract and nullability before frontend implementation.
2. Add runtime schemas and fixtures in this repository.
3. Preserve a clearly labeled interim state if the endpoint is unavailable.
4. Do not infer authoritative facts from a partial frontend candidate set.

## Rollout Guidance

- Release Phase 1 as a named trust-and-correctness update.
- Use feature flags only where a change is risky or depends on backend rollout; avoid long-lived dual implementations.
- Monitor API schema failures, request timeouts, chart failures, and 404 rates after Phase 2.
- Compare request counts and route latency against the Phase 0 baseline after Phase 3.
- Run accessibility and mobile checks before announcing UX changes.
- Update methodology copy in the same release as any ranking-semantic change.

## Definition of Done for Each Work Item

A work item is complete only when:

- Behavior matches the documented metric and URL contract.
- Loading, empty, partial, error, and missing-data states are handled where applicable.
- Relevant automated tests are added or updated.
- Typecheck, lint, tests, and production build pass.
- Mobile and keyboard behavior is verified for user-facing changes.
- Shared images and metadata are updated when visible ranking behavior changes.
- Documentation is updated when semantics, setup, or architecture changes.
- No unrelated user or concurrent-agent changes are reverted.

## First Implementation Milestone

The first milestone should include only the highest-confidence, highest-impact corrections:

- [x] Document and test canonical metric semantics.
- [x] Correct graph score-mode behavior.
- [x] Fix provider filtering and nested-route version selection.
- [x] Correct task-count and OG Value/Cost inconsistencies.
- [x] Fix badge pagination.
- [x] Add submission count and best-observed labels to relevant rankings.
- [x] Add regression tests for all six areas.

Completing this milestone will remove known misleading behavior and establish the contracts needed for API hardening and larger performance work.
