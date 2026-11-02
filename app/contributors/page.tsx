import type { Metadata } from 'next'
import { Github, Users } from 'lucide-react'
import { fetchGithubOrgContributors, GITHUB_ORG } from '@/lib/github-contributors'

export const metadata: Metadata = {
    title: 'Contributors — PinchBench',
    description: 'People who contribute to PinchBench on GitHub across the skill, API, leaderboard, and other public repositories.',
}

function getRankEmoji(rank: number) {
    if (rank === 1) return '🦞'
    if (rank === 2) return '🦀'
    if (rank === 3) return '🦐'
    return null
}

export default async function ContributorsPage() {
    let repos: Awaited<ReturnType<typeof fetchGithubOrgContributors>>['repos'] = []
    let contributors: Awaited<ReturnType<typeof fetchGithubOrgContributors>>['contributors'] = []
    let loadError = false

    try {
        const data = await fetchGithubOrgContributors()
        repos = data.repos
        contributors = data.contributors
    } catch {
        loadError = true
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex items-center gap-3 mb-3">
                    <Users className="h-6 w-6 text-muted-foreground" />
                    <h1 className="text-2xl font-bold text-foreground">Contributors</h1>
                </div>
                <p className="text-sm text-muted-foreground max-w-2xl mb-8">
                    Commit authors across public{' '}
                    <a
                        href={`https://github.com/${GITHUB_ORG}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                    >
                        {GITHUB_ORG}
                    </a>{' '}
                    repositories. New public repos in the org are picked up automatically.
                </p>

                {repos.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8">
                        {repos.map((repo) => (
                            <a
                                key={repo.name}
                                href={repo.htmlUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/50 border border-border/50 text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                            >
                                <Github className="h-3 w-3" />
                                {GITHUB_ORG}/{repo.name}
                            </a>
                        ))}
                    </div>
                )}

                {loadError ? (
                    <div className="rounded-lg border border-border bg-card p-8 text-center">
                        <p className="text-sm text-muted-foreground">
                            Couldn’t load GitHub contributors right now.{' '}
                            <a
                                href={`https://github.com/${GITHUB_ORG}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                            >
                                View the org on GitHub
                            </a>
                            .
                        </p>
                    </div>
                ) : contributors.length === 0 ? (
                    <div className="rounded-lg border border-border bg-card p-8 text-center">
                        <p className="text-sm text-muted-foreground">No public contributors found yet.</p>
                    </div>
                ) : (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {contributors.map((person, index) => {
                            const rank = index + 1
                            const emoji = getRankEmoji(rank)
                            return (
                                <li key={person.login}>
                                    <a
                                        href={person.htmlUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex items-start gap-4 rounded-lg border border-border bg-card p-4 hover:border-primary/60 transition-colors h-full"
                                    >
                                        <img
                                            src={person.avatarUrl}
                                            alt=""
                                            className="w-12 h-12 rounded-full border border-border"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                {emoji && <span aria-hidden="true">{emoji}</span>}
                                                <span className="text-xs tabular-nums text-muted-foreground">#{rank}</span>
                                                <span className="font-mono font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                                    {person.login}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-3">
                                                <span className="font-semibold text-foreground tabular-nums">
                                                    {person.contributions.toLocaleString()}
                                                </span>
                                                {' '}
                                                {person.contributions === 1 ? 'commit' : 'commits'}
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                                {person.repos.map((repo) => (
                                                    <span
                                                        key={repo}
                                                        className="px-2 py-0.5 rounded-full bg-secondary/50 border border-border/50 text-xs text-muted-foreground"
                                                    >
                                                        {repo}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </a>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </div>
        </div>
    )
}
