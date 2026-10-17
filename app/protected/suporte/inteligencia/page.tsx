import Link from "next/link";

import {
  Activity,
  ArrowLeft,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  SearchX,
  Users,
} from "lucide-react";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function formatarData(
  valor:
    | string
    | null
    | undefined
) {
  if (!valor) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone:
        "America/Recife",
    }
  ).format(
    new Date(valor)
  );
}

function formatarDataHora(
  valor:
    | string
    | null
    | undefined
) {
  if (!valor) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
      timeZone:
        "America/Recife",
    }
  ).format(
    new Date(valor)
  );
}

function formatarMoeda(
  valor:
    | number
    | string
    | null
    | undefined
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
    Number.isFinite(numero)
      ? numero
      : 0
  );
}

function dataRecife(
  valor:
    | string
    | Date
) {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone:
        "America/Recife",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).format(
    typeof valor === "string"
      ? new Date(valor)
      : valor
  );
}

function mesRecife(
  valor:
    | string
    | Date
) {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone:
        "America/Recife",
      year: "numeric",
      month: "2-digit",
    }
  ).format(
    typeof valor === "string"
      ? new Date(valor)
      : valor
  );
}

function nomeStatusPagamento(
  status: string
) {
  const nomes:
    Record<
      string,
      string
    > = {
      aguardando_confirmacao:
        "Aguardando confirmação",
      confirmado:
        "Confirmado",
      nao_localizado:
        "Não localizado",
    };

  return (
    nomes[status] ??
    status
  );
}

