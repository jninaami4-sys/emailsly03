import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { PRODUCTS } from "@/lib/products";

export default defineTool({
  name: "get_product",
  title: "Get a lead product by slug",
  description: "Fetch a single prebuilt lead product's full details by its slug.",
  inputSchema: {
    slug: z.string().min(1).describe("The product slug, e.g. 'saas-founders-decision-makers'."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ slug }) => {
    const product = PRODUCTS.find((p) => p.slug === slug);
    if (!product) {
      return { content: [{ type: "text", text: `No product found with slug "${slug}".` }], isError: true };
    }
    const payload = {
      id: product.id,
      slug: product.slug,
      title: product.title,
      category: product.category,
      records: product.records,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      fileFormat: product.fileFormat,
      geography: product.geography,
      description: product.description,
      fields: product.fields,
      sampleNote: product.sampleNote,
      url: `https://lyradata.app/store#${product.slug}`,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: { product: payload },
    };
  },
});
