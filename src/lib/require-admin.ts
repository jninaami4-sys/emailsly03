// Shared admin gate for server functions. Verifies the caller has the
// 'admin' role via the has_role() security-definer function, using their
// own RLS-scoped Supabase client. Never trusts email or env vars.
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function requireAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}
