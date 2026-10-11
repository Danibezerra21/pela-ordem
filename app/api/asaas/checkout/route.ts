import { NextResponse } from "next/server";

import { asaasRequest } from "@/lib/asaas/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type CriarCheckoutBody = {
  planoCodigo?: string;
};

type AsaasCheckoutResponse = {
  id: string;
};

function formatarDataRecife(data: Date) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Recife",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(data);

  const obter = (tipo: string) =>
    partes.find((parte) => parte.type === tipo)?.value ?? "";

  return `${obter("year")}-${obter("month")}-${obter("day")}`;
}

function formatarDataHoraRecife(data: Date) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Recife",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(data);

  const obter = (tipo: string) =>
    partes.find((parte) => parte.type === tipo)?.value ?? "";

  return (
    `${obter("year")}-${obter("month")}-${obter("day")} ` +
    `${obter("hour")}:${obter("minute")}:${obter("second")}`
  );
}

function montarUrlCheckoutAsaas(checkoutId: string) {
  const baseApi = (
    process.env.ASAAS_BASE_URL ??
    "https://api.asaas.com/v3"
  ).toLowerCase();

  const basePublica = baseApi.includes("sandbox")
    ? "https://sandbox.asaas.com"
    : "https://asaas.com";

  return (
    `${basePublica}/checkoutSession/show?id=` +
    encodeURIComponent(checkoutId)
  );
}

