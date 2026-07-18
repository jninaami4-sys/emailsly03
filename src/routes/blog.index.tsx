import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ogImageMeta, OG_IMAGES, matchTheme } from "@/lib/og-images";
import { SiteShell } from "@/components/site/SiteShell";
import { BLOG_POSTS, formatPublishedAt, type BlogPost } from "@/lib/blog-posts";
import { listPublishedBlogPosts } from "@/lib/blog-cms.functions";
import { ArrowRight } from "lucide-react";
import { PremiumSparkles as Sparkles } from "@/components/site/PremiumIcons";

export const Route = createFileRoute("/blog/")({
  head: ({ matches }) => ({
    meta: [
      { title: "Blog — Outbound, data, and RevOps playbooks | EmailsLy" },
      {
        name: "description",
        content:
          "Field-tested playbooks on cold email deliverability, B2B data sources, ICP scoring, and CRM operations from the EmailsLy team.",
      },
      { property: "og:title", content: "EmailsLy Blog — Outbound & data playbooks" },
      {
        property: "og:description",
        content: "Deliverability, ICP, RevOps — practical guides from the EmailsLy team.",
      },
      ...ogImageMeta(OG_IMAGES.blog, matchTheme(matches)),

    ],
    links: [{ rel: "canonical", href: "/blog" }],
  }),
  component: BlogList,
});

function BlogList() {
  const listFn = useServerFn(listPublishedBlogPosts);
  const { data: dbPosts } = useQuery({
    queryKey: ["public-blog-posts"],
    queryFn: () => listFn(),
  });
  // Merge DB posts with static playbook posts; DB slugs win on conflict.
  const dbSlugs = new Set((dbPosts ?? []).map((p) => p.slug));
  const merged: BlogPost[] = [
    ...(dbPosts ?? []),
    ...BLOG_POSTS.filter((p) => !dbSlugs.has(p.slug)),
  ];
  const featured = merged.find((p) => p.featured) ?? merged[0];
  const rest = merged.filter((p) => p.slug !== featured.slug);

  return (
    <SiteShell>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-20 pb-16 lg:pt-24">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-[900px] -translate-x-1/2 bg-[radial-gradient(circle_at_center,var(--violet-soft),transparent_70%)] opacity-70" />
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-violet/20 bg-violet-soft px-3 py-1">
            <Sparkles className="size-3 text-violet" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
              EmailsLy Field Notes
            </span>
          </div>
          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tighter text-foreground md:text-6xl">
            Playbooks for the teams
            <br />
            <span className="text-violet">building modern pipelines.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            Deliverability, data, and RevOps — written by the operators running EmailsLy's own outbound engine.
          </p>
        </div>
      </section>

      {/* Featured post */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/blog/$slug"
            params={{ slug: featured.slug }}
            className="group grid gap-8 overflow-hidden rounded-3xl border border-border bg-card p-3 shadow-2xl transition-all hover:-translate-y-0.5 hover:border-violet/30 md:grid-cols-[1.1fr_1fr]"
          >
            <PostCover post={featured} large />
            <div className="flex flex-col justify-center p-6 md:p-8">
              <div className="flex items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
                <span>Featured</span>
                <span className="text-muted-foreground/50">·</span>
                <span className="text-muted-foreground">{featured.category}</span>
              </div>
              <h2 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">
                {featured.title}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                {featured.excerpt}
              </p>
              <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-full bg-violet font-bold text-white">
                    {featured.author.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{featured.author.name}</p>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {formatPublishedAt(featured.publishedAt)} · {featured.readingMinutes} min
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-violet transition-transform group-hover:translate-x-0.5">
                  Read <ArrowRight className="size-4" />
                </span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Grid */}
      <section className="border-t border-border bg-card px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
                All posts
              </span>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
                Latest from the team
              </h2>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((p) => (
              <Link
                key={p.slug}
                to="/blog/$slug"
                params={{ slug: p.slug }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-background transition-all hover:-translate-y-0.5 hover:border-violet/30"
              >
                <PostCover post={p} />
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
                    <span>{p.category}</span>
                    <span className="text-muted-foreground/50">·</span>
                    <span className="text-muted-foreground">{p.readingMinutes} min</span>
                  </div>
                  <h3 className="mt-3 font-display text-xl font-bold leading-snug tracking-tight transition-colors group-hover:text-violet">
                    {p.title}
                  </h3>
                  <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {p.excerpt}
                  </p>
                  <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                    <div className="flex items-center gap-2">
                      <div className="grid size-7 place-items-center rounded-full bg-violet-soft text-[11px] font-bold text-violet">
                        {p.author.initials}
                      </div>
                      <span className="text-xs font-semibold text-foreground">{p.author.name}</span>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {formatPublishedAt(p.publishedAt)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[3rem] bg-violet p-12 text-center md:p-24">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-white">
            <Sparkles className="size-3" />
            Put the playbook to work
          </div>
          <h2 className="font-display text-4xl font-bold tracking-tight text-white md:text-6xl">
            Stop cleaning lists.
            <br />
            Start closing.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-white/80">
            Verified B2B leads in your CRM within 24 hours — priced by the lead, not the seat.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              to="/store"
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-violet shadow-xl transition-transform hover:-translate-y-0.5"
            >
              Browse the store <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-transparent px-8 py-4 text-base font-bold text-white transition-colors hover:bg-white/10"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function PostCover({
  post,
  large = false,
}: {
  post: (typeof BLOG_POSTS)[number];
  large?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-ink ${
        large ? "min-h-[320px] md:min-h-full" : "aspect-[16/9]"
      }`}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-violet/40 blur-[80px]" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 size-72 rounded-full bg-coral/20 blur-[100px]" />
      <div className="relative flex h-full flex-col justify-between p-6 md:p-8">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-white">
          {post.cover.eyebrow}
        </span>
        <p
          className={`font-display font-bold leading-tight tracking-tight text-white ${
            large ? "text-2xl md:text-3xl" : "text-lg"
          }`}
        >
          {post.cover.kicker}
        </p>
      </div>
    </div>
  );
}
