"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  assinaturaConflitosAgenda,
  buscarConflitosAgenda,
  type ConflitoAgenda,
} from "./conflitos-agenda";

export type ModalidadeDiligencia =
  | "presencial"
  | "virtual"
  | "";

export type DiligenciaExistente = {
  id: string;
  tipo_diligencia: string;
  modalidade: "presencial" | "virtual";
  numero_processo: string | null;
  parte_autora: string | null;
  parte_re: string | null;
  data_diligencia: string;
  horario: string;
  vara: string | null;
  comarca: string | null;
  uf: string | null;
  local: string | null;
};

export type ValoresDiligencia = {
  tipo_diligencia: string;
  modalidade: ModalidadeDiligencia;
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
    | boolean
    | null;

  preposto_id: string;

 testemunhas_status:
  | "confirmadas"
  | "desnecessarias"
  | null;

testemunhas_confirmadas:
  | boolean
  | null;

testemunha_ids: string[];

 contratacao_status:
  | "confirmada"
  | "desnecessaria"
  | null;

contratacao_tipo:
  | "advogado"
  | "preposto"
  | "advogado_preposto"
  | null;

/*
  Campo legado mantido temporariamente
  para compatibilidade com a estrutura
  atual do cadastro.
*/
contratacao_confirmada: boolean;

contratacao_advogado_valor: string;
contratacao_advogado_pagamento_combinado_em: string;

contratacao_preposto_valor: string;
contratacao_preposto_pagamento_combinado_em: string;
orientacoes_encaminhadas: boolean;

  observacoes: string;
};

export type CadastroState = {
  status:
    | "inicial"
    | "alerta"
    | "revisao"
    | "erro";

  mensagem: string | null;

  valores:
    ValoresDiligencia | null;

  diligenciasEncontradas:
    DiligenciaExistente[];

  conflitosAgenda?: ConflitoAgenda[];
};

function lerCampo(
  formData: FormData,
  campo: string
) {
  const valor =
    formData.get(campo);

  return typeof valor === "string"
    ? valor
    : "";
}

function lerBooleanObrigatorio(
  formData: FormData,
  campo: string
): boolean | null {
  const valor =
    lerCampo(
      formData,
      campo
    );

  if (valor === "true") {
    return true;
  }

  if (valor === "false") {
    return false;
  }

  return null;
}

