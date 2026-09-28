"use server";

import { revalidatePath } from "next/cache";

import {
  createClient,
} from "@/lib/supabase/server";


export type CancelamentoState = {
  status:
    | "inicial"
    | "erro"
    | "sucesso";

  mensagem?: string;
};


export async function cancelarDiligencia(
  _estadoAnterior: CancelamentoState,
  formData: FormData
): Promise<CancelamentoState> {

  const diligenciaId =
    String(
      formData.get(
        "diligencia_id"
      ) ?? ""
    ).trim();


  if (!diligenciaId) {
    return {
      status: "erro",
      mensagem:
        "Não foi possível identificar a diligência.",
    };
  }


  const supabase =
    await createClient();


  const {
    data: claimsData,
    error: claimsError,
  } =
    await supabase.auth.getClaims();


  if (
    claimsError ||
    !claimsData?.claims?.sub
  ) {
    return {
      status: "erro",
      mensagem:
        "Sua sessão não pôde ser validada.",
    };
  }


  const {
    error,
  } =
    await supabase.rpc(
      "cancelar_diligencia",
      {
        p_diligencia_id:
          diligenciaId,
      }
    );


  if (error) {
    return {
      status: "erro",
      mensagem:
        error.message ||
        "Não foi possível cancelar a diligência.",
    };
  }


  /*
    Atualizamos tanto os detalhes
    quanto a listagem, porque a
    diligência deixou de ser
    operacionalmente ativa.
  */
  revalidatePath(
    `/protected/diligencias/${diligenciaId}`
  );

  revalidatePath(
    "/protected/diligencias"
  );


  return {
    status: "sucesso",
    mensagem:
      "Diligência cancelada com sucesso.",
  };
}