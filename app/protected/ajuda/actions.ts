"use server";

import {
  redirect,
} from "next/navigation";

import {
  revalidatePath,
} from "next/cache";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  createClient,
} from "@/lib/supabase/server";


const CATEGORIAS_VALIDAS =
  new Set([
    "problema_tecnico",
    "duvida_utilizacao",
    "sugestao",
    "outro",
  ]);


function lerCampo(
  formData:
    FormData,

  nome:
    string
) {
  const valor =
    formData.get(
      nome
    );

  return typeof valor ===
    "string"
      ? valor.trim()
      : "";
}


function somenteNumeros(
  valor:
    string
) {
  return valor.replace(
    /\D/g,
    ""
  );
}


function uuidValido(
  valor:
    string
) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    valor
  );
}


function redirecionarErro(
  caminho:
    string,

  mensagem:
    string
): never {
  redirect(
    `${caminho}?erro=${encodeURIComponent(
      mensagem
    )}`
  );
}


async function obterContextoUsuario() {
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


  const admin =
    createAdminClient();


  const {
    data:
      membro,

    error:
      erroMembro,
  } =
    await admin
      .from(
        "membros_empresa"
      )
      .select(`
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


  if (
    erroMembro
  ) {
    throw new Error(
      `Não foi possível identificar sua empresa: ${erroMembro.message}`
    );
  }


  if (
    !membro
  ) {
    redirect(
      "/auth/onboarding"
    );
  }


  const {
    data:
      perfil,

    error:
      erroPerfil,
  } =
    await admin
      .from(
        "perfis_usuarios"
      )
      .select(`
        nome,
        email
      `)
      .eq(
        "id",
        usuarioId
      )
      .maybeSingle();


  if (
    erroPerfil
  ) {
    throw new Error(
      `Não foi possível identificar seu perfil: ${erroPerfil.message}`
    );
  }


  const emailClaim =
    typeof authData
      .claims
      .email ===
      "string"
      ? authData
          .claims
          .email
          .trim()
      : "";


  const email =
    perfil?.email
      ?.trim() ||
    emailClaim;


  return {
    admin,

    usuarioId,

    empresaId:
      membro
        .empresa_id,

    email,

    nome:
      perfil?.nome ||
      "",
  };
}


/* =====================================================
   ABRIR CHAMADO
===================================================== */

export async function abrirChamado(
  formData:
    FormData
) {
  const {
    admin,
    usuarioId,
    empresaId,
    email,
  } =
    await obterContextoUsuario();


  const categoria =
    lerCampo(
      formData,
      "categoria"
    );


  const assunto =
    lerCampo(
      formData,
      "assunto"
    );


  const descricao =
    lerCampo(
      formData,
      "descricao"
    );


  const whatsapp =
    lerCampo(
      formData,
      "whatsapp"
    );


  if (
    !CATEGORIAS_VALIDAS
      .has(
        categoria
      )
  ) {
    redirecionarErro(
      "/protected/ajuda",
      "Selecione uma categoria válida."
    );
  }


  if (
    assunto.length <
    5
  ) {
    redirecionarErro(
      "/protected/ajuda",
      "Informe um assunto com pelo menos 5 caracteres."
    );
  }


  if (
    assunto.length >
    160
  ) {
    redirecionarErro(
      "/protected/ajuda",
      "O assunto informado é muito longo."
    );
  }


  if (
    descricao.length <
    15
  ) {
    redirecionarErro(
      "/protected/ajuda",
      "Descreva sua solicitação com um pouco mais de detalhes."
    );
  }


  if (
    descricao.length >
    5000
  ) {
    redirecionarErro(
      "/protected/ajuda",
      "A descrição ultrapassa o limite permitido."
    );
  }


  const whatsappNumeros =
    somenteNumeros(
      whatsapp
    );


  if (
    whatsapp &&
    (
      whatsappNumeros
        .length <
        10 ||
      whatsappNumeros
        .length >
        13
    )
  ) {
    redirecionarErro(
      "/protected/ajuda",
      "Informe um WhatsApp válido ou deixe o campo em branco."
    );
  }


  if (
    !email
  ) {
    redirecionarErro(
      "/protected/ajuda",
      "Não foi possível identificar o e-mail do seu usuário. Verifique seu cadastro antes de abrir o chamado."
    );
  }


  const {
    data:
      chamado,

    error:
      erroChamado,
  } =
    await admin
      .from(
        "chamados_suporte"
      )
      .insert({
        empresa_id:
          empresaId,

        usuario_id:
          usuarioId,

        categoria,

        assunto,

        descricao,

        status:
          "aberto",

        pagina_origem:
          "/protected/ajuda",

        email_contato:
          email,

        whatsapp_contato:
          whatsapp ||
          null,
      })
      .select(
        "id"
      )
      .single();


  if (
    erroChamado ||
    !chamado
  ) {
    console.error(
      "Erro ao abrir chamado:",
      erroChamado
    );

    redirecionarErro(
      "/protected/ajuda",
      "Não foi possível abrir o chamado. Tente novamente."
    );
  }


  revalidatePath(
    "/protected/ajuda"
  );

  revalidatePath(
    "/protected/suporte"
  );


  redirect(
    `/protected/ajuda/${chamado.id}?novo=1`
  );
}


/* =====================================================
   RESPONDER / REABRIR CHAMADO
===================================================== */

export async function responderChamado(
  formData:
    FormData
) {
  const chamadoId =
    lerCampo(
      formData,
      "chamado_id"
    );


  const mensagem =
    lerCampo(
      formData,
      "mensagem"
    );


  if (
    !uuidValido(
      chamadoId
    )
  ) {
    redirect(
      "/protected/ajuda"
    );
  }


  if (
    mensagem.length <
    2
  ) {
    redirecionarErro(
      `/protected/ajuda/${chamadoId}`,
      "Digite uma mensagem antes de enviar."
    );
  }


  if (
    mensagem.length >
    5000
  ) {
    redirecionarErro(
      `/protected/ajuda/${chamadoId}`,
      "A mensagem ultrapassa o limite permitido."
    );
  }


  const {
    admin,
    usuarioId,
    empresaId,
  } =
    await obterContextoUsuario();


  const {
    data:
      chamado,

    error:
      erroChamado,
  } =
    await admin
      .from(
        "chamados_suporte"
      )
      .select(`
        id,
        status
      `)
      .eq(
        "id",
        chamadoId
      )
      .eq(
        "empresa_id",
        empresaId
      )
      .eq(
        "usuario_id",
        usuarioId
      )
      .maybeSingle();


  if (
    erroChamado
  ) {
    throw new Error(
      `Erro ao localizar chamado: ${erroChamado.message}`
    );
  }


  if (
    !chamado
  ) {
    redirect(
      "/protected/ajuda"
    );
  }


  const {
    error:
      erroMensagem,
  } =
    await admin
      .from(
        "chamados_suporte_mensagens"
      )
      .insert({
        chamado_id:
          chamadoId,

        autor_usuario_id:
          usuarioId,

        autor_tipo:
          "usuario",

        mensagem,
      });


  if (
    erroMensagem
  ) {
    console.error(
      "Erro ao responder chamado:",
      erroMensagem
    );

    redirecionarErro(
      `/protected/ajuda/${chamadoId}`,
      "Não foi possível enviar sua mensagem."
    );
  }


  const {
    error:
      erroAtualizacao,
  } =
    await admin
      .from(
        "chamados_suporte"
      )
      .update({
        status:
          "aguardando_suporte",

        atualizado_em:
          new Date()
            .toISOString(),
      })
      .eq(
        "id",
        chamadoId
      )
      .eq(
        "empresa_id",
        empresaId
      )
      .eq(
        "usuario_id",
        usuarioId
      );


  if (
    erroAtualizacao
  ) {
    console.error(
      "Erro ao atualizar chamado:",
      erroAtualizacao
    );

    redirecionarErro(
      `/protected/ajuda/${chamadoId}`,
      "A mensagem foi registrada, mas não foi possível atualizar o status do chamado."
    );
  }


  revalidatePath(
    `/protected/ajuda/${chamadoId}`
  );

  revalidatePath(
    "/protected/ajuda"
  );

  revalidatePath(
    "/protected/suporte"
  );


  redirect(
    `/protected/ajuda/${chamadoId}?enviado=1`
  );
}