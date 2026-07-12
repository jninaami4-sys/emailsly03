import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { SampleDataTable } from "@/components/site/SampleDataTable";
import leads from "@/lib/sample-apollo-leads";

export const Route = createFileRoute("/sample-data")({
  head: () => ({
    meta: [
      { title: "Sample Apollo Leads — LyraData" },
      { name: "description", content: "Browse a full sample of verified Apollo B2B leads exported by LyraData." },
      { property: "og:title", content: "Sample Apollo Leads — LyraData" },
      { property: "og:description", content: "Browse a full sample of verified Apollo B2B leads exported by LyraData." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: SampleDataPage,
});

function SampleDataPage() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="mb-8 space-y-3 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-soft px-3 py-1 text-xs font-bold uppercase tracking-widest text-violet">
            Apollo sample export
          </span>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Verified Apollo leads, ready to use
          </h1>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground">
            This is a real sample export from Apollo, cleaned and formatted the way LyraData delivers it.
            Use the search to explore the full list, or download it as CSV.
          </p>
        </div>
        <SampleDataTable leads={leads} />
      </section>
    </SiteShell>
  );
}
