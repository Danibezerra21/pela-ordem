import Link from "next/link";

import {
  redirect,
} from "next/navigation";

import {
  CircleHelp,
  Clock3,
  MessageSquareText,
  Plus,
} from "lucide-react";

import {
  abrirChamado,
} from "./actions";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  createClient,
} from "@/lib/supabase/server";


type AjudaPageProps = {
  searchParams?:
    Promise<{
      erro?:
        string |
        string[];
    }>;
};


const nomesCategoria:
  Record<string, string> = {
    problema_tecnico:
      "Problema técnico",

    duvida_utilizacao:
      "Dúvida de utilização",

    sugestao:
      "Sugestão",

    outro:
      "Outro",
  };


const nomesStatus:
  Record<string, string> = {
    aberto:
      "Aberto",

    aguardando_suporte:
      "Aguardando suporte",

    aguardando_usuario:
      "Aguardando você",

    resolvido:
      "Resolvido",
  };


function formatarDataHora(
  valor:
    string |
    null |
    undefined
) {
  if (
    !valor
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

      hour:
        "2-digit",

      minute:
        "2-digit",
    }
  ).format(
    new Date(
      valor
    )
  );
}


function classeStatus(
  status:
    string
) {
  if (
    status ===
    "resolvido"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }


  if (
    status ===
    "aguardando_usuario"
  ) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }


  if (
    status ===
      "aberto" ||
    status ===
      "aguardando_suporte"
  ) {
    return "border-blue-200 bg-blue-50 text-blue-800";
  }


  return "border-slate-200 bg-slate-50 text-slate-700";
}


