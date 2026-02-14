export interface LeaderboardEntry {
  rank: number;
  model: string;
  provider: string;
  percentage: number;
  timestamp: string;
  submission_id: string;
  average_execution_time_seconds?: number | null;
  best_execution_time_seconds?: number | null;
  average_cost_usd?: number | null;
  best_cost_usd?: number | null;
  submission_count?: number;
  average_score_percentage?: number | null;
}

export interface TaskResult {
  task_id: string;
  task_name: string;
  category: string;
  score: number;
  max_score: number;
  breakdown: Record<string, number>;
  grading_type: "automated" | "llm_judge" | "hybrid";
  timed_out: boolean;
  notes?: string;
  execution_time_seconds?: number | null;
}

export interface Submission {
  submission_id: string;
  timestamp: string;
  openclaw_version: string;
  model: string;
  provider: string;
  task_results: TaskResult[];
  total_score: number;
  max_score: number;
  metadata: {
    run_timestamp: number;
    task_count: number;
  };
  usage_summary?: UsageSummary;
}

export interface UsageSummary {
  total_input_tokens: number;
  total_output_tokens: number;
  total_requests: number;
  total_cost_usd: number;
}

export interface ApiLeaderboardEntry {
  model: string;
  provider: string;
  best_score_percentage: number;
  latest_submission: string;
  best_submission_id: string;
  average_execution_time_seconds?: number | null;
  best_execution_time_seconds?: number | null;
  average_cost_usd?: number | null;
  best_cost_usd?: number | null;
  submission_count?: number;
  average_score_percentage?: number | null;
}

export interface LeaderboardResponse {
  leaderboard: ApiLeaderboardEntry[];
}

export interface ApiSubmissionDetail {
  id: string;
  timestamp: string;
  openclaw_version: string | null;
  model: string;
  provider: string;
  tasks: ApiTaskResult[];
  total_score: number;
  max_score: number;
  metadata?: {
    run_timestamp?: number;
    task_count?: number;
    system?: Record<string, unknown>;
  };
  usage_summary?: UsageSummary;
  rank?: number;
  percentile?: number;
  verified?: boolean;
  run_id?: string;
}

export interface SubmissionDetailResponse {
  submission: ApiSubmissionDetail;
}

export interface ApiTaskResult {
  task_id: string;
  score: number;
  max_score: number;
  breakdown: Record<string, number>;
  grading_type: "automated" | "llm_judge" | "hybrid";
  timed_out: boolean;
  notes?: string;
  execution_time_seconds?: number | null;
  frontmatter?: {
    id?: string;
    name?: string;
    category?: string;
    grading_type?: "automated" | "llm_judge" | "hybrid";
    timeout_seconds?: number;
  };
}

export interface ApiSubmissionListItem {
  id: string;
  model: string;
  provider: string;
  score_percentage: number;
  total_score: number;
  max_score: number;
  total_execution_time_seconds: number;
  total_cost_usd: number;
  timestamp: string;
  created_at: string;
  client_version: string | null;
  openclaw_version: string | null;
  benchmark_version: string;
  claimed: number;
}

export interface SubmissionsListResponse {
  submissions: ApiSubmissionListItem[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
  benchmark_version: string | null;
  benchmark_versions: string[];
}

export interface ApiModelSubmissionItem {
  id: string;
  score_percentage: number;
  total_score: number;
  max_score: number;
  timestamp: string;
  is_best: boolean;
}

export interface ModelSubmissionsResponse {
  submissions: ApiModelSubmissionItem[];
  model: string;
  benchmark_version: string;
  benchmark_versions: string[];
}

export interface StatsResponse {
  updated_at?: string;
  models_count?: number;
}

export interface BenchmarkVersion {
  id: string;
  created_at: string;
  is_current: boolean;
  submission_count: number;
}

export interface BenchmarkVersionsResponse {
  versions: BenchmarkVersion[];
}

export const CATEGORY_ICONS: Record<string, string> = {
  api: "🔌",
  validation: "✅",
  calendar: "📅",
  research: "🔍",
  writing: "✍️",
  coding: "💻",
  comprehension: "📖",
  context: "🧠",
  complex: "🔗",
  other: "📌",
};

export const PROVIDER_COLORS: Record<string, string> = {
  anthropic: "#d97757",
  openai: "#10a37f",
  google: "#4285f4",
  meta: "#0668E1",
  mistral: "#FF7000",
  cohere: "#D18EE2",
  moonshotai: "#5865F2",
  "x-ai": "#FFFFFF",
  "z-ai": "#3366FF",
  minimax: "#6366F1",
  "arcee-ai": "#8B5CF6",
  deepseek: "#3C5DFF",
  stepfun: "#00D4AA",
  mistralai: "#FF7000",
};
