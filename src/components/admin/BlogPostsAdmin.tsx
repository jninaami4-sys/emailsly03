import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  adminListBlogPosts,
  adminUpsertBlogPost,
  adminDeleteBlogPost,
  type DbBlogPost,
} from "@/lib/blog-cms.functions";
import {
  parseBlogMarkdown,
  estimateReadingMinutes,
} from "@/lib/blog-markdown";
import type { PostBlock } from "@/lib/blog-posts";

type FormState = {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  reading_minutes: number;
  published_at: string;
  author_name: string;
  author_role: string;
  author_initials: string;
  cover_eyebrow: string;
  cover_kicker: string;
  cover_image: string;
  featured: boolean;
  published: boolean;
  content_md: string;
};

const EMPTY: FormState = {
  slug: "",
  title: "",
  excerpt: "",
  category: "Playbook",
  reading_minutes: 5,
  published_at: new Date().toISOString().slice(0, 10),
  author_name: "EmailsLy Team",
  author_role: "Editorial",
  author_initials: "EM",
  cover_eyebrow: "Playbook",
  cover_kicker: "",
  cover_image: "",
  featured: false,
  published: true,
  content_md:
    "## Section heading\n\nWrite the first paragraph here.\n\n### Is this a question?\n\nWhen an h3 ends with a question mark, it becomes an FAQ entry for search engines.\n\n- Bullet one\n- Bullet two\n\n> A memorable quote — Source name\n\n!!! Rule of thumb | Short callout body goes after the pipe.",
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);
}

