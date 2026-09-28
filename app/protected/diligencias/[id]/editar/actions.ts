"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  redirect,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/server";

/* =====================================================
   TIPOS EXPOSTOS AO FORMULÁRIO
===================================================== */

export type DiligenciaEncontradaEdicao = {
  id: string;
  numero_processo: string | null;
  tipo_diligencia: string;
  modalidade: "presencial" | "virtual";
  data_diligencia: string;
  horario: string;
  parte_autora: string | null;
  parte_re: string | null;
  vara: string | null;
  comarca: string | null;
  uf: string | null;
  local: string | null;
};

export type ConflitoAgendaEdicao = {
  participante_tipo:
    | "advogado"
    | "preposto"
    | "testemunha";

  participante_id: string;
  participante_nome: string;
  identificacao: string;
  diferenca_minutos: number;

  diligencia:
    DiligenciaEncontradaEdicao;
};

export type EdicaoState = {
  status:
    | "inicial"
    | "alerta"
    | "revisao"
    | "erro";

  mensagem: string | null;

  diligenciasEncontradas:
    DiligenciaEncontradaEdicao[];

  conflitosAgenda:
    ConflitoAgendaEdicao[];
};

/* =====================================================
   TIPOS INTERNOS
===================================================== */

type Modalidade =
  | "presencial"
  | "virtual"
  | "";

type ContratacaoStatus =
  | "confirmada"
  | "desnecessaria"
  | null;

type ContratacaoTipo =
  | "advogado"
  | "preposto"
  | "advogado_preposto"
  | null;

type TestemunhasStatus =
  | "confirmadas"
  | "desnecessarias"
  | null;

type AcaoEdicao =
  | "salvar"
  | "revisar"
  | "prosseguir";

type ValoresEdicao = {
  diligencia_id: string;

  tipo_diligencia: string;
  modalidade: Modalidade;

  numero_processo: string;

  parte_autora: string;
  parte_re: string;

  data_diligencia: string;
  horario: string;

  vara: string;
  comarca: string;
  uf: string;
  local: string;

  correspondente_id: string;

  necessita_preposto:
    boolean | null;

  preposto_id: string;

  testemunhas_status:
    TestemunhasStatus;

  testemunha_ids:
    string[];

  contratacao_status:
    ContratacaoStatus;

  contratacao_tipo:
    ContratacaoTipo;

  contratacao_advogado_valor:
    string;

  contratacao_advogado_pagamento_combinado_em:
    string;

  contratacao_preposto_valor:
    string;

  contratacao_preposto_pagamento_combinado_em:
    string;

  orientacoes_encaminhadas:
    boolean;

  observacoes: string;
};

type ProfissionalAgenda = {
  id: string;
  nome: string;

  oab_numero?:
    string | null;

  oab_uf?:
    string | null;

  cpf?:
    string | null;
};

type TestemunhaAgenda = {
  id: string;
  nome: string;
  cpf: string | null;
};

type VinculoTestemunhaAgenda = {
  testemunha_id: string;
  diligencia_id: string;
};

type ContratacaoBanco = {
  id: string;

  tipo_profissional:
    | "advogado"
    | "preposto";

  correspondente_id:
    string | null;

  valor:
    number | null;

  pagamento_combinado_em:
    string | null;

  pago_em:
    string | null;
};

/* =====================================================
   LEITURA DO FORMDATA
===================================================== */

function lerCampo(
  formData: FormData,
  campo: string
) {
  const valor =
    formData.get(campo);

  return typeof valor ===
    "string"
      ? valor
      : "";
}

function lerBooleanNullable(
  formData: FormData,
  campo: string
): boolean | null {
  const valor =
    lerCampo(
      formData,
      campo
    );

  if (
    valor === "true"
  ) {
    return true;
  }

  if (
    valor === "false"
  ) {
    return false;
  }

  return null;
}

function lerAcao(
  formData: FormData
): AcaoEdicao {
  const acao =
    lerCampo(
      formData,
      "acao_edicao"
    );

  if (
    acao === "revisar"
  ) {
    return "revisar";
  }

  if (
    acao === "prosseguir"
  ) {
    return "prosseguir";
  }

  return "salvar";
}

/* =====================================================
   NORMALIZAÇÃO
===================================================== */

function normalizarTexto(
  valor: string
) {
  return valor
    .trim()
    .replace(
      /\s+/g,
      " "
    );
}

function normalizarProcesso(
  valor: string
) {
  return valor.replace(
    /\D/g,
    ""
  );
}

function normalizarIds(
  ids: string[]
) {
  return Array.from(
    new Set(
      ids
        .map(
          (id) =>
            id.trim()
        )
        .filter(Boolean)
    )
  );
}

function normalizarModalidade(
  valor: string
): Modalidade {
  if (
    valor === "presencial" ||
    valor === "virtual"
  ) {
    return valor;
  }

  return "";
}

function normalizarContratacaoStatus(
  formData: FormData
): ContratacaoStatus {
  const status =
    lerCampo(
      formData,
      "contratacao_status"
    );

  if (
    status === "confirmada"
  ) {
    return "confirmada";
  }

  if (
    status === "desnecessaria"
  ) {
    return "desnecessaria";
  }

  /*
    Compatibilidade temporária
    com o booleano antigo.
  */
  if (
    formData.get(
      "contratacao_confirmada"
    ) === "on"
  ) {
    return "confirmada";
  }

  return null;
}

function normalizarContratacaoTipo(
  formData: FormData,
  status:
    ContratacaoStatus
): ContratacaoTipo {
  if (
    status !== "confirmada"
  ) {
    return null;
  }

  const tipo =
    lerCampo(
      formData,
      "contratacao_tipo"
    );

  if (
    tipo === "advogado" ||
    tipo === "preposto" ||
    tipo ===
      "advogado_preposto"
  ) {
    return tipo;
  }

  return null;
}

function normalizarTestemunhasStatus(
  formData: FormData
): TestemunhasStatus {
  const status =
    lerCampo(
      formData,
      "testemunhas_status"
    );

  if (
    status === "confirmadas"
  ) {
    return "confirmadas";
  }

  if (
    status ===
      "desnecessarias" ||
    status ===
      "desnecessaria"
  ) {
    return "desnecessarias";
  }

  /*
    Compatibilidade temporária
    com o booleano antigo.
  */
  if (
    lerCampo(
      formData,
      "testemunhas_confirmadas"
    ) === "true"
  ) {
    return "confirmadas";
  }

  return null;
}

/* =====================================================
   REGRAS DE CONTRATAÇÃO
===================================================== */

function incluiAdvogado(
  tipo:
    ContratacaoTipo
) {
  return (
    tipo === "advogado" ||
    tipo ===
      "advogado_preposto"
  );
}

