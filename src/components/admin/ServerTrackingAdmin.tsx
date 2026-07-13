import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Server, Save, Loader2, CheckCircle2, XCircle, MinusCircle, RefreshCcw } from "lucide-react";
import {
  getServerTrackingConfig,
  updateServerTrackingConfig,
  listServerEventLog,
  type ServerTrackingConfig,
} from "@/lib/server-tracking.functions";

const empty: ServerTrackingConfig = {
  ga4_measurement_id: "",
  ga4_api_secret: "",
  ga4_enabled: false,
  meta_pixel_id: "",
  meta_access_token: "",
  meta_test_event_code: "",
  meta_enabled: false,
  tiktok_pixel_id: "",
  tiktok_access_token: "",
  tiktok_test_event_code: "",
  tiktok_enabled: false,
  updated_at: new Date(0).toISOString(),
};

const input =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet/40";
const label = "block text-xs font-medium text-muted-foreground mb-1";

export function ServerTrackingAdmin() {
  const qc = useQueryClient();
  const getFn = useServerFn(getServerTrackingConfig);
  const setFn = useServerFn(updateServerTrackingConfig);
  const logFn = useServerFn(listServerEventLog);

  const { data, isLoading } = useQuery({
    queryKey: ["server-tracking", "config"],
    queryFn: () => getFn(),
    retry: false,
  });
  const log = useQuery({
    queryKey: ["server-tracking", "log"],
    queryFn: () => logFn(),
    retry: false,
    refetchInterval: 15000,
  });

  const [draft, setDraft] = useState<ServerTrackingConfig>(empty);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  const save = useMutation({
    mutationFn: () => setFn({ data: draft }),
    onSuccess: () => {
      setStatus("Saved — new events dispatch server-side immediately.");
      qc.invalidateQueries({ queryKey: ["server-tracking"] });
    },
    onError: (e: Error) => setStatus(e.message),
  });

  const set = (k: keyof ServerTrackingConfig) => (v: string | boolean) =>
    setDraft((d) => ({ ...d, [k]: v } as ServerTrackingConfig));

  return (
    <section className="rounded-2xl border border-border bg-card">
      <header className="flex items-center gap-3 border-b border-border p-5">
        <div className="flex size-10 items-center justify-center rounded-xl bg-violet/10 text-violet">
          <Server className="size-5" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold">Server-side event dispatch</h2>
          <p className="text-xs text-muted-foreground">
            Send purchase &amp; download events to GA4 Measurement Protocol, Meta CAPI, and
            TikTok Events API. Shared <code className="rounded bg-secondary px-1 font-mono">event_id</code>{" "}
            dedupes against the browser fire.
          </p>
        </div>
      </header>

      {isLoading ? (
        <div className="p-6 text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="grid gap-6 p-5 md:grid-cols-3">
          <ProviderCard
            title="GA4 Measurement Protocol"
            enabled={draft.ga4_enabled}
            onEnabledChange={(v) => set("ga4_enabled")(v)}
            docsHref="https://developers.google.com/analytics/devguides/collection/protocol/ga4"
          >
            <div>
              <label className={label}>Measurement ID</label>
              <input
                className={input}
                placeholder="G-XXXXXXX"
                value={draft.ga4_measurement_id}
                onChange={(e) => set("ga4_measurement_id")(e.target.value)}
              />
            </div>
            <div>
              <label className={label}>API secret</label>
              <input
                className={input}
                type="password"
                autoComplete="off"
                placeholder="from Admin → Data streams"
                value={draft.ga4_api_secret}
                onChange={(e) => set("ga4_api_secret")(e.target.value)}
              />
            </div>
          </ProviderCard>

          <ProviderCard
            title="Meta Conversions API"
            enabled={draft.meta_enabled}
            onEnabledChange={(v) => set("meta_enabled")(v)}
            docsHref="https://developers.facebook.com/docs/marketing-api/conversions-api"
          >
            <div>
              <label className={label}>Pixel ID</label>
              <input
                className={input}
                value={draft.meta_pixel_id}
                onChange={(e) => set("meta_pixel_id")(e.target.value)}
              />
            </div>
            <div>
              <label className={label}>Access token</label>
              <input
                className={input}
                type="password"
                autoComplete="off"
                value={draft.meta_access_token}
                onChange={(e) => set("meta_access_token")(e.target.value)}
              />
            </div>
            <div>
              <label className={label}>Test event code (optional)</label>
              <input
                className={input}
                placeholder="TEST12345"
                value={draft.meta_test_event_code}
                onChange={(e) => set("meta_test_event_code")(e.target.value)}
              />
            </div>
          </ProviderCard>

          <ProviderCard
            title="TikTok Events API"
            enabled={draft.tiktok_enabled}
            onEnabledChange={(v) => set("tiktok_enabled")(v)}
            docsHref="https://business-api.tiktok.com/portal/docs?id=1739584700010497"
          >
            <div>
              <label className={label}>Pixel ID</label>
              <input
                className={input}
                value={draft.tiktok_pixel_id}
                onChange={(e) => set("tiktok_pixel_id")(e.target.value)}
              />
            </div>
            <div>
              <label className={label}>Access token</label>
              <input
                className={input}
                type="password"
                autoComplete="off"
                value={draft.tiktok_access_token}
                onChange={(e) => set("tiktok_access_token")(e.target.value)}
              />
            </div>
            <div>
              <label className={label}>Test event code (optional)</label>
              <input
                className={input}
                value={draft.tiktok_test_event_code}
                onChange={(e) => set("tiktok_test_event_code")(e.target.value)}
              />
            </div>
          </ProviderCard>
        </div>
      )}

      <footer className="flex items-center justify-between gap-3 border-t border-border p-5">
        <span className="text-xs text-muted-foreground">{status ?? "Tokens are stored securely and only readable by the admin."}</span>
        <button
          type="button"
          disabled={save.isPending || isLoading}
          onClick={() => save.mutate()}
          className="inline-flex items-center gap-2 rounded-xl bg-violet px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save configuration
        </button>
      </footer>

      <div className="border-t border-border p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Recent server dispatches</h3>
          <button
            type="button"
            onClick={() => log.refetch()}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCcw className="size-3" /> Refresh
          </button>
        </div>
        <div className="max-h-80 overflow-auto rounded-lg border border-border">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-secondary/60 text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Event</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Providers</th>
                <th className="px-3 py-2">Event ID</th>
              </tr>
            </thead>
            <tbody>
              {(log.data ?? []).map((row) => (
                <tr key={row.id} className="border-t border-border/60">
                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 font-mono">{row.event_key}</td>
                  <td className="px-3 py-2">
                    <StatusPill status={row.status} />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {(row.providers ?? []).map((p, i) => (
                        <span
                          key={i}
                          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] ${
                            p.ok
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-rose-500/10 text-rose-500"
                          }`}
                          title={p.text ?? ""}
                        >
                          {p.provider} {p.status}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="max-w-[160px] truncate px-3 py-2 font-mono text-muted-foreground">
                    {row.event_id}
                  </td>
                </tr>
              ))}
              {log.data && log.data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                    No server events yet — fire a conversion on the site to see it appear here.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function ProviderCard({
  title,
  enabled,
  onEnabledChange,
  docsHref,
  children,
}: {
  title: string;
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  docsHref: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <a
            href={docsHref}
            target="_blank"
            rel="noreferrer noopener"
            className="text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            docs
          </a>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={enabled}
            onChange={(e) => onEnabledChange(e.target.checked)}
          />
          <span className="relative h-5 w-9 rounded-full bg-secondary transition peer-checked:bg-violet">
            <span className="absolute left-0.5 top-0.5 size-4 rounded-full bg-white transition peer-checked:translate-x-4" />
          </span>
          <span className="text-xs">{enabled ? "On" : "Off"}</span>
        </label>
      </div>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { className: string; Icon: typeof CheckCircle2 }> = {
    ok: { className: "bg-emerald-500/10 text-emerald-500", Icon: CheckCircle2 },
    partial: { className: "bg-amber-500/10 text-amber-500", Icon: MinusCircle },
    error: { className: "bg-rose-500/10 text-rose-500", Icon: XCircle },
    skipped: { className: "bg-secondary text-muted-foreground", Icon: MinusCircle },
  };
  const { className, Icon } = map[status] ?? map.skipped;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] ${className}`}>
      <Icon className="size-3" /> {status}
    </span>
  );
}
