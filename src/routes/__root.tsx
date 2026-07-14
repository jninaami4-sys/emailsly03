import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CartProvider } from "@/lib/cart";
import { CartDrawer } from "@/components/site/CartDrawer";
import { AuthProvider } from "@/hooks/use-auth";
import { AnnouncementModal } from "@/components/site/AnnouncementModal";
import { TrackingScripts } from "@/components/site/TrackingScripts";
import { TrackingDebugPanel } from "@/components/site/TrackingDebugPanel";
import { CookieConsent } from "@/components/site/CookieConsent";
import { TawkChat } from "@/components/site/TawkChat";
import { RouteTransition } from "@/components/site/RouteTransition";
import { SectionReveal } from "@/components/site/SectionReveal";
import { CacheJanitor } from "@/components/site/CacheJanitor";
import { TvNotFound } from "@/components/site/TvNotFound";
import { ReferralCapture } from "@/components/site/ReferralCapture";

function NotFoundComponent() {
  return (
    <TvNotFound
      code="404"
      title="Lost in transmission"
      subtitle="The page you're looking for isn't broadcasting. Check the URL or head back home."
      screenText="NOT FOUND"
    />
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <TvNotFound
      code="500"
      title="Signal interrupted"
      subtitle="Something went wrong on our end. Try reloading or head back home."
      screenText="ERROR"
      onRetry={() => {
        router.invalidate();
        reset();
      }}
    />
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "LyraData — Verified B2B lead data, on-demand" },
      {
        name: "description",
        content:
          "Verified B2B lead data from Apollo, LinkedIn, and ZoomInfo. Pay per lead, no subscription, delivered in 24 hours with 99% accuracy.",
      },
      { property: "og:title", content: "LyraData — Verified B2B lead data, on-demand" },
      {
        property: "og:description",
        content:
          "Verified B2B lead data. Pay per lead, no subscription, 24-hour delivery, 99% accuracy.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <RouteTransition>
            <Outlet />
          </RouteTransition>
          <SectionReveal />
          <CartDrawer />
          <CacheJanitor />

          <AnnouncementModal />
          <TrackingScripts />
          <TrackingDebugPanel />
          <CookieConsent />
          <TawkChat />
          <ReferralCapture />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
