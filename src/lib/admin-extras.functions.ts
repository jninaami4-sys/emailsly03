/**
 * Admin extras — store offers, telegram bots, backup/restore, legacy CSV import,
 * campaigns. Thin proxies to PHP API (Batch 6 migration).
 */
import {
  adminOffersApi,
  offersApi,
  adminTelegramApi,
  adminBackupApi,
  adminLegacyImportsApi,
  adminCampaignsApi,
  api,
} from "@/lib/api-client";

type Empty = Record<string, never>;

/* -------------------- Store Offers -------------------- */
export async function listStoreOffers(_?: { data?: Empty }): Promise<{ offers: any[] }> {
  return adminOffersApi.list();
}

export async function upsertStoreOffer(args: {
  data: {
    id?: string | null;
    title: string;
    subtitle?: string | null;
    cta_label?: string | null;
    cta_url?: string | null;
    badge?: string | null;
    bg_gradient?: string | null;
    starts_at?: string | null;
    ends_at?: string | null;
    active?: boolean;
    sort_order?: number;
  };
}): Promise<{ offer: any }> {
  const { id, ...payload } = args.data;
  if (id) {
    const offer = await adminOffersApi.update(id, payload);
    return { offer };
  }
  const offer = await adminOffersApi.create(payload);
  return { offer };
}

export async function deleteStoreOffer(args: { data: { id: string } }): Promise<{ ok: true }> {
  await adminOffersApi.destroy(args.data.id);
  return { ok: true };
}

export async function listActiveStoreOffers(_?: { data?: Empty }): Promise<{ offers: any[] }> {
  return offersApi.list();
}

/* -------------------- Telegram Bots -------------------- */
export async function listTelegramBots(_?: { data?: Empty }): Promise<{ bots: any[] }> {
  return adminTelegramApi.list();
}

export async function upsertTelegramBot(args: {
  data: {
    id?: string | null;
    name: string;
    bot_token: string;
    chat_id: string;
    events?: string[];
    active?: boolean;
  };
}): Promise<{ bot: any }> {
  const { id, ...payload } = args.data;
  if (id) {
    const bot = await adminTelegramApi.update(id, payload);
    return { bot };
  }
  const bot = await adminTelegramApi.create(payload);
  return { bot };
}

export async function deleteTelegramBot(args: { data: { id: string } }): Promise<{ ok: true }> {
  await adminTelegramApi.destroy(args.data.id);
  return { ok: true };
}

export async function testTelegramBot(args: {
  data: { id: string };
}): Promise<{ ok: boolean; response?: unknown }> {
  return adminTelegramApi.test(args.data.id) as Promise<{ ok: boolean; response?: unknown }>;
}

/* -------------------- Backup / Restore -------------------- */
type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

export type BackupBundle = {
  version: number;
  exported_at: string;
  tables: Record<string, JsonValue[]>;
};

export async function exportBackup(_?: { data?: Empty }): Promise<BackupBundle> {
  const { backup } = await adminBackupApi.export();
  return backup as BackupBundle;
}

export async function restoreBackup(args: {
  data: {
    backup: BackupBundle;
    tables?: string[];
    mode?: "merge" | "replace";
  };
}): Promise<{ results: Record<string, { restored: number; error?: string }> }> {
  const res = (await api("/api/admin/restore", {
    method: "POST",
    body: {
      backup: args.data.backup,
      tables: args.data.tables ?? null,
      mode: args.data.mode ?? "merge",
    },
  })) as { results: Record<string, { restored: number; error?: string }> };
  return res;
}

/* -------------------- Legacy Order CSV Import -------------------- */
export async function importLegacyOrders(args: {
  data: { rows: Array<Record<string, any>> };
}): Promise<{ batch_id: string; imported: number; failed: number; errors: string[] }> {
  const res = await adminLegacyImportsApi.import(args.data.rows);
  return {
    batch_id: res.batch_id,
    imported: res.imported,
    failed: (res as any).failed ?? 0,
    errors: (res.errors ?? []).map((e: any) => (typeof e === "string" ? e : e?.message ?? String(e))),
  };
}

/* -------------------- Campaigns -------------------- */
export async function listCampaigns(_?: { data?: Empty }): Promise<{ campaigns: any[] }> {
  return adminCampaignsApi.list();
}

export async function upsertCampaign(args: {
  data: {
    id?: string | null;
    name: string;
    audience?: "all" | "paid" | "by_service" | "by_tag";
    audience_filter?: Record<string, any>;
    channel?: "email" | "announcement";
    subject?: string | null;
    body: string;
    status?: "draft" | "scheduled" | "sending" | "sent" | "failed";
    scheduled_at?: string | null;
  };
}): Promise<{ campaign: any }> {
  const { id, ...payload } = args.data;
  if (id) {
    const campaign = await adminCampaignsApi.update(id, payload);
    return { campaign };
  }
  const campaign = await adminCampaignsApi.create(payload);
  return { campaign };
}

export async function deleteCampaign(args: { data: { id: string } }): Promise<{ ok: true }> {
  await adminCampaignsApi.destroy(args.data.id);
  return { ok: true };
}

export async function previewCampaignAudience(args: {
  data: {
    audience: "all" | "paid" | "by_service" | "by_tag";
    audience_filter?: Record<string, any>;
  };
}): Promise<{ count: number; sample: string[] }> {
  return (await api("/api/admin/campaigns/preview", {
    method: "POST",
    body: args.data,
  })) as { count: number; sample: string[] };
}

export async function sendCampaign(args: {
  data: { id: string };
}): Promise<{ ok: true; recipients: number }> {
  return (await api(`/api/admin/campaigns/${args.data.id}/send`, {
    method: "POST",
    body: {},
  })) as { ok: true; recipients: number };
}
