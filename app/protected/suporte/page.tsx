import Link from "next/link";

import {
  Activity,
  Bug,
  Building2,
  CalendarDays,
  CircleCheck,
  CreditCard,
  Headphones,
  MessageSquare,
  Search,
  Settings2,
} from "lucide-react";

import { redirect } from "next/navigation";

import {
  alterarStatusBeta,
  salvarDataFimBeta,
} from "./actions";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function formatarData(
  data:
    | string
    | null
) {
  if (!data) {
    return "Não definida";
  }

  const [ano, mes, dia] =
    data
      .slice(0, 10)
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

function formatarDataHora(
  data: string
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
      timeZone:
        "America/Recife",
    }
  ).format(
    new Date(data)
  );
}

function formatarMoeda(
  valor:
    | number
    | string
    | null
) {
  const numero =
    Number(
      valor ?? 0
    );

  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  ).format(
    numero
  );
}

function nomeStatus(
  status: string
) {
  const nomes:
    Record<
      string,
      string
    > = {
      aberto: "Aberto",
      aguardando_suporte:
        "Aguardando suporte",
      aguardando_usuario:
        "Aguardando usuário",
      resolvido: "Resolvido",
    };

  return nomes[status] ?? status;
}

function nomeCategoria(
  categoria: string
) {
  const nomes:
    Record<
      string,
      string
    > = {
      problema_tecnico:
        "Problema técnico",
      duvida_utilizacao:
        "Dúvida de utilização",
      sugestao: "Sugestão",
      outro: "Outro",
    };

  return nomes[categoria] ?? categoria;
}

type SuportePageProps = {
  searchParams?: Promise<{
    busca?:
      | string
      | string[];
  }>;
};

