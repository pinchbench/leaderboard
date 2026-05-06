/** Format a number to fixed decimal places */
export function fmtNum(n: number, decimals = 2): string {
  return n.toFixed(decimals)
}

/** Format a number as a USD currency string (e.g., $1.50) */
export function fmtCurrency(value: number, decimals = 2): string {
  return `$${value.toFixed(decimals)}`
}

/** Format seconds into a human-readable duration (e.g., "1m 30s", "45s") */
export function fmtDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  let mins = Math.floor(seconds / 60)
  let secs = Math.round(seconds % 60)
  if (secs === 60) {
    mins += 1
    secs = 0
  }
  return `${mins}m ${secs}s`
}

/** Format a speed value (seconds) with one decimal, or return N/A */
export function fmtSpeed(seconds: number | null | undefined): string {
  if (seconds == null) return 'N/A'
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(0)
  return `${mins}m ${secs}s`
}

/** Format a cost value with 4 decimals (for small API costs), or return N/A */
export function fmtCost(cost: number | null | undefined): string {
  if (cost == null) return 'N/A'
  return `$${cost.toFixed(4)}`
}
