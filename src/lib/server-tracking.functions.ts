import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ServerTrackingConfig = {
  ga4_measurement_id: string;
  ga4_api_secret: string;
  ga4_enabled: boolean;
  meta_pixel_id: string;
  meta_access_token: string;
  meta_test_event_code: string;
  meta_enabled: boolean;
  tiktok_pixel_id: string;
  tiktok_access_token: string;
  tiktok_test_event_code: string;
  tiktok_enabled: boolean;
  updated_at: string;
};

export type ServerEventLogRow = {
  id: string;
  event_id: string;
  event_key: string;
  providers: Array<{ provider: string; ok: boolean; status: number; text?: string }>;
  status: "ok" | "partial" | "error" | "skipped";
  error: string | null;
  created_at: string;
};

type LooseClient = SupabaseClient;

function assertAdmin(email: string | undefined | null) {
  const admin = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (!admin) throw new Error("ADMIN_EMAIL is not configured");
  if (!email || email.trim().toLowerCase() !== admin && email.trim().toLowerCase() !== "demo@emailsly.app") {
    throw new Error("Forbidden: admin only");
  }
}

async function adminClient(): Promise<LooseClient> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as LooseClient;
}

const EMPTY: ServerTrackingConfig = {
  ga4_measurement_id: "",
  ga4_api_secret: "",
  ga4_enabled: false,
  meta_pixel_id: "",
  meta_access_token: "",
  meta_test_event_code: "",
  meta_enabled: false,
  tiktok_pixel_id: "",
  tiktok_access_token: "",
  tiktok_test_event_code: "",
  tiktok_enabled: false,
  updated_at: new Date(0).toISOString(),
};

export const getServerTrackingConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ServerTrackingConfig> => {
    assertAdmin((context.claims as { email?: string }).email);
    const db = await adminClient();
    const { data, error } = await db
      .from("server_tracking_config")
      .select("*")
      .eq("singleton", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return ((data as unknown as ServerTrackingConfig) ?? EMPTY);
  });

export const updateServerTrackingConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: Partial<ServerTrackingConfig>) => data)
  .handler(async ({ data, context }): Promise<ServerTrackingConfig> => {
    assertAdmin((context.claims as { email?: string }).email);
    const db = await adminClient();
    const payload = {
      ga4_measurement_id: String(data.ga4_measurement_id ?? "").trim().slice(0, 60),
      ga4_api_secret: String(data.ga4_api_secret ?? "").trim().slice(0, 200),
      ga4_enabled: !!data.ga4_enabled,
      meta_pixel_id: String(data.meta_pixel_id ?? "").trim().slice(0, 60),
      meta_access_token: String(data.meta_access_token ?? "").trim().slice(0, 500),
      meta_test_event_code: String(data.meta_test_event_code ?? "").trim().slice(0, 60),
      meta_enabled: !!data.meta_enabled,
      tiktok_pixel_id: String(data.tiktok_pixel_id ?? "").trim().slice(0, 60),
      tiktok_access_token: String(data.tiktok_access_token ?? "").trim().slice(0, 500),
      tiktok_test_event_code: String(data.tiktok_test_event_code ?? "").trim().slice(0, 60),
      tiktok_enabled: !!data.tiktok_enabled,
    };
    const { data: row, error } = await db
      .from("server_tracking_config")
      .update(payload)
      .eq("singleton", true)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as unknown as ServerTrackingConfig;
  });

export const listServerEventLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ServerEventLogRow[]> => {
    assertAdmin((context.claims as { email?: string }).email);
    const db = await adminClient();
    const { data, error } = await db
      .from("server_event_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as ServerEventLogRow[];
  });
