import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
export type ChatSender = "user" | "bot" | "admin";

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender: ChatSender;
  text: string;
  created_at: string;
};

export type ChatConversation = {
  id: string;
  session_id: string;
  visitor_name: string;
  order_id: string | null;
  email: string | null;
  status: "bot" | "live" | "closed";
  short_code: string;
  last_message: string;
  created_at: string;
  updated_at: string;
};

export type KbEntry = {
  id: string;
  category: string;
  title: string;
  answer: string;
  sort_order: number;
  enabled: boolean;
};

export type OrderRow = {
  id: string;
  order_id: string;
  customer_name: string;
  email: string;
  service: string;
  details: string;
  quantity: number;
  amount: number;
  status: "Received" | "In progress" | "Delivered" | "Cancelled";
  notes: string;
  created_at: string;
  updated_at: string;
};

export type TicketRow = {
  id: string;
  ticket_no: string;
  name: string;
  email: string;
  issue: string;
  status: "Open" | "Closed";
  created_at: string;
};

export type ChatbotConfig = {
  enabled: boolean;
  greeting: string;
  human_hours_note: string;
  telegram_admin_chat_id: string;
  ticket_webhook_url: string;
};

// -----------------------------------------------------------------------------
// Admin gate (matches existing project pattern using ADMIN_EMAIL)
// -----------------------------------------------------------------------------
function assertAdmin(email: string | undefined | null) {
  const admin = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (!admin) throw new Error("ADMIN_EMAIL is not configured");
  if (!email || email.trim().toLowerCase() !== admin) {
    throw new Error("Forbidden: admin only");
  }
}

// -----------------------------------------------------------------------------
// Telegram helpers (uses Lovable connector gateway)
// -----------------------------------------------------------------------------
const TG_GATEWAY = "https://connector-gateway.lovable.dev/telegram";

async function telegramCall(
  method: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; result?: any; description?: string }> {
  const lovable = process.env.LOVABLE_API_KEY;
  const tgKey = process.env.TELEGRAM_API_KEY;
  if (!lovable || !tgKey) {
    return { ok: false, description: "Telegram connector is not configured" };
  }
  const r = await fetch(`${TG_GATEWAY}/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovable}`,
      "X-Connection-Api-Key": tgKey,
    },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { ok: false, description: text };
  }
  if (!r.ok || parsed?.ok === false) {
    console.error(`telegram ${method} failed [${r.status}]:`, text);
    return { ok: false, description: parsed?.description || text };
  }
  return parsed;
}

// -----------------------------------------------------------------------------
// Public config (safe subset for widget)
// -----------------------------------------------------------------------------
export const getChatbotPublicConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ enabled: boolean; greeting: string; human_hours_note: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await (supabaseAdmin as any)
      .from("chatbot_config")
      .select("enabled, greeting, human_hours_note")
      .eq("id", true)
      .maybeSingle();
    return {
      enabled: data?.enabled ?? true,
      greeting: data?.greeting ?? "Hi! What's your name?",
      human_hours_note: data?.human_hours_note ?? "",
    };
  },
);

// -----------------------------------------------------------------------------
// Knowledge base (public read)
// -----------------------------------------------------------------------------
export const listKb = createServerFn({ method: "GET" }).handler(
  async (): Promise<KbEntry[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await (supabaseAdmin as any)
      .from("chatbot_kb")
      .select("*")
      .eq("enabled", true)
      .order("sort_order", { ascending: true });
    return (data ?? []) as KbEntry[];
  },
);

// -----------------------------------------------------------------------------
// Conversation start / message posting
// -----------------------------------------------------------------------------
export const startConversation = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { sessionId: string; visitorName: string; orderId?: string; email?: string }) => d,
  )
  .handler(async ({ data }): Promise<ChatConversation> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Upsert on session_id
    const { data: existing } = await (supabaseAdmin as any)
      .from("chatbot_conversations")
      .select("*")
      .eq("session_id", data.sessionId)
      .maybeSingle();
    if (existing) return existing as ChatConversation;

    const { data: row, error } = await (supabaseAdmin as any)
      .from("chatbot_conversations")
      .insert({
        session_id: data.sessionId,
        visitor_name: (data.visitorName || "Visitor").slice(0, 80),
        order_id: data.orderId ?? null,
        email: data.email ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as ChatConversation;
  });

export const listMessages = createServerFn({ method: "GET" })
  .inputValidator((d: { sessionId: string }) => d)
  .handler(async ({ data }): Promise<ChatMessage[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: conv } = await (supabaseAdmin as any)
      .from("chatbot_conversations")
      .select("id")
      .eq("session_id", data.sessionId)
      .maybeSingle();
    if (!conv) return [];
    const { data: rows } = await (supabaseAdmin as any)
      .from("chatbot_messages")
      .select("*")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true });
    return (rows ?? []) as ChatMessage[];
  });