async function aguardarUrlCanonicaCheckout(
  admin: ReturnType<typeof createAdminClient>,
  contratacaoId: string
) {
  for (let tentativa = 0; tentativa < 20; tentativa += 1) {
    const {
      data: checkoutAtual,
      error: erroConsulta,
    } = await admin
      .from("contratacoes_checkout")
      .select("asaas_checkout_url")
      .eq("id", contratacaoId)
      .maybeSingle();

    if (erroConsulta) {
      console.error(
        "Erro ao consultar URL canônica do Checkout:",
        erroConsulta
      );
    }

    if (checkoutAtual?.asaas_checkout_url) {
      return checkoutAtual.asaas_checkout_url as string;
    }

    await new Promise((resolve) =>
      setTimeout(resolve, 250)
    );
  }

  return null;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const admin = createAdminClient();

  /* =====================================================
     AUTENTICAÇÃO
  ===================================================== */

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

  let body: CriarCheckoutBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        mensagem: "Dados inválidos.",
      },
      {
        status: 400,
      }
    );
  }

  const planoCodigo = body.planoCodigo?.trim();

  if (!planoCodigo) {
    return NextResponse.json(
      {
        ok: false,
        mensagem: "Plano não informado.",
      },
      {
        status: 400,
      }
    );
  }

  /* =====================================================
     EMPRESA + MASTER
  ===================================================== */

  const {
    data: membro,
    error: erroMembro,
  } = await supabase
    .from("membros_empresa")
    .select("empresa_id, papel")
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

  if (membro.papel !== "master") {
    return NextResponse.json(
      {
        ok: false,
        mensagem: "Somente o usuário Master pode contratar ou alterar o plano.",
      },
      {
        status: 403,
      }
    );
  }

  const empresaId = membro.empresa_id;

  const { data: empresa } = await admin
    .from("empresas")
    .select("id")
    .eq("id", empresaId)
    .single();

  if (!empresa) {
    return NextResponse.json(
      {
        ok: false,
        mensagem: "Empresa não localizada.",
      },
      {
        status: 404,
      }
    );
  }

  /* =====================================================
     PLANO OFICIAL
     VALOR NUNCA VEM DO NAVEGADOR
  ===================================================== */

  const {
    data: plano,
    error: erroPlano,
  } = await admin
    .from("planos_comerciais")
    .select(`
      codigo,
      nome,
      ciclo,
      valor,
      descricao,
      ativo
    `)
    .eq("codigo", planoCodigo)
    .eq("ativo", true)
    .maybeSingle();

  if (erroPlano || !plano) {
    return NextResponse.json(
      {
        ok: false,
        mensagem: "Plano não localizado.",
      },
      {
        status: 404,
      }
    );
  }

  const valorPlano = Number(plano.valor);

  if (!Number.isFinite(valorPlano) || valorPlano <= 0) {
    return NextResponse.json(
      {
        ok: false,
        mensagem: "Valor do plano inválido.",
      },
      {
        status: 500,
      }
    );
  }

  /* =====================================================
     CONTA COMERCIAL
  ===================================================== */

  const {
    data: conta,
    error: erroConta,
  } = await admin
    .from("contas_comerciais")
    .select(`
      id,
      status_comercial,
      teste_inicio,
      teste_fim,
      asaas_customer_id
    `)
    .eq("empresa_id", empresaId)
    .maybeSingle();

  if (erroConta || !conta) {
    return NextResponse.json(
      {
        ok: false,
        mensagem: "Conta comercial não localizada.",
      },
      {
        status: 500,
      }
    );
  }

  /* =====================================================
     ASSINATURA JÁ EXISTENTE
  ===================================================== */

  const {
    data: assinaturaAtual,
    error: erroAssinatura,
  } = await admin
    .from("assinaturas_empresas")
    .select(`
      id,
      plano_codigo,
      ciclo,
      status_interno,
      vigente
    `)
    .eq("empresa_id", empresaId)
    .eq("vigente", true)
    .maybeSingle();

  if (erroAssinatura) {
    return NextResponse.json(
      {
        ok: false,
        mensagem: "Não foi possível verificar a assinatura atual.",
      },
      {
        status: 500,
      }
    );
  }

  if (assinaturaAtual?.status_interno === "ativa") {
    if (
      assinaturaAtual.plano_codigo === plano.codigo &&
      assinaturaAtual.ciclo === plano.ciclo
    ) {
      return NextResponse.json(
        {
          ok: false,
          mensagem: "Este já é o seu plano atual.",
        },
        {
          status: 409,
        }
      );
    }

    const {
      data: mudancaId,
      error: erroMudanca,
    } = await supabase.rpc("agendar_mudanca_plano", {
      p_assinatura_atual_id: assinaturaAtual.id,
      p_novo_plano_codigo: plano.codigo,
      p_novo_ciclo: plano.ciclo,
      p_novo_valor: valorPlano,
      p_novo_desconto_percentual: 0,
    });

    if (erroMudanca) {
      return NextResponse.json(
        {
          ok: false,
          mensagem: erroMudanca.message,
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json({
      ok: true,
      tipo: "mudanca_agendada",
      mudancaId,
      mensagem:
        "A mudança foi agendada para o término do período atual. Nenhuma nova cobrança foi realizada.",
    });
  }

  if (assinaturaAtual?.status_interno === "pendente") {
    return NextResponse.json(
      {
        ok: false,
        mensagem:
          "Já existe uma contratação concluída aguardando confirmação do pagamento.",
      },
      {
        status: 409,
      }
    );
  }

  /* =====================================================
     CHECKOUT ANTERIOR
  ===================================================== */

  const {
    data: checkoutAberto,
    error: erroCheckoutAberto,
  } = await admin
    .from("contratacoes_checkout")
    .select(`
      id,
      plano_codigo,
      asaas_checkout_id,
      asaas_checkout_url,
      status,
      primeira_cobranca_em,
      expira_em
    `)
    .eq("empresa_id", empresaId)
    .in("status", ["preparando", "ativo"])
    .order("criada_em", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (erroCheckoutAberto) {
    console.error(
      "Erro ao consultar Checkout anterior:",
      erroCheckoutAberto
    );

    return NextResponse.json(
      {
        ok: false,
        mensagem: "Não foi possível verificar a contratação anterior.",
      },
      {
        status: 500,
      }
    );
  }

  if (checkoutAberto) {
    const agora = new Date();

    const expiracao = checkoutAberto.expira_em
      ? new Date(checkoutAberto.expira_em)
      : null;

    const expirado = expiracao
      ? expiracao.getTime() <= agora.getTime()
      : false;

    if (
      checkoutAberto.asaas_checkout_id &&
      !expirado &&
      checkoutAberto.plano_codigo === plano.codigo
    ) {
      const urlCanonica =
        checkoutAberto.asaas_checkout_url ||
        (await aguardarUrlCanonicaCheckout(
          admin,
          checkoutAberto.id
        ));

      const checkoutUrl =
        urlCanonica ||
        montarUrlCheckoutAsaas(
          checkoutAberto.asaas_checkout_id
        );

      return NextResponse.json({
        ok: true,
        tipo: "checkout",
        checkoutId: checkoutAberto.asaas_checkout_id,
        checkoutUrl,
        primeiraCobrancaEm:
          checkoutAberto.primeira_cobranca_em,
        reutilizado: true,
      });
    }

    if (expirado) {
      const {
        error: erroExpirar,
      } = await admin
        .from("contratacoes_checkout")
        .update({
          status: "expirado",
          expirada_em: agora.toISOString(),
        })
        .eq("id", checkoutAberto.id);

      if (erroExpirar) {
        console.error(
          "Erro ao expirar Checkout anterior:",
          erroExpirar
        );

        return NextResponse.json(
          {
            ok: false,
            mensagem: "Não foi possível reiniciar a contratação.",
          },
          {
            status: 500,
          }
        );
      }
    } else if (!checkoutAberto.asaas_checkout_id) {
      const {
        error: erroCancelarRegistro,
      } = await admin
        .from("contratacoes_checkout")
        .update({
          status: "cancelado",
          cancelada_em: agora.toISOString(),
        })
        .eq("id", checkoutAberto.id);

      if (erroCancelarRegistro) {
        console.error(
          "Erro ao encerrar tentativa incompleta:",
          erroCancelarRegistro
        );

        return NextResponse.json(
          {
            ok: false,
            mensagem: "Não foi possível reiniciar a contratação.",
          },
          {
            status: 500,
          }
        );
      }
    } else if (
      checkoutAberto.plano_codigo !== plano.codigo
    ) {
      try {
        await asaasRequest(
          `/checkouts/${checkoutAberto.asaas_checkout_id}/cancel`,
          {
            method: "POST",
          }
        );

        const {
          error: erroCancelar,
        } = await admin
          .from("contratacoes_checkout")
          .update({
            status: "cancelado",
            cancelada_em: agora.toISOString(),
          })
          .eq("id", checkoutAberto.id);

        if (erroCancelar) {
          throw erroCancelar;
        }
      } catch (error: unknown) {
        console.error(
          "Erro ao trocar Checkout de plano:",
          error
        );

        return NextResponse.json(
          {
            ok: false,
            mensagem:
              "Não foi possível trocar o plano da contratação neste momento. Tente novamente.",
          },
          {
            status: 409,
          }
        );
      }
    }
  }

  /* =====================================================
     PRIMEIRA COBRANÇA
     REGRA DEFINITIVA: CONTRATOU = COBRA AGORA
  ===================================================== */

  const primeiraCobranca = new Date();

  const primeiraCobrancaEm =
    formatarDataRecife(primeiraCobranca);

  const primeiraCobrancaAsaas =
    formatarDataHoraRecife(primeiraCobranca);

  /* =====================================================
     CRIA PEDIDO INTERNO PRIMEIRO
  ===================================================== */

  const {
    data: contratacao,
    error: erroCriacaoInterna,
  } = await admin
    .from("contratacoes_checkout")
    .insert({
      empresa_id: empresaId,
      plano_codigo: plano.codigo,
      ciclo_snapshot: plano.ciclo,
      valor_snapshot: valorPlano,
      status: "preparando",
      primeira_cobranca_em: primeiraCobrancaEm,
      criado_por: user.id,
    })
    .select("id")
    .single();

  if (erroCriacaoInterna || !contratacao) {
    console.error(
      "Erro ao criar contratação interna:",
      erroCriacaoInterna
    );

    return NextResponse.json(
      {
        ok: false,
        mensagem: "Não foi possível iniciar a contratação.",
      },
      {
        status: 500,
      }
    );
  }

  /* =====================================================
     CRIA CHECKOUT ASAAS
  ===================================================== */

  const origin = new URL(request.url).origin;

  const cicloAsaas =
    plano.ciclo === "anual"
      ? "YEARLY"
      : "MONTHLY";

  try {
    const checkout = await asaasRequest<AsaasCheckoutResponse>(
      "/checkouts",
      {
        method: "POST",
        body: JSON.stringify({
          billingTypes: [
            "CREDIT_CARD",
            "PIX",
          ],
          chargeTypes: ["RECURRENT"],
          minutesToExpire: 1440,
          externalReference: contratacao.id,

          ...(conta.asaas_customer_id
            ? {
                customer: conta.asaas_customer_id,
              }
            : {}),

          callback: {
            successUrl:
              `${origin}/protected/configuracoes?checkout=sucesso`,
            cancelUrl:
              `${origin}/protected/configuracoes?checkout=cancelado`,
            expiredUrl:
              `${origin}/protected/configuracoes?checkout=expirado`,
          },

          items: [
            {
              name: plano.nome,
              description:
                plano.descricao ??
                `Assinatura ${plano.nome}`,
              quantity: 1,
              value: valorPlano,
            },
          ],

          subscription: {
            cycle: cicloAsaas,
            nextDueDate: primeiraCobrancaAsaas,
          },
        }),
      }
    );

    if (!checkout.id) {
      throw new Error(
        "Asaas não retornou o identificador do Checkout."
      );
    }

    const expiraEm = new Date(
      Date.now() +
        24 *
          60 *
          60 *
          1000
    );

    const {
      error: erroAtualizacao,
    } = await admin
      .from("contratacoes_checkout")
      .update({
        asaas_checkout_id: checkout.id,
        status: "ativo",
        expira_em: expiraEm.toISOString(),
      })
      .eq("id", contratacao.id);

    if (erroAtualizacao) {
      throw erroAtualizacao;
    }

    const urlCanonica =
      await aguardarUrlCanonicaCheckout(
        admin,
        contratacao.id
      );

    const checkoutUrl =
      urlCanonica ||
      montarUrlCheckoutAsaas(checkout.id);

    return NextResponse.json({
      ok: true,
      tipo: "checkout",
      checkoutId: checkout.id,
      checkoutUrl,
      primeiraCobrancaEm,
    });
  } catch (error: unknown) {
    const mensagem =
      error instanceof Error
        ? error.message
        : "Erro desconhecido.";

    console.error(
      "Erro ao criar Checkout Asaas:",
      mensagem
    );

    await admin
      .from("contratacoes_checkout")
      .update({
        status: "erro",
        erro: mensagem.slice(0, 2000),
      })
      .eq("id", contratacao.id);

    return NextResponse.json(
      {
        ok: false,
        mensagem:
          "Não foi possível abrir o ambiente de contratação.",
      },
      {
        status: 502,
      }
    );
  }
}
