import {
  Suspense,
} from "react";

import {
  redirect,
} from "next/navigation";

import {
  Sidebar,
  type TipoAcessoSidebar,
} from "@/components/pela-ordem/sidebar";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  createClient,
} from "@/lib/supabase/server";


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


export default async function ProtectedLayout({
  children,
}: {
  children:
    React.ReactNode;
}) {
  const supabase =
    await createClient();


  /*
   * =====================================================
   * AUTENTICAÇÃO
   * =====================================================
   */

  const {
    data:
      authData,

    error:
      authError,
  } =
    await supabase
      .auth
      .getClaims();


  if (
    authError ||
    !authData
      ?.claims
      ?.sub
  ) {
    redirect(
      "/auth/login"
    );
  }


  const usuarioId =
    authData
      .claims
      .sub;


  /*
   * =====================================================
   * VÍNCULO
   * =====================================================
   */

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
    throw new Error(
      `Erro ao identificar perfil do usuário: ${erroMembro.message}`
    );
  }


  if (
    !membro
  ) {
    redirect(
      "/auth/onboarding"
    );
  }


  /*
   * =====================================================
   * PERFIL DA SIDEBAR
   * =====================================================
   */

  let tipoAcesso:
    TipoAcessoSidebar;


  if (
    membro.papel ===
    "master"
  ) {
    tipoAcesso =
      "master";
  } else if (
    membro.nucleo ===
    "financeiro"
  ) {
    tipoAcesso =
      "financeiro";
  } else {
    tipoAcesso =
      "operacional";
  }


  /*
   * =====================================================
   * SITUAÇÃO COMERCIAL
   * =====================================================
   */

  const admin =
    createAdminClient();


  const [
    configuracaoResposta,
    contaResposta,
    administradorResposta,
  ] =
    await Promise.all([
      admin
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
        .maybeSingle(),

      admin
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
        .maybeSingle(),

      admin
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
        .maybeSingle(),
    ]);


  /*
   * Em caso de falha temporária de
   * consulta da configuração global,
   * evitamos bloquear todo o sistema.
   */
  const betaAtiva =
    configuracaoResposta
      .error
      ? true
      : (
          configuracaoResposta
            .data
            ?.beta_ativa ??
          true
        );


  let acessoOperacional =
    true;


  if (
    !betaAtiva
  ) {
    if (
      contaResposta
        .error
    ) {
      /*
       * Fail-open apenas para falha
       * técnica inesperada.
       */
      acessoOperacional =
        true;
    } else {
      const hoje =
        hojeEmRecife();

      const acessoPagoAte =
        contaResposta
          .data
          ?.acesso_pago_ate ??
        null;

      acessoOperacional =
        Boolean(
          acessoPagoAte &&
          acessoPagoAte >=
            hoje
        );
    }
  }


  const administradorPlataforma =
    !administradorResposta
      .error &&
    Boolean(
      administradorResposta
        .data
    );


  return (
    <div className="min-h-screen bg-background">

      <div className="flex min-h-screen">

        <Suspense
          fallback={
            null
          }
        >
          <Sidebar
            tipoAcesso={
              tipoAcesso
            }
            acessoOperacional={
              acessoOperacional
            }
            administradorPlataforma={
              administradorPlataforma
            }
          />
        </Suspense>


        <div className="min-w-0 flex-1">

          <main className="mx-auto w-full max-w-7xl px-8 py-10">
            {children}
          </main>

        </div>

      </div>

    </div>
  );
}