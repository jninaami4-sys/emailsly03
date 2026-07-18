import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getPricingSettings, type PricingSetting } from "@/lib/pricing-settings.functions";

export type PricingOverride = {
  rate: number;
  minQty: number;
  minOrder: number;
  helper?: string | null;
  published: boolean;
};

export function usePricingOverrides() {
  const fn = getPricingSettings;
  const { data } = useQuery({
    queryKey: ["pricing-settings"],
    queryFn: () => fn(),
    staleTime: 60_000,
  });
  return useMemo(() => {
    const map = new Map<string, PricingOverride>();
    for (const row of (data ?? []) as PricingSetting[]) {
      map.set(row.service_id, {
        rate: row.rate,
        minQty: row.min_qty,
        minOrder: row.min_order,
        helper: row.helper,
        published: row.published,
      });
    }
    return map;
  }, [data]);
}

/**
 * Filter a service list against the admin "published" flag. Services with no
 * matching row in `pricing_settings` are treated as published (fall back to
 * the in-code defaults) so the storefront never goes empty on a fresh DB.
 */
export function filterPublished<T extends { id: string }>(
  services: T[],
  overrides: Map<string, PricingOverride>,
): T[] {
  return services.filter((s) => {
    const o = overrides.get(s.id);
    return !o || o.published;
  });
}

export function applyOverride<T extends { id: string; rate: number; minQty: number; minOrder: number; helper?: string }>(
  service: T,
  overrides: Map<string, PricingOverride>,
): T {
  const o = overrides.get(service.id);
  if (!o) return service;
  return {
    ...service,
    rate: o.rate,
    minQty: o.minQty,
    minOrder: o.minOrder,
    helper: o.helper ?? service.helper,
  };
}
