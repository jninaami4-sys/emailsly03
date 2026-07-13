// Server-side event dispatcher.
// Receives conversion events from the browser and forwards them to GA4
// Measurement Protocol, Meta Conversions API, and TikTok Events API.
// Deduplicates against the client fire using a stable `event_id`.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ParamMap = Record<string, string | number | boolean | null>;
type ConversionEvent = {
  event_key: string;
  enabled: boolean;
  ga4_event_name: string;
  ga4_params: ParamMap;
  meta_event_name: string;
  meta_params: ParamMap;
  tiktok_event_name: string;
  tiktok_params: ParamMap;
};
type UserData = {
  email?: string;
  phone?: string;
  external_id?: string;
  client_id?: string;      // GA4 client_id (from _ga cookie ideally)
  fbp?: string;             // _fbp cookie
  fbc?: string;             // _fbc cookie
  ttclid?: string;
};
type Payload = {
  event_key: string;
  event_id: string;
  event_source_url?: string;
  user_data?: UserData;
  custom_data?: ParamMap;
};

async function sha256(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hashUser(u: UserData | undefined) {
  const out: Record<string, string> = {};
  if (!u) return out;
  if (u.email) out.em = await sha256(u.email);
  if (u.phone) out.ph = await sha256(u.phone.replace(/\D/g, ""));
  if (u.external_id) out.external_id = await sha256(u.external_id);
  return out;
}

function merge(a: ParamMap | undefined, b: ParamMap | undefined) {
  return { ...(a || {}), ...(b || {}) } as Record<string, unknown>;
}

async function sendGA4(
  cfg: {
    measurement_id: string;
    api_secret: string;
  },
  evt: ConversionEvent,
  payload: Payload,
) {
  const client_id =
    payload.user_data?.client_id ||
    crypto.randomUUID().replace(/-/g, "");
  const body = {
    client_id,
    events: [
      {
        name: evt.ga4_event_name,
        params: {
          ...merge(evt.ga4_params, payload.custom_data),
          event_id: payload.event_id,
        },
      },
    ],
  };
  const url =
    `https://www.google-analytics.com/mp/collect` +
    `?measurement_id=${encodeURIComponent(cfg.measurement_id)}` +
    `&api_secret=${encodeURIComponent(cfg.api_secret)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return { ok: res.ok, status: res.status, text: res.ok ? "" : await res.text() };
}

async function sendMeta(
  cfg: {
    pixel_id: string;
    access_token: string;
    test_event_code?: string;
  },
  evt: ConversionEvent,
  payload: Payload,
  ip: string | null,
  ua: string | null,
) {
  const user_data: Record<string, unknown> = await hashUser(payload.user_data);
  if (payload.user_data?.fbp) user_data.fbp = payload.user_data.fbp;
  if (payload.user_data?.fbc) user_data.fbc = payload.user_data.fbc;
  if (ip) user_data.client_ip_address = ip;
  if (ua) user_data.client_user_agent = ua;

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: evt.meta_event_name,
        event_time: Math.floor(Date.now() / 1000),
        event_id: payload.event_id,
        action_source: "website",
        event_source_url: payload.event_source_url,
        user_data,
        custom_data: merge(evt.meta_params, payload.custom_data),
      },
    ],
  };
  if (cfg.test_event_code) body.test_event_code = cfg.test_event_code;

  const url =
    `https://graph.facebook.com/v19.0/${encodeURIComponent(cfg.pixel_id)}/events` +
    `?access_token=${encodeURIComponent(cfg.access_token)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return { ok: res.ok, status: res.status, text: res.ok ? "" : await res.text() };
}

async function sendTikTok(
  cfg: {
    pixel_id: string;
    access_token: string;
    test_event_code?: string;
  },
  evt: ConversionEvent,
  payload: Payload,
  ip: string | null,
  ua: string | null,
) {
  const user: Record<string, unknown> = await hashUser(payload.user_data);
  if (payload.user_data?.ttclid) user.ttclid = payload.user_data.ttclid;
  if (ip) user.ip = ip;
  if (ua) user.user_agent = ua;

  const body: Record<string, unknown> = {
    event_source: "web",
    event_source_id: cfg.pixel_id,
    data: [
      {
        event: evt.tiktok_event_name,
        event_time: Math.floor(Date.now() / 1000),
        event_id: payload.event_id,
        user,
        properties: merge(evt.tiktok_params, payload.custom_data),
        page: payload.event_source_url ? { url: payload.event_source_url } : undefined,
      },
    ],
  };
  if (cfg.test_event_code) body.test_event_code = cfg.test_event_code;

  const res = await fetch("https://business-api.tiktok.com/open_api/v1.3/event/track/", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "Access-Token": cfg.access_token,
    },
    body: JSON.stringify(body),
  });
  return { ok: res.ok, status: res.status, text: res.ok ? "" : await res.text() };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS });
  }

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { ...CORS, "content-type": "application/json" },
    });
  }
  if (!payload?.event_key || !payload?.event_id) {
    return new Response(JSON.stringify({ error: "missing_fields" }), {
      status: 400,
      headers: { ...CORS, "content-type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Dedupe: same event_id + event_key already processed?
  const existing = await supabase
    .from("server_event_log")
    .select("id")
    .eq("event_id", payload.event_id)
    .eq("event_key", payload.event_key)
    .maybeSingle();
  if (existing.data) {
    return new Response(JSON.stringify({ ok: true, deduped: true }), {
      headers: { ...CORS, "content-type": "application/json" },
    });
  }

  const [{ data: evtRow }, { data: cfg }] = await Promise.all([
    supabase
      .from("conversion_events")
      .select("*")
      .eq("event_key", payload.event_key)
      .eq("enabled", true)
      .maybeSingle(),
    supabase
      .from("server_tracking_config")
      .select("*")
      .eq("singleton", true)
      .maybeSingle(),
  ]);

  if (!evtRow) {
    return new Response(JSON.stringify({ error: "unknown_event" }), {
      status: 404,
      headers: { ...CORS, "content-type": "application/json" },
    });
  }
  if (!cfg) {
    return new Response(JSON.stringify({ error: "no_config" }), {
      status: 500,
      headers: { ...CORS, "content-type": "application/json" },
    });
  }

  const evt = evtRow as ConversionEvent;
  const ip =
    req.headers.get("cf-connecting-ip") ||
    (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    null;
  const ua = req.headers.get("user-agent");

  const providers: Array<{ provider: string; ok: boolean; status: number; text?: string }> = [];

  if (cfg.ga4_enabled && cfg.ga4_measurement_id && cfg.ga4_api_secret && evt.ga4_event_name) {
    try {
      const r = await sendGA4(
        { measurement_id: cfg.ga4_measurement_id, api_secret: cfg.ga4_api_secret },
        evt,
        payload,
      );
      providers.push({ provider: "GA4", ...r });
    } catch (e) {
      providers.push({ provider: "GA4", ok: false, status: 0, text: String(e) });
    }
  }
  if (cfg.meta_enabled && cfg.meta_pixel_id && cfg.meta_access_token && evt.meta_event_name) {
    try {
      const r = await sendMeta(
        {
          pixel_id: cfg.meta_pixel_id,
          access_token: cfg.meta_access_token,
          test_event_code: cfg.meta_test_event_code || undefined,
        },
        evt,
        payload,
        ip,
        ua,
      );
      providers.push({ provider: "Meta", ...r });
    } catch (e) {
      providers.push({ provider: "Meta", ok: false, status: 0, text: String(e) });
    }
  }
  if (cfg.tiktok_enabled && cfg.tiktok_pixel_id && cfg.tiktok_access_token && evt.tiktok_event_name) {
    try {
      const r = await sendTikTok(
        {
          pixel_id: cfg.tiktok_pixel_id,
          access_token: cfg.tiktok_access_token,
          test_event_code: cfg.tiktok_test_event_code || undefined,
        },
        evt,
        payload,
        ip,
        ua,
      );
      providers.push({ provider: "TikTok", ...r });
    } catch (e) {
      providers.push({ provider: "TikTok", ok: false, status: 0, text: String(e) });
    }
  }

  const status = providers.length === 0
    ? "skipped"
    : providers.every((p) => p.ok)
      ? "ok"
      : providers.some((p) => p.ok)
        ? "partial"
        : "error";

  await supabase.from("server_event_log").insert({
    event_id: payload.event_id,
    event_key: payload.event_key,
    providers,
    status,
    error: status === "error" ? providers.map((p) => p.text).filter(Boolean).join(" | ").slice(0, 1000) : null,
    ip,
    user_agent: ua,
  });

  return new Response(JSON.stringify({ ok: status !== "error", status, providers }), {
    headers: { ...CORS, "content-type": "application/json" },
  });
});
