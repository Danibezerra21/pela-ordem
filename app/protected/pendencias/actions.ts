"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  createClient,
} from "@/lib/supabase/server";

/* =====================================================
   TIPOS
===================================================== */

export type AcaoDesfecho =
  | "concluir"
  | "reagendar"
  | "concluir_e_criar_continuidade";

export type ResultadoDesfecho =
  | "finalidade_atingida"
  | "finalidade_nao_atingida";

export type FinanceiroDesfecho =
  | "liberado_para_pagamento"
  | "nao_aplicavel";

export type DesfechoState = {
  status:
    | "inicial"
    | "erro"
    | "sucesso";

  mensagem:
    string | null;

  acao:
    AcaoDesfecho | null;

  diligenciaId:
    string | null;

  novaDiligenciaId:
    string | null;
};

/* =====================================================
   HELPERS
===================================================== */

function lerCampo(
  formData: FormData,
  campo: string
) {
  const valor =
    formData.get(campo);

  return typeof valor === "string"
    ? valor.trim()
    : "";
}

function normalizarAcao(
  valor: string
): AcaoDesfecho | null {
  if (
    valor === "concluir" ||
    valor === "reagendar" ||
    valor ===
      "concluir_e_criar_continuidade"
  ) {
    return valor;
  }

  return null;
}

function normalizarResultado(
  valor: string
): ResultadoDesfecho | null {
  if (
    valor ===
      "finalidade_atingida" ||
    valor ===
      "finalidade_nao_atingida"
  ) {
    return valor;
  }

  return null;
}

function normalizarFinanceiro(
  valor: string
): FinanceiroDesfecho | null {
  if (
    valor ===
      "liberado_para_pagamento" ||
    valor ===
      "nao_aplicavel"
  ) {
    return valor;
  }

  return null;
}

/* =====================================================
   ACTION
===================================================== */

