import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authApi } from "@/lib/api-client";

const DEMO_EMAIL = "demo@emailsly.com";
const DEMO_PASSWORD = "Demo!2024Pass";

export const Route = createFileRoute("/admin-login")({
  head: () => ({
    meta: [
      { title: "Admin auto-login (demo)" },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "/admin-login" }],
  }),
  component: AdminAutoLogin,
});

function AdminAutoLogin() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Signing in as demo…");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await authApi.login({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
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
