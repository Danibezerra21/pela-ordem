import Link from "next/link";

import {
  ArrowLeft,
  BadgeCheck,
  Clock3,
  CreditCard,
  SearchX,
} from "lucide-react";

import { redirect } from "next/navigation";

import {
  confirmarPagamentoPix,
  marcarPagamentoPixNaoLocalizado,
} from "../actions";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function hojeEmRecife() {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "America/Recife",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).format(
    new Date()
  );
}

function somarUmMes(
  dataISO: string
) {
  const [ano, mes, dia] =
    dataISO
      .split("-")
      .map(Number);

  let novoAno = ano;
  let novoMes = mes + 1;

  if (novoMes === 13) {
    novoMes = 1;
    novoAno += 1;
  }

  const ultimoDia =
    new Date(
      Date.UTC(
        novoAno,
        novoMes,
        0
      )
    ).getUTCDate();

  const novoDia =
    Math.min(
      dia,
      ultimoDia
    );

  return [
    novoAno,
    String(novoMes)
      .padStart(2, "0"),
    String(novoDia)
      .padStart(2, "0"),
  ].join("-");
}

function formatarData(
  data:
    | string
    | null
) {
  if (!data) {
    return "—";
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
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  ).format(
    Number(valor)
  );
}

export default async function PagamentosSuportePage() {
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

  if (!administrador) {
    redirect(
      "/protected/acesso-negado"
    );
  }

  const {
    data: pagamentos,
    error: erroPagamentos,
  } =
    await admin
      .from(
        "pagamentos_pix_manuais"
      )
      .select(`
        id,
        empresa_id,
        valor,
        nome_pagador,
        email_contato,
        whatsapp_contato,
        declarado_em
      `)
      .eq(
        "status",
        "aguardando_confirmacao"
      )
      .order(
        "declarado_em",
        {
          ascending: true,
        }
      );

  if (erroPagamentos) {
    throw new Error(
      `Erro ao carregar pagamentos: ${erroPagamentos.message}`
    );
  }

  const lista =
    pagamentos ?? [];

  const empresasIds =
    [
      ...new Set(
        lista.map(
          (pagamento) =>
            pagamento.empresa_id
        )
      ),
    ];

  const [
    empresasResposta,
    contasResposta,
  ] =
    empresasIds.length
      ? await Promise.all([
          admin
            .from("empresas")
            .select("id, nome")
            .in(
              "id",
              empresasIds
            ),

          admin
            .from(
              "contas_comerciais"
            )
            .select(
              "empresa_id, acesso_pago_ate"
            )
            .in(
              "empresa_id",
              empresasIds
            ),
        ])
      : [
          {
            data: [],
            error: null,
          },
          {
            data: [],
            error: null,
          },
        ];

  if (
    empresasResposta.error
  ) {
    throw new Error(
      `Erro ao carregar empresas: ${empresasResposta.error.message}`
    );
  }

  if (
    contasResposta.error
  ) {
    throw new Error(
      `Erro ao carregar contas: ${contasResposta.error.message}`
    );
  }

  const empresas =
    new Map(
      (
        empresasResposta.data ??
        []
      ).map(
        (empresa) => [
          empresa.id,
          empresa.nome,
        ]
      )
    );

  const acessos =
    new Map(
      (
        contasResposta.data ??
        []
      ).map(
        (conta) => [
          conta.empresa_id,
          conta.acesso_pago_ate,
        ]
      )
    );

  const hoje =
    hojeEmRecife();

  return (
    <div className="space-y-6">
      <Link
        href="/protected/suporte"
        className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar à administração
      </Link>

      <div className="flex items-center gap-3">
        <CreditCard className="h-7 w-7 text-[#0b1f3a]" />

        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Pagamentos Pix
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Conferência manual das mensalidades informadas pelos clientes.
          </p>
        </div>
      </div>

      {lista.length === 0 ? (
        <section className="rounded-2xl border border-dashed bg-white p-10 text-center">
          <BadgeCheck className="mx-auto h-8 w-8 text-muted-foreground" />

          <p className="mt-4 font-semibold">
            Nenhum pagamento aguardando conferência
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Novas declarações de Pix aparecerão aqui.
          </p>
        </section>
      ) : (
        <div className="space-y-5">
          {lista.map(
            (pagamento) => {
              const acessoAtual =
                acessos.get(
                  pagamento.empresa_id
                ) ?? null;

              const inicio =
                acessoAtual &&
                acessoAtual >= hoje
                  ? acessoAtual
                  : hoje;

              const fim =
                somarUmMes(
                  inicio
                );

              return (
                <section
                  key={
                    pagamento.id
                  }
                  className="rounded-2xl border bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {
                          empresas.get(
                            pagamento.empresa_id
                          ) ??
                          "Empresa não identificada"
                        }
                      </p>

                      <h2 className="mt-1 text-xl font-semibold">
                        {formatarMoeda(
                          pagamento.valor
                        )}
                      </h2>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Informado em{" "}
                        {formatarDataHora(
                          pagamento.declarado_em
                        )}
                      </p>
                    </div>

                    <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
                      Aguardando conferência
                    </span>
                  </div>

                  <div className="mt-6 grid gap-5 rounded-xl border bg-slate-50 p-5 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Pagador
                      </p>

                      <p className="mt-1 font-medium">
                        {
                          pagamento.nome_pagador
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        WhatsApp
                      </p>

                      <p className="mt-1 font-medium">
                        {
                          pagamento.whatsapp_contato
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        E-mail
                      </p>

                      <p className="mt-1 break-all font-medium">
                        {
                          pagamento.email_contato
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Acesso atual até
                      </p>

                      <p className="mt-1 font-medium">
                        {formatarData(
                          acessoAtual
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-start gap-3 rounded-xl border p-5">
                    <Clock3 className="mt-0.5 h-5 w-5 text-[#0b1f3a]" />

                    <div>
                      <p className="font-medium">
                        Período que será liberado
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatarData(
                          inicio
                        )}
                        {" → "}
                        {formatarData(
                          fim
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <form
                      action={
                        confirmarPagamentoPix
                      }
                    >
                      <input
                        type="hidden"
                        name="pagamento_id"
                        value={
                          pagamento.id
                        }
                      />

                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                      >
                        <BadgeCheck className="h-4 w-4" />
                        Confirmar pagamento
                      </button>
                    </form>

                    <form
                      action={
                        marcarPagamentoPixNaoLocalizado
                      }
                    >
                      <input
                        type="hidden"
                        name="pagamento_id"
                        value={
                          pagamento.id
                        }
                      />

                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50"
                      >
                        <SearchX className="h-4 w-4" />
                        Não localizado
                      </button>
                    </form>
                  </div>
                </section>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}
