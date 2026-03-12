/**
 * Category utilities for filtering and determining completeness
 */

import { CATEGORY_ICONS } from '@/lib/types'
import type { TaskResult } from '@/lib/types'

/**
 * All known benchmark categories
 */
export const ALL_CATEGORIES = Object.keys(CATEGORY_ICONS)

/**
 * Number of categories a "complete" benchmark run should have
 * Note: A submission might not have tasks in every category if it's partial
 */
export const EXPECTED_CATEGORY_COUNT = ALL_CATEGORIES.length

/**
 * Get unique categories from task results
 */
export function getUniqueCategories(tasks: TaskResult[]): Set<string> {
  return new Set(tasks.map(t => t.category))
}

/**
 * Check if a submission has tasks in all expected categories
 */
export function hasAllCategories(tasks: TaskResult[]): boolean {
  const categories = getUniqueCategories(tasks)
  return ALL_CATEGORIES.every(cat => categories.has(cat))
}

/**
 * Count how many categories are covered by the tasks
 */
export function getCategoryCount(tasks: TaskResult[]): number {
  return getUniqueCategories(tasks).size
}

/**
 * Get categories that are missing from the task results
 */
export function getMissingCategories(tasks: TaskResult[]): string[] {
  const present = getUniqueCategories(tasks)
  return ALL_CATEGORIES.filter(cat => !present.has(cat))
}

/**
 * Calculate score percentage for only selected categories
 */
export function calculateFilteredScore(
  tasks: TaskResult[],
  selectedCategories: string[]
): { score: number; maxScore: number; percentage: number } | null {
  if (selectedCategories.length === 0) return null
  
  const filteredTasks = tasks.filter(t => selectedCategories.includes(t.category))
  if (filteredTasks.length === 0) return null
  
  const score = filteredTasks.reduce((sum, t) => sum + t.score, 0)
  const maxScore = filteredTasks.reduce((sum, t) => sum + t.max_score, 0)
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0
  
  return { score, maxScore, percentage }
}

/**
 * Group tasks by category with aggregated scores
 */
export function groupTasksByCategory(
  tasks: TaskResult[]
): Map<string, { tasks: TaskResult[]; score: number; maxScore: number; percentage: number }> {
  const groups = new Map<string, { tasks: TaskResult[]; score: number; maxScore: number; percentage: number }>()
  
  for (const task of tasks) {
    const existing = groups.get(task.category)
    if (existing) {
      existing.tasks.push(task)
      existing.score += task.score
      existing.maxScore += task.max_score
    } else {
      groups.set(task.category, {
        tasks: [task],
        score: task.score,
        maxScore: task.max_score,
        percentage: 0, // calculated after
      })
    }
  }
  
  // Calculate percentages
  for (const [, group] of groups) {
    group.percentage = group.maxScore > 0 ? (group.score / group.maxScore) * 100 : 0
  }
  
  return groups
}
