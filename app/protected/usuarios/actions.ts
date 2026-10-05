"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/* =========================================================
   TIPOS
========================================================= */

type TipoAcesso =
  | "operacional"
  | "financeiro";

type VinculoUsuario = {
  id: string;
  empresa_id: string;
  usuario_id: string;
  papel: string;
  nucleo: string | null;
  ativo: boolean;
};

type UsuarioAuthLocalizado = {
  id: string;
  email: string | null;
  email_confirmed_at: string | null;
};

/* =========================================================
   UTILITÁRIOS
========================================================= */

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

function normalizarEmail(
  valor: string
) {
  return valor
    .trim()
    .toLowerCase();
}

function normalizarNome(
  valor: string
) {
  return valor
    .trim()
    .replace(/\s+/g, " ");
}

function emailValido(
  email: string
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

/*
  A página pode enviar diretamente
  "tipo_acesso" ou ainda utilizar os
  campos papel/nucleo.

  Mantemos compatibilidade com os dois.
*/
function obterTipoAcesso(
  formData: FormData
): TipoAcesso {
  const tipoDireto =
    lerCampo(
      formData,
      "tipo_acesso"
    ).toLowerCase();

  if (
    tipoDireto ===
    "operacional"
  ) {
    return "operacional";
  }

  if (
    tipoDireto ===
    "financeiro"
  ) {
    return "financeiro";
  }

  const papel =
    lerCampo(
      formData,
      "papel"
    ).toLowerCase();

  const nucleo =
    lerCampo(
      formData,
      "nucleo"
    ).toLowerCase();

  if (
    papel === "master"
  ) {
    throw new Error(
      "Não é permitido criar outro usuário Master por este formulário."
    );
  }

  if (
    nucleo === "financeiro"
  ) {
    return "financeiro";
  }

  return "operacional";
}

function obterSiteUrl() {
  const url =
    process.env
      .NEXT_PUBLIC_SITE_URL;

  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL não está configurada."
    );
  }

  return url.replace(
    /\/+$/,
    ""
  );
}

/* =========================================================
   CONTEXTO DO MASTER
========================================================= */

