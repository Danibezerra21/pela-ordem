"use client";

import {
  ConflitosAgendaAlerta,
} from "./conflitos-agenda-alerta";

import {
  ParticipantesDiligencia,
} from "./participantes-diligencia";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AlertTriangle,
  CalendarDays,
  FileText,
  MapPin,
  Monitor,
  Save,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  analisarCadastroDiligencia,
  type CadastroState,
  type DiligenciaExistente,
} from "./actions";


const estadoInicial: CadastroState = {
  status: "inicial",
  mensagem: null,
  valores: null,
  diligenciasEncontradas: [],
  conflitosAgenda: [],
};

function formatarProcesso(
  processo: string | null
) {
  if (!processo) {
    return "PROCESSO NÃO INFORMADO";
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

function formatarModalidade(
  modalidade:
    | "presencial"
    | "virtual"
) {
  return modalidade ===
    "presencial"
    ? "Presencial"
    : "Virtual";
}

function DiligenciaEncontrada({
  diligencia,
}: {
  diligencia:
    DiligenciaExistente;
}) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex flex-wrap items-center gap-3">
        <strong>
          {formatarData(
            diligencia.data_diligencia
          )}
        </strong>

        <strong>
          {diligencia.horario.slice(
            0,
            5
          )}
        </strong>

        <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">
          {
            diligencia.tipo_diligencia
          }
        </span>

        <span className="rounded-md border px-2 py-1 text-xs font-medium">
          {formatarModalidade(
            diligencia.modalidade
          )}
        </span>
      </div>

      <p className="mt-3 text-sm font-semibold">
        Processo:{" "}
        {formatarProcesso(
          diligencia.numero_processo
        )}
      </p>

      <p className="mt-2 text-sm">
        {diligencia.parte_autora ||
          "PARTE AUTORA NÃO INFORMADA"}

        {" x "}

        {diligencia.parte_re ||
          "PARTE RÉ NÃO INFORMADA"}
      </p>

      <p className="mt-2 text-sm text-muted-foreground">
        {diligencia.vara ||
          "VARA NÃO INFORMADA"}

        {diligencia.comarca
          ? ` • ${diligencia.comarca}`
          : ""}

        {diligencia.uf
          ? `/${diligencia.uf}`
          : ""}
      </p>

      {diligencia.local && (
        <p className="mt-1 text-sm text-muted-foreground">
          {diligencia.local}
        </p>
      )}
    </div>
  );
}

