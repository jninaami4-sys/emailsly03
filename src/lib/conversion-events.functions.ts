import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type ParamMap = Record<string, string | number | boolean | null>;

export type ConversionEvent = {
  id: string;
  event_key: string;
  name: string;
  description: string;
  enabled: boolean;
  ga4_event_name: string;
  ga4_params: ParamMap;
  meta_event_name: string;
  meta_params: ParamMap;
  tiktok_event_name: string;
  tiktok_params: ParamMap;
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

/** Public: enabled events, for the tracking client. */
export const getConversionEvents = createServerFn({ method: "GET" }).handler(
  async (): Promise<ConversionEvent[]> => {
    const supabase = serverAnonClient();
    const { data, error } = await supabase
      .from("conversion_events" as never) as any
      .select("*")
      .eq("enabled", true)
      .order("event_key", { ascending: true });
    if (error) {
      console.error("getConversionEvents", error);
      return [];
    }
    return (data as unknown as ConversionEvent[]) ?? [];
  },
);

/** Admin: all events. */
export const listConversionEventsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ConversionEvent[]> => {
    assertAdmin((context.claims as { email?: string }).email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("conversion_events" as never) as any
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data as unknown as ConversionEvent[]) ?? [];
  });

type UpsertInput = {
  id?: string;
  event_key: string;
  name: string;
  description: string;
  enabled: boolean;
  ga4_event_name: string;
  ga4_params: ParamMap;
  meta_event_name: string;
  meta_params: ParamMap;
  tiktok_event_name: string;
  tiktok_params: ParamMap;
};

function clean(input: UpsertInput) {
  const key = String(input.event_key || "").trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_").slice(0, 60);
  if (!key) throw new Error("event_key is required");
  return {
    event_key: key,
    name: String(input.name || "").slice(0, 120),
    description: String(input.description || "").slice(0, 500),
    enabled: !!input.enabled,
    ga4_event_name: String(input.ga4_event_name || "").trim().slice(0, 60),
    ga4_params: input.ga4_params ?? {},
    meta_event_name: String(input.meta_event_name || "").trim().slice(0, 60),
    meta_params: input.meta_params ?? {},
    tiktok_event_name: String(input.tiktok_event_name || "").trim().slice(0, 60),
    tiktok_params: input.tiktok_params ?? {},
  };
}

export const upsertConversionEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: UpsertInput) => data)
  .handler(async ({ data, context }): Promise<ConversionEvent> => {
    assertAdmin((context.claims as { email?: string }).email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = clean(data);
    if (data.id) {
      const { data: row, error } = await supabaseAdmin
        .from("conversion_events" as never) as any
        .update(payload)
        .eq("id", data.id)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return row as unknown as ConversionEvent;
    }
    const { data: row, error } = await supabaseAdmin
      .from("conversion_events" as never) as any
      .insert(payload)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as unknown as ConversionEvent;
  });

export const deleteConversionEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    assertAdmin((context.claims as { email?: string }).email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("conversion_events" as never) as any
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
