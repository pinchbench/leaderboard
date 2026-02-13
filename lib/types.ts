export interface LeaderboardEntry {
  rank: number
  model: string
  provider: string
  total_score: number
  max_score: number
  percentage: number
  timestamp: string
  submission_id: string
}

export interface TaskResult {
  task_id: string
  task_name: string
  category: string
  score: number
  max_score: number
  breakdown: Record<string, number>
  grading_type: 'automated' | 'llm_judge' | 'hybrid'
  timed_out: boolean
  notes?: string
}

export interface Submission {
  submission_id: string
  timestamp: string
  openclaw_version: string
  model: string
  provider: string
  task_results: TaskResult[]
  total_score: number
  max_score: number
  metadata: {
    run_timestamp: number
    task_count: number
  }
}

export const CATEGORY_ICONS: Record<string, string> = {
  calendar: '📅',
  research: '🔍',
  writing: '✍️',
  coding: '💻',
  comprehension: '📖',
  context: '🧠',
  complex: '🔗',
}

export const PROVIDER_COLORS: Record<string, string> = {
  anthropic: '#d97757',
  openai: '#10a37f',
  google: '#4285f4',
  meta: '#0668E1',
  mistral: '#FF7000',
  cohere: '#D18EE2',
}
