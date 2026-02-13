import { Github, ExternalLink } from 'lucide-react'

export function Footer() {
    return (
        <footer className="border-t border-border bg-background">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex flex-col items-center gap-4">
                    {/* Tagline */}
                    <p className="text-sm text-muted-foreground">
                        Made with 🦀 in Maryland and Amsterdam
                    </p>

                    {/* Links */}
                    <div className="flex items-center gap-6">
                        <a
                            href="https://github.com/pinchbench"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Github className="h-4 w-4" />
                            <span>GitHub</span>
                        </a>
                        <span className="text-border">|</span>
                        <a
                            href="https://boleary.dev"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>boleary.dev</span>
                        </a>
                        <span className="text-border">|</span>
                        <a
                            href="https://kilo.ai"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>kilo.ai</span>
                        </a>
                        <span className="text-border">|</span>
                        <a
                            href="https://twitter.com/olearycrew"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <svg
                                className="h-3.5 w-3.5"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                aria-hidden="true"
                            >
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                            <span>@olearycrew</span>
                        </a>
                    </div>

                    {/* Pinch flair */}
                    <p className="text-xs text-muted-foreground/50">
                        🦞 Snip snip — benchmarking one claw at a time
                    </p>
                </div>
            </div>
        </footer>
    )
}
