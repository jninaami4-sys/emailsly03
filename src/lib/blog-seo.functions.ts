import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";

export type BlogSeoOverride = {
  slug: string;
  meta_description: string | null;
  canonical_url: string | null;
  og_image: string | null;
  social_title: string | null;
  updated_at: string;
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

async function assertAdmin(supabase: ReturnType<typeof serverAnonClient>, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

export const getBlogSeoOverride = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ slug: z.string().min(1).max(200) }).parse(data))
  .handler(async ({ data }): Promise<BlogSeoOverride | null> => {
    const supa = serverAnonClient();
    const { data: row, error } = await supa
      .from("blog_seo_overrides")
      .select("slug, meta_description, canonical_url, og_image, social_title, updated_at")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) {
      console.error("getBlogSeoOverride", error);
      return null;
    }
    return (row ?? null) as BlogSeoOverride | null;
  });

export const adminListBlogSeoOverrides = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BlogSeoOverride[]> => {
    await assertAdmin(context.supabase as unknown as ReturnType<typeof serverAnonClient>, context.userId);
    const { data, error } = await context.supabase
      .from("blog_seo_overrides")
      .select("slug, meta_description, canonical_url, og_image, social_title, updated_at");
    if (error) throw new Error(error.message);
    return (data ?? []) as BlogSeoOverride[];
  });

const upsertSchema = z.object({
  slug: z.string().trim().min(1).max(200),
  meta_description: z.string().trim().max(300).nullable().optional(),
  canonical_url: z.string().trim().max(500).nullable().optional(),
  og_image: z.string().trim().max(1000).nullable().optional(),
  social_title: z.string().trim().max(200).nullable().optional(),
});

export const adminUpsertBlogSeo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => upsertSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as unknown as ReturnType<typeof serverAnonClient>, context.userId);
    const payload = {
      slug: data.slug,
      meta_description: data.meta_description ?? null,
      canonical_url: data.canonical_url ?? null,
      og_image: data.og_image ?? null,
      social_title: data.social_title ?? null,
      updated_by: context.userId,
    };
    const { error } = await context.supabase
      .from("blog_seo_overrides")
      .upsert(payload, { onConflict: "slug" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminResetBlogSeo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ slug: z.string().min(1).max(200) }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as unknown as ReturnType<typeof serverAnonClient>, context.userId);
    const { error } = await context.supabase
      .from("blog_seo_overrides")
      .delete()
      .eq("slug", data.slug);
    if (error) throw new Error(error.message);
    return { ok: true };
  });