function incluiPreposto(
  tipo:
    ContratacaoTipo
) {
  return (
    tipo === "preposto" ||
    tipo ===
      "advogado_preposto"
  );
}

/* =====================================================
   EXTRAÇÃO INTEGRAL DO RASCUNHO
===================================================== */

function extrairValores(
  formData: FormData
): ValoresEdicao {
  const necessitaPreposto =
    lerBooleanNullable(
      formData,
      "necessita_preposto"
    );

  const testemunhasStatus =
    normalizarTestemunhasStatus(
      formData
    );

  const contratacaoStatus =
    normalizarContratacaoStatus(
      formData
    );

  const contratacaoTipo =
    normalizarContratacaoTipo(
      formData,
      contratacaoStatus
    );

  const testemunhaIds =
    testemunhasStatus ===
    "confirmadas"
      ? normalizarIds(
          formData
            .getAll(
              "testemunha_ids"
            )
            .filter(
              (
                valor
              ): valor is string =>
                typeof valor ===
                "string"
            )
        )
      : [];

  return {
    diligencia_id:
      lerCampo(
        formData,
        "diligencia_id"
      ).trim(),

    tipo_diligencia:
      normalizarTexto(
        lerCampo(
          formData,
          "tipo_diligencia"
        )
      ),

    modalidade:
      normalizarModalidade(
        lerCampo(
          formData,
          "modalidade"
        )
      ),

    numero_processo:
      normalizarProcesso(
        lerCampo(
          formData,
          "numero_processo"
        )
      ),

    parte_autora:
      normalizarTexto(
        lerCampo(
          formData,
          "parte_autora"
        )
      ),

    parte_re:
      normalizarTexto(
        lerCampo(
          formData,
          "parte_re"
        )
      ),

    data_diligencia:
      lerCampo(
        formData,
        "data_diligencia"
      )
        .trim()
        .slice(
          0,
          10
        ),

    horario:
      lerCampo(
        formData,
        "horario"
      )
        .trim()
        .slice(
          0,
          5
        ),

    vara:
      normalizarTexto(
        lerCampo(
          formData,
          "vara"
        )
      ),

    comarca:
      normalizarTexto(
        lerCampo(
          formData,
          "comarca"
        )
      ),

    uf:
      lerCampo(
        formData,
        "uf"
      )
        .trim()
        .toUpperCase(),

    local:
      normalizarTexto(
        lerCampo(
          formData,
          "local"
        )
      ),

    correspondente_id:
      lerCampo(
        formData,
        "correspondente_id"
      ).trim(),

    necessita_preposto:
      necessitaPreposto,

    preposto_id:
      necessitaPreposto ===
      true
        ? lerCampo(
            formData,
            "preposto_id"
          ).trim()
        : "",

    testemunhas_status:
      testemunhasStatus,

    testemunha_ids:
      testemunhaIds,

    contratacao_status:
      contratacaoStatus,

    contratacao_tipo:
      contratacaoTipo,

    contratacao_advogado_valor:
      contratacaoStatus ===
        "confirmada" &&
      incluiAdvogado(
        contratacaoTipo
      )
        ? lerCampo(
            formData,
            "contratacao_advogado_valor"
          ).trim()
        : "",

    contratacao_advogado_pagamento_combinado_em:
      contratacaoStatus ===
        "confirmada" &&
      incluiAdvogado(
        contratacaoTipo
      )
        ? lerCampo(
            formData,
            "contratacao_advogado_pagamento_combinado_em"
          )
            .trim()
            .slice(
              0,
              10
            )
        : "",

    contratacao_preposto_valor:
      contratacaoStatus ===
        "confirmada" &&
      incluiPreposto(
        contratacaoTipo
      )
        ? lerCampo(
            formData,
            "contratacao_preposto_valor"
          ).trim()
        : "",

    contratacao_preposto_pagamento_combinado_em:
      contratacaoStatus ===
        "confirmada" &&
      incluiPreposto(
        contratacaoTipo
      )
        ? lerCampo(
            formData,
            "contratacao_preposto_pagamento_combinado_em"
          )
            .trim()
            .slice(
              0,
              10
            )
        : "",

    orientacoes_encaminhadas:
      formData.get(
        "orientacoes_encaminhadas"
      ) === "on",

    observacoes:
      lerCampo(
        formData,
        "observacoes"
      ).trim(),
  };
}

/* =====================================================
   VALOR MONETÁRIO
===================================================== */

function converterValor(
  valor: string
): number | null {
  const texto =
    valor
      .trim()
      .replace(
        /\s/g,
        ""
      )
      .replace(
        /^R\$/i,
        ""
      );

  if (!texto) {
    return null;
  }

  const normalizado =
    texto.includes(",")
      ? texto
          .replace(
            /\./g,
            ""
          )
          .replace(
            ",",
            "."
          )
      : texto;

  const numero =
    Number(
      normalizado
    );

  return Number.isFinite(
    numero
  )
    ? numero
    : null;
}

/* =====================================================
   VALIDAÇÃO OPERACIONAL
===================================================== */

