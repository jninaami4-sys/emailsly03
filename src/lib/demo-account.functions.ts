import { createServerFn } from "@tanstack/react-start";

export const DEMO_EMAIL = "demo@lyradata.app";
export const DEMO_PASSWORD = "DemoLyra!2026";

export const ensureDemoAccount = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Idempotent: try to create; if it already exists that's fine.
  const { error } = await supabaseAdmin.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { demo: true, display_name: "Demo User" },
  });

  if (error) {
    const msg = error.message || "";
    const alreadyExists =
      /already\s*registered|already\s*exists|duplicate|User already/i.test(msg);
    if (!alreadyExists) {
      throw new Error(msg || "Failed to prepare demo account");
    }
  }

  return { email: DEMO_EMAIL, password: DEMO_PASSWORD };
});
