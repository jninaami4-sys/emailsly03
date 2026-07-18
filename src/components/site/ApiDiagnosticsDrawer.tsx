import { useEffect, useState } from "react";
import { Bug, X, RefreshCcw, Trash2, Copy, Check } from "lucide-react";
import {
  getApiLog,
  subscribeApiLog,
  clearApiLog,
  getApiBase,
  checkApiHealth,
  type ApiLogEntry,
} from "@/lib/api-client";

function statusTone(e: ApiLogEntry): string {
  if (!e.ok) return "text-red-500 border-red-500/40 bg-red-500/10";
  if (e.status >= 200 && e.status < 300) return "text-emerald-500 border-emerald-500/40 bg-emerald-500/10";
  return "text-amber-500 border-amber-500/40 bg-amber-500/10";
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString(undefined, { hour12: false });
}

export function ApiDiagnosticsDrawer() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<ApiLogEntry[]>(() => getApiLog());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [health, setHealth] = useState<{ ok: boolean; message?: string; latencyMs?: number } | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => subscribeApiLog(setEntries), []);

  // Keyboard shortcut: Ctrl/Cmd + Shift + D
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const runHealth = async () => {
    setChecking(true);
    try {
      const r = await checkApiHealth();
      setHealth({ ok: r.ok, message: r.message, latencyMs: r.latencyMs });
    } catch (e) {
      setHealth({ ok: false, message: e instanceof Error ? e.message : String(e) });
    } finally {
      setChecking(false);
    }
  };

  const failing = entries.filter((e) => !e.ok).length;

  const copyAll = async () => {
    const payload = {
      base: getApiBase() || window.location.origin,
      capturedAt: new Date().toISOString(),
      entries,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  return (
    <>
      {/* Floating toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open API diagnostics"
        title="API diagnostics (Ctrl/Cmd+Shift+D)"
        className="fixed bottom-4 right-4 z-[70] inline-flex items-center gap-2 rounded-full border border-border bg-background/90 px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur transition hover:border-foreground/40"
      >
        <Bug className="size-4" />
        <span className="hidden sm:inline">Diagnostics</span>
        {failing > 0 && (
          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
            {failing}
          </span>
        )}
      </button>

      {/* Drawer */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-[71] bg-black/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside
            role="dialog"
            aria-label="API diagnostics"
            className="fixed right-0 top-0 z-[72] flex h-full w-full max-w-xl flex-col border-l border-border bg-background shadow-2xl"
          >
            <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <Bug className="size-4" />
                <div>
                  <div className="text-sm font-semibold">API diagnostics</div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    Base: {getApiBase() || `${window.location.origin} (same-origin)`}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 hover:bg-muted"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </header>

            <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2">
              <button
                type="button"
                onClick={runHealth}
                disabled={checking}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-semibold hover:border-foreground/40 disabled:opacity-50"
              >
                <RefreshCcw className={`size-3.5 ${checking ? "animate-spin" : ""}`} /> Health check
              </button>
              <button
                type="button"
                onClick={copyAll}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-semibold hover:border-foreground/40"
              >
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} Copy log
              </button>
              <button
                type="button"
                onClick={clearApiLog}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-semibold hover:border-foreground/40"
              >
                <Trash2 className="size-3.5" /> Clear
              </button>
              <div className="ml-auto text-[11px] text-muted-foreground">
                {entries.length} req · {failing} failing
              </div>
            </div>

            {health && (
              <div
                className={`border-b border-border px-4 py-2 text-xs ${
                  health.ok ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {health.ok
                  ? `OK · ${health.latencyMs}ms`
                  : `Unreachable · ${health.message ?? "unknown error"}`}
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {entries.length === 0 ? (
                <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No API calls captured yet. Interact with the page and they'll appear here.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {entries.map((e) => {
                    const isOpen = expanded === e.id;
                    return (
                      <li key={e.id} className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => setExpanded(isOpen ? null : e.id)}
                          className="flex w-full items-center gap-2 text-left"
                        >
                          <span
                            className={`inline-flex min-w-14 justify-center rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold ${statusTone(e)}`}
                          >
                            {e.status || (e.ok ? "OK" : "ERR")}
                          </span>
                          <span className="font-mono text-[11px] text-muted-foreground">{e.method}</span>
                          <span className="flex-1 truncate font-mono text-xs">{e.path}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {e.durationMs}ms
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">{fmtTime(e.at)}</span>
                        </button>
                        {isOpen && (
                          <div className="mt-2 space-y-1 rounded-md bg-muted/50 p-2 font-mono text-[11px]">
                            <div><span className="text-muted-foreground">URL:</span> {e.url}</div>
                            <div><span className="text-muted-foreground">Content-Type:</span> {e.contentType || "—"}</div>
                            {e.error && (
                              <div className="text-red-500"><span className="text-muted-foreground">Error:</span> {e.error}</div>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <footer className="border-t border-border px-4 py-2 text-[10px] text-muted-foreground">
              Toggle: <kbd className="rounded border border-border px-1">Ctrl/Cmd</kbd> +{" "}
              <kbd className="rounded border border-border px-1">Shift</kbd> +{" "}
              <kbd className="rounded border border-border px-1">D</kbd>
            </footer>
          </aside>
        </>
      )}
    </>
  );
}
