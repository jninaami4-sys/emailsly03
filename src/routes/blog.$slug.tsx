import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { BLOG_POSTS, formatPublishedAt, getPostBySlug, type PostBlock, type BlogPost } from "@/lib/blog-posts";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PremiumSparkles as Sparkles } from "@/components/site/PremiumIcons";
import { ogImageMeta, OG_IMAGES, matchTheme } from "@/lib/og-images";
import { getBlogSeoOverride } from "@/lib/blog-seo.functions";
import { getPublishedBlogPost } from "@/lib/blog-cms.functions";
import { extractFaqPairs } from "@/lib/blog-markdown";
import { BlogAnalyticsTracker } from "@/components/site/BlogAnalyticsTracker";
import { ClientOnly } from "@tanstack/react-router";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    // Prefer DB-managed post; fall back to static playbook posts.
    let post: BlogPost | null | undefined = null;
    try {
      post = await getPublishedBlogPost({ slug: params.slug });
    } catch {
      post = null;
    }
    if (!post) post = getPostBySlug(params.slug) ?? null;
    if (!post) throw notFound();
    let seo = null as Awaited<ReturnType<typeof getBlogSeoOverride>>;
    try {
      seo = await getBlogSeoOverride({ slug: params.slug });
    } catch {
      seo = null;
    }
    return { post, seo };
  },
  head: ({ loaderData, matches }) => {
    const post = loaderData?.post;
    if (!post) {
      return { meta: [{ title: "Post not found | EmailsLy Blog" }] };
    }
    const seo = loaderData?.seo;
    const image =
      seo?.og_image ||
      (post as { coverImage?: string }).coverImage ||
      OG_IMAGES.blog;
    const socialTitle = seo?.social_title || post.title;
    const description = seo?.meta_description || post.excerpt;
    const canonical = seo?.canonical_url || `/blog/${post.slug}`;
    // Build JSON-LD: Article + BreadcrumbList + optional FAQPage.
    const wordCount = (post.content as PostBlock[])
      .map((b) => {
        if ("text" in b && b.text) return b.text;
        if ("items" in b && Array.isArray(b.items)) return b.items.join(" ");
        return "";
      })
      .join(" ")
      .trim()
      .split(/\s+/).length;
    const scripts: Array<{ type: string; children: string }> = [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description,
          datePublished: post.publishedAt,
          dateModified: (post as { updatedAt?: string }).updatedAt || post.publishedAt,
          author: { "@type": "Person", name: post.author.name, jobTitle: post.author.role },
          publisher: {
            "@type": "Organization",
            name: "EmailsLy",
            logo: { "@type": "ImageObject", url: "https://emailsly.com/emailsly-logo.png" },
          },
          image,
          mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
          articleSection: post.category,
          wordCount,
          inLanguage: "en",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "/" },
            { "@type": "ListItem", position: 2, name: "Blog", item: "/blog" },
            { "@type": "ListItem", position: 3, name: post.title, item: canonical },
          ],
        }),
      },
    ];
    const faqs = extractFaqPairs(post.content);
    if (faqs.length > 0) {
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      });
    }
    return {
      meta: [
        { title: `${post.title} | EmailsLy Blog` },
        { name: "description", content: description },
        { name: "twitter:title", content: socialTitle },
        { name: "twitter:description", content: description },
        { property: "og:title", content: socialTitle },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: canonical },
        { property: "article:published_time", content: post.publishedAt },
        { property: "article:section", content: post.category },
        { property: "article:author", content: post.author.name },
        ...ogImageMeta(image, matchTheme(matches)),
      ],
      links: [{ rel: "canonical", href: canonical }],
      scripts,
    };
  },
  notFoundComponent: () => (
    <SiteShell>
      <section className="px-6 py-32 text-center">
        <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-violet">404</p>
        <h1 className="mt-3 font-display text-4xl font-bold">Post not found</h1>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          The article you're looking for has moved or never existed.
        </p>
        <Link
          to="/blog"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-violet px-6 py-3 font-semibold text-white shadow-lg shadow-violet/25"
        >
          <ArrowLeft className="size-4" /> Back to blog
        </Link>
      </section>
    </SiteShell>
  ),
  errorComponent: ({ reset }) => {
    return (
      <SiteShell>
        <section className="px-6 py-32 text-center">
          <h1 className="font-display text-3xl font-bold">Something went wrong</h1>
          <button
            onClick={reset}
            className="mt-6 rounded-full bg-violet px-6 py-3 font-semibold text-white"
          >
            Retry
          </button>
        </section>
      </SiteShell>
    );
  },
  component: BlogPost,
});

