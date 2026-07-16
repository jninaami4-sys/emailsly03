import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listSiteContent, upsertSiteContent } from "@/lib/site-content.functions";
import { SITE_CONTENT_DEFAULTS } from "@/lib/site-content-defaults";
import { Palette, Save, Loader2, RefreshCw } from "@/components/admin/AdminIcons";

type BrandingValues = {
  site_name: string;
  logo_url: string;
  footer_logo_url: string;
  favicon_url: string;
  tagline: string;
  primary_color: string;
  accent_color: string;
  ink_color: string;
};

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function BrandSettingsAdmin() {
  const listFn = useServerFn(listSiteContent);
  const upsertFn = useServerFn(upsertSiteContent);
  const qc = useQueryClient();

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["site-content"],
    queryFn: () => listFn(),
    staleTime: 30_000,
  });

  const merged: BrandingValues = useMemo(
    () => ({
      ...SITE_CONTENT_DEFAULTS.branding,
      ...((data?.branding ?? {}) as Partial<BrandingValues>),
    }),
    [data],
  );

  const [values, setValues] = useState<BrandingValues>(merged);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    setValues(merged);
  }, [merged]);

  const mutation = useMutation({
    mutationFn: async () => {
      for (const key of ["primary_color", "accent_color", "ink_color"] as const) {
        const v = String(values[key] || "").trim();
        if (v && !HEX_RE.test(v)) throw new Error(`${key} must be a hex color like #7C3AED`);
      }
      await upsertFn({ data: { section: "branding", data: JSON.parse(JSON.stringify(values)) } });
    },
    onSuccess: () => {
      setError(null);
      setSavedAt(Date.now());
      qc.invalidateQueries({ queryKey: ["site-content"] });
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : "Save failed"),
  });

  function set<K extends keyof BrandingValues>(key: K, v: BrandingValues[K]) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  function resetToDefaults() {
    setValues({ ...SITE_CONTENT_DEFAULTS.branding });
  }

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl font-bold">
            <Palette className="size-6 text-violet" /> Brand Settings
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Update the display name, logo, favicon, tagline, and primary colors. No code changes needed.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:border-violet"
          >
            <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            type="button"
            onClick={resetToDefaults}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:border-violet"
          >
            Reset to defaults
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading branding…
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
        >
          {/* Left: fields */}
          <div className="space-y-5 rounded-xl border border-border bg-background/40 p-5">
            <FieldRow label="Display name" hint="Shown in the header, emails, invoices, and page titles.">
              <input
                type="text"
                value={values.site_name}
                onChange={(e) => set("site_name", e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-violet"
                placeholder="EmailsLy"
              />
            </FieldRow>

            <FieldRow label="Tagline" hint="One-line description used near the logo.">
              <input
                type="text"
                value={values.tagline}
                onChange={(e) => set("tagline", e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-violet"
                placeholder="Verified B2B Data Platform"
              />
            </FieldRow>

            <FieldRow label="Logo URL" hint="Direct link to a transparent PNG or SVG. Used on light backgrounds (header, emails, invoices).">
              <input
                type="url"
                value={values.logo_url}
                onChange={(e) => set("logo_url", e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-violet"
                placeholder="https://…/logo.png"
              />
            </FieldRow>

            <FieldRow label="Footer logo URL" hint="Light version for the dark footer. Falls back to the main logo if empty.">
              <input
                type="url"
                value={values.footer_logo_url}
                onChange={(e) => set("footer_logo_url", e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-violet"
                placeholder="https://…/logo-white.png"
              />
            </FieldRow>

            <FieldRow label="Favicon URL" hint="Small square icon shown in the browser tab (32×32 or 64×64).">
              <input
                type="url"
                value={values.favicon_url}
                onChange={(e) => set("favicon_url", e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-violet"
                placeholder="https://…/favicon.png"
              />
            </FieldRow>

            <div className="grid gap-4 sm:grid-cols-3">
              <ColorField
                label="Primary"
                hint="Buttons, links, highlights"
                value={values.primary_color}
                onChange={(v) => set("primary_color", v)}
              />
              <ColorField
                label="Accent"
                hint="Success / positive states"
                value={values.accent_color}
                onChange={(v) => set("accent_color", v)}
              />
              <ColorField
                label="Ink"
                hint="Headings and dark UI"
                value={values.ink_color}
                onChange={(v) => set("ink_color", v)}
              />
            </div>

            {error && (
              <p className="rounded-lg border border-coral/30 bg-coral/5 px-3 py-2 text-sm text-coral">{error}</p>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={mutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-violet px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_oklch(0.52_0.24_293/0.6)] disabled:opacity-60"
              >
                {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {mutation.isPending ? "Saving…" : "Save brand settings"}
              </button>
              {savedAt && !mutation.isPending && (
                <span className="text-xs text-emerald">Saved ✓ — refresh to see it everywhere.</span>
              )}
            </div>
          </div>

          {/* Right: live preview */}
          <div className="space-y-3">
            <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Live preview
            </div>
            <div
              className="overflow-hidden rounded-2xl border border-border bg-white text-black shadow-sm"
              style={
                {
                  ["--brand-primary" as string]: values.primary_color,
                  ["--brand-accent" as string]: values.accent_color,
                  ["--brand-ink" as string]: values.ink_color,
                } as React.CSSProperties
              }
            >
              <div className="flex items-center gap-3 border-b border-neutral-200 p-4">
                {values.logo_url ? (
                  <img
                    src={values.logo_url}
                    alt={`${values.site_name || "Brand"} logo`}
                    className="h-8 w-8 rounded-md object-contain"
                  />
                ) : (
                  <div
                    className="flex size-8 items-center justify-center rounded-md font-display text-sm font-black text-white"
                    style={{ backgroundColor: "var(--brand-primary)" }}
                  >
                    {(values.site_name || "E").trim().charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div
                    className="truncate font-display text-base font-bold leading-tight"
                    style={{ color: "var(--brand-ink)" }}
                  >
                    {values.site_name || "Brand name"}
                  </div>
                  <div className="truncate text-[11px] text-neutral-500">{values.tagline}</div>
                </div>
              </div>
              <div className="space-y-3 p-4">
                <button
                  type="button"
                  className="w-full rounded-lg px-3 py-2 text-sm font-semibold text-white"
                  style={{ backgroundColor: "var(--brand-primary)" }}
                >
                  Primary button
                </button>
                <button
                  type="button"
                  className="w-full rounded-lg border px-3 py-2 text-sm font-semibold"
                  style={{ borderColor: "var(--brand-primary)", color: "var(--brand-primary)" }}
                >
                  Secondary button
                </button>
                <div
                  className="rounded-lg px-3 py-2 text-xs font-semibold text-white"
                  style={{ backgroundColor: "var(--brand-accent)" }}
                >
                  Order delivered ✓
                </div>
                {values.favicon_url && (
                  <div className="flex items-center gap-2 rounded-lg bg-neutral-100 px-3 py-2 text-xs text-neutral-600">
                    <img src={values.favicon_url} alt="Favicon" className="size-4 rounded-sm object-contain" />
                    Browser tab icon
                  </div>
                )}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Colors apply site-wide after saving. Some cached pages may need a hard refresh.
            </p>
          </div>
        </form>
      )}
    </div>
  );
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ColorField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const safe = HEX_RE.test(value) ? value : "#7C3AED";
  return (
    <div>
      <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-2 py-2">
        <input
          type="color"
          value={safe}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-9 w-10 cursor-pointer rounded-md border border-border bg-transparent p-0"
          aria-label={`${label} color picker`}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md bg-transparent px-2 py-1 font-mono text-sm outline-none"
          placeholder="#7C3AED"
        />
      </div>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