function validarValores(
  valores:
    ValoresEdicao
): string | null {
  if (
    !valores.diligencia_id
  ) {
    return "Não foi possível identificar a diligência.";
  }

  if (
    !valores.tipo_diligencia
  ) {
    return "Informe o tipo da diligência.";
  }

  if (
    !valores.modalidade
  ) {
    return "Informe a modalidade da diligência.";
  }

  if (
    !valores.numero_processo
  ) {
    return "Informe o número do processo.";
  }

  if (
    !valores.parte_autora
  ) {
    return "Informe a parte autora.";
  }

  if (
    !valores.parte_re
  ) {
    return "Informe a parte ré.";
  }

  if (
    !valores.data_diligencia
  ) {
    return "Informe a data da diligência.";
  }

  if (
    !valores.horario
  ) {
    return "Informe o horário da diligência.";
  }

  if (
    !valores.vara
  ) {
    return "Informe a vara ou unidade.";
  }

  if (
    !valores.comarca
  ) {
    return "Informe a comarca ou cidade.";
  }

  if (
    valores.uf.length !==
    2
  ) {
    return "Informe a UF com 2 letras.";
  }

  /* PREPOSTO */

  if (
    valores
      .necessita_preposto ===
      true &&
    !valores.preposto_id
  ) {
    return "A diligência necessita de preposto. Designe o profissional responsável.";
  }

  /* TESTEMUNHAS */

  if (
    valores
      .testemunhas_status ===
      "confirmadas" &&
    valores
      .testemunha_ids
      .length === 0
  ) {
    return "Adicione pelo menos uma testemunha confirmada.";
  }

  /*
    Desnecessárias é decisão válida
    e não gera pendência.
  */

  /* CONTRATAÇÃO */

  const existeProfissional =
    Boolean(
      valores
        .correspondente_id ||
      valores.preposto_id
    );

  if (
    existeProfissional &&
    valores
      .contratacao_status ===
      null
  ) {
    return "Existem profissionais designados. Informe se a contratação foi Confirmada ou Desnecessária.";
  }

  if (
    valores
      .contratacao_status ===
      "confirmada" &&
    !valores
      .contratacao_tipo
  ) {
    return "Informe quais profissionais foram contratados.";
  }

  const contratoTemAdvogado =
    incluiAdvogado(
      valores
        .contratacao_tipo
    );

  const contratoTemPreposto =
    incluiPreposto(
      valores
        .contratacao_tipo
    );

  if (
    valores
      .contratacao_status ===
      "confirmada" &&
    valores
      .correspondente_id &&
    !contratoTemAdvogado
  ) {
    return "Há advogado designado. A contratação confirmada precisa incluir o advogado.";
  }

  if (
    valores
      .contratacao_status ===
      "confirmada" &&
    contratoTemAdvogado &&
    !valores
      .correspondente_id
  ) {
    return "A contratação inclui advogado, mas nenhum advogado está designado.";
  }

  if (
    valores
      .contratacao_status ===
      "confirmada" &&
    contratoTemPreposto &&
    valores
      .necessita_preposto ===
      false
  ) {
    return "A contratação não pode incluir preposto porque foi definido que este ato não necessita de preposto.";
  }

  if (
    valores
      .contratacao_status ===
      "confirmada" &&
    contratoTemPreposto &&
    valores
      .necessita_preposto ===
      null
  ) {
    return "Defina primeiro se a diligência necessita de preposto.";
  }

  if (
    valores
      .contratacao_status ===
      "confirmada" &&
    contratoTemPreposto &&
    valores
      .necessita_preposto ===
      true &&
    !valores
      .preposto_id
  ) {
    return "A contratação inclui preposto, mas nenhum preposto está designado.";
  }

  /* FINANCEIRO ADVOGADO */

  if (
    valores
      .contratacao_status ===
      "confirmada" &&
    contratoTemAdvogado
  ) {
    const valorAdvogado =
      converterValor(
        valores
          .contratacao_advogado_valor
      );

    if (
      valorAdvogado ===
        null ||
      valorAdvogado < 0
    ) {
      return "Informe um valor válido para a contratação do advogado.";
    }

    if (
      !valores
        .contratacao_advogado_pagamento_combinado_em
    ) {
      return "Informe a data combinada para pagamento do advogado.";
    }
  }

  /* FINANCEIRO PREPOSTO */

  if (
    valores
      .contratacao_status ===
      "confirmada" &&
    contratoTemPreposto
  ) {
    const valorPreposto =
      converterValor(
        valores
          .contratacao_preposto_valor
      );

    if (
      valorPreposto ===
        null ||
      valorPreposto < 0
    ) {
      return "Informe um valor válido para a contratação do preposto.";
    }

    if (
      !valores
        .contratacao_preposto_pagamento_combinado_em
    ) {
      return "Informe a data combinada para pagamento do preposto.";
    }
  }

  return null;
}

/* =====================================================
   USUÁRIO / EMPRESA
===================================================== */

async function obterContextoUsuario() {
  const supabase:
    any =
    await createClient();

  const {
    data:
      authData,

    error:
      authError,
  } =
    await supabase
      .auth
      .getClaims();

  if (
    authError ||
    !authData
      ?.claims
      ?.sub
  ) {
    redirect(
      "/auth/login"
    );
  }

  const usuarioId =
    authData
      .claims
      .sub as string;

  const {
    data:
      membro,

    error:
      erroMembro,
  } =
    await supabase
      .from(
        "membros_empresa"
      )
      .select(
        "empresa_id"
      )
      .eq(
        "usuario_id",
        usuarioId
      )
      .eq(
        "ativo",
        true
      )
      .maybeSingle();

  if (
    erroMembro ||
    !membro
  ) {
    throw new Error(
      "Não foi possível identificar a empresa do usuário."
    );
  }

  return {
    supabase,

    usuarioId,

    empresaId:
      membro
        .empresa_id as string,
  };
}

/* =====================================================
   DILIGÊNCIA EDITÁVEL
===================================================== */

async function validarDiligenciaEditavel(
  supabase: any,
  empresaId: string,
  diligenciaId: string
) {
  const {
    data:
      diligenciaAtual,

    error,
  } =
    await supabase
      .from(
        "diligencias"
      )
      .select(
        `
          id,
          status,
          empresa_id
        `
      )
      .eq(
        "id",
        diligenciaId
      )
      .eq(
        "empresa_id",
        empresaId
      )
      .is(
        "excluida_em",
        null
      )
      .maybeSingle();

  if (error) {
    throw new Error(
      `Erro ao validar diligência: ${error.message}`
    );
  }

  if (
    !diligenciaAtual
  ) {
    throw new Error(
      "A diligência não foi encontrada ou não pertence à empresa."
    );
  }

  if (
    diligenciaAtual
      .status ===
      "cancelada"
  ) {
    throw new Error(
      "Diligências canceladas não podem ser alteradas."
    );
  }
}

/* =====================================================
   PARTICIPANTES
===================================================== */

