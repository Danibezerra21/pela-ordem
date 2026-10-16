"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function informarPagamentoPix(formData: FormData) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Usuário não autenticado.");
  }

  const { data: membro, error: erroMembro } = await supabase
    .from("membros_empresa")
    .select("empresa_id, papel")
    .eq("usuario_id", user.id)
    .eq("ativo", true)
    .maybeSingle();

  if (erroMembro || !membro) {
    throw new Error("Empresa não localizada.");
  }

  if (membro.papel !== "master") {
    throw new Error(
      "Somente o usuário Master pode informar o pagamento da assinatura."
    );
  }

  const { data: configuracao, error: erroConfiguracao } = await admin
    .from("configuracoes_plataforma")
    .select("beta_ativa, valor_mensal")
    .eq("id", true)
    .single();

  if (erroConfiguracao || !configuracao) {
    throw new Error(
      "Não foi possível carregar a configuração comercial."
    );
  }

  if (configuracao.beta_ativa) {
    throw new Error(
      "A contratação não está disponível durante a versão Beta."
    );
  }

  const nomePagador = String(
    formData.get("nome_pagador") ?? ""
  )
    .trim()
    .replace(/\s+/g, " ");

  const whatsapp = String(
    formData.get("whatsapp") ?? ""
  ).trim();

  if (nomePagador.length < 3) {
    throw new Error(
      "Informe o nome de quem realizou o Pix."
    );
  }

  const whatsappNumeros = whatsapp.replace(/\D/g, "");

  if (whatsappNumeros.length < 10) {
    throw new Error(
      "Informe um WhatsApp válido para contato."
    );
  }

  const { data: perfil } = await admin
    .from("perfis_usuarios")
    .select("email")
    .eq("id", user.id)
    .maybeSingle();

  const email = perfil?.email ?? user.email ?? "";

  const { data: pendente, error: erroPendente } = await admin
    .from("pagamentos_pix_manuais")
    .select("id")
    .eq("empresa_id", membro.empresa_id)
    .eq("status", "aguardando_confirmacao")
    .maybeSingle();

  if (erroPendente) {
    throw new Error(
      `Não foi possível verificar pagamentos pendentes: ${erroPendente.message}`
    );
  }

  if (pendente) {
    throw new Error(
      "Já existe um pagamento aguardando conferência."
    );
  }

  const { error: erroCriacao } = await admin
    .from("pagamentos_pix_manuais")
    .insert({
      empresa_id: membro.empresa_id,
      usuario_id: user.id,
      valor: Number(configuracao.valor_mensal),
      nome_pagador: nomePagador,
      email_contato: email,
      whatsapp_contato: whatsapp,
      status: "aguardando_confirmacao",
    });

  if (erroCriacao) {
    if (erroCriacao.code === "23505") {
      throw new Error(
        "Já existe um pagamento aguardando conferência."
      );
    }

    throw new Error(
      `Não foi possível registrar o pagamento: ${erroCriacao.message}`
    );
  }

  revalidatePath("/protected/configuracoes");
  revalidatePath("/protected/suporte");
  revalidatePath("/protected/suporte/pagamentos");
}
