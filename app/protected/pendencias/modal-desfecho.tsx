"use client";

import Link from "next/link";

import {
  useActionState,
  useEffect,
  useState,
} from "react";

import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import {
  registrarDesfechoAction,
  type AcaoDesfecho,
  type DesfechoState,
  type FinanceiroDesfecho,
  type ResultadoDesfecho,
} from "./actions";

/* =====================================================
   TIPOS
===================================================== */

export type DadosDesfechoDiligencia = {
  id:
    string;

  tipo_diligencia:
    string;

  numero_processo:
    string | null;

  data_diligencia:
    string;

  horario:
    string;

  hoje:
    string;

  temContratacaoFinanceira:
    boolean;

  desfechoPendente:
    boolean;
};

/* =====================================================
   HELPERS
===================================================== */

function formatarProcesso(
  processo:
    string | null
) {
  if (!processo) {
    return "Processo não informado";
  }

  const numeros =
    processo.replace(
      /\D/g,
      ""
    );

  if (
    numeros.length !==
    20
  ) {
    return processo;
  }

  return (
    `${numeros.slice(0, 7)}-` +
    `${numeros.slice(7, 9)}.` +
    `${numeros.slice(9, 13)}.` +
    `${numeros.slice(13, 14)}.` +
    `${numeros.slice(14, 16)}.` +
    `${numeros.slice(16, 20)}`
  );
}

function formatarData(
  data:
    string
) {
  const [
    ano,
    mes,
    dia,
  ] =
    data
      .slice(
        0,
        10
      )
      .split("-");

  if (
    !ano ||
    !mes ||
    !dia
  ) {
    return data;
  }

  return `${dia}/${mes}/${ano}`;
}

/* =====================================================
   BOTÃO / MODAL
===================================================== */

export function ModalDesfecho({
  diligencia,
}: {
  diligencia:
    DadosDesfechoDiligencia;
}) {
  const [
    aberto,
    setAberto,
  ] =
    useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() =>
          setAberto(true)
        }
        className={
          diligencia
            .desfechoPendente
            ? "inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
            : "inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-100"
        }
      >
        <CheckCircle2 className="h-4 w-4" />

        Registrar desfecho
      </button>

      {aberto && (
        <ConteudoModal
          diligencia={
            diligencia
          }
          onClose={() =>
            setAberto(false)
          }
        />
      )}
    </>
  );
}

/* =====================================================
   CONTEÚDO
===================================================== */

