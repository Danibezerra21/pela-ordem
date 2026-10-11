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

  link?: string | null;

  externalReference?: string | null;

};





type SubscriptionPayload = {

  id?: string;

  customer?: string;

  value?: number;

  nextDueDate?: string;

  cycle?: string;

  billingType?: string;

  status?: string;

  externalReference?: string | null;

};





type PaymentPayload = {

  id?: string;

  customer?: string;

  subscription?: string | null;

  value?: number;

  dueDate?: string;

  billingType?: string;

  status?: string;

};





type AsaasWebhookPayload = {

  id?: string;

  event?: string;

  dateCreated?: string;



  checkout?:

    CheckoutPayload;



  subscription?:

    SubscriptionPayload;



  payment?:

    PaymentPayload;

};





const EVENTOS_CHECKOUT =

  new Set([

    "CHECKOUT_CREATED",

    "CHECKOUT_PAID",

    "CHECKOUT_CANCELED",

    "CHECKOUT_EXPIRED",

  ]);





const EVENTOS_ASSINATURA =

  new Set([

    "SUBSCRIPTION_CREATED",

    "SUBSCRIPTION_UPDATED",

    "SUBSCRIPTION_INACTIVATED",

    "SUBSCRIPTION_DELETED",

  ]);





const EVENTOS_PAGAMENTO =

  new Set([

    "PAYMENT_CREATED",

    "PAYMENT_CONFIRMED",

    "PAYMENT_RECEIVED",

    "PAYMENT_OVERDUE",

    "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED",

    "PAYMENT_REFUNDED",

  ]);





function compararTokens(

  recebido: string,

  esperado: string

) {

  const recebidoHash =

    createHash(

      "sha256"

    )

      .update(recebido)

      .digest();



  const esperadoHash =

    createHash(

      "sha256"

    )

      .update(esperado)

      .digest();





  return timingSafeEqual(

    recebidoHash,

    esperadoHash

  );

}





