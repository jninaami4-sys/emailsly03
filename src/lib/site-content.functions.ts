import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type SiteContentMap = Record<string, Record<string, unknown>>;

export const listSiteContent = createServerFn({ method: "GET" }).handler(async () => {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const supabase = createClient<Database>(process.env.SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const { data, error } = await supabase.from("site_content").select("section, data");
  if (error) throw new Error(error.message);
  const map: SiteContentMap = {};
  for (const row of data ?? []) map[row.section] = (row.data ?? {}) as Record<string, unknown>;
  return map;
});

export const upsertSiteContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { section: string; data: Record<string, unknown> }) => {
    if (!d.section || typeof d.section !== "string") throw new Error("Section required");
    if (!d.data || typeof d.data !== "object") throw new Error("Data required");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { error } = await context.supabase
      .from("site_content")
      .upsert({ section: data.section, data: data.data as never, updated_by: context.userId }, { onConflict: "section" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
