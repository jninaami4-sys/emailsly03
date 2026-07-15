import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listSiteContent } from "@/lib/site-content.functions";
import { SITE_CONTENT_DEFAULTS, type SiteContentSection } from "@/lib/site-content-defaults";

export function useSiteContent<S extends SiteContentSection>(section: S) {
  const listFn = useServerFn(listSiteContent);
  const { data } = useQuery({
    queryKey: ["site-content"],
    queryFn: () => listFn(),
    staleTime: 60_000,
  });
  const defaults = SITE_CONTENT_DEFAULTS[section] as Record<string, unknown>;
  const overrides = (data?.[section] ?? {}) as Record<string, unknown>;
  return { ...defaults, ...overrides } as typeof SITE_CONTENT_DEFAULTS[S];
}
