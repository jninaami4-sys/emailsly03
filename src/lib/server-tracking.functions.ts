/**
 * Server-side tracking config + event log — thin proxies (Batch 6 migration).
 */
import { adminServerTrackingApi } from "@/lib/api-client";

export type ServerTrackingConfig = {
  ga4_measurement_id: string;
  ga4_api_secret: string;
  ga4_enabled: boolean;
  meta_pixel_id: string;
  meta_access_token: string;
  meta_test_event_code: string;
  meta_enabled: boolean;
  tiktok_pixel_id: string;
  tiktok_access_token: string;
  tiktok_test_event_code: string;
  tiktok_enabled: boolean;
  updated_at: string;
};

export type ServerEventLogRow = {
  id: string;
  event_id: string;
  event_key: string;
  providers: Array<{ provider: string; ok: boolean; status: number; text?: string }>;
  status: "ok" | "partial" | "error" | "skipped";
  error: string | null;
  created_at: string;
};

const EMPTY: ServerTrackingConfig = {
  ga4_measurement_id: "",
  ga4_api_secret: "",
  ga4_enabled: false,
  meta_pixel_id: "",
  meta_access_token: "",
  meta_test_event_code: "",
  meta_enabled: false,
  tiktok_pixel_id: "",
  tiktok_access_token: "",
  tiktok_test_event_code: "",
  tiktok_enabled: false,
  updated_at: new Date(0).toISOString(),
};

type Empty = Record<string, never>;

export async function getServerTrackingConfig(_?: {
  data?: Empty;
}): Promise<ServerTrackingConfig> {
  try {
    const { config } = await adminServerTrackingApi.get();
    return (config ?? EMPTY) as ServerTrackingConfig;
  } catch {
    return EMPTY;
  }
}

export async function updateServerTrackingConfig(args: {
  data: Partial<ServerTrackingConfig>;
}): Promise<ServerTrackingConfig> {
  const res = (await adminServerTrackingApi.update(args.data)) as { config?: ServerTrackingConfig };
  return (res.config ?? { ...EMPTY, ...args.data }) as ServerTrackingConfig;
}

export async function listServerEventLog(_?: { data?: Empty }): Promise<ServerEventLogRow[]> {
  const { events } = await adminServerTrackingApi.log();
  return (events ?? []) as ServerEventLogRow[];
}
