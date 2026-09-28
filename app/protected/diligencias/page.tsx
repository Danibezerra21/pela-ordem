import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  CalendarDays,
  Clock3,
  FileText,
  Plus,
  Search,
} from "lucide-react";

function formatarProcesso(
  processo: string | null
) {
  if (!processo) {
    return "PROCESSO NÃO INFORMADO";
  }

  const numeros = processo.replace(/\D/g, "");

  if (numeros.length !== 20) {
    return processo;
  }

  return (
    `${numeros.slice(0, 7)}-` +
    `${numeros.slice(7, 9)}.` +
    `${numeros.slice(9, 13)}.` +
    `${numeros.slice(13, 14)}.` +
    `${numeros.slice(14, 16)}.` +
    `${numeros.slice(16, 20)}`
  );
}

export default async function DiligenciasPage() {
  const supabase = await createClient();

  const { data: authData, error: authError } =
    await supabase.auth.getClaims();

  if (authError || !authData?.claims?.sub) {
    redirect("/auth/login");
  }

  const usuarioId = authData.claims.sub;

  // Localiza a empresa do usuário
  const { data: membro, error: erroMembro } = await supabase
    .from("membros_empresa")
    .select("empresa_id")
    .eq("usuario_id", usuarioId)
    .eq("ativo", true)
    .maybeSingle();

  if (erroMembro) {
    throw new Error(
      `Erro ao localizar empresa: ${erroMembro.message}`
    );
  }

  if (!membro) {
    return (
      <div>
        <h1 className="text-3xl font-bold">
          Diligências
        </h1>

        <p className="mt-3 text-muted-foreground">
          Seu usuário ainda não está vinculado a uma empresa.
        </p>
      </div>
    );
  }

  // Busca diligências não excluídas
  const {
    data: diligencias,
    error: erroDiligencias,
  } = await supabase
    .from("diligencias")
    .select(`
      id,
      tipo_diligencia,
      numero_processo,
      parte_autora,
      parte_re,
      data_diligencia,
      horario,
      vara,
      comarca,
      uf,
      status
    `)
    .eq("empresa_id", membro.empresa_id)
    .is("excluida_em", null)
    .order("data_diligencia", {
      ascending: true,
    })
    .order("horario", {
      ascending: true,
    });

  if (erroDiligencias) {
    throw new Error(
      `Erro ao carregar diligências: ${erroDiligencias.message}`
    );
  }

  return (
    <main className="w-full">
      {/* Cabeçalho */}
      <section className="mb-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Gestão operacional
            </p>

            <h1 className="mt-1 text-4xl font-bold tracking-tight">
              Diligências
            </h1>

            <p className="mt-2 text-muted-foreground">
              Consulte e gerencie as diligências da sua empresa.
            </p>
          </div>

          <Link
            href="/protected/diligencias/nova"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0b1f3a] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Nova diligência
          </Link>
        </div>
      </section>

      {/* Barra de pesquisa visual */}
      <section className="mb-6 rounded-xl border bg-card p-4">
        <div className="flex items-center gap-3 rounded-lg border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />

          <span className="text-sm text-muted-foreground">
            Em breve: pesquisar por processo, partes, comarca ou vara
          </span>
        </div>
      </section>

      {/* Lista */}
      <section className="rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold">
              Pauta cadastrada
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {diligencias?.length ?? 0}{" "}
              {(diligencias?.length ?? 0) === 1
                ? "diligência cadastrada"
                : "diligências cadastradas"}
            </p>
          </div>
        </div>

        {!diligencias || diligencias.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
            <div className="rounded-full bg-muted p-4">
              <FileText className="h-7 w-7 text-muted-foreground" />
            </div>

            <h3 className="mt-5 text-lg font-semibold">
              Nenhuma diligência cadastrada
            </h3>

            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Cadastre sua primeira diligência manualmente ou,
              posteriormente, importe uma pauta em Excel.
            </p>

            <Link
              href="/protected/diligencias/nova"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#0b1f3a] px-4 py-2.5 text-sm font-medium text-white"
            >
              <Plus className="h-4 w-4" />
              Cadastrar primeira diligência
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {diligencias.map((diligencia) => {
              const data = new Date(
                `${diligencia.data_diligencia}T12:00:00`
              );

              const dataFormatada =
                new Intl.DateTimeFormat("pt-BR").format(data);

              const horarioFormatado =
                diligencia.horario?.slice(0, 5);

              return (
                <Link
                  key={diligencia.id}
                  href={`/protected/diligencias/${diligencia.id}`}
                  className="block px-6 py-5 transition-colors hover:bg-muted/40"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium">
                          {diligencia.tipo_diligencia}
                        </span>

                        {diligencia.numero_processo && (
                          <span className="text-sm text-muted-foreground">
                            {formatarProcesso(
                              diligencia.numero_processo
                            )}
                          </span>
                        )}
                      </div>

                      <p className="mt-3 font-medium">
                        {diligencia.parte_autora || "Parte autora não informada"}
                        {" x "}
                        {diligencia.parte_re || "Parte ré não informada"}
                      </p>

                      <p className="mt-2 text-sm text-muted-foreground">
                        {diligencia.vara || "Vara não informada"}
                        {diligencia.comarca
                          ? ` • ${diligencia.comarca}`
                          : ""}
                        {diligencia.uf
                          ? `/${diligencia.uf}`
                          : ""}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-5 text-sm">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        {dataFormatada}
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-muted-foreground" />
                        {horarioFormatado}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}