async function validarParticipantes(
  supabase: any,
  empresaId: string,
  valores:
    ValoresEdicao
) {
  let advogado:
    ProfissionalAgenda |
    null = null;

  let preposto:
    ProfissionalAgenda |
    null = null;

  if (
    valores
      .correspondente_id
  ) {
    const {
      data:
        advogadoBanco,

      error:
        erroAdvogado,
    } =
      await supabase
        .from(
          "correspondentes"
        )
        .select(
          `
            id,
            nome,
            oab_numero,
            oab_uf,
            cpf
          `
        )
        .eq(
          "empresa_id",
          empresaId
        )
        .eq(
          "id",
          valores
            .correspondente_id
        )
        .eq(
          "tipo",
          "advogado"
        )
        .maybeSingle();

    if (
      erroAdvogado
    ) {
      throw new Error(
        `Erro ao validar advogado: ${erroAdvogado.message}`
      );
    }

    if (
      !advogadoBanco
    ) {
      throw new Error(
        "O advogado selecionado não pertence à empresa."
      );
    }

    advogado =
      advogadoBanco as
        ProfissionalAgenda;
  }

  if (
    valores
      .necessita_preposto ===
      true &&
    valores
      .preposto_id
  ) {
    const {
      data:
        prepostoBanco,

      error:
        erroPreposto,
    } =
      await supabase
        .from(
          "correspondentes"
        )
        .select(
          `
            id,
            nome,
            cpf,
            oab_numero,
            oab_uf
          `
        )
        .eq(
          "empresa_id",
          empresaId
        )
        .eq(
          "id",
          valores
            .preposto_id
        )
        .eq(
          "tipo",
          "preposto"
        )
        .maybeSingle();

    if (
      erroPreposto
    ) {
      throw new Error(
        `Erro ao validar preposto: ${erroPreposto.message}`
      );
    }

    if (
      !prepostoBanco
    ) {
      throw new Error(
        "O preposto selecionado não pertence à empresa."
      );
    }

    preposto =
      prepostoBanco as
        ProfissionalAgenda;
  }

  /* TESTEMUNHAS */

  if (
    valores
      .testemunhas_status ===
      "confirmadas" &&
    valores
      .testemunha_ids
      .length > 0
  ) {
    const {
      data:
        testemunhasBanco,

      error:
        erroTestemunhas,
    } =
      await supabase
        .from(
          "testemunhas"
        )
        .select(
          "id"
        )
        .eq(
          "empresa_id",
          empresaId
        )
        .eq(
          "ativo",
          true
        )
        .is(
          "excluida_em",
          null
        )
        .in(
          "id",
          valores
            .testemunha_ids
        );

    if (
      erroTestemunhas
    ) {
      throw new Error(
        `Erro ao validar testemunhas: ${erroTestemunhas.message}`
      );
    }

    if (
      (
        testemunhasBanco ??
        []
      ).length !==
      valores
        .testemunha_ids
        .length
    ) {
      throw new Error(
        "Uma ou mais testemunhas não pertencem à empresa ou não estão disponíveis."
      );
    }
  }

  return {
    advogado,
    preposto,
  };
}

/* =====================================================
   DATA ATUAL
===================================================== */

function hojeEmRecife() {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone:
        "America/Recife",

      year:
        "numeric",

      month:
        "2-digit",

      day:
        "2-digit",
    }
  ).format(
    new Date()
  );
}

/* =====================================================
   DUPLICIDADE DE PROCESSO
===================================================== */

async function buscarDuplicidades(
  supabase: any,
  empresaId: string,
  valores:
    ValoresEdicao
): Promise<
  DiligenciaEncontradaEdicao[]
> {
  if (
    !valores
      .numero_processo
  ) {
    return [];
  }

  const {
    data:
      registros,

    error,
  } =
    await supabase
      .from(
        "diligencias"
      )
      .select(
        `
          id,
          numero_processo,
          tipo_diligencia,
          modalidade,
          data_diligencia,
          horario,
          parte_autora,
          parte_re,
          vara,
          comarca,
          uf,
          local
        `
      )
      .eq(
        "empresa_id",
        empresaId
      )
      .eq(
        "numero_processo",
        valores
          .numero_processo
      )
      .gte(
        "data_diligencia",
        hojeEmRecife()
      )
      .neq(
        "id",
        valores
          .diligencia_id
      )
      .is(
        "excluida_em",
        null
      )
      .eq(
        "status",
        "ativa"
      )
      .order(
        "data_diligencia",
        {
          ascending:
            true,
        }
      )
      .order(
        "horario",
        {
          ascending:
            true,
        }
      );

  if (error) {
    throw new Error(
      `Erro ao verificar possível duplicidade: ${error.message}`
    );
  }

  return (
    registros ??
    []
  ) as
    DiligenciaEncontradaEdicao[];
}

/* =====================================================
   HORÁRIOS
===================================================== */

function horarioEmMinutos(
  horario: string
) {
  const [
    hora,
    minuto,
  ] =
    horario
      .slice(
        0,
        5
      )
      .split(":")
      .map(Number);

  return (
    hora * 60 +
    minuto
  );
}

function diferencaEntreHorarios(
  horarioA: string,
  horarioB: string
) {
  return Math.abs(
    horarioEmMinutos(
      horarioA
    ) -
      horarioEmMinutos(
        horarioB
      )
  );
}

function mascararCpf(
  cpf:
    string |
    null |
    undefined
) {
  if (!cpf) {
    return "CPF";
  }

  const numeros =
    cpf.replace(
      /\D/g,
      ""
    );

  if (
    numeros.length !==
    11
  ) {
    return "CPF";
  }

  return `CPF ***.***.***-${numeros.slice(
    -2
  )}`;
}

/* =====================================================
   AGENDA DE ADVOGADO / PREPOSTO
===================================================== */

async function buscarAgendaProfissional(
  supabase: any,
  empresaId: string,
  diligenciaId: string,
  data: string,

  campo:
    | "correspondente_id"
    | "preposto_id",

  participanteId: string
): Promise<
  DiligenciaEncontradaEdicao[]
> {
  const {
    data:
      agenda,

    error,
  } =
    await supabase
      .from(
        "diligencias"
      )
      .select(
        `
          id,
          numero_processo,
          tipo_diligencia,
          modalidade,
          data_diligencia,
          horario,
          parte_autora,
          parte_re,
          vara,
          comarca,
          uf,
          local
        `
      )
      .eq(
        "empresa_id",
        empresaId
      )
      .eq(
        campo,
        participanteId
      )
      .eq(
        "data_diligencia",
        data
      )
      .neq(
        "id",
        diligenciaId
      )
      .is(
        "excluida_em",
        null
      )
      .eq(
        "status",
        "ativa"
      );

  if (error) {
    throw new Error(
      `Erro ao consultar agenda: ${error.message}`
    );
  }

  return (
    agenda ??
    []
  ) as
    DiligenciaEncontradaEdicao[];
}

/* =====================================================
   CONFLITOS
===================================================== */

async function buscarConflitos(
  supabase: any,
  empresaId: string,
  valores:
    ValoresEdicao,

  advogado:
    ProfissionalAgenda |
    null,

  preposto:
    ProfissionalAgenda |
    null
): Promise<
  ConflitoAgendaEdicao[]
