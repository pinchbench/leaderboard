import type { LeaderboardEntry } from "@/lib/types";

/** Open-weights models with this many total parameters (in billions) or fewer count as SLMs. */
export const SLM_MAX_TOTAL_PARAMS_B = 125;

/**
 * Total parameter counts (billions) for open-weights models, keyed by leaderboard
 * model id. Covers every model the API marks open-weights on any benchmark version,
 * plus open-weights models whose API `weights` field is "Unknown" (e.g. Gemma 4,
 * Mistral Small 4). Counts come from each model's Hugging Face safetensors metadata
 * unless noted. Listing a model here also marks it open-weights when the API's
 * `weights` field is "Unknown" or missing.
 */
const OPEN_WEIGHTS_TOTAL_PARAMS_B = new Map<string, number>([
  ["arcee-ai/trinity-large-preview:free", 398.6],
  ["arcee-ai/trinity-large-thinking", 398.6],
  ["deepseek/deepseek-chat", 684.5],
  ["deepseek/deepseek-v3.2", 685.4],
  ["deepseek/deepseek-v4-flash", 290.9],
  ["deepseek/deepseek-v4-pro", 1598.8],
  ["google/gemma-4-26b-a4b-it", 25.8],
  // Same model under its Hugging Face capitalization.
  ["google/gemma-4-26B-A4B-it", 25.8],
  ["google/gemma-4-31b-it", 31.3],
  ["meta-llama/llama-3.1-70b", 70.6],
  ["meta-llama/llama-3.1-70b-instruct", 70.6],
  ["meta-llama/llama-4-maverick", 401.6],
  ["meta-llama/llama-4-scout", 108.6],
  ["minimax/minimax-m2.1", 228.7],
  ["minimax/minimax-m2.5", 228.7],
  ["minimax/minimax-m2.7", 228.7],
  // Published as 123B; the Hugging Face weight files total 125.03B.
  ["mistralai/devstral-2512", 123],
  // No safetensors metadata on Hugging Face; size taken from the model name.
  ["mistralai/mistral-large-2512", 675],
  ["mistralai/mistral-small-2603", 119.4],
  ["moonshotai/kimi-k2.5", 1026.9],
  ["nvidia/nemotron-3-nano-30b-a3b", 31.6],
  ["nvidia/nemotron-3-super-120b-a12b", 123.6],
  // OpenRouter's free variant of the same weights.
  ["nvidia/nemotron-3-super-120b-a12b:free", 123.6],
  ["nvidia/nemotron-3-ultra-550b-a55b", 560.5],
  ["nvidia/nemotron-3.5-lightning-30b-a3b", 31.6],
  ["openai/gpt-oss-120b", 116.8],
  ["openai/gpt-oss-20b", 20.9],
  ["qwen/qwen-2.5-7b-instruct", 7.6],
  ["qwen/qwen3-coder-next", 79.7],
  // Published as 122B; the Hugging Face weight files total 125.09B.
  ["qwen/qwen3.5-122b-a10b", 122],
  ["qwen/qwen3.5-27b", 27.8],
  ["qwen/qwen3.5-35b-a3b", 36],
  ["qwen/qwen3.5-397b-a17b", 403.4],
  ["qwen/qwen3.5-9b", 9.7],
  ["stepfun/step-3.5-flash", 199.4],
  ["xiaomi/mimo-v2.5", 310.8],
  ["xiaomi/mimo-v2.5-pro", 1023.2],
  ["z-ai/glm-4.5-air", 110.5],
  ["z-ai/glm-4.7-flash", 31.2],
  ["z-ai/glm-5", 753.9],
  ["z-ai/glm-5.1", 753.9],
]);

type Weights = LeaderboardEntry["weights"];

/** Fill in "Open" for listed models the API has not classified; never overrides "Closed". */
export function resolveWeights(model: string, weights: Weights): Weights {
  if ((weights == null || weights === "Unknown") && OPEN_WEIGHTS_TOTAL_PARAMS_B.has(model)) {
    return "Open";
  }
  return weights ?? null;
}

export function isSlm(entry: Pick<LeaderboardEntry, "model" | "weights">): boolean {
  const totalParams = OPEN_WEIGHTS_TOTAL_PARAMS_B.get(entry.model);
  return entry.weights === "Open" && totalParams != null && totalParams <= SLM_MAX_TOTAL_PARAMS_B;
}
