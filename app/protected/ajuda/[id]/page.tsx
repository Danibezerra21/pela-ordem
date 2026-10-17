import Link from "next/link";

import {
  notFound,
  redirect,
} from "next/navigation";

import {
  ArrowLeft,
  CircleCheck,
  Clock3,
  MessageSquareText,
  Send,
} from "lucide-react";

import {
  responderChamado,
} from "../actions";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  LoadingButton,
} from "@/components/ui/loading-button";


type ChamadoPageProps = {
  params:
    Promise<{
      id:
        string;
    }>;

  searchParams?:
    Promise<{
      erro?:
        string |
        string[];

      novo?:
        string |
        string[];

      enviado?:
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


function uuidValido(
  valor:
    string
) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    valor
  );
}


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


export default async function ChamadoPage({
  params,
  searchParams,
}: ChamadoPageProps) {
  const {
    id,
  } =
    await params;


  if (
    !uuidValido(
      id
    )
  ) {
    notFound();
  }


  const parametros =
    searchParams
      ? await searchParams
      : {};


  const erro =
    Array.isArray(
      parametros.erro
    )
      ? parametros.erro[0]
      : parametros.erro;


  const novo =
    Array.isArray(
      parametros.novo
    )
      ? parametros.novo[0]
      : parametros.novo;


  const enviado =
    Array.isArray(
      parametros.enviado
    )
      ? parametros.enviado[0]
      : parametros.enviado;


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
        categoria,
        assunto,
        descricao,
        status,
        criado_em,
        atualizado_em
      `)
      .eq(
        "id",
        id
      )
      .eq(
        "empresa_id",
        membro
          .empresa_id
      )
      .eq(
        "usuario_id",
        usuarioId
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


  const {
    data:
      mensagens,

    error:
      erroMensagens,
  } =
    await admin
      .from(
        "chamados_suporte_mensagens"
      )
      .select(`
        id,
        autor_usuario_id,
        autor_tipo,
        mensagem,
        criada_em
      `)
      .eq(
        "chamado_id",
        id
      )
      .order(
        "criada_em",
        {
          ascending:
            true,
        }
      );


  if (
    erroMensagens
  ) {
    throw new Error(
      `Erro ao carregar mensagens: ${erroMensagens.message}`
    );
  }


  const numero =
    `#NL-${String(
      chamado.numero
    ).padStart(
      6,
      "0"
    )}`;


  const resolvido =
    chamado.status ===
    "resolvido";


  return (
    <main className="w-full max-w-4xl">

      <Link
        href="/protected/ajuda"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />

        Voltar para o suporte
      </Link>


      <section className="mt-6">

        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

          <div>

            <p className="text-sm font-medium text-muted-foreground">
              {numero}
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              {chamado.assunto}
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              {nomesCategoria[
                chamado.categoria
              ] ??
                chamado.categoria}
            </p>

          </div>


          <div
            className={`rounded-full border px-3 py-1.5 text-sm font-medium ${classeStatus(
              chamado.status
            )}`}
          >
            {nomesStatus[
              chamado.status
            ] ??
              chamado.status}
          </div>

        </div>

      </section>


      {novo ===
        "1" && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">

            <div className="flex items-center gap-2">

              <CircleCheck className="h-4 w-4" />

              Chamado aberto com sucesso.

            </div>

          </div>
        )}


      {enviado ===
        "1" && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
            Mensagem enviada ao suporte.
          </div>
        )}


      {erro && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
          {erro}
        </div>
      )}


      {/* CONVERSA */}

      <section className="mt-8 rounded-xl border bg-card">

        <div className="border-b px-6 py-5">

          <h2 className="text-lg font-semibold">
            Conversa
          </h2>

        </div>


        <div className="space-y-5 p-6">

          <div className="rounded-xl border bg-muted/20 p-5">

            <div className="flex items-center justify-between gap-4">

              <p className="font-medium">
                Você
              </p>

              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">

                <Clock3 className="h-3.5 w-3.5" />

                {formatarDataHora(
                  chamado
                    .criado_em
                )}

              </p>

            </div>


            <p className="mt-4 whitespace-pre-wrap text-sm leading-6">
              {chamado.descricao}
            </p>

          </div>


          {(mensagens ??
            []).map(
            (
              mensagem
            ) => {
              const suporte =
                mensagem
                  .autor_tipo ===
                "suporte";


              return (
                <div
                  key={
                    mensagem.id
                  }
                  className={`rounded-xl border p-5 ${
                    suporte
                      ? "border-slate-300 bg-slate-50"
                      : "bg-muted/20"
                  }`}
                >

                  <div className="flex items-center justify-between gap-4">

                    <p className="font-medium">
                      {suporte
                        ? "Suporte NOTE LITIS"
                        : "Você"}
                    </p>

                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">

                      <Clock3 className="h-3.5 w-3.5" />

                      {formatarDataHora(
                        mensagem
                          .criada_em
                      )}

                    </p>

                  </div>


                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6">
                    {mensagem.mensagem}
                  </p>

                </div>
              );
            }
          )}


          {(mensagens ??
            []).length ===
            0 && (
              <div className="py-5 text-center">

                <MessageSquareText className="mx-auto h-6 w-6 text-muted-foreground" />

                <p className="mt-3 text-sm text-muted-foreground">
                  O suporte ainda não respondeu a este chamado.
                </p>

              </div>
            )}

        </div>

      </section>


      {/* RESPOSTA */}

      <section className="mt-6 rounded-xl border bg-card">

        <div className="border-b px-6 py-5">

          <h2 className="text-lg font-semibold">
            {resolvido
              ? "Reabrir chamado"
              : "Enviar mensagem"}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {resolvido
              ? "Se precisar continuar este atendimento, envie uma nova mensagem."
              : "Sua mensagem será encaminhada para nossa equipe de suporte."}
          </p>

        </div>


        <form
          action={
            responderChamado
          }
          className="p-6"
        >

          <input
            type="hidden"
            name="chamado_id"
            value={
              chamado.id
            }
          />


          <textarea
            name="mensagem"
            required
            minLength={
              2
            }
            rows={
              6
            }
            maxLength={
              5000
            }
            placeholder="Digite sua mensagem..."
            className="w-full resize-y rounded-lg border bg-background px-3 py-3 text-sm"
          />


          <div className="mt-4 flex justify-end">

            <LoadingButton
              type="submit"
              loadingText={
                resolvido
                  ? "Reabrindo..."
                  : "Enviando..."
              }
              className="inline-flex items-center gap-2 rounded-lg bg-[#0b1f3a] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <Send className="h-4 w-4" />

              {resolvido
                ? "Reabrir e enviar"
                : "Enviar mensagem"}
            </LoadingButton>

          </div>

        </form>

      </section>

    </main>
  );
}