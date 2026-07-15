import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";

export type LeadStatus = "new" | "contacted" | "qualified" | "archived";

export type ContactLead = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  message: string;
  source: string;
  status: LeadStatus;
  notes: string | null;
  page_url: string | null;
  user_agent: string | null;
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

const submitSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  company: z.string().trim().max(160).optional().nullable(),
  message: z.string().trim().min(1).max(4000),
  source: z.string().trim().max(60).optional(),
  page_url: z.string().trim().max(500).optional().nullable(),
});

export const submitContactLead = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => submitSchema.parse(data))
  .handler(async ({ data }) => {
    const supa = serverAnonClient();
    const { error } = await supa.from("contact_leads").insert({
      name: data.name,
      email: data.email,
      company: data.company ?? null,
      message: data.message,
      source: data.source ?? "contact_form",
      page_url: data.page_url ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

async function assertAdmin(supabase: ReturnType<typeof serverAnonClient>, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

export const adminListContactLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase as unknown as ReturnType<typeof serverAnonClient>, context.userId);
    const { data, error } = await context.supabase
      .from("contact_leads")
      .select(
        "id, name, email, company, message, source, status, notes, page_url, user_agent, created_at, updated_at",
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []) as ContactLead[];
  });

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "contacted", "qualified", "archived"]).optional(),
  notes: z.string().max(4000).optional().nullable(),
});

export const adminUpdateContactLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => updateSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as unknown as ReturnType<typeof serverAnonClient>, context.userId);
    const patch: { status?: LeadStatus; notes?: string | null } = {};
    if (data.status !== undefined) patch.status = data.status;
    if (data.notes !== undefined) patch.notes = data.notes;
    const { error } = await context.supabase.from("contact_leads").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteContactLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as unknown as ReturnType<typeof serverAnonClient>, context.userId);
    const { error } = await context.supabase.from("contact_leads").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
