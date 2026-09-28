import type {
  ErrosRascunhoDiligencia,
  RascunhoDiligencia,
} from "./tipos";

function vazio(
  valor: string
) {
  return valor.trim().length === 0;
}

function possuiValorMonetarioValido(
  valor: string
) {
  const limpo =
    valor
      .trim()
      .replace(/\s/g, "")
      .replace(/^R\$\s?/, "");

  if (!limpo) {
    return false;
  }

  const normalizado =
    limpo.includes(",")
      ? limpo
          .replace(/\./g, "")
          .replace(",", ".")
      : limpo;

  const numero =
    Number(normalizado);

  return (
    Number.isFinite(numero) &&
    numero > 0
  );
}

export function validarRascunhoDiligencia(
  rascunho: RascunhoDiligencia
): ErrosRascunhoDiligencia {
  const erros:
    ErrosRascunhoDiligencia = {};

  /*
   * ==========================================
   * IDENTIFICAÇÃO
   * ==========================================
   */

  if (
    vazio(
      rascunho.tipo_diligencia
    )
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
  vazio(
    rascunho.numero_processo
  )
) {
  erros.numero_processo =
    "Informe o número do processo.";
}

  if (
    vazio(
      rascunho.parte_autora
    )
  ) {
    erros.parte_autora =
      "Informe a parte autora.";
  }

  if (
    vazio(
      rascunho.parte_re
    )
  ) {
    erros.parte_re =
      "Informe a parte ré.";
  }

  /*
   * ==========================================
   * DATA E HORÁRIO
   * ==========================================
   */

  if (
    vazio(
      rascunho.data_diligencia
    )
  ) {
    erros.data_diligencia =
      "Informe a data da diligência.";
  }

  if (
    vazio(
      rascunho.horario
    )
  ) {
    erros.horario =
      "Informe o horário da diligência.";
  }

  /*
   * ==========================================
   * LOCAL
   * ==========================================
   */

  if (
    vazio(
      rascunho.vara
    )
  ) {
    erros.vara =
      "Informe a Vara / unidade.";
  }

  if (
    vazio(
      rascunho.comarca
    )
  ) {
    erros.comarca =
      "Informe a Comarca / cidade.";
  }

  const uf =
    rascunho.uf
      .trim()
      .toUpperCase();

  if (!uf) {
    erros.uf =
      "Informe a UF.";
  } else if (
    !/^[A-Z]{2}$/.test(uf)
  ) {
    erros.uf =
      "Informe uma UF válida com 2 letras.";
  }

  /*
   * Local/endereço específico continua
   * opcional.
   */

  /*
   * ==========================================
   * PREPOSTO
   * ==========================================
   *
   * null = pendência permitida.
   * false = não será necessário.
   * true = precisa existir preposto designado.
   */

  if (
    rascunho
      .necessita_preposto ===
      true &&
    !rascunho.preposto
  ) {
    erros.preposto =
      "Selecione o preposto que participará da diligência.";
  }

  /*
   * ==========================================
   * TESTEMUNHAS
   * ==========================================
   *
   * null = pendência permitida.
   */

  if (
    rascunho
      .testemunhas_status ===
      "confirmadas" &&
    rascunho.testemunhas
      .length === 0
  ) {
    erros.testemunhas =
      "Adicione pelo menos uma testemunha confirmada.";
  }

  /*
   * ==========================================
   * CONTRATAÇÃO
   * ==========================================
   *
   * null = pendência permitida.
   * desnecessaria = resolvida.
   * confirmada = exige tipo.
   */

  if (
    rascunho
      .contratacao_status ===
      "confirmada" &&
    !rascunho.contratacao_tipo
  ) {
    erros.contratacao_tipo =
      "Informe quais profissionais foram contratados.";
  }

  const contratacaoExigeAdvogado =
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

  const contratacaoExigePreposto =
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

  /*
   * Quando houver contratação de advogado,
   * deve existir advogado efetivamente
   * designado através da OAB.
   */

  if (
    contratacaoExigeAdvogado &&
    !rascunho.advogado
  ) {
    erros.advogado =
      "Designe o advogado responsável informando o Número da OAB.";
  }

  if (
  contratacaoExigePreposto &&
  !rascunho.preposto
) {
  erros.preposto =
    "Designe o preposto responsável informando o CPF.";
}

  /*
   * ==========================================
   * FINANCEIRO — ADVOGADO
   * ==========================================
   */

  if (
    contratacaoExigeAdvogado
  ) {
    if (
      !possuiValorMonetarioValido(
        rascunho
          .contratacao_advogado_valor
      )
    ) {
      erros
        .contratacao_advogado_valor =
        "Informe o valor da contratação do advogado.";
    }

    if (
      vazio(
        rascunho
          .contratacao_advogado_pagamento_combinado_em
      )
    ) {
      erros
        .contratacao_advogado_pagamento_combinado_em =
        "Informe a data combinada para pagamento do advogado.";
    }
  }

  /*
   * ==========================================
   * FINANCEIRO — PREPOSTO
   * ==========================================
   */

  if (
    contratacaoExigePreposto
  ) {
    if (
      !possuiValorMonetarioValido(
        rascunho
          .contratacao_preposto_valor
      )
    ) {
      erros
        .contratacao_preposto_valor =
        "Informe o valor da contratação do preposto.";
    }

    if (
      vazio(
        rascunho
          .contratacao_preposto_pagamento_combinado_em
      )
    ) {
      erros
        .contratacao_preposto_pagamento_combinado_em =
        "Informe a data combinada para pagamento do preposto.";
    }
  }

  return erros;
}

export function possuiErros(
  erros:
    ErrosRascunhoDiligencia
) {
  return (
    Object.keys(erros).length >
    0
  );
}