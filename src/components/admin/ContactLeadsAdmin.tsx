import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, RefreshCw, Trash2, Mail, Building2, ExternalLink } from "@/components/admin/AdminIcons";
import {
  adminListContactLeads,
  adminUpdateContactLead,
  adminDeleteContactLead,
  type ContactLead,
  type LeadStatus,
} from "@/lib/contact-leads.functions";

const STATUS_OPTIONS: LeadStatus[] = ["new", "contacted", "qualified", "archived"];

const STATUS_STYLES: Record<LeadStatus, string> = {
  new: "bg-violet/10 text-violet",
  contacted: "bg-amber-500/10 text-amber-600",
  qualified: "bg-emerald/10 text-emerald",
  archived: "bg-muted text-muted-foreground",
};

export function ContactLeadsAdmin() {
  const listFn = useServerFn(adminListContactLeads);
  const updateFn = useServerFn(adminUpdateContactLead);
  const deleteFn = useServerFn(adminDeleteContactLead);

  const [tab, setTab] = useState<LeadStatus | "all">("new");
  const [busy, setBusy] = useState<string | null>(null);
  const [notesFor, setNotesFor] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin-contact-leads"],
    queryFn: () => listFn(),
    staleTime: 15_000,
  });

  const leads = data ?? [];
  const filtered = tab === "all" ? leads : leads.filter((l) => l.status === tab);
  const counts = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.status] = (acc[l.status] ?? 0) + 1;
    return acc;
  }, {});

  async function setStatus(id: string, status: LeadStatus) {
    setBusy(id);
    try {
      await updateFn({ data: { id, status } });
      await refetch();
    } finally {
      setBusy(null);
    }
  }
  async function saveNotes(id: string) {
    setBusy(id);
    try {
      await updateFn({ data: { id, notes: notesDraft } });
      setNotesFor(null);
      setNotesDraft("");
      await refetch();
    } finally {
      setBusy(null);
    }
  }
  async function remove(id: string) {
    if (!confirm("Delete this lead permanently?")) return;
    setBusy(id);
    try {
      await deleteFn({ data: { id } });
      await refetch();
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div>
          <h2 className="font-display text-lg font-bold">Contact leads</h2>
          <p className="text-xs text-muted-foreground">
            {leads.length} total · {counts.new ?? 0} new · {counts.contacted ?? 0} contacted ·{" "}
            {counts.qualified ?? 0} qualified
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
        >
          <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </button>
      </header>

      <div className="flex flex-wrap gap-1 border-b border-border px-2 py-2">
        {(["new", "contacted", "qualified", "archived", "all"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
              tab === k ? "bg-violet text-white" : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            {k}
            {k !== "all" && counts[k] > 0 && <span className="ml-1.5 opacity-80">({counts[k]})</span>}
          </button>
        ))}
      </div>

      <div className="divide-y divide-border">
        {isLoading && (
          <div className="grid place-items-center py-16 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">No leads here yet.</div>
        )}
        {filtered.map((l) => (
          <LeadRow
            key={l.id}
            lead={l}
            busy={busy === l.id}
            onStatus={(s) => setStatus(l.id, s)}
            onDelete={() => remove(l.id)}
            notesOpen={notesFor === l.id}
            notesDraft={notesDraft}
            setNotesDraft={setNotesDraft}
            onOpenNotes={() => {
              setNotesFor(l.id);
              setNotesDraft(l.notes ?? "");
            }}
            onCancelNotes={() => {
              setNotesFor(null);
              setNotesDraft("");
            }}
            onSaveNotes={() => saveNotes(l.id)}
          />
        ))}
      </div>
    </section>
  );
}

function LeadRow(props: {
  lead: ContactLead;
  busy: boolean;
  onStatus: (s: LeadStatus) => void;
  onDelete: () => void;
  notesOpen: boolean;
  notesDraft: string;
  setNotesDraft: (s: string) => void;
  onOpenNotes: () => void;
  onCancelNotes: () => void;
  onSaveNotes: () => void;
}) {
  const { lead: l, busy } = props;
  return (
    <div className="grid gap-3 p-4 sm:grid-cols-[1fr_auto]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display font-semibold">{l.name}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[l.status]}`}
          >
            {l.status}
          </span>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
            {l.source}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <a href={`mailto:${l.email}`} className="inline-flex items-center gap-1 hover:text-violet">
            <Mail className="size-3" /> {l.email}
          </a>
          {l.company && (
            <span className="inline-flex items-center gap-1">
              <Building2 className="size-3" /> {l.company}
            </span>
          )}
          <span>{new Date(l.created_at).toLocaleString()}</span>
          {l.page_url && (
            <a
              href={l.page_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-violet"
            >
              <ExternalLink className="size-3" /> source
            </a>
          )}
        </div>
        <p className="mt-2 whitespace-pre-wrap rounded-md border border-border bg-secondary/40 p-2 text-sm">
          {l.message}
        </p>
        {l.notes && !props.notesOpen && (
          <p className="mt-2 rounded-md border border-violet/20 bg-violet/5 p-2 text-xs">
            <span className="mr-1 font-semibold text-violet">Note:</span>
            {l.notes}
          </p>
        )}
        {props.notesOpen && (
          <div className="mt-3 rounded-lg border border-border bg-secondary/40 p-3">
            <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Internal notes
            </label>
            <textarea
              value={props.notesDraft}
              onChange={(e) => props.setNotesDraft(e.target.value)}
              rows={3}
              maxLength={4000}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-violet"
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                onClick={props.onCancelNotes}
                className="rounded-md px-3 py-1 text-xs font-semibold text-muted-foreground"
              >
                Cancel
              </button>
              <button
                onClick={props.onSaveNotes}
                disabled={busy}
                className="rounded-md bg-violet px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
              >
                Save note
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:items-end">
        <select
          value={l.status}
          disabled={busy}
          onChange={(e) => props.onStatus(e.target.value as LeadStatus)}
          className="rounded-md border border-border bg-background px-2 py-1 text-xs font-semibold capitalize outline-none focus:border-violet"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {!props.notesOpen && (
          <button
            onClick={props.onOpenNotes}
            className="rounded-md border border-border bg-background px-3 py-1 text-xs font-semibold hover:bg-muted"
          >
            {l.notes ? "Edit note" : "Add note"}
          </button>
        )}
        <button
          onClick={props.onDelete}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold text-muted-foreground hover:text-coral"
        >
          <Trash2 className="size-3.5" /> Delete
        </button>
      </div>
    </div>
  );
}
