import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { AuthGate } from "./AuthGate";
import { MouseGlow } from "./MouseGlow";
import { OrderDrawer } from "./OrderDrawer";
import { FloatingOrderButton } from "./FloatingOrderButton";
import { MobileBottomNav } from "./MobileBottomNav";
import { Preloader } from "./Preloader";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="theme-midnight flex min-h-screen flex-col bg-background text-foreground pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0">
      <Preloader everyLoad maxDurationMs={3800} sequenceMs={3400} />
      <MouseGlow />
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        <AuthGate>{children}</AuthGate>
      </main>
      <Footer />
      <FloatingOrderButton />
      <OrderDrawer />
      <MobileBottomNav />
    </div>
  );
}

