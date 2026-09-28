import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import {
  FormularioPrincipalDiligencia,
} from "./formulario/formulario-principal";

export default async function NovaDiligenciaPage() {
  const supabase =
    await createClient();

  const {
    data: authData,
    error: authError,
  } =
    await supabase.auth.getClaims();

  if (
    authError ||
    !authData?.claims?.sub
  ) {
    redirect(
      "/auth/login"
    );
  }

  return (
    <main className="w-full">
      <section className="mb-8">
        <Link
          href="/protected/diligencias"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para diligências
        </Link>

        <div className="mt-5">
          <p className="text-sm font-medium text-muted-foreground">
            Gestão operacional
          </p>

          <h1 className="mt-1 text-4xl font-bold tracking-tight">
            Nova diligência
          </h1>

          <p className="mt-2 text-muted-foreground">
            Cadastre uma nova diligência na pauta da empresa.
          </p>
        </div>
      </section>

      <FormularioPrincipalDiligencia/>
    </main>
  );
}