function normalizarTexto(
  valor: string
) {
  return valor
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function normalizarProcesso(
  valor: string
) {
  return valor.replace(
    /\D/g,
    ""
  );
}

function converterValorMonetario(
  valor: string
): number | null {
  const texto = valor
    .trim()
    .replace(/^R\$\s*/i, "")
    .replace(/\s+/g, "");

  if (!texto) {
    return null;
  }

  let normalizado = "";

  // Formato brasileiro:
  // 1.250,50
  // 1250,50
  if (texto.includes(",")) {
    const formatoValido =
      /^\d{1,3}(\.\d{3})*(,\d{1,2})?$/.test(
        texto
      ) ||
      /^\d+(,\d{1,2})?$/.test(
        texto
      );

    if (!formatoValido) {
      return Number.NaN;
    }

    normalizado = texto
      .replace(/\./g, "")
      .replace(",", ".");
  } else {
    // Ex.: 1.250 -> 1250
    if (
      /^\d{1,3}(\.\d{3})+$/.test(
        texto
      )
    ) {
      normalizado =
        texto.replace(/\./g, "");
    }
    // Também aceita 1250.50
    else if (
      /^\d+(\.\d{1,2})?$/.test(
        texto
      )
    ) {
      normalizado = texto;
    } else {
      return Number.NaN;
    }
  }

  const numero =
    Number(normalizado);

  if (
    !Number.isFinite(numero) ||
    numero < 0
  ) {
    return Number.NaN;
  }

  return numero;
}

function normalizarModalidade(
  valor: string
): ModalidadeDiligencia {
  const modalidade =
    valor
      .trim()
      .toLowerCase();

  if (
    modalidade === "presencial" ||
    modalidade === "virtual"
  ) {
    return modalidade;
  }

  return "";
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

function normalizarObjeto(
  valores: ValoresDiligencia
): ValoresDiligencia {
  const necessitaPreposto =
    valores.necessita_preposto;

 const testemunhasStatus =
  valores.testemunhas_status;

const testemunhasConfirmadas =
  testemunhasStatus === "confirmadas"
    ? true
    : testemunhasStatus === "desnecessarias"
      ? false
      : null;

  const contratacaoStatus =
  valores.contratacao_status;

const contratacaoTipo =
  contratacaoStatus === "confirmada"
    ? valores.contratacao_tipo
    : null;  

  return {
    ...valores,

    tipo_diligencia:
      normalizarTexto(
        valores.tipo_diligencia
      ),

    modalidade:
      normalizarModalidade(
        valores.modalidade
      ),

    numero_processo:
      normalizarProcesso(
        valores.numero_processo
      ),

    parte_autora:
      normalizarTexto(
        valores.parte_autora
      ),

    parte_re:
      normalizarTexto(
        valores.parte_re
      ),

    data_diligencia:
      valores.data_diligencia.trim(),

    horario:
      valores.horario
        .trim()
        .slice(0, 5),

    vara:
      normalizarTexto(
        valores.vara
      ),

    comarca:
      normalizarTexto(
        valores.comarca
      ),

    uf:
      normalizarTexto(
        valores.uf
      ),

    local:
      normalizarTexto(
        valores.local
      ),

    correspondente_id:
      valores
        .correspondente_id
        .trim(),

    necessita_preposto:
      necessitaPreposto,

    /*
      Se o usuário informou que NÃO
      precisa de preposto, qualquer ID
      anterior é eliminado.
    */
    preposto_id:
      necessitaPreposto === true
        ? valores.preposto_id.trim()
        : "",

    testemunhas_status:
    testemunhasStatus,

  testemunhas_confirmadas:
    testemunhasConfirmadas,

    /*
      Mesma proteção para testemunhas.
    */
   testemunha_ids:
  testemunhasStatus === "confirmadas"
    ? normalizarIds(
        valores.testemunha_ids
      )
    : [],

contratacao_status:
  contratacaoStatus,

contratacao_tipo:
  contratacaoTipo,

contratacao_confirmada:
  contratacaoStatus === "confirmada",

contratacao_advogado_valor:
  contratacaoTipo === "advogado" ||
  contratacaoTipo === "advogado_preposto"
    ? valores.contratacao_advogado_valor.trim()
    : "",

contratacao_advogado_pagamento_combinado_em:
  contratacaoTipo === "advogado" ||
  contratacaoTipo === "advogado_preposto"
    ? valores
        .contratacao_advogado_pagamento_combinado_em
        .trim()
    : "",

contratacao_preposto_valor:
  contratacaoTipo === "preposto" ||
  contratacaoTipo === "advogado_preposto"
    ? valores.contratacao_preposto_valor.trim()
    : "",

contratacao_preposto_pagamento_combinado_em:
  contratacaoTipo === "preposto" ||
  contratacaoTipo === "advogado_preposto"
    ? valores
        .contratacao_preposto_pagamento_combinado_em
        .trim()
    : "",

observacoes:
  normalizarTexto(
    valores.observacoes
  ),
  };
}

function extrairFormulario(
  formData: FormData
): ValoresDiligencia {
  const testemunhaIds =
    formData
      .getAll(
        "testemunha_ids"
      )
      .filter(
        (
          valor
        ): valor is string =>
          typeof valor === "string"
      );

  return normalizarObjeto({
  tipo_diligencia:
    lerCampo(
      formData,
      "tipo_diligencia"
    ),

  modalidade:
    normalizarModalidade(
      lerCampo(
        formData,
        "modalidade"
      )
    ),

  numero_processo:
    lerCampo(
      formData,
      "numero_processo"
    ),

  parte_autora:
    lerCampo(
      formData,
      "parte_autora"
    ),

  parte_re:
    lerCampo(
      formData,
      "parte_re"
    ),

  data_diligencia:
    lerCampo(
      formData,
      "data_diligencia"
    ),

  horario:
    lerCampo(
      formData,
      "horario"
    ),

  vara:
    lerCampo(
      formData,
      "vara"
    ),

  comarca:
    lerCampo(
      formData,
      "comarca"
    ),

  uf:
    lerCampo(
      formData,
      "uf"
    ),

  local:
    lerCampo(
      formData,
      "local"
    ),

  correspondente_id:
    lerCampo(
      formData,
      "correspondente_id"
    ),

  necessita_preposto:
    lerBooleanObrigatorio(
      formData,
      "necessita_preposto"
    ),

  preposto_id:
    lerCampo(
      formData,
      "preposto_id"
    ),

    testemunhas_status: (() => {
  const valor =
    lerCampo(
      formData,
      "testemunhas_status"
    );

  if (
    valor === "confirmadas" ||
    valor === "desnecessarias"
  ) {
    return valor;
  }

  return null;
})(),

  testemunhas_confirmadas:
    lerBooleanObrigatorio(
      formData,
      "testemunhas_confirmadas"
    ),

  testemunha_ids:
    testemunhaIds,

  contratacao_status: (() => {
    const valor =
      lerCampo(
        formData,
        "contratacao_status"
      );

    if (
      valor === "confirmada" ||
      valor === "desnecessaria"
    ) {
      return valor;
    }

    return null;
  })(),

  contratacao_tipo: (() => {
    const valor =
      lerCampo(
        formData,
        "contratacao_tipo"
      );

    if (
      valor === "advogado" ||
      valor === "preposto" ||
      valor === "advogado_preposto"
    ) {
      return valor;
    }

    return null;
  })(),

  contratacao_confirmada:
    lerCampo(
      formData,
      "contratacao_status"
    ) === "confirmada",

  contratacao_advogado_valor:
    lerCampo(
      formData,
      "contratacao_advogado_valor"
    ),

  contratacao_advogado_pagamento_combinado_em:
    lerCampo(
      formData,
      "contratacao_advogado_pagamento_combinado_em"
    ),

  contratacao_preposto_valor:
    lerCampo(
      formData,
      "contratacao_preposto_valor"
    ),

  contratacao_preposto_pagamento_combinado_em:
    lerCampo(
      formData,
      "contratacao_preposto_pagamento_combinado_em"
    ),

  orientacoes_encaminhadas:
    formData.get(
      "orientacoes_encaminhadas"
    ) === "on",

  observacoes:
    lerCampo(
      formData,
      "observacoes"
    ),
});
}

function valorMonetarioPositivo(
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

function validarObrigatorios(
  valores: ValoresDiligencia
) {
  /*
   * ========================================
   * CAMPOS SEMPRE OBRIGATÓRIOS
   * ========================================
   */

  if (
    !valores.tipo_diligencia
  ) {
    return "Informe o tipo da diligência.";
  }

  if (
    !valores.modalidade
  ) {
    return "Informe se a diligência é presencial ou virtual.";
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
    return "Informe a Vara / unidade.";
  }

  if (
    !valores.comarca
  ) {
    return "Informe a Comarca / cidade.";
  }

  if (
    !valores.uf
  ) {
    return "Informe a UF.";
  }

  if (
    !/^[A-Z]{2}$/.test(
      valores.uf
    )
  ) {
    return "Informe uma UF válida com 2 letras.";
  }

  /*
   * ========================================
   * PREPOSTO
   * ========================================
   *
   * null = pendência permitida.
   * false = resolvido sem preposto.
   * true = exige preposto designado.
   */

  if (
    valores.necessita_preposto ===
      true &&
    !valores.preposto_id
  ) {
    return "Busque ou cadastre o preposto que participará da diligência.";
  }

  /*
   * ========================================
   * TESTEMUNHAS
   * ========================================
   *
   * null = pendência permitida.
   */

  if (
    valores
      .testemunhas_confirmadas ===
      true &&
    valores.testemunha_ids
      .length === 0
  ) {
    return "Adicione pelo menos uma testemunha confirmada.";
  }

  /*
   * ========================================
   * CONTRATAÇÃO
   * ========================================
   *
   * null = pendência permitida.
   * desnecessaria = resolvida.
   * confirmada = exige tipo.
   */

  if (
    valores
      .contratacao_status ===
      "confirmada" &&
    !valores.contratacao_tipo
  ) {
    return "Informe quais profissionais foram contratados.";
  }

  const contratacaoExigeAdvogado =
    valores
      .contratacao_status ===
      "confirmada" &&
    (
      valores
        .contratacao_tipo ===
        "advogado" ||
      valores
        .contratacao_tipo ===
        "advogado_preposto"
    );

  const contratacaoExigePreposto =
    valores
      .contratacao_status ===
      "confirmada" &&
    (
      valores
        .contratacao_tipo ===
        "preposto" ||
      valores
        .contratacao_tipo ===
        "advogado_preposto"
    );

  /*
   * Contratação de advogado exige
   * advogado efetivamente designado.
   */

  if (
    contratacaoExigeAdvogado &&
    !valores.correspondente_id
  ) {
    return "Designe o advogado responsável informando o Número da OAB.";
  }

  if (
  contratacaoExigePreposto &&
  !valores.preposto_id
) {
  return "Designe o preposto responsável informando o CPF.";
}

  /*
   * ========================================
   * FINANCEIRO — ADVOGADO
   * ========================================
   */

  if (
    contratacaoExigeAdvogado
  ) {
    if (
      !valorMonetarioPositivo(
        valores
          .contratacao_advogado_valor
      )
    ) {
      return "Informe o valor da contratação do advogado.";
    }

    if (
      !valores
        .contratacao_advogado_pagamento_combinado_em
    ) {
      return "Informe a data combinada para pagamento do advogado.";
    }
  }

  /*
   * ========================================
   * FINANCEIRO — PREPOSTO
   * ========================================
   */

  if (
    contratacaoExigePreposto
  ) {
    if (
      !valorMonetarioPositivo(
        valores
          .contratacao_preposto_valor
      )
    ) {
      return "Informe o valor da contratação do preposto.";
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

async function obterEmpresaUsuario() {
  const supabase =
    await createClient();

  const {
    data: authData,
    error: authError,
  } =
    await supabase.auth.getClaims();

  if (
    authError ||
    !authData?.claims?.sub
  ) {
    redirect(
      "/auth/login"
    );
  }

  const usuarioId =
    authData.claims.sub;

  const {
    data: membro,
    error: erroMembro,
  } = await supabase
    .from("membros_empresa")
    .select("empresa_id")
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
      membro.empresa_id,
  };
}

async function montarSnapshot(
  supabase: any,
  empresaId: string,
  valores: ValoresDiligencia
) {
  let advogado = null;
  let preposto = null;

  let testemunhas:
    {
      id: string;
      nome: string;
      cpf: string;
    }[] = [];

  if (
    valores.correspondente_id
  ) {
    const {
      data,
      error,
    } = await supabase
      .from(
        "correspondentes"
      )
      .select(`
        id,
        nome,
        tipo,
        oab_numero,
        oab_uf
      `)
      .eq(
        "id",
        valores.correspondente_id
      )
      .eq(
        "empresa_id",
        empresaId
      )
      .eq(
        "tipo",
        "advogado"
      )
      .maybeSingle();

    if (error) {
      throw new Error(
        `Erro ao identificar advogado: ${error.message}`
      );
    }

    if (!data) {
      throw new Error(
        "O advogado selecionado não pertence à empresa."
      );
    }

    advogado = data;
  }

  if (
    valores.necessita_preposto &&
    valores.preposto_id
  ) {
    const {
      data,
      error,
    } = await supabase
      .from(
        "correspondentes"
      )
      .select(`
        id,
        nome,
        tipo,
        cpf
      `)
      .eq(
        "id",
        valores.preposto_id
      )
      .eq(
        "empresa_id",
        empresaId
      )
      .eq(
        "tipo",
        "preposto"
      )
      .maybeSingle();

    if (error) {
      throw new Error(
        `Erro ao identificar preposto: ${error.message}`
      );
    }

    if (!data) {
      throw new Error(
        "O preposto selecionado não pertence à empresa."
      );
    }

    preposto = data;
  }

  if (
    valores
      .testemunhas_confirmadas &&
    valores.testemunha_ids
      .length > 0
  ) {
    const {
      data,
      error,
    } = await supabase
      .from("testemunhas")
      .select(`
        id,
        nome,
        cpf
      `)
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
        valores.testemunha_ids
      );

    if (error) {
      throw new Error(
        `Erro ao identificar testemunhas: ${error.message}`
      );
    }

    testemunhas =
      data ?? [];

    if (
      testemunhas.length !==
      valores.testemunha_ids
        .length
    ) {
      throw new Error(
        "Uma ou mais testemunhas informadas não pertencem à empresa ou não estão ativas."
      );
    }
  }

  return {
    numero_processo:
      valores.numero_processo ||
      null,

    tipo_diligencia:
      valores.tipo_diligencia,

    modalidade:
      valores.modalidade,

    data_diligencia:
      valores.data_diligencia,

    horario:
      valores.horario,

    parte_autora:
      valores.parte_autora ||
      null,

    parte_re:
      valores.parte_re ||
      null,

    vara:
      valores.vara ||
      null,

    comarca:
      valores.comarca ||
      null,

    uf:
      valores.uf ||
      null,

    local:
      valores.local ||
      null,

    advogado,

    necessita_preposto:
      valores.necessita_preposto,

    preposto,

    testemunhas_confirmadas:
      valores
        .testemunhas_confirmadas,

    testemunhas,

    contratacao_confirmada:
      valores
        .contratacao_confirmada,

    orientacoes_encaminhadas:
      valores
        .orientacoes_encaminhadas,

    observacoes:
      valores.observacoes ||
      null,
  };
}

async function registrarEvento(
  supabase: any,
  empresaId: string,
  acao: string,
  snapshot:
    Record<string, unknown>,
  contexto:
    Record<string, unknown> = {}
) {
  const {
    error,
  } = await supabase.rpc(
    "registrar_evento_cadastro_diligencia",
    {
      p_empresa_id:
        empresaId,

      p_acao:
        acao,

      p_diligencia:
        snapshot,

      p_contexto:
        contexto,
    }
  );

  if (error) {
    throw new Error(
      `Não foi possível registrar a auditoria: ${error.message}`
    );
  }
}

function hojeEmRecife() {
  const partes =
    new Intl.DateTimeFormat(
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
    ).formatToParts(
      new Date()
    );

  const ano =
    partes.find(
      (parte) =>
        parte.type ===
        "year"
    )?.value;

  const mes =
    partes.find(
      (parte) =>
        parte.type ===
        "month"
    )?.value;

  const dia =
    partes.find(
      (parte) =>
        parte.type ===
        "day"
    )?.value;

  return `${ano}-${mes}-${dia}`;
}

/*
  ALERTA PREVENTIVO:

  mesmo número de processo +
  diligência de hoje ou futura.

  Tipo, data específica, horário e
  modalidade não afastam o alerta.
*/
async function buscarDiligenciasDoProcesso(
  supabase: any,
  empresaId: string,
  numeroProcesso: string
): Promise<
  DiligenciaExistente[]
> {
  if (
    !numeroProcesso
  ) {
    return [];
  }

  const hoje =
    hojeEmRecife();

  const {
    data,
    error,
  } = await supabase
    .from("diligencias")
    .select(`
      id,
      tipo_diligencia,
      modalidade,
      numero_processo,
      parte_autora,
      parte_re,
      data_diligencia,
      horario,
      vara,
      comarca,
      uf,
      local
    `)
    .eq(
      "empresa_id",
      empresaId
    )
    .eq(
      "numero_processo",
      numeroProcesso
    )
    .gte(
      "data_diligencia",
      hoje
    )
    .is(
      "excluida_em",
      null
    )
    .neq(
      "status",
      "cancelada"
    )
    .order(
      "data_diligencia",
      {
        ascending: true,
      }
    )
    .order(
      "horario",
      {
        ascending: true,
      }
    );

  if (error) {
    throw new Error(
      `Erro ao verificar diligências do processo: ${error.message}`
    );
  }

  return (
    data ?? []
  ) as DiligenciaExistente[];
}

function assinaturaDiligencias(
  diligencias:
    DiligenciaExistente[]
) {
  return JSON.stringify(
    diligencias
      .map(
        (diligencia) =>
          diligencia.id
      )
      .sort()
  );
}

/*
  Agora a criação usa a função
  transacional do banco.

  A diligência e todos os vínculos
  das testemunhas são criados em
  uma única operação.
*/
async function inserirDiligencia(
  supabase: any,
  empresaId: string,
  valores: ValoresDiligencia,
  confirmacaoAlerta:
    | Record<string, unknown>
    | null
) {

const valorAdvogado =
  converterValorMonetario(
    valores.contratacao_advogado_valor
  );

const valorPreposto =
  converterValorMonetario(
    valores.contratacao_preposto_valor
  );

  const diligencia = {
    tipo_diligencia:
      valores.tipo_diligencia,

    modalidade:
      valores.modalidade,

    numero_processo:
      valores.numero_processo,

    parte_autora:
      valores.parte_autora,

    parte_re:
      valores.parte_re,

    data_diligencia:
      valores.data_diligencia,

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
      valores.correspondente_id,

    necessita_preposto:
      valores.necessita_preposto,

    preposto_id:
  valores.preposto_id,

testemunhas_confirmadas:
  valores
    .testemunhas_confirmadas,

contratacao_status:
  valores.contratacao_status,

contratacao_tipo:
  valores.contratacao_tipo,

contratacao_confirmada:
  valores
    .contratacao_confirmada,

contratacao_advogado_valor:
  valorAdvogado,

contratacao_advogado_pagamento_combinado_em:
  valores
    .contratacao_advogado_pagamento_combinado_em ||
  null,

contratacao_preposto_valor:
  valorPreposto,

contratacao_preposto_pagamento_combinado_em:
  valores
    .contratacao_preposto_pagamento_combinado_em ||
  null,

    orientacoes_encaminhadas:
      valores
        .orientacoes_encaminhadas,

    observacoes:
      valores.observacoes,

    ...(confirmacaoAlerta
      ? {
          confirmacao_alerta:
            confirmacaoAlerta,
        }
      : {}),
  };

  const {
    data,
    error,
  } = await supabase.rpc(
    "criar_diligencia_com_participantes",
    {
      p_empresa_id:
        empresaId,

      p_diligencia:
        diligencia,

      p_testemunha_ids:
        valores
          .testemunha_ids,
    }
  );

  if (error) {
    throw new Error(
      `Erro ao cadastrar diligência: ${error.message}`
    );
  }

  return data as string;
}

function atualizarPaginas() {
  revalidatePath(
    "/protected"
  );

  revalidatePath(
    "/protected/diligencias"
  );

  revalidatePath(
    "/protected/correspondentes"
  );
}

export async function analisarCadastroDiligencia(
  estadoAnterior:
    CadastroState,
  formData: FormData
): Promise<CadastroState> {
  const {
    supabase,
    usuarioId,
    empresaId,
  } =
    await obterEmpresaUsuario();

  const intencao =
    lerCampo(
      formData,
      "intencao"
    ) || "salvar";

  const diligenciasAnteriores =
    estadoAnterior
      .diligenciasEncontradas ??
    [];

  const conflitosAnteriores =
    estadoAnterior
      .conflitosAgenda ??
    [];

  const haviaAlertaAnterior =
    diligenciasAnteriores.length >
      0 ||
    conflitosAnteriores.length >
      0;

  /*
    ========================================
    VOLTAR E REVISAR
    ========================================
  */

  if (
    intencao === "revisar" &&
    estadoAnterior.valores &&
    haviaAlertaAnterior
  ) {
    const valores =
      normalizarObjeto(
        estadoAnterior.valores
      );

    const snapshot =
      await montarSnapshot(
        supabase,
        empresaId,
        valores
      );

    await registrarEvento(
      supabase,
      empresaId,
      "USUARIO_OPTOU_POR_REVISAR",
      snapshot,
      {
        diligencias_apresentadas:
          diligenciasAnteriores,

        conflitos_agenda_apresentados:
          conflitosAnteriores,
      }
    );

    return {
      status:
        "revisao",

      mensagem:
        "Revise os dados abaixo e clique novamente em Salvar diligência.",

      valores,

      diligenciasEncontradas:
        [],

      conflitosAgenda:
        [],
    };
  }

  /*
    ========================================
    CADASTRAR MESMO ASSIM
    ========================================
  */

  if (
    intencao === "prosseguir" &&
    estadoAnterior.valores &&
    haviaAlertaAnterior
  ) {
    const valores =
      normalizarObjeto(
        estadoAnterior.valores
      );

    const erro =
      validarObrigatorios(
        valores
      );

    if (erro) {
      return {
        ...estadoAnterior,

        status:
          "erro",

        mensagem:
          erro,
      };
    }

    const snapshot =
      await montarSnapshot(
        supabase,
        empresaId,
        valores
      );

    /*
      Reconsulta tudo imediatamente
      antes de salvar.
    */
    const [
      diligenciasAtuais,
      conflitosAtuais,
    ] =
      await Promise.all([
        buscarDiligenciasDoProcesso(
          supabase,
          empresaId,
          valores.numero_processo
        ),

        buscarConflitosAgenda(
          supabase,
          empresaId,
          valores
        ),
      ]);

    const assinaturaAnterior =
      JSON.stringify({
        processo:
          assinaturaDiligencias(
            diligenciasAnteriores
          ),

        agenda:
          assinaturaConflitosAgenda(
            conflitosAnteriores
          ),
      });

    const assinaturaAtual =
      JSON.stringify({
        processo:
          assinaturaDiligencias(
            diligenciasAtuais
          ),

        agenda:
          assinaturaConflitosAgenda(
            conflitosAtuais
          ),
      });

    /*
      Se alguma coisa mudou enquanto
      o usuário analisava, mostramos
      novamente os alertas atuais.
    */
    if (
      assinaturaAnterior !==
      assinaturaAtual
    ) {
      if (
        diligenciasAtuais.length >
        0
      ) {
        await registrarEvento(
          supabase,
          empresaId,
          "ALERTA_POSSIVEL_DUPLICIDADE_APRESENTADO",
          snapshot,
          {
            regra:
              "Mesmo processo com diligência presente ou futura.",

            diligencias_encontradas:
              diligenciasAtuais,
          }
        );
      }

      if (
        conflitosAtuais.length >
        0
      ) {
        await registrarEvento(
          supabase,
          empresaId,
          "ALERTA_CONFLITO_AGENDA_APRESENTADO",
          snapshot,
          {
            regra:
              "Mesmo participante, mesmo dia e intervalo inferior a 5 horas.",

            janela_minutos:
              300,

            conflitos:
              conflitosAtuais,
          }
        );
      }

      return {
        status:
          "alerta",

        mensagem:
          "A pauta mudou enquanto você analisava o aviso. Confira novamente as informações apresentadas.",

        valores,

        diligenciasEncontradas:
          diligenciasAtuais,

        conflitosAgenda:
          conflitosAtuais,
      };
    }

    /*
      Todos os alertas deixaram de
      existir.
    */
    if (
      diligenciasAtuais.length ===
        0 &&
      conflitosAtuais.length ===
        0
    ) {
      await inserirDiligencia(
        supabase,
        empresaId,
        valores,
        null
      );

      atualizarPaginas();

      redirect(
        "/protected/diligencias"
      );
    }

    /*
      Confirma duplicidade preventiva,
      se existir.
    */
    if (
      diligenciasAtuais.length >
      0
    ) {
      await registrarEvento(
        supabase,
        empresaId,
        "USUARIO_CONFIRMOU_POSSIVEL_DUPLICIDADE",
        snapshot,
        {
          diligencias_apresentadas:
            diligenciasAtuais,
        }
      );
    }

    /*
      Confirma conflito de agenda,
      se existir.
    */
    if (
      conflitosAtuais.length >
      0
    ) {
      await registrarEvento(
        supabase,
        empresaId,
        "USUARIO_CONFIRMOU_CONFLITO_AGENDA",
        snapshot,
        {
          regra:
            "Mesmo participante, mesmo dia e intervalo inferior a 5 horas.",

          janela_minutos:
            300,

          conflitos_confirmados:
            conflitosAtuais,
        }
      );
    }

    await inserirDiligencia(
      supabase,
      empresaId,
      valores,
      {
        confirmado:
          true,

        usuario_id:
          usuarioId,

        possivel_duplicidade:
          diligenciasAtuais.map(
            (item) => item.id
          ),

        conflitos_agenda:
          conflitosAtuais.map(
            (conflito) => ({
              participante_tipo:
                conflito
                  .participante_tipo,

              participante_id:
                conflito
                  .participante_id,

              diligencia_id:
                conflito
                  .diligencia.id,

              diferenca_minutos:
                conflito
                  .diferenca_minutos,
            })
          ),
      }
    );

    atualizarPaginas();

    redirect(
      "/protected/diligencias"
    );
  }

  /*
    ========================================
    PRIMEIRA TENTATIVA
    ========================================
  */

  const valores =
    extrairFormulario(
      formData
    );

  const erro =
    validarObrigatorios(
      valores
    );

  if (erro) {
    return {
      status:
        "erro",

      mensagem:
        erro,

      valores,

      diligenciasEncontradas:
        [],

      conflitosAgenda:
        [],
    };
  }

  const snapshot =
    await montarSnapshot(
      supabase,
      empresaId,
      valores
    );

  await registrarEvento(
    supabase,
    empresaId,
    "DILIGENCIA_CADASTRO_TENTADO",
    snapshot,
    {
      origem:
        "CADASTRO_MANUAL",
    }
  );

  /*
    As duas verificações são
    independentes e acontecem antes
    da gravação.
  */
  const [
    diligenciasEncontradas,
    conflitosAgenda,
  ] =
    await Promise.all([
      buscarDiligenciasDoProcesso(
        supabase,
        empresaId,
        valores.numero_processo
      ),

      buscarConflitosAgenda(
        supabase,
        empresaId,
        valores
      ),
    ]);

  /*
    Nenhum alerta.
  */
  if (
    diligenciasEncontradas.length ===
      0 &&
    conflitosAgenda.length ===
      0
  ) {
    await inserirDiligencia(
      supabase,
      empresaId,
      valores,
      null
    );

    atualizarPaginas();

    redirect(
      "/protected/diligencias"
    );
  }

  /*
    Possível duplicidade.
  */
  if (
    diligenciasEncontradas.length >
    0
  ) {
    await registrarEvento(
      supabase,
      empresaId,
      "ALERTA_POSSIVEL_DUPLICIDADE_APRESENTADO",
      snapshot,
      {
        regra:
          "Mesmo processo com diligência presente ou futura.",

        quantidade_encontrada:
          diligenciasEncontradas.length,

        diligencias_encontradas:
          diligenciasEncontradas,
      }
    );
  }

  /*
    Conflito de agenda.
  */
  if (
    conflitosAgenda.length >
    0
  ) {
    await registrarEvento(
      supabase,
      empresaId,
      "ALERTA_CONFLITO_AGENDA_APRESENTADO",
      snapshot,
      {
        regra:
          "Mesmo participante, mesmo dia e intervalo inferior a 5 horas.",

        janela_minutos:
          300,

        quantidade_conflitos:
          conflitosAgenda.length,

        conflitos:
          conflitosAgenda,
      }
    );
  }

  return {
    status:
      "alerta",

    mensagem:
      null,

    valores,

    diligenciasEncontradas,

    conflitosAgenda,
  };
}
