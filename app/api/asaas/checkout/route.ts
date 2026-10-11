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


function formatarDataRecife(
  data: Date
) {
  const partes =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "America/Recife",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).formatToParts(data);

  const obter =
    (tipo: string) =>
      partes.find(
        (parte) =>
          parte.type === tipo
      )?.value ?? "";

  return `${obter("year")}-${obter("month")}-${obter("day")}`;
}


function formatarDataHoraRecife(
  data: Date
) {
  const partes =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "America/Recife",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      }
    ).formatToParts(data);

  const obter =
    (tipo: string) =>
      partes.find(
        (parte) =>
          parte.type === tipo
      )?.value ?? "";

  return (
    `${obter("year")}-${obter("month")}-${obter("day")} ` +
    `${obter("hour")}:${obter("minute")}:${obter("second")}`
  );
}


export async function POST(
  request: Request
) {
  const supabase =
    await createClient();

  const admin =
    createAdminClient();


  /* =====================================================
     AUTENTICAÇÃO
  ===================================================== */

  const {
    data: {
      user,
    },
    error:
      authError,
  } =
    await supabase
      .auth
      .getUser();


  if (
    authError ||
    !user
  ) {
    return NextResponse.json(
      {
        ok: false,
        mensagem:
          "Usuário não autenticado.",
      },
      {
        status: 401,
      }
    );
  }


  let body:
    CriarCheckoutBody;

  try {
    body =
      await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        mensagem:
          "Dados inválidos.",
      },
      {
        status: 400,
      }
    );
  }


  const planoCodigo =
    body.planoCodigo
      ?.trim();


  if (!planoCodigo) {
    return NextResponse.json(
      {
        ok: false,
        mensagem:
          "Plano não informado.",
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
    data:
      membro,
    error:
      erroMembro,
  } =
    await supabase
      .from(
        "membros_empresa"
      )
      .select(
        "empresa_id, papel"
      )
      .eq(
        "usuario_id",
        user.id
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
    return NextResponse.json(
      {
        ok: false,
        mensagem:
          "Empresa não localizada.",
      },
      {
        status: 403,
      }
    );
  }


  if (
    membro.papel !==
    "master"
  ) {
    return NextResponse.json(
      {
        ok: false,
        mensagem:
          "Somente o usuário Master pode contratar ou alterar o plano.",
      },
      {
        status: 403,
      }
    );
  }


  const empresaId =
    membro.empresa_id;


  const {
    data:
      empresa,
  } =
    await admin
      .from(
        "empresas"
      )
      .select(
        "id, nome, status_acesso"
      )
      .eq(
        "id",
        empresaId
      )
      .single();


  if (!empresa) {
    return NextResponse.json(
      {
        ok: false,
        mensagem:
          "Empresa não localizada.",
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
    data:
      plano,
    error:
      erroPlano,
  } =
    await admin
      .from(
        "planos_comerciais"
      )
      .select(`
        codigo,
        nome,
        ciclo,
        valor,
        descricao,
        ativo
      `)
      .eq(
        "codigo",
        planoCodigo
      )
      .eq(
        "ativo",
        true
      )
      .maybeSingle();


  if (
    erroPlano ||
    !plano
  ) {
    return NextResponse.json(
      {
        ok: false,
        mensagem:
          "Plano não localizado.",
      },
      {
        status: 404,
      }
    );
  }


  const valorPlano =
    Number(
      plano.valor
    );


  if (
    !Number.isFinite(
      valorPlano
    ) ||
    valorPlano <= 0
  ) {
    return NextResponse.json(
      {
        ok: false,
        mensagem:
          "Valor do plano inválido.",
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
    data:
      conta,
    error:
      erroConta,
  } =
    await admin
      .from(
        "contas_comerciais"
      )
      .select(`
        id,
        status_comercial,
        teste_inicio,
        teste_fim,
        asaas_customer_id
      `)
      .eq(
        "empresa_id",
        empresaId
      )
      .maybeSingle();


  if (
    erroConta ||
    !conta
  ) {
    return NextResponse.json(
      {
        ok: false,
        mensagem:
          "Conta comercial não localizada.",
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
    data:
      assinaturaAtual,
    error:
      erroAssinatura,
  } =
    await admin
      .from(
        "assinaturas_empresas"
      )
      .select(`
        id,
        plano_codigo,
        ciclo,
        status_interno,
        vigente
      `)
      .eq(
        "empresa_id",
        empresaId
      )
      .eq(
        "vigente",
        true
      )
      .maybeSingle();


  if (
    erroAssinatura
  ) {
    return NextResponse.json(
      {
        ok: false,
        mensagem:
          "Não foi possível verificar a assinatura atual.",
      },
      {
        status: 500,
      }
    );
  }


  /*
   * Cliente já possui plano efetivamente ativo:
   * não cobramos novamente.
   *
   * Registramos apenas a mudança futura.
   */
  if (
    assinaturaAtual
      ?.status_interno ===
    "ativa"
  ) {
    if (
      assinaturaAtual
        .plano_codigo ===
        plano.codigo &&
      assinaturaAtual
        .ciclo ===
        plano.ciclo
    ) {
      return NextResponse.json(
        {
          ok: false,
          mensagem:
            "Este já é o seu plano atual.",
        },
        {
          status: 409,
        }
      );
    }


    const {
      data:
        mudancaId,
      error:
        erroMudanca,
    } =
      await supabase
        .rpc(
          "agendar_mudanca_plano",
          {
            p_assinatura_atual_id:
              assinaturaAtual.id,

            p_novo_plano_codigo:
              plano.codigo,

            p_novo_ciclo:
              plano.ciclo,

            p_novo_valor:
              valorPlano,

            p_novo_desconto_percentual:
              0,
          }
        );


    if (
      erroMudanca
    ) {
      return NextResponse.json(
        {
          ok: false,
          mensagem:
            erroMudanca.message,
        },
        {
          status: 400,
        }
      );
    }


    return NextResponse.json({
      ok: true,
      tipo:
        "mudanca_agendada",
      mudancaId,
      mensagem:
        "A mudança foi agendada para o término do período atual. Nenhuma nova cobrança foi realizada.",
    });
  }


  /*
   * Existe uma assinatura criada,
   * mas ainda aguardando a primeira cobrança.
   */
  if (
    assinaturaAtual
      ?.status_interno ===
    "pendente"
  ) {
    return NextResponse.json(
      {
        ok: false,
        mensagem:
          "Já existe uma contratação concluída aguardando o início da cobrança.",
      },
      {
        status: 409,
      }
    );
  }


  /* =====================================================
     CANCELA CHECKOUT ABERTO ANTERIOR
  ===================================================== */

  const {
    data:
      checkoutAberto,
  } =
    await admin
      .from(
        "contratacoes_checkout"
      )
      .select(
        "id, asaas_checkout_id, status"
      )
      .eq(
        "empresa_id",
        empresaId
      )
      .in(
        "status",
        [
          "preparando",
          "ativo",
        ]
      )
      .maybeSingle();


  if (
    checkoutAberto
      ?.asaas_checkout_id
  ) {
    try {
      await asaasRequest(
        `/checkouts/${checkoutAberto.asaas_checkout_id}/cancel`,
        {
          method:
            "POST",
        }
      );
    } catch (
      error:
        unknown
    ) {
      console.error(
        "Não foi possível cancelar o Checkout anterior:",
        error
      );

      return NextResponse.json(
        {
          ok: false,
          mensagem:
            "Já existe uma contratação em andamento. Tente novamente após cancelar ou expirar o Checkout anterior.",
        },
        {
          status: 409,
        }
      );
    }


    await admin
      .from(
        "contratacoes_checkout"
      )
      .update({
        status:
          "cancelado",

        cancelada_em:
          new Date()
            .toISOString(),
      })
      .eq(
        "id",
        checkoutAberto.id
      );
  } else if (
    checkoutAberto
  ) {
    await admin
      .from(
        "contratacoes_checkout"
      )
      .update({
        status:
          "cancelado",

        cancelada_em:
          new Date()
            .toISOString(),
      })
      .eq(
        "id",
        checkoutAberto.id
      );
  }


  /* =====================================================
     PRIMEIRA COBRANÇA
  ===================================================== */

  const agora =
    new Date();


  let primeiraCobranca =
    agora;


  if (
    conta.status_comercial ===
      "teste" &&
    conta.teste_fim
  ) {
    const fimTeste =
      new Date(
        conta.teste_fim
      );


    if (
      fimTeste.getTime() >
      agora.getTime()
    ) {
      primeiraCobranca =
        fimTeste;
    }
  }


  const primeiraCobrancaEm =
    formatarDataRecife(
      primeiraCobranca
    );


  const primeiraCobrancaAsaas =
    formatarDataHoraRecife(
      primeiraCobranca
    );


  /* =====================================================
     CRIA PEDIDO INTERNO PRIMEIRO
  ===================================================== */

  const {
    data:
      contratacao,
    error:
      erroCriacaoInterna,
  } =
    await admin
      .from(
        "contratacoes_checkout"
      )
      .insert({
        empresa_id:
          empresaId,

        plano_codigo:
          plano.codigo,

        ciclo_snapshot:
          plano.ciclo,

        valor_snapshot:
          valorPlano,

        status:
          "preparando",

        primeira_cobranca_em:
          primeiraCobrancaEm,

        criado_por:
          user.id,
      })
      .select(
        "id"
      )
      .single();


  if (
    erroCriacaoInterna ||
    !contratacao
  ) {
    return NextResponse.json(
      {
        ok: false,
        mensagem:
          "Não foi possível iniciar a contratação.",
      },
      {
        status: 500,
      }
    );
  }


  /* =====================================================
     CRIA CHECKOUT ASAAS
  ===================================================== */

  const origin =
    new URL(
      request.url
    ).origin;


  const cicloAsaas =
    plano.ciclo ===
      "anual"
      ? "YEARLY"
      : "MONTHLY";


  try {
    const checkout =
      await asaasRequest<AsaasCheckoutResponse>(
        "/checkouts",
        {
          method:
            "POST",

          body:
            JSON.stringify({
              billingTypes: [
                "CREDIT_CARD",
              ],

              chargeTypes: [
                "RECURRENT",
              ],

              minutesToExpire:
                60,

              externalReference:
                contratacao.id,

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
                  name:
                    plano.nome,

                  description:
                    plano.descricao ??
                    `Assinatura ${plano.nome}`,

                  quantity:
                    1,

                  value:
                    valorPlano,
                },
              ],

              subscription: {
                cycle:
                  cicloAsaas,

                nextDueDate:
                  primeiraCobrancaAsaas,
              },
            }),
        }
      );


    if (
      !checkout.id
    ) {
      throw new Error(
        "Asaas não retornou o identificador do Checkout."
      );
    }


    const expiraEm =
      new Date(
        Date.now() +
          60 *
            60 *
            1000
      );


    const {
      error:
        erroAtualizacao,
    } =
      await admin
        .from(
          "contratacoes_checkout"
        )
        .update({
          asaas_checkout_id:
            checkout.id,

          status:
            "ativo",

          expira_em:
            expiraEm
              .toISOString(),
        })
        .eq(
          "id",
          contratacao.id
        );


    if (
      erroAtualizacao
    ) {
      throw erroAtualizacao;
    }


    /*
     * O Asaas documenta esta URL
     * para disponibilizar o Checkout.
     */
    const checkoutUrl =
      `https://asaas.com/checkoutSession/show?id=${encodeURIComponent(
        checkout.id
      )}`;


    return NextResponse.json({
      ok: true,
      tipo:
        "checkout",
      checkoutId:
        checkout.id,
      checkoutUrl,
      primeiraCobrancaEm,
    });
  } catch (
    error:
      unknown
  ) {
    const mensagem =
      error instanceof
        Error
        ? error.message
        : "Erro desconhecido.";


    console.error(
      "Erro ao criar Checkout Asaas:",
      mensagem
    );


    await admin
      .from(
        "contratacoes_checkout"
      )
      .update({
        status:
          "erro",

        erro:
          mensagem.slice(
            0,
            2000
          ),
      })
      .eq(
        "id",
        contratacao.id
      );


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