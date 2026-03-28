import {
  BADGE_METRICS,
  BADGE_PERIODS,
  getModelBadgeStatus,
  isBadgeMetric,
  isBadgePeriod,
} from "@/lib/badges";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderBadgeSvg({
  title,
  model,
  detail,
  footer,
  accent,
}: {
  title: string;
  model: string;
  detail: string;
  footer: string;
  accent: string;
}): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="720" height="200" viewBox="0 0 720 200" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(title)}">
  <rect width="720" height="200" rx="24" fill="#09090b"/>
  <rect x="1" y="1" width="718" height="198" rx="23" stroke="#27272a"/>
  <rect x="28" y="28" width="122" height="28" rx="14" fill="#18181b" stroke="#27272a"/>
  <text x="89" y="46" text-anchor="middle" fill="#fafafa" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="700">PinchBench</text>
  <rect x="562" y="28" width="130" height="34" rx="17" fill="${accent}" fill-opacity="0.16" stroke="${accent}"/>
  <text x="627" y="50" text-anchor="middle" fill="${accent}" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="700">${escapeXml(detail)}</text>
  <text x="28" y="92" fill="#fafafa" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="800">${escapeXml(title)}</text>
  <text x="28" y="132" fill="#e4e4e7" font-family="JetBrains Mono, Menlo, monospace" font-size="24" font-weight="700">${escapeXml(model)}</text>
  <text x="28" y="168" fill="#a1a1aa" font-family="Inter, Arial, sans-serif" font-size="16">${escapeXml(footer)}</text>
</svg>`;
}

function badgeResponse(svg: string, status = 200): Response {
  return new Response(svg, {
    status,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
    },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ metric: string; period: string }> },
) {
  const { metric, period } = await params;
  const { searchParams } = new URL(request.url);
  const model = searchParams.get("model")?.trim();

  if (!isBadgeMetric(metric) || !isBadgePeriod(period)) {
    return badgeResponse(
      renderBadgeSvg({
        title: "Invalid PinchBench badge",
        model: "Unsupported metric or period",
        detail: "Invalid",
        footer: "Supported periods: 1d, 7d, 30d • metrics: success, speed, cost, value",
        accent: "#ef4444",
      }),
      400,
    );
  }

  if (!model) {
    return badgeResponse(
      renderBadgeSvg({
        title: `${BADGE_PERIODS[period].label} ${BADGE_METRICS[metric].label} Badge`,
        model: "Missing model query parameter",
        detail: "Missing model",
        footer: 'Use ?model=<provider/model> to request a badge',
        accent: "#ef4444",
      }),
      400,
    );
  }

  try {
    const status = await getModelBadgeStatus(model, metric, period, {
      officialOnly: searchParams.get("official") !== "false",
      version: searchParams.get("version") || undefined,
    });

    const title = status.awarded
      ? `${BADGE_PERIODS[period].label} ${BADGE_METRICS[metric].label} Winner`
      : `${BADGE_PERIODS[period].label} ${BADGE_METRICS[metric].label} Badge`;
    const footer = status.rank
      ? status.awarded
        ? `#1 in the last ${period} • ${status.officialOnly ? "official only" : "official + unofficial"}`
        : `Current rank: #${status.rank} • winner: ${status.winnerModel ?? "N/A"}`
      : `No eligible runs found in the last ${period}`;

    return badgeResponse(
      renderBadgeSvg({
        title,
        model,
        detail: status.awarded ? status.displayValue : status.rank ? `#${status.rank}` : "No badge",
        footer,
        accent: BADGE_METRICS[metric].accent,
      }),
      status.awarded ? 200 : 404,
    );
  } catch {
    return badgeResponse(
      renderBadgeSvg({
        title: `${BADGE_PERIODS[period].label} ${BADGE_METRICS[metric].label} Badge`,
        model,
        detail: "Unavailable",
        footer: "PinchBench could not compute this badge right now",
        accent: "#f59e0b",
      }),
      503,
    );
  }
}