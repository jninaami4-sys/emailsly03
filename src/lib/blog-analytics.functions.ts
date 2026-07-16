import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";

function serverAnonClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

async function assertAdmin(supabase: ReturnType<typeof serverAnonClient>, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

/* ---------------- Public: record events ---------------- */

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

const trackSchema = z.object({
  slug: z.string().trim().min(1).max(200),
  event_type: z.enum(EVENT_TYPES),
  session_id: z.string().trim().max(80).optional(),
  meta: z.record(z.string(), z.any()).optional(),
  path: z.string().trim().max(300).optional(),
  referrer: z.string().trim().max(500).optional(),
});

export const trackBlogEvent = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => trackSchema.parse(data))
  .handler(async ({ data }) => {
    const supa = serverAnonClient();
    const { error } = await supa.from("blog_analytics_events").insert({
      slug: data.slug,
      event_type: data.event_type,
      session_id: data.session_id ?? null,
      meta: (data.meta ?? {}) as never,
      path: data.path ?? null,
      referrer: data.referrer ?? null,
    });
    if (error) {
      console.error("trackBlogEvent", error);
      return { ok: false };
    }
    return { ok: true };
  });

/* ---------------- Admin: summary + per-slug ---------------- */

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
  avg_scroll: number; // 0-100
  last_event_at: string | null;
};

function aggregate(
  rows: Array<{
    slug: string;
    event_type: string;
    session_id: string | null;
    created_at: string;
  }>,
): BlogAnalyticsRow[] {
  const bySlug = new Map<
    string,
    {
      views: number;
      sessions: Set<string>;
      s25: number;
      s50: number;
      s75: number;
      s100: number;
      cta: number;
      conv: number;
      last: string | null;
    }
  >();
  for (const r of rows) {
    let b = bySlug.get(r.slug);
    if (!b) {
      b = {
        views: 0,
        sessions: new Set(),
        s25: 0,
        s50: 0,
        s75: 0,
        s100: 0,
        cta: 0,
        conv: 0,
        last: null,
      };
      bySlug.set(r.slug, b);
    }
    if (!b.last || r.created_at > b.last) b.last = r.created_at;
    if (r.session_id) b.sessions.add(r.session_id);
    switch (r.event_type) {
      case "view":
        b.views++;
        break;
      case "scroll_25":
        b.s25++;
        break;
      case "scroll_50":
        b.s50++;
        break;
      case "scroll_75":
        b.s75++;
        break;
      case "scroll_100":
        b.s100++;
        break;
      case "cta_click":
        b.cta++;
        break;
      case "conversion":
        b.conv++;
        break;
    }
  }
  return [...bySlug.entries()].map(([slug, b]) => {
    const denom = b.views || 1;
    const avg =
      (b.s25 * 25 + b.s50 * 50 + b.s75 * 75 + b.s100 * 100) / denom;
    return {
      slug,
      views: b.views,
      unique_sessions: b.sessions.size,
      scroll_25: b.s25,
      scroll_50: b.s50,
      scroll_75: b.s75,
      scroll_100: b.s100,
      cta_clicks: b.cta,
      conversions: b.conv,
      avg_scroll: Math.min(100, Math.round(avg)),
      last_event_at: b.last,
    } satisfies BlogAnalyticsRow;
  });
}

export const adminBlogAnalyticsSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ days: z.number().int().min(1).max(365).optional() }).parse(data ?? {}),
  )
  .handler(async ({ data, context }): Promise<BlogAnalyticsRow[]> => {
    await assertAdmin(
      context.supabase as unknown as ReturnType<typeof serverAnonClient>,
      context.userId,
    );
    const days = data.days ?? 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { data: rows, error } = await context.supabase
      .from("blog_analytics_events")
      .select("slug, event_type, session_id, created_at")
      .gte("created_at", since)
      .limit(50000);
    if (error) throw new Error(error.message);
    return aggregate(
      (rows ?? []) as Array<{
        slug: string;
        event_type: string;
        session_id: string | null;
        created_at: string;
      }>,
    );
  });

export type BlogDailyPoint = { day: string; views: number };
export type BlogCtaBreakdown = { name: string; count: number };

export const adminBlogAnalyticsForSlug = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        slug: z.string().min(1).max(200),
        days: z.number().int().min(1).max(365).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(
      context.supabase as unknown as ReturnType<typeof serverAnonClient>,
      context.userId,
    );
    const days = data.days ?? 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { data: rows, error } = await context.supabase
      .from("blog_analytics_events")
      .select("event_type, session_id, meta, created_at, referrer")
      .eq("slug", data.slug)
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .limit(20000);
    if (error) throw new Error(error.message);

    const daily = new Map<string, number>();
    const ctas = new Map<string, number>();
    const referrers = new Map<string, number>();
    let views = 0;
    let cta_clicks = 0;
    let conversions = 0;
    const s = { s25: 0, s50: 0, s75: 0, s100: 0 };
    const sessions = new Set<string>();
    for (const r of rows ?? []) {
      if (r.session_id) sessions.add(r.session_id);
      const day = r.created_at.slice(0, 10);
      if (r.event_type === "view") {
        views++;
        daily.set(day, (daily.get(day) ?? 0) + 1);
      } else if (r.event_type === "scroll_25") s.s25++;
      else if (r.event_type === "scroll_50") s.s50++;
      else if (r.event_type === "scroll_75") s.s75++;
      else if (r.event_type === "scroll_100") s.s100++;
      else if (r.event_type === "cta_click") {
        cta_clicks++;
        const meta = (r.meta ?? {}) as { name?: string };
        const name = meta.name ?? "unknown";
        ctas.set(name, (ctas.get(name) ?? 0) + 1);
      } else if (r.event_type === "conversion") conversions++;
      if (r.referrer) {
        try {
          const host = new URL(r.referrer).hostname || r.referrer;
          referrers.set(host, (referrers.get(host) ?? 0) + 1);
        } catch {
          referrers.set(r.referrer, (referrers.get(r.referrer) ?? 0) + 1);
        }
      }
    }

    const dailySeries: BlogDailyPoint[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      dailySeries.push({ day: d, views: daily.get(d) ?? 0 });
    }

    const denom = views || 1;
    return {
      slug: data.slug,
      views,
      unique_sessions: sessions.size,
      cta_clicks,
      conversions,
      scroll: {
        p25: Math.round((s.s25 / denom) * 100),
        p50: Math.round((s.s50 / denom) * 100),
        p75: Math.round((s.s75 / denom) * 100),
        p100: Math.round((s.s100 / denom) * 100),
      },
      daily: dailySeries,
      top_ctas: [...ctas.entries()]
        .map(([name, count]) => ({ name, count } as BlogCtaBreakdown))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
      top_referrers: [...referrers.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
    };
  });