function BlogPost() {
  const { post } = Route.useLoaderData();
  const related = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);
  const headingSlug = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60);
  const toc = (post.content as PostBlock[])
    .filter(
      (b: PostBlock): b is Extract<PostBlock, { type: "h2" }> => b.type === "h2",
    )
    .map((b: Extract<PostBlock, { type: "h2" }>) => ({
      text: b.text,
      id: headingSlug(b.text),
    }));

  return (
    <SiteShell>
      <ClientOnly fallback={null}>
        <BlogAnalyticsTracker slug={post.slug} />
      </ClientOnly>
      {/* Header */}
      <section className="relative overflow-hidden border-b border-border px-6 pt-16 pb-16 lg:pt-20">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-[900px] -translate-x-1/2 bg-[radial-gradient(circle_at_center,var(--violet-soft),transparent_70%)] opacity-60" />
        <div className="mx-auto max-w-3xl">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-violet"
          >
            <ArrowLeft className="size-3.5" /> Back to blog
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-widest">
            <span className="rounded-full bg-violet-soft px-3 py-1 text-violet">{post.category}</span>
            <span className="text-muted-foreground">
              {formatPublishedAt(post.publishedAt)} · {post.readingMinutes} min read
            </span>
          </div>
          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.1] tracking-tighter text-foreground md:text-5xl">
            {post.title}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground md:text-xl">{post.excerpt}</p>
          <div className="mt-8 flex items-center gap-3 border-t border-border pt-6">
            <div className="grid size-11 place-items-center rounded-full bg-violet font-bold text-white">
              {post.author.initials}
            </div>
            <div>
              <p className="text-sm font-semibold">{post.author.name}</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {post.author.role}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cover */}
      <section className="px-6 pt-12">
        <div className="mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl bg-ink p-10 md:p-16">
            <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-violet/30 blur-[100px]" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 size-96 rounded-full bg-coral/15 blur-[100px]" />
            <div className="relative flex flex-col gap-6">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-white">
                {post.cover.eyebrow}
              </span>
              <p className="font-display text-3xl font-bold leading-tight tracking-tight text-white md:text-5xl">
                {post.cover.kicker}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="px-6 py-16">
        {toc.length > 1 && (
          <nav
            aria-label="Table of contents"
            className="mx-auto mb-10 max-w-3xl rounded-2xl border border-border bg-card p-5"
          >
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
              On this page
            </p>
            <ol className="mt-3 space-y-1.5 text-sm">
              {toc.map((t: { text: string; id: string }, i: number) => (
                <li key={t.id}>
                  <a
                    href={`#${t.id}`}
                    className="font-semibold text-foreground/85 transition-colors hover:text-violet"
                  >
                    <span className="mr-2 font-mono text-[10px] text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {t.text}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}
        <article className="prose-blog mx-auto max-w-3xl">
          {post.content.map((block: PostBlock, i: number) => (
            <Block key={i} block={block} slugify={headingSlug} />
          ))}
        </article>

        {/* Author card */}
        <div className="mx-auto mt-16 max-w-3xl rounded-3xl border border-border bg-card p-8">
          <div className="flex items-center gap-4">
            <div className="grid size-14 place-items-center rounded-full bg-violet font-bold text-white">
              {post.author.initials}
            </div>
            <div>
              <p className="font-display text-lg font-bold">{post.author.name}</p>
              <p className="text-sm text-muted-foreground">{post.author.role}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Writing from the EmailsLy outbound desk — where the plays in this post are tested against
            real quotas every single week.
          </p>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="border-t border-border bg-card px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
                  Keep reading
                </span>
                <h2 className="mt-2 font-display text-2xl font-bold tracking-tight md:text-3xl">
                  More from the playbook
                </h2>
              </div>
              <Link
                to="/blog"
                className="inline-flex items-center gap-1 font-semibold text-violet hover:underline"
              >
                All posts <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  to="/blog/$slug"
                  params={{ slug: p.slug }}
                  className="group flex flex-col rounded-2xl border border-border bg-background p-6 transition-all hover:-translate-y-0.5 hover:border-violet/30"
                >
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
                    {p.category}
                  </span>
                  <h3 className="mt-3 font-display text-lg font-bold leading-snug tracking-tight transition-colors group-hover:text-violet">
                    {p.title}
                  </h3>
                  <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {p.excerpt}
                  </p>
                  <span className="mt-6 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {formatPublishedAt(p.publishedAt)} · {p.readingMinutes} min
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="px-6 py-24">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[3rem] bg-violet p-12 text-center md:p-24">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-white">
            <Sparkles className="size-3" />
            Ship the play
          </div>
          <h2 className="font-display text-4xl font-bold tracking-tight text-white md:text-6xl">
            Turn reading into pipeline.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-white/80">
            Get verified B2B leads in your CRM within 24 hours — pay per lead, cancel anytime.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              to="/store"
              data-blog-cta="cta_footer_store"
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-violet shadow-xl transition-transform hover:-translate-y-0.5"
            >
              Browse the store <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/contact"
              data-blog-cta="cta_footer_contact"
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

function Block({
  block,
  slugify,
}: {
  block: PostBlock;
  slugify: (t: string) => string;
}) {
  switch (block.type) {
    case "p":
      return (
        <p className="my-6 text-lg leading-[1.75] text-foreground/85 first:mt-0">{block.text}</p>
      );
    case "h2":
      return (
        <h2
          id={slugify(block.text)}
          className="mt-14 mb-4 scroll-mt-24 font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl"
        >
          {block.text}
        </h2>
      );
    case "h3":
      return (
        <h3
          id={slugify(block.text)}
          className="mt-10 mb-3 scroll-mt-24 font-display text-xl font-bold tracking-tight text-foreground"
        >
          {block.text}
        </h3>
      );
    case "ul":
      return (
        <ul className="my-6 space-y-2.5">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-lg leading-[1.7] text-foreground/85">
              <span className="mt-3 size-1.5 shrink-0 rounded-full bg-violet" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="my-6 space-y-3 counter-reset">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-4 text-lg leading-[1.7] text-foreground/85">
              <span className="mt-1 grid size-6 shrink-0 place-items-center rounded-full bg-violet-soft font-mono text-[11px] font-bold text-violet">
                {i + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      );
    case "quote":
      return (
        <blockquote className="my-10 border-l-2 border-violet pl-6">
          <p className="font-display text-xl leading-snug text-foreground md:text-2xl">
            &ldquo;{block.text}&rdquo;
          </p>
          {block.cite && (
            <cite className="mt-3 block font-mono text-[10px] uppercase not-italic tracking-widest text-muted-foreground">
              — {block.cite}
            </cite>
          )}
        </blockquote>
      );
    case "callout":
      return (
        <aside className="my-10 rounded-2xl border border-violet/25 bg-violet-soft/60 p-6">
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
            {block.title}
          </p>
          <p className="mt-2 text-base leading-relaxed text-foreground">{block.text}</p>
        </aside>
      );
  }
}
