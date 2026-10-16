"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function obterAdministradorPlataforma() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error(
      "Usuário não autenticado."
    );
  }

  const admin = createAdminClient();

  const {
    data: administrador,
    error: erroAdministrador,
  } = await admin
    .from("administradores_plataforma")
    .select("id")
    .eq("usuario_id", user.id)
    .eq("ativo", true)
    .maybeSingle();

  if (erroAdministrador) {
    throw new Error(
      `Não foi possível validar o administrador: ${erroAdministrador.message}`
    );
  }

  if (!administrador) {
    throw new Error(
      "Usuário sem permissão para administrar o NOTE LITIS."
    );
  }

  return {
    admin,
    user,
  };
}

export async function alterarStatusBeta(
  formData: FormData
) {
  const {
    admin,
    user,
  } =
    await obterAdministradorPlataforma();

  const betaAtiva =
    formData.get("beta_ativa") ===
    "true";

  const { error } = await admin
    .from("configuracoes_plataforma")
    .update({
      beta_ativa: betaAtiva,
      atualizado_em:
        new Date().toISOString(),
      atualizado_por: user.id,
    })
    .eq("id", true);

  if (error) {
    throw new Error(
      `Não foi possível alterar a versão beta: ${error.message}`
    );
  }

  revalidatePath(
    "/protected/suporte"
  );

  revalidatePath(
    "/protected/configuracoes"
  );

  revalidatePath(
    "/protected"
  );
}

export async function salvarDataFimBeta(
  formData: FormData
) {
  const {
    admin,
    user,
  } =
    await obterAdministradorPlataforma();

  const valor =
    String(
      formData.get("beta_fim") ??
        ""
    ).trim();

  const betaFim =
    valor.length > 0
      ? valor
      : null;

  if (
    betaFim &&
    !/^\d{4}-\d{2}-\d{2}$/.test(
      betaFim
    )
  ) {
    throw new Error(
      "Informe uma data válida."
    );
  }

  const { error } = await admin
    .from("configuracoes_plataforma")
    .update({
      beta_fim: betaFim,
      atualizado_em:
        new Date().toISOString(),
      atualizado_por: user.id,
    })
    .eq("id", true);

  if (error) {
    throw new Error(
      `Não foi possível salvar a data da beta: ${error.message}`
    );
  }

  revalidatePath(
    "/protected/suporte"
  );

  revalidatePath(
    "/protected/configuracoes"
  );

  revalidatePath(
    "/protected"
  );
}

export async function responderChamadoSuporte(
  formData: FormData
) {
  const {
    admin,
    user,
  } =
    await obterAdministradorPlataforma();

  const chamadoId =
    String(
      formData.get("chamado_id") ??
        ""
    ).trim();

  const mensagem =
    String(
      formData.get("mensagem") ??
        ""
    ).trim();

  if (!chamadoId) {
    throw new Error(
      "Chamado não informado."
    );
  }

  if (mensagem.length < 2) {
    throw new Error(
      "Digite a resposta do suporte."
    );
  }

  const {
    data: chamado,
    error: erroChamado,
  } = await admin
    .from("chamados_suporte")
    .select("id, status")
    .eq("id", chamadoId)
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
    chamado.status === "resolvido"
  ) {
    throw new Error(
      "Reabra o chamado antes de enviar uma nova resposta."
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
      autor_tipo: "suporte",
      mensagem,
      criada_em: agora,
    });

  if (erroMensagem) {
    throw new Error(
      `Não foi possível registrar a resposta: ${erroMensagem.message}`
    );
  }

  const {
    error: erroAtualizacao,
  } = await admin
    .from("chamados_suporte")
    .update({
      status:
        "aguardando_usuario",
      atualizado_em: agora,
    })
    .eq("id", chamadoId);

  if (erroAtualizacao) {
    throw new Error(
      `Não foi possível atualizar o chamado: ${erroAtualizacao.message}`
    );
  }

  revalidatePath(
    `/protected/suporte/chamados/${chamadoId}`
  );

  revalidatePath(
    "/protected/suporte"
  );

  revalidatePath(
    `/protected/ajuda/${chamadoId}`
  );

  revalidatePath(
    "/protected/ajuda"
  );
}

