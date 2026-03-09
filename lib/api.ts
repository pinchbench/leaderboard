import type {
  LeaderboardResponse,
  SubmissionDetailResponse,
  SubmissionsListResponse,
  StatsResponse,
  BenchmarkVersionsResponse,
  ModelSubmissionsResponse,
  UserSubmissionsResponse,
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
  const params = new URLSearchParams();
  params.set("official", "true");
  if (version) params.set("version", version);
  const queryString = params.toString();
  return fetchJson<LeaderboardResponse>(`/leaderboard${queryString ? `?${queryString}` : ""}`);
}

export async function fetchUserSubmissions(
  githubUsername: string,
  options?: { version?: string; limit?: number; offset?: number },
): Promise<UserSubmissionsResponse> {
  const params = new URLSearchParams();
  if (options?.version) params.set("version", options.version);
  if (options?.limit != null) params.set("limit", String(options.limit));
  if (options?.offset != null) params.set("offset", String(options.offset));
  const query = params.toString();
  return fetchJson<UserSubmissionsResponse>(
    `/users/${encodeURIComponent(githubUsername)}/submissions${query ? `?${query}` : ""}`,
  );
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
  params.set("official", "true");
  if (version) params.set("version", version);
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  return fetchJson<SubmissionsListResponse>(`/submissions?${params.toString()}`);
}

export async function fetchStats(): Promise<StatsResponse> {
  return fetchJson<StatsResponse>("/stats");
}

/**
 * Fetch a single submission detail (client-side, no ISR caching).
 * Used by chart components that need task-level data.
 */
export async function fetchSubmissionClient(
  id: string,
): Promise<SubmissionDetailResponse> {
  const response = await fetch(`${API_BASE}/submissions/${id}`);
  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`,
    );
  }
  return response.json() as Promise<SubmissionDetailResponse>;
}

/**
 * Fetch the submissions list (client-side, no ISR caching).
 * Used by chart components that need all submissions for distribution analysis.
 */
/**
 * Fetch all submissions for a specific model (client-side, no ISR caching).
 * Used by the RunSelector component on the submission detail page.
 */
export async function fetchModelSubmissionsClient(
  model: string,
): Promise<ModelSubmissionsResponse> {
  const response = await fetch(
    `${API_BASE}/model-submissions?official=true&model=${encodeURIComponent(model)}`,
  );
  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`,
    );
  }
  return response.json() as Promise<ModelSubmissionsResponse>;
}

export async function fetchSubmissionsClient(
  version?: string,
  limit: number = 500,
): Promise<SubmissionsListResponse> {
  const params = new URLSearchParams();
  params.set("official", "true");
  if (version) params.set("version", version);
  params.set("limit", String(limit));
  const response = await fetch(`${API_BASE}/submissions?${params.toString()}`);
  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`,
    );
  }
  return response.json() as Promise<SubmissionsListResponse>;
}
