import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { LiveDataConsole } from "@/components/site/LiveDataConsole";
import rawApollo from "@/lib/apollo-leads-raw.json";
import rawLinkedin from "@/lib/linkedin-leads-raw.json";
import rawZoominfo from "@/lib/zoominfo-leads-raw.json";
import { PremiumArrowRight } from "@/components/site/PremiumIcons";

type RawData = {
  headers: string[];
  rows: Record<string, string | number | boolean>[];
};
const apolloData = rawApollo as RawData;
const linkedinData = rawLinkedin as RawData;
const zoominfoData = rawZoominfo as RawData;
const totalRows =
  apolloData.rows.length + linkedinData.rows.length + zoominfoData.rows.length;

export const Route = createFileRoute("/sample-data")({
  head: () => ({
    meta: [
      { title: "Live sample data — Apollo, LinkedIn, ZoomInfo | LyraData" },
      {
        name: "description",
        content:
          "Browse verified B2B lead samples from Apollo, LinkedIn Sales Navigator, and ZoomInfo. Search, preview, and download CSVs before you order.",
      },
      { property: "og:title", content: "Live sample data — LyraData" },
      {
        property: "og:description",
        content:
          "Preview and download verified B2B lead samples across three sources.",
      },
    ],
  }),
  component: SampleDataPage,
});

function SampleDataPage() {
  return (
    <SiteShell>
      <div className="theme-midnight bg-background text-foreground">
        <section className="relative overflow-hidden px-6 pt-20 pb-10 lg:pt-28">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-[-10%] size-[700px] -translate-x-1/2 rounded-full bg-indigo/20 blur-[140px]" />
          </div>
          <div className="mx-auto max-w-5xl text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/60 hover:text-foreground"
            >
              <span className="rotate-180"><PremiumArrowRight className="size-3" /></span>
              Back to home
            </Link>
            <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.02] tracking-tight md:text-6xl">
              Live sample data
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-foreground/70">
              Real rows from our Apollo, LinkedIn, and ZoomInfo feeds. Search
              anything, download a CSV, and see the exact format we deliver.
            </p>
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="mx-auto grid max-w-7xl auto-rows-[220px] grid-cols-1 gap-4 md:grid-cols-4">
            <LiveDataConsole
              data={{
                apollo: apolloData,
                linkedin: linkedinData,
                zoominfo: zoominfoData,
              }}
              totalRows={totalRows}
            />
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