export async function registrarDesfechoAction(
  _estadoAnterior:
    DesfechoState,

  formData:
    FormData
): Promise<DesfechoState> {
  const supabase =
    await createClient();

  /* ===================================================
     AUTENTICAÇÃO
  =================================================== */

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
    return {
      status:
        "erro",

      mensagem:
        "Sua sessão não está disponível. Entre novamente no sistema.",

      acao:
        null,

      diligenciaId:
        null,

      novaDiligenciaId:
        null,
    };
  }

  /* ===================================================
     CAMPOS
  =================================================== */

  const diligenciaId =
    lerCampo(
      formData,
      "diligencia_id"
    );

  const acao =
    normalizarAcao(
      lerCampo(
        formData,
        "acao"
      )
    );

  const resultado =
    normalizarResultado(
      lerCampo(
        formData,
        "resultado"
      )
    );

  const financeiroStatus =
    normalizarFinanceiro(
      lerCampo(
        formData,
        "financeiro_status"
      )
    );

  const observacoes =
    lerCampo(
      formData,
      "observacoes"
    );

  const novaData =
    lerCampo(
      formData,
      "nova_data"
    );

  const novoHorario =
    lerCampo(
      formData,
      "novo_horario"
    );

  /* ===================================================
     VALIDAÇÕES LOCAIS
  =================================================== */

  if (
    !diligenciaId
  ) {
    return {
      status:
        "erro",

      mensagem:
        "Não foi possível identificar a diligência.",

      acao:
        null,

      diligenciaId:
        null,

      novaDiligenciaId:
        null,
    };
  }

  if (!acao) {
    return {
      status:
        "erro",

      mensagem:
        "Selecione o tratamento que será dado à diligência.",

      acao:
        null,

      diligenciaId,

      novaDiligenciaId:
        null,
    };
  }

  /* ===================================================
     REAGENDAMENTO
  =================================================== */

  if (
    acao ===
    "reagendar"
  ) {
    if (!novaData) {
      return {
        status:
          "erro",

        mensagem:
          "Informe a nova data da diligência.",

        acao,

        diligenciaId,

        novaDiligenciaId:
          null,
      };
    }

    if (!novoHorario) {
      return {
        status:
          "erro",

        mensagem:
          "Informe o novo horário da diligência.",

        acao,

        diligenciaId,

        novaDiligenciaId:
          null,
      };
    }

    if (!observacoes) {
      return {
        status:
          "erro",

        mensagem:
          "Informe o motivo do reagendamento.",

        acao,

        diligenciaId,

        novaDiligenciaId:
          null,
      };
    }
  }

  /* ===================================================
     CONCLUSÃO
  =================================================== */

  if (
    acao === "concluir" ||
    acao ===
      "concluir_e_criar_continuidade"
  ) {
    if (!resultado) {
      return {
        status:
          "erro",

        mensagem:
          "Informe se a finalidade da diligência foi atingida.",

        acao,

        diligenciaId,

        novaDiligenciaId:
          null,
      };
    }

    if (
      !financeiroStatus
    ) {
      return {
        status:
          "erro",

        mensagem:
          "Informe se a diligência deve ser encaminhada para pagamento.",

        acao,

        diligenciaId,

        novaDiligenciaId:
          null,
      };
    }

    if (
      resultado ===
        "finalidade_nao_atingida" &&
      !observacoes
    ) {
      return {
        status:
          "erro",

        mensagem:
          "Informe o que ocorreu e por que a finalidade não foi atingida.",

        acao,

        diligenciaId,

        novaDiligenciaId:
          null,
      };
    }
  }

  /* ===================================================
     CONTINUIDADE
  =================================================== */

  if (
    acao ===
    "concluir_e_criar_continuidade"
  ) {
    if (!novaData) {
      return {
        status:
          "erro",

        mensagem:
          "Informe a data da nova diligência.",

        acao,

        diligenciaId,

        novaDiligenciaId:
          null,
      };
    }

    if (!novoHorario) {
      return {
        status:
          "erro",

        mensagem:
          "Informe o horário da nova diligência.",

        acao,

        diligenciaId,

        novaDiligenciaId:
          null,
      };
    }
  }

  /* ===================================================
     RPC TRANSACIONAL
  =================================================== */

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "registrar_desfecho_diligencia",
      {
        p_diligencia_id:
          diligenciaId,

        p_acao:
          acao,

        p_resultado:
          acao ===
          "reagendar"
            ? null
            : resultado,

        p_financeiro_status:
          acao ===
          "reagendar"
            ? null
            : financeiroStatus,

        p_observacoes:
          observacoes ||
          null,

        p_nova_data:
          (
            acao ===
              "reagendar" ||
            acao ===
              "concluir_e_criar_continuidade"
          )
            ? novaData ||
              null
            : null,

        p_novo_horario:
          (
            acao ===
              "reagendar" ||
            acao ===
              "concluir_e_criar_continuidade"
          )
            ? novoHorario ||
              null
            : null,
      }
    );

  if (error) {
    return {
      status:
        "erro",

      mensagem:
        error.message,

      acao,

      diligenciaId,

      novaDiligenciaId:
        null,
    };
  }

  const retorno =
    (
      data ??
      {}
    ) as {
      sucesso?:
        boolean;

      acao?:
        AcaoDesfecho;

      diligencia_id?:
        string;

      nova_diligencia_id?:
        string | null;

      financeiro_status?:
        string | null;
    };

  const novaDiligenciaId =
    retorno
      .nova_diligencia_id ??
    null;

  /* ===================================================
     REVALIDAÇÃO
  =================================================== */

  revalidatePath(
    "/protected"
  );

  revalidatePath(
    "/protected/pendencias"
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

  if (
    novaDiligenciaId
  ) {
    revalidatePath(
      `/protected/diligencias/${novaDiligenciaId}`
    );

    revalidatePath(
      `/protected/diligencias/${novaDiligenciaId}/editar`
    );
  }

  /* ===================================================
     RETORNO
  =================================================== */

  if (
    acao ===
    "reagendar"
  ) {
    return {
      status:
        "sucesso",

      mensagem:
        "Diligência reagendada. Ela permanece ativa e não foi encaminhada ao financeiro.",

      acao,

      diligenciaId,

      novaDiligenciaId:
        null,
    };
  }

  if (
    acao ===
    "concluir_e_criar_continuidade"
  ) {
    return {
      status:
        "sucesso",

      mensagem:
        financeiroStatus ===
        "liberado_para_pagamento"
          ? "A diligência atual foi concluída e liberada para pagamento. Uma nova diligência de continuidade foi criada."
          : "A diligência atual foi concluída sem encaminhamento ao financeiro. Uma nova diligência de continuidade foi criada.",

      acao,

      diligenciaId,

      novaDiligenciaId,
    };
  }

  return {
    status:
      "sucesso",

    mensagem:
      financeiroStatus ===
      "liberado_para_pagamento"
        ? "Diligência concluída e liberada para o financeiro iniciar as tratativas de pagamento."
        : "Diligência concluída sem encaminhamento ao financeiro.",

    acao,

    diligenciaId,

    novaDiligenciaId:
      null,
  };
}