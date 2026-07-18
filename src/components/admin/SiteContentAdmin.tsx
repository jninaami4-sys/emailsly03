import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listSiteContent, upsertSiteContent } from "@/lib/site-content.functions";
import { SITE_CONTENT_DEFAULTS, type SiteContentSection } from "@/lib/site-content-defaults";
import { ServiceCardsEditor } from "@/components/admin/ServiceCardsEditor";
import {
  Globe, Layout, BellRing, ShieldCheck, Boxes, BarChart3, HelpCircle,
  Megaphone, PanelBottom, Sparkles, Palette, Mail, Save, Loader2, RefreshCw,
} from "@/components/admin/AdminIcons";


type TabDef = {
  id: SiteContentSection;
  label: string;
  icon: typeof Globe;
  description: string;
};

const TABS: TabDef[] = [
  { id: "hero", label: "Hero", icon: Layout, description: "Homepage hero — badge, headline, subtitle, CTAs." },
  { id: "popup", label: "Popup", icon: BellRing, description: "Welcome/promo popup shown on first visit." },
  { id: "trust", label: "Trust", icon: ShieldCheck, description: "Trust bar stats under the hero." },
  { id: "services", label: "Services heading", icon: Boxes, description: "Services carousel heading & subheading." },
  { id: "service_cards", label: "Service cards", icon: Boxes, description: "Every service card — icon, price, bullets, gradient." },

  { id: "competitors", label: "Competitors", icon: BarChart3, description: "Comparison table copy vs. competitors." },
  { id: "faq", label: "FAQ", icon: HelpCircle, description: "Homepage FAQ questions & answers." },
  { id: "notices", label: "Notices", icon: Megaphone, description: "Top banner / global notices." },
  { id: "footer", label: "Footer", icon: PanelBottom, description: "Footer tagline, copyright, newsletter copy." },
  { id: "misc", label: "Misc", icon: Sparkles, description: "Misc CTA banners and one-off strings." },
  { id: "branding", label: "Branding", icon: Palette, description: "Site name, logo, favicon, tagline." },
  { id: "contact", label: "Contact", icon: Mail, description: "Contact page email, WhatsApp, calendar, hours." },
];

// Field label overrides (defaults to Title Cased key)
const LABEL_OVERRIDES: Record<string, string> = {
  title_line_1: "Title Line 1",
  title_line_2: "Title Line 2",
  title_line_3: "Title Line 3",
  primary_cta: "Primary CTA",
  secondary_cta: "Secondary CTA",
  cta_label: "CTA Label",
  cta_url: "CTA URL",
  top_banner_enabled: "Top Banner Enabled",
  top_banner_text: "Top Banner Text",
  top_banner_url: "Top Banner URL",
  cta_banner_heading: "CTA Banner Heading",
  cta_banner_sub: "CTA Banner Subtext",
  cta_banner_button: "CTA Banner Button",
  logo_url: "Logo URL",
  favicon_url: "Favicon URL",
  calendar_url: "Calendar URL",
  response_promise: "Response Promise",
  newsletter_heading: "Newsletter Heading",
  newsletter_sub: "Newsletter Subtext",
};

function humanize(key: string) {
  if (LABEL_OVERRIDES[key]) return LABEL_OVERRIDES[key];
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const LONG_FIELDS = new Set([
  "subtitle", "body", "response_promise", "cta_banner_sub", "top_banner_text",
  "newsletter_sub", "tagline",
]);

export function SiteContentAdmin() {
  const [tab, setTab] = useState<SiteContentSection>("hero");
  const listFn = useServerFn(listSiteContent);
  const qc = useQueryClient();
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["site-content"],
    queryFn: () => listFn(),
    staleTime: 30_000,
  });

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl font-bold">
            <Globe className="size-6 text-violet" /> Site Content
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit all website content — changes reflect instantly.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:border-violet"
        >
          <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex flex-wrap gap-1 rounded-xl border border-border bg-background/60 p-1.5">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                active
                  ? "bg-violet text-white shadow-[0_6px_18px_-8px_oklch(0.52_0.24_293/0.6)]"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <Icon className="size-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading content…
        </div>
      ) : (
        tab === "service_cards" ? (
          <ServiceCardsEditor
            key={tab}
            initial={(data?.service_cards ?? {}) as Record<string, unknown>}
            onSaved={() => qc.invalidateQueries({ queryKey: ["site-content"] })}
          />
        ) : (
          <SectionEditor
            key={tab}
            section={tab}
            initial={(data?.[tab] ?? {}) as Record<string, unknown>}
            onSaved={() => qc.invalidateQueries({ queryKey: ["site-content"] })}
          />
        )

      )}
    </div>
  );
}

