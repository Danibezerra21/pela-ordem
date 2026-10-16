import { NextResponse } from "next/server";

export async function POST() {
  /*
   * O Asaas não é mais usado pelo NOTE LITIS.
   *
   * Retornamos 200 para reconhecer eventuais
   * webhooks antigos de sandbox sem permitir
   * qualquer alteração no banco.
   */
  return NextResponse.json({
    ok: true,
    ignorado: true,
    mensagem:
      "Webhook Asaas ignorado. Integração desativada.",
  });
}