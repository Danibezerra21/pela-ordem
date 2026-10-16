import Link from "next/link";

import {
  ArrowLeft,
  MessageSquare,
} from "lucide-react";

import {
  notFound,
  redirect,
} from "next/navigation";

import {
  responderChamadoUsuario,
} from "../actions";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  createClient,
} from "@/lib/supabase/server";

function formatarDataHora(
  data: string
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
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
  const nomes: Record<
    string,
    string
  > = {
    aberto: "Aberto",
    aguardando_suporte:
      "Aguardando suporte",
    aguardando_usuario:
      "Aguardando sua resposta",
    resolvido: "Resolvido",
  };

  return (
    nomes[status] ??
    status
  );
}

export default async function ChamadoPage({
  params,
}: {
  params:
    Promise<{
      id: string;
    }>;
}) {
  const {
    id,
  } = await params;

  const supabase =
    await createClient();

  const {
    data: {
      user,
    },
    error: authError,
  } =
    await supabase.auth.getUser();

  if (
    authError ||
    !user
  ) {
    redirect(
      "/auth/login"
    );
  }

  const {
    data: membro,
  } =
    await supabase
      .from(
        "membros_empresa"
      )
      .select("empresa_id")
      .eq(
        "usuario_id",
        user.id
      )
      .eq(
        "ativo",
        true
      )
      .maybeSingle();

  if (!membro) {
    redirect(
      "/protected/acesso-negado"
    );
  }

  const admin =
    createAdminClient();

  const {
    data: chamado,
  } =
    await admin
      .from(
        "chamados_suporte"
      )
      .select(`
        id,
        numero,
        assunto,
        descricao,
        status,
        criado_em
      `)
      .eq("id", id)
      .eq(
        "empresa_id",
        membro.empresa_id
      )
      .eq(
        "usuario_id",
        user.id
      )
      .maybeSingle();

  if (!chamado) {
    notFound();
  }

  const {
    data: mensagens,
    error: erroMensagens,
  } =
    await admin
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
          ascending: true,
        }
      );

  if (erroMensagens) {
    throw new Error(
      `Não foi possível carregar as mensagens: ${erroMensagens.message}`
    );
  }

  return (
    <div className="space-y-6">

      <Link
        href="/protected/ajuda"
        className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao suporte
      </Link>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

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
              {chamado.assunto}
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Aberto em{" "}
              {formatarDataHora(
                chamado.criado_em
              )}
            </p>
          </div>

          <span className="w-fit rounded-full border px-3 py-1 text-xs font-medium">
            {nomeStatus(
              chamado.status
            )}
          </span>

        </div>

        {/* MENSAGEM ORIGINAL */}

        <div className="mt-6 rounded-xl border bg-slate-50 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Sua solicitação
          </p>

          <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
            {chamado.descricao}
          </p>
        </div>

        {/* CONVERSA */}

        <div className="mt-6 space-y-4">

          {mensagens?.map(
            (mensagem) => (
              <div
                key={
                  mensagem.id
                }
                className={
                  mensagem.autor_tipo ===
                  "usuario"
                    ? "ml-auto max-w-2xl rounded-xl border bg-slate-50 p-4"
                    : "mr-auto max-w-2xl rounded-xl border bg-white p-4 shadow-sm"
                }
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />

                  <p className="text-xs font-medium text-muted-foreground">
                    {mensagem.autor_tipo ===
                    "usuario"
                      ? "Você"
                      : "Suporte NOTE LITIS"}
                    {" • "}
                    {formatarDataHora(
                      mensagem.criada_em
                    )}
                  </p>
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
                  {
                    mensagem.mensagem
                  }
                </p>
              </div>
            )
          )}

        </div>

        {/* RESPOSTA */}

        {chamado.status !==
          "resolvido" && (
          <form
            action={
              responderChamadoUsuario
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
              Responder ao suporte
            </label>

            <textarea
              id="mensagem"
              name="mensagem"
              required
              rows={5}
              maxLength={5000}
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="Digite sua resposta..."
            />

            <button
              type="submit"
              className="mt-3 rounded-lg bg-[#0b1f3a] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Enviar resposta
            </button>
          </form>
        )}

        {chamado.status ===
          "resolvido" && (
          <div className="mt-8 rounded-xl border bg-slate-50 p-5 text-sm">
            Este atendimento foi
            encerrado.
          </div>
        )}

      </section>

    </div>
  );
}