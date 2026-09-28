import type { RascunhoDiligencia } from "../../../nova/formulario/tipos";

import type {
  ContratacaoDetalheEdicao,
  DetalhesEdicaoDiligencia,
} from "./tipos";

function normalizarData(
  valor: string | null | undefined
) {
  if (!valor) {
    return "";
  }

  const encontrada =
    valor.match(
      /^(\d{4}-\d{2}-\d{2})/
    );

  return encontrada
    ? encontrada[1]
    : valor;
}

function normalizarHorario(
  valor: string | null | undefined
) {
  if (!valor) {
    return "";
  }

  return valor.slice(0, 5);
}

function valorParaInput(
  valor: number | null | undefined
) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return "";
  }

  return String(valor);
}

function buscarContratacao(
  contratacoes:
    | ContratacaoDetalheEdicao[]
    | null
    | undefined,
  tipo:
    | "advogado"
    | "preposto"
) {
  return (
    contratacoes?.find(
      (contratacao) =>
        contratacao.tipo_profissional ===
        tipo
    ) ?? null
  );
}

function obterTestemunhasStatus(
  detalhes: DetalhesEdicaoDiligencia
): RascunhoDiligencia["testemunhas_status"] {
  const diligencia =
    detalhes.diligencia;

  if (
    diligencia.testemunhas_status ===
      "confirmadas" ||
    diligencia.testemunhas_status ===
      "desnecessarias"
  ) {
    return diligencia.testemunhas_status;
  }

  if (
    diligencia.testemunhas_confirmadas ===
    true
  ) {
    return "confirmadas";
  }

  if (
    diligencia.testemunhas_confirmadas ===
    false
  ) {
    return "desnecessarias";
  }

  return null;
}

function obterContratacaoStatus(
  detalhes: DetalhesEdicaoDiligencia
): RascunhoDiligencia["contratacao_status"] {
  const diligencia =
    detalhes.diligencia;

  if (
    diligencia.contratacao_status ===
      "confirmada" ||
    diligencia.contratacao_status ===
      "desnecessaria"
  ) {
    return diligencia.contratacao_status;
  }

  /*
    Compatibilidade com registros antigos.

    true significa que já havia uma
    contratação confirmada.

    false não será convertido para
    "desnecessaria", porque no modelo
    antigo também podia significar que
    a situação ainda estava pendente.
  */
  if (
    diligencia.contratacao_confirmada ===
    true
  ) {
    return "confirmada";
  }

  return null;
}

function obterContratacaoTipo(
  detalhes: DetalhesEdicaoDiligencia,
  status:
    RascunhoDiligencia["contratacao_status"]
): RascunhoDiligencia["contratacao_tipo"] {
  if (status !== "confirmada") {
    return null;
  }

  const tipoSalvo =
    detalhes.diligencia
      .contratacao_tipo;

  if (
    tipoSalvo === "advogado" ||
    tipoSalvo === "preposto" ||
    tipoSalvo ===
      "advogado_preposto"
  ) {
    return tipoSalvo;
  }

  /*
    Fallback para registros que possuem
    as contratações financeiras, mas ainda
    não possuem contratacao_tipo gravado.
  */
  const possuiAdvogado =
    detalhes.contratacoes?.some(
      (contratacao) =>
        contratacao.tipo_profissional ===
        "advogado"
    ) ?? false;

  const possuiPreposto =
    detalhes.contratacoes?.some(
      (contratacao) =>
        contratacao.tipo_profissional ===
        "preposto"
    ) ?? false;

  if (
    possuiAdvogado &&
    possuiPreposto
  ) {
    return "advogado_preposto";
  }

  if (possuiAdvogado) {
    return "advogado";
  }

  if (possuiPreposto) {
    return "preposto";
  }

  return null;
}

export function criarEstadoInicialEdicao(
  detalhes: DetalhesEdicaoDiligencia
): RascunhoDiligencia {
  const diligencia =
    detalhes.diligencia;

  const contratacaoStatus =
    obterContratacaoStatus(
      detalhes
    );

  const contratacaoTipo =
    obterContratacaoTipo(
      detalhes,
      contratacaoStatus
    );

  const contratacaoAdvogado =
    buscarContratacao(
      detalhes.contratacoes,
      "advogado"
    );

  const contratacaoPreposto =
    buscarContratacao(
      detalhes.contratacoes,
      "preposto"
    );

  const testemunhasStatus =
    obterTestemunhasStatus(
      detalhes
    );

  return {
    tipo_diligencia:
      diligencia.tipo_diligencia ?? "",

    modalidade:
      diligencia.modalidade ?? "",

    numero_processo:
      diligencia.numero_processo ?? "",

    parte_autora:
      diligencia.parte_autora ?? "",

    parte_re:
      diligencia.parte_re ?? "",

    data_diligencia:
      normalizarData(
        diligencia.data_diligencia
      ),

    horario:
      normalizarHorario(
        diligencia.horario
      ),

    vara:
      diligencia.vara ?? "",

    comarca:
      diligencia.comarca ?? "",

    uf:
      (
        diligencia.uf ?? ""
      ).toUpperCase(),

    local:
      diligencia.local ?? "",

    advogado:
      detalhes.advogado ?? null,

    necessita_preposto:
      diligencia.necessita_preposto,

    preposto:
      diligencia.necessita_preposto ===
        true
        ? detalhes.preposto ?? null
        : null,

    testemunhas_status:
      testemunhasStatus,

    testemunhas:
      testemunhasStatus ===
        "confirmadas"
        ? detalhes.testemunhas ?? []
        : [],

    contratacao_status:
      contratacaoStatus,

    contratacao_tipo:
      contratacaoTipo,

    contratacao_advogado_valor:
      valorParaInput(
        contratacaoAdvogado?.valor
      ),

    contratacao_advogado_pagamento_combinado_em:
      normalizarData(
        contratacaoAdvogado
          ?.pagamento_combinado_em
      ),

    contratacao_preposto_valor:
      valorParaInput(
        contratacaoPreposto?.valor
      ),

    contratacao_preposto_pagamento_combinado_em:
      normalizarData(
        contratacaoPreposto
          ?.pagamento_combinado_em
      ),

    orientacoes_encaminhadas:
      diligencia.orientacoes_encaminhadas ===
      true,

    observacoes:
      diligencia.observacoes ?? "",
  };
}