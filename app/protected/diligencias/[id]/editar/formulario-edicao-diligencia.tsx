"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";

import Link from "next/link";

import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Clock3,
  FileText,
  LoaderCircle,
  MapPin,
  Monitor,
  Save,
  UsersRound,
} from "lucide-react";

import {
  ParticipantesDiligencia,
} from "../../nova/participantes-diligencia";

import {
  editarDiligencia,
  type EdicaoState,
} from "./actions";

type Detalhes = {
  diligencia: {
    id: string;
    tipo_diligencia: string;

    modalidade:
      | "presencial"
      | "virtual";

    numero_processo:
      string | null;

    parte_autora:
      string | null;

    parte_re:
      string | null;

    data_diligencia: string;
    horario: string;

    vara:
      string | null;

    comarca:
      string | null;

    uf:
      string | null;

    local:
      string | null;

    correspondente_id:
      string | null;

    necessita_preposto:
      boolean;

    preposto_id:
      string | null;

    testemunhas_confirmadas:
      boolean;

    contratacao_confirmada:
      boolean;

    orientacoes_encaminhadas:
      boolean;

    observacoes:
      string | null;

    status: string;
  };

  advogado: {
    id: string;
    nome: string;
    oab_numero: string;
    oab_uf: string;
  } | null;

  preposto: {
    id: string;
    nome: string;
    cpf: string;
  } | null;

  testemunhas: {
    id: string;
    nome: string;
    cpf: string;
  }[];
};

function dataParaInput(
  data: string | null | undefined
) {
  if (!data) {
    return "";
  }

  /*
    Data da diligência é uma data civil,
    não um instante de tempo.

    Nunca usamos new Date() aqui,
    pois isso pode deslocar o dia
    conforme o fuso horário.
  */
  const encontrada =
    data.match(
      /^(\d{4}-\d{2}-\d{2})/
    );

  return encontrada
    ? encontrada[1]
    : data;
}