function SectionEditor({
  section,
  initial,
  onSaved,
}: {
  section: SiteContentSection;
  initial: Record<string, unknown>;
  onSaved: () => void;
}) {
  const defaults = SITE_CONTENT_DEFAULTS[section] as Record<string, unknown>;
  const merged = useMemo(() => ({ ...defaults, ...initial }), [defaults, initial]);
  const [values, setValues] = useState<Record<string, unknown>>(merged);
  const upsertFn = useServerFn(upsertSiteContent);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    setValues(merged);
  }, [merged]);

  const mutation = useMutation({
    mutationFn: async () => {
      // Convert to JSON-safe payload
      const payload = JSON.parse(JSON.stringify(values));
      await upsertFn({ data: { section, data: payload } });
    },
    onSuccess: () => {
      setError(null);
      setSavedAt(Date.now());
      onSaved();
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : "Save failed"),
  });

  const tab = TABS.find((t) => t.id === section)!;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
      className="rounded-xl border border-border bg-background/40 p-5"
    >
      <div className="mb-4">
        <h3 className="font-display text-lg font-bold">{tab.label} Section</h3>
        <p className="text-xs text-muted-foreground">{tab.description}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {Object.entries(values).map(([key, val]) => {
          if (key === "items" && Array.isArray(val)) {
            return (
              <div key={key} className="sm:col-span-2">
                <ItemsEditor
                  label={humanize(key)}
                  items={val as Array<{ q: string; a: string }>}
                  onChange={(items) => setValues((v) => ({ ...v, [key]: items }))}
                />
              </div>
            );
          }
          const isBool = typeof val === "boolean";
          const isLong = LONG_FIELDS.has(key);
          const span = isLong ? "sm:col-span-2" : "";
          return (
            <div key={key} className={span}>
              <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {humanize(key)}
              </label>
              {isBool ? (
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-4 py-3">
                  <input
                    type="checkbox"
                    checked={val as boolean}
                    onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.checked }))}
                    className="size-4 accent-violet"
                  />
                  <span className="text-sm">{val ? "Enabled" : "Disabled"}</span>
                </label>
              ) : isLong ? (
                <textarea
                  value={String(val ?? "")}
                  rows={3}
                  onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-violet"
                />
              ) : (
                <input
                  type="text"
                  value={String(val ?? "")}
                  onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-violet"
                />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-coral/30 bg-coral/5 px-3 py-2 text-sm text-coral">{error}</p>
      )}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-violet px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_oklch(0.52_0.24_293/0.6)] disabled:opacity-60"
        >
          {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {mutation.isPending ? "Saving…" : "Save Changes"}
        </button>
        {savedAt && !mutation.isPending && (
          <span className="text-xs text-emerald">Saved ✓</span>
        )}
      </div>
    </form>
  );
}

function ItemsEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: Array<{ q: string; a: string }>;
  onChange: (items: Array<{ q: string; a: string }>) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </label>
        <button
          type="button"
          onClick={() => onChange([...items, { q: "", a: "" }])}
          className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-semibold hover:border-violet"
        >
          + Add item
        </button>
      </div>
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="rounded-xl border border-border bg-background/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                #{i + 1}
              </span>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                className="text-xs font-semibold text-coral hover:underline"
              >
                Remove
              </button>
            </div>
            <input
              type="text"
              placeholder="Question"
              value={it.q}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...it, q: e.target.value };
                onChange(next);
              }}
              className="mb-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-violet"
            />
            <textarea
              placeholder="Answer"
              rows={2}
              value={it.a}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...it, a: e.target.value };
                onChange(next);
              }}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-violet"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
