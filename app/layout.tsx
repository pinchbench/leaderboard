import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Footer } from '@/components/footer'
import { PostHogProvider } from '@/components/posthog-provider'

import './globals.css'

const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://pinchbench.com'),
  title: 'PinchBench Leaderboard - OpenClaw LLM Model Benchmarking',
  description: 'Benchmarking LLM models as OpenClaw agents across 10 standardized coding tasks',
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
    title: 'PinchBench - AI Agent Benchmark Leaderboard',
    description: 'Benchmarking LLM models as AI agents across standardized coding tasks',
    images: [{ url: '/api/og', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PinchBench - AI Agent Benchmark Leaderboard',
    description: 'Benchmarking LLM models as AI agents across standardized coding tasks',
    images: ['/api/og'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <PostHogProvider>
          {children}
          <Footer />
        </PostHogProvider>
      </body>
    </html>
  )
}
