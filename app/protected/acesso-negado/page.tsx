import Link from "next/link";

import {
  LockKeyhole,
} from "lucide-react";

export default function AcessoNegadoPage() {
  return (
    <main className="flex min-h-[65vh] items-center justify-center">
      <section className="w-full max-w-lg rounded-xl border bg-card p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <LockKeyhole className="h-5 w-5" />
        </div>

        <h1 className="mt-5 text-2xl font-semibold">
          Acesso não autorizado
        </h1>

        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Seu perfil não possui autorização para acessar esta área do NOTE LITIS.
        </p>

        <Link
          href="/protected"
          className="mt-6 inline-flex rounded-lg bg-[#0b1f3a] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          Voltar
        </Link>
      </section>
    </main>
  );
}