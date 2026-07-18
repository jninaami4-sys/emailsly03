import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";
import type { Product } from "./products";

export type DbProduct = Product & {
  published: boolean;
  sortOrder: number;
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
  category: string;
  category_color: string;
  records: number;
  price: number | string;
  compare_at_price: number | string | null;
  file_format: string;
  geography: string;
  description: string;
  fields: string[] | null;
  sample_note: string | null;
  featured: boolean;
  cover_image: string | null;
  published: boolean;
  sort_order: number;
  updated_at: string;
};

function rowToProduct(r: Row): DbProduct {
  const catColor = (r.category_color === "coral" || r.category_color === "emerald" || r.category_color === "violet")
    ? r.category_color
    : "violet";
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    category: r.category,
    categoryColor: catColor as "violet" | "coral" | "emerald",
    records: Number(r.records) || 0,
    price: Number(r.price) || 0,
    compareAtPrice: r.compare_at_price == null ? undefined : Number(r.compare_at_price),
    fileFormat: r.file_format,
    geography: r.geography,
    description: r.description,
    fields: r.fields ?? [],
    sampleNote: r.sample_note ?? undefined,
    featured: r.featured,
    coverImage: r.cover_image ?? undefined,
    published: r.published,
    sortOrder: r.sort_order,
    updatedAt: r.updated_at,
  };
}

export const listPublicProducts = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverAnonClient();
  const { data, error } = await sb
    .from("custom_products")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data as unknown as Row[]).map(rowToProduct);
});

export const adminListProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("custom_products" as never)
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data as unknown as Row[]).map(rowToProduct);
  });

const ProductInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(200),
  title: z.string().min(1),
  category: z.string().min(1),
  category_color: z.enum(["violet", "coral", "emerald"]),
  records: z.number().int().nonnegative(),
  price: z.number().nonnegative(),
  compare_at_price: z.number().nonnegative().nullable().optional(),
  file_format: z.string().default("CSV"),
  geography: z.string().default("Global"),
  description: z.string().default(""),
  fields: z.array(z.string()).default([]),
  sample_note: z.string().nullable().optional(),
  featured: z.boolean().default(false),
  cover_image: z.string().nullable().optional(),
  published: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

export const adminUpsertProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ProductInput.parse(input))
  .handler(async ({ data, context }) => {
    const payload: Record<string, unknown> = { ...data };
    if (!payload.id) delete payload.id;
    if (payload.compare_at_price === undefined) payload.compare_at_price = null;
    if (payload.sample_note === undefined) payload.sample_note = null;
    if (payload.cover_image === undefined) payload.cover_image = null;

    const { data: row, error } = await context.supabase
      .from("custom_products" as never)
      .upsert(payload as never, { onConflict: "id" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return rowToProduct(row as unknown as Row);
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("custom_products" as never)
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
