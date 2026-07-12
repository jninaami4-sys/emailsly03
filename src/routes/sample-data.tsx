import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { Search, Download } from "lucide-react";
import raw from "@/lib/apollo-leads-raw.json";

type RawData = { headers: string[]; rows: Record<string, string | number | boolean>[] };
const data = raw as RawData;

export const Route = createFileRoute("/sample-data")({
  head: () => ({
    meta: [
      { title: "Sample Apollo Leads — LyraData" },
      { name: "description", content: "Full raw sample export of verified Apollo B2B leads — all rows and columns." },
      { property: "og:title", content: "Sample Apollo Leads — LyraData" },
      { property: "og:description", content: "Full raw sample export of verified Apollo B2B leads." },
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
  const [q, setQ] = useState("");
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
    a.download = "apollo_sample_leads.csv";
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
            Apollo sample export
          </span>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Full raw Apollo leads sample
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            All {rows.length.toLocaleString()} rows and {headers.length} columns exactly as
            exported from Apollo. Scroll horizontally and vertically to browse.
          </p>
        </div>

        <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search any column..."
              className="h-9 w-full rounded-full border border-border bg-background pl-9 pr-4 text-sm sm:w-80"
            />
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {filtered.length.toLocaleString()} / {rows.length.toLocaleString()} rows
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
                  <tr
                    key={i}
                    className={i % 2 === 0 ? "bg-background" : "bg-card"}
                  >
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
                            <a
                              href={s}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-violet hover:underline"
                            >
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
                    <td
                      colSpan={headers.length + 1}
                      className="px-4 py-10 text-center text-sm text-muted-foreground"
                    >
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
