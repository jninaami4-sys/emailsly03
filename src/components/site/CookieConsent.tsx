import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";
import { readConsent, writeConsent } from "@/lib/consent";

export function CookieConsent() {
  const [decided, setDecided] = useState<boolean>(true); // avoid SSR flash

  useEffect(() => {
    const existing = readConsent();
    setDecided(!!existing);
    const reopen = () => setDecided(false);
    window.addEventListener("cookie-consent:open", reopen);
    return () => window.removeEventListener("cookie-consent:open", reopen);
  }, []);

  const decide = (accepted: boolean) => {
    writeConsent({ analytics: accepted, marketing: accepted });
    setDecided(true);
  };

  if (decided) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[9998] p-3 sm:p-4">
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-background/95 p-4 shadow-2xl backdrop-blur sm:p-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <Cookie className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold sm:text-base">
              We use cookies
            </p>
            <p className="mt-1 text-xs text-muted-foreground sm:text-[13px]">
              We use cookies to improve your experience and analyze site usage.
              You can change your choice anytime from the footer.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => decide(true)}
            className="rounded-xl bg-violet px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet/25"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() => decide(false)}
            className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
