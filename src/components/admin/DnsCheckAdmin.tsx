import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Check, X, Copy, RefreshCw, ShieldCheck } from "lucide-react";

type RecordCheck = {
  host: string;
  type: string;
  found: boolean;
  value: unknown;
  all_txt?: string[];
  warnings?: string[];
  suggested?: string;
  hint?: string;
};
type DnsResp = {
  domain: string;
  selector: string;
  checked_at: string;
  records: { spf: RecordCheck; dkim: RecordCheck; dmarc: RecordCheck; mx: RecordCheck };
  summary: { spf_ok: boolean; dkim_ok: boolean; dmarc_ok: boolean };
};

function copy(text: string) {
  navigator.clipboard.writeText(text);
  toast.success("Copied");
}

function StatusPill({ ok, found }: { ok: boolean; found: boolean }) {
  if (ok) return <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1"><Check className="w-3 h-3" /> OK</Badge>;
  if (found) return <Badge className="bg-amber-500 hover:bg-amber-500 text-white">Present · Needs review</Badge>;
  return <Badge variant="destructive" className="gap-1"><X className="w-3 h-3" /> Missing</Badge>;
}

function RecordBlock({ title, rec, ok }: { title: string; rec: RecordCheck; ok: boolean }) {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground font-mono">{rec.type} · {rec.host}</div>
        </div>
        <StatusPill ok={ok} found={rec.found} />
      </div>

      {rec.found ? (
        <div className="rounded-md bg-muted p-3 text-xs font-mono break-all whitespace-pre-wrap">
          {typeof rec.value === "string" ? rec.value : JSON.stringify(rec.value, null, 2)}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">No {title} record found at this host.</div>
      )}

      {rec.warnings && rec.warnings.length > 0 && (
        <ul className="text-xs text-amber-700 list-disc pl-4 space-y-1">
          {rec.warnings.map((w, i) => <li key={i}>{w}</li>)}
        </ul>
      )}

      {rec.suggested && (
        <div className="space-y-1">
          <Label className="text-xs">Suggested TXT value</Label>
          <div className="flex gap-2">
            <div className="flex-1 rounded-md border bg-background p-2 text-xs font-mono break-all">{rec.suggested}</div>
            <Button size="icon" variant="outline" onClick={() => copy(rec.suggested!)}><Copy className="w-4 h-4" /></Button>
          </div>
        </div>
      )}
      {rec.hint && <p className="text-xs text-muted-foreground">{rec.hint}</p>}
    </Card>
  );
}

export function DnsCheckAdmin() {
  const [domain, setDomain] = useState("mail.emailsly.com");
  const [selector, setSelector] = useState("default");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DnsResp | null>(null);

  const run = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ domain, selector }).toString();
      const res = await api<DnsResp>(`/api/admin/dns-check?${q}`);
      setData(res);
    } catch (e: any) {
      toast.error(e?.message || "DNS check failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5" />
        <h2 className="text-xl font-bold">Email DNS Checker</h2>
      </div>
      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_200px_auto] items-end">
          <div>
            <Label>Domain</Label>
            <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="mail.emailsly.com" />
          </div>
          <div>
            <Label>DKIM selector</Label>
            <Input value={selector} onChange={(e) => setSelector(e.target.value)} placeholder="default" />
          </div>
          <Button onClick={run} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Checking…" : "Check DNS"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Common DKIM selectors: <code>default</code>, <code>google</code>, <code>s1</code>, <code>mail</code>, <code>k1</code>, <code>selector1</code>. Ask your SMTP provider which selector it uses.
        </p>
      </Card>

      {data && (
        <>
          <div className="text-xs text-muted-foreground">
            Checked {new Date(data.checked_at).toLocaleString()} · Domain: <span className="font-mono">{data.domain}</span> · Selector: <span className="font-mono">{data.selector}</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <RecordBlock title="SPF" rec={data.records.spf} ok={data.summary.spf_ok} />
            <RecordBlock title="DKIM" rec={data.records.dkim} ok={data.summary.dkim_ok} />
            <RecordBlock title="DMARC" rec={data.records.dmarc} ok={data.summary.dmarc_ok} />
            <RecordBlock title="MX (optional for send-only)" rec={data.records.mx} ok={data.records.mx.found} />
          </div>
        </>
      )}
    </div>
  );
}
