import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, X, ArrowLeft, User, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMyProfile } from "@/hooks/use-my-profile";
import {
  createOrder,
  createTicket,
  getChatbotPublicConfig,
  listKb,
  listMessages,
  lookupOrder,
  postMessage,
  requestHumanHandoff,
  startConversation,
  type ChatMessage,
  type KbEntry,
} from "@/lib/chatbot.functions";

// ---------------------------------------------------------------------------
// Types & storage
// ---------------------------------------------------------------------------
type Screen =
  | { name: "greet" }
  | { name: "menu" }
  | { name: "services" }
  | { name: "catalog" }
  | { name: "faq" }
  | { name: "policies" }
  | { name: "pages" }
  | { name: "blog" }
  | { name: "quote" }
  | { name: "order-form"; service: string; amount: number }
  | { name: "order-status" }
  | { name: "ticket" }
  | { name: "live" };

const LS_SESSION = "chatbot.session";
const LS_NAME = "chatbot.name";
const LS_EMAIL = "chatbot.email";

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function newSessionId() {
  return (
    "s_" +
    Math.random().toString(36).slice(2, 10) +
    Date.now().toString(36).slice(-4)
  );
}

function useLocalString(key: string) {
  const [v, setV] = useState<string>("");
  useEffect(() => {
    try {
      setV(localStorage.getItem(key) || "");
    } catch {}
  }, [key]);
  const set = (n: string) => {
    setV(n);
    try {
      localStorage.setItem(key, n);
    } catch {}
  };
  return [v, set] as const;
}

