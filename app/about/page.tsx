import type { Metadata } from 'next'
import { Github, ExternalLink, FileCode, Database, BarChart3, Cog, GitCommit } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'About PinchBench - Best Models for OpenClaw FAQ',
    description: 'Learn how PinchBench benchmarks AI models for OpenClaw. FAQ: What is the best model for OpenClaw? How are models tested? Which model should I use?',
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
        {
            '@type': 'Question',
            name: 'How often is PinchBench updated?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'PinchBench runs benchmarks continuously as new models are released. Official runs are conducted by the PinchBench team on standardized hardware.',
            },
        },
        {
            '@type': 'Question',
            name: 'Can I run PinchBench on my own models?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes, PinchBench is open source. Install the pinchbench skill and run it with any model supported by OpenClaw. Results can be submitted to the public leaderboard.',
            },
        },
    ],
}

const BENCHMARK_CATEGORIES = [
    { id: 'productivity', name: 'Productivity', tasks: [
        { id: 'task_sanity', name: 'Sanity Check', grading: 'automated' },
        { id: 'task_calendar', name: 'Calendar Event Creation', grading: 'automated' },
        { id: 'task_pdf_to_calendar', name: 'PDF to Calendar Import', grading: 'automated' },
        { id: 'task_todo_list_cleanup', name: 'Todo List Cleanup', grading: 'automated' },
        { id: 'task_daily_summary', name: 'Daily Research Summary Generation', grading: 'llm_judge' },
        { id: 'task_email_triage', name: 'Email Inbox Triage', grading: 'hybrid' },
        { id: 'task_cron_organizer', name: 'Cron Expression Generator', grading: 'automated' },
        { id: 'task_subway_navigation', name: 'NYC Subway Navigation', grading: 'llm_judge' },
    ]},
    { id: 'research', name: 'Research', tasks: [
        { id: 'task_stock', name: 'Stock Price Research', grading: 'automated' },
        { id: 'task_events', name: 'Tech Conference Research', grading: 'llm_judge' },
        { id: 'task_market_research', name: 'Competitive Market Research', grading: 'hybrid' },
        { id: 'task_polymarket_briefing', name: 'Polymarket + News Briefing', grading: 'hybrid' },
        { id: 'task_executive_lookup', name: 'Executive Lookup', grading: 'automated' },
        { id: 'task_deep_research', name: 'Deep Research with Citations', grading: 'llm_judge' },
        { id: 'task_competitive_research', name: 'Competitive Product Comparison', grading: 'llm_judge' },
        { id: 'task_oss_alternative_research', name: 'Open Source Alternatives Research', grading: 'llm_judge' },
        { id: 'task_pricing_research', name: 'Vendor Pricing Comparison', grading: 'llm_judge' },
        { id: 'task_it_procurement', name: 'IT Procurement Research', grading: 'llm_judge' },
        { id: 'task_eu_regulation_research', name: 'EU AI Act Compliance Research', grading: 'llm_judge' },
        { id: 'task_byok_best_practices', name: 'BYOK Best Practices for AI Inference', grading: 'llm_judge' },
    ]},
    { id: 'writing', name: 'Writing', tasks: [
        { id: 'task_blog', name: 'Blog Post Writing', grading: 'llm_judge' },
        { id: 'task_email', name: 'Professional Email Drafting', grading: 'llm_judge' },
        { id: 'task_email_reply_drafting', name: 'Email Reply Drafting from Unread Inbox', grading: 'llm_judge' },
        { id: 'task_humanizer', name: 'Humanize AI-Generated Blog', grading: 'llm_judge' },
        { id: 'task_commit_message_writer', name: 'Commit Message Writer', grading: 'llm_judge' },
        { id: 'task_readme_generation', name: 'README Generation', grading: 'llm_judge' },
    ]},
    { id: 'coding', name: 'Coding', tasks: [
        { id: 'task_weather', name: 'Weather Script Creation', grading: 'automated' },
        { id: 'task_shell_command_generator', name: 'Shell Command Generator', grading: 'automated' },
        { id: 'task_multi_file_refactoring', name: 'Multi-file Refactoring', grading: 'automated' },
        { id: 'task_dockerfile_optimization', name: 'Dockerfile Optimization', grading: 'automated' },
        { id: 'task_playwright_e2e', name: 'Playwright E2E Form Test', grading: 'hybrid' },
        { id: 'task_git_rescue_recovery', name: 'Git Rescue / Recovery', grading: 'automated' },
        { id: 'task_cicd_pipeline_debug', name: 'CI/CD Pipeline Debug', grading: 'automated' },
        { id: 'task_test_generation', name: 'Test Generation', grading: 'hybrid' },
        { id: 'task_k8s_debugging', name: 'K8s/IaC Debugging', grading: 'automated' },
        { id: 'task_selector_fix', name: 'Test Maintenance / Selector Fix', grading: 'hybrid' },
        { id: 'task_codebase_navigation', name: 'Codebase Navigation', grading: 'hybrid' },
        { id: 'task_browser_automation', name: 'Browser Automation Workflow', grading: 'hybrid' },
        { id: 'task_video_transcript_extraction', name: 'Video Transcript Extraction and Summary', grading: 'llm_judge' },
        { id: 'task_iterative_code_refine', name: 'Iterative Code Refinement', grading: 'automated' },
    ]},
    { id: 'analysis', name: 'Analysis', tasks: [
        { id: 'task_summary', name: 'Document Summarization', grading: 'llm_judge' },
        { id: 'task_spreadsheet_summary', name: 'CSV and Excel Data Summarization', grading: 'hybrid' },
        { id: 'task_eli5_pdf_summary', name: 'ELI5 PDF Summarization', grading: 'llm_judge' },
        { id: 'task_openclaw_comprehension', name: 'OpenClaw Report Comprehension', grading: 'automated' },
        { id: 'task_email_search', name: 'Email Search and Summarization', grading: 'hybrid' },
        { id: 'task_access_log_anomaly', name: 'Access Control Log Anomaly Detection', grading: 'automated' },
        { id: 'task_financial_ratio_calculation', name: 'Financial Ratio Calculation', grading: 'automated' },
        { id: 'task_earnings_analysis', name: 'Earnings Analysis', grading: 'automated' },
        { id: 'task_contract_analysis', name: 'Contract/Legal Analysis', grading: 'llm_judge' },
        { id: 'task_image_identification', name: 'Image Identification (Phone, Food, Menu)', grading: 'automated' },
        { id: 'task_cve_security_triage', name: 'CVE/Security Triage', grading: 'hybrid' },
        { id: 'task_session_chain_analysis', name: 'Session Chain Analysis & Design Review', grading: 'automated' },
    ]},
    { id: 'csv_analysis', name: 'CSV Analysis', tasks: [
        { id: 'task_csv_stock_trend', name: 'Apple Stock 2014 Trend Analysis', grading: 'hybrid' },
        { id: 'task_csv_stock_volatility', name: 'Apple Stock 2014 Volatility Analysis', grading: 'hybrid' },
        { id: 'task_csv_stock_best_worst', name: 'Apple Stock 2014 Best and Worst Days', grading: 'hybrid' },
        { id: 'task_csv_finance_report', name: 'Apple Stock 2014 Comprehensive Finance Report', grading: 'llm_judge' },
        { id: 'task_csv_temp_anomalies', name: 'Global Temperature Anomaly Detection', grading: 'hybrid' },
        { id: 'task_csv_temp_trend', name: 'Global Temperature Trend Analysis', grading: 'hybrid' },
        { id: 'task_csv_temp_decades', name: 'Global Temperature Decade Comparison', grading: 'hybrid' },
        { id: 'task_csv_life_exp_ranking', name: 'Life Expectancy Country Ranking', grading: 'hybrid' },
        { id: 'task_csv_life_exp_outliers', name: 'Life Expectancy Outlier Detection', grading: 'hybrid' },
        { id: 'task_csv_life_exp_change', name: 'Life Expectancy Change Over Time', grading: 'hybrid' },
        { id: 'task_csv_gdp_ranking', name: 'World GDP Country Ranking', grading: 'hybrid' },
        { id: 'task_csv_gdp_per_capita', name: 'World GDP Per Capita Estimation', grading: 'hybrid' },
        { id: 'task_csv_gdp_regions', name: 'World GDP Regional Analysis', grading: 'hybrid' },
        { id: 'task_csv_stations_by_elevation', name: 'Idaho Weather Stations Elevation Ranking', grading: 'hybrid' },
        { id: 'task_csv_stations_coverage', name: 'Idaho Weather Stations Coverage Gap Analysis', grading: 'hybrid' },
        { id: 'task_csv_stations_filter', name: 'Idaho Weather Stations Multi-Criteria Filtering', grading: 'hybrid' },
        { id: 'task_csv_iris_summary', name: 'Iris Flowers Statistical Summary', grading: 'hybrid' },
        { id: 'task_csv_iris_classify', name: 'Iris Species Classification Rules', grading: 'hybrid' },
        { id: 'task_csv_iris_outliers', name: 'Iris Flowers Outlier Detection', grading: 'hybrid' },
        { id: 'task_csv_cities_ranking', name: 'US Cities Population Ranking', grading: 'hybrid' },
        { id: 'task_csv_cities_filter', name: 'US Cities Multi-Criteria Filtering', grading: 'hybrid' },
        { id: 'task_csv_cities_density', name: 'US Cities Population Concentration by State', grading: 'hybrid' },
        { id: 'task_csv_cities_growth', name: 'US Cities Geographic Distribution Analysis', grading: 'hybrid' },
        { id: 'task_csv_pension_ranking', name: 'US Pension Fund State Ranking', grading: 'hybrid' },
        { id: 'task_csv_pension_liability', name: 'US Pension Fund Liability Analysis', grading: 'hybrid' },
        { id: 'task_csv_pension_risk', name: 'US Pension Fund Risk Assessment', grading: 'hybrid' },
    ]},
    { id: 'log_analysis', name: 'Log Analysis', tasks: [
        { id: 'task_log_apache_client_issues', name: 'Apache Error Log - Identify Problematic Client IPs', grading: 'hybrid' },
        { id: 'task_log_apache_top_errors', name: 'Apache Error Log - Rank Top Error Types', grading: 'hybrid' },
        { id: 'task_log_apache_error_summary', name: 'Apache Error Log - Generate Error Summary Report', grading: 'hybrid' },
        { id: 'task_log_apache_critical', name: 'Apache Error Log - Identify Critical Security Issues', grading: 'hybrid' },
        { id: 'task_log_apache_timeline', name: 'Apache Error Log - Create Error Timeline', grading: 'hybrid' },
        { id: 'task_log_syslog_boot', name: 'Linux Syslog Boot Sequence Analysis', grading: 'hybrid' },
        { id: 'task_log_nginx_status_codes', name: 'Nginx Access Log - HTTP Status Code Distribution', grading: 'hybrid' },
        { id: 'task_log_nginx_traffic', name: 'Nginx Access Log - Traffic Patterns by Time', grading: 'hybrid' },
        { id: 'task_log_nginx_slow_requests', name: 'Nginx Access Log - Find Largest Responses', grading: 'hybrid' },
        { id: 'task_log_nginx_user_agents', name: 'Nginx Access Log - User Agent Analysis', grading: 'hybrid' },
        { id: 'task_log_nginx_errors', name: 'Nginx Access Log - Error Pattern Analysis', grading: 'hybrid' },
        { id: 'task_log_ssh_failed_logins', name: 'SSH Auth Log - Failed Login Analysis', grading: 'hybrid' },
        { id: 'task_log_ssh_brute_force', name: 'SSH Auth Log - Brute Force Detection', grading: 'hybrid' },
        { id: 'task_log_ssh_successful', name: 'SSH Auth Log - Successful Authentication Summary', grading: 'hybrid' },
        { id: 'task_log_ssh_user_activity', name: 'SSH Auth Log - User Login Activity Report', grading: 'hybrid' },
        { id: 'task_log_ssh_unusual_times', name: 'SSH Auth Log - Unusual Hour Login Detection', grading: 'hybrid' },
        { id: 'task_log_hdfs_failures', name: 'HDFS DataNode Log - Block and Replication Failure Analysis', grading: 'hybrid' },
        { id: 'task_log_hdfs_connections', name: 'HDFS DataNode Log - Connection Pattern Analysis', grading: 'hybrid' },
        { id: 'task_log_hdfs_slow_ops', name: 'HDFS DataNode Log - Slow Operation Detection', grading: 'hybrid' },
        { id: 'task_log_hdfs_block_ops', name: 'HDFS DataNode Log - Block Operations Summary', grading: 'hybrid' },
        { id: 'task_log_hdfs_storage', name: 'HDFS DataNode Log - Storage and Capacity Analysis', grading: 'hybrid' },
        { id: 'task_log_mapreduce_jobs', name: 'MapReduce Log - Job Completion Summary', grading: 'hybrid' },
        { id: 'task_log_mapreduce_failures', name: 'MapReduce Log - Failed Task Analysis', grading: 'hybrid' },
        { id: 'task_log_mapreduce_slow_tasks', name: 'MapReduce Log - Slow Task Identification', grading: 'hybrid' },
        { id: 'task_log_mapreduce_resources', name: 'MapReduce Log - Resource Utilization Analysis', grading: 'hybrid' },
        { id: 'task_log_mapreduce_timeline', name: 'MapReduce Log - Job Timeline Visualization', grading: 'hybrid' },
        { id: 'task_log_syslog_anomalies', name: 'Linux Syslog - Anomaly Detection', grading: 'hybrid' },
        { id: 'task_log_syslog_services', name: 'Linux Syslog - Service Start/Stop Summary', grading: 'hybrid' },
        { id: 'task_log_syslog_cron', name: 'Linux Syslog - Cron Job Execution Analysis', grading: 'hybrid' },
        { id: 'task_log_syslog_auth_failures', name: 'Linux Syslog - Authentication Failure Summary', grading: 'hybrid' },
    ]},
    { id: 'meeting_analysis', name: 'Meeting Analysis', tasks: [
        { id: 'task_meeting_council_votes', name: 'Tampa City Council – List Motions and Vote Outcomes', grading: 'hybrid' },
        { id: 'task_meeting_council_public_comment', name: 'Tampa City Council – Summarize Public Comments', grading: 'hybrid' },
        { id: 'task_meeting_council_budget', name: 'Tampa City Council – Extract Budget Discussions', grading: 'hybrid' },
        { id: 'task_meeting_council_upcoming', name: 'Tampa City Council – Extract Upcoming Events and Deadlines', grading: 'hybrid' },
        { id: 'task_meeting_council_contact_info', name: 'Tampa City Council – Extract Contact Information', grading: 'hybrid' },
        { id: 'task_meeting_council_neighborhood', name: 'Tampa City Council – Identify Neighborhood and District Mentions', grading: 'hybrid' },
        { id: 'task_meeting_tech_action_items', name: 'Meeting Action Items Extraction', grading: 'hybrid' },
        { id: 'task_meeting_tech_decisions', name: 'Meeting Decisions Extraction', grading: 'hybrid' },
        { id: 'task_meeting_tech_competitors', name: 'Meeting Competitor Analysis Extraction', grading: 'hybrid' },
        { id: 'task_meeting_tech_messaging', name: 'Meeting Messaging Framework Extraction', grading: 'hybrid' },
        { id: 'task_meeting_tech_product_features', name: 'Meeting Product Feature Prioritization', grading: 'hybrid' },
        { id: 'task_meeting_advisory_attendees', name: 'NTIA Advisory Board Attendee List', grading: 'hybrid' },
        { id: 'task_meeting_advisory_stakeholders', name: 'NTIA Advisory Board Stakeholder Interests', grading: 'hybrid' },
        { id: 'task_meeting_advisory_technical', name: 'NTIA Advisory Board Technical Discussions', grading: 'hybrid' },
        { id: 'task_meeting_advisory_timeline', name: 'NTIA Advisory Board Timeline and Deadlines', grading: 'hybrid' },
        { id: 'task_meeting_advisory_acronyms', name: 'NTIA Advisory Board Acronym Glossary', grading: 'hybrid' },
        { id: 'task_meeting_executive_summary', name: 'Meeting Executive Summary', grading: 'hybrid' },
        { id: 'task_meeting_sentiment_analysis', name: 'Meeting Sentiment Analysis', grading: 'hybrid' },
        { id: 'task_meeting_follow_up_email', name: 'Meeting Follow-Up Email', grading: 'hybrid' },
        { id: 'task_meeting_blog_post', name: 'Meeting to Blog Post', grading: 'hybrid' },
        { id: 'task_meeting_tldr', name: 'Meeting TL;DR', grading: 'hybrid' },
        { id: 'task_meeting_searchable_index', name: 'Meeting Searchable Index', grading: 'hybrid' },
        { id: 'task_meeting_gov_speaker_summary', name: 'NASA UAP Hearing Speaker Summary', grading: 'hybrid' },
        { id: 'task_meeting_gov_qa_extract', name: 'NASA UAP Hearing Q&A Extraction', grading: 'hybrid' },
        { id: 'task_meeting_gov_recommendations', name: 'NASA UAP Hearing Panel Recommendations', grading: 'hybrid' },
        { id: 'task_meeting_gov_data_sources', name: 'NASA UAP Hearing Data Sources Extraction', grading: 'hybrid' },
        { id: 'task_meeting_gov_controversy', name: 'NASA UAP Hearing Controversial Statements', grading: 'hybrid' },
        { id: 'task_meeting_gov_next_steps', name: 'NASA UAP Hearing Next Steps Extraction', grading: 'hybrid' },
    ]},
    { id: 'memory', name: 'Memory', tasks: [
        { id: 'task_memory', name: 'Memory Retrieval from Context', grading: 'automated' },
        { id: 'task_second_brain', name: 'Second Brain Knowledge Persistence', grading: 'hybrid' },
    ]},
    { id: 'skills', name: 'Skills', tasks: [
        { id: 'task_files', name: 'File Structure Creation', grading: 'automated' },
        { id: 'task_workflow', name: 'Multi-step API Workflow', grading: 'hybrid' },
        { id: 'task_clawdhub', name: 'Create Project Structure', grading: 'automated' },
        { id: 'task_skill_search', name: 'Search and Replace in Files', grading: 'automated' },
        { id: 'task_image_gen', name: 'AI Image Generation', grading: 'hybrid' },
        { id: 'task_gh_issue_triage', name: 'GitHub Issue Triage', grading: 'hybrid' },
    ]},
    { id: 'integrations', name: 'Integrations', tasks: [
        { id: 'task_gws_email_triage', name: 'GWS Email Triage', grading: 'hybrid' },
        { id: 'task_gws_cross_service', name: 'GWS Cross-Service Workflow', grading: 'hybrid' },
        { id: 'task_gws_task_management', name: 'GWS Task Management', grading: 'hybrid' },
    ]},
] as const

