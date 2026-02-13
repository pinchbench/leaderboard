import { ImageResponse } from 'next/og'
import { fetchLeaderboard } from '@/lib/api'
import { calculateRanks, transformLeaderboardEntry } from '@/lib/transforms'

export const runtime = 'edge'

// OG image dimensions (standard for social media)
const WIDTH = 1200
const HEIGHT = 630

// Color helpers matching the app theme
const COLORS = {
  bg: '#09090b',
  card: '#18181b',
  border: '#27272a',
  text: '#fafafa',
  muted: '#a1a1aa',
  dimmed: '#71717a',
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
  primary: '#3b82f6',
}

function getScoreColor(pct: number): string {
  if (pct >= 85) return COLORS.green
  if (pct >= 70) return COLORS.yellow
  return COLORS.red
}

const PROVIDER_COLORS: Record<string, string> = {
  anthropic: '#d97757',
  openai: '#10a37f',
  google: '#4285f4',
  meta: '#0668E1',
  mistral: '#FF7000',
  deepseek: '#3C5DFF',
  'x-ai': '#FFFFFF',
  mistralai: '#FF7000',
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const view = searchParams.get('view') || 'success'
  const version = searchParams.get('version') || undefined

  try {
    const response = await fetchLeaderboard(version)
    const entries = calculateRanks(response.leaderboard.map(transformLeaderboardEntry))

    // Get top entries based on view
    let title = 'Success Rate Leaderboard'
    let topEntries = entries.slice(0, 8)

    if (view === 'speed') {
      title = 'Speed Leaderboard'
      topEntries = [...entries]
        .filter(e => e.best_execution_time_seconds != null)
        .sort((a, b) => (a.best_execution_time_seconds ?? Infinity) - (b.best_execution_time_seconds ?? Infinity))
        .slice(0, 8)
    } else if (view === 'cost') {
      title = 'Cost Leaderboard'
      topEntries = [...entries]
        .filter(e => e.best_cost_usd != null)
        .sort((a, b) => (a.best_cost_usd ?? Infinity) - (b.best_cost_usd ?? Infinity))
        .slice(0, 8)
    } else if (view === 'graphs') {
      title = 'AI Agent Benchmark Results'
    }

    const formatValue = (entry: typeof topEntries[0]) => {
      if (view === 'speed') {
        return entry.best_execution_time_seconds != null
          ? `${entry.best_execution_time_seconds.toFixed(1)}s`
          : 'N/A'
      }
      if (view === 'cost') {
        return entry.best_cost_usd != null
          ? `$${entry.best_cost_usd.toFixed(2)}`
          : 'N/A'
      }
      return `${entry.percentage.toFixed(1)}%`
    }

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            backgroundColor: COLORS.bg,
            fontFamily: 'sans-serif',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '28px 40px 20px',
              borderBottom: `1px solid ${COLORS.border}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '42px' }}>🦞</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: COLORS.text,
                  }}
                >
                  PinchBench
                </span>
                <span
                  style={{
                    fontSize: '14px',
                    color: COLORS.muted,
                  }}
                >
                   OpenClaw LLM Model Benchmarking
                </span>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
              }}
            >
              <span
                style={{
                  fontSize: '22px',
                  fontWeight: 600,
                  color: COLORS.text,
                }}
              >
                {title}
              </span>
              <span
                style={{
                  fontSize: '13px',
                  color: COLORS.muted,
                }}
              >
                {entries.length} models benchmarked
              </span>
            </div>
          </div>

          {/* Body - Top models */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              padding: '24px 40px',
              gap: '8px',
            }}
          >
            {topEntries.map((entry, i) => (
              <div
                key={entry.submission_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '10px 16px',
                  backgroundColor: i === 0 ? `${COLORS.primary}15` : 'transparent',
                  borderRadius: '8px',
                  border: i === 0 ? `1px solid ${COLORS.primary}40` : '1px solid transparent',
                }}
              >
                {/* Rank */}
                <span
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: i < 3 ? COLORS.primary : COLORS.dimmed,
                    width: '28px',
                    textAlign: 'center',
                  }}
                >
                  {i + 1}
                </span>

                {/* Model name */}
                <span
                  style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: COLORS.text,
                    flex: 1,
                  }}
                >
                  {entry.model}
                </span>

                {/* Provider */}
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: PROVIDER_COLORS[entry.provider] || COLORS.muted,
                  }}
                >
                  {entry.provider}
                </span>

                {/* Score bar (success view only) */}
                {view === 'success' && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '200px',
                      gap: '8px',
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        height: '20px',
                        backgroundColor: COLORS.card,
                        borderRadius: '10px',
                        overflow: 'hidden',
                        display: 'flex',
                      }}
                    >
                      <div
                        style={{
                          width: `${entry.percentage}%`,
                          height: '100%',
                          backgroundColor: getScoreColor(entry.percentage),
                          borderRadius: '10px',
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Value */}
                <span
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: view === 'success' ? getScoreColor(entry.percentage) : COLORS.text,
                    width: '80px',
                    textAlign: 'right',
                  }}
                >
                  {formatValue(entry)}
                </span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 40px',
              borderTop: `1px solid ${COLORS.border}`,
            }}
          >
            <span
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: COLORS.muted,
              }}
            >
              pinchbench.com
            </span>
            <span
              style={{
                fontSize: '13px',
                color: COLORS.dimmed,
              }}
            >
              Powered by Kilo Code
            </span>
          </div>
        </div>
      ),
      {
        width: WIDTH,
        height: HEIGHT,
      },
    )
  } catch (error) {
    // Fallback OG image on error
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: COLORS.bg,
            fontFamily: 'sans-serif',
          }}
        >
          <span style={{ fontSize: '64px', marginBottom: '16px' }}>🦞</span>
          <span
            style={{
              fontSize: '40px',
              fontWeight: 700,
              color: COLORS.text,
            }}
          >
            PinchBench
          </span>
          <span
            style={{
              fontSize: '20px',
              color: COLORS.muted,
              marginTop: '8px',
            }}
          >
            AI Agent Benchmark Leaderboard
          </span>
        </div>
      ),
      {
        width: WIDTH,
        height: HEIGHT,
      },
    )
  }
}
