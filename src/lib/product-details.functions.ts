// PHP-backed proxies. Same export names as before; now plain async functions.
import { productDetailsApi, adminProductDetailsApi } from "@/lib/api-client";

export type ProductDetails = {
  id: string;
  slug: string;
  enabled: boolean;
  long_description: string;
  extra_info: string;
  cta_label: string;
  cta_url: string;
  image_url: string;
  created_at: string;
  updated_at: string;
};

export async function getProductDetails(input: { slug: string }): Promise<ProductDetails | null> {
  try {
    const { details } = await productDetailsApi.get(input.slug);
    return (details as ProductDetails) ?? null;
  } catch {
    return null;
  }
}

export async function listProductDetails(): Promise<ProductDetails[]> {
  const { items } = await adminProductDetailsApi.list();
  return (items ?? []) as ProductDetails[];
}

export type ProductDetailsUpsertInput = {
  slug: string;
  enabled: boolean;
  long_description: string;
  extra_info: string;
  cta_label: string;
  cta_url: string;
  image_url: string;
};

export async function upsertProductDetails(input: ProductDetailsUpsertInput): Promise<ProductDetails> {
  const payload = {
    slug: String(input.slug || "").slice(0, 200),
    enabled: !!input.enabled,
    long_description: String(input.long_description || "").slice(0, 8000),
    extra_info: String(input.extra_info || "").slice(0, 8000),
    cta_label: String(input.cta_label || "").slice(0, 80),
    cta_url: String(input.cta_url || "").slice(0, 500),
    image_url: String(input.image_url || "").slice(0, 500),
  };
  await adminProductDetailsApi.upsert(payload);
  return {
    ...payload,
    id: payload.slug,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function deleteProductDetails(input: { slug: string }): Promise<{ ok: true }> {
  await adminProductDetailsApi.destroy(input.slug);
  return { ok: true };
}
