"use client";

import Link from "next/link";

import {
  useReducer,
  useRef,
  useState,
} from "react";

import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  FileText,
  LoaderCircle,
  MapPin,
  Monitor,
  Save,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  reducerRascunhoDiligencia,
} from "../../../nova/formulario/reducer";

import {
  SecaoParticipantes,
} from "../../../nova/formulario/secao-participantes";

import type {
  ErrosRascunhoDiligencia,
  RascunhoDiligencia,
} from "../../../nova/formulario/tipos";

import {
  editarDiligencia,
  type EdicaoState,
} from "../actions";

import {
  criarEstadoInicialEdicao,
} from "./estado-inicial";

import type {
  DetalhesEdicaoDiligencia,
} from "./tipos";

/* =====================================================
   TIPOS
===================================================== */

type Props = {
  detalhes:
    DetalhesEdicaoDiligencia;
};

type AcaoEdicao =
  | "salvar"
  | "revisar"
  | "prosseguir";

/* =====================================================
   ESTADO DO SERVIDOR
===================================================== */

const ESTADO_SERVIDOR_INICIAL:
  EdicaoState = {
  status: "inicial",
  mensagem: "",
  diligenciasEncontradas: [],
  conflitosAgenda: [],
};

/* =====================================================
   AUXILIARES
===================================================== */

function normalizarValorMonetario(
  valor: string
) {
  const texto =
    valor
      .trim()
      .replace(/\s/g, "")
      .replace(/^R\$/i, "");

  if (!texto) {
    return null;
  }

  const normalizado =
    texto.includes(",")
      ? texto
          .replace(/\./g, "")
          .replace(",", ".")
      : texto;

  const numero =
    Number(normalizado);

  return Number.isFinite(numero)
    ? numero
    : null;
}

