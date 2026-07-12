import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { SiteShell } from "./SiteShell";
import { ArrowRight, FileText, Mail, Sparkles } from "lucide-react";

type LegalLink = { to: string; label: string };

const RELATED: LegalLink[] = [
  { to: "/privacy-policy", label: "Privacy Policy" },
  { to: "/terms", label: "Terms of Service" },
  { to: "/refund-policy", label: "Refund Policy" },
];

export function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro?: string;
  children: ReactNode;
}) {
  const [sections, setSections] = useState<{ id: string; text: string }[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Collect h2 sections from the rendered article and observe them for TOC highlighting.
  useEffect(() => {
    const article = document.getElementById("legal-article");
    if (!article) return;
    const nodes = Array.from(article.querySelectorAll<HTMLHeadingElement>("h2"));
    const collected = nodes.map((n) => {
      if (!n.id) n.id = slugify(n.textContent ?? "");
      return { id: n.id, text: n.textContent ?? "" };
    });
    setSections(collected);
    if (collected[0]) setActiveId(collected[0].id);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-96px 0px -60% 0px", threshold: 0.01 },
    );
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [children]);

  const proseClasses = useMemo(
    () =>
      [
        "space-y-6 text-[16px] leading-[1.75] text-foreground/80",
        "[&_p]:text-foreground/80",
        "[&_h2]:scroll-mt-28 [&_h2]:mt-14 [&_h2]:mb-4 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-foreground",
        "[&_h3]:scroll-mt-28 [&_h3]:mt-10 [&_h3]:mb-3 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-foreground",
        "[&_ul]:my-4 [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul>li]:list-disc [&_ul>li]:marker:text-violet",
        "[&_ol]:my-4 [&_ol]:space-y-2 [&_ol]:pl-5 [&_ol>li]:list-decimal [&_ol>li]:marker:text-violet",
        "[&_a]:font-semibold [&_a]:text-violet [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-violet/80",
        "[&_strong]:font-semibold [&_strong]:text-foreground",
        "[&_code]:rounded-md [&_code]:bg-secondary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px] [&_code]:text-foreground",
      ].join(" "),
    [],
  );

  return (
    <SiteShell>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border px-6 pt-20 pb-16">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[420px] w-[900px] -translate-x-1/2 bg-[radial-gradient(circle_at_center,var(--violet-soft),transparent_70%)] opacity-60" />
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex flex-wrap items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest">
            <Link
              to="/"
              className="text-muted-foreground transition-colors hover:text-violet"
            >
              Home
            </Link>
            <span className="text-muted-foreground/50">/</span>
            <span className="rounded-full bg-violet-soft px-3 py-1 text-violet">Legal</span>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tighter text-foreground md:text-6xl">
                {title}
              </h1>
              {intro && (
                <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                  {intro}
                </p>
              )}
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <FileText className="size-3.5 text-violet" />
              Updated {updated}
            </div>
          </div>

          {/* Related legal chips */}
          <div className="mt-8 flex flex-wrap gap-2">
            {RELATED.map((r) => (
              <Link
                key={r.to}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                to={r.to as any}
                className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:border-violet/30 hover:text-violet"
              >
                {r.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[220px_1fr]">
          {/* TOC */}
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              On this page
            </p>
            {sections.length > 0 ? (
              <nav className="flex flex-col gap-1.5 border-l border-border">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className={`-ml-px border-l-2 pl-4 py-1.5 text-sm transition-colors ${
                      activeId === s.id
                        ? "border-violet font-semibold text-violet"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s.text}
                  </a>
                ))}
              </nav>
            ) : (
              <p className="text-xs text-muted-foreground/70">Loading…</p>
            )}

            <div className="mt-8 rounded-2xl border border-border bg-card p-5">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-violet-soft px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
                <Mail className="size-3" />
                Questions?
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Reach the LyraData team for anything policy-related.
              </p>
              <Link
                to="/contact"
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-violet hover:underline"
              >
                Contact us <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </aside>

          {/* Prose */}
          <article
            id="legal-article"
            className={`min-w-0 rounded-3xl border border-border bg-card p-8 md:p-12 ${proseClasses}`}
          >
            {children}
          </article>
        </div>
      </section>

      {/* CTA — matches homepage */}
      <section className="px-6 pb-24">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[3rem] bg-violet p-12 text-center md:p-20">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-white">
            <Sparkles className="size-3" />
            Ready when you are
          </div>
          <h2 className="font-display text-4xl font-bold tracking-tight text-white md:text-5xl">
            Get back to building pipeline.
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/store"
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-violet shadow-xl transition-transform hover:-translate-y-0.5"
            >
              Browse the store <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-transparent px-8 py-4 text-base font-bold text-white transition-colors hover:bg-white/10"
            >
              Talk to sales
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
