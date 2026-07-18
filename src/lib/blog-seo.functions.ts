// PHP-backed proxies. Same export names as before; now plain async functions.
import { blogSeoApi, adminBlogSeoApi } from "@/lib/api-client";

export type BlogSeoOverride = {
  slug: string;
  meta_description: string | null;
  canonical_url: string | null;
  og_image: string | null;
  social_title: string | null;
  updated_at: string;
};

export async function getBlogSeoOverride(input: { slug: string }): Promise<BlogSeoOverride | null> {
  try {
    const { override } = await blogSeoApi.get(input.slug);
    return (override as BlogSeoOverride) ?? null;
  } catch {
    return null;
  }
}

export async function adminListBlogSeoOverrides(): Promise<BlogSeoOverride[]> {
  const { overrides } = await adminBlogSeoApi.list();
  return (overrides ?? []) as BlogSeoOverride[];
}

export type BlogSeoUpsertInput = {
  slug: string;
  meta_description?: string | null;
  canonical_url?: string | null;
  og_image?: string | null;
  social_title?: string | null;
};

export async function adminUpsertBlogSeo(input: BlogSeoUpsertInput): Promise<{ ok: true }> {
  await adminBlogSeoApi.upsert({
    slug: input.slug,
    meta_description: input.meta_description ?? null,
    canonical_url: input.canonical_url ?? null,
    og_image: input.og_image ?? null,
    social_title: input.social_title ?? null,
  });
  return { ok: true };
}

export async function adminResetBlogSeo(input: { slug: string }): Promise<{ ok: true }> {
  await adminBlogSeoApi.destroy(input.slug);
  return { ok: true };
}
