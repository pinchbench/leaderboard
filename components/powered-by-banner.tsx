import Link from 'next/link'

export function PoweredByBanner() {
    return (
        <div className="bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-orange-500/10 border-b border-orange-500/20">
            <div className="max-w-7xl mx-auto px-6 py-2">
                <p className="text-center text-sm">
                    <span className="text-muted-foreground">Powered by </span>
                    <a
                        href="https://kilo.ai/kiloclaw"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
                    >
                        KiloClaw
                    </a>
                    <span className="text-muted-foreground"> — The best way to Claw</span>
                </p>
            </div>
        </div>
    )
}
