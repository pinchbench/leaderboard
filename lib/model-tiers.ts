export type ModelTier = 'frontier' | 'mid' | 'budget'

const FRONTIER_PATTERNS = [
  'opus', 'gpt-5', 'o3', 'o1-pro', 'gemini-2.5-pro', 'gemini-2.0-pro',
  'gemini-pro', 'claude-4', 'gpt-4.5',
]

const BUDGET_PATTERNS = [
  'haiku', 'mini', 'nano', 'flash-lite', 'gpt-4o-mini', 'gemini-2.0-flash-lite',
  'deepseek-v3', 'deepseek-chat', 'qwen-2.5-coder',
]

export function getModelTier(model: string): ModelTier {
  const lower = model.toLowerCase()
  for (const pattern of FRONTIER_PATTERNS) {
    if (lower.includes(pattern)) return 'frontier'
  }
  for (const pattern of BUDGET_PATTERNS) {
    if (lower.includes(pattern)) return 'budget'
  }
  return 'mid'
}

export const TIER_LABELS: Record<ModelTier, string> = {
  frontier: 'Frontier',
  mid: 'Mid',
  budget: 'Budget',
}
