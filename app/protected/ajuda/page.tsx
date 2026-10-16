import Link from "next/link";
import { redirect } from "next/navigation";

import {
  CircleHelp,
  MessageSquare,
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

function nomeCategoria(
  categoria: string
) {
  const nomes: Record<
    string,
    string
  > = {
    problema_tecnico:
      "Problema técnico",
    duvida_utilizacao:
      "Dúvida de utilização",
    sugestao: "Sugestão",
    outro: "Outro",
  };

  return (
    nomes[categoria] ??
    categoria
  );
}

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

export default async function AjudaPage() {
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
    error: erroMembro,
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

  if (
    erroMembro ||
    !membro
  ) {
    redirect(
      "/protected/acesso-negado"
    );
  }

  const admin =
    createAdminClient();

  const {
    data: chamados,
    error: erroChamados,
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
        status,
        criado_em,
        atualizado_em
      `)
      .eq(
        "empresa_id",
        membro.empresa_id
      )
      .eq(
        "usuario_id",
        user.id
      )
      .order(
        "atualizado_em",
        {
          ascending: false,
        }
      );

  if (erroChamados) {
    throw new Error(
      `Não foi possível carregar seus chamados: ${erroChamados.message}`
    );
  }

  return (
    <div className="space-y-8">

      <div className="flex items-start gap-3">
        <CircleHelp className="mt-1 h-6 w-6 text-[#0b1f3a]" />

        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Suporte
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Envie dúvidas,
            problemas encontrados
            ou sugestões sobre o
            NOTE LITIS.
          </p>
        </div>
      </div>

      {/* NOVO CHAMADO */}

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Plus className="h-5 w-5 text-[#0b1f3a]" />

          <div>
            <h2 className="text-lg font-semibold">
              Abrir chamado
            </h2>

            <p className="text-sm text-muted-foreground">
              Descreva o que aconteceu
              com o máximo de detalhes
              possível.
            </p>
          </div>
        </div>

        <form
          action={abrirChamado}
          className="mt-6 space-y-5"
        >
          <input
            type="hidden"
            name="pagina_origem"
            value="/protected/ajuda"
          />

          <div className="grid gap-5 md:grid-cols-2">

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
                className="mt-2 w-full rounded-lg border bg-white px-3 py-2 text-sm"
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
                htmlFor="whatsapp"
                className="text-sm font-medium"
              >
                WhatsApp para contato
              </label>

              <input
                id="whatsapp"
                name="whatsapp"
                type="text"
                placeholder="(81) 99999-9999"
                className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>

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
              required
              maxLength={160}
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="Ex.: Não consigo concluir uma diligência"
            />
          </div>

          <div>
            <label
              htmlFor="descricao"
              className="text-sm font-medium"
            >
              Descrição
            </label>

            <textarea
              id="descricao"
              name="descricao"
              required
              rows={7}
              maxLength={5000}
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="Informe o que você estava tentando fazer, o que aconteceu e, se houver, qual mensagem apareceu na tela."
            />

            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Não é necessário anexar
              arquivos. Se precisarmos
              de informações adicionais,
              entraremos em contato.
            </p>
          </div>

          <button
            type="submit"
            className="inline-flex rounded-lg bg-[#0b1f3a] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Enviar chamado
          </button>
        </form>
      </section>

      {/* HISTÓRICO */}

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-5 w-5 text-[#0b1f3a]" />

          <div>
            <h2 className="text-lg font-semibold">
              Meus chamados
            </h2>

            <p className="text-sm text-muted-foreground">
              Acompanhe as respostas
              e o andamento dos seus
              atendimentos.
            </p>
          </div>
        </div>

        {chamados?.length ? (
          <div className="mt-6 divide-y rounded-xl border">
            {chamados.map(
              (chamado) => (
                <Link
                  key={
                    chamado.id
                  }
                  href={`/protected/ajuda/${chamado.id}`}
                  className="block p-5 transition-colors hover:bg-slate-50"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold">
                        #NL-
                        {String(
                          chamado.numero
                        ).padStart(
                          6,
                          "0"
                        )}{" "}
                        —{" "}
                        {
                          chamado.assunto
                        }
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {nomeCategoria(
                          chamado.categoria
                        )}
                        {" • "}
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
                </Link>
              )
            )}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed p-8 text-center">
            <p className="font-medium">
              Nenhum chamado aberto
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Seus atendimentos
              aparecerão aqui.
            </p>
          </div>
        )}
      </section>

    </div>
  );
}