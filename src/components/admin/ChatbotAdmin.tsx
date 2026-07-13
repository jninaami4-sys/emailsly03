import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Trash2, Plus, Send, RefreshCw } from "lucide-react";
import {
  adminCloseConversation,
  adminDeleteKb,
  adminDeleteOrder,
  adminGetConfig,
  adminListConversations,
  adminListKb,
  adminListMessages,
  adminListOrders,
  adminListTickets,
  adminReply,
  adminSaveConfig,
  adminSetTelegramWebhook,
  adminUpdateTicket,
  adminSyncKb,
  adminUpsertKb,
  adminUpsertOrder,
  type ChatbotConfig,
  type KbEntry,
  type OrderRow,
} from "@/lib/chatbot.functions";

type Tab = "live" | "orders" | "tickets" | "kb" | "config";

export function ChatbotAdmin() {
  const [tab, setTab] = useState<Tab>("live");
  return (
    <section className="rounded-2xl border border-border bg-card">
      <header className="border-b border-border px-4 py-3">
        <h2 className="font-display text-lg font-bold">Chatbot</h2>
        <p className="text-xs text-muted-foreground">
          Live chats, orders, tickets and the answer text your bot uses.
        </p>
        <div className="mt-3 flex flex-wrap gap-1">
          {(
            [
              ["live", "Live chats"],
              ["orders", "Orders"],
              ["tickets", "Tickets"],
              ["kb", "Knowledge base"],
              ["config", "Config"],
            ] as Array<[Tab, string]>
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                tab === id ? "bg-violet text-white" : "border border-border hover:bg-secondary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>
      <div className="p-4">
        {tab === "live" && <LiveChatsPane />}
        {tab === "orders" && <OrdersPane />}
        {tab === "tickets" && <TicketsPane />}
        {tab === "kb" && <KbPane />}
        {tab === "config" && <ConfigPane />}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Live chats
// ---------------------------------------------------------------------------
function LiveChatsPane() {
  const listFn = useServerFn(adminListConversations);
  const msgFn = useServerFn(adminListMessages);
  const replyFn = useServerFn(adminReply);
  const closeFn = useServerFn(adminCloseConversation);
  const qc = useQueryClient();

  const { data: convs = [], isLoading, refetch } = useQuery({
    queryKey: ["chatbot-admin-convs"],
    queryFn: () => listFn(),
    refetchInterval: 5000,
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [reply, setReply] = useState("");

  useEffect(() => {
    if (!selected && convs.length) setSelected(convs[0].id);
  }, [convs, selected]);

  const { data: messages = [] } = useQuery({
    queryKey: ["chatbot-admin-msgs", selected],
    queryFn: () => msgFn({ data: { conversationId: selected! } }),
    enabled: !!selected,
    refetchInterval: 3000,
  });

  const conv = convs.find((c) => c.id === selected);

  async function send() {
    if (!selected || !reply.trim()) return;
    await replyFn({ data: { conversationId: selected, text: reply.trim() } });
    setReply("");
    qc.invalidateQueries({ queryKey: ["chatbot-admin-msgs", selected] });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <div className="rounded-xl border border-border">
        <div className="flex items-center justify-between border-b border-border p-2 text-xs">
          <span>{isLoading ? "Loading…" : `${convs.length} chats`}</span>
          <button onClick={() => refetch()} className="p-1"><RefreshCw className="size-3" /></button>
        </div>
        <ul className="max-h-[500px] overflow-y-auto divide-y divide-border">
          {convs.map((c) => (
            <li
              key={c.id}
              onClick={() => setSelected(c.id)}
              className={`cursor-pointer p-2 text-xs ${
                selected === c.id ? "bg-secondary" : "hover:bg-secondary/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{c.visitor_name}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    c.status === "live"
                      ? "bg-emerald-500/20 text-emerald-700"
                      : c.status === "closed"
                        ? "bg-muted text-muted-foreground"
                        : "bg-violet/20 text-violet"
                  }`}
                >
                  {c.status}
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground">
                [{c.short_code}] {c.order_id || ""}
              </div>
              <div className="line-clamp-1 text-muted-foreground">{c.last_message}</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-border">
        {!conv ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Pick a chat</div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-border p-3">
              <div>
                <div className="text-sm font-semibold">{conv.visitor_name}</div>
                <div className="text-[11px] text-muted-foreground">
                  Code {conv.short_code} · {conv.status}
                  {conv.order_id ? ` · order ${conv.order_id}` : ""}
                </div>
              </div>
              <button
                onClick={async () => {
                  await closeFn({ data: { conversationId: conv.id } });
                  qc.invalidateQueries({ queryKey: ["chatbot-admin-convs"] });
                }}
                className="rounded-lg border border-border px-2 py-1 text-xs"
              >
                Close chat
              </button>
            </div>
            <div className="h-[380px] overflow-y-auto p-3 text-sm">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`mb-2 flex ${m.sender === "user" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 whitespace-pre-wrap ${
                      m.sender === "user"
                        ? "bg-secondary"
                        : m.sender === "admin"
                          ? "bg-emerald-500 text-white"
                          : "bg-violet text-white"
                    }`}
                  >
                    <div className="text-[10px] opacity-70">{m.sender}</div>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 border-t border-border p-2">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Type reply — sends to visitor's browser instantly"
                rows={2}
                className="flex-1 resize-none rounded-lg border border-border bg-background p-2 text-sm"
              />
              <button
                onClick={send}
                disabled={!reply.trim()}
                className="rounded-lg bg-violet px-3 text-white disabled:opacity-50"
              >
                <Send className="size-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------
function OrdersPane() {
  const listFn = useServerFn(adminListOrders);
  const upsertFn = useServerFn(adminUpsertOrder);
  const delFn = useServerFn(adminDeleteOrder);
  const qc = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["chatbot-admin-orders"],
    queryFn: () => listFn(),
  });
  const [editing, setEditing] = useState<Partial<OrderRow> | null>(null);

  async function save() {
    if (!editing) return;
    await upsertFn({
      data: {
        id: editing.id,
        order_id: editing.order_id,
        customer_name: editing.customer_name || "",
        email: editing.email || "",
        service: editing.service || "",
        details: editing.details || "",
        quantity: editing.quantity || 0,
        amount: editing.amount || 0,
        status: (editing.status as OrderRow["status"]) || "Received",
        notes: editing.notes || "",
      },
    });
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["chatbot-admin-orders"] });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {isLoading ? "Loading…" : `${orders.length} orders`}
          </span>
          <button
            onClick={() =>
              setEditing({
                customer_name: "",
                email: "",
                service: "",
                details: "",
                quantity: 0,
                amount: 0,
                status: "Received",
                notes: "",
              })
            }
            className="flex items-center gap-1 rounded-lg bg-violet px-2 py-1 text-xs font-semibold text-white"
          >
            <Plus className="size-3" /> New
          </button>
        </div>
        <div className="max-h-[500px] overflow-y-auto rounded-xl border border-border">
          <table className="w-full text-xs">
            <thead className="bg-secondary text-left">
              <tr>
                <th className="p-2">Order ID</th>
                <th className="p-2">Customer</th>
                <th className="p-2">Service</th>
                <th className="p-2">Status</th>
                <th className="p-2">$</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => setEditing(o)}
                  className="cursor-pointer border-t border-border hover:bg-secondary/50"
                >
                  <td className="p-2 font-mono">{o.order_id}</td>
                  <td className="p-2">{o.customer_name}</td>
                  <td className="p-2">{o.service}</td>
                  <td className="p-2">{o.status}</td>
                  <td className="p-2">${o.amount}</td>
                  <td className="p-2">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm(`Delete ${o.order_id}?`)) {
                          await delFn({ data: { id: o.id } });
                          qc.invalidateQueries({ queryKey: ["chatbot-admin-orders"] });
                        }
                      }}
                    >
                      <Trash2 className="size-3 text-rose-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="space-y-2 rounded-xl border border-border p-3 text-sm">
          <div className="font-semibold">{editing.id ? "Edit order" : "New order"}</div>
          {editing.order_id && (
            <div className="text-xs text-muted-foreground">ID: {editing.order_id}</div>
          )}
          <input
            className="w-full rounded-lg border border-border bg-background p-1.5 text-sm"
            placeholder="Customer name"
            value={editing.customer_name || ""}
            onChange={(e) => setEditing({ ...editing, customer_name: e.target.value })}
          />
          <input
            className="w-full rounded-lg border border-border bg-background p-1.5 text-sm"
            placeholder="Email"
            value={editing.email || ""}
            onChange={(e) => setEditing({ ...editing, email: e.target.value })}
          />
          <input
            className="w-full rounded-lg border border-border bg-background p-1.5 text-sm"
            placeholder="Service"
            value={editing.service || ""}
            onChange={(e) => setEditing({ ...editing, service: e.target.value })}
          />
          <input
            type="number"
            className="w-full rounded-lg border border-border bg-background p-1.5 text-sm"
            placeholder="Amount"
            value={editing.amount || 0}
            onChange={(e) => setEditing({ ...editing, amount: Number(e.target.value) })}
          />
          <select
            className="w-full rounded-lg border border-border bg-background p-1.5 text-sm"
            value={editing.status || "Received"}
            onChange={(e) => setEditing({ ...editing, status: e.target.value as any })}
          >
            <option>Received</option>
            <option>In progress</option>
            <option>Delivered</option>
            <option>Cancelled</option>
          </select>
          <textarea
            className="w-full rounded-lg border border-border bg-background p-1.5 text-sm"
            placeholder="Notes shown to visitor when they check status"
            rows={3}
            value={editing.notes || ""}
            onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
          />
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(null)}
              className="flex-1 rounded-lg border border-border px-2 py-1.5"
            >
              Cancel
            </button>
            <button
              onClick={save}
              className="flex-1 rounded-lg bg-violet px-2 py-1.5 font-semibold text-white"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tickets
// ---------------------------------------------------------------------------
function TicketsPane() {
  const listFn = useServerFn(adminListTickets);
  const updFn = useServerFn(adminUpdateTicket);
  const qc = useQueryClient();
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["chatbot-admin-tickets"],
    queryFn: () => listFn(),
    refetchInterval: 10000,
  });

  return (
    <div>
      <div className="mb-2 text-xs text-muted-foreground">
        {isLoading ? "Loading…" : `${tickets.length} tickets`}
      </div>
      <div className="max-h-[500px] overflow-y-auto rounded-xl border border-border">
        <table className="w-full text-xs">
          <thead className="bg-secondary text-left">
            <tr>
              <th className="p-2">Ticket</th>
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Issue</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id} className="border-t border-border">
                <td className="p-2 font-mono">{t.ticket_no}</td>
                <td className="p-2">{t.name}</td>
                <td className="p-2">{t.email}</td>
                <td className="p-2 max-w-md whitespace-pre-wrap">{t.issue}</td>
                <td className="p-2">
                  <select
                    value={t.status}
                    onChange={async (e) => {
                      await updFn({
                        data: { id: t.id, status: e.target.value as "Open" | "Closed" },
                      });
                      qc.invalidateQueries({ queryKey: ["chatbot-admin-tickets"] });
                    }}
                    className="rounded border border-border bg-background p-1 text-xs"
                  >
                    <option>Open</option>
                    <option>Closed</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// KB
// ---------------------------------------------------------------------------
function KbPane() {
  const listFn = useServerFn(adminListKb);
  const upsertFn = useServerFn(adminUpsertKb);
  const delFn = useServerFn(adminDeleteKb);
  const syncFn = useServerFn(adminSyncKb);
  const qc = useQueryClient();
  const { data: kb = [] } = useQuery({
    queryKey: ["chatbot-admin-kb"],
    queryFn: () => listFn(),
  });
  const [editing, setEditing] = useState<Partial<KbEntry> | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  async function handleSync() {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await syncFn();
      setSyncMsg(`Synced ${res.inserted} entries (replaced ${res.removed}).`);
      qc.invalidateQueries({ queryKey: ["chatbot-admin-kb"] });
    } catch (err) {
      setSyncMsg(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  const autoCount = kb.filter((k) => (k as KbEntry & { source?: string }).source === "auto").length;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <button
            onClick={() =>
              setEditing({
                category: "services",
                title: "",
                answer: "",
                sort_order: 100,
                enabled: true,
              })
            }
            className="flex items-center gap-1 rounded-lg bg-violet px-2 py-1 text-xs font-semibold text-white"
          >
            <Plus className="size-3" /> New answer
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-semibold hover:bg-secondary disabled:opacity-50"
            title="Pull latest pricing, policies, FAQs, catalog & blog from the site"
          >
            {syncing ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
            Sync from site
          </button>
          <span className="text-xs text-muted-foreground">
            {autoCount} auto-synced · {kb.length - autoCount} manual
          </span>
          {syncMsg && <span className="text-xs text-emerald-600">{syncMsg}</span>}
        </div>
        <div className="max-h-[500px] overflow-y-auto rounded-xl border border-border">
          <table className="w-full text-xs">
            <thead className="bg-secondary text-left">
              <tr>
                <th className="p-2">Category</th>
                <th className="p-2">Title</th>
                <th className="p-2">On?</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {kb.map((k) => (
                <tr
                  key={k.id}
                  onClick={() => setEditing(k)}
                  className="cursor-pointer border-t border-border hover:bg-secondary/50"
                >
                  <td className="p-2">{k.category}</td>
                  <td className="p-2">{k.title}</td>
                  <td className="p-2">{k.enabled ? "✓" : "—"}</td>
                  <td className="p-2">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${k.title}"?`)) {
                          await delFn({ data: { id: k.id } });
                          qc.invalidateQueries({ queryKey: ["chatbot-admin-kb"] });
                        }
                      }}
                    >
                      <Trash2 className="size-3 text-rose-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="space-y-2 rounded-xl border border-border p-3 text-sm">
          <div className="font-semibold">{editing.id ? "Edit answer" : "New answer"}</div>
          <select
            value={editing.category || "services"}
            onChange={(e) => setEditing({ ...editing, category: e.target.value })}
            className="w-full rounded-lg border border-border bg-background p-1.5 text-sm"
          >
            <option value="services">services</option>
            <option value="pricing">pricing</option>
            <option value="help">help</option>
            <option value="general">general</option>
          </select>
          <input
            className="w-full rounded-lg border border-border bg-background p-1.5 text-sm"
            placeholder="Title (shown as button label)"
            value={editing.title || ""}
            onChange={(e) => setEditing({ ...editing, title: e.target.value })}
          />
          <textarea
            className="w-full rounded-lg border border-border bg-background p-1.5 text-sm"
            placeholder="Answer text shown to visitor"
            rows={6}
            value={editing.answer || ""}
            onChange={(e) => setEditing({ ...editing, answer: e.target.value })}
          />
          <input
            type="number"
            className="w-full rounded-lg border border-border bg-background p-1.5 text-sm"
            placeholder="Sort order (lower = higher up)"
            value={editing.sort_order ?? 100}
            onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
          />
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={editing.enabled ?? true}
              onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })}
            />
            Enabled
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(null)}
              className="flex-1 rounded-lg border border-border px-2 py-1.5"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                await upsertFn({
                  data: {
                    id: editing.id,
                    category: editing.category || "general",
                    title: editing.title || "",
                    answer: editing.answer || "",
                    sort_order: editing.sort_order ?? 100,
                    enabled: editing.enabled ?? true,
                  },
                });
                setEditing(null);
                qc.invalidateQueries({ queryKey: ["chatbot-admin-kb"] });
              }}
              className="flex-1 rounded-lg bg-violet px-2 py-1.5 font-semibold text-white"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
function ConfigPane() {
  const getFn = useServerFn(adminGetConfig);
  const saveFn = useServerFn(adminSaveConfig);
  const hookFn = useServerFn(adminSetTelegramWebhook);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["chatbot-admin-cfg"],
    queryFn: () => getFn(),
  });
  const [f, setF] = useState<ChatbotConfig | null>(null);
  const [webhookStatus, setWebhookStatus] = useState<string>("");

  useEffect(() => {
    if (data) setF(data);
  }, [data]);

  const webhookUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/api/public/telegram/webhook`;
  }, []);

  if (isLoading || !f) return <div className="text-sm">Loading…</div>;

  return (
    <div className="max-w-2xl space-y-3 text-sm">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={f.enabled}
          onChange={(e) => setF({ ...f, enabled: e.target.checked })}
        />
        <span className="font-semibold">Chatbot enabled on the site</span>
      </label>

      <div>
        <label className="mb-1 block text-xs font-semibold">Greeting message</label>
        <input
          className="w-full rounded-lg border border-border bg-background p-2"
          value={f.greeting}
          onChange={(e) => setF({ ...f, greeting: e.target.value })}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold">Human hours note</label>
        <textarea
          className="w-full rounded-lg border border-border bg-background p-2"
          rows={2}
          value={f.human_hours_note}
          onChange={(e) => setF({ ...f, human_hours_note: e.target.value })}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold">
          Telegram admin chat ID
          <span className="ml-1 font-normal text-muted-foreground">
            (from @userinfobot on Telegram)
          </span>
        </label>
        <input
          className="w-full rounded-lg border border-border bg-background p-2 font-mono"
          placeholder="123456789"
          value={f.telegram_admin_chat_id}
          onChange={(e) => setF({ ...f, telegram_admin_chat_id: e.target.value })}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold">
          Ticket webhook URL <span className="font-normal text-muted-foreground">(optional — your PHP SMTP endpoint)</span>
        </label>
        <input
          className="w-full rounded-lg border border-border bg-background p-2"
          placeholder="https://yourdomain.com/api/ticket.php"
          value={f.ticket_webhook_url}
          onChange={(e) => setF({ ...f, ticket_webhook_url: e.target.value })}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={async () => {
            await saveFn({ data: f });
            qc.invalidateQueries({ queryKey: ["chatbot-admin-cfg"] });
          }}
          className="rounded-lg bg-violet px-4 py-2 font-semibold text-white"
        >
          Save config
        </button>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-secondary/50 p-3">
        <div className="font-semibold">Telegram webhook</div>
        <div className="mt-1 text-xs text-muted-foreground">
          One-time: register this URL with Telegram so your bot forwards messages here.
        </div>
        <div className="mt-2 flex gap-2">
          <input readOnly value={webhookUrl} className="flex-1 rounded-lg border border-border bg-background p-2 font-mono text-xs" />
          <button
            onClick={async () => {
              setWebhookStatus("Registering…");
              try {
                const r = await hookFn({ data: { webhookUrl } });
                setWebhookStatus(r.ok ? "✓ Registered" : `Failed: ${r.description || ""}`);
              } catch (e: any) {
                setWebhookStatus(`Failed: ${e?.message || e}`);
              }
            }}
            className="rounded-lg bg-violet px-3 py-2 text-sm font-semibold text-white"
          >
            Register
          </button>
        </div>
        {webhookStatus && <div className="mt-2 text-xs">{webhookStatus}</div>}
      </div>
    </div>
  );
}
