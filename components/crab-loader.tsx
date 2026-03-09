'use client'

import { useEffect, useState } from 'react'

interface CrabLoaderProps {
  /** Minimum display time in ms (ensures the crab is seen) */
  minDisplayMs?: number
  /** Optional message below the crab */
  message?: string
}

export function CrabLoader({ minDisplayMs = 100, message = 'Loading...' }: CrabLoaderProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (minDisplayMs > 0) {
      const timer = setTimeout(() => setVisible(true), minDisplayMs)
      return () => clearTimeout(timer)
    }
  }, [minDisplayMs])

  if (!visible) return null

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="relative">
        {/* Main crab - gentle bounce */}
        <span 
          className="text-6xl block animate-bounce"
          style={{ animationDuration: '1s' }}
        >
          🦀
        </span>
        {/* Bubbles */}
        <span 
          className="absolute -top-2 -right-2 text-lg opacity-60 animate-ping"
          style={{ animationDuration: '1.5s' }}
        >
          💨
        </span>
      </div>
      <p className="text-sm text-muted-foreground animate-pulse">
        {message}
      </p>
    </div>
  )
}

/**
 * Full-page loading overlay with crab
 */
export function CrabLoaderOverlay({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <CrabLoader message={message} />
    </div>
  )
}

/**
 * Hook to enforce minimum loading time
 * Returns true when loading should be shown, false when content is ready
 */
export function useMinLoadingTime(isLoading: boolean, minMs: number = 100): boolean {
  const [showLoader, setShowLoader] = useState(isLoading)
  const [loadStartTime, setLoadStartTime] = useState<number | null>(null)

  useEffect(() => {
    if (isLoading && !loadStartTime) {
      setLoadStartTime(Date.now())
      setShowLoader(true)
    } else if (!isLoading && loadStartTime) {
      const elapsed = Date.now() - loadStartTime
      const remaining = Math.max(0, minMs - elapsed)
      
      if (remaining > 0) {
        const timer = setTimeout(() => {
          setShowLoader(false)
          setLoadStartTime(null)
        }, remaining)
        return () => clearTimeout(timer)
      } else {
        setShowLoader(false)
        setLoadStartTime(null)
      }
    }
  }, [isLoading, loadStartTime, minMs])

  return showLoader
}
