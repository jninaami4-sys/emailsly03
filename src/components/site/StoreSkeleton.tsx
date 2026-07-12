export function StoreSkeleton() {
  return (
    <div className="min-h-screen animate-pulse">
      <section className="border-b border-border px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="h-10 w-48 rounded-lg bg-muted" />
          <div className="mt-3 h-5 max-w-2xl rounded bg-muted" />
          <div className="mt-8 h-12 w-full rounded-xl bg-muted md:w-2/3" />
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-8 w-20 rounded-full bg-muted" />
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 h-4 w-32 rounded bg-muted" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-6">
                <div className="h-48 rounded-xl bg-muted" />
                <div className="mt-4 h-5 w-3/4 rounded bg-muted" />
                <div className="mt-2 h-4 w-1/2 rounded bg-muted" />
                <div className="mt-4 flex items-center justify-between">
                  <div className="h-6 w-20 rounded bg-muted" />
                  <div className="h-9 w-28 rounded-lg bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