function formatarProcesso(
  processo: string | null
) {
  if (!processo) {
    return "";
  }

  function formatarData(
  data: string
) {
  const [
    ano,
    mes,
    dia,
  ] = data.split("-");

  return `${dia}/${mes}/${ano}`;
}


function formatarDiferenca(
  minutos: number
) {
  const horas =
    Math.floor(
      minutos / 60
    );

  const restantes =
    minutos % 60;

  if (horas === 0) {
    return `${restantes} min`;
  }

  if (restantes === 0) {
    return `${horas}h`;
  }

  return `${horas}h ${restantes}min`;
}
  const numeros =
    processo.replace(
      /\D/g,
      ""
    );

  if (
    numeros.length !== 20
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
  data: string
) {
  const [
    ano,
    mes,
    dia,
  ] = data.split("-");

  return `${dia}/${mes}/${ano}`;
}


function formatarDiferenca(
  minutos: number
) {
  const horas =
    Math.floor(
      minutos / 60
    );

  const restantes =
    minutos % 60;

  if (horas === 0) {
    return `${restantes} min`;
  }

  if (restantes === 0) {
    return `${horas}h`;
  }

  return `${horas}h ${restantes}min`;
}

export function FormularioEdicaoDiligencia({
  detalhes,
}: {
  detalhes: Detalhes;
}) {
  const diligencia =
    detalhes.diligencia;

    const [
  orientacoesEncaminhadas,
  setOrientacoesEncaminhadas,
] = useState(
  diligencia.orientacoes_encaminhadas === true
);

    const estadoInicial:
  EdicaoState = {
    status: "inicial",
    mensagem: "",
    diligenciasEncontradas: [],
    conflitosAgenda: [],
  };


const [
  state,
  formAction,
  isPending,
] = useActionState(
  editarDiligencia,
  estadoInicial
);

const alertaRef =
  useRef<HTMLDivElement | null>(
    null
  );


useEffect(() => {
  if (
    state.status !== "alerta" &&
    state.status !== "erro"
  ) {
    return;
  }

  const timer =
    window.setTimeout(() => {
      const elemento =
        alertaRef.current;

      if (!elemento) {
        return;
      }

      elemento.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);

  return () => {
    window.clearTimeout(
      timer
    );
  };
}, [state]);

  return (
    <main className="w-full">
      <section className="mb-8">
        <Link
          href={`/protected/diligencias/${diligencia.id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />

          Voltar para diligência
        </Link>

        <div className="mt-5">
          <p className="text-sm font-medium text-muted-foreground">
            Gestão operacional
          </p>

          <h1 className="mt-1 text-4xl font-bold tracking-tight">
            Editar diligência
          </h1>

          <p className="mt-2 text-muted-foreground">
            Revise e altere as informações da diligência.
          </p>
        </div>
      </section>

      <form
        action={formAction}
        className="space-y-6"
      >
        <input
          type="hidden"
          name="diligencia_id"
          value={diligencia.id}
        />

{state.status === "erro" &&
  state.mensagem && (
    <div ref={alertaRef} className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <p className="font-semibold">
        Não foi possível salvar as alterações.
      </p>

      <p className="mt-1">
        {state.mensagem}
      </p>
    </div>
  )}

  {state.status === "alerta" && (
  <section
    ref={alertaRef}
    className="scroll-mt-6 rounded-xl border border-amber-300 bg-amber-50"
  >
    <div className="border-b border-amber-200 p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-700" />

        <div>
          <h2 className="text-lg font-semibold text-amber-950">
            Confira antes de salvar
          </h2>

          <p className="mt-1 text-sm text-amber-900">
            {state.mensagem}
          </p>
        </div>
      </div>
    </div>


    <div className="space-y-6 p-6">

      {/* PROCESSO JÁ EXISTENTE */}

      {(state
        .diligenciasEncontradas
        ?.length ?? 0) > 0 && (
        <div>
          <h3 className="font-semibold text-amber-950">
            Já existe outra diligência para este processo
          </h3>

          <p className="mt-1 text-sm text-amber-900">
            Verifique se a nova informação está correta antes de prosseguir.
          </p>


          <div className="mt-4 space-y-3">
            {state
              .diligenciasEncontradas!
              .map(
                (
                  encontrada
                ) => (
                  <div
                    key={
                      encontrada.id
                    }
                    className="rounded-lg border border-amber-200 bg-white p-4"
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                          Processo
                        </p>

                        <p className="mt-1 font-medium">
                          {formatarProcesso(
                            encontrada
                              .numero_processo
                          )}
                        </p>
                      </div>


                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                          Data e horário
                        </p>

                        <p className="mt-1 font-medium">
                          {formatarData(
                            encontrada
                              .data_diligencia
                          )}{" "}
                          às{" "}
                          {encontrada
                            .horario
                            .slice(
                              0,
                              5
                            )}
                        </p>
                      </div>


                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                          Tipo
                        </p>

                        <p className="mt-1">
                          {
                            encontrada
                              .tipo_diligencia
                          }
                        </p>
                      </div>


                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                          Comarca
                        </p>

                        <p className="mt-1">
                          {encontrada
                            .comarca ||
                            "Não informada"}

                          {encontrada.uf
                            ? `/${encontrada.uf}`
                            : ""}
                        </p>
                      </div>


                      {(encontrada
                        .parte_autora ||
                        encontrada
                          .parte_re) && (
                        <div className="md:col-span-2">
                          <p className="text-xs font-semibold uppercase text-muted-foreground">
                            Partes
                          </p>

                          <p className="mt-1">
                            {encontrada
                              .parte_autora ||
                              "—"}

                            {" × "}

                            {encontrada
                              .parte_re ||
                              "—"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}
          </div>
        </div>
      )}


      {/* CONFLITO DE AGENDA */}

      {(state
        .conflitosAgenda
        ?.length ?? 0) > 0 && (
        <div>
          <h3 className="font-semibold text-red-900">
            Conflito de agenda identificado
          </h3>

          <p className="mt-1 text-sm text-red-800">
            Um ou mais participantes estão vinculados a outra diligência no mesmo dia, em intervalo inferior a 5 horas.
          </p>


          <div className="mt-4 space-y-3">
            {state
              .conflitosAgenda!
              .map(
                (
                  conflito,
                  indice
                ) => (
                  <div
                    key={`${conflito.participante_tipo}-${conflito.participante_id}-${conflito.diligencia.id}-${indice}`}
                    className="rounded-lg border border-red-200 bg-red-50 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />

                      <div className="w-full">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-red-950">
                            {
                              conflito
                                .participante_nome
                            }
                          </p>

                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                            {conflito
                              .participante_tipo ===
                            "advogado"
                              ? "Advogado"
                              : conflito
                                    .participante_tipo ===
                                  "preposto"
                                ? "Preposto"
                                : "Testemunha"}
                          </span>
                        </div>


                        <p className="mt-1 text-sm text-red-800">
                          {
                            conflito
                              .identificacao
                          }
                        </p>


                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div>
                            <p className="text-xs font-semibold uppercase text-red-700">
                              Outra diligência
                            </p>

                            <p className="mt-1 font-medium">
                              {formatarData(
                                conflito
                                  .diligencia
                                  .data_diligencia
                              )}{" "}
                              às{" "}
                              {conflito
                                .diligencia
                                .horario
                                .slice(
                                  0,
                                  5
                                )}
                            </p>
                          </div>


                          <div>
                            <p className="text-xs font-semibold uppercase text-red-700">
                              Intervalo
                            </p>

                            <p className="mt-1 font-medium">
                              {formatarDiferenca(
                                conflito
                                  .diferenca_minutos
                              )}
                            </p>
                          </div>


                          <div>
                            <p className="text-xs font-semibold uppercase text-red-700">
                              Processo
                            </p>

                            <p className="mt-1">
                              {formatarProcesso(
                                conflito
                                  .diligencia
                                  .numero_processo
                              )}
                            </p>
                          </div>


                          <div>
                            <p className="text-xs font-semibold uppercase text-red-700">
                              Comarca
                            </p>

                            <p className="mt-1">
                              {conflito
                                .diligencia
                                .comarca ||
                                "Não informada"}

                              {conflito
                                .diligencia
                                .uf
                                ? `/${conflito.diligencia.uf}`
                                : ""}
                            </p>
                          </div>


                          {conflito
                            .diligencia
                            .vara && (
                            <div className="md:col-span-2">
                              <p className="text-xs font-semibold uppercase text-red-700">
                                Vara / unidade
                              </p>

                              <p className="mt-1">
                                {
                                  conflito
                                    .diligencia
                                    .vara
                                }
                              </p>
                            </div>
                          )}


                          {(conflito
                            .diligencia
                            .parte_autora ||
                            conflito
                              .diligencia
                              .parte_re) && (
                            <div className="md:col-span-2">
                              <p className="text-xs font-semibold uppercase text-red-700">
                                Partes
                              </p>

                              <p className="mt-1">
                                {conflito
                                  .diligencia
                                  .parte_autora ||
                                  "—"}

                                {" × "}

                                {conflito
                                  .diligencia
                                  .parte_re ||
                                  "—"}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
          </div>
        </div>
      )}


      {/* DECISÃO */}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-amber-200 pt-5">
        <p className="max-w-2xl text-sm text-amber-900">
          O alerta não impede a alteração. Revise as informações ou confirme expressamente que deseja manter a edição.
        </p>


        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            name="acao_edicao"
            value="revisar"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-amber-100 disabled:cursor-wait disabled:opacity-60"
          >
            Voltar e revisar
          </button>


          <button
            type="submit"
            name="acao_edicao"
            value="prosseguir"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0b1f3a] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
          >
            {isPending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}

            {isPending
              ? "Verificando novamente..."
              : "Salvar mesmo assim"}
          </button>
        </div>
      </div>
    </div>
  </section>
)}

        {/* IDENTIFICAÇÃO */}

        <section className="rounded-xl border bg-card">
          <div className="border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5" />

              <div>
                <h2 className="text-lg font-semibold">
                  Identificação
                </h2>

                <p className="text-sm text-muted-foreground">
                  Informações principais da diligência.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 p-6 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">
                Tipo da diligência *
              </label>

              <input
                name="tipo_diligencia"
                required
                defaultValue={
                  diligencia.tipo_diligencia
                }
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Número do processo
              </label>

              <input
                name="numero_processo"
                defaultValue={
                  formatarProcesso(
                    diligencia.numero_processo
                  )
                }
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Parte autora
              </label>

              <input
                name="parte_autora"
                defaultValue={
                  diligencia.parte_autora ?? ""
                }
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Parte ré
              </label>

              <input
                name="parte_re"
                defaultValue={
                  diligencia.parte_re ?? ""
                }
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
              />
            </div>
          </div>
        </section>

        {/* MODALIDADE */}

        <section className="rounded-xl border bg-card">
          <div className="border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <UsersRound className="h-5 w-5" />

              <div>
                <h2 className="text-lg font-semibold">
                  Modalidade
                </h2>

                <p className="text-sm text-muted-foreground">
                  Informe como o ato será realizado.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-2">
            <label className="flex cursor-pointer items-start gap-4 rounded-xl border p-5">
              <input
                type="radio"
                name="modalidade"
                value="presencial"
                required
                defaultChecked={
                  diligencia.modalidade ===
                  "presencial"
                }
                className="mt-1 h-4 w-4"
              />

              <div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />

                  <p className="font-semibold">
                    Presencial
                  </p>
                </div>

                <p className="mt-2 text-sm text-muted-foreground">
                  Exige comparecimento físico.
                </p>
              </div>
            </label>

            <label className="flex cursor-pointer items-start gap-4 rounded-xl border p-5">
              <input
                type="radio"
                name="modalidade"
                value="virtual"
                required
                defaultChecked={
                  diligencia.modalidade ===
                  "virtual"
                }
                className="mt-1 h-4 w-4"
              />

              <div>
                <div className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />

                  <p className="font-semibold">
                    Virtual
                  </p>
                </div>

                <p className="mt-2 text-sm text-muted-foreground">
                  Realizada remotamente.
                </p>
              </div>
            </label>
          </div>
        </section>

        {/* DATA E HORÁRIO */}

        <section className="rounded-xl border bg-card">
          <div className="border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5" />

              <h2 className="text-lg font-semibold">
                Data e horário
              </h2>
            </div>
          </div>

          <div className="grid gap-5 p-6 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">
                Data *
              </label>

              <input
                name="data_diligencia"
                type="date"
                required
                defaultValue={
                  dataParaInput(
                    state.valores
                      ?.data_diligencia ??
                      diligencia.data_diligencia
                  )
                }
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Horário *
              </label>

              <input
                name="horario"
                type="time"
                required
                defaultValue={
                  diligencia.horario.slice(
                    0,
                    5
                  )
                }
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
              />
            </div>
          </div>
        </section>

        {/* LOCAL */}

        <section className="rounded-xl border bg-card">
          <div className="border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5" />

              <h2 className="text-lg font-semibold">
                Local da diligência
              </h2>
            </div>
          </div>

          <div className="grid gap-5 p-6 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">
                Vara / unidade
              </label>

              <input
                name="vara"
                defaultValue={
                  diligencia.vara ?? ""
                }
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Local
              </label>

              <input
                name="local"
                defaultValue={
                  diligencia.local ?? ""
                }
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Comarca / cidade
              </label>

              <input
                name="comarca"
                defaultValue={
                  diligencia.comarca ?? ""
                }
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                UF
              </label>

              <input
                name="uf"
                maxLength={2}
                defaultValue={
                  diligencia.uf ?? ""
                }
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm uppercase"
              />
            </div>
          </div>
        </section>

        {/* PARTICIPANTES */}

        <ParticipantesDiligencia
          advogadoInicial={
            detalhes.advogado
              ? {
                  ...detalhes.advogado,
                  tipo: "advogado",
                }
              : null
          }
          necessitaPrepostoInicial={
            diligencia.necessita_preposto
          }
          prepostoInicial={
            detalhes.preposto
              ? {
                  ...detalhes.preposto,
                  tipo: "preposto",
                }
              : null
          }
          testemunhasConfirmadasInicial={
            diligencia.testemunhas_confirmadas
          }
          testemunhasIniciais={
            detalhes.testemunhas
          }
        />

        {/* TRATAMENTO */}

        <section className="rounded-xl border bg-card">
          <div className="border-b px-6 py-5">
            <h2 className="text-lg font-semibold">
              Tratamento
            </h2>
          </div>

          <div className="space-y-5 p-6">
            <label className="flex gap-3">
              <input
                type="checkbox"
                name="contratacao_confirmada"
                defaultChecked={
                  diligencia.contratacao_confirmada
                }
                className="mt-1 h-4 w-4"
              />

              <span className="text-sm font-medium">
                Contratação confirmada
              </span>
            </label>

            <label className="flex gap-3">
              <input
                type="checkbox"
                name="orientacoes_encaminhadas"
                checked={orientacoesEncaminhadas}
                onChange={(event) => {
                  setOrientacoesEncaminhadas(
                    event.target.checked
                  );
                }}
                className="mt-1 h-4 w-4"
              />

              <span className="text-sm font-medium">
                Orientações encaminhadas
              </span>
            </label>
          </div>
        </section>

        {/* OBSERVAÇÕES */}

        <section className="rounded-xl border bg-card">
          <div className="border-b px-6 py-5">
            <h2 className="text-lg font-semibold">
              Observações
            </h2>
          </div>

          <div className="p-6">
            <textarea
              name="observacoes"
              rows={5}
              defaultValue={
                diligencia.observacoes ?? ""
              }
              className="w-full rounded-lg border bg-background px-3 py-3 text-sm"
            />
          </div>
        </section>

        <div className="flex items-center justify-between gap-4 pb-10">
            <p className="text-sm text-muted-foreground">
              Antes de salvar, o NOTE LITIS verificará novamente a pauta e os participantes.
            </p>

            <button
              type="submit"
              name="acao_edicao"
              value="salvar"
              disabled={
                isPending ||
                state.status === "alerta"
              }
              className="inline-flex items-center gap-2 rounded-lg bg-[#0b1f3a] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
            >
              {isPending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              {isPending
                ? "Verificando..."
                : "Salvar alterações"}
            </button>
          </div>
      </form>
    </main>
  );
}