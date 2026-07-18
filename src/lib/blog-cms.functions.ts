// PHP-backed proxies. Same export names as before; now plain async functions.
import { blogApi, adminBlogApi } from "@/lib/api-client";
import type { BlogPost, PostBlock } from "./blog-posts";

export type DbBlogPost = BlogPost & {
  id: string;
  published: boolean;
  contentMd: string;
  coverImage?: string | null;
  updatedAt: string;
};

type Row = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  reading_minutes: number | string;
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
    readingMinutes: Number(r.reading_minutes) || 5,
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

export async function listPublishedBlogPosts(): Promise<DbBlogPost[]> {
  try {
    const { posts } = await blogApi.list({ status: "published" });
    return (posts ?? []).map((r) => rowToPost(r as Row));
  } catch {
    return [];
  }
}

export async function getPublishedBlogPost(input: { slug: string }): Promise<DbBlogPost | null> {
  try {
    const { post } = await blogApi.get(input.slug);
    return post ? rowToPost(post as Row) : null;
  } catch {
    return null;
  }
}

export async function adminListBlogPosts(): Promise<DbBlogPost[]> {
  const { posts } = await adminBlogApi.list();
  return (posts ?? []).map((r) => rowToPost(r as Row));
}

export type BlogUpsertInput = {
  id?: string | null;
  slug: string;
  title: string;
  excerpt?: string;
  category?: string;
  reading_minutes?: number;
  published_at: string;
  author_name: string;
  author_role: string;
  author_initials: string;
  cover_eyebrow?: string;
  cover_kicker?: string;
  cover_image?: string | null;
  featured?: boolean;
  published?: boolean;
  content_md?: string;
  content_blocks?: PostBlock[];
};

export async function adminUpsertBlogPost(input: BlogUpsertInput): Promise<{ ok: true; id: string }> {
  const payload = { ...input, author_initials: (input.author_initials || "").toUpperCase() };
  if (input.id) {
    await adminBlogApi.update(input.id, payload);
    return { ok: true, id: input.id };
  }
  const { id } = await adminBlogApi.create(payload);
  return { ok: true, id };
}

export async function adminDeleteBlogPost(input: { id: string }): Promise<{ ok: true }> {
  await adminBlogApi.destroy(input.id);
  return { ok: true };
}