> {
  const conflitos:
    ConflitoAgendaEdicao[] =
      [];

  const dataAtual =
    valores
      .data_diligencia;

  const horarioAtual =
    valores.horario;

  /* ===================================================
     ADVOGADO
  =================================================== */

  if (
    advogado &&
    valores
      .correspondente_id
  ) {
    const agendaAdvogado =
      await buscarAgendaProfissional(
        supabase,
        empresaId,
        valores
          .diligencia_id,
        dataAtual,
        "correspondente_id",
        advogado.id
      );

    for (
      const diligenciaConflitante
      of agendaAdvogado
    ) {
      const diferenca =
        diferencaEntreHorarios(
          horarioAtual,
          diligenciaConflitante
            .horario
        );

      if (
        diferenca >=
        300
      ) {
        continue;
      }

      conflitos.push({
        participante_tipo:
          "advogado",

        participante_id:
          advogado.id,

        participante_nome:
          advogado.nome,

        identificacao:
          advogado
            .oab_numero
            ? `OAB/${
                advogado
                  .oab_uf ??
                ""
              } ${
                advogado
                  .oab_numero
              }`.trim()
            : "OAB não informada",

        diferenca_minutos:
          diferenca,

        diligencia:
          diligenciaConflitante,
      });
    }
  }

  /* ===================================================
     PREPOSTO
  =================================================== */

  if (
    valores
      .necessita_preposto ===
      true &&
    preposto &&
    valores.preposto_id
  ) {
    const agendaPreposto =
      await buscarAgendaProfissional(
        supabase,
        empresaId,
        valores
          .diligencia_id,
        dataAtual,
        "preposto_id",
        preposto.id
      );

    for (
      const diligenciaConflitante
      of agendaPreposto
    ) {
      const diferenca =
        diferencaEntreHorarios(
          horarioAtual,
          diligenciaConflitante
            .horario
        );

      if (
        diferenca >=
        300
      ) {
        continue;
      }

      conflitos.push({
        participante_tipo:
          "preposto",

        participante_id:
          preposto.id,

        participante_nome:
          preposto.nome,

        identificacao:
          mascararCpf(
            preposto.cpf
          ),

        diferenca_minutos:
          diferenca,

        diligencia:
          diligenciaConflitante,
      });
    }
  }

  /* ===================================================
     TESTEMUNHAS

     IMPORTANTE:
     Aqui não usamos Map.

     Isso elimina:
     - redeclaração de mapaDiligencias;
     - inferência de tipo {};
     - erro em .horario.
  =================================================== */

  if (
    valores
      .testemunhas_status ===
      "confirmadas" &&
    valores
      .testemunha_ids
      .length > 0
  ) {
    const {
      data:
        testemunhasConsulta,

      error:
        erroTestemunhas,
    } =
      await supabase
        .from(
          "testemunhas"
        )
        .select(
          `
            id,
            nome,
            cpf
          `
        )
        .eq(
          "empresa_id",
          empresaId
        )
        .in(
          "id",
          valores
            .testemunha_ids
        );

    if (
      erroTestemunhas
    ) {
      throw new Error(
        `Erro ao consultar testemunhas: ${erroTestemunhas.message}`
      );
    }

    const testemunhasAgenda =
      (
        testemunhasConsulta ??
        []
      ) as
        TestemunhaAgenda[];

    const {
      data:
        vinculosConsulta,

      error:
        erroVinculos,
    } =
      await supabase
        .from(
          "diligencias_testemunhas"
        )
        .select(
          `
            testemunha_id,
            diligencia_id
          `
        )
        .eq(
          "empresa_id",
          empresaId
        )
        .in(
          "testemunha_id",
          valores
            .testemunha_ids
        )
        .neq(
          "diligencia_id",
          valores
            .diligencia_id
        );

    if (
      erroVinculos
    ) {
      throw new Error(
        `Erro ao consultar agenda das testemunhas: ${erroVinculos.message}`
      );
    }

    const vinculosAgenda =
      (
        vinculosConsulta ??
        []
      ) as
        VinculoTestemunhaAgenda[];

    const idsDiligenciasTestemunhas:
      string[] =
      Array.from(
        new Set<string>(
          vinculosAgenda.map(
            (vinculo) =>
              vinculo
                .diligencia_id
          )
        )
      );

    if (
      idsDiligenciasTestemunhas
        .length > 0
    ) {
      const {
        data:
          diligenciasTestemunhasConsulta,

        error:
          erroDiligenciasTestemunhas,
      } =
        await supabase
          .from(
            "diligencias"
          )
          .select(
            `
              id,
              numero_processo,
              tipo_diligencia,
              modalidade,
              data_diligencia,
              horario,
              parte_autora,
              parte_re,
              vara,
              comarca,
              uf,
              local
            `
          )
          .eq(
            "empresa_id",
            empresaId
          )
          .eq(
            "data_diligencia",
            dataAtual
          )
          .neq(
            "id",
            valores
              .diligencia_id
          )
          .in(
            "id",
            idsDiligenciasTestemunhas
          )
          .is(
            "excluida_em",
            null
          )
          .eq(
            "status",
            "ativa"
          );

      if (
        erroDiligenciasTestemunhas
      ) {
        throw new Error(
          `Erro ao consultar diligências das testemunhas: ${erroDiligenciasTestemunhas.message}`
        );
      }

      const diligenciasTestemunhas =
        (
          diligenciasTestemunhasConsulta ??
          []
        ) as
          DiligenciaEncontradaEdicao[];

      for (
        const vinculo
        of vinculosAgenda
      ) {
        const testemunha =
          testemunhasAgenda.find(
            (item) =>
              item.id ===
              vinculo
                .testemunha_id
          );

        const diligenciaConflitante =
          diligenciasTestemunhas.find(
            (item) =>
              item.id ===
              vinculo
                .diligencia_id
          );

        if (
          !testemunha ||
          !diligenciaConflitante
        ) {
          continue;
        }

        const diferenca =
          diferencaEntreHorarios(
            horarioAtual,
            diligenciaConflitante
              .horario
          );

        if (
          diferenca >=
          300
        ) {
          continue;
        }

        const conflitoJaIncluido =
          conflitos.some(
            (item) =>
              item
                .participante_tipo ===
                "testemunha" &&
              item
                .participante_id ===
                testemunha.id &&
              item
                .diligencia
                .id ===
                diligenciaConflitante.id
          );

        if (
          conflitoJaIncluido
        ) {
          continue;
        }

        conflitos.push({
          participante_tipo:
            "testemunha",

          participante_id:
            testemunha.id,

          participante_nome:
            testemunha.nome,

          identificacao:
            mascararCpf(
              testemunha.cpf
            ),

          diferenca_minutos:
            diferenca,

          diligencia:
            diligenciaConflitante,
        });
      }
    }
  }

  return conflitos;
}

/* =====================================================
   ASSINATURAS DOS ALERTAS
===================================================== */

function assinaturaDuplicidades(
  diligencias:
    DiligenciaEncontradaEdicao[]
) {
  return JSON.stringify(
    diligencias
      .map(
        (item) =>
          item.id
      )
      .sort()
  );
}

function assinaturaConflitos(
  conflitos:
    ConflitoAgendaEdicao[]
) {
  return JSON.stringify(
    conflitos
      .map(
        (item) =>
          [
            item
              .participante_tipo,

            item
              .participante_id,

            item
              .diligencia
              .id,

            item
              .diferenca_minutos,
          ].join(":")
      )
      .sort()
  );
}

