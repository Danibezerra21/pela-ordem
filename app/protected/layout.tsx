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

import {
  POLITICA_PRIVACIDADE_VERSAO,
  TERMOS_USO_VERSAO,
} from "@/lib/legal";


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


  const admin =
    createAdminClient();


  /*
   * =====================================================
   * ACEITE LEGAL
   * =====================================================
   *
   * Todo usuário autenticado deve possuir registro
   * de aceite das versões vigentes dos Termos de Uso
   * e da Política de Privacidade antes de acessar
   * qualquer rota protegida.
   */

  const {
    data:
      aceiteLegal,

    error:
      erroAceiteLegal,
  } =
    await admin
      .from(
        "aceites_legais"
      )
      .select(
        "id"
      )
      .eq(
        "usuario_id",
        usuarioId
      )
      .eq(
        "termos_versao",
        TERMOS_USO_VERSAO
      )
      .eq(
        "privacidade_versao",
        POLITICA_PRIVACIDADE_VERSAO
      )
      .maybeSingle();


  if (
    erroAceiteLegal
  ) {
    throw new Error(
      `Erro ao verificar aceite dos documentos legais: ${erroAceiteLegal.message}`
    );
  }


  if (
    !aceiteLegal
  ) {
    redirect(
      "/auth/aceite-legal"
    );
  }


  /*
   * =====================================================
   * ADMINISTRADOR DA PLATAFORMA
   * =====================================================
   *
   * Esta verificação ocorre ANTES da exigência
   * de vínculo com um escritório.
   */

  const {
    data:
      administrador,
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


  const administradorPlataforma =
    Boolean(
      administrador
    );


  /*
   * =====================================================
   * VÍNCULO COM EMPRESA
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


  /*
   * Administradores da plataforma não precisam
   * pertencer a um escritório.
   */
  if (
    !membro &&
    !administradorPlataforma
  ) {
    redirect(
      "/auth/onboarding"
    );
  }


  /*
   * =====================================================
   * ADMINISTRADOR SEM EMPRESA
   * =====================================================
   */

  if (
    administradorPlataforma &&
    !membro
  ) {
    return (
      <div className="min-h-screen bg-background">

        <div className="flex min-h-screen">

          <Suspense
            fallback={
              null
            }
          >
            <Sidebar
              tipoAcesso="sem_vinculo"
              acessoOperacional={
                false
              }
              administradorPlataforma={
                true
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


  /*
   * Daqui para baixo, sabemos que existe
   * vínculo com empresa.
   */

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

  const [
    configuracaoResposta,
    contaResposta,
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
    ]);


  /*
   * Falha técnica na configuração global:
   * evita bloquear todos os usuários.
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
