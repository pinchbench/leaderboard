import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export default function Loading() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border/80 bg-card/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-4 w-48" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-8 flex items-center justify-center animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <Skeleton className="h-48 w-48 rounded-full" />
          </Card>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-4 animate-fade-in-up" style={{ animationDelay: `${200 + i * 80}ms` }}>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-3 w-32" />
              </Card>
            ))}
          </div>
        </div>

        <div>
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="p-4 animate-fade-in-up" style={{ animationDelay: `${500 + i * 60}ms` }}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-full max-w-md" />
                  </div>
                  <Skeleton className="h-6 w-6 rounded" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
