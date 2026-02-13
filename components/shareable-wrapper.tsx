'use client'

import { forwardRef, useCallback, useRef, useState, type ReactNode } from 'react'
import { Camera, Copy, Download, Share2, Check, Loader2, X } from 'lucide-react'
import { toPng } from 'html-to-image'

interface ShareableWrapperProps {
  children: ReactNode
  title: string
  subtitle?: string
  className?: string
}

type ShareAction = 'copy' | 'download' | 'share'

/**
 * Wraps content with branded header/footer bars for image capture.
 * The attribution bars are hidden during normal browsing and only shown
 * when capturing an image for sharing.
 */
export function ShareableWrapper({ children, title, subtitle, className }: ShareableWrapperProps) {
  const captureRef = useRef<HTMLDivElement>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const showFeedback = useCallback((message: string) => {
    setFeedback(message)
    setTimeout(() => setFeedback(null), 2500)
  }, [])

  const captureImage = useCallback(async (action: ShareAction) => {
    if (!captureRef.current || isCapturing) return
    setIsCapturing(true)
    setShowMenu(false)

    try {
      // Show the attribution bars for capture
      captureRef.current.setAttribute('data-capturing', 'true')

      // Wait for layout to settle
      await new Promise((r) => setTimeout(r, 100))

      const dataUrl = await toPng(captureRef.current, {
        backgroundColor: '#09090b', // background color (dark theme)
        pixelRatio: 2, // 2x for crisp images on retina
        quality: 0.95,
        // Filter out interactive elements we don't want in the image
        filter: (node: HTMLElement) => {
          if (node.getAttribute?.('data-share-exclude') === 'true') return false
          return true
        },
      })

      if (action === 'copy') {
        const blob = await (await fetch(dataUrl)).blob()
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ])
        showFeedback('Copied to clipboard!')
      } else if (action === 'download') {
        const link = document.createElement('a')
        link.download = `pinchbench-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`
        link.href = dataUrl
        link.click()
        showFeedback('Image downloaded!')
      } else if (action === 'share') {
        const blob = await (await fetch(dataUrl)).blob()
        const file = new File([blob], 'pinchbench.png', { type: 'image/png' })
        if (navigator.share) {
          await navigator.share({
            title: `PinchBench - ${title}`,
            files: [file],
          })
        }
      }
    } catch (err) {
      console.error('Image capture failed:', err)
      showFeedback('Failed to capture image')
    } finally {
      captureRef.current?.removeAttribute('data-capturing')
      setIsCapturing(false)
    }
  }, [isCapturing, title, showFeedback])

  const canShare = typeof navigator !== 'undefined' && !!navigator.share

  return (
    <div className={`relative group ${className ?? ''}`}>
      {/* Capture target - includes attribution bars */}
      <div ref={captureRef} className="shareable-capture-target">
        {/* Attribution header - hidden by default, shown during capture */}
        <div className="shareable-attribution-header" aria-hidden="true">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 24px',
              backgroundColor: '#09090b',
              borderBottom: '1px solid #27272a',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '28px' }}>🦞</span>
              <div>
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#fafafa',
                    lineHeight: '1.2',
                  }}
                >
                  PinchBench
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#a1a1aa',
                    lineHeight: '1.4',
                  }}
                >
                  Claw-some AI Agent Testing
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#fafafa',
                  lineHeight: '1.3',
                }}
              >
                {title}
              </div>
              {subtitle && (
                <div
                  style={{
                    fontSize: '12px',
                    color: '#a1a1aa',
                    lineHeight: '1.4',
                  }}
                >
                  {subtitle}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actual content */}
        {children}

        {/* Attribution footer - hidden by default, shown during capture */}
        <div className="shareable-attribution-footer" aria-hidden="true">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 24px',
              backgroundColor: '#09090b',
              borderTop: '1px solid #27272a',
            }}
          >
            <div
              style={{
                fontSize: '13px',
                color: '#a1a1aa',
                fontWeight: 500,
              }}
            >
              pinchbench.com
            </div>
            <div
              style={{
                fontSize: '12px',
                color: '#71717a',
              }}
            >
              Powered by Kilo Code
            </div>
          </div>
        </div>
      </div>

      {/* Share button - floats on top, excluded from capture */}
      <div
        data-share-exclude="true"
        className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      >
        <div className="relative">
          <button
            onClick={() => setShowMenu((v) => !v)}
            disabled={isCapturing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-colors disabled:opacity-50"
            title="Share as image"
          >
            {isCapturing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Camera className="w-3.5 h-3.5" />
            )}
            Share
          </button>

          {/* Dropdown menu */}
          {showMenu && (
            <>
              {/* Backdrop to close menu */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-20 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[180px]">
                <button
                  onClick={() => captureImage('copy')}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-popover-foreground hover:bg-accent transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copy to clipboard
                </button>
                <button
                  onClick={() => captureImage('download')}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-popover-foreground hover:bg-accent transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download PNG
                </button>
                {canShare && (
                  <button
                    onClick={() => captureImage('share')}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-popover-foreground hover:bg-accent transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    Share...
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Feedback toast */}
      {feedback && (
        <div
          data-share-exclude="true"
          className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-lg animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {feedback.includes('Failed') ? (
            <X className="w-4 h-4" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          {feedback}
        </div>
      )}
    </div>
  )
}
