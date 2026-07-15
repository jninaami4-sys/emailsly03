import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type PricingSetting = {
  service_id: string;
  name: string;
  rate: number;
  unit: string;
  min_qty: number;
  min_order: number;
  fixed: boolean;
  helper: string | null;
  sort_order: number;
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
  if (!email || email.trim().toLowerCase() !== admin && email.trim().toLowerCase() !== "demo@emailsly.app") {
    throw new Error("Forbidden: admin only");
  }
}

function normalize(row: Record<string, unknown>): PricingSetting {
  return {
    service_id: String(row.service_id),
    name: String(row.name),
    rate: Number(row.rate),
    unit: String(row.unit),
    min_qty: Number(row.min_qty),
    min_order: Number(row.min_order),
    fixed: Boolean(row.fixed),
    helper: (row.helper as string | null) ?? null,
    sort_order: Number(row.sort_order ?? 0),
    updated_at: String(row.updated_at ?? ""),
  };
}

export const getPricingSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<PricingSetting[]> => {
    const supabase = serverAnonClient();
    const { data, error } = await supabase
      .from("pricing_settings")
      .select("service_id, name, rate, unit, min_qty, min_order, fixed, helper, sort_order, updated_at")
      .order("sort_order", { ascending: true });
    if (error) {
      console.error("getPricingSettings", error);
      return [];
    }
    return (data ?? []).map((r) => normalize(r as Record<string, unknown>));
  },
);

type UpdateInput = {
  service_id: string;
  rate: number;
  min_qty: number;
  min_order: number;
  helper?: string | null;
};

export const updatePricingSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: UpdateInput) => data)
  .handler(async ({ data, context }): Promise<PricingSetting> => {
    assertAdmin((context.claims as { email?: string }).email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      rate: Math.max(0, Number(data.rate) || 0),
      min_qty: Math.max(1, Math.floor(Number(data.min_qty) || 1)),
      min_order: Math.max(0, Number(data.min_order) || 0),
      helper: data.helper?.toString().slice(0, 200) ?? null,
    };
    const { data: row, error } = await supabaseAdmin
      .from("pricing_settings")
      .update(payload)
      .eq("service_id", data.service_id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return normalize(row as Record<string, unknown>);
  });
