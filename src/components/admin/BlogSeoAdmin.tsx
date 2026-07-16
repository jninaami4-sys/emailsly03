import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Save, RefreshCw, Search, ExternalLink } from "@/components/admin/AdminIcons";
import { BLOG_POSTS } from "@/lib/blog-posts";
import { OG_IMAGES } from "@/lib/og-images";
import {
  adminListBlogSeoOverrides,
  adminUpsertBlogSeo,
  adminResetBlogSeo,
  type BlogSeoOverride,
} from "@/lib/blog-seo.functions";

type Draft = {
  meta_description: string;
  canonical_url: string;
  og_image: string;
  social_title: string;
};

const BLANK: Draft = { meta_description: "", canonical_url: "", og_image: "", social_title: "" };

function toDraft(o: BlogSeoOverride | undefined | null): Draft {
  return {
    meta_description: o?.meta_description ?? "",
    canonical_url: o?.canonical_url ?? "",
    og_image: o?.og_image ?? "",
    social_title: o?.social_title ?? "",
  };
}

export function BlogSeoAdmin() {
  const listFn = useServerFn(adminListBlogSeoOverrides);
  const upsertFn = useServerFn(adminUpsertBlogSeo);
  const resetFn = useServerFn(adminResetBlogSeo);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin-blog-seo"],
    queryFn: () => listFn(),
    staleTime: 10_000,
  });

  const [slug, setSlug] = useState<string>(BLOG_POSTS[0]?.slug ?? "");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Draft>(BLANK);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const overridesBySlug = useMemo(() => {
    const m = new Map<string, BlogSeoOverride>();
    (data ?? []).forEach((o) => m.set(o.slug, o));
    return m;
  }, [data]);

  const post = BLOG_POSTS.find((p) => p.slug === slug) ?? BLOG_POSTS[0];
  const override = overridesBySlug.get(slug);

  // sync draft when switching post or when data reloads
  useEffect(() => {
    setDraft(toDraft(override));
    setSaved(null);
  }, [slug, override?.updated_at]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return BLOG_POSTS;
    return BLOG_POSTS.filter(
      (p) => p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q),
    );
  }, [query]);

  const effectiveTitle = draft.social_title.trim() || post.title;
  const effectiveDesc = draft.meta_description.trim() || post.excerpt;
  const effectiveImage = draft.og_image.trim() || OG_IMAGES.blog;
  const effectiveCanonical = draft.canonical_url.trim() || `/blog/${post.slug}`;

  async function save() {
    setBusy(true);
    setSaved(null);
    try {
      await upsertFn({
        data: {
          slug: post.slug,
          meta_description: draft.meta_description.trim() || null,
          canonical_url: draft.canonical_url.trim() || null,
          og_image: draft.og_image.trim() || null,
          social_title: draft.social_title.trim() || null,
        },
      });
      await refetch();
      setSaved("Saved");
      setTimeout(() => setSaved(null), 2000);
    } catch (e) {
      setSaved(`Error: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (!confirm("Remove overrides and restore defaults for this post?")) return;
    setBusy(true);
    try {
      await resetFn({ data: { slug: post.slug } });
      await refetch();
      setDraft(BLANK);
      setSaved("Reset to defaults");
      setTimeout(() => setSaved(null), 2000);
    } finally {
      setBusy(false);
    }
  }

  const descLen = draft.meta_description.length;
  const titleLen = effectiveTitle.length;

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      {/* LIST */}
      <aside className="rounded-2xl border border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-2 border-b border-white/10 p-3">
          <Search className="size-4 text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts…"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/40"
          />
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded p-1 text-white/50 hover:bg-white/5 hover:text-white"
            aria-label="Refresh"
          >
            {isFetching ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
          </button>
        </div>
        <ul className="max-h-[70vh] divide-y divide-white/5 overflow-y-auto">
          {filtered.map((p) => {
            const has = overridesBySlug.has(p.slug);
            const active = p.slug === slug;
            return (
              <li key={p.slug}>
                <button
                  type="button"
                  onClick={() => setSlug(p.slug)}
                  className={`flex w-full flex-col gap-1 px-3 py-2.5 text-left transition-colors ${
                    active ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="line-clamp-1 flex-1 text-[13px] font-medium text-white/90">
                      {p.title}
                    </span>
                    {has && (
                      <span className="rounded-full bg-emerald-400/15 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                        Custom
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-white/40">/blog/{p.slug}</span>
                </button>
              </li>
            );
          })}
          {isLoading && (
            <li className="p-6 text-center text-xs text-white/40">Loading…</li>
          )}
        </ul>
      </aside>

      {/* EDITOR + PREVIEWS */}
      <section className="space-y-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-white/50">
                Editing
              </p>
              <p className="mt-0.5 truncate font-display text-base font-semibold text-white">
                {post.title}
              </p>
            </div>
            <a
              href={`/blog/${post.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-white/70 hover:text-white"
            >
              <ExternalLink className="size-3.5" /> Open
            </a>
          </div>

          <div className="grid gap-4">
            <Field
              label="Social title (og:title)"
              hint={`${titleLen}/60 ideal · falls back to post title`}
              warn={titleLen > 60}
            >
              <input
                type="text"
                value={draft.social_title}
                onChange={(e) => setDraft((d) => ({ ...d, social_title: e.target.value }))}
                placeholder={post.title}
                className="admin-input"
              />
            </Field>

            <Field
              label="Meta description"
              hint={`${descLen}/160 ideal · falls back to post excerpt`}
              warn={descLen > 160}
            >
              <textarea
                value={draft.meta_description}
                onChange={(e) => setDraft((d) => ({ ...d, meta_description: e.target.value }))}
                placeholder={post.excerpt}
                rows={3}
                className="admin-input resize-none"
              />
            </Field>

            <Field label="Canonical URL" hint="Absolute or relative. Defaults to /blog/slug.">
              <input
                type="text"
                value={draft.canonical_url}
                onChange={(e) => setDraft((d) => ({ ...d, canonical_url: e.target.value }))}
                placeholder={`/blog/${post.slug}`}
                className="admin-input"
              />
            </Field>

            <Field label="OG image URL" hint="1200×630 PNG/JPG. Falls back to default blog OG.">
              <input
                type="text"
                value={draft.og_image}
                onChange={(e) => setDraft((d) => ({ ...d, og_image: e.target.value }))}
                placeholder={OG_IMAGES.blog}
                className="admin-input"
              />
            </Field>
          </div>

          <div className="mt-5 flex items-center gap-2">
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet px-3.5 py-2 text-xs font-semibold text-white shadow-[0_10px_30px_-10px_oklch(0.52_0.24_293/0.6)] disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              Save overrides
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={busy || !override}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/70 hover:text-white disabled:opacity-40"
            >
              Reset to defaults
            </button>
            {saved && (
              <span className="ml-1 font-mono text-[11px] text-emerald-300">{saved}</span>
            )}
          </div>
        </div>

        {/* GOOGLE PREVIEW */}
        <PreviewCard label="Google search result">
          <div className="rounded-xl bg-white p-4 text-left shadow-inner">
            <div className="flex items-center gap-2 text-xs text-[#5f6368]">
              <span className="grid size-6 place-items-center rounded-full bg-[#f1f3f4] text-[10px] font-bold text-[#5f6368]">
                E
              </span>
              <div>
                <p className="text-[13px] leading-none text-[#202124]">EmailsLy</p>
                <p className="mt-0.5 text-[12px] leading-none">
                  {(effectiveCanonical.startsWith("http")
                    ? effectiveCanonical
                    : `https://emailsly.com${effectiveCanonical}`
                  ).replace(/^https?:\/\//, "")}
                </p>
              </div>
            </div>
            <p className="mt-2 text-[18px] leading-snug text-[#1a0dab]">
              {effectiveTitle.length > 60 ? effectiveTitle.slice(0, 60) + "…" : effectiveTitle}
            </p>
            <p className="mt-1 text-[13px] leading-snug text-[#4d5156]">
              {effectiveDesc.length > 160 ? effectiveDesc.slice(0, 160) + "…" : effectiveDesc}
            </p>
          </div>
        </PreviewCard>

        {/* SOCIAL PREVIEW */}
        <PreviewCard label="Social share card (og:image)">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-[#15181c]">
            <div className="aspect-[1200/630] w-full bg-[#0b0d10]">
              {effectiveImage ? (
                <img
                  src={effectiveImage}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.opacity = "0.15";
                  }}
                />
              ) : null}
            </div>
            <div className="border-t border-white/10 p-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                {(effectiveCanonical.startsWith("http")
                  ? effectiveCanonical
                  : `emailsly.com${effectiveCanonical}`
                ).replace(/^https?:\/\//, "")}
              </p>
              <p className="mt-1 line-clamp-2 text-sm font-semibold text-white">{effectiveTitle}</p>
              <p className="mt-1 line-clamp-2 text-xs text-white/60">{effectiveDesc}</p>
            </div>
          </div>
        </PreviewCard>
      </section>

      <style>{`
        .admin-input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(255 255 255 / 0.10);
          background: rgb(255 255 255 / 0.03);
          padding: 0.5rem 0.75rem;
          font-size: 13px;
          color: white;
          outline: none;
        }
        .admin-input:focus {
          border-color: oklch(0.52 0.24 293 / 0.6);
          background: rgb(255 255 255 / 0.05);
        }
        .admin-input::placeholder { color: rgb(255 255 255 / 0.30); }
      `}</style>
    </div>
  );
}

function Field({
  label,
  hint,
  warn,
  children,
}: {
  label: string;
  hint?: string;
  warn?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-white/60">
          {label}
        </span>
        {hint && (
          <span
            className={`font-mono text-[10px] ${warn ? "text-amber-300" : "text-white/40"}`}
          >
            {hint}
          </span>
        )}
      </div>
      {children}
    </label>
  );
}

function PreviewCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-widest text-white/50">
        {label}
      </p>
      {children}
    </div>
  );
}