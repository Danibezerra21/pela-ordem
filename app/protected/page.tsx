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

type DiligenciaDashboard = {
  id: string;
  tipo_diligencia: string;
  modalidade: "presencial" | "virtual" | null;
  numero_processo: string | null;
  parte_autora: string | null;
  parte_re: string | null;
  data_diligencia: string;
  horario: string;
  vara: string | null;
  comarca: string | null;
  uf: string | null;
  correspondente_id: string | null;
  necessita_preposto: boolean | null;
  preposto_id: string | null;

  testemunhas_status:
    | "confirmadas"
    | "desnecessarias"
    | null;

  contratacao_status:
    | "confirmada"
    | "desnecessaria"
    | null;

  orientacoes_encaminhadas:
    | boolean
    | null;

  status: string | null;
  excluida_em: string | null;
};

type ProfissionalDashboard = {
  id: string;
  nome: string;
  tipo: string | null;
};

/* =====================================================
   DATA ATUAL EM RECIFE
===================================================== */

function hojeEmRecife() {
  const partes =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "America/Recife",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      }
    ).formatToParts(
      new Date()
    );

  const ano =
    partes.find(
      (parte) =>
        parte.type ===
        "year"
    )?.value;

  const mes =
    partes.find(
      (parte) =>
        parte.type ===
        "month"
    )?.value;

  const dia =
    partes.find(
      (parte) =>
        parte.type ===
        "day"
    )?.value;

  return `${ano}-${mes}-${dia}`;
}

/* =====================================================
   SOMA DE DIAS
===================================================== */

function somarDiasISO(
  dataISO: string,
  dias: number
) {
  const [
    ano,
    mes,
    dia,
  ] =
    dataISO
      .split("-")
      .map(Number);

  const data =
    new Date(
      Date.UTC(
        ano,
        mes - 1,
        dia
      )
    );

  data.setUTCDate(
    data.getUTCDate() +
      dias
  );

  return data
    .toISOString()
    .slice(
      0,
      10
    );
}

/* =====================================================
   HORÁRIO EM MINUTOS
===================================================== */

function minutosDoHorario(
  horario: string
) {
  const [
    hora,
    minuto,
  ] =
    horario
      .slice(
        0,
        5
      )
      .split(":")
      .map(Number);

  return (
    (
      Number.isFinite(
        hora
      )
        ? hora
        : 0
    ) *
      60 +
    (
      Number.isFinite(
        minuto
      )
        ? minuto
        : 0
    )
  );
}

/* =====================================================
   FORMATAÇÃO DE DATA
===================================================== */