export async function resolverChamado(
  formData: FormData
) {
  const { admin } =
    await obterAdministradorPlataforma();

  const chamadoId =
    String(
      formData.get("chamado_id") ??
        ""
    ).trim();

  if (!chamadoId) {
    throw new Error(
      "Chamado não informado."
    );
  }

  const agora =
    new Date().toISOString();

  const { error } = await admin
    .from("chamados_suporte")
    .update({
      status: "resolvido",
      resolvido_em: agora,
      atualizado_em: agora,
    })
    .eq("id", chamadoId);

  if (error) {
    throw new Error(
      `Não foi possível resolver o chamado: ${error.message}`
    );
  }

  revalidatePath(
    `/protected/suporte/chamados/${chamadoId}`
  );

  revalidatePath(
    "/protected/suporte"
  );

  revalidatePath(
    `/protected/ajuda/${chamadoId}`
  );

  revalidatePath(
    "/protected/ajuda"
  );
}

export async function reabrirChamado(
  formData: FormData
) {
  const { admin } =
    await obterAdministradorPlataforma();

  const chamadoId =
    String(
      formData.get("chamado_id") ??
        ""
    ).trim();

  if (!chamadoId) {
    throw new Error(
      "Chamado não informado."
    );
  }

  const agora =
    new Date().toISOString();

  const { error } = await admin
    .from("chamados_suporte")
    .update({
      status:
        "aguardando_suporte",
      resolvido_em: null,
      atualizado_em: agora,
    })
    .eq("id", chamadoId);

  if (error) {
    throw new Error(
      `Não foi possível reabrir o chamado: ${error.message}`
    );
  }

  revalidatePath(
    `/protected/suporte/chamados/${chamadoId}`
  );

  revalidatePath(
    "/protected/suporte"
  );

  revalidatePath(
    `/protected/ajuda/${chamadoId}`
  );

  revalidatePath(
    "/protected/ajuda"
  );
}

export async function confirmarPagamentoPix(
  formData: FormData
) {
  const {
    admin,
    user,
  } =
    await obterAdministradorPlataforma();

  const pagamentoId =
    String(
      formData.get(
        "pagamento_id"
      ) ?? ""
    ).trim();

  if (!pagamentoId) {
    throw new Error(
      "Pagamento não informado."
    );
  }

  const { error } =
    await admin.rpc(
      "confirmar_pagamento_pix_manual",
      {
        p_pagamento_id:
          pagamentoId,

        p_confirmado_por:
          user.id,
      }
    );

  if (error) {
    throw new Error(
      `Não foi possível confirmar o pagamento: ${error.message}`
    );
  }

  revalidatePath(
    "/protected/suporte"
  );

  revalidatePath(
    "/protected/suporte/pagamentos"
  );

  revalidatePath(
    "/protected/configuracoes"
  );
}

export async function marcarPagamentoPixNaoLocalizado(
  formData: FormData
) {
  const { admin } =
    await obterAdministradorPlataforma();

  const pagamentoId =
    String(
      formData.get(
        "pagamento_id"
      ) ?? ""
    ).trim();

  if (!pagamentoId) {
    throw new Error(
      "Pagamento não informado."
    );
  }

  const { error } = await admin
    .from("pagamentos_pix_manuais")
    .update({
      status:
        "nao_localizado",

      atualizado_em:
        new Date().toISOString(),

      observacao_suporte:
        "Pagamento não localizado na conferência bancária.",
    })
    .eq("id", pagamentoId)
    .eq(
      "status",
      "aguardando_confirmacao"
    );

  if (error) {
    throw new Error(
      `Não foi possível atualizar o pagamento: ${error.message}`
    );
  }

  revalidatePath(
    "/protected/suporte"
  );

  revalidatePath(
    "/protected/suporte/pagamentos"
  );

  revalidatePath(
    "/protected/configuracoes"
  );
}
