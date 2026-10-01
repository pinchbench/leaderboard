export function parseTaskCountFromReleaseNotes(notes: string | null | undefined): number | null {
  const match = notes?.match(/(\d+)\s+tasks/i);
  if (!match) return null;
  const count = Number(match[1]);
  return Number.isInteger(count) && count > 0 ? count : null;
}

export function formatTaskCount(count: number | null | undefined): string {
  return count == null || count <= 0 ? "task count unavailable" : `${count} tasks`;
}
