import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  AlertTriangle,
  CalendarDays,
  CircleCheck,
  Clock3,
  FileSpreadsheet,
  Plus,
  ShieldCheck,
  UserRound,
} from "lucide-react";

const nomesPapeis = {
  master: "Master",
  admin: "Administrador",
  usuario: "Usuário",
};

export default async function ProtectedPage() {
  const supabase = await createClient();

  // Verifica o usuário autenticado
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  const usuarioId = data.claims.sub;

  const email =
    typeof data.claims.email === "string"
      ? data.claims.email
      : "";

  if (!usuarioId) {
    redirect("/auth/login");
  }

  // Busca o vínculo do usuário com a empresa
  const {
    data: membro,
    error: erroMembro,
  } = await supabase
    .from("membros_empresa")
    .select("empresa_id, papel, ativo")
    .eq("usuario_id", usuarioId)
    .eq("ativo", true)
    .maybeSingle();

  if (erroMembro) {
    throw new Error(
      `Erro ao localizar vínculo do usuário: ${erroMembro.message}`
    );
  }

  if (!membro) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center">
        <div className="w-full max-w-lg rounded-xl border p-8">
          <h1 className="text-2xl font-semibold">
            NOTE LITIS
          </h1>

          <p className="mt-4 text-muted-foreground">
            Seu usuário está autenticado, mas ainda não está
            vinculado a uma empresa.
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            {email}
          </p>
        </div>
      </main>
    );
  }

  // Busca os dados da empresa
  const {
    data: empresa,
    error: erroEmpresa,
  } = await supabase
    .from("empresas")
    .select("id, nome, status_acesso")
    .eq("id", membro.empresa_id)
    .single();

  if (erroEmpresa || !empresa) {
    throw new Error(
      `Erro ao localizar empresa: ${
        erroEmpresa?.message ?? "Empresa não encontrada"
      }`
    );
  }

  // Bloqueia toda a conta se a empresa estiver suspensa
  if (empresa.status_acesso !== "ativo") {
    return (
      <main className="flex min-h-[70vh] items-center justify-center">
        <div className="w-full max-w-xl rounded-xl border p-8">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6" />

            <h1 className="text-2xl font-semibold">
              Acesso indisponível
            </h1>
          </div>

          <p className="mt-5">
            A conta de{" "}
            <strong>{empresa.nome}</strong>{" "}
            não está ativa no momento.
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            Status da conta: {empresa.status_acesso}
          </p>
        </div>
      </main>
    );
  }

  const nomePapel =
    nomesPapeis[
      membro.papel as keyof typeof nomesPapeis
    ] ?? membro.papel;

  /*
    Ainda não criamos a tabela de diligências.
    Por isso, estes números começam em zero.

    Depois eles serão substituídos por consultas reais
    ao banco do NOTE LITIS.
  */

  const diligenciasHoje = 0;
  const proximasDiligencias = 0;
  const diligenciasPendentes = 0;
  const conflitosAgenda = 0;

  return (
    <main className="w-full">
      {/* Cabeçalho */}
      <section className="mb-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {empresa.nome}
            </p>

            <h1 className="mt-1 text-4xl font-bold tracking-tight">
              Dashboard
            </h1>

            <p className="mt-2 text-muted-foreground">
              Acompanhe sua operação de diligências.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/protected/importacoes"
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Importar pauta
            </Link>

            <Link
              href="/protected/diligencias/nova"
              className="inline-flex items-center gap-2 rounded-lg bg-[#0b1f3a] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Nova diligência
            </Link>
          </div>
        </div>
      </section>

      {/* Indicadores principais */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Diligências hoje
              </p>

              <p className="mt-3 text-3xl font-semibold">
                {diligenciasHoje}
              </p>
            </div>

            <div className="rounded-lg bg-muted p-2.5">
              <CalendarDays className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Programadas para a data de hoje
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Próximas diligências
              </p>

              <p className="mt-3 text-3xl font-semibold">
                {proximasDiligencias}
              </p>
            </div>

            <div className="rounded-lg bg-muted p-2.5">
              <Clock3 className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Previstas para os próximos 15 dias
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Com pendências
              </p>

              <p className="mt-3 text-3xl font-semibold">
                {diligenciasPendentes}
              </p>
            </div>

            <div className="rounded-lg bg-muted p-2.5">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Diligências que precisam de tratamento
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Possíveis conflitos
              </p>

              <p className="mt-3 text-3xl font-semibold">
                {conflitosAgenda}
              </p>
            </div>

            <div className="rounded-lg bg-muted p-2.5">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Choques de agenda identificados
          </p>
        </div>
      </section>

      {/* Área operacional */}
      <section className="mt-8 grid gap-6 xl:grid-cols-3">
        {/* Como está minha pauta */}
        <div className="rounded-xl border bg-card p-6 xl:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                Como está minha pauta?
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Visão rápida das diligências que precisam da sua atenção.
              </p>
            </div>

            <Link
              href="/protected/pendencias"
              className="text-sm font-medium hover:underline"
            >
              Ver pendências
            </Link>
          </div>

          <div className="mt-8 flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed px-6 text-center">
            <CircleCheck className="h-8 w-8 text-muted-foreground" />

            <p className="mt-4 font-medium">
              Nenhuma pendência registrada
            </p>

            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Assim que as primeiras diligências forem cadastradas,
              o NOTE LITIS mostrará aqui o que precisa ser resolvido.
            </p>
          </div>
        </div>

        {/* Conta */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-xl font-semibold">
            Minha conta
          </h2>

          <div className="mt-6 space-y-5">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Empresa
              </p>

              <p className="mt-1 font-medium">
                {empresa.nome}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Usuário
              </p>

              <div className="mt-1 flex items-center gap-2">
                <UserRound className="h-4 w-4 text-muted-foreground" />

                <p className="text-sm">
                  {email}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Perfil de acesso
              </p>

              <p className="mt-1 font-medium">
                {nomePapel}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Status
              </p>

              <div className="mt-1 flex items-center gap-2">
                <CircleCheck className="h-4 w-4" />

                <p className="font-medium">
                  Conta ativa
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Próximas diligências */}
      <section className="mt-8 rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold">
              Próximas diligências
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Compromissos mais próximos da sua equipe.
            </p>
          </div>

          <Link
            href="/protected/diligencias"
            className="text-sm font-medium hover:underline"
          >
            Ver todas
          </Link>
        </div>

        <div className="flex min-h-44 flex-col items-center justify-center px-6 text-center">
          <CalendarDays className="h-8 w-8 text-muted-foreground" />

          <p className="mt-4 font-medium">
            Nenhuma diligência cadastrada
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Cadastre manualmente uma diligência ou importe sua pauta.
          </p>
        </div>
      </section>
    </main>
  );
}