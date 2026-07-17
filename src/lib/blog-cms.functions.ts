import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";
import type { BlogPost, PostBlock } from "./blog-posts";

export type DbBlogPost = BlogPost & {
  id: string;
  published: boolean;
  contentMd: string;
  coverImage?: string | null;
  updatedAt: string;
};

function serverAnonClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

type Row = {
  id: string;
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
  cover_image: string | null;
  featured: boolean;
  published: boolean;
  content_md: string;
  content_blocks: unknown;
  updated_at: string;
};

function rowToPost(r: Row): DbBlogPost {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    category: r.category,
    readingMinutes: r.reading_minutes,
    publishedAt: r.published_at,
    author: {
      name: r.author_name,
      role: r.author_role,
      initials: r.author_initials,
    },
    cover: { eyebrow: r.cover_eyebrow, kicker: r.cover_kicker },
    featured: r.featured,
    published: r.published,
    contentMd: r.content_md,
    coverImage: r.cover_image,
    content: Array.isArray(r.content_blocks) ? (r.content_blocks as PostBlock[]) : [],
    updatedAt: r.updated_at,
  };
}

const SELECT_COLS =
  "id, slug, title, excerpt, category, reading_minutes, published_at, author_name, author_role, author_initials, cover_eyebrow, cover_kicker, cover_image, featured, published, content_md, content_blocks, updated_at";

/** Public: only published posts. */
export const listPublishedBlogPosts = createServerFn({ method: "GET" }).handler(
  async (): Promise<DbBlogPost[]> => {
    const supa = serverAnonClient();
    const { data, error } = await supa
      .from("blog_posts")
      .select(SELECT_COLS)
      .eq("published", true)
      .order("published_at", { ascending: false });
    if (error) {
      console.error("listPublishedBlogPosts", error);
      return [];
    }
    return (data ?? []).map((r) => rowToPost(r as unknown as Row));
  },
);

export const getPublishedBlogPost = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ slug: z.string().min(1).max(200) }).parse(data),
  )
  .handler(async ({ data }): Promise<DbBlogPost | null> => {
    const supa = serverAnonClient();
    const { data: row, error } = await supa
      .from("blog_posts")
      .select(SELECT_COLS)
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    if (error || !row) return null;
    return rowToPost(row as unknown as Row);
  });

async function assertAdmin(
  supabase: ReturnType<typeof serverAnonClient>,
  userId: string,
) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

export const adminListBlogPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DbBlogPost[]> => {
    await assertAdmin(
      context.supabase as unknown as ReturnType<typeof serverAnonClient>,
      context.userId,
    );
    const { data, error } = await context.supabase
      .from("blog_posts")
      .select(SELECT_COLS)
      .order("published_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => rowToPost(r as unknown as Row));
  });

const blockSchema: z.ZodType<PostBlock> = z.union([
  z.object({ type: z.literal("p"), text: z.string() }),
  z.object({ type: z.literal("h2"), text: z.string() }),
  z.object({ type: z.literal("h3"), text: z.string() }),
  z.object({ type: z.literal("ul"), items: z.array(z.string()) }),
  z.object({ type: z.literal("ol"), items: z.array(z.string()) }),
  z.object({ type: z.literal("quote"), text: z.string(), cite: z.string().optional() }),
  z.object({ type: z.literal("callout"), title: z.string(), text: z.string() }),
]);

const upsertSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers and hyphens"),
  title: z.string().trim().min(1).max(200),
  excerpt: z.string().trim().max(500).default(""),
  category: z.string().trim().min(1).max(60).default("General"),
  reading_minutes: z.number().int().min(1).max(120).default(5),
  published_at: z.string().min(1),
  author_name: z.string().trim().min(1).max(120),
  author_role: z.string().trim().min(1).max(120),
  author_initials: z.string().trim().min(1).max(4),
  cover_eyebrow: z.string().trim().max(60).default("Playbook"),
  cover_kicker: z.string().trim().max(200).default(""),
  cover_image: z.string().trim().max(1000).nullable().optional(),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  content_md: z.string().max(60000).default(""),
  content_blocks: z.array(blockSchema).default([]),
});

export const adminUpsertBlogPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => upsertSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(
      context.supabase as unknown as ReturnType<typeof serverAnonClient>,
      context.userId,
    );
    const payload = {
      slug: data.slug,
      title: data.title,
      excerpt: data.excerpt,
      category: data.category,
      reading_minutes: data.reading_minutes,
      published_at: data.published_at,
      author_name: data.author_name,
      author_role: data.author_role,
      author_initials: data.author_initials.toUpperCase(),
      cover_eyebrow: data.cover_eyebrow,
      cover_kicker: data.cover_kicker,
      cover_image: data.cover_image ?? null,
      featured: data.featured,
      published: data.published,
      content_md: data.content_md,
      content_blocks: data.content_blocks,
      updated_by: context.userId,
    };
    if (data.id) {
      const { error } = await context.supabase
        .from("blog_posts")
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }
    const { data: inserted, error } = await context.supabase
      .from("blog_posts")
      .insert({ ...payload, created_by: context.userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: inserted.id as string };
  });

export const adminDeleteBlogPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(
      context.supabase as unknown as ReturnType<typeof serverAnonClient>,
      context.userId,
    );
    const { error } = await context.supabase
      .from("blog_posts")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });