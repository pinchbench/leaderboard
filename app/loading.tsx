import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
    return (
        <div className="min-h-screen">
            <header className="border-b border-border">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Skeleton className="w-10 h-10 rounded-lg" />
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-36" />
                                <Skeleton className="h-3 w-52" />
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                    <div className="flex gap-2 mt-6">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton
                                key={i}
                                className="h-9 rounded-lg"
                                style={{
                                    width: i === 0 ? '7rem' : i === 4 ? '5rem' : '4.5rem',
                                    animationDelay: `${i * 80}ms`,
                                }}
                            />
                        ))}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Chart skeleton */}
                <div
                    className="bg-card border border-border rounded-lg p-6 mb-6 animate-fade-in-up"
                    style={{ animationDelay: '100ms' }}
                >
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-48 mb-6" />
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-3 animate-fade-in-up"
                                style={{ animationDelay: `${200 + index * 80}ms` }}
                            >
                                <Skeleton className="h-7 w-7 rounded-full flex-shrink-0" />
                                <Skeleton className="h-4 w-40 flex-shrink-0" />
                                <Skeleton className="h-7 flex-1 rounded-full" />
                                <Skeleton className="h-4 w-16 flex-shrink-0" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Table skeleton */}
                <div
                    className="bg-card border border-border rounded-lg overflow-hidden animate-fade-in-up"
                    style={{ animationDelay: '300ms' }}
                >
                    <div className="bg-muted/50 border-b border-border px-4 py-3 flex gap-4">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 flex-1" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                    <div className="divide-y divide-border">
                        {Array.from({ length: 8 }).map((_, index) => (
                            <div
                                key={index}
                                className="px-4 py-3 flex items-center gap-4 animate-fade-in-up"
                                style={{ animationDelay: `${400 + index * 60}ms` }}
                            >
                                <Skeleton className="h-4 w-8" />
                                <Skeleton className="h-4 w-44" />
                                <Skeleton className="h-4 flex-1" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    )
}
