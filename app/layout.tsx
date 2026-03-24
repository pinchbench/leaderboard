import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Footer } from '@/components/footer'
import { PostHogProvider } from '@/components/posthog-provider'
import { PoweredByBanner } from '@/components/powered-by-banner'
import { TooltipProvider } from '@/components/ui/tooltip'

import './globals.css'

const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://pinchbench.com'),
  title: 'Best AI Models for OpenClaw | PinchBench Benchmark',
  description: 'Find the best AI model for your OpenClaw agent. Compare 100+ LLMs on real coding tasks — see which models deliver the highest success rates, fastest completions, and best value.',
  keywords: ['best model for OpenClaw', 'OpenClaw benchmark', 'AI coding agent', 'LLM comparison', 'OpenClaw model ranking', 'coding assistant benchmark', 'AI agent testing', 'which model for OpenClaw'],
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'Best AI Models for OpenClaw | PinchBench',
    description: 'Find the best AI model for your OpenClaw agent. Compare success rates, speed, and cost across 100+ LLMs.',
    images: [{ url: '/api/og', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Best AI Models for OpenClaw | PinchBench',
    description: 'Find the best AI model for your OpenClaw agent. Compare success rates, speed, and cost across 100+ LLMs.',
    images: ['/api/og'],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'PinchBench',
  description: 'Find the best AI model for your OpenClaw agent. Compare 100+ LLMs on real coding tasks.',
  url: 'https://pinchbench.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://pinchbench.com/?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is the best model for OpenClaw?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The best model depends on your priorities. For highest success rate, Claude and GPT-4 models typically lead. For budget-conscious users, smaller models like Mistral and Llama offer better value. Check PinchBench leaderboard for current rankings.',
      },
    },
    {
      '@type': 'Question',
      name: 'Which AI model should I use for coding with OpenClaw?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'For coding tasks, models with strong reasoning capabilities perform best. Models scoring above 80% on PinchBench are generally reliable for production coding workflows.',
      },
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      </head>
      <body className="font-sans antialiased">
        <PostHogProvider>
          <TooltipProvider delayDuration={300} disableHoverableContent>
            <PoweredByBanner />
            {children}
            <Footer />
          </TooltipProvider>
        </PostHogProvider>
      </body>
    </html>
  )
}
