"use client";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { captureReferralFromUrl, getStoredReferral, clearStoredReferral } from "@/lib/referral-capture";
import { useServerFn } from "@tanstack/react-start";
import { attachReferrer } from "@/lib/referrals.functions";

/**
 * Runs at the root:
 *  - On any mount / route change, captures ?ref=CODE from the URL into localStorage + cookie.
 *  - On SIGNED_IN, attempts to attach the stored code to the new user's profile.
 *
 * Safe to render everywhere: reads only, no UI.
 */
export function ReferralCapture() {
  const attachFn = useServerFn(attachReferrer);

  // 1) Capture ?ref on mount + when the pathname changes
  useEffect(() => {
    captureReferralFromUrl();
  }, []);

  // Re-run capture when history changes (SPA navigation)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onNav = () => captureReferralFromUrl();
    window.addEventListener("popstate", onNav);
    return () => window.removeEventListener("popstate", onNav);
  }, []);

  // 2) Attach on SIGNED_IN
  useEffect(() => {
    if (typeof window === "undefined") return;
    const trySnapshot = async (reason: string) => {
      const stored = getStoredReferral();
      if (!stored?.code) return;
      try {
        const res = await attachFn({ data: { code: stored.code } });
        if ((res as any)?.ok || (res as any)?.reason === "Already attributed" || (res as any)?.reason === "Cannot use your own code" || (res as any)?.reason === "Cannot use a code for your own email") {
          clearStoredReferral();
        }
        console.info("[referral] attach on", reason, res);
      } catch (e) {
        console.warn("[referral] attach failed:", e);
      }
    };
    // Fire once on mount in case the user is already signed in with a stored code
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) void trySnapshot("mount");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") void trySnapshot("signed_in");
    });
    return () => sub.subscription.unsubscribe();
  }, [attachFn]);

  return null;
}