function formatarProcesso(
  processo:
    | string
    | null
) {
  if (!processo) {
    return "Não informado";
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
  const valor =
    data.slice(
      0,
      10
    );

  const [
    ano,
    mes,
    dia,
  ] =
    valor.split("-");

  if (
    !ano ||
    !mes ||
    !dia
  ) {
    return data;
  }

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

function CampoErro({
  mensagem,
}: {
  mensagem?:
    | string
    | null;
}) {
  if (!mensagem) {
    return null;
  }

  return (
    <p className="mt-2 text-sm font-medium text-red-600">
      {mensagem}
    </p>
  );
}

/* =====================================================
   REGRAS OPERACIONAIS DA CONTRATAÇÃO
===================================================== */

function tipoContratacaoIncluiAdvogado(
  tipo:
    RascunhoDiligencia["contratacao_tipo"]
) {
  return (
    tipo === "advogado" ||
    tipo === "advogado_preposto"
  );
}

function tipoContratacaoIncluiPreposto(
  tipo:
    RascunhoDiligencia["contratacao_tipo"]
) {
  return (
    tipo === "preposto" ||
    tipo === "advogado_preposto"
  );
}

/* =====================================================
   VALIDAÇÃO
===================================================== */

function validarEdicao(
  rascunho:
    RascunhoDiligencia
): ErrosRascunhoDiligencia {
  const erros:
    ErrosRascunhoDiligencia =
      {};

  /* ===================================================
     CAMPOS PRINCIPAIS
  =================================================== */

  if (
    !rascunho
      .tipo_diligencia
      .trim()
  ) {
    erros.tipo_diligencia =
      "Informe o tipo da diligência.";
  }

  if (
    !rascunho.modalidade
  ) {
    erros.modalidade =
      "Informe a modalidade da diligência.";
  }

  if (
    !rascunho
      .numero_processo
      .trim()
  ) {
    erros.numero_processo =
      "Informe o número do processo.";
  }

  if (
    !rascunho
      .parte_autora
      .trim()
  ) {
    erros.parte_autora =
      "Informe a parte autora.";
  }

  if (
    !rascunho
      .parte_re
      .trim()
  ) {
    erros.parte_re =
      "Informe a parte ré.";
  }

  if (
    !rascunho
      .data_diligencia
      .trim()
  ) {
    erros.data_diligencia =
      "Informe a data da diligência.";
  }

  if (
    !rascunho
      .horario
      .trim()
  ) {
    erros.horario =
      "Informe o horário da diligência.";
  }

  if (
    !rascunho
      .vara
      .trim()
  ) {
    erros.vara =
      "Informe a vara ou unidade.";
  }

  if (
    !rascunho
      .comarca
      .trim()
  ) {
    erros.comarca =
      "Informe a comarca ou cidade.";
  }

  if (
    rascunho
      .uf
      .trim()
      .length !== 2
  ) {
    erros.uf =
      "Informe a UF com 2 letras.";
  }

  /* ===================================================
     PREPOSTO
  =================================================== */

  if (
    rascunho
      .necessita_preposto ===
      true &&
    !rascunho.preposto
  ) {
    erros.preposto =
      "A diligência está marcada como necessitando de preposto. Designe o preposto responsável.";
  }

  /* ===================================================
     TESTEMUNHAS
  =================================================== */

  if (
    rascunho
      .testemunhas_status ===
      "confirmadas" &&
    rascunho
      .testemunhas
      .length === 0
  ) {
    erros.testemunhas =
      "Adicione pelo menos uma testemunha confirmada.";
  }

  /* ===================================================
     SITUAÇÃO DA CONTRATAÇÃO

     Se já existe profissional designado,
     o controller precisa definir se houve
     contratação ou se ela foi desnecessária.
  =================================================== */

  if (
    (
      rascunho.advogado ||
      rascunho.preposto
    ) &&
    rascunho
      .contratacao_status ===
      null
  ) {
    erros.contratacao_status =
      "Existem profissionais designados para esta diligência. Informe se a contratação foi Confirmada ou se é Desnecessária.";
  }

  /* ===================================================
     CONTRATAÇÃO CONFIRMADA
  =================================================== */

  if (
    rascunho
      .contratacao_status ===
      "confirmada" &&
    !rascunho
      .contratacao_tipo
  ) {
    erros.contratacao_tipo =
      "Informe quais profissionais foram contratados.";
  }

  const incluiAdvogado =
    tipoContratacaoIncluiAdvogado(
      rascunho
        .contratacao_tipo
    );

  const incluiPreposto =
    tipoContratacaoIncluiPreposto(
      rascunho
        .contratacao_tipo
    );

  /* ===================================================
     CONSISTÊNCIA: ADVOGADO
  =================================================== */

  if (
    rascunho
      .contratacao_status ===
      "confirmada" &&
    incluiAdvogado &&
    !rascunho.advogado
  ) {
    erros.advogado =
      "A contratação informada inclui advogado, mas nenhum advogado está designado para a diligência.";
  }

  /* ===================================================
     CONSISTÊNCIA: PREPOSTO

     REGRA CRÍTICA:
     não pode existir contratação de preposto
     se o próprio tratamento da diligência diz
     que ele não é necessário.
  =================================================== */

  if (
    rascunho
      .contratacao_status ===
      "confirmada" &&
    incluiPreposto &&
    rascunho
      .necessita_preposto ===
      false
  ) {
    erros.contratacao_tipo =
      "A contratação não pode incluir preposto porque foi definido que esta diligência não necessita de preposto.";
  }

  if (
    rascunho
      .contratacao_status ===
      "confirmada" &&
    incluiPreposto &&
    rascunho
      .necessita_preposto ===
      null
  ) {
    erros.contratacao_tipo =
      "Antes de registrar contratação de preposto, defina se esta diligência necessita de preposto.";
  }

  if (
    rascunho
      .contratacao_status ===
      "confirmada" &&
    incluiPreposto &&
    rascunho
      .necessita_preposto ===
      true &&
    !rascunho.preposto
  ) {
    erros.preposto =
      "A contratação informada inclui preposto. Designe o preposto responsável antes de salvar.";
  }

  /* ===================================================
     FINANCEIRO DO ADVOGADO
  =================================================== */

  if (
    rascunho
      .contratacao_status ===
      "confirmada" &&
    incluiAdvogado
  ) {
    const valor =
      normalizarValorMonetario(
        rascunho
          .contratacao_advogado_valor
      );

    if (
      rascunho
        .contratacao_advogado_valor
        .trim() === ""
    ) {
      erros
        .contratacao_advogado_valor =
        "Informe o valor da contratação do advogado.";
    } else if (
      valor === null ||
      valor < 0
    ) {
      erros
        .contratacao_advogado_valor =
        "Informe um valor válido para a contratação do advogado.";
    }

    if (
      !rascunho
        .contratacao_advogado_pagamento_combinado_em
    ) {
      erros
        .contratacao_advogado_pagamento_combinado_em =
        "Informe a data combinada para pagamento do advogado.";
    }
  }

  /* ===================================================
     FINANCEIRO DO PREPOSTO
  =================================================== */

  if (
    rascunho
      .contratacao_status ===
      "confirmada" &&
    incluiPreposto
  ) {
    const valor =
      normalizarValorMonetario(
        rascunho
          .contratacao_preposto_valor
      );

    if (
      rascunho
        .contratacao_preposto_valor
        .trim() === ""
    ) {
      erros
        .contratacao_preposto_valor =
        "Informe o valor da contratação do preposto.";
    } else if (
      valor === null ||
      valor < 0
    ) {
      erros
        .contratacao_preposto_valor =
        "Informe um valor válido para a contratação do preposto.";
    }

    if (
      !rascunho
        .contratacao_preposto_pagamento_combinado_em
    ) {
      erros
        .contratacao_preposto_pagamento_combinado_em =
        "Informe a data combinada para pagamento do preposto.";
    }
  }

  return erros;
}

/* =====================================================
   FORMDATA
===================================================== */

function criarFormDataEdicao(
  diligenciaId: string,
  rascunho:
    RascunhoDiligencia,
  acao:
    AcaoEdicao
) {
  const formData =
    new FormData();

  formData.set(
    "diligencia_id",
    diligenciaId
  );

  formData.set(
    "acao_edicao",
    acao
  );

  formData.set(
    "tipo_diligencia",
    rascunho
      .tipo_diligencia
  );

  formData.set(
    "modalidade",
    rascunho.modalidade
  );

  formData.set(
    "numero_processo",
    rascunho
      .numero_processo
  );

  formData.set(
    "parte_autora",
    rascunho
      .parte_autora
  );

  formData.set(
    "parte_re",
    rascunho
      .parte_re
  );

  formData.set(
    "data_diligencia",
    rascunho
      .data_diligencia
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

  /* ===================================================
     ADVOGADO
  =================================================== */

  formData.set(
    "correspondente_id",
    rascunho
      .advogado
      ?.id ??
      ""
  );

  /* ===================================================
     PREPOSTO
  =================================================== */

  formData.set(
    "necessita_preposto",
    rascunho
      .necessita_preposto ===
      null
      ? ""
      : String(
          rascunho
            .necessita_preposto
        )
  );

  formData.set(
    "preposto_id",
    rascunho
      .necessita_preposto ===
      true
      ? rascunho
          .preposto
          ?.id ??
        ""
      : ""
  );

  /* ===================================================
     TESTEMUNHAS
  =================================================== */

  formData.set(
    "testemunhas_status",
    rascunho
      .testemunhas_status ??
      ""
  );

  formData.set(
    "testemunhas_confirmadas",
    rascunho
      .testemunhas_status ===
      null
      ? ""
      : rascunho
            .testemunhas_status ===
          "confirmadas"
        ? "true"
        : "false"
  );

  if (
    rascunho
      .testemunhas_status ===
      "confirmadas"
  ) {
    for (
      const testemunha of
      rascunho.testemunhas
    ) {
      formData.append(
        "testemunha_ids",
        testemunha.id
      );
    }
  }

  /* ===================================================
     CONTRATAÇÃO
  =================================================== */

  formData.set(
    "contratacao_status",
    rascunho
      .contratacao_status ??
      ""
  );

  formData.set(
    "contratacao_tipo",
    rascunho
      .contratacao_status ===
      "confirmada"
      ? rascunho
          .contratacao_tipo ??
        ""
      : ""
  );

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

  const incluiAdvogado =
    tipoContratacaoIncluiAdvogado(
      rascunho
        .contratacao_tipo
    );

  const incluiPreposto =
    tipoContratacaoIncluiPreposto(
      rascunho
        .contratacao_tipo
    );

  formData.set(
    "contratacao_advogado_valor",
    rascunho
      .contratacao_status ===
        "confirmada" &&
    incluiAdvogado
      ? rascunho
          .contratacao_advogado_valor
      : ""
  );

  formData.set(
    "contratacao_advogado_pagamento_combinado_em",
    rascunho
      .contratacao_status ===
        "confirmada" &&
    incluiAdvogado
      ? rascunho
          .contratacao_advogado_pagamento_combinado_em
      : ""
  );

  formData.set(
    "contratacao_preposto_valor",
    rascunho
      .contratacao_status ===
        "confirmada" &&
    incluiPreposto
      ? rascunho
          .contratacao_preposto_valor
      : ""
  );

  formData.set(
    "contratacao_preposto_pagamento_combinado_em",
    rascunho
      .contratacao_status ===
        "confirmada" &&
    incluiPreposto
      ? rascunho
          .contratacao_preposto_pagamento_combinado_em
      : ""
  );

  /* ===================================================
     ORIENTAÇÕES
  =================================================== */

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
   COMPONENTE
===================================================== */

export function FormularioPrincipalEdicao({
  detalhes,
}: Props) {
  const [
    rascunho,
    dispatch,
  ] =
    useReducer(
      reducerRascunhoDiligencia,
      detalhes,
      criarEstadoInicialEdicao
    );

  const [
    erros,
    setErros,
  ] =
    useState<ErrosRascunhoDiligencia>(
      {}
    );

  const [
    mensagemCliente,
    setMensagemCliente,
  ] =
    useState<string | null>(
      null
    );

  const [
    estadoServidor,
    setEstadoServidor,
  ] =
    useState<EdicaoState>(
      ESTADO_SERVIDOR_INICIAL
    );

  const [
    salvando,
    setSalvando,
  ] =
    useState(false);

  const resultadoRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const tratamentoRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const diligenciaId =
    detalhes.diligencia.id;

  const emAlerta =
    estadoServidor.status ===
    "alerta";

  /* ===================================================
     POSSIBILIDADES REAIS DE CONTRATAÇÃO
  =================================================== */

  const possuiAdvogado =
    Boolean(
      rascunho.advogado
    );

  const prepostoFoiDefinidoComoNecessario =
    rascunho
      .necessita_preposto ===
      true;

  const possuiPreposto =
    prepostoFoiDefinidoComoNecessario &&
    Boolean(
      rascunho.preposto
    );

  /*
    Estas três variáveis controlam a interface.

    Assim não oferecemos ao controller uma
    combinação que já sabemos ser impossível.
  */

  const podeSelecionarAdvogado =
    possuiAdvogado;

  const podeSelecionarPreposto =
    possuiPreposto;

  const podeSelecionarAdvogadoPreposto =
    possuiAdvogado &&
    possuiPreposto;

  const contratacaoIncluiAdvogado =
    tipoContratacaoIncluiAdvogado(
      rascunho
        .contratacao_tipo
    );

  const contratacaoIncluiPreposto =
    tipoContratacaoIncluiPreposto(
      rascunho
        .contratacao_tipo
    );

  const contratacaoExigeAdvogado =
    rascunho
      .contratacao_status ===
      "confirmada" &&
    contratacaoIncluiAdvogado;

  const contratacaoExigePreposto =
    rascunho
      .contratacao_status ===
      "confirmada" &&
    contratacaoIncluiPreposto;

  /* ===================================================
     ESTADO INCONSISTENTE EXISTENTE

     Pode ocorrer quando:
     1. o usuário escolhe Advogado e preposto;
     2. depois altera "Necessita preposto" para Não.

     Não apagamos a escolha silenciosamente.
     Avisamos e exigimos revisão.
  =================================================== */

  const contratacaoPrepostoIncompativel =
    rascunho
      .contratacao_status ===
      "confirmada" &&
    contratacaoIncluiPreposto &&
    rascunho
      .necessita_preposto !==
      true;

  const contratacaoAdvogadoIncompativel =
    rascunho
      .contratacao_status ===
      "confirmada" &&
    contratacaoIncluiAdvogado &&
    !rascunho.advogado;

  const contratacaoPrepostoSemDesignacao =
    rascunho
      .contratacao_status ===
      "confirmada" &&
    contratacaoIncluiPreposto &&
    rascunho
      .necessita_preposto ===
      true &&
    !rascunho.preposto;

  const possuiDuplicidade =
    (
      estadoServidor
        .diligenciasEncontradas ??
      []
    ).length > 0;

  const possuiConflito =
    (
      estadoServidor
        .conflitosAgenda ??
      []
    ).length > 0;

  /* ===================================================
     TEXTO
  =================================================== */

  function alterarTexto(
    campo:
      | "tipo_diligencia"
      | "numero_processo"
      | "parte_autora"
      | "parte_re"
      | "data_diligencia"
      | "horario"
      | "vara"
      | "comarca"
      | "uf"
      | "local"
      | "contratacao_advogado_valor"
      | "contratacao_advogado_pagamento_combinado_em"
      | "contratacao_preposto_valor"
      | "contratacao_preposto_pagamento_combinado_em"
      | "observacoes",
    valor: string
  ) {
    dispatch({
      type:
        "ALTERAR_TEXTO",
      campo,
      valor,
    });

    setMensagemCliente(
      null
    );

    setErros(
      (
        anteriores
      ) => ({
        ...anteriores,

        [campo]:
          undefined,

        geral:
          undefined,
      })
    );
  }

  /* ===================================================
     ROLAGEM
  =================================================== */

  function rolarParaErro(
    errosEncontrados:
      ErrosRascunhoDiligencia
  ) {
    const erroContratacao =
      Boolean(
        errosEncontrados
          .contratacao_status ||
        errosEncontrados
          .contratacao_tipo ||
        errosEncontrados
          .contratacao_advogado_valor ||
        errosEncontrados
          .contratacao_advogado_pagamento_combinado_em ||
        errosEncontrados
          .contratacao_preposto_valor ||
        errosEncontrados
          .contratacao_preposto_pagamento_combinado_em
      );

    window.setTimeout(
      () => {
        if (
          erroContratacao
        ) {
          tratamentoRef.current
            ?.scrollIntoView({
              behavior:
                "smooth",

              block:
                "start",
            });

          return;
        }

        resultadoRef.current
          ?.scrollIntoView({
            behavior:
              "smooth",

            block:
              "start",
          });
      },
      50
    );
  }

  /* ===================================================
     EXECUTAR EDIÇÃO
  =================================================== */

  async function executarEdicao(
    acao:
      AcaoEdicao
  ) {
    if (salvando) {
      return;
    }

    if (
      acao !== "revisar"
    ) {
      const errosEncontrados =
        validarEdicao(
          rascunho
        );

      if (
        Object.keys(
          errosEncontrados
        ).length > 0
      ) {
        setErros(
          errosEncontrados
        );

        if (
          errosEncontrados
            .contratacao_status
        ) {
          setMensagemCliente(
            errosEncontrados
              .contratacao_status
          );
        } else if (
          errosEncontrados
            .contratacao_tipo
        ) {
          setMensagemCliente(
            errosEncontrados
              .contratacao_tipo
          );
        } else {
          setMensagemCliente(
            "Revise os campos destacados antes de salvar as alterações."
          );
        }

        rolarParaErro(
          errosEncontrados
        );

        return;
      }
    }

    setErros({});
    setMensagemCliente(
      null
    );

    setSalvando(true);

    try {
      const formData =
        criarFormDataEdicao(
          diligenciaId,
          rascunho,
          acao
        );

      const resultado =
        await editarDiligencia(
          estadoServidor,
          formData
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
        window.setTimeout(
          () => {
            resultadoRef.current
              ?.scrollIntoView({
                behavior:
                  "smooth",

                block:
                  "start",
              });
          },
          50
        );
      }
    } catch (erro) {
      const mensagem =
        erro instanceof Error
          ? erro.message
          : "Não foi possível salvar as alterações.";

      if (
        mensagem.includes(
          "NEXT_REDIRECT"
        )
      ) {
        throw erro;
      }

      setEstadoServidor({
        status:
          "erro",

        mensagem,

        diligenciasEncontradas:
          [],

        conflitosAgenda:
          [],
      });

      window.setTimeout(
        () => {
          resultadoRef.current
            ?.scrollIntoView({
              behavior:
                "smooth",

              block:
                "start",
            });
        },
        50
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="w-full">
      {/* =================================================
          CABEÇALHO
      ================================================== */}

      <section className="mb-8">
        <Link
          href={`/protected/diligencias/${diligenciaId}`}
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

      {/* =================================================
          ERROS
      ================================================== */}

      <div
        ref={
          resultadoRef
        }
        className="scroll-mt-6"
      />

      {mensagemCliente && (
        <section className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5 text-red-900">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="font-semibold">
                Revise antes de salvar
              </p>

              <p className="mt-1 text-sm">
                {
                  mensagemCliente
                }
              </p>
            </div>
          </div>
        </section>
      )}

      {estadoServidor.status ===
        "erro" &&
        estadoServidor.mensagem && (
          <section className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5 text-red-900">
            <p className="font-semibold">
              Não foi possível salvar as alterações.
            </p>

            <p className="mt-1 text-sm">
              {
                estadoServidor
                  .mensagem
              }
            </p>
          </section>
        )}

      <div className="space-y-6">
        {/* =================================================
            IDENTIFICAÇÃO
        ================================================== */}

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
                value={
                  rascunho
                    .tipo_diligencia
                }
                disabled={
                  salvando ||
                  emAlerta
                }
                onChange={(
                  event
                ) =>
                  alterarTexto(
                    "tipo_diligencia",
                    event.target
                      .value
                  )
                }
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm disabled:opacity-60"
              />

              <CampoErro
                mensagem={
                  erros
                    .tipo_diligencia
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Número do processo *
              </label>

              <input
                value={
                  rascunho
                    .numero_processo
                }
                disabled={
                  salvando ||
                  emAlerta
                }
                onChange={(
                  event
                ) =>
                  alterarTexto(
                    "numero_processo",
                    event.target
                      .value
                  )
                }
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm disabled:opacity-60"
              />

              <CampoErro
                mensagem={
                  erros
                    .numero_processo
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Parte autora *
              </label>

              <input
                value={
                  rascunho
                    .parte_autora
                }
                disabled={
                  salvando ||
                  emAlerta
                }
                onChange={(
                  event
                ) =>
                  alterarTexto(
                    "parte_autora",
                    event.target
                      .value
                  )
                }
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm disabled:opacity-60"
              />

              <CampoErro
                mensagem={
                  erros
                    .parte_autora
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Parte ré *
              </label>

              <input
                value={
                  rascunho
                    .parte_re
                }
                disabled={
                  salvando ||
                  emAlerta
                }
                onChange={(
                  event
                ) =>
                  alterarTexto(
                    "parte_re",
                    event.target
                      .value
                  )
                }
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm disabled:opacity-60"
              />

              <CampoErro
                mensagem={
                  erros.parte_re
                }
              />
            </div>
          </div>
        </section>

        {/* =================================================
            MODALIDADE
        ================================================== */}

        <section className="rounded-xl border bg-card">
          <div className="border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <Monitor className="h-5 w-5" />

              <div>
                <h2 className="text-lg font-semibold">
                  Modalidade
                </h2>

                <p className="text-sm text-muted-foreground">
                  Informe como a diligência será realizada.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-2">
            <label className="flex cursor-pointer items-start gap-4 rounded-xl border p-5 hover:bg-muted/30">
              <input
                type="radio"
                checked={
                  rascunho
                    .modalidade ===
                  "presencial"
                }
                disabled={
                  salvando ||
                  emAlerta
                }
                onChange={() => {
                  dispatch({
                    type:
                      "ALTERAR_MODALIDADE",

                    valor:
                      "presencial",
                  });

                  setErros(
                    (
                      anteriores
                    ) => ({
                      ...anteriores,

                      modalidade:
                        undefined,
                    })
                  );
                }}
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
                  O profissional deverá comparecer fisicamente ao local da diligência.
                </p>
              </div>
            </label>

            <label className="flex cursor-pointer items-start gap-4 rounded-xl border p-5 hover:bg-muted/30">
              <input
                type="radio"
                checked={
                  rascunho
                    .modalidade ===
                  "virtual"
                }
                disabled={
                  salvando ||
                  emAlerta
                }
                onChange={() => {
                  dispatch({
                    type:
                      "ALTERAR_MODALIDADE",

                    valor:
                      "virtual",
                  });

                  setErros(
                    (
                      anteriores
                    ) => ({
                      ...anteriores,

                      modalidade:
                        undefined,
                    })
                  );
                }}
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
          </div>

          {erros.modalidade && (
            <div className="px-6 pb-6">
              <CampoErro
                mensagem={
                  erros.modalidade
                }
              />
            </div>
          )}
        </section>

        {/* =================================================
            DATA E HORÁRIO
        ================================================== */}

        <section className="rounded-xl border bg-card">
          <div className="border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5" />

              <div>
                <h2 className="text-lg font-semibold">
                  Data e horário
                </h2>

                <p className="text-sm text-muted-foreground">
                  Informe quando a diligência será realizada.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 p-6 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">
                Data *
              </label>

              <input
                type="date"
                value={
                  rascunho
                    .data_diligencia
                }
                disabled={
                  salvando ||
                  emAlerta
                }
                onChange={(
                  event
                ) =>
                  alterarTexto(
                    "data_diligencia",
                    event.target
                      .value
                  )
                }
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm disabled:opacity-60"
              />

              <CampoErro
                mensagem={
                  erros
                    .data_diligencia
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Horário *
              </label>

              <input
                type="time"
                value={
                  rascunho.horario
                }
                disabled={
                  salvando ||
                  emAlerta
                }
                onChange={(
                  event
                ) =>
                  alterarTexto(
                    "horario",
                    event.target
                      .value
                  )
                }
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm disabled:opacity-60"
              />

              <CampoErro
                mensagem={
                  erros.horario
                }
              />
            </div>
          </div>
        </section>

        {/* =================================================
            LOCAL
        ================================================== */}

        <section className="rounded-xl border bg-card">
          <div className="border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5" />

              <div>
                <h2 className="text-lg font-semibold">
                  Local da diligência
                </h2>

                <p className="text-sm text-muted-foreground">
                  Informe a unidade e a localidade do ato.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 p-6 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">
                Vara / unidade *
              </label>

              <input
                value={
                  rascunho.vara
                }
                disabled={
                  salvando ||
                  emAlerta
                }
                onChange={(
                  event
                ) =>
                  alterarTexto(
                    "vara",
                    event.target
                      .value
                  )
                }
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm disabled:opacity-60"
              />

              <CampoErro
                mensagem={
                  erros.vara
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Local
              </label>

              <input
                value={
                  rascunho.local
                }
                disabled={
                  salvando ||
                  emAlerta
                }
                onChange={(
                  event
                ) =>
                  alterarTexto(
                    "local",
                    event.target
                      .value
                  )
                }
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm disabled:opacity-60"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Comarca / cidade *
              </label>

              <input
                value={
                  rascunho.comarca
                }
                disabled={
                  salvando ||
                  emAlerta
                }
                onChange={(
                  event
                ) =>
                  alterarTexto(
                    "comarca",
                    event.target
                      .value
                  )
                }
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm disabled:opacity-60"
              />

              <CampoErro
                mensagem={
                  erros.comarca
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                UF *
              </label>

              <input
                maxLength={2}
                value={
                  rascunho.uf
                }
                disabled={
                  salvando ||
                  emAlerta
                }
                onChange={(
                  event
                ) =>
                  alterarTexto(
                    "uf",
                    event.target
                      .value
                  )
                }
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm uppercase disabled:opacity-60"
              />

              <CampoErro
                mensagem={
                  erros.uf
                }
              />
            </div>
          </div>
        </section>

        {/* =================================================
            PARTICIPANTES
        ================================================== */}

        <SecaoParticipantes
          rascunho={
            rascunho
          }
          dispatch={
            dispatch
          }
          erros={
            erros
          }
          disabled={
            salvando ||
            emAlerta
          }
        />

        {/* =================================================
            TRATAMENTO
        ================================================== */}

        <div
          ref={
            tratamentoRef
          }
          className="scroll-mt-6"
        >
          <section className="rounded-xl border bg-card">
            <div className="border-b px-6 py-5">
              <div className="flex items-center gap-3">
                <UserRound className="h-5 w-5" />

                <div>
                  <h2 className="text-lg font-semibold">
                    Tratamento da diligência
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    Informe a situação da contratação e das orientações.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6 p-6">
              {/* =========================================
                  INCONSISTÊNCIAS OPERACIONAIS
              ========================================== */}

              {contratacaoPrepostoIncompativel && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

                    <div>
                      <p className="font-semibold">
                        Contratação incompatível com o tratamento da diligência
                      </p>

                      <p className="mt-1 text-sm">
                        A contratação atualmente inclui preposto, mas a diligência não está marcada como necessitando de preposto. Revise o tipo da contratação ou a necessidade de preposto.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {contratacaoAdvogadoIncompativel && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

                    <div>
                      <p className="font-semibold">
                        Advogado não designado
                      </p>

                      <p className="mt-1 text-sm">
                        A contratação inclui advogado, mas nenhum advogado está vinculado à diligência.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {contratacaoPrepostoSemDesignacao && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

                    <div>
                      <p className="font-semibold">
                        Preposto ainda não designado
                      </p>

                      <p className="mt-1 text-sm">
                        Foi informado que a diligência necessita de preposto, mas nenhum preposto está vinculado.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================
                  SITUAÇÃO DA CONTRATAÇÃO
              ========================================== */}

              <div>
                <label className="text-sm font-medium">
                  Situação da contratação
                </label>

                <p className="mt-1 text-sm text-muted-foreground">
                  Informe se houve contratação externa ou se ela foi considerada desnecessária.
                </p>

                <select
                  value={
                    rascunho
                      .contratacao_status ??
                    ""
                  }
                  disabled={
                    salvando ||
                    emAlerta
                  }
                  onChange={(
                    event
                  ) => {
                    const valor =
                      event.target
                        .value;

                    dispatch({
                      type:
                        "DEFINIR_CONTRATACAO_STATUS",

                      valor:
                        valor ===
                          "confirmada" ||
                        valor ===
                          "desnecessaria"
                          ? valor
                          : null,
                    });

                    setErros(
                      (
                        anteriores
                      ) => ({
                        ...anteriores,

                        contratacao_status:
                          undefined,

                        contratacao_tipo:
                          undefined,
                      })
                    );

                    setMensagemCliente(
                      null
                    );
                  }}
                  className="mt-3 w-full rounded-lg border bg-background px-3 py-2.5 text-sm md:max-w-md disabled:opacity-60"
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

                <CampoErro
                  mensagem={
                    erros
                      .contratacao_status
                  }
                />
              </div>

              {/* =========================================
                  TIPO DA CONTRATAÇÃO
              ========================================== */}

              {rascunho
                .contratacao_status ===
                "confirmada" && (
                <div className="rounded-lg border bg-muted/20 p-4">
                  <label className="text-sm font-medium">
                    Contratação realizada para
                  </label>

                  <p className="mt-1 text-sm text-muted-foreground">
                    As opções disponíveis são definidas pelos profissionais efetivamente designados para esta diligência.
                  </p>

                  <select
                    value={
                      rascunho
                        .contratacao_tipo ??
                      ""
                    }
                    disabled={
                      salvando ||
                      emAlerta
                    }
                    onChange={(
                      event
                    ) => {
                      const valor =
                        event.target
                          .value;

                      dispatch({
                        type:
                          "DEFINIR_CONTRATACAO_TIPO",

                        valor:
                          valor ===
                            "advogado" ||
                          valor ===
                            "preposto" ||
                          valor ===
                            "advogado_preposto"
                            ? valor
                            : null,
                      });

                      setErros(
                        (
                          anteriores
                        ) => ({
                          ...anteriores,

                          contratacao_tipo:
                            undefined,
                        })
                      );

                      setMensagemCliente(
                        null
                      );
                    }}
                    className="mt-3 w-full rounded-lg border bg-background px-3 py-2.5 text-sm md:max-w-md disabled:opacity-60"
                  >
                    <option value="">
                      Selecione...
                    </option>

                    <option
                      value="advogado"
                      disabled={
                        !podeSelecionarAdvogado
                      }
                    >
                      Apenas advogado
                      {!podeSelecionarAdvogado
                        ? " — advogado não designado"
                        : ""}
                    </option>

                    <option
                      value="preposto"
                      disabled={
                        !podeSelecionarPreposto
                      }
                    >
                      Apenas preposto
                      {!prepostoFoiDefinidoComoNecessario
                        ? " — preposto não necessário"
                        : !rascunho.preposto
                          ? " — preposto não designado"
                          : ""}
                    </option>

                    <option
                      value="advogado_preposto"
                      disabled={
                        !podeSelecionarAdvogadoPreposto
                      }
                    >
                      Advogado e preposto
                      {!possuiAdvogado
                        ? " — advogado não designado"
                        : !prepostoFoiDefinidoComoNecessario
                          ? " — preposto não necessário"
                          : !rascunho.preposto
                            ? " — preposto não designado"
                            : ""}
                    </option>
                  </select>

                  <CampoErro
                    mensagem={
                      erros
                        .contratacao_tipo
                    }
                  />

                  {rascunho
                    .necessita_preposto ===
                    false && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      Como foi definido que esta diligência não necessita de preposto, as modalidades de contratação que incluem preposto ficam indisponíveis.
                    </p>
                  )}

                  {rascunho
                    .necessita_preposto ===
                    null && (
                    <p className="mt-3 text-sm text-amber-700">
                      Para contratar preposto, defina primeiro se a diligência necessita desse profissional.
                    </p>
                  )}
                </div>
              )}

              {/* =========================================
                  FINANCEIRO ADVOGADO
              ========================================== */}

              {contratacaoExigeAdvogado && (
                <div className="rounded-lg border bg-muted/20 p-4">
                  <div>
                    <p className="text-sm font-medium">
                      Contratação do advogado
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Registre o valor e a data combinada para pagamento.
                    </p>
                  </div>

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
                          value={
                            rascunho
                              .contratacao_advogado_valor
                          }
                          disabled={
                            salvando ||
                            emAlerta
                          }
                          onChange={(
                            event
                          ) =>
                            alterarTexto(
                              "contratacao_advogado_valor",
                              event
                                .target
                                .value
                            )
                          }
                          placeholder="0,00"
                          className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-3 text-sm disabled:opacity-60"
                        />
                      </div>

                      <CampoErro
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
                        value={
                          rascunho
                            .contratacao_advogado_pagamento_combinado_em
                        }
                        disabled={
                          salvando ||
                          emAlerta
                        }
                        onChange={(
                          event
                        ) =>
                          alterarTexto(
                            "contratacao_advogado_pagamento_combinado_em",
                            event
                              .target
                              .value
                          )
                        }
                        className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm disabled:opacity-60"
                      />

                      <CampoErro
                        mensagem={
                          erros
                            .contratacao_advogado_pagamento_combinado_em
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================
                  FINANCEIRO PREPOSTO
              ========================================== */}

              {contratacaoExigePreposto && (
                <div className="rounded-lg border bg-muted/20 p-4">
                  <div>
                    <p className="text-sm font-medium">
                      Contratação do preposto
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Registre o valor e a data combinada para pagamento.
                    </p>
                  </div>

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
                          value={
                            rascunho
                              .contratacao_preposto_valor
                          }
                          disabled={
                            salvando ||
                            emAlerta
                          }
                          onChange={(
                            event
                          ) =>
                            alterarTexto(
                              "contratacao_preposto_valor",
                              event
                                .target
                                .value
                            )
                          }
                          placeholder="0,00"
                          className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-3 text-sm disabled:opacity-60"
                        />
                      </div>

                      <CampoErro
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
                        value={
                          rascunho
                            .contratacao_preposto_pagamento_combinado_em
                        }
                        disabled={
                          salvando ||
                          emAlerta
                        }
                        onChange={(
                          event
                        ) =>
                          alterarTexto(
                            "contratacao_preposto_pagamento_combinado_em",
                            event
                              .target
                              .value
                          )
                        }
                        className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm disabled:opacity-60"
                      />

                      <CampoErro
                        mensagem={
                          erros
                            .contratacao_preposto_pagamento_combinado_em
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================
                  ORIENTAÇÕES
              ========================================== */}

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={
                    rascunho
                      .orientacoes_encaminhadas
                  }
                  disabled={
                    salvando ||
                    emAlerta
                  }
                  onChange={(
                    event
                  ) => {
                    dispatch({
                      type:
                        "DEFINIR_ORIENTACOES_ENCAMINHADAS",

                      valor:
                        event.target
                          .checked,
                    });
                  }}
                  className="mt-1 h-4 w-4"
                />

                <div>
                  <p className="text-sm font-medium">
                    Orientações encaminhadas
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Marque quando as orientações necessárias já tiverem sido enviadas.
                  </p>
                </div>
              </label>
            </div>
          </section>
        </div>

        {/* =================================================
            OBSERVAÇÕES
        ================================================== */}

        <section className="rounded-xl border bg-card">
          <div className="border-b px-6 py-5">
            <h2 className="text-lg font-semibold">
              Observações
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Registre informações úteis sobre esta diligência.
            </p>
          </div>

          <div className="p-6">
            <textarea
              rows={5}
              value={
                rascunho
                  .observacoes
              }
              disabled={
                salvando ||
                emAlerta
              }
              onChange={(
                event
              ) =>
                alterarTexto(
                  "observacoes",
                  event.target
                    .value
                )
              }
              className="w-full resize-y rounded-lg border bg-background px-3 py-3 text-sm disabled:opacity-60"
            />
          </div>
        </section>

        {/* =================================================
            AÇÕES
        ================================================== */}

        <div className="flex flex-col gap-4 pb-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Antes de salvar, o Pela Ordem verificará novamente a pauta, os participantes e a consistência operacional da contratação.
          </p>

          <div className="flex items-center gap-3">
            <Link
              href={`/protected/diligencias/${diligenciaId}`}
              className="rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-muted"
            >
              Cancelar
            </Link>

            <button
              type="button"
              disabled={
                salvando ||
                emAlerta
              }
              onClick={() => {
                void executarEdicao(
                  "salvar"
                );
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0b1f3a] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {salvando ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              {salvando
                ? "Verificando..."
                : "Salvar alterações"}
            </button>
          </div>
        </div>
      </div>

      {/* =================================================
          ALERTA DE DUPLICIDADE / CONFLITO
      ================================================== */}

      {emAlerta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-amber-300 bg-amber-50 shadow-2xl">
            <div className="border-b border-amber-200 p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-700" />

                <div>
                  <h2 className="text-lg font-semibold text-amber-950">
                    Confira antes de salvar
                  </h2>

                  <p className="mt-1 text-sm text-amber-900">
                    {estadoServidor
                      .mensagem ||
                      "Encontramos informações que precisam ser conferidas antes de salvar a alteração."}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6 p-6">
              {possuiDuplicidade && (
                <div>
                  <h3 className="font-semibold text-amber-950">
                    Possível duplicidade
                  </h3>

                  <p className="mt-1 text-sm text-amber-900">
                    Já existe outra diligência presente ou futura para este processo.
                  </p>

                  <div className="mt-3 space-y-3">
                    {(
                      estadoServidor
                        .diligenciasEncontradas ??
                      []
                    ).map(
                      (
                        item
                      ) => (
                        <div
                          key={
                            item.id
                          }
                          className="rounded-lg border border-amber-200 bg-white p-4 text-sm"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <strong>
                              {formatarData(
                                item
                                  .data_diligencia
                              )}
                            </strong>

                            <strong>
                              às{" "}
                              {item
                                .horario
                                .slice(
                                  0,
                                  5
                                )}
                            </strong>
                          </div>

                          <p className="mt-2 font-medium">
                            {
                              item
                                .tipo_diligencia
                            }
                          </p>

                          <p className="mt-1">
                            Processo:{" "}
                            {formatarProcesso(
                              item
                                .numero_processo
                            )}
                          </p>

                          <p className="mt-1 text-muted-foreground">
                            {item
                              .parte_autora ||
                              "Parte autora não informada"}

                            {" × "}

                            {item
                              .parte_re ||
                              "Parte ré não informada"}
                          </p>

                          <p className="mt-1 text-muted-foreground">
                            {item.vara ||
                              "Unidade não informada"}

                            {item.comarca
                              ? ` • ${item.comarca}`
                              : ""}

                            {item.uf
                              ? `/${item.uf}`
                              : ""}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {possuiConflito && (
                <div>
                  <h3 className="font-semibold text-amber-950">
                    Possível conflito de agenda
                  </h3>

                  <p className="mt-1 text-sm text-amber-900">
                    O mesmo participante possui outra diligência no mesmo dia em intervalo inferior a 5 horas.
                  </p>

                  <div className="mt-3 space-y-3">
                    {(
                      estadoServidor
                        .conflitosAgenda ??
                      []
                    ).map(
                      (
                        conflito,
                        indice
                      ) => (
                        <div
                          key={`${conflito.participante_tipo}-${conflito.participante_id}-${indice}`}
                          className="rounded-lg border border-amber-200 bg-white p-4 text-sm"
                        >
                          <p className="font-semibold">
                            {
                              conflito
                                .participante_nome
                            }
                          </p>

                          <p className="mt-1 text-muted-foreground">
                            {
                              conflito
                                .identificacao
                            }
                          </p>

                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <div>
                              <p className="text-xs font-semibold uppercase text-amber-700">
                                Outra diligência
                              </p>

                              <p className="mt-1">
                                {formatarData(
                                  conflito
                                    .diligencia
                                    .data_diligencia
                                )}

                                {" às "}

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
                              <p className="text-xs font-semibold uppercase text-amber-700">
                                Intervalo
                              </p>

                              <p className="mt-1">
                                {formatarDiferenca(
                                  conflito
                                    .diferenca_minutos
                                )}
                              </p>
                            </div>

                            <div className="md:col-span-2">
                              <p className="text-xs font-semibold uppercase text-amber-700">
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

                            <div className="md:col-span-2">
                              <p className="text-xs font-semibold uppercase text-amber-700">
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
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {!possuiDuplicidade &&
                !possuiConflito && (
                  <p className="text-sm text-amber-900">
                    A situação da pauta foi alterada. Revise as informações antes de continuar.
                  </p>
                )}
            </div>

            <div className="border-t border-amber-200 p-6">
              <p className="mb-4 text-sm text-amber-900">
                O alerta não impede a alteração. Revise as informações ou confirme expressamente que deseja manter a edição.
              </p>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={
                    salvando
                  }
                  onClick={() => {
                    void executarEdicao(
                      "revisar"
                    );
                  }}
                  className="rounded-lg border border-amber-300 bg-white px-5 py-2.5 text-sm font-medium text-amber-950 hover:bg-amber-100 disabled:opacity-50"
                >
                  Voltar e revisar
                </button>

                <button
                  type="button"
                  disabled={
                    salvando
                  }
                  onClick={() => {
                    void executarEdicao(
                      "prosseguir"
                    );
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0b1f3a] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  {salvando && (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  )}

                  {salvando
                    ? "Salvando..."
                    : "Salvar mesmo assim"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}