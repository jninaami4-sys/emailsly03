export function TrackResultSkeleton() {
  return (
    <div className="mt-10 space-y-6 animate-pulse" aria-busy="true" aria-live="polite">
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_20px_60px_-30px_rgba(24,24,60,0.25)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-secondary/40 px-5 py-4 sm:px-8">
          <div className="space-y-2">
            <div className="h-3 w-16 rounded bg-muted" />
            <div className="h-6 w-40 rounded bg-muted" />
          </div>
          <div className="h-7 w-28 rounded-full bg-muted" />
        </div>
        <div className="grid gap-4 px-5 py-5 sm:grid-cols-4 sm:px-8 sm:py-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-16 rounded bg-muted" />
              <div className="h-4 w-24 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-[0_20px_60px_-30px_rgba(24,24,60,0.25)] sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="h-6 w-28 rounded bg-muted" />
          <div className="h-4 w-20 rounded bg-muted" />
        </div>
        <div className="mb-8 h-2 w-full rounded-full bg-muted" />
        <ol className="space-y-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="flex items-start gap-4">
              <div className="size-10 shrink-0 rounded-xl bg-muted" />
              <div className="min-w-0 flex-1 space-y-2 pt-1">
                <div className="h-4 w-40 rounded bg-muted" />
                <div className="h-3 w-64 max-w-full rounded bg-muted" />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
