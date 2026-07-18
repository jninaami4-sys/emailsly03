/**
 * Client-side promo registry mirror. The PHP backend re-computes and enforces
 * the discount authoritatively at order creation — this only powers the live
 * "code applied" UI preview in OrderBuilder.
 */

export const PROMOS: Record<
  string,
  { percent: number; maxDiscount: number; label: string }
> = {
  WELCOME10: { percent: 10, maxDiscount: 25, label: "10% off (max $25)" },
  LAUNCH15: { percent: 15, maxDiscount: 50, label: "15% off (max $50)" },
  VIP20: { percent: 20, maxDiscount: 100, label: "20% off (max $100)" },
};

export function computePromoDiscountCents(
  code: string | null | undefined,
  subtotalCents: number,
): { discountCents: number; normalizedCode: string | null } {
  if (!code) return { discountCents: 0, normalizedCode: null };
  const normalized = code.trim().toUpperCase();
  const promo = PROMOS[normalized];
  if (!promo || subtotalCents <= 0) return { discountCents: 0, normalizedCode: null };
  const raw = Math.round((subtotalCents * promo.percent) / 100);
  const capCents = Math.round(promo.maxDiscount * 100);
  return { discountCents: Math.min(raw, capCents), normalizedCode: normalized };
}

export type PromoResult =
  | { ok: true; code: string; percent: number; amountOff: number; label: string }
  | { ok: false; reason: string };

export async function validatePromo(args: {
  data: { code: string; subtotal: number };
}): Promise<PromoResult> {
  const code = String(args.data.code || "").trim().toUpperCase();
  const promo = PROMOS[code];
  if (!promo) return { ok: false, reason: "Invalid or expired code" };
  if (args.data.subtotal <= 0)
    return { ok: false, reason: "Add items before applying a code" };
  const raw = Math.round(args.data.subtotal * promo.percent) / 100;
  const amountOff = Math.min(raw, promo.maxDiscount);
  return {
    ok: true,
    code,
    percent: promo.percent,
    amountOff: Math.round(amountOff * 100) / 100,
    label: promo.label,
  };
}
