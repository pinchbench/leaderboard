'use client'

import { Card } from '@/components/ui/card'

interface ScoreGaugeProps {
  score: number
  maxScore: number
}

export function ScoreGauge({ score, maxScore }: ScoreGaugeProps) {
  const percentage = (score / maxScore) * 100
  const circumference = 2 * Math.PI * 70
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const getColor = () => {
    if (percentage >= 85) return '#22c55e'
    if (percentage >= 70) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <Card className="p-8 flex flex-col items-center justify-center bg-card border-border">
      <div className="relative w-48 h-48">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="96"
            cy="96"
            r="70"
            stroke="hsl(var(--muted))"
            strokeWidth="12"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="96"
            cy="96"
            r="70"
            stroke={getColor()}
            strokeWidth="12"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl mb-1">
            {percentage >= 85 ? '🦞' : percentage >= 70 ? '🦀' : '🦐'}
          </div>
          <div className="text-4xl font-bold" style={{ color: getColor() }}>
            {percentage.toFixed(0)}%
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {score.toFixed(1)} / {maxScore.toFixed(1)}
          </div>
        </div>
      </div>
      <div className="mt-4 text-center">
        <p className="text-sm font-semibold text-foreground">Overall Score</p>
      </div>
    </Card>
  )
}
