import type {
  EmailOtpType,
} from "@supabase/supabase-js";

import {
  type NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";

function destinoSeguro(
  valor:
    string | null
) {
  if (
    !valor ||
    !valor.startsWith(
      "/"
    ) ||
    valor.startsWith(
      "//"
    )
  ) {
    return "/protected";
  }

  return valor;
}

export async function GET(
  request:
    NextRequest
) {
  const {
    searchParams,
  } =
    new URL(
      request.url
    );

  const tokenHash =
    searchParams.get(
      "token_hash"
    );

  const type =
    searchParams.get(
      "type"
    ) as
      | EmailOtpType
      | null;

  const next =
    destinoSeguro(
      searchParams.get(
        "next"
      )
    );

  const url =
    request.nextUrl.clone();

  url.search =
    "";

  if (
    tokenHash &&
    type
  ) {
    const supabase =
      await createClient();

    const {
      error,
    } =
      await supabase
        .auth
        .verifyOtp({
          type,

          token_hash:
            tokenHash,
        });

    if (!error) {
      url.pathname =
        next;

      return NextResponse.redirect(
        url
      );
    }
  }

  url.pathname =
    "/auth/login";

  url.searchParams.set(
    "erro",
    "convite_invalido"
  );

  return NextResponse.redirect(
    url
  );
}