export function FormularioDiligencia() {
  const [
    state,
    formAction,
    isPending,
  ] = useActionState(
    analisarCadastroDiligencia,
    estadoInicial
  );

  const emAlerta =
    state.status === "alerta";

    const [
  contratacaoStatus,
  setContratacaoStatus,
] = useState<
  "confirmada" |
  "desnecessaria" |
  null
>(
  state.valores?.contratacao_status ??
    null
);

const [
  contratacaoTipo,
  setContratacaoTipo,
] = useState<
  "advogado" |
  "preposto" |
  "advogado_preposto" |
  null
>(
  state.valores?.contratacao_tipo ??
    null
);


const [
  valorContratacaoAdvogado,
  setValorContratacaoAdvogado,
] = useState("");

const [
  pagamentoCombinadoAdvogado,
  setPagamentoCombinadoAdvogado,
] = useState("");

const [
  valorContratacaoPreposto,
  setValorContratacaoPreposto,
] = useState("");

const [
  pagamentoCombinadoPreposto,
  setPagamentoCombinadoPreposto,
] = useState("");

  const resultadoRef =
    useRef<HTMLDivElement>(
      null
    );

  useEffect(() => {
    if (
      state.status === "alerta" ||
      state.status === "erro" ||
      state.status === "revisao" ||
      state.mensagem
    ) {
      resultadoRef.current?.scrollIntoView(
        {
          behavior:
            "smooth",

          block:
            "start",
        }
      );
    }
  }, [state]);

  return (
    <form
      action={formAction}
      className="space-y-6"
    >
      {/* PONTO DA ROLAGEM */}
      <div
        ref={resultadoRef}
        className="scroll-mt-8"
      />

      {/* ==================================================
          ALERTA PREVENTIVO DE POSSÍVEL DUPLICIDADE
      =================================================== */}

      {emAlerta && (
        <section className="rounded-xl border border-amber-300 bg-amber-50 p-6 text-slate-900 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-amber-100 p-2">
              <AlertTriangle className="h-6 w-6 text-amber-700" />
            </div>

            <div>
              <h2 className="text-xl font-semibold">
                Confira antes de cadastrar
              </h2>

              <p className="mt-2 text-sm">
                Este processo já possui
                outra diligência presente
                ou futura cadastrada.
              </p>

              <p className="mt-1 text-sm">
                Confira os registros antes
                de continuar.
              </p>

              <p className="mt-2 text-sm font-medium text-amber-900">
                A nova diligência ainda
                não foi cadastrada.
              </p>

              {state.mensagem && (
                <p className="mt-3 rounded-lg border border-amber-200 bg-white p-3 text-sm">
                  {state.mensagem}
                </p>
              )}
            </div>
          </div>

          {/* TENTATIVA DE CADASTRO */}

          {state.valores && (
            <div className="mt-6 rounded-lg border border-amber-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Nova diligência
              </p>

              <ConflitosAgendaAlerta
                conflitos={
                  state.conflitosAgenda ??
                  []
                }
              />
              
              <p className="mt-3 font-semibold">
                Processo:{" "}
                {formatarProcesso(
                  state.valores
                    .numero_processo
                )}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span>
                  {
                    state.valores
                      .tipo_diligencia
                  }
                </span>

                <span>•</span>

                <span>
                  {formatarData(
                    state.valores
                      .data_diligencia
                  )}
                </span>

                <span>•</span>

                <span>
                  {
                    state.valores
                      .horario
                  }
                </span>

                <span>•</span>

                <strong>
                  {state.valores
                    .modalidade ===
                  "presencial"
                    ? "Presencial"
                    : "Virtual"}
                </strong>
              </div>

              <p className="mt-2 text-sm">
                {state.valores
                  .parte_autora ||
                  "PARTE AUTORA NÃO INFORMADA"}

                {" x "}

                {state.valores
                  .parte_re ||
                  "PARTE RÉ NÃO INFORMADA"}
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                {state.valores.vara ||
                  "VARA NÃO INFORMADA"}

                {state.valores
                  .comarca
                  ? ` • ${state.valores.comarca}`
                  : ""}

                {state.valores.uf
                  ? `/${state.valores.uf}`
                  : ""}
              </p>
            </div>
          )}

          {/* DILIGÊNCIAS JÁ CADASTRADAS */}

          <div className="mt-7">
            <div className="rounded-lg border border-amber-200 bg-amber-100/60 p-4">
              <h3 className="font-semibold">
                Diligências já
                cadastradas para este
                processo
              </h3>

              <p className="mt-1 text-sm">
                Foram encontrados{" "}
                <strong>
                  {
                    state
                      .diligenciasEncontradas
                      .length
                  }
                </strong>{" "}
                registro(s) com data de
                hoje ou futura.
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {state.diligenciasEncontradas.map(
                (
                  diligencia
                ) => (
                  <DiligenciaEncontrada
                    key={
                      diligencia.id
                    }
                    diligencia={
                      diligencia
                    }
                  />
                )
              )}
            </div>
          </div>

          {/* DECISÃO */}

          <div className="mt-7 border-t border-amber-300 pt-5">
            <p className="mb-4 text-sm font-medium">
              Como deseja proceder?
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="submit"
                name="intencao"
                value="revisar"
                disabled={
                  isPending
                }
                className="rounded-lg border border-slate-400 bg-white px-5 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                {isPending
                  ? "Processando..."
                  : "Voltar e revisar"}
              </button>

              <button
                type="submit"
                name="intencao"
                value="prosseguir"
                disabled={
                  isPending
                }
                className="rounded-lg bg-[#0b1f3a] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isPending
                  ? "Cadastrando..."
                  : "Cadastrar mesmo assim"}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ==================================================
          ERRO
      =================================================== */}

      {state.status ===
        "erro" &&
        state.mensagem && (
          <section className="rounded-xl border border-red-300 bg-red-50 p-5 text-red-950">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

              <div>
                <h2 className="font-semibold">
                  Não foi possível
                  continuar
                </h2>

                <p className="mt-1 text-sm">
                  {
                    state.mensagem
                  }
                </p>
              </div>
            </div>
          </section>
        )}

      {/* ==================================================
          REVISÃO
      =================================================== */}

      {state.status ===
        "revisao" &&
        state.mensagem && (
          <section className="rounded-xl border bg-muted/40 p-5">
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-5 w-5 shrink-0" />

              <div>
                <h2 className="font-semibold">
                  Revise o cadastro
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  {
                    state.mensagem
                  }
                </p>
              </div>
            </div>
          </section>
        )}

      {/* ==================================================
          IDENTIFICAÇÃO
      =================================================== */}

      <section className="rounded-xl border bg-card">
        <div className="border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5" />

            <div>
              <h2 className="text-lg font-semibold">
                Identificação
              </h2>

              <p className="text-sm text-muted-foreground">
                Informações principais
                da diligência.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="tipo_diligencia"
              className="text-sm font-medium"
            >
              Tipo da diligência *
            </label>

            <input
              id="tipo_diligencia"
              name="tipo_diligencia"
              required
              disabled={
                emAlerta
              }
              defaultValue={
                state.valores
                  ?.tipo_diligencia ??
                ""
              }
              placeholder="Ex.: Audiência una, cópias, protocolo"
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:bg-muted"
            />
          </div>

          <div>
            <label
              htmlFor="numero_processo"
              className="text-sm font-medium"
            >
              Número do processo
            </label>

            <input
              id="numero_processo"
              name="numero_processo"
              disabled={
                emAlerta
              }
              defaultValue={
                state.valores
                  ?.numero_processo
                  ? formatarProcesso(
                      state.valores
                        .numero_processo
                    )
                  : ""
              }
              placeholder="0000000-00.0000.0.00.0000"
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:bg-muted"
            />
          </div>

          <div>
            <label
              htmlFor="parte_autora"
              className="text-sm font-medium"
            >
              Parte autora
            </label>

            <input
              id="parte_autora"
              name="parte_autora"
              disabled={
                emAlerta
              }
              defaultValue={
                state.valores
                  ?.parte_autora ??
                ""
              }
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:bg-muted"
            />
          </div>

          <div>
            <label
              htmlFor="parte_re"
              className="text-sm font-medium"
            >
              Parte ré
            </label>

            <input
              id="parte_re"
              name="parte_re"
              disabled={
                emAlerta
              }
              defaultValue={
                state.valores
                  ?.parte_re ??
                ""
              }
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:bg-muted"
            />
          </div>
        </div>
      </section>

      {/* ==================================================
          MODALIDADE
      =================================================== */}

      <section className="rounded-xl border bg-card">
        <div className="border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <UsersRound className="h-5 w-5" />

            <div>
              <h2 className="text-lg font-semibold">
                Modalidade
              </h2>

              <p className="text-sm text-muted-foreground">
                Informe como a diligência
                será realizada.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-4 rounded-xl border p-5 hover:bg-muted/30">
            <input
              type="radio"
              name="modalidade"
              value="presencial"
              required
              disabled={
                emAlerta
              }
              defaultChecked={
                state.valores
                  ?.modalidade ===
                "presencial"
              }
              className="mt-1 h-4 w-4"
            />

            <div>
              <div className="flex items-center gap-2">
                <UsersRound className="h-5 w-5" />

                <p className="font-semibold">
                  Presencial
                </p>
              </div>

              <p className="mt-2 text-sm text-muted-foreground">
                O profissional deverá
                comparecer fisicamente
                ao local da diligência.
              </p>
            </div>
          </label>

          <label className="flex cursor-pointer items-start gap-4 rounded-xl border p-5 hover:bg-muted/30">
            <input
              type="radio"
              name="modalidade"
              value="virtual"
              required
              disabled={
                emAlerta
              }
              defaultChecked={
                state.valores
                  ?.modalidade ===
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
                O ato será realizado
                remotamente, sem
                deslocamento presencial.
              </p>
            </div>
          </label>
        </div>
      </section>

      {/* ==================================================
          DATA E HORÁRIO
      =================================================== */}

      <section className="rounded-xl border bg-card">
        <div className="border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5" />

            <div>
              <h2 className="text-lg font-semibold">
                Data e horário
              </h2>

              <p className="text-sm text-muted-foreground">
                Toda diligência deve
                possuir data e horário.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="data_diligencia"
              className="text-sm font-medium"
            >
              Data *
            </label>

            <input
              id="data_diligencia"
              name="data_diligencia"
              type="date"
              required
              disabled={
                emAlerta
              }
              defaultValue={
                state.valores
                  ?.data_diligencia ??
                ""
              }
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:bg-muted"
            />
          </div>

          <div>
            <label
              htmlFor="horario"
              className="text-sm font-medium"
            >
              Horário *
            </label>

            <input
              id="horario"
              name="horario"
              type="time"
              required
              disabled={
                emAlerta
              }
              defaultValue={
                state.valores
                  ?.horario ??
                ""
              }
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:bg-muted"
            />
          </div>
        </div>
      </section>

      {/* ==================================================
          LOCAL
      =================================================== */}

      <section className="rounded-xl border bg-card">
        <div className="border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5" />

            <div>
              <h2 className="text-lg font-semibold">
                Local da diligência
              </h2>

              <p className="text-sm text-muted-foreground">
                Informe os dados do
                local ou unidade
                responsável pelo ato.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="vara"
              className="text-sm font-medium"
            >
              Vara / unidade
            </label>

            <input
              id="vara"
              name="vara"
              disabled={
                emAlerta
              }
              defaultValue={
                state.valores
                  ?.vara ?? ""
              }
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:bg-muted"
            />
          </div>

          <div>
            <label
              htmlFor="local"
              className="text-sm font-medium"
            >
              Local
            </label>

            <input
              id="local"
              name="local"
              disabled={
                emAlerta
              }
              defaultValue={
                state.valores
                  ?.local ?? ""
              }
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:bg-muted"
            />
          </div>

          <div>
            <label
              htmlFor="comarca"
              className="text-sm font-medium"
            >
              Comarca / cidade
            </label>

            <input
              id="comarca"
              name="comarca"
              disabled={
                emAlerta
              }
              defaultValue={
                state.valores
                  ?.comarca ?? ""
              }
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:bg-muted"
            />
          </div>

          <div>
            <label
              htmlFor="uf"
              className="text-sm font-medium"
            >
              UF
            </label>

            <input
              id="uf"
              name="uf"
              maxLength={2}
              disabled={
                emAlerta
              }
              defaultValue={
                state.valores
                  ?.uf ?? ""
              }
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm uppercase disabled:cursor-not-allowed disabled:bg-muted"
            />
          </div>
        </div>
      </section>

      {/* ==================================================
          PARTICIPANTES DA DILIGÊNCIA
      =================================================== */}

    <ParticipantesDiligencia
  disabled={emAlerta}
  necessitaPrepostoInicial={
    state.valores?.necessita_preposto ??
    null
  }
 
  testemunhasConfirmadasInicial={
    state.valores?.testemunhas_confirmadas ??
    null
  }
/>

      {/* ==================================================
          TRATAMENTO
      =================================================== */}

      <section className="rounded-xl border bg-card">
        <div className="border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <UserRound className="h-5 w-5" />

            <div>
              <h2 className="text-lg font-semibold">
                Tratamento da diligência
              </h2>

              <p className="text-sm text-muted-foreground">
                Informe o estágio atual
                do cumprimento.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div className="space-y-4">
  <div>
    <p className="text-sm font-medium">
      Contratação confirmada
    </p>

    <p className="mt-1 text-sm text-muted-foreground">
      Informe se houve contratação externa
      ou se ela é desnecessária.
      Sem seleção, a contratação será
      considerada pendente.
    </p>
  </div>

  <div className="flex flex-col gap-3 sm:flex-row">
    <label className="flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 hover:bg-muted/30">
      <input
        type="radio"
        name="contratacao_status"
        value="confirmada"
        defaultChecked={
          state.valores?.contratacao_status ===
          "confirmada"
        }
        disabled={emAlerta}
        onChange={() => {
          setContratacaoStatus(
            "confirmada"
          );
        }}
        className="h-4 w-4"
      />

      <span className="text-sm font-medium">
        Sim
      </span>
    </label>

    <label className="flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 hover:bg-muted/30">
      <input
        type="radio"
        name="contratacao_status"
        value="desnecessaria"
        defaultChecked={
          state.valores?.contratacao_status ===
          "desnecessaria"
        }
        disabled={emAlerta}
        onChange={() => {
          setContratacaoStatus(
            "desnecessaria"
          );

          setContratacaoTipo(
            null
          );
        }}
        className="h-4 w-4"
      />

      <span className="text-sm font-medium">
        Desnecessária
      </span>
    </label>
  </div>

  <button
    type="button"
    disabled={
      emAlerta ||
      contratacaoStatus === null
    }
    onClick={() => {
      setContratacaoStatus(null);
      setContratacaoTipo(null);
    }}
    className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:cursor-not-allowed disabled:opacity-40"
  >
    Limpar seleção
  </button>

  {contratacaoStatus ===
    "confirmada" && (
    <div className="rounded-lg border bg-muted/20 p-4">
      <p className="text-sm font-medium">
        Contratação realizada para
      </p>

      <p className="mt-1 text-sm text-muted-foreground">
        Informe quais profissionais
        foram contratados.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="radio"
            name="contratacao_tipo"
            value="advogado"
            defaultChecked={
              state.valores?.contratacao_tipo ===
              "advogado"
            }
            disabled={emAlerta}
            onChange={() => {
              setContratacaoTipo(
                "advogado"
              );
            }}
            className="h-4 w-4"
          />

          <span className="text-sm">
            Apenas advogado
          </span>
        </label>

<label className="flex cursor-pointer items-center gap-3">
  <input
    type="radio"
    name="contratacao_tipo"
    value="preposto"
    defaultChecked={
      state.valores?.contratacao_tipo ===
      "preposto"
    }
    disabled={emAlerta}
    onChange={() => {
      setContratacaoTipo(
        "preposto"
      );
    }}
    className="h-4 w-4"
  />

  <span className="text-sm">
    Apenas preposto
  </span>
</label>

        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="radio"
            name="contratacao_tipo"
            value="advogado_preposto"
            defaultChecked={
              state.valores?.contratacao_tipo ===
              "advogado_preposto"
            }
            disabled={emAlerta}
            onChange={() => {
              setContratacaoTipo(
                "advogado_preposto"
              );
            }}
            className="h-4 w-4"
          />

          <span className="text-sm">
            Advogado e preposto
          </span>
        </label>
      </div>
    </div>
  )}

{(
  contratacaoTipo === "advogado" ||
  contratacaoTipo === "advogado_preposto"
) && (
  <div className="rounded-lg border bg-muted/20 p-4">
    <div>
      <p className="text-sm font-medium">
        Contratação do advogado
      </p>

      <p className="mt-1 text-sm text-muted-foreground">
        Registre as informações financeiras
        relacionadas à contratação do advogado.
      </p>
    </div>

    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <div>
        <label className="text-sm font-medium">
          Valor da contratação
        </label>

        <div className="relative mt-2">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            R$
          </span>

          <input
            type="text"
            inputMode="decimal"
            name="contratacao_advogado_valor"
            value={valorContratacaoAdvogado}
            disabled={emAlerta}
            onChange={(event) => {
              setValorContratacaoAdvogado(
                event.target.value
              );
            }}
            placeholder="0,00"
            className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-3 text-sm disabled:bg-muted"
          />
        </div>
      </div>

      <div>
  <label className="text-sm font-medium">
    Data combinada para pagamento
  </label>

  <input
    type="date"
    name="contratacao_advogado_pagamento_combinado_em"
    value={
      pagamentoCombinadoAdvogado
    }
    disabled={emAlerta}
    onChange={(event) => {
      setPagamentoCombinadoAdvogado(
        event.target.value
      );
    }}
    className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm disabled:bg-muted"
  />
</div>
    </div>
  </div>
)}

  {contratacaoStatus ===
    "confirmada" && (
    <input
      type="hidden"
      name="contratacao_confirmada"
      value="on"
    />
  )}
</div>

{(
  contratacaoTipo === "preposto" ||
  contratacaoTipo === "advogado_preposto"
) && (
  <div className="rounded-lg border bg-muted/20 p-4">
    <div>
      <p className="text-sm font-medium">
        Contratação do preposto
      </p>

      <p className="mt-1 text-sm text-muted-foreground">
        Registre as informações financeiras
        relacionadas à contratação do preposto.
      </p>
    </div>

    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <div>
        <label className="text-sm font-medium">
          Valor da contratação
        </label>

        <div className="relative mt-2">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            R$
          </span>

          <input
            type="text"
            inputMode="decimal"
            name="contratacao_preposto_valor"
            value={valorContratacaoPreposto}
            disabled={emAlerta}
            onChange={(event) => {
              setValorContratacaoPreposto(
                event.target.value
              );
            }}
            placeholder="0,00"
            className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-3 text-sm disabled:bg-muted"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">
          Data combinada para pagamento
        </label>

        <input
          type="date"
          name="contratacao_preposto_pagamento_combinado_em"
          value={
            pagamentoCombinadoPreposto
          }
          disabled={emAlerta}
          onChange={(event) => {
            setPagamentoCombinadoPreposto(
              event.target.value
            );
          }}
          className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm disabled:bg-muted"
        />
      </div>
    </div>
  </div>
)}

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="orientacoes_encaminhadas"
              disabled={
                emAlerta
              }
              defaultChecked={
                state.valores
                  ?.orientacoes_encaminhadas ??
                false
              }
              className="mt-1 h-4 w-4"
            />

            <div>
              <p className="text-sm font-medium">
                Orientações encaminhadas
              </p>

              <p className="text-sm text-muted-foreground">
                Marque quando as
                orientações necessárias
                já tiverem sido enviadas.
              </p>
            </div>
          </label>
        </div>
      </section>

      {/* ==================================================
          OBSERVAÇÕES
      =================================================== */}

      <section className="rounded-xl border bg-card">
        <div className="border-b px-6 py-5">
          <h2 className="text-lg font-semibold">
            Observações
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Registre informações úteis
            sobre esta diligência.
          </p>
        </div>

        <div className="p-6">
          <textarea
            id="observacoes"
            name="observacoes"
            rows={5}
            disabled={
              emAlerta
            }
            defaultValue={
              state.valores
                ?.observacoes ?? ""
            }
            className="w-full resize-y rounded-lg border bg-background px-3 py-3 text-sm disabled:cursor-not-allowed disabled:bg-muted"
          />
        </div>
      </section>

      {/* ==================================================
          SALVAR

          Durante um alerta esse botão
          desaparece. O usuário precisa
          escolher entre revisar ou
          cadastrar mesmo assim.
      =================================================== */}

      {!emAlerta && (
        <div className="flex justify-end pb-10">
          <button
            type="submit"
            name="intencao"
            value="salvar"
            disabled={
              isPending
            }
            className="inline-flex items-center gap-2 rounded-lg bg-[#0b1f3a] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />

            {isPending
              ? "Verificando..."
              : "Salvar diligência"}
          </button>
        </div>
      )}
    </form>
  );
}