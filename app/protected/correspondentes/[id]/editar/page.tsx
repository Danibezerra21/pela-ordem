import Link from "next/link";

import {
  ArrowLeft,
  Scale,
  UserRound,
} from "lucide-react";

import {
  notFound,
  redirect,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  atualizarCorrespondente,
} from "../../actions";

type SearchParams = {
  [key: string]:
    | string
    | string[]
    | undefined;
};

type Correspondente = {
  id:
    string;

  tipo:
    | "advogado"
    | "preposto";

  nome:
    string;

  oab_numero:
    string | null;

  oab_uf:
    string | null;

  cpf:
    string | null;

  ativo:
    boolean;
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

export default async function EditarCorrespondentePage({
  params,
  searchParams,
}: {
  params:
    Promise<{
      id: string;
    }>;

  searchParams:
    Promise<SearchParams>;
}) {
  const {
    id,
  } =
    await params;

  const parametros =
    await searchParams;

  const erro =
    obterParametro(
      parametros.erro
    );

  const supabase =
    await createClient();

  /* ===================================================
     CONTEXTO
  =================================================== */

  const {
    data:
      authData,

    error:
      authError,
  } =
    await supabase
      .auth
      .getClaims();

  if (
    authError ||
    !authData
      ?.claims
      ?.sub
  ) {
    redirect(
      "/auth/login"
    );
  }

  const usuarioId =
    authData
      .claims
      .sub as string;

  const {
    data:
      membro,

    error:
      erroMembro,
  } =
    await supabase
      .from(
        "membros_empresa"
      )
      .select(
        "empresa_id"
      )
      .eq(
        "usuario_id",
        usuarioId
      )
      .eq(
        "ativo",
        true
      )
      .maybeSingle();

  if (
    erroMembro ||
    !membro
  ) {
    throw new Error(
      "Não foi possível identificar a empresa do usuário."
    );
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "correspondentes"
      )
      .select(
        `
          id,
          tipo,
          nome,
          oab_numero,
          oab_uf,
          cpf,
          ativo
        `
      )
      .eq(
        "id",
        id
      )
      .eq(
        "empresa_id",
        membro
          .empresa_id
      )
      .is(
        "excluido_em",
        null
      )
      .maybeSingle();

  if (error) {
    throw new Error(
      `Erro ao carregar correspondente: ${error.message}`
    );
  }

  if (!data) {
    notFound();
  }

  const correspondente =
    data as Correspondente;

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

        <div className="mt-6 flex items-center gap-3">
          <div
            className={
              correspondente.tipo ===
              "advogado"
                ? "flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50"
                : "flex h-11 w-11 items-center justify-center rounded-lg bg-violet-50"
            }
          >
            {correspondente.tipo ===
            "advogado" ? (
              <Scale className="h-5 w-5 text-blue-800" />
            ) : (
              <UserRound className="h-5 w-5 text-violet-800" />
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {correspondente.tipo ===
              "advogado"
                ? "Advogado"
                : "Preposto"}
            </p>

            <h1 className="text-3xl font-bold tracking-tight">
              Editar correspondente
            </h1>
          </div>
        </div>
      </section>

      {erro && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {erro}
        </div>
      )}

      <section className="max-w-2xl rounded-xl border bg-card">
        <div className="border-b px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">
                Dados do profissional
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                A alteração atualiza o cadastro utilizado nas diligências.
              </p>
            </div>

            <span
              className={
                correspondente.ativo
                  ? "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"
                  : "rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
              }
            >
              {correspondente.ativo
                ? "Ativo"
                : "Inativo"}
            </span>
          </div>
        </div>

        <form
          action={
            atualizarCorrespondente
          }
          className="space-y-5 p-6"
        >
          <input
            type="hidden"
            name="id"
            value={
              correspondente.id
            }
          />

          <div>
            <label
              htmlFor="nome"
              className="mb-1.5 block text-sm font-medium"
            >
              Nome completo
            </label>

            <input
              id="nome"
              name="nome"
              type="text"
              required
              defaultValue={
                correspondente.nome
              }
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-[#0b1f3a]"
            />
          </div>

          {correspondente.tipo ===
          "advogado" ? (
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
                  defaultValue={
                    correspondente
                      .oab_numero ??
                    ""
                  }
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
                  defaultValue={
                    correspondente
                      .oab_uf ??
                    ""
                  }
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm uppercase outline-none focus:border-[#0b1f3a]"
                />
              </div>
            </div>
          ) : (
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
                defaultValue={
                  correspondente
                    .cpf ??
                  ""
                }
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-[#0b1f3a]"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-3 border-t pt-5">
            <button
              type="submit"
              className="rounded-lg bg-[#0b1f3a] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              Salvar alterações
            </button>

            <Link
              href="/protected/correspondentes"
              className="rounded-lg border bg-background px-4 py-2.5 text-sm font-medium hover:bg-muted"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}