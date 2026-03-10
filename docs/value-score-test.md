# Value Score & CPST Feature — Manual Test Plan

## Overview
This document describes manual test cases for the `Value Score`, `CPST`, Budget Filter,
and Best Value sort mode added to the PinchBench leaderboard.

---

## Features Under Test

| Feature | Description |
|---|---|
| Value Score | `score_percentage / best_cost_usd` — higher = more quality per dollar |
| CPST | `best_cost_usd / estimated_successful_tasks` — cost per task solved |
| Best Value sort | Sort success-rate table by Value Score instead of success % |
| Budget Filter | Show only models with `best_cost_usd <= maxCost` |
| 💎 Value tab | Dedicated tab in nav header for Value Score leaderboard |

---

## Test Cases

### TC-1: Value tab appears in header nav
**Steps:**
1. Open `http://localhost:3000`
2. Look at the navigation buttons (Success Rate / Speed / Cost / **Value** / Graphs)

**Expected:** A "💎 Value" button is visible.

---

### TC-2: Value tab shows correct columns
**Steps:**
1. Click "💎 Value"
2. Inspect the table headers

**Expected:** Columns: Rank | Model | Provider | Value Score | Success % | Best Cost | CPST

---

### TC-3: Value Score = N/A for models without cost data
**Steps:**
1. Go to Value tab
2. Find a model listed at the bottom (greyed out, rank --)

**Expected:** The model's Value Score and CPST columns show "N/A" and "no cost data".

---

### TC-4: Value Score formula correctness
**Steps:**
1. Note any model's `Success %` and `Best Cost` from the Value tab
2. Calculate manually: `Value Score = Success% / Best Cost`

**Example:** Model with 75% success and $0.30 cost → Value Score = 75/0.30 = 250

**Expected:** The displayed Value Score matches the formula.

---

### TC-5: CPST formula correctness
**Steps:**
1. Note a model's `Best Cost` and `Success %` from the Value tab
2. Calculate: `estimated_tasks = round(success_pct/100 * 40)`; `CPST = Best Cost / estimated_tasks`

**Example:** 75% success, $0.30 cost → 30 tasks → CPST = $0.30/30 = $0.0100

**Expected:** Displayed CPST matches (within floating point rounding).

---

### TC-6: Budget Filter (Value tab)
**Steps:**
1. Go to Value tab
2. In the "💰 Budget filter" box, type `0.50`

**Expected:**
- Only models with Best Cost ≤ $0.50 are shown
- Count badge updates: "Showing N models ≤ $0.50/run"

---

### TC-7: Clear Budget Filter
**Steps:**
1. Enter a budget value (e.g. 0.50)
2. Click "✕ Clear"

**Expected:** All models reappear; filter badge disappears.

---

### TC-8: Budget Filter on Success Rate tab
**Steps:**
1. Go to Success Rate tab
2. In the "💰 Budget filter" row, enter `1.00`

**Expected:** Only models with cost ≤ $1.00 are shown in the table and bar chart.

---

### TC-9: Best Value sort mode on Success Rate tab
**Steps:**
1. Go to Success Rate tab
2. Click "💎 Best Value" toggle button (next to "Max Quality")

**Expected:**
- Table reorders by Value Score descending
- A new "💎 Value Score" column appears in the table
- Models without cost data sink to the bottom (N/A)

---

### TC-10: Max Quality sort mode restores original order
**Steps:**
1. From TC-9, click "Max Quality"

**Expected:** Table returns to success % descending order; Value Score column disappears.

---

### TC-11: Hover tooltip shows Value Score on Success Rate tab
**Steps:**
1. Go to Success Rate tab
2. Hover over any bar in the bar chart

**Expected:** Tooltip includes "Value Score: X.X" if the model has cost data.

---

### TC-12: $0 / null cost protection
**Precondition:** A model exists with `best_cost_usd = 0` or null.

**Expected:**
- Value Score = N/A (not Infinity or NaN)
- CPST = N/A
- The model appears in the null/no-cost section at the bottom of the Value tab

---

## Build Verification
```bash
cd /Users/developer/repos/leaderboard
bun install
bun run build
# Expected: No TypeScript errors, build exits 0
```

---

## Notes
- `successful_tasks` is estimated as `round(best_score_percentage * 40)` (PinchBench has ~40 tasks).
  If the API later exposes `max_score` per entry, this can be made exact.
- Budget filter applies across both the Value tab and the Success Rate tab.
- No backend API changes were made; all computation is client-side in `lib/transforms.ts`.