// ---------------------------------------------------------------------------
// Small UI helpers
// ---------------------------------------------------------------------------
function Bubble({ m }: { m: ChatMessage | { sender: string; text: string; id?: string } }) {
  const mine = m.sender === "user";
  const admin = m.sender === "admin";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${
          mine
            ? "bg-violet text-white rounded-br-sm"
            : admin
              ? "bg-emerald-500 text-white rounded-bl-sm"
              : "bg-secondary text-foreground rounded-bl-sm"
        }`}
      >
        {admin && <div className="text-[10px] font-bold opacity-80 mb-0.5">Team</div>}
        {m.text}
      </div>
    </div>
  );
}

function QuickButton({
  onClick,
  children,
  disabled,
}: {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full text-left rounded-xl border border-border bg-background hover:bg-secondary transition-colors px-3 py-2 text-sm font-medium text-foreground disabled:opacity-50"
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Widget
// ---------------------------------------------------------------------------
export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [greeting, setGreeting] = useState("Hi! What's your name?");
  const [name, setName] = useLocalString(LS_NAME);
  const [email, setEmail] = useLocalString(LS_EMAIL);
  const [sessionId, setSessionId] = useLocalString(LS_SESSION);
  const [screen, setScreen] = useState<Screen>({ name: "greet" });
  const [messages, setMessages] = useState<
    Array<ChatMessage | { sender: string; text: string; id: string; created_at?: string }>
  >([]);
  const [input, setInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [kb, setKb] = useState<KbEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<"bot" | "live" | "closed">("bot");
  const [authChecked, setAuthChecked] = useState(false);

  const cfgFn = useServerFn(getChatbotPublicConfig);
  const kbFn = useServerFn(listKb);
  const startFn = useServerFn(startConversation);
  const listMsgFn = useServerFn(listMessages);
  const postFn = useServerFn(postMessage);
  const lookupFn = useServerFn(lookupOrder);
  const orderFn = useServerFn(createOrder);
  const ticketFn = useServerFn(createTicket);
  const handoffFn = useServerFn(requestHumanHandoff);

  // Load config once
  useEffect(() => {
    cfgFn()
      .then((c) => {
        setEnabled(c.enabled);
        setGreeting(c.greeting || "Hi! What's your name?");
      })
      .catch(() => setEnabled(true));
    kbFn()
      .then((rows) => setKb(rows))
      .catch(() => setKb([]));
  }, [cfgFn, kbFn]);

  // Prefill from PHP-API auth + live profile row
  const { data: profile } = useMyProfile();
  const { user } = useAuth();
  useEffect(() => {
    if (user?.email) {
      const meta = (user.user_metadata || {}) as Record<string, string>;
      const displayName =
        (profile?.full_name as string | undefined) ||
        meta.full_name ||
        (meta as Record<string, string>).name ||
        (meta as Record<string, string>).display_name ||
        user.email.split("@")[0];
      if (!name) setName(displayName);
      if (!email) setEmail(user.email);
    }
    setAuthChecked(true);
  }, [profile?.full_name, user?.email]); // eslint-disable-line react-hooks/exhaustive-deps

  // Bootstrap session on open
  useEffect(() => {
    if (!open || !authChecked) return;
    let sid = sessionId;
    if (!sid) {
      sid = newSessionId();
      setSessionId(sid);
    }
    const hasLead = !!name && isValidEmail(email);
    if (hasLead) {
      // returning / logged-in visitor — jump to menu
      (async () => {
        try {
          const conv = await startFn({
            data: { sessionId: sid!, visitorName: name, email },
          });
          setConversationId(conv.id);
          setLiveStatus(conv.status);
          const rows = await listMsgFn({ data: { sessionId: sid! } });
          setMessages(rows);
          setScreen(rows.length ? (conv.status === "live" ? { name: "live" } : { name: "menu" }) : { name: "menu" });
          if (!rows.length) {
            setMessages([
              { id: "bot-hi", sender: "bot", text: `Welcome back, ${name}! How can we help today?` },
            ]);
          }
        } catch (e) {
          console.error(e);
        }
      })();
    } else {
      setMessages([
        {
          id: "bot-hi",
          sender: "bot",
          text: "Hi! Before we start, please share your name and email so our team can follow up.",
        },
      ]);
      setScreen({ name: "greet" });
    }
  }, [open, authChecked]); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll for new messages + conversation status (Supabase realtime removed
  // as part of the PHP migration). Every 4s while the widget is open.
  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;
    const tick = async () => {
      if (cancelled || !sessionId) return;
      try {
        const rows = await listMsgFn({ data: { sessionId } });
        setMessages((prev) => {
          // Merge new rows we haven't seen yet
          const seen = new Set(prev.map((m) => (m as { id?: string }).id).filter(Boolean));
          const merged = [...prev];
          for (const r of rows) {
            const id = (r as { id?: string }).id;
            if (id && !seen.has(id)) merged.push(r);
          }
          return merged;
        });
      } catch {
        /* ignore transient errors */
      }
    };
    const iv = window.setInterval(tick, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(iv);
    };
  }, [conversationId, sessionId, listMsgFn]);

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, screen]);

  const kbByCategory = useMemo(() => {
    const map = new Map<string, KbEntry[]>();
    for (const k of kb) {
      const list = map.get(k.category) ?? [];
      list.push(k);
      map.set(k.category, list);
    }
    return map;
  }, [kb]);

  function addLocal(sender: "user" | "bot", text: string) {
    setMessages((p) => [
      ...p,
      { id: `local-${Date.now()}-${Math.random()}`, sender, text },
    ]);
  }

  async function ensureConversation(nameOverride?: string, emailOverride?: string) {
    let sid = sessionId;
    if (!sid) {
      sid = newSessionId();
      setSessionId(sid);
    }
    const conv = await startFn({
      data: {
        sessionId: sid,
        visitorName: nameOverride || name || "Visitor",
        email: emailOverride || email || undefined,
      },
    });
    setConversationId(conv.id);
    setLiveStatus(conv.status);
    return { sid, conv };
  }

  async function saveUserMessage(text: string) {
    try {
      const { sid } = await ensureConversation();
      await postFn({ data: { sessionId: sid, sender: "user", text } });
    } catch (e) {
      console.error(e);
    }
  }

  async function submitLead() {
    const n = input.trim();
    const em = emailInput.trim();
    if (!n) return;
    if (!isValidEmail(em)) {
      addLocal("bot", "Please enter a valid email so we can follow up.");
      return;
    }
    setBusy(true);
    setName(n);
    setEmail(em);
    addLocal("user", `${n} — ${em}`);
    setInput("");
    setEmailInput("");
    await ensureConversation(n, em);
    addLocal("bot", `Nice to meet you, ${n}! How can I help today?`);
    setScreen({ name: "menu" });
    setBusy(false);
  }

  // ---- keyword router (fallback for free typing) ---------------------------
  function routeKeyword(txt: string): Screen | null {
    const t = txt.toLowerCase();
    if (/human|agent|talk to|person|representative/.test(t)) return { name: "live" };
    if (/(order|status|track).*(id|number|#|ord-)|ord-\d+|my order/.test(t)) return { name: "order-status" };
    if (/(complain|broken|bug|not working|refund|issue|problem|ticket)/.test(t)) return { name: "ticket" };
    if (/(catalog|store|shopify|fortune|saas|founder|ecom|healthcare|real estate|fintech|cmo)/.test(t)) return { name: "catalog" };
    if (/(price|cost|quote|apollo|zoominfo|linkedin|manual|research|pricing)/.test(t)) return { name: "quote" };
    if (/(service|website|app|ads?|google|meta|facebook|logo|pixel|design)/.test(t)) return { name: "services" };
    if (/(faq|question|delivery|format|sample|country|bounce|gdpr|payment|resell)/.test(t)) return { name: "faq" };
    if (/(refund|privacy|terms|policy|policies|legal)/.test(t)) return { name: "policies" };
    if (/(blog|guide|article|deliverability|icp|crm)/.test(t)) return { name: "blog" };
    if (/(page|link|where|find|contact)/.test(t)) return { name: "pages" };
    return null;
  }

  // Search KB for best-matching entry (token overlap)
  function searchKb(q: string): KbEntry | null {
    const tokens = q.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
    if (!tokens.length) return null;
    let best: { entry: KbEntry; score: number } | null = null;
    for (const k of kb) {
      const hay = `${k.title} ${k.answer} ${k.category}`.toLowerCase();
      let score = 0;
      for (const tok of tokens) if (hay.includes(tok)) score++;
      if (score > 0 && (!best || score > best.score)) best = { entry: k, score };
    }
    return best && best.score >= Math.min(2, tokens.length) ? best.entry : null;
  }

  async function handleFreeText() {
    const t = input.trim();
    if (!t) return;
    setInput("");
    addLocal("user", t);
    await saveUserMessage(t);

    // If we're in live mode the message goes to the human via the server fn
    if (liveStatus === "live") return;

    // Try direct KB match first — that's the "smart" answer
    const hit = searchKb(t);
    if (hit) {
      addLocal("bot", `**${hit.title}**\n${hit.answer}`);
      return;
    }

    const next = routeKeyword(t);
    if (next) {
      addLocal("bot", "Here's what might help:");
      setScreen(next);
    } else {
      addLocal("bot", "I didn't quite catch that — pick an option below, or ask again in different words:");
      setScreen({ name: "menu" });
    }
  }

  async function handoff() {
    setBusy(true);
    addLocal("bot", "Connecting you to the team…");
    try {
      const { sid } = await ensureConversation();
      const last =
        [...messages].reverse().find((m) => m.sender === "user")?.text || "Live chat request";
      await handoffFn({ data: { sessionId: sid, lastMessage: last } });
      setScreen({ name: "live" });
    } catch (e) {
      console.error(e);
      addLocal("bot", "Couldn't reach the team right now. Please raise a ticket.");
      setScreen({ name: "ticket" });
    }
    setBusy(false);
  }

  // ---------------------------------------------------------------------------
  if (enabled === false) return null;

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          type="button"
          aria-label="Open chat"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-[60] flex size-14 items-center justify-center rounded-full bg-violet text-white shadow-lg hover:bg-violet/90 transition-colors"
        >
          <MessageCircle className="size-6" />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-[60] flex h-[600px] max-h-[85vh] w-[380px] max-w-[calc(100vw-2rem)] flex-col rounded-2xl border border-border bg-background shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-violet px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-white/20">
                <MessageCircle className="size-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">Support</div>
                <div className="text-[11px] opacity-80">
                  {liveStatus === "live" ? "Connected to team" : "We reply fast"}
                </div>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 hover:bg-white/10"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 bg-background">
            {messages.map((m) => (
              <Bubble key={(m as any).id} m={m as any} />
            ))}

            {/* Screen-specific button blocks */}
            {screen.name === "greet" && (
              <div className="mt-2 space-y-2 rounded-xl border border-border p-3">
                <div className="text-xs font-semibold text-muted-foreground">
                  Get started
                </div>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitLead()}
                  placeholder="Your name"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-violet"
                />
                <input
                  value={emailInput}
                  type="email"
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitLead()}
                  placeholder="Your email"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-violet"
                />
                <button
                  type="button"
                  onClick={submitLead}
                  disabled={busy || !input.trim() || !isValidEmail(emailInput)}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-violet px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <User className="size-4" />
                  Start chatting
                </button>
                <div className="text-[10px] text-muted-foreground">
                  We only use this to reply to you. No spam.
                </div>
              </div>
            )}

            {screen.name === "menu" && (
              <div className="mt-2 space-y-2">
                <QuickButton onClick={() => setScreen({ name: "catalog" })}>
                  🗂️ Browse lead catalog (9 lists)
                </QuickButton>
                <QuickButton onClick={() => setScreen({ name: "services" })}>
                  💼 Our services
                </QuickButton>
                <QuickButton onClick={() => setScreen({ name: "quote" })}>
                  💰 Get a leads quote
                </QuickButton>
                <QuickButton
                  onClick={() =>
                    setScreen({ name: "order-form", service: "Custom order", amount: 0 })
                  }
                >
                  🛒 Place a custom order
                </QuickButton>
                <QuickButton onClick={() => setScreen({ name: "order-status" })}>
                  📦 Check order status
                </QuickButton>
                <QuickButton onClick={() => setScreen({ name: "faq" })}>
                  ❓ FAQ (delivery, formats, samples)
                </QuickButton>
                <QuickButton onClick={() => setScreen({ name: "pages" })}>
                  🧭 Site pages & quick links
                </QuickButton>
                <QuickButton onClick={() => setScreen({ name: "blog" })}>
                  📰 Blog & guides
                </QuickButton>
                <QuickButton onClick={() => setScreen({ name: "policies" })}>
                  📜 Policies (refund, privacy, terms)
                </QuickButton>
                <QuickButton onClick={() => setScreen({ name: "ticket" })}>
                  🎫 Raise a support ticket
                </QuickButton>
                <QuickButton onClick={handoff} disabled={busy}>
                  🧑‍💼 Talk to a human
                </QuickButton>
              </div>
            )}

            {(screen.name === "services" ||
              screen.name === "catalog" ||
              screen.name === "faq" ||
              screen.name === "policies" ||
              screen.name === "pages" ||
              screen.name === "blog") && (
              <ScreenKbList
                category={screen.name}
                kbByCategory={kbByCategory}
                onAnswer={(a) => addLocal("bot", a)}
                onBack={() => setScreen({ name: "menu" })}
              />
            )}

            {screen.name === "quote" && (
              <ScreenQuote
                onPick={(service, amount) => {
                  addLocal("user", `Interested in ${service} — $${amount}`);
                  setScreen({ name: "order-form", service, amount });
                }}
                onBack={() => setScreen({ name: "menu" })}
              />
            )}

            {screen.name === "order-form" && (
              <ScreenOrderForm
                service={screen.service}
                amount={screen.amount}
                defaultName={name}
                defaultEmail={email}
                busy={busy}
                onSubmit={async (payload) => {
                  setBusy(true);
                  try {
                    await ensureConversation();
                    const r = await orderFn({ data: payload });
                    addLocal(
                      "bot",
                      `✅ Order placed! Your order ID is ${r.order_id}. We'll email updates to ${payload.email}.`,
                    );
                    setScreen({ name: "menu" });
                  } catch (e: any) {
                    addLocal("bot", `Sorry, that didn't go through: ${e?.message || "error"}`);
                  }
                  setBusy(false);
                }}
                onBack={() => setScreen({ name: "menu" })}
              />
            )}

            {screen.name === "order-status" && (
              <ScreenOrderStatus
                busy={busy}
                onLookup={async (orderId) => {
                  setBusy(true);
                  addLocal("user", `Order: ${orderId}`);
                  try {
                    const r = await lookupFn({ data: { orderId } });
                    if (r.found && r.order) {
                      addLocal(
                        "bot",
                        `📦 ${r.order.order_id}\nService: ${r.order.service}\nStatus: ${r.order.status}\nAmount: $${r.order.amount}\n${r.order.notes ? `Notes: ${r.order.notes}` : ""}`,
                      );
                    } else {
                      addLocal("bot", "I couldn't find that order. Want to raise a ticket or talk to a human?");
                    }
                  } catch (e: any) {
                    addLocal("bot", "Something went wrong looking that up.");
                  }
                  setBusy(false);
                  setScreen({ name: "menu" });
                }}
                onBack={() => setScreen({ name: "menu" })}
              />
            )}

            {screen.name === "ticket" && (
              <ScreenTicket
                defaultName={name}
                defaultEmail={email}
                busy={busy}
                onSubmit={async (payload) => {
                  setBusy(true);
                  try {
                    const r = await ticketFn({ data: payload });
                    addLocal(
                      "bot",
                      `✅ Ticket ${r.ticket_no} created. Our team will get back to you at ${payload.email}.`,
                    );
                    setScreen({ name: "menu" });
                  } catch (e: any) {
                    addLocal("bot", `Ticket failed: ${e?.message || "error"}`);
                  }
                  setBusy(false);
                }}
                onBack={() => setScreen({ name: "menu" })}
              />
            )}

            {screen.name === "live" && (
              <div className="mt-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-400">
                You're connected to a team member. Just type your message below.
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-border p-2">
            {screen.name !== "greet" && (
              <div className="flex items-end gap-2">
                {screen.name !== "menu" && (
                  <button
                    onClick={() => setScreen({ name: "menu" })}
                    className="rounded-xl p-2 text-muted-foreground hover:bg-secondary"
                    aria-label="Back to menu"
                    type="button"
                  >
                    <ArrowLeft className="size-4" />
                  </button>
                )}
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleFreeText();
                    }
                  }}
                  rows={1}
                  placeholder={
                    liveStatus === "live"
                      ? "Message the team…"
                      : "Type a message, or use the buttons above"
                  }
                  className="flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-violet max-h-24"
                />
                <button
                  onClick={handleFreeText}
                  disabled={busy || !input.trim()}
                  className="rounded-xl bg-violet p-2 text-white disabled:opacity-50"
                  aria-label="Send"
                  type="button"
                >
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Sub-screens
// ---------------------------------------------------------------------------
const CATEGORY_LABELS: Record<string, string> = {
  services: "Our services",
  catalog: "Prebuilt lead lists",
  faq: "Frequently asked",
  policies: "Policies",
  pages: "Site pages",
  blog: "Blog & guides",
};

function ScreenKbList({
  category,
  kbByCategory,
  onAnswer,
  onBack,
}: {
  category: string;
  kbByCategory: Map<string, KbEntry[]>;
  onAnswer: (a: string) => void;
  onBack: () => void;
}) {
  const rows = kbByCategory.get(category) ?? [];
  return (
    <div className="mt-2 space-y-2">
      <div className="text-xs font-semibold text-muted-foreground px-1">
        {CATEGORY_LABELS[category] ?? category}
      </div>
      {rows.length === 0 && (
        <div className="text-xs text-muted-foreground px-1">Nothing here yet.</div>
      )}
      {rows.map((k) => (
        <QuickButton
          key={k.id}
          onClick={() => onAnswer(`**${k.title}**\n${k.answer}`)}
        >
          {k.title}
        </QuickButton>
      ))}
      <QuickButton onClick={onBack}>⬅ Back to menu</QuickButton>
    </div>
  );
}

function ScreenQuote({
  onPick,
  onBack,
}: {
  onPick: (service: string, amount: number) => void;
  onBack: () => void;
}) {
  return (
    <div className="mt-2 space-y-2">
      <QuickButton onClick={() => onPick("5,000 Apollo leads", 20)}>
        5,000 leads — $20
      </QuickButton>
      <QuickButton onClick={() => onPick("10,000 Apollo leads", 35)}>
        10,000 leads — $35
      </QuickButton>
      <QuickButton onClick={onBack}>⬅ Back to menu</QuickButton>
    </div>
  );
}

function ScreenOrderForm({
  service,
  amount,
  defaultName,
  defaultEmail,
  busy,
  onSubmit,
  onBack,
}: {
  service: string;
  amount: number;
  defaultName: string;
  defaultEmail: string;
  busy: boolean;
  onSubmit: (p: {
    customer_name: string;
    email: string;
    service: string;
    details: string;
    quantity: number;
    amount: number;
  }) => void;
  onBack: () => void;
}) {
  const [f, setF] = useState({
    customer_name: defaultName || "",
    email: defaultEmail || "",
    service,
    details: "",
    quantity: 0,
    amount,
  });
  return (
    <div className="mt-2 space-y-2 rounded-xl border border-border p-3">
      <div className="text-xs font-semibold text-muted-foreground">Order — {service}</div>
      <input
        value={f.customer_name}
        onChange={(e) => setF({ ...f, customer_name: e.target.value })}
        placeholder="Your name"
        className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
      />
      <input
        value={f.email}
        type="email"
        onChange={(e) => setF({ ...f, email: e.target.value })}
        placeholder="Your email"
        className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
      />
      {service === "Custom order" && (
        <>
          <input
            value={f.service}
            onChange={(e) => setF({ ...f, service: e.target.value })}
            placeholder="What service?"
            className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
          />
          <input
            value={f.amount || ""}
            type="number"
            onChange={(e) => setF({ ...f, amount: Number(e.target.value) })}
            placeholder="Budget ($) — optional"
            className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
          />
        </>
      )}
      <textarea
        value={f.details}
        onChange={(e) => setF({ ...f, details: e.target.value })}
        placeholder="Details / requirements"
        rows={3}
        className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
      />
      <div className="flex gap-2">
        <button
          onClick={onBack}
          type="button"
          className="rounded-lg border border-border px-3 py-1.5 text-sm"
        >
          Back
        </button>
        <button
          disabled={busy || !f.customer_name || !f.email}
          onClick={() => onSubmit(f)}
          type="button"
          className="flex-1 rounded-lg bg-violet px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Submitting…" : "Place order"}
        </button>
      </div>
    </div>
  );
}

