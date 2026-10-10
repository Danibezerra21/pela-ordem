import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { asaasRequest } from "@/lib/asaas/client";

type AsaasCustomerListResponse = {
  object: string;
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: unknown[];
};

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      {
        ok: false,
        error: "Não autorizado.",
      },
      { status: 401 },
    );
  }

  try {
    await asaasRequest<AsaasCustomerListResponse>(
      "/customers?limit=1",
    );

    return NextResponse.json({
      ok: true,
      ambiente: "sandbox",
      mensagem: "Conexão com o Asaas realizada com sucesso.",
    });
  } catch (error) {
    console.error(
      "Falha ao testar conexão com o Asaas:",
      error instanceof Error ? error.message : error,
    );

    return NextResponse.json(
      {
        ok: false,
        mensagem: "Não foi possível conectar ao Asaas.",
      },
      { status: 502 },
    );
  }
}