import {
  createServerClient,
} from "@supabase/ssr";

import {
  createClient as createSupabaseClient,
} from "@supabase/supabase-js";

import {
  NextResponse,
  type NextRequest,
} from "next/server";

import {
  hasEnvVars,
} from "../utils";


function hojeEmRecife() {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone:
        "America/Recife",

      year:
        "numeric",

      month:
        "2-digit",

      day:
        "2-digit",
    }
  ).format(
    new Date()
  );
}


function copiarCookies(
  origem:
    NextResponse,

  destino:
    NextResponse
) {
  origem.cookies
    .getAll()
    .forEach(
      (
        cookie
      ) => {
        const {
          name,
          value,
          ...options
        } =
          cookie;

        destino
          .cookies
          .set(
            name,
            value,
            options
          );
      }
    );
}


function redirecionarPreservandoSessao(
  request:
    NextRequest,

  supabaseResponse:
    NextResponse,

  destino:
    string
) {
  const url =
    request
      .nextUrl
      .clone();

  url.pathname =
    destino;

  url.search =
    "";

  const resposta =
    NextResponse.redirect(
      url
    );

  copiarCookies(
    supabaseResponse,
    resposta
  );

  return resposta;
}


function rotaClienteLiberadaSemAssinatura(
  pathname:
    string,

  papel:
    string | null
) {
  /*
   * Suporte do cliente.
   */
  if (
    pathname ===
      "/protected/ajuda" ||
    pathname.startsWith(
      "/protected/ajuda/"
    )
  ) {
    return true;
  }


  /*
   * Evita loop.
   */
  if (
    pathname ===
    "/protected/acesso-negado"
  ) {
    return true;
  }


  /*
   * O Master precisa conseguir
   * entrar em Configurações
   * para realizar o pagamento.
   */
  if (
    papel ===
      "master" &&
    (
      pathname ===
        "/protected/configuracoes" ||
      pathname.startsWith(
        "/protected/configuracoes/"
      )
    )
  ) {
    return true;
  }


  return false;
}


