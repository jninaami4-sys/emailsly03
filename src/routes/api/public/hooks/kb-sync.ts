// Public cron endpoint for automated KB sync.
// Called by pg_cron on a schedule. Verifies the Supabase anon key in the
// `apikey` header before running the sync, so external callers cannot invoke it.

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/kb-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const provided = request.headers.get("apikey") ?? "";
        const expected =
          process.env.SUPABASE_ANON_KEY ??
          process.env.SUPABASE_PUBLISHABLE_KEY ??
          "";
        if (!expected || provided !== expected) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const { runKbSync } = await import("@/lib/chatbot-sync");
          const result = await runKbSync();
          return new Response(JSON.stringify(result), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error("kb-sync failed:", message);
          return new Response(JSON.stringify({ ok: false, error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
