import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, RefreshCw, ExternalLink, Search } from "@/components/admin/AdminIcons";
import { BLOG_POSTS } from "@/lib/blog-posts";
import {
  adminBlogAnalyticsSummary,
  adminBlogAnalyticsForSlug,
  type BlogAnalyticsRow,
} from "@/lib/blog-analytics.functions";

const RANGES = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

export function BlogAnalyticsAdmin() {
  const summaryFn = useServerFn(adminBlogAnalyticsSummary);
  const detailFn = useServerFn(adminBlogAnalyticsForSlug);

  const [days, setDays] = useState(30);
  const [query, setQuery] = useState("");
  const [slug, setSlug] = useState<string | null>(null);

  const summary = useQuery({
    queryKey: ["admin-blog-analytics", days],
    queryFn: () => summaryFn({ data: { days } }),
    staleTime: 30_000,
  });

  const detail = useQuery({
    queryKey: ["admin-blog-analytics-detail", slug, days],
    queryFn: () => detailFn({ data: { slug: slug!, days } }),
    enabled: !!slug,
    staleTime: 30_000,
  });

  const bySlug = useMemo(() => {
    const m = new Map<string, BlogAnalyticsRow>();
    (summary.data ?? []).forEach((r) => m.set(r.slug, r));
    return m;
  }, [summary.data]);

  // Include every known post, even zero-event posts.
  const rows: BlogAnalyticsRow[] = useMemo(() => {
    const all: BlogAnalyticsRow[] = BLOG_POSTS.map((p) => {
      const found = bySlug.get(p.slug);
      return (
        found ?? {
          slug: p.slug,
          views: 0,
          unique_sessions: 0,
          scroll_25: 0,
          scroll_50: 0,
          scroll_75: 0,
          scroll_100: 0,
          cta_clicks: 0,
          conversions: 0,
          avg_scroll: 0,
          last_event_at: null,
        }
      );
    });
    const q = query.trim().toLowerCase();
    const filtered = q
      ? all.filter(
          (r) =>
            r.slug.toLowerCase().includes(q) ||
            (BLOG_POSTS.find((p) => p.slug === r.slug)?.title.toLowerCase().includes(q) ?? false),
        )
      : all;
    return filtered.sort((a, b) => b.views - a.views);
  }, [bySlug, query]);

  const totals = useMemo(() => {
    let views = 0,
      sessions = 0,
      cta = 0,
      conv = 0;
    for (const r of rows) {
      views += r.views;
      sessions += r.unique_sessions;
      cta += r.cta_clicks;
      conv += r.conversions;
    }
    return { views, sessions, cta, conv };
  }, [rows]);

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              onClick={() => setDays(r.days)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                days === r.days ? "bg-violet text-white" : "text-white/60 hover:text-white"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5">
          <Search className="size-3.5 text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter posts…"
            className="w-56 bg-transparent text-xs text-white outline-none placeholder:text-white/40"
          />
        </div>
        <button
          type="button"
          onClick={() => summary.refetch()}
          className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-white/60 hover:text-white"
          aria-label="Refresh"
        >
          {summary.isFetching ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total views" value={totals.views} hint={`${days}d window`} />
        <Kpi label="Unique sessions" value={totals.sessions} hint="Across all posts" />
        <Kpi label="CTA clicks" value={totals.cta} hint="Every tracked button" />
        <Kpi
          label="Conversions"
          value={totals.conv}
          hint={totals.views ? `${((totals.conv / totals.views) * 100).toFixed(1)}% rate` : "—"}
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/40">
                <th className="px-4 py-3">Post</th>
                <th className="px-3 py-3 text-right">Views</th>
                <th className="px-3 py-3 text-right">Uniques</th>
                <th className="px-3 py-3 text-right">Avg scroll</th>
                <th className="px-3 py-3 text-right">100%</th>
                <th className="px-3 py-3 text-right">CTA</th>
                <th className="px-3 py-3 text-right">Conv.</th>
                <th className="px-3 py-3 text-right">CVR</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const title = BLOG_POSTS.find((p) => p.slug === r.slug)?.title ?? r.slug;
                const cvr = r.views ? (r.conversions / r.views) * 100 : 0;
                const scrollDepth = r.avg_scroll;
                return (
                  <tr
                    key={r.slug}
                    className="border-b border-white/5 last:border-none hover:bg-white/[0.03]"
                  >
                    <td className="max-w-[280px] px-4 py-3">
                      <p className="line-clamp-1 font-medium text-white/90">{title}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-white/40">/blog/{r.slug}</p>
                    </td>
                    <td className="px-3 py-3 text-right font-mono tabular-nums text-white/90">
                      {r.views}
                    </td>
                    <td className="px-3 py-3 text-right font-mono tabular-nums text-white/70">
                      {r.unique_sessions}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="ml-auto flex w-24 items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-violet"
                            style={{ width: `${scrollDepth}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-white/70">
                          {scrollDepth}%
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-mono tabular-nums text-white/70">
                      {r.scroll_100}
                    </td>
                    <td className="px-3 py-3 text-right font-mono tabular-nums text-white/70">
                      {r.cta_clicks}
                    </td>
                    <td className="px-3 py-3 text-right font-mono tabular-nums text-emerald-300">
                      {r.conversions}
                    </td>
                    <td className="px-3 py-3 text-right font-mono tabular-nums text-white/60">
                      {r.views ? `${cvr.toFixed(1)}%` : "—"}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSlug(r.slug)}
                        className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] text-white/70 hover:text-white"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td className="p-8 text-center text-xs text-white/40" colSpan={9}>
                    {summary.isLoading ? "Loading…" : "No data yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail panel */}
      {slug && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-white/50">
                Post detail
              </p>
              <p className="mt-0.5 font-display text-base font-semibold text-white">
                {BLOG_POSTS.find((p) => p.slug === slug)?.title ?? slug}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`/blog/${slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-white/70 hover:text-white"
              >
                <ExternalLink className="size-3.5" /> Open
              </a>
              <button
                type="button"
                onClick={() => setSlug(null)}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-white/70 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>

          {detail.isLoading || !detail.data ? (
            <div className="grid place-items-center py-10 text-xs text-white/40">
              <Loader2 className="size-4 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
              <div className="space-y-4">
                <DailyChart data={detail.data.daily} />
                <ScrollFunnel scroll={detail.data.scroll} />
              </div>
              <div className="space-y-4">
                <ListCard
                  label="Top CTAs"
                  rows={detail.data.top_ctas}
                  empty="No CTA clicks yet."
                />
                <ListCard
                  label="Top referrers"
                  rows={detail.data.top_referrers}
                  empty="No referrers captured."
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-white/40">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-bold text-white tabular-nums">
        {value.toLocaleString()}
      </p>
      {hint && <p className="mt-1 text-xs text-white/50">{hint}</p>}
    </div>
  );
}

function DailyChart({ data }: { data: Array<{ day: string; views: number }> }) {
  const max = Math.max(1, ...data.map((d) => d.views));
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-white/50">
          Views per day
        </p>
        <p className="font-mono text-[10px] text-white/40">peak {max}</p>
      </div>
      <div className="flex h-32 items-end gap-[3px]">
        {data.map((d) => (
          <div
            key={d.day}
            title={`${d.day} · ${d.views} views`}
            className="flex-1 rounded-t bg-violet/70 hover:bg-violet"
            style={{ height: `${(d.views / max) * 100}%`, minHeight: 2 }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[9px] text-white/40">
        <span>{data[0]?.day}</span>
        <span>{data[data.length - 1]?.day}</span>
      </div>
    </div>
  );
}

function ScrollFunnel({
  scroll,
}: {
  scroll: { p25: number; p50: number; p75: number; p100: number };
}) {
  const rows: Array<[string, number]> = [
    ["25%", scroll.p25],
    ["50%", scroll.p50],
    ["75%", scroll.p75],
    ["100%", scroll.p100],
  ];
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-widest text-white/50">
        Scroll depth funnel
      </p>
      <div className="space-y-2.5">
        {rows.map(([label, pct]) => (
          <div key={label} className="flex items-center gap-3">
            <span className="w-10 font-mono text-[11px] text-white/60">{label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet to-emerald"
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
            <span className="w-12 text-right font-mono text-[11px] tabular-nums text-white/70">
              {pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ListCard({
  label,
  rows,
  empty,
}: {
  label: string;
  rows: Array<{ name: string; count: number }>;
  empty: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-widest text-white/50">
        {label}
      </p>
      {rows.length === 0 ? (
        <p className="text-xs text-white/40">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.name} className="flex items-center gap-2 text-xs">
              <span className="line-clamp-1 flex-1 text-white/80">{r.name}</span>
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-violet"
                  style={{ width: `${(r.count / max) * 100}%` }}
                />
              </div>
              <span className="w-8 text-right font-mono tabular-nums text-white/60">
                {r.count}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}