async function obterContextoMaster() {
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
  } =
    await supabase
      .from(
        "membros_empresa"
      )
      .select(`
        id,
        empresa_id,
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

  if (erroMembro) {
    throw new Error(
      `Não foi possível identificar o vínculo do usuário: ${erroMembro.message}`
    );
  }

  if (!membro) {
    throw new Error(
      "Seu usuário não possui vínculo ativo com uma empresa."
    );
  }

  if (
    membro.papel !==
    "master"
  ) {
    throw new Error(
      "Somente o usuário Master pode administrar usuários."
    );
  }

  const {
    data: empresa,
    error: erroEmpresa,
  } =
    await supabase
      .from("empresas")
      .select(`
        id,
        nome,
        status_acesso
      `)
      .eq(
        "id",
        membro.empresa_id
      )
      .single();

  if (
    erroEmpresa ||
    !empresa
  ) {
    throw new Error(
      `Não foi possível identificar a empresa: ${
        erroEmpresa?.message ??
        "empresa não encontrada"
      }`
    );
  }

  if (
    empresa.status_acesso !==
    "ativo"
  ) {
    throw new Error(
      "A empresa não está ativa."
    );
  }

  return {
    supabase,
    usuarioId,
    empresaId:
      membro.empresa_id,
  };
}

/* =========================================================
   LOCALIZAÇÃO DE USUÁRIO NO AUTH
========================================================= */

async function localizarUsuarioAuth(
  admin: Awaited<
    ReturnType<
      typeof createAdminClient
    >
  >,
  email: string
): Promise<
  UsuarioAuthLocalizado | null
> {
  /*
    Primeiro consulta perfis_usuarios.

    Como existe o trigger
    on_auth_user_created, usuários do
    Auth normalmente já possuem perfil.
  */
  const {
    data: perfis,
    error: erroPerfil,
  } =
    await admin
      .from(
        "perfis_usuarios"
      )
      .select(
        "id, email"
      )
      .ilike(
        "email",
        email
      )
      .limit(1);

  if (erroPerfil) {
    throw new Error(
      `Não foi possível verificar os perfis existentes: ${erroPerfil.message}`
    );
  }

  const perfil =
    perfis?.[0];

  if (perfil?.id) {
    const {
      data,
      error,
    } =
      await admin.auth.admin
        .getUserById(
          perfil.id
        );

    if (
      !error &&
      data?.user
    ) {
      return {
        id:
          data.user.id,

        email:
          data.user.email ??
          null,

        email_confirmed_at:
          data.user
            .email_confirmed_at ??
          null,
      };
    }

    /*
      Perfil sem correspondente no Auth
      indica inconsistência.

      Não criamos outro usuário por cima
      para não gerar registros órfãos ou
      colisões futuras.
    */
    throw new Error(
      "Existe um perfil cadastrado com este e-mail, mas o usuário correspondente não foi localizado no Auth. Revise este cadastro antes de prosseguir."
    );
  }

  /*
    Segunda barreira.

    Caso, por algum motivo, exista usuário
    no Auth sem perfil, percorremos o Auth
    antes de permitir novo convite.
  */
  const porPagina =
    1000;

  for (
    let pagina = 1;
    pagina <= 10;
    pagina += 1
  ) {
    const {
      data,
      error,
    } =
      await admin.auth.admin
        .listUsers({
          page:
            pagina,

          perPage:
            porPagina,
        });

    if (error) {
      throw new Error(
        `Não foi possível verificar usuários existentes: ${error.message}`
      );
    }

    const usuarios =
      data?.users ?? [];

    const encontrado =
      usuarios.find(
        (usuario) =>
          normalizarEmail(
            usuario.email ??
              ""
          ) === email
      );

    if (encontrado) {
      return {
        id:
          encontrado.id,

        email:
          encontrado.email ??
          null,

        email_confirmed_at:
          encontrado
            .email_confirmed_at ??
          null,
      };
    }

    if (
      usuarios.length <
      porPagina
    ) {
      break;
    }
  }

  return null;
}

/* =========================================================
   VÍNCULOS EMPRESARIAIS
========================================================= */

async function verificarVinculosUsuario(
  admin: Awaited<
    ReturnType<
      typeof createAdminClient
    >
  >,
  usuarioId: string
): Promise<
  VinculoUsuario[]
> {
  const {
    data,
    error,
  } =
    await admin
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
      );

  if (error) {
    throw new Error(
      `Não foi possível verificar os vínculos do usuário: ${error.message}`
    );
  }

  return (
    data ??
    []
  ) as VinculoUsuario[];
}

async function obterMembroDaEmpresa(
  admin: Awaited<
    ReturnType<
      typeof createAdminClient
    >
  >,
  membroId: string,
  empresaId: string
) {
  const {
    data,
    error,
  } =
    await admin
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
        "id",
        membroId
      )
      .eq(
        "empresa_id",
        empresaId
      )
      .maybeSingle();

  if (error) {
    throw new Error(
      `Não foi possível localizar o usuário: ${error.message}`
    );
  }

  if (!data) {
    throw new Error(
      "Usuário não encontrado nesta empresa."
    );
  }

  return data as VinculoUsuario;
}

/* =========================================================
   LIMPEZA DE USUÁRIO NOVO

   Utilizada somente quando a criação
   atual falha antes de concluir o vínculo.

   Nunca é utilizada para um usuário
   previamente existente.
========================================================= */

async function limparUsuarioNovo(
  admin: Awaited<
    ReturnType<
      typeof createAdminClient
    >
  >,
  usuarioId: string
) {
  /*
    Primeiro removemos o usuário do Auth.

    Se houver FK ON DELETE CASCADE, o
    perfil será removido automaticamente.
  */
  await admin.auth.admin
    .deleteUser(
      usuarioId
    );

  /*
    Barreira complementar para estruturas
    antigas sem cascade.
  */
  await admin
    .from(
      "perfis_usuarios"
    )
    .delete()
    .eq(
      "id",
      usuarioId
    );
}

/* =========================================================
   CONVIDAR USUÁRIO
========================================================= */

export async function convidarUsuario(
  formData: FormData
) {
  const contexto =
    await obterContextoMaster();

  const admin =
    await createAdminClient();

  const nome =
    normalizarNome(
      lerCampo(
        formData,
        "nome"
      )
    );

  const email =
    normalizarEmail(
      lerCampo(
        formData,
        "email"
      )
    );

  const tipoAcesso =
    obterTipoAcesso(
      formData
    );

  /* -----------------------------------------------------
     VALIDAÇÃO
  ----------------------------------------------------- */

  if (!nome) {
    throw new Error(
      "Informe o nome do usuário."
    );
  }

  if (
    nome.length < 2
  ) {
    throw new Error(
      "Informe um nome válido."
    );
  }

  if (!email) {
    throw new Error(
      "Informe o e-mail do usuário."
    );
  }

  if (
    !emailValido(email)
  ) {
    throw new Error(
      "Informe um endereço de e-mail válido."
    );
  }

  /* -----------------------------------------------------
     NÃO REUTILIZAR USUÁRIO EXISTENTE
  ----------------------------------------------------- */

  const usuarioExistente =
    await localizarUsuarioAuth(
      admin,
      email
    );

  if (
    usuarioExistente
  ) {
    const vinculos =
      await verificarVinculosUsuario(
        admin,
        usuarioExistente.id
      );

    const vinculoEmpresaAtual =
      vinculos.find(
        (vinculo) =>
          vinculo.empresa_id ===
          contexto.empresaId
      );

    const vinculoOutraEmpresa =
      vinculos.find(
        (vinculo) =>
          vinculo.empresa_id !==
          contexto.empresaId
      );

    if (
      vinculoEmpresaAtual
    ) {
      if (
        vinculoEmpresaAtual
          .papel ===
        "master"
      ) {
        throw new Error(
          "Este e-mail pertence ao usuário Master da empresa."
        );
      }

      if (
        vinculoEmpresaAtual.ativo &&
        usuarioExistente
          .email_confirmed_at
      ) {
        throw new Error(
          "Este usuário já possui acesso ativo à empresa."
        );
      }

      if (
        vinculoEmpresaAtual.ativo &&
        !usuarioExistente
          .email_confirmed_at
      ) {
        throw new Error(
          "Este usuário já possui um convite pendente. Utilize a opção Reenviar link."
        );
      }

      if (
        !vinculoEmpresaAtual.ativo
      ) {
        throw new Error(
          "Este usuário já possui cadastro com acesso revogado. Utilize a opção Reativar acesso."
        );
      }
    }

    if (
      vinculoOutraEmpresa
    ) {
      throw new Error(
        "Este e-mail já está vinculado a outra empresa no NOTE LITIS."
      );
    }

    /*
      Existe no Auth, mas não possui vínculo
      empresarial.

      Não reaproveitamos silenciosamente.
    */
    throw new Error(
      "Este e-mail já possui cadastro no sistema, mas não está vinculado à empresa atual. O cadastro precisa ser revisado antes de um novo convite."
    );
  }

  /* -----------------------------------------------------
     CRIAÇÃO NO AUTH + ENVIO DO CONVITE
  ----------------------------------------------------- */

  const redirectTo =
    `${obterSiteUrl()}/auth/definir-senha`;

  const {
    data:
      dadosConvite,

    error:
      erroConvite,
  } =
    await admin.auth.admin
      .inviteUserByEmail(
        email,
        {
          redirectTo,

          data: {
            nome,
          },
        }
      );

  if (
    erroConvite
  ) {
    throw new Error(
      `Não foi possível enviar o convite: ${erroConvite.message}`
    );
  }

  const novoUsuario =
    dadosConvite?.user;

  if (
    !novoUsuario?.id
  ) {
    throw new Error(
      "O convite foi processado, mas o usuário não foi retornado pelo serviço de autenticação."
    );
  }

  /* -----------------------------------------------------
     PERFIL

     IMPORTANTE:
     auth.users possui o trigger
     on_auth_user_created.

     Portanto, perfis_usuarios JÁ EXISTE
     neste momento.

     NÃO FAZER INSERT.
  ----------------------------------------------------- */

  const {
    data:
      perfilAtualizado,

    error:
      erroPerfil,
  } =
    await admin
      .from(
        "perfis_usuarios"
      )
      .update({
        nome,
        email,

        atualizado_em:
          new Date()
            .toISOString(),
      })
      .eq(
        "id",
        novoUsuario.id
      )
      .select("id")
      .maybeSingle();

  if (
    erroPerfil ||
    !perfilAtualizado
  ) {
    await limparUsuarioNovo(
      admin,
      novoUsuario.id
    );

    throw new Error(
      `Não foi possível atualizar o perfil do usuário: ${
        erroPerfil?.message ??
        "perfil não localizado após a criação do usuário"
      }`
    );
  }

  /* -----------------------------------------------------
     VÍNCULO COM A EMPRESA

     A RPC é executada pelo cliente
     autenticado para preservar o usuário
     responsável pela ação e as regras do
     banco.
  ----------------------------------------------------- */

  const {
    error:
      erroMembro,
  } =
    await contexto.supabase.rpc(
      "criar_membro_empresa_simples",
      {
        p_empresa_id:
          contexto.empresaId,

        p_usuario_id:
          novoUsuario.id,

        p_tipo_acesso:
          tipoAcesso,
      }
    );

  if (
    erroMembro
  ) {
    await limparUsuarioNovo(
      admin,
      novoUsuario.id
    );

    throw new Error(
      `Não foi possível vincular o usuário à empresa: ${erroMembro.message}`
    );
  }

  revalidatePath(
    "/protected/usuarios"
  );

  /*
    redirect() fica FORA de try/catch.

    Next.js implementa redirect lançando
    NEXT_REDIRECT internamente.
  */
  redirect(
    "/protected/usuarios?sucesso=convite-enviado"
  );
}

/* =========================================================
   ALTERAR TIPO DE ACESSO
========================================================= */

export async function alterarTipoUsuario(
  formData: FormData
) {
  const contexto =
    await obterContextoMaster();

  const admin =
    await createAdminClient();

  const membroId =
    lerCampo(
      formData,
      "membro_id"
    );

  if (!membroId) {
    throw new Error(
      "Usuário não informado."
    );
  }

  const tipoAcesso =
    obterTipoAcesso(
      formData
    );

  const membro =
    await obterMembroDaEmpresa(
      admin,
      membroId,
      contexto.empresaId
    );

  if (
    membro.papel ===
    "master"
  ) {
    throw new Error(
      "O tipo de acesso do usuário Master não pode ser alterado."
    );
  }

  const {
    error,
  } =
    await contexto.supabase.rpc(
      "alterar_tipo_acesso_membro",
      {
        p_membro_id:
          membroId,

        p_tipo_acesso:
          tipoAcesso,
      }
    );

  if (error) {
    throw new Error(
      `Não foi possível alterar o tipo de acesso: ${error.message}`
    );
  }

  revalidatePath(
    "/protected/usuarios"
  );

  redirect(
    "/protected/usuarios?sucesso=acesso-alterado"
  );
}

/* =========================================================
   REVOGAR / REATIVAR ACESSO
========================================================= */

export async function alterarStatusUsuario(
  formData: FormData
) {
  const contexto =
    await obterContextoMaster();

  const admin =
    await createAdminClient();

  const membroId =
    lerCampo(
      formData,
      "membro_id"
    );

  const ativoTexto =
    lerCampo(
      formData,
      "ativo"
    ).toLowerCase();

  if (!membroId) {
    throw new Error(
      "Usuário não informado."
    );
  }

  if (
    ativoTexto !== "true" &&
    ativoTexto !== "false"
  ) {
    throw new Error(
      "Status de acesso inválido."
    );
  }

  const ativo =
    ativoTexto === "true";

  const membro =
    await obterMembroDaEmpresa(
      admin,
      membroId,
      contexto.empresaId
    );

  if (
    membro.papel ===
    "master"
  ) {
    throw new Error(
      "O acesso do usuário Master não pode ser revogado por esta tela."
    );
  }

  if (
    membro.usuario_id ===
    contexto.usuarioId
  ) {
    throw new Error(
      "Você não pode alterar o próprio acesso."
    );
  }

  const {
    error,
  } =
    await contexto.supabase.rpc(
      "alterar_status_membro",
      {
        p_membro_id:
          membroId,

        p_ativo:
          ativo,
      }
    );

  if (error) {
    throw new Error(
      `Não foi possível ${
        ativo
          ? "reativar"
          : "revogar"
      } o acesso: ${error.message}`
    );
  }

  revalidatePath(
    "/protected/usuarios"
  );

  redirect(
    ativo
      ? "/protected/usuarios?sucesso=acesso-reativado"
      : "/protected/usuarios?sucesso=acesso-revogado"
  );
}

/* =========================================================
   REENVIAR CONVITE
========================================================= */

export async function reenviarConvite(
  formData: FormData
) {
  const contexto =
    await obterContextoMaster();

  const admin =
    await createAdminClient();

  const membroId =
    lerCampo(
      formData,
      "membro_id"
    );

  if (!membroId) {
    throw new Error(
      "Usuário não informado."
    );
  }

  const membro =
    await obterMembroDaEmpresa(
      admin,
      membroId,
      contexto.empresaId
    );

  if (
    membro.papel ===
    "master"
  ) {
    throw new Error(
      "Não é possível reenviar convite para o usuário Master."
    );
  }

  if (
    !membro.ativo
  ) {
    throw new Error(
      "Este usuário está com o acesso revogado. Reative o acesso antes de reenviar um convite."
    );
  }

  const {
    data:
      dadosUsuario,

    error:
      erroUsuario,
  } =
    await admin.auth.admin
      .getUserById(
        membro.usuario_id
      );

  if (
    erroUsuario ||
    !dadosUsuario?.user
  ) {
    throw new Error(
      `Não foi possível localizar o usuário no Auth: ${
        erroUsuario?.message ??
        "usuário não encontrado"
      }`
    );
  }

  const usuario =
    dadosUsuario.user;

  if (
    usuario.email_confirmed_at
  ) {
    throw new Error(
      "Este usuário já ativou o acesso. Não há convite pendente para reenviar."
    );
  }

  const email =
    normalizarEmail(
      usuario.email ??
        ""
    );

  if (!email) {
    throw new Error(
      "O usuário não possui um endereço de e-mail válido."
    );
  }

  const redirectTo =
    `${obterSiteUrl()}/auth/definir-senha`;

  const {
    error:
      erroConvite,
  } =
    await admin.auth.admin
      .inviteUserByEmail(
        email,
        {
          redirectTo,
        }
      );

  if (
    erroConvite
  ) {
    throw new Error(
      `Não foi possível reenviar o convite: ${erroConvite.message}`
    );
  }

  const {
    error:
      erroRegistro,
  } =
    await contexto.supabase.rpc(
      "registrar_reenvio_convite",
      {
        p_membro_id:
          membroId,
      }
    );

  if (
    erroRegistro
  ) {
    throw new Error(
      `O convite foi enviado, mas não foi possível registrar o reenvio: ${erroRegistro.message}`
    );
  }

  revalidatePath(
    "/protected/usuarios"
  );

  redirect(
    "/protected/usuarios?sucesso=convite-reenviado"
  );
}