export const postMessage = createServerFn({ method: "POST" })
  .inputValidator((d: { sessionId: string; sender: ChatSender; text: string }) => d)
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    if (!data.text?.trim()) return { ok: false };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: conv } = await (supabaseAdmin as any)
      .from("chatbot_conversations")
      .select("*")
      .eq("session_id", data.sessionId)
      .maybeSingle();
    if (!conv) throw new Error("Conversation not found");

    const text = data.text.slice(0, 4000);
    await (supabaseAdmin as any).from("chatbot_messages").insert({
      conversation_id: conv.id,
      sender: data.sender,
      text,
    });
    await (supabaseAdmin as any)
      .from("chatbot_conversations")
      .update({ last_message: text, updated_at: new Date().toISOString() })
      .eq("id", conv.id);

    // If conversation is live and user is speaking, relay to Telegram thread
    if (data.sender === "user" && conv.status === "live") {
      const { data: mapRow } = await (supabaseAdmin as any)
        .from("chatbot_telegram_map")
        .select("telegram_message_id, telegram_chat_id")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (mapRow) {
        await telegramCall("sendMessage", {
          chat_id: mapRow.telegram_chat_id,
          text: `💬 ${conv.visitor_name} [${conv.short_code}]:\n${text}`,
          reply_to_message_id: mapRow.telegram_message_id,
        });
      }
    }
    return { ok: true };
  });

// -----------------------------------------------------------------------------
// Order lookup + creation
// -----------------------------------------------------------------------------
export const lookupOrder = createServerFn({ method: "POST" })
  .inputValidator((d: { orderId: string; verify?: string }) => d)
  .handler(
    async ({
      data,
    }): Promise<{
      found: boolean;
      order?: Pick<OrderRow, "order_id" | "customer_name" | "service" | "status" | "notes" | "amount">;
    }> => {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const id = data.orderId.trim().toUpperCase();
      const { data: row } = await (supabaseAdmin as any)
        .from("chatbot_orders")
        .select("order_id, customer_name, email, service, status, notes, amount")
        .eq("order_id", id)
        .maybeSingle();
      if (!row) return { found: false };
      if (data.verify) {
        const v = data.verify.trim().toLowerCase();
        const okName = row.customer_name?.toLowerCase().includes(v);
        const okEmail = row.email?.toLowerCase() === v;
        if (!okName && !okEmail) return { found: false };
      }
      return {
        found: true,
        order: {
          order_id: row.order_id,
          customer_name: row.customer_name,
          service: row.service,
          status: row.status,
          notes: row.notes,
          amount: row.amount,
        },
      };
    },
  );

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      customer_name: string;
      email: string;
      service: string;
      details: string;
      quantity: number;
      amount: number;
    }) => d,
  )
  .handler(async ({ data }): Promise<{ order_id: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await (supabaseAdmin as any)
      .from("chatbot_orders")
      .insert({
        customer_name: (data.customer_name || "").slice(0, 120),
        email: (data.email || "").slice(0, 200),
        service: (data.service || "").slice(0, 120),
        details: (data.details || "").slice(0, 2000),
        quantity: Math.max(0, Math.floor(data.quantity || 0)),
        amount: Number(data.amount) || 0,
      })
      .select("order_id")
      .single();
    if (error) throw new Error(error.message);
    return { order_id: row.order_id };
  });

// -----------------------------------------------------------------------------
// Tickets — save to DB and forward to Telegram (email path optional via webhook)
// -----------------------------------------------------------------------------
export const createTicket = createServerFn({ method: "POST" })
  .inputValidator((d: { name: string; email: string; issue: string }) => d)
  .handler(async ({ data }): Promise<{ ticket_no: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await (supabaseAdmin as any)
      .from("chatbot_tickets")
      .insert({
        name: (data.name || "").slice(0, 120),
        email: (data.email || "").slice(0, 200),
        issue: (data.issue || "").slice(0, 4000),
      })
      .select("ticket_no")
      .single();
    if (error) throw new Error(error.message);

    // Fire-and-forget notifications
    try {
      const { data: cfg } = await (supabaseAdmin as any)
        .from("chatbot_config")
        .select("telegram_admin_chat_id, ticket_webhook_url")
        .eq("id", true)
        .maybeSingle();

      if (cfg?.telegram_admin_chat_id) {
        await telegramCall("sendMessage", {
          chat_id: cfg.telegram_admin_chat_id,
          text: `🎫 New support ticket ${row.ticket_no}\n👤 ${data.name}\n📧 ${data.email}\n─────\n${data.issue}`,
        });
      }
      if (cfg?.ticket_webhook_url) {
        fetch(cfg.ticket_webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticket_no: row.ticket_no,
            name: data.name,
            email: data.email,
            issue: data.issue,
            created_at: new Date().toISOString(),
          }),
        }).catch((e) => console.error("ticket webhook failed", e));
      }
    } catch (e) {
      console.error("ticket notify failed", e);
    }
    return { ticket_no: row.ticket_no };
  });

