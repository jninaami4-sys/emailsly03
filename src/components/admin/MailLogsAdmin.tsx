import { useCallback, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { Mail } from "@/components/admin/AdminIcons";

type Entry = {
  ts: string | null;
  to: string | null;
  subject: string | null;
  kind: string | null;
  from: string | null;
  transport: string | null;
  bytes: number;
  html: string;
  text: string;
};

type LogsResponse = {
  path: string;
  exists: boolean;
  file_size?: number;
  total: number;
  limit: number;
  entries: Entry[];
};

const KINDS: { id: string; label: string }[] = [
  { id: "", label: "All" },
  { id: "auth", label: "Auth (OTP / reset)" },
  { id: "orders", label: "Orders" },
  { id: "support", label: "Support" },
  { id: "contact", label: "Contact" },
];

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function kindBadge(kind: string | null) {
  const map: Record<string, string> = {
    auth: "bg-blue-500/10 text-blue-300 border-blue-500/30",
    orders: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    support: "bg-violet-500/10 text-violet-300 border-violet-500/30",
    contact: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  };
  const cls = kind && map[kind] ? map[kind] : "bg-white/5 text-white/60 border-white/10";
  return (
    <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${cls}`}>
      {kind || "unknown"}
    </span>
  );
}

export function MailLogsAdmin() {
  const [data, setData] = useState<LogsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState("");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(100);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (kind) params.set("kind", kind);
      if (q) params.set("q", q);
      params.set("limit", String(limit));
      const res = await api<LogsResponse>(`/api/admin/mail-logs?${params}`);
      setData(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load mail log.");
    } finally {
      setLoading(false);
    }
  }, [kind, q, limit]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => { void load(); }, 5000);
    return () => clearInterval(id);
  }, [autoRefresh, load]);

  const clear = async () => {
    if (!confirm("Delete the entire mail.log file? This cannot be undone.")) return;
    try {
      await api("/api/admin/mail-logs", { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to clear log.");
    }
  };

  const stats = useMemo(() => {
    const s = { auth: 0, orders: 0, support: 0, contact: 0, other: 0 };
    for (const e of data?.entries ?? []) {
      const k = (e.kind || "other") as keyof typeof s;
      if (k in s) s[k]++; else s.other++;
    }
    return s;
  }, [data]);

  return (
    <div className="space-y-6">
      <header className="admin-glow-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="grid size-11 place-items-center rounded-xl border border-white/10 bg-white/5">
              <Mail className="size-5 text-[#facc15]" />
            </div>
            <div>
              <h2 className="admin-title text-2xl font-semibold">Mail log</h2>
              <p className="mt-1 text-sm text-white/70">
                Recent entries from <code className="font-mono text-white/80">api/logs/mail.log</code> — every
                auth, order, support and contact email is recorded with sender, recipient, subject and rendered body.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-white/60">
              <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="size-3.5 rounded border-white/20 bg-black/40" />
              Auto-refresh 5s
            </label>
            <button type="button" onClick={() => void load()} disabled={loading}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-50">
              {loading ? "Loading…" : "Refresh"}
            </button>
            <button type="button" onClick={clear}
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/20">
              Clear log
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Auth" value={stats.auth} color="text-blue-300" />
          <Stat label="Orders" value={stats.orders} color="text-emerald-300" />
          <Stat label="Support" value={stats.support} color="text-violet-300" />
          <Stat label="Contact / Other" value={stats.contact + stats.other} color="text-amber-300" />
        </div>
      </header>

      <div className="admin-glow-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5">
            {KINDS.map((k) => (
              <button key={k.id || "all"} type="button" onClick={() => setKind(k.id)}
                className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold ${
                  kind === k.id
                    ? "border-[#facc15]/60 bg-[#facc15]/10 text-white"
                    : "border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06]"
                }`}>
                {k.label}
              </button>
            ))}
          </div>
          <input
            type="search" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search recipient, subject, from, body…"
            className="min-w-[220px] flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#facc15]/60 focus:outline-none"
          />
          <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}
            className="rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-sm text-white">
            {[25, 50, 100, 250, 500].map((n) => <option key={n} value={n}>Last {n}</option>)}
          </select>
        </div>
        {data && (
          <div className="mt-3 text-[11px] text-white/50">
            {data.exists ? (
              <>Showing {data.entries.length} of {data.total} matching · file size {fmtBytes(data.file_size ?? 0)}</>
            ) : (
              <>No mail.log file yet — will be created on first send.</>
            )}
          </div>
        )}
        {error && <div className="mt-2 text-sm text-[#fca5a5]">{error}</div>}
      </div>

      <div className="admin-glow-card overflow-hidden">
        {!data?.entries.length ? (
          <div className="p-10 text-center text-sm text-white/40">
            {loading ? "Loading…" : "No entries."}
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.02] text-[11px] uppercase tracking-wider text-white/50">
              <tr>
                <th className="px-4 py-2.5">Time</th>
                <th className="px-4 py-2.5">Kind</th>
                <th className="px-4 py-2.5">From</th>
                <th className="px-4 py-2.5">To</th>
                <th className="px-4 py-2.5">Subject</th>
                <th className="px-4 py-2.5 text-right">Size</th>
              </tr>
            </thead>
            <tbody>
              {data.entries.map((e, i) => (
                <>
                  <tr key={i} onClick={() => setOpenIdx(openIdx === i ? null : i)}
                    className="cursor-pointer border-b border-white/5 hover:bg-white/[0.03]">
                    <td className="px-4 py-2.5 font-mono text-[11px] text-white/60">{e.ts ? new Date(e.ts).toLocaleString() : "—"}</td>
                    <td className="px-4 py-2.5">{kindBadge(e.kind)}</td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-white/70">{e.from || "—"}</td>
                    <td className="px-4 py-2.5 text-white/90">{e.to || "—"}</td>
                    <td className="px-4 py-2.5 text-white/80">{e.subject || "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-[11px] text-white/50">{fmtBytes(e.bytes)}</td>
                  </tr>
                  {openIdx === i && (
                    <tr key={`${i}-detail`} className="bg-black/40">
                      <td colSpan={6} className="px-4 py-4">
                        <div className="grid gap-4 lg:grid-cols-2">
                          <div>
                            <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-white/40">Text</div>
                            <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-black/40 p-3 text-[12px] text-white/80">{e.text || "(empty)"}</pre>
                          </div>
                          <div>
                            <div className="mb-1 flex items-center justify-between">
                              <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">Rendered HTML</span>
                              <span className="font-mono text-[10px] text-white/40">transport: {e.transport || "log"}</span>
                            </div>
                            <iframe
                              title={`mail-${i}`}
                              className="h-72 w-full rounded-lg border border-white/10 bg-white"
                              sandbox=""
                              srcDoc={e.html}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="font-mono text-[10px] uppercase tracking-widest text-white/50">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
