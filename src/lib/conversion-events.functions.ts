/**
 * Conversion events — thin proxies to PHP API (Batch 6 migration).
 */
import { conversionEventsApi, adminConversionEventsApi } from "@/lib/api-client";

export type ParamMap = Record<string, string | number | boolean | null>;

export type ConversionEvent = {
  id: string;
  event_key: string;
  name: string;
  description: string;
  enabled: boolean;
  ga4_event_name: string;
  ga4_params: ParamMap;
  meta_event_name: string;
  meta_params: ParamMap;
  tiktok_event_name: string;
  tiktok_params: ParamMap;
  created_at: string;
  updated_at: string;
};

type Empty = Record<string, never>;

export async function getConversionEvents(_?: { data?: Empty }): Promise<ConversionEvent[]> {
  try {
    const { events } = await conversionEventsApi.list();
    return (events ?? []) as ConversionEvent[];
  } catch {
    return [];
  }
}

export async function listConversionEventsAdmin(_?: {
  data?: Empty;
}): Promise<ConversionEvent[]> {
  const { events } = await adminConversionEventsApi.list();
  return (events ?? []) as ConversionEvent[];
}

export type UpsertConversionEventInput = {
  id?: string;
  event_key: string;
  name: string;
  description: string;
  enabled: boolean;
  ga4_event_name: string;
  ga4_params: ParamMap;
  meta_event_name: string;
  meta_params: ParamMap;
  tiktok_event_name: string;
  tiktok_params: ParamMap;
};

export async function upsertConversionEvent(args: {
  data: UpsertConversionEventInput;
}): Promise<ConversionEvent> {
  const { event } = await adminConversionEventsApi.upsert(args.data);
  return event as ConversionEvent;
}

export async function deleteConversionEvent(args: {
  data: { id: string };
}): Promise<{ ok: true }> {
  await adminConversionEventsApi.destroy(args.data.id);
  return { ok: true };
}
