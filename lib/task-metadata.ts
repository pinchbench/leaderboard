export const IMAGE_GEN_TASK_ID = "task_13_image_gen";
export const EXCLUDED_LEADERBOARD_TASK_IDS = new Set<string>([IMAGE_GEN_TASK_ID]);

export function isExcludedLeaderboardTask(taskId: string): boolean {
  return EXCLUDED_LEADERBOARD_TASK_IDS.has(taskId);
}

export const TASK_FALLBACK: Record<string, { name: string; category: string }> =
  {
    task_00_sanity: { name: "Sanity Check", category: "validation" },
    task_01_calendar: { name: "Calendar Event", category: "calendar" },
    task_02_stock: { name: "Stock Research", category: "api" },
    task_03_blog: { name: "Blog Post", category: "writing" },
    task_04_weather: { name: "Weather Script", category: "coding" },
    task_05_summary: { name: "Document Summary", category: "comprehension" },
    task_06_events: { name: "Events Research", category: "research" },
    task_07_email: { name: "Email Draft", category: "writing" },
    task_08_memory: { name: "Memory Retrieval", category: "context" },
    task_09_files: { name: "File Operations", category: "coding" },
    task_10_workflow: { name: "Multi-step Workflow", category: "complex" },
  };
