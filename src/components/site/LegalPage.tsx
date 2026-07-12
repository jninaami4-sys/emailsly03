import type { ReactNode } from "react";
import { SiteShell } from "./SiteShell";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-6 py-20">
        <header className="mb-12 border-b border-border pb-8">
          <h1 className="font-display text-4xl font-bold lg:text-5xl">{title}</h1>
          <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Last updated: {updated}
          </p>
        </header>
        <div className="prose-legal space-y-6 text-[15px] leading-relaxed text-muted-foreground [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_a]:text-violet [&_a]:underline">
          {children}
        </div>
      </article>
    </SiteShell>
  );
}
