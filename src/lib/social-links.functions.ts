import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";

export type SocialIconKey =
  | "whatsapp"
  | "email"
  | "instagram"
  | "telegram"
  | "facebook"
  | "twitter"
  | "linkedin"
  | "youtube"
  | "tiktok"
  | "discord"
  | "github"
  | "link";

export type SocialLink = {
  id: string;
  platform: string;
  label: string;
  href: string;
  color: string;
  icon: SocialIconKey;
  enabled: boolean;
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

export const listPublicSocialLinks = createServerFn({ method: "GET" }).handler(
  async (): Promise<SocialLink[]> => {
    const supa = serverAnonClient();
    const { data, error } = await supa
      .from("social_links")
      .select("id, platform, label, href, color, icon, enabled, sort_order, updated_at")
      .eq("enabled", true)
      .order("sort_order", { ascending: true });
    if (error) {
      console.error("listPublicSocialLinks", error);
      return [];
    }
    return (data ?? []) as SocialLink[];
  },
);

async function assertAdmin(supabase: ReturnType<typeof serverAnonClient>, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

export const adminListSocialLinks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SocialLink[]> => {
    await assertAdmin(context.supabase as unknown as ReturnType<typeof serverAnonClient>, context.userId);
    const { data, error } = await context.supabase
      .from("social_links")
      .select("id, platform, label, href, color, icon, enabled, sort_order, updated_at")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as SocialLink[];
  });

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  platform: z.string().trim().min(1).max(40),
  label: z.string().trim().min(1).max(80),
  href: z.string().trim().min(1).max(500),
  color: z.string().trim().min(1).max(20),
  icon: z.string().trim().min(1).max(40),
  enabled: z.boolean(),
  sort_order: z.number().int().min(0).max(9999),
});

export const adminUpsertSocialLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => upsertSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as unknown as ReturnType<typeof serverAnonClient>, context.userId);
    if (data.id) {
      const { error } = await context.supabase
        .from("social_links")
        .update({
          platform: data.platform,
          label: data.label,
          href: data.href,
          color: data.color,
          icon: data.icon,
          enabled: data.enabled,
          sort_order: data.sort_order,
        })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("social_links").insert({
        platform: data.platform,
        label: data.label,
        href: data.href,
        color: data.color,
        icon: data.icon,
        enabled: data.enabled,
        sort_order: data.sort_order,
      });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminToggleSocialLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), enabled: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as unknown as ReturnType<typeof serverAnonClient>, context.userId);
    const { error } = await context.supabase
      .from("social_links")
      .update({ enabled: data.enabled })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteSocialLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as unknown as ReturnType<typeof serverAnonClient>, context.userId);
    const { error } = await context.supabase.from("social_links").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
