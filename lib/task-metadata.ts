export const TASK_FALLBACK: Record<string, { name: string; category: string }> =
  {
    task_00_sanity: { name: "Sanity Check", category: "core_agent" },
    task_01_calendar: { name: "Calendar Event", category: "productivity" },
    task_02_stock: { name: "Stock Research", category: "data_analysis" },
    task_03_blog: { name: "Blog Post", category: "writing_content" },
    task_04_weather: { name: "Weather Script", category: "code_devops" },
    task_05_summary: { name: "Document Summary", category: "writing_content" },
    task_06_events: { name: "Events Research", category: "research_knowledge" },
    task_07_email: { name: "Email Draft", category: "productivity" },
    task_08_memory: { name: "Memory Retrieval", category: "core_agent" },
    task_09_files: { name: "File Operations", category: "core_agent" },
    task_10_workflow: { name: "Multi-step Workflow", category: "core_agent" },

    task_test_generation: { name: "Test Generation", category: "code_devops" },
    task_k8s_debugging: { name: "K8s Debugging", category: "code_devops" },
    task_cicd_pipeline_debug: { name: "CI/CD Pipeline Debug", category: "code_devops" },
    task_dockerfile_optimization: { name: "Dockerfile Optimization", category: "code_devops" },
    task_selector_fix: { name: "Selector Fix", category: "code_devops" },
    task_multi_file_refactoring: { name: "Multi-file Refactoring", category: "code_devops" },
    task_playwright_e2e: { name: "Playwright E2E", category: "code_devops" },
    task_git_rescue_recovery: { name: "Git Rescue Recovery", category: "code_devops" },

    task_spreadsheet_summary: { name: "Spreadsheet Summary", category: "data_analysis" },
    task_financial_ratio_calculation: { name: "Financial Ratio Calculation", category: "data_analysis" },
    task_earnings_analysis: { name: "Earnings Analysis", category: "data_analysis" },

    task_humanizer: { name: "Humanizer", category: "writing_content" },
    task_readme_generation: { name: "README Generation", category: "writing_content" },
    task_commit_message_writer: { name: "Commit Message Writer", category: "writing_content" },
    task_eli5_pdf_summary: { name: "ELI5 PDF Summary", category: "writing_content" },

    task_todo_list_cleanup: { name: "Todo List Cleanup", category: "productivity" },
    task_daily_summary: { name: "Daily Summary", category: "productivity" },
    task_pdf_to_calendar: { name: "PDF to Calendar", category: "productivity" },

    task_market_research: { name: "Market Research", category: "research_knowledge" },
    task_executive_lookup: { name: "Executive Lookup", category: "research_knowledge" },
    task_polymarket_briefing: { name: "Polymarket Briefing", category: "research_knowledge" },
    task_contract_analysis: { name: "Contract Analysis", category: "research_knowledge" },
    task_skill_search: { name: "Skill Search", category: "research_knowledge" },

    task_access_log_anomaly: { name: "Access Log Anomaly", category: "security_ops" },
    task_cve_security_triage: { name: "CVE Security Triage", category: "security_ops" },
    task_gh_issue_triage: { name: "GitHub Issue Triage", category: "security_ops" },

    task_openclaw_comprehension: { name: "OpenClaw Comprehension", category: "core_agent" },
    task_second_brain: { name: "Second Brain", category: "core_agent" },

    task_image_gen: { name: "Image Generation", category: "creative" },
    task_image_identification: { name: "Image Identification", category: "creative" },
  };

const LEGACY_CATEGORY_MAP: Record<string, string> = {
  api: "data_analysis",
  validation: "core_agent",
  calendar: "productivity",
  research: "research_knowledge",
  writing: "writing_content",
  coding: "code_devops",
  comprehension: "core_agent",
  context: "core_agent",
  complex: "core_agent",
};

const TASK_CATEGORY_PATTERNS: Array<{ pattern: RegExp; category: string }> = [
  {
    pattern: /(test_generation|k8s|cicd|dockerfile|selector_fix|refactor|playwright|git_rescue|weather|code)/,
    category: "code_devops",
  },
  {
    pattern: /(csv|spreadsheet|financial|earnings|stock|ratio|analysis)/,
    category: "data_analysis",
  },
  {
    pattern: /(blog|humanizer|readme|commit_message|summary|eli5|writing|content)/,
    category: "writing_content",
  },
  {
    pattern: /(calendar|email|todo|daily_summary|gws|pdf_to_calendar|productivity)/,
    category: "productivity",
  },
  {
    pattern: /(market_research|executive|polymarket|contract|skill_search|research|events)/,
    category: "research_knowledge",
  },
  {
    pattern: /(access_log|cve|security|gh_issue|triage|anomaly)/,
    category: "security_ops",
  },
  {
    pattern: /(sanity|memory|files|workflow|openclaw|second_brain|comprehension|context)/,
    category: "core_agent",
  },
  {
    pattern: /(image|creative)/,
    category: "creative",
  },
];

export function resolveTaskCategory(
  taskId: string,
  category?: string | null,
): string {
  const normalizedCategory = category?.trim().toLowerCase();
  if (normalizedCategory) {
    if (LEGACY_CATEGORY_MAP[normalizedCategory]) {
      return LEGACY_CATEGORY_MAP[normalizedCategory];
    }
    if (
      [
        "code_devops",
        "data_analysis",
        "writing_content",
        "productivity",
        "research_knowledge",
        "security_ops",
        "core_agent",
        "creative",
      ].includes(normalizedCategory)
    ) {
      return normalizedCategory;
    }
  }

  const normalizedTaskId = taskId.toLowerCase();
  for (const { pattern, category: mappedCategory } of TASK_CATEGORY_PATTERNS) {
    if (pattern.test(normalizedTaskId)) return mappedCategory;
  }

  return normalizedCategory || "other";
}