export default function AboutPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />
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
                    <br />
                    <p className="text-muted-foreground leading-relaxed">
                        PinchBench was made by <a href="https://kilo.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Kilo Code</a> as a way to help users choose from Kilo's over 500+ AI Models when setting up their coding agents.
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
                    <p className="text-muted-foreground mb-6">
                        The benchmark includes 147 tasks across 11 categories, matching{' '}
                        <a
                            href="https://github.com/pinchbench/skill/blob/main/tasks/manifest.yaml"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                        >
                            pinchbench/skill
                        </a>
                        . Click a task to view its definition.
                    </p>
                    <div className="space-y-8">
                        {BENCHMARK_CATEGORIES.map((category) => (
                            <div key={category.id}>
                                <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                                    {category.name}
                                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                        {category.tasks.length}
                                    </span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {category.tasks.map((task) => (
                                        <a
                                            key={task.id}
                                            href={`https://github.com/pinchbench/skill/blob/main/tasks/${task.id}.md`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary transition-colors"
                                        >
                                            <span className="text-sm text-foreground font-medium min-w-0">{task.name}</span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-wider shrink-0">
                                                {task.grading}
                                            </span>
                                        </a>
                                    ))}
                                </div>
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

                {/* Benchmark Versioning */}
                <section>
                    <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                        <GitCommit className="h-6 w-6 text-primary" />
                        Benchmark Versioning
                    </h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                        Benchmark versions use semantic versioning (SemVer) to make it easy to understand when
                        changes affect results. Versions are determined in the following order:
                    </p>
                    <div className="space-y-4 mb-6">
                        <div className="p-4 rounded-lg bg-card border border-border">
                            <h3 className="font-semibold text-foreground mb-1">1. GitHub Releases</h3>
                            <p className="text-sm text-muted-foreground">
                                When running the benchmark after cloning the repository, the version comes from the
                                most recent{' '}
                                <a
                                    href="https://github.com/pinchbench/skill/releases"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                >
                                    GitHub release tag
                                </a>{' '}
                                (e.g., v1.0.0, v1.1.0). Each release marks a meaningful change to the benchmark.
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-card border border-border">
                            <h3 className="font-semibold text-foreground mb-1">2. BENCHMARK_VERSION File</h3>
                            <p className="text-sm text-muted-foreground">
                                For development or CI environments, the version can be specified in a{' '}
                                <code className="text-xs bg-muted px-1 py-0.5 rounded">BENCHMARK_VERSION</code> file
                                in the project root. This allows pinning to specific versions without git tags.
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-card border border-border">
                            <h3 className="font-semibold text-foreground mb-1">3. setuptools-scm (pip install)</h3>
                            <p className="text-sm text-muted-foreground">
                                When installed via pip, the version is automatically determined by{' '}
                                <a
                                    href="https://setuptools-scm.readthedocs.io/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                >
                                    setuptools-scm
                                </a>{' '}
                                from the git tag associated with the installed commit.
                            </p>
                        </div>
                    </div>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                        The{' '}
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-500/20 text-green-500 text-xs font-medium">Current</span>{' '}
                        badge marks the most recent version that has official benchmark results. Scores across versions
                        with the Current badge are directly comparable, as they use the same task definitions and grading
                        criteria. Legacy versions created before semantic versioning are displayed as 1.0.0-beta.N.
                    </p>
                    <div className="p-4 rounded-lg bg-card border border-border">
                        <h3 className="font-semibold text-foreground mb-2">Versioning scheme</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                <span>
                                    <strong className="text-foreground">Major version</strong> &mdash; Breaking
                                    changes to task structure, grading logic, or scoring rubrics.
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                <span>
                                    <strong className="text-foreground">Minor version</strong> &mdash; New tasks
                                    added or significant improvements to existing ones.
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                <span>
                                    <strong className="text-foreground">Historical results</strong> &mdash; Older
                                    versions and their results are never deleted. Select a specific version from
                                    the version picker to view historical leaderboards.
                                </span>
                            </li>
                        </ul>
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

                {/* FAQ Section for AEO */}
                <section>
                    <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Database className="h-6 w-6 text-primary" />
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-6">
                        <div className="p-4 rounded-lg bg-card border border-border">
                            <h3 className="font-semibold text-foreground mb-2">What is the best model for OpenClaw?</h3>
                            <p className="text-sm text-muted-foreground">
                                The best model depends on your priorities. For highest success rate, check the{' '}
                                <Link href="/" className="text-primary hover:underline">Success Rate leaderboard</Link>.
                                For fastest completions, see the Speed view. For budget-conscious users, the Cost and Value
                                views show which models deliver the best results per dollar. Claude, GPT-4, and Gemini models
                                typically lead on quality, while smaller models like Mistral and Llama offer better value.
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-card border border-border">
                            <h3 className="font-semibold text-foreground mb-2">Which AI model should I use for coding with OpenClaw?</h3>
                            <p className="text-sm text-muted-foreground">
                                For coding tasks, models with strong reasoning capabilities perform best. Check the task-by-task
                                breakdown on any model's detail page to see how it handles specific coding challenges like
                                file creation, API workflows, and script generation. Models scoring above 80% on the benchmark
                                are generally reliable for production coding workflows.
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-card border border-border">
                            <h3 className="font-semibold text-foreground mb-2">How often is PinchBench updated?</h3>
                            <p className="text-sm text-muted-foreground">
                                We run benchmarks continuously as new models are released. The leaderboard shows when each
                                result was submitted. Official runs are conducted by the PinchBench team on standardized
                                hardware; community members can also submit runs which are marked as unofficial.
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-card border border-border">
                            <h3 className="font-semibold text-foreground mb-2">Can I run PinchBench on my own models?</h3>
                            <p className="text-sm text-muted-foreground">
                                Yes! PinchBench is open source. Install the{' '}
                                <a href="https://github.com/pinchbench/skill" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                    pinchbench skill
                                </a>{' '}
                                and run it with any model supported by OpenClaw. Results can be submitted to the public
                                leaderboard for community comparison.
                            </p>
                        </div>
                    </div>
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
                    </div>
                </section>
            </div>
        </main>
        </>
    )
}
