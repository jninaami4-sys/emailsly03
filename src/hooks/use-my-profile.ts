import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile } from "@/lib/orders.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const MY_PROFILE_KEY = ["my-profile"] as const;

/**
 * Fetches the current user's profile and keeps it in sync with realtime
 * updates on the `profiles` row. Any component using this hook (or reading
 * the `["my-profile"]` query cache) refreshes immediately when the profile
 * is edited from anywhere in the app.
 */
export function useMyProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const profileFn = useServerFn(getMyProfile);

  const query = useQuery({
    queryKey: MY_PROFILE_KEY,
    queryFn: () => profileFn(),
    enabled: !!user,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`profile:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Patch the cache with the new row for instant UI update, then
          // refetch to make sure any derived server data stays consistent.
          const next = payload.new as Record<string, unknown> | null;
          if (next) {
            qc.setQueryData(MY_PROFILE_KEY, (prev: unknown) => ({
              ...(prev as object | null),
              ...next,
            }));
          }
          qc.invalidateQueries({ queryKey: MY_PROFILE_KEY });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, qc]);

  return query;
}

/** Mountable component that keeps the profile cache warm + subscribed. */
export function ProfileRealtimeSync() {
  useMyProfile();
  return null;
}
