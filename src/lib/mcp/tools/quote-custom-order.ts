import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

// Pricing tiers mirror the public /pricing calculator.
const TIERS = [
  { minQty: 100, maxQty: 499, pricePerLead: 0.35 },
  { minQty: 500, maxQty: 999, pricePerLead: 0.35 },
  { minQty: 1000, maxQty: 4999, pricePerLead: 0.35 },
  { minQty: 5000, maxQty: 9999, pricePerLead: 0.35 },
  { minQty: 10000, maxQty: 1_000_000, pricePerLead: 0.35 },
];

export default defineTool({
  name: "quote_custom_order",
  title: "Quote a custom lead order",
  description:
    "Estimate the price for a custom lead order (100+ leads) using LyraData's public per-lead pricing tiers. Returns per-lead rate, subtotal, and the matching tier.",
  inputSchema: {
    quantity: z.number().int().min(100).max(1_000_000).describe("Number of leads (minimum 100)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ quantity }) => {
    const tier = TIERS.find((t) => quantity >= t.minQty && quantity <= t.maxQty) ?? TIERS[TIERS.length - 1];
    const subtotal = Math.round(quantity * tier.pricePerLead * 100) / 100;
    const payload = {
      quantity,
      pricePerLead: tier.pricePerLead,
      subtotal,
      currency: "USD",
      tier: `${tier.minQty.toLocaleString()}–${tier.maxQty.toLocaleString()} leads`,
      note: "Estimate only. Final quote may vary based on filters, geography, and enrichment.",
      pricingUrl: "https://lyradata.app/pricing",
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
