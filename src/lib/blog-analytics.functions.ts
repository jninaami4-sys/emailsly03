// PHP-backed proxies. Same export names as before; now plain async functions.
import { blogAnalyticsApi, adminBlogAnalyticsApi } from "@/lib/api-client";

const EVENT_TYPES = [
  "view",
  "scroll_25",
  "scroll_50",
  "scroll_75",
  "scroll_100",
  "cta_click",
  "conversion",
] as const;
export type BlogEventType = (typeof EVENT_TYPES)[number];

export type BlogAnalyticsRow = {
  slug: string;
  views: number;
  unique_sessions: number;
  scroll_25: number;
  scroll_50: number;
  scroll_75: number;
  scroll_100: number;
  cta_clicks: number;
  conversions: number;
  avg_scroll: number;
  last_event_at: string | null;
};

export type BlogDailyPoint = { day: string; views: number };
export type BlogCtaBreakdown = { name: string; count: number };

export type BlogAnalyticsSlugReport = {
  slug: string;
  views: number;
  unique_sessions: number;
  cta_clicks: number;
  conversions: number;
  scroll: { p25: number; p50: number; p75: number; p100: number };
  daily: BlogDailyPoint[];
  top_ctas: BlogCtaBreakdown[];
  top_referrers: { name: string; count: number }[];
};

export type TrackInput = {
  slug: string;
  event_type: BlogEventType;
  session_id?: string;
  meta?: Record<string, unknown>;
  path?: string;
  referrer?: string;
};

export async function trackBlogEvent(input: TrackInput): Promise<{ ok: boolean }> {
  try {
    await blogAnalyticsApi.track(input);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function adminBlogAnalyticsSummary(input?: { days?: number }): Promise<BlogAnalyticsRow[]> {
  const { rows } = await adminBlogAnalyticsApi.summary(input);
  return (rows ?? []) as BlogAnalyticsRow[];
}

export async function adminBlogAnalyticsForSlug(input: {
  slug: string;
  days?: number;
}): Promise<BlogAnalyticsSlugReport> {
  const { report } = await adminBlogAnalyticsApi.forSlug(input);
  return report as BlogAnalyticsSlugReport;
}
