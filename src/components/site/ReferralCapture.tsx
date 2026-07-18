"use client";
import { useEffect, useRef } from "react";
import { captureReferralFromUrl, getStoredReferral, clearStoredReferral } from "@/lib/referral-capture";
import { useServerFn } from "@tanstack/react-start";
import { attachReferrer } from "@/lib/referrals.functions";
import { useAuth } from "@/hooks/use-auth";

/**
 * Runs at the root:
 *  - On any mount / route change, captures ?ref=CODE from the URL into localStorage + cookie.
 *  - When the PHP-API auth user becomes present, attempts to attach the stored code to their profile.
 *
 * Safe to render everywhere: reads only, no UI.
 */
export function ReferralCapture() {
  const attachFn = useServerFn(attachReferrer);
  const { user } = useAuth();
  const lastUserId = useRef<string | null>(null);

  // 1) Capture ?ref on mount
  useEffect(() => {
    captureReferralFromUrl();
  }, []);

  // Re-run capture on SPA navigation
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onNav = () => captureReferralFromUrl();
    window.addEventListener("popstate", onNav);
    return () => window.removeEventListener("popstate", onNav);
  }, []);

  // 2) Attach whenever we transition to a signed-in user (or on first mount if already signed in)
  useEffect(() => {
    const uid = user?.id ?? null;
    if (!uid || uid === lastUserId.current) {
      lastUserId.current = uid;
      return;
    }
    lastUserId.current = uid;
    const stored = getStoredReferral();
    if (!stored?.code) return;
    void (async () => {
      try {
        const res = (await attachFn({ data: { code: stored.code } })) as {
          ok?: boolean;
          reason?: string;
        };
        if (
          res?.ok ||
          res?.reason === "Already attributed" ||
          res?.reason === "Cannot use your own code" ||
          res?.reason === "Cannot use a code for your own email"
        ) {
          clearStoredReferral();
        }
        console.info("[referral] attach", res);
      } catch (e) {
        console.warn("[referral] attach failed:", e);
      }
    })();
  }, [user?.id, attachFn]);

  return null;
}
