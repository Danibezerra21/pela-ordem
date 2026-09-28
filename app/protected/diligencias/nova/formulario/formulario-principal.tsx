"use client";

import {
  useReducer,
  useRef,
  useState,
  type FormEvent,
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
} from "../actions";

import {
  ConflitosAgendaAlerta,
} from "../conflitos-agenda-alerta";

import {
  RASCUNHO_DILIGENCIA_INICIAL,
} from "./estado-inicial";

import {
  reducerRascunhoDiligencia,
} from "./reducer";

import {
  possuiErros,
  validarRascunhoDiligencia,
} from "./validacoes";

import type {
  ContratacaoStatus,
  ContratacaoTipo,
  ErrosRascunhoDiligencia,
  RascunhoDiligencia,
} from "./tipos";

import {
  SecaoParticipantes,
} from "./secao-participantes";

/* =====================================================
   ESTADO INICIAL DO SERVIDOR
===================================================== */

const ESTADO_SERVIDOR_INICIAL: CadastroState = {
  status: "inicial",
  mensagem: null,
  valores: null,
  diligenciasEncontradas: [],
  conflitosAgenda: [],
};

/* =====================================================
   AUXILIARES
===================================================== */

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

/* =====================================================
   TRANSFORMA RASCUNHO EM FORMDATA

   A Server Action antiga continua podendo
   ser utilizada sem que o <form> seja
   entregue diretamente ao action do React.
===================================================== */

function criarFormData(
  rascunho: RascunhoDiligencia,
  intencao:
    | "salvar"
    | "prosseguir"
    | "revisar"
) {
  const formData =
    new FormData();

  formData.set(
    "intencao",
    intencao
  );

  formData.set(
    "tipo_diligencia",
    rascunho.tipo_diligencia
  );

  formData.set(
    "modalidade",
    rascunho.modalidade
  );

  formData.set(
    "numero_processo",
    rascunho.numero_processo
  );

  formData.set(
    "parte_autora",
    rascunho.parte_autora
  );

  formData.set(
    "parte_re",
    rascunho.parte_re
  );

  formData.set(
    "data_diligencia",
    rascunho.data_diligencia
  );

  formData.set(
    "horario",
    rascunho.horario
  );

  formData.set(
    "vara",
    rascunho.vara
  );

  formData.set(
    "comarca",
    rascunho.comarca
  );

  formData.set(
    "uf",
    rascunho.uf
  );

  formData.set(
    "local",
    rascunho.local
  );

  if (
    rascunho.advogado
  ) {
    formData.set(
      "correspondente_id",
      rascunho.advogado.id
    );
  }

  if (
    rascunho
      .necessita_preposto !==
    null
  ) {
    formData.set(
      "necessita_preposto",
      rascunho
        .necessita_preposto
        ? "true"
        : "false"
    );
  }

  if (
    rascunho.preposto
  ) {
    formData.set(
      "preposto_id",
      rascunho.preposto.id
    );
  }

  if (
    rascunho
      .testemunhas_status
  ) {
    formData.set(
      "testemunhas_status",
      rascunho
        .testemunhas_status
    );

    formData.set(
      "testemunhas_confirmadas",
      rascunho
        .testemunhas_status ===
        "confirmadas"
        ? "true"
        : "false"
    );
  }

  for (
    const testemunha
    of rascunho.testemunhas
  ) {
    formData.append(
      "testemunha_ids",
      testemunha.id
    );
  }

  if (
    rascunho
      .contratacao_status
  ) {
    formData.set(
      "contratacao_status",
      rascunho
        .contratacao_status
    );
  }

  if (
    rascunho
      .contratacao_tipo
  ) {
    formData.set(
      "contratacao_tipo",
      rascunho
        .contratacao_tipo
    );
  }

  if (
    rascunho
      .contratacao_status ===
    "confirmada"
  ) {
    formData.set(
      "contratacao_confirmada",
      "on"
    );
  }

  formData.set(
    "contratacao_advogado_valor",
    rascunho
      .contratacao_advogado_valor
  );

  formData.set(
    "contratacao_advogado_pagamento_combinado_em",
    rascunho
      .contratacao_advogado_pagamento_combinado_em
  );

  formData.set(
    "contratacao_preposto_valor",
    rascunho
      .contratacao_preposto_valor
  );

  formData.set(
    "contratacao_preposto_pagamento_combinado_em",
    rascunho
      .contratacao_preposto_pagamento_combinado_em
  );

  if (
    rascunho
      .orientacoes_encaminhadas
  ) {
    formData.set(
      "orientacoes_encaminhadas",
      "on"
    );
  }

  formData.set(
    "observacoes",
    rascunho.observacoes
  );

  return formData;
}

