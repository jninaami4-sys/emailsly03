import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type AnnouncementImageStyle = "cover" | "thumbnail" | "none";
export type AnnouncementAudience = "all" | "guests" | "authenticated" | "admins";

export type Announcement = {
  id: string;
  enabled: boolean;
  title: string;
  body: string;
  cta_label: string;
  cta_url: string;
  image_url: string;
  image_style: AnnouncementImageStyle;
  badge: string;
  accent: string;
  path_patterns: string[];
  audience: AnnouncementAudience;
  start_at: string | null;
  end_at: string | null;
  priority: number;
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

/** Public: all currently enabled announcements (targeting applied client-side). */
export const listActiveAnnouncements = createServerFn({ method: "GET" }).handler(
  async (): Promise<Announcement[]> => {
    const supabase = serverAnonClient();
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .eq("enabled", true)
      .order("priority", { ascending: false }).order("updated_at", { ascending: false })
      .limit(20);
    if (error) {
      console.error("listActiveAnnouncements", error);
      return [];
    }
    return (data ?? []) as Announcement[];
  },
);

/** @deprecated kept for compat — returns the newest enabled announcement without targeting. */
export const getActiveAnnouncement = createServerFn({ method: "GET" }).handler(
  async (): Promise<Announcement | null> => {
    const supabase = serverAnonClient();
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .eq("enabled", true)
      .order("priority", { ascending: false }).order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("getActiveAnnouncement", error);
      return null;
    }
    return (data as Announcement) ?? null;
  },
);

/** Admin: list all announcements. */
export const listAnnouncements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Announcement[]> => {
    assertAdmin((context.claims as { email?: string }).email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("announcements")
      .select("*")
      .order("priority", { ascending: false }).order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Announcement[];
  });

type UpsertInput = {
  id?: string | null;
  enabled: boolean;
  title: string;
  body: string;
  cta_label: string;
  cta_url: string;
  image_url: string;
  image_style: AnnouncementImageStyle;
  badge: string;
  accent: string;
  path_patterns: string[];
  audience: AnnouncementAudience;
  start_at: string | null;
  end_at: string | null;
  priority: number;
};

export const upsertAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: UpsertInput) => data)
  .handler(async ({ data, context }): Promise<Announcement> => {
    assertAdmin((context.claims as { email?: string }).email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const allowedStyles: AnnouncementImageStyle[] = ["cover", "thumbnail", "none"];
    const image_style: AnnouncementImageStyle = allowedStyles.includes(data.image_style)
      ? data.image_style
      : "cover";
    const allowedAudiences: AnnouncementAudience[] = ["all", "guests", "authenticated", "admins"];
    const audience: AnnouncementAudience = allowedAudiences.includes(data.audience)
      ? data.audience
      : "all";
    const cleanedPatterns = Array.from(
      new Set(
        (Array.isArray(data.path_patterns) ? data.path_patterns : [])
          .map((p) => String(p || "").trim())
          .filter(Boolean)
          .slice(0, 30)
          .map((p) => p.slice(0, 200)),
      ),
    );
    const path_patterns = cleanedPatterns.length ? cleanedPatterns : ["*"];
    const payload = {
      enabled: !!data.enabled,
      title: String(data.title || "").slice(0, 200),
      body: String(data.body || "").slice(0, 2000),
      cta_label: String(data.cta_label || "").slice(0, 80),
      cta_url: String(data.cta_url || "").slice(0, 500),
      image_url: image_style === "none" ? "" : String(data.image_url || "").slice(0, 500),
      image_style,
      badge: String(data.badge || "").slice(0, 40),
      accent: String(data.accent || "violet").slice(0, 40),
      path_patterns,
      audience,
      start_at: data.start_at && data.start_at.trim() ? new Date(data.start_at).toISOString() : null,
      end_at: data.end_at && data.end_at.trim() ? new Date(data.end_at).toISOString() : null,
      priority: Number.isFinite(data.priority) ? Math.max(-1000, Math.min(1000, Math.trunc(data.priority))) : 0,
    };
    if (data.id) {
      const { data: row, error } = await supabaseAdmin
        .from("announcements")
        .update(payload)
        .eq("id", data.id)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return row as Announcement;
    }
    const { data: row, error } = await supabaseAdmin
      .from("announcements")
      .insert(payload)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as Announcement;
  });

export const deleteAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    assertAdmin((context.claims as { email?: string }).email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("announcements").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/** Server fn used by admin UI to know if signed-in user is the admin. */
export const whoAmIAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = (context.claims as { email?: string }).email ?? null;
    const admin = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const normalized = email?.trim().toLowerCase() ?? "";
    // Preview-only: allow demo account to view (read-only) the admin UI.
    const PREVIEW_ALLOWLIST = new Set(["demo@emailsly.app"]);
    return {
      email,
      isAdmin: !!normalized && (normalized === admin || PREVIEW_ALLOWLIST.has(normalized)),
    };
  });