function recursoEvento(

  payload:

    AsaasWebhookPayload

) {

  if (

    payload.checkout

      ?.id

  ) {

    return {

      tipo:

        "checkout",

      id:

        payload.checkout.id,

    };

  }





  if (

    payload.subscription

      ?.id

  ) {

    return {

      tipo:

        "subscription",

      id:

        payload.subscription.id,

    };

  }





  if (

    payload.payment

      ?.id

  ) {

    return {

      tipo:

        "payment",

      id:

        payload.payment.id,

    };

  }





  return {

    tipo:

      null,

    id:

      null,

  };

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





  const admin =

    createAdminClient();





  const recurso =

    recursoEvento(

      payload

    );





  /* =====================================================

     IDEMPOTÊNCIA

  ===================================================== */



  const {

    data:

      existente,

    error:

      erroConsulta,

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

    erroConsulta

  ) {

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

    existente

      ?.status_processamento ===

      "processado" ||

    existente

      ?.status_processamento ===

      "processando"

  ) {

    return NextResponse.json({

      ok: true,

      duplicado:

        true,

    });

  }





  if (!existente) {

    const {

      error:

        erroInsert,

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

            recurso.tipo,



          recurso_id:

            recurso.id,



          payload,



          status_processamento:

            "recebido",

        });





    if (

      erroInsert &&

      erroInsert.code !==

        "23505"

    ) {

      console.error(

        "Erro ao registrar webhook:",

        erroInsert

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

    let empresaId:

      string | null =

      null;





    /* ===================================================

       CHECKOUT

    =================================================== */



    if (

      EVENTOS_CHECKOUT.has(

        tipoEvento

      )

    ) {

      const checkout =

        payload.checkout;



      if (

        !checkout?.id

      ) {

        throw new Error(

          "Evento de Checkout sem checkout.id."

        );

      }



      /*
       * O externalReference recebe o ID interno da contratação.
       * Ele também serve como fallback se o webhook chegar antes
       * de o backend terminar de salvar o asaas_checkout_id.
       */

      let contratacao:

        {
          id: string;
          empresa_id: string;
          status: string;
        }
        | null =
        null;



      const {

        data:

          contratacaoPorAsaas,

        error:

          erroContratacaoPorAsaas,

      } =

        await admin

          .from(

            "contratacoes_checkout"

          )

          .select(`
            id,
            empresa_id,
            status
          `)

          .eq(

            "asaas_checkout_id",

            checkout.id

          )

          .maybeSingle();



      if (

        erroContratacaoPorAsaas

      ) {

        throw erroContratacaoPorAsaas;

      }



      contratacao =

        contratacaoPorAsaas;



      if (

        !contratacao &&

        checkout.externalReference

      ) {

        const {

          data:

            contratacaoPorReferencia,

          error:

            erroContratacaoPorReferencia,

        } =

          await admin

            .from(

              "contratacoes_checkout"

            )

            .select(`
              id,
              empresa_id,
              status
            `)

            .eq(

              "id",

              checkout.externalReference

            )

            .maybeSingle();



        if (

          erroContratacaoPorReferencia

        ) {

          throw erroContratacaoPorReferencia;

        }



        contratacao =

          contratacaoPorReferencia;

      }



      if (!contratacao) {

        throw new Error(

          `Checkout ${checkout.id} ainda não localizado no NOTE LITIS.`

        );

      }



      empresaId =

        contratacao

          .empresa_id;



      const atualizacao:

        Record<

          string,

          unknown

        > = {

          asaas_checkout_id:

            checkout.id,

        };



      if (

        checkout.customer

      ) {

        atualizacao.asaas_customer_id =

          checkout.customer;

      }



      if (

        checkout.link

      ) {

        atualizacao.asaas_checkout_url =

          checkout.link;

      }



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



      if (

        checkout.customer

      ) {

        const {

          error:

            erroConta,

        } =

          await admin

            .from(

              "contas_comerciais"

            )

            .update({

              asaas_customer_id:

                checkout.customer,

            })

            .eq(

              "empresa_id",

              empresaId

            );



        if (

          erroConta

        ) {

          throw erroConta;

        }

      }

    }



    /* ===================================================

       ASSINATURA ASAAS

    =================================================== */



    else if (

      EVENTOS_ASSINATURA.has(

        tipoEvento

      )

    ) {

      const assinaturaAsaas =

        payload.subscription;





      if (

        !assinaturaAsaas

          ?.id

      ) {

        throw new Error(

          "Evento de assinatura sem subscription.id."

        );

      }





      const {

        data:

          assinaturaExistente,

        error:

          erroAssinaturaExistente,

      } =

        await admin

          .from(

            "assinaturas_empresas"

          )

          .select(`

            id,

            empresa_id

          `)

          .eq(

            "asaas_subscription_id",

            assinaturaAsaas.id

          )

          .maybeSingle();





      if (

        erroAssinaturaExistente

      ) {

        throw erroAssinaturaExistente;

      }





      if (

        assinaturaExistente

      ) {

        empresaId =

          assinaturaExistente

            .empresa_id;





        const atualizacao:

          Record<

            string,

            unknown

          > = {

            status_asaas:

              assinaturaAsaas.status ??

              null,



            proxima_cobranca_em:

              assinaturaAsaas.nextDueDate

                ?.slice(

                  0,

                  10

                ) ??

              null,

          };





        if (

          tipoEvento ===

            "SUBSCRIPTION_INACTIVATED" ||

          tipoEvento ===

            "SUBSCRIPTION_DELETED"

        ) {

          atualizacao.renovacao_automatica =

            false;

        }





        const {

          error:

            erroAtualizacao,

        } =

          await admin

            .from(

              "assinaturas_empresas"

            )

            .update(

              atualizacao

            )

            .eq(

              "id",

              assinaturaExistente.id

            );





        if (

          erroAtualizacao

        ) {

          throw erroAtualizacao;

        }

      } else {

        /*

         * Primeira vez que recebemos

         * esta assinatura.

         *

         * Localizamos a empresa pelo

         * customer criado pelo Checkout.

         */

        if (

          !assinaturaAsaas

            .customer

        ) {

          throw new Error(

            "Assinatura sem customer."

          );

        }





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

            .select(

              "id, empresa_id"

            )

            .eq(

              "asaas_customer_id",

              assinaturaAsaas.customer

            )

            .maybeSingle();





        if (

          erroConta ||

          !conta

        ) {

          throw new Error(

            "Conta comercial da assinatura ainda não localizada."

          );

        }





        empresaId =

          conta.empresa_id;





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

            .select(`

              id,

              plano_codigo,

              ciclo_snapshot,

              valor_snapshot,

              primeira_cobranca_em

            `)

            .eq(

              "empresa_id",

              empresaId

            )

            .eq(

              "status",

              "pago"

            )

            .order(

              "concluida_em",

              {

                ascending:

                  false,

              }

            )

            .limit(1)

            .maybeSingle();





        if (

          erroContratacao ||

          !contratacao

        ) {

          throw new Error(

            "Contratação vinculada à assinatura não localizada."

          );

        }





        const {

          error:

            erroCriacao,

        } =

          await admin

            .from(

              "assinaturas_empresas"

            )

            .insert({

              empresa_id:

                empresaId,



              conta_comercial_id:

                conta.id,



              asaas_subscription_id:

                assinaturaAsaas.id,



              plano_codigo:

                contratacao

                  .plano_codigo,



              ciclo:

                contratacao

                  .ciclo_snapshot,



              valor_contratado:

                Number(

                  contratacao

                    .valor_snapshot

                ),



              desconto_percentual:

                0,



              status_interno:

                "pendente",



              status_asaas:

                assinaturaAsaas.status ??

                null,



              proxima_cobranca_em:

                assinaturaAsaas.nextDueDate

                  ?.slice(

                    0,

                    10

                  ) ??

                contratacao

                  .primeira_cobranca_em,



              vigente:

                true,

            });





        if (

          erroCriacao

        ) {

          throw erroCriacao;

        }

      }

    }





    /* ===================================================

       COBRANÇAS

    =================================================== */



    else if (

      EVENTOS_PAGAMENTO.has(

        tipoEvento

      )

    ) {

      const pagamento =

        payload.payment;





      if (

        !pagamento?.id

      ) {

        throw new Error(

          "Evento de cobrança sem payment.id."

        );

      }





      if (

        !pagamento.subscription

      ) {

        /*

         * Não pertence a uma assinatura

         * do NOTE LITIS.

         */

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

          ignorado:

            true,

        });

      }





      const {

        data:

          assinatura,

        error:

          erroAssinatura,

      } =

        await admin

          .from(

            "assinaturas_empresas"

          )

          .select(`

            id,

            empresa_id,

            inicio_em

          `)

          .eq(

            "asaas_subscription_id",

            pagamento.subscription

          )

          .maybeSingle();





      if (

        erroAssinatura ||

        !assinatura

      ) {

        throw new Error(

          "Assinatura da cobrança ainda não localizada."

        );

      }





      empresaId =

        assinatura

          .empresa_id;





      const agora =

        new Date()

          .toISOString();





      const confirmado =

        tipoEvento ===

          "PAYMENT_CONFIRMED" ||

        tipoEvento ===

          "PAYMENT_RECEIVED";





      const recebido =

        tipoEvento ===

        "PAYMENT_RECEIVED";





      const {

        error:

          erroCobranca,

      } =

        await admin

          .from(

            "cobrancas_assinaturas"

          )

          .upsert(

            {

              empresa_id:

                empresaId,



              assinatura_id:

                assinatura.id,



              asaas_payment_id:

                pagamento.id,



              asaas_subscription_id:

                pagamento.subscription,



              status_asaas:

                pagamento.status ??

                tipoEvento,



              forma_pagamento:

                pagamento.billingType ??

                null,



              valor:

                Number(

                  pagamento.value ??

                    0

                ),



              vencimento:

                pagamento.dueDate

                  ?.slice(

                    0,

                    10

                  ) ??

                null,



              pagamento_confirmado_em:

                confirmado

                  ? agora

                  : null,



              pagamento_recebido_em:

                recebido

                  ? agora

                  : null,



              payload_asaas:

                payload,

            },

            {

              onConflict:

                "asaas_payment_id",

            }

          );





      if (

        erroCobranca

      ) {

        throw erroCobranca;

      }





      /* =================================================

         PAGAMENTO APROVADO:

         INICIA/RENOVA A VIGÊNCIA

      ================================================= */



      if (

        confirmado &&

        pagamento.dueDate

      ) {

        const {

          error:

            erroAtivar,

        } =

          await admin

            .from(

              "assinaturas_empresas"

            )

            .update({

              status_interno:

                "ativa",



              vigente:

                true,



              inicio_em:

                assinatura.inicio_em ??

                agora,



              vigencia_inicio:

                pagamento.dueDate

                  .slice(

                    0,

                    10

                  ),



              /*

               * Zeramos os derivados.

               * O trigger do banco

               * recalculará o novo ciclo.

               */

              vigencia_fim:

                null,



              renovacao_em:

                null,



              cancelamento_ate:

                null,



              renovacao_automatica:

                true,

            })

            .eq(

              "id",

              assinatura.id

            );





        if (

          erroAtivar

        ) {

          throw erroAtivar;

        }





        const {

          data:

            assinaturaAtualizada,

          error:

            erroLeitura,

        } =

          await admin

            .from(

              "assinaturas_empresas"

            )

            .select(`

              vigencia_fim,

              renovacao_em

            `)

            .eq(

              "id",

              assinatura.id

            )

            .single();





        if (

          erroLeitura

        ) {

          throw erroLeitura;

        }





        await admin

          .from(

            "assinaturas_empresas"

          )

          .update({

            proxima_cobranca_em:

              assinaturaAtualizada

                .renovacao_em,

          })

          .eq(

            "id",

            assinatura.id

          );





        const acessoAte =

          assinaturaAtualizada

            .vigencia_fim

            ? new Date(

                `${assinaturaAtualizada.vigencia_fim}T23:59:59-03:00`

              ).toISOString()

            : null;





        const {

          error:

            erroConta,

        } =

          await admin

            .from(

              "contas_comerciais"

            )

            .update({

              status_comercial:

                "ativa",



              ultimo_pagamento_em:

                agora,



              acesso_ate:

                acessoAte,

            })

            .eq(

              "empresa_id",

              empresaId

            );





        if (

          erroConta

        ) {

          throw erroConta;

        }





        const {

          error:

            erroEmpresa,

        } =

          await admin

            .from(

              "empresas"

            )

            .update({

              status_acesso:

                "ativo",



              motivo_suspensao:

                null,



              atualizado_em:

                agora,

            })

            .eq(

              "id",

              empresaId

            );





        if (

          erroEmpresa

        ) {

          throw erroEmpresa;

        }

      }

    }





    /*

     * Eventos não usados pelo NOTE LITIS

     * neste momento.

     */

    else {

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

        ignorado:

          true,

      });

    }





    /* ===================================================

       FINALIZA EVENTO

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

            empresaId,



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