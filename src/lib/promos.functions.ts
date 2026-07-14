import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * SERVER-OWNED promo code registry.
 *
 * Rules:
 *  - Every code has a fixed percent AND a hard `maxDiscount` cap (USD).
 *  - Discounts are computed on the server from a trusted subtotal.
 *  - The client NEVER decides the discount amount. When Stripe checkout is
 *    wired up, the server must recompute the discount here (or fetch the
 *    Stripe coupon by id) — never use an amount coming from the browser.
 */
const PROMOS: Record<
  string,
  { percent: number; maxDiscount: number; label: string }
> = {
  WELCOME10: { percent: 10, maxDiscount: 25, label: "10% off (max $25)" },
  LAUNCH15: { percent: 15, maxDiscount: 50, label: "15% off (max $50)" },
  VIP20: { percent: 20, maxDiscount: 100, label: "20% off (max $100)" },
};

export type PromoResult =
  | {
      ok: true;
      code: string;
      percent: number;
      amountOff: number; // USD, already capped
      label: string;
    }
  | { ok: false; reason: string };

export const validatePromo = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        code: z.string().min(1).max(32),
        subtotal: z.number().nonnegative().max(1_000_000),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<PromoResult> => {
    const code = data.code.trim().toUpperCase();
    const promo = PROMOS[code];
    if (!promo) return { ok: false, reason: "Invalid or expired code" };
    if (data.subtotal <= 0)
      return { ok: false, reason: "Add items before applying a code" };

    // Round to cents, then cap.
    const raw = Math.round(data.subtotal * promo.percent) / 100;
    const amountOff = Math.min(raw, promo.maxDiscount);

    return {
      ok: true,
      code,
      percent: promo.percent,
      amountOff: Math.round(amountOff * 100) / 100,
      label: promo.label,
    };
  });
