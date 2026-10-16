import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      mensagem:
        "A sincronização com o Asaas está desativada no NOTE LITIS.",
    },
    {
      status: 410,
    }
  );
}