function classeStatusPagamento(
  status: string
) {
  if (
    status ===
    "confirmado"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (
    status ===
    "nao_localizado"
  ) {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (
    status ===
    "aguardando_confirmacao"
  ) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default async function InteligenciaPage() {
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
    data:
      administrador,

    error:
      erroAdministrador,
  } =
    await admin
      .from(
        "administradores_plataforma"
      )
      .select(
        "id, ativo"
      )
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
    empresasResposta,
    membrosResposta,
    diligenciasResposta,
    auditoriaResposta,
    contasResposta,
    pagamentosResposta,
  ] =
    await Promise.all([
      admin
        .from(
          "empresas"
        )
        .select(`
          id,
          nome,
          status_acesso,
          criada_em
        `)
        .order(
          "criada_em",
          {
            ascending: false,
          }
        ),

      admin
        .from(
          "membros_empresa"
        )
        .select(`
          empresa_id,
          usuario_id,
          ativo
        `),

      admin
        .from(
          "diligencias"
        )
        .select(`
          id,
          empresa_id
        `)
        .is(
          "excluida_em",
          null
        ),

      admin
        .from(
          "audit_logs"
        )
        .select(`
          empresa_id,
          usuario_id,
          acao,
          entidade_tipo,
          criado_em
        `)
        .order(
          "criado_em",
          {
            ascending: false,
          }
        ),

      admin
        .from(
          "contas_comerciais"
        )
        .select(`
          empresa_id,
          status_comercial,
          acesso_pago_ate
        `),

      admin
        .from(
          "pagamentos_pix_manuais"
        )
        .select(`
          id,
          empresa_id,
          valor,
          status,
          nome_pagador,
          declarado_em,
          atualizado_em
        `)
        .order(
          "declarado_em",
          {
            ascending: false,
          }
        ),
    ]);

  if (
    empresasResposta.error
  ) {
    throw new Error(
      `Erro ao carregar empresas: ${empresasResposta.error.message}`
    );
  }

  if (
    membrosResposta.error
  ) {
    throw new Error(
      `Erro ao carregar usuários: ${membrosResposta.error.message}`
    );
  }

  if (
    diligenciasResposta.error
  ) {
    throw new Error(
      `Erro ao carregar diligências: ${diligenciasResposta.error.message}`
    );
  }

  if (
    auditoriaResposta.error
  ) {
    throw new Error(
      `Erro ao carregar atividade: ${auditoriaResposta.error.message}`
    );
  }

  if (
    contasResposta.error
  ) {
    throw new Error(
      `Erro ao carregar contas comerciais: ${contasResposta.error.message}`
    );
  }

  if (
    pagamentosResposta.error
  ) {
    throw new Error(
      `Erro ao carregar pagamentos: ${pagamentosResposta.error.message}`
    );
  }

  const empresas =
    empresasResposta.data ??
    [];

  const membros =
    membrosResposta.data ??
    [];

  const diligencias =
    diligenciasResposta.data ??
    [];

  const auditoria =
    auditoriaResposta.data ??
    [];

  const contas =
    contasResposta.data ??
    [];

  const pagamentos =
    pagamentosResposta.data ??
    [];

  const agora =
    new Date();

  const inicio7 =
    new Date(
      agora.getTime() -
        7 *
          24 *
          60 *
          60 *
          1000
    );

  const inicio30 =
    new Date(
      agora.getTime() -
        30 *
          24 *
          60 *
          60 *
          1000
    );

  const inicio30Timestamp =
    inicio30.getTime();

  const inicio7Timestamp =
    inicio7.getTime();

  const mesAtual =
    mesRecife(
      agora
    );

  const nomesEmpresas =
    new Map(
      empresas.map(
        (empresa) => [
          empresa.id,
          empresa.nome,
        ]
      )
    );

  const contasPorEmpresa =
    new Map(
      contas.map(
        (conta) => [
          conta.empresa_id,
          conta,
        ]
      )
    );

  const usuariosPorEmpresa =
    new Map<
      string,
      {
        total: number;
        ativos: number;
      }
    >();

  for (
    const membro
    of membros
  ) {
    const atual =
      usuariosPorEmpresa.get(
        membro.empresa_id
      ) ?? {
        total: 0,
        ativos: 0,
      };

    atual.total += 1;

    if (
      membro.ativo
    ) {
      atual.ativos += 1;
    }

    usuariosPorEmpresa.set(
      membro.empresa_id,
      atual
    );
  }

  const diligenciasPorEmpresa =
    new Map<
      string,
      {
        total: number;
        ultimos30: number;
      }
    >();

  for (
    const diligencia
    of diligencias
  ) {
    const atual =
      diligenciasPorEmpresa.get(
        diligencia.empresa_id
      ) ?? {
        total: 0,
        ultimos30: 0,
      };

    atual.total += 1;

    diligenciasPorEmpresa.set(
      diligencia.empresa_id,
      atual
    );
  }

  const atividadePorEmpresa =
    new Map<
      string,
      {
        dias30: Set<string>;
        ultimaAtividade:
          | string
          | null;
        ativa7: boolean;
        ativa30: boolean;
      }
    >();

  for (
    const registro
    of auditoria
  ) {
    const empresaId =
      registro.empresa_id;

    if (
      !empresaId
    ) {
      continue;
    }

    const atual =
      atividadePorEmpresa.get(
        empresaId
      ) ?? {
        dias30:
          new Set<string>(),
        ultimaAtividade:
          null,
        ativa7: false,
        ativa30: false,
      };

    const timestamp =
      new Date(
        registro.criado_em
      ).getTime();

    if (
      !atual
        .ultimaAtividade
    ) {
      atual.ultimaAtividade =
        registro.criado_em;
    }

    if (
      timestamp >=
      inicio30Timestamp
    ) {
      atual.ativa30 =
        true;

      atual.dias30.add(
        dataRecife(
          registro.criado_em
        )
      );

      if (
        registro.entidade_tipo ===
          "diligencia" &&
        String(
          registro.acao ?? ""
        ).includes(
          "CRIAD"
        )
      ) {
        const volume =
          diligenciasPorEmpresa.get(
            empresaId
          ) ?? {
            total: 0,
            ultimos30: 0,
          };

        volume.ultimos30 +=
          1;

        diligenciasPorEmpresa.set(
          empresaId,
          volume
        );
      }
    }

    if (
      timestamp >=
      inicio7Timestamp
    ) {
      atual.ativa7 =
        true;
    }

    atividadePorEmpresa.set(
      empresaId,
      atual
    );
  }

  const empresasAtivas =
    empresas.filter(
      (empresa) =>
        empresa.status_acesso ===
        "ativo"
    ).length;

  const usuariosCadastrados =
    new Set(
      membros.map(
        (membro) =>
          membro.usuario_id
      )
    ).size;

  const empresasAtivas7 =
    empresas.filter(
      (empresa) =>
        atividadePorEmpresa
          .get(
            empresa.id
          )
          ?.ativa7
    ).length;

  const empresasAtivas30 =
    empresas.filter(
      (empresa) =>
        atividadePorEmpresa
          .get(
            empresa.id
          )
          ?.ativa30
    ).length;

  const diligencias30 =
    Array.from(
      diligenciasPorEmpresa.values()
    ).reduce(
      (
        total,
        volume
      ) =>
        total +
        volume.ultimos30,
      0
    );

  const pagamentosConfirmados =
    pagamentos.filter(
      (pagamento) =>
        pagamento.status ===
        "confirmado"
    );

  const receitaAcumulada =
    pagamentosConfirmados.reduce(
      (
        total,
        pagamento
      ) =>
        total +
        Number(
          pagamento.valor ??
            0
        ),
      0
    );

  const receitaMes =
    pagamentosConfirmados
      .filter(
        (pagamento) =>
          pagamento.atualizado_em &&
          mesRecife(
            pagamento.atualizado_em
          ) ===
            mesAtual
      )
      .reduce(
        (
          total,
          pagamento
        ) =>
          total +
          Number(
            pagamento.valor ??
              0
          ),
        0
      );

  const pagamentosPendentes =
    pagamentos.filter(
      (pagamento) =>
        pagamento.status ===
        "aguardando_confirmacao"
    ).length;

  const pagamentosNaoLocalizados =
    pagamentos.filter(
      (pagamento) =>
        pagamento.status ===
        "nao_localizado"
    ).length;

  const clientes =
    empresas
      .map(
        (empresa) => {
          const usuarios =
            usuariosPorEmpresa.get(
              empresa.id
            ) ?? {
              total: 0,
              ativos: 0,
            };

          const volume =
            diligenciasPorEmpresa.get(
              empresa.id
            ) ?? {
              total: 0,
              ultimos30: 0,
            };

          const atividade =
            atividadePorEmpresa.get(
              empresa.id
            );

          const conta =
            contasPorEmpresa.get(
              empresa.id
            );

          return {
            ...empresa,
            usuarios,
            volume,
            atividade,
            conta,
          };
        }
      )
      .sort(
        (
          a,
          b
        ) => {
          const dataA =
            a.atividade
              ?.ultimaAtividade
              ? new Date(
                  a
                    .atividade
                    .ultimaAtividade
                ).getTime()
              : 0;

          const dataB =
            b.atividade
              ?.ultimaAtividade
              ? new Date(
                  b
                    .atividade
                    .ultimaAtividade
                ).getTime()
              : 0;

          if (
            dataA !== dataB
          ) {
            return (
              dataB -
              dataA
            );
          }

          return a.nome.localeCompare(
            b.nome,
            "pt-BR"
          );
        }
      );

  const pagamentosExibidos =
    pagamentos.slice(
      0,
      100
    );

  const indicadores = [
    {
      titulo:
        "Empresas cadastradas",
      valor:
        empresas.length,
      descricao:
        "Total de empresas na base.",
      icone:
        Building2,
    },
    {
      titulo:
        "Empresas com acesso ativo",
      valor:
        empresasAtivas,
      descricao:
        "Empresas atualmente liberadas.",
      icone:
        CheckCircle2,
    },
    {
      titulo:
        "Usuários cadastrados",
      valor:
        usuariosCadastrados,
      descricao:
        "Usuários vinculados às empresas.",
      icone:
        Users,
    },
    {
      titulo:
        "Empresas ativas em 7 dias",
      valor:
        empresasAtivas7,
      descricao:
        "Com atividade operacional registrada.",
      icone:
        Activity,
    },
    {
      titulo:
        "Empresas ativas em 30 dias",
      valor:
        empresasAtivas30,
      descricao:
        "Com atividade operacional registrada.",
      icone:
        Activity,
    },
    {
      titulo:
        "Diligências cadastradas",
      valor:
        diligencias.length,
      descricao:
        "Total atual na plataforma.",
      icone:
        ClipboardList,
    },
    {
      titulo:
        "Diligências nos últimos 30 dias",
      valor:
        diligencias30,
      descricao:
        "Novas diligências cadastradas.",
      icone:
        ClipboardList,
    },
    {
      titulo:
        "Receita confirmada no mês",
      valor:
        formatarMoeda(
          receitaMes
        ),
      descricao:
        "Pagamentos Pix confirmados no mês.",
      icone:
        CircleDollarSign,
    },
    {
      titulo:
        "Receita confirmada acumulada",
      valor:
        formatarMoeda(
          receitaAcumulada
        ),
      descricao:
        "Total de pagamentos Pix confirmados.",
      icone:
        CircleDollarSign,
    },
    {
      titulo:
        "Aguardando confirmação",
      valor:
        pagamentosPendentes,
      descricao:
        "Pagamentos ainda em conferência.",
      icone:
        CreditCard,
    },
    {
      titulo:
        "Não localizados",
      valor:
        pagamentosNaoLocalizados,
      descricao:
        "Tentativas não confirmadas.",
      icone:
        SearchX,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/protected/suporte"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar à administração
        </Link>

        <div className="mt-5 flex items-center gap-3">
          <Activity className="h-7 w-7 text-[#0b1f3a]" />

          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Inteligência
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Visão financeira, base de clientes e utilização operacional do NOTE LITIS.
            </p>
          </div>
        </div>
      </div>

      <section>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {indicadores.map(
            (
              indicador
            ) => {
              const Icone =
                indicador.icone;

              return (
                <div
                  key={
                    indicador.titulo
                  }
                  className="rounded-2xl border bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <Icone className="h-5 w-5 text-muted-foreground" />

                    <p className="text-sm font-medium">
                      {
                        indicador.titulo
                      }
                    </p>
                  </div>

                  <p className="mt-4 text-2xl font-semibold">
                    {
                      indicador.valor
                    }
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {
                      indicador.descricao
                    }
                  </p>
                </div>
              );
            }
          )}
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold">
            Clientes
          </h2>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            A atividade representa dias em que houve ação registrada na auditoria do sistema.
            Ela mede uso operacional e não simples acesso ou visualização de páginas.
          </p>
        </div>

        {clientes.length ? (
          <div className="mt-6 overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">
                    Cliente
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Cadastro
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Acesso
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Usuários
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Diligências
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Diligências 30d
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Dias ativos 30d
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Última atividade
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Acesso pago até
                  </th>
                </tr>
              </thead>

              <tbody>
                {clientes.map(
                  (
                    cliente
                  ) => (
                    <tr
                      key={
                        cliente.id
                      }
                      className="border-t"
                    >
                      <td className="px-4 py-4">
                        <p className="font-medium">
                          {
                            cliente.nome
                          }
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {
                            cliente.status_acesso
                          }
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        {formatarData(
                          cliente.criada_em
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={
                            cliente.status_acesso ===
                            "ativo"
                              ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800"
                              : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                          }
                        >
                          {
                            cliente.status_acesso
                          }
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span className="font-medium">
                          {
                            cliente
                              .usuarios
                              .ativos
                          }
                        </span>
                        <span className="text-muted-foreground">
                          {" / "}
                          {
                            cliente
                              .usuarios
                              .total
                          }
                        </span>
                      </td>

                      <td className="px-4 py-4 font-medium">
                        {
                          cliente
                            .volume
                            .total
                        }
                      </td>

                      <td className="px-4 py-4 font-medium">
                        {
                          cliente
                            .volume
                            .ultimos30
                        }
                      </td>

                      <td className="px-4 py-4 font-medium">
                        {
                          cliente
                            .atividade
                            ?.dias30
                            .size ??
                          0
                        }
                      </td>

                      <td className="px-4 py-4">
                        {cliente
                          .atividade
                          ?.ultimaAtividade
                          ? formatarDataHora(
                              cliente
                                .atividade
                                .ultimaAtividade
                            )
                          : "Sem atividade registrada"}
                      </td>

                      <td className="px-4 py-4">
                        {formatarData(
                          cliente
                            .conta
                            ?.acesso_pago_ate
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed p-8 text-center">
            <p className="font-medium">
              Nenhuma empresa cadastrada
            </p>
          </div>
        )}

        <p className="mt-3 text-xs text-muted-foreground">
          Em “Usuários”, o primeiro número representa vínculos ativos e o segundo o total
          de usuários já cadastrados na empresa.
        </p>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold">
            Pagamentos
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Últimos registros de pagamentos Pix informados pelos clientes.
          </p>
        </div>

        {pagamentosExibidos.length ? (
          <div className="mt-6 overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">
                    Cliente
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Valor
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Pagador
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Informado em
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Status
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Atualizado em
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Acesso pago até
                  </th>
                </tr>
              </thead>

              <tbody>
                {pagamentosExibidos.map(
                  (
                    pagamento
                  ) => (
                    <tr
                      key={
                        pagamento.id
                      }
                      className="border-t"
                    >
                      <td className="px-4 py-4 font-medium">
                        {nomesEmpresas.get(
                          pagamento.empresa_id
                        ) ??
                          "Empresa não identificada"}
                      </td>

                      <td className="px-4 py-4 font-medium">
                        {formatarMoeda(
                          pagamento.valor
                        )}
                      </td>

                      <td className="px-4 py-4">
                        {
                          pagamento.nome_pagador
                        }
                      </td>

                      <td className="px-4 py-4">
                        {formatarDataHora(
                          pagamento.declarado_em
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${classeStatusPagamento(
                            pagamento.status
                          )}`}
                        >
                          {nomeStatusPagamento(
                            pagamento.status
                          )}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        {formatarDataHora(
                          pagamento.atualizado_em
                        )}
                      </td>

                      <td className="px-4 py-4">
                        {formatarData(
                          contasPorEmpresa.get(
                            pagamento.empresa_id
                          )
                            ?.acesso_pago_ate
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed p-8 text-center">
            <p className="font-medium">
              Nenhum pagamento registrado
            </p>
          </div>
        )}

        {pagamentos.length >
          pagamentosExibidos.length && (
          <p className="mt-3 text-xs text-muted-foreground">
            A tabela exibe os 100 registros de pagamento mais recentes.
          </p>
        )}
      </section>
    </div>
  );
}
