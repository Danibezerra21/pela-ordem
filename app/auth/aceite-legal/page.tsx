import Link from "next/link";

import {
  FileText,
  ShieldCheck,
} from "lucide-react";

import {
  redirect,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  DOCUMENTOS_LEGAIS_VIGENCIA,
  POLITICA_PRIVACIDADE_VERSAO,
  TERMOS_USO_VERSAO,
} from "@/lib/legal";

import {
  aceitarDocumentosLegais,
} from "./actions";

import {
  SubmitButton,
} from "./submit-button";

type AceiteLegalPageProps = {
  searchParams?: Promise<{
    erro?:
      | string
      | string[];
  }>;
};

export default async function AceiteLegalPage({
  searchParams,
}: AceiteLegalPageProps) {
  const parametros =
    searchParams
      ? await searchParams
      : {};

  const erroRecebido =
    Array.isArray(
      parametros.erro
    )
      ? parametros.erro[0]
      : parametros.erro;

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
      aceiteAtual,

    error:
      erroConsulta,
  } =
    await supabase
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
    erroConsulta
  ) {
    throw new Error(
      `Erro ao verificar aceite legal: ${erroConsulta.message}`
    );
  }

  if (
    aceiteAtual
  ) {
    redirect(
      "/protected"
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-xl rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0b1f3a] text-white">
          <ShieldCheck className="h-5 w-5" />
        </div>

        <p className="mt-6 text-sm font-medium text-slate-500">
          NOTE LITIS
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
          Termos e Privacidade
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Antes de continuar, leia os documentos que disciplinam a utilização
          do NOTE LITIS e o tratamento de dados pessoais na plataforma.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            href="/termos"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border p-4 transition-colors hover:bg-slate-50"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#0b1f3a]" />

              <p className="font-medium">
                Termos de Uso
              </p>
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Versão{" "}
              {TERMOS_USO_VERSAO}
            </p>
          </Link>

          <Link
            href="/privacidade"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border p-4 transition-colors hover:bg-slate-50"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#0b1f3a]" />

              <p className="font-medium">
                Privacidade e LGPD
              </p>
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Versão{" "}
              {POLITICA_PRIVACIDADE_VERSAO}
            </p>
          </Link>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Documentos vigentes desde{" "}
          {DOCUMENTOS_LEGAIS_VIGENCIA}.
        </p>

        {erroRecebido && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {erroRecebido}
          </div>
        )}

        <form
          action={
            aceitarDocumentosLegais
          }
          className="mt-6"
        >
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-slate-50 p-4">
            <input
              type="checkbox"
              name="aceite_legal"
              required
              className="mt-1 h-4 w-4 shrink-0"
            />

            <span className="text-sm leading-6 text-slate-700">
              Li e aceito os{" "}
              <Link
                href="/termos"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-[#0b1f3a] underline underline-offset-4"
              >
                Termos de Uso
              </Link>{" "}
              e declaro ciência da{" "}
              <Link
                href="/privacidade"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-[#0b1f3a] underline underline-offset-4"
              >
                Política de Privacidade e Proteção de Dados
              </Link>
              .
            </span>
          </label>

          <div className="mt-5">
            <SubmitButton />
          </div>
        </form>

        <p className="mt-5 text-xs leading-5 text-slate-500">
          O registro do aceite associa seu usuário autenticado às versões
          vigentes dos documentos e à data e hora da confirmação.
        </p>
      </section>
    </main>
  );
}