function mensagemAlerta(
  duplicidades:
    DiligenciaEncontradaEdicao[],

  conflitos:
    ConflitoAgendaEdicao[]
) {
  if (
    duplicidades.length >
      0 &&
    conflitos.length >
      0
  ) {
    return "Encontramos outra diligência para o mesmo processo e também possível conflito de agenda. Confira antes de salvar.";
  }

  if (
    duplicidades.length >
    0
  ) {
    return "Já existe outra diligência presente ou futura para este processo. Confira antes de salvar.";
  }

  return "Existe possível conflito de agenda para um ou mais participantes em intervalo inferior a 5 horas. Confira antes de salvar.";
}

/* =====================================================
   PAYLOAD DA DILIGÊNCIA
===================================================== */

function montarPayload(
  valores:
    ValoresEdicao,

  confirmacaoAlerta:
    Record<
      string,
      unknown
    > | null
) {
  return {
    tipo_diligencia:
      valores
        .tipo_diligencia,

    modalidade:
      valores.modalidade,

    numero_processo:
      valores
        .numero_processo,

    parte_autora:
      valores
        .parte_autora,

    parte_re:
      valores.parte_re,

    data_diligencia:
      valores
        .data_diligencia,

    horario:
      valores.horario,

    vara:
      valores.vara,

    comarca:
      valores.comarca,

    uf:
      valores.uf,

    local:
      valores.local,

    correspondente_id:
      valores
        .correspondente_id ||
      null,

    necessita_preposto:
      valores
        .necessita_preposto,

    preposto_id:
      valores
        .necessita_preposto ===
        true
        ? valores
            .preposto_id ||
          null
        : null,

    /*
      MODELO CANÔNICO
    */
    testemunhas_status:
      valores
        .testemunhas_status,

    contratacao_status:
      valores
        .contratacao_status,

    contratacao_tipo:
      valores
        .contratacao_status ===
        "confirmada"
        ? valores
            .contratacao_tipo
        : null,

    /*
      CAMPOS LEGADOS
    */
    testemunhas_confirmadas:
      valores
        .testemunhas_status ===
      "confirmadas",

    contratacao_confirmada:
      valores
        .contratacao_status ===
      "confirmada",

    orientacoes_encaminhadas:
      valores
        .orientacoes_encaminhadas,

    observacoes:
      valores
        .observacoes ||
      null,

    ...(confirmacaoAlerta
      ? {
          confirmacao_alerta:
            confirmacaoAlerta,
        }
      : {}),
  };
}

/* =====================================================
   GARANTIA DOS CAMPOS CANÔNICOS
===================================================== */

async function garantirCamposCanonicos(
  supabase: any,
  empresaId: string,
  valores:
    ValoresEdicao
) {
  const {
    data:
      registroAtualizado,

    error,
  } =
    await supabase
      .from(
        "diligencias"
      )
      .update({
        testemunhas_status:
          valores
            .testemunhas_status,

        testemunhas_confirmadas:
          valores
            .testemunhas_status ===
          "confirmadas",

        contratacao_status:
          valores
            .contratacao_status,

        contratacao_tipo:
          valores
            .contratacao_status ===
            "confirmada"
            ? valores
                .contratacao_tipo
            : null,

        contratacao_confirmada:
          valores
            .contratacao_status ===
          "confirmada",
      })
      .eq(
        "id",
        valores
          .diligencia_id
      )
      .eq(
        "empresa_id",
        empresaId
      )
      .select(
        "id"
      )
      .maybeSingle();

  if (error) {
    throw new Error(
      `Erro ao registrar tratamento da diligência: ${error.message}`
    );
  }

  if (
    !registroAtualizado
  ) {
    throw new Error(
      "Não foi possível confirmar a gravação dos estados da diligência."
    );
  }
}

/* =====================================================
   CONTRATAÇÃO / FINANCEIRO
===================================================== */

async function sincronizarContratacoes(
  supabase: any,
  empresaId: string,
  valores:
    ValoresEdicao
) {
  const {
    data:
      contratacoesConsulta,

    error:
      erroConsulta,
  } =
    await supabase
      .from(
        "diligencias_contratacoes"
      )
      .select(
        `
          id,
          tipo_profissional,
          correspondente_id,
          valor,
          pagamento_combinado_em,
          pago_em
        `
      )
      .eq(
        "empresa_id",
        empresaId
      )
      .eq(
        "diligencia_id",
        valores
          .diligencia_id
      );

  if (
    erroConsulta
  ) {
    throw new Error(
      `Erro ao consultar contratação: ${erroConsulta.message}`
    );
  }

  const contratacoesExistentes =
    (
      contratacoesConsulta ??
      []
    ) as
      ContratacaoBanco[];

  /*
    Contratação pendente ou desnecessária:
    não pode manter lançamento financeiro
    ainda não pago como contratação ativa.
  */
  if (
    valores
      .contratacao_status !==
      "confirmada"
  ) {
    const idsRemoviveis =
      contratacoesExistentes
        .filter(
          (item) =>
            !item.pago_em
        )
        .map(
          (item) =>
            item.id
        );

    if (
      idsRemoviveis.length >
      0
    ) {
      const {
        error:
          erroRemocao,
      } =
        await supabase
          .from(
            "diligencias_contratacoes"
          )
          .delete()
          .eq(
            "empresa_id",
            empresaId
          )
          .eq(
            "diligencia_id",
            valores
              .diligencia_id
          )
          .in(
            "id",
            idsRemoviveis
          );

      if (
        erroRemocao
      ) {
        throw new Error(
          `Erro ao limpar contratação anterior: ${erroRemocao.message}`
        );
      }
    }

    return;
  }

  const contratarAdvogado =
    incluiAdvogado(
      valores
        .contratacao_tipo
    );

  const contratarPreposto =
    incluiPreposto(
      valores
        .contratacao_tipo
    );

  const tiposAtivos:
    Array<
      "advogado" |
      "preposto"
    > = [];

  if (
    contratarAdvogado
  ) {
    tiposAtivos.push(
      "advogado"
    );
  }

  if (
    contratarPreposto
  ) {
    tiposAtivos.push(
      "preposto"
    );
  }

  /*
    Remove apenas lançamentos NÃO pagos
    que deixaram de integrar a contratação.
    Registro pago é histórico financeiro.
  */
  const idsAntigosRemoviveis =
    contratacoesExistentes
      .filter(
        (item) =>
          !tiposAtivos.includes(
            item
              .tipo_profissional
          ) &&
          !item.pago_em
      )
      .map(
        (item) =>
          item.id
      );

  if (
    idsAntigosRemoviveis
      .length > 0
  ) {
    const {
      error:
        erroRemocao,
    } =
      await supabase
        .from(
          "diligencias_contratacoes"
        )
        .delete()
        .eq(
          "empresa_id",
          empresaId
        )
        .eq(
          "diligencia_id",
          valores
            .diligencia_id
        )
        .in(
          "id",
          idsAntigosRemoviveis
        );

    if (
      erroRemocao
    ) {
      throw new Error(
        `Erro ao remover contratação anterior: ${erroRemocao.message}`
      );
    }
  }

  async function salvarContratacao(
    tipo:
      | "advogado"
      | "preposto",

    correspondenteId:
      string,

    valorTexto:
      string,

    pagamentoEm:
      string
  ) {
    const valor =
      converterValor(
        valorTexto
      );

    if (
      valor === null
    ) {
      throw new Error(
        `Valor inválido para contratação de ${tipo}.`
      );
    }

    const registrosDoTipo =
      contratacoesExistentes
        .filter(
          (item) =>
            item
              .tipo_profissional ===
            tipo
        );

    /*
      Preferimos atualizar registro ainda
      não pago.

      Registro pago permanece histórico.
    */
    const registroEditavel =
      registrosDoTipo.find(
        (item) =>
          !item.pago_em
      ) ??
      null;

    if (
      registroEditavel
    ) {
      const {
        error:
          erroAtualizacao,
      } =
        await supabase
          .from(
            "diligencias_contratacoes"
          )
          .update({
            correspondente_id:
              correspondenteId,

            valor,

            pagamento_combinado_em:
              pagamentoEm,
          })
          .eq(
            "id",
            registroEditavel.id
          )
          .eq(
            "empresa_id",
            empresaId
          )
          .eq(
            "diligencia_id",
            valores
              .diligencia_id
          );

      if (
        erroAtualizacao
      ) {
        throw new Error(
          `Erro ao atualizar contratação de ${tipo}: ${erroAtualizacao.message}`
        );
      }

      return;
    }

    const {
      error:
        erroInsercao,
    } =
      await supabase
        .from(
          "diligencias_contratacoes"
        )
        .insert({
          empresa_id:
            empresaId,

          diligencia_id:
            valores
              .diligencia_id,

          tipo_profissional:
            tipo,

          correspondente_id:
            correspondenteId,

          valor,

          pagamento_combinado_em:
            pagamentoEm,

          pago_em:
            null,
        });

    if (
      erroInsercao
    ) {
      throw new Error(
        `Erro ao registrar contratação de ${tipo}: ${erroInsercao.message}`
      );
    }
  }

  if (
    contratarAdvogado
  ) {
    await salvarContratacao(
      "advogado",

      valores
        .correspondente_id,

      valores
        .contratacao_advogado_valor,

      valores
        .contratacao_advogado_pagamento_combinado_em
    );
  }

  if (
    contratarPreposto
  ) {
    await salvarContratacao(
      "preposto",

      valores
        .preposto_id,

      valores
        .contratacao_preposto_valor,

      valores
        .contratacao_preposto_pagamento_combinado_em
    );
  }
}

