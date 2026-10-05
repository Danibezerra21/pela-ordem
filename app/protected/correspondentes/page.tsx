import Link from "next/link";


import {
  Pencil,
  Power,
  RotateCcw,
  Search,
  Scale,
  UserPlus,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  redirect,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  alternarStatusCorrespondente,
} from "./actions";

export const instant = false;

/* =====================================================
   TIPOS
===================================================== */

type Correspondente = {
  id: string;

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

  criado_em:
    string;
};

type SearchParams = {
  [key: string]:
    | string
    | string[]
    | undefined;
};

/* =====================================================
   HELPERS
===================================================== */

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

function formatarCpf(
  valor:
    string | null
) {
  if (!valor) {
    return "CPF não informado";
  }

  const cpf =
    valor.replace(
      /\D/g,
      ""
    );

  if (
    cpf.length !==
    11
  ) {
    return valor;
  }

  return (
    `${cpf.slice(0, 3)}.` +
    `${cpf.slice(3, 6)}.` +
    `${cpf.slice(6, 9)}-` +
    `${cpf.slice(9, 11)}`
  );
}

function formatarOab(
  numero:
    string | null,

  uf:
    string | null
) {
  if (
    !numero
  ) {
    return "OAB não informada";
  }

  return `OAB/${
    uf ??
    "—"
  } ${numero}`;
}

function formatarData(
  valor:
    string
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone:
        "America/Recife",

      day:
        "2-digit",

      month:
        "2-digit",

      year:
        "numeric",
    }
  ).format(
    new Date(
      valor
    )
  );
}

/* =====================================================
   CARD
===================================================== */

function ResumoCard({
  titulo,
  valor,
  descricao,
}: {
  titulo:
    string;

  valor:
    number;

  descricao:
    string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">
        {titulo}
      </p>

      <p className="mt-2 text-3xl font-bold">
        {valor}
      </p>

      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {descricao}
      </p>
    </div>
  );
}

/* =====================================================
   PÁGINA
===================================================== */

