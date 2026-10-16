import Link from "next/link";

import {
  ArrowLeft,
  CheckCircle2,
  Mail,
  MessageSquare,
  Phone,
  RotateCcw,
} from "lucide-react";

import {
  notFound,
  redirect,
} from "next/navigation";

import {
  reabrirChamado,
  responderChamadoSuporte,
  resolverChamado,
} from "../../actions";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  createClient,
} from "@/lib/supabase/server";

function formatarDataHora(
  data:
    | string
    | null
) {
  if (!data) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle:
        "short",

      timeStyle:
        "short",

      timeZone:
        "America/Recife",
    }
  ).format(
    new Date(data)
  );
}

function nomeStatus(
  status: string
) {
  const nomes:
    Record<
      string,
      string
    > = {
      aberto:
        "Aberto",

      aguardando_suporte:
        "Aguardando suporte",

      aguardando_usuario:
        "Aguardando usuário",

      resolvido:
        "Resolvido",
    };

  return (
    nomes[
      status
    ] ??
    status
  );
}

function nomeCategoria(
  categoria: string
) {
  const nomes:
    Record<
      string,
      string
    > = {
      problema_tecnico:
        "Problema técnico",

      duvida_utilizacao:
        "Dúvida de utilização",

      sugestao:
        "Sugestão",

      outro:
        "Outro",
    };

  return (
    nomes[
      categoria
    ] ??
    categoria
  );
}

