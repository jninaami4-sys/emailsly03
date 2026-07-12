import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { AuthGate } from "./AuthGate";
import { Preloader } from "./Preloader";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Preloader />
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        <AuthGate>{children}</AuthGate>
      </main>
      <Footer />
    </div>
  );
}
