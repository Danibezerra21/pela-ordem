import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      mensagem:
        "A contratação pelo Asaas está desativada no NOTE LITIS.",
    },
    {
      status: 410,
    }
  );
}