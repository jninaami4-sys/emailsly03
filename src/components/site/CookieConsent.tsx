import { useEffect, useState } from "react";
import { Cookie, Shield, BarChart3, Megaphone, X } from "lucide-react";
import {
  DEFAULT_CONSENT,
  readConsent,
  writeConsent,
  type ConsentCategories,
} from "@/lib/consent";

export function CookieConsent() {
  const [decided, setDecided] = useState<boolean>(true); // avoid SSR flash
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState<Omit<ConsentCategories, "necessary">>({
    analytics: DEFAULT_CONSENT.analytics,
    marketing: DEFAULT_CONSENT.marketing,
  });

  useEffect(() => {
    const existing = readConsent();
    if (existing) {
      setPrefs({
        analytics: existing.categories.analytics,
        marketing: existing.categories.marketing,
      });
      setDecided(true);
    } else {
      setDecided(false);
    }
    const openPrefs = () => setShowPrefs(true);
    window.addEventListener("cookie-consent:open", openPrefs);
    return () => window.removeEventListener("cookie-consent:open", openPrefs);
  }, []);

  const accept = (choice: Omit<ConsentCategories, "necessary">) => {
    writeConsent(choice);
    setPrefs(choice);
    setDecided(true);
    setShowPrefs(false);
  };

  if (decided && !showPrefs) return null;

  return (
    <>
      {!decided && !showPrefs && (
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
                  We use cookies for essential site features and — with your permission —
                  analytics and marketing to understand usage and improve the product. You
                  can change your choice anytime from the footer.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => accept({ analytics: true, marketing: true })}
                className="rounded-xl bg-violet px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet/25"
              >
                Accept all
              </button>
              <button
                type="button"
                onClick={() => accept({ analytics: false, marketing: false })}
                className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold"
              >
                Reject non-essential
              </button>
              <button
                type="button"
                onClick={() => setShowPrefs(true)}
                className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold"
              >
                Customize
              </button>
            </div>
          </div>
        </div>
      )}

      {showPrefs && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Cookie preferences"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
            <header className="flex items-center gap-3 border-b border-border p-4">
              <div className="flex size-9 items-center justify-center rounded-xl bg-violet/10 text-violet">
                <Cookie className="size-4" />
              </div>
              <div className="flex-1">
                <h2 className="font-display text-lg font-bold">Cookie preferences</h2>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Manage what loads in your browser
                </p>
              </div>
              {decided && (
                <button
                  type="button"
                  onClick={() => setShowPrefs(false)}
                  className="rounded-md p-1.5 hover:bg-secondary"
                  aria-label="Close"
                >
                  <X className="size-4" />
                </button>
              )}
            </header>

            <div className="grid gap-3 p-4">
              <CategoryRow
                icon={<Shield className="size-4" />}
                title="Strictly necessary"
                description="Required for the site to work — session, cart, security. Always on."
                enabled
                locked
              />
              <CategoryRow
                icon={<BarChart3 className="size-4" />}
                title="Analytics"
                description="Google Analytics 4 and Google Tag Manager. Helps us understand usage anonymously."
                enabled={prefs.analytics}
                onChange={(v) => setPrefs((p) => ({ ...p, analytics: v }))}
              />
              <CategoryRow
                icon={<Megaphone className="size-4" />}
                title="Marketing"
                description="Meta Pixel, TikTok Pixel, and marketing snippets used to measure ad effectiveness."
                enabled={prefs.marketing}
                onChange={(v) => setPrefs((p) => ({ ...p, marketing: v }))}
              />
            </div>

            <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border p-4">
              <button
                type="button"
                onClick={() => accept({ analytics: false, marketing: false })}
                className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold"
              >
                Reject non-essential
              </button>
              <button
                type="button"
                onClick={() => accept(prefs)}
                className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold"
              >
                Save preferences
              </button>
              <button
                type="button"
                onClick={() => accept({ analytics: true, marketing: true })}
                className="rounded-xl bg-violet px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet/25"
              >
                Accept all
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}

function CategoryRow({
  icon,
  title,
  description,
  enabled,
  locked,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  locked?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        disabled={locked}
        onClick={() => onChange?.(!enabled)}
        role="switch"
        aria-checked={enabled}
        aria-label={title}
        className={`relative mt-1 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          enabled ? "bg-emerald-500" : "bg-muted-foreground/30"
        } ${locked ? "opacity-60" : ""}`}
      >
        <span
          className={`inline-block size-5 transform rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
