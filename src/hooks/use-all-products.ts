import { useQuery } from "@tanstack/react-query";
import { PRODUCTS, type Product } from "@/lib/products";
import { listPublicProducts } from "@/lib/products-cms.functions";

/**
 * Returns the static hardcoded catalog merged with admin-managed products
 * from the database. DB products with a slug matching a static product override it.
 */
export function useAllProducts(): Product[] {
  const listFn = listPublicProducts;
  const { data } = useQuery({
    queryKey: ["public-products"],
    queryFn: () => listFn(),
    staleTime: 60_000,
  });

  if (!data || data.length === 0) return PRODUCTS;

  const bySlug = new Map<string, Product>();
  for (const p of PRODUCTS) bySlug.set(p.slug, p);
  for (const p of data) bySlug.set(p.slug, p);
  return Array.from(bySlug.values());
}
