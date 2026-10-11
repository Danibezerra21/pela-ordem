import Link from "next/link";

import {
  redirect,
} from "next/navigation";

import {
  CalendarDays,
  Clock3,
  FileText,
  Plus,
  Search,
} from "lucide-react";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  temPermissao,
} from "@/lib/permissoes";


/* =====================================================
   TIPOS
===================================================== */

type DiligenciaLista = {
  id: string;

  tipo_diligencia:
    string;
    

  numero_processo:
    string | null;

  parte_autora:
    string | null;

  parte_re:
    string | null;

  data_diligencia:
    string;

  horario:
    string;

  vara:
    string | null;

  comarca:
    string | null;

  uf:
    string | null;

  status:
    string | null;

  correspondente_id:
    string | null;

  necessita_preposto:
    boolean | null;

  preposto_id:
    string | null;

  testemunhas_status:
    | "confirmadas"
    | "desnecessarias"
    | null;

  contratacao_status:
    | "confirmada"
    | "desnecessaria"
    | null;

  orientacoes_encaminhadas:
    boolean | null;
};


type FiltroOperacional =
  | "hoje"
  | "proximos_15_dias"
  | "fila_operacional"
  | "sem_correspondente"
  | "sem_orientacoes"
  | "preposto_pendente"
  | "definicoes_pendentes"
  | "conflito_agenda";


type SearchParamsDiligencias = {
  filtro?:
    | string
    | string[];
};


/* =====================================================
   NOMES DOS FILTROS
===================================================== */

const nomesFiltros:
  Record<
    FiltroOperacional,
    string
  > = {
  hoje:
    "Diligências hoje",

  proximos_15_dias:
    "Próximas diligências",

  fila_operacional:
    "Na fila operacional",

  sem_correspondente:
    "Sem correspondente",

  sem_orientacoes:
    "Sem orientações",

  preposto_pendente:
    "Preposto necessário sem designação",

  definicoes_pendentes:
    "Definições pendentes até amanhã",

  conflito_agenda:
    "Possíveis conflitos",
};


/* =====================================================
   VALIDAÇÃO DO FILTRO
===================================================== */

function ehFiltroOperacional(
  valor:
    | string
    | null
    | undefined
): valor is FiltroOperacional {
  return (
    valor ===
      "hoje" ||

    valor ===
      "proximos_15_dias" ||

    valor ===
      "fila_operacional" ||

    valor ===
      "sem_correspondente" ||

    valor ===
      "sem_orientacoes" ||

    valor ===
      "preposto_pendente" ||

    valor ===
      "definicoes_pendentes" ||

    valor ===
      "conflito_agenda"
  );
}


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
  dataISO:
    string,

  dias:
    number
) {
  const [
    ano,
    mes,
    dia,
  ] =
    dataISO
      .split("-")
      .map(
        Number
      );

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
  horario:
    string
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
      .map(
        Number
      );

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
   FORMATAÇÃO DO PROCESSO
===================================================== */

function formatarProcesso(
  processo:
    string | null
) {
  if (
    !processo
  ) {
    return "PROCESSO NÃO INFORMADO";
  }

  const numeros =
    processo.replace(
      /\D/g,
      ""
    );

  if (
    numeros.length !==
    20
  ) {
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


/* =====================================================
   PENDÊNCIAS
===================================================== */

function temPendencia(
  diligencia:
    DiligenciaLista
) {
  return (
    !diligencia
      .correspondente_id ||

    diligencia
      .orientacoes_encaminhadas !==
      true ||

    diligencia
      .necessita_preposto ===
      null ||

    (
      diligencia
        .necessita_preposto ===
        true &&
      !diligencia
        .preposto_id
    ) ||

    diligencia
      .testemunhas_status ===
      null ||

    diligencia
      .contratacao_status ===
      null
  );
}


/* =====================================================
   DILIGÊNCIAS COM CONFLITO

   Mesmo participante
   + mesmo dia
   + intervalo inferior a 5 horas.
===================================================== */

function idsDiligenciasComConflito(
  diligencias:
    DiligenciaLista[]
) {
  const agendaPorParticipante =
    new Map<
      string,
      DiligenciaLista[]
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
          Boolean(
            id
          )
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

  const ids =
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

        ids.add(
          ordenada[i].id
        );

        ids.add(
          ordenada[j].id
        );
      }
    }
  }

  return ids;
}


/* =====================================================
   APLICAÇÃO DO FILTRO
===================================================== */

