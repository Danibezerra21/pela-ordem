export default function Loading() {
  return (
    <main className="w-full animate-pulse">
      {/* Cabeçalho */}
      <section className="mb-10">
        <div className="h-4 w-32 rounded bg-muted" />

        <div className="mt-3 h-10 w-52 rounded bg-muted" />

        <div className="mt-3 h-4 w-72 rounded bg-muted" />
      </section>

      {/* Indicadores */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="rounded-xl border bg-card p-5"
          >
            <div className="h-4 w-28 rounded bg-muted" />

            <div className="mt-4 h-9 w-14 rounded bg-muted" />

            <div className="mt-5 h-3 w-40 rounded bg-muted" />
          </div>
        ))}
      </section>

      {/* Conteúdo */}
      <section className="mt-8 grid gap-6 xl:grid-cols-3">
        <div className="rounded-xl border bg-card p-6 xl:col-span-2">
          <div className="h-6 w-48 rounded bg-muted" />

          <div className="mt-3 h-4 w-80 rounded bg-muted" />

          <div className="mt-8 h-48 rounded-lg bg-muted/60" />
        </div>

        <div className="rounded-xl border bg-card p-6">
          <div className="h-6 w-32 rounded bg-muted" />

          <div className="mt-7 space-y-6">
            {[1, 2, 3, 4].map((item) => (
              <div key={item}>
                <div className="h-3 w-20 rounded bg-muted" />
                <div className="mt-2 h-4 w-36 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-xl border bg-card p-6">
        <div className="h-6 w-44 rounded bg-muted" />
        <div className="mt-3 h-4 w-64 rounded bg-muted" />
        <div className="mt-8 h-32 rounded-lg bg-muted/60" />
      </section>
    </main>
  );
}