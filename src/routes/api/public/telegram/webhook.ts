import { createFileRoute } from "@tanstack/react-router";

// Telegram webhook — receives replies from your admin chat and routes them
// back to the correct visitor's website session via the chatbot_telegram_map.
//
// Commands supported:
//   (swipe-reply)          → routes admin text to the mapped conversation
//   /reply <code> <text>   → routes by 4-char short_code (great when many
//                            requests are stacked)
//   /list                  → lists all currently-live conversations
//   /close <code>          → closes a live conversation and returns visitor
//                            to the menu bot
//
// The endpoint is unauthenticated (Telegram calls it directly). Security is
// enforced by verifying that the update came from the admin chat configured
// in chatbot_config.telegram_admin_chat_id.

const TG_GATEWAY = "https://connector-gateway.lovable.dev/telegram";

async function tg(method: string, body: Record<string, unknown>) {
  const lovable = process.env.LOVABLE_API_KEY;
  const tgKey = process.env.TELEGRAM_API_KEY;
  if (!lovable || !tgKey) return;
  try {
    await fetch(`${TG_GATEWAY}/${method}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovable}`,
        "X-Connection-Api-Key": tgKey,
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.error("tg forward failed", e);
  }
}

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let update: any;
        try {
          update = await request.json();
        } catch {
          return new Response("Bad payload", { status: 400 });
        }

        const message = update.message ?? update.edited_message;
        if (!message?.chat?.id || !message?.text) {
          return Response.json({ ok: true, ignored: true });
        }

        const chatId = message.chat.id;
        const text: string = String(message.text || "").trim();

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Verify sender = configured admin chat
        const { data: cfg } = await (supabaseAdmin as any)
          .from("chatbot_config")
          .select("telegram_admin_chat_id")
          .eq("id", true)
          .maybeSingle();
        const adminChat = (cfg?.telegram_admin_chat_id || "").trim();
        if (!adminChat || String(chatId) !== adminChat) {
          console.warn("telegram webhook: chat_id mismatch", chatId, adminChat);
          return Response.json({ ok: true, unauthorized: true });
        }

        // /list
        if (text.toLowerCase() === "/list") {
          const { data: convs } = await (supabaseAdmin as any)
            .from("chatbot_conversations")
            .select("visitor_name, short_code, order_id, last_message")
            .eq("status", "live")
            .order("updated_at", { ascending: false })
            .limit(30);
          const body = (convs ?? []).length
            ? convs
                .map(
                  (c: any) =>
                    `• [${c.short_code}] ${c.visitor_name}${c.order_id ? ` (${c.order_id})` : ""} — ${(
                      c.last_message || ""
                    ).slice(0, 80)}`,
                )
                .join("\n")
            : "No live chats right now.";
          await tg("sendMessage", { chat_id: chatId, text: `📋 Live chats:\n${body}` });
          return Response.json({ ok: true });
        }

        // /close <code>
        const closeMatch = text.match(/^\/close\s+([a-z0-9]{4})\s*$/i);
        if (closeMatch) {
          const code = closeMatch[1].toLowerCase();
          const { data: conv } = await (supabaseAdmin as any)
            .from("chatbot_conversations")
            .select("id, visitor_name")
            .eq("short_code", code)
            .maybeSingle();
          if (!conv) {
            await tg("sendMessage", { chat_id: chatId, text: `❌ No chat with code ${code}` });
          } else {
            await (supabaseAdmin as any)
              .from("chatbot_conversations")
              .update({ status: "closed" })
              .eq("id", conv.id);
            await (supabaseAdmin as any).from("chatbot_messages").insert({
              conversation_id: conv.id,
              sender: "bot",
              text: "Our team has closed this chat. Type anything to start a new one.",
            });
            await tg("sendMessage", {
              chat_id: chatId,
              text: `✅ Closed chat [${code}] with ${conv.visitor_name}`,
            });
          }
          return Response.json({ ok: true });
        }

        // /reply <code> <text>
        const replyMatch = text.match(/^\/reply\s+([a-z0-9]{4})\s+([\s\S]+)$/i);
        if (replyMatch) {
          const code = replyMatch[1].toLowerCase();
          const body = replyMatch[2].trim();
          const { data: conv } = await (supabaseAdmin as any)
            .from("chatbot_conversations")
            .select("id, visitor_name")
            .eq("short_code", code)
            .maybeSingle();
          if (!conv) {
            await tg("sendMessage", { chat_id: chatId, text: `❌ No chat with code ${code}` });
          } else {
            await (supabaseAdmin as any).from("chatbot_messages").insert({
              conversation_id: conv.id,
              sender: "admin",
              text: body,
            });
            await (supabaseAdmin as any)
              .from("chatbot_conversations")
              .update({ status: "live", last_message: body.slice(0, 200) })
              .eq("id", conv.id);
            await tg("sendMessage", {
              chat_id: chatId,
              text: `✅ Sent to ${conv.visitor_name} [${code}]`,
            });
          }
          return Response.json({ ok: true });
        }

        // Swipe-reply → look up via mapped telegram message id
        const replyTo = message.reply_to_message?.message_id;
        if (replyTo) {
          const { data: mapRow } = await (supabaseAdmin as any)
            .from("chatbot_telegram_map")
            .select("conversation_id")
            .eq("telegram_chat_id", chatId)
            .eq("telegram_message_id", replyTo)
            .maybeSingle();
          if (mapRow) {
            const { data: conv } = await (supabaseAdmin as any)
              .from("chatbot_conversations")
              .select("visitor_name, short_code")
              .eq("id", mapRow.conversation_id)
              .maybeSingle();
            await (supabaseAdmin as any).from("chatbot_messages").insert({
              conversation_id: mapRow.conversation_id,
              sender: "admin",
              text,
            });
            await (supabaseAdmin as any)
              .from("chatbot_conversations")
              .update({ status: "live", last_message: text.slice(0, 200) })
              .eq("id", mapRow.conversation_id);
            await tg("sendMessage", {
              chat_id: chatId,
              text: `✅ Sent to ${conv?.visitor_name ?? "visitor"} [${conv?.short_code ?? "----"}]`,
            });
            return Response.json({ ok: true });
          }
        }

        // Unknown text — hint the operator
        await tg("sendMessage", {
          chat_id: chatId,
          text:
            "ℹ️ Reply directly to a request message, or use:\n" +
            "  /reply <code> <text>\n  /list\n  /close <code>",
        });
        return Response.json({ ok: true });
      },
    },
  },
});