function aplicarFiltro(
  diligencias:
    DiligenciaLista[],

  filtro:
    FiltroOperacional
) {
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

  const janelaOperacional =
    diligencias.filter(
      (
        diligencia
      ) =>
        diligencia
          .status !==
          "cancelada" &&

        diligencia
          .data_diligencia >=
          hoje &&

        diligencia
          .data_diligencia <=
          limite15Dias
    );


  /* HOJE */

  if (
    filtro ===
    "hoje"
  ) {
    return janelaOperacional.filter(
      (
        diligencia
      ) =>
        diligencia
          .data_diligencia ===
        hoje
    );
  }


  /* PRÓXIMOS 15 DIAS */

  if (
    filtro ===
    "proximos_15_dias"
  ) {
    return janelaOperacional.filter(
      (
        diligencia
      ) =>
        diligencia
          .data_diligencia >
        hoje
    );
  }


  /* FILA OPERACIONAL */

  if (
    filtro ===
    "fila_operacional"
  ) {
    return janelaOperacional.filter(
      (
        diligencia
      ) =>
        temPendencia(
          diligencia
        )
    );
  }


  /* SEM CORRESPONDENTE */

  if (
    filtro ===
    "sem_correspondente"
  ) {
    return janelaOperacional.filter(
      (
        diligencia
      ) =>
        !diligencia
          .correspondente_id
    );
  }


  /* SEM ORIENTAÇÕES */

  if (
    filtro ===
    "sem_orientacoes"
  ) {
    return janelaOperacional.filter(
      (
        diligencia
      ) =>
        diligencia
          .orientacoes_encaminhadas !==
        true
    );
  }


  /* PREPOSTO PENDENTE */

  if (
    filtro ===
    "preposto_pendente"
  ) {
    return janelaOperacional.filter(
      (
        diligencia
      ) =>
        diligencia
          .necessita_preposto ===
          true &&
        !diligencia
          .preposto_id
    );
  }


  /* DEFINIÇÕES PENDENTES */

  if (
    filtro ===
    "definicoes_pendentes"
  ) {
    return janelaOperacional.filter(
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
    );
  }


  /* CONFLITOS */

  const idsConflitos =
    idsDiligenciasComConflito(
      janelaOperacional
    );

  return janelaOperacional.filter(
    (
      diligencia
    ) =>
      idsConflitos.has(
        diligencia.id
      )
  );
}


/* =====================================================
   PÁGINA
===================================================== */

