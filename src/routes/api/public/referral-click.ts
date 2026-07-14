import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const bodySchema = z.object({
  code: z.string().min(4).max(24),
  visitor_hash: z.string().min(8).max(128),
  ua_hash: z.string().max(128).optional(),
  landing_url: z.string().max(2048).optional(),
  referer: z.string().max(2048).optional(),
});

function getIp(request: Request): string | null {
  const h = request.headers;
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return h.get("x-real-ip") || h.get("cf-connecting-ip") || null;
}

export const Route = createFileRoute("/api/public/referral-click")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        }),
      POST: async ({ request }) => {
        const cors = {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        } as const;
        try {
          const raw = await request.json();
          const parsed = bodySchema.safeParse(raw);
          if (!parsed.success) {
            return new Response(JSON.stringify({ ok: false }), { status: 400, headers: cors });
          }
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const sb = supabaseAdmin as any;
          // Dedup unique(code, visitor_hash, click_day) — swallow the 23505 conflict.
          const { error } = await sb.from("referral_clicks").insert({
            code: parsed.data.code.toUpperCase(),
            visitor_hash: parsed.data.visitor_hash,
            ua_hash: parsed.data.ua_hash ?? null,
            landing_url: parsed.data.landing_url ?? null,
            referer: parsed.data.referer ?? null,
            ip: getIp(request),
          });
          if (error && (error as any).code !== "23505") {
            return new Response(JSON.stringify({ ok: false }), { status: 200, headers: cors });
          }
          return new Response(JSON.stringify({ ok: true }), { status: 200, headers: cors });
        } catch {
          return new Response(JSON.stringify({ ok: false }), { status: 200, headers: cors });
        }
      },
    },
  },
});
