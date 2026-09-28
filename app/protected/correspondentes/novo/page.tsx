import Link from "next/link";

import {
  ArrowLeft,
  Scale,
  UserRound,
} from "lucide-react";

import {
  cadastrarCorrespondente,
} from "../actions";

type SearchParams = {
  [key: string]:
    | string
    | string[]
    | undefined;
};

function obterParametro(
  valor:
    | string
    | string[]
    | undefined
) {
  if (
    Array.isArray(
      valor
    )
  ) {
    return (
      valor[0] ??
      ""
    );
  }

  return (
    valor ??
    ""
  );
}

export default async function NovoCorrespondentePage({
  searchParams,
}: {
  searchParams:
    Promise<SearchParams>;
}) {
  const parametros =
    await searchParams;

  const erro =
    obterParametro(
      parametros.erro
    );

  return (
    <main className="w-full">
      <section className="mb-8">
        <Link
          href="/protected/correspondentes"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />

          Voltar para correspondentes
        </Link>

        <p className="mt-6 text-sm font-medium text-muted-foreground">
          Base operacional
        </p>

        <h1 className="mt-1 text-4xl font-bold tracking-tight">
          Novo correspondente
        </h1>

        <p className="mt-2 max-w-3xl text-muted-foreground">
          Cadastre um advogado ou preposto para utilização nas diligências.
        </p>
      </section>

      {erro && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {erro}
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-2">
        {/* ===============================================
            ADVOGADO
        ================================================ */}

        <div className="rounded-xl border bg-card">
          <div className="border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Scale className="h-5 w-5 text-blue-800" />
              </div>

              <div>
                <h2 className="font-semibold">
                  Advogado
                </h2>

                <p className="text-sm text-muted-foreground">
                  Identificação por OAB e UF.
                </p>
              </div>
            </div>
          </div>

          <form
            action={
              cadastrarCorrespondente
            }
            className="space-y-5 p-6"
          >
            <input
              type="hidden"
              name="tipo"
              value="advogado"
            />

            <div>
              <label
                htmlFor="nome_advogado"
                className="mb-1.5 block text-sm font-medium"
              >
                Nome completo
              </label>

              <input
                id="nome_advogado"
                name="nome"
                type="text"
                required
                autoComplete="off"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-[#0b1f3a]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
              <div>
                <label
                  htmlFor="oab_numero"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Número da OAB
                </label>

                <input
                  id="oab_numero"
                  name="oab_numero"
                  type="text"
                  inputMode="numeric"
                  required
                  autoComplete="off"
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-[#0b1f3a]"
                />
              </div>

              <div>
                <label
                  htmlFor="oab_uf"
                  className="mb-1.5 block text-sm font-medium"
                >
                  UF
                </label>

                <input
                  id="oab_uf"
                  name="oab_uf"
                  type="text"
                  maxLength={2}
                  required
                  autoComplete="off"
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm uppercase outline-none focus:border-[#0b1f3a]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-[#0b1f3a] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              Cadastrar advogado
            </button>
          </form>
        </div>

        {/* ===============================================
            PREPOSTO
        ================================================ */}

        <div className="rounded-xl border bg-card">
          <div className="border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50">
                <UserRound className="h-5 w-5 text-violet-800" />
              </div>

              <div>
                <h2 className="font-semibold">
                  Preposto
                </h2>

                <p className="text-sm text-muted-foreground">
                  Identificação por CPF.
                </p>
              </div>
            </div>
          </div>

          <form
            action={
              cadastrarCorrespondente
            }
            className="space-y-5 p-6"
          >
            <input
              type="hidden"
              name="tipo"
              value="preposto"
            />

            <div>
              <label
                htmlFor="nome_preposto"
                className="mb-1.5 block text-sm font-medium"
              >
                Nome completo
              </label>

              <input
                id="nome_preposto"
                name="nome"
                type="text"
                required
                autoComplete="off"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-[#0b1f3a]"
              />
            </div>

            <div>
              <label
                htmlFor="cpf"
                className="mb-1.5 block text-sm font-medium"
              >
                CPF
              </label>

              <input
                id="cpf"
                name="cpf"
                type="text"
                inputMode="numeric"
                required
                autoComplete="off"
                placeholder="Somente números ou CPF formatado"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-[#0b1f3a]"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-[#0b1f3a] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              Cadastrar preposto
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}