export default async function DiligenciasPage({
  searchParams,
}: {
  searchParams:
    Promise<SearchParamsDiligencias>;
}) {

  /* ===================================================
     FILTRO DA URL
  =================================================== */

  const parametros =
    await searchParams;

  const filtroRecebido =
    Array.isArray(
      parametros.filtro
    )
      ? parametros
          .filtro[0]
      : parametros
          .filtro;

  const filtroAtivo =
    ehFiltroOperacional(
      filtroRecebido
    )
      ? filtroRecebido
      : null;


  /* ===================================================
     SUPABASE
  =================================================== */

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


  /* ===================================================
     PERMISSÕES DE INTERFACE

     Master e Operacional:
     podem criar.

     Financeiro:
     apenas consulta.
  =================================================== */

  const podeCriar =
    await temPermissao(
      "diligencias.criar"
    );


  /* ===================================================
     EMPRESA
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
        "empresa_id"
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
      `Erro ao localizar empresa: ${erroMembro.message}`
    );
  }

  if (
    !membro
  ) {
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


  /* ===================================================
     CONSULTA
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
        numero_processo,
        parte_autora,
        parte_re,
        data_diligencia,
        horario,
        vara,
        comarca,
        uf,
        status,
        correspondente_id,
        necessita_preposto,
        preposto_id,
        testemunhas_status,
        contratacao_status,
        orientacoes_encaminhadas
      `)
      .eq(
        "empresa_id",
        membro.empresa_id
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
      `Erro ao carregar diligências: ${erroDiligencias.message}`
    );
  }

  const todasDiligencias =
    (
      diligenciasConsultadas ??
      []
    ) as DiligenciaLista[];


  /* ===================================================
     DILIGÊNCIAS EXIBIDAS
  =================================================== */

  const diligenciasExibidas =
    filtroAtivo
      ? aplicarFiltro(
          todasDiligencias,
          filtroAtivo
        )
      : todasDiligencias;

  const quantidade =
    diligenciasExibidas
      .length;

  const nomeFiltro =
    filtroAtivo
      ? nomesFiltros[
          filtroAtivo
        ]
      : null;


  /* ===================================================
     RENDER
  =================================================== */

  return (
    <main className="w-full">

      {/* ===============================================
          CABEÇALHO
      ================================================ */}

      <section className="mb-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Gestão de diligências
            </p>

            <h1 className="mt-1 text-4xl font-bold tracking-tight">
              Diligências
            </h1>

            <p className="mt-2 text-muted-foreground">
              Consulte as diligências da sua empresa
              {podeCriar
                ? " e realize o gerenciamento operacional."
                : "."}
            </p>
          </div>


          {/* SOMENTE MASTER / OPERACIONAL */}

          {podeCriar && (
            <Link
              href="/protected/diligencias/nova"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0b1f3a] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" />

              Nova diligência
            </Link>
          )}

        </div>
      </section>


      {/* ===============================================
          PESQUISA
      ================================================ */}

      <section className="mb-6 rounded-xl border bg-card p-4">
        <div className="flex items-center gap-3 rounded-lg border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />

          <span className="text-sm text-muted-foreground">
            Em breve: pesquisar por processo, partes, comarca ou vara
          </span>
        </div>
      </section>


      {/* ===============================================
          FILTRO ATIVO
      ================================================ */}

      {filtroAtivo &&
        nomeFiltro && (
          <section className="mb-6 rounded-xl border bg-card px-5 py-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Filtro ativo
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <p className="font-semibold">
                    {nomeFiltro}
                  </p>

                  <span className="text-sm text-muted-foreground">
                    •
                  </span>

                  <p className="text-sm text-muted-foreground">
                    {quantidade}{" "}
                    {quantidade ===
                    1
                      ? "diligência"
                      : "diligências"}
                  </p>
                </div>
              </div>

              <Link
                href="/protected/diligencias"
                className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                Limpar filtro
              </Link>

            </div>
          </section>
        )}


      {/* ===============================================
          LISTA
      ================================================ */}

      <section className="rounded-xl border bg-card">

        <div className="flex items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold">
              {filtroAtivo
                ? nomeFiltro
                : "Pauta cadastrada"}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {quantidade}{" "}
              {quantidade ===
              1
                ? "diligência"
                : "diligências"}
            </p>
          </div>
        </div>


        {/* =============================================
            NENHUM RESULTADO DO FILTRO
        ============================================== */}

        {filtroAtivo &&
        quantidade ===
          0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">

            <div className="rounded-full bg-muted p-4">
              <FileText className="h-7 w-7 text-muted-foreground" />
            </div>

            <h3 className="mt-5 text-lg font-semibold">
              Nenhuma diligência encontrada
            </h3>

            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Não existem diligências que atendam ao filtro{" "}
              <strong>
                {nomeFiltro}
              </strong>{" "}
              neste momento.
            </p>

            <Link
              href="/protected/diligencias"
              className="mt-6 inline-flex items-center rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              Limpar filtro
            </Link>

          </div>
        ) :


        /* =============================================
           NENHUMA DILIGÊNCIA CADASTRADA
        ============================================== */

        !filtroAtivo &&
        quantidade ===
          0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">

            <div className="rounded-full bg-muted p-4">
              <FileText className="h-7 w-7 text-muted-foreground" />
            </div>

            <h3 className="mt-5 text-lg font-semibold">
              Nenhuma diligência cadastrada
            </h3>


            {podeCriar ? (
              <>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Cadastre sua primeira diligência manualmente ou importe uma pauta em Excel.
                </p>

                <Link
                  href="/protected/diligencias/nova"
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#0b1f3a] px-4 py-2.5 text-sm font-medium text-white"
                >
                  <Plus className="h-4 w-4" />

                  Cadastrar primeira diligência
                </Link>
              </>
            ) : (
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Ainda não há diligências cadastradas para consulta.
              </p>
            )}

          </div>
        ) : (


          /* ===========================================
             RESULTADOS
          ============================================ */

          <div className="divide-y">
            {diligenciasExibidas.map(
              (
                diligencia
              ) => {
                const data =
                  new Date(
                    `${diligencia.data_diligencia}T12:00:00`
                  );

                const dataFormatada =
                  new Intl.DateTimeFormat(
                    "pt-BR"
                  ).format(
                    data
                  );

                const horarioFormatado =
                  diligencia
                    .horario
                    ?.slice(
                      0,
                      5
                    ) ||
                  "Não informado";

                return (
                  <Link
                    key={
                      diligencia.id
                    }
                    href={`/protected/diligencias/${diligencia.id}`}
                    className="block px-6 py-5 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                          <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium">
                            {
                              diligencia
                                .tipo_diligencia
                            }
                          </span>

                          {diligencia
                            .numero_processo && (
                            <span className="text-sm text-muted-foreground">
                              {formatarProcesso(
                                diligencia
                                  .numero_processo
                              )}
                            </span>
                          )}

                        </div>


                        <p className="mt-3 font-medium">
                          {diligencia
                            .parte_autora ||
                            "Parte autora não informada"}

                          {" x "}

                          {diligencia
                            .parte_re ||
                            "Parte ré não informada"}
                        </p>


                        <p className="mt-2 text-sm text-muted-foreground">
                          {diligencia
                            .vara ||
                            "Vara não informada"}

                          {diligencia
                            .comarca
                            ? ` • ${diligencia.comarca}`
                            : ""}

                          {diligencia
                            .uf
                            ? `/${diligencia.uf}`
                            : ""}
                        </p>

                      </div>


                      <div className="flex shrink-0 flex-wrap items-center gap-5 text-sm">

                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />

                          {
                            dataFormatada
                          }
                        </div>


                        <div className="flex items-center gap-2">
                          <Clock3 className="h-4 w-4 text-muted-foreground" />

                          {
                            horarioFormatado
                          }
                        </div>

                      </div>

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