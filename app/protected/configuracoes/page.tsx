import Link from "next/link";

import { redirect } from "next/navigation";

import {
  BadgeCheck,
  Building2,
  CalendarDays,
  CircleCheck,
  CreditCard,
  FlaskConical,
  KeyRound,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { informarPagamentoPix } from "./actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function formatarData(
  data: string | null | undefined
) {
  if (!data) {
    return "—";
  }

  const somenteData = data.slice(0, 10);

  const [ano, mes, dia] =
    somenteData
      .split("-")
      .map(Number);

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    }
  ).format(
    new Date(
      Date.UTC(
        ano,
        mes - 1,
        dia
      )
    )
  );
}

function formatarMoeda(
  valor:
    | number
    | string
    | null
    | undefined
) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return "—";
  }

  const numero =
    typeof valor === "number"
      ? valor
      : Number(valor);

  if (!Number.isFinite(numero)) {
    return "—";
  }

  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  ).format(numero);
}

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: authData,
    error: authError,
  } = await supabase.auth.getClaims();

  if (
    authError ||
    !authData?.claims?.sub
  ) {
    redirect("/auth/login");
  }

  const usuarioId = authData.claims.sub;

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
      `Erro ao localizar vínculo: ${erroMembro.message}`
    );
  }

  if (
    !membro ||
    membro.papel !== "master"
  ) {
    redirect("/protected/acesso-negado");
  }

  const empresaId = membro.empresa_id;

  const {
    data: configuracao,
    error: erroConfiguracao,
  } = await admin
    .from("configuracoes_plataforma")
    .select(`
      beta_ativa,
      beta_fim,
      valor_mensal,
      pix_chave,
      pix_beneficiario,
      pix_qr_path
    `)
    .eq("id", true)
    .single();

  if (
    erroConfiguracao ||
    !configuracao
  ) {
    throw new Error(
      `Erro ao carregar configuração da plataforma: ${
        erroConfiguracao?.message ??
        "configuração não encontrada"
      }`
    );
  }

  const [
    empresaResposta,
    perfilResposta,
  ] = await Promise.all([
    supabase
      .from("empresas")
      .select(`
        id,
        nome,
        tipo_documento,
        documento_final,
        status_acesso,
        criada_em
      `)
      .eq("id", empresaId)
      .single(),

    supabase
      .from("perfis_usuarios")
      .select("nome, email")
      .eq("id", usuarioId)
      .single(),
  ]);

  if (empresaResposta.error) {
    throw new Error(
      `Erro ao carregar empresa: ${empresaResposta.error.message}`
    );
  }

  if (perfilResposta.error) {
    throw new Error(
      `Erro ao carregar usuário: ${perfilResposta.error.message}`
    );
  }

  const empresa = empresaResposta.data;
  const perfil = perfilResposta.data;

  let conta:
    | {
        status_comercial:
          | string
          | null;

        acesso_pago_ate:
          | string
          | null;

        ultimo_pagamento_em:
          | string
          | null;
      }
    | null = null;

  let pagamentoPendente:
    | {
        id: string;
        valor: number | string;
        status: string;
        declarado_em: string;
        nome_pagador: string;
      }
    | null = null;

  if (!configuracao.beta_ativa) {
    const [
      contaResposta,
      pagamentoResposta,
    ] = await Promise.all([
      admin
        .from("contas_comerciais")
        .select(`
          status_comercial,
          acesso_pago_ate,
          ultimo_pagamento_em
        `)
        .eq("empresa_id", empresaId)
        .maybeSingle(),

      admin
        .from("pagamentos_pix_manuais")
        .select(`
          id,
          valor,
          status,
          declarado_em,
          nome_pagador
        `)
        .eq("empresa_id", empresaId)
        .eq(
          "status",
          "aguardando_confirmacao"
        )
        .maybeSingle(),
    ]);

    if (contaResposta.error) {
      throw new Error(
        `Erro ao carregar conta comercial: ${contaResposta.error.message}`
      );
    }

    if (pagamentoResposta.error) {
      throw new Error(
        `Erro ao carregar pagamento: ${pagamentoResposta.error.message}`
      );
    }

    conta = contaResposta.data;
    pagamentoPendente =
      pagamentoResposta.data;
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-[#0b1f3a]" />

          <h1 className="text-3xl font-semibold tracking-tight">
            Configurações
          </h1>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">
          Gerencie os dados do escritório e as informações da sua conta.
        </p>
      </div>

      {configuracao.beta_ativa && (
        <section className="rounded-2xl border border-blue-200 bg-blue-50/50 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0b1f3a] text-white">
              <FlaskConical className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-semibold">
                  Versão Beta do NOTE LITIS
                </h2>

                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                  Acesso gratuito
                </span>
              </div>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                Você está utilizando gratuitamente a versão Beta do NOTE LITIS.
                Durante este período, as funcionalidades do sistema estão
                disponíveis sem cobrança.
              </p>

              {configuracao.beta_fim ? (
                <div className="mt-5 flex items-start gap-3 rounded-xl border border-blue-200 bg-white p-4">
                  <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-[#0b1f3a]" />

                  <div>
                    <p className="font-medium">
                      Encerramento previsto da versão Beta
                    </p>

                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      A versão Beta gratuita está prevista para permanecer
                      disponível até{" "}
                      <strong className="text-foreground">
                        {formatarData(
                          configuracao.beta_fim
                        )}
                      </strong>
                      . Quando o período gratuito for encerrado, as condições
                      de contratação serão apresentadas no sistema.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  A data de encerramento da versão Beta ainda não foi definida.
                  Quando houver uma previsão, ela será informada aqui.
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-[#0b1f3a]" />

          <div>
            <h2 className="text-lg font-semibold">
              Dados do escritório
            </h2>

            <p className="text-sm text-muted-foreground">
              Informações vinculadas à conta do NOTE LITIS.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Escritório
            </p>

            <p className="mt-1 font-medium">
              {empresa.nome}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Status de acesso
            </p>

            <div className="mt-1 flex items-center gap-2">
              <CircleCheck className="h-4 w-4" />

              <span className="font-medium capitalize">
                {empresa.status_acesso}
              </span>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Documento
            </p>

            <p className="mt-1 font-medium">
              {empresa.tipo_documento?.toUpperCase() ??
                "Não informado"}

              {empresa.documento_final
                ? ` • final ${empresa.documento_final}`
                : ""}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Conta criada em
            </p>

            <p className="mt-1 font-medium">
              {formatarData(
                empresa.criada_em
              )}
            </p>
          </div>
        </div>
      </section>

      {!configuracao.beta_ativa && (
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-[#0b1f3a]" />

              <div>
                <h2 className="text-lg font-semibold">
                  Assinatura
                </h2>

                <p className="text-sm text-muted-foreground">
                  Plano mensal do NOTE LITIS.
                </p>
              </div>
            </div>

            {conta?.acesso_pago_ate && (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                Acesso ativo
              </span>
            )}
          </div>

          <div className="mt-6 rounded-xl border bg-slate-50 p-5">
            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Plano
                </p>

                <p className="mt-1 font-semibold">
                  NOTE LITIS Mensal
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Mensalidade
                </p>

                <p className="mt-1 text-lg font-semibold">
                  {formatarMoeda(
                    configuracao.valor_mensal
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Pagamento
                </p>

                <p className="mt-1 font-semibold">
                  Pix
                </p>
              </div>
            </div>
          </div>

          {conta?.acesso_pago_ate && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border p-5">
              <BadgeCheck className="mt-0.5 h-5 w-5 text-emerald-700" />

              <div>
                <p className="font-medium">
                  Acesso garantido até{" "}
                  {formatarData(
                    conta.acesso_pago_ate
                  )}
                </p>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  O pagamento de uma nova mensalidade acrescentará um novo
                  período após a vigência atual.
                </p>
              </div>
            </div>
          )}

          {pagamentoPendente && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-5">
              <p className="font-semibold text-amber-950">
                Pagamento informado
              </p>

              <p className="mt-2 text-sm leading-6 text-amber-900/80">
                O pagamento de{" "}
                <strong>
                  {formatarMoeda(
                    pagamentoPendente.valor
                  )}
                </strong>{" "}
                foi informado e está aguardando conferência pela equipe do
                NOTE LITIS.
              </p>

              <p className="mt-2 text-xs text-amber-800/70">
                Pagador informado:{" "}
                {pagamentoPendente.nome_pagador}
              </p>
            </div>
          )}

          {!pagamentoPendente && (
            <div className="mt-6 rounded-xl border border-dashed p-6">
              <p className="font-semibold">
                Pagamento via Pix
              </p>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                O pagamento da assinatura será realizado diretamente por Pix.
                A confirmação do recebimento será feita pela equipe do
                NOTE LITIS.
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Chave Pix
                  </p>

                  <p className="mt-1 font-medium">
                    {configuracao.pix_chave}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Beneficiário
                  </p>

                  <p className="mt-1 font-medium">
                    {configuracao.pix_beneficiario}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
                <div className="rounded-xl border bg-white p-4 text-center">
                  <img
                    src={
                      configuracao.pix_qr_path
                    }
                    alt="QR Code Pix da assinatura NOTE LITIS"
                    width={260}
                    height={260}
                    className="mx-auto max-w-full"
                  />

                  <p className="mt-3 text-sm font-medium">
                    Pix de{" "}
                    {formatarMoeda(
                      configuracao.valor_mensal
                    )}
                  </p>
                </div>

                <div>
                  <p className="font-semibold">
                    Já realizou o pagamento?
                  </p>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Informe os dados abaixo. Não é necessário enviar
                    comprovante. O recebimento será conferido pela equipe
                    do NOTE LITIS.
                  </p>

                  <form
                    action={
                      informarPagamentoPix
                    }
                    className="mt-5 space-y-4"
                  >
                    <div>
                      <label
                        htmlFor="nome_pagador"
                        className="text-sm font-medium"
                      >
                        Nome de quem realizou o Pix
                      </label>

                      <input
                        id="nome_pagador"
                        name="nome_pagador"
                        required
                        maxLength={160}
                        className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                        placeholder="Nome do titular da conta que realizou o Pix"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="whatsapp"
                        className="text-sm font-medium"
                      >
                        WhatsApp para contato
                      </label>

                      <input
                        id="whatsapp"
                        name="whatsapp"
                        required
                        maxLength={30}
                        className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                        placeholder="(81) 99999-9999"
                      />
                    </div>

                    <button
                      type="submit"
                      className="rounded-lg bg-[#0b1f3a] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
                    >
                      Já realizei o pagamento
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-[#0b1f3a]" />

          <div>
            <h2 className="text-lg font-semibold">
              Conta e segurança
            </h2>

            <p className="text-sm text-muted-foreground">
              Dados do usuário Master.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="flex gap-3">
            <UserRound className="mt-0.5 h-5 w-5 text-muted-foreground" />

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Nome
              </p>

              <p className="mt-1 font-medium">
                {perfil.nome}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <KeyRound className="mt-0.5 h-5 w-5 text-muted-foreground" />

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                E-mail
              </p>

              <p className="mt-1 font-medium">
                {perfil.email}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Link
            href="/auth/update-password"
            className="inline-flex items-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-50"
          >
            Alterar senha
          </Link>
        </div>
      </section>
    </div>
  );
}
