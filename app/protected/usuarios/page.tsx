import {
  CircleCheck,
  Clock3,
  KeyRound,
  ShieldCheck,
  UserCheck,
  UserPlus,
  UserRound,
  UsersRound,
  WalletCards,
  XCircle,
} from "lucide-react";

import {
  redirect,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  alterarStatusUsuario,
  alterarTipoUsuario,
  convidarUsuario,
  reenviarConvite,
} from "./actions";

import {
  AvisoSucesso,
} from "./aviso-sucesso";

import {
  BotaoEnviarConvite,
} from "./botao-enviar-convite";

import {
  BotaoReenviarConvite,
} from "./botao-reenviar-convite";

/* =========================================================
   TIPOS
========================================================= */

type MembroEmpresa = {
  id: string;
  empresa_id: string;
  usuario_id: string;
  papel: string;
  nucleo: string | null;
  ativo: boolean;
  criado_em: string;
};

type PerfilUsuario = {
  id: string;
  nome: string | null;
  email: string | null;
};

type UsuarioTela = {
  membroId: string;
  usuarioId: string;

  nome: string;
  email: string;

  papel: string;
  nucleo: string | null;

  tipoAcesso:
    | "master"
    | "operacional"
    | "financeiro";

  situacao:
    | "ativo"
    | "pendente"
    | "revogado";

  criadoEm: string;
};

/* =========================================================
   HELPERS
========================================================= */

function obterTipoAcesso(
  membro: MembroEmpresa
): UsuarioTela["tipoAcesso"] {
  if (
    membro.papel === "master"
  ) {
    return "master";
  }

  if (
    membro.nucleo === "financeiro"
  ) {
    return "financeiro";
  }

  return "operacional";
}

function descricaoTipoAcesso(
  tipo: UsuarioTela["tipoAcesso"]
) {
  if (
    tipo === "master"
  ) {
    return (
      "Acesso total ao sistema, incluindo operação, financeiro e gestão de usuários."
    );
  }

  if (
    tipo === "financeiro"
  ) {
    return (
      "Acesso ao módulo financeiro e aos relatórios financeiros."
    );
  }

  return (
    "Acesso à gestão operacional das diligências, sem acesso ao módulo financeiro consolidado ou à gestão de usuários."
  );
}

function formatarData(
  valor: string
) {
  if (!valor) {
    return "—";
  }

  const data =
    new Date(valor);

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return "—";
  }

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
  ).format(data);
}

/* =========================================================
   BADGES
========================================================= */

function BadgeTipo({
  tipo,
}: {
  tipo: UsuarioTela["tipoAcesso"];
}) {
  if (
    tipo === "master"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800">
        <ShieldCheck className="h-3.5 w-3.5" />

        Master
      </span>
    );
  }

  if (
    tipo === "financeiro"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800">
        <WalletCards className="h-3.5 w-3.5" />

        Financeiro
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
      <UserRound className="h-3.5 w-3.5" />

      Operacional
    </span>
  );
}

function BadgeSituacao({
  situacao,
}: {
  situacao: UsuarioTela["situacao"];
}) {
  if (
    situacao === "ativo"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
        <CircleCheck className="h-3.5 w-3.5" />

        Ativo
      </span>
    );
  }

  if (
    situacao === "pendente"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
        <Clock3 className="h-3.5 w-3.5" />

        Convite pendente
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-800">
      <XCircle className="h-3.5 w-3.5" />

      Acesso revogado
    </span>
  );
}

/* =========================================================
   PÁGINA
========================================================= */

