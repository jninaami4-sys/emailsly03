/**
 * Chatbot — thin proxies to PHP API (Batch 5 migration).
 * Public widget + admin surfaces.
 */
import { chatbotApi, adminChatbotApi } from "@/lib/api-client";

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

type Empty = Record<string, never>;

/* -------------------- Public widget -------------------- */

export async function getChatbotPublicConfig(
  _?: { data?: Empty },
): Promise<{ enabled: boolean; greeting: string; human_hours_note: string }> {
  try {
    return await chatbotApi.config();
  } catch {
    return { enabled: true, greeting: "Hi! What's your name?", human_hours_note: "" };
  }
}

export async function listKb(_?: { data?: Empty }): Promise<KbEntry[]> {
  try {
    const { items } = await chatbotApi.listKb();
    return (items ?? []) as KbEntry[];
  } catch {
    return [];
  }
}

export async function startConversation(args: {
  data: { sessionId: string; visitorName: string; orderId?: string; email?: string };
}): Promise<ChatConversation> {
  const { conversation } = await chatbotApi.startConversation(args.data);
  return conversation as ChatConversation;
}

export async function listMessages(args: { data: { sessionId: string } }): Promise<ChatMessage[]> {
  const { messages } = await chatbotApi.listMessages(args.data.sessionId);
  return (messages ?? []) as ChatMessage[];
}

export async function postMessage(args: {
  data: { sessionId: string; sender: ChatSender; text: string };
}): Promise<{ ok: boolean }> {
  return chatbotApi.postMessage(args.data);
}

export async function lookupOrder(args: {
  data: { orderId: string; verify?: string };
}): Promise<{
  found: boolean;
  order?: Pick<OrderRow, "order_id" | "customer_name" | "service" | "status" | "notes" | "amount">;
}> {
  return chatbotApi.lookupOrder(args.data);
}

export async function createOrder(args: {
  data: {
    customer_name: string;
    email: string;
    service: string;
    details: string;
    quantity: number;
    amount: number;
  };
}): Promise<{ order_id: string }> {
  return chatbotApi.createOrder(args.data);
}

export async function createTicket(args: {
  data: { name: string; email: string; issue: string };
}): Promise<{ ticket_no: string }> {
  return chatbotApi.createTicket(args.data);
}

export async function requestHumanHandoff(args: {
  data: { sessionId: string; lastMessage?: string };
}): Promise<{ ok: boolean; note?: string }> {
  return chatbotApi.handoff(args.data);
}

/* -------------------- Admin -------------------- */

export async function adminGetConfig(_?: { data?: Empty }): Promise<ChatbotConfig> {
  const { config } = await adminChatbotApi.getConfig();
  return (config ?? {
    enabled: true,
    greeting: "",
    human_hours_note: "",
    telegram_admin_chat_id: "",
    ticket_webhook_url: "",
  }) as ChatbotConfig;
}

export async function adminSaveConfig(args: { data: ChatbotConfig }): Promise<{ ok: true }> {
  await adminChatbotApi.saveConfig(args.data);
  return { ok: true };
}

export async function adminListConversations(_?: { data?: Empty }): Promise<ChatConversation[]> {
  const { conversations } = await adminChatbotApi.conversations();
  return (conversations ?? []) as ChatConversation[];
}

export async function adminListMessages(args: {
  data: { conversationId: string };
}): Promise<ChatMessage[]> {
  const { messages } = await adminChatbotApi.messages(args.data.conversationId);
  return (messages ?? []) as ChatMessage[];
}

export async function adminReply(args: {
  data: { conversationId: string; text: string };
}): Promise<{ ok: true }> {
  await adminChatbotApi.reply(args.data.conversationId, args.data.text);
  return { ok: true };
}

export async function adminCloseConversation(args: {
  data: { conversationId: string };
}): Promise<{ ok: true }> {
  await adminChatbotApi.closeConversation(args.data.conversationId);
  return { ok: true };
}

/* KB */
export async function adminListKb(_?: { data?: Empty }): Promise<KbEntry[]> {
  const { items } = await adminChatbotApi.kbList();
  return (items ?? []) as KbEntry[];
}

export async function adminUpsertKb(args: {
  data: {
    id?: string;
    category: string;
    title: string;
    answer: string;
    sort_order: number;
    enabled: boolean;
  };
}): Promise<{ ok: true }> {
  await adminChatbotApi.kbUpsert(args.data);
  return { ok: true };
}

export async function adminDeleteKb(args: { data: { id: string } }): Promise<{ ok: true }> {
  await adminChatbotApi.kbDelete(args.data.id);
  return { ok: true };
}

/* Orders */
export async function adminListOrders(_?: { data?: Empty }): Promise<OrderRow[]> {
  const { orders } = await adminChatbotApi.ordersList();
  return (orders ?? []) as OrderRow[];
}

export async function adminUpsertOrder(args: {
  data: {
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
  };
}): Promise<{ ok: true }> {
  await adminChatbotApi.orderUpsert(args.data);
  return { ok: true };
}

export async function adminDeleteOrder(args: { data: { id: string } }): Promise<{ ok: true }> {
  await adminChatbotApi.orderDelete(args.data.id);
  return { ok: true };
}

/* Tickets */
export async function adminListTickets(_?: { data?: Empty }): Promise<TicketRow[]> {
  const { tickets } = await adminChatbotApi.ticketsList();
  return (tickets ?? []) as TicketRow[];
}

export async function adminUpdateTicket(args: {
  data: { id: string; status: "Open" | "Closed" };
}): Promise<{ ok: true }> {
  await adminChatbotApi.ticketUpdate(args.data.id, { status: args.data.status });
  return { ok: true };
}

/* Telegram + sync */
export async function adminSetTelegramWebhook(args: {
  data: { webhookUrl: string };
}): Promise<{ ok: boolean; description?: string }> {
  return adminChatbotApi.telegramWebhook(args.data.webhookUrl);
}

export async function adminSyncKb(_?: { data?: Empty }): Promise<{
  ok: true;
  inserted: number;
  removed: number;
  categories: Record<string, number>;
}> {
  return adminChatbotApi.syncKb();
}
