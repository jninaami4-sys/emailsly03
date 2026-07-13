import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type ProductDetails = {
  id: string;
  slug: string;
  enabled: boolean;
  long_description: string;
  extra_info: string;
  cta_label: string;
  cta_url: string;
  image_url: string;
  created_at: string;
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

function assertAdmin(email: string | undefined | null) {
  const admin = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (!admin) throw new Error("ADMIN_EMAIL is not configured");
  if (!email || email.trim().toLowerCase() !== admin) {
    throw new Error("Forbidden: admin only");
  }
}

/** Public: get details for a single slug (only if enabled). */
export const getProductDetails = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }): Promise<ProductDetails | null> => {
    const supabase = serverAnonClient();
    const { data: row, error } = await supabase
      .from("product_details")
      .select("*")
      .eq("slug", data.slug)
      .eq("enabled", true)
      .maybeSingle();
    if (error) {
      console.error("getProductDetails", error);
      return null;
    }
    return (row as ProductDetails) ?? null;
  });

/** Admin: list all product details entries. */
export const listProductDetails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProductDetails[]> => {
    assertAdmin((context.claims as { email?: string }).email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("product_details")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as ProductDetails[];
  });

type UpsertInput = {
  slug: string;
  enabled: boolean;
  long_description: string;
  extra_info: string;
  cta_label: string;
  cta_url: string;
  image_url: string;
};

export const upsertProductDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: UpsertInput) => data)
  .handler(async ({ data, context }): Promise<ProductDetails> => {
    assertAdmin((context.claims as { email?: string }).email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      slug: String(data.slug || "").slice(0, 200),
      enabled: !!data.enabled,
      long_description: String(data.long_description || "").slice(0, 8000),
      extra_info: String(data.extra_info || "").slice(0, 8000),
      cta_label: String(data.cta_label || "").slice(0, 80),
      cta_url: String(data.cta_url || "").slice(0, 500),
      image_url: String(data.image_url || "").slice(0, 500),
    };
    const { data: row, error } = await supabaseAdmin
      .from("product_details")
      .upsert(payload, { onConflict: "slug" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as ProductDetails;
  });

export const deleteProductDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data, context }) => {
    assertAdmin((context.claims as { email?: string }).email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("product_details")
      .delete()
      .eq("slug", data.slug);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