export default async function ChamadoSuportePage({
  params,
}: {
  params:
    Promise<{
      id: string;
    }>;
}) {
  const {
    id,
  } =
    await params;

  const supabase =
    await createClient();

  const {
    data: {
      user,
    },
    error:
      authError,
  } =
    await supabase
      .auth
      .getUser();

  if (
    authError ||
    !user
  ) {
    redirect(
      "/auth/login"
    );
  }

  const admin =
    createAdminClient();

  const {
    data:
      administrador,
  } =
    await admin
      .from(
        "administradores_plataforma"
      )
      .select("id")
      .eq(
        "usuario_id",
        user.id
      )
      .eq(
        "ativo",
        true
      )
      .maybeSingle();

  if (
    !administrador
  ) {
    redirect(
      "/protected/acesso-negado"
    );
  }

  const {
    data:
      chamado,
    error:
      erroChamado,
  } =
    await admin
      .from(
        "chamados_suporte"
      )
      .select(`
        id,
        numero,
        empresa_id,
        usuario_id,
        categoria,
        assunto,
        descricao,
        status,
        pagina_origem,
        email_contato,
        whatsapp_contato,
        criado_em,
        atualizado_em,
        resolvido_em
      `)
      .eq(
        "id",
        id
      )
      .maybeSingle();

  if (
    erroChamado
  ) {
    throw new Error(
      `Erro ao carregar chamado: ${erroChamado.message}`
    );
  }

  if (
    !chamado
  ) {
    notFound();
  }

  const [
    empresaResposta,
    mensagensResposta,
  ] =
    await Promise.all([
      admin
        .from(
          "empresas"
        )
        .select(
          "id, nome"
        )
        .eq(
          "id",
          chamado.empresa_id
        )
        .maybeSingle(),

      admin
        .from(
          "chamados_suporte_mensagens"
        )
        .select(`
          id,
          autor_tipo,
          mensagem,
          criada_em
        `)
        .eq(
          "chamado_id",
          chamado.id
        )
        .order(
          "criada_em",
          {
            ascending:
              true,
          }
        ),
    ]);

  if (
    mensagensResposta.error
  ) {
    throw new Error(
      `Erro ao carregar mensagens: ${mensagensResposta.error.message}`
    );
  }

  const empresa =
    empresaResposta.data;

  const mensagens =
    mensagensResposta.data ??
    [];

  return (
    <div className="space-y-6">

      <Link
        href="/protected/suporte"
        className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />

        Voltar ao suporte
      </Link>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

          <div>
            <p className="text-sm text-muted-foreground">
              Chamado #NL-
              {String(
                chamado.numero
              ).padStart(
                6,
                "0"
              )}
            </p>

            <h1 className="mt-1 text-2xl font-semibold">
              {
                chamado.assunto
              }
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              {
                empresa?.nome ??
                "Empresa não identificada"
              }
              {" • "}
              {nomeCategoria(
                chamado.categoria
              )}
            </p>
          </div>

          <span className="w-fit rounded-full border px-3 py-1 text-xs font-medium">
            {nomeStatus(
              chamado.status
            )}
          </span>

        </div>

        {/* CONTATO */}

        <div className="mt-6 grid gap-4 rounded-xl border bg-slate-50 p-5 md:grid-cols-2">

          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                E-mail
              </p>

              <p className="mt-1 text-sm font-medium">
                {
                  chamado.email_contato
                }
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                WhatsApp
              </p>

              <p className="mt-1 text-sm font-medium">
                {
                  chamado.whatsapp_contato ||
                  "Não informado"
                }
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Aberto em
            </p>

            <p className="mt-1 text-sm font-medium">
              {formatarDataHora(
                chamado.criado_em
              )}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Página informada
            </p>

            <p className="mt-1 break-all text-sm font-medium">
              {
                chamado.pagina_origem ||
                "Não informada"
              }
            </p>
          </div>

        </div>

        {/* SOLICITAÇÃO ORIGINAL */}

        <div className="mt-6 rounded-xl border p-5">

          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Solicitação original
          </p>

          <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
            {
              chamado.descricao
            }
          </p>

        </div>

        {/* HISTÓRICO */}

        <div className="mt-7">

          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#0b1f3a]" />

            <h2 className="font-semibold">
              Histórico do atendimento
            </h2>
          </div>

          {mensagens.length ? (
            <div className="mt-4 space-y-4">

              {mensagens.map(
                (
                  mensagem
                ) => (
                  <div
                    key={
                      mensagem.id
                    }
                    className={
                      mensagem.autor_tipo ===
                      "suporte"
                        ? "ml-auto max-w-2xl rounded-xl border bg-slate-50 p-4"
                        : "mr-auto max-w-2xl rounded-xl border bg-white p-4 shadow-sm"
                    }
                  >

                    <p className="text-xs font-medium text-muted-foreground">
                      {mensagem.autor_tipo ===
                      "suporte"
                        ? "Suporte NOTE LITIS"
                        : "Usuário"}
                      {" • "}
                      {formatarDataHora(
                        mensagem.criada_em
                      )}
                    </p>

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
                      {
                        mensagem.mensagem
                      }
                    </p>

                  </div>
                )
              )}

            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Ainda não há respostas
              neste chamado.
            </div>
          )}

        </div>

        {/* RESPONDER */}

        {chamado.status !==
          "resolvido" && (
          <form
            action={
              responderChamadoSuporte
            }
            className="mt-8 border-t pt-6"
          >

            <input
              type="hidden"
              name="chamado_id"
              value={
                chamado.id
              }
            />

            <label
              htmlFor="mensagem"
              className="font-medium"
            >
              Responder ao usuário
            </label>

            <p className="mt-1 text-sm text-muted-foreground">
              A resposta ficará
              registrada no NOTE LITIS.
              No próximo passo,
              conectaremos também
              o aviso por e-mail.
            </p>

            <textarea
              id="mensagem"
              name="mensagem"
              required
              rows={6}
              maxLength={
                5000
              }
              className="mt-3 w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="Digite a resposta do suporte..."
            />

            <button
              type="submit"
              className="mt-3 rounded-lg bg-[#0b1f3a] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              Enviar resposta
            </button>

          </form>
        )}

        {/* ENCERRAMENTO */}

        <div className="mt-8 border-t pt-6">

          {chamado.status !==
          "resolvido" ? (
            <form
              action={
                resolverChamado
              }
            >
              <input
                type="hidden"
                name="chamado_id"
                value={
                  chamado.id
                }
              />

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50"
              >
                <CheckCircle2 className="h-4 w-4" />

                Marcar como resolvido
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <p className="font-medium">
                  Chamado resolvido
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Encerrado em{" "}
                  {formatarDataHora(
                    chamado.resolvido_em
                  )}
                </p>
              </div>

              <form
                action={
                  reabrirChamado
                }
              >
                <input
                  type="hidden"
                  name="chamado_id"
                  value={
                    chamado.id
                  }
                />

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50"
                >
                  <RotateCcw className="h-4 w-4" />

                  Reabrir chamado
                </button>
              </form>

            </div>
          )}

        </div>

      </section>

    </div>
  );
}