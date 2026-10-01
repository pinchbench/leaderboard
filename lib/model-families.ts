import type { LeaderboardEntry } from "@/lib/types";
import { getAverageScorePercent } from "@/lib/recommendations";

const FAMILY_BY_PROVIDER: Record<string, string> = {
  anthropic: "Claude",
  openai: "GPT",
  google: "Gemini",
  meta: "Llama",
  mistral: "Mistral",
  mistralai: "Mistral",
  deepseek: "DeepSeek",
  "x-ai": "Grok",
  moonshotai: "Kimi",
  "z-ai": "GLM",
  minimax: "MiniMax",
  nvidia: "NVIDIA",
  cohere: "Command",
  stepfun: "StepFun",
  "arcee-ai": "Arcee",
};

const FAMILY_PATTERNS: Array<[RegExp, string]> = [
  [/claude/i, "Claude"],
  [/\bgpt\b|chatgpt|o[1-9]\b/i, "GPT"],
  [/gemini/i, "Gemini"],
  [/llama/i, "Llama"],
  [/mistral|mixtral|codestral|pixtral/i, "Mistral"],
  [/deepseek/i, "DeepSeek"],
  [/grok/i, "Grok"],
  [/kimi|moonshot/i, "Kimi"],
  [/\bglm\b/i, "GLM"],
  [/qwen/i, "Qwen"],
  [/command[-_]?r/i, "Command"],
];

export function getModelFamilyLabel(entry: Pick<LeaderboardEntry, "provider" | "model">): string {
  const providerFamily = FAMILY_BY_PROVIDER[entry.provider.toLowerCase()];
  if (providerFamily) return providerFamily;

  const haystack = `${entry.provider} ${entry.model}`;
  for (const [pattern, label] of FAMILY_PATTERNS) {
    if (pattern.test(haystack)) return label;
  }

  const fromModel = entry.model.split("/").pop() ?? entry.model;
  const token = fromModel.split(/[-_\s]/).find((part) => /[a-zA-Z]/.test(part));
  if (!token) return titleCase(entry.provider);
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

export function joinWithAnd(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export function uniqueFamiliesFromSorted(
  entries: LeaderboardEntry[],
  limit: number,
  exclude: Iterable<string> = [],
): string[] {
  const skip = new Set(exclude);
  const families: string[] = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    const family = getModelFamilyLabel(entry);
    if (seen.has(family) || skip.has(family)) continue;
    seen.add(family);
    families.push(family);
    if (families.length >= limit) break;
  }

  return families;
}

export function getQualityAndValueFamilies(
  entries: LeaderboardEntry[],
  qualityLimit = 3,
  valueLimit = 2,
): { qualityFamilies: string[]; valueFamilies: string[] } {
  const byQuality = [...entries].sort(
    (a, b) => (getAverageScorePercent(b) ?? -1) - (getAverageScorePercent(a) ?? -1),
  );
  const byValue = [...entries]
    .filter((entry) => entry.value_score != null)
    .sort((a, b) => (b.value_score ?? -1) - (a.value_score ?? -1));

  const qualityFamilies = uniqueFamiliesFromSorted(byQuality, qualityLimit);
  let valueFamilies = uniqueFamiliesFromSorted(byValue, valueLimit, qualityFamilies);
  if (valueFamilies.length === 0) {
    valueFamilies = uniqueFamiliesFromSorted(byValue, valueLimit);
  }

  return { qualityFamilies, valueFamilies };
}

export function buildQualityValueSentence(entries: LeaderboardEntry[]): string {
  const { qualityFamilies, valueFamilies } = getQualityAndValueFamilies(entries);
  const qualityPart = qualityFamilies.length
    ? `${joinWithAnd(qualityFamilies)} models typically lead on quality`
    : null;
  const valuePart = valueFamilies.length
    ? `smaller models like ${joinWithAnd(valueFamilies)} offer better value`
    : null;

  if (qualityPart && valuePart) return `${qualityPart}, while ${valuePart}.`;
  if (qualityPart) return `${qualityPart}.`;
  if (valuePart) return `${valuePart.charAt(0).toUpperCase()}${valuePart.slice(1)}.`;
  return "";
}

function titleCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
