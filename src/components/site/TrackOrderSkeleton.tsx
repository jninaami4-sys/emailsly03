export function TrackOrderSkeleton() {
  return (
    <div className="min-h-screen animate-pulse">
      <section className="relative overflow-hidden px-6 py-24">
        <div className="relative mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-4 h-6 w-32 rounded-full bg-muted" />
            <div className="mx-auto h-10 w-3/4 max-w-lg rounded-lg bg-muted" />
            <div className="mx-auto mt-3 h-5 w-2/3 max-w-md rounded bg-muted" />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
              <div className="grid gap-5 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-24 rounded bg-muted" />
                    <div className="h-12 w-full rounded-xl bg-muted" />
                  </div>
                ))}
                <div className="space-y-2 md:col-span-2">
                  <div className="h-4 w-24 rounded bg-muted" />
                  <div className="h-32 w-full rounded-xl bg-muted" />
                </div>
              </div>
              <div className="mt-6 h-12 w-full rounded-xl bg-muted" />
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
              <div className="mb-6 h-7 w-40 rounded bg-muted" />
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-muted" />
                ))}
              </div>
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-20 rounded bg-muted" />
                  <div className="h-4 w-16 rounded bg-muted" />
                </div>
                <div className="h-2 w-full rounded bg-muted" />
              </div>
              <div className="mt-6 h-10 w-full rounded-xl bg-muted" />
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-border bg-gradient-to-b from-background to-muted/30 px-6 py-24">
        <div className="relative mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <div className="mb-5 h-6 w-32 rounded-full bg-muted" />
              <div className="h-10 w-3/4 rounded-lg bg-muted" />
              <div className="mt-4 h-5 w-2/3 rounded bg-muted" />
              <div className="mt-8 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="size-8 shrink-0 rounded-lg bg-muted" />
                    <div className="flex-1 space-y-1">
                      <div className="h-5 w-32 rounded bg-muted" />
                      <div className="h-4 w-48 rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex gap-3">
                <div className="h-10 w-36 rounded-xl bg-muted" />
                <div className="h-10 w-32 rounded-xl bg-muted" />
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-primary/10 to-transparent blur-2xl" />
              <div className="relative rounded-[1.75rem] p-[2px]">
                <div className="rounded-[1.65rem] bg-card p-6 md:p-8">
                  <div className="mb-6 h-7 w-40 rounded bg-muted" />
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-16 rounded-xl bg-muted" />
                    ))}
                  </div>
                  <div className="mt-6 h-4 w-full rounded bg-muted" />
                  <div className="mt-6 h-10 w-full rounded-xl bg-muted" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