/* =====================================================
   AUDITORIA
===================================================== */

async function registrarAuditoriaEdicao(
  supabase: any,
  empresaId: string,
  usuarioId: string,
  valores:
    ValoresEdicao,

  contexto:
    Record<
      string,
      unknown
    >
) {
  const snapshot = {
    diligencia_id:
      valores
        .diligencia_id,

    tipo_diligencia:
      valores
        .tipo_diligencia,

    modalidade:
      valores.modalidade,

    numero_processo:
      valores
        .numero_processo,

    parte_autora:
      valores
        .parte_autora,

    parte_re:
      valores.parte_re,

    data_diligencia:
      valores
        .data_diligencia,

    horario:
      valores.horario,

    vara:
      valores.vara,

    comarca:
      valores.comarca,

    uf:
      valores.uf,

    local:
      valores.local,

    correspondente_id:
      valores
        .correspondente_id ||
      null,

    necessita_preposto:
      valores
        .necessita_preposto,

    preposto_id:
      valores
        .preposto_id ||
      null,

    testemunhas_status:
      valores
        .testemunhas_status,

    testemunha_ids:
      valores
        .testemunha_ids,

    contratacao_status:
      valores
        .contratacao_status,

    contratacao_tipo:
      valores
        .contratacao_tipo,

    orientacoes_encaminhadas:
      valores
        .orientacoes_encaminhadas,

    observacoes:
      valores
        .observacoes ||
      null,
  };

  /*
    Mantemos a RPC de auditoria atualmente
    disponível no projeto.

    A falha de auditoria é registrada no
    servidor, mas não faz o sistema dizer
    que a edição falhou depois de os dados
    já terem sido gravados.
  */
  const {
    error,
  } =
    await supabase.rpc(
      "registrar_evento_cadastro_diligencia",
      {
        p_empresa_id:
          empresaId,

        p_acao:
          "DILIGENCIA_EDITADA",

        p_diligencia:
          snapshot,

        p_contexto: {
          origem:
            "EDICAO_DILIGENCIA",

          usuario_id:
            usuarioId,

          ...contexto,
        },
      }
    );

  if (error) {
    console.error(
      "Falha ao registrar auditoria da edição:",
      error
    );
  }
}

/* =====================================================
   PERSISTÊNCIA
===================================================== */

async function persistirEdicao(
  supabase: any,
  empresaId: string,
  usuarioId: string,
  valores:
    ValoresEdicao,

  duplicidades:
    DiligenciaEncontradaEdicao[],

  conflitos:
    ConflitoAgendaEdicao[],

  confirmouAlertas:
    boolean
) {
  const confirmacaoAlerta =
    confirmouAlertas &&
    (
      duplicidades.length >
        0 ||
      conflitos.length >
        0
    )
      ? {
          confirmado:
            true,

          usuario_id:
            usuarioId,

          confirmado_em:
            new Date()
              .toISOString(),

          possivel_duplicidade:
            duplicidades.map(
              (item) =>
                item.id
            ),

          conflitos_agenda:
            conflitos.map(
              (item) => ({
                participante_tipo:
                  item
                    .participante_tipo,

                participante_id:
                  item
                    .participante_id,

                diligencia_id:
                  item
                    .diligencia
                    .id,

                diferenca_minutos:
                  item
                    .diferenca_minutos,
              })
            ),
        }
      : null;

  const payload =
    montarPayload(
      valores,
      confirmacaoAlerta
    );

  /*
    Atualização principal + vínculos
    de testemunhas.
  */
  const {
    error:
      erroRpc,
  } =
    await supabase.rpc(
      "atualizar_diligencia_com_participantes",
      {
        p_diligencia_id:
          valores
            .diligencia_id,

        p_empresa_id:
          empresaId,

        p_diligencia:
          payload,

        p_testemunha_ids:
          valores
            .testemunha_ids,
      }
    );

  if (
    erroRpc
  ) {
    throw new Error(
      `Erro ao atualizar diligência: ${erroRpc.message}`
    );
  }

  /*
    Garantia explícita dos campos novos.

    Isso protege o Pela Ordem enquanto
    a RPC ainda convive com campos legados.
  */
  await garantirCamposCanonicos(
    supabase,
    empresaId,
    valores
  );

  /*
    Dados financeiros.
  */
  await sincronizarContratacoes(
    supabase,
    empresaId,
    valores
  );

  /*
    Auditoria.
  */
  await registrarAuditoriaEdicao(
    supabase,
    empresaId,
    usuarioId,
    valores,
    {
      confirmado_apesar_alertas:
        confirmouAlertas,

      duplicidades:
        duplicidades.map(
          (item) =>
            item.id
        ),

      conflitos:
        conflitos.map(
          (item) => ({
            participante_tipo:
              item
                .participante_tipo,

            participante_id:
              item
                .participante_id,

            diligencia_id:
              item
                .diligencia
                .id,

            diferenca_minutos:
              item
                .diferenca_minutos,
          })
        ),
    }
  );
}

