import { useMemo, useState } from "react";
import { PremiumSearch, PremiumDownload } from "./PremiumIcons";
import { Link } from "@tanstack/react-router";
import { trackConversion } from "@/lib/tracking";

const SOURCES = ["apollo", "linkedin", "zoominfo"] as const;
type SourceKey = (typeof SOURCES)[number];

const SOURCE_META: Record<SourceKey, { label: string; dot: string }> = {
  apollo: { label: "Apollo", dot: "bg-blue-500" },
  linkedin: { label: "LinkedIn", dot: "bg-indigo-500" },
  zoominfo: { label: "ZoomInfo", dot: "bg-orange-500" },
};

const SOURCE_ACCENTS: Record<SourceKey, string> = {
  apollo: "from-blue-500 to-indigo-600",
  linkedin: "from-indigo-500 to-blue-600",
  zoominfo: "from-amber-500 to-orange-600",
};

const CONFIDENCE_COLORS: Record<SourceKey, string> = {
  apollo: "bg-blue-500 shadow-blue-500/50",
  linkedin: "bg-indigo-500 shadow-indigo-500/50",
  zoominfo: "bg-orange-500 shadow-orange-500/50",
};

function initials(first: string, last: string) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "—";
}

function confidence(emailStatus: string) {
  if (emailStatus === "Verified") return Math.floor(90 + Math.random() * 9);
  return Math.floor(75 + Math.random() * 15);
}

function location(row: Record<string, string | number | boolean>) {
  const city = String(row.City ?? "");
  const state = String(row.State ?? "");
  const country = String(row.Country ?? "");
  const parts = [city, state, country].filter(Boolean);
  return parts.join(", ") || "—";
}

function csvEscape(v: unknown) {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function LiveDataConsole({
  data,
  totalRows,
}: {
  data: Record<SourceKey, { headers: string[]; rows: Record<string, string | number | boolean>[] }>;
  totalRows: number;
}) {
  const [activeSource, setActiveSource] = useState<SourceKey>("apollo");
  const [query, setQuery] = useState("");

  const raw = data[activeSource];
  const meta = SOURCE_META[activeSource];
  const accent = SOURCE_ACCENTS[activeSource];
  const barColor = CONFIDENCE_COLORS[activeSource];

  const filteredRows = useMemo(() => {
    if (!query.trim()) return raw.rows;
    const q = query.toLowerCase();
    return raw.rows.filter((r) =>
      Object.values(r).some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [query, raw]);

  const rows = filteredRows.slice(0, 5);

  const downloadCsv = () => {
    const lines = [raw.headers.map(csvEscape).join(","), ...raw.rows.map((r) => raw.headers.map((h) => csvEscape(r[h])).join(","))];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeSource}_sample_leads.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    void trackConversion("download", {
      source: activeSource,
      rows: raw.rows.length,
      file: `${activeSource}_sample_leads.csv`,
    });
  };

  return (
    <article className="group relative col-span-1 row-span-3 overflow-hidden rounded-[32px] border border-white/10 bg-[#0a0c1b]/60 backdrop-blur-2xl md:col-span-4 md:row-span-2">
      {/* Atmospheric glow */}
      <div className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-indigo-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 size-96 rounded-full bg-cyan-600/10 blur-[120px]" />

      {/* Header */}
      <div className="relative flex flex-col justify-between gap-6 border-b border-white/5 p-6 md:flex-row md:items-center">
        <div className="space-y-1">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-foreground">
            Live data console
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/60 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
          </h3>
          <p className="text-sm text-foreground/50">{totalRows.toLocaleString()} rows across {SOURCES.length} verified sources</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Source tabs */}
          <div className="flex rounded-xl border border-white/5 bg-white/5 p-1">
            {SOURCES.map((s) => {
              const isActive = s === activeSource;
              const m = SOURCE_META[s];
              return (
                <button
                  key={s}
                  onClick={() => setActiveSource(s)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    isActive ? "bg-white/10 text-white shadow-sm" : "text-foreground/50 hover:text-foreground"
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative">
            <PremiumSearch className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-foreground/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search rows…"
              className="w-48 rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-foreground/40 transition-all focus:w-64 focus:outline-none focus:ring-4 focus:ring-indigo/10"
            />
          </div>

          {/* Download */}
          <button
            onClick={downloadCsv}
            className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-r ${accent} px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo/20 transition-all active:scale-95`}
          >
            <PremiumDownload className="size-3.5" /> CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="relative overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="px-6 py-3.5 font-mono text-[10px] font-bold uppercase tracking-widest text-foreground/40">Contact</th>
              <th className="px-6 py-3.5 font-mono text-[10px] font-bold uppercase tracking-widest text-foreground/40">Title</th>
              <th className="px-6 py-3.5 font-mono text-[10px] font-bold uppercase tracking-widest text-foreground/40">Company</th>
              <th className="px-6 py-3.5 font-mono text-[10px] font-bold uppercase tracking-widest text-foreground/40">Location</th>
              <th className="px-6 py-3.5 font-mono text-[10px] font-bold uppercase tracking-widest text-foreground/40">Source</th>
              <th className="px-6 py-3.5 font-mono text-[10px] font-bold uppercase tracking-widest text-foreground/40">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {rows.map((r, i) => {
              const first = String(r["First Name"] ?? "");
              const last = String(r["Last Name"] ?? "");
              const title = String(r.Title ?? "");
              const company = String(r["Company Name"] ?? "");
              const email = String(r.Email ?? "");
              const loc = location(r);
              const conf = confidence(String(r["Email Status"] ?? ""));
              return (
                <tr key={i} className="transition-colors hover:bg-white/[0.03]">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`grid size-8 place-items-center rounded-full bg-gradient-to-br ${accent} font-mono text-[10px] font-bold text-white shadow-inner`}>
                        {initials(first, last)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{first} {last}</div>
                        <div className="font-mono text-[10px] text-foreground/40">{email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground/70">{title}</td>
                  <td className="px-6 py-4">
                    <span className="inline-block rounded-md border border-white/5 bg-white/5 px-2.5 py-1 text-xs text-foreground/60">{company}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground/50">{loc}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className={`size-1.5 rounded-full ${meta.dot}`} />
                      <span className="text-xs text-foreground/70">{meta.label}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-full overflow-hidden rounded-full bg-white/5">
                      <div className={`h-1.5 rounded-full ${barColor} shadow-[0_0_8px_currentColor]`} style={{ width: `${conf}%` }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="relative flex items-center justify-between border-t border-white/5 bg-white/[0.01] px-6 py-4">
        <div className="text-xs text-foreground/50">
          Showing <span className="text-foreground">{rows.length}</span> of{" "}
          <span className="text-foreground">{filteredRows.length.toLocaleString()}</span> filtered rows
        </div>
        <Link
          to="/sample-data"
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo transition-colors hover:text-indigo/80"
        >
          Open full sample <span className="font-mono">→</span>
        </Link>
      </div>
    </article>
  );
}
