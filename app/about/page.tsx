import type { Metadata } from 'next'
import { Github, ExternalLink, FileCode, Database, BarChart3, Cog } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'About PinchBench - How Tasks Are Created',
    description: 'Learn how PinchBench benchmark tasks are created, graded, and how the system works.',
}

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card/50">
                <div className="max-w-4xl mx-auto px-6 py-8">
                    <Link
                        href="/"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 inline-block"
                    >
                        ← Back to Leaderboard
                    </Link>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <span className="text-4xl">🦀</span>
                        About PinchBench
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        How we benchmark LLM models as AI coding agents
                    </p>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">
                {/* Overview */}
                <section>
                    <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                        <BarChart3 className="h-6 w-6 text-primary" />
                        What is PinchBench?
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                        PinchBench is a benchmarking system for evaluating LLM models as{' '}
                        <a href="https://github.com/openclaw/openclaw" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            OpenClaw
                        </a>{' '}
                        coding agents. We run the same set of real-world tasks across different models and measure
                        success rate, speed, and cost to help developers choose the right model for their use case.
                    </p>
                </section>

                {/* Tasks */}
                <section>
                    <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                        <FileCode className="h-6 w-6 text-primary" />
                        How Tasks Are Created
                    </h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                        Tasks are defined as markdown files with YAML frontmatter, stored in the{' '}
                        <a
                            href="https://github.com/pinchbench/skill"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                        >
                            pinchbench/skill
                        </a>{' '}
                        repository. Each task includes:
                    </p>
                    <ul className="space-y-3 text-muted-foreground ml-4">
                        <li className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span><strong className="text-foreground">Prompt</strong> — The exact message sent to the agent, representing a realistic user request</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span><strong className="text-foreground">Expected Behavior</strong> — Description of acceptable approaches and key decisions</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span><strong className="text-foreground">Grading Criteria</strong> — Atomic, verifiable success criteria as a checklist</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span><strong className="text-foreground">Automated Checks</strong> — Python functions that grade based on workspace files and transcript</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span><strong className="text-foreground">LLM Judge Rubric</strong> — Detailed rubrics for Claude Opus to score qualitative criteria</span>
                        </li>
                    </ul>
                </section>

                {/* Current Tasks */}
                <section>
                    <h2 className="text-2xl font-semibold text-foreground mb-4">
                        Current Benchmark Tasks
                    </h2>
                    <p className="text-muted-foreground mb-4">
                        The benchmark includes 10 tasks across different categories:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                            { id: 'task_01', name: 'Calendar Event Creation', icon: '📅' },
                            { id: 'task_02', name: 'Stock Price Research', icon: '📈' },
                            { id: 'task_03', name: 'Blog Post Writing', icon: '✍️' },
                            { id: 'task_04', name: 'Weather Script Creation', icon: '🌤️' },
                            { id: 'task_05', name: 'Document Summarization', icon: '📄' },
                            { id: 'task_06', name: 'Tech Conference Research', icon: '🎤' },
                            { id: 'task_07', name: 'Professional Email Drafting', icon: '✉️' },
                            { id: 'task_08', name: 'Memory Retrieval', icon: '🧠' },
                            { id: 'task_09', name: 'File Structure Creation', icon: '📁' },
                            { id: 'task_10', name: 'Multi-step API Workflow', icon: '🔄' },
                        ].map((task) => (
                            <div
                                key={task.id}
                                className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border"
                            >
                                <span className="text-xl">{task.icon}</span>
                                <span className="text-foreground">{task.name}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Grading */}
                <section>
                    <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Cog className="h-6 w-6 text-primary" />
                        How Grading Works
                    </h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                        Tasks use one of three grading types:
                    </p>
                    <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-card border border-border">
                            <h3 className="font-semibold text-foreground mb-1">Automated</h3>
                            <p className="text-sm text-muted-foreground">
                                Python functions check workspace files and the execution transcript for specific criteria
                                (file existence, content patterns, tool usage).
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-card border border-border">
                            <h3 className="font-semibold text-foreground mb-1">LLM Judge</h3>
                            <p className="text-sm text-muted-foreground">
                                Claude Opus evaluates qualitative aspects using detailed rubrics with explicit score levels
                                (content quality, appropriateness, completeness).
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-card border border-border">
                            <h3 className="font-semibold text-foreground mb-1">Hybrid</h3>
                            <p className="text-sm text-muted-foreground">
                                Combines automated checks for verifiable criteria with LLM judge for qualitative assessment.
                            </p>
                        </div>
                    </div>
                </section>

                {/* GitHub Repos */}
                <section>
                    <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Github className="h-6 w-6 text-primary" />
                        GitHub Repositories
                    </h2>
                    <p className="text-muted-foreground mb-4">
                        PinchBench is fully open source. Explore the code:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <a
                            href="https://github.com/pinchbench/skill"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group p-4 rounded-lg bg-card border border-border hover:border-primary transition-colors"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <Github className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                <span className="font-semibold text-foreground">pinchbench/skill</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Benchmark runner, task definitions, and grading logic
                            </p>
                        </a>
                        <a
                            href="https://github.com/pinchbench/leaderboard"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group p-4 rounded-lg bg-card border border-border hover:border-primary transition-colors"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <Github className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                <span className="font-semibold text-foreground">pinchbench/leaderboard</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                This leaderboard website (Next.js, React, Tailwind)
                            </p>
                        </a>
                        <a
                            href="https://github.com/pinchbench/api"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group p-4 rounded-lg bg-card border border-border hover:border-primary transition-colors"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <Github className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                <span className="font-semibold text-foreground">pinchbench/api</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Backend API serving leaderboard data (Cloudflare Workers)
                            </p>
                        </a>
                    </div>
                </section>

                {/* Contributing */}
                <section>
                    <h2 className="text-2xl font-semibold text-foreground mb-4">
                        Contributing
                    </h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                        Want to add a new benchmark task or improve the system? Check out the{' '}
                        <a
                            href="https://github.com/pinchbench/skill/blob/main/tasks/TASK_TEMPLATE.md"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                        >
                            task template
                        </a>{' '}
                        for the required structure, then submit a PR to the skill repository.
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                        For leaderboard improvements or bug reports, open an issue in the appropriate repository.
                    </p>
                </section>

                {/* Related Links */}
                <section className="border-t border-border pt-8">
                    <h2 className="text-xl font-semibold text-foreground mb-4">
                        Related Links
                    </h2>
                    <div className="flex flex-wrap gap-4">
                        <a
                            href="https://github.com/openclaw/openclaw"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ExternalLink className="h-4 w-4" />
                            <span>OpenClaw</span>
                        </a>
                        <a
                            href="https://kilo.ai"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ExternalLink className="h-4 w-4" />
                            <span>Kilo Code</span>
                        </a>
                        <a
                            href="https://boleary.dev"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ExternalLink className="h-4 w-4" />
                            <span>boleary.dev</span>
                        </a>
                    </div>
                </section>
            </div>
        </main>
    )
}
