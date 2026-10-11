import {
  createHash,
  timingSafeEqual,
} from "node:crypto";

import {
  NextResponse,
} from "next/server";

import {
  createAdminClient,
} from "@/lib/supabase/admin";


type CheckoutPayload = {
  id?: string;
  status?: string;
  customer?: string | null;

  subscription?: {
    cycle?: string | null;
    nextDueDate?: string | null;
    endDate?: string | null;
  } | null;

  [key: string]:
    unknown;
};


type AsaasWebhookPayload = {
  id?: string;
  event?: string;
  dateCreated?: string;

  checkout?:
    CheckoutPayload;

  [key: string]:
    unknown;
};


const EVENTOS_CHECKOUT =
  new Set([
    "CHECKOUT_CREATED",
    "CHECKOUT_PAID",
    "CHECKOUT_CANCELED",
    "CHECKOUT_EXPIRED",
  ]);


function compararTokens(
  recebido: string,
  esperado: string
) {
  const recebidoHash =
    createHash("sha256")
      .update(recebido)
      .digest();

  const esperadoHash =
    createHash("sha256")
      .update(esperado)
      .digest();


  return timingSafeEqual(
    recebidoHash,
    esperadoHash
  );
}


export async function POST(
  request: Request
) {
  const tokenEsperado =
    process.env
      .ASAAS_WEBHOOK_TOKEN;


  if (!tokenEsperado) {
    console.error(
      "ASAAS_WEBHOOK_TOKEN não configurado."
    );

    return NextResponse.json(
      {
        ok: false,
      },
      {
        status: 500,
      }
    );
  }


  const tokenRecebido =
    request.headers.get(
      "asaas-access-token"
    );


  if (
    !tokenRecebido ||
    !compararTokens(
      tokenRecebido,
      tokenEsperado
    )
  ) {
    return NextResponse.json(
      {
        ok: false,
        erro:
          "Webhook não autorizado.",
      },
      {
        status: 401,
      }
    );
  }


  let payload:
    AsaasWebhookPayload;


  try {
    payload =
      await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        erro:
          "Payload inválido.",
      },
      {
        status: 400,
      }
    );
  }


  const eventoId =
    payload.id;

  const tipoEvento =
    payload.event;


  if (
    !eventoId ||
    !tipoEvento
  ) {
    return NextResponse.json(
      {
        ok: false,
        erro:
          "Evento sem identificação.",
      },
      {
        status: 400,
      }
    );
  }


  const checkout =
    payload.checkout;

  const checkoutId =
    checkout?.id ??
    null;


  const admin =
    createAdminClient();


  /* =====================================================
     IDEMPOTÊNCIA
  ===================================================== */

  const {
    data:
      eventoExistente,
    error:
      erroConsultaEvento,
  } =
    await admin
      .from(
        "asaas_webhook_eventos"
      )
      .select(
        "evento_id, status_processamento"
      )
      .eq(
        "evento_id",
        eventoId
      )
      .maybeSingle();


  if (
    erroConsultaEvento
  ) {
    console.error(
      "Erro ao consultar evento Asaas:",
      erroConsultaEvento
    );

    return NextResponse.json(
      {
        ok: false,
      },
      {
        status: 500,
      }
    );
  }


  if (
    eventoExistente
      ?.status_processamento ===
    "processado"
  ) {
    return NextResponse.json({
      ok: true,
      duplicado: true,
    });
  }


  if (!eventoExistente) {
    const {
      error:
        erroInsertEvento,
    } =
      await admin
        .from(
          "asaas_webhook_eventos"
        )
        .insert({
          evento_id:
            eventoId,

          tipo_evento:
            tipoEvento,

          recurso_tipo:
            checkoutId
              ? "checkout"
              : null,

          recurso_id:
            checkoutId,

          payload,

          status_processamento:
            "recebido",
        });


    /*
     * Pode haver uma corrida:
     * duas entregas do mesmo evento
     * chegando praticamente juntas.
     */
    if (
      erroInsertEvento &&
      erroInsertEvento.code !==
        "23505"
    ) {
      console.error(
        "Erro ao persistir webhook:",
        erroInsertEvento
      );

      return NextResponse.json(
        {
          ok: false,
        },
        {
          status: 500,
        }
      );
    }
  }


  await admin
    .from(
      "asaas_webhook_eventos"
    )
    .update({
      status_processamento:
        "processando",

      erro:
        null,
    })
    .eq(
      "evento_id",
      eventoId
    );


  try {
    /* ===================================================
       EVENTOS QUE AINDA NÃO PROCESSAMOS
    =================================================== */

    if (
      !EVENTOS_CHECKOUT.has(
        tipoEvento
      )
    ) {
      await admin
        .from(
          "asaas_webhook_eventos"
        )
        .update({
          status_processamento:
            "processado",

          processado_em:
            new Date()
              .toISOString(),
        })
        .eq(
          "evento_id",
          eventoId
        );


      return NextResponse.json({
        ok: true,
        ignorado: true,
      });
    }


    if (!checkoutId) {
      throw new Error(
        "Evento de Checkout sem checkout.id."
      );
    }


    /* ===================================================
       LOCALIZA O CHECKOUT DO NOTE LITIS
    =================================================== */

    const {
      data:
        contratacao,
      error:
        erroContratacao,
    } =
      await admin
        .from(
          "contratacoes_checkout"
        )
        .select(
          "id, empresa_id, status"
        )
        .eq(
          "asaas_checkout_id",
          checkoutId
        )
        .maybeSingle();


    if (
      erroContratacao
    ) {
      throw erroContratacao;
    }


    if (!contratacao) {
      /*
       * Pode acontecer se o webhook chegar
       * alguns instantes antes de o backend
       * terminar de salvar o ID retornado
       * pelo Asaas.
       *
       * Retornaremos erro para permitir
       * nova tentativa do Asaas.
       */
      throw new Error(
        `Checkout ${checkoutId} ainda não localizado no NOTE LITIS.`
      );
    }


    /* ===================================================
       SINCRONIZA ESTADO
    =================================================== */

    const atualizacao:
      Record<
        string,
        unknown
      > = {
        asaas_customer_id:
          checkout
            ?.customer ??
          null,
      };


    switch (
      tipoEvento
    ) {
      case "CHECKOUT_CREATED":
        atualizacao.status =
          "ativo";
        break;


      case "CHECKOUT_PAID":
        atualizacao.status =
          "pago";

        atualizacao.concluida_em =
          new Date()
            .toISOString();

        break;


      case "CHECKOUT_CANCELED":
        atualizacao.status =
          "cancelado";

        atualizacao.cancelada_em =
          new Date()
            .toISOString();

        break;


      case "CHECKOUT_EXPIRED":
        atualizacao.status =
          "expirado";

        atualizacao.expirada_em =
          new Date()
            .toISOString();

        break;
    }


    const {
      error:
        erroAtualizacao,
    } =
      await admin
        .from(
          "contratacoes_checkout"
        )
        .update(
          atualizacao
        )
        .eq(
          "id",
          contratacao.id
        );


    if (
      erroAtualizacao
    ) {
      throw erroAtualizacao;
    }


    /* ===================================================
       EVENTO PROCESSADO
    =================================================== */

    const {
      error:
        erroFinalizacao,
    } =
      await admin
        .from(
          "asaas_webhook_eventos"
        )
        .update({
          empresa_id:
            contratacao
              .empresa_id,

          status_processamento:
            "processado",

          processado_em:
            new Date()
              .toISOString(),

          erro:
            null,
        })
        .eq(
          "evento_id",
          eventoId
        );


    if (
      erroFinalizacao
    ) {
      throw erroFinalizacao;
    }


    return NextResponse.json({
      ok: true,
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
      "Falha ao processar webhook Asaas:",
      mensagem
    );


    await admin
      .from(
        "asaas_webhook_eventos"
      )
      .update({
        status_processamento:
          "erro",

        erro:
          mensagem.slice(
            0,
            2000
          ),
      })
      .eq(
        "evento_id",
        eventoId
      );


    /*
     * Não respondemos 200 quando ainda
     * precisamos que o Asaas tente
     * novamente.
     */
    return NextResponse.json(
      {
        ok: false,
      },
      {
        status: 500,
      }
    );
  }
}