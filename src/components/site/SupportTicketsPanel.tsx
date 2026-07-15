import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listMySupportTickets,
  getMySupportTicket,
  replySupportTicket,
  closeMySupportTicket,
} from "@/lib/support-tickets.functions";
import { SupportTicketModal } from "./SupportTicketModal";
import {
  LifeBuoy,
  Loader2,
  MessageCircle,
  Plus,
  Send,
  X,
  CheckCircle2,
  Clock,
  ChevronLeft,
} from "lucide-react";

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-neon-orange/15 text-neon-orange border-neon-orange/30" },
  in_progress: { label: "In progress", className: "bg-violet/15 text-violet border-violet/30" },
  waiting_customer: {
    label: "Awaiting you",
    className: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  },
  resolved: { label: "Resolved", className: "bg-emerald/15 text-emerald border-emerald/30" },
  closed: { label: "Closed", className: "bg-muted text-muted-foreground border-border" },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.open;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${s.className}`}
    >
      {s.label}
    </span>
  );
}

export function SupportTicketsPanel() {
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const listFn = useServerFn(listMySupportTickets);
  const { data = [], isLoading } = useQuery({
    queryKey: ["my-support-tickets"],
    queryFn: () => listFn(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
            Support tickets
          </span>
          <h2 className="mt-0.5 font-display text-lg font-semibold">Your open issues</h2>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet to-indigo px-4 py-2 text-sm font-semibold text-white shadow-md shadow-violet/25 transition-transform hover:scale-[1.02]"
        >
          <Plus className="size-4" /> New ticket
        </button>
      </div>

      {isLoading ? (
        <div className="grid place-items-center rounded-2xl border border-border bg-card p-16">
          <Loader2 className="size-6 animate-spin text-violet" />
        </div>
      ) : data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-violet/10 text-violet">
            <LifeBuoy className="size-5" />
          </div>
          <h3 className="mt-3 font-display text-base font-semibold">No tickets yet</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Have a problem with an order, payment, or delivery? Open a ticket and our team will
            respond by email.
          </p>
          <button
            onClick={() => setCreating(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="size-4" /> Open a ticket
          </button>
        </div>
      ) : (
        <ul className="grid gap-2">
          {data.map((t: any) => (
            <li key={t.id}>
              <button
                onClick={() => setOpenId(t.id)}
                className="group flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-violet/40 hover:shadow-lg hover:shadow-violet/10"
              >
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet/10 text-violet">
                  <MessageCircle className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold">{t.subject}</span>
                    <StatusPill status={t.status} />
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {t.category}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Clock className="size-3" />
                    {new Date(t.last_message_at).toLocaleString()}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <SupportTicketModal open={creating} onClose={() => setCreating(false)} onCreated={setOpenId} />
      {openId && <TicketThreadDrawer id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function TicketThreadDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient();
  const getFn = useServerFn(getMySupportTicket);
  const replyFn = useServerFn(replySupportTicket);
  const closeFn = useServerFn(closeMySupportTicket);
  const [body, setBody] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["my-support-ticket", id],
    queryFn: () => getFn({ data: { id } }),
    refetchInterval: 15000,
  });

  const reply = useMutation({
    mutationFn: (input: { body: string }) =>
      replyFn({ data: { ticket_id: id, body: input.body } }),
    onSuccess: () => {
      setBody("");
      refetch();
      qc.invalidateQueries({ queryKey: ["my-support-tickets"] });
    },
  });

  const closeM = useMutation({
    mutationFn: () => closeFn({ data: { id } }),
    onSuccess: () => {
      refetch();
      qc.invalidateQueries({ queryKey: ["my-support-tickets"] });
    },
  });

  const isClosed = data?.ticket?.status === "closed";

  return (
    <div className="fixed inset-0 z-[110] flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="flex h-full w-full flex-col bg-background sm:max-w-lg sm:border-l sm:border-border">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground sm:hidden"
          >
            <ChevronLeft className="size-4" /> Back
          </button>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
              Ticket · {data?.ticket?.category ?? "…"}
            </div>
            <div className="mt-0.5 truncate font-display text-lg font-semibold">
              {data?.ticket?.subject ?? "Loading…"}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {data?.ticket && <StatusPill status={data.ticket.status} />}
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                priority: {data?.ticket?.priority ?? "—"}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="hidden rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground sm:block"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {isLoading ? (
            <div className="grid place-items-center py-16">
              <Loader2 className="size-6 animate-spin text-violet" />
            </div>
          ) : (
            data?.messages?.map((m: any) => <MessageBubble key={m.id} m={m} />)
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-border bg-card px-5 py-4">
          {isClosed ? (
            <div className="rounded-xl border border-border bg-muted/40 p-3 text-center text-sm text-muted-foreground">
              This ticket is closed. Open a new ticket if you need more help.
            </div>
          ) : (
            <>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                maxLength={4000}
                placeholder="Write a reply…"
                className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-violet focus:outline-none"
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <button
                  onClick={() => closeM.mutate()}
                  disabled={closeM.isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
                >
                  <CheckCircle2 className="size-3.5" /> Mark as resolved
                </button>
                <button
                  onClick={() => reply.mutate({ body: body.trim() })}
                  disabled={reply.isPending || body.trim().length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet to-indigo px-4 py-2 text-sm font-semibold text-white shadow-md shadow-violet/25 transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {reply.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  Send
                </button>
              </div>
              {reply.isError && (
                <div className="mt-2 text-xs text-destructive">
                  {(reply.error as Error)?.message ?? "Failed to send."}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ m }: { m: any }) {
  const role = m.sender_role as "customer" | "admin" | "system";
  if (role === "system") {
    return (
      <div className="mx-auto max-w-xs rounded-full border border-dashed border-border bg-muted/40 px-3 py-1 text-center text-[11px] text-muted-foreground">
        {m.body}
      </div>
    );
  }
  const mine = role === "customer";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
          mine
            ? "bg-gradient-to-br from-violet to-indigo text-white"
            : "border border-border bg-card text-foreground"
        }`}
      >
        <div className="mb-0.5 flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider opacity-80">
          {mine ? "You" : "Support"} · {new Date(m.created_at).toLocaleString()}
        </div>
        <div className="whitespace-pre-wrap">{m.body}</div>
      </div>
    </div>
  );
}
