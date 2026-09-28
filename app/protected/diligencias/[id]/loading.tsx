export default function LoadingDiligencia() {
  return (
    <main className="w-full animate-pulse">

      <div className="mb-8">

        <div className="h-4 w-40 rounded bg-muted" />

        <div className="mt-6 flex items-start justify-between gap-6">

          <div>
            <div className="h-4 w-32 rounded bg-muted" />

            <div className="mt-3 h-10 w-72 rounded bg-muted" />

            <div className="mt-3 h-5 w-80 rounded bg-muted" />
          </div>


          <div className="flex gap-3">

            <div className="h-10 w-40 rounded-lg bg-muted" />

            <div className="h-10 w-44 rounded-lg bg-muted" />

          </div>

        </div>

      </div>


      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {Array.from({
          length: 4,
        }).map(
          (_, indice) => (
            <div
              key={indice}
              className="h-28 rounded-xl border bg-card p-5"
            >
              <div className="h-4 w-20 rounded bg-muted" />

              <div className="mt-4 h-6 w-28 rounded bg-muted" />
            </div>
          )
        )}

      </div>


      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">

        <div className="space-y-6">

          <div className="rounded-xl border bg-card">

            <div className="border-b p-6">
              <div className="h-6 w-44 rounded bg-muted" />
            </div>

            <div className="grid gap-8 p-6 sm:grid-cols-2">

              {Array.from({
                length: 5,
              }).map(
                (_, indice) => (
                  <div key={indice}>
                    <div className="h-3 w-24 rounded bg-muted" />

                    <div className="mt-3 h-5 w-40 rounded bg-muted" />
                  </div>
                )
              )}

            </div>

          </div>


          <div className="h-96 rounded-xl border bg-card" />

          <div className="h-40 rounded-xl border bg-card" />

        </div>


        <div className="space-y-6">

          <div className="h-52 rounded-xl border bg-card" />

          <div className="h-64 rounded-xl border bg-card" />

        </div>

      </div>

    </main>
  );
}