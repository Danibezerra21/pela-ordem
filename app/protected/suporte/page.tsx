import Link from "next/link";

import {
  Bug,
  CalendarDays,
  CircleCheck,
  CreditCard,
  Headphones,
  MessageSquare,
  Settings2,
} from "lucide-react";

import { redirect } from "next/navigation";

import {
  alterarStatusBeta,
  salvarDataFimBeta,
} from "./actions";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function formatarData(
  data:
    | string
    | null
) {
  if (!data) {
    return "Não definida";
  }

  const [ano, mes, dia] =
    data
      .slice(0, 10)
      .split("-")
      .map(Number);

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    }
  ).format(
    new Date(
      Date.UTC(
        ano,
        mes - 1,
        dia
      )
    )
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

function formatarMoeda(
  valor:
    | number
    | string
    | null
) {
  const numero =
    Number(
      valor ?? 0
    );

  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  ).format(
    numero
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
      aberto: "Aberto",
      aguardando_suporte:
        "Aguardando suporte",
      aguardando_usuario:
        "Aguardando usuário",
      resolvido: "Resolvido",
    };

  return nomes[status] ?? status;
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
      sugestao: "Sugestão",
      outro: "Outro",
    };

  return nomes[categoria] ?? categoria;
}

export default async function SuportePage() {
  const supabase =
    await createClient();

  const {
    data: { user },
    error: authError,
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
    data: administrador,
    error: erroAdministrador,
  } =
    await admin
      .from(
        "administradores_plataforma"
      )
      .select("id, ativo")
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
    erroAdministrador ||
    !administrador
  ) {
    redirect(
      "/protected/acesso-negado"
    );
  }

  const [
    configuracaoResposta,
    chamadosResposta,
    pagamentosResposta,
  ] =
    await Promise.all([
      admin
        .from(
          "configuracoes_plataforma"
        )
        .select(`
          beta_ativa,
          beta_fim,
          valor_mensal,
          pix_chave,
          pix_beneficiario,
          pix_qr_path,
          atualizado_em
        `)
        .eq(
          "id",
          true
        )
        .single(),

      admin
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
          status,
          email_contato,
          whatsapp_contato,
          criado_em,
          atualizado_em
        `)
        .order(
          "atualizado_em",
          {
            ascending: false,
          }
        )
        .limit(100),

      admin
        .from(
          "pagamentos_pix_manuais"
        )
        .select(
          "id",
          {
            count: "exact",
            head: true,
          }
        )
        .eq(
          "status",
          "aguardando_confirmacao"
        ),
    ]);

  if (
    configuracaoResposta.error
  ) {
    throw new Error(
      `Erro ao carregar configuração: ${configuracaoResposta.error.message}`
    );
  }

  if (
    chamadosResposta.error
  ) {
    throw new Error(
      `Erro ao carregar chamados: ${chamadosResposta.error.message}`
    );
  }

  const configuracao =
    configuracaoResposta.data;

  const chamados =
    chamadosResposta.data ?? [];

  const empresasIds =
    [
      ...new Set(
        chamados.map(
          (chamado) =>
            chamado.empresa_id
        )
      ),
    ];

  const {
    data: empresas,
    error: erroEmpresas,
  } =
    empresasIds.length
      ? await admin
          .from("empresas")
          .select("id, nome")
          .in(
            "id",
            empresasIds
          )
      : {
          data: [],
          error: null,
        };

  if (erroEmpresas) {
    throw new Error(
      `Erro ao carregar empresas: ${erroEmpresas.message}`
    );
  }

  const nomesEmpresas =
    new Map(
      (
        empresas ?? []
      ).map(
        (empresa) => [
          empresa.id,
          empresa.nome,
        ]
      )
    );

  const chamadosAguardandoSuporte =
    chamados.filter(
      (chamado) =>
        chamado.status ===
          "aguardando_suporte" ||
        chamado.status ===
          "aberto"
    ).length;

  const pagamentosPendentes =
    pagamentosResposta.count ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Headphones className="h-7 w-7 text-[#0b1f3a]" />

        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Administração NOTE LITIS
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Controle da plataforma, suporte e operação comercial.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Settings2 className="h-5 w-5 text-muted-foreground" />

            <p className="font-medium">
              Plataforma
            </p>
          </div>

          <p className="mt-4 text-2xl font-semibold">
            {configuracao.beta_ativa
              ? "Beta"
              : "Produção"}
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Modo atualmente ativo.
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Bug className="h-5 w-5 text-muted-foreground" />

            <p className="font-medium">
              Aguardando suporte
            </p>
          </div>

          <p className="mt-4 text-2xl font-semibold">
            {chamadosAguardandoSuporte}
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Chamados que precisam da sua atenção.
          </p>
        </div>

        <Link
          href="/protected/suporte/pagamentos"
          className="block rounded-2xl border bg-white p-5 shadow-sm transition-colors hover:bg-slate-50"
        >
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-muted-foreground" />

            <p className="font-medium">
              Pagamentos
            </p>
          </div>

          <p className="mt-4 text-2xl font-semibold">
            {pagamentosPendentes}
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Pix aguardando conferência.
          </p>

          <p className="mt-3 text-xs font-medium text-[#0b1f3a]">
            Abrir fila de pagamentos
          </p>
        </Link>
      </div>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-5 w-5 text-[#0b1f3a]" />

          <div>
            <h2 className="text-lg font-semibold">
              Chamados de suporte
            </h2>

            <p className="text-sm text-muted-foreground">
              Atendimento enviado pelos usuários do NOTE LITIS.
            </p>
          </div>
        </div>

        {chamados.length ? (
          <div className="mt-6 overflow-hidden rounded-xl border">
            {chamados.map(
              (chamado) => (
                <Link
                  key={
                    chamado.id
                  }
                  href={`/protected/suporte/chamados/${chamado.id}`}
                  className="block border-b p-5 last:border-b-0 hover:bg-slate-50"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">
                          #NL-
                          {String(
                            chamado.numero
                          ).padStart(
                            6,
                            "0"
                          )}
                          {" — "}
                          {
                            chamado.assunto
                          }
                        </p>

                        {(
                          chamado.status ===
                            "aguardando_suporte" ||
                          chamado.status ===
                            "aberto"
                        ) && (
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                            Requer atenção
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm text-muted-foreground">
                        {nomesEmpresas.get(
                          chamado.empresa_id
                        ) ??
                          "Empresa não identificada"}
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {
                          chamado.email_contato
                        }
                        {" • "}
                        {nomeCategoria(
                          chamado.categoria
                        )}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Atualizado em{" "}
                        {formatarDataHora(
                          chamado.atualizado_em
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
              Nenhum chamado recebido
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Os pedidos de suporte dos usuários aparecerão aqui.
            </p>
          </div>
        )}
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <CircleCheck className="h-5 w-5 text-[#0b1f3a]" />

              <h2 className="text-lg font-semibold">
                Versão Beta
              </h2>
            </div>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Enquanto a versão beta estiver ativa, os usuários poderão
              utilizar o NOTE LITIS sem cobrança e nenhuma opção de
              contratação ou pagamento será exibida.
            </p>
          </div>

          <span
            className={
              configuracao.beta_ativa
                ? "w-fit rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800"
                : "w-fit rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700"
            }
          >
            {configuracao.beta_ativa
              ? "Beta ativa"
              : "Beta desativada"}
          </span>
        </div>

        <div className="mt-6 rounded-xl border bg-slate-50 p-5">
          <p className="text-sm text-muted-foreground">
            Situação atual
          </p>

          <p className="mt-1 text-lg font-semibold">
            {configuracao.beta_ativa
              ? "Uso gratuito em versão beta"
              : "Modo comercial de produção"}
          </p>

          <form
            action={
              alterarStatusBeta
            }
            className="mt-5"
          >
            <input
              type="hidden"
              name="beta_ativa"
              value={
                configuracao.beta_ativa
                  ? "false"
                  : "true"
              }
            />

            <button
              type="submit"
              className={
                configuracao.beta_ativa
                  ? "inline-flex rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
                  : "inline-flex rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
              }
            >
              {configuracao.beta_ativa
                ? "Desativar versão beta"
                : "Ativar versão beta"}
            </button>
          </form>
        </div>

        <div className="mt-6 border-t pt-6">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />

            <div>
              <p className="font-medium">
                Data prevista de encerramento
              </p>

              <p className="text-sm text-muted-foreground">
                Opcional. Serve apenas para informar os usuários.
                A beta não será encerrada automaticamente.
              </p>
            </div>
          </div>

          <form
            action={
              salvarDataFimBeta
            }
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div>
              <label
                htmlFor="beta_fim"
                className="text-sm font-medium"
              >
                Data
              </label>

              <input
                id="beta_fim"
                name="beta_fim"
                type="date"
                defaultValue={
                  configuracao.beta_fim ??
                  ""
                }
                className="mt-1 block rounded-lg border bg-white px-3 py-2 text-sm"
              />
            </div>

            <button
              type="submit"
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Salvar data
            </button>
          </form>

          <p className="mt-3 text-sm text-muted-foreground">
            Data atualmente informada:{" "}
            <strong className="text-foreground">
              {formatarData(
                configuracao.beta_fim
              )}
            </strong>
          </p>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          Configuração comercial
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Estes dados ficam ocultos dos usuários enquanto a beta estiver ativa.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Mensalidade
            </p>

            <p className="mt-1 text-lg font-semibold">
              {formatarMoeda(
                configuracao.valor_mensal
              )}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Forma de pagamento
            </p>

            <p className="mt-1 font-semibold">
              Pix
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Beneficiário
            </p>

            <p className="mt-1 font-medium">
              {configuracao.pix_beneficiario}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Chave Pix
            </p>

            <p className="mt-1 font-medium">
              {configuracao.pix_chave}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
