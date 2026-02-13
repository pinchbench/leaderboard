import type {
  LeaderboardResponse,
  SubmissionDetailResponse,
  SubmissionsListResponse,
  StatsResponse,
  BenchmarkVersionsResponse,
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

export async function fetchLeaderboard(version?: string): Promise<LeaderboardResponse> {
  const params = version ? `?version=${encodeURIComponent(version)}` : "";
  return fetchJson<LeaderboardResponse>(`/leaderboard${params}`);
}

export async function fetchBenchmarkVersions(): Promise<BenchmarkVersionsResponse> {
  return fetchJson<BenchmarkVersionsResponse>("/benchmark_versions");
}

export async function fetchSubmission(
  id: string,
): Promise<SubmissionDetailResponse> {
  return fetchJson<SubmissionDetailResponse>(`/submissions/${id}`);
}

export async function fetchSubmissions(
  version?: string,
  limit: number = 200,
  offset: number = 0,
): Promise<SubmissionsListResponse> {
  const params = new URLSearchParams();
  if (version) params.set("version", version);
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  return fetchJson<SubmissionsListResponse>(`/submissions?${params.toString()}`);
}

export async function fetchStats(): Promise<StatsResponse> {
  return fetchJson<StatsResponse>("/stats");
}
