"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function obterContextoUsuario() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Usuário não autenticado.");
  }

  const {
    data: membro,
    error: erroMembro,
  } = await supabase
    .from("membros_empresa")
    .select("empresa_id")
    .eq("usuario_id", user.id)
    .eq("ativo", true)
    .maybeSingle();

  if (erroMembro || !membro) {
    throw new Error(
      "Não foi possível identificar sua empresa."
    );
  }

  const {
    data: perfil,
  } = await supabase
    .from("perfis_usuarios")
    .select("email")
    .eq("id", user.id)
    .maybeSingle();

  return {
    admin: createAdminClient(),
    user,
    empresaId: membro.empresa_id,
    email:
      perfil?.email ??
      user.email ??
      "",
  };
}

export async function abrirChamado(
  formData: FormData
) {
  const {
    admin,
    user,
    empresaId,
    email,
  } = await obterContextoUsuario();

  const categoria =
    String(
      formData.get("categoria") ?? ""
    ).trim();

  const assunto =
    String(
      formData.get("assunto") ?? ""
    ).trim();

  const descricao =
    String(
      formData.get("descricao") ?? ""
    ).trim();

  const whatsapp =
    String(
      formData.get("whatsapp") ?? ""
    ).trim();

  const paginaOrigem =
    String(
      formData.get("pagina_origem") ?? ""
    ).trim();

  const categoriasPermitidas = [
    "problema_tecnico",
    "duvida_utilizacao",
    "sugestao",
    "outro",
  ];

  if (
    !categoriasPermitidas.includes(
      categoria
    )
  ) {
    throw new Error(
      "Selecione uma categoria válida."
    );
  }

  if (assunto.length < 3) {
    throw new Error(
      "Informe o assunto do chamado."
    );
  }

  if (descricao.length < 10) {
    throw new Error(
      "Descreva o problema ou a dúvida com um pouco mais de detalhes."
    );
  }

  const {
    data: chamado,
    error,
  } = await admin
    .from("chamados_suporte")
    .insert({
      empresa_id: empresaId,
      usuario_id: user.id,
      categoria,
      assunto,
      descricao,
      status: "aguardando_suporte",
      pagina_origem:
        paginaOrigem || null,
      email_contato: email,
      whatsapp_contato:
        whatsapp || null,
    })
    .select("id")
    .single();

  if (error || !chamado) {
    throw new Error(
      `Não foi possível abrir o chamado: ${
        error?.message ??
        "erro desconhecido"
      }`
    );
  }

  revalidatePath(
    "/protected/ajuda"
  );

  redirect(
    `/protected/ajuda/${chamado.id}`
  );
}

export async function responderChamadoUsuario(
  formData: FormData
) {
  const {
    admin,
    user,
    empresaId,
  } = await obterContextoUsuario();

  const chamadoId =
    String(
      formData.get("chamado_id") ?? ""
    ).trim();

  const mensagem =
    String(
      formData.get("mensagem") ?? ""
    ).trim();

  if (!chamadoId) {
    throw new Error(
      "Chamado não informado."
    );
  }

  if (mensagem.length < 2) {
    throw new Error(
      "Digite sua mensagem."
    );
  }

  const {
    data: chamado,
    error: erroChamado,
  } = await admin
    .from("chamados_suporte")
    .select("id, status")
    .eq("id", chamadoId)
    .eq("empresa_id", empresaId)
    .eq("usuario_id", user.id)
    .maybeSingle();

  if (
    erroChamado ||
    !chamado
  ) {
    throw new Error(
      "Chamado não localizado."
    );
  }

  if (
    chamado.status ===
    "resolvido"
  ) {
    throw new Error(
      "Este chamado já foi encerrado."
    );
  }

  const agora =
    new Date().toISOString();

  const {
    error: erroMensagem,
  } = await admin
    .from(
      "chamados_suporte_mensagens"
    )
    .insert({
      chamado_id: chamadoId,
      autor_usuario_id: user.id,
      autor_tipo: "usuario",
      mensagem,
      criada_em: agora,
    });

  if (erroMensagem) {
    throw new Error(
      `Não foi possível enviar a mensagem: ${erroMensagem.message}`
    );
  }

  const {
    error: erroAtualizacao,
  } = await admin
    .from("chamados_suporte")
    .update({
      status:
        "aguardando_suporte",
      atualizado_em: agora,
    })
    .eq("id", chamadoId);

  if (erroAtualizacao) {
    throw new Error(
      `Não foi possível atualizar o chamado: ${erroAtualizacao.message}`
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
}