function ScreenOrderStatus({
  busy,
  onLookup,
  onBack,
}: {
  busy: boolean;
  onLookup: (orderId: string) => void;
  onBack: () => void;
}) {
  const [id, setId] = useState("");
  return (
    <div className="mt-2 space-y-2 rounded-xl border border-border p-3">
      <div className="text-xs font-semibold text-muted-foreground">
        Enter your order ID (e.g. ORD-1042)
      </div>
      <input
        value={id}
        onChange={(e) => setId(e.target.value)}
        placeholder="ORD-1042"
        className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
      />
      <div className="flex gap-2">
        <button
          onClick={onBack}
          type="button"
          className="rounded-lg border border-border px-3 py-1.5 text-sm"
        >
          Back
        </button>
        <button
          disabled={busy || !id.trim()}
          onClick={() => onLookup(id.trim())}
          type="button"
          className="flex-1 rounded-lg bg-violet px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Looking up…" : "Check status"}
        </button>
      </div>
    </div>
  );
}

function ScreenTicket({
  defaultName,
  defaultEmail,
  busy,
  onSubmit,
  onBack,
}: {
  defaultName: string;
  defaultEmail: string;
  busy: boolean;
  onSubmit: (p: { name: string; email: string; issue: string }) => void;
  onBack: () => void;
}) {
  const [f, setF] = useState({ name: defaultName || "", email: defaultEmail || "", issue: "" });
  return (
    <div className="mt-2 space-y-2 rounded-xl border border-border p-3">
      <div className="text-xs font-semibold text-muted-foreground">Raise a support ticket</div>
      <input
        value={f.name}
        onChange={(e) => setF({ ...f, name: e.target.value })}
        placeholder="Your name"
        className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
      />
      <input
        value={f.email}
        type="email"
        onChange={(e) => setF({ ...f, email: e.target.value })}
        placeholder="Your email"
        className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
      />
      <textarea
        value={f.issue}
        onChange={(e) => setF({ ...f, issue: e.target.value })}
        placeholder="Describe your issue"
        rows={4}
        className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
      />
      <div className="flex gap-2">
        <button
          onClick={onBack}
          type="button"
          className="rounded-lg border border-border px-3 py-1.5 text-sm"
        >
          Back
        </button>
        <button
          disabled={busy || !f.name || !f.email || !f.issue}
          onClick={() => onSubmit(f)}
          type="button"
          className="flex-1 rounded-lg bg-violet px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Sending…" : "Submit ticket"}
        </button>
      </div>
    </div>
  );
}