// -----------------------------------------------------------------------------
// Human handoff — flip conversation to "live" and post Telegram thread
// -----------------------------------------------------------------------------
export const requestHumanHandoff = createServerFn({ method: "POST" })
  .inputValidator((d: { sessionId: string; lastMessage?: string }) => d)
  .handler(async ({ data }): Promise<{ ok: boolean; note?: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: conv } = await (supabaseAdmin as any)
      .from("chatbot_conversations")
      .select("*")
      .eq("session_id", data.sessionId)
      .maybeSingle();
    if (!conv) throw new Error("Conversation not found");

    await (supabaseAdmin as any)
      .from("chatbot_conversations")
      .update({ status: "live" })
      .eq("id", conv.id);

    const { data: cfg } = await (supabaseAdmin as any)
      .from("chatbot_config")
      .select("telegram_admin_chat_id")
      .eq("id", true)
      .maybeSingle();

    if (!cfg?.telegram_admin_chat_id) {
      // Post an admin message telling visitor we saved their request
      await (supabaseAdmin as any).from("chatbot_messages").insert({
        conversation_id: conv.id,
        sender: "bot",
        text: "Our team will reach out shortly. You can also raise a ticket for a written record.",
      });
      return { ok: false, note: "Telegram admin chat not configured yet" };
    }

    const chatId = cfg.telegram_admin_chat_id;
    const summary = `🔔 Live chat request\n👤 Name: ${conv.visitor_name}\n🧾 Order: ${conv.order_id ?? "none"}\n💬 ${data.lastMessage || conv.last_message || "(no message yet)"}\n─────\nReply to THIS message, or type: /reply ${conv.short_code} your text\nCode: ${conv.short_code}`;
    const sent = await telegramCall("sendMessage", { chat_id: chatId, text: summary });
    const msgId = sent?.result?.message_id;
    const resChat = sent?.result?.chat?.id;
    if (msgId && resChat) {
      await (supabaseAdmin as any).from("chatbot_telegram_map").insert({
        telegram_message_id: msgId,
        telegram_chat_id: resChat,
        conversation_id: conv.id,
      });
    }
    await (supabaseAdmin as any).from("chatbot_messages").insert({
      conversation_id: conv.id,
      sender: "bot",
      text: "You're now connected to our team. A human will reply here shortly.",
    });
    return { ok: sent.ok };
  });

// -----------------------------------------------------------------------------
// Admin: config, conversations, replies, KB CRUD, orders CRUD, tickets CRUD
// -----------------------------------------------------------------------------
export const adminGetConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ChatbotConfig> => {
    assertAdmin((context.claims as { email?: string }).email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await (supabaseAdmin as any)
      .from("chatbot_config")
      .select("*")
      .eq("id", true)
      .maybeSingle();
    return (data ?? {
      enabled: true,
      greeting: "",
      human_hours_note: "",
      telegram_admin_chat_id: "",
      ticket_webhook_url: "",
    }) as ChatbotConfig;
  });

export const adminSaveConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: ChatbotConfig) => d)
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    assertAdmin((context.claims as { email?: string }).email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await (supabaseAdmin as any)
      .from("chatbot_config")
      .update({
        enabled: data.enabled,
        greeting: data.greeting,
        human_hours_note: data.human_hours_note,
        telegram_admin_chat_id: data.telegram_admin_chat_id.trim(),
        ticket_webhook_url: data.ticket_webhook_url.trim(),
      })
      .eq("id", true);
    return { ok: true };
  });

export const adminListConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ChatConversation[]> => {
    assertAdmin((context.claims as { email?: string }).email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await (supabaseAdmin as any)
      .from("chatbot_conversations")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(200);
    return (data ?? []) as ChatConversation[];
  });

export const adminListMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { conversationId: string }) => d)
  .handler(async ({ context, data }): Promise<ChatMessage[]> => {
    assertAdmin((context.claims as { email?: string }).email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await (supabaseAdmin as any)
      .from("chatbot_messages")
      .select("*")
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: true });
    return (rows ?? []) as ChatMessage[];
  });

