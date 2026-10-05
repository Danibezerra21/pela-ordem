import "server-only";

import {
  redirect,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/server";

export type TipoAcesso =
  | "master"
  | "operacional"
  | "financeiro";

export type ContextoAcesso = {
  usuarioId: string;
  empresaId: string;
  membroId: string;
  papel: string;
  nucleo: string;
  tipoAcesso: TipoAcesso;
};

/* =====================================================
   CONTEXTO DO USUÁRIO
===================================================== */

export async function obterContextoAcesso(): Promise<ContextoAcesso> {
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

  const usuarioId =
    authData
      .claims
      .sub;

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
      .select(`
        id,
        empresa_id,
        usuario_id,
        papel,
        nucleo,
        ativo
      `)
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
    redirect(
      "/auth/login"
    );
  }

  const {
    data:
      empresa,

    error:
      erroEmpresa,
  } =
    await supabase
      .from(
        "empresas"
      )
      .select(
        "id, status_acesso"
      )
      .eq(
        "id",
        membro
          .empresa_id
      )
      .maybeSingle();

  if (
    erroEmpresa ||
    !empresa ||
    empresa
      .status_acesso !==
      "ativo"
  ) {
    redirect(
      "/auth/login"
    );
  }

  let tipoAcesso:
    TipoAcesso;

  if (
    membro.papel ===
    "master"
  ) {
    tipoAcesso =
      "master";
  } else if (
    membro.nucleo ===
    "financeiro"
  ) {
    tipoAcesso =
      "financeiro";
  } else {
    tipoAcesso =
      "operacional";
  }

  return {
    usuarioId,

    empresaId:
      membro
        .empresa_id,

    membroId:
      membro.id,

    papel:
      membro.papel,

    nucleo:
      membro.nucleo,

    tipoAcesso,
  };
}

/* =====================================================
   CONSULTA DE PERMISSÃO
===================================================== */

export async function temPermissao(
  codigo: string
) {
  const supabase =
    await createClient();

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "usuario_tem_permissao",
      {
        p_codigo:
          codigo,
      }
    );

  if (error) {
    throw new Error(
      `Não foi possível validar a permissão: ${error.message}`
    );
  }

  return data ===
    true;
}

/* =====================================================
   EXIGIR PERMISSÃO
===================================================== */

export async function exigirPermissao(
  codigo: string
) {
  const permitido =
    await temPermissao(
      codigo
    );

  if (!permitido) {
    redirect(
      "/protected/acesso-negado"
    );
  }
}

/* =====================================================
   EXIGIR MASTER
===================================================== */

export async function exigirMaster() {
  const contexto =
    await obterContextoAcesso();

  if (
    contexto
      .tipoAcesso !==
    "master"
  ) {
    redirect(
      "/protected/acesso-negado"
    );
  }

  return contexto;
}