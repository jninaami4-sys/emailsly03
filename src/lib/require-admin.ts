// Shared admin gate for server functions. Verifies the caller has the
// 'admin' role via the has_role() security-definer function, using their
// own RLS-scoped Supabase client. Never trusts email or env vars.
export async function requireAdmin(context: {
  // Accept any typed Supabase client; the generated Database type varies
  // per file, so we take the loosest structural shape here.
  supabase: { rpc: (fn: string, args: Record<string, unknown>) => unknown };
  userId: string;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rpc = (context.supabase as any).rpc.bind(context.supabase);
  const { data, error } = await rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}
