"use server";

import {
  redirect,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  POLITICA_PRIVACIDADE_VERSAO,
  TERMOS_USO_VERSAO,
} from "@/lib/legal";

export async function aceitarDocumentosLegais(
  formData:
    FormData
) {
  const confirmou =
    formData.get(
      "aceite_legal"
    ) === "on";

  if (
    !confirmou
  ) {
    redirect(
      "/auth/aceite-legal?erro=" +
        encodeURIComponent(
          "Para continuar, é necessário aceitar os Termos de Uso e declarar ciência da Política de Privacidade."
        )
    );
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
    redirect(
      "/auth/login"
    );
  }

  const {
    error,
  } =
    await supabase.rpc(
      "registrar_aceite_legal",
      {
        p_termos_versao:
          TERMOS_USO_VERSAO,

        p_privacidade_versao:
          POLITICA_PRIVACIDADE_VERSAO,
      }
    );

  if (
    error
  ) {
    redirect(
      "/auth/aceite-legal?erro=" +
        encodeURIComponent(
          "Não foi possível registrar o aceite. Tente novamente."
        )
    );
  }

  redirect(
    "/protected"
  );
}
