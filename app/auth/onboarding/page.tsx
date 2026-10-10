import {
  redirect,
} from "next/navigation";

import {
  OnboardingEmpresaForm,
} from "@/components/onboarding-empresa-form";

import {
  createClient,
} from "@/lib/supabase/server";


export default async function OnboardingPage() {
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
    erroMembro
  ) {
    throw new Error(
      `Erro ao verificar cadastro: ${erroMembro.message}`
    );
  }


  if (
    membro
  ) {
    redirect(
      "/protected"
    );
  }


  return (
    <main className="flex min-h-svh w-full items-center justify-center bg-slate-50 px-6 py-10">
      <OnboardingEmpresaForm />
    </main>
  );
}