export default async function UsuariosPage() {
  const supabase =
    await createClient();

  const admin =
    await createAdminClient();

  /* =====================================================
     AUTENTICAÇÃO
  ===================================================== */

  const {
    data:
      authData,

    error:
      authError,
  } =
    await supabase.auth.getClaims();

  if (
    authError ||
    !authData?.claims?.sub
  ) {
    redirect(
      "/auth/login"
    );
  }

  const usuarioId =
    authData.claims.sub;

  /* =====================================================
     USUÁRIO MASTER
  ===================================================== */

  const {
    data:
      membroMaster,

    error:
      erroMaster,
  } =
    await supabase
      .from(
        "membros_empresa"
      )
      .select(`
        id,
        empresa_id,
        usuario_id,
        papel,
        nucleo,
        ativo,
        criado_em
      `)
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
    erroMaster
  ) {
    throw new Error(
      `Não foi possível identificar seu acesso: ${erroMaster.message}`
    );
  }

  if (
    !membroMaster
  ) {
    redirect(
      "/protected/acesso-negado"
    );
  }

  if (
    membroMaster.papel !==
    "master"
  ) {
    redirect(
      "/protected/acesso-negado"
    );
  }

  const empresaId =
    membroMaster
      .empresa_id;

  /* =====================================================
     EMPRESA
  ===================================================== */

  const {
    data:
      empresa,

    error:
      erroEmpresa,
  } =
    await supabase
      .from("empresas")
      .select(
        "id, nome, status_acesso"
      )
      .eq(
        "id",
        empresaId
      )
      .single();

  if (
    erroEmpresa ||
    !empresa
  ) {
    throw new Error(
      `Não foi possível localizar a empresa: ${
        erroEmpresa?.message ??
        "empresa não encontrada"
      }`
    );
  }

  if (
    empresa.status_acesso !==
    "ativo"
  ) {
    redirect(
      "/protected"
    );
  }

  /* =====================================================
     MEMBROS
  ===================================================== */

  const {
    data:
      membrosConsultados,

    error:
      erroMembros,
  } =
    await admin
      .from(
        "membros_empresa"
      )
      .select(`
        id,
        empresa_id,
        usuario_id,
        papel,
        nucleo,
        ativo,
        criado_em
      `)
      .eq(
        "empresa_id",
        empresaId
      )
      .order(
        "criado_em",
        {
          ascending:
            true,
        }
      );

  if (
    erroMembros
  ) {
    throw new Error(
      `Não foi possível carregar os usuários: ${erroMembros.message}`
    );
  }

  const membros =
    (
      membrosConsultados ??
      []
    ) as MembroEmpresa[];

  const idsUsuarios =
    membros.map(
      (membro) =>
        membro.usuario_id
    );

  /* =====================================================
     PERFIS
  ===================================================== */

  let perfis:
    PerfilUsuario[] = [];

  if (
    idsUsuarios.length >
    0
  ) {
    const {
      data,
      error,
    } =
      await admin
        .from(
          "perfis_usuarios"
        )
        .select(`
          id,
          nome,
          email
        `)
        .in(
          "id",
          idsUsuarios
        );

    if (error) {
      throw new Error(
        `Não foi possível carregar os perfis dos usuários: ${error.message}`
      );
    }

    perfis =
      (
        data ??
        []
      ) as PerfilUsuario[];
  }

  const perfisPorId =
    new Map(
      perfis.map(
        (perfil) => [
          perfil.id,
          perfil,
        ]
      )
    );

  /* =====================================================
     STATUS NO AUTH
  ===================================================== */

  const usuarios: UsuarioTela[] =
    await Promise.all(
      membros.map(
        async (
          membro
        ) => {
          const perfil =
            perfisPorId.get(
              membro.usuario_id
            );

          const {
            data:
              authUsuario,

            error:
              erroAuthUsuario,
          } =
            await admin
              .auth
              .admin
              .getUserById(
                membro.usuario_id
              );

          const usuarioAuth =
            erroAuthUsuario
              ? null
              : authUsuario?.user;

          let situacao:
            UsuarioTela["situacao"];

          if (
            !membro.ativo
          ) {
            situacao =
              "revogado";
          } else if (
            usuarioAuth
              ?.email_confirmed_at
          ) {
            situacao =
              "ativo";
          } else {
            situacao =
              "pendente";
          }

          return {
            membroId:
              membro.id,

            usuarioId:
              membro.usuario_id,

            nome:
              perfil?.nome ||
              usuarioAuth
                ?.user_metadata
                ?.nome ||
              "Usuário",

            email:
              perfil?.email ||
              usuarioAuth?.email ||
              "E-mail não informado",

            papel:
              membro.papel,

            nucleo:
              membro.nucleo,

            tipoAcesso:
              obterTipoAcesso(
                membro
              ),

            situacao,

            criadoEm:
              membro.criado_em,
          };
        }
      )
    );

  /* =====================================================
     MÉTRICAS
  ===================================================== */

  const totalAtivos =
    usuarios.filter(
      (usuario) =>
        usuario.situacao ===
        "ativo"
    ).length;

  const totalPendentes =
    usuarios.filter(
      (usuario) =>
        usuario.situacao ===
        "pendente"
    ).length;

  const totalFinanceiro =
    usuarios.filter(
      (usuario) =>
        usuario.tipoAcesso ===
          "financeiro" &&
        usuario.situacao !==
          "revogado"
    ).length;

  const totalRevogados =
    usuarios.filter(
      (usuario) =>
        usuario.situacao ===
        "revogado"
    ).length;

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <main className="w-full">
      {/* =================================================
          CABEÇALHO
      ================================================= */}

      <section>
        <p className="text-sm font-medium text-muted-foreground">
          Administração
        </p>

        <div className="mt-1 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Usuários
            </h1>

            <p className="mt-2 max-w-3xl text-muted-foreground">
              Gerencie quem pode acessar o NOTE LITIS e
              defina o tipo de acesso de cada integrante da
              equipe.
            </p>
          </div>

          <div className="text-sm text-muted-foreground">
            {empresa.nome}
          </div>
        </div>
      </section>

      {/* =================================================
          CONFIRMAÇÃO DAS AÇÕES
      ================================================= */}

      <div className="mt-6">
        <AvisoSucesso />
      </div>

      {/* =================================================
          MÉTRICAS
      ================================================= */}

      <section className="mt-2 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Usuários ativos
            </p>

            <UserCheck className="h-5 w-5 text-muted-foreground" />
          </div>

          <p className="mt-3 text-3xl font-semibold">
            {totalAtivos}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Convites pendentes
            </p>

            <Clock3 className="h-5 w-5 text-muted-foreground" />
          </div>

          <p className="mt-3 text-3xl font-semibold">
            {totalPendentes}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Acesso financeiro
            </p>

            <WalletCards className="h-5 w-5 text-muted-foreground" />
          </div>

          <p className="mt-3 text-3xl font-semibold">
            {totalFinanceiro}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Acessos revogados
            </p>

            <XCircle className="h-5 w-5 text-muted-foreground" />
          </div>

          <p className="mt-3 text-3xl font-semibold">
            {totalRevogados}
          </p>
        </div>
      </section>

      {/* =================================================
          TIPOS DE ACESSO
      ================================================= */}

      <section className="mt-8 rounded-xl border bg-card">
        <div className="border-b px-6 py-5">
          <h2 className="text-xl font-semibold">
            Tipos de acesso
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Cada integrante da equipe deve possuir apenas o
            acesso necessário para exercer sua função.
          </p>
        </div>

        <div className="grid gap-4 p-6 lg:grid-cols-3">
          <div className="rounded-xl border p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-slate-100 p-2">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <h3 className="font-semibold">
                Master
              </h3>
            </div>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Acesso completo ao NOTE LITIS. Pode utilizar a
              operação, acessar o financeiro e administrar
              usuários da empresa.
            </p>
          </div>

          <div className="rounded-xl border p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-slate-100 p-2">
                <UsersRound className="h-5 w-5" />
              </div>

              <h3 className="font-semibold">
                Operacional
              </h3>
            </div>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Acesso à rotina operacional das diligências.
              Pode consultar os valores e o status de
              pagamento em cada diligência, mas não acessa o
              módulo financeiro consolidado nem administra
              usuários.
            </p>
          </div>

          <div className="rounded-xl border p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-slate-100 p-2">
                <WalletCards className="h-5 w-5" />
              </div>

              <h3 className="font-semibold">
                Financeiro
              </h3>
            </div>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Acesso destinado à gestão financeira,
              pagamentos e relatórios financeiros, sem acesso
              à rotina operacional normal ou à gestão de
              usuários.
            </p>
          </div>
        </div>
      </section>

      {/* =================================================
          NOVO USUÁRIO
      ================================================= */}

      <section className="mt-8 rounded-xl border bg-card">
        <div className="border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-slate-100 p-2">
              <UserPlus className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-xl font-semibold">
                Convidar usuário
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                O usuário receberá um e-mail para criar a
                senha e ativar o acesso.
              </p>
            </div>
          </div>
        </div>

        <form
          action={convidarUsuario}
          className="p-6"
        >
          <div className="grid gap-5 lg:grid-cols-[1fr_1fr_240px]">
            <div>
              <label
                htmlFor="nome"
                className="text-sm font-medium"
              >
                Nome
              </label>

              <input
                id="nome"
                name="nome"
                type="text"
                required
                autoComplete="name"
                placeholder="Nome do usuário"
                className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-slate-500"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="text-sm font-medium"
              >
                E-mail
              </label>

              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="usuario@empresa.com.br"
                className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-slate-500"
              />
            </div>

            <div>
              <label
                htmlFor="tipo_acesso"
                className="text-sm font-medium"
              >
                Tipo de acesso
              </label>

              <select
                id="tipo_acesso"
                name="tipo_acesso"
                defaultValue="operacional"
                className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-slate-500"
              >
                <option value="operacional">
                  Operacional
                </option>

                <option value="financeiro">
                  Financeiro
                </option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-xs leading-5 text-muted-foreground">
              Não é possível criar outro usuário Master por
              este formulário. O convite somente será criado
              para um endereço que ainda não possua cadastro
              no NOTE LITIS.
            </p>

            <BotaoEnviarConvite />
          </div>
        </form>
      </section>

      {/* =================================================
          LISTAGEM
      ================================================= */}

      <section className="mt-8 rounded-xl border bg-card">
        <div className="flex flex-col gap-2 border-b px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              Equipe
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Usuários cadastrados nesta empresa.
            </p>
          </div>

          <div className="text-sm text-muted-foreground">
            {usuarios.length}{" "}
            {usuarios.length === 1
              ? "usuário"
              : "usuários"}
          </div>
        </div>

        {usuarios.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center p-8 text-center">
            <UsersRound className="h-8 w-8 text-muted-foreground" />

            <p className="mt-4 font-medium">
              Nenhum usuário cadastrado
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Convide o primeiro integrante da equipe.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {usuarios.map(
              (
                usuario
              ) => {
                const ehMaster =
                  usuario
                    .tipoAcesso ===
                  "master";

                return (
                  <article
                    key={
                      usuario.membroId
                    }
                    className="p-6"
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      {/* DADOS */}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-slate-50">
                            <UserRound className="h-5 w-5 text-slate-600" />
                          </div>

                          <div className="min-w-0">
                            <p className="font-semibold">
                              {
                                usuario.nome
                              }
                            </p>

                            <p className="mt-0.5 break-all text-sm text-muted-foreground">
                              {
                                usuario.email
                              }
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <BadgeTipo
                            tipo={
                              usuario.tipoAcesso
                            }
                          />

                          <BadgeSituacao
                            situacao={
                              usuario.situacao
                            }
                          />
                        </div>

                        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
                          {descricaoTipoAcesso(
                            usuario.tipoAcesso
                          )}
                        </p>

                        <p className="mt-2 text-xs text-muted-foreground">
                          Cadastrado em{" "}
                          {formatarData(
                            usuario.criadoEm
                          )}
                        </p>
                      </div>

                      {/* AÇÕES */}

                      <div className="w-full xl:w-[390px]">
                        {ehMaster ? (
                          <div className="rounded-lg border bg-slate-50 p-4">
                            <div className="flex items-start gap-3">
                              <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" />

                              <div>
                                <p className="text-sm font-medium">
                                  Usuário
                                  Master
                                </p>

                                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                  O acesso
                                  Master não
                                  pode ser
                                  alterado ou
                                  revogado
                                  nesta tela.
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* ALTERAR TIPO */}

                            {usuario
                              .situacao !==
                              "revogado" && (
                              <form
                                action={
                                  alterarTipoUsuario
                                }
                                className="rounded-lg border p-4"
                              >
                                <input
                                  type="hidden"
                                  name="membro_id"
                                  value={
                                    usuario.membroId
                                  }
                                />

                                <label className="text-xs font-medium text-muted-foreground">
                                  Tipo de
                                  acesso
                                </label>

                                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                                  <select
                                    name="tipo_acesso"
                                    defaultValue={
                                      usuario.tipoAcesso
                                    }
                                    className="h-10 min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm"
                                  >
                                    <option value="operacional">
                                      Operacional
                                    </option>

                                    <option value="financeiro">
                                      Financeiro
                                    </option>
                                  </select>

                                  <button
                                    type="submit"
                                    className="h-10 rounded-lg border px-4 text-sm font-medium transition hover:bg-muted"
                                  >
                                    Salvar
                                  </button>
                                </div>
                              </form>
                            )}

                            {/* CONVITE PENDENTE */}

                            {usuario
                              .situacao ===
                              "pendente" && (
                              <form
                                action={
                                  reenviarConvite
                                }
                              >
                                <input
                                  type="hidden"
                                  name="membro_id"
                                  value={
                                    usuario.membroId
                                  }
                                />

                                <BotaoReenviarConvite />
                              </form>
                            )}

                            {/* ATIVO */}

                            {usuario
                              .situacao ===
                              "ativo" && (
                              <form
                                action={
                                  alterarStatusUsuario
                                }
                              >
                                <input
                                  type="hidden"
                                  name="membro_id"
                                  value={
                                    usuario.membroId
                                  }
                                />

                                <input
                                  type="hidden"
                                  name="ativo"
                                  value="false"
                                />

                                <button
                                  type="submit"
                                  className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-800 transition hover:bg-red-100"
                                >
                                  Revogar
                                  acesso
                                </button>
                              </form>
                            )}

                            {/* REVOGADO */}

                            {usuario
                              .situacao ===
                              "revogado" && (
                              <form
                                action={
                                  alterarStatusUsuario
                                }
                              >
                                <input
                                  type="hidden"
                                  name="membro_id"
                                  value={
                                    usuario.membroId
                                  }
                                />

                                <input
                                  type="hidden"
                                  name="ativo"
                                  value="true"
                                />

                                <button
                                  type="submit"
                                  className="w-full rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100"
                                >
                                  Reativar
                                  acesso
                                </button>
                              </form>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>
    </main>
  );
}