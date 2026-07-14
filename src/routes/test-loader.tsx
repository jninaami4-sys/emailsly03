import { Loader713Panel } from "@/components/site/Loader713";

export default function TestLoader() {
  return (
    <div className="relative min-h-[80vh] overflow-hidden bg-gradient-to-b from-background via-background to-violet-soft/25">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-8 size-[480px] rounded-full bg-violet/20 blur-[140px] animate-aurora-slow" />
        <div className="absolute right-[-12%] top-1/4 size-[420px] rounded-full bg-neon-orange/16 blur-[130px] animate-aurora-med" />
        <div className="absolute bottom-[-24%] left-1/3 size-[520px] rounded-full bg-emerald/12 blur-[150px] animate-aurora-fast" />
        <div className="absolute left-1/2 top-1/2 size-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo/10 blur-[120px] animate-pulse-slow" />
      </div>
      <div className="relative">
        <Loader713Panel
          chip="Routing"
          title="Preparing your page"
          subtitle="One breath while we line things up."
          steps={[
            "Warming the cache",
            "Fetching fresh data",
            "Rendering components",
          ]}
        />
      </div>
    </div>
  );
}
