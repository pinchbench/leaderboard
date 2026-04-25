'use client'

import { TASK_CATEGORIES } from '@/lib/types'

interface CategoryPillsProps {
  selectedCategories: string[]
  onCategoriesChange: (categories: string[]) => void
  disabled?: boolean
  activeTaskCount?: number | null
  className?: string
}

export function CategoryPills({
  selectedCategories,
  onCategoriesChange,
  disabled = false,
  activeTaskCount,
  className = '',
}: CategoryPillsProps) {
  const selected = new Set(selectedCategories)
  const hasFilter = selectedCategories.length > 0

  const toggleCategory = (category: string) => {
    if (disabled) return
    onCategoriesChange(
      selected.has(category)
        ? selectedCategories.filter((c) => c !== category)
        : [...selectedCategories, category],
    )
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`} data-share-exclude="true">
      <span className="text-xs font-medium text-muted-foreground shrink-0">
        Category:
      </span>
      <button
        type="button"
        onClick={() => onCategoriesChange([])}
        disabled={disabled}
        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border disabled:opacity-60 disabled:cursor-wait ${
          !hasFilter
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-secondary text-secondary-foreground border-border hover:bg-secondary/80'
        }`}
      >
        All
      </button>
      {TASK_CATEGORIES.map((category) => {
        const active = selected.has(category.id)
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => toggleCategory(category.id)}
            disabled={disabled}
            title={category.description}
            aria-pressed={active}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border disabled:opacity-60 disabled:cursor-wait ${
              active
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-secondary text-secondary-foreground border-border hover:bg-secondary/80'
            }`}
          >
            <span aria-hidden="true">{category.icon}</span>
            <span>{category.shortLabel}</span>
          </button>
        )
      })}
      {hasFilter && activeTaskCount != null ? (
        <span className="text-xs text-muted-foreground/70">
          {activeTaskCount} task{activeTaskCount === 1 ? '' : 's'} selected
        </span>
      ) : null}
    </div>
  )
}
