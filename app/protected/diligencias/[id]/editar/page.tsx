import {
  notFound,
  redirect,
} from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import {
  FormularioPrincipalEdicao,
} from "./formulario/formulario-principal-edicao";

import type {
  DetalhesEdicaoDiligencia,
} from "./formulario/tipos";

export default async function EditarDiligenciaPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } =
    await params;

  const supabase =
    await createClient();

  /*
    Autenticação e carregamento da diligência
    são feitos simultaneamente.
  */

  const [
    authResultado,
    detalhesResultado,
  ] = await Promise.all([
    supabase.auth.getClaims(),

    supabase.rpc(
      "obter_detalhes_diligencia",
      {
        p_diligencia_id: id,
      }
    ),
  ]);

  const {
    data: authData,
    error: authError,
  } = authResultado;

  if (
    authError ||
    !authData?.claims?.sub
  ) {
    redirect(
      "/auth/login"
    );
  }

  const {
    data,
    error,
  } = detalhesResultado;

  if (error) {
    throw new Error(
      `Erro ao carregar diligência: ${error.message}`
    );
  }

  if (!data) {
    notFound();
  }

  const detalhes =
    data as DetalhesEdicaoDiligencia;

  /*
    Diligências canceladas são imutáveis.
  */
  if (
    detalhes.diligencia.status ===
    "cancelada"
  ) {
    redirect(
      `/protected/diligencias/${id}`
    );
  }

  return (
    <FormularioPrincipalEdicao
      detalhes={detalhes}
    />
  );
}