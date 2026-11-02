'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Github } from 'lucide-react'

const NAV_LINKS = [
  { href: '/about', label: 'About', match: (path: string) => path === '/about' },
  { href: '/best-for/coding', label: 'Best For', match: (path: string) => path.startsWith('/best-for') },
  { href: '/contributors', label: 'Contributors', match: (path: string) => path === '/contributors' },
]

function navLinkClass(active: boolean) {
  return `hidden md:inline-flex px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    active
      ? 'bg-secondary text-foreground'
      : 'text-foreground hover:bg-secondary'
  }`
}

export function SiteNav() {
  const pathname = usePathname()

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center gap-4 h-16">
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 hover:opacity-80 transition-opacity">
            <img
              src="/apple-touch-icon.png"
              alt="PinchBench"
              className="w-7 h-7 md:w-8 md:h-8"
            />
            <div className="hidden sm:block">
              <p className="text-lg font-semibold text-foreground tracking-tight">
                PinchBench <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full bg-secondary/50 border border-border/50 text-xs text-muted-foreground">v2</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                OpenClaw Leaderboard
              </p>
            </div>
          </Link>

          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={navLinkClass(link.match(pathname))}
              >
                {link.label}
              </Link>
            ))}
            <a
              href="https://github.com/pinchbench"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              <Github className="h-4 w-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}