/* =====================================================
   DILIGÊNCIA ENCONTRADA
===================================================== */

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
    </div>
  );
}

/* =====================================================
   ERRO DE CAMPO
===================================================== */

function ErroCampo({
  mensagem,
}: {
  mensagem?: string;
}) {
  if (!mensagem) {
    return null;
  }

  return (
    <p className="mt-1.5 text-sm text-red-600">
      {mensagem}
    </p>
  );
}

/* =====================================================
   FORMULÁRIO
===================================================== */

export function FormularioPrincipalDiligencia() {
  const [
    rascunho,
    dispatchOriginal,
  ] = useReducer(
    reducerRascunhoDiligencia,
    RASCUNHO_DILIGENCIA_INICIAL
  );

  const [
    erros,
    setErros,
  ] = useState<
    ErrosRascunhoDiligencia
  >({});

  const [
    estadoServidor,
    setEstadoServidor,
  ] = useState<CadastroState>(
    ESTADO_SERVIDOR_INICIAL
  );

  const [
    processando,
    setProcessando,
  ] = useState(false);

  const topoRef =
    useRef<HTMLDivElement>(
      null
    );

  const emAlerta =
    estadoServidor.status ===
    "alerta";

  /*
   * Toda alteração do rascunho limpa
   * mensagens antigas de validação.
   *
   * A ação continua indo para o reducer
   * único.
   */
  const dispatch:
    typeof dispatchOriginal = (
      acao
    ) => {
      dispatchOriginal(acao);

      if (
        Object.keys(erros)
          .length > 0
      ) {
        setErros({});
      }
    };

  function irParaTopo() {
    topoRef.current?.scrollIntoView(
      {
        behavior: "smooth",
        block: "start",
      }
    );
  }

  /* ===================================================
     SALVAR
  =================================================== */

    async function handleSalvar(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const errosAtuais =
      validarRascunhoDiligencia(
        rascunho
      );

    if (
      possuiErros(
        errosAtuais
      )
    ) {
      setErros(
        errosAtuais
      );

      irParaTopo();

      return;
    }

    try {
      setProcessando(true);

      const resultado =
        await analisarCadastroDiligencia(
          ESTADO_SERVIDOR_INICIAL,
          criarFormData(
            rascunho,
            "salvar"
          )
        );

      setEstadoServidor(
        resultado
      );

      if (
        resultado.status ===
          "alerta" ||
        resultado.status ===
          "erro"
      ) {
        irParaTopo();
      }
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Ocorreu um erro inesperado ao cadastrar a diligência.";

      console.error(
        "Erro ao cadastrar diligência:",
        error
      );

      setEstadoServidor({
        status: "erro",
        mensagem,
        valores: null,
        diligenciasEncontradas: [],
        conflitosAgenda: [],
      });

      irParaTopo();
    } finally {
      setProcessando(false);
    }
  }

  /* ===================================================
     VOLTAR E REVISAR
  =================================================== */

  async function handleRevisar() {
    if (!emAlerta) {
      return;
    }

    try {
      setProcessando(true);

      /*
       * Chamamos a Action apenas para
       * preservar o evento de auditoria.
       *
       * O rascunho NÃO é substituído pelo
       * retorno do servidor.
       */
      const resultado =
        await analisarCadastroDiligencia(
          estadoServidor,
          criarFormData(
            rascunho,
            "revisar"
          )
        );

      setEstadoServidor(
        resultado
      );
    } finally {
      setProcessando(false);
    }
  }

  /* ===================================================
     CADASTRAR MESMO ASSIM
  =================================================== */

  async function handleProsseguir() {
    if (!emAlerta) {
      return;
    }

    const errosAtuais =
      validarRascunhoDiligencia(
        rascunho
      );

    if (
      possuiErros(
        errosAtuais
      )
    ) {
      setErros(
        errosAtuais
      );

      return;
    }

    try {
      setProcessando(true);

      const resultado =
        await analisarCadastroDiligencia(
          estadoServidor,
          criarFormData(
            rascunho,
            "prosseguir"
          )
        );

      setEstadoServidor(
        resultado
      );
    } finally {
      setProcessando(false);
    }
  }

  /* ===================================================
     REGRAS VISUAIS DA CONTRATAÇÃO
  =================================================== */

  const contratacaoAdvogado =
    rascunho
      .contratacao_status ===
      "confirmada" &&
    (
      rascunho
        .contratacao_tipo ===
        "advogado" ||
      rascunho
        .contratacao_tipo ===
        "advogado_preposto"
    );

  const contratacaoPreposto =
    rascunho
      .contratacao_status ===
      "confirmada" &&
    (
      rascunho
        .contratacao_tipo ===
        "preposto" ||
      rascunho
        .contratacao_tipo ===
        "advogado_preposto"
    );

  return (
    <form
      onSubmit={handleSalvar}
      className="space-y-6"
      noValidate
    >
      <div
        ref={topoRef}
        className="scroll-mt-8"
      />

      {/* ===============================================
          ALERTA DO SERVIDOR
      ================================================ */}

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
                Foram identificadas situações que
                precisam ser conferidas antes da
                confirmação do cadastro.
              </p>

              <p className="mt-2 text-sm font-medium text-amber-900">
                A nova diligência ainda não foi
                cadastrada.
              </p>

              {estadoServidor.mensagem && (
                <p className="mt-3 rounded-lg border border-amber-200 bg-white p-3 text-sm">
                  {
                    estadoServidor.mensagem
                  }
                </p>
              )}
            </div>
          </div>

          {(estadoServidor
            .conflitosAgenda?.length ??
            0) > 0 && (
            <div className="mt-6">
              <ConflitosAgendaAlerta
                conflitos={
                  estadoServidor
                    .conflitosAgenda ??
                  []
                }
              />
            </div>
          )}

          {estadoServidor
            .diligenciasEncontradas
            .length > 0 && (
            <div className="mt-7">
              <h3 className="font-semibold">
                Diligências já cadastradas para
                este processo
              </h3>

              <div className="mt-4 space-y-3">
                {estadoServidor
                  .diligenciasEncontradas
                  .map(
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
          )}

          <div className="mt-7 flex flex-col gap-3 border-t border-amber-300 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={processando}
              onClick={
                handleRevisar
              }
              className="rounded-lg border border-slate-400 bg-white px-5 py-2.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              Voltar e revisar
            </button>

            <button
              type="button"
              disabled={processando}
              onClick={
                handleProsseguir
              }
              className="rounded-lg bg-[#0b1f3a] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {processando
                ? "Processando..."
                : "Cadastrar mesmo assim"}
            </button>
          </div>
        </section>
      )}

      {/* ===============================================
          ERRO DO SERVIDOR
      ================================================ */}

      {estadoServidor.status ===
        "erro" &&
        estadoServidor.mensagem && (
          <section className="rounded-xl border border-red-300 bg-red-50 p-5 text-red-950">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

              <div>
                <h2 className="font-semibold">
                  Não foi possível continuar
                </h2>

                <p className="mt-1 text-sm">
                  {
                    estadoServidor
                      .mensagem
                  }
                </p>
              </div>
            </div>
          </section>
        )}

      {/* ===============================================
          IDENTIFICAÇÃO
      ================================================ */}

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
            <label
              htmlFor="tipo_diligencia"
              className="text-sm font-medium"
            >
              Tipo da diligência *
            </label>

            <input
              id="tipo_diligencia"
              type="text"
              required
              disabled={emAlerta}
              value={
                rascunho
                  .tipo_diligencia
              }
              onChange={(event) =>
                dispatch({
                  type:
                    "ALTERAR_TEXTO",
                  campo:
                    "tipo_diligencia",
                  valor:
                    event.target
                      .value,
                })
              }
              placeholder="Ex.: Audiência una"
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
            />

            <ErroCampo
              mensagem={
                erros
                  .tipo_diligencia
              }
            />
          </div>

          <div>
            <label
              htmlFor="numero_processo"
              className="text-sm font-medium"
            >
              Número do processo *
            </label>

            <input
              id="numero_processo"
              type="text"
              required
              disabled={emAlerta}
              value={
                rascunho
                  .numero_processo
              }
              onChange={(event) =>
                dispatch({
                  type:
                    "ALTERAR_TEXTO",
                  campo:
                    "numero_processo",
                  valor:
                    event.target
                      .value,
                })
              }
              placeholder="0000000-00.0000.0.00.0000"
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
            />

            <ErroCampo
              mensagem={
                erros
                  .numero_processo
              }
            />
          </div>

          <div>
            <label
              htmlFor="parte_autora"
              className="text-sm font-medium"
            >
              Parte autora *
            </label>

            <input
              id="parte_autora"
              required
              disabled={emAlerta}
              value={
                rascunho.parte_autora
              }
              onChange={(event) =>
                dispatch({
                  type:
                    "ALTERAR_TEXTO",
                  campo:
                    "parte_autora",
                  valor:
                    event.target.value,
                })
              }
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
            />

            <ErroCampo
              mensagem={
                erros.parte_autora
              }
            />
          </div>

          <div>
            <label
              htmlFor="parte_re"
              className="text-sm font-medium"
            >
              Parte ré *
            </label>

            <input
              id="parte_re"
              required
              disabled={emAlerta}
              value={
                rascunho.parte_re
              }
              onChange={(event) =>
                dispatch({
                  type:
                    "ALTERAR_TEXTO",
                  campo: "parte_re",
                  valor:
                    event.target.value,
                })
              }
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
            />

            <ErroCampo
              mensagem={
                erros.parte_re
              }
            />
          </div>
        </div>
      </section>

      {/* ===============================================
          MODALIDADE
      ================================================ */}

      <section className="rounded-xl border bg-card">
        <div className="border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <UsersRound className="h-5 w-5" />

            <div>
              <h2 className="text-lg font-semibold">
                Modalidade
              </h2>

              <p className="text-sm text-muted-foreground">
                Informe como a diligência será
                realizada.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-4 rounded-xl border p-5 hover:bg-muted/30">
            <input
              type="radio"
              required
              disabled={emAlerta}
              checked={
                rascunho.modalidade ===
                "presencial"
              }
              onChange={() =>
                dispatch({
                  type:
                    "ALTERAR_MODALIDADE",
                  valor:
                    "presencial",
                })
              }
              className="mt-1 h-4 w-4"
            />

            <div>
              <p className="font-semibold">
                Presencial
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                O profissional deverá comparecer
                fisicamente ao local da diligência.
              </p>
            </div>
          </label>

          <label className="flex cursor-pointer items-start gap-4 rounded-xl border p-5 hover:bg-muted/30">
            <input
              type="radio"
              required
              disabled={emAlerta}
              checked={
                rascunho.modalidade ===
                "virtual"
              }
              onChange={() =>
                dispatch({
                  type:
                    "ALTERAR_MODALIDADE",
                  valor: "virtual",
                })
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
                O ato será realizado remotamente.
              </p>
            </div>
          </label>

          <div className="sm:col-span-2">
            <ErroCampo
              mensagem={
                erros.modalidade
              }
            />
          </div>
        </div>
      </section>

      {/* ===============================================
          DATA E LOCAL
      ================================================ */}

      <section className="rounded-xl border bg-card">
        <div className="border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5" />

            <div>
              <h2 className="text-lg font-semibold">
                Data e local
              </h2>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-2">
          {(
            [
              [
                "data_diligencia",
                "Data *",
                "date",
              ],
              [
                "horario",
                "Horário *",
                "time",
              ],
              [
                "vara",
                "Vara / unidade *",
                "text",
              ],
              [
                "comarca",
                "Comarca / cidade *",
                "text",
              ],
              [
                "uf",
                "UF *",
                "text",
              ],
              [
                "local",
                "Local",
                "text",
              ],
            ] as const
          ).map(
            ([
              campo,
              titulo,
              tipo,
            ]) => (
              <div key={campo}>
                <label
                  htmlFor={campo}
                  className="text-sm font-medium"
                >
                  {titulo}
                </label>

                <input
                  id={campo}
                  type={tipo}
                  disabled={emAlerta}
                  required={
                    campo !== "local"
                  }
                  maxLength={
                    campo === "uf"
                      ? 2
                      : undefined
                  }
                  value={
                    rascunho[campo]
                  }
                  onChange={(
                    event
                  ) =>
                    dispatch({
                      type:
                        "ALTERAR_TEXTO",
                      campo,
                      valor:
                        event.target
                          .value,
                    })
                  }
                  className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
                />

                <ErroCampo
                  mensagem={
                    erros[campo]
                  }
                />
              </div>
            )
          )}
        </div>
      </section>

      {/* ===============================================
          PARTICIPANTES
      ================================================ */}

      <SecaoParticipantes
        rascunho={rascunho}
        dispatch={dispatch}
        erros={erros}
        disabled={emAlerta}
      />

      {/* ===============================================
          TRATAMENTO
      ================================================ */}

      <section className="rounded-xl border bg-card">
        <div className="border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <UserRound className="h-5 w-5" />

            <div>
              <h2 className="text-lg font-semibold">
                Tratamento da diligência
              </h2>

              <p className="text-sm text-muted-foreground">
                Informe o estágio atual do cumprimento.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-6">
          <div>
            <label
              htmlFor="contratacao_status"
              className="text-sm font-medium"
            >
              Contratação
            </label>

            <p className="mt-1 text-sm text-muted-foreground">
              Sem seleção, ficará registrada como
              pendência.
            </p>

            <select
              id="contratacao_status"
              disabled={emAlerta}
              value={
                rascunho
                  .contratacao_status ??
                ""
              }
              onChange={(event) =>
                dispatch({
                  type:
                    "DEFINIR_CONTRATACAO_STATUS",
                  valor:
                    (
                      event.target
                        .value ||
                      null
                    ) as ContratacaoStatus,
                })
              }
              className="mt-3 w-full rounded-lg border bg-background px-3 py-2.5 text-sm sm:max-w-sm"
            >
              <option value="">
                Selecione...
              </option>

              <option value="confirmada">
                Confirmada
              </option>

              <option value="desnecessaria">
                Desnecessária
              </option>
            </select>
          </div>

          {rascunho
            .contratacao_status ===
            "confirmada" && (
            <div>
              <label
                htmlFor="contratacao_tipo"
                className="text-sm font-medium"
              >
                Profissional contratado *
              </label>

              <select
                id="contratacao_tipo"
                disabled={emAlerta}
                value={
                  rascunho
                    .contratacao_tipo ??
                  ""
                }
                onChange={(event) =>
                  dispatch({
                    type:
                      "DEFINIR_CONTRATACAO_TIPO",
                    valor:
                      (
                        event.target
                          .value ||
                        null
                      ) as ContratacaoTipo,
                  })
                }
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm sm:max-w-sm"
              >
                <option value="">
                  Selecione...
                </option>

                <option value="advogado">
                  Apenas advogado
                </option>

                <option value="preposto">
                  Apenas preposto
                </option>

                <option value="advogado_preposto">
                  Advogado e preposto
                </option>
              </select>

              <ErroCampo
                mensagem={
                  erros
                    .contratacao_tipo
                }
              />
            </div>
          )}

          {contratacaoAdvogado && (
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="font-medium">
                Contratação do advogado
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">
                    Valor da contratação *
                  </label>

                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      R$
                    </span>

                    <input
                      type="text"
                      inputMode="decimal"
                      required
                      disabled={emAlerta}
                      value={
                        rascunho
                          .contratacao_advogado_valor
                      }
                      onChange={(event) =>
                        dispatch({
                          type:
                            "ALTERAR_TEXTO",
                          campo:
                            "contratacao_advogado_valor",
                          valor:
                            event
                              .target
                              .value,
                        })
                      }
                      placeholder="0,00"
                      className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-3 text-sm"
                    />
                  </div>

                  <ErroCampo
                    mensagem={
                      erros
                        .contratacao_advogado_valor
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Data combinada para pagamento *
                  </label>

                  <input
                    type="date"
                    required
                    disabled={emAlerta}
                    value={
                      rascunho
                        .contratacao_advogado_pagamento_combinado_em
                    }
                    onChange={(event) =>
                      dispatch({
                        type:
                          "ALTERAR_TEXTO",
                        campo:
                          "contratacao_advogado_pagamento_combinado_em",
                        valor:
                          event.target
                            .value,
                      })
                    }
                    className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
                  />

                  <ErroCampo
                    mensagem={
                      erros
                        .contratacao_advogado_pagamento_combinado_em
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {contratacaoPreposto && (
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="font-medium">
                Contratação do preposto
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">
                    Valor da contratação *
                  </label>

                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      R$
                    </span>

                    <input
                      type="text"
                      inputMode="decimal"
                      required
                      disabled={emAlerta}
                      value={
                        rascunho
                          .contratacao_preposto_valor
                      }
                      onChange={(event) =>
                        dispatch({
                          type:
                            "ALTERAR_TEXTO",
                          campo:
                            "contratacao_preposto_valor",
                          valor:
                            event.target
                              .value,
                        })
                      }
                      placeholder="0,00"
                      className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-3 text-sm"
                    />
                  </div>

                  <ErroCampo
                    mensagem={
                      erros
                        .contratacao_preposto_valor
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Data combinada para pagamento *
                  </label>

                  <input
                    type="date"
                    required
                    disabled={emAlerta}
                    value={
                      rascunho
                        .contratacao_preposto_pagamento_combinado_em
                    }
                    onChange={(event) =>
                      dispatch({
                        type:
                          "ALTERAR_TEXTO",
                        campo:
                          "contratacao_preposto_pagamento_combinado_em",
                        valor:
                          event.target
                            .value,
                      })
                    }
                    className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
                  />

                  <ErroCampo
                    mensagem={
                      erros
                        .contratacao_preposto_pagamento_combinado_em
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <label className="flex items-start gap-3 border-t pt-6">
            <input
              type="checkbox"
              disabled={emAlerta}
              checked={
                rascunho
                  .orientacoes_encaminhadas
              }
              onChange={(event) =>
                dispatch({
                  type:
                    "DEFINIR_ORIENTACOES_ENCAMINHADAS",
                  valor:
                    event.target
                      .checked,
                })
              }
              className="mt-1 h-4 w-4"
            />

            <div>
              <p className="text-sm font-medium">
                Orientações encaminhadas
              </p>

              <p className="text-sm text-muted-foreground">
                Marque quando as orientações necessárias
                já tiverem sido enviadas.
              </p>
            </div>
          </label>
        </div>
      </section>

      {/* ===============================================
          OBSERVAÇÕES
      ================================================ */}

      <section className="rounded-xl border bg-card">
        <div className="border-b px-6 py-5">
          <h2 className="text-lg font-semibold">
            Observações
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Registre informações úteis, inclusive
            orientações relativas a pagamento quando
            necessário.
          </p>
        </div>

        <div className="p-6">
          <textarea
            rows={5}
            disabled={emAlerta}
            value={
              rascunho.observacoes
            }
            onChange={(event) =>
              dispatch({
                type:
                  "ALTERAR_TEXTO",
                campo:
                  "observacoes",
                valor:
                  event.target.value,
              })
            }
            className="w-full resize-y rounded-lg border bg-background px-3 py-3 text-sm"
          />
        </div>
      </section>

      {/* ===============================================
          SALVAR
      ================================================ */}

      {!emAlerta && (
        <div className="flex justify-end pb-10">
          <button
            type="submit"
            disabled={processando}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0b1f3a] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />

            {processando
              ? "Verificando..."
              : "Salvar diligência"}
          </button>
        </div>
      )}
    </form>
  );
}