'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ChevronDown, Trophy, Check } from 'lucide-react'
import { fetchModelSubmissionsClient } from '@/lib/api'
import type { ApiModelSubmissionItem } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

interface RunSelectorProps {
  model: string
  currentSubmissionId: string
}

function getScoreColor(percentage: number): string {
  if (percentage >= 85) return 'text-green-500'
  if (percentage >= 70) return 'text-yellow-500'
  return 'text-red-500'
}

export function RunSelector({ model, currentSubmissionId }: RunSelectorProps) {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<ApiModelSubmissionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    fetchModelSubmissionsClient(model)
      .then((response) => {
        if (!cancelled) {
          setSubmissions(response.submissions)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [model])

  // Show skeleton while loading to prevent layout shift
  if (loading) {
    return <Skeleton className="h-8 w-[130px] rounded-md" />
  }

  // Don't render if errored or only one run exists
  if (error || submissions.length <= 1) {
    return null
  }

  const currentIndex = submissions.findIndex(
    (s) => s.id === currentSubmissionId,
  )
  const currentSub = currentIndex >= 0 ? submissions[currentIndex] : null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 text-xs font-normal"
        >
          <span className="text-muted-foreground">Run</span>
          <span className="font-medium">
            {currentIndex >= 0 ? currentIndex + 1 : '?'} of{' '}
            {submissions.length}
          </span>
          {currentSub?.is_best && (
            <Trophy className="h-3 w-3 text-yellow-500" />
          )}
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[320px]">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          {submissions.length} runs for this model
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {submissions.map((sub, index) => {
          const score = sub.score_percentage * 100
          const isCurrent = sub.id === currentSubmissionId

          return (
            <DropdownMenuItem
              key={sub.id}
              className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
              onSelect={() => {
                if (!isCurrent) {
                  router.push(`/submission/${sub.id}`)
                }
              }}
            >
              {/* Check mark column */}
              <div className="w-4 shrink-0">
                {isCurrent && (
                  <Check className="h-4 w-4 text-foreground" />
                )}
              </div>

              {/* Run number */}
              <span className="text-xs text-muted-foreground w-4 shrink-0 text-right">
                {index + 1}
              </span>

              {/* Score */}
              <span
                className={`text-sm font-mono font-semibold w-14 shrink-0 ${getScoreColor(score)}`}
              >
                {score.toFixed(1)}%
              </span>

              {/* Date */}
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {format(new Date(sub.timestamp), 'MMM d, yyyy')}
              </span>

              {/* Best badge, pushed to the right */}
              <div className="ml-auto">
                {sub.is_best && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 h-4 border-yellow-500/50 text-yellow-500"
                  >
                    Best
                  </Badge>
                )}
              </div>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
