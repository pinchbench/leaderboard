'use client'

import { useMemo, useState } from 'react'
import { CATEGORY_ICONS } from '@/lib/types'
import { ALL_CATEGORIES } from '@/lib/categories'
import { Check, ChevronDown, Filter } from 'lucide-react'

interface CategoryFilterProps {
  selectedCategories: string[]
  onChange: (categories: string[]) => void
  className?: string
}

export function CategoryFilter({ selectedCategories, onChange, className = '' }: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const allSelected = selectedCategories.length === ALL_CATEGORIES.length
  const noneSelected = selectedCategories.length === 0
  const someSelected = !allSelected && !noneSelected
  
  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      onChange(selectedCategories.filter(c => c !== category))
    } else {
      onChange([...selectedCategories, category])
    }
  }
  
  const selectAll = () => onChange([...ALL_CATEGORIES])
  const selectNone = () => onChange([])
  
  const label = useMemo(() => {
    if (allSelected || noneSelected) return 'All categories'
    if (selectedCategories.length === 1) {
      return `${CATEGORY_ICONS[selectedCategories[0]] || ''} ${selectedCategories[0]}`
    }
    return `${selectedCategories.length} categories`
  }, [selectedCategories, allSelected, noneSelected])
  
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
          someSelected
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-border bg-background text-muted-foreground hover:text-foreground'
        }`}
      >
        <Filter className="h-3 w-3" />
        <span>{label}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          {/* Backdrop to close on click outside */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute top-full left-0 mt-1 z-50 min-w-[200px] rounded-lg border border-border bg-popover shadow-lg">
            {/* Quick actions */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
              <button
                onClick={selectAll}
                className={`text-xs px-2 py-0.5 rounded transition-colors ${
                  allSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                All
              </button>
              <button
                onClick={selectNone}
                className={`text-xs px-2 py-0.5 rounded transition-colors ${
                  noneSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                None
              </button>
            </div>
            
            {/* Category list */}
            <div className="py-1 max-h-[300px] overflow-y-auto">
              {ALL_CATEGORIES.map(category => {
                const isSelected = selectedCategories.includes(category)
                return (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-muted/50 ${
                      isSelected ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    <span className="w-4 h-4 flex items-center justify-center">
                      {isSelected && <Check className="h-3 w-3 text-primary" />}
                    </span>
                    <span className="text-base">{CATEGORY_ICONS[category] || '📌'}</span>
                    <span className="capitalize">{category}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
