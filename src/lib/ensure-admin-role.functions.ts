import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Ensures the signed-in user has an appropriate row in public.user_roles.
 * If their email matches ADMIN_EMAIL, grants the 'admin' role; otherwise
 * grants 'user'. Idempotent — safe to call on every sign-in.
 */
export const ensureUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const claims = context.claims as { email?: string };
    const email = (claims.email ?? "").trim().toLowerCase();
    const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const isAdmin = !!adminEmail && email === adminEmail;
    const role: "admin" | "user" = isAdmin ? "admin" : "user";

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert(
        { user_id: context.userId, role },
        { onConflict: "user_id,role", ignoreDuplicates: true },
      );
    if (error) throw new Error(error.message);

    return { role, isAdmin };
  });
