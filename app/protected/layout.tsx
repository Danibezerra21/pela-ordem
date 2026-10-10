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
  createClient,
} from "@/lib/supabase/server";


export default async function ProtectedLayout({
  children,
}: {
  children:
    React.ReactNode;
}) {

  const supabase =
    await createClient();


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
      .select(
        "papel, nucleo, ativo"
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
    erroMembro
  ) {
    throw new Error(
      `Erro ao identificar perfil do usuário: ${erroMembro.message}`
    );
  }


  let tipoAcesso:
    TipoAcessoSidebar =
    "sem_vinculo";


  if (
    membro
  ) {

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
  }


  return (
    <div className="min-h-screen bg-background">

      <div className="flex min-h-screen">

        <Suspense fallback={null}>
          <Sidebar
            tipoAcesso={
              tipoAcesso
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