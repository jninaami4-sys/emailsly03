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
import { CrispChat } from "@/components/site/CrispChat";

import { RouteTransition } from "@/components/site/RouteTransition";
import { SectionReveal } from "@/components/site/SectionReveal";
import { CacheJanitor } from "@/components/site/CacheJanitor";
import { TvNotFound } from "@/components/site/TvNotFound";
import { ReferralCapture } from "@/components/site/ReferralCapture";
import { BrandingApplier } from "@/components/site/BrandingApplier";
import { ProfileRealtimeSync } from "@/hooks/use-my-profile";
import { CursorGlow } from "@/components/site/CursorGlow";

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
      { title: "EmailsLy — Verified B2B lead data, on-demand" },
      {
        name: "description",
        content:
          "Verified B2B lead data from Apollo, LinkedIn, and ZoomInfo. Pay per lead, no subscription, delivered in 24 hours with 99% accuracy.",
      },
      { property: "og:title", content: "EmailsLy — Verified B2B lead data, on-demand" },
      {
        property: "og:description",
        content:
          "Verified B2B lead data. Pay per lead, no subscription, 24-hour delivery, 99% accuracy.",
      },
      { property: "og:type", content: "website" },
      // theme-color, color-scheme, apple-mobile-web-app-status-bar-style,
      // <html class="site-light">, and og:image?theme=<t> are stamped
      // per-request in src/server.ts based on ?theme=/cookie so SSR HTML
      // and share previews always match the requested theme, even though
      // TanStack calls head() before loaders resolve.
      { name: "theme-color", content: "#0a0b14" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "color-scheme", content: "dark" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/site.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});



function RootShell({ children }: { children: ReactNode }) {
  // The <html> class + data-theme is rewritten server-side per-request in
  // src/server.ts based on ?theme=/cookie; the pre-hydration script below
  // handles the client bootstrap. Rendering neither here avoids a
  // hydration mismatch when the SSR rewrite has flipped the class.
  return (
    <html lang="en" suppressHydrationWarning>
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
          <CrispChat />
          <ReferralCapture />
          <BrandingApplier />
          <ProfileRealtimeSync />
          <CursorGlow />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