function formatarData(
  dataISO: string
) {
  const [
    ano,
    mes,
    dia,
  ] =
    dataISO
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

/* =====================================================
   FORMATAÇÃO DO PROCESSO
===================================================== */

function formatarProcesso(
  numero: string | null
) {
  if (!numero) {
    return "Processo não informado";
  }

  const digitos =
    numero.replace(
      /\D/g,
      ""
    );

  if (
    digitos.length !==
    20
  ) {
    return numero;
  }

  return digitos.replace(
    /^(\d{7})(\d{2})(\d{4})(\d)(\d{2})(\d{4})$/,
    "$1-$2.$3.$4.$5.$6"
  );
}

/* =====================================================
   MOTIVOS DE PENDÊNCIA
===================================================== */

function motivosPendencia(
  diligencia:
    DiligenciaDashboard
) {
  const motivos:
    string[] = [];

  if (
    !diligencia
      .correspondente_id
  ) {
    motivos.push(
      "sem_correspondente"
    );
  }

  if (
    diligencia
      .orientacoes_encaminhadas !==
    true
  ) {
    motivos.push(
      "sem_orientacoes"
    );
  }

  if (
    diligencia
      .necessita_preposto ===
    null
  ) {
    motivos.push(
      "preposto_nao_definido"
    );
  }

  if (
    diligencia
      .necessita_preposto ===
      true &&
    !diligencia
      .preposto_id
  ) {
    motivos.push(
      "preposto_nao_designado"
    );
  }

  if (
    diligencia
      .testemunhas_status ===
    null
  ) {
    motivos.push(
      "testemunhas_nao_definidas"
    );
  }

  if (
    diligencia
      .contratacao_status ===
    null
  ) {
    motivos.push(
      "contratacao_nao_definida"
    );
  }

  return motivos;
}

/* =====================================================
   CONFLITOS DE AGENDA

   Retorna a quantidade de diligências
   envolvidas em conflito.

   Assim, se o Dashboard mostrar 4,
   o filtro deverá mostrar 4 diligências.
===================================================== */

function contarConflitos(
  diligencias:
    DiligenciaDashboard[]
) {
  const agendaPorParticipante =
    new Map<
      string,
      DiligenciaDashboard[]
    >();

  for (
    const diligencia of
    diligencias
  ) {
    const participantes =
      [
        diligencia
          .correspondente_id,

        diligencia
          .preposto_id,
      ].filter(
        (
          id
        ): id is string =>
          Boolean(id)
      );

    for (
      const participanteId of
      participantes
    ) {
      const chave =
        `${participanteId}:${diligencia.data_diligencia}`;

      const lista =
        agendaPorParticipante.get(
          chave
        ) ?? [];

      lista.push(
        diligencia
      );

      agendaPorParticipante.set(
        chave,
        lista
      );
    }
  }

  const diligenciasComConflito =
    new Set<string>();

  for (
    const agenda of
    agendaPorParticipante.values()
  ) {
    const ordenada =
      [
        ...agenda,
      ].sort(
        (
          a,
          b
        ) =>
          minutosDoHorario(
            a.horario
          ) -
          minutosDoHorario(
            b.horario
          )
      );

    for (
      let i = 0;
      i <
      ordenada.length;
      i += 1
    ) {
      for (
        let j =
          i + 1;
        j <
        ordenada.length;
        j += 1
      ) {
        const diferenca =
          Math.abs(
            minutosDoHorario(
              ordenada[j]
                .horario
            ) -
              minutosDoHorario(
                ordenada[i]
                  .horario
              )
          );

        if (
          diferenca >=
          300
        ) {
          break;
        }

        diligenciasComConflito.add(
          ordenada[i].id
        );

        diligenciasComConflito.add(
          ordenada[j].id
        );
      }
    }
  }

  return diligenciasComConflito.size;
}

/* =====================================================
   DASHBOARD
===================================================== */

export default async function ProtectedPage() {
  const supabase =
    await createClient();

  /* ===================================================
     AUTENTICAÇÃO
  =================================================== */

  const {
    data,
    error,
  } =
    await supabase.auth.getClaims();

  if (
    error ||
    !data?.claims
  ) {
    redirect(
      "/auth/login"
    );
  }

  const usuarioId =
    data.claims.sub;

  const email =
    typeof data.claims.email ===
    "string"
      ? data.claims.email
      : "";

  if (!usuarioId) {
    redirect(
      "/auth/login"
    );
  }

  /* ===================================================
     VÍNCULO COM EMPRESA
  =================================================== */

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
      `Erro ao localizar vínculo do usuário: ${erroMembro.message}`
    );
  }

  if (
    !membro
  ) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center">
        <div className="w-full max-w-lg rounded-xl border p-8">
          <h1 className="text-2xl font-semibold">
            Note Litis
          </h1>

          <p className="mt-4 text-muted-foreground">
            Seu usuário está
            autenticado, mas ainda
            não está vinculado a uma
            empresa.
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            {email}
          </p>
        </div>
      </main>
    );
  }

  /* ===================================================
     EMPRESA
  =================================================== */

  const {
    data:
      empresa,

    error:
      erroEmpresa,
  } =
    await supabase
      .from(
        "empresas"
      )
      .select(
        "id, nome, status_acesso"
      )
      .eq(
        "id",
        membro.empresa_id
      )
      .single();

  if (
    erroEmpresa ||
    !empresa
  ) {
    throw new Error(
      `Erro ao localizar empresa: ${
        erroEmpresa?.message ??
        "Empresa não encontrada"
      }`
    );
  }

  if (
    empresa.status_acesso !==
    "ativo"
  ) {
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
            <strong>
              {empresa.nome}
            </strong>{" "}
            não está ativa no
            momento.
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            Status da conta:{" "}
            {
              empresa
                .status_acesso
            }
          </p>
        </div>
      </main>
    );
  }

  const nomePapel =
    nomesPapeis[
      membro.papel as keyof typeof nomesPapeis
    ] ??
    membro.papel;

  /* ===================================================
     JANELA OPERACIONAL
  =================================================== */

  const hoje =
    hojeEmRecife();

  const amanha =
    somarDiasISO(
      hoje,
      1
    );

  const limite15Dias =
    somarDiasISO(
      hoje,
      15
    );

  /* ===================================================
     DILIGÊNCIAS
  =================================================== */

  const {
    data:
      diligenciasConsultadas,

    error:
      erroDiligencias,
  } =
    await supabase
      .from(
        "diligencias"
      )
      .select(`
        id,
        tipo_diligencia,
        modalidade,
        numero_processo,
        parte_autora,
        parte_re,
        data_diligencia,
        horario,
        vara,
        comarca,
        uf,
        correspondente_id,
        necessita_preposto,
        preposto_id,
        testemunhas_status,
        contratacao_status,
        orientacoes_encaminhadas,
        status,
        excluida_em
      `)
      .eq(
        "empresa_id",
        empresa.id
      )
      .gte(
        "data_diligencia",
        hoje
      )
      .lte(
        "data_diligencia",
        limite15Dias
      )
      .is(
        "excluida_em",
        null
      )
      .order(
        "data_diligencia",
        {
          ascending:
            true,
        }
      )
      .order(
        "horario",
        {
          ascending:
            true,
        }
      );

  if (
    erroDiligencias
  ) {
    throw new Error(
      `Erro ao carregar o dashboard: ${erroDiligencias.message}`
    );
  }

  const diligencias =
    (
      diligenciasConsultadas ??
      []
    ).filter(
      (
        diligencia
      ) =>
        diligencia.status !==
        "cancelada"
    ) as DiligenciaDashboard[];

  /* ===================================================
     INDICADORES
  =================================================== */

  const diligenciasHoje =
    diligencias.filter(
      (
        diligencia
      ) =>
        diligencia
          .data_diligencia ===
        hoje
    ).length;

  const proximasDiligencias =
    diligencias.filter(
      (
        diligencia
      ) =>
        diligencia
          .data_diligencia >
          hoje &&
        diligencia
          .data_diligencia <=
          limite15Dias
    ).length;

  const diligenciasComPendencia =
    diligencias.filter(
      (
        diligencia
      ) =>
        motivosPendencia(
          diligencia
        ).length > 0
    );

  const diligenciasPendentes =
    diligenciasComPendencia.length;

  const conflitosAgenda =
    contarConflitos(
      diligencias
    );

  /* ===================================================
     RESUMO OPERACIONAL
  =================================================== */

  const semCorrespondente =
    diligencias.filter(
      (
        diligencia
      ) =>
        !diligencia
          .correspondente_id
    ).length;

  const semOrientacoes =
    diligencias.filter(
      (
        diligencia
      ) =>
        diligencia
          .orientacoes_encaminhadas !==
        true
    ).length;

  const prepostosPendentes =
    diligencias.filter(
      (
        diligencia
      ) =>
        diligencia
          .necessita_preposto ===
          true &&
        !diligencia
          .preposto_id
    ).length;

  const definicoesCriticas =
    diligencias.filter(
      (
        diligencia
      ) =>
        diligencia
          .data_diligencia <=
          amanha &&
        (
          diligencia
            .necessita_preposto ===
            null ||
          diligencia
            .testemunhas_status ===
            null ||
          diligencia
            .contratacao_status ===
            null
        )
    ).length;

  /* ===================================================
     PROFISSIONAIS
  =================================================== */

  const idsProfissionais =
    Array.from(
      new Set(
        diligencias.flatMap(
          (
            diligencia
          ) =>
            [
              diligencia
                .correspondente_id,

              diligencia
                .preposto_id,
            ].filter(
              (
                id
              ): id is string =>
                Boolean(id)
            )
        )
      )
    );

  let profissionais:
    ProfissionalDashboard[] =
    [];

  if (
    idsProfissionais.length >
    0
  ) {
    const {
      data:
        profissionaisConsultados,

      error:
        erroProfissionais,
    } =
      await supabase
        .from(
          "correspondentes"
        )
        .select(
          "id, nome, tipo"
        )
        .eq(
          "empresa_id",
          empresa.id
        )
        .in(
          "id",
          idsProfissionais
        );

    if (
      erroProfissionais
    ) {
      throw new Error(
        `Erro ao carregar profissionais do dashboard: ${erroProfissionais.message}`
      );
    }

    profissionais =
      (
        profissionaisConsultados ??
        []
      ) as ProfissionalDashboard[];
  }

  const nomePorId =
    new Map(
      profissionais.map(
        (
          profissional
        ) => [
          profissional.id,
          profissional.nome,
        ]
      )
    );

  /* ===================================================
     PRÓXIMAS DILIGÊNCIAS
  =================================================== */

  const proximasParaExibir =
    diligencias
      .filter(
        (
          diligencia
        ) =>
          diligencia
            .data_diligencia >=
          hoje
      )
      .slice(
        0,
        6
      );

  /* ===================================================
     RENDERIZAÇÃO
  =================================================== */

  return (
    <main className="w-full">
      {/* =================================================
          CABEÇALHO
      ================================================== */}

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
              Acompanhe sua operação
              de diligências.
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

      {/* =================================================
          INDICADORES PRINCIPAIS
      ================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* DILIGÊNCIAS HOJE */}

        <Link
          href="/protected/diligencias?filtro=hoje"
          className="group block cursor-pointer rounded-xl border bg-card p-5 transition-all hover:border-slate-400 hover:bg-muted/40 hover:shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Diligências hoje
              </p>

              <p className="mt-3 text-3xl font-semibold group-hover:underline">
                {
                  diligenciasHoje
                }
              </p>
            </div>

            <div className="rounded-lg bg-muted p-2.5">
              <CalendarDays className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Programadas para hoje
          </p>
        </Link>

        {/* PRÓXIMAS */}

        <Link
          href="/protected/diligencias?filtro=proximos_15_dias"
          className="group block cursor-pointer rounded-xl border bg-card p-5 transition-all hover:border-slate-400 hover:bg-muted/40 hover:shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Próximas diligências
              </p>

              <p className="mt-3 text-3xl font-semibold group-hover:underline">
                {
                  proximasDiligencias
                }
              </p>
            </div>

            <div className="rounded-lg bg-muted p-2.5">
              <Clock3 className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Próximos 15 dias, sem
            contar hoje
          </p>
        </Link>

        {/* FILA OPERACIONAL */}

        <Link
          href="/protected/diligencias?filtro=fila_operacional"
          className="group block cursor-pointer rounded-xl border bg-card p-5 transition-all hover:border-slate-400 hover:bg-muted/40 hover:shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Na fila operacional
              </p>

              <p className="mt-3 text-3xl font-semibold group-hover:underline">
                {
                  diligenciasPendentes
                }
              </p>
            </div>

            <div className="rounded-lg bg-muted p-2.5">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Diligências que exigem
            tratamento
          </p>
        </Link>

        {/* CONFLITOS */}

        <Link
          href="/protected/diligencias?filtro=conflito_agenda"
          className="group block cursor-pointer rounded-xl border bg-card p-5 transition-all hover:border-slate-400 hover:bg-muted/40 hover:shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Possíveis conflitos
              </p>

              <p className="mt-3 text-3xl font-semibold group-hover:underline">
                {
                  conflitosAgenda
                }
              </p>
            </div>

            <div className="rounded-lg bg-muted p-2.5">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Diligências envolvidas
            em possível choque de
            agenda
          </p>
        </Link>
      </section>

      {/* =================================================
          ÁREA OPERACIONAL
      ================================================== */}

      <section className="mt-8 grid gap-6 xl:grid-cols-3">
        {/* =================================================
            COMO ESTÁ MINHA PAUTA
        ================================================== */}

        <div className="rounded-xl border bg-card p-6 xl:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                Como está minha
                pauta?
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Visão rápida do que
                precisa da sua
                atenção.
              </p>
            </div>

            <Link
              href="/protected/pendencias"
              className="text-sm font-medium hover:underline"
            >
              Ver pendências
            </Link>
          </div>

          {diligenciasPendentes ===
          0 ? (
            <div className="mt-8 flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed px-6 text-center">
              <CircleCheck className="h-8 w-8 text-muted-foreground" />

              <p className="mt-4 font-medium">
                Nenhuma pendência na
                janela operacional
              </p>

              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                As diligências de
                hoje e dos próximos
                15 dias estão sem
                pendências
                detectáveis pelos
                campos atuais.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {/* SEM CORRESPONDENTE */}

              <Link
                href="/protected/diligencias?filtro=sem_correspondente"
                className="group cursor-pointer rounded-lg border p-4 transition-all hover:border-slate-400 hover:bg-muted/50"
              >
                <p className="text-sm text-muted-foreground">
                  Sem correspondente
                </p>

                <p className="mt-2 text-2xl font-semibold group-hover:underline">
                  {
                    semCorrespondente
                  }
                </p>
              </Link>

              {/* SEM ORIENTAÇÕES */}

              <Link
                href="/protected/diligencias?filtro=sem_orientacoes"
                className="group cursor-pointer rounded-lg border p-4 transition-all hover:border-slate-400 hover:bg-muted/50"
              >
                <p className="text-sm text-muted-foreground">
                  Sem orientações
                </p>

                <p className="mt-2 text-2xl font-semibold group-hover:underline">
                  {
                    semOrientacoes
                  }
                </p>
              </Link>

              {/* PREPOSTO */}

              <Link
                href="/protected/diligencias?filtro=preposto_pendente"
                className="group cursor-pointer rounded-lg border p-4 transition-all hover:border-slate-400 hover:bg-muted/50"
              >
                <p className="text-sm text-muted-foreground">
                  Preposto necessário
                  sem designação
                </p>

                <p className="mt-2 text-2xl font-semibold group-hover:underline">
                  {
                    prepostosPendentes
                  }
                </p>
              </Link>

              {/* DEFINIÇÕES */}

              <Link
                href="/protected/diligencias?filtro=definicoes_pendentes"
                className="group cursor-pointer rounded-lg border p-4 transition-all hover:border-slate-400 hover:bg-muted/50"
              >
                <p className="text-sm text-muted-foreground">
                  Definições pendentes
                  até amanhã
                </p>

                <p className="mt-2 text-2xl font-semibold group-hover:underline">
                  {
                    definicoesCriticas
                  }
                </p>
              </Link>
            </div>
          )}
        </div>

        {/* =================================================
            MINHA CONTA
        ================================================== */}

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

      {/* =================================================
          PRÓXIMAS DILIGÊNCIAS
      ================================================== */}

      <section className="mt-8 rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold">
              Próximas diligências
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Compromissos mais
              próximos da sua equipe.
            </p>
          </div>

          <Link
            href="/protected/diligencias"
            className="text-sm font-medium hover:underline"
          >
            Ver todas
          </Link>
        </div>

        {proximasParaExibir.length ===
        0 ? (
          <div className="flex min-h-44 flex-col items-center justify-center px-6 text-center">
            <CalendarDays className="h-8 w-8 text-muted-foreground" />

            <p className="mt-4 font-medium">
              Nenhuma diligência nos
              próximos 15 dias
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Cadastre manualmente
              uma diligência ou
              importe sua pauta.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {proximasParaExibir.map(
              (
                diligencia
              ) => {
                const advogado =
                  diligencia
                    .correspondente_id
                    ? nomePorId.get(
                        diligencia
                          .correspondente_id
                      )
                    : null;

                const preposto =
                  diligencia
                    .preposto_id
                    ? nomePorId.get(
                        diligencia
                          .preposto_id
                      )
                    : null;

                return (
                  <Link
                    key={
                      diligencia.id
                    }
                    href={`/protected/diligencias/${diligencia.id}`}
                    className="grid gap-4 px-6 py-4 transition-colors hover:bg-muted/40 md:grid-cols-[130px_1fr_220px] md:items-center"
                  >
                    <div>
                      <p className="font-medium">
                        {formatarData(
                          diligencia
                            .data_diligencia
                        )}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        {diligencia
                          .horario
                          .slice(
                            0,
                            5
                          )}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="font-medium">
                        {
                          diligencia
                            .tipo_diligencia
                        }
                      </p>

                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {formatarProcesso(
                          diligencia
                            .numero_processo
                        )}
                      </p>

                      <p className="mt-1 truncate text-sm">
                        {diligencia
                          .parte_autora ??
                          "Parte autora não informada"}{" "}
                        x{" "}
                        {diligencia
                          .parte_re ??
                          "Parte ré não informada"}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {[
                          diligencia
                            .vara,

                          diligencia
                            .comarca,

                          diligencia
                            .uf,
                        ]
                          .filter(
                            Boolean
                          )
                          .join(
                            " • "
                          )}
                      </p>
                    </div>

                    <div className="text-sm">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Responsáveis
                      </p>

                      <p className="mt-1">
                        {advogado
                          ? `Advogado: ${advogado}`
                          : "Advogado não designado"}
                      </p>

                      {diligencia
                        .necessita_preposto ===
                        true && (
                        <p className="mt-1">
                          {preposto
                            ? `Preposto: ${preposto}`
                            : "Preposto não designado"}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              }
            )}
          </div>
        )}
      </section>
    </main>
  );
}