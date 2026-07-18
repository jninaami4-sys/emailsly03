/**
 * Data portability (bulk client + order import/export) — thin proxies (Batch 6 migration).
 */
import { adminPortabilityApi } from "@/lib/api-client";

export type ImportClientRow = {
  email: string;
  full_name?: string | null;
  company?: string | null;
  phone?: string | null;
  country?: string | null;
  notes?: string | null;
  external_id?: string | null;
};

export type ImportOrderRow = {
  email: string;
  external_id?: string | null;
  service_id?: string | null;
  service_label: string;
  quantity?: number;
  subtotal_cents?: number;
  discount_cents?: number;
  promo_code?: string | null;
  total_cents?: number;
  currency?: string;
  status?: string;
  payment_status?: string;
  payment_provider?: string | null;
  payment_ref?: string | null;
  delivery_url?: string | null;
  delivery_notes?: string | null;
  delivered_at?: string | null;
  created_at?: string | null;
  metadata?: Record<string, unknown>;
};

export async function importClientsAndOrders(args: {
  data: {
    source: string;
    create_logins?: boolean;
    clients?: ImportClientRow[];
    orders?: ImportOrderRow[];
  };
}): Promise<{
  ok: true;
  users_created: number;
  clients_processed: number;
  orders_upserted: number;
}> {
  return adminPortabilityApi.import({
    source: args.data.source,
    create_logins: args.data.create_logins ?? true,
    clients: args.data.clients ?? [],
    orders: args.data.orders ?? [],
  });
}

type Empty = Record<string, never>;

export async function exportAll(_?: { data?: Empty }): Promise<{
  exported_at: string;
  profiles: any[];
  orders: any[];
  order_events: any[];
}> {
  return adminPortabilityApi.export();
}
