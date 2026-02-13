import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-4xl">🦞</span>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">PinchBench</h1>
                                <p className="text-sm text-muted-foreground">
                                    Claw-some AI Agent Testing
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                    <div className="flex gap-2 mt-6">
                        <Skeleton className="h-9 w-28" />
                        <Skeleton className="h-9 w-20" />
                        <Skeleton className="h-9 w-20" />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="bg-card border border-border rounded-lg p-6 mb-6">
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <Skeleton className="h-6 w-6 rounded-full" />
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-4 flex-1" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-card border border-border rounded-lg overflow-hidden">
                    <div className="divide-y divide-border">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="px-4 py-3">
                                <Skeleton className="h-4 w-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    )
}
