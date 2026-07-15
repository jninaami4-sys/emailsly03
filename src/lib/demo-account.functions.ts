import { createServerFn } from "@tanstack/react-start";

export const DEMO_EMAIL = "demo@emailsly.app";
export const DEMO_PASSWORD = "DemoLyra!2026";

export const ensureDemoAccount = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Try to create the demo user. Idempotent — if it already exists we reset
  // it to the current known password so sign-in always succeeds.
  const { error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { demo: true, display_name: "Demo User" },
  });

  if (createError) {
    const msg = createError.message || "";
    const alreadyExists =
      (createError as { code?: string }).code === "email_exists" ||
      (createError as { status?: number }).status === 422 ||
      /already.*(registered|exists)|duplicate|email_exists/i.test(msg);


    if (!alreadyExists) {
      throw new Error(msg || "Failed to prepare demo account");
    }

    // Account already exists — look it up and force-reset password + confirm email
    // so the credentials we return here always work, even if the password
    // was changed previously or the email wasn't confirmed.
    const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (listError) throw new Error(listError.message || "Failed to load demo account");

    const existing = list.users.find(
      (u) => u.email?.toLowerCase() === DEMO_EMAIL.toLowerCase(),
    );
    if (!existing) {
      throw new Error("Demo account exists but could not be located");
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { ...(existing.user_metadata ?? {}), demo: true, display_name: "Demo User" },
    });
    if (updateError) throw new Error(updateError.message || "Failed to refresh demo account");
  }

  return { email: DEMO_EMAIL, password: DEMO_PASSWORD };
});