export async function updateSession(
  request:
    NextRequest
) {
  let supabaseResponse =
    NextResponse.next({
      request,
    });


  if (
    !hasEnvVars
  ) {
    return supabaseResponse;
  }


  const supabase =
    createServerClient(
      process.env
        .NEXT_PUBLIC_SUPABASE_URL!,

      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,

      {
        cookies: {
          getAll() {
            return request
              .cookies
              .getAll();
          },

          setAll(
            cookiesToSet
          ) {
            cookiesToSet
              .forEach(
                ({
                  name,
                  value,
                }) =>
                  request
                    .cookies
                    .set(
                      name,
                      value
                    )
              );

            supabaseResponse =
              NextResponse.next({
                request,
              });

            cookiesToSet
              .forEach(
                ({
                  name,
                  value,
                  options,
                }) =>
                  supabaseResponse
                    .cookies
                    .set(
                      name,
                      value,
                      options
                    )
              );
          },
        },
      }
    );


  /*
   * Não inserir consultas antes
   * de getClaims().
   */
  const {
    data,
  } =
    await supabase
      .auth
      .getClaims();


  const claims =
    data?.claims;


  /*
   * =====================================================
   * AUTENTICAÇÃO
   * =====================================================
   */

  if (
    request
      .nextUrl
      .pathname !==
      "/" &&

    !claims &&

    !request
      .nextUrl
      .pathname
      .startsWith(
        "/login"
      ) &&

    !request
      .nextUrl
      .pathname
      .startsWith(
        "/auth"
      )
  ) {
    return redirecionarPreservandoSessao(
      request,
      supabaseResponse,
      "/auth/login"
    );
  }


  const pathname =
    request
      .nextUrl
      .pathname;


  if (
    !claims ||
    !pathname.startsWith(
      "/protected"
    )
  ) {
    return supabaseResponse;
  }


  const usuarioId =
    typeof claims.sub ===
      "string"
      ? claims.sub
      : null;


  if (
    !usuarioId
  ) {
    return supabaseResponse;
  }


  /*
   * =====================================================
   * CLIENTE ADMINISTRATIVO DO SUPABASE
   * =====================================================
   */

  const supabaseUrl =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL;

  const secretKey =
    process.env
      .SUPABASE_SECRET_KEY;


  if (
    !supabaseUrl ||
    !secretKey
  ) {
    console.error(
      "Não foi possível verificar o acesso: variáveis do Supabase ausentes."
    );

    return supabaseResponse;
  }


  const admin =
    createSupabaseClient(
      supabaseUrl,
      secretKey,
      {
        auth: {
          persistSession:
            false,

          autoRefreshToken:
            false,

          detectSessionInUrl:
            false,
        },
      }
    );


  /*
   * =====================================================
   * ADMINISTRADOR DA PLATAFORMA
   * =====================================================
   *
   * Esta verificação vem ANTES de qualquer
   * regra de empresa, Beta ou mensalidade.
   *
   * Administrador da plataforma não é cliente.
   */

  const {
    data:
      administradorPlataforma,

    error:
      erroAdministrador,
  } =
    await admin
      .from(
        "administradores_plataforma"
      )
      .select(
        "id"
      )
      .eq(
        "usuario_id",
        usuarioId
      )
      .eq(
        "ativo",
        true
      )
      .maybeSingle();


  if (
    erroAdministrador
  ) {
    console.error(
      "Não foi possível verificar o administrador da plataforma:",
      erroAdministrador
    );
  }


  if (
    administradorPlataforma
  ) {
    /*
     * Toda a administração da plataforma
     * fica em /protected/suporte.
     */
    if (
      pathname ===
        "/protected/suporte" ||
      pathname.startsWith(
        "/protected/suporte/"
      )
    ) {
      return supabaseResponse;
    }


    /*
     * Se o administrador entrar em qualquer
     * outra área protegida, vai para seu
     * painel administrativo.
     */
    return redirecionarPreservandoSessao(
      request,
      supabaseResponse,
      "/protected/suporte"
    );
  }


  /*
   * =====================================================
   * DAQUI PARA BAIXO:
   * SOMENTE CLIENTES DO NOTE LITIS
   * =====================================================
   */


  /*
   * CONFIGURAÇÃO GLOBAL
   */

  const {
    data:
      configuracao,

    error:
      erroConfiguracao,
  } =
    await admin
      .from(
        "configuracoes_plataforma"
      )
      .select(
        "beta_ativa"
      )
      .eq(
        "id",
        true
      )
      .maybeSingle();


  if (
    erroConfiguracao ||
    !configuracao
  ) {
    console.error(
      "Não foi possível verificar o modo Beta:",
      erroConfiguracao
    );

    return supabaseResponse;
  }


  /*
   * Durante a Beta, clientes
   * não sofrem bloqueio comercial.
   */
  if (
    configuracao.beta_ativa
  ) {
    return supabaseResponse;
  }


  /*
   * =====================================================
   * EMPRESA DO CLIENTE
   * =====================================================
   */

  const {
    data:
      membro,

    error:
      erroMembro,
  } =
    await admin
      .from(
        "membros_empresa"
      )
      .select(`
        empresa_id,
        papel,
        nucleo,
        ativo
      `)
      .eq(
        "usuario_id",
        usuarioId
      )
      .eq(
        "ativo",
        true
      )
      .maybeSingle();


  if (
    erroMembro
  ) {
    console.error(
      "Não foi possível verificar o vínculo comercial:",
      erroMembro
    );

    return supabaseResponse;
  }


  /*
   * Cliente ainda sem empresa:
   * onboarding tratará o caso.
   */
  if (
    !membro
  ) {
    return supabaseResponse;
  }


  /*
   * Telas necessárias mesmo
   * sem mensalidade vigente.
   */
  if (
    rotaClienteLiberadaSemAssinatura(
      pathname,
      membro.papel
    )
  ) {
    return supabaseResponse;
  }


  /*
   * =====================================================
   * VIGÊNCIA PAGA
   * =====================================================
   */

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
        "acesso_pago_ate"
      )
      .eq(
        "empresa_id",
        membro.empresa_id
      )
      .maybeSingle();


  if (
    erroConta
  ) {
    console.error(
      "Não foi possível verificar a vigência comercial:",
      erroConta
    );

    return supabaseResponse;
  }


  const hoje =
    hojeEmRecife();


  const acessoOperacionalLiberado =
    Boolean(
      conta
        ?.acesso_pago_ate &&
      conta
        .acesso_pago_ate >=
        hoje
    );


  if (
    acessoOperacionalLiberado
  ) {
    return supabaseResponse;
  }


  /*
   * =====================================================
   * CLIENTE SEM MENSALIDADE
   * =====================================================
   */

  if (
    membro.papel ===
    "master"
  ) {
    return redirecionarPreservandoSessao(
      request,
      supabaseResponse,
      "/protected/configuracoes"
    );
  }


  return redirecionarPreservandoSessao(
    request,
    supabaseResponse,
    "/protected/ajuda"
  );
}