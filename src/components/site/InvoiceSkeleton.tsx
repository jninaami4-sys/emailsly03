export function InvoiceSkeleton() {
  return (
    <div
      className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-background px-4 py-12 md:py-20 animate-pulse"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="relative mx-auto max-w-4xl">
        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="mx-auto size-20 rounded-full bg-muted" />
          <div className="mx-auto mt-6 h-6 w-40 rounded-full bg-muted" />
          <div className="mx-auto mt-4 h-10 w-3/4 max-w-lg rounded-lg bg-muted" />
          <div className="mx-auto mt-3 h-5 w-2/3 max-w-md rounded bg-muted" />
        </div>

        {/* Actions */}
        <div className="mb-6 flex flex-wrap justify-center gap-3">
          <div className="h-11 w-40 rounded-xl bg-muted" />
          <div className="h-11 w-36 rounded-xl bg-muted" />
          <div className="h-11 w-32 rounded-xl bg-muted" />
        </div>

        {/* Invoice card */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-[0_20px_60px_-30px_rgba(24,24,60,0.25)] sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-6 border-b border-border pb-6">
            <div className="space-y-3">
              <div className="h-8 w-40 rounded bg-muted" />
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="h-4 w-48 rounded bg-muted" />
            </div>
            <div className="space-y-3 text-right">
              <div className="ml-auto h-4 w-24 rounded bg-muted" />
              <div className="ml-auto h-6 w-40 rounded bg-muted" />
              <div className="ml-auto h-4 w-28 rounded bg-muted" />
            </div>
          </div>

          {/* Bill to / Payment */}
          <div className="grid gap-6 border-b border-border py-6 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-20 rounded bg-muted" />
                <div className="h-5 w-40 rounded bg-muted" />
                <div className="h-4 w-56 max-w-full rounded bg-muted" />
                <div className="h-4 w-32 rounded bg-muted" />
              </div>
            ))}
          </div>

          {/* Line items */}
          <div className="py-6">
            <div className="mb-3 grid grid-cols-12 gap-3 border-b border-border pb-3">
              <div className="col-span-6 h-3 w-24 rounded bg-muted" />
              <div className="col-span-2 h-3 w-12 rounded bg-muted" />
              <div className="col-span-2 h-3 w-16 rounded bg-muted" />
              <div className="col-span-2 ml-auto h-3 w-16 rounded bg-muted" />
            </div>
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="grid grid-cols-12 gap-3 py-3">
                <div className="col-span-6 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
                <div className="col-span-2 h-4 w-10 rounded bg-muted" />
                <div className="col-span-2 h-4 w-14 rounded bg-muted" />
                <div className="col-span-2 ml-auto h-4 w-16 rounded bg-muted" />
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="ml-auto max-w-xs space-y-3 border-t border-border pt-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 w-20 rounded bg-muted" />
                <div className="h-4 w-16 rounded bg-muted" />
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-border pt-3">
              <div className="h-5 w-16 rounded bg-muted" />
              <div className="h-6 w-24 rounded bg-muted" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
