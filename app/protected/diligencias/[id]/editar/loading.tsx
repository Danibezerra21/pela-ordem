import {
  LoaderCircle,
} from "lucide-react";

export default function LoadingEdicaoDiligencia() {
  return (
    <main className="w-full">
      <div className="mb-8">
        <div className="flex items-center gap-3 text-[#0b1f3a]">
          <LoaderCircle className="h-5 w-5 animate-spin" />

          <span className="text-sm font-medium">
            Carregando edição...
          </span>
        </div>

        <div className="mt-6 animate-pulse">
          <div className="h-4 w-32 rounded bg-muted" />

          <div className="mt-3 h-10 w-72 rounded bg-muted" />

          <div className="mt-3 h-5 w-96 max-w-full rounded bg-muted" />
        </div>
      </div>

      <div className="space-y-6 animate-pulse">
        <div className="rounded-xl border bg-card">
          <div className="border-b p-6">
            <div className="h-6 w-40 rounded bg-muted" />
          </div>

          <div className="grid gap-6 p-6 md:grid-cols-2">
            {Array.from({
              length: 4,
            }).map(
              (_, indice) => (
                <div
                  key={indice}
                >
                  <div className="h-4 w-28 rounded bg-muted" />

                  <div className="mt-3 h-11 w-full rounded-lg bg-muted" />
                </div>
              )
            )}
          </div>
        </div>

        <div className="h-52 rounded-xl border bg-card" />

        <div className="h-52 rounded-xl border bg-card" />

        <div className="h-80 rounded-xl border bg-card" />
      </div>
    </main>
  );
}