"use client";

import {
  useState,
  type Dispatch,
} from "react";

import {
  CheckCircle2,
  LoaderCircle,
  Search,
  UserPlus,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import {
  buscarAdvogado,
  buscarPreposto,
  buscarTestemunha,
  cadastrarAdvogado,
  cadastrarPreposto,
  cadastrarTestemunha,
} from "../participantes-actions";

import type {
  RascunhoDiligencia,
  ErrosRascunhoDiligencia,
} from "./tipos";

import type {
  AcaoRascunhoDiligencia,
} from "./reducer";

/* =====================================================
   PROPS
===================================================== */

type Props = {
  rascunho: RascunhoDiligencia;

  dispatch: Dispatch<
    AcaoRascunhoDiligencia
  >;

  erros?:
    ErrosRascunhoDiligencia;

  disabled?: boolean;
};

/* =====================================================
   AUXILIARES
===================================================== */

function somenteNumeros(
  valor: string
) {
  return valor.replace(
    /\D/g,
    ""
  );
}

function formatarCPF(
  valor: string
) {
  const cpf =
    somenteNumeros(valor);

  if (
    cpf.length !== 11
  ) {
    return valor;
  }

  return (
    `${cpf.slice(0, 3)}.` +
    `${cpf.slice(3, 6)}.` +
    `${cpf.slice(6, 9)}-` +
    `${cpf.slice(9, 11)}`
  );
}

/* =====================================================
   COMPONENTE
===================================================== */

export function SecaoParticipantes({
  rascunho,
  dispatch,
  erros = {},
  disabled = false,
}: Props) {
  /* ===================================================
     ADVOGADO — ESTADO APENAS DA BUSCA
  =================================================== */

  const [
    oabNumero,
    setOabNumero,
  ] = useState("");

  const [
    oabUf,
    setOabUf,
  ] = useState("");

  const [
    nomeNovoAdvogado,
    setNomeNovoAdvogado,
  ] = useState("");

  const [
    advogadoNaoEncontrado,
    setAdvogadoNaoEncontrado,
  ] = useState(false);

  const [
    mensagemAdvogado,
    setMensagemAdvogado,
  ] = useState("");

  const [
    erroAdvogado,
    setErroAdvogado,
  ] = useState("");

  const [
    carregandoAdvogado,
    setCarregandoAdvogado,
  ] = useState(false);

  /* ===================================================
     PREPOSTO — ESTADO APENAS DA BUSCA
  =================================================== */

  const [
    cpfPreposto,
    setCpfPreposto,
  ] = useState("");

  const [
    nomeNovoPreposto,
    setNomeNovoPreposto,
  ] = useState("");

  const [
    prepostoNaoEncontrado,
    setPrepostoNaoEncontrado,
  ] = useState(false);

  const [
    mensagemPreposto,
    setMensagemPreposto,
  ] = useState("");

  const [
    erroPreposto,
    setErroPreposto,
  ] = useState("");

  const [
    carregandoPreposto,
    setCarregandoPreposto,
  ] = useState(false);

  /* ===================================================
     TESTEMUNHA — ESTADO APENAS DA BUSCA
  =================================================== */

  const [
    cpfTestemunha,
    setCpfTestemunha,
  ] = useState("");

  const [
    nomeNovaTestemunha,
    setNomeNovaTestemunha,
  ] = useState("");

  const [
    testemunhaNaoEncontrada,
    setTestemunhaNaoEncontrada,
  ] = useState(false);

  const [
    mensagemTestemunha,
    setMensagemTestemunha,
  ] = useState("");

  const [
    erroTestemunha,
    setErroTestemunha,
  ] = useState("");

  const [
    carregandoTestemunha,
    setCarregandoTestemunha,
  ] = useState(false);

  /* ===================================================
     ADVOGADO
  =================================================== */

  async function handleBuscarAdvogado() {
    setErroAdvogado("");
    setMensagemAdvogado("");
    setAdvogadoNaoEncontrado(
      false
    );

    const numero =
      somenteNumeros(
        oabNumero
      );

    const uf =
      oabUf
        .trim()
        .toUpperCase();

    if (
      !numero ||
      uf.length !== 2
    ) {
      setErroAdvogado(
        "Informe o Número da OAB e a UF."
      );

      return;
    }

    try {
      setCarregandoAdvogado(
        true
      );

      const resultado =
        await buscarAdvogado(
          numero,
          uf
        );

      if (
        resultado.encontrado &&
        resultado.participante
      ) {
        dispatch({
          type: "DEFINIR_ADVOGADO",
          valor:
            resultado.participante,
        });

        setMensagemAdvogado(
          resultado.mensagem
        );

        return;
      }

      setAdvogadoNaoEncontrado(
        true
      );

      setMensagemAdvogado(
        resultado.mensagem
      );
    } catch (error) {
      setErroAdvogado(
        error instanceof Error
          ? error.message
          : "Não foi possível buscar o advogado."
      );
    } finally {
      setCarregandoAdvogado(
        false
      );
    }
  }

  async function handleCadastrarAdvogado() {
    setErroAdvogado("");
    setMensagemAdvogado("");

    if (
      !nomeNovoAdvogado.trim()
    ) {
      setErroAdvogado(
        "Informe o nome do advogado."
      );

      return;
    }

    try {
      setCarregandoAdvogado(
        true
      );

      const resultado =
        await cadastrarAdvogado(
          nomeNovoAdvogado,
          somenteNumeros(
            oabNumero
          ),
          oabUf
            .trim()
            .toUpperCase()
        );

      if (
        resultado.participante
      ) {
        dispatch({
          type: "DEFINIR_ADVOGADO",
          valor:
            resultado.participante,
        });

        setAdvogadoNaoEncontrado(
          false
        );

        setNomeNovoAdvogado(
          ""
        );

        setMensagemAdvogado(
          resultado.mensagem
        );
      }
    } catch (error) {
      setErroAdvogado(
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar o advogado."
      );
    } finally {
      setCarregandoAdvogado(
        false
      );
    }
  }

  function removerAdvogado() {
    dispatch({
      type: "DEFINIR_ADVOGADO",
      valor: null,
    });

    setOabNumero("");
    setOabUf("");
    setNomeNovoAdvogado("");
    setAdvogadoNaoEncontrado(
      false
    );
    setMensagemAdvogado("");
    setErroAdvogado("");
  }

  /* ===================================================
     PREPOSTO
  =================================================== */

  async function handleBuscarPreposto() {
    setErroPreposto("");
    setMensagemPreposto("");
    setPrepostoNaoEncontrado(
      false
    );

    const cpf =
      somenteNumeros(
        cpfPreposto
      );

    if (
      cpf.length !== 11
    ) {
      setErroPreposto(
        "Informe um CPF com 11 dígitos."
      );

      return;
    }

    try {
      setCarregandoPreposto(
        true
      );

      const resultado =
        await buscarPreposto(
          cpf
        );

      if (
        resultado.encontrado &&
        resultado.participante
      ) {
        dispatch({
          type:
            "DEFINIR_PREPOSTO",
          valor:
            resultado.participante,
        });

        setMensagemPreposto(
          resultado.mensagem
        );

        return;
      }

      setPrepostoNaoEncontrado(
        true
      );

      setMensagemPreposto(
        resultado.mensagem
      );
    } catch (error) {
      setErroPreposto(
        error instanceof Error
          ? error.message
          : "Não foi possível buscar o preposto."
      );
    } finally {
      setCarregandoPreposto(
        false
      );
    }
  }

  async function handleCadastrarPreposto() {
    setErroPreposto("");
    setMensagemPreposto("");

    if (
      !nomeNovoPreposto.trim()
    ) {
      setErroPreposto(
        "Informe o nome do preposto."
      );

      return;
    }

    try {
      setCarregandoPreposto(
        true
      );

      const resultado =
        await cadastrarPreposto(
          nomeNovoPreposto,
          somenteNumeros(
            cpfPreposto
          )
        );

      if (
        resultado.participante
      ) {
        dispatch({
          type:
            "DEFINIR_PREPOSTO",
          valor:
            resultado.participante,
        });

        setPrepostoNaoEncontrado(
          false
        );

        setNomeNovoPreposto(
          ""
        );

        setMensagemPreposto(
          resultado.mensagem
        );
      }
    } catch (error) {
      setErroPreposto(
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar o preposto."
      );
    } finally {
      setCarregandoPreposto(
        false
      );
    }
  }

  function removerPreposto() {
    dispatch({
      type: "DEFINIR_PREPOSTO",
      valor: null,
    });

    setCpfPreposto("");
    setNomeNovoPreposto("");
    setPrepostoNaoEncontrado(
      false
    );
    setMensagemPreposto("");
    setErroPreposto("");
  }

  /* ===================================================
     TESTEMUNHAS
  =================================================== */

  async function handleBuscarTestemunha() {
    setErroTestemunha("");
    setMensagemTestemunha("");
    setTestemunhaNaoEncontrada(
      false
    );

    const cpf =
      somenteNumeros(
        cpfTestemunha
      );

    if (
      cpf.length !== 11
    ) {
      setErroTestemunha(
        "Informe um CPF com 11 dígitos."
      );

      return;
    }

    try {
      setCarregandoTestemunha(
        true
      );

      const resultado =
        await buscarTestemunha(
          cpf
        );

      if (
        resultado.encontrado &&
        resultado.participante
      ) {
        const jaAdicionada =
          rascunho.testemunhas.some(
            (testemunha) =>
              testemunha.id ===
              resultado.participante
                ?.id
          );

        if (jaAdicionada) {
          setMensagemTestemunha(
            "Esta testemunha já está vinculada à diligência."
          );

          return;
        }

        dispatch({
          type:
            "ADICIONAR_TESTEMUNHA",
          valor:
            resultado.participante,
        });

        setCpfTestemunha("");

        setMensagemTestemunha(
          "Testemunha localizada e adicionada à diligência."
        );

        return;
      }

      setTestemunhaNaoEncontrada(
        true
      );

      setMensagemTestemunha(
        resultado.mensagem
      );
    } catch (error) {
      setErroTestemunha(
        error instanceof Error
          ? error.message
          : "Não foi possível buscar a testemunha."
      );
    } finally {
      setCarregandoTestemunha(
        false
      );
    }
  }

  async function handleCadastrarTestemunha() {
    setErroTestemunha("");
    setMensagemTestemunha("");

    if (
      !nomeNovaTestemunha.trim()
    ) {
      setErroTestemunha(
        "Informe o nome da testemunha."
      );

      return;
    }

    try {
      setCarregandoTestemunha(
        true
      );

      const resultado =
        await cadastrarTestemunha(
          nomeNovaTestemunha,
          somenteNumeros(
            cpfTestemunha
          )
        );

      if (
        resultado.participante
      ) {
        dispatch({
          type:
            "ADICIONAR_TESTEMUNHA",
          valor:
            resultado.participante,
        });

        setCpfTestemunha("");
        setNomeNovaTestemunha("");

        setTestemunhaNaoEncontrada(
          false
        );

        setMensagemTestemunha(
          resultado.mensagem
        );
      }
    } catch (error) {
      setErroTestemunha(
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar a testemunha."
      );
    } finally {
      setCarregandoTestemunha(
        false
      );
    }
  }

  /* ===================================================
     RENDER
  =================================================== */

  return (
    <section className="rounded-xl border bg-card">
      <div className="border-b px-6 py-5">
        <div className="flex items-center gap-3">
          <UsersRound className="h-5 w-5" />

          <div>
            <h2 className="text-lg font-semibold">
              Participantes da diligência
            </h2>

            <p className="text-sm text-muted-foreground">
              Designe advogado, preposto e
              testemunhas quando aplicável.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8 p-6">
        {/* =============================================
            ADVOGADO
        ============================================== */}

        <div>
          <div>
            <p className="text-sm font-medium">
              Advogado designado
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Localize o advogado pelo Número da OAB.
            </p>
          </div>

          {rascunho.advogado ? (
            <div className="mt-4 flex items-start justify-between gap-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />

                <div>
                  <p className="font-semibold">
                    {
                      rascunho
                        .advogado
                        .nome
                    }
                  </p>

                  <p className="mt-1 text-sm text-emerald-900">
                    OAB/
                    {
                      rascunho
                        .advogado
                        .oab_uf
                    }{" "}
                    {
                      rascunho
                        .advogado
                        .oab_numero
                    }
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={disabled}
                onClick={
                  removerAdvogado
                }
                className="rounded-md p-1 text-muted-foreground hover:bg-white hover:text-foreground disabled:opacity-50"
                aria-label="Remover advogado"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="mt-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_100px_auto]">
                <input
                  type="text"
                  value={oabNumero}
                  disabled={disabled}
                  onChange={(event) => {
                    setOabNumero(
                      somenteNumeros(
                        event.target
                          .value
                      )
                    );

                    setAdvogadoNaoEncontrado(
                      false
                    );
                  }}
                  placeholder="Número da OAB"
                  className="rounded-lg border bg-background px-3 py-2.5 text-sm disabled:bg-muted"
                />

                <input
                  type="text"
                  value={oabUf}
                  maxLength={2}
                  disabled={disabled}
                  onChange={(event) => {
                    setOabUf(
                      event.target.value
                        .toUpperCase()
                        .slice(0, 2)
                    );

                    setAdvogadoNaoEncontrado(
                      false
                    );
                  }}
                  placeholder="UF"
                  className="rounded-lg border bg-background px-3 py-2.5 text-sm uppercase disabled:bg-muted"
                />

                <button
                  type="button"
                  disabled={
                    disabled ||
                    carregandoAdvogado
                  }
                  onClick={
                    handleBuscarAdvogado
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted/40 disabled:opacity-50"
                >
                  {carregandoAdvogado ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}

                  Buscar
                </button>
              </div>

              {advogadoNaoEncontrado && (
                <div className="mt-4 rounded-lg border bg-muted/20 p-4">
                  <p className="text-sm font-medium">
                    Advogado não localizado
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Informe o nome para cadastrá-lo
                    com a OAB pesquisada.
                  </p>

                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <input
                      type="text"
                      value={
                        nomeNovoAdvogado
                      }
                      disabled={disabled}
                      onChange={(
                        event
                      ) =>
                        setNomeNovoAdvogado(
                          event.target
                            .value
                        )
                      }
                      placeholder="Nome completo"
                      className="flex-1 rounded-lg border bg-background px-3 py-2.5 text-sm"
                    />

                    <button
                      type="button"
                      disabled={
                        disabled ||
                        carregandoAdvogado
                      }
                      onClick={
                        handleCadastrarAdvogado
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0b1f3a] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                    >
                      <UserPlus className="h-4 w-4" />
                      Cadastrar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {(erroAdvogado ||
            erros.advogado) && (
            <p className="mt-2 text-sm text-red-600">
              {erroAdvogado ||
                erros.advogado}
            </p>
          )}

          {mensagemAdvogado &&
            !erroAdvogado && (
              <p className="mt-2 text-sm text-muted-foreground">
                {
                  mensagemAdvogado
                }
              </p>
            )}
        </div>

        {/* =============================================
            PREPOSTO
        ============================================== */}

        <div className="border-t pt-8">
          <label
            htmlFor="necessita_preposto"
            className="text-sm font-medium"
          >
            Será necessário preposto?
          </label>

          <p className="mt-1 text-sm text-muted-foreground">
            Sem seleção, esta informação ficará
            registrada como pendência.
          </p>

          <select
            id="necessita_preposto"
            value={
              rascunho
                .necessita_preposto ===
              null
                ? ""
                : rascunho
                      .necessita_preposto
                  ? "true"
                  : "false"
            }
            disabled={disabled}
            onChange={(event) => {
              const valor =
                event.target.value;

              dispatch({
                type:
                  "DEFINIR_NECESSIDADE_PREPOSTO",
                valor:
                  valor === ""
                    ? null
                    : valor ===
                        "true",
              });

              if (
                valor !== "true"
              ) {
                setCpfPreposto("");
                setNomeNovoPreposto(
                  ""
                );
                setPrepostoNaoEncontrado(
                  false
                );
                setMensagemPreposto(
                  ""
                );
                setErroPreposto("");
              }
            }}
            className="mt-3 w-full rounded-lg border bg-background px-3 py-2.5 text-sm sm:max-w-sm"
          >
            <option value="">
              Selecione...
            </option>

            <option value="true">
              Sim
            </option>

            <option value="false">
              Não
            </option>
          </select>

          {rascunho
            .necessita_preposto ===
            true && (
            <div className="mt-5">
              {rascunho.preposto ? (
                <div className="flex items-start justify-between gap-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />

                    <div>
                      <p className="font-semibold">
                        {
                          rascunho
                            .preposto
                            .nome
                        }
                      </p>

                      <p className="mt-1 text-sm text-emerald-900">
                        CPF{" "}
                        {formatarCPF(
                          rascunho
                            .preposto
                            .cpf
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={disabled}
                    onClick={
                      removerPreposto
                    }
                    className="rounded-md p-1 text-muted-foreground hover:bg-white hover:text-foreground disabled:opacity-50"
                    aria-label="Remover preposto"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cpfPreposto}
                      disabled={disabled}
                      onChange={(
                        event
                      ) => {
                        setCpfPreposto(
                          somenteNumeros(
                            event
                              .target
                              .value
                          ).slice(
                            0,
                            11
                          )
                        );

                        setPrepostoNaoEncontrado(
                          false
                        );
                      }}
                      placeholder="CPF do preposto"
                      className="flex-1 rounded-lg border bg-background px-3 py-2.5 text-sm"
                    />

                    <button
                      type="button"
                      disabled={
                        disabled ||
                        carregandoPreposto
                      }
                      onClick={
                        handleBuscarPreposto
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted/40 disabled:opacity-50"
                    >
                      {carregandoPreposto ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}

                      Buscar
                    </button>
                  </div>

                  {prepostoNaoEncontrado && (
                    <div className="mt-4 rounded-lg border bg-muted/20 p-4">
                      <p className="text-sm font-medium">
                        Preposto não localizado
                      </p>

                      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                        <input
                          type="text"
                          value={
                            nomeNovoPreposto
                          }
                          disabled={
                            disabled
                          }
                          onChange={(
                            event
                          ) =>
                            setNomeNovoPreposto(
                              event
                                .target
                                .value
                            )
                          }
                          placeholder="Nome completo"
                          className="flex-1 rounded-lg border bg-background px-3 py-2.5 text-sm"
                        />

                        <button
                          type="button"
                          disabled={
                            disabled ||
                            carregandoPreposto
                          }
                          onClick={
                            handleCadastrarPreposto
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0b1f3a] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                        >
                          <UserPlus className="h-4 w-4" />
                          Cadastrar
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {(erroPreposto ||
                erros.preposto) && (
                <p className="mt-2 text-sm text-red-600">
                  {erroPreposto ||
                    erros.preposto}
                </p>
              )}

              {mensagemPreposto &&
                !erroPreposto && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {
                      mensagemPreposto
                    }
                  </p>
                )}
            </div>
          )}
        </div>

        {/* =============================================
            TESTEMUNHAS
        ============================================== */}

        <div className="border-t pt-8">
          <label
            htmlFor="testemunhas_status"
            className="text-sm font-medium"
          >
            Testemunhas
          </label>

          <p className="mt-1 text-sm text-muted-foreground">
            Sem seleção, esta informação ficará
            registrada como pendência.
          </p>

          <select
            id="testemunhas_status"
            value={
              rascunho
                .testemunhas_status ??
              ""
            }
            disabled={disabled}
            onChange={(event) => {
              const valor =
                event.target.value;

              dispatch({
                type:
                  "DEFINIR_TESTEMUNHAS_STATUS",
                valor:
                  valor ===
                    "confirmadas" ||
                  valor ===
                    "desnecessarias"
                    ? valor
                    : null,
              });

              if (
                valor !==
                "confirmadas"
              ) {
                setCpfTestemunha(
                  ""
                );
                setNomeNovaTestemunha(
                  ""
                );
                setTestemunhaNaoEncontrada(
                  false
                );
                setMensagemTestemunha(
                  ""
                );
                setErroTestemunha(
                  ""
                );
              }
            }}
            className="mt-3 w-full rounded-lg border bg-background px-3 py-2.5 text-sm sm:max-w-sm"
          >
            <option value="">
              Selecione...
            </option>

            <option value="confirmadas">
              Confirmadas
            </option>

            <option value="desnecessarias">
              Desnecessárias
            </option>
          </select>

          {rascunho
            .testemunhas_status ===
            "confirmadas" && (
            <div className="mt-5">
              {rascunho.testemunhas
                .length > 0 && (
                <div className="mb-5 space-y-3">
                  <p className="text-sm font-medium">
                    Testemunhas vinculadas
                  </p>

                  {rascunho.testemunhas.map(
                    (testemunha) => (
                      <div
                        key={
                          testemunha.id
                        }
                        className="flex items-start justify-between gap-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <UserRound className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />

                          <div>
                            <p className="font-semibold">
                              {
                                testemunha.nome
                              }
                            </p>

                            <p className="mt-1 text-sm text-emerald-900">
                              CPF{" "}
                              {formatarCPF(
                                testemunha.cpf
                              )}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={
                            disabled
                          }
                          onClick={() =>
                            dispatch({
                              type:
                                "REMOVER_TESTEMUNHA",
                              id:
                                testemunha.id,
                            })
                          }
                          className="rounded-md p-1 text-muted-foreground hover:bg-white hover:text-foreground disabled:opacity-50"
                          aria-label="Remover testemunha"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  inputMode="numeric"
                  value={
                    cpfTestemunha
                  }
                  disabled={disabled}
                  onChange={(
                    event
                  ) => {
                    setCpfTestemunha(
                      somenteNumeros(
                        event
                          .target
                          .value
                      ).slice(
                        0,
                        11
                      )
                    );

                    setTestemunhaNaoEncontrada(
                      false
                    );
                  }}
                  placeholder="CPF da testemunha"
                  className="flex-1 rounded-lg border bg-background px-3 py-2.5 text-sm"
                />

                <button
                  type="button"
                  disabled={
                    disabled ||
                    carregandoTestemunha
                  }
                  onClick={
                    handleBuscarTestemunha
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted/40 disabled:opacity-50"
                >
                  {carregandoTestemunha ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}

                  Buscar
                </button>
              </div>

              {testemunhaNaoEncontrada && (
                <div className="mt-4 rounded-lg border bg-muted/20 p-4">
                  <p className="text-sm font-medium">
                    Testemunha não localizada
                  </p>

                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <input
                      type="text"
                      value={
                        nomeNovaTestemunha
                      }
                      disabled={disabled}
                      onChange={(
                        event
                      ) =>
                        setNomeNovaTestemunha(
                          event.target
                            .value
                        )
                      }
                      placeholder="Nome completo"
                      className="flex-1 rounded-lg border bg-background px-3 py-2.5 text-sm"
                    />

                    <button
                      type="button"
                      disabled={
                        disabled ||
                        carregandoTestemunha
                      }
                      onClick={
                        handleCadastrarTestemunha
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0b1f3a] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                    >
                      <UserPlus className="h-4 w-4" />
                      Cadastrar
                    </button>
                  </div>
                </div>
              )}

              {(erroTestemunha ||
                erros.testemunhas) && (
                <p className="mt-2 text-sm text-red-600">
                  {erroTestemunha ||
                    erros.testemunhas}
                </p>
              )}

              {mensagemTestemunha &&
                !erroTestemunha && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {
                      mensagemTestemunha
                    }
                  </p>
                )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}