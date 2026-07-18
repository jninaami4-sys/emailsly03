/**
 * Admin — Stripe events + webhook deliveries. Thin proxies (Batch 6 migration).
 */
import { adminStripeApi } from "@/lib/api-client";

export type StripeEventRow = {
  id: string;
  type: string;
  received_at: string;
  verified: boolean;
  amount_cents: number | null;
  currency: string | null;
  stripe_ref: string | null;
  customer_email: string | null;
  order_id: string | null;
  order_status: string | null;
  order_payment_status: string | null;
  referral_id: string | null;
  referral_status: string | null;
};

export type WebhookDeliveryRow = {
  id: string;
  received_at: string;
  event_id: string | null;
  event_type: string | null;
  verified: boolean;
  status: string;
  http_status: number;
  outcome: string | null;
  error_message: string | null;
  duration_ms: number | null;
  stripe_ref: string | null;
  matched_order_id: string | null;
  source_ip: string | null;
  signature_present: boolean;
  payload_bytes: number | null;
};

export async function adminListStripeEvents(args?: {
  data?: { limit?: number; type?: string };
}): Promise<StripeEventRow[]> {
  const { events } = await adminStripeApi.events(args?.data);
  return (events ?? []) as StripeEventRow[];
}

export async function adminListWebhookDeliveries(args?: {
  data?: { limit?: number; status?: string };
}): Promise<WebhookDeliveryRow[]> {
  const { deliveries } = await adminStripeApi.deliveries(args?.data);
  return (deliveries ?? []) as WebhookDeliveryRow[];
}
