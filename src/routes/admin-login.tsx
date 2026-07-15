import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_EMAIL, DEMO_PASSWORD, ensureDemoAccount } from "@/lib/demo-account.functions";

export const Route = createFileRoute("/admin-login")({
  head: () => ({
    meta: [
      { title: "Admin auto-login (demo)" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminAutoLogin,
});

function AdminAutoLogin() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Preparing demo account…");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setStatus("Ensuring demo account…");
        await ensureDemoAccount();

        setStatus("Signing in as demo…");
        const { data: sess } = await supabase.auth.getSession();
        if (sess.session?.user?.email?.toLowerCase() !== DEMO_EMAIL.toLowerCase()) {
          await supabase.auth.signOut();
          const { error } = await supabase.auth.signInWithPassword({
            email: DEMO_EMAIL,
            password: DEMO_PASSWORD,
          });
          if (error) throw error;
        }

        if (cancelled) return;
        setStatus("Opening admin panel…");
        navigate({ to: "/admin", replace: true });
      } catch (e) {
        setStatus(`Failed: ${(e as Error).message}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-violet border-t-transparent" />
        <p className="text-sm text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}
