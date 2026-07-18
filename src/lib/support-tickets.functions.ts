/**
 * Support tickets — thin proxies to PHP API (Batch 5 migration).
 */
import { ticketsApi, adminTicketsApi } from "@/lib/api-client";

const STATUSES = ["open", "in_progress", "waiting_customer", "resolved", "closed"] as const;
const CATEGORIES = ["payment", "delivery", "quality", "refund", "account", "other"] as const;
const PRIORITIES = ["low", "normal", "high", "urgent"] as const;

export type SupportTicketStatus = (typeof STATUSES)[number];
export type SupportTicketCategory = (typeof CATEGORIES)[number];
export type SupportTicketPriority = (typeof PRIORITIES)[number];

type Empty = Record<string, never>;

/* customer */
export async function createSupportTicket(args: {
  data: {
    order_id?: string | null;
    subject: string;
    category?: SupportTicketCategory;
    priority?: SupportTicketPriority;
    message: string;
  };
}): Promise<{ ok: true; id: string }> {
  const res = await ticketsApi.create(args.data);
  return { ok: true, id: res.id };
}

export async function listMySupportTickets(_?: { data?: Empty }): Promise<any[]> {
  const { tickets } = await ticketsApi.list();
  return tickets ?? [];
}

export async function getMySupportTicket(args: {
  data: { id: string };
}): Promise<{ ticket: any; messages: any[] }> {
  return ticketsApi.get(args.data.id);
}

export async function replySupportTicket(args: {
  data: { ticket_id: string; body: string };
}): Promise<{ ok: true }> {
  await ticketsApi.postMessage(args.data.ticket_id, args.data.body);
  return { ok: true };
}

export async function closeMySupportTicket(args: { data: { id: string } }): Promise<{ ok: true }> {
  await ticketsApi.close(args.data.id);
  return { ok: true };
}

/* admin */
export async function adminListSupportTickets(args?: {
  data?: { status?: string; search?: string };
}): Promise<any[]> {
  const { tickets } = await adminTicketsApi.list(args?.data);
  return tickets ?? [];
}

export async function adminGetSupportTicket(args: {
  data: { id: string };
}): Promise<{ ticket: any; messages: any[] }> {
  return adminTicketsApi.get(args.data.id);
}

export async function adminUpdateSupportTicket(args: {
  data: { id: string; status?: SupportTicketStatus; priority?: SupportTicketPriority };
}): Promise<{ ok: true }> {
  const { id, ...body } = args.data;
  await adminTicketsApi.update(id, body);
  return { ok: true };
}

export async function adminReplySupportTicket(args: {
  data: { ticket_id: string; body: string; status?: SupportTicketStatus };
}): Promise<{ ok: true }> {
  await adminTicketsApi.postMessage(args.data.ticket_id, args.data.body, args.data.status);
  return { ok: true };
}
