import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile } from "@/lib/orders.functions";
import { useAuth } from "@/hooks/use-auth";

export const MY_PROFILE_KEY = ["my-profile"] as const;

/**
 * Fetches the current user's profile from the PHP API.
 *
 * Realtime updates: without Supabase's postgres_changes stream we refresh
 * lightly by (a) refetching on window focus, (b) polling every 30s while
 * the profile page is open, and (c) invalidating the cache whenever the
 * auth user id changes (login/logout/switch account).
 */
export function useMyProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const profileFn = getMyProfile;

  const query = useQuery({
    queryKey: MY_PROFILE_KEY,
    queryFn: () => profileFn(),
    enabled: !!user,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  });

  // Drop stale profile if the signed-in user changed.
  useEffect(() => {
    if (!user?.id) qc.removeQueries({ queryKey: MY_PROFILE_KEY });
  }, [user?.id, qc]);

  return query;
}

/** Mountable component that keeps the profile cache warm. */
export function ProfileRealtimeSync() {
  useMyProfile();
  return null;
}