function ConteudoModal({
  diligencia,
  onClose,
}: {
  diligencia:
    DadosDesfechoDiligencia;

  onClose:
    () => void;
}) {
  const router =
    useRouter();

  const estadoInicial:
    DesfechoState = {
      status:
        "inicial",

      mensagem:
        null,

      acao:
        null,

      diligenciaId:
        diligencia.id,

      novaDiligenciaId:
        null,
    };

  const [
    state,
    formAction,
    isPending,
  ] =
    useActionState(
      registrarDesfechoAction,
      estadoInicial
    );

  const [
    acao,
    setAcao,
  ] =
    useState<AcaoDesfecho>(
      "concluir"
    );

  const [
    resultado,
    setResultado,
  ] =
    useState<
      ResultadoDesfecho |
      null
    >(null);

  const [
    financeiro,
    setFinanceiro,
  ] =
    useState<
      FinanceiroDesfecho |
      null
    >(null);

  const [
    novaData,
    setNovaData,
  ] =
    useState("");

  const [
    novoHorario,
    setNovoHorario,
  ] =
    useState("");

  const [
    observacoes,
    setObservacoes,
  ] =
    useState("");

  useEffect(() => {
    if (
      state.status ===
      "sucesso"
    ) {
      router.refresh();
    }
  }, [
    state.status,
    router,
  ]);

  const conclusao =
    acao ===
      "concluir" ||
    acao ===
      "concluir_e_criar_continuidade";

  const precisaNovaData =
    acao ===
      "reagendar" ||
    acao ===
      "concluir_e_criar_continuidade";

  const financeiroBloqueado =
    conclusao &&
    financeiro ===
      "liberado_para_pagamento" &&
    !diligencia
      .temContratacaoFinanceira;

  const observacaoObrigatoria =
    acao ===
      "reagendar" ||
    resultado ===
      "finalidade_nao_atingida";

  if (
    state.status ===
    "sucesso"
  ) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div
          role="dialog"
          aria-modal="true"
          className="w-full max-w-xl rounded-2xl border bg-background shadow-2xl"
        >
          <div className="p-7">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-6 w-6 text-emerald-700" />
            </div>

            <h2 className="mt-4 text-center text-xl font-semibold">
              Tratamento registrado
            </h2>

            <p className="mt-2 text-center text-sm leading-6 text-muted-foreground">
              {
                state.mensagem
              }
            </p>

            {state
              .novaDiligenciaId && (
              <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-950">
                  Nova diligência criada
                </p>

                <p className="mt-1 text-sm leading-6 text-blue-900">
                  A continuidade recebeu um novo ID e iniciou um novo ciclo operacional. Participantes, contratação e orientações precisam ser tratados novamente.
                </p>

                <Link
                  href={`/protected/diligencias/${state.novaDiligenciaId}/editar`}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#0b1f3a] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
                >
                  Tratar nova diligência

                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}

            <div className="mt-7 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  router.refresh();
                  onClose();
                }}
                className="rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-muted"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`desfecho-${diligencia.id}`}
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border bg-background shadow-2xl"
      >
        {/* ===============================================
            CABEÇALHO
        ================================================ */}

        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b bg-background px-6 py-5">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Tratamento operacional
            </p>

            <h2
              id={`desfecho-${diligencia.id}`}
              className="mt-1 text-xl font-semibold"
            >
              Registrar desfecho
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {
                diligencia
                  .tipo_diligencia
              }{" "}
              •{" "}
              {formatarProcesso(
                diligencia
                  .numero_processo
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              isPending
            }
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          action={
            formAction
          }
          className="space-y-7 p-6"
        >
          <input
            type="hidden"
            name="diligencia_id"
            value={
              diligencia.id
            }
          />

          <input
            type="hidden"
            name="acao"
            value={
              acao
            }
          />

          {/* =============================================
              ERRO
          ============================================== */}

          {state.status ===
            "erro" &&
            state.mensagem && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />

                  <div>
                    <p className="font-semibold text-red-950">
                      Não foi possível registrar o desfecho
                    </p>

                    <p className="mt-1 text-sm leading-6 text-red-900">
                      {
                        state.mensagem
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

          {/* =============================================
              ATO ATUAL
          ============================================== */}

          <div className="rounded-xl bg-muted/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Diligência atual
            </p>

            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <span>
                <strong>
                  Data:
                </strong>{" "}
                {formatarData(
                  diligencia
                    .data_diligencia
                )}
              </span>

              <span>
                <strong>
                  Horário:
                </strong>{" "}
                {diligencia
                  .horario
                  .slice(
                    0,
                    5
                  )}
              </span>
            </div>
          </div>

          {/* =============================================
              DECISÃO PRINCIPAL
          ============================================== */}

          <section>
            <h3 className="font-semibold">
              O que aconteceu com esta diligência?
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Esta escolha define se o ato será encerrado ou continuará ativo.
            </p>

            <div className="mt-4 grid gap-3">
              <button
                type="button"
                disabled={
                  isPending
                }
                onClick={() =>
                  setAcao(
                    "concluir"
                  )
                }
                className={
                  acao ===
                  "concluir"
                    ? "rounded-xl border-2 border-emerald-600 bg-emerald-50 p-4 text-left"
                    : "rounded-xl border p-4 text-left hover:bg-muted/40"
                }
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className={
                      acao ===
                      "concluir"
                        ? "mt-0.5 h-5 w-5 shrink-0 text-emerald-700"
                        : "mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
                    }
                  />

                  <div>
                    <p className="font-semibold">
                      Concluir esta diligência
                    </p>

                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      O ciclo operacional desta diligência será encerrado. Depois você definirá o resultado e se ela deve seguir para pagamento.
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                disabled={
                  isPending
                }
                onClick={() => {
                  setAcao(
                    "reagendar"
                  );

                  setResultado(
                    null
                  );

                  setFinanceiro(
                    null
                  );
                }}
                className={
                  acao ===
                  "reagendar"
                    ? "rounded-xl border-2 border-blue-600 bg-blue-50 p-4 text-left"
                    : "rounded-xl border p-4 text-left hover:bg-muted/40"
                }
              >
                <div className="flex items-start gap-3">
                  <RefreshCw
                    className={
                      acao ===
                      "reagendar"
                        ? "mt-0.5 h-5 w-5 shrink-0 text-blue-700"
                        : "mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
                    }
                  />

                  <div>
                    <p className="font-semibold">
                      Reagendar e manter esta diligência ativa
                    </p>

                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Use quando não houve uma tentativa que deva ser encerrada/faturada e o mesmo ato apenas seguirá para uma nova data.
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                disabled={
                  isPending
                }
                onClick={() =>
                  setAcao(
                    "concluir_e_criar_continuidade"
                  )
                }
                className={
                  acao ===
                  "concluir_e_criar_continuidade"
                    ? "rounded-xl border-2 border-amber-600 bg-amber-50 p-4 text-left"
                    : "rounded-xl border p-4 text-left hover:bg-muted/40"
                }
              >
                <div className="flex items-start gap-3">
                  <CalendarClock
                    className={
                      acao ===
                      "concluir_e_criar_continuidade"
                        ? "mt-0.5 h-5 w-5 shrink-0 text-amber-700"
                        : "mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
                    }
                  />

                  <div>
                    <p className="font-semibold">
                      Concluir esta tentativa e criar uma nova diligência
                    </p>

                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Use quando a tentativa atual terminou, mas será necessário novo ato. A diligência atual poderá ou não gerar pagamento e a próxima terá um novo ID.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </section>

          {/* =============================================
              ALERTA REAGENDAMENTO
          ============================================== */}

          {acao ===
            "reagendar" && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />

                <div>
                  <p className="font-semibold text-blue-950">
                    Esta opção não encaminha o ato para pagamento
                  </p>

                  <p className="mt-1 text-sm leading-6 text-blue-900">
                    A mesma diligência permanecerá ativa. A data anterior, o novo agendamento e o motivo ficarão registrados no histórico.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* =============================================
              RESULTADO
          ============================================== */}

          {conclusao && (
            <section>
              <h3 className="font-semibold">
                Resultado da diligência
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                O resultado do ato é independente do direito ao pagamento.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label
                  className={
                    resultado ===
                    "finalidade_atingida"
                      ? "cursor-pointer rounded-xl border-2 border-emerald-600 bg-emerald-50 p-4"
                      : "cursor-pointer rounded-xl border p-4 hover:bg-muted/40"
                  }
                >
                  <input
                    type="radio"
                    name="resultado"
                    value="finalidade_atingida"
                    checked={
                      resultado ===
                      "finalidade_atingida"
                    }
                    onChange={() =>
                      setResultado(
                        "finalidade_atingida"
                      )
                    }
                    disabled={
                      isPending
                    }
                    className="sr-only"
                  />

                  <p className="font-semibold">
                    Finalidade atingida
                  </p>

                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    O objetivo operacional do ato foi alcançado.
                  </p>
                </label>

                <label
                  className={
                    resultado ===
                    "finalidade_nao_atingida"
                      ? "cursor-pointer rounded-xl border-2 border-amber-600 bg-amber-50 p-4"
                      : "cursor-pointer rounded-xl border p-4 hover:bg-muted/40"
                  }
                >
                  <input
                    type="radio"
                    name="resultado"
                    value="finalidade_nao_atingida"
                    checked={
                      resultado ===
                      "finalidade_nao_atingida"
                    }
                    onChange={() =>
                      setResultado(
                        "finalidade_nao_atingida"
                      )
                    }
                    disabled={
                      isPending
                    }
                    className="sr-only"
                  />

                  <p className="font-semibold">
                    Finalidade não atingida
                  </p>

                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    O ato foi tratado ou tentado, mas o objetivo final não foi alcançado.
                  </p>
                </label>
              </div>
            </section>
          )}

          {/* =============================================
              FINANCEIRO
          ============================================== */}

          {conclusao && (
            <section>
              <h3 className="font-semibold">
                Esta diligência gera pagamento?
              </h3>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                A finalidade ter sido ou não atingida não determina esta resposta. Considere se o profissional executou atividade que deve ser remunerada.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label
                  className={
                    financeiro ===
                    "liberado_para_pagamento"
                      ? "cursor-pointer rounded-xl border-2 border-emerald-600 bg-emerald-50 p-4"
                      : "cursor-pointer rounded-xl border p-4 hover:bg-muted/40"
                  }
                >
                  <input
                    type="radio"
                    name="financeiro_status"
                    value="liberado_para_pagamento"
                    checked={
                      financeiro ===
                      "liberado_para_pagamento"
                    }
                    onChange={() =>
                      setFinanceiro(
                        "liberado_para_pagamento"
                      )
                    }
                    disabled={
                      isPending
                    }
                    className="sr-only"
                  />

                  <div className="flex items-start gap-3">
                    <CircleDollarSign className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />

                    <div>
                      <p className="font-semibold">
                        Sim, encaminhar para pagamento
                      </p>

                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        A diligência ficará disponível para o futuro fluxo financeiro.
                      </p>
                    </div>
                  </div>
                </label>

                <label
                  className={
                    financeiro ===
                    "nao_aplicavel"
                      ? "cursor-pointer rounded-xl border-2 border-slate-600 bg-slate-50 p-4"
                      : "cursor-pointer rounded-xl border p-4 hover:bg-muted/40"
                  }
                >
                  <input
                    type="radio"
                    name="financeiro_status"
                    value="nao_aplicavel"
                    checked={
                      financeiro ===
                      "nao_aplicavel"
                    }
                    onChange={() =>
                      setFinanceiro(
                        "nao_aplicavel"
                      )
                    }
                    disabled={
                      isPending
                    }
                    className="sr-only"
                  />

                  <p className="font-semibold">
                    Não, sem pagamento
                  </p>

                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    O ato será encerrado sem entrar na fila financeira.
                  </p>
                </label>
              </div>

              {financeiroBloqueado && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />

                    <div>
                      <p className="font-semibold text-red-950">
                        Não há contratação financeira registrada
                      </p>

                      <p className="mt-1 text-sm leading-6 text-red-900">
                        Para liberar o ato para pagamento, primeiro registre a contratação, o profissional, o valor e a data combinada de pagamento.
                      </p>

                      <Link
                        href={`/protected/diligencias/${diligencia.id}/editar`}
                        className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-red-900 underline underline-offset-4"
                      >
                        Revisar contratação

                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* =============================================
              NOVA DATA
          ============================================== */}

          {precisaNovaData && (
            <section>
              <h3 className="font-semibold">
                {acao ===
                "reagendar"
                  ? "Novo agendamento"
                  : "Nova diligência"}
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                {acao ===
                "reagendar"
                  ? "A mesma diligência permanecerá ativa nesta nova data."
                  : "Uma nova diligência será criada vinculada à tentativa que está sendo encerrada."}
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor={`nova-data-${diligencia.id}`}
                    className="text-sm font-medium"
                  >
                    Nova data *
                  </label>

                  <input
                    id={`nova-data-${diligencia.id}`}
                    type="date"
                    name="nova_data"
                    min={
                      diligencia
                        .hoje
                    }
                    value={
                      novaData
                    }
                    onChange={(
                      event
                    ) =>
                      setNovaData(
                        event.target.value
                      )
                    }
                    required
                    disabled={
                      isPending
                    }
                    className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`novo-horario-${diligencia.id}`}
                    className="text-sm font-medium"
                  >
                    Novo horário *
                  </label>

                  <input
                    id={`novo-horario-${diligencia.id}`}
                    type="time"
                    name="novo_horario"
                    value={
                      novoHorario
                    }
                    onChange={(
                      event
                    ) =>
                      setNovoHorario(
                        event.target.value
                      )
                    }
                    required
                    disabled={
                      isPending
                    }
                    className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              {acao ===
                "concluir_e_criar_continuidade" && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                  A nova diligência herdará os dados estruturais do processo, mas iniciará sem advogado, preposto, testemunhas, contratação e orientações definidos. Isso evita transportar automaticamente decisões da tentativa anterior.
                </div>
              )}
            </section>
          )}

          {/* =============================================
              OBSERVAÇÕES
          ============================================== */}

          <section>
            <label
              htmlFor={`observacoes-desfecho-${diligencia.id}`}
              className="font-semibold"
            >
              {acao ===
              "reagendar"
                ? "Motivo do reagendamento"
                : "Observações do desfecho"}

              {observacaoObrigatoria
                ? " *"
                : ""}
            </label>

            <p className="mt-1 text-sm text-muted-foreground">
              {acao ===
              "reagendar"
                ? "Registre por que o ato seguirá para uma nova data."
                : resultado ===
                    "finalidade_nao_atingida"
                  ? "Explique o que ocorreu e por que a finalidade não foi atingida."
                  : "Registre alguma informação relevante sobre o encerramento, se necessário."}
            </p>

            <textarea
              id={`observacoes-desfecho-${diligencia.id}`}
              name="observacoes"
              rows={4}
              value={
                observacoes
              }
              onChange={(
                event
              ) =>
                setObservacoes(
                  event.target.value
                )
              }
              required={
                observacaoObrigatoria
              }
              disabled={
                isPending
              }
              className="mt-3 w-full resize-y rounded-lg border bg-background px-3 py-3 text-sm"
            />
          </section>

          {/* =============================================
              AÇÕES
          ============================================== */}

          <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={
                onClose
              }
              disabled={
                isPending
              }
              className="rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                isPending ||
                financeiroBloqueado
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0b1f3a] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />

                  Registrando...
                </>
              ) : acao ===
                "reagendar" ? (
                <>
                  <RefreshCw className="h-4 w-4" />

                  Confirmar reagendamento
                </>
              ) : acao ===
                "concluir_e_criar_continuidade" ? (
                <>
                  <CalendarClock className="h-4 w-4" />

                  Concluir e criar nova
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />

                  Concluir diligência
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}