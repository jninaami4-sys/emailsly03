import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site/SiteShell";
import { LiveDataConsole } from "@/components/site/LiveDataConsole";
import { PremiumArrowRight } from "@/components/site/PremiumIcons";
import { getSampleDatasets, type SampleDatasetsPayload } from "@/lib/sample-datasets.functions";

const sampleDatasetsQuery = queryOptions({
  queryKey: ["sample-datasets"],
  queryFn: () => getSampleDatasets(),
  staleTime: 60_000,
});

export const Route = createFileRoute("/sample-data")({
  head: () => ({
    meta: [
      { title: "Live sample data — Apollo, LinkedIn, ZoomInfo | EmailsLy" },
      {
        name: "description",
        content:
          "Browse verified B2B lead samples from Apollo, LinkedIn Sales Navigator, and ZoomInfo. Preview live Google Drive CSVs before you order.",
      },
      { property: "og:title", content: "Live sample data — EmailsLy" },
      {
        property: "og:description",
        content:
          "Preview and download verified B2B lead samples across three sources — live from admin-managed feeds.",
      },
    ],
    links: [{ rel: "canonical", href: "/sample-data" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(sampleDatasetsQuery),
  component: SampleDataPage,
});

const SOURCE_ACCENT: Record<string, string> = {
  apollo: "from-blue-500/20 to-indigo-500/20 border-blue-400/30",
  linkedin: "from-indigo-500/20 to-blue-500/20 border-indigo-400/30",
  zoominfo: "from-amber-500/20 to-orange-500/20 border-amber-400/30",
};

const SOURCE_TYPE_LABEL: Record<string, string> = {
  builtin: "Built-in sample",
  gdrive: "Google Drive · Live",
  upload: "Uploaded CSV",
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function SourceCard({
  source,
  meta,
}: {
  source: "apollo" | "linkedin" | "zoominfo";
  meta: SampleDatasetsPayload["meta"][keyof SampleDatasetsPayload["meta"]];
}) {
  const isLive = meta.source_type !== "builtin";
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 backdrop-blur-xl ${SOURCE_ACCENT[source]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-foreground/60">
            {source}
          </div>
          <div className="mt-1 font-display text-xl font-bold text-foreground">{meta.display_name}</div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-wider ${
            isLive
              ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
              : "border-white/10 bg-white/5 text-foreground/60"
          }`}
        >
          <span className="relative flex size-1.5">
            {isLive && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/60" />
            )}
            <span
              className={`relative inline-flex size-1.5 rounded-full ${
                isLive ? "bg-emerald-400" : "bg-foreground/40"
              }`}
            />
          </span>
          {isLive ? "Live" : "Seed"}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="text-foreground/50">Rows</dt>
          <dd className="font-mono text-sm font-bold text-foreground">
            {meta.row_count.toLocaleString()}
          </dd>
        </div>
        <div>
          <dt className="text-foreground/50">Source</dt>
          <dd className="text-sm text-foreground/80">{SOURCE_TYPE_LABEL[meta.source_type]}</dd>
        </div>
        <div>
          <dt className="text-foreground/50">Updated</dt>
          <dd className="text-sm text-foreground/80">{relativeTime(meta.updated_at)}</dd>
        </div>
        <div>
          <dt className="text-foreground/50">Status</dt>
          <dd className={`text-sm ${meta.error ? "text-red-400" : "text-emerald-300"}`}>
            {meta.error ? "Fallback" : "OK"}
          </dd>
        </div>
      </dl>

      {meta.error && (
        <p className="mt-3 rounded-lg border border-red-400/20 bg-red-500/5 px-3 py-2 text-[11px] text-red-300">
          {meta.error}
        </p>
      )}
    </div>
  );
}

function SampleDataPage() {
  const { data: payload } = useSuspenseQuery(sampleDatasetsQuery);

  return (
    <SiteShell>
      <div className="theme-midnight bg-background text-foreground">
        <section className="relative overflow-hidden px-6 pt-20 pb-10 lg:pt-28">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-[-10%] size-[700px] -translate-x-1/2 rounded-full bg-indigo/20 blur-[140px]" />
          </div>
          <div className="mx-auto max-w-5xl text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/60 hover:text-foreground"
            >
              <span className="rotate-180"><PremiumArrowRight className="size-3" /></span>
              Back to home
            </Link>
            <div className="mt-6 flex items-center justify-center gap-3">
              <span className="h-px w-8 bg-indigo-500/30" />
              <span className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-300">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400/70" />
                  <span className="relative inline-flex size-2 rounded-full bg-cyan-400" />
                </span>
                CSV dataset preview
              </span>
              <span className="h-px w-8 bg-indigo-500/30" />
            </div>
            <h1 className="mt-5 font-display text-5xl font-extrabold leading-[1.05] tracking-tight md:text-7xl">
              <span className="text-foreground">Live </span>
              <span className="bg-gradient-to-r from-cyan-300 via-indigo-300 to-indigo-500 bg-clip-text text-transparent">
                sample data
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-foreground/70 md:text-xl">
              Real rows from our Apollo, LinkedIn Sales Navigator, and ZoomInfo feeds — streamed live from
              admin-managed Google Drive CSVs. Search anything, download the file, and see the exact
              format we deliver.
            </p>
            <div className="mt-8 flex justify-center">
              <div className="h-1 w-24 rounded-full bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent" />
            </div>
          </div>
        </section>

        {/* Live source status */}
        <section className="px-6 pb-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold">Active sources</h2>
                <p className="text-sm text-foreground/60">
                  Datasets are hot-swappable — admins can plug in a Google Drive share URL or upload a
                  new CSV any time.
                </p>
              </div>
              <div className="hidden font-mono text-[10px] uppercase tracking-widest text-foreground/40 md:block">
                Auto-refresh · every 60s
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <SourceCard source="apollo" meta={payload.meta.apollo} />
              <SourceCard source="linkedin" meta={payload.meta.linkedin} />
              <SourceCard source="zoominfo" meta={payload.meta.zoominfo} />
            </div>
          </div>
        </section>

        {/* Console */}
        <section className="px-6 pb-16">
          <div className="mx-auto grid max-w-7xl auto-rows-[220px] grid-cols-1 gap-4 md:grid-cols-4">
            <LiveDataConsole data={payload.data} totalRows={payload.totalRows} />
          </div>
        </section>

        {/* LinkedIn spotlight */}
        <section className="px-6 pb-24">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[32px] border border-indigo-400/20 bg-gradient-to-br from-indigo-500/10 via-blue-500/5 to-transparent p-8 backdrop-blur-xl md:p-12">
            <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_320px] md:items-center">
              <div>
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-indigo-300">
                  Featured · LinkedIn Sales Navigator
                </div>
                <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight md:text-4xl">
                  {payload.meta.linkedin.display_name}
                </h2>
                <p className="mt-3 max-w-xl text-foreground/70">
                  Decision-maker level titles, verified emails, and enrichment fields pulled straight
                  from Sales Navigator exports. Use the LinkedIn tab in the console above to preview
                  the current live feed.
                </p>
                <dl className="mt-6 flex flex-wrap gap-6 text-sm">
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-widest text-foreground/40">Live rows</dt>
                    <dd className="mt-1 font-display text-2xl font-bold">
                      {payload.meta.linkedin.row_count.toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-widest text-foreground/40">Source</dt>
                    <dd className="mt-1 text-sm">{SOURCE_TYPE_LABEL[payload.meta.linkedin.source_type]}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-widest text-foreground/40">Updated</dt>
                    <dd className="mt-1 text-sm">{relativeTime(payload.meta.linkedin.updated_at)}</dd>
                  </div>
                </dl>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                <div className="text-xs font-semibold text-foreground/60">Sample fields</div>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {(payload.data.linkedin.headers.slice(0, 10) ?? []).map((h) => (
                    <li
                      key={h}
                      className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] text-foreground/80"
                    >
                      {h}
                    </li>
                  ))}
                  {payload.data.linkedin.headers.length > 10 && (
                    <li className="rounded-md border border-white/5 px-2.5 py-1 font-mono text-[10px] text-foreground/50">
                      +{payload.data.linkedin.headers.length - 10} more
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
