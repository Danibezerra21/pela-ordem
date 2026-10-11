import { NextResponse } from "next/server";

import { asaasRequest } from "@/lib/asaas/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type AsaasSubscription = {
  id: string;
  customer?: string | null;
  status?: string | null;
  value?: number | null;
  nextDueDate?: string | null;
  cycle?: string | null;
  billingType?: string | null;
  checkoutSession?: string | null;
};

type AsaasPayment = {
  id: string;
  customer?: string | null;
  subscription?: string | null;
  status?: string | null;
  value?: number | null;
  dueDate?: string | null;
  billingType?: string | null;
};

type AsaasList<T> = {
  data?: T[];
  hasMore?: boolean;
};

function menosUmDia(data: string) {
  const d = new Date(`${data.slice(0, 10)}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);

  return d.toISOString().slice(0, 10);
}

async function localizarAssinaturaPorCheckout(
  checkoutId: string
): Promise<AsaasSubscription | null> {
  let offset = 0;

  while (offset <= 1000) {
    const resposta = await asaasRequest<
      AsaasList<AsaasSubscription>
    >(
      `/subscriptions?includeDeleted=true&limit=100&offset=${offset}`
    );

    const assinatura =
      resposta.data?.find(
        (item) =>
          item.checkoutSession === checkoutId
      ) ?? null;

    if (assinatura) {
      return assinatura;
    }

    if (!resposta.hasMore) {
      break;
    }

    offset += 100;
  }

  return null;
}

export async function GET() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      {
        ok: false,
        mensagem: "Usuário não autenticado.",
      },
      {
        status: 401,
      }
    );
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
    return NextResponse.json(
      {
        ok: false,
        mensagem: "Empresa não localizada.",
      },
      {
        status: 403,
      }
    );
  }

  const empresaId = membro.empresa_id;

  /*
   * Se localmente já está ativa,
   * não fazemos chamada desnecessária ao Asaas.
   */
  const {
    data: assinaturaAtiva,
  } = await admin
    .from("assinaturas_empresas")
    .select("id")
    .eq("empresa_id", empresaId)
    .eq("status_interno", "ativa")
    .eq("vigente", true)
    .limit(1)
    .maybeSingle();

  if (assinaturaAtiva) {
    return NextResponse.json({
      ok: true,
      status: "ativa",
      reconciliado: false,
    });
  }

  /*
   * Contratação mais recente ainda aguardando
   * sincronização financeira.
   */
  const {
    data: contratacao,
    error: erroContratacao,
  } = await admin
    .from("contratacoes_checkout")
    .select(`
      id,
      empresa_id,
      plano_codigo,
      ciclo_snapshot,
      valor_snapshot,
      status,
      asaas_checkout_id
    `)
    .eq("empresa_id", empresaId)
    .in("status", ["preparando", "ativo", "pago"])
    .order("criada_em", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (erroContratacao) {
    console.error(
      "Erro ao consultar contratação:",
      erroContratacao
    );

    return NextResponse.json(
      {
        ok: false,
        mensagem:
          "Não foi possível verificar a contratação.",
      },
      {
        status: 500,
      }
    );
  }

  if (
    !contratacao ||
    !contratacao.asaas_checkout_id
  ) {
    return NextResponse.json({
      ok: true,
      status: "sem_contratacao",
      reconciliado: false,
    });
  }

  try {
    /*
     * 1. Localiza no Asaas a assinatura
     * gerada por ESTE Checkout.
     */
    const assinaturaAsaas =
      await localizarAssinaturaPorCheckout(
        contratacao.asaas_checkout_id
      );

    if (!assinaturaAsaas) {
      return NextResponse.json({
        ok: true,
        status: "processando",
        reconciliado: false,
      });
    }

    /*
     * 2. Obtém cobranças da assinatura.
     */
    const pagamentos =
      await asaasRequest<
        AsaasList<AsaasPayment>
      >(
        `/subscriptions/${encodeURIComponent(
          assinaturaAsaas.id
        )}/payments`
      );

    const pagamentoConfirmado =
      pagamentos.data?.find((pagamento) =>
        ["CONFIRMED", "RECEIVED"].includes(
          pagamento.status ?? ""
        )
      );

    /*
     * A assinatura existe, mas o pagamento
     * ainda não foi financeiramente confirmado.
     */
    if (
      !pagamentoConfirmado ||
      !pagamentoConfirmado.dueDate
    ) {
      return NextResponse.json({
        ok: true,
        status: "processando",
        reconciliado: false,
        assinaturaAsaas:
          assinaturaAsaas.id,
      });
    }

    const agora = new Date().toISOString();

    const {
      data: conta,
      error: erroConta,
    } = await admin
      .from("contas_comerciais")
      .select("id")
      .eq("empresa_id", empresaId)
      .single();

    if (erroConta || !conta) {
      throw new Error(
        "Conta comercial não localizada."
      );
    }

    const vigenciaInicio =
      pagamentoConfirmado.dueDate.slice(0, 10);

    const renovacaoEm =
      assinaturaAsaas.nextDueDate
        ?.slice(0, 10) ?? null;

    const vigenciaFim =
      renovacaoEm
        ? menosUmDia(renovacaoEm)
        : null;

    /*
     * 3. Registra/atualiza assinatura.
     */
    const {
      data: assinaturaLocal,
      error: erroAssinatura,
    } = await admin
      .from("assinaturas_empresas")
      .upsert(
        {
          empresa_id: empresaId,
          conta_comercial_id: conta.id,

          asaas_subscription_id:
            assinaturaAsaas.id,

          plano_codigo:
            contratacao.plano_codigo,

          ciclo:
            contratacao.ciclo_snapshot,

          valor_contratado:
            Number(
              contratacao.valor_snapshot
            ),

          desconto_percentual: 0,

          status_interno: "ativa",

          status_asaas:
            assinaturaAsaas.status ??
            "ACTIVE",

          inicio_em: agora,

          proxima_cobranca_em:
            renovacaoEm,

          vigente: true,

          vigencia_inicio:
            vigenciaInicio,

          vigencia_fim:
            vigenciaFim,

          renovacao_em:
            renovacaoEm,

          cancelamento_ate:
            vigenciaFim,

          renovacao_automatica: true,
        },
        {
          onConflict:
            "asaas_subscription_id",
        }
      )
      .select("id")
      .single();

    if (
      erroAssinatura ||
      !assinaturaLocal
    ) {
      throw erroAssinatura ??
        new Error(
          "Não foi possível registrar a assinatura."
        );
    }

    /*
     * 4. Registra a cobrança confirmada.
     */
    const {
      error: erroCobranca,
    } = await admin
      .from("cobrancas_assinaturas")
      .upsert(
        {
          empresa_id: empresaId,

          assinatura_id:
            assinaturaLocal.id,

          asaas_payment_id:
            pagamentoConfirmado.id,

          asaas_subscription_id:
            assinaturaAsaas.id,

          status_asaas:
            pagamentoConfirmado.status,

          forma_pagamento:
            pagamentoConfirmado.billingType ??
            assinaturaAsaas.billingType ??
            null,

          valor: Number(
            pagamentoConfirmado.value ??
              contratacao.valor_snapshot
          ),

          vencimento:
            vigenciaInicio,

          pagamento_confirmado_em:
            agora,

          pagamento_recebido_em:
            pagamentoConfirmado.status ===
            "RECEIVED"
              ? agora
              : null,

          payload_asaas: {
            origem:
              "reconciliacao_status",
            subscription:
              assinaturaAsaas,
            payment:
              pagamentoConfirmado,
          },
        },
        {
          onConflict:
            "asaas_payment_id",
        }
      );

    if (erroCobranca) {
      throw erroCobranca;
    }

    /*
     * 5. Encerra o Checkout interno.
     */
    const {
      error: erroCheckout,
    } = await admin
      .from("contratacoes_checkout")
      .update({
        status: "pago",
        concluida_em: agora,
      })
      .eq("id", contratacao.id);

    if (erroCheckout) {
      throw erroCheckout;
    }

    /*
     * 6. Conta comercial ativa.
     */
    const acessoAte = vigenciaFim
      ? new Date(
          `${vigenciaFim}T23:59:59-03:00`
        ).toISOString()
      : null;

    const {
      error: erroContaAtualizar,
    } = await admin
      .from("contas_comerciais")
      .update({
        asaas_customer_id:
          assinaturaAsaas.customer ??
          pagamentoConfirmado.customer ??
          null,

        status_comercial: "ativa",

        ultimo_pagamento_em:
          agora,

        acesso_ate:
          acessoAte,
      })
      .eq("empresa_id", empresaId);

    if (erroContaAtualizar) {
      throw erroContaAtualizar;
    }

    /*
     * 7. Libera acesso da empresa.
     */
    const {
      error: erroEmpresa,
    } = await admin
      .from("empresas")
      .update({
        status_acesso: "ativo",
        motivo_suspensao: null,
        atualizado_em: agora,
      })
      .eq("id", empresaId);

    if (erroEmpresa) {
      throw erroEmpresa;
    }

    return NextResponse.json({
      ok: true,
      status: "ativa",
      reconciliado: true,
      assinaturaAsaas:
        assinaturaAsaas.id,
      pagamentoAsaas:
        pagamentoConfirmado.id,
    });
  } catch (error: unknown) {
    const mensagem =
      error instanceof Error
        ? error.message
        : "Erro desconhecido.";

    console.error(
      "Erro ao reconciliar assinatura Asaas:",
      mensagem
    );

    /*
     * Importante:
     * falha de reconciliação não deve
     * derrubar a página de Configurações.
     */
    return NextResponse.json({
      ok: true,
      status: "processando",
      reconciliado: false,
      erroReconciliacao: mensagem,
    });
  }
}