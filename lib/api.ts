import type {
  LeaderboardResponse,
  SubmissionDetailResponse,
  StatsResponse,
} from "@/lib/types";

const API_BASE = "https://api.pinchbench.com/api";

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<T>;
}

export async function fetchLeaderboard(): Promise<LeaderboardResponse> {
  return fetchJson<LeaderboardResponse>("/leaderboard");
}

export async function fetchSubmission(
  id: string,
): Promise<SubmissionDetailResponse> {
  return fetchJson<SubmissionDetailResponse>(`/submissions/${id}`);
}

export async function fetchStats(): Promise<StatsResponse> {
  return fetchJson<StatsResponse>("/stats");
}
