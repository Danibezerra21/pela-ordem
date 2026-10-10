import Link from "next/link";
import { redirect } from "next/navigation";

import {
  Building2,
  CalendarDays,
  CircleCheck,
  Clock3,
  CreditCard,
  KeyRound,
  RefreshCw,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";


function formatarData(
  data: string | null | undefined
) {
  if (!data) {
    return "—";
  }

  const somenteData =
    data.slice(0, 10);

  const [
    ano,
    mes,
    dia,
  ] =
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

  if (
    !Number.isFinite(numero)
  ) {
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


function diasRestantes(
  fim:
    | string
    | null
    | undefined
) {
  if (!fim) {
    return null;
  }

  const agora =
    new Date();

  const termino =
    new Date(fim);

  const diferenca =
    termino.getTime() -
    agora.getTime();

  return Math.max(
    0,
    Math.ceil(
      diferenca /
        (
          1000 *
          60 *
          60 *
          24
        )
    )
  );
}


function nomeStatusComercial(
  status:
    | string
    | null
    | undefined
) {
  const nomes:
    Record<string, string> = {
      teste:
        "Período gratuito",
      aguardando_contratacao:
        "Aguardando contratação",
      ativa:
        "Ativa",
      inadimplente:
        "Pagamento pendente",
      suspensa:
        "Suspensa",
      cancelada:
        "Cancelada",
    };

  return status
    ? (
        nomes[status] ??
        status
      )
    : "Não definido";
}


export default async function ConfiguracoesPage() {
  const supabase =
    await createClient();


  /* =====================================================
     AUTENTICAÇÃO
  ===================================================== */

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


  /* =====================================================
     MASTER + EMPRESA
  ===================================================== */

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
        "empresa_id, papel, ativo"
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
      `Erro ao localizar vínculo: ${erroMembro.message}`
    );
  }


  if (
    !membro ||
    membro.papel !==
      "master"
  ) {
    redirect(
      "/protected/acesso-negado"
    );
  }


  const empresaId =
    membro.empresa_id;


  /* =====================================================
     DADOS
  ===================================================== */

  const [
    empresaResposta,
    perfilResposta,
    contaResposta,
    assinaturaResposta,
    mudancaResposta,
  ] =
    await Promise.all([
      supabase
        .from(
          "empresas"
        )
        .select(`
          id,
          nome,
          tipo_documento,
          documento_final,
          status_acesso,
          criada_em
        `)
        .eq(
          "id",
          empresaId
        )
        .single(),

      supabase
        .from(
          "perfis_usuarios"
        )
        .select(
          "nome, email"
        )
        .eq(
          "id",
          usuarioId
        )
        .single(),

      supabase
        .from(
          "contas_comerciais"
        )
        .select(`
          id,
          status_comercial,
          teste_inicio,
          teste_fim,
          acesso_ate,
          ultimo_pagamento_em
        `)
        .eq(
          "empresa_id",
          empresaId
        )
        .maybeSingle(),

      supabase
        .from(
          "assinaturas_empresas"
        )
        .select(`
          id,
          plano_codigo,
          ciclo,
          valor_contratado,
          desconto_percentual,
          status_interno,
          status_asaas,
          vigencia_inicio,
          vigencia_fim,
          renovacao_em,
          cancelamento_ate,
          renovacao_automatica,
          cancelamento_solicitado_em,
          vigente,
          criada_em
        `)
        .eq(
          "empresa_id",
          empresaId
        )
        .eq(
          "vigente",
          true
        )
        .order(
          "criada_em",
          {
            ascending:
              false,
          }
        )
        .limit(1)
        .maybeSingle(),

      supabase
        .from(
          "mudancas_plano_agendadas"
        )
        .select(`
          id,
          novo_plano_codigo,
          novo_ciclo,
          novo_valor,
          periodo_atual_fim,
          inicio_previsto,
          cobrar_a_partir_de,
          status
        `)
        .eq(
          "empresa_id",
          empresaId
        )
        .eq(
          "status",
          "agendada"
        )
        .maybeSingle(),
    ]);


  if (
    empresaResposta.error
  ) {
    throw new Error(
      `Erro ao carregar empresa: ${empresaResposta.error.message}`
    );
  }


  if (
    perfilResposta.error
  ) {
    throw new Error(
      `Erro ao carregar usuário: ${perfilResposta.error.message}`
    );
  }


  if (
    contaResposta.error
  ) {
    throw new Error(
      `Erro ao carregar conta comercial: ${contaResposta.error.message}`
    );
  }


  if (
    assinaturaResposta.error
  ) {
    throw new Error(
      `Erro ao carregar assinatura: ${assinaturaResposta.error.message}`
    );
  }


  if (
    mudancaResposta.error
  ) {
    throw new Error(
      `Erro ao carregar mudança de plano: ${mudancaResposta.error.message}`
    );
  }


  const empresa =
    empresaResposta.data;

  const perfil =
    perfilResposta.data;

  const conta =
    contaResposta.data;

  const assinatura =
    assinaturaResposta.data;

  const mudanca =
    mudancaResposta.data;


  const diasTeste =
    conta
      ?.status_comercial ===
        "teste"
      ? diasRestantes(
          conta.teste_fim
        )
      : null;


  return (
    <div className="space-y-8">
      {/* =================================================
          CABEÇALHO
      ================================================= */}

      <div>
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-[#0b1f3a]" />

          <h1 className="text-3xl font-semibold tracking-tight">
            Configurações
          </h1>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">
          Gerencie os dados da empresa,
          a assinatura e as informações
          da sua conta.
        </p>
      </div>


      {/* =================================================
          DADOS DO ESCRITÓRIO
      ================================================= */}

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-[#0b1f3a]" />

          <div>
            <h2 className="text-lg font-semibold">
              Dados do escritório
            </h2>

            <p className="text-sm text-muted-foreground">
              Informações vinculadas à
              conta do NOTE LITIS.
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
                {
                  empresa
                    .status_acesso
                }
              </span>
            </div>
          </div>


          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Documento
            </p>

            <p className="mt-1 font-medium">
              {
                empresa
                  .tipo_documento
                  ?.toUpperCase() ??
                "Não informado"
              }

              {empresa
                .documento_final
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


      {/* =================================================
          ASSINATURA
      ================================================= */}

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-[#0b1f3a]" />

            <div>
              <h2 className="text-lg font-semibold">
                Minha assinatura
              </h2>

              <p className="text-sm text-muted-foreground">
                Acompanhe sua vigência,
                renovação e situação
                comercial.
              </p>
            </div>
          </div>


          {conta && (
            <span className="rounded-full border px-3 py-1 text-xs font-medium">
              {nomeStatusComercial(
                conta.status_comercial
              )}
            </span>
          )}
        </div>


        {/* TESTE GRÁTIS */}

        {conta
          ?.status_comercial ===
          "teste" && (
          <div className="mt-6 rounded-xl border bg-slate-50 p-5">
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 h-5 w-5" />

              <div>
                <p className="font-semibold">
                  Período gratuito
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Você está utilizando
                  o NOTE LITIS durante
                  o período gratuito de
                  7 dias.
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Início
                    </p>

                    <p className="mt-1 font-medium">
                      {formatarData(
                        conta.teste_inicio
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Término
                    </p>

                    <p className="mt-1 font-medium">
                      {formatarData(
                        conta.teste_fim
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Restante
                    </p>

                    <p className="mt-1 font-medium">
                      {diasTeste === 1
                        ? "1 dia"
                        : `${diasTeste ?? 0} dias`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* SEM ASSINATURA */}

        {!assinatura &&
          conta
            ?.status_comercial !==
            "teste" && (
            <div className="mt-6 rounded-xl border border-dashed p-6">
              <p className="font-semibold">
                Nenhuma assinatura ativa
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                Escolha um plano para
                continuar utilizando o
                NOTE LITIS.
              </p>
            </div>
          )}


        {/* ASSINATURA ATIVA */}

        {assinatura && (
          <div className="mt-6">
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Plano
                </p>

                <p className="mt-1 font-semibold">
                  {
                    assinatura
                      .plano_codigo
                  }
                </p>

                <p className="text-sm capitalize text-muted-foreground">
                  {
                    assinatura
                      .ciclo
                  }
                </p>
              </div>


              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Valor contratado
                </p>

                <p className="mt-1 font-semibold">
                  {formatarMoeda(
                    assinatura
                      .valor_contratado
                  )}
                </p>
              </div>


              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Período atual
                </p>

                <p className="mt-1 font-semibold">
                  {formatarData(
                    assinatura
                      .vigencia_inicio
                  )}
                  {" a "}
                  {formatarData(
                    assinatura
                      .vigencia_fim
                  )}
                </p>
              </div>


              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Próxima renovação
                </p>

                <p className="mt-1 font-semibold">
                  {assinatura
                    .renovacao_automatica
                    ? formatarData(
                        assinatura
                          .renovacao_em
                      )
                    : "Não programada"}
                </p>
              </div>
            </div>


            <div className="mt-6 rounded-xl border bg-slate-50 p-5">
              <div className="flex gap-3">
                <CalendarDays className="mt-0.5 h-5 w-5" />

                <div>
                  <p className="font-medium">
                    Vigência e cancelamento
                  </p>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Seu período contratado
                    é válido de{" "}
                    <strong className="text-foreground">
                      {formatarData(
                        assinatura
                          .vigencia_inicio
                      )}
                    </strong>{" "}
                    até{" "}
                    <strong className="text-foreground">
                      {formatarData(
                        assinatura
                          .vigencia_fim
                      )}
                    </strong>
                    .
                  </p>

                  {assinatura
                    .renovacao_automatica && (
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Para evitar uma nova
                      cobrança, solicite o
                      cancelamento até{" "}
                      <strong className="text-foreground">
                        {formatarData(
                          assinatura
                            .cancelamento_ate
                        )}
                      </strong>
                      . Seu acesso permanece
                      ativo até o final do
                      período já contratado.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}


        {/* MUDANÇA AGENDADA */}

        {mudanca && (
          <div className="mt-6 rounded-xl border p-5">
            <div className="flex items-start gap-3">
              <RefreshCw className="mt-0.5 h-5 w-5" />

              <div>
                <p className="font-semibold">
                  Mudança de plano agendada
                </p>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Seu plano atual permanece
                  válido até{" "}
                  <strong className="text-foreground">
                    {formatarData(
                      mudanca
                        .periodo_atual_fim
                    )}
                  </strong>
                  .
                </p>

                <p className="text-sm leading-6 text-muted-foreground">
                  O plano{" "}
                  <strong className="text-foreground">
                    {
                      mudanca
                        .novo_plano_codigo
                    }
                  </strong>{" "}
                  (
                  {
                    mudanca
                      .novo_ciclo
                  }
                  ) passará a valer em{" "}
                  <strong className="text-foreground">
                    {formatarData(
                      mudanca
                        .inicio_previsto
                    )}
                  </strong>
                  .
                </p>

                <p className="mt-2 text-sm font-medium">
                  Nenhuma cobrança do novo
                  plano será realizada antes
                  de{" "}
                  {formatarData(
                    mudanca
                      .cobrar_a_partir_de
                  )}
                  .
                </p>
              </div>
            </div>
          </div>
        )}


        <div className="mt-6 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
          A contratação, alteração e
          cancelamento de planos serão
          habilitados nesta área na próxima
          etapa da integração com o Asaas.
        </div>
      </section>


      {/* =================================================
          CONTA E SEGURANÇA
      ================================================= */}

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