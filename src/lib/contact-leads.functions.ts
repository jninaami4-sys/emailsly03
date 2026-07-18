/**
 * Contact leads — thin proxies to PHP API (Batch 5 migration).
 */
import { contactApi, adminLeadsApi } from "@/lib/api-client";

export type LeadStatus = "new" | "contacted" | "qualified" | "archived";

export type ContactLead = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  message: string;
  source: string;
  status: LeadStatus;
  notes: string | null;
  page_url: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
};

type Empty = Record<string, never>;

export async function submitContactLead(args: {
  data: {
    name: string;
    email: string;
    company?: string | null;
    message: string;
    source?: string;
    page_url?: string | null;
  };
}): Promise<{ ok: true }> {
  await contactApi.submit(args.data);
  return { ok: true };
}

export async function adminListContactLeads(_?: { data?: Empty }): Promise<ContactLead[]> {
  const { leads } = await adminLeadsApi.list();
  return (leads ?? []) as ContactLead[];
}

export async function adminUpdateContactLead(args: {
  data: { id: string; status?: LeadStatus; notes?: string | null };
}): Promise<{ ok: true }> {
  const { id, ...body } = args.data;
  await adminLeadsApi.update(id, body);
  return { ok: true };
}

export async function adminDeleteContactLead(args: {
  data: { id: string };
}): Promise<{ ok: true }> {
  await adminLeadsApi.destroy(args.data.id);
  return { ok: true };
}