/* =====================================================
   REVALIDAÇÃO
===================================================== */

function revalidarPaginas(
  diligenciaId:
    string
) {
  revalidatePath(
    "/protected"
  );

  revalidatePath(
    "/protected/diligencias"
  );

  revalidatePath(
    `/protected/diligencias/${diligenciaId}`
  );

  revalidatePath(
    `/protected/diligencias/${diligenciaId}/editar`
  );

  revalidatePath(
    "/protected/pendencias"
  );

  revalidatePath(
    "/protected/correspondentes"
  );
}

/* =====================================================
   ACTION PRINCIPAL
===================================================== */

export async function editarDiligencia(
  estadoAnterior:
    EdicaoState,

  formData:
    FormData
): Promise<
  EdicaoState
> {
  const acao =
    lerAcao(
      formData
    );

  /* ===================================================
     VOLTAR E REVISAR

     Não persiste nada.
     O reducer do cliente mantém o rascunho.
  =================================================== */

  if (
    acao === "revisar"
  ) {
    return {
      status:
        "revisao",

      mensagem:
        "Revise os dados e salve novamente quando desejar.",

      diligenciasEncontradas:
        [],

      conflitosAgenda:
        [],
    };
  }

  const {
    supabase,
    usuarioId,
    empresaId,
  } =
    await obterContextoUsuario();

  /*
    Sempre extraímos novamente o FormData
    atual.

    Isso é essencial no fluxo:
    ALERTA -> SALVAR MESMO ASSIM.

    Nenhum snapshot antigo substitui
    as escolhas atuais do controller.
  */
  const valores =
    extrairValores(
      formData
    );

  const erroValidacao =
    validarValores(
      valores
    );

  if (
    erroValidacao
  ) {
    return {
      status:
        "erro",

      mensagem:
        erroValidacao,

      diligenciasEncontradas:
        [],

      conflitosAgenda:
        [],
    };
  }

  await validarDiligenciaEditavel(
    supabase,
    empresaId,
    valores
      .diligencia_id
  );

  const {
    advogado,
    preposto,
  } =
    await validarParticipantes(
      supabase,
      empresaId,
      valores
    );

  /*
    Alertas sempre são recalculados
    usando o rascunho atual.
  */
  const [
    duplicidadesAtuais,
    conflitosAtuais,
  ] =
    await Promise.all([
      buscarDuplicidades(
        supabase,
        empresaId,
        valores
      ),

      buscarConflitos(
        supabase,
        empresaId,
        valores,
        advogado,
        preposto
      ),
    ]);

  const existemAlertas =
    duplicidadesAtuais
      .length > 0 ||
    conflitosAtuais
      .length > 0;

  /* ===================================================
     PRIMEIRO SALVAMENTO COM ALERTA
  =================================================== */

  if (
    acao === "salvar" &&
    existemAlertas
  ) {
    return {
      status:
        "alerta",

      mensagem:
        mensagemAlerta(
          duplicidadesAtuais,
          conflitosAtuais
        ),

      diligenciasEncontradas:
        duplicidadesAtuais,

      conflitosAgenda:
        conflitosAtuais,
    };
  }

  /* ===================================================
     SALVAR MESMO ASSIM
  =================================================== */

  if (
    acao === "prosseguir"
  ) {
    const duplicidadesAnteriores =
      estadoAnterior
        .diligenciasEncontradas ??
      [];

    const conflitosAnteriores =
      estadoAnterior
        .conflitosAgenda ??
      [];

    const haviaAlertaAnterior =
      duplicidadesAnteriores
        .length > 0 ||
      conflitosAnteriores
        .length > 0;

    /*
      Nunca aceitamos confirmação cega
      de alerta que o usuário não viu.
    */
    if (
      !haviaAlertaAnterior &&
      existemAlertas
    ) {
      return {
        status:
          "alerta",

        mensagem:
          mensagemAlerta(
            duplicidadesAtuais,
            conflitosAtuais
          ),

        diligenciasEncontradas:
          duplicidadesAtuais,

        conflitosAgenda:
          conflitosAtuais,
      };
    }

    if (
      haviaAlertaAnterior
    ) {
      const mudouDuplicidade =
        assinaturaDuplicidades(
          duplicidadesAnteriores
        ) !==
        assinaturaDuplicidades(
          duplicidadesAtuais
        );

      const mudouConflito =
        assinaturaConflitos(
          conflitosAnteriores
        ) !==
        assinaturaConflitos(
          conflitosAtuais
        );

      /*
        Se a pauta mudou depois que o
        controller visualizou o alerta,
        ele precisa ver o cenário novo.
      */
      if (
        mudouDuplicidade ||
        mudouConflito
      ) {
        return {
          status:
            "alerta",

          mensagem:
            "A pauta mudou enquanto o alerta era analisado. Confira novamente antes de confirmar a edição.",

          diligenciasEncontradas:
            duplicidadesAtuais,

          conflitosAgenda:
            conflitosAtuais,
        };
      }
    }

    await persistirEdicao(
      supabase,
      empresaId,
      usuarioId,
      valores,
      duplicidadesAtuais,
      conflitosAtuais,
      true
    );

    revalidarPaginas(
      valores
        .diligencia_id
    );

    redirect(
      `/protected/diligencias/${valores.diligencia_id}`
    );
  }

  /* ===================================================
     SALVAMENTO NORMAL
  =================================================== */

  await persistirEdicao(
    supabase,
    empresaId,
    usuarioId,
    valores,
    duplicidadesAtuais,
    conflitosAtuais,
    false
  );

  revalidarPaginas(
    valores
      .diligencia_id
  );

  redirect(
    `/protected/diligencias/${valores.diligencia_id}`
  );
}