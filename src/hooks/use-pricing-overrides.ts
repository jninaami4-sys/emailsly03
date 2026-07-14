import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";
import { getPricingSettings, type PricingSetting } from "@/lib/pricing-settings.functions";

export type PricingOverride = {
  rate: number;
  minQty: number;
  minOrder: number;
  helper?: string | null;
};

export function usePricingOverrides() {
  const fn = useServerFn(getPricingSettings);
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
      });
    }
    return map;
  }, [data]);
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
