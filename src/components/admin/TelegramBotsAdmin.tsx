import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listTelegramBots, upsertTelegramBot, deleteTelegramBot, testTelegramBot } from "@/lib/admin-extras.functions";
import { Plus, Save, Trash2, Loader2, MessageSquare } from "@/components/admin/AdminIcons";

const EVENTS = [
  { id: "order.new", label: "New order" },
  { id: "order.paid", label: "Order paid" },
  { id: "order.delivered", label: "Order delivered" },
  { id: "ticket.new", label: "Support ticket" },
  { id: "contact.new", label: "Contact form" },
  { id: "review.new", label: "New review" },
];

type Bot = { id: string; name: string; bot_token: string; chat_id: string; events: string[]; active: boolean };

const empty = {
  id: null as string | null,
  name: "",
  bot_token: "",
  chat_id: "",
  events: ["order.new", "ticket.new"] as string[],
  active: true,
};

export function TelegramBotsAdmin() {
  const qc = useQueryClient();
  const listFn = (listTelegramBots);
  const upFn = upsertTelegramBot;
  const delFn = deleteTelegramBot;
  const testFn = testTelegramBot;
  const [draft, setDraft] = useState(empty);
  const [testMsg, setTestMsg] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["admin-telegram-bots"], queryFn: () => listFn() });
  const save = useMutation({
    mutationFn: () => upFn({ data: draft as any }),
    onSuccess: () => {
      setDraft(empty);
      qc.invalidateQueries({ queryKey: ["admin-telegram-bots"] });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-telegram-bots"] }),
  });
  const test = useMutation({
    mutationFn: (id: string) => testFn({ data: { id } }),
    onSuccess: (r) => setTestMsg(r.ok ? "✅ Test message sent." : `❌ Failed: ${JSON.stringify(r.response)}`),
    onError: (e) => setTestMsg(`❌ ${(e as Error).message}`),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="font-display text-lg font-black">Telegram bots</h3>
        <p className="mt-1 text-sm text-muted-foreground">Send instant notifications to Telegram for admin events.</p>
        {testMsg && <div className="mt-3 rounded-lg border border-border bg-secondary px-3 py-2 text-xs font-semibold">{testMsg}</div>}
        <div className="mt-4 divide-y divide-border">
          {isLoading && <div className="p-4 text-sm text-muted-foreground">Loading…</div>}
          {data?.bots?.map((b: Bot) => (
            <div key={b.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <MessageSquare className="size-4 text-primary" />
                  <span className="truncate font-semibold">{b.name}</span>
                  {!b.active && <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">off</span>}
                </div>
                <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">chat: {b.chat_id} · events: {(b.events ?? []).join(", ") || "none"}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button onClick={() => test.mutate(b.id)} disabled={test.isPending} className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-bold disabled:opacity-50">
                  Test
                </button>
                <button
                  onClick={() =>
                    setDraft({
                      id: b.id,
                      name: b.name,
                      bot_token: b.bot_token,
                      chat_id: b.chat_id,
                      events: b.events ?? [],
                      active: b.active,
                    })
                  }
                  className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-bold"
                >
                  Edit
                </button>
                <button
                  onClick={() => confirm("Delete this bot?") && remove.mutate(b.id)}
                  className="rounded-lg border border-border bg-background p-1.5 text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
          {!isLoading && !data?.bots?.length && <div className="p-6 text-center text-sm text-muted-foreground">No bots configured.</div>}
        </div>
      </section>

      <aside className="rounded-2xl border border-border bg-card p-4">
        <h3 className="font-display text-lg font-black">{draft.id ? "Edit bot" : "New bot"}</h3>
        <div className="mt-4 space-y-3">
          <Field label="Name">
            <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={input} />
          </Field>
          <Field label="Bot token">
            <input value={draft.bot_token} onChange={(e) => setDraft({ ...draft, bot_token: e.target.value })} className={input} placeholder="123456:AA…" />
          </Field>
          <Field label="Chat ID">
            <input value={draft.chat_id} onChange={(e) => setDraft({ ...draft, chat_id: e.target.value })} className={input} placeholder="-1001234567890" />
          </Field>
          <Field label="Events">
            <div className="grid grid-cols-2 gap-2">
              {EVENTS.map((e) => (
                <label key={e.id} className="flex items-center gap-2 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={draft.events.includes(e.id)}
                    onChange={(ev) =>
                      setDraft({
                        ...draft,
                        events: ev.target.checked ? [...draft.events, e.id] : draft.events.filter((x) => x !== e.id),
                      })
                    }
                  />
                  {e.label}
                </label>
              ))}
            </div>
          </Field>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} />
            Active
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            disabled={!draft.name || !draft.bot_token || !draft.chat_id || save.isPending}
            onClick={() => save.mutate()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : draft.id ? <Save className="size-4" /> : <Plus className="size-4" />}
            {draft.id ? "Save" : "Create"}
          </button>
          {draft.id && (
            <button onClick={() => setDraft(empty)} className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-bold">
              Cancel
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}

const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