export const adminReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { conversationId: string; text: string }) => d)
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    assertAdmin((context.claims as { email?: string }).email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await (supabaseAdmin as any).from("chatbot_messages").insert({
      conversation_id: data.conversationId,
      sender: "admin",
      text: data.text.slice(0, 4000),
    });
    await (supabaseAdmin as any)
      .from("chatbot_conversations")
      .update({ status: "live", last_message: data.text.slice(0, 200) })
      .eq("id", data.conversationId);
    return { ok: true };
  });

export const adminCloseConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { conversationId: string }) => d)
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    assertAdmin((context.claims as { email?: string }).email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await (supabaseAdmin as any)
      .from("chatbot_conversations")
      .update({ status: "closed" })
      .eq("id", data.conversationId);
    await (supabaseAdmin as any).from("chatbot_messages").insert({
      conversation_id: data.conversationId,
      sender: "bot",
      text: "This conversation has been closed. Feel free to start a new chat anytime.",
    });
    return { ok: true };
  });

// KB CRUD
export const adminListKb = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<KbEntry[]> => {
    assertAdmin((context.claims as { email?: string }).email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await (supabaseAdmin as any)
      .from("chatbot_kb")
      .select("*")
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true });
    return (data ?? []) as KbEntry[];
  });

export const adminUpsertKb = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      id?: string;
      category: string;
      title: string;
      answer: string;
      sort_order: number;
      enabled: boolean;
    }) => d,
  )
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    assertAdmin((context.claims as { email?: string }).email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.id) {
      await (supabaseAdmin as any)
        .from("chatbot_kb")
        .update({
          category: data.category,
          title: data.title,
          answer: data.answer,
          sort_order: data.sort_order,
          enabled: data.enabled,
        })
        .eq("id", data.id);
    } else {
      await (supabaseAdmin as any).from("chatbot_kb").insert({
        category: data.category,
        title: data.title,
        answer: data.answer,
        sort_order: data.sort_order,
        enabled: data.enabled,
      });
    }
    return { ok: true };
  });

export const adminDeleteKb = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    assertAdmin((context.claims as { email?: string }).email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await (supabaseAdmin as any).from("chatbot_kb").delete().eq("id", data.id);
    return { ok: true };
  });

// Orders CRUD
export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OrderRow[]> => {
    assertAdmin((context.claims as { email?: string }).email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await (supabaseAdmin as any)
      .from("chatbot_orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    return (data ?? []) as OrderRow[];
  });

export const adminUpsertOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      id?: string;
      order_id?: string;
      customer_name: string;
      email: string;
      service: string;
      details?: string;
      quantity?: number;
      amount: number;
      status: OrderRow["status"];
      notes: string;
    }) => d,
  )
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    assertAdmin((context.claims as { email?: string }).email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload: Record<string, unknown> = {
      customer_name: data.customer_name,
      email: data.email,
      service: data.service,
      details: data.details ?? "",
      quantity: data.quantity ?? 0,
      amount: data.amount,
      status: data.status,
      notes: data.notes,
    };
    if (data.order_id) payload.order_id = data.order_id;
    if (data.id) {
      await (supabaseAdmin as any).from("chatbot_orders").update(payload).eq("id", data.id);
    } else {
      await (supabaseAdmin as any).from("chatbot_orders").insert(payload);
    }
    return { ok: true };
  });

export const adminDeleteOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    assertAdmin((context.claims as { email?: string }).email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await (supabaseAdmin as any).from("chatbot_orders").delete().eq("id", data.id);
    return { ok: true };
  });

// Tickets CRUD
export const adminListTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TicketRow[]> => {
    assertAdmin((context.claims as { email?: string }).email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await (supabaseAdmin as any)
      .from("chatbot_tickets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    return (data ?? []) as TicketRow[];
  });

export const adminUpdateTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: "Open" | "Closed" }) => d)
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    assertAdmin((context.claims as { email?: string }).email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await (supabaseAdmin as any)
      .from("chatbot_tickets")
      .update({ status: data.status })
      .eq("id", data.id);
    return { ok: true };
  });

// -----------------------------------------------------------------------------
// Telegram webhook setup helper (admin-only)
// -----------------------------------------------------------------------------
export const adminSetTelegramWebhook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { webhookUrl: string }) => d)
  .handler(async ({ context, data }): Promise<{ ok: boolean; description?: string }> => {
    assertAdmin((context.claims as { email?: string }).email);
    const res = await telegramCall("setWebhook", {
      url: data.webhookUrl,
      allowed_updates: ["message", "edited_message"],
    });
    return { ok: res.ok, description: res.description };
  });
