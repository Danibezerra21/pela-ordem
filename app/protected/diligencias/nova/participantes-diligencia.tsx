"use client";

import {
  useState,
} from "react";

import {
  CheckCircle2,
  LoaderCircle,
  RotateCcw,
  Search,
  Scale,
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
  reativarAdvogado,
  reativarPreposto,
  type AdvogadoParticipante,
  type PrepostoParticipante,
  type TestemunhaParticipante,
} from "./participantes-actions";

type Props = {
  disabled?: boolean;

  advogadoInicial?:
    AdvogadoParticipante |
    null;

  necessitaPrepostoInicial?:
    boolean |
    null;

  prepostoInicial?:
    PrepostoParticipante |
    null;

  testemunhasConfirmadasInicial?:
    boolean |
    null;

  testemunhasIniciais?:
    TestemunhaParticipante[];
};

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
    somenteNumeros(
      valor
    );

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

export function ParticipantesDiligencia({
  disabled = false,

  advogadoInicial = null,

  necessitaPrepostoInicial = null,

  prepostoInicial = null,

  testemunhasConfirmadasInicial = null,

  testemunhasIniciais = [],
}: Props) {
  /* =====================================================
     ADVOGADO
  ===================================================== */

  const [
    oabNumero,
    setOabNumero,
  ] =
    useState(
      advogadoInicial
        ?.oab_numero ??
      ""
    );

  const [
    oabUf,
    setOabUf,
  ] =
    useState(
      advogadoInicial
        ?.oab_uf ??
      ""
    );

  const [
    advogado,
    setAdvogado,
  ] =
    useState<
      AdvogadoParticipante |
      null
    >(
      advogadoInicial
    );

  const [
    advogadoNaoEncontrado,
    setAdvogadoNaoEncontrado,
  ] =
    useState(
      false
    );

  const [
    advogadoDesativado,
    setAdvogadoDesativado,
  ] =
    useState<
      AdvogadoParticipante |
      null
    >(
      null
    );

  const [
    nomeNovoAdvogado,
    setNomeNovoAdvogado,
  ] =
    useState(
      ""
    );

  const [
    mensagemAdvogado,
    setMensagemAdvogado,
  ] =
    useState(
      ""
    );

  const [
    erroAdvogado,
    setErroAdvogado,
  ] =
    useState(
      ""
    );

  const [
    carregandoAdvogado,
    setCarregandoAdvogado,
  ] =
    useState(
      false
    );

  async function handleBuscarAdvogado() {
    setErroAdvogado(
      ""
    );

    setMensagemAdvogado(
      ""
    );

    setAdvogado(
      null
    );

    setAdvogadoNaoEncontrado(
      false
    );

    setAdvogadoDesativado(
      null
    );

    if (
      !somenteNumeros(
        oabNumero
      ) ||
      oabUf
        .trim()
        .length !==
        2
    ) {
      setErroAdvogado(
        "Informe o número da OAB e a UF."
      );

      return;
    }

    try {
      setCarregandoAdvogado(
        true
      );

      const resultado =
        await buscarAdvogado(
          oabNumero,
          oabUf
        );

      if (
        resultado.status ===
          "ativo" &&
        resultado.participante
      ) {
        setAdvogado(
          resultado
            .participante
        );

        setMensagemAdvogado(
          resultado
            .mensagem
        );

        return;
      }

      if (
        resultado.status ===
          "desativado" &&
        resultado.participante
      ) {
        setAdvogadoDesativado(
          resultado
            .participante
        );

        setAdvogadoNaoEncontrado(
          false
        );

        setMensagemAdvogado(
          ""
        );

        return;
      }

      setAdvogadoDesativado(
        null
      );

      setAdvogadoNaoEncontrado(
        true
      );

      setMensagemAdvogado(
        resultado
          .mensagem
      );
    } catch (
      error
    ) {
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

  async function handleReativarAdvogado() {
    if (
      !advogadoDesativado
    ) {
      return;
    }

    setErroAdvogado(
      ""
    );

    setMensagemAdvogado(
      ""
    );

    try {
      setCarregandoAdvogado(
        true
      );

      const resultado =
        await reativarAdvogado(
          advogadoDesativado
            .id
        );

      setAdvogado(
        resultado
          .participante
      );

      setAdvogadoDesativado(
        null
      );

      setAdvogadoNaoEncontrado(
        false
      );

      setMensagemAdvogado(
        resultado
          .mensagem
      );
    } catch (
      error
    ) {
      setErroAdvogado(
        error instanceof Error
          ? error.message
          : "Não foi possível reativar o advogado."
      );
    } finally {
      setCarregandoAdvogado(
        false
      );
    }
  }

  async function handleCadastrarAdvogado() {
    setErroAdvogado(
      ""
    );

    setMensagemAdvogado(
      ""
    );

    try {
      setCarregandoAdvogado(
        true
      );

      const resultado =
        await cadastrarAdvogado(
          nomeNovoAdvogado,
          oabNumero,
          oabUf
        );

      setAdvogado(
        resultado
          .participante
      );

      setAdvogadoNaoEncontrado(
        false
      );

      setAdvogadoDesativado(
        null
      );

      setMensagemAdvogado(
        resultado
          .mensagem
      );
    } catch (
      error
    ) {
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

  function limparAdvogado() {
    setAdvogado(
      null
    );

    setOabNumero(
      ""
    );

    setOabUf(
      ""
    );

    setNomeNovoAdvogado(
      ""
    );

    setAdvogadoNaoEncontrado(
      false
    );

    setAdvogadoDesativado(
      null
    );

    setMensagemAdvogado(
      ""
    );

    setErroAdvogado(
      ""
    );
  }

  /* =====================================================
     PREPOSTO
  ===================================================== */

  const [
    necessitaPreposto,
    setNecessitaPreposto,
  ] =
    useState<
      "" |
      "true" |
      "false"
    >(
      necessitaPrepostoInicial ===
        true
        ? "true"
        : necessitaPrepostoInicial ===
            false
          ? "false"
          : ""
    );

  const [
    cpfPreposto,
    setCpfPreposto,
  ] =
    useState(
      prepostoInicial
        ?.cpf ??
      ""
    );

  const [
    preposto,
    setPreposto,
  ] =
    useState<
      PrepostoParticipante |
      null
    >(
      prepostoInicial
    );

  const [
    prepostoNaoEncontrado,
    setPrepostoNaoEncontrado,
  ] =
    useState(
      false
    );

  const [
    prepostoDesativado,
    setPrepostoDesativado,
  ] =
    useState<
      PrepostoParticipante |
      null
    >(
      null
    );

  const [
    nomeNovoPreposto,
    setNomeNovoPreposto,
  ] =
    useState(
      ""
    );

  const [
    mensagemPreposto,
    setMensagemPreposto,
  ] =
    useState(
      ""
    );

  const [
    erroPreposto,
    setErroPreposto,
  ] =
    useState(
      ""
    );

  const [
    carregandoPreposto,
    setCarregandoPreposto,
  ] =
    useState(
      false
    );

  function alterarNecessidadePreposto(
    valor:
      | "true"
      | "false"
  ) {
    setNecessitaPreposto(
      valor
    );

    if (
      valor ===
      "false"
    ) {
      setPreposto(
        null
      );

      setCpfPreposto(
        ""
      );

      setNomeNovoPreposto(
        ""
      );

      setPrepostoNaoEncontrado(
        false
      );

      setPrepostoDesativado(
        null
      );

      setMensagemPreposto(
        ""
      );

      setErroPreposto(
        ""
      );
    }
  }

  async function handleBuscarPreposto() {
    setErroPreposto(
      ""
    );

    setMensagemPreposto(
      ""
    );

    setPreposto(
      null
    );

    setPrepostoNaoEncontrado(
      false
    );

    setPrepostoDesativado(
      null
    );

    try {
      setCarregandoPreposto(
        true
      );

      const resultado =
        await buscarPreposto(
          cpfPreposto
        );

      if (
        resultado.status ===
          "ativo" &&
        resultado.participante
      ) {
        setPreposto(
          resultado
            .participante
        );

        setMensagemPreposto(
          resultado
            .mensagem
        );

        return;
      }

      if (
        resultado.status ===
          "desativado" &&
        resultado.participante
      ) {
        setPrepostoDesativado(
          resultado
            .participante
        );

        setPrepostoNaoEncontrado(
          false
        );

        setMensagemPreposto(
          ""
        );

        return;
      }

      setPrepostoDesativado(
        null
      );

      setPrepostoNaoEncontrado(
        true
      );

      setMensagemPreposto(
        resultado
          .mensagem
      );
    } catch (
      error
    ) {
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

  async function handleReativarPreposto() {
    if (
      !prepostoDesativado
    ) {
      return;
    }

    setErroPreposto(
      ""
    );

    setMensagemPreposto(
      ""
    );

    try {
      setCarregandoPreposto(
        true
      );

      const resultado =
        await reativarPreposto(
          prepostoDesativado
            .id
        );

      setPreposto(
        resultado
          .participante
      );

      setPrepostoDesativado(
        null
      );

      setPrepostoNaoEncontrado(
        false
      );

      setMensagemPreposto(
        resultado
          .mensagem
      );
    } catch (
      error
    ) {
      setErroPreposto(
        error instanceof Error
          ? error.message
          : "Não foi possível reativar o preposto."
      );
    } finally {
      setCarregandoPreposto(
        false
      );
    }
  }

  async function handleCadastrarPreposto() {
    setErroPreposto(
      ""
    );

    setMensagemPreposto(
      ""
    );

    try {
      setCarregandoPreposto(
        true
      );

      const resultado =
        await cadastrarPreposto(
          nomeNovoPreposto,
          cpfPreposto
        );

      setPreposto(
        resultado
          .participante
      );

      setPrepostoNaoEncontrado(
        false
      );

      setPrepostoDesativado(
        null
      );

      setMensagemPreposto(
        resultado
          .mensagem
      );
    } catch (
      error
    ) {
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

  function limparPreposto() {
    setPreposto(
      null
    );

    setCpfPreposto(
      ""
    );

    setNomeNovoPreposto(
      ""
    );

    setPrepostoNaoEncontrado(
      false
    );

    setPrepostoDesativado(
      null
    );

    setMensagemPreposto(
      ""
    );

    setErroPreposto(
      ""
    );
  }

  /* =====================================================
     TESTEMUNHAS
  ===================================================== */

  const [
    testemunhasConfirmadas,
    setTestemunhasConfirmadas,
  ] =
    useState<
      "" |
      "true" |
      "false"
    >(
      testemunhasConfirmadasInicial ===
        true
        ? "true"
        : testemunhasConfirmadasInicial ===
            false
          ? "false"
          : ""
    );

  const [
    cpfTestemunha,
    setCpfTestemunha,
  ] =
    useState(
      ""
    );

  const [
    testemunhas,
    setTestemunhas,
  ] =
    useState<
      TestemunhaParticipante[]
    >(
      testemunhasIniciais
    );

  const [
    testemunhaNaoEncontrada,
    setTestemunhaNaoEncontrada,
  ] =
    useState(
      false
    );

  const [
    nomeNovaTestemunha,
    setNomeNovaTestemunha,
  ] =
    useState(
      ""
    );

  const [
    mensagemTestemunha,
    setMensagemTestemunha,
  ] =
    useState(
      ""
    );

  const [
    erroTestemunha,
    setErroTestemunha,
  ] =
    useState(
      ""
    );

  const [
    carregandoTestemunha,
    setCarregandoTestemunha,
  ] =
    useState(
      false
    );

  function alterarTestemunhasConfirmadas(
    valor:
      | "true"
      | "false"
  ) {
    setTestemunhasConfirmadas(
      valor
    );

    if (
      valor ===
      "false"
    ) {
      setTestemunhas(
        []
      );

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
  }

  function adicionarTestemunha(
    participante:
      TestemunhaParticipante
  ) {
    setTestemunhas(
      (
        atuais
      ) => {
        const jaExiste =
          atuais.some(
            (
              item
            ) =>
              item.id ===
              participante.id
          );

        if (
          jaExiste
        ) {
          return atuais;
        }

        return [
          ...atuais,
          participante,
        ];
      }
    );
  }

  async function handleBuscarTestemunha() {
    setErroTestemunha(
      ""
    );

    setMensagemTestemunha(
      ""
    );

    setTestemunhaNaoEncontrada(
      false
    );

    try {
      setCarregandoTestemunha(
        true
      );

      const resultado =
        await buscarTestemunha(
          cpfTestemunha
        );

      if (
        resultado.encontrado &&
        resultado.participante
      ) {
        const jaVinculada =
          testemunhas.some(
            (
              item
            ) =>
              item.id ===
              resultado
                .participante
                .id
          );

        if (
          jaVinculada
        ) {
          setMensagemTestemunha(
            "Esta testemunha já está vinculada à diligência."
          );
        } else {
          adicionarTestemunha(
            resultado
              .participante
          );

          setMensagemTestemunha(
            "Testemunha localizada e adicionada à diligência."
          );
        }

        setCpfTestemunha(
          ""
        );

        return;
      }

      setTestemunhaNaoEncontrada(
        true
      );

      setMensagemTestemunha(
        resultado
          .mensagem
      );
    } catch (
      error
    ) {
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
    setErroTestemunha(
      ""
    );

    setMensagemTestemunha(
      ""
    );

    try {
      setCarregandoTestemunha(
        true
      );

      const resultado =
        await cadastrarTestemunha(
          nomeNovaTestemunha,
          cpfTestemunha
        );

      adicionarTestemunha(
        resultado
          .participante
      );

      setTestemunhaNaoEncontrada(
        false
      );

      setNomeNovaTestemunha(
        ""
      );

      setCpfTestemunha(
        ""
      );

      setMensagemTestemunha(
        `${resultado.mensagem} A testemunha foi adicionada à diligência.`
      );
    } catch (
      error
    ) {
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

  function removerTestemunha(
    id: string
  ) {
    setTestemunhas(
      (
        atuais
      ) =>
        atuais.filter(
          (
            item
          ) =>
            item.id !==
            id
        )
    );
  }

  return (
    <section className="rounded-xl border bg-card">
      {/* CABEÇALHO */}

      <div className="border-b px-6 py-5">
        <div className="flex items-center gap-3">
          <UsersRound className="h-5 w-5" />

          <div>
            <h2 className="text-lg font-semibold">
              Participantes da diligência
            </h2>

            <p className="text-sm text-muted-foreground">
              Localize ou cadastre os profissionais e participantes vinculados ao ato.
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y">
        {/* ADVOGADO */}

        <div className="p-6">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5" />

            <div>
              <h3 className="font-semibold">
                Advogado
              </h3>

              <p className="text-sm text-muted-foreground">
                A busca é realizada pelo número da OAB e UF.
              </p>
            </div>
          </div>

          <input
            type="hidden"
            name="correspondente_id"
            value={
              advogado
                ?.id ??
              ""
            }
          />

          {!advogado && (
            <>
              <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_120px_auto]">
                <div>
                  <label className="text-sm font-medium">
                    Número da OAB
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    value={
                      oabNumero
                    }
                    disabled={
                      disabled
                    }
                    onChange={(
                      event
                    ) => {
                      setOabNumero(
                        event
                          .target
                          .value
                      );

                      setAdvogadoNaoEncontrado(
                        false
                      );

                      setAdvogadoDesativado(
                        null
                      );

                      setErroAdvogado(
                        ""
                      );

                      setMensagemAdvogado(
                        ""
                      );
                    }}
                    placeholder="Ex.: 12345"
                    className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm disabled:bg-muted"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    UF
                  </label>

                  <input
                    type="text"
                    maxLength={
                      2
                    }
                    value={
                      oabUf
                    }
                    disabled={
                      disabled
                    }
                    onChange={(
                      event
                    ) => {
                      setOabUf(
                        event
                          .target
                          .value
                          .toUpperCase()
                      );

                      setAdvogadoNaoEncontrado(
                        false
                      );

                      setAdvogadoDesativado(
                        null
                      );

                      setErroAdvogado(
                        ""
                      );

                      setMensagemAdvogado(
                        ""
                      );
                    }}
                    placeholder="PE"
                    className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm uppercase disabled:bg-muted"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    disabled={
                      disabled ||
                      carregandoAdvogado
                    }
                    onClick={
                      handleBuscarAdvogado
                    }
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
                  >
                    {carregandoAdvogado ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}

                    Buscar
                  </button>
                </div>
              </div>

              {advogadoDesativado && (
                <div className="mt-4 rounded-xl border-2 border-amber-400 bg-amber-50 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
                      <RotateCcw className="h-5 w-5 text-amber-800" />
                    </div>

                    <div className="flex-1">
                      <p className="font-semibold text-amber-950">
                        Este advogado já está cadastrado
                      </p>

                      <p className="mt-1 text-sm font-medium text-amber-900">
                        O cadastro está atualmente desativado.
                      </p>

                      <div className="mt-4 rounded-lg border border-amber-200 bg-white/70 px-4 py-3">
                        <p className="font-semibold">
                          {
                            advogadoDesativado
                              .nome
                          }
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          OAB/
                          {
                            advogadoDesativado
                              .oab_uf
                          }{" "}
                          {
                            advogadoDesativado
                              .oab_numero
                          }
                        </p>
                      </div>

                      <p className="mt-4 text-sm text-amber-900">
                        Não é necessário realizar um novo cadastro. Reative o registro existente para utilizá-lo nesta diligência.
                      </p>

                      <button
                        type="button"
                        disabled={
                          disabled ||
                          carregandoAdvogado
                        }
                        onClick={
                          handleReativarAdvogado
                        }
                        className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-[#0b1f3a] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                      >
                        {carregandoAdvogado ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <RotateCcw className="h-4 w-4" />
                        )}

                        Reativar e vincular
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {advogadoNaoEncontrado &&
                !advogadoDesativado && (
                  <div className="mt-4 rounded-lg border bg-muted/30 p-4">
                    <p className="text-sm font-medium">
                      Advogado não cadastrado
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Não encontramos nenhum advogado com esta OAB e UF. Informe o nome para cadastrá-lo e vinculá-lo à diligência.
                    </p>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <input
                        type="text"
                        value={
                          nomeNovoAdvogado
                        }
                        disabled={
                          disabled
                        }
                        onChange={(
                          event
                        ) =>
                          setNomeNovoAdvogado(
                            event
                              .target
                              .value
                          )
                        }
                        placeholder="Nome do advogado"
                        className="flex-1 rounded-lg border bg-background px-3 py-2.5 text-sm disabled:bg-muted"
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

                        Cadastrar e vincular
                      </button>
                    </div>
                  </div>
                )}
            </>
          )}

          {advogado && (
            <div className="mt-5 flex items-center justify-between gap-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />

                <div>
                  <p className="font-semibold">
                    {
                      advogado
                        .nome
                    }
                  </p>

                  <p className="mt-1 text-sm text-emerald-900">
                    OAB/
                    {
                      advogado
                        .oab_uf
                    }{" "}
                    {
                      advogado
                        .oab_numero
                    }
                  </p>
                </div>
              </div>

              {!disabled && (
                <button
                  type="button"
                  onClick={
                    limparAdvogado
                  }
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Alterar
                </button>
              )}
            </div>
          )}

          {mensagemAdvogado && (
            <p className="mt-3 text-sm text-muted-foreground">
              {
                mensagemAdvogado
              }
            </p>
          )}

          {erroAdvogado && (
            <p className="mt-3 text-sm font-medium text-red-700">
              {
                erroAdvogado
              }
            </p>
          )}
        </div>

        {/* PREPOSTO */}

        <div className="p-6">
          <div className="flex items-center gap-2">
            <UserRound className="h-5 w-5" />

            <div>
              <h3 className="font-semibold">
                Preposto
              </h3>

              <p className="text-sm text-muted-foreground">
                Informe somente quando houver necessidade de preposto para esta diligência.
              </p>
            </div>
          </div>

          <p className="mt-5 text-sm font-medium">
            Será necessário preposto? *
          </p>

          <div className="mt-3 flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="necessita_preposto"
                value="true"
                required
                disabled={
                  disabled
                }
                checked={
                  necessitaPreposto ===
                  "true"
                }
                onChange={() =>
                  alterarNecessidadePreposto(
                    "true"
                  )
                }
              />

              Sim
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="necessita_preposto"
                value="false"
                required
                disabled={
                  disabled
                }
                checked={
                  necessitaPreposto ===
                  "false"
                }
                onChange={() =>
                  alterarNecessidadePreposto(
                    "false"
                  )
                }
              />

              Não
            </label>
          </div>

          <input
            type="hidden"
            name="preposto_id"
            value={
              preposto
                ?.id ??
              ""
            }
          />

          {necessitaPreposto ===
            "true" && (
            <div className="mt-5">
              {!preposto && (
                <>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="flex-1">
                      <label className="text-sm font-medium">
                        CPF do preposto
                      </label>

                      <input
                        type="text"
                        inputMode="numeric"
                        value={
                          cpfPreposto
                        }
                        disabled={
                          disabled
                        }
                        onChange={(
                          event
                        ) => {
                          setCpfPreposto(
                            event
                              .target
                              .value
                          );

                          setPrepostoNaoEncontrado(
                            false
                          );

                          setPrepostoDesativado(
                            null
                          );

                          setMensagemPreposto(
                            ""
                          );

                          setErroPreposto(
                            ""
                          );
                        }}
                        placeholder="000.000.000-00"
                        className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm disabled:bg-muted"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        disabled={
                          disabled ||
                          carregandoPreposto
                        }
                        onClick={
                          handleBuscarPreposto
                        }
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
                      >
                        {carregandoPreposto ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}

                        Buscar
                      </button>
                    </div>
                  </div>

                  {prepostoDesativado && (
                    <div className="mt-4 rounded-xl border-2 border-amber-400 bg-amber-50 p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
                          <RotateCcw className="h-5 w-5 text-amber-800" />
                        </div>

                        <div className="flex-1">
                          <p className="font-semibold text-amber-950">
                            Este preposto já está cadastrado
                          </p>

                          <p className="mt-1 text-sm font-medium text-amber-900">
                            O cadastro está atualmente desativado.
                          </p>

                          <div className="mt-4 rounded-lg border border-amber-200 bg-white/70 px-4 py-3">
                            <p className="font-semibold">
                              {
                                prepostoDesativado
                                  .nome
                              }
                            </p>

                            <p className="mt-1 text-sm text-muted-foreground">
                              CPF{" "}
                              {formatarCPF(
                                prepostoDesativado
                                  .cpf
                              )}
                            </p>
                          </div>

                          <p className="mt-4 text-sm text-amber-900">
                            Não é necessário realizar um novo cadastro. Reative o registro existente para utilizá-lo nesta diligência.
                          </p>

                          <button
                            type="button"
                            disabled={
                              disabled ||
                              carregandoPreposto
                            }
                            onClick={
                              handleReativarPreposto
                            }
                            className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-[#0b1f3a] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                          >
                            {carregandoPreposto ? (
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                              <RotateCcw className="h-4 w-4" />
                            )}

                            Reativar e vincular
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {prepostoNaoEncontrado &&
                    !prepostoDesativado && (
                      <div className="mt-4 rounded-lg border bg-muted/30 p-4">
                        <p className="text-sm font-medium">
                          Preposto não cadastrado
                        </p>

                        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
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
                            placeholder="Nome do preposto"
                            className="flex-1 rounded-lg border bg-background px-3 py-2.5 text-sm disabled:bg-muted"
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

                            Cadastrar e vincular
                          </button>
                        </div>
                      </div>
                    )}
                </>
              )}

              {preposto && (
                <div className="flex items-center justify-between gap-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />

                    <div>
                      <p className="font-semibold">
                        {
                          preposto
                            .nome
                        }
                      </p>

                      <p className="mt-1 text-sm text-emerald-900">
                        CPF{" "}
                        {formatarCPF(
                          preposto
                            .cpf
                        )}
                      </p>
                    </div>
                  </div>

                  {!disabled && (
                    <button
                      type="button"
                      onClick={
                        limparPreposto
                      }
                      className="text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                      Alterar
                    </button>
                  )}
                </div>
              )}

              {mensagemPreposto && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {
                    mensagemPreposto
                  }
                </p>
              )}

              {erroPreposto && (
                <p className="mt-3 text-sm font-medium text-red-700">
                  {
                    erroPreposto
                  }
                </p>
              )}
            </div>
          )}
        </div>

        {/* TESTEMUNHAS */}

        <div className="p-6">
          <div className="flex items-center gap-2">
            <UsersRound className="h-5 w-5" />

            <div>
              <h3 className="font-semibold">
                Testemunhas
              </h3>

              <p className="text-sm text-muted-foreground">
                As testemunhas são opcionais e podem ser reutilizadas em diferentes processos.
              </p>
            </div>
          </div>

          <p className="mt-5 text-sm font-medium">
            Há testemunhas confirmadas? *
          </p>

          <div className="mt-3 flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="testemunhas_confirmadas"
                value="true"
                required
                disabled={
                  disabled
                }
                checked={
                  testemunhasConfirmadas ===
                  "true"
                }
                onChange={() =>
                  alterarTestemunhasConfirmadas(
                    "true"
                  )
                }
              />

              Sim
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="testemunhas_confirmadas"
                value="false"
                required
                disabled={
                  disabled
                }
                checked={
                  testemunhasConfirmadas ===
                  "false"
                }
                onChange={() =>
                  alterarTestemunhasConfirmadas(
                    "false"
                  )
                }
              />

              Não
            </label>
          </div>

          {testemunhas.map(
            (
              testemunha
            ) => (
              <input
                key={
                  testemunha
                    .id
                }
                type="hidden"
                name="testemunha_ids"
                value={
                  testemunha
                    .id
                }
              />
            )
          )}

          {testemunhasConfirmadas ===
            "true" && (
            <div className="mt-5">
              {testemunhas.length >
                0 && (
                <div className="mb-5 space-y-3">
                  <p className="text-sm font-medium">
                    Testemunhas vinculadas
                  </p>

                  {testemunhas.map(
                    (
                      testemunha
                    ) => (
                      <div
                        key={
                          testemunha
                            .id
                        }
                        className="flex items-center justify-between gap-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4"
                      >
                        <div>
                          <p className="font-semibold">
                            {
                              testemunha
                                .nome
                            }
                          </p>

                          <p className="mt-1 text-sm text-emerald-900">
                            CPF{" "}
                            {formatarCPF(
                              testemunha
                                .cpf
                            )}
                          </p>
                        </div>

                        {!disabled && (
                          <button
                            type="button"
                            onClick={() =>
                              removerTestemunha(
                                testemunha
                                  .id
                              )
                            }
                            className="inline-flex items-center gap-1 text-sm font-medium text-red-700"
                          >
                            <X className="h-4 w-4" />

                            Remover
                          </button>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex-1">
                  <label className="text-sm font-medium">
                    CPF da testemunha
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    value={
                      cpfTestemunha
                    }
                    disabled={
                      disabled
                    }
                    onChange={(
                      event
                    ) => {
                      setCpfTestemunha(
                        event
                          .target
                          .value
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
                    }}
                    placeholder="000.000.000-00"
                    className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm disabled:bg-muted"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    disabled={
                      disabled ||
                      carregandoTestemunha
                    }
                    onClick={
                      handleBuscarTestemunha
                    }
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
                  >
                    {carregandoTestemunha ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}

                    Buscar
                  </button>
                </div>
              </div>

              {testemunhaNaoEncontrada && (
                <div className="mt-4 rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm font-medium">
                    Testemunha não cadastrada
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Informe o nome para criar o cadastro e adicioná-la à diligência.
                  </p>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <input
                      type="text"
                      value={
                        nomeNovaTestemunha
                      }
                      disabled={
                        disabled
                      }
                      onChange={(
                        event
                      ) =>
                        setNomeNovaTestemunha(
                          event
                            .target
                            .value
                        )
                      }
                      placeholder="Nome da testemunha"
                      className="flex-1 rounded-lg border bg-background px-3 py-2.5 text-sm disabled:bg-muted"
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

                      Cadastrar e adicionar
                    </button>
                  </div>
                </div>
              )}

              {mensagemTestemunha && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {
                    mensagemTestemunha
                  }
                </p>
              )}

              {erroTestemunha && (
                <p className="mt-3 text-sm font-medium text-red-700">
                  {
                    erroTestemunha
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