import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { Search, Download } from "lucide-react";
import apolloRaw from "@/lib/apollo-leads-raw.json";
import linkedinRaw from "@/lib/linkedin-leads-raw.json";
import zoominfoRaw from "@/lib/zoominfo-leads-raw.json";

type RawData = { headers: string[]; rows: Record<string, string | number | boolean>[] };

const SOURCES = {
  apollo: { label: "Apollo", data: apolloRaw as RawData, filename: "apollo_sample_leads.csv", accent: "violet" as const },
  linkedin: { label: "LinkedIn", data: linkedinRaw as RawData, filename: "linkedin_sample_leads.csv", accent: "coral" as const },
  zoominfo: { label: "ZoomInfo", data: zoominfoRaw as RawData, filename: "zoominfo_sample_leads.csv", accent: "emerald" as const },
};
type SourceKey = keyof typeof SOURCES;

export const Route = createFileRoute("/sample-data")({
  head: () => ({
    meta: [
      { title: "Sample Leads — Apollo, LinkedIn & ZoomInfo | LyraData" },
      { name: "description", content: "Full raw sample exports from Apollo, LinkedIn Sales Navigator, and ZoomInfo — all rows and columns." },
      { property: "og:title", content: "Sample Leads — Apollo, LinkedIn & ZoomInfo" },
      { property: "og:description", content: "Full raw sample exports from Apollo, LinkedIn, and ZoomInfo." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: SampleDataPage,
});

function csvEscape(v: unknown) {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

function SampleDataPage() {
  const [source, setSource] = useState<SourceKey>("apollo");
  const [q, setQ] = useState("");
  const { data, filename, label } = SOURCES[source];
  const { headers, rows } = data;

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) =>
      headers.some((h) => String(r[h] ?? "").toLowerCase().includes(needle))
    );
  }, [q, rows, headers]);

  const download = () => {
    const csv =
      headers.map(csvEscape).join(",") +
      "\n" +
      rows.map((r) => headers.map((h) => csvEscape(r[h])).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <SiteShell>
      <section className="mx-auto max-w-[95rem] px-4 py-12 sm:py-16">
        <div className="mb-6 space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-soft px-3 py-1 text-xs font-bold uppercase tracking-widest text-violet">
            Live sample exports
          </span>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Raw sample leads from Apollo, LinkedIn & ZoomInfo
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Real, unmodified exports straight from each source. Switch tabs to explore
            every row and column just as we'd deliver it.
          </p>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {(Object.keys(SOURCES) as SourceKey[]).map((key) => {
            const s = SOURCES[key];
            const active = key === source;
            return (
              <button
                key={key}
                onClick={() => { setSource(key); setQ(""); }}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "border-transparent bg-foreground text-background"
                    : "border-border bg-background text-foreground hover:bg-secondary"
                }`}
              >
                <span className={`size-2 rounded-full bg-${s.accent}`} aria-hidden="true" />
                {s.label}
                <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                  {s.data.rows.length}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Search ${label} columns...`}
              className="h-9 w-full rounded-full border border-border bg-background pl-9 pr-4 text-sm sm:w-80"
            />
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {filtered.length.toLocaleString()} / {rows.length.toLocaleString()} rows · {headers.length} cols
            </span>
            <button
              onClick={download}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-secondary"
            >
              <Download className="size-4" /> CSV
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="max-h-[75vh] overflow-auto">
            <table className="w-max min-w-full text-left text-xs">
              <thead className="sticky top-0 z-10 bg-secondary/95 backdrop-blur">
                <tr>
                  <th className="sticky left-0 z-20 border-b border-r border-border bg-secondary/95 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground backdrop-blur">
                    #
                  </th>
                  {headers.map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap border-b border-border px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-card"}>
                    <td className="sticky left-0 z-10 whitespace-nowrap border-r border-border bg-inherit px-3 py-2 font-mono text-[10px] text-muted-foreground">
                      {i + 1}
                    </td>
                    {headers.map((h) => {
                      const v = row[h];
                      const s = v == null ? "" : String(v);
                      const isUrl = /^https?:\/\//i.test(s);
                      return (
                        <td
                          key={h}
                          className="max-w-[320px] truncate whitespace-nowrap px-3 py-2 text-foreground/90"
                          title={s}
                        >
                          {isUrl ? (
                            <a href={s} target="_blank" rel="noopener noreferrer" className="text-violet hover:underline">
                              {s}
                            </a>
                          ) : (
                            s
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={headers.length + 1} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      No rows match "{q}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
