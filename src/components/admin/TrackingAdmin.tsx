import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LineChart, Save, Loader2, MessageCircle } from "lucide-react";
import { getSiteSettings, updateSiteSettings, type TawkPosition } from "@/lib/site-settings.functions";

const empty = {
  gtm_id: "",
  ga4_id: "",
  fb_pixel_id: "",
  tiktok_pixel_id: "",
  custom_head_html: "",
  tawk_enabled: true,
  tawk_position: "br" as TawkPosition,
};

export function TrackingAdmin() {
  const qc = useQueryClient();
  const getFn = useServerFn(getSiteSettings);
  const setFn = useServerFn(updateSiteSettings);

  const { data, isLoading } = useQuery({
    queryKey: ["site-settings", "admin"],
    queryFn: () => getFn(),
    retry: false,
  });

  const [draft, setDraft] = useState(empty);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setDraft({
        gtm_id: data.gtm_id,
        ga4_id: data.ga4_id,
        fb_pixel_id: data.fb_pixel_id,
        tiktok_pixel_id: data.tiktok_pixel_id,
        custom_head_html: data.custom_head_html,
        tawk_enabled: data.tawk_enabled ?? true,
        tawk_position: (data.tawk_position ?? "br") as TawkPosition,
      });
    }
  }, [data]);

  const save = useMutation({
    mutationFn: (input: typeof empty) => setFn({ data: input }),
    onSuccess: () => {
      setStatus("Saved — tracking will load for visitors on next page load.");
      qc.invalidateQueries({ queryKey: ["site-settings"] });
      qc.invalidateQueries({ queryKey: ["site-settings", "admin"] });
    },
    onError: (e: Error) => setStatus(e.message),
  });

  useEffect(() => {
    if (!status) return;
    const t = window.setTimeout(() => setStatus(null), 3500);
    return () => window.clearTimeout(t);
  }, [status]);

  return (
    <section className="rounded-2xl border border-border bg-card">
      <header className="flex items-center gap-3 border-b border-border p-4">
        <div className="flex size-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500">
          <LineChart className="size-4" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold">Tracking & analytics</h2>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            GTM · GA4 · Meta Pixel · TikTok Pixel · custom snippet
          </p>
        </div>
      </header>

      <div className="grid gap-4 p-4 sm:p-6">
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Google Tag Manager ID"
                hint="Format: GTM-XXXXXX"
              >
                <input
                  value={draft.gtm_id}
                  onChange={(e) => setDraft({ ...draft, gtm_id: e.target.value })}
                  placeholder="GTM-XXXXXX"
                  className="ts-input"
                />
              </Field>
              <Field label="Google Analytics 4 ID" hint="Format: G-XXXXXXXXXX">
                <input
                  value={draft.ga4_id}
                  onChange={(e) => setDraft({ ...draft, ga4_id: e.target.value })}
                  placeholder="G-XXXXXXXXXX"
                  className="ts-input"
                />
              </Field>
              <Field label="Meta (Facebook) Pixel ID" hint="Numeric, e.g. 1234567890">
                <input
                  value={draft.fb_pixel_id}
                  onChange={(e) => setDraft({ ...draft, fb_pixel_id: e.target.value })}
                  placeholder="1234567890"
                  className="ts-input"
                />
              </Field>
              <Field label="TikTok Pixel ID" hint="From TikTok Events Manager">
                <input
                  value={draft.tiktok_pixel_id}
                  onChange={(e) => setDraft({ ...draft, tiktok_pixel_id: e.target.value })}
                  placeholder="C4XXXXXXXXXXXXXXXXXX"
                  className="ts-input"
                />
              </Field>
            </div>

            <div className="rounded-xl border border-border bg-background/50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <MessageCircle className="size-4 text-emerald-500" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Tawk.to live chat
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
                  <span className="text-sm">
                    <span className="font-semibold">Show chat widget</span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      Toggle the launcher on every page
                    </span>
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={draft.tawk_enabled}
                    onClick={() => setDraft({ ...draft, tawk_enabled: !draft.tawk_enabled })}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      draft.tawk_enabled ? "bg-emerald-500" : "bg-muted-foreground/30"
                    }`}
                  >
                    <span
                      className={`inline-block size-5 transform rounded-full bg-white shadow transition-transform ${
                        draft.tawk_enabled ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </label>
                <Field label="Launcher position" hint="Where the chat bubble appears on screen">
                  <select
                    value={draft.tawk_position}
                    disabled={!draft.tawk_enabled}
                    onChange={(e) =>
                      setDraft({ ...draft, tawk_position: e.target.value as TawkPosition })
                    }
                    className="ts-input disabled:opacity-50"
                  >
                    <option value="br">Bottom right</option>
                    <option value="bl">Bottom left</option>
                    <option value="tr">Top right</option>
                    <option value="tl">Top left</option>
                  </select>
                </Field>
              </div>
            </div>



            <Field
              label="Custom head HTML"
              hint="Advanced — pasted as-is into <head>. Only add code you trust."
            >
              <textarea
                value={draft.custom_head_html}
                onChange={(e) => setDraft({ ...draft, custom_head_html: e.target.value })}
                rows={5}
                placeholder="<!-- e.g. Hotjar, Clarity, LinkedIn Insight Tag -->"
                className="ts-input font-mono text-xs resize-y"
              />
            </Field>

            {status && (
              <p className="rounded-lg bg-secondary p-2.5 text-xs text-foreground">{status}</p>
            )}

            <div>
              <button
                type="button"
                disabled={save.isPending}
                onClick={() => save.mutate(draft)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-violet px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet/25 transition-transform hover:scale-[1.01] disabled:opacity-50"
              >
                {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Save tracking settings
              </button>
            </div>

            <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-muted-foreground">
              Tracking scripts fire in the visitor's browser. Empty a field to disable that pixel.
              Make sure your privacy policy and cookie banner reflect what you enable here.
            </p>
          </>
        )}
      </div>

      <style>{`
        .ts-input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          outline: none;
        }
        .ts-input:focus { border-color: hsl(var(--violet)); box-shadow: 0 0 0 3px hsl(var(--violet) / 0.15); }
      `}</style>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {children}
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}