export default async function SuportePage({
  searchParams,
}: SuportePageProps) {
  const parametros =
    searchParams
      ? await searchParams
      : {};

  const buscaRecebida =
    Array.isArray(
      parametros.busca
    )
      ? parametros.busca[0]
      : parametros.busca;

  const busca =
    (buscaRecebida ?? "")
      .trim();

  const termoBusca =
    busca.toLowerCase();

  const supabase =
    await createClient();

  const {
    data: { user },
    error: authError,
  } =
    await supabase
      .auth
      .getUser();

  if (
    authError ||
    !user
  ) {
    redirect(
      "/auth/login"
    );
  }

  const admin =
    createAdminClient();

  const {
    data: administrador,
    error: erroAdministrador,
  } =
    await admin
      .from(
        "administradores_plataforma"
      )
      .select("id, ativo")
      .eq(
        "usuario_id",
        user.id
      )
      .eq(
        "ativo",
        true
      )
      .maybeSingle();

  if (
    erroAdministrador ||
    !administrador
  ) {
    redirect(
      "/protected/acesso-negado"
    );
  }

  const [
    configuracaoResposta,
    chamadosResposta,
    pagamentosResposta,
    empresasResposta,
    mastersResposta,
  ] =
    await Promise.all([
      admin
        .from(
          "configuracoes_plataforma"
        )
        .select(`
          beta_ativa,
          beta_fim,
          valor_mensal,
          pix_chave,
          pix_beneficiario,
          pix_qr_path,
          atualizado_em
        `)
        .eq(
          "id",
          true
        )
        .single(),

      admin
        .from(
          "chamados_suporte"
        )
        .select(`
          id,
          numero,
          empresa_id,
          usuario_id,
          categoria,
          assunto,
          status,
          email_contato,
          whatsapp_contato,
          criado_em,
          atualizado_em
        `)
        .order(
          "atualizado_em",
          {
            ascending: false,
          }
        )
        .limit(100),

      admin
        .from(
          "pagamentos_pix_manuais"
        )
        .select(
          "id",
          {
            count: "exact",
            head: true,
          }
        )
        .eq(
          "status",
          "aguardando_confirmacao"
        ),

      admin
        .from("empresas")
        .select(`
          id,
          nome,
          tipo_documento,
          documento_final,
          status_acesso,
          criada_em
        `)
        .order(
          "nome",
          {
            ascending: true,
          }
        ),

      admin
        .from(
          "membros_empresa"
        )
        .select(`
          empresa_id,
          usuario_id
        `)
        .eq(
          "papel",
          "master"
        )
        .eq(
          "ativo",
          true
        ),
    ]);

  if (
    configuracaoResposta.error
  ) {
    throw new Error(
      `Erro ao carregar configuração: ${configuracaoResposta.error.message}`
    );
  }

  if (
    chamadosResposta.error
  ) {
    throw new Error(
      `Erro ao carregar chamados: ${chamadosResposta.error.message}`
    );
  }

  if (
    empresasResposta.error
  ) {
    throw new Error(
      `Erro ao carregar empresas: ${empresasResposta.error.message}`
    );
  }

  if (
    mastersResposta.error
  ) {
    throw new Error(
      `Erro ao carregar usuários Master: ${mastersResposta.error.message}`
    );
  }

  const configuracao =
    configuracaoResposta.data;

  const chamados =
    chamadosResposta.data ?? [];

  const empresas =
    empresasResposta.data ?? [];

  const vinculosMaster =
    mastersResposta.data ?? [];

  const idsMasters =
    [
      ...new Set(
        vinculosMaster.map(
          (vinculo) =>
            vinculo.usuario_id
        )
      ),
    ];

  const {
    data: perfisMasters,
    error: erroPerfisMasters,
  } =
    idsMasters.length
      ? await admin
          .from(
            "perfis_usuarios"
          )
          .select(`
            id,
            nome,
            email
          `)
          .in(
            "id",
            idsMasters
          )
      : {
          data: [],
          error: null,
        };

  if (
    erroPerfisMasters
  ) {
    throw new Error(
      `Erro ao carregar perfis dos usuários Master: ${erroPerfisMasters.message}`
    );
  }

  const perfisPorId =
    new Map(
      (
        perfisMasters ?? []
      ).map(
        (perfil) => [
          perfil.id,
          perfil,
        ]
      )
    );

  const masterPorEmpresa =
    new Map(
      vinculosMaster.map(
        (vinculo) => {
          const perfil =
            perfisPorId.get(
              vinculo.usuario_id
            );

          return [
            vinculo.empresa_id,
            {
              nome:
                perfil?.nome ?? "",
              email:
                perfil?.email ?? "",
            },
          ] as const;
        }
      )
    );

  const empresasComMaster =
    empresas.map(
      (empresa) => {
        const master =
          masterPorEmpresa.get(
            empresa.id
          );

        return {
          ...empresa,
          master_nome:
            master?.nome ?? "",
          master_email:
            master?.email ?? "",
        };
      }
    );

  const empresasFiltradas =
    termoBusca
      ? empresasComMaster.filter(
          (empresa) =>
            [
              empresa.nome,
              empresa.tipo_documento,
              empresa.documento_final,
              empresa.master_nome,
              empresa.master_email,
            ].some(
              (valor) =>
                String(
                  valor ?? ""
                )
                  .toLowerCase()
                  .includes(
                    termoBusca
                  )
            )
        )
      : empresasComMaster;

  const nomesEmpresas =
    new Map(
      empresas.map(
        (empresa) => [
          empresa.id,
          empresa.nome,
        ]
      )
    );

  const chamadosAguardandoSuporte =
    chamados.filter(
      (chamado) =>
        chamado.status ===
          "aguardando_suporte" ||
        chamado.status ===
          "aberto"
    ).length;

  const pagamentosPendentes =
    pagamentosResposta.count ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Headphones className="h-7 w-7 text-[#0b1f3a]" />

        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Administração NOTE LITIS
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Controle da plataforma, suporte e operação comercial.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Settings2 className="h-5 w-5 text-muted-foreground" />

            <p className="font-medium">
              Plataforma
            </p>
          </div>

          <p className="mt-4 text-2xl font-semibold">
            {configuracao.beta_ativa
              ? "Beta"
              : "Produção"}
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Modo atualmente ativo.
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Bug className="h-5 w-5 text-muted-foreground" />

            <p className="font-medium">
              Aguardando suporte
            </p>
          </div>

          <p className="mt-4 text-2xl font-semibold">
            {chamadosAguardandoSuporte}
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Chamados que precisam da sua atenção.
          </p>
        </div>

        <Link
          href="/protected/suporte/pagamentos"
          className="block rounded-2xl border bg-white p-5 shadow-sm transition-colors hover:bg-slate-50"
        >
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-muted-foreground" />

            <p className="font-medium">
              Pagamentos
            </p>
          </div>

          <p className="mt-4 text-2xl font-semibold">
            {pagamentosPendentes}
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Pix aguardando conferência.
          </p>

          <p className="mt-3 text-xs font-medium text-[#0b1f3a]">
            Abrir fila de pagamentos
          </p>
        </Link>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-muted-foreground" />

            <p className="font-medium">
              Empresas
            </p>
          </div>

          <p className="mt-4 text-2xl font-semibold">
            {empresas.length}
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Contas cadastradas na plataforma.
          </p>
        </div>

        <Link
          href="/protected/suporte/inteligencia"
          className="block rounded-2xl border bg-white p-5 shadow-sm transition-colors hover:bg-slate-50"
        >
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-muted-foreground" />

            <p className="font-medium">
              Inteligência
            </p>
          </div>

          <p className="mt-4 text-2xl font-semibold">
            Indicadores
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Clientes, utilização e pagamentos.
          </p>

          <p className="mt-3 text-xs font-medium text-[#0b1f3a]">
            Abrir inteligência
          </p>
        </Link>
      </div>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-[#0b1f3a]" />

            <div>
              <h2 className="text-lg font-semibold">
                Empresas
              </h2>

              <p className="text-sm text-muted-foreground">
                Localize uma conta pelo escritório, documento ou usuário Master.
              </p>
            </div>
          </div>

          <form
            method="get"
            className="flex w-full max-w-xl flex-col gap-2 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                type="search"
                name="busca"
                defaultValue={
                  busca
                }
                placeholder="Empresa, documento, nome ou e-mail do Master"
                className="w-full rounded-lg border bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#0b1f3a]"
              />
            </div>

            <button
              type="submit"
              className="rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Buscar
            </button>

            {busca && (
              <Link
                href="/protected/suporte"
                className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50"
              >
                Limpar
              </Link>
            )}
          </form>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>
            {empresasFiltradas.length}{" "}
            {empresasFiltradas.length === 1
              ? "empresa encontrada"
              : "empresas encontradas"}
          </span>

          {busca && (
            <>
              <span>•</span>

              <span>
                Busca por:{" "}
                <strong className="font-medium text-foreground">
                  {busca}
                </strong>
              </span>
            </>
          )}
        </div>

        {empresasFiltradas.length ? (
          <div className="mt-5 overflow-hidden rounded-xl border">
            {empresasFiltradas.map(
              (empresa) => (
                <div
                  key={
                    empresa.id
                  }
                  className="border-b p-5 last:border-b-0"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-semibold">
                        {empresa.nome}
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {empresa.tipo_documento
                          ? empresa.tipo_documento.toUpperCase()
                          : "Documento"}
                        {empresa.documento_final
                          ? ` • final ${empresa.documento_final}`
                          : " • não informado"}
                      </p>

                      <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Usuário Master
                        </p>

                        <p className="mt-1 font-medium">
                          {empresa.master_nome ||
                            "Master não identificado"}
                        </p>

                        <p className="mt-0.5 break-all text-sm text-muted-foreground">
                          {empresa.master_email ||
                            "E-mail não informado"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-2 lg:items-end">
                      <span
                        className={
                          empresa.status_acesso ===
                          "ativo"
                            ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800"
                            : "rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                        }
                      >
                        {empresa.status_acesso}
                      </span>

                      <p className="text-xs text-muted-foreground">
                        Cadastro em{" "}
                        {formatarData(
                          empresa.criada_em
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed p-8 text-center">
            <p className="font-medium">
              Nenhuma empresa localizada
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Tente pesquisar pelo nome da empresa, documento, nome do Master ou login/e-mail.
            </p>
          </div>
        )}
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-5 w-5 text-[#0b1f3a]" />

          <div>
            <h2 className="text-lg font-semibold">
              Chamados de suporte
            </h2>

            <p className="text-sm text-muted-foreground">
              Atendimento enviado pelos usuários do NOTE LITIS.
            </p>
          </div>
        </div>

        {chamados.length ? (
          <div className="mt-6 overflow-hidden rounded-xl border">
            {chamados.map(
              (chamado) => (
                <Link
                  key={
                    chamado.id
                  }
                  href={`/protected/suporte/chamados/${chamado.id}`}
                  className="block border-b p-5 last:border-b-0 hover:bg-slate-50"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">
                          #NL-
                          {String(
                            chamado.numero
                          ).padStart(
                            6,
                            "0"
                          )}
                          {" — "}
                          {
                            chamado.assunto
                          }
                        </p>

                        {(
                          chamado.status ===
                            "aguardando_suporte" ||
                          chamado.status ===
                            "aberto"
                        ) && (
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                            Requer atenção
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm text-muted-foreground">
                        {nomesEmpresas.get(
                          chamado.empresa_id
                        ) ??
                          "Empresa não identificada"}
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {
                          chamado.email_contato
                        }
                        {" • "}
                        {nomeCategoria(
                          chamado.categoria
                        )}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Atualizado em{" "}
                        {formatarDataHora(
                          chamado.atualizado_em
                        )}
                      </p>
                    </div>

                    <span className="w-fit rounded-full border px-3 py-1 text-xs font-medium">
                      {nomeStatus(
                        chamado.status
                      )}
                    </span>
                  </div>
                </Link>
              )
            )}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed p-8 text-center">
            <p className="font-medium">
              Nenhum chamado recebido
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Os pedidos de suporte dos usuários aparecerão aqui.
            </p>
          </div>
        )}
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <CircleCheck className="h-5 w-5 text-[#0b1f3a]" />

              <h2 className="text-lg font-semibold">
                Versão Beta
              </h2>
            </div>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Enquanto a versão beta estiver ativa, os usuários poderão
              utilizar o NOTE LITIS sem cobrança e nenhuma opção de
              contratação ou pagamento será exibida.
            </p>
          </div>

          <span
            className={
              configuracao.beta_ativa
                ? "w-fit rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800"
                : "w-fit rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700"
            }
          >
            {configuracao.beta_ativa
              ? "Beta ativa"
              : "Beta desativada"}
          </span>
        </div>

        <div className="mt-6 rounded-xl border bg-slate-50 p-5">
          <p className="text-sm text-muted-foreground">
            Situação atual
          </p>

          <p className="mt-1 text-lg font-semibold">
            {configuracao.beta_ativa
              ? "Uso gratuito em versão beta"
              : "Modo comercial de produção"}
          </p>

          <form
            action={
              alterarStatusBeta
            }
            className="mt-5"
          >
            <input
              type="hidden"
              name="beta_ativa"
              value={
                configuracao.beta_ativa
                  ? "false"
                  : "true"
              }
            />

            <button
              type="submit"
              className={
                configuracao.beta_ativa
                  ? "inline-flex rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
                  : "inline-flex rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
              }
            >
              {configuracao.beta_ativa
                ? "Desativar versão beta"
                : "Ativar versão beta"}
            </button>
          </form>
        </div>

        <div className="mt-6 border-t pt-6">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />

            <div>
              <p className="font-medium">
                Data prevista de encerramento
              </p>

              <p className="text-sm text-muted-foreground">
                Opcional. Serve apenas para informar os usuários.
                A beta não será encerrada automaticamente.
              </p>
            </div>
          </div>

          <form
            action={
              salvarDataFimBeta
            }
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div>
              <label
                htmlFor="beta_fim"
                className="text-sm font-medium"
              >
                Data
              </label>

              <input
                id="beta_fim"
                name="beta_fim"
                type="date"
                defaultValue={
                  configuracao.beta_fim ??
                  ""
                }
                className="mt-1 block rounded-lg border bg-white px-3 py-2 text-sm"
              />
            </div>

            <button
              type="submit"
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Salvar data
            </button>
          </form>

          <p className="mt-3 text-sm text-muted-foreground">
            Data atualmente informada:{" "}
            <strong className="text-foreground">
              {formatarData(
                configuracao.beta_fim
              )}
            </strong>
          </p>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          Configuração comercial
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Estes dados ficam ocultos dos usuários enquanto a beta estiver ativa.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
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
              Forma de pagamento
            </p>

            <p className="mt-1 font-semibold">
              Pix
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

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Chave Pix
            </p>

            <p className="mt-1 font-medium">
              {configuracao.pix_chave}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
