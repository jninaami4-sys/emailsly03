// PHP-backed proxies. Same export names as before; now plain async functions.
import { productsApi, adminProductsApi } from "@/lib/api-client";
import type { Product } from "./products";

export type DbProduct = Product & {
  published: boolean;
  sortOrder: number;
  updatedAt: string;
};

type Row = {
  id: string;
  slug: string;
  title: string;
  category: string;
  category_color: string;
  records: number | string;
  price: number | string;
  compare_at_price: number | string | null;
  file_format: string;
  geography: string;
  description: string;
  fields: string[] | null;
  sample_note: string | null;
  featured: boolean;
  cover_image: string | null;
  published: boolean;
  sort_order: number;
  updated_at: string;
};

function rowToProduct(r: Row): DbProduct {
  const catColor = (r.category_color === "coral" || r.category_color === "emerald" || r.category_color === "violet")
    ? r.category_color
    : "violet";
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    category: r.category,
    categoryColor: catColor as "violet" | "coral" | "emerald",
    records: Number(r.records) || 0,
    price: Number(r.price) || 0,
    compareAtPrice: r.compare_at_price == null ? undefined : Number(r.compare_at_price),
    fileFormat: r.file_format,
    geography: r.geography,
    description: r.description,
    fields: r.fields ?? [],
    sampleNote: r.sample_note ?? undefined,
    featured: r.featured,
    coverImage: r.cover_image ?? undefined,
    published: r.published,
    sortOrder: r.sort_order,
    updatedAt: r.updated_at,
  };
}

export async function listPublicProducts(): Promise<DbProduct[]> {
  try {
    const { products } = await productsApi.list();
    return (products ?? []).map((r) => rowToProduct(r as Row));
  } catch {
    return [];
  }
}

export async function adminListProducts(): Promise<DbProduct[]> {
  const { products } = await adminProductsApi.list();
  return (products ?? []).map((r) => rowToProduct(r as Row));
}

export type ProductUpsertInput = {
  id?: string;
  slug: string;
  title: string;
  category: string;
  category_color: "violet" | "coral" | "emerald";
  records: number;
  price: number;
  compare_at_price?: number | null;
  file_format?: string;
  geography?: string;
  description?: string;
  fields?: string[];
  sample_note?: string | null;
  featured?: boolean;
  cover_image?: string | null;
  published?: boolean;
  sort_order?: number;
};

export async function adminUpsertProduct(input: ProductUpsertInput): Promise<DbProduct> {
  const body = { ...input };
  if (body.id) {
    await adminProductsApi.update(body.id, body);
    // caller refetches; return a shape compatible with rowToProduct
    return rowToProduct({ ...(body as unknown as Row), updated_at: new Date().toISOString() });
  }
  const { id } = await adminProductsApi.create(body);
  return rowToProduct({ ...(body as unknown as Row), id, updated_at: new Date().toISOString() });
}

export async function adminDeleteProduct(input: { id: string }): Promise<{ ok: true }> {
  await adminProductsApi.destroy(input.id);
  return { ok: true };
}
