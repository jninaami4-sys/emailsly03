import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { PRODUCTS, CATEGORIES } from "@/lib/products";

export default defineTool({
  name: "list_products",
  title: "List prebuilt lead products",
  description:
    "List LyraData's prebuilt lead-list products from the store. Optionally filter by category and limit results.",
  inputSchema: {
    category: z
      .string()
      .optional()
      .describe(`Optional category filter. One of: ${CATEGORIES.join(", ")}.`),
    limit: z.number().int().min(1).max(100).optional().describe("Max products to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ category, limit }) => {
    const filtered = category && category !== "All"
      ? PRODUCTS.filter((p) => p.category.toLowerCase() === category.toLowerCase())
      : PRODUCTS;
    const items = filtered.slice(0, limit ?? 20).map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      category: p.category,
      records: p.records,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      fileFormat: p.fileFormat,
      geography: p.geography,
      description: p.description,
      fields: p.fields,
      url: `https://lyradata.app/store#${p.slug}`,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
      structuredContent: { products: items, total: filtered.length },
    };
  },
});
