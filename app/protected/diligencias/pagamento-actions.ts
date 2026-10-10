"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  temPermissao,
} from "@/lib/permissoes";


export type PagamentoState = {
  status:
    | "inicial"
    | "sucesso"
    | "erro";

  mensagem:
    string | null;
};


function lerCampo(
  formData: FormData,
  campo: string
) {
  const valor =
    formData.get(
      campo
    );

  return typeof valor ===
    "string"
    ? valor.trim()
    : "";
}


function uuidValido(
  valor: string
) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    valor
  );
}


export async function alterarPagamentoContratacao(
  _estadoAnterior:
    PagamentoState,

  formData:
    FormData
): Promise<PagamentoState> {

  const contratacaoId =
    lerCampo(
      formData,
      "contratacao_id"
    );

  /*
    O diligencia_id é usado apenas
    para revalidar a página.

    A operação financeira não depende
    dele para ser autorizada.
  */
  const diligenciaId =
    lerCampo(
      formData,
      "diligencia_id"
    );

  const pago =
    lerCampo(
      formData,
      "pago"
    ) === "true";


  if (
    !contratacaoId ||
    !uuidValido(
      contratacaoId
    )
  ) {
    return {
      status:
        "erro",

      mensagem:
        "Não foi possível identificar a contratação.",
    };
  }


  const supabase =
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
    return {
      status:
        "erro",

      mensagem:
        "Sua sessão não está disponível. Entre novamente no sistema.",
    };
  }


  const podeGerenciar =
    await temPermissao(
      "financeiro.gerenciar"
    );


  if (!podeGerenciar) {
    return {
      status:
        "erro",

      mensagem:
        "Você não possui permissão para alterar o pagamento desta contratação.",
    };
  }


  const {
    error,
  } =
    await supabase.rpc(
      "marcar_pagamento_contratacao",
      {
        p_contratacao_id:
          contratacaoId,

        p_pago:
          pago,
      }
    );


  if (error) {
    return {
      status:
        "erro",

      mensagem:
        error.message ||
        "Não foi possível atualizar o pagamento.",
    };
  }


  revalidatePath(
    "/protected"
  );

  revalidatePath(
    "/protected/diligencias"
  );

  if (
    diligenciaId &&
    uuidValido(
      diligenciaId
    )
  ) {
    revalidatePath(
      `/protected/diligencias/${diligenciaId}`
    );
  }

  revalidatePath(
    "/protected/pendencias"
  );

  revalidatePath(
    "/protected/relatorios"
  );


  return {
    status:
      "sucesso",

    mensagem:
      pago
        ? "Diligência paga com sucesso."
        : "Pagamento da diligência desfeito com sucesso.",
  };
}