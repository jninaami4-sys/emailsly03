import { useState, useMemo } from "react";
import { Search, ArrowUpRight, Download, CheckCircle2 } from "lucide-react";
import type { Lead } from "@/lib/sample-apollo-leads";
import { trackConversion } from "@/lib/tracking";

interface SampleDataTableProps {
  leads: Lead[];
}

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function SampleDataTable({ leads }: SampleDataTableProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter(
      (lead) =>
        lead.name?.toLowerCase().includes(q) ||
        lead.company?.toLowerCase().includes(q) ||
        lead.title?.toLowerCase().includes(q) ||
        lead.email?.toLowerCase().includes(q) ||
        lead.industry?.toLowerCase().includes(q)
    );
  }, [leads, query]);

  const verifiedCount = useMemo(
    () => filtered.filter((l) => l.status?.toLowerCase() === "verified").length,
    [filtered]
  );

  const handleDownload = () => {
    const csv = [
      ["Name", "Title", "Company", "Email", "Status", "City", "State", "Country", "Industry", "Employees"],
      ...leads.map((l) => [
        l.name ?? "",
        l.title ?? "",
        l.company ?? "",
        l.email ?? "",
        l.status ?? "",
        l.city ?? "",
        l.state ?? "",
        l.country ?? "",
        l.industry ?? "",
        l.employees?.toString() ?? "",
      ]),
    ]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "apollo_sample_leads.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    void trackConversion("download", {
      source: "apollo_sample",
      rows: leads.length,
      file: "apollo_sample_leads.csv",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-soft px-2.5 py-1 text-xs font-semibold text-emerald">
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
            {verifiedCount.toLocaleString()} verified
          </span>
          <span className="text-xs">{filtered.length.toLocaleString()} of {leads.length.toLocaleString()} leads shown</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, company, title..."
              className={`h-9 w-full rounded-full border border-border bg-background pl-9 pr-4 text-sm placeholder:text-muted-foreground sm:w-72 ${focusRing}`}
              aria-label="Search leads"
            />
          </div>
          <button
            type="button"
            onClick={handleDownload}
            className={`inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold transition-colors hover:bg-secondary ${focusRing}`}
          >
            <Download className="size-4" aria-hidden="true" /> CSV
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-card">
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lead</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Industry</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employees</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Links</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead, i) => (
                <tr
                  key={lead.email || i}
                  className={`transition-colors hover:bg-secondary/50 ${i % 2 === 0 ? "bg-background" : "bg-card"}`}
                >
                  <td className="px-4 py-3 align-top">
                    <div className="font-semibold text-foreground">{lead.name}</div>
                  </td>
                  <td className="px-4 py-3 align-top text-muted-foreground">{lead.title}</td>
                  <td className="px-4 py-3 align-top text-muted-foreground">{lead.company}</td>
                  <td className="px-4 py-3 align-top font-mono text-xs text-muted-foreground">{lead.email}</td>
                  <td className="px-4 py-3 align-top">
                    {lead.status?.toLowerCase() === "verified" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-soft px-2 py-0.5 text-[11px] font-semibold text-emerald">
                        <span className="size-1.5 rounded-full bg-emerald" aria-hidden="true" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-soft px-2 py-0.5 text-[11px] font-semibold text-violet">
                        {lead.status || "Unknown"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-muted-foreground">
                    {[lead.city, lead.state, lead.country].filter(Boolean).join(", ")}
                  </td>
                  <td className="px-4 py-3 align-top capitalize text-muted-foreground">{lead.industry}</td>
                  <td className="px-4 py-3 align-top tabular-nums text-muted-foreground">{lead.employees}</td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex items-center gap-2">
                      {lead.linkedinUrl && (
                        <a
                          href={lead.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1 text-xs font-medium text-violet transition-colors hover:text-violet/80 ${focusRing}`}
                        >
                          LinkedIn <ArrowUpRight className="size-3" aria-hidden="true" />
                        </a>
                      )}
                      {lead.website && (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground ${focusRing}`}
                        >
                          Site <ArrowUpRight className="size-3" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No leads match your search.
        </div>
      )}
    </div>
  );
}