export default async function AjudaPage({
  searchParams,
}: AjudaPageProps) {
  const parametros =
    searchParams
      ? await searchParams
      : {};


  const erroParametro =
    Array.isArray(
      parametros.erro
    )
      ? parametros.erro[0]
      : parametros.erro;


  const supabase =
    await createClient();


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
      .sub;


  const admin =
    createAdminClient();


  const {
    data:
      membro,

    error:
      erroMembro,
  } =
    await admin
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
    erroMembro
  ) {
    throw new Error(
      `Erro ao identificar sua empresa: ${erroMembro.message}`
    );
  }


  if (
    !membro
  ) {
    redirect(
      "/auth/onboarding"
    );
  }


  const [
    empresaResposta,
    perfilResposta,
    chamadosResposta,
  ] =
    await Promise.all([
      admin
        .from(
          "empresas"
        )
        .select(
          "nome"
        )
        .eq(
          "id",
          membro
            .empresa_id
        )
        .maybeSingle(),

      admin
        .from(
          "perfis_usuarios"
        )
        .select(`
          nome,
          email
        `)
        .eq(
          "id",
          usuarioId
        )
        .maybeSingle(),

      admin
        .from(
          "chamados_suporte"
        )
        .select(`
          id,
          numero,
          categoria,
          assunto,
          status,
          atualizado_em
        `)
        .eq(
          "empresa_id",
          membro
            .empresa_id
        )
        .eq(
          "usuario_id",
          usuarioId
        )
        .order(
          "atualizado_em",
          {
            ascending:
              false,
          }
        ),
    ]);


  if (
    empresaResposta
      .error
  ) {
    throw new Error(
      `Erro ao carregar empresa: ${empresaResposta.error.message}`
    );
  }


  if (
    perfilResposta
      .error
  ) {
    throw new Error(
      `Erro ao carregar perfil: ${perfilResposta.error.message}`
    );
  }


  if (
    chamadosResposta
      .error
  ) {
    throw new Error(
      `Erro ao carregar chamados: ${chamadosResposta.error.message}`
    );
  }


  const chamados =
    chamadosResposta
      .data ??
    [];


  return (
    <main className="w-full">

      {/* CABEÇALHO */}

      <section className="mb-10">

        <div className="flex items-start gap-4">

          <div className="rounded-xl bg-muted p-3">
            <CircleHelp className="h-6 w-6" />
          </div>

          <div>

            <p className="text-sm font-medium text-muted-foreground">
              NOTE LITIS
            </p>

            <h1 className="mt-1 text-4xl font-bold tracking-tight">
              Suporte
            </h1>

            <p className="mt-2 max-w-2xl text-muted-foreground">
              Envie dúvidas, comunique problemas de utilização ou compartilhe sugestões sobre o sistema.
            </p>

          </div>

        </div>

      </section>


      {erroParametro && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
          {erroParametro}
        </div>
      )}


      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.7fr)]">

        {/* NOVO CHAMADO */}

        <section className="rounded-xl border bg-card">

          <div className="border-b px-6 py-5">

            <div className="flex items-center gap-3">

              <Plus className="h-5 w-5" />

              <div>

                <h2 className="text-lg font-semibold">
                  Abrir novo chamado
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Quanto mais contexto você fornecer, mais fácil será compreender sua solicitação.
                </p>

              </div>

            </div>

          </div>


          <form
            action={
              abrirChamado
            }
            className="space-y-6 p-6"
          >

            <div>

              <label
                htmlFor="categoria"
                className="text-sm font-medium"
              >
                Categoria
              </label>

              <select
                id="categoria"
                name="categoria"
                required
                defaultValue=""
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
              >
                <option
                  value=""
                  disabled
                >
                  Selecione
                </option>

                <option value="problema_tecnico">
                  Problema técnico
                </option>

                <option value="duvida_utilizacao">
                  Dúvida de utilização
                </option>

                <option value="sugestao">
                  Sugestão
                </option>

                <option value="outro">
                  Outro
                </option>
              </select>

            </div>


            <div>

              <label
                htmlFor="assunto"
                className="text-sm font-medium"
              >
                Assunto
              </label>

              <input
                id="assunto"
                name="assunto"
                type="text"
                required
                minLength={
                  5
                }
                maxLength={
                  160
                }
                placeholder="Ex.: dúvida na importação de uma pauta"
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
              />

            </div>


            <div>

              <label
                htmlFor="descricao"
                className="text-sm font-medium"
              >
                Descreva sua solicitação
              </label>

              <textarea
                id="descricao"
                name="descricao"
                required
                minLength={
                  15
                }
                rows={
                  8
                }
                maxLength={
                  5000
                }
                placeholder="Informe o que aconteceu, o que você estava tentando fazer e qualquer detalhe que possa nos ajudar a compreender a situação."
                className="mt-2 w-full resize-y rounded-lg border bg-background px-3 py-2.5 text-sm"
              />

              <p className="mt-2 text-xs text-muted-foreground">
                Para sua segurança, não envie senhas ou dados de acesso.
              </p>

            </div>


            <div>

              <label
                htmlFor="whatsapp"
                className="text-sm font-medium"
              >
                WhatsApp

                <span className="ml-1 font-normal text-muted-foreground">
                  (opcional)
                </span>
              </label>

              <input
                id="whatsapp"
                name="whatsapp"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                maxLength={
                  20
                }
                placeholder="(81) 99999-9999"
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
              />

              <p className="mt-2 text-xs text-muted-foreground">
                Poderemos utilizá-lo se a situação exigir uma comunicação mais direta.
              </p>

            </div>


            <div className="rounded-lg border bg-muted/30 p-4">

              <p className="text-sm font-medium">
                Identificação automática
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {perfilResposta
                  .data
                  ?.nome ||
                  "Usuário"}
                {" · "}
                {empresaResposta
                  .data
                  ?.nome ||
                  "Empresa"}
              </p>

              {perfilResposta
                .data
                ?.email && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {perfilResposta
                      .data
                      .email}
                  </p>
                )}

            </div>


            <div className="flex justify-end">

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg bg-[#0b1f3a] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                Abrir chamado
              </button>

            </div>

          </form>

        </section>


        {/* MEUS CHAMADOS */}

        <section>

          <div className="mb-4">

            <h2 className="text-xl font-semibold">
              Meus chamados
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Acompanhe suas solicitações e respostas do suporte.
            </p>

          </div>


          {chamados.length ===
          0 ? (
            <div className="rounded-xl border bg-card px-6 py-10 text-center">

              <MessageSquareText className="mx-auto h-7 w-7 text-muted-foreground" />

              <p className="mt-4 font-medium">
                Nenhum chamado
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                Seus chamados aparecerão aqui.
              </p>

            </div>
          ) : (
            <div className="space-y-3">

              {chamados.map(
                (
                  chamado
                ) => (
                  <Link
                    key={
                      chamado.id
                    }
                    href={`/protected/ajuda/${chamado.id}`}
                    className="block rounded-xl border bg-card p-5 transition-colors hover:bg-muted/30"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div className="min-w-0">

                        <p className="text-xs font-medium text-muted-foreground">
                          #NL-{String(
                            chamado.numero
                          ).padStart(
                            6,
                            "0"
                          )}
                        </p>

                        <h3 className="mt-1 font-semibold">
                          {chamado.assunto}
                        </h3>

                      </div>


                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${classeStatus(
                          chamado.status
                        )}`}
                      >
                        {nomesStatus[
                          chamado.status
                        ] ??
                          chamado.status}
                      </span>

                    </div>


                    <p className="mt-3 text-sm text-muted-foreground">
                      {nomesCategoria[
                        chamado.categoria
                      ] ??
                        chamado.categoria}
                    </p>


                    <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">

                      <Clock3 className="h-3.5 w-3.5" />

                      Atualizado em{" "}
                      {formatarDataHora(
                        chamado
                          .atualizado_em
                      )}

                    </div>

                  </Link>
                )
              )}

            </div>
          )}

        </section>

      </div>

    </main>
  );
}