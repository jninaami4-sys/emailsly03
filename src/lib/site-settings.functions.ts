import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/lib/require-admin";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type TawkPosition = "br" | "bl" | "tr" | "tl";

export type SiteSettings = {
  gtm_id: string;
  ga4_id: string;
  fb_pixel_id: string;
  tiktok_pixel_id: string;
  custom_head_html: string;
  tawk_enabled: boolean;
  tawk_position: TawkPosition;
  support_show_category: boolean;
  updated_at: string;
};

const EMPTY: SiteSettings = {
  gtm_id: "",
  ga4_id: "",
  fb_pixel_id: "",
  tiktok_pixel_id: "",
  custom_head_html: "",
  tawk_enabled: true,
  tawk_position: "br",
  support_show_category: false,
  updated_at: "",
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


export const getSiteSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<SiteSettings> => {
    const supabase = serverAnonClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select(
        "gtm_id, ga4_id, fb_pixel_id, tiktok_pixel_id, custom_head_html, tawk_enabled, tawk_position, support_show_category, updated_at",
      )
      .eq("id", true)
      .maybeSingle();
    if (error) {
      console.error("getSiteSettings", error);
      return EMPTY;
    }
    return (data as SiteSettings) ?? EMPTY;
  },
);

type UpdateInput = {
  gtm_id: string;
  ga4_id: string;
  fb_pixel_id: string;
  tiktok_pixel_id: string;
  custom_head_html: string;
  tawk_enabled: boolean;
  tawk_position: TawkPosition;
  support_show_category?: boolean;
};

export const updateSiteSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: UpdateInput) => data)
  .handler(async ({ data, context }): Promise<SiteSettings> => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const allowedPositions: TawkPosition[] = ["br", "bl", "tr", "tl"];
    const position: TawkPosition = allowedPositions.includes(data.tawk_position)
      ? data.tawk_position
      : "br";
    const payload = {
      gtm_id: String(data.gtm_id || "").trim().slice(0, 40),
      ga4_id: String(data.ga4_id || "").trim().slice(0, 40),
      fb_pixel_id: String(data.fb_pixel_id || "").trim().slice(0, 40),
      tiktok_pixel_id: String(data.tiktok_pixel_id || "").trim().slice(0, 60),
      custom_head_html: String(data.custom_head_html || "").slice(0, 8000),
      tawk_enabled: Boolean(data.tawk_enabled),
      tawk_position: position,
      support_show_category: Boolean(data.support_show_category),
    };
    const { data: row, error } = await supabaseAdmin
      .from("site_settings")
      .update(payload)
      .eq("id", true)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as SiteSettings;
  });