export default async function CorrespondentesPage({
  searchParams,
}: {
  searchParams:
    Promise<SearchParams>;
}) {
  const parametros =
    await searchParams;

  const busca =
    obterParametro(
      parametros.busca
    )
      .trim()
      .toUpperCase();

  const tipoParametro =
    obterParametro(
      parametros.tipo
    );

  const statusParametro =
    obterParametro(
      parametros.status
    );

  const mensagem =
    obterParametro(
      parametros.mensagem
    );

  const erro =
    obterParametro(
      parametros.erro
    );

  const tipo =
    tipoParametro ===
      "advogado" ||
    tipoParametro ===
      "preposto"
      ? tipoParametro
      : "todos";

  const status =
    statusParametro ===
      "inativos" ||
    statusParametro ===
      "todos"
      ? statusParametro
      : "ativos";

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

  const empresaId =
    membro
      .empresa_id as string;

  /* ===================================================
     CORRESPONDENTES
  =================================================== */

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
          ativo,
          criado_em
        `
      )
      .eq(
        "empresa_id",
        empresaId
      )
      .is(
        "excluido_em",
        null
      )
      .order(
        "nome",
        {
          ascending:
            true,
        }
      );

  if (error) {
    throw new Error(
      `Erro ao carregar correspondentes: ${error.message}`
    );
  }

  const correspondentes =
    (
      data ??
      []
    ) as Correspondente[];

  /* ===================================================
     INDICADORES
  =================================================== */

  const advogadosAtivos =
    correspondentes.filter(
      (item) =>
        item.tipo ===
          "advogado" &&
        item.ativo
    ).length;

  const prepostosAtivos =
    correspondentes.filter(
      (item) =>
        item.tipo ===
          "preposto" &&
        item.ativo
    ).length;

  const inativos =
    correspondentes.filter(
      (item) =>
        !item.ativo
    ).length;

  /* ===================================================
     FILTROS
  =================================================== */

  const filtrados =
    correspondentes.filter(
      (item) => {
        if (
          tipo !==
            "todos" &&
          item.tipo !==
            tipo
        ) {
          return false;
        }

        if (
          status ===
            "ativos" &&
          !item.ativo
        ) {
          return false;
        }

        if (
          status ===
            "inativos" &&
          item.ativo
        ) {
          return false;
        }

        if (
          busca
        ) {
          const identificacao =
            item.tipo ===
            "advogado"
              ? `${item.oab_numero ?? ""} ${item.oab_uf ?? ""}`
              : item.cpf ??
                "";

          const alvo =
            `${item.nome} ${identificacao}`
              .toUpperCase();

          const buscaNumerica =
            busca.replace(
              /\D/g,
              ""
            );

          const alvoNumerico =
            alvo.replace(
              /\D/g,
              ""
            );

          const encontrouTexto =
            alvo.includes(
              busca
            );

          const encontrouNumero =
            Boolean(
              buscaNumerica
            ) &&
            alvoNumerico.includes(
              buscaNumerica
            );

          if (
            !encontrouTexto &&
            !encontrouNumero
          ) {
            return false;
          }
        }

        return true;
      }
    );

  return (
    <main className="w-full">
      {/* =================================================
          CABEÇALHO
      ================================================== */}

      <section className="mb-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Base operacional
            </p>

            <h1 className="mt-1 text-4xl font-bold tracking-tight">
              Correspondentes
            </h1>

            <p className="mt-2 max-w-3xl text-muted-foreground">
              Gerencie os advogados e prepostos disponíveis para designação nas diligências.
            </p>
          </div>

          <Link
            href="/protected/correspondentes/novo"
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#0b1f3a] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            <UserPlus className="h-4 w-4" />

            Novo correspondente
          </Link>
        </div>
      </section>

      {/* =================================================
          MENSAGENS
      ================================================== */}

      {mensagem && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {mensagem}
        </div>
      )}

      {erro && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {erro}
        </div>
      )}

      {/* =================================================
          INDICADORES
      ================================================== */}

      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ResumoCard
          titulo="Cadastrados"
          valor={
            correspondentes.length
          }
          descricao="Total de profissionais na base."
        />

        <ResumoCard
          titulo="Advogados ativos"
          valor={
            advogadosAtivos
          }
          descricao="Disponíveis para novas designações."
        />

        <ResumoCard
          titulo="Prepostos ativos"
          valor={
            prepostosAtivos
          }
          descricao="Disponíveis para novas designações."
        />

        <ResumoCard
          titulo="Inativos"
          valor={
            inativos
          }
          descricao="Mantidos no histórico, mas fora de novas seleções."
        />
      </section>

      {/* =================================================
          FILTROS
      ================================================== */}

      <section className="mb-6 rounded-xl border bg-card p-5">
        <form
          method="get"
          action="/protected/correspondentes"
          className="grid gap-4 lg:grid-cols-[1fr_190px_190px_auto]"
        >
          <div>
            <label
              htmlFor="busca"
              className="mb-1.5 block text-sm font-medium"
            >
              Buscar
            </label>

            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

              <input
                id="busca"
                name="busca"
                type="text"
                defaultValue={
                  obterParametro(
                    parametros.busca
                  )
                }
                placeholder="Nome, OAB ou CPF"
                className="w-full rounded-lg border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#0b1f3a]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="tipo"
              className="mb-1.5 block text-sm font-medium"
            >
              Tipo
            </label>

            <select
              id="tipo"
              name="tipo"
              defaultValue={
                tipo
              }
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
            >
              <option value="todos">
                Todos
              </option>

              <option value="advogado">
                Advogados
              </option>

              <option value="preposto">
                Prepostos
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="status"
              className="mb-1.5 block text-sm font-medium"
            >
              Situação
            </label>

            <select
              id="status"
              name="status"
              defaultValue={
                status
              }
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
            >
              <option value="ativos">
                Ativos
              </option>

              <option value="inativos">
                Inativos
              </option>

              <option value="todos">
                Todos
              </option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm font-medium hover:bg-muted lg:w-auto"
            >
              Filtrar
            </button>
          </div>
        </form>
      </section>

      {/* =================================================
          LISTAGEM
      ================================================== */}

      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <UsersRound className="h-5 w-5 text-[#0b1f3a]" />

            <div>
              <h2 className="font-semibold">
                Profissionais
              </h2>

              <p className="text-sm text-muted-foreground">
                {filtrados.length}{" "}
                {filtrados.length ===
                1
                  ? "registro encontrado"
                  : "registros encontrados"}
              </p>
            </div>
          </div>
        </div>

        {filtrados.length ===
          0 ? (
          <div className="px-6 py-12 text-center">
            <UserRound className="mx-auto h-8 w-8 text-muted-foreground" />

            <p className="mt-3 font-medium">
              Nenhum correspondente encontrado
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Ajuste os filtros ou cadastre um novo profissional.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filtrados.map(
              (
                correspondente
              ) => (
                <article
                  key={
                    correspondente.id
                  }
                  className="flex flex-col gap-5 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={
                          correspondente.tipo ===
                          "advogado"
                            ? "rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800"
                            : "rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-800"
                        }
                      >
                        {correspondente.tipo ===
                        "advogado"
                          ? "Advogado"
                          : "Preposto"}
                      </span>

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

                    <div className="mt-3 flex items-center gap-2">
                      {correspondente.tipo ===
                      "advogado" ? (
                        <Scale className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}

                      <h3 className="truncate text-base font-semibold">
                        {
                          correspondente.nome
                        }
                      </h3>
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {correspondente.tipo ===
                      "advogado"
                        ? formatarOab(
                            correspondente
                              .oab_numero,
                            correspondente
                              .oab_uf
                          )
                        : formatarCpf(
                            correspondente
                              .cpf
                          )}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Cadastrado em{" "}
                      {formatarData(
                        correspondente
                          .criado_em
                      )}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link
                      href={`/protected/correspondentes/${correspondente.id}/editar`}
                      className="inline-flex items-center gap-2 rounded-lg border bg-background px-3.5 py-2 text-sm font-medium hover:bg-muted"
                    >
                      <Pencil className="h-4 w-4" />

                      Editar
                    </Link>

                    <form
                      action={
                        alternarStatusCorrespondente
                      }
                    >
                      <input
                        type="hidden"
                        name="id"
                        value={
                          correspondente.id
                        }
                      />

                      <button
                        type="submit"
                        className={
                          correspondente.ativo
                            ? "inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-medium text-red-800 hover:bg-red-100"
                            : "inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
                        }
                      >
                        {correspondente.ativo ? (
                          <>
                            <Power className="h-4 w-4" />
                            Inativar
                          </>
                        ) : (
                          <>
                            <RotateCcw className="h-4 w-4" />
                            Reativar
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>
    </main>
  );
}