export function BlogPostsAdmin() {
  const qc = useQueryClient();
  const list = adminListBlogPosts;
  const upsert = adminUpsertBlogPost;
  const del = adminDeleteBlogPost;

  const { data: posts, isLoading, error } = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: () => list(),
  });

  const [form, setForm] = useState<FormState | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const parsedBlocks: PostBlock[] = useMemo(
    () => (form ? parseBlogMarkdown(form.content_md) : []),
    [form],
  );

  const startNew = () => {
    setForm({ ...EMPTY, published_at: new Date().toISOString().slice(0, 10) });
    setShowPreview(false);
  };
  const startEdit = (p: DbBlogPost) => {
    setForm({
      id: p.id,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      category: p.category,
      reading_minutes: p.readingMinutes,
      published_at: p.publishedAt.slice(0, 10),
      author_name: p.author.name,
      author_role: p.author.role,
      author_initials: p.author.initials,
      cover_eyebrow: p.cover.eyebrow,
      cover_kicker: p.cover.kicker,
      cover_image: p.coverImage ?? "",
      featured: !!p.featured,
      published: p.published,
      content_md: p.contentMd || blocksToMarkdown(p.content),
    });
    setShowPreview(false);
  };

  const saveMut = useMutation({
    mutationFn: async (f: FormState) => {
      const blocks = parseBlogMarkdown(f.content_md);
      return upsert({
        data: {
          id: f.id ?? null,
          slug: f.slug,
          title: f.title,
          excerpt: f.excerpt,
          category: f.category,
          reading_minutes: f.reading_minutes,
          published_at: new Date(f.published_at).toISOString(),
          author_name: f.author_name,
          author_role: f.author_role,
          author_initials: f.author_initials,
          cover_eyebrow: f.cover_eyebrow,
          cover_kicker: f.cover_kicker,
          cover_image: f.cover_image || null,
          featured: f.featured,
          published: f.published,
          content_md: f.content_md,
          content_blocks: blocks,
        },
      });
    },
    onSuccess: () => {
      toast.success("Blog post saved");
      qc.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      qc.invalidateQueries({ queryKey: ["public-blog-posts"] });
      setForm(null);
    },
    onError: (e: Error) => toast.error(e.message || "Save failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Post deleted");
      qc.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      qc.invalidateQueries({ queryKey: ["public-blog-posts"] });
    },
    onError: (e: Error) => toast.error(e.message || "Delete failed"),
  });

  if (form) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-bold">
            {form.id ? "Edit post" : "New blog post"}
          </h1>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setForm(null)}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setShowPreview((s) => !s)}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-secondary"
            >
              {showPreview ? "Hide preview" : "Show preview"}
            </button>
            <button
              type="button"
              disabled={saveMut.isPending}
              onClick={() => saveMut.mutate(form)}
              className="rounded-lg bg-violet px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-50"
            >
              {saveMut.isPending ? "Saving…" : "Save post"}
            </button>
          </div>
        </div>

        <div className={showPreview ? "grid gap-6 lg:grid-cols-2" : ""}>
          <div className="space-y-4">
            <Field label="Title">
              <input
                value={form.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setForm((f) =>
                    f
                      ? {
                          ...f,
                          title,
                          slug: f.id ? f.slug : slugify(title),
                        }
                      : f,
                  );
                }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-base font-semibold"
                maxLength={200}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Slug (URL)">
                <input
                  value={form.slug}
                  onChange={(e) =>
                    setForm((f) => (f ? { ...f, slug: slugify(e.target.value) } : f))
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
                  maxLength={200}
                />
              </Field>
              <Field label="Category">
                <input
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => (f ? { ...f, category: e.target.value } : f))
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  maxLength={60}
                />
              </Field>
            </div>
            <Field label="Excerpt (used for SEO description and previews)">
              <textarea
                value={form.excerpt}
                onChange={(e) =>
                  setForm((f) => (f ? { ...f, excerpt: e.target.value } : f))
                }
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                maxLength={500}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                {form.excerpt.length}/500 characters. Aim for 140–170 for search snippets.
              </p>
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Published date">
                <input
                  type="date"
                  value={form.published_at}
                  onChange={(e) =>
                    setForm((f) =>
                      f ? { ...f, published_at: e.target.value } : f,
                    )
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Reading minutes">
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={form.reading_minutes}
                  onChange={(e) =>
                    setForm((f) =>
                      f
                        ? { ...f, reading_minutes: Number(e.target.value) || 1 }
                        : f,
                    )
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </Field>
              <div className="flex items-end gap-4 pb-1">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(e) =>
                      setForm((f) => (f ? { ...f, published: e.target.checked } : f))
                    }
                    className="size-4"
                  />
                  Published
                </label>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) =>
                      setForm((f) => (f ? { ...f, featured: e.target.checked } : f))
                    }
                    className="size-4"
                  />
                  Featured
                </label>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Author name">
                <input
                  value={form.author_name}
                  onChange={(e) =>
                    setForm((f) => (f ? { ...f, author_name: e.target.value } : f))
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Author role">
                <input
                  value={form.author_role}
                  onChange={(e) =>
                    setForm((f) => (f ? { ...f, author_role: e.target.value } : f))
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Initials">
                <input
                  value={form.author_initials}
                  onChange={(e) =>
                    setForm((f) =>
                      f
                        ? {
                            ...f,
                            author_initials: e.target.value.slice(0, 4).toUpperCase(),
                          }
                        : f,
                    )
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm uppercase"
                  maxLength={4}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Cover eyebrow">
                <input
                  value={form.cover_eyebrow}
                  onChange={(e) =>
                    setForm((f) => (f ? { ...f, cover_eyebrow: e.target.value } : f))
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Cover kicker (large tagline)">
                <input
                  value={form.cover_kicker}
                  onChange={(e) =>
                    setForm((f) => (f ? { ...f, cover_kicker: e.target.value } : f))
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </Field>
            </div>
            <Field label="Cover image URL (optional, used as OG image)">
              <input
                value={form.cover_image}
                onChange={(e) =>
                  setForm((f) => (f ? { ...f, cover_image: e.target.value } : f))
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs"
                placeholder="https://…"
              />
            </Field>

            <Field label="Content (markdown-lite)">
              <textarea
                value={form.content_md}
                onChange={(e) => {
                  const md = e.target.value;
                  setForm((f) =>
                    f
                      ? {
                          ...f,
                          content_md: md,
                          reading_minutes: estimateReadingMinutes(md),
                        }
                      : f,
                  );
                }}
                rows={20}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm leading-relaxed"
              />
              <div className="mt-2 rounded-lg border border-border bg-secondary/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
                <p className="mb-1 font-mono font-bold text-foreground">Cheat sheet</p>
                <code>## Heading</code> · <code>### Sub-heading (end with ? for FAQ)</code> ·{" "}
                <code>- bullet</code> · <code>1. numbered</code> ·{" "}
                <code>&gt; quote — Author</code> ·{" "}
                <code>!!! Title | callout body</code>
                <br />
                Detected {parsedBlocks.length} blocks · ~{form.reading_minutes} min read
              </div>
            </Field>
          </div>

          {showPreview && (
            <div className="prose-blog rounded-xl border border-border bg-background p-6">
              <h1 className="font-display text-2xl font-bold leading-tight">
                {form.title || "Untitled post"}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">{form.excerpt}</p>
              <div className="mt-6 space-y-4 text-sm leading-relaxed">
                {parsedBlocks.map((b, i) => (
                  <BlockPreview key={i} block={b} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Blog posts</h1>
          <p className="text-sm text-muted-foreground">
            Create, edit, and publish articles. Draft posts stay hidden from the public
            blog until you toggle Published.
          </p>
        </div>
        <button
          onClick={startNew}
          className="rounded-lg bg-violet px-4 py-2 text-sm font-semibold text-white shadow"
        >
          + New post
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : error ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-500">
          {(error as Error).message}
        </div>
      ) : !posts || posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No posts yet. Click <span className="font-semibold">New post</span> to publish your first article.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {posts.map((p) => (
                <tr key={p.id} className="hover:bg-secondary/40">
                  <td className="px-4 py-3 font-semibold">{p.title}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {p.slug}
                  </td>
                  <td className="px-4 py-3 text-xs">{p.category}</td>
                  <td className="px-4 py-3">
                    {p.published ? (
                      <span className="rounded-full bg-emerald/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald">
                        Published
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-500">
                        Draft
                      </span>
                    )}
                    {p.featured && (
                      <span className="ml-2 rounded-full bg-violet/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-violet">
                        Featured
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(p.updatedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => startEdit(p)}
                      className="mr-2 rounded-md border border-border px-3 py-1 text-xs font-semibold hover:bg-secondary"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${p.title}"? This cannot be undone.`)) {
                          deleteMut.mutate(p.id);
                        }
                      }}
                      className="rounded-md border border-rose-500/40 px-3 py-1 text-xs font-semibold text-rose-500 hover:bg-rose-500/10"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function BlockPreview({ block }: { block: PostBlock }) {
  switch (block.type) {
    case "h2":
      return <h2 className="mt-6 font-display text-xl font-bold">{block.text}</h2>;
    case "h3":
      return <h3 className="mt-4 font-display text-lg font-bold">{block.text}</h3>;
    case "p":
      return <p className="leading-relaxed text-foreground/85">{block.text}</p>;
    case "ul":
      return (
        <ul className="list-disc space-y-1 pl-5">
          {block.items.map((i, k) => (
            <li key={k}>{i}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="list-decimal space-y-1 pl-5">
          {block.items.map((i, k) => (
            <li key={k}>{i}</li>
          ))}
        </ol>
      );
    case "quote":
      return (
        <blockquote className="border-l-2 border-violet pl-4 italic text-foreground/80">
          {block.text}
          {block.cite && <span className="mt-1 block text-xs text-muted-foreground">— {block.cite}</span>}
        </blockquote>
      );
    case "callout":
      return (
        <aside className="rounded-lg border border-violet/25 bg-violet-soft/60 p-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-violet">
            {block.title}
          </p>
          <p className="mt-1 text-sm">{block.text}</p>
        </aside>
      );
  }
}

function blocksToMarkdown(blocks: PostBlock[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case "h2":
          return `## ${b.text}`;
        case "h3":
          return `### ${b.text}`;
        case "p":
          return b.text;
        case "ul":
          return b.items.map((i) => `- ${i}`).join("\n");
        case "ol":
          return b.items.map((i, k) => `${k + 1}. ${i}`).join("\n");
        case "quote":
          return `> ${b.text}${b.cite ? ` — ${b.cite}` : ""}`;
        case "callout":
          return `!!! ${b.title} | ${b.text}`;
      }
    })